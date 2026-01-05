-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

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
  );

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
  );

-- Prompts policies
CREATE POLICY "Anyone can view public and unlisted prompts" ON prompts
  FOR SELECT USING (
    (visibility = 'public' AND is_listed = true AND NOT is_hidden) OR
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
        (prompts.visibility = 'public' AND prompts.is_listed = true AND NOT prompts.is_hidden) OR
        (prompts.visibility = 'unlisted' AND NOT prompts.is_hidden) OR
        (prompts.visibility = 'private' AND is_workspace_member(prompts.workspace_id, auth.uid()) AND NOT prompts.is_hidden)
      )
    )
  );

CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (user_id = auth.uid());

-- Prompt stats policies (read-only for most users)
CREATE POLICY "Anyone can view prompt stats" ON prompt_stats
  FOR SELECT USING (true);

-- Prevent direct client writes to prompt_stats (only triggers can modify)
CREATE POLICY "No direct client writes to prompt_stats" ON prompt_stats
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct client updates to prompt_stats" ON prompt_stats
  FOR UPDATE USING (false);

CREATE POLICY "No direct client deletes to prompt_stats" ON prompt_stats
  FOR DELETE USING (false);

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
  FOR SELECT USING (reporter_id = auth.uid());