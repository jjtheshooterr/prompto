-- Fix the create_personal_workspace function to have secure search_path
CREATE OR REPLACE FUNCTION public.create_personal_workspace(user_id uuid)
RETURNS uuid
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  workspace_id uuid;
  username text;
BEGIN
  -- Get username from profiles
  SELECT p.username INTO username
  FROM public.profiles p
  WHERE p.id = user_id;
  
  -- If no username found, use email prefix
  IF username IS NULL THEN
    SELECT split_part(au.email, '@', 1) INTO username
    FROM auth.users au
    WHERE au.id = user_id;
  END IF;
  
  -- Create workspace
  INSERT INTO public.workspaces (owner_id, name, slug, plan)
  VALUES (
    user_id,
    username || '''s Workspace',
    username || '-workspace',
    'free'
  )
  RETURNING id INTO workspace_id;
  
  -- Add user as owner to workspace_members
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id, user_id, 'owner');
  
  RETURN workspace_id;
END;
$$;;
