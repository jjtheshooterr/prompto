-- Prompt stats policies (read-only for most users)
CREATE POLICY "Anyone can view prompt stats" ON prompt_stats
  FOR SELECT USING (true);

-- Prompt events policies
CREATE POLICY "Anyone can view prompt events" ON prompt_events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create prompt events" ON prompt_events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
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

-- Reports policies
CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    reporter_id = auth.uid()
  );

CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());;
