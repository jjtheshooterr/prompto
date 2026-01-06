-- Setup workspaces for all existing users
-- Run this in your Supabase SQL editor

-- Create workspaces for users who don't have one
INSERT INTO workspaces (owner_id, name, slug)
SELECT 
  u.id,
  COALESCE(p.display_name, u.email) || '''s Workspace' as name,
  'user-' || REPLACE(u.id::TEXT, '-', '') as slug
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN workspaces w ON w.owner_id = u.id
WHERE w.id IS NULL;

-- Add all users as owners of their workspaces
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT 
  w.id,
  w.owner_id,
  'owner'
FROM workspaces w
LEFT JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = w.owner_id
WHERE wm.workspace_id IS NULL;

-- Verify the setup
SELECT 
  u.email,
  w.name as workspace_name,
  wm.role
FROM auth.users u
JOIN workspaces w ON w.owner_id = u.id
JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = u.id
ORDER BY u.email;