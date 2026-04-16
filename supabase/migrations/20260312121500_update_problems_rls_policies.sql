-- Migration: Update problems RLS policies (task 4.3)
-- Spec: workspace-permission-system
-- 
-- This migration updates RLS policies for the problems table to use the new
-- helper functions (can_view_problem, can_edit_problem, can_manage_problem).
-- 
-- Key changes:
-- - SELECT policy uses can_view_problem() which handles:
--   * Public problems: visible to anyone if is_listed=true AND is_hidden=false
--   * Workspace problems: visible to workspace members
--   * Private problems: visible to explicit problem members OR workspace admins/owners
--   * Hidden problems: only visible to workspace admin/owner OR problem admin/owner
-- - INSERT policy requires workspace membership (member+ role can create problems)
-- - UPDATE policy uses can_edit_problem() (only owner/admin can edit problem metadata)
-- - DELETE policy uses can_manage_problem() (only owner/admin can delete)

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public and unlisted problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can create problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can update their problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can delete their problems" ON problems;

-- Drop any other old policies that might exist
DROP POLICY IF EXISTS "problems_select_policy" ON problems;
DROP POLICY IF EXISTS "problems_insert_policy" ON problems;
DROP POLICY IF EXISTS "problems_update_policy" ON problems;
DROP POLICY IF EXISTS "problems_delete_policy" ON problems;
DROP POLICY IF EXISTS "problems_select" ON problems;
DROP POLICY IF EXISTS "problems_insert" ON problems;
DROP POLICY IF EXISTS "problems_update" ON problems;
DROP POLICY IF EXISTS "problems_delete" ON problems;
DROP POLICY IF EXISTS "problems_select_public_or_members" ON problems;
DROP POLICY IF EXISTS "problems_insert_authenticated" ON problems;
DROP POLICY IF EXISTS "problems_update_owner_admin" ON problems;
DROP POLICY IF EXISTS "problems_delete_owner_admin" ON problems;

-- SELECT policy: Use can_view_problem() helper function
-- This handles all visibility rules (public/workspace/private), listing, hidden, and deleted flags
CREATE POLICY "problems_select_policy"
  ON problems
  FOR SELECT
  TO authenticated, anon
  USING (
    can_view_problem(id, auth.uid())
  );

-- INSERT policy: Workspace members (owner/admin/member) can create problems
-- Viewer role CANNOT create problems (read-only)
CREATE POLICY "problems_insert_policy"
  ON problems
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be workspace member with owner, admin, or member role
    -- Viewer role is excluded (read-only)
    get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin', 'member')
    -- Ensure created_by is set to current user
    AND created_by = auth.uid()
  );

-- UPDATE policy: Only owner/admin can edit problem metadata
-- Members can submit prompts but CANNOT edit problem definitions
CREATE POLICY "problems_update_policy"
  ON problems
  FOR UPDATE
  TO authenticated
  USING (
    can_edit_problem(id, auth.uid())
  )
  WITH CHECK (
    can_edit_problem(id, auth.uid())
  );

-- DELETE policy: Only owner/admin can delete problems
-- This is a management operation restricted to owner/admin roles
CREATE POLICY "problems_delete_policy"
  ON problems
  FOR DELETE
  TO authenticated
  USING (
    can_manage_problem(id, auth.uid())
  );

-- Ensure RLS is enabled on problems table
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (security best practice)
ALTER TABLE problems FORCE ROW LEVEL SECURITY;

COMMENT ON POLICY "problems_select_policy" ON problems IS 
  'Users can view problems based on visibility (public/workspace/private), listing status, hidden status, and role. Uses can_view_problem() helper function.';

COMMENT ON POLICY "problems_insert_policy" ON problems IS 
  'Workspace members with owner, admin, or member role can create problems. Viewer role is read-only and cannot create problems.';

COMMENT ON POLICY "problems_update_policy" ON problems IS 
  'Only owner and admin roles can edit problem metadata. Members can submit prompts but cannot edit problem definitions. Uses can_edit_problem() helper function.';

COMMENT ON POLICY "problems_delete_policy" ON problems IS 
  'Only owner and admin roles can delete problems. Uses can_manage_problem() helper function.';

RAISE NOTICE 'Updated problems RLS policies (task 4.3)';
