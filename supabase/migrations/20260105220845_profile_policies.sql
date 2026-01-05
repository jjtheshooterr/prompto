-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Users can view workspaces they are members of" ON workspaces
  FOR SELECT USING (
    is_workspace_member(id, auth.uid())
  );

CREATE POLICY "Only owners can update workspaces" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Users can view workspace members if they are members" ON workspace_members
  FOR SELECT USING (
    is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Only owners can manage workspace members" ON workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );;
