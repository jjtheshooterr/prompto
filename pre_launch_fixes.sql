-- ============================================================================
-- PRE-LAUNCH CRITICAL FIXES
-- Date: January 28, 2026
-- Purpose: Fix all critical issues before launch
-- ============================================================================

-- ============================================================================
-- 1. FIX SECURITY DEFINER VIEW
-- ============================================================================

-- Drop and recreate public_profiles view without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  created_at,
  reputation,
  upvotes_received,
  forks_received
FROM public.profiles;

-- Add RLS policy for the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Ensure everyone can read public profiles
DROP POLICY IF EXISTS "public_profiles_select_all" ON public.profiles;
CREATE POLICY "public_profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

-- ============================================================================
-- 2. ADD REPORT DEDUPLICATION CONSTRAINT
-- ============================================================================

-- Prevent users from submitting multiple reports for the same content
ALTER TABLE public.reports 
ADD CONSTRAINT reports_unique_per_user 
UNIQUE (content_type, content_id, reporter_id);

-- Add index for report queries
CREATE INDEX IF NOT EXISTS idx_reports_content_lookup 
ON public.reports(content_type, content_id, status);

-- ============================================================================
-- 3. CASE-INSENSITIVE USERNAME UNIQUENESS
-- ============================================================================

-- Drop the old case-sensitive unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Create case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles(LOWER(username)) 
WHERE username IS NOT NULL;

-- Update the username availability function to use case-insensitive check
CREATE OR REPLACE FUNCTION public.is_username_available(u text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(u)
  );
END;
$$;

-- ============================================================================
-- 4. RESERVED USERNAME BLOCKING
-- ============================================================================

-- Create function to check reserved usernames
CREATE OR REPLACE FUNCTION public.is_username_reserved(u text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  reserved_words text[] := ARRAY[
    'admin', 'administrator', 'mod', 'moderator',
    'api', 'app', 'support', 'help', 'about',
    'settings', 'profile', 'user', 'users',
    'login', 'logout', 'signin', 'signout', 'signup',
    'auth', 'authentication', 'dashboard', 'workspace',
    'problem', 'problems', 'prompt', 'prompts',
    'create', 'edit', 'delete', 'update',
    'public', 'private', 'system', 'root',
    'test', 'demo', 'example', 'sample',
    'null', 'undefined', 'anonymous', 'guest'
  ];
BEGIN
  RETURN LOWER(u) = ANY(reserved_words);
END;
$$;

-- Add constraint to prevent reserved usernames
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_not_reserved;
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_not_reserved 
CHECK (username IS NULL OR NOT is_username_reserved(username));

-- Update username availability function to check reserved words
CREATE OR REPLACE FUNCTION public.is_username_available(u text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Check if reserved
  IF is_username_reserved(u) THEN
    RETURN false;
  END IF;
  
  -- Check if taken (case-insensitive)
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(u)
  );
END;
$$;

-- ============================================================================
-- 5. OPTIMIZE RLS POLICIES - Replace auth.uid() with (select auth.uid())
-- ============================================================================

-- Profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- Workspaces table
DROP POLICY IF EXISTS "Only owners can update workspaces" ON public.workspaces;
CREATE POLICY "Only owners can update workspaces" ON public.workspaces
  FOR UPDATE
  USING (
    owner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = (select auth.uid())
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "workspaces_delete_owner_admin" ON public.workspaces;
CREATE POLICY "workspaces_delete_owner_admin" ON public.workspaces
  FOR DELETE
  USING (
    owner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = (select auth.uid())
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON public.workspaces;
CREATE POLICY "workspaces_insert_authenticated" ON public.workspaces
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "workspaces_update_owner_admin" ON public.workspaces;
CREATE POLICY "workspaces_update_owner_admin" ON public.workspaces
  FOR UPDATE
  USING (
    owner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = (select auth.uid())
        AND role = 'admin'
    )
  );

-- Workspace members table
DROP POLICY IF EXISTS "Only owners can manage workspace members" ON public.workspace_members;
CREATE POLICY "Only owners can manage workspace members" ON public.workspace_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_members.workspace_id
        AND (owner_id = (select auth.uid()) OR EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = workspaces.id
            AND wm.user_id = (select auth.uid())
            AND wm.role = 'admin'
        ))
    )
  );

DROP POLICY IF EXISTS "Users can view workspace members if they are members" ON public.workspace_members;
CREATE POLICY "Users can view workspace members if they are members" ON public.workspace_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = (select auth.uid())
    )
  );

-- Prompts table
DROP POLICY IF EXISTS "prompts_insert" ON public.prompts;
CREATE POLICY "prompts_insert" ON public.prompts
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (
      -- Public/unlisted problems allow anyone to create prompts
      EXISTS (
        SELECT 1 FROM public.problems
        WHERE id = prompts.problem_id
          AND visibility IN ('public', 'unlisted')
          AND is_deleted = false
      )
      -- Private problems require membership
      OR EXISTS (
        SELECT 1 FROM public.problem_members
        WHERE problem_id = prompts.problem_id
          AND user_id = (select auth.uid())
      )
    )
  );

-- ============================================================================
-- 6. REMOVE DUPLICATE POLICIES
-- ============================================================================

-- Profiles - keep only one SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
-- Keep "Public profiles are viewable by everyone"

-- Workspaces - consolidate SELECT policies
DROP POLICY IF EXISTS "workspaces_select_members" ON public.workspaces;
-- Keep "Users can view workspaces they are members of"

-- ============================================================================
-- 7. DROP DUPLICATE INDEXES
-- ============================================================================

-- Problem members - keep the constraint, drop the extra index
DROP INDEX IF EXISTS public.problem_members_user_problem_unique;
-- Keep problem_members_problem_id_user_id_key (constraint)

-- Prompt reviews - keep the constraint, drop the extra index
DROP INDEX IF EXISTS public.prompt_reviews_user_prompt_unique;
-- Keep prompt_reviews_prompt_id_user_id_key (constraint)

-- Prompts - keep the newer index, drop the old one
DROP INDEX IF EXISTS public.idx_prompts_by_creator;
-- Keep idx_prompts_created_by_date

-- Prompts slug - keep the constraint, drop the extra index
DROP INDEX IF EXISTS public.prompts_problem_slug_unique;
-- Keep prompts_problem_id_slug_key (constraint)

-- ============================================================================
-- 8. ADD MISSING FOREIGN KEY INDEXES (Performance)
-- ============================================================================

-- Problems table
CREATE INDEX IF NOT EXISTS idx_problems_deleted_by 
ON public.problems(deleted_by) 
WHERE deleted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_problems_pinned_prompt 
ON public.problems(pinned_prompt_id) 
WHERE pinned_prompt_id IS NOT NULL;

-- Prompts table
CREATE INDEX IF NOT EXISTS idx_prompts_deleted_by 
ON public.prompts(deleted_by) 
WHERE deleted_by IS NOT NULL;

-- Reports table
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by 
ON public.reports(reviewed_by) 
WHERE reviewed_by IS NOT NULL;

-- ============================================================================
-- 9. ADD SOFT DELETE FILTERING FUNCTIONS
-- ============================================================================

-- Helper function to check if content is visible (not deleted/hidden)
CREATE OR REPLACE FUNCTION public.is_content_visible(
  p_is_deleted boolean,
  p_is_hidden boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NOT COALESCE(p_is_deleted, false) 
     AND NOT COALESCE(p_is_hidden, false);
$$;

-- ============================================================================
-- 10. ADD USERNAME EDIT TRACKING (Optional - for future use)
-- ============================================================================

-- Add column to track when username was last changed
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;

-- Create trigger to update username_changed_at
CREATE OR REPLACE FUNCTION public.track_username_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    NEW.username_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_username_change ON public.profiles;
CREATE TRIGGER trg_track_username_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_username_change();

-- ============================================================================
-- 11. ADD REPORT STATUS TRACKING
-- ============================================================================

-- Add index for moderator queries
CREATE INDEX IF NOT EXISTS idx_reports_moderation 
ON public.reports(status, created_at DESC) 
WHERE status IN ('pending', 'reviewed');

-- Function to get report count for content
CREATE OR REPLACE FUNCTION public.get_report_count(
  p_content_type text,
  p_content_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COUNT(*)::integer
  FROM public.reports
  WHERE content_type = p_content_type
    AND content_id = p_content_id
    AND status IN ('pending', 'reviewed');
$$;

-- ============================================================================
-- 12. ADD CONTENT VISIBILITY HELPERS
-- ============================================================================

-- Function to check if user can see problem
CREATE OR REPLACE FUNCTION public.can_view_problem(
  p_problem_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_visibility text;
  v_is_deleted boolean;
BEGIN
  SELECT visibility, is_deleted
  INTO v_visibility, v_is_deleted
  FROM public.problems
  WHERE id = p_problem_id;
  
  -- Deleted content is never visible
  IF v_is_deleted THEN
    RETURN false;
  END IF;
  
  -- Public and unlisted are visible to everyone
  IF v_visibility IN ('public', 'unlisted') THEN
    RETURN true;
  END IF;
  
  -- Private requires membership
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.problem_members
    WHERE problem_id = p_problem_id
      AND user_id = p_user_id
  );
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify report deduplication constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reports_unique_per_user'
  ) THEN
    RAISE NOTICE '✅ Report deduplication constraint added';
  ELSE
    RAISE WARNING '❌ Report deduplication constraint missing';
  END IF;
END $$;

-- Verify case-insensitive username index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_profiles_username_lower'
  ) THEN
    RAISE NOTICE '✅ Case-insensitive username index added';
  ELSE
    RAISE WARNING '❌ Case-insensitive username index missing';
  END IF;
END $$;

-- Verify reserved username constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_not_reserved'
  ) THEN
    RAISE NOTICE '✅ Reserved username constraint added';
  ELSE
    RAISE WARNING '❌ Reserved username constraint missing';
  END IF;
END $$;

-- Count duplicate indexes removed
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE indexname IN (
    'problem_members_user_problem_unique',
    'prompt_reviews_user_prompt_unique',
    'idx_prompts_by_creator',
    'prompts_problem_slug_unique'
  );
  
  IF v_count = 0 THEN
    RAISE NOTICE '✅ All duplicate indexes removed';
  ELSE
    RAISE WARNING '⚠️ % duplicate indexes still exist', v_count;
  END IF;
END $$;

RAISE NOTICE '🎉 Pre-launch fixes applied successfully!';
