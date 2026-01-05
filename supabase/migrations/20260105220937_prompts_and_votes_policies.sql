-- Prompts policies
CREATE POLICY "Anyone can view public and unlisted prompts" ON prompts
  FOR SELECT USING (
    (visibility = 'public' AND NOT is_hidden) OR
    (visibility = 'unlisted' AND NOT is_hidden) OR
    (visibility = 'private' AND is_workspace_member(workspace_id, auth.uid()) AND NOT is_hidden)
  );

CREATE POLICY "Workspace members can create prompts" ON prompts
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id, auth.uid()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Workspace members can update their prompts" ON prompts
  FOR UPDATE USING (
    is_workspace_member(workspace_id, auth.uid()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Workspace members can delete their prompts" ON prompts
  FOR DELETE USING (
    is_workspace_member(workspace_id, auth.uid()) AND
    created_by = auth.uid()
  );

-- Votes policies
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_id 
      AND (
        (prompts.visibility = 'public' AND NOT prompts.is_hidden) OR
        (prompts.visibility = 'unlisted' AND NOT prompts.is_hidden) OR
        (prompts.visibility = 'private' AND is_workspace_member(prompts.workspace_id, auth.uid()) AND NOT prompts.is_hidden)
      )
    )
  );

CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (user_id = auth.uid());;
