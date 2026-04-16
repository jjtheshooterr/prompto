-- Migration: Create is_workspace_member() function
-- Task 2.1: Create is_workspace_member() function
-- Spec: workspace-permission-system
-- 
-- This migration creates the is_workspace_member() helper function that checks
-- if a user is a member of a workspace (any role).

CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
  );
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION is_workspace_member(UUID, UUID) IS 
  'Checks if a user is a member of a workspace (any role). Returns true if membership exists, false otherwise. Used for workspace visibility checks and as a building block for other permission functions.';

RAISE NOTICE 'Created is_workspace_member() function';
