-- ============================================================
-- 30-Day Validation Sprint - Manual Metrics Queries
-- ============================================================
-- Run these queries weekly in Supabase SQL editor
-- Copy results to spreadsheet for tracking
-- ============================================================

-- Query 1: Total signups
-- Count all user profiles created
SELECT COUNT(*) AS total_signups
FROM profiles;

-- Query 2: Total forks
-- Count all fork events tracked in prompt_events
SELECT COUNT(*) AS total_forks
FROM prompt_events
WHERE event_type = 'fork';

-- Query 3: Users who forked
-- Count distinct users who have created at least one fork
SELECT COUNT(DISTINCT user_id) AS users_who_forked
FROM prompt_events
WHERE event_type = 'fork'
  AND user_id IS NOT NULL;

-- Query 4: Returning users (2+ days)
-- Count users who have events on 2 or more different days
SELECT COUNT(*) AS returning_users
FROM (
  SELECT user_id
  FROM prompt_events
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(DISTINCT DATE(created_at)) >= 2
) AS returning_user_list;

-- Query 5: Fork chains (depth >= 2)
-- Count prompts that are at least 2 levels deep in a fork chain
SELECT COUNT(*) AS fork_chains_depth_2_plus
FROM prompts
WHERE depth >= 2;

-- ============================================================
-- BONUS METRICS (Optional - for deeper insights)
-- ============================================================

-- Fork conversion rate
-- Percentage of prompt views that resulted in a fork
SELECT 
  ROUND(
    (SELECT COUNT(*) FROM prompt_events WHERE event_type = 'fork')::numeric / 
    NULLIF((SELECT COUNT(*) FROM prompt_events WHERE event_type = 'view'), 0) * 100,
    2
  ) AS fork_conversion_percentage;

-- Active users (users who forked OR created a problem)
SELECT COUNT(DISTINCT user_id) AS active_users
FROM (
  SELECT user_id FROM prompt_events WHERE event_type = 'fork' AND user_id IS NOT NULL
  UNION
  SELECT created_by AS user_id FROM problems WHERE created_by IS NOT NULL
) AS active_user_list;

-- Average forks per active user
SELECT 
  ROUND(
    (SELECT COUNT(*) FROM prompt_events WHERE event_type = 'fork')::numeric /
    NULLIF(
      (SELECT COUNT(DISTINCT user_id) FROM (
        SELECT user_id FROM prompt_events WHERE event_type = 'fork' AND user_id IS NOT NULL
        UNION
        SELECT created_by AS user_id FROM problems WHERE created_by IS NOT NULL
      ) AS active_users),
      0
    ),
    2
  ) AS avg_forks_per_active_user;

-- Fork chain details (prompts with depth >= 2)
-- Shows which prompts are part of deep fork chains
SELECT 
  p.id,
  p.title,
  p.depth,
  p.parent_prompt_id,
  p.root_prompt_id,
  p.created_at,
  prof.username AS creator
FROM prompts p
LEFT JOIN profiles prof ON p.created_by = prof.id
WHERE p.depth >= 2
ORDER BY p.depth DESC, p.created_at DESC;

-- Daily signup trend
-- Shows signups by day for the last 30 days
SELECT 
  DATE(created_at) AS signup_date,
  COUNT(*) AS signups
FROM profiles
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- ============================================================
-- VALIDATION SUCCESS CRITERIA CHECK
-- ============================================================
-- Run this to see if validation targets are met:
-- - 50+ signups
-- - 20+ active users
-- - 10+ return users
-- - 1+ fork chain with depth >= 2

SELECT 
  (SELECT COUNT(*) FROM profiles) AS total_signups,
  (SELECT COUNT(*) >= 50 FROM profiles) AS target_signups_met,
  
  (SELECT COUNT(DISTINCT user_id) FROM (
    SELECT user_id FROM prompt_events WHERE event_type = 'fork' AND user_id IS NOT NULL
    UNION
    SELECT created_by AS user_id FROM problems WHERE created_by IS NOT NULL
  ) AS active_users) AS active_users,
  (SELECT COUNT(DISTINCT user_id) >= 20 FROM (
    SELECT user_id FROM prompt_events WHERE event_type = 'fork' AND user_id IS NOT NULL
    UNION
    SELECT created_by AS user_id FROM problems WHERE created_by IS NOT NULL
  ) AS active_users) AS target_active_users_met,
  
  (SELECT COUNT(*) FROM (
    SELECT user_id
    FROM prompt_events
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(DISTINCT DATE(created_at)) >= 2
  ) AS returning_users) AS return_users,
  (SELECT COUNT(*) >= 10 FROM (
    SELECT user_id
    FROM prompt_events
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(DISTINCT DATE(created_at)) >= 2
  ) AS returning_users) AS target_return_users_met,
  
  (SELECT COUNT(*) FROM prompts WHERE depth >= 2) AS fork_chains_depth_2_plus,
  (SELECT COUNT(*) >= 1 FROM prompts WHERE depth >= 2) AS target_fork_chains_met;
