-- ============================================================================
-- Profile Page Extensions Migration
-- Date: 2026-03-07
-- ============================================================================

-- 1. Extend profiles table with bio/social fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;

-- 2. Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'prompt_created', 'prompt_updated', 'prompt_forked',
    'prompt_improved', 'review_received', 'score_increased'
  )),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id_created
  ON user_activity(user_id, created_at DESC);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity' AND policyname = 'user_activity_select_all'
  ) THEN
    CREATE POLICY user_activity_select_all
      ON user_activity FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity' AND policyname = 'user_activity_insert_own'
  ) THEN
    CREATE POLICY user_activity_insert_own
      ON user_activity FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END
$$;

-- 3. Update / create get_profile_by_username
DROP FUNCTION IF EXISTS get_profile_by_username(TEXT);
CREATE OR REPLACE FUNCTION get_profile_by_username(u TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  headline TEXT,
  location TEXT,
  website_url TEXT,
  reputation_score INTEGER,
  created_at TIMESTAMPTZ,
  reputation INTEGER,
  upvotes_received INTEGER,
  forks_received INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.headline,
    p.location,
    p.website_url,
    COALESCE(p.reputation_score, 0) AS reputation_score,
    p.created_at,
    COALESCE(p.reputation_score, 0)::INTEGER AS reputation,
    COALESCE((
      SELECT SUM(ps.upvotes)::INTEGER
      FROM prompts pr
      JOIN prompt_stats ps ON ps.prompt_id = pr.id
      WHERE pr.created_by = p.id
        AND pr.is_deleted = false
        AND pr.is_listed = true
    ), 0) AS upvotes_received,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM prompts fork_pr
      JOIN prompts orig_pr ON orig_pr.id = fork_pr.parent_prompt_id
      WHERE orig_pr.created_by = p.id
        AND fork_pr.is_deleted = false
    ), 0) AS forks_received
  FROM profiles p
  WHERE LOWER(p.username) = LOWER(u);
END;
$$;

GRANT EXECUTE ON FUNCTION get_profile_by_username TO anon, authenticated;

-- 4. Create get_profile_stats RPC
CREATE OR REPLACE FUNCTION get_profile_stats(p_user_id UUID)
RETURNS TABLE (
  total_prompts BIGINT,
  total_score BIGINT,
  forks_received BIGINT,
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
  WITH user_prompt_ids AS (
    SELECT pr.id
    FROM prompts pr
    WHERE pr.created_by = p_user_id
      AND pr.is_deleted = false
      AND pr.is_listed = true
  ),
  agg AS (
    SELECT
      COUNT(up.id)                              AS total_prompts,
      COALESCE(SUM(ps.score), 0)               AS total_score,
      COALESCE(SUM(ps.copy_count), 0)          AS total_copies,
      COALESCE(SUM(ps.view_count), 0)          AS total_views,
      COALESCE(SUM(ps.works_count), 0)         AS total_works,
      COALESCE(SUM(ps.fails_count), 0)         AS total_fails
    FROM user_prompt_ids up
    LEFT JOIN prompt_stats ps ON ps.prompt_id = up.id
  ),
  fork_agg AS (
    SELECT COUNT(*)::BIGINT AS forks_received
    FROM prompts fork_pr
    WHERE fork_pr.parent_prompt_id IN (SELECT id FROM user_prompt_ids)
      AND fork_pr.is_deleted = false
  )
  SELECT
    a.total_prompts,
    a.total_score,
    f.forks_received,
    a.total_copies,
    a.total_views,
    a.total_works,
    a.total_fails,
    CASE
      WHEN (a.total_works + a.total_fails) = 0 THEN 0::NUMERIC
      ELSE ROUND(a.total_works::NUMERIC / (a.total_works + a.total_fails) * 100, 1)
    END AS success_rate
  FROM agg a, fork_agg f;
END;
$$;

GRANT EXECUTE ON FUNCTION get_profile_stats TO anon, authenticated;

-- 5. Create get_user_activity RPC
CREATE OR REPLACE FUNCTION get_user_activity(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  activity_id UUID,
  type TEXT,
  entity_type TEXT,
  entity_id UUID,
  entity_title TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  (
    -- Real user_activity rows
    SELECT
      ua.id,
      ua.type,
      ua.entity_type,
      ua.entity_id,
      COALESCE(pr.title, '') AS entity_title,
      ua.metadata,
      ua.created_at
    FROM user_activity ua
    LEFT JOIN prompts pr ON pr.id = ua.entity_id
    WHERE ua.user_id = p_user_id
  )
  UNION ALL
  (
    -- Synthesized: prompt created
    SELECT
      pr.id,
      'prompt_created'::TEXT,
      'prompt'::TEXT,
      pr.id,
      pr.title,
      jsonb_build_object('model', pr.model, 'slug', COALESCE(pr.slug, '')),
      pr.created_at
    FROM prompts pr
    WHERE pr.created_by = p_user_id
      AND pr.is_deleted = false
      AND pr.is_listed = true
      AND NOT EXISTS (
        SELECT 1 FROM user_activity ua
        WHERE ua.user_id = p_user_id
          AND ua.type = 'prompt_created'
          AND ua.entity_id = pr.id
      )
  )
  UNION ALL
  (
    -- Synthesized: fork events from prompt_events
    SELECT
      pe.id,
      'prompt_forked'::TEXT,
      'prompt'::TEXT,
      pe.prompt_id,
      pr.title,
      jsonb_build_object('model', pr.model, 'slug', COALESCE(pr.slug, '')),
      pe.created_at
    FROM prompt_events pe
    JOIN prompts pr ON pr.id = pe.prompt_id
    WHERE pe.user_id = p_user_id
      AND pe.event_type = 'fork'
      AND pr.is_deleted = false
      AND NOT EXISTS (
        SELECT 1 FROM user_activity ua
        WHERE ua.user_id = p_user_id
          AND ua.type = 'prompt_forked'
          AND ua.entity_id = pe.prompt_id
          AND DATE_TRUNC('minute', ua.created_at) = DATE_TRUNC('minute', pe.created_at)
      )
  )
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_activity TO anon, authenticated;

-- 6. Update update_profile RPC to include new fields
DROP FUNCTION IF EXISTS update_profile;
CREATE OR REPLACE FUNCTION update_profile(
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_headline TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_website_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = CASE
      WHEN p_avatar_url IS NOT NULL THEN p_avatar_url
      ELSE avatar_url
    END,
    bio = COALESCE(p_bio, bio),
    headline = COALESCE(p_headline, headline),
    location = COALESCE(p_location, location),
    website_url = COALESCE(p_website_url, website_url)
  WHERE id = (SELECT auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION update_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
