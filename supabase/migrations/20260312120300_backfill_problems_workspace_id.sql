-- Migration: Backfill problems.workspace_id into default personal workspaces
-- Task 1.4: This migration ensures all problems have a workspace_id before adding NOT NULL constraint

-- Step 1: Create a function to get or create a user's personal workspace
CREATE OR REPLACE FUNCTION get_or_create_personal_workspace(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_workspace_slug TEXT;
BEGIN
  -- Try to find existing personal workspace (owned by user with name 'Personal Workspace')
  SELECT id INTO v_workspace_id
  FROM workspaces
  WHERE owner_id = p_user_id
    AND name = 'Personal Workspace'
  LIMIT 1;
  
  -- If found, return it
  IF v_workspace_id IS NOT NULL THEN
    RETURN v_workspace_id;
  END IF;
  
  -- Otherwise, create a new personal workspace
  v_workspace_slug := 'user-' || REPLACE(p_user_id::TEXT, '-', '');
  
  INSERT INTO workspaces (owner_id, name, slug)
  VALUES (p_user_id, 'Personal Workspace', v_workspace_slug)
  ON CONFLICT (slug) DO UPDATE
    SET slug = 'user-' || REPLACE(p_user_id::TEXT, '-', '') || '-' || EXTRACT(EPOCH FROM NOW())::TEXT
  RETURNING id INTO v_workspace_id;
  
  -- Add user as owner to workspace_members
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, p_user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
  RETURN v_workspace_id;
END;
$$;

-- Step 2: Backfill problems with NULL workspace_id
DO $$
DECLARE
  v_problem RECORD;
  v_workspace_id UUID;
  v_default_user_id UUID;
  v_problems_updated INTEGER := 0;
  v_problems_without_creator INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting backfill of problems.workspace_id...';
  
  -- Get the first user as a fallback for problems without created_by
  SELECT id INTO v_default_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_default_user_id IS NULL THEN
    RAISE NOTICE 'No users found in database. Creating a system user for orphaned problems.';
    -- If no users exist, we'll handle this in the loop
  END IF;
  
  -- Loop through all problems with NULL workspace_id
  FOR v_problem IN
    SELECT id, created_by, title, slug
    FROM problems
    WHERE workspace_id IS NULL
  LOOP
    -- Determine which user's workspace to use
    IF v_problem.created_by IS NOT NULL THEN
      -- Use the creator's personal workspace
      v_workspace_id := get_or_create_personal_workspace(v_problem.created_by);
      v_problems_updated := v_problems_updated + 1;
    ELSIF v_default_user_id IS NOT NULL THEN
      -- Use the default user's personal workspace for orphaned problems
      v_workspace_id := get_or_create_personal_workspace(v_default_user_id);
      v_problems_without_creator := v_problems_without_creator + 1;
      RAISE NOTICE 'Problem % (%) has no creator, assigning to default user workspace', v_problem.title, v_problem.id;
    ELSE
      -- Skip this problem if we have no users at all
      RAISE WARNING 'Cannot assign workspace to problem % (%) - no users in system', v_problem.title, v_problem.id;
      CONTINUE;
    END IF;
    
    -- Update the problem with the workspace_id
    UPDATE problems
    SET workspace_id = v_workspace_id
    WHERE id = v_problem.id;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete: % problems updated with creator workspace, % orphaned problems assigned to default user',
    v_problems_updated, v_problems_without_creator;
END;
$$;

-- Step 3: Verify the backfill
DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM problems
  WHERE workspace_id IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE WARNING 'Backfill incomplete: % problems still have NULL workspace_id', v_null_count;
  ELSE
    RAISE NOTICE 'Backfill verification passed: All problems have workspace_id';
  END IF;
END;
$$;

-- Step 4: Clean up the helper function (optional - keep it for future use)
-- DROP FUNCTION IF EXISTS get_or_create_personal_workspace(UUID);

COMMENT ON FUNCTION get_or_create_personal_workspace IS 
  'Helper function to get or create a user''s personal workspace. Used for backfilling problems.workspace_id.';
