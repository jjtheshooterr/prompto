-- 20260112150000_schema_hardening_part_2.sql
-- Schema Hardening Phase 2: Constraints, Ownership, References, Indexes

BEGIN;

-- ============================================================================
-- 1. Prompt Slug Uniqueness
-- ============================================================================

-- Populate NULL slugs with generated values from title
UPDATE public.prompts
SET slug = lower(regexp_replace(
  regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
)) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Make slug NOT NULL
ALTER TABLE public.prompts ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint for workspace-scoped prompt slugs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prompts_workspace_id_slug_key') THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT prompts_workspace_id_slug_key UNIQUE (workspace_id, slug);
  END IF;
END $$;

-- ============================================================================
-- 2. Ownership Consistency Triggers
-- ============================================================================

-- Function to ensure problem owner is a member
CREATE OR REPLACE FUNCTION public.ensure_problem_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  -- When owner_id changes, ensure the new owner is a member with role='owner'
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.problem_members (problem_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (problem_id, user_id) 
    DO UPDATE SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure workspace owner is a member
CREATE OR REPLACE FUNCTION public.ensure_workspace_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  -- When owner_id changes, ensure the new owner is a member with role='owner'
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS ensure_problem_owner_member_trigger ON public.problems;
CREATE TRIGGER ensure_problem_owner_member_trigger
AFTER INSERT OR UPDATE OF owner_id ON public.problems
FOR EACH ROW EXECUTE FUNCTION public.ensure_problem_owner_member();

DROP TRIGGER IF EXISTS ensure_workspace_owner_member_trigger ON public.workspaces;
CREATE TRIGGER ensure_workspace_owner_member_trigger
AFTER INSERT OR UPDATE OF owner_id ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.ensure_workspace_owner_member();

-- ============================================================================
-- 3. Standardize User References (deleted_by -> auth.users)
-- ============================================================================

-- Drop old constraints referencing profiles
ALTER TABLE public.prompts DROP CONSTRAINT IF EXISTS prompts_deleted_by_fkey;
ALTER TABLE public.problems DROP CONSTRAINT IF EXISTS problems_deleted_by_fkey;

-- Add new constraints referencing auth.users
ALTER TABLE public.prompts 
ADD CONSTRAINT prompts_deleted_by_fkey 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.problems 
ADD CONSTRAINT problems_deleted_by_fkey 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. Add Missing Indexes
-- ============================================================================

-- Stats sorting indexes
CREATE INDEX IF NOT EXISTS idx_prompt_stats_score 
ON public.prompt_stats(score DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_stats_fork_count 
ON public.prompt_stats(fork_count DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_stats_updated_at 
ON public.prompt_stats(updated_at DESC);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag_id 
ON public.problem_tags(tag_id);

-- Reports moderation queue
CREATE INDEX IF NOT EXISTS idx_reports_status_created 
ON public.reports(status, created_at DESC);

COMMIT;
