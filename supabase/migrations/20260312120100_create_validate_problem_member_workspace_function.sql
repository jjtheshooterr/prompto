-- Migration: Create validate_problem_member_workspace() trigger function
-- Task 1.2: Create validate_problem_member_workspace() trigger function
-- Spec: workspace-permission-system
-- 
-- This migration creates a trigger function that validates workspace membership
-- before allowing problem membership. This enforces the core constraint that
-- users must be workspace members before they can become problem members.

CREATE OR REPLACE FUNCTION validate_problem_member_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM problems p
    JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = NEW.problem_id AND wm.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User must be workspace member before becoming problem member';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add function comment for documentation
COMMENT ON FUNCTION validate_problem_member_workspace() IS 'Trigger function that validates workspace membership prerequisite before allowing problem membership. Ensures users cannot be added as problem members unless they are already workspace members.';
