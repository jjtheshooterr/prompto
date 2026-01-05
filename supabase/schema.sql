-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for visibility
CREATE TYPE visibility AS ENUM ('public', 'unlisted', 'private');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workspace_members table
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Create problems table
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  visibility visibility DEFAULT 'public',
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  industry TEXT CHECK (industry IS NULL OR industry IN (
    'video', 'dev', 'legal', 'marketing', 'data', 'content', 
    'support', 'sales', 'hr', 'finance', 'education', 'healthcare'
  )),
  is_listed BOOLEAN DEFAULT TRUE,
  is_reported BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

-- Create prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  visibility visibility DEFAULT 'public',
  title TEXT NOT NULL,
  system_prompt TEXT,
  user_prompt_template TEXT NOT NULL,
  model TEXT,
  params JSONB DEFAULT '{}',
  example_input JSONB,
  example_output JSONB,
  known_failures TEXT,
  notes TEXT,
  parent_prompt_id UUID REFERENCES prompts(id),
  status TEXT CHECK (status IN ('experimental', 'tested', 'production')) DEFAULT 'experimental',
  tested_context TEXT,
  source_url TEXT,
  license TEXT,
  is_listed BOOLEAN DEFAULT TRUE,
  is_reported BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  value INTEGER CHECK (value IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (prompt_id, user_id)
);

-- Create prompt_stats table for performance
CREATE TABLE prompt_stats (
  prompt_id UUID PRIMARY KEY REFERENCES prompts(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prompt_events table for analytics
CREATE TABLE prompt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT CHECK (event_type IN ('view', 'copy', 'fork', 'compare_add')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_workspace_visibility ON problems(workspace_id, visibility);
CREATE INDEX idx_problems_visibility_listed ON problems(visibility, is_listed) WHERE NOT is_hidden;
CREATE INDEX idx_problems_industry ON problems(industry) WHERE industry IS NOT NULL;
CREATE INDEX idx_prompts_problem_visibility ON prompts(problem_id, visibility);
CREATE INDEX idx_prompts_workspace ON prompts(workspace_id);
CREATE INDEX idx_votes_prompt ON votes(prompt_id);
CREATE INDEX idx_prompt_events_prompt ON prompt_events(prompt_id);
CREATE INDEX idx_prompt_events_type ON prompt_events(event_type);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto workspace creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_personal_workspace();

-- Create function to update prompt stats
CREATE OR REPLACE FUNCTION update_prompt_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO prompt_stats (prompt_id, upvotes, downvotes, score)
    VALUES (NEW.prompt_id, 
            CASE WHEN NEW.value = 1 THEN 1 ELSE 0 END,
            CASE WHEN NEW.value = -1 THEN 1 ELSE 0 END,
            NEW.value)
    ON CONFLICT (prompt_id) DO UPDATE SET
      upvotes = prompt_stats.upvotes + CASE WHEN NEW.value = 1 THEN 1 ELSE 0 END,
      downvotes = prompt_stats.downvotes + CASE WHEN NEW.value = -1 THEN 1 ELSE 0 END,
      score = prompt_stats.score + NEW.value,
      updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE prompt_stats SET
      upvotes = upvotes - CASE WHEN OLD.value = 1 THEN 1 ELSE 0 END + CASE WHEN NEW.value = 1 THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN OLD.value = -1 THEN 1 ELSE 0 END + CASE WHEN NEW.value = -1 THEN 1 ELSE 0 END,
      score = score - OLD.value + NEW.value,
      updated_at = NOW()
    WHERE prompt_id = NEW.prompt_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prompt_stats SET
      upvotes = upvotes - CASE WHEN OLD.value = 1 THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN OLD.value = -1 THEN 1 ELSE 0 END,
      score = score - OLD.value,
      updated_at = NOW()
    WHERE prompt_id = OLD.prompt_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote stats
CREATE TRIGGER vote_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_prompt_stats();

-- Create function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workspaces updated_at
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();