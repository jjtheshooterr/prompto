-- Fix infinite recursion in workspace_members RLS policies
-- The problem: workspace_members policies call is_workspace_member() which queries workspace_members

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view workspace members if they are members" ON public.workspace_members;
DROP POLICY IF EXISTS "Only owners can manage workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_owner_admin" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_owner_admin" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_owner_admin" ON public.workspace_members;

-- Create non-recursive policies that don't call is_workspace_member()

-- SELECT: Users can see workspace members if they are in the same workspace
CREATE POLICY "workspace_members_select"
ON public.workspace_members
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- User can see members of workspaces they belong to
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
  OR
  -- Or if they own the workspace
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = auth.uid()
  )
);

-- INSERT: Only workspace owners and admins can add members
CREATE POLICY "workspace_members_insert"
ON public.workspace_members
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be owner or admin of the workspace
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = auth.uid()
  )
  OR
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- UPDATE: Only workspace owners and admins can update members
CREATE POLICY "workspace_members_update"
ON public.workspace_members
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = auth.uid()
  )
  OR
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = auth.uid()
  )
  OR
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- DELETE: Only workspace owners and admins can remove members
CREATE POLICY "workspace_members_delete"
ON public.workspace_members
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = auth.uid()
  )
  OR
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'workspace_members'
ORDER BY policyname;
