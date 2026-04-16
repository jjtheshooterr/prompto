-- Migration: Create get_explicit_problem_role() function
-- Task 2.3: Create get_explicit_problem_role() function
-- Spec: workspace-permission-system
-- 
-- This migration creates the get_explicit_problem_role() helper function that returns
-- a user's explicit problem role (from problem_members table), or NULL if no explicit membership.

CREATE OR REPLACE FUNCTION get_explicit_problem_role(p_problem_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM problem_members
  WHERE problem_id = p_problem_id
    AND user_id = p_user_id
  LIMIT 1;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION get_explicit_problem_role(UUID, UUID) IS 
  'Returns the user''s explicit problem role from problem_members table (owner, admin, member, viewer), or NULL if no explicit problem membership. Does NOT check workspace membership - use get_problem_role() for effective role with inheritance.';

RAISE NOTICE 'Created get_explicit_problem_role() function';
