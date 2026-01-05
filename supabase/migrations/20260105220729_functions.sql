-- Create function to check workspace membership
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

-- Create function to auto-create personal workspace
CREATE OR REPLACE FUNCTION create_personal_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_slug TEXT;
BEGIN
  -- Generate a unique workspace slug
  workspace_slug := 'user-' || REPLACE(NEW.id::TEXT, '-', '');
  
  -- Create personal workspace
  INSERT INTO workspaces (owner_id, name, slug)
  VALUES (NEW.id, 'Personal Workspace', workspace_slug);
  
  -- Add user as owner to the workspace
  INSERT INTO workspace_members (workspace_id, user_id, role)
  SELECT id, NEW.id, 'owner'
  FROM workspaces
  WHERE slug = workspace_slug;
  
  -- Create profile
  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id, NULL, NEW.email);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
