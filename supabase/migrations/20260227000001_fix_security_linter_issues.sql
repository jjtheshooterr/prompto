-- Fix security linter ERROR-level issues
-- Remove SECURITY DEFINER from views and add search_path to functions

BEGIN;

-- ============================================================
-- 1. FIX SECURITY DEFINER VIEWS (ERROR LEVEL - CRITICAL)
-- ============================================================
-- Views should use security_invoker=true instead of SECURITY DEFINER

-- Fix search_prompts_v1
DROP VIEW IF EXISTS public.search_prompts_v1 CASCADE;
CREATE VIEW public.search_prompts_v1 
WITH (security_invoker=true) AS
SELECT
  p.id,
  p.workspace_id,
  p.visibility,
  p.is_listed,
  p.is_hidden,
  p.is_deleted,
  p.title,
  coalesce(p.system_prompt, '')            AS system_prompt,
  coalesce(p.user_prompt_template, '')     AS user_prompt_template,
  coalesce(p.notes, '')                    AS notes,
  coalesce(pr.title, '')                   AS problem_title,
  coalesce(pr.slug, '')                    AS problem_slug,
  pr.id                                    AS problem_id,
  coalesce(
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
    '{}'::text[]
  )                                        AS tags,
  p.created_at,
  p.updated_at,
  lower(unaccent(
    coalesce(p.title, '')                || ' ' ||
    coalesce(pr.title, '')               || ' ' ||
    coalesce(p.notes, '')                || ' ' ||
    coalesce(p.system_prompt, '')        || ' ' ||
    coalesce(p.user_prompt_template, '') || ' ' ||
    coalesce(
      string_agg(DISTINCT t.name, ' ') FILTER (WHERE t.name IS NOT NULL),
      ''
    )
  ))                                       AS search_text
FROM public.prompts p
LEFT JOIN public.problems pr     ON pr.id = p.problem_id
LEFT JOIN public.prompt_tags pt  ON pt.prompt_id = p.id
LEFT JOIN public.tags t          ON t.id = pt.tag_id
GROUP BY
  p.id, p.workspace_id, p.visibility, p.is_listed, p.is_hidden, p.is_deleted,
  p.title, p.system_prompt, p.user_prompt_template, p.notes,
  p.created_at, p.updated_at,
  pr.id, pr.title, pr.slug;

-- Fix search_problems_v1
DROP VIEW IF EXISTS public.search_problems_v1 CASCADE;
CREATE VIEW public.search_problems_v1 
WITH (security_invoker=true) AS
SELECT
  pr.id,
  pr.workspace_id,
  pr.visibility,
  pr.is_listed,
  pr.is_hidden,
  pr.is_deleted,
  pr.slug,
  pr.title,
  coalesce(pr.description, '') AS description,
  coalesce(pr.industry, '')    AS industry,
  coalesce(
    array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
    '{}'::text[]
  )                            AS tags,
  pr.created_at,
  pr.updated_at,
  lower(unaccent(
    coalesce(pr.title, '')       || ' ' ||
    coalesce(pr.description, '') || ' ' ||
    coalesce(pr.industry, '')    || ' ' ||
    coalesce(
      string_agg(DISTINCT t.name, ' ') FILTER (WHERE t.name IS NOT NULL),
      ''
    )
  ))                           AS search_text
FROM public.problems pr
LEFT JOIN public.problem_tags prt ON prt.problem_id = pr.id
LEFT JOIN public.tags t           ON t.id = prt.tag_id
GROUP BY
  pr.id, pr.workspace_id, pr.visibility, pr.is_listed, pr.is_hidden, pr.is_deleted,
  pr.slug, pr.title, pr.description, pr.industry,
  pr.created_at, pr.updated_at;

-- Fix prompt_rankings view
DROP VIEW IF EXISTS public.prompt_rankings CASCADE;
CREATE VIEW public.prompt_rankings 
WITH (security_invoker=true) AS
SELECT
  p.id,
  p.problem_id,
  p.title,
  p.slug,
  p.created_by,
  p.created_at,
  p.parent_prompt_id,
  p.root_prompt_id,
  p.depth,
  p.improvement_summary,
  p.best_for,
  p.is_listed,
  p.is_hidden,
  p.is_deleted,
  COALESCE(ps.upvotes, 0) AS upvotes,
  COALESCE(ps.downvotes, 0) AS downvotes,
  COALESCE(ps.fork_count, 0) AS fork_count,
  COALESCE(ps.works_count, 0) AS works_count,
  COALESCE(ps.fails_count, 0) AS fails_count,
  COALESCE(ps.reviews_count, 0) AS reviews_count,
  COALESCE(ps.copy_count, 0) AS copy_count,
  COALESCE(ps.view_count, 0) AS view_count,
  COALESCE(ps.score, 0) AS raw_score,
  (
    COALESCE(ps.upvotes, 0) - COALESCE(ps.downvotes, 0)
    + 2 * COALESCE(ps.works_count, 0)
    - 2 * COALESCE(ps.fails_count, 0)
    + COALESCE(ps.reviews_count, 0)
  ) AS rank_score,
  COALESCE(ps.fork_count, 0) AS improvement_score
FROM public.prompts p
LEFT JOIN public.prompt_stats ps ON p.id = ps.prompt_id
WHERE p.is_deleted = false
  AND p.is_hidden = false
  AND p.is_listed = true;

-- ============================================================
-- 2. FIX FUNCTION SEARCH_PATH (WARN LEVEL)
-- ============================================================

-- Fix tg_set_prompt_lineage
CREATE OR REPLACE FUNCTION public.tg_set_prompt_lineage()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_row public.prompts%ROWTYPE;
BEGIN
  IF NEW.parent_prompt_id IS NOT NULL THEN
    SELECT * INTO parent_row FROM public.prompts WHERE id = NEW.parent_prompt_id;
    IF FOUND THEN
      NEW.root_prompt_id := COALESCE(parent_row.root_prompt_id, parent_row.id);
      NEW.depth := parent_row.depth + 1;
    END IF;
  ELSE
    NEW.root_prompt_id := NULL;
    NEW.depth := 0;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix get_prompt_children
CREATE OR REPLACE FUNCTION public.get_prompt_children(p_prompt_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  improvement_summary text,
  depth integer,
  created_by uuid,
  created_at timestamptz,
  slug text
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, title, improvement_summary, depth, created_by, created_at, slug
  FROM public.prompts
  WHERE parent_prompt_id = p_prompt_id
    AND is_deleted = false
    AND is_hidden = false
  ORDER BY created_at ASC;
$$;

-- Fix get_prompt_lineage
CREATE OR REPLACE FUNCTION public.get_prompt_lineage(p_prompt_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  depth integer,
  slug text
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT id, title, depth, slug, parent_prompt_id
    FROM public.prompts
    WHERE id = p_prompt_id

    UNION ALL

    SELECT p.id, p.title, p.depth, p.slug, p.parent_prompt_id
    FROM public.prompts p
    JOIN ancestors a ON p.id = a.parent_prompt_id
  )
  SELECT id, title, depth, slug
  FROM ancestors
  ORDER BY depth ASC;
$$;

-- Fix immutable_array_to_string
CREATE OR REPLACE FUNCTION public.immutable_array_to_string(text_array text[], delimiter text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT array_to_string(text_array, delimiter);
$$;

-- Recreate materialized views that depend on the fixed views
DROP MATERIALIZED VIEW IF EXISTS public.search_prompts_mv CASCADE;
CREATE MATERIALIZED VIEW public.search_prompts_mv AS
SELECT
  *,
  to_tsvector('english', search_text) AS search_tsv
FROM public.search_prompts_v1;

CREATE INDEX search_prompts_mv_trgm_idx
  ON public.search_prompts_mv
  USING GIN (search_text gin_trgm_ops);

CREATE INDEX search_prompts_mv_fts_idx
  ON public.search_prompts_mv
  USING GIN (search_tsv);

CREATE INDEX search_prompts_mv_workspace_idx
  ON public.search_prompts_mv (workspace_id);

CREATE INDEX search_prompts_mv_visibility_idx
  ON public.search_prompts_mv (visibility);

CREATE UNIQUE INDEX search_prompts_mv_id_idx
  ON public.search_prompts_mv (id);

ALTER MATERIALIZED VIEW public.search_prompts_mv OWNER TO postgres;

-- Recreate search_problems_mv
DROP MATERIALIZED VIEW IF EXISTS public.search_problems_mv CASCADE;
CREATE MATERIALIZED VIEW public.search_problems_mv AS
SELECT
  *,
  to_tsvector('english', search_text) AS search_tsv
FROM public.search_problems_v1;

CREATE INDEX search_problems_mv_trgm_idx
  ON public.search_problems_mv
  USING GIN (search_text gin_trgm_ops);

CREATE INDEX search_problems_mv_fts_idx
  ON public.search_problems_mv
  USING GIN (search_tsv);

CREATE INDEX search_problems_mv_workspace_idx
  ON public.search_problems_mv (workspace_id);

CREATE INDEX search_problems_mv_visibility_idx
  ON public.search_problems_mv (visibility);

CREATE UNIQUE INDEX search_problems_mv_id_idx
  ON public.search_problems_mv (id);

ALTER MATERIALIZED VIEW public.search_problems_mv OWNER TO postgres;

COMMIT;
