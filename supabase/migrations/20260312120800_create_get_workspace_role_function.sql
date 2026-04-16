-- Migration: Create get_workspace_role() function
-- Task 2.2: Create get_workspace_role() function
-- Spec: workspace-permission-system
-- 
-- This migration creates the get_workspace_role() helper function that returns
-- a user's role in a workspace, or NULL if not a member.

CREATE OR REPLACE FUNCTION get_workspace_role(p_workspace_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id
  LIMIT 1;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION get_workspace_role(UUID, UUID) IS 
  'Returns the user''s role in a workspace (owner, admin, member, viewer), or NULL if not a member. Used for role-based authorization checks.';

RAISE NOTICE 'Created get_workspace_role() function';
