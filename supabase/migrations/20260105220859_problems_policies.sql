-- Problems policies
CREATE POLICY "Anyone can view public and unlisted problems" ON problems
  FOR SELECT USING (
    (visibility = 'public' AND is_listed = true AND NOT is_hidden) OR
    (visibility = 'unlisted' AND NOT is_hidden) OR
    (visibility = 'private' AND is_workspace_member(workspace_id, auth.uid()) AND NOT is_hidden)
  );

CREATE POLICY "Workspace members can create problems" ON problems
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id, auth.uid()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Workspace members can update their problems" ON problems
  FOR UPDATE USING (
    is_workspace_member(workspace_id, auth.uid()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Workspace members can delete their problems" ON problems
  FOR DELETE USING (
    is_workspace_member(workspace_id, auth.uid()) AND
    created_by = auth.uid()
  );;
