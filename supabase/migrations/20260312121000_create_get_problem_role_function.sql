-- Migration: Create get_problem_role() function
-- Task 2.4: Create get_problem_role() function
-- Spec: workspace-permission-system
-- 
-- This migration creates the get_problem_role() function that implements the core
-- authorization algorithm: explicit problem role ?? inherited workspace role ?? NULL

CREATE OR REPLACE FUNCTION get_problem_role(p_problem_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_explicit_role TEXT;
  v_workspace_id UUID;
  v_workspace_role TEXT;
BEGIN
  -- Check for explicit problem membership
  v_explicit_role := get_explicit_problem_role(p_problem_id, p_user_id);
  
  IF v_explicit_role IS NOT NULL THEN
    RETURN v_explicit_role;
  END IF;
  
  -- Get workspace_id from problem
  SELECT workspace_id INTO v_workspace_id
  FROM problems
  WHERE id = p_problem_id
  LIMIT 1;
  
  IF NOT FOUND OR v_workspace_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check workspace membership
  v_workspace_role := get_workspace_role(v_workspace_id, p_user_id);
  
  RETURN v_workspace_role;
END;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION get_problem_role(UUID, UUID) IS 
  'Returns the effective problem role for a user using the core authorization algorithm: explicit problem role ?? inherited workspace role ?? NULL. This is the primary function for determining a user''s role on a problem.';

RAISE NOTICE 'Created get_problem_role() function';
