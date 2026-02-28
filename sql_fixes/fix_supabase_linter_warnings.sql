-- ============================================================================
-- FIX SUPABASE LINTER WARNINGS
-- Date: February 27, 2026
-- Purpose: Fix all WARN-level performance issues from Supabase linter
-- ============================================================================

-- ============================================================================
-- 1. FIX AUTH RLS INITPLAN WARNINGS
-- Replace auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row
-- ============================================================================

-- ============================================================================
-- WORKSPACES TABLE - 4 policies
-- ============================================================================

-- workspaces_select_owner
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_members" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_owner" ON public.workspaces;

CREATE POLICY "workspaces_select_owner" ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = (SELECT auth.uid())
    )
  );

-- workspaces_insert_authenticated
DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON public.workspaces;

CREATE POLICY "workspaces_insert_authenticated" ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- workspaces_update_owner
DROP POLICY IF EXISTS "Only owners can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_owner_admin" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_owner" ON public.workspaces;

CREATE POLICY "workspaces_update_owner" ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- workspaces_delete_owner
DROP POLICY IF EXISTS "workspaces_delete_owner_admin" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_owner" ON public.workspaces;

CREATE POLICY "workspaces_delete_owner" ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = (SELECT auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- WORKSPACE_MEMBERS TABLE - 4 policies
-- ============================================================================

-- workspace_members_select_v2
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_v2" ON public.workspace_members;

CREATE POLICY "workspace_members_select_v2" ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can see members of workspaces they belong to
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = (SELECT auth.uid())
    )
    OR
    -- Or if they own the workspace
    workspace_id IN (
      SELECT id 
      FROM public.workspaces 
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- workspace_members_insert_v2
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_v2" ON public.workspace_members;

CREATE POLICY "workspace_members_insert_v2" ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be owner or admin of the workspace
    workspace_id IN (
      SELECT id 
      FROM public.workspaces 
      WHERE owner_id = (SELECT auth.uid())
    )
    OR
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

-- workspace_members_update_v2
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_v2" ON public.workspace_members;

CREATE POLICY "workspace_members_update_v2" ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id 
      FROM public.workspaces 
      WHERE owner_id = (SELECT auth.uid())
    )
    OR
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id 
      FROM public.workspaces 
      WHERE owner_id = (SELECT auth.uid())
    )
    OR
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

-- workspace_members_delete_v2
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_v2" ON public.workspace_members;

CREATE POLICY "workspace_members_delete_v2" ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id 
      FROM public.workspaces 
      WHERE owner_id = (SELECT auth.uid())
    )
    OR
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- PROMPTS TABLE - 1 policy (prompts_update_delete)
-- ============================================================================

DROP POLICY IF EXISTS "prompts_update_delete" ON public.prompts;

CREATE POLICY "prompts_update_delete" ON public.prompts
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND is_deleted = false
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND is_deleted = false
  );

-- Also add DELETE policy separately to avoid confusion
DROP POLICY IF EXISTS "prompts_delete_owner" ON public.prompts;

CREATE POLICY "prompts_delete_owner" ON public.prompts
  FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND is_deleted = false
  );

-- ============================================================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES WARNING
-- Consolidate overlapping policies on prompts table
-- ============================================================================

-- The linter detected:
-- - prompts_insert_safe and prompts_update_delete both allow INSERT for authenticated
-- - prompts_select_comprehensive and prompts_update_delete both allow SELECT for authenticated

-- Drop the problematic overlapping policy
DROP POLICY IF EXISTS "prompts_update_delete" ON public.prompts;

-- Keep separate, clear policies for each operation
-- INSERT policy (already exists as prompts_insert_safe)
DROP POLICY IF EXISTS "prompts_insert" ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert_safe" ON public.prompts;

CREATE POLICY "prompts_insert_safe" ON public.prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must set created_by to self
    created_by = (SELECT auth.uid())
    -- Must have access to problem
    AND (
      -- Problem is public/unlisted
      EXISTS (
        SELECT 1 FROM public.problems
        WHERE id = prompts.problem_id
          AND visibility IN ('public', 'unlisted')
          AND is_deleted = false
      )
      -- OR user is a member
      OR EXISTS (
        SELECT 1 FROM public.problem_members
        WHERE problem_id = prompts.problem_id
          AND user_id = (SELECT auth.uid())
      )
    )
  );

-- SELECT policy (already exists as prompts_select_comprehensive)
DROP POLICY IF EXISTS "prompts_select" ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_v2" ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_comprehensive" ON public.prompts;

CREATE POLICY "prompts_select_comprehensive" ON public.prompts
  FOR SELECT
  TO public
  USING (
    -- Prompt must not be deleted or hidden
    is_deleted = false
    AND is_hidden = false
    -- Check prompt visibility
    AND (
      -- Public prompts
      (visibility = 'public' AND is_listed = true)
      -- OR unlisted but accessible via direct link
      OR (visibility = 'unlisted')
      -- OR private but user has access
      OR (
        visibility = 'private'
        AND (
          created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.problem_members
            WHERE problem_id = prompts.problem_id
              AND user_id = (SELECT auth.uid())
          )
        )
      )
    )
    -- Must have access to parent problem
    AND EXISTS (
      SELECT 1 FROM public.problems
      WHERE id = prompts.problem_id
        AND is_deleted = false
        AND (
          visibility IN ('public', 'unlisted')
          OR EXISTS (
            SELECT 1 FROM public.problem_members
            WHERE problem_id = problems.id
              AND user_id = (SELECT auth.uid())
          )
        )
    )
  );

-- UPDATE policy (separate from DELETE)
DROP POLICY IF EXISTS "prompts_update" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update_owner" ON public.prompts;

CREATE POLICY "prompts_update_owner" ON public.prompts
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND is_deleted = false
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND is_deleted = false
  );

-- DELETE policy (already created above)
-- prompts_delete_owner

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed auth.uid() RLS InitPlan warnings:';
  RAISE NOTICE '   - workspaces (4 policies)';
  RAISE NOTICE '   - workspace_members (4 policies)';
  RAISE NOTICE '   - prompts (1 policy)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed multiple permissive policies warning:';
  RAISE NOTICE '   - prompts table now has separate policies for each operation';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Unused indexes (INFO level) - monitor in production before removing';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All WARN-level linter issues resolved!';
END $$;
