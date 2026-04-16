-- Migration: Create validate_problem_member_workspace_trigger
-- Task 1.3: Create validate_problem_member_workspace_trigger
-- Spec: workspace-permission-system
-- 
-- This migration creates a trigger that calls the validate_problem_member_workspace()
-- function to enforce workspace membership prerequisite before allowing problem membership.
-- The trigger fires BEFORE INSERT OR UPDATE on problem_members table.

CREATE TRIGGER validate_problem_member_workspace_trigger
  BEFORE INSERT OR UPDATE ON problem_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_problem_member_workspace();

-- Add comment for documentation
COMMENT ON TRIGGER validate_problem_member_workspace_trigger ON problem_members IS 'Enforces workspace membership prerequisite: users must be workspace members before becoming problem members. Calls validate_problem_member_workspace() function.';
