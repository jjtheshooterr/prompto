-- Migration: Add NOT NULL constraint to problems.workspace_id
-- Task 1.5: Add NOT NULL constraint to problems.workspace_id (after backfill)
-- Spec: workspace-permission-system
-- 
-- This migration adds the NOT NULL constraint to problems.workspace_id after
-- the backfill in task 1.4 has completed. This ensures all problems must
-- belong to a workspace.

-- Step 1: Verify no NULL values exist before adding constraint
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM problems
  WHERE workspace_id IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: % problems still have NULL workspace_id. Run backfill migration first.', v_null_count;
  END IF;
  
  RAISE NOTICE 'Verification passed: No NULL workspace_id values found';
END;
$$;

-- Step 2: Add NOT NULL constraint
ALTER TABLE problems
  ALTER COLUMN workspace_id SET NOT NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN problems.workspace_id IS 'Reference to the workspace that contains this problem. Required - all problems must belong to a workspace.';

RAISE NOTICE 'NOT NULL constraint added to problems.workspace_id successfully';
