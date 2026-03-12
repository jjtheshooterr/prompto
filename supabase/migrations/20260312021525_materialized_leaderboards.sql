-- Migration: Create Materialized Views for Dual Leaderboards

-- 1. Create MV for User Leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_leaderboard AS
WITH UserStats AS (
    SELECT 
        pr.created_by AS user_id,
        COUNT(DISTINCT pr.problem_id) AS problems_solved,
        SUM(COALESCE(ps.quality_score, 0)) AS total_quality_score,
        SUM(COALESCE(ps.upvotes, 0)) AS total_upvotes,
        SUM(COALESCE(ps.fork_count, 0)) AS total_forks
    FROM prompts pr
    LEFT JOIN prompt_stats ps ON pr.id = ps.prompt_id
    WHERE pr.visibility = 'public' 
      AND pr.is_hidden = FALSE
    GROUP BY pr.created_by
)
SELECT 
    p.id AS user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(us.problems_solved, 0) AS problems_solved,
    COALESCE(us.total_quality_score, 0) AS total_quality_score,
    COALESCE(us.total_upvotes, 0) AS total_upvotes,
    COALESCE(us.total_forks, 0) AS total_forks,
    (
        COALESCE(us.total_quality_score, 0) +
        (COALESCE(us.total_upvotes, 0) * 10) +
        (COALESCE(us.total_forks, 0) * 25) +
        (COALESCE(us.problems_solved, 0) * 50)
    ) AS total_points,
    CASE 
        WHEN (
            COALESCE(us.total_quality_score, 0) +
            (COALESCE(us.total_upvotes, 0) * 10) +
            (COALESCE(us.total_forks, 0) * 25) +
            (COALESCE(us.problems_solved, 0) * 50)
        ) >= 10000 THEN 'Grandmaster'
        WHEN (
            COALESCE(us.total_quality_score, 0) +
            (COALESCE(us.total_upvotes, 0) * 10) +
            (COALESCE(us.total_forks, 0) * 25) +
            (COALESCE(us.problems_solved, 0) * 50)
        ) >= 2500 THEN 'Master'
        WHEN (
            COALESCE(us.total_quality_score, 0) +
            (COALESCE(us.total_upvotes, 0) * 10) +
            (COALESCE(us.total_forks, 0) * 25) +
            (COALESCE(us.problems_solved, 0) * 50)
        ) >= 500 THEN 'Expert'
        WHEN (
            COALESCE(us.total_quality_score, 0) +
            (COALESCE(us.total_upvotes, 0) * 10) +
            (COALESCE(us.total_forks, 0) * 25) +
            (COALESCE(us.problems_solved, 0) * 50)
        ) >= 100 THEN 'Contributor'
        ELSE 'Novice'
    END AS tier
FROM profiles p
INNER JOIN UserStats us ON p.id = us.user_id
WHERE (
    COALESCE(us.total_quality_score, 0) +
    (COALESCE(us.total_upvotes, 0) * 10) +
    (COALESCE(us.total_forks, 0) * 25) +
    (COALESCE(us.problems_solved, 0) * 50)
) > 0;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_leaderboard_user_id ON mv_user_leaderboard(user_id);


-- 2. Create MV for Prompt Leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_prompt_leaderboard AS
SELECT 
    pr.id AS prompt_id,
    pr.title,
    pr.slug,
    pr.visibility,
    prob.title AS problem_title,
    prob.slug AS problem_slug,
    p.username AS author_username,
    p.display_name AS author_name,
    p.avatar_url AS author_avatar,
    COALESCE(ps.quality_score, 0) AS quality_score,
    COALESCE(ps.upvotes, 0) AS upvotes,
    COALESCE(ps.fork_count, 0) AS forks
FROM prompts pr
JOIN problems prob ON pr.problem_id = prob.id
JOIN profiles p ON pr.created_by = p.id
LEFT JOIN prompt_stats ps ON pr.id = ps.prompt_id
WHERE pr.visibility = 'public' 
  AND pr.is_hidden = FALSE
  AND prob.is_hidden = FALSE
  AND COALESCE(ps.quality_score, 0) > 0;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_prompt_leaderboard_prompt_id ON mv_prompt_leaderboard(prompt_id);


-- 3. Grant Permissions
GRANT SELECT ON mv_user_leaderboard TO anon, authenticated;
GRANT SELECT ON mv_prompt_leaderboard TO anon, authenticated;


-- 4. Create RPC to refresh the Views
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We use CONCURRENTLY so reads aren't blocked during the refresh
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_leaderboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_prompt_leaderboard;
END;
$$;
