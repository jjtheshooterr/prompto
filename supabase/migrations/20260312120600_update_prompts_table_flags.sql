-- Migration: Update prompts table flags
-- Task 1.7: Update prompts table flags (remove visibility, add is_listed/is_hidden/is_deleted)
-- Spec: workspace-permission-system
-- 
-- This migration updates the prompts table to remove the visibility column
-- (prompts inherit visibility from their parent problem) and adds the new
-- flag columns for listing, moderation, and soft deletion.

-- Step 1: Drop visibility column if it exists (prompts inherit from problem)
ALTER TABLE prompts
  DROP COLUMN IF EXISTS visibility;

-- Step 2: Add is_listed column if it doesn't exist (keep existing if present)
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN NOT NULL DEFAULT TRUE;

-- Step 3: Add is_hidden column if it doesn't exist
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 4: Add is_deleted column if it doesn't exist
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 5: Add column comments for documentation
COMMENT ON COLUMN prompts.is_listed IS 'Controls discoverability - whether prompt appears in listings and search results';
COMMENT ON COLUMN prompts.is_hidden IS 'Moderation flag - hidden by moderators';
COMMENT ON COLUMN prompts.is_deleted IS 'Soft delete flag - marks prompt as deleted without removing from database';

-- Step 6: Create index on flags for filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_prompts_flags 
  ON prompts(is_listed, is_hidden) 
  WHERE NOT is_deleted;

RAISE NOTICE 'Prompts table flags updated successfully - visibility removed, flags added';
