-- Performance & Security Migration
-- Addresses: RLS optimization, missing indexes, query performance

-- ============================================================================
-- PART 1: RLS POLICY OPTIMIZATION
-- Replace auth.uid() with (select auth.uid()) for better performance
-- ============================================================================

-- Note: We already optimized most policies in week2_performance_optimizations.sql
-- This section adds any remaining optimizations

-- ============================================================================
-- PART 2: ADD MISSING INDEXES FOR MEMBERSHIP LOOKUPS
-- ============================================================================

-- Workspace members lookup (for RLS checks)
CREATE INDEX IF NOT EXISTS idx_workspace_members_lookup 
ON workspace_members(workspace_id, user_id) 
WHERE deleted_at IS NULL;

-- Problem members lookup (for RLS checks)
CREATE INDEX IF NOT EXISTS idx_problem_members_lookup 
ON problem_members(problem_id, user_id);

-- ============================================================================
-- PART 3: FEED QUERY PERFORMANCE INDEXES
-- ============================================================================

-- For browsing prompts by various sort orders
CREATE INDEX IF NOT EXISTS idx_prompts_public_feed 
ON prompts(is_listed, is_hidden, is_deleted, visibility, created_at DESC) 
WHERE is_deleted = false;

-- For problem-specific prompt lists
CREATE INDEX IF NOT EXISTS idx_prompts_by_problem 
ON prompts(problem_id, is_listed, is_hidden, is_deleted, created_at DESC) 
WHERE is_deleted = false;

-- For user's own prompts
CREATE INDEX IF NOT EXISTS idx_prompts_by_creator 
ON prompts(created_by, created_at DESC) 
WHERE is_deleted = false;

-- For fork relationships
CREATE INDEX IF NOT EXISTS idx_prompts_forks 
ON prompts(parent_prompt_id, created_at DESC) 
WHERE parent_prompt_id IS NOT NULL AND is_deleted = false;

-- For problems feed
CREATE INDEX IF NOT EXISTS idx_problems_public_feed 
ON problems(is_listed, is_hidden, is_deleted, created_at DESC) 
WHERE is_deleted = false;

-- ============================================================================
-- PART 4: STATS TABLE INDEXES FOR SORTING
-- ============================================================================

-- For sorting prompts by upvotes/score
CREATE INDEX IF NOT EXISTS idx_prompt_stats_upvotes 
ON prompt_stats(upvotes DESC, prompt_id);

-- For sorting prompts by fork count
CREATE INDEX IF NOT EXISTS idx_prompt_stats_forks 
ON prompt_stats(fork_count DESC, prompt_id);

-- For sorting prompts by views
CREATE INDEX IF NOT EXISTS idx_prompt_stats_views 
ON prompt_stats(view_count DESC, prompt_id);

-- ============================================================================
-- PART 5: PROFILE LOOKUPS (for author attribution)
-- ============================================================================

-- Username lookups (already exists but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username) 
WHERE username IS NOT NULL;

-- ============================================================================
-- PART 6: EVENTS TABLE CLEANUP (for rate limiting data)
-- ============================================================================

-- Index for cleaning up old events
CREATE INDEX IF NOT EXISTS idx_prompt_events_cleanup 
ON prompt_events(created_at) 
WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================================================
-- PART 7: ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE prompts;
ANALYZE prompt_stats;
ANALYZE problems;
ANALYZE profiles;
ANALYZE workspace_members;
ANALYZE problem_members;
ANALYZE prompt_events;
