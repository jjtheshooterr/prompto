-- 20260112130000_schema_hardening.sql

BEGIN;

-- ============================================================================
-- 1. Tag Consolidation
-- ============================================================================

-- Function to manage problem tags (used by client)
CREATE OR REPLACE FUNCTION public.manage_problem_tags(p_problem_id UUID, p_tags TEXT[])
RETURNS VOID AS $$
DECLARE
  v_tag_id UUID;
  v_tag_name TEXT;
  v_tag_slug TEXT;
  v_cleaned_tags TEXT[];
BEGIN
  -- 1. Clean and Deduplicate Input Tags
  SELECT array_agg(DISTINCT lower(trim(t))) INTO v_cleaned_tags
  FROM unnest(p_tags) t
  WHERE length(trim(t)) > 0;

  -- 2. Delete tags that are no longer present for this problem
  -- Note: We rely on the text representation in 'tags' table to match
  DELETE FROM public.problem_tags pt
  USING public.tags t
  WHERE pt.tag_id = t.id
  AND pt.problem_id = p_problem_id
  AND (v_cleaned_tags IS NULL OR t.name != ALL(v_cleaned_tags));

  -- 3. Insert and Link New Tags
  IF v_cleaned_tags IS NOT NULL THEN
    FOREACH v_tag_name IN ARRAY v_cleaned_tags LOOP
      -- Generate Slug
      v_tag_slug := coalesce(
        nullif(trim(both '-' from regexp_replace(v_tag_name, '[^a-z0-9]+', '-', 'g')), ''),
        v_tag_name
      );

      -- Get or Create Tag
      INSERT INTO public.tags (name, slug) 
      VALUES (v_tag_name, v_tag_slug) 
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- Dummy update to return ID
      RETURNING id INTO v_tag_id;
      
      -- Link to Problem
      INSERT INTO public.problem_tags (problem_id, tag_id) 
      VALUES (p_problem_id, v_tag_id) 
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.manage_problem_tags(UUID, TEXT[]) TO authenticated;

-- Migrate existing data (Idempotent)
-- Insert unique tags into tags table
INSERT INTO public.tags (name, slug)
SELECT DISTINCT 
  lower(trim(tag_raw)),
  coalesce(
    nullif(trim(both '-' from regexp_replace(lower(trim(tag_raw)), '[^a-z0-9]+', '-', 'g')), ''),
    lower(trim(tag_raw))
  )
FROM public.problems, unnest(tags) tag_raw
WHERE tags IS NOT NULL AND length(trim(tag_raw)) > 0
ON CONFLICT (name) DO NOTHING;

-- Link problems to tags
INSERT INTO public.problem_tags (problem_id, tag_id)
SELECT DISTINCT p.id, t.id
FROM public.problems p, unnest(p.tags) tag_raw
JOIN public.tags t ON t.name = lower(trim(tag_raw))
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. Integrity Constraints
-- ============================================================================

-- Fix Members Primary Key / Uniqueness
-- Ideally PK should be (problem_id, user_id), but if 'id' exists we use UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'problem_members_problem_id_user_id_key') THEN
    ALTER TABLE public.problem_members 
    ADD CONSTRAINT problem_members_problem_id_user_id_key UNIQUE (problem_id, user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_members_workspace_id_user_id_key') THEN
    ALTER TABLE public.workspace_members 
    ADD CONSTRAINT workspace_members_workspace_id_user_id_key UNIQUE (workspace_id, user_id);
  END IF;
END $$;

-- Pinned Prompt Ownership Check
CREATE OR REPLACE FUNCTION public.check_pinned_prompt_problem()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pinned_prompt_id IS NOT NULL THEN
    -- Allow setting to NULL. If not NULL, prompt must exist and belong to problem
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts 
      WHERE id = NEW.pinned_prompt_id 
      AND problem_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Pinned prompt % must belong to problem %', NEW.pinned_prompt_id, NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_pinned_prompt_trigger ON public.problems;
CREATE TRIGGER check_pinned_prompt_trigger
BEFORE INSERT OR UPDATE OF pinned_prompt_id ON public.problems
FOR EACH ROW EXECUTE FUNCTION public.check_pinned_prompt_problem();

-- ============================================================================
-- 3. Indexes
-- ============================================================================

-- Problems
CREATE UNIQUE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(slug);

-- Prompts
CREATE INDEX IF NOT EXISTS idx_prompts_problem_listing 
ON public.prompts(problem_id, is_listed, is_hidden, is_deleted, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_workspace ON public.prompts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prompts_parent ON public.prompts(parent_prompt_id);

-- Votes
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_prompt ON public.votes(prompt_id);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_content ON public.reports(content_type, content_id);

COMMIT;
