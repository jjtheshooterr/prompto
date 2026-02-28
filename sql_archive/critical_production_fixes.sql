-- CRITICAL PRODUCTION FIXES
-- Date: 2026-01-29
-- Based on comprehensive schema review
-- Priority: MUST FIX BEFORE LAUNCH

-- ============================================================================
-- 1. FIX: Username must be case-insensitively unique
-- ============================================================================
-- Current: idx_profiles_username_lower exists but is NOT unique
-- Fix: Make it unique to prevent duplicate usernames

-- Drop the non-unique index
DROP INDEX IF EXISTS idx_profiles_username_lower;

-- Create unique case-insensitive index
CREATE UNIQUE INDEX profiles_username_ci_unique 
ON profiles (LOWER(username)) 
WHERE username IS NOT NULL;

-- ============================================================================
-- 2. ADD: Root prompt tracking for fork lineage
-- ============================================================================
-- Current: Only parent_prompt_id exists
-- Fix: Add root_prompt_id for efficient lineage queries

-- Add root_prompt_id column
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS root_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL;

-- Create index for "show all forks of original" queries
CREATE INDEX IF NOT EXISTS idx_prompts_root_prompt 
ON prompts(root_prompt_id) 
WHERE root_prompt_id IS NOT NULL;

-- Backfill root_prompt_id for existing prompts
-- For originals (no parent): root = self
UPDATE prompts 
SET root_prompt_id = id 
WHERE parent_prompt_id IS NULL AND root_prompt_id IS NULL;

-- For forks: find the root by traversing parent chain
-- This is a one-time backfill, future inserts will set it correctly
WITH RECURSIVE lineage AS (
  -- Start with prompts that have parents
  SELECT id, parent_prompt_id, parent_prompt_id as root_id, 1 as depth
  FROM prompts
  WHERE parent_prompt_id IS NOT NULL
  
  UNION ALL
  
  -- Traverse up the chain
  SELECT l.id, p.parent_prompt_id, 
         COALESCE(p.parent_prompt_id, l.root_id) as root_id,
         l.depth + 1
  FROM lineage l
  JOIN prompts p ON p.id = l.root_id
  WHERE p.parent_prompt_id IS NOT NULL AND l.depth < 10 -- prevent infinite loops
)
UPDATE prompts p
SET root_prompt_id = (
  SELECT COALESCE(l.root_id, p.parent_prompt_id)
  FROM lineage l
  WHERE l.id = p.id
  ORDER BY l.depth DESC
  LIMIT 1
)
WHERE p.parent_prompt_id IS NOT NULL AND p.root_prompt_id IS NULL;

-- ============================================================================
-- 3. ADD: Foreign key ON DELETE behaviors
-- ============================================================================
-- Current: Many FKs have no ON DELETE behavior
-- Fix: Define explicit cascade/set null rules

-- Problems: pinned_prompt_id should SET NULL if prompt deleted
ALTER TABLE problems 
DROP CONSTRAINT IF EXISTS problems_pinned_prompt_id_fkey;

ALTER TABLE problems 
ADD CONSTRAINT problems_pinned_prompt_id_fkey 
FOREIGN KEY (pinned_prompt_id) REFERENCES prompts(id) ON DELETE SET NULL;

-- Prompts: deleted_by should SET NULL if user deleted
ALTER TABLE prompts 
DROP CONSTRAINT IF EXISTS prompts_deleted_by_fkey;

ALTER TABLE prompts 
ADD CONSTRAINT prompts_deleted_by_fkey 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Problems: deleted_by should SET NULL if user deleted
ALTER TABLE problems 
DROP CONSTRAINT IF EXISTS problems_deleted_by_fkey;

ALTER TABLE problems 
ADD CONSTRAINT problems_deleted_by_fkey 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Prompt stats: CASCADE delete when prompt deleted
ALTER TABLE prompt_stats 
DROP CONSTRAINT IF EXISTS prompt_stats_prompt_id_fkey;

ALTER TABLE prompt_stats 
ADD CONSTRAINT prompt_stats_prompt_id_fkey 
FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE;

-- Problem stats: CASCADE delete when problem deleted
ALTER TABLE problem_stats 
DROP CONSTRAINT IF EXISTS problem_stats_problem_id_fkey;

ALTER TABLE problem_stats 
ADD CONSTRAINT problem_stats_problem_id_fkey 
FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE;

-- ============================================================================
-- 4. ADD: Missing indexes for feed queries
-- ============================================================================

-- Prompts: created_by + created_at for user profile pages
CREATE INDEX IF NOT EXISTS idx_prompts_created_by_date 
ON prompts(created_by, created_at DESC) 
WHERE is_deleted = false;

-- Prompts: parent_prompt_id for fork listings
CREATE INDEX IF NOT EXISTS idx_prompts_parent_prompt 
ON prompts(parent_prompt_id, created_at DESC) 
WHERE parent_prompt_id IS NOT NULL;

-- Prompts: public feed query
CREATE INDEX IF NOT EXISTS idx_prompts_public_feed 
ON prompts(visibility, is_listed, is_deleted, is_hidden, created_at DESC) 
WHERE visibility = 'public' AND is_listed = true AND is_deleted = false AND is_hidden = false;

-- Votes: user_id for "my votes" queries
CREATE INDEX IF NOT EXISTS idx_votes_user_id 
ON votes(user_id, created_at DESC);

-- Reports: status + created_at for moderation queue
CREATE INDEX IF NOT EXISTS idx_reports_status_date 
ON reports(status, created_at DESC);

-- Reports: content lookup
CREATE INDEX IF NOT EXISTS idx_reports_content 
ON reports(content_type, content_id, status);

-- Problem members: user_id for "my problems" queries
CREATE INDEX IF NOT EXISTS idx_problem_members_user_id 
ON problem_members(user_id, created_at DESC);

-- ============================================================================
-- 5. CREATE: Fork creation function (prevents lineage spoofing)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_fork(
  p_parent_prompt_id UUID,
  p_title TEXT,
  p_system_prompt TEXT,
  p_user_prompt_template TEXT,
  p_model TEXT,
  p_notes TEXT,
  p_improvement_summary TEXT,
  p_best_for TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_prompt_id UUID;
  v_parent_problem_id UUID;
  v_parent_workspace_id UUID;
  v_parent_visibility visibility;
  v_root_prompt_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to fork';
  END IF;
  
  -- Validate parent exists and is forkable
  SELECT problem_id, workspace_id, visibility, COALESCE(root_prompt_id, id)
  INTO v_parent_problem_id, v_parent_workspace_id, v_parent_visibility, v_root_prompt_id
  FROM prompts
  WHERE id = p_parent_prompt_id
    AND is_deleted = false
    AND is_hidden = false;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent prompt not found or not forkable';
  END IF;
  
  -- Check user can view parent (respects RLS)
  IF v_parent_visibility = 'private' THEN
    IF NOT EXISTS (
      SELECT 1 FROM problem_members
      WHERE problem_id = v_parent_problem_id
        AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Cannot fork private prompt without access';
    END IF;
  END IF;
  
  -- Create the fork
  INSERT INTO prompts (
    problem_id,
    workspace_id,
    visibility,
    title,
    system_prompt,
    user_prompt_template,
    model,
    notes,
    improvement_summary,
    best_for,
    parent_prompt_id,
    root_prompt_id,
    created_by,
    is_listed
  ) VALUES (
    v_parent_problem_id,
    v_parent_workspace_id,
    v_parent_visibility, -- Inherit parent visibility
    p_title,
    p_system_prompt,
    p_user_prompt_template,
    p_model,
    p_notes,
    p_improvement_summary,
    p_best_for,
    p_parent_prompt_id,
    v_root_prompt_id, -- Set root for lineage tracking
    v_user_id,
    true
  )
  RETURNING id INTO v_new_prompt_id;
  
  -- Record fork event
  INSERT INTO prompt_events (prompt_id, event_type, user_id)
  VALUES (v_new_prompt_id, 'fork', v_user_id);
  
  -- Increment parent's fork count (trigger will handle this)
  -- But we can also do it directly for reliability
  UPDATE prompt_stats
  SET fork_count = fork_count + 1
  WHERE prompt_id = p_parent_prompt_id;
  
  RETURN v_new_prompt_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_fork TO authenticated;

-- ============================================================================
-- 6. ADD: Trigger to set root_prompt_id on new prompts
-- ============================================================================

CREATE OR REPLACE FUNCTION set_root_prompt_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is an original (no parent), root = self
  IF NEW.parent_prompt_id IS NULL THEN
    NEW.root_prompt_id := NEW.id;
  ELSE
    -- If this is a fork, inherit root from parent
    SELECT COALESCE(root_prompt_id, id)
    INTO NEW.root_prompt_id
    FROM prompts
    WHERE id = NEW.parent_prompt_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger (only if not exists)
DROP TRIGGER IF EXISTS trg_set_root_prompt_id ON prompts;
CREATE TRIGGER trg_set_root_prompt_id
  BEFORE INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION set_root_prompt_id();

-- ============================================================================
-- 7. ADD: Helper function to get fork lineage
-- ============================================================================

CREATE OR REPLACE FUNCTION get_fork_lineage(p_prompt_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  depth INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE lineage AS (
    -- Start with the given prompt
    SELECT 
      p.id,
      p.title,
      p.created_by,
      p.created_at,
      0 as depth
    FROM prompts p
    WHERE p.id = p_prompt_id
    
    UNION ALL
    
    -- Get all children (forks)
    SELECT 
      p.id,
      p.title,
      p.created_by,
      p.created_at,
      l.depth + 1
    FROM lineage l
    JOIN prompts p ON p.parent_prompt_id = l.id
    WHERE l.depth < 10 -- Prevent infinite recursion
  )
  SELECT * FROM lineage
  ORDER BY depth, created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION get_fork_lineage TO authenticated, anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify username uniqueness
SELECT 'Username uniqueness:' as check, 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' 
    AND indexname = 'profiles_username_ci_unique'
  ) THEN '✓ UNIQUE' ELSE '✗ NOT UNIQUE' END as status;

-- Verify root_prompt_id column
SELECT 'Root prompt tracking:' as check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'root_prompt_id'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- Verify fork function
SELECT 'Fork function:' as check,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_fork'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- Count prompts needing root_prompt_id backfill
SELECT 'Prompts needing backfill:' as check,
  COUNT(*)::text || ' prompts' as status
FROM prompts
WHERE root_prompt_id IS NULL;
