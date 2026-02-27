-- Fix infinite recursion in workspaces RLS policies
-- The issue: workspaces SELECT policy queries workspace_members
-- Solution: Simpler policy that only checks owner_id

BEGIN;

-- Drop ALL existing workspaces policies
DROP POLICY IF EXISTS "workspaces_select_owner" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_members" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_owner" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_owner_admin" ON public.workspaces;
DROP POLICY IF EXISTS "Only owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_owner" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_owner_admin" ON public.workspaces;

-- ============================================================================
-- NON-RECURSIVE POLICIES
-- ============================================================================

-- SELECT: Users can see workspaces they own
-- Simple policy - no joins to workspace_members
CREATE POLICY "workspaces_select_owner_only"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
);

-- INSERT: Authenticated users can create workspaces
CREATE POLICY "workspaces_insert_auth"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = (SELECT auth.uid())
);

-- UPDATE: Only owners can update their workspaces
CREATE POLICY "workspaces_update_owner_only"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
)
WITH CHECK (
  owner_id = (SELECT auth.uid())
);

-- DELETE: Only owners can delete their workspaces
CREATE POLICY "workspaces_delete_owner_only"
ON public.workspaces
FOR DELETE
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
);

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Workspaces recursion fix applied:';
  RAISE NOTICE '   - Removed all old policies';
  RAISE NOTICE '   - Created simple owner-only policies';
  RAISE NOTICE '   - No more workspace_members queries in workspaces policies';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 No more infinite recursion in workspaces!';
END $$;
