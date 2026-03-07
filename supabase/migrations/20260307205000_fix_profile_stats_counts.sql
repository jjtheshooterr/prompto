-- Drop the existing function so we can change the return type
DROP FUNCTION IF EXISTS get_profile_stats(UUID);

CREATE OR REPLACE FUNCTION get_profile_stats(p_user_id UUID)
RETURNS TABLE (
  total_prompts BIGINT,
  total_score BIGINT,
  forks_received BIGINT,
  forks_created BIGINT,
  total_copies BIGINT,
  total_views BIGINT,
  total_works BIGINT,
  total_fails BIGINT,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH original_prompt_ids AS (
    SELECT pr.id
    FROM prompts pr
    WHERE pr.created_by = p_user_id
      AND pr.is_deleted = false
      AND pr.is_listed = true
      AND pr.parent_prompt_id IS NULL
  ),
  forked_prompt_ids AS (
    SELECT pr.id
    FROM prompts pr
    WHERE pr.created_by = p_user_id
      AND pr.is_deleted = false
      AND pr.is_listed = true
      AND pr.parent_prompt_id IS NOT NULL
  ),
  all_user_prompt_ids AS (
    SELECT id FROM original_prompt_ids
    UNION ALL
    SELECT id FROM forked_prompt_ids
  ),
  agg AS (
    -- Calculate stats ONLY for original prompts for total_prompts count (matching UI)
    SELECT
      COUNT(up.id)                              AS total_prompts
    FROM original_prompt_ids up
  ),
  -- Score/Views/etc should apply across ALL their published prompts (originals + forks)
  stats_agg AS (
    SELECT
      COALESCE(SUM(ps.score), 0)               AS total_score,
      COALESCE(SUM(ps.copy_count), 0)          AS total_copies,
      COALESCE(SUM(ps.view_count), 0)          AS total_views,
      COALESCE(SUM(ps.works_count), 0)         AS total_works,
      COALESCE(SUM(ps.fails_count), 0)         AS total_fails
    FROM all_user_prompt_ids up
    LEFT JOIN prompt_stats ps ON ps.prompt_id = up.id
  ),
  fork_recv_agg AS (
    -- Forks received means how many times others forked THEIR prompts (both originals and forks potentially)
    SELECT COUNT(*)::BIGINT AS forks_received
    FROM prompts fork_pr
    WHERE fork_pr.parent_prompt_id IN (SELECT id FROM all_user_prompt_ids)
      AND fork_pr.is_deleted = false
  ),
  fork_created_agg AS (
    SELECT COUNT(*)::BIGINT AS forks_created
    FROM forked_prompt_ids
  )
  SELECT
    a.total_prompts,
    sa.total_score,
    fr.forks_received,
    fc.forks_created,
    sa.total_copies,
    sa.total_views,
    sa.total_works,
    sa.total_fails,
    CASE
      WHEN (sa.total_works + sa.total_fails) = 0 THEN 0::NUMERIC
      ELSE ROUND(sa.total_works::NUMERIC / (sa.total_works + sa.total_fails) * 100, 1)
    END AS success_rate
  FROM agg a, stats_agg sa, fork_recv_agg fr, fork_created_agg fc;
END;
$$;

GRANT EXECUTE ON FUNCTION get_profile_stats TO anon, authenticated;
