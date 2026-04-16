-- Migration: Refactor problem_members table to use composite primary key
-- Task 1.1: Create problem_members table with composite PK
-- Spec: workspace-permission-system
-- 
-- This migration transforms the existing problem_members table from using a 
-- surrogate BIGSERIAL id to a composite primary key (problem_id, user_id).
-- This aligns with the workspace permission system design where the natural
-- key is the combination of problem and user.

-- Step 1: Drop the existing primary key constraint on id column
ALTER TABLE problem_members DROP CONSTRAINT IF EXISTS problem_members_pkey;

-- Step 2: Drop the id column (surrogate key)
ALTER TABLE problem_members DROP COLUMN IF EXISTS id;

-- Step 3: Add updated_at column if it doesn't exist
ALTER TABLE problem_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Step 4: Add composite primary key on (problem_id, user_id)
-- Note: The UNIQUE(problem_id, user_id) constraint from the old schema will be replaced by this PK
ALTER TABLE problem_members DROP CONSTRAINT IF EXISTS problem_members_problem_id_user_id_key;
ALTER TABLE problem_members ADD PRIMARY KEY (problem_id, user_id);

-- Step 5: Add table and column comments for documentation
COMMENT ON TABLE problem_members IS 'Problem-level role overrides for users. Explicit problem roles take precedence over inherited workspace roles.';
COMMENT ON COLUMN problem_members.problem_id IS 'Reference to the problem';
COMMENT ON COLUMN problem_members.user_id IS 'Reference to the user (must also be a workspace member)';
COMMENT ON COLUMN problem_members.role IS 'Problem-level role: owner (full control), admin (manage problem), member (submit prompts), viewer (read-only)';
COMMENT ON COLUMN problem_members.created_at IS 'Timestamp when the problem membership was created';
COMMENT ON COLUMN problem_members.updated_at IS 'Timestamp when the problem membership was last updated';
