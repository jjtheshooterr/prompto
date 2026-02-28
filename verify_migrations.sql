-- ============================================================================
-- MIGRATION VERIFICATION SCRIPT
-- Run this after applying migrations 20260227000004 and 20260227000005
-- ============================================================================

\echo '============================================================================'
\echo 'VERIFYING MIGRATIONS'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. VERIFY RLS POLICIES USE (SELECT auth.uid())
-- ============================================================================
\echo '1. Checking RLS policies for optimized auth.uid() usage...'
\echo ''

SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN pg_get_expr(qual, tablename::regclass) LIKE '%(SELECT auth.uid())%' THEN '✅ Optimized'
    WHEN pg_get_expr(qual, tablename::regclass) LIKE '%auth.uid()%' THEN '⚠️ Not optimized'
    ELSE '✓ No auth.uid()'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('workspaces', 'workspace_members', 'prompts')
ORDER BY tablename, policyname;

\echo ''

-- ============================================================================
-- 2. VERIFY NEW INDEXES EXIST
-- ============================================================================
\echo '2. Checking new performance indexes...'
\echo ''

SELECT 
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE '%_covering%' THEN 'Covering Index'
    WHEN indexname LIKE '%_optimized%' THEN 'Optimized Index'
    WHEN indexname LIKE '%_ranking_%' THEN 'Ranking Index'
    WHEN indexname LIKE '%_active%' THEN 'Active Filter Index'
    ELSE 'Other'
  END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%_covering%'
    OR indexname LIKE '%_optimized%'
    OR indexname LIKE '%_ranking_%'
    OR indexname LIKE '%_active%'
  )
ORDER BY tablename, indexname;

\echo ''

-- ============================================================================
-- 3. VERIFY MATERIALIZED VIEW REFRESH LOG
-- ============================================================================
\echo '3. Checking materialized view refresh log...'
\echo ''

SELECT 
  view_name,
  last_refresh_at,
  last_data_modified_at,
  CASE 
    WHEN last_data_modified_at IS NOT NULL THEN '✅ Tracking enabled'
    ELSE '⚠️ Not tracking'
  END as status
FROM public.materialized_view_refresh_log
ORDER BY view_name;

\echo ''

-- ============================================================================
-- 4. VERIFY CACHED TIMEZONES
-- ============================================================================
\echo '4. Checking cached timezones materialized view...'
\echo ''

SELECT 
  COUNT(*) as timezone_count,
  CASE 
    WHEN COUNT(*) > 500 THEN '✅ Populated'
    ELSE '⚠️ Not populated'
  END as status
FROM public.cached_timezones;

\echo ''

-- ============================================================================
-- 5. VERIFY SMART REFRESH FUNCTION
-- ============================================================================
\echo '5. Checking smart refresh function...'
\echo ''

SELECT 
  proname as function_name,
  pg_get_functiondef(oid) LIKE '%last_data_modified_at%' as has_tracking,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%last_data_modified_at%' THEN '✅ Smart refresh enabled'
    ELSE '⚠️ Not configured'
  END as status
FROM pg_proc
WHERE proname = 'refresh_search_views_if_needed'
  AND pronamespace = 'public'::regnamespace;

\echo ''

-- ============================================================================
-- 6. CHECK FOR POLICY CONFLICTS
-- ============================================================================
\echo '6. Checking for multiple permissive policies (should be none)...'
\echo ''

SELECT 
  schemaname,
  tablename,
  cmd as operation,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Single policy'
    WHEN COUNT(*) > 1 THEN '⚠️ Multiple policies'
    ELSE '✓ No policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('workspaces', 'workspace_members', 'prompts')
  AND permissive = 'PERMISSIVE'
GROUP BY schemaname, tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

\echo ''
\echo 'If no rows returned above, all policies are optimized! ✅'
\echo ''

-- ============================================================================
-- 7. VERIFY CRON CLEANUP FUNCTION
-- ============================================================================
\echo '7. Checking cron cleanup function...'
\echo ''

SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'cleanup_old_job_run_details' THEN '✅ Cleanup function exists'
    ELSE '⚠️ Not found'
  END as status
FROM pg_proc
WHERE proname = 'cleanup_old_job_run_details'
  AND pronamespace = 'cron'::regnamespace;

\echo ''

-- ============================================================================
-- 8. CHECK INDEX USAGE (after some queries have run)
-- ============================================================================
\echo '8. Checking new index usage (run this after some traffic)...'
\echo ''

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  CASE 
    WHEN idx_scan > 0 THEN '✅ Being used'
    ELSE '⏳ Not used yet'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%_covering%'
    OR indexname LIKE '%_optimized%'
    OR indexname LIKE '%_ranking_%'
  )
ORDER BY idx_scan DESC;

\echo ''

-- ============================================================================
-- 9. SUMMARY
-- ============================================================================
\echo '============================================================================'
\echo 'VERIFICATION SUMMARY'
\echo '============================================================================'
\echo ''

DO $$
DECLARE
  v_policies_count int;
  v_indexes_count int;
  v_refresh_log_count int;
  v_timezones_count int;
  v_functions_count int;
BEGIN
  -- Count optimized policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('workspaces', 'workspace_members', 'prompts')
    AND pg_get_expr(qual, tablename::regclass) LIKE '%(SELECT auth.uid())%';
  
  -- Count new indexes
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (
      indexname LIKE '%_covering%'
      OR indexname LIKE '%_optimized%'
      OR indexname LIKE '%_ranking_%'
    );
  
  -- Count refresh log entries
  SELECT COUNT(*) INTO v_refresh_log_count
  FROM public.materialized_view_refresh_log;
  
  -- Count cached timezones
  SELECT COUNT(*) INTO v_timezones_count
  FROM public.cached_timezones;
  
  -- Count new functions
  SELECT COUNT(*) INTO v_functions_count
  FROM pg_proc
  WHERE proname IN ('refresh_search_views_if_needed', 'get_prompts_last_modified', 'get_problems_last_modified')
    AND pronamespace = 'public'::regnamespace;
  
  RAISE NOTICE '✅ Optimized RLS Policies: % (expected: 10+)', v_policies_count;
  RAISE NOTICE '✅ New Performance Indexes: % (expected: 10+)', v_indexes_count;
  RAISE NOTICE '✅ Refresh Log Entries: % (expected: 2)', v_refresh_log_count;
  RAISE NOTICE '✅ Cached Timezones: % (expected: 500+)', v_timezones_count;
  RAISE NOTICE '✅ Smart Refresh Functions: % (expected: 3)', v_functions_count;
  RAISE NOTICE '';
  
  IF v_policies_count >= 10 AND v_indexes_count >= 10 AND v_refresh_log_count = 2 
     AND v_timezones_count > 500 AND v_functions_count = 3 THEN
    RAISE NOTICE '🎉 ALL MIGRATIONS VERIFIED SUCCESSFULLY!';
  ELSE
    RAISE WARNING '⚠️ Some migrations may not have applied correctly. Review output above.';
  END IF;
END $$;

\echo ''
\echo '============================================================================'
\echo 'NEXT STEPS'
\echo '============================================================================'
\echo ''
\echo '1. Update cron job to use: SELECT public.refresh_search_views_if_needed();'
\echo '2. Schedule cleanup: SELECT cron.schedule(''cleanup-job-logs'', ''0 2 * * *'', ''SELECT cron.cleanup_old_job_run_details()'');'
\echo '3. Monitor performance for 24-48 hours'
\echo '4. Check pg_stat_statements for improvements'
\echo ''
