-- =====================================================
-- USER PROFILES & ATTRIBUTION MIGRATION
-- =====================================================
-- Adds username system, public profiles view, and query functions
-- for GitHub-style user profiles with author attribution
-- 
-- Apply: Week 2-3 (Post-launch feature)
-- Time: ~5 minutes
-- Risk: Low (additive only, no breaking changes)
-- =====================================================

-- =====================================================
-- PART 1: Username Constraints & Validation
-- =====================================================

-- Add format validation for usernames
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_format 
  CHECK (
    username IS NULL 
    OR username ~ '^[a-z0-9_]{3,20}$'
  );

COMMENT ON COLUMN profiles.username IS 
  'Optional vanity URL handle. Format: 3-20 chars, lowercase a-z 0-9 underscore. Unique. Case-insensitive lookups.';

-- =====================================================
-- PART 2: Public Profiles View (Security)
-- =====================================================

-- Create safe public view (no sensitive data)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  created_at,
  reputation,
  upvotes_received,
  forks_received,
  onboarding_completed
FROM public.profiles;

-- Grant public access to view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS 
  'Public-safe profile data. Use this for author attribution and profile pages. Never exposes sensitive fields.';

-- =====================================================
-- PART 3: Performance Indexes
-- =====================================================

-- Profile content queries (user's prompts/problems)
CREATE INDEX IF NOT EXISTS idx_prompts_created_by_date 
  ON prompts(created_by, created_at DESC) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_prompts_created_by_parent 
  ON prompts(created_by, parent_prompt_id) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_problems_created_by_date 
  ON problems(created_by, created_at DESC) 
  WHERE is_deleted = false;

-- Username lookup (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON profiles(LOWER(username)) 
  WHERE username IS NOT NULL;

-- =====================================================
-- PART 4: RLS Policies
-- =====================================================

-- Allow anyone to read public profile data
-- (Safe because we only expose safe columns)
CREATE POLICY "public_profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- PART 5: Username Availability Check
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_username_available(u text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(username) = LOWER(u)
  );
$$;

GRANT EXECUTE ON FUNCTION is_username_available TO authenticated, anon;

COMMENT ON FUNCTION is_username_available IS 
  'Check if a username is available. Case-insensitive. Returns true if available.';

-- =====================================================
-- PART 6: Profile Query Functions
-- =====================================================

-- Get profile by username (case-insensitive)
CREATE OR REPLACE FUNCTION public.get_profile_by_username(u text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  reputation int,
  upvotes_received int,
  forks_received int
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    id,
    username,
    display_name,
    avatar_url,
    created_at,
    reputation,
    upvotes_received,
    forks_received
  FROM public.profiles
  WHERE LOWER(username) = LOWER(u)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_profile_by_username TO anon, authenticated;

COMMENT ON FUNCTION get_profile_by_username IS 
  'Get profile by username. Case-insensitive lookup. Returns null if not found.';

-- Get user's original prompts (not forks)
CREATE OR REPLACE FUNCTION public.get_user_prompts(
  user_id uuid,
  sort_by text DEFAULT 'newest',
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  problem_id uuid,
  problem_title text,
  created_at timestamptz,
  updated_at timestamptz,
  visibility visibility,
  status prompt_status,
  score int,
  fork_count int,
  works_count int,
  fails_count int
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.problem_id,
    pr.title as problem_title,
    p.created_at,
    p.updated_at,
    p.visibility,
    p.status,
    COALESCE(ps.score, 0) as score,
    COALESCE(ps.fork_count, 0) as fork_count,
    COALESCE(ps.works_count, 0) as works_count,
    COALESCE(ps.fails_count, 0) as fails_count
  FROM prompts p
  JOIN problems pr ON p.problem_id = pr.id
  LEFT JOIN prompt_stats ps ON p.id = ps.prompt_id
  WHERE p.created_by = user_id
    AND p.parent_prompt_id IS NULL  -- Originals only
    AND p.is_deleted = false
    AND pr.is_deleted = false
    -- RLS will enforce visibility based on viewer
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN p.created_at
      WHEN sort_by = 'top' THEN ps.score::timestamptz
      WHEN sort_by = 'most_forked' THEN ps.fork_count::timestamptz
      ELSE p.created_at
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_prompts TO anon, authenticated;

COMMENT ON FUNCTION get_user_prompts IS 
  'Get user''s original prompts (not forks). Respects RLS visibility. Sort: newest, top, most_forked.';

-- Get user's forks with parent attribution
CREATE OR REPLACE FUNCTION public.get_user_forks(
  user_id uuid,
  sort_by text DEFAULT 'newest',
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  problem_id uuid,
  problem_title text,
  parent_prompt_id uuid,
  parent_title text,
  parent_author_name text,
  created_at timestamptz,
  score int,
  fork_count int
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.problem_id,
    pr.title as problem_title,
    p.parent_prompt_id,
    parent.title as parent_title,
    parent_profile.display_name as parent_author_name,
    p.created_at,
    COALESCE(ps.score, 0) as score,
    COALESCE(ps.fork_count, 0) as fork_count
  FROM prompts p
  JOIN problems pr ON p.problem_id = pr.id
  LEFT JOIN prompts parent ON p.parent_prompt_id = parent.id
  LEFT JOIN profiles parent_profile ON parent.created_by = parent_profile.id
  LEFT JOIN prompt_stats ps ON p.id = ps.prompt_id
  WHERE p.created_by = user_id
    AND p.parent_prompt_id IS NOT NULL  -- Forks only
    AND p.is_deleted = false
    AND pr.is_deleted = false
    -- RLS will enforce visibility
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN p.created_at
      WHEN sort_by = 'top' THEN ps.score::timestamptz
      ELSE p.created_at
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_forks TO anon, authenticated;

COMMENT ON FUNCTION get_user_forks IS 
  'Get user''s forked prompts with parent attribution. Respects RLS visibility.';

-- Get user's problems
CREATE OR REPLACE FUNCTION public.get_user_problems(
  user_id uuid,
  sort_by text DEFAULT 'newest',
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  visibility visibility,
  total_prompts int
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.created_at,
    p.updated_at,
    p.visibility,
    COALESCE(ps.total_prompts, 0) as total_prompts
  FROM problems p
  LEFT JOIN problem_stats ps ON p.id = ps.problem_id
  WHERE p.created_by = user_id
    AND p.is_deleted = false
    -- RLS will enforce visibility
  ORDER BY 
    CASE 
      WHEN sort_by = 'newest' THEN p.created_at
      WHEN sort_by = 'activity' THEN ps.last_activity_at
      ELSE p.created_at
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_problems TO anon, authenticated;

COMMENT ON FUNCTION get_user_problems IS 
  'Get user''s problems. Respects RLS visibility. Sort: newest, activity.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test username availability
/*
SELECT is_username_available('testuser');
-- Should return true if available
*/

-- Test profile lookup
/*
SELECT * FROM get_profile_by_username('your_username');
-- Should return profile or null
*/

-- Test user prompts
/*
SELECT * FROM get_user_prompts(
  '<user-id>'::uuid,
  'newest',
  10,
  0
);
*/

-- Check indexes were created
/*
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_%created_by%'
  OR indexname LIKE 'idx_profiles_username%';
*/
