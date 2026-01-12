-- 20260112200000_final_schema_cleanup.sql
-- Final schema hardening: slug scoping fixes and constraint cleanup

BEGIN;

-- ============================================================================
-- 1. Fix Slug Scoping
-- ============================================================================

-- Problems: Change from workspace-scoped to globally unique slugs
-- (Better for SEO and direct /problems/{slug} routing)
ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_workspace_id_slug_key;
ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_workspace_slug_unique;

-- Add global unique constraint on problems.slug
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'problems_slug_key' 
      AND conrelid = 'public.problems'::regclass
  ) THEN
    ALTER TABLE public.problems ADD CONSTRAINT problems_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Prompts: Change from workspace-scoped to problem-scoped slugs
-- (Prompts are primarily viewed within problem context)
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_workspace_id_slug_key;
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_workspace_slug_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'prompts_problem_id_slug_key'
      AND conrelid = 'public.prompts'::regclass
  ) THEN
    ALTER TABLE public.prompts ADD CONSTRAINT prompts_problem_id_slug_key 
      UNIQUE (problem_id, slug);
  END IF;
END $$;

-- ============================================================================
-- 2. Remove Redundant Constraints
-- ============================================================================

-- prompt_stats.prompt_id has redundant UNIQUE (already PK)
ALTER TABLE public.prompt_stats DROP CONSTRAINT IF EXISTS prompt_stats_prompt_id_unique;
ALTER TABLE public.prompt_stats DROP CONSTRAINT IF EXISTS prompt_stats_prompt_id_key;

-- ============================================================================
-- 3. Add Missing Performance Indexes
-- ============================================================================

-- Composite index for problem listing queries
CREATE INDEX IF NOT EXISTS idx_prompts_problem_query
  ON public.prompts(problem_id, is_deleted, is_hidden, is_listed, created_at DESC)
  WHERE is_deleted = false;

-- Parent prompt index for fork queries
CREATE INDEX IF NOT EXISTS idx_prompts_parent_prompt
  ON public.prompts(parent_prompt_id)
  WHERE parent_prompt_id IS NOT NULL;

-- Prompt stats score index (if not exists)
CREATE INDEX IF NOT EXISTS idx_prompt_stats_ranking
  ON public.prompt_stats(score DESC, updated_at DESC);

-- Tag indexes for filtering
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag
  ON public.prompt_tags(tag_id);

-- ============================================================================
-- 4. Document Nullable Column Intentions
-- ============================================================================

COMMENT ON COLUMN public.prompt_events.prompt_id IS 
  'Nullable to support global/workspace-level events (e.g., user_joined)';

COMMENT ON COLUMN public.prompt_events.user_id IS 
  'Nullable to support anonymous analytics and system events';

-- ============================================================================
-- 5. Verification
-- ============================================================================

-- Verify slug constraints
DO $$
DECLARE
  problems_slug_unique boolean;
  prompts_slug_unique boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'problems_slug_key'
  ) INTO problems_slug_unique;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'prompts_problem_id_slug_key'
  ) INTO prompts_slug_unique;

  IF NOT problems_slug_unique THEN
    RAISE EXCEPTION 'problems.slug UNIQUE constraint missing!';
  END IF;

  IF NOT prompts_slug_unique THEN
    RAISE EXCEPTION 'prompts (problem_id, slug) UNIQUE constraint missing!';
  END IF;

  RAISE NOTICE 'Schema verification passed: All constraints in place';
END $$;

COMMIT;
