-- Complete Supabase setup for Promptvexity
-- Run this in your Supabase SQL editor

-- First, ensure the is_workspace_member function exists
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_members.workspace_id = $1 
    AND workspace_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SQL functions for updating prompt stats
CREATE OR REPLACE FUNCTION increment_view_count(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, view_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE SET
    view_count = prompt_stats.view_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_copy_count(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, copy_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE SET
    copy_count = prompt_stats.copy_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_fork_count(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, fork_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE SET
    fork_count = prompt_stats.fork_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Temporarily create a more permissive RLS policy for prompts to test
DROP POLICY IF EXISTS "Workspace members can create prompts" ON prompts;

CREATE POLICY "Authenticated users can create prompts" ON prompts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid()
  );

-- You can re-enable the workspace-based policy later:
-- DROP POLICY IF EXISTS "Authenticated users can create prompts" ON prompts;
-- CREATE POLICY "Workspace members can create prompts" ON prompts
--   FOR INSERT WITH CHECK (
--     is_workspace_member(workspace_id, auth.uid()) AND
--     created_by = auth.uid()
--   );