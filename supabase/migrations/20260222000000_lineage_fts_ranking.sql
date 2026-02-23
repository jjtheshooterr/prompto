-- ============================================================
-- Migration: Fork Lineage + Full-Text Search + Ranking View
-- ============================================================

BEGIN;

-- ============================================================
-- 1. FORK LINEAGE
-- Add root_prompt_id and depth to prompts
-- ============================================================

ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS root_prompt_id uuid REFERENCES public.prompts(id),
  ADD COLUMN IF NOT EXISTS depth integer NOT NULL DEFAULT 0;

-- Trigger function: set root_prompt_id and depth on insert
CREATE OR REPLACE FUNCTION public.tg_set_prompt_lineage()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_row public.prompts%ROWTYPE;
BEGIN
  IF NEW.parent_prompt_id IS NOT NULL THEN
    SELECT * INTO parent_row FROM public.prompts WHERE id = NEW.parent_prompt_id;
    IF FOUND THEN
      -- root is parent's root (or parent itself if parent is a root)
      NEW.root_prompt_id := COALESCE(parent_row.root_prompt_id, parent_row.id);
      NEW.depth := parent_row.depth + 1;
    END IF;
  ELSE
    -- Original prompts: no root, depth 0
    NEW.root_prompt_id := NULL;
    NEW.depth := 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_prompt_lineage
  BEFORE INSERT ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_prompt_lineage();

-- Backfill existing forks (BFS order via recursive CTE)
WITH RECURSIVE lineage AS (
  -- Base: direct children of root prompts
  SELECT
    p.id,
    p.parent_prompt_id,
    COALESCE(parent.root_prompt_id, parent.id) AS root_prompt_id,
    parent.depth + 1 AS depth
  FROM public.prompts p
  JOIN public.prompts parent ON p.parent_prompt_id = parent.id
  WHERE p.parent_prompt_id IS NOT NULL
    AND parent.parent_prompt_id IS NULL  -- parent is a root

  UNION ALL

  -- Recursive: children of already-resolved forks
  SELECT
    p.id,
    p.parent_prompt_id,
    l.root_prompt_id,
    l.depth + 1
  FROM public.prompts p
  JOIN lineage l ON p.parent_prompt_id = l.id
)
UPDATE public.prompts p
SET
  root_prompt_id = l.root_prompt_id,
  depth = l.depth
FROM lineage l
WHERE p.id = l.id;

-- Helper: get direct children (forks) of a prompt
CREATE OR REPLACE FUNCTION public.get_prompt_children(p_prompt_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  improvement_summary text,
  depth integer,
  created_by uuid,
  created_at timestamptz,
  slug text
) LANGUAGE sql STABLE AS $$
  SELECT
    id, title, improvement_summary, depth, created_by, created_at, slug
  FROM public.prompts
  WHERE parent_prompt_id = p_prompt_id
    AND is_deleted = false
    AND is_hidden = false
  ORDER BY created_at ASC;
$$;

-- Helper: get ancestor chain up to root
CREATE OR REPLACE FUNCTION public.get_prompt_lineage(p_prompt_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  depth integer,
  slug text
) LANGUAGE sql STABLE AS $$
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


-- ============================================================
-- 2. FULL-TEXT SEARCH
-- Generated tsvector columns + GIN indexes
-- ============================================================

-- Helper: Immutable wrapper for array_to_string (required for generated columns)
CREATE OR REPLACE FUNCTION public.immutable_array_to_string(text_array text[], delimiter text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT array_to_string(text_array, delimiter);
$$;

-- prompts FTS: title + notes + improvement_summary + best_for
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english'::regconfig,
        coalesce(title, '') || ' ' ||
        coalesce(notes, '') || ' ' ||
        coalesce(improvement_summary, '') || ' ' ||
        coalesce(public.immutable_array_to_string(best_for, ' '), '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS prompts_fts_idx ON public.prompts USING GIN(fts);

-- problems FTS: title + description + goal
ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english'::regconfig,
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(goal, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS problems_fts_idx ON public.problems USING GIN(fts);


-- ============================================================
-- 3. RANKING VIEW
-- score = (upvotes - downvotes) + 2*works - 2*fails + reviews
-- ============================================================

CREATE OR REPLACE VIEW public.prompt_rankings AS
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
  -- Weighted ranking score
  (
    COALESCE(ps.upvotes, 0) - COALESCE(ps.downvotes, 0)
    + 2 * COALESCE(ps.works_count, 0)
    - 2 * COALESCE(ps.fails_count, 0)
    + COALESCE(ps.reviews_count, 0)
  ) AS rank_score,
  -- Most improved: forks gained recently
  COALESCE(ps.fork_count, 0) AS improvement_score
FROM public.prompts p
LEFT JOIN public.prompt_stats ps ON p.id = ps.prompt_id
WHERE p.is_deleted = false
  AND p.is_hidden = false
  AND p.is_listed = true;

COMMIT;
