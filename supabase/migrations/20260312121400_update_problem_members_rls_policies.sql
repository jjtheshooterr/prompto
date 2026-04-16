-- Migration: Update problem_members RLS policies (task 4.2)
-- Spec: workspace-permission-system
-- 
-- This migration updates RLS policies for the problem_members table to use
-- the new helper functions (can_manage_problem, can_view_problem) instead
-- of the old problems.owner_id column.
--
-- Policy requirements:
-- - SELECT: All problem members can view other members of the problem
-- - INSERT: Only problem owners/admins can add members
-- - UPDATE: Only problem owners/admins can update member roles
-- - DELETE: Only problem owners/admins can remove members

BEGIN;

-- Drop all existing problem_members policies
DROP POLICY IF EXISTS "pm_select" ON public.problem_members;
DROP POLICY IF EXISTS "pm_insert" ON public.problem_members;
DROP POLICY IF EXISTS "pm_delete" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_select_policy" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_insert_policy" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_delete_policy" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_select_members" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_insert_owner_admin" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_update_owner_admin" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_delete_owner_admin" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_select_own" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_insert_owner" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_update_owner" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_delete_owner" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_select_v2" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_insert_v2" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_update_v2" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_delete_v2" ON public.problem_members;
DROP POLICY IF EXISTS "problem_members_delete_safe" ON public.problem_members;

-- ============================================================================
-- NEW RLS POLICIES USING HELPER FUNCTIONS
-- ============================================================================

-- SELECT: All problem members can view other members of the problem
-- Uses can_view_problem() which checks if user has access to the problem
CREATE POLICY "problem_members_select_policy"
ON public.problem_members
FOR SELECT
TO authenticated
USING (
  can_view_problem(problem_id, auth.uid())
);

-- INSERT: Only problem owners/admins can add members
-- Uses can_manage_problem() which returns true for owner/admin roles
CREATE POLICY "problem_members_insert_policy"
ON public.problem_members
FOR INSERT
TO authenticated
WITH CHECK (
  can_manage_problem(problem_id, auth.uid())
);

-- UPDATE: Only problem owners/admins can update member roles
-- Uses can_manage_problem() which returns true for owner/admin roles
CREATE POLICY "problem_members_update_policy"
ON public.problem_members
FOR UPDATE
TO authenticated
USING (
  can_manage_problem(problem_id, auth.uid())
)
WITH CHECK (
  can_manage_problem(problem_id, auth.uid())
);

-- DELETE: Only problem owners/admins can remove members
-- Uses can_manage_problem() which returns true for owner/admin roles
CREATE POLICY "problem_members_delete_policy"
ON public.problem_members
FOR DELETE
TO authenticated
USING (
  can_manage_problem(problem_id, auth.uid())
);

-- Enable RLS on problem_members table (if not already enabled)
ALTER TABLE public.problem_members ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners
ALTER TABLE public.problem_members FORCE ROW LEVEL SECURITY;

COMMIT;

-- Add comments for documentation
COMMENT ON POLICY "problem_members_select_policy" ON public.problem_members IS 
  'Allows all problem members to view other members of the problem. Uses can_view_problem() helper function.';

COMMENT ON POLICY "problem_members_insert_policy" ON public.problem_members IS 
  'Allows only problem owners/admins to add new members. Uses can_manage_problem() helper function.';

COMMENT ON POLICY "problem_members_update_policy" ON public.problem_members IS 
  'Allows only problem owners/admins to update member roles. Uses can_manage_problem() helper function.';

COMMENT ON POLICY "problem_members_delete_policy" ON public.problem_members IS 
  'Allows only problem owners/admins to remove members. Uses can_manage_problem() helper function.';

-- Verification
DO $
BEGIN
  RAISE NOTICE '✅ Problem members RLS policies updated (task 4.2):';
  RAISE NOTICE '   - Dropped all old policies';
  RAISE NOTICE '   - Created problem_members_select_policy (uses can_view_problem)';
  RAISE NOTICE '   - Created problem_members_insert_policy (uses can_manage_problem)';
  RAISE NOTICE '   - Created problem_members_update_policy (uses can_manage_problem)';
  RAISE NOTICE '   - Created problem_members_delete_policy (uses can_manage_problem)';
  RAISE NOTICE '   - Enabled and forced RLS on problem_members table';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 All problem members can view members, only owners/admins can manage!';
END $;
