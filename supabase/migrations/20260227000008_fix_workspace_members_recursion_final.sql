-- Final fix for workspace_members infinite recursion
-- The issue: SELECT policy queries workspace_members which causes recursion
-- Solution: Use a simpler policy that doesn't query workspace_members in the SELECT

BEGIN;

-- Drop ALL existing workspace_members policies
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

-- ============================================================================
-- NON-RECURSIVE POLICIES
-- ============================================================================

-- SELECT: Allow users to see their own membership records
-- This avoids recursion by not querying workspace_members
CREATE POLICY "workspace_members_select_own"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  -- User can see their own membership records
  user_id = (SELECT auth.uid())
  OR
  -- Or if they own the workspace (check workspaces table directly)
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = (SELECT auth.uid())
  )
);

-- INSERT: Only workspace owners can add members
CREATE POLICY "workspace_members_insert_owner"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only workspace owner can add members
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = (SELECT auth.uid())
  )
);

-- UPDATE: Only workspace owners can update members
CREATE POLICY "workspace_members_update_owner"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = (SELECT auth.uid())
  )
);

-- DELETE: Only workspace owners can remove members
CREATE POLICY "workspace_members_delete_owner"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = (SELECT auth.uid())
  )
);

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Workspace members recursion fix applied:';
  RAISE NOTICE '   - Removed all old policies';
  RAISE NOTICE '   - Created non-recursive policies';
  RAISE NOTICE '   - SELECT: Users can see own memberships + workspace owners see all';
  RAISE NOTICE '   - INSERT/UPDATE/DELETE: Only workspace owners';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 No more infinite recursion!';
END $$;
