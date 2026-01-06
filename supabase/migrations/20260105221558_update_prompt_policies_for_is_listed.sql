-- Update prompt policies to respect is_listed
DROP POLICY IF EXISTS "Anyone can view public and unlisted prompts" ON prompts;

CREATE POLICY "Anyone can view public and unlisted prompts" ON prompts
  FOR SELECT USING (
    (
      (visibility = 'public' AND is_listed = true AND NOT is_hidden) OR
      (visibility = 'unlisted' AND NOT is_hidden) OR
      (visibility = 'private' AND is_workspace_member(workspace_id, auth.uid()) AND NOT is_hidden)
    )
  );

-- Also update voting policies to respect is_listed
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;

CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_id 
      AND (
        (prompts.visibility = 'public' AND prompts.is_listed = true AND NOT prompts.is_hidden) OR
        (prompts.visibility = 'unlisted' AND NOT prompts.is_hidden) OR
        (prompts.visibility = 'private' AND is_workspace_member(prompts.workspace_id, auth.uid()) AND NOT prompts.is_hidden)
      )
    )
  );;
