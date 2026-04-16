-- Migration: Create permission check functions (tasks 2.5-2.12)
-- Spec: workspace-permission-system
-- 
-- This migration creates all the permission check functions that use the helper
-- functions to determine what actions users can perform.

-- Task 2.5: can_view_problem()
CREATE OR REPLACE FUNCTION can_view_problem(p_problem_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem RECORD;
  v_explicit_role TEXT;
  v_workspace_role TEXT;
BEGIN
  -- Get problem details
  SELECT visibility, is_listed, is_hidden, is_deleted, workspace_id
  INTO v_problem
  FROM problems
  WHERE id = p_problem_id
  LIMIT 1;
  
  -- Problem doesn't exist or is deleted
  IF NOT FOUND OR v_problem.is_deleted THEN
    RETURN false;
  END IF;
  
  -- Check if hidden (only workspace admin/owner OR problem admin/owner can view)
  IF v_problem.is_hidden THEN
    v_explicit_role := get_explicit_problem_role(p_problem_id, p_user_id);
    v_workspace_role := get_workspace_role(v_problem.workspace_id, p_user_id);
    
    IF COALESCE(v_explicit_role, '') IN ('admin', 'owner')
       OR COALESCE(v_workspace_role, '') IN ('admin', 'owner') THEN
      -- Continue to visibility check
    ELSE
      RETURN false;
    END IF;
  END IF;
  
  -- Check visibility
  IF v_problem.visibility = 'public' THEN
    RETURN v_problem.is_listed;
  ELSIF v_problem.visibility = 'workspace' THEN
    RETURN is_workspace_member(v_problem.workspace_id, p_user_id);
  ELSIF v_problem.visibility = 'private' THEN
    -- Must be explicit problem member OR workspace admin/owner
    v_explicit_role := get_explicit_problem_role(p_problem_id, p_user_id);
    
    IF v_explicit_role IS NOT NULL THEN
      RETURN true;
    END IF;
    
    -- Check if user is workspace admin or owner
    v_workspace_role := get_workspace_role(v_problem.workspace_id, p_user_id);
    RETURN v_workspace_role IN ('admin', 'owner');
  END IF;
  
  RETURN false;
END;
$$;

COMMENT ON FUNCTION can_view_problem(UUID, UUID) IS 
  'Checks if a user can view a problem based on visibility (public/workspace/private), listing status, hidden status, and user role. Handles anonymous users (NULL user_id).';

-- Task 2.6: can_edit_problem()
CREATE OR REPLACE FUNCTION can_edit_problem(p_problem_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  v_role := get_problem_role(p_problem_id, p_user_id);
  
  -- Only owner and admin can edit problem definitions
  -- Members can submit prompts but NOT edit problem metadata
  RETURN v_role IN ('owner', 'admin');
END;
$$;

COMMENT ON FUNCTION can_edit_problem(UUID, UUID) IS 
  'Checks if a user can edit a problem (title, description, visibility, etc.). Only owner and admin roles can edit. Members can submit prompts but cannot edit problem metadata.';

-- Task 2.7: can_manage_workspace()
CREATE OR REPLACE FUNCTION can_manage_workspace(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  v_role := get_workspace_role(p_workspace_id, p_user_id);
  
  RETURN v_role IN ('owner', 'admin');
END;
$$;

COMMENT ON FUNCTION can_manage_workspace(UUID, UUID) IS 
  'Checks if a user can manage a workspace (invite members, remove members, rename workspace, etc.). Only owner and admin roles can manage workspaces.';

-- Task 2.8: can_view_workspace()
CREATE OR REPLACE FUNCTION can_view_workspace(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN is_workspace_member(p_workspace_id, p_user_id);
END;
$$;

COMMENT ON FUNCTION can_view_workspace(UUID, UUID) IS 
  'Checks if a user can view a workspace (any role). Used for workspace UI elements like sidebar, switcher, cards, and selector.';

-- Task 2.9: can_manage_problem()
CREATE OR REPLACE FUNCTION can_manage_problem(p_problem_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  v_role := get_problem_role(p_problem_id, p_user_id);
  
  RETURN v_role IN ('owner', 'admin');
END;
$$;

COMMENT ON FUNCTION can_manage_problem(UUID, UUID) IS 
  'Checks if a user can manage a problem (delete, change visibility, manage members). Only owner and admin roles can manage problems.';

-- Task 2.10: can_submit_prompt()
CREATE OR REPLACE FUNCTION can_submit_prompt(p_problem_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  v_role := get_problem_role(p_problem_id, p_user_id);
  
  -- owner, admin, and member can submit prompts
  RETURN v_role IN ('owner', 'admin', 'member');
END;
$$;

COMMENT ON FUNCTION can_submit_prompt(UUID, UUID) IS 
  'Checks if a user can submit prompts to a problem. Owner, admin, and member roles can submit. Viewer role is read-only.';

-- Task 2.11: can_edit_prompt()
CREATE OR REPLACE FUNCTION can_edit_prompt(p_prompt_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_id UUID;
  v_created_by UUID;
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get problem_id and created_by from prompt
  SELECT problem_id, created_by INTO v_problem_id, v_created_by
  FROM prompts
  WHERE id = p_prompt_id
  LIMIT 1;
  
  IF NOT FOUND OR v_problem_id IS NULL THEN
    RETURN false;
  END IF;
  
  v_role := get_problem_role(v_problem_id, p_user_id);
  
  -- owner and admin can edit any prompt
  IF v_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- member can edit own prompts only
  IF v_role = 'member' AND v_created_by = p_user_id THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

COMMENT ON FUNCTION can_edit_prompt(UUID, UUID) IS 
  'Checks if a user can edit a prompt. Owner and admin can edit any prompt. Member can edit only their own prompts (checked via created_by). Viewer cannot edit.';

-- Task 2.12: can_manage_prompt()
CREATE OR REPLACE FUNCTION can_manage_prompt(p_prompt_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_problem_id UUID;
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get problem_id from prompt
  SELECT problem_id INTO v_problem_id
  FROM prompts
  WHERE id = p_prompt_id
  LIMIT 1;
  
  IF NOT FOUND OR v_problem_id IS NULL THEN
    RETURN false;
  END IF;
  
  v_role := get_problem_role(v_problem_id, p_user_id);
  
  -- Only owner and admin can manage any prompt
  RETURN v_role IN ('owner', 'admin');
END;
$$;

COMMENT ON FUNCTION can_manage_prompt(UUID, UUID) IS 
  'Checks if a user can manage a prompt (delete, change flags, etc.). Only owner and admin roles can manage prompts.';

RAISE NOTICE 'Created all permission check functions (tasks 2.5-2.12)';
