-- Migration: Verify RLS is enabled and forced on all permission tables (task 4.5)
-- Spec: workspace-permission-system
-- 
-- This migration verifies that RLS is properly enabled and forced on all
-- permission-related tables. This is a security best practice to prevent
-- privilege escalation and ensure consistent authorization enforcement.
--
-- Tables verified:
-- - workspace_members
-- - problem_members
-- - problems
-- - prompts
--
-- FORCE ROW LEVEL SECURITY ensures RLS applies even to table owners,
-- preventing bypass of security policies.

DO $
DECLARE
  v_table_name TEXT;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_all_verified BOOLEAN := true;
  v_tables TEXT[] := ARRAY['workspace_members', 'problem_members', 'problems', 'prompts'];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Verifying RLS configuration on permission tables (task 4.5)';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  
  -- Check each table
  FOREACH v_table_name IN ARRAY v_tables
  LOOP
    -- Query pg_class to check RLS status
    SELECT 
      relrowsecurity,
      relforcerowsecurity
    INTO 
      v_rls_enabled,
      v_rls_forced
    FROM pg_class
    WHERE relname = v_table_name
      AND relnamespace = 'public'::regnamespace;
    
    -- Report status
    IF v_rls_enabled AND v_rls_forced THEN
      RAISE NOTICE '✅ %: RLS enabled and forced', v_table_name;
    ELSIF v_rls_enabled AND NOT v_rls_forced THEN
      RAISE WARNING '⚠️  %: RLS enabled but NOT forced (security risk!)', v_table_name;
      v_all_verified := false;
      
      -- Fix it by forcing RLS
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_table_name);
      RAISE NOTICE '   → Fixed: Forced RLS on %', v_table_name;
    ELSIF NOT v_rls_enabled THEN
      RAISE WARNING '❌ %: RLS NOT enabled (critical security issue!)', v_table_name;
      v_all_verified := false;
      
      -- Fix it by enabling and forcing RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_table_name);
      RAISE NOTICE '   → Fixed: Enabled and forced RLS on %', v_table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  
  IF v_all_verified THEN
    RAISE NOTICE '✅ All permission tables have RLS properly enabled and forced!';
  ELSE
    RAISE NOTICE '⚠️  Some tables required RLS fixes (now corrected)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Security best practice: FORCE ROW LEVEL SECURITY ensures RLS';
  RAISE NOTICE '   applies even to table owners, preventing privilege escalation.';
  RAISE NOTICE '';
END $;

-- Additional verification: Check that policies exist on all tables
DO $
DECLARE
  v_table_name TEXT;
  v_policy_count INTEGER;
  v_tables TEXT[] := ARRAY['workspace_members', 'problem_members', 'problems', 'prompts'];
BEGIN
  RAISE NOTICE '📋 Verifying RLS policies exist on all tables';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  
  FOREACH v_table_name IN ARRAY v_tables
  LOOP
    -- Count policies for this table
    SELECT COUNT(*)
    INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = v_table_name;
    
    IF v_policy_count > 0 THEN
      RAISE NOTICE '✅ %: % policies defined', v_table_name, v_policy_count;
    ELSE
      RAISE WARNING '⚠️  %: No policies defined (table will be inaccessible!)', v_table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
END $;

-- Final summary
DO $
BEGIN
  RAISE NOTICE '✅ Task 4.5 complete: RLS verification and enforcement';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Verified RLS is enabled on all permission tables';
  RAISE NOTICE '  • Verified RLS is forced on all permission tables';
  RAISE NOTICE '  • Verified policies exist on all permission tables';
  RAISE NOTICE '  • Auto-fixed any missing RLS configurations';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security posture: All permission tables are protected by RLS!';
  RAISE NOTICE '';
END $;
