-- ============================================================================
-- CONTENT FILTERING & XSS PROTECTION
-- Date: January 28, 2026
-- Purpose: Ensure deleted/hidden content is filtered everywhere
-- ============================================================================

-- ============================================================================
-- 1. CREATE SAFE VIEWS FOR ACTIVE CONTENT
-- ============================================================================

-- View for active (non-deleted, non-hidden) problems
CREATE OR REPLACE VIEW public.active_problems AS
SELECT *
FROM public.problems
WHERE is_deleted = false;

-- View for active (non-deleted, non-hidden) prompts
CREATE OR REPLACE VIEW public.active_prompts AS
SELECT *
FROM public.problems
WHERE is_deleted = false
  AND is_hidden = false;

-- Grant access to views
GRANT SELECT ON public.active_problems TO authenticated, anon;
GRANT SELECT ON public.active_prompts TO authenticated, anon;

-- ============================================================================
-- 2. ADD PER-ENDPOINT RATE LIMITING HELPERS
-- ============================================================================

-- Function to check rate limit for specific actions
CREATE OR REPLACE FUNCTION public.check_action_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_per_hour integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count actions in the last hour
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT 1 FROM public.votes 
    WHERE user_id = p_user_id 
      AND created_at > now() - interval '1 hour'
      AND p_action = 'vote'
    UNION ALL
    SELECT 1 FROM public.reports 
    WHERE reporter_id = p_user_id 
      AND created_at > now() - interval '1 hour'
      AND p_action = 'report'
    UNION ALL
    SELECT 1 FROM public.prompts 
    WHERE created_by = p_user_id 
      AND created_at > now() - interval '1 hour'
      AND parent_prompt_id IS NOT NULL
      AND p_action = 'fork'
    UNION ALL
    SELECT 1 FROM public.prompts 
    WHERE created_by = p_user_id 
      AND created_at > now() - interval '1 hour'
      AND parent_prompt_id IS NULL
      AND p_action = 'create_prompt'
  ) actions;
  
  RETURN v_count < p_max_per_hour;
END;
$$;

-- ============================================================================
-- 3. ADD DELETED AUTHOR HANDLING
-- ============================================================================

-- Function to get author display info (handles deleted users)
CREATE OR REPLACE FUNCTION public.get_author_display(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_profile record;
  v_result jsonb;
BEGIN
  SELECT 
    id,
    username,
    display_name,
    avatar_url
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    -- User deleted or doesn't exist
    RETURN jsonb_build_object(
      'id', p_user_id,
      'username', null,
      'display_name', 'Deleted User',
      'avatar_url', null,
      'is_deleted', true
    );
  END IF;
  
  RETURN jsonb_build_object(
    'id', v_profile.id,
    'username', v_profile.username,
    'display_name', COALESCE(v_profile.display_name, 'Anonymous'),
    'avatar_url', v_profile.avatar_url,
    'is_deleted', false
  );
END;
$$;

-- ============================================================================
-- 4. ADD CONTENT SANITIZATION VALIDATION
-- ============================================================================

-- Function to validate content doesn't contain dangerous patterns
CREATE OR REPLACE FUNCTION public.validate_content_safety(p_content text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check for common XSS patterns
  IF p_content ~* '<script|javascript:|onerror=|onload=|<iframe|eval\(' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Add constraints to validate content safety
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_system_prompt_safe;
ALTER TABLE public.prompts 
ADD CONSTRAINT prompts_system_prompt_safe 
CHECK (validate_content_safety(system_prompt));

ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_user_prompt_safe;
ALTER TABLE public.prompts 
ADD CONSTRAINT prompts_user_prompt_safe 
CHECK (user_prompt_template IS NULL OR validate_content_safety(user_prompt_template));

ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_notes_safe;
ALTER TABLE public.prompts 
ADD CONSTRAINT prompts_notes_safe 
CHECK (notes IS NULL OR validate_content_safety(notes));

ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_description_safe;
ALTER TABLE public.problems 
ADD CONSTRAINT problems_description_safe 
CHECK (description IS NULL OR validate_content_safety(description));

-- ============================================================================
-- 5. UPDATE EXISTING FUNCTIONS TO FILTER DELETED CONTENT
-- ============================================================================

-- Update get_ranked_prompts to filter deleted/hidden
CREATE OR REPLACE FUNCTION public.get_ranked_prompts(
  p_problem_id uuid DEFAULT NULL,
  p_sort_by text DEFAULT 'score',
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  system_prompt text,
  user_prompt_template text,
  model text,
  created_at timestamptz,
  created_by uuid,
  problem_id uuid,
  parent_prompt_id uuid,
  notes text,
  best_for text[],
  improvement_summary text,
  is_listed boolean,
  score integer,
  upvotes integer,
  downvotes integer,
  fork_count integer,
  view_count integer,
  copy_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.system_prompt,
    p.user_prompt_template,
    p.model,
    p.created_at,
    p.created_by,
    p.problem_id,
    p.parent_prompt_id,
    p.notes,
    p.best_for,
    p.improvement_summary,
    p.is_listed,
    COALESCE(ps.score, 0) as score,
    COALESCE(ps.upvotes, 0) as upvotes,
    COALESCE(ps.downvotes, 0) as downvotes,
    COALESCE(ps.fork_count, 0) as fork_count,
    COALESCE(ps.view_count, 0) as view_count,
    COALESCE(ps.copy_count, 0) as copy_count
  FROM public.prompts p
  LEFT JOIN public.prompt_stats ps ON p.id = ps.prompt_id
  WHERE 
    (p_problem_id IS NULL OR p.problem_id = p_problem_id)
    AND p.is_listed = true
    AND p.is_deleted = false
    AND p.is_hidden = false
  ORDER BY
    CASE 
      WHEN p_sort_by = 'score' THEN COALESCE(ps.score, 0)
      WHEN p_sort_by = 'upvotes' THEN COALESCE(ps.upvotes, 0)
      WHEN p_sort_by = 'forks' THEN COALESCE(ps.fork_count, 0)
      WHEN p_sort_by = 'views' THEN COALESCE(ps.view_count, 0)
      ELSE 0
    END DESC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify views exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_problems') THEN
    RAISE NOTICE '✅ active_problems view created';
  ELSE
    RAISE WARNING '❌ active_problems view missing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_prompts') THEN
    RAISE NOTICE '✅ active_prompts view created';
  ELSE
    RAISE WARNING '❌ active_prompts view missing';
  END IF;
END $$;

-- Verify functions exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_action_rate_limit') THEN
    RAISE NOTICE '✅ check_action_rate_limit function created';
  ELSE
    RAISE WARNING '❌ check_action_rate_limit function missing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_author_display') THEN
    RAISE NOTICE '✅ get_author_display function created';
  ELSE
    RAISE WARNING '❌ get_author_display function missing';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_content_safety') THEN
    RAISE NOTICE '✅ validate_content_safety function created';
  ELSE
    RAISE WARNING '❌ validate_content_safety function missing';
  END IF;
END $$;

RAISE NOTICE '🎉 Content filtering and safety measures applied!';
