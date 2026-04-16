-- Migration: Update prompts RLS policies (task 4.4)
-- Spec: workspace-permission-system
-- 
-- This migration updates RLS policies for the prompts table to use the new
-- helper functions. Prompts fully inherit visibility from their parent problem.
-- 
-- Key changes:
-- - SELECT policy uses can_view_problem() (if you can view problem, you can view its prompts)
-- - INSERT policy uses can_submit_prompt() (owner/admin/member can submit, viewer cannot)
-- - UPDATE policy uses can_edit_prompt() which checks:
--   * owner/admin can edit any prompt
--   * member can edit only their own prompts (via created_by)
-- - DELETE policy uses can_manage_prompt() (only owner/admin can delete any prompt)
-- 
-- Authorization rules:
-- - Prompt permissions = Problem permissions (inherited through problem_id)
-- - created_by is attribution + ownership check for limited edit rights
-- - Members can edit only their own prompts (checked via created_by)
-- - Admins/owners can edit any prompt regardless of created_by

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public and unlisted prompts" ON prompts;
DROP POLICY IF EXISTS "Workspace members can create prompts" ON prompts;
DROP POLICY IF EXISTS "Workspace members can update their prompts" ON prompts;
DROP POLICY IF EXISTS "Workspace members can delete their prompts" ON prompts;

-- Drop any other old policies that might exist
DROP POLICY IF EXISTS "prompts_select_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_insert_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_update_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_delete_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_select" ON prompts;
DROP POLICY IF EXISTS "prompts_insert" ON prompts;
DROP POLICY IF EXISTS "prompts_update" ON prompts;
DROP POLICY IF EXISTS "prompts_delete" ON prompts;
DROP POLICY IF EXISTS "prompts_public_select_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_update_owner" ON prompts;
DROP POLICY IF EXISTS "prompts_delete_owner" ON prompts;
DROP POLICY IF EXISTS "prompts_update_delete" ON prompts;
DROP POLICY IF EXISTS "prompts_select_public_or_members" ON prompts;
DROP POLICY IF EXISTS "prompts_insert_authenticated" ON prompts;
DROP POLICY IF EXISTS "prompts_update_owner_admin" ON prompts;
DROP POLICY IF EXISTS "prompts_delete_owner_admin" ON prompts;

-- SELECT policy: Use can_view_problem() helper function
-- Prompts inherit visibility from their parent problem
-- If you can view the problem, you can view its prompts
CREATE POLICY "prompts_select_policy"
  ON prompts
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Check if prompt is not deleted
    NOT is_deleted
    -- Check if user can view the parent problem
    AND can_view_problem(problem_id, auth.uid())
  );

-- INSERT policy: Use can_submit_prompt() helper function
-- owner/admin/member roles can submit prompts
-- viewer role CANNOT submit prompts (read-only)
CREATE POLICY "prompts_insert_policy"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be able to submit prompts to the problem
    can_submit_prompt(problem_id, auth.uid())
    -- Ensure created_by is set to current user
    AND created_by = auth.uid()
  );

-- UPDATE policy: Use can_edit_prompt() helper function
-- owner/admin can edit any prompt
-- member can edit only their own prompts (via created_by)
-- viewer cannot edit any prompts
CREATE POLICY "prompts_update_policy"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if user can edit this specific prompt
    can_edit_prompt(id, auth.uid())
    -- Ensure prompt is not deleted
    AND NOT is_deleted
  )
  WITH CHECK (
    -- Check if user can edit this specific prompt
    can_edit_prompt(id, auth.uid())
    -- Ensure prompt is not deleted
    AND NOT is_deleted
  );

-- DELETE policy: Use can_manage_prompt() helper function
-- Only owner/admin can delete any prompt
-- Members cannot delete prompts (even their own)
CREATE POLICY "prompts_delete_policy"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (
    -- Only owner/admin can manage (delete) prompts
    can_manage_prompt(id, auth.uid())
  );

-- Ensure RLS is enabled on prompts table
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (security best practice)
ALTER TABLE prompts FORCE ROW LEVEL SECURITY;

COMMENT ON POLICY "prompts_select_policy" ON prompts IS 
  'Users can view prompts if they can view the parent problem. Prompts inherit visibility from their parent problem. Uses can_view_problem() helper function.';

COMMENT ON POLICY "prompts_insert_policy" ON prompts IS 
  'Users with owner, admin, or member role can submit prompts. Viewer role is read-only and cannot submit prompts. Uses can_submit_prompt() helper function.';

COMMENT ON POLICY "prompts_update_policy" ON prompts IS 
  'Owner and admin can edit any prompt. Members can edit only their own prompts (checked via created_by). Viewer cannot edit any prompts. Uses can_edit_prompt() helper function.';

COMMENT ON POLICY "prompts_delete_policy" ON prompts IS 
  'Only owner and admin roles can delete prompts. Members cannot delete prompts even if they created them. Uses can_manage_prompt() helper function.';

RAISE NOTICE 'Updated prompts RLS policies (task 4.4)';
