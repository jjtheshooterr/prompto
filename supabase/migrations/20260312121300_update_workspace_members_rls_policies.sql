-- Migration: Update workspace_members RLS policies (task 4.1)
-- Spec: workspace-permission-system
-- 
-- This migration updates RLS policies for the workspace_members table to use
-- the new helper functions (can_manage_workspace, can_view_workspace) instead
-- of the old workspaces.owner_id column.
--
-- Policy requirements:
-- - SELECT: All workspace members can view other members in their workspace
-- - INSERT: Only workspace owners/admins can add members
-- - UPDATE: Only workspace owners/admins can update member roles
-- - DELETE: Only workspace owners/admins can remove members

BEGIN;

-- Drop all existing workspace_members policies
DROP POLICY IF EXISTS "workspace_members_select_own" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_v2" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_v2" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_v2" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_v2" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members if they are members" ON public.workspace_members;
DROP POLICY IF EXISTS "Only owners can manage workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_owner_admin" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_owner_admin" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_owner_admin" ON public.workspace_members;

-- ============================================================================
-- NEW RLS POLICIES USING HELPER FUNCTIONS
-- ============================================================================

-- SELECT: All workspace members can view other members in their workspace
-- Uses can_view_workspace() which returns true for any workspace member
CREATE POLICY "workspace_members_select_policy"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  can_view_workspace(workspace_id, auth.uid())
);

-- INSERT: Only workspace owners/admins can add members
-- Uses can_manage_workspace() which returns true for owner/admin roles
CREATE POLICY "workspace_members_insert_policy"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  can_manage_workspace(workspace_id, auth.uid())
);

-- UPDATE: Only workspace owners/admins can update member roles
-- Uses can_manage_workspace() which returns true for owner/admin roles
CREATE POLICY "workspace_members_update_policy"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  can_manage_workspace(workspace_id, auth.uid())
)
WITH CHECK (
  can_manage_workspace(workspace_id, auth.uid())
);

-- DELETE: Only workspace owners/admins can remove members
-- Uses can_manage_workspace() which returns true for owner/admin roles
CREATE POLICY "workspace_members_delete_policy"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  can_manage_workspace(workspace_id, auth.uid())
);

-- Enable RLS on workspace_members table (if not already enabled)
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;

COMMIT;

-- Add comments for documentation
COMMENT ON POLICY "workspace_members_select_policy" ON public.workspace_members IS 
  'Allows all workspace members to view other members in their workspace. Uses can_view_workspace() helper function.';

COMMENT ON POLICY "workspace_members_insert_policy" ON public.workspace_members IS 
  'Allows only workspace owners/admins to add new members. Uses can_manage_workspace() helper function.';

COMMENT ON POLICY "workspace_members_update_policy" ON public.workspace_members IS 
  'Allows only workspace owners/admins to update member roles. Uses can_manage_workspace() helper function.';

COMMENT ON POLICY "workspace_members_delete_policy" ON public.workspace_members IS 
  'Allows only workspace owners/admins to remove members. Uses can_manage_workspace() helper function.';

-- Verification
DO $
BEGIN
  RAISE NOTICE '✅ Workspace members RLS policies updated (task 4.1):';
  RAISE NOTICE '   - Dropped all old policies';
  RAISE NOTICE '   - Created workspace_members_select_policy (uses can_view_workspace)';
  RAISE NOTICE '   - Created workspace_members_insert_policy (uses can_manage_workspace)';
  RAISE NOTICE '   - Created workspace_members_update_policy (uses can_manage_workspace)';
  RAISE NOTICE '   - Created workspace_members_delete_policy (uses can_manage_workspace)';
  RAISE NOTICE '   - Enabled and forced RLS on workspace_members table';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 All workspace members can view members, only owners/admins can manage!';
END $;
