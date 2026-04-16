-- Migration: Create performance indexes (tasks 3.1-3.7)
-- Spec: workspace-permission-system
-- 
-- This migration creates all performance indexes for the permission system.
-- Note: Some indexes may already exist from previous migrations (idx_problems_visibility, idx_prompts_flags)

-- Task 3.1: Workspace membership lookups (most frequent)
CREATE INDEX IF NOT EXISTS idx_workspace_members_lookup 
  ON workspace_members(workspace_id, user_id);

COMMENT ON INDEX idx_workspace_members_lookup IS 
  'Composite index for fast workspace membership lookups. Used by is_workspace_member() and get_workspace_role() functions.';

-- Task 3.2: Problem membership lookups
CREATE INDEX IF NOT EXISTS idx_problem_members_lookup 
  ON problem_members(problem_id, user_id);

COMMENT ON INDEX idx_problem_members_lookup IS 
  'Composite index for fast problem membership lookups. Used by get_explicit_problem_role() function.';

-- Task 3.3: Problem members by user (for dashboard joins, membership listings, invite checks)
CREATE INDEX IF NOT EXISTS idx_problem_members_user 
  ON problem_members(user_id);

COMMENT ON INDEX idx_problem_members_user IS 
  'Index on user_id for finding all problems a user is a member of. Used for user dashboards and membership listings.';

-- Task 3.4: Problem to workspace lookup
CREATE INDEX IF NOT EXISTS idx_problems_workspace 
  ON problems(workspace_id) WHERE NOT is_deleted;

COMMENT ON INDEX idx_problems_workspace IS 
  'Index on workspace_id for finding all problems in a workspace. Partial index excludes deleted problems.';

-- Task 3.5: Prompt to problem lookup
CREATE INDEX IF NOT EXISTS idx_prompts_problem 
  ON prompts(problem_id) WHERE NOT is_deleted;

COMMENT ON INDEX idx_prompts_problem IS 
  'Index on problem_id for finding all prompts for a problem. Partial index excludes deleted prompts.';

-- Task 3.6: Visibility filtering (may already exist from task 1.6)
CREATE INDEX IF NOT EXISTS idx_problems_visibility 
  ON problems(visibility, is_listed, is_hidden) WHERE NOT is_deleted;

COMMENT ON INDEX idx_problems_visibility IS 
  'Composite index for filtering problems by visibility, listing status, and hidden status. Partial index excludes deleted problems.';

-- Task 3.7: Prompt flags filtering (may already exist from task 1.7)
CREATE INDEX IF NOT EXISTS idx_prompts_flags 
  ON prompts(is_listed, is_hidden) WHERE NOT is_deleted;

COMMENT ON INDEX idx_prompts_flags IS 
  'Composite index for filtering prompts by listing and hidden status. Partial index excludes deleted prompts.';

RAISE NOTICE 'Created all performance indexes (tasks 3.1-3.7)';
