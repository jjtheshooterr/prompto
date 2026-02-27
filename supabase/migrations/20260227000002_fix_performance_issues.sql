-- Fix performance linter issues
-- 1. Remove duplicate RLS policies (WARN level - performance)
-- 2. Drop duplicate indexes (WARN level - performance)
-- 3. Add missing index for foreign key (INFO level - performance)

BEGIN;

-- ============================================================
-- 1. FIX MULTIPLE PERMISSIVE POLICIES (WARN LEVEL)
-- ============================================================
-- Multiple permissive policies for the same role/action hurt performance
-- Combine them into single policies

-- Fix workspace_members policies - drop old ones and keep the new non-recursive ones
DROP POLICY IF EXISTS "Only owners can manage workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members if they are members" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_owner_admin" ON public.workspace_members;

-- The workspace_members_select, workspace_members_insert, workspace_members_update, 
-- workspace_members_delete policies from the previous migration are already correct

-- Fix prompts policies - combine prompts_update and prompts_delete
DROP POLICY IF EXISTS "prompts_update" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete" ON public.prompts;

-- Create combined policy for UPDATE and DELETE
CREATE POLICY "prompts_update_delete"
ON public.prompts
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  -- User is the creator
  created_by = auth.uid()
  OR
  -- User is workspace owner
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE owner_id = auth.uid()
  )
  OR
  -- User is workspace admin/owner member
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  -- Same check for updates
  created_by = auth.uid()
  OR
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

-- ============================================================
-- 2. DROP DUPLICATE INDEXES (WARN LEVEL)
-- ============================================================
-- Keep the more descriptive named index, drop the duplicate
-- Note: Some indexes back constraints and cannot be dropped directly

-- prompt_reviews: Both indexes are identical, one backs a constraint
-- Drop the constraint first, then recreate with the better-named index
ALTER TABLE public.prompt_reviews DROP CONSTRAINT IF EXISTS prompt_reviews_prompt_id_user_id_key;
DROP INDEX IF EXISTS public.prompt_reviews_user_prompt_unique;
-- Recreate as a unique constraint (which creates an index automatically)
ALTER TABLE public.prompt_reviews 
ADD CONSTRAINT prompt_reviews_user_prompt_unique 
UNIQUE (prompt_id, user_id);

-- prompts: Keep idx_prompts_created_by_created_at, drop idx_prompts_created_by_date
DROP INDEX IF EXISTS public.idx_prompts_created_by_date;

-- prompts: Keep idx_prompts_parent_prompt_id_created_at, drop idx_prompts_forks
DROP INDEX IF EXISTS public.idx_prompts_forks;

-- reports: Keep idx_reports_content_type_content_id, drop idx_reports_content
DROP INDEX IF EXISTS public.idx_reports_content;

-- reports: Keep idx_reports_reporter_id, drop idx_reports_reporter
DROP INDEX IF EXISTS public.idx_reports_reporter;

-- reports: Keep idx_reports_status_created_at, drop idx_reports_status_date
DROP INDEX IF EXISTS public.idx_reports_status_date;

-- username_history: Keep idx_username_history_user_id, drop idx_username_history_user_changed
DROP INDEX IF EXISTS public.idx_username_history_user_changed;

-- ============================================================
-- 3. ADD MISSING FOREIGN KEY INDEX (INFO LEVEL)
-- ============================================================
-- Foreign key without index can cause performance issues on deletes/updates

-- Add index for prompts.root_prompt_id foreign key
CREATE INDEX IF NOT EXISTS idx_prompts_root_prompt_id 
ON public.prompts(root_prompt_id) 
WHERE root_prompt_id IS NOT NULL;

COMMIT;
