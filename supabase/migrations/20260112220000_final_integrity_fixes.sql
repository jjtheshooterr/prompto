-- Final Schema Integrity Fixes
-- Addresses critical data integrity and performance issues

-- ============================================================================
-- MUST FIX #1: Prevent duplicate problem_members
-- ============================================================================
-- This prevents the same user from having multiple roles in the same problem
ALTER TABLE public.problem_members 
ADD CONSTRAINT problem_members_problem_id_user_id_unique UNIQUE (problem_id, user_id);

-- ============================================================================
-- MUST FIX #2: Enforce prompts.slug uniqueness (scoped to problem)
-- ============================================================================
-- Prompts are nested under problems, so slug should be unique within problem
-- This allows /problems/:problem_slug/prompts/:prompt_slug routing
ALTER TABLE public.prompts 
ADD CONSTRAINT prompts_problem_id_slug_unique UNIQUE (problem_id, slug);

-- ============================================================================
-- MUST FIX #3: Validate pinned_prompt belongs to the same problem
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_pinned_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If pinned_prompt_id is set, verify it belongs to this problem
  IF NEW.pinned_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts
      WHERE id = NEW.pinned_prompt_id
        AND problem_id = NEW.id
        AND COALESCE(is_deleted, false) = false
    ) THEN
      RAISE EXCEPTION 'Pinned prompt must belong to this problem and not be deleted';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_pinned_prompt_trigger ON public.problems;
CREATE TRIGGER validate_pinned_prompt_trigger
  BEFORE INSERT OR UPDATE OF pinned_prompt_id ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pinned_prompt();

-- ============================================================================
-- PERFORMANCE INDEXES (Medium Priority - but important for scale)
-- ============================================================================

-- Complex filter index for prompt listing queries
-- Covers: is_deleted, is_hidden, is_listed filters + created_at sorting
CREATE INDEX IF NOT EXISTS idx_prompts_listing 
ON public.prompts(problem_id, is_deleted, is_hidden, is_listed, created_at DESC)
WHERE COALESCE(is_deleted, false) = false;

-- Parent prompt lookups (for fork trees)
CREATE INDEX IF NOT EXISTS idx_prompts_parent_prompt 
ON public.prompts(parent_prompt_id)
WHERE parent_prompt_id IS NOT NULL;

-- Top prompts by score (leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_prompt_stats_score 
ON public.prompt_stats(score DESC);

-- Tag lookups are already covered by existing FK indexes we added earlier
-- (idx_workspace_members_user_id, idx_workspaces_owner_id, etc)

COMMENT ON CONSTRAINT problem_members_problem_id_user_id_unique ON public.problem_members IS 
  'Prevents duplicate memberships - each user can only have one role per problem';

COMMENT ON CONSTRAINT prompts_problem_id_slug_unique ON public.prompts IS 
  'Ensures prompt slugs are unique within their problem for clean routing';

COMMENT ON FUNCTION public.validate_pinned_prompt() IS 
  'Validates that a pinned prompt actually belongs to the problem and is not deleted';
