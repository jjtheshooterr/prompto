-- Fix Security Definer Views
-- Date: 2026-01-29
-- Issue: Supabase linter flagged active_problems and active_prompts views as SECURITY DEFINER
-- Fix: Recreate views with SECURITY INVOKER to respect RLS of querying user

-- Drop existing views
DROP VIEW IF EXISTS active_problems;
DROP VIEW IF EXISTS active_prompts;

-- Recreate active_problems view with SECURITY INVOKER
-- This view filters out deleted problems
CREATE VIEW active_problems WITH (security_invoker = true) AS
SELECT *
FROM problems
WHERE is_deleted = false;

-- Recreate active_prompts view with SECURITY INVOKER
-- This view filters out deleted and hidden prompts
CREATE VIEW active_prompts WITH (security_invoker = true) AS
SELECT *
FROM prompts
WHERE is_deleted = false AND is_hidden = false;

-- Grant appropriate permissions
GRANT SELECT ON active_problems TO authenticated, anon;
GRANT SELECT ON active_prompts TO authenticated, anon;

-- Verify the fix
SELECT 
  c.relname AS view_name,
  CASE 
    WHEN 'security_invoker=true' = ANY(c.reloptions) THEN 'SECURITY INVOKER ✓'
    ELSE 'SECURITY DEFINER ✗'
  END AS security_mode
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN ('active_problems', 'active_prompts');
