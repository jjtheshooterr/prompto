-- Fix search_path for all remaining functions
-- This prevents search_path injection attacks by setting explicit search_path

BEGIN;

-- Use a simpler approach: generate ALTER FUNCTION statements for all functions
-- that don't have search_path set

-- First, let's add search_path to all public schema functions at once
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_catalog.pg_get_function_identity_arguments(p.oid) as args
        FROM pg_catalog.pg_proc p
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'  -- Only functions, not procedures
        AND (p.proconfig IS NULL OR NOT 'search_path=public' = ANY(p.proconfig))
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION %I.%I(%s) SET search_path = public',
                r.schema_name,
                r.function_name,
                r.args
            );
            RAISE NOTICE 'Set search_path for %.%(%)', r.schema_name, r.function_name, r.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to set search_path for %.%(%): %', 
                r.schema_name, r.function_name, r.args, SQLERRM;
        END;
    END LOOP;
END $$;

COMMIT;
