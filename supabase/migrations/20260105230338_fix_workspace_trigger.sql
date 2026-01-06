-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_personal_workspace();

-- Create a simpler function that doesn't rely on email
CREATE OR REPLACE FUNCTION create_personal_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_slug TEXT;
BEGIN
  -- Generate a unique workspace slug using the user ID
  workspace_slug := 'user-' || REPLACE(NEW.id::TEXT, '-', '');
  
  -- Create personal workspace
  INSERT INTO workspaces (owner_id, name, slug)
  VALUES (NEW.id, 'Personal Workspace', workspace_slug);
  
  -- Add user as owner to the workspace
  INSERT INTO workspace_members (workspace_id, user_id, role)
  SELECT id, NEW.id, 'owner'
  FROM workspaces
  WHERE slug = workspace_slug;
  
  -- Create profile with just the user ID (email will be handled separately)
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in create_personal_workspace: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_personal_workspace();;
