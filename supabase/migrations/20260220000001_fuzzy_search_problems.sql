-- 20260220000001_fuzzy_search_problems.sql
-- Problems fuzzy search: pg_trgm + unaccent + materialized view + RPC
-- Mirrors the prompts search pattern from 20260220000000_fuzzy_search.sql

BEGIN;

-- ============================================================================
-- 1. Stable "search document" view (schema contract)
-- ============================================================================

CREATE OR REPLACE VIEW public.search_problems_v1 AS
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
  -- Stable blob: lower+unaccent so trigram % and tsquery both normalize consistently
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

-- ============================================================================
-- 2. Materialized view (indexed, fast to query)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.search_problems_mv CASCADE;

CREATE MATERIALIZED VIEW public.search_problems_mv AS
SELECT
  *,
  to_tsvector('english', search_text) AS search_tsv
FROM public.search_problems_v1;

-- Trigram index: powers similarity() and % (fuzzy / typo tolerance)
CREATE INDEX search_problems_mv_trgm_idx
  ON public.search_problems_mv
  USING GIN (search_text gin_trgm_ops);

-- FTS index: powers @@ and ts_rank_cd (relevance on correct words)
CREATE INDEX search_problems_mv_fts_idx
  ON public.search_problems_mv
  USING GIN (search_tsv);

-- Supporting indexes for filtering
CREATE INDEX search_problems_mv_workspace_idx
  ON public.search_problems_mv (workspace_id);

CREATE INDEX search_problems_mv_visibility_idx
  ON public.search_problems_mv (visibility);

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX search_problems_mv_id_idx
  ON public.search_problems_mv (id);

-- Ownership: ensures SECURITY DEFINER functions can access regardless of invoking role
ALTER MATERIALIZED VIEW public.search_problems_mv OWNER TO postgres;
ALTER VIEW public.search_problems_v1 OWNER TO postgres;

-- ============================================================================
-- 3. RPC: global_search_problems (auth-safe)
-- ============================================================================
-- anon: public-only (workspace param rejected)
-- authenticated: public always + workspace results ONLY if a workspace_members row exists

CREATE OR REPLACE FUNCTION public.global_search_problems(
  q         text,
  workspace uuid    DEFAULT NULL,
  lim       int     DEFAULT 20
)
RETURNS TABLE (
  id         uuid,
  title      text,
  kind       text,
  slug       text,
  tags       text[],
  updated_at timestamptz,
  score      real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      lower(unaccent(trim(q)))                                          AS q_clean,
      websearch_to_tsquery('english', lower(unaccent(trim(q))))         AS tsq,
      auth.uid()                                                        AS uid,
      auth.role()                                                       AS role
  ),
  -- Lower trigram similarity threshold from default 0.3 → 0.25
  -- so short / partial queries still find matches
  limitset AS (SELECT set_limit(0.25)),
  allowed AS (
    SELECT
      p.*,
      CASE
        WHEN workspace IS NULL                THEN true
        WHEN (SELECT uid FROM params) IS NULL THEN false
        ELSE EXISTS (
          SELECT 1
          FROM public.workspace_members wm
          WHERE wm.workspace_id = workspace
            AND wm.user_id = (SELECT uid FROM params)
        )
      END AS is_workspace_member
    FROM params p
  )
  SELECT
    sp.id,
    sp.title,
    'problem'::text AS kind,
    sp.slug,
    sp.tags,
    sp.updated_at,
    (
      0.65 * ts_rank_cd(sp.search_tsv, a.tsq, 1)
      + 0.35 * similarity(sp.search_text, a.q_clean)
    )::real AS score
  FROM public.search_problems_mv sp
  CROSS JOIN allowed a
  CROSS JOIN limitset
  WHERE
    length(a.q_clean) >= 2

    AND sp.is_deleted = false
    AND sp.is_hidden  = false
    AND sp.is_listed  = true

    -- Anon cannot supply a workspace to broaden access
    AND NOT (a.role = 'anon' AND workspace IS NOT NULL)

    -- Visibility gate
    AND (
      sp.visibility = 'public'
      OR (
        workspace IS NOT NULL
        AND a.is_workspace_member = true
        AND sp.workspace_id = workspace
      )
    )

    AND (workspace IS NULL OR sp.workspace_id = workspace)

    AND (
      sp.search_tsv @@ a.tsq
      OR sp.search_text % a.q_clean
    )
  ORDER BY score DESC, sp.updated_at DESC
  LIMIT lim;
$$;

REVOKE ALL ON FUNCTION public.global_search_problems(text, uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.global_search_problems(text, uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION public.global_search_problems(text, uuid, int) TO authenticated;

-- ============================================================================
-- 4. Refresh helper (admin / service_role only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_search_problems_index()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW public.search_problems_mv;
$$;

REVOKE ALL ON FUNCTION public.refresh_search_problems_index() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_search_problems_index() TO service_role;

-- ============================================================================
-- pg_cron refresh (run once after enabling the pg_cron extension):
--
-- select cron.schedule(
--   'refresh-search-problems-mv',
--   '*/5 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY public.search_problems_mv'
-- );
-- ============================================================================

COMMIT;
