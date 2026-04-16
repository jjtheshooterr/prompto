-- ============================================================
-- Creator Analytics Migration
-- Creates prompt_daily_stats table and updates RPC functions
-- to populate daily snapshots for time-series analytics charts.
-- ============================================================

-- 1. Create the daily stats aggregation table
CREATE TABLE IF NOT EXISTS prompt_daily_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  views integer DEFAULT 0,
  copies integer DEFAULT 0,
  forks integer DEFAULT 0,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  UNIQUE(prompt_id, stat_date)
);

-- 2. Performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_pds_prompt_date ON prompt_daily_stats(prompt_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_pds_date ON prompt_daily_stats(stat_date);

-- 3. Enable RLS on the new table
ALTER TABLE prompt_daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read daily stats (they're aggregate, non-sensitive)
CREATE POLICY "prompt_daily_stats_select_all"
  ON prompt_daily_stats FOR SELECT
  USING (true);

-- Only system functions (SECURITY DEFINER) can insert/update
-- No direct user insert/update policy needed

-- 4. Update increment_prompt_views to also track daily stats
CREATE OR REPLACE FUNCTION increment_prompt_views(prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment the running total in prompt_stats
  INSERT INTO prompt_stats (prompt_id, view_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE
  SET view_count = prompt_stats.view_count + 1;

  -- Also track in daily stats for time-series analytics
  INSERT INTO prompt_daily_stats (prompt_id, stat_date, views)
  VALUES (prompt_id, CURRENT_DATE, 1)
  ON CONFLICT (prompt_id, stat_date) DO UPDATE
  SET views = prompt_daily_stats.views + 1;
END;
$$;

-- 5. Update increment_prompt_copies to also track daily stats
CREATE OR REPLACE FUNCTION increment_prompt_copies(prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, copy_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE
  SET copy_count = prompt_stats.copy_count + 1;

  INSERT INTO prompt_daily_stats (prompt_id, stat_date, copies)
  VALUES (prompt_id, CURRENT_DATE, 1)
  ON CONFLICT (prompt_id, stat_date) DO UPDATE
  SET copies = prompt_daily_stats.copies + 1;
END;
$$;

-- 6. Update increment_fork_count to also track daily stats
CREATE OR REPLACE FUNCTION increment_fork_count(prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, fork_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE
  SET fork_count = prompt_stats.fork_count + 1;

  INSERT INTO prompt_daily_stats (prompt_id, stat_date, forks)
  VALUES (prompt_id, CURRENT_DATE, 1)
  ON CONFLICT (prompt_id, stat_date) DO UPDATE
  SET forks = prompt_daily_stats.forks + 1;
END;
$$;

-- 7. Helper function: get creator analytics aggregates
-- Returns totals across ALL prompts owned by a user
CREATE OR REPLACE FUNCTION get_creator_stats(creator_id uuid)
RETURNS TABLE (
  total_views bigint,
  total_copies bigint,
  total_forks bigint,
  total_upvotes bigint,
  total_downvotes bigint,
  avg_quality_score numeric,
  prompt_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ps.view_count), 0)::bigint AS total_views,
    COALESCE(SUM(ps.copy_count), 0)::bigint AS total_copies,
    COALESCE(SUM(ps.fork_count), 0)::bigint AS total_forks,
    COALESCE(SUM(ps.upvotes), 0)::bigint AS total_upvotes,
    COALESCE(SUM(ps.downvotes), 0)::bigint AS total_downvotes,
    COALESCE(AVG(NULLIF(ps.quality_score, 0)), 0)::numeric AS avg_quality_score,
    COUNT(DISTINCT p.id)::bigint AS prompt_count
  FROM prompts p
  LEFT JOIN prompt_stats ps ON ps.prompt_id = p.id
  WHERE p.created_by = creator_id
    AND p.is_deleted = false;
END;
$$;

-- 8. Helper function: get daily time-series data for a creator
-- Returns daily totals across ALL their prompts for the last N days
CREATE OR REPLACE FUNCTION get_creator_daily_stats(creator_id uuid, days_back integer DEFAULT 30)
RETURNS TABLE (
  stat_date date,
  views bigint,
  copies bigint,
  forks bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.stat_date,
    COALESCE(SUM(pds.views), 0)::bigint AS views,
    COALESCE(SUM(pds.copies), 0)::bigint AS copies,
    COALESCE(SUM(pds.forks), 0)::bigint AS forks
  FROM (
    -- Generate a complete date series to avoid gaps
    SELECT generate_series(
      CURRENT_DATE - (days_back || ' days')::interval,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS stat_date
  ) d
  LEFT JOIN prompt_daily_stats pds ON pds.stat_date = d.stat_date
    AND pds.prompt_id IN (
      SELECT id FROM prompts WHERE created_by = creator_id AND is_deleted = false
    )
  GROUP BY d.stat_date
  ORDER BY d.stat_date ASC;
END;
$$;

-- 9. Helper function: get top prompts for a creator
-- Returns prompts ranked by total engagement (views + copies + forks)
CREATE OR REPLACE FUNCTION get_creator_top_prompts(creator_id uuid, result_limit integer DEFAULT 10)
RETURNS TABLE (
  prompt_id uuid,
  title text,
  slug text,
  short_id text,
  model text,
  view_count integer,
  copy_count integer,
  fork_count integer,
  upvotes integer,
  downvotes integer,
  quality_score integer,
  total_engagement bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS prompt_id,
    p.title,
    p.slug,
    p.short_id,
    p.model,
    COALESCE(ps.view_count, 0) AS view_count,
    COALESCE(ps.copy_count, 0) AS copy_count,
    COALESCE(ps.fork_count, 0) AS fork_count,
    COALESCE(ps.upvotes, 0) AS upvotes,
    COALESCE(ps.downvotes, 0) AS downvotes,
    COALESCE(ps.quality_score, 0) AS quality_score,
    (COALESCE(ps.view_count, 0) + COALESCE(ps.copy_count, 0) * 3 + COALESCE(ps.fork_count, 0) * 5)::bigint AS total_engagement,
    p.created_at
  FROM prompts p
  LEFT JOIN prompt_stats ps ON ps.prompt_id = p.id
  WHERE p.created_by = creator_id
    AND p.is_deleted = false
  ORDER BY total_engagement DESC, p.created_at DESC
  LIMIT result_limit;
END;
$$;
