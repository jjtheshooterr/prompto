-- Fix security warnings from migration 20260227000005
-- 1. Enable RLS on materialized_view_refresh_log
-- 2. Add search_path to new functions
-- 3. Revoke public access from materialized views (they're internal)

BEGIN;

-- ============================================================================
-- 1. ENABLE RLS ON MATERIALIZED_VIEW_REFRESH_LOG
-- ============================================================================
-- This table is for internal use only, not exposed to users

ALTER TABLE public.materialized_view_refresh_log ENABLE ROW LEVEL SECURITY;

-- Only allow the refresh function to access this table
CREATE POLICY "refresh_log_internal_only"
ON public.materialized_view_refresh_log
FOR ALL
TO postgres, service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. ADD SEARCH_PATH TO NEW FUNCTIONS
-- ============================================================================

-- Fix get_prompts_last_modified
CREATE OR REPLACE FUNCTION public.get_prompts_last_modified()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT GREATEST(
    COALESCE(MAX(updated_at), '-infinity'::timestamptz),
    COALESCE(MAX(created_at), '-infinity'::timestamptz)
  )
  FROM public.prompts
  WHERE is_deleted = false;
$$;

-- Fix get_problems_last_modified
CREATE OR REPLACE FUNCTION public.get_problems_last_modified()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT GREATEST(
    COALESCE(MAX(updated_at), '-infinity'::timestamptz),
    COALESCE(MAX(created_at), '-infinity'::timestamptz)
  )
  FROM public.problems
  WHERE is_deleted = false;
$$;

-- refresh_search_views_if_needed already has search_path set

-- ============================================================================
-- 3. REVOKE PUBLIC ACCESS FROM INTERNAL MATERIALIZED VIEWS
-- ============================================================================
-- These materialized views are for internal search only
-- Users should query through the search functions, not directly

-- Keep cached_timezones accessible (it's meant to be public)
-- But revoke from search_prompts_mv and search_problems_mv

REVOKE ALL ON public.search_prompts_mv FROM anon, authenticated;
REVOKE ALL ON public.search_problems_mv FROM anon, authenticated;

-- Grant only to postgres and service_role for maintenance
GRANT SELECT ON public.search_prompts_mv TO postgres, service_role;
GRANT SELECT ON public.search_problems_mv TO postgres, service_role;

-- cached_timezones should remain accessible
-- (already granted in previous migration)

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Security fixes applied:';
  RAISE NOTICE '   - RLS enabled on materialized_view_refresh_log';
  RAISE NOTICE '   - search_path added to 2 functions';
  RAISE NOTICE '   - Public access revoked from internal materialized views';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Materialized views access:';
  RAISE NOTICE '   - search_prompts_mv: Internal only';
  RAISE NOTICE '   - search_problems_mv: Internal only';
  RAISE NOTICE '   - cached_timezones: Public (as intended)';
END $$;
