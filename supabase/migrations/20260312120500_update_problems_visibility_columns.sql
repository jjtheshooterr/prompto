-- Migration: Update problems table visibility columns
-- Task 1.6: Update problems table visibility columns
-- Spec: workspace-permission-system
-- 
-- This migration updates the problems table to use the new visibility system:
-- - visibility: 'public', 'workspace', or 'private'
-- - is_listed: controls discoverability
-- - is_hidden: moderation flag
-- - is_deleted: soft delete flag

-- Step 1: Add visibility column if it doesn't exist
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'workspace'
    CHECK (visibility IN ('public', 'workspace', 'private'));

-- Step 2: Add is_listed column if it doesn't exist (keep existing if present)
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN NOT NULL DEFAULT TRUE;

-- Step 3: Add is_hidden column if it doesn't exist
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 4: Add is_deleted column if it doesn't exist
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 5: Add column comments for documentation
COMMENT ON COLUMN problems.visibility IS 'Visibility level: public (anyone if listed), workspace (workspace members only), private (explicit problem members or workspace admins/owners only)';
COMMENT ON COLUMN problems.is_listed IS 'Controls discoverability - whether problem appears in listings and search results';
COMMENT ON COLUMN problems.is_hidden IS 'Moderation flag - hidden by moderators, only visible to workspace/problem admins and owners';
COMMENT ON COLUMN problems.is_deleted IS 'Soft delete flag - marks problem as deleted without removing from database';

-- Step 6: Create index on visibility for filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_problems_visibility 
  ON problems(visibility, is_listed, is_hidden) 
  WHERE NOT is_deleted;

RAISE NOTICE 'Problems table visibility columns updated successfully';
