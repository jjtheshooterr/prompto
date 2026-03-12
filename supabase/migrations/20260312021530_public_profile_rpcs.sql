-- Add RPC functions for Public profiles to ensure no private/unlisted data leaks

CREATE OR REPLACE FUNCTION public.get_public_user_prompts(
  user_id UUID,
  sort_by TEXT DEFAULT 'newest',
  limit_count INT DEFAULT 10,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  problem_id text, -- string UUID from problem
  title TEXT,
  slug TEXT,
  description TEXT,
  system_prompt TEXT,
  model TEXT,
  quality_score NUMERIC,
  fork_count BIGINT,
  works_count BIGINT,
  fails_count BIGINT,
  created_at TIMESTAMPTZ,
  visibility visibility
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.problem_id::text,
    p.title,
    p.slug,
    p.notes as description,
    p.system_prompt,
    p.model,
    COALESCE(ps.score, 0) as quality_score,
    COALESCE(ps.fork_count, 0) as fork_count,
    COALESCE(ps.works_count, 0) as works_count,
    COALESCE(ps.fails_count, 0) as fails_count,
    p.created_at,
    p.visibility
  FROM prompts p
  LEFT JOIN prompt_stats ps ON p.id = ps.prompt_id
  WHERE p.created_by = user_id AND p.visibility = 'public'
  ORDER BY
    CASE WHEN sort_by = 'newest' THEN p.created_at END DESC,
    CASE WHEN sort_by = 'top' THEN COALESCE(ps.score, 0) END DESC,
    CASE WHEN sort_by = 'most_forked' THEN COALESCE(ps.fork_count, 0) END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_user_prompts TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.get_public_user_problems(
  user_id UUID,
  sort_by TEXT DEFAULT 'newest',
  limit_count INT DEFAULT 10,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  industry TEXT,
  difficulty TEXT,
  works_count BIGINT,
  prompts_count BIGINT,
  created_at TIMESTAMPTZ,
  visibility visibility
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.description,
    p.industry,
    p.difficulty,
    COALESCE(ps.total_works, 0) as works_count,
    COALESCE(ps.total_prompts, 0) as prompts_count,
    p.created_at,
    p.visibility
  FROM problems p
  LEFT JOIN problem_stats ps ON p.id = ps.problem_id
  WHERE p.created_by = user_id AND p.visibility = 'public'
  ORDER BY
    CASE WHEN sort_by = 'newest' THEN p.created_at END DESC,
    CASE WHEN sort_by = 'top' THEN COALESCE(ps.total_works, 0) END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_user_problems TO anon, authenticated;
