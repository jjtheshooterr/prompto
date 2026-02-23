-- 20260220000000_fuzzy_search.sql
-- Supabase-only fuzzy search: pg_trgm + unaccent + materialized view + RPC
-- No external services required.

BEGIN;

-- ============================================================================
-- 1. Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- 2. Stable "search document" view (schema contract)
-- ============================================================================
-- This view is the stable interface. If the underlying schema changes,
-- only this view changes — the RPC and app code stay the same.

CREATE OR REPLACE VIEW public.search_prompts_v1 AS
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
  -- Stable text blob: lower+unaccent so similarity() and tsquery both normalize consistently
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

-- ============================================================================
-- 3. Materialized view (indexed, fast to query)
-- ============================================================================
-- Adds a pre-computed tsvector so FTS queries don't recompute it per row.
-- Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY public.search_prompts_mv;

DROP MATERIALIZED VIEW IF EXISTS public.search_prompts_mv CASCADE;

CREATE MATERIALIZED VIEW public.search_prompts_mv AS
SELECT
  *,
  to_tsvector('english', search_text) AS search_tsv
FROM public.search_prompts_v1;

-- Trigram index: powers similarity() and % (fuzzy / typo tolerance)
CREATE INDEX search_prompts_mv_trgm_idx
  ON public.search_prompts_mv
  USING GIN (search_text gin_trgm_ops);

-- FTS index: powers @@ and ts_rank_cd (relevance on correct words)
CREATE INDEX search_prompts_mv_fts_idx
  ON public.search_prompts_mv
  USING GIN (search_tsv);

-- Supporting indexes for filtering
CREATE INDEX search_prompts_mv_workspace_idx
  ON public.search_prompts_mv (workspace_id);

CREATE INDEX search_prompts_mv_visibility_idx
  ON public.search_prompts_mv (visibility);

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX search_prompts_mv_id_idx
  ON public.search_prompts_mv (id);

-- Ownership: ensure postgres owns both objects so SECURITY DEFINER functions
-- can access them regardless of invoking role
ALTER MATERIALIZED VIEW public.search_prompts_mv OWNER TO postgres;
ALTER VIEW public.search_prompts_v1 OWNER TO postgres;

-- ============================================================================
-- 4. RPC: global_search_prompts (auth-safe)
-- ============================================================================
-- anon: public-only (workspace param is rejected)
-- authenticated: public always + workspace results ONLY if a workspace_members row exists
-- SECURITY DEFINER is safe here because auth checks are enforced inside the SQL body.

CREATE OR REPLACE FUNCTION public.global_search_prompts(
  q         text,
  workspace uuid    DEFAULT NULL,
  lim       int     DEFAULT 20
)
RETURNS TABLE (
  id            uuid,
  title         text,
  kind          text,
  problem_id    uuid,
  problem_title text,
  problem_slug  text,
  tags          text[],
  updated_at    timestamptz,
  score         real
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
  -- Lower the trigram similarity threshold from the default 0.3 to 0.25
  -- so short / partially-typed queries still get matches.
  -- set_limit() returns the new threshold value; we CROSS JOIN to activate it.
  limitset AS (SELECT set_limit(0.25)),
  allowed AS (
    SELECT
      p.*,
      -- Membership check: only matters when a workspace UUID is supplied
      CASE
        WHEN workspace IS NULL                THEN true   -- public-only search, no workspace check needed
        WHEN (SELECT uid FROM params) IS NULL THEN false  -- anon cannot access any workspace
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
    'prompt'::text AS kind,
    sp.problem_id,
    sp.problem_title,
    sp.problem_slug,
    sp.tags,
    sp.updated_at,
    (
      0.65 * ts_rank_cd(sp.search_tsv, a.tsq, 1)
      + 0.35 * similarity(sp.search_text, a.q_clean)
    )::real AS score
  FROM public.search_prompts_mv sp
  CROSS JOIN allowed a
  CROSS JOIN limitset
  WHERE
    -- Minimum query length
    length(a.q_clean) >= 2

    -- Only active, listed prompts
    AND sp.is_deleted = false
    AND sp.is_hidden  = false
    AND sp.is_listed  = true

    -- Anon cannot supply a workspace to broaden access
    AND NOT (a.role = 'anon' AND workspace IS NOT NULL)

    -- Visibility gate:
    --   public prompts are always visible
    --   workspace-private prompts only if caller is a confirmed member
    AND (
      sp.visibility = 'public'
      OR (
        workspace IS NOT NULL
        AND a.is_workspace_member = true
        AND sp.workspace_id = workspace
      )
    )

    -- When a workspace is provided, scope results to that workspace
    AND (workspace IS NULL OR sp.workspace_id = workspace)

    -- Must match FTS or trigram
    AND (
      sp.search_tsv @@ a.tsq
      OR sp.search_text % a.q_clean
    )
  ORDER BY score DESC, sp.updated_at DESC
  LIMIT lim;
$$;

-- Explicit revoke + re-grant (clean slate)
REVOKE ALL ON FUNCTION public.global_search_prompts(text, uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.global_search_prompts(text, uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION public.global_search_prompts(text, uuid, int) TO authenticated;

-- ============================================================================
-- 5. MV refresh helper — service_role ONLY
-- ============================================================================
-- Intentionally NOT granted to authenticated or anon:
--   • CONCURRENTLY cannot run inside a transaction (RPC = transaction)
--   • Letting users trigger a full MV refresh is a DoS vector
-- Refresh instead via:
--   a) pg_cron (recommended): REFRESH MATERIALIZED VIEW CONCURRENTLY public.search_prompts_mv
--   b) Your server-side admin job using the service_role key

DROP FUNCTION IF EXISTS public.refresh_search_index();

CREATE OR REPLACE FUNCTION public.refresh_search_index()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Non-concurrent refresh (safe inside a transaction / admin call)
  -- For CONCURRENTLY, call via pg_cron or a service_role server job
  REFRESH MATERIALIZED VIEW public.search_prompts_mv;
$$;

REVOKE ALL ON FUNCTION public.refresh_search_index() FROM PUBLIC;
-- Only the Supabase service_role can trigger a refresh
GRANT EXECUTE ON FUNCTION public.refresh_search_index() TO service_role;

COMMIT;
