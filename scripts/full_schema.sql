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
  created_at TIMESTAMPTZ DEFAULT NOW()
);;
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
  is_listed BOOLEAN DEFAULT TRUE,
  is_reported BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);;
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
);;
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
);;
-- Create indexes for performance
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_workspace_visibility ON problems(workspace_id, visibility);
CREATE INDEX idx_problems_visibility_listed ON problems(visibility, is_listed) WHERE NOT is_hidden;
CREATE INDEX idx_prompts_problem_visibility ON prompts(problem_id, visibility);
CREATE INDEX idx_prompts_workspace ON prompts(workspace_id);
CREATE INDEX idx_votes_prompt ON votes(prompt_id);
CREATE INDEX idx_prompt_events_prompt ON prompt_events(prompt_id);
CREATE INDEX idx_prompt_events_type ON prompt_events(event_type);;
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
  FOR EACH ROW EXECUTE FUNCTION update_prompt_stats();;
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;;
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
-- Add is_listed to prompts table
ALTER TABLE prompts ADD COLUMN is_listed BOOLEAN DEFAULT TRUE;;
-- Remove the existing policy and add more restrictive ones
DROP POLICY IF EXISTS "Anyone can view prompt stats" ON prompt_stats;

-- Only allow SELECT for everyone
CREATE POLICY "Anyone can view prompt stats" ON prompt_stats
  FOR SELECT USING (true);

-- Prevent all INSERT/UPDATE/DELETE from clients (only triggers/functions can modify)
CREATE POLICY "No direct client writes to prompt_stats" ON prompt_stats
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct client updates to prompt_stats" ON prompt_stats
  FOR UPDATE USING (false);

CREATE POLICY "No direct client deletes to prompt_stats" ON prompt_stats
  FOR DELETE USING (false);;
-- Add updated_at to workspaces table
ALTER TABLE workspaces ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();;
-- Add industry field to problems for vertical organization
ALTER TABLE problems ADD COLUMN industry TEXT;

-- Add a check constraint for common industries (can be expanded later)
ALTER TABLE problems ADD CONSTRAINT problems_industry_check 
  CHECK (industry IS NULL OR industry IN (
    'video', 'dev', 'legal', 'marketing', 'data', 'content', 
    'support', 'sales', 'hr', 'finance', 'education', 'healthcare'
  ));

-- Add index for industry filtering
CREATE INDEX idx_problems_industry ON problems(industry) WHERE industry IS NOT NULL;;
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
-- Fix search_path security warnings by setting explicit search_path
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_members.workspace_id = $1 
    AND workspace_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;;
-- First, let's create a test user and workspace (you'll need to replace with actual user ID after signup)
-- For now, let's insert some sample data that will work with the RLS policies

-- Insert sample problems (these will be public and visible)
INSERT INTO problems (workspace_id, visibility, slug, title, description, tags, industry, created_by) 
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'text-summarization',
  'Text Summarization',
  'Create concise summaries of long-form content while preserving key information and context.',
  ARRAY['summarization', 'content', 'nlp'],
  'content',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE slug = 'text-summarization');

INSERT INTO problems (workspace_id, visibility, slug, title, description, tags, industry, created_by) 
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'data-extraction',
  'Structured Data Extraction',
  'Extract structured information from unstructured text, documents, or web content.',
  ARRAY['extraction', 'parsing', 'structured-data'],
  'data',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE slug = 'data-extraction');

INSERT INTO problems (workspace_id, visibility, slug, title, description, tags, industry, created_by) 
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'code-generation',
  'Code Generation',
  'Generate functional code snippets, functions, or complete programs from natural language descriptions.',
  ARRAY['coding', 'programming', 'generation'],
  'dev',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM problems WHERE slug = 'code-generation');;
-- Add sample prompts for the problems
INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, status, created_by)
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'text-summarization'),
  'public',
  'Concise Article Summarizer',
  'You are an expert at creating concise, accurate summaries. Focus on the main points and key takeaways.',
  'Please summarize the following text in 2-3 sentences, capturing the most important information:\n\n{text}',
  'gpt-4o-mini',
  '{"temperature": 0.3, "max_tokens": 150}',
  '{"text": "Artificial intelligence has made significant strides in recent years, particularly in natural language processing and computer vision. Companies are increasingly adopting AI solutions to automate tasks, improve efficiency, and gain competitive advantages. However, concerns about job displacement, privacy, and ethical implications continue to grow as AI becomes more prevalent in society."}',
  '{"summary": "AI has advanced significantly in NLP and computer vision, with companies adopting it for automation and competitive advantage. However, growing concerns exist about job displacement, privacy, and ethical implications as AI becomes more widespread."}',
  'tested',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = 'Concise Article Summarizer');

INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, status, created_by)
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'data-extraction'),
  'public',
  'Contact Information Extractor',
  'Extract contact information from text and return it in a structured JSON format. Be precise and only extract information that is clearly present.',
  'Extract all contact information from the following text and return as JSON with fields: name, email, phone, company, address:\n\n{text}',
  'gpt-4o',
  '{"temperature": 0.1, "max_tokens": 300}',
  '{"text": "Hi, I am Sarah Johnson from TechCorp Inc. You can reach me at sarah.j@techcorp.com or call (555) 123-4567. Our office is located at 123 Innovation Drive, San Francisco, CA 94105."}',
  '{"name": "Sarah Johnson", "email": "sarah.j@techcorp.com", "phone": "(555) 123-4567", "company": "TechCorp Inc.", "address": "123 Innovation Drive, San Francisco, CA 94105"}',
  'production',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = 'Contact Information Extractor');

INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, status, created_by)
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'code-generation'),
  'public',
  'Python Function Generator',
  'Generate clean, well-documented Python functions based on natural language descriptions. Include type hints and docstrings.',
  'Create a Python function that {description}. Include type hints, a docstring, and handle edge cases:\n\nFunction description: {description}',
  'claude-3.5-sonnet',
  '{"temperature": 0.3, "max_tokens": 500}',
  '{"description": "calculates the factorial of a number"}',
  '{"code": "def factorial(n: int) -> int:\n    \"\"\"\n    Calculate the factorial of a non-negative integer.\n    \n    Args:\n        n (int): A non-negative integer\n        \n    Returns:\n        int: The factorial of n\n        \n    Raises:\n        ValueError: If n is negative\n    \"\"\"\n    if n < 0:\n        raise ValueError(\"Factorial is not defined for negative numbers\")\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)"}',
  'tested',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = 'Python Function Generator');;
-- Initialize prompt stats for all prompts that don't have stats yet
INSERT INTO prompt_stats (prompt_id, upvotes, downvotes, score, copy_count, view_count, fork_count)
SELECT id, 0, 0, 0, 0, 0, 0 
FROM prompts 
WHERE id NOT IN (SELECT prompt_id FROM prompt_stats);

-- Add some sample stats to make it more interesting
UPDATE prompt_stats SET 
  upvotes = 15, 
  downvotes = 2, 
  score = 13,
  view_count = 234,
  copy_count = 45,
  fork_count = 8
WHERE prompt_id = (SELECT id FROM prompts WHERE title = 'Contact Information Extractor');

UPDATE prompt_stats SET 
  upvotes = 12, 
  downvotes = 1, 
  score = 11,
  view_count = 189,
  copy_count = 32,
  fork_count = 5
WHERE prompt_id = (SELECT id FROM prompts WHERE title = 'Concise Article Summarizer');

UPDATE prompt_stats SET 
  upvotes = 8, 
  downvotes = 3, 
  score = 5,
  view_count = 156,
  copy_count = 28,
  fork_count = 3
WHERE prompt_id = (SELECT id FROM prompts WHERE title = 'Python Function Generator');;
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
-- Temporarily disable the trigger to test signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;;
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  
  -- Create personal workspace
  PERFORM public.create_personal_workspace(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();;
-- Fix the create_personal_workspace function to have secure search_path
CREATE OR REPLACE FUNCTION public.create_personal_workspace(user_id uuid)
RETURNS uuid
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  workspace_id uuid;
  username text;
BEGIN
  -- Get username from profiles
  SELECT p.username INTO username
  FROM public.profiles p
  WHERE p.id = user_id;
  
  -- If no username found, use email prefix
  IF username IS NULL THEN
    SELECT split_part(au.email, '@', 1) INTO username
    FROM auth.users au
    WHERE au.id = user_id;
  END IF;
  
  -- Create workspace
  INSERT INTO public.workspaces (owner_id, name, slug, plan)
  VALUES (
    user_id,
    username || '''s Workspace',
    username || '-workspace',
    'free'
  )
  RETURNING id INTO workspace_id;
  
  -- Add user as owner to workspace_members
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id, user_id, 'owner');
  
  RETURN workspace_id;
END;
$$;;
-- Complete reporting and visibility system migration

-- 1. Fix the reports table structure
DROP TABLE IF EXISTS reports;

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('prompt', 'problem', 'comment')) NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add soft delete columns to prompts and problems
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add role column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user', 'moderator', 'admin')) DEFAULT 'user';

-- 4. Add visibility system to problems
-- Create visibility enum
DO $$ 
BEGIN 
  CREATE TYPE problem_visibility AS ENUM ('public', 'unlisted', 'private'); 
EXCEPTION 
  WHEN duplicate_object THEN NULL; 
END $$;

-- Add owner_id and visibility to problems
ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility problem_visibility NOT NULL DEFAULT 'public';

-- Ensure ownership is set for existing problems
UPDATE problems SET owner_id = created_by WHERE owner_id IS NULL;
ALTER TABLE problems ALTER COLUMN owner_id SET NOT NULL;

-- 5. Create problem_members table for workspace collaboration
CREATE TABLE IF NOT EXISTS problem_members (
  id BIGSERIAL PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_prompts_deleted ON prompts(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_problems_deleted ON problems(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_problems_visibility ON problems(visibility);
CREATE INDEX IF NOT EXISTS idx_problems_owner ON problems(owner_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_problem ON problem_members(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_user ON problem_members(user_id);

-- 7. Helper function for problem membership
CREATE OR REPLACE FUNCTION public.is_problem_member(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = p_problem_id
      AND pm.user_id = p_user_id
  );
$$;

-- 8. Enable RLS on new tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_members ENABLE ROW LEVEL SECURITY;

-- 9. Update problems RLS policies for visibility
DROP POLICY IF EXISTS "problems_select" ON problems;
CREATE POLICY "problems_select" ON problems FOR SELECT USING (
  is_deleted = FALSE AND (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR (visibility = 'unlisted')  -- Anyone with link can see unlisted
    OR (visibility = 'private' AND public.is_problem_member(id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "problems_insert" ON problems;
CREATE POLICY "problems_insert" ON problems FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

DROP POLICY IF EXISTS "problems_update" ON problems;
CREATE POLICY "problems_update" ON problems FOR UPDATE 
USING (owner_id = auth.uid() AND is_deleted = FALSE) 
WITH CHECK (owner_id = auth.uid() AND is_deleted = FALSE);

DROP POLICY IF EXISTS "problems_delete" ON problems;
CREATE POLICY "problems_delete" ON problems FOR DELETE USING (owner_id = auth.uid());

-- 10. Update prompts RLS policies to respect problem visibility
DROP POLICY IF EXISTS "prompts_select" ON prompts;
CREATE POLICY "prompts_select" ON prompts FOR SELECT USING (
  is_deleted = FALSE AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
      AND p.is_deleted = FALSE
      AND (
        p.visibility = 'public'
        OR p.owner_id = auth.uid()
        OR (p.visibility = 'unlisted')  -- Anyone with link can see unlisted
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, auth.uid()))
      )
  )
);

DROP POLICY IF EXISTS "prompts_insert" ON prompts;
CREATE POLICY "prompts_insert" ON prompts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
      AND p.is_deleted = FALSE
      AND (
        (p.visibility IN ('public', 'unlisted'))  -- Public and unlisted allow contributions
        OR (p.visibility = 'private' AND (
          p.owner_id = auth.uid() 
          OR public.is_problem_member(p.id, auth.uid())
        ))
      )
  )
);

-- 11. Problem members policies
DROP POLICY IF EXISTS "pm_select" ON problem_members;
CREATE POLICY "pm_select" ON problem_members FOR SELECT USING (
  public.is_problem_member(problem_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pm_insert" ON problem_members;
CREATE POLICY "pm_insert" ON problem_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = problem_members.problem_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner','admin')
  )
);

DROP POLICY IF EXISTS "pm_delete" ON problem_members;
CREATE POLICY "pm_delete" ON problem_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = problem_members.problem_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner','admin')
  )
);

-- 12. Reports policies
DROP POLICY IF EXISTS "reports_select" ON reports;
CREATE POLICY "reports_select" ON reports FOR SELECT USING (
  -- Reporters can see their own reports
  reporter_id = auth.uid()
  -- Admins can see all reports
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND reporter_id = auth.uid()
);

DROP POLICY IF EXISTS "reports_update" ON reports;
CREATE POLICY "reports_update" ON reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
-- Part 1: Fix reports table and add soft delete columns

-- 1. Fix the reports table structure
DROP TABLE IF EXISTS reports;

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('prompt', 'problem', 'comment')) NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add soft delete columns to prompts and problems
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add role column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user', 'moderator', 'admin')) DEFAULT 'user';

-- 4. Create indexes for reports and soft deletes
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_prompts_deleted ON prompts(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_problems_deleted ON problems(is_deleted) WHERE is_deleted = FALSE;

-- 5. Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;;
-- Add owner_id column carefully handling null values

-- 1. Create visibility enum first
DO $$ 
BEGIN 
  CREATE TYPE problem_visibility AS ENUM ('public', 'unlisted', 'private'); 
EXCEPTION 
  WHEN duplicate_object THEN NULL; 
END $$;

-- 2. Add owner_id column (nullable initially)
ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Get a valid user ID to use as default for null created_by values
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Get the first available user ID
    SELECT id INTO default_user_id FROM auth.users LIMIT 1;
    
    -- Update problems with null created_by to use the default user
    IF default_user_id IS NOT NULL THEN
        UPDATE problems 
        SET created_by = default_user_id 
        WHERE created_by IS NULL;
    END IF;
    
    -- Now set owner_id for all problems
    UPDATE problems SET owner_id = created_by WHERE owner_id IS NULL;
END $$;

-- 4. Make owner_id NOT NULL now that all rows have values
ALTER TABLE problems ALTER COLUMN owner_id SET NOT NULL;

-- 5. Add visibility column
ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS visibility problem_visibility NOT NULL DEFAULT 'public';;
-- Add problem_members table and helper functions

-- 1. Create problem_members table for workspace collaboration
CREATE TABLE IF NOT EXISTS problem_members (
  id BIGSERIAL PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(problem_id, user_id)
);

-- 2. Create indexes for visibility system
CREATE INDEX IF NOT EXISTS idx_problems_visibility ON problems(visibility);
CREATE INDEX IF NOT EXISTS idx_problems_owner ON problems(owner_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_problem ON problem_members(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_members_user ON problem_members(user_id);

-- 3. Helper function for problem membership
CREATE OR REPLACE FUNCTION public.is_problem_member(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = p_problem_id
      AND pm.user_id = p_user_id
  );
$$;

-- 4. Enable RLS on problem_members table
ALTER TABLE problem_members ENABLE ROW LEVEL SECURITY;;
-- Update RLS policies for visibility system

-- 1. Update problems RLS policies for visibility
DROP POLICY IF EXISTS "problems_select" ON problems;
CREATE POLICY "problems_select" ON problems FOR SELECT USING (
  is_deleted = FALSE AND (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR (visibility = 'unlisted')  -- Anyone with link can see unlisted
    OR (visibility = 'private' AND public.is_problem_member(id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "problems_insert" ON problems;
CREATE POLICY "problems_insert" ON problems FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

DROP POLICY IF EXISTS "problems_update" ON problems;
CREATE POLICY "problems_update" ON problems FOR UPDATE 
USING (owner_id = auth.uid() AND is_deleted = FALSE) 
WITH CHECK (owner_id = auth.uid() AND is_deleted = FALSE);

DROP POLICY IF EXISTS "problems_delete" ON problems;
CREATE POLICY "problems_delete" ON problems FOR DELETE USING (owner_id = auth.uid());

-- 2. Update prompts RLS policies to respect problem visibility
DROP POLICY IF EXISTS "prompts_select" ON prompts;
CREATE POLICY "prompts_select" ON prompts FOR SELECT USING (
  is_deleted = FALSE AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
      AND p.is_deleted = FALSE
      AND (
        p.visibility = 'public'
        OR p.owner_id = auth.uid()
        OR (p.visibility = 'unlisted')  -- Anyone with link can see unlisted
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, auth.uid()))
      )
  )
);

DROP POLICY IF EXISTS "prompts_insert" ON prompts;
CREATE POLICY "prompts_insert" ON prompts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
      AND p.is_deleted = FALSE
      AND (
        (p.visibility IN ('public', 'unlisted'))  -- Public and unlisted allow contributions
        OR (p.visibility = 'private' AND (
          p.owner_id = auth.uid() 
          OR public.is_problem_member(p.id, auth.uid())
        ))
      )
  )
);;
-- Add RLS policies for problem_members and reports

-- 1. Problem members policies
DROP POLICY IF EXISTS "pm_select" ON problem_members;
CREATE POLICY "pm_select" ON problem_members FOR SELECT USING (
  public.is_problem_member(problem_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pm_insert" ON problem_members;
CREATE POLICY "pm_insert" ON problem_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = problem_members.problem_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner','admin')
  )
);

DROP POLICY IF EXISTS "pm_delete" ON problem_members;
CREATE POLICY "pm_delete" ON problem_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = problem_members.problem_id
      AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM problem_members pm
    WHERE pm.problem_id = problem_members.problem_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner','admin')
  )
);

-- 2. Reports policies
DROP POLICY IF EXISTS "reports_select" ON reports;
CREATE POLICY "reports_select" ON reports FOR SELECT USING (
  -- Reporters can see their own reports
  reporter_id = auth.uid()
  -- Admins can see all reports
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND reporter_id = auth.uid()
);

DROP POLICY IF EXISTS "reports_update" ON reports;
CREATE POLICY "reports_update" ON reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);;
-- Fix function security by setting search_path

-- 1. Fix is_problem_member function
CREATE OR REPLACE FUNCTION public.is_problem_member(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.problem_members pm
    WHERE pm.problem_id = p_problem_id
      AND pm.user_id = p_user_id
  );
$$;

-- 2. Fix increment functions
CREATE OR REPLACE FUNCTION public.increment_view_count(prompt_id UUID)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.prompt_stats (prompt_id, view_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id)
  DO UPDATE SET 
    view_count = public.prompt_stats.view_count + 1,
    updated_at = NOW();
$$;

CREATE OR REPLACE FUNCTION public.increment_copy_count(prompt_id UUID)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.prompt_stats (prompt_id, copy_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id)
  DO UPDATE SET 
    copy_count = public.prompt_stats.copy_count + 1,
    updated_at = NOW();
$$;

CREATE OR REPLACE FUNCTION public.increment_fork_count(prompt_id UUID)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.prompt_stats (prompt_id, fork_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id)
  DO UPDATE SET 
    fork_count = public.prompt_stats.fork_count + 1,
    updated_at = NOW();
$$;;
-- Create function to lookup user by email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT au.id
  FROM auth.users au
  WHERE au.email = user_email
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;;
-- Create function to ensure unique tags in arrays
CREATE OR REPLACE FUNCTION public.ensure_unique_tags(tags_array TEXT[])
RETURNS TEXT[]
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT ARRAY(
    SELECT DISTINCT LOWER(TRIM(tag))
    FROM unnest(tags_array) AS tag
    WHERE TRIM(tag) != ''
    ORDER BY LOWER(TRIM(tag))
  );
$$;

-- Create trigger function to clean tags on insert/update
CREATE OR REPLACE FUNCTION public.clean_problem_tags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean and deduplicate tags
  IF NEW.tags IS NOT NULL THEN
    NEW.tags := public.ensure_unique_tags(NEW.tags);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to problems table
DROP TRIGGER IF EXISTS clean_tags_trigger ON problems;
CREATE TRIGGER clean_tags_trigger
  BEFORE INSERT OR UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION public.clean_problem_tags();;
-- Fix the RLS policies to avoid infinite recursion

-- 1. Drop existing policies
DROP POLICY IF EXISTS "pm_select" ON problem_members;
DROP POLICY IF EXISTS "pm_insert" ON problem_members;
DROP POLICY IF EXISTS "pm_delete" ON problem_members;

-- 2. Create simpler, non-recursive policies
-- Members can see other members if they are a member themselves OR if they own the problem
CREATE POLICY "pm_select" ON problem_members FOR SELECT USING (
  -- User is a member of this problem
  user_id = auth.uid()
  OR problem_id IN (
    SELECT pm.problem_id 
    FROM problem_members pm 
    WHERE pm.user_id = auth.uid()
  )
  OR problem_id IN (
    SELECT p.id 
    FROM problems p 
    WHERE p.owner_id = auth.uid()
  )
);

-- Only problem owners can add members (simplified)
CREATE POLICY "pm_insert" ON problem_members FOR INSERT WITH CHECK (
  problem_id IN (
    SELECT p.id 
    FROM problems p 
    WHERE p.owner_id = auth.uid()
  )
);

-- Only problem owners can remove members (simplified)
CREATE POLICY "pm_delete" ON problem_members FOR DELETE USING (
  problem_id IN (
    SELECT p.id 
    FROM problems p 
    WHERE p.owner_id = auth.uid()
  )
  OR user_id = auth.uid() -- Users can remove themselves
);;
-- Completely fix the member management system

-- 1. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "pm_select" ON problem_members;
DROP POLICY IF EXISTS "pm_insert" ON problem_members;
DROP POLICY IF EXISTS "pm_delete" ON problem_members;
DROP POLICY IF EXISTS "pm_update" ON problem_members;

-- 2. Create very simple, non-recursive policies
-- Allow users to see members if they own the problem OR if they are a member
CREATE POLICY "problem_members_select_policy" ON problem_members FOR SELECT USING (
  -- User owns the problem
  EXISTS (
    SELECT 1 FROM problems p 
    WHERE p.id = problem_members.problem_id 
    AND p.owner_id = auth.uid()
  )
  -- OR user is themselves in the member list
  OR user_id = auth.uid()
);

-- Only problem owners can add members
CREATE POLICY "problem_members_insert_policy" ON problem_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM problems p 
    WHERE p.id = problem_members.problem_id 
    AND p.owner_id = auth.uid()
  )
);

-- Problem owners and the member themselves can remove memberships
CREATE POLICY "problem_members_delete_policy" ON problem_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM problems p 
    WHERE p.id = problem_members.problem_id 
    AND p.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);;
-- Clean up all existing problems policies and create new ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view non-deleted public problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can create problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can delete their problems" ON problems;
DROP POLICY IF EXISTS "Workspace members can update their problems" ON problems;
DROP POLICY IF EXISTS "problems_delete" ON problems;
DROP POLICY IF EXISTS "problems_insert" ON problems;
DROP POLICY IF EXISTS "problems_select" ON problems;
DROP POLICY IF EXISTS "problems_update" ON problems;

-- Create new, clean policies
-- SELECT: Users can see problems based on visibility and membership
CREATE POLICY "problems_select_policy" ON problems FOR SELECT USING (
  is_deleted = FALSE AND (
    -- Public problems
    visibility = 'public'
    -- Unlisted problems (anyone with link)
    OR visibility = 'unlisted'
    -- Private problems (owner or members)
    OR (visibility = 'private' AND (
      owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM problem_members pm 
        WHERE pm.problem_id = problems.id 
        AND pm.user_id = auth.uid()
      )
    ))
    -- Owner can always see their problems
    OR owner_id = auth.uid()
  )
);

-- INSERT: Authenticated users can create problems
CREATE POLICY "problems_insert_policy" ON problems FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

-- UPDATE: Only owners can update their problems
CREATE POLICY "problems_update_policy" ON problems FOR UPDATE 
USING (owner_id = auth.uid() AND is_deleted = FALSE) 
WITH CHECK (owner_id = auth.uid() AND is_deleted = FALSE);

-- DELETE: Only owners can delete their problems
CREATE POLICY "problems_delete_policy" ON problems FOR DELETE USING (
  owner_id = auth.uid()
);;
-- Fix prompts policies to work with new problem membership system

-- Drop existing prompts policies
DROP POLICY IF EXISTS "prompts_select" ON prompts;
DROP POLICY IF EXISTS "prompts_insert" ON prompts;
DROP POLICY IF EXISTS "prompts_update" ON prompts;
DROP POLICY IF EXISTS "prompts_delete" ON prompts;

-- Create new prompts policies
-- SELECT: Users can see prompts if they can see the parent problem
CREATE POLICY "prompts_select_policy" ON prompts FOR SELECT USING (
  is_deleted = FALSE AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
    AND p.is_deleted = FALSE
    AND (
      -- Public problems
      p.visibility = 'public'
      -- Unlisted problems
      OR p.visibility = 'unlisted'
      -- Private problems (owner or members)
      OR (p.visibility = 'private' AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM problem_members pm
          WHERE pm.problem_id = p.id
          AND pm.user_id = auth.uid()
        )
      ))
      -- Owner can always see
      OR p.owner_id = auth.uid()
    )
  )
);

-- INSERT: Users can create prompts if they can contribute to the problem
CREATE POLICY "prompts_insert_policy" ON prompts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
    AND p.is_deleted = FALSE
    AND (
      -- Public and unlisted allow contributions
      p.visibility IN ('public', 'unlisted')
      -- Private problems: owner or members can contribute
      OR (p.visibility = 'private' AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM problem_members pm
          WHERE pm.problem_id = p.id
          AND pm.user_id = auth.uid()
        )
      ))
    )
  )
);

-- UPDATE: Only prompt creators can update their prompts
CREATE POLICY "prompts_update_policy" ON prompts FOR UPDATE 
USING (created_by = auth.uid() AND is_deleted = FALSE)
WITH CHECK (created_by = auth.uid() AND is_deleted = FALSE);

-- DELETE: Only prompt creators can delete their prompts
CREATE POLICY "prompts_delete_policy" ON prompts FOR DELETE USING (
  created_by = auth.uid()
);;
-- Fix RLS policies for member access to private problems

-- Drop and recreate the problems select policy to ensure it's correct
DROP POLICY IF EXISTS "problems_select_policy" ON problems;
CREATE POLICY "problems_select_policy" ON problems FOR SELECT USING (
  is_deleted = FALSE AND (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR (visibility = 'unlisted')  -- Anyone with link can see unlisted
    OR (visibility = 'private' AND public.is_problem_member(id, auth.uid()))
  )
);

-- Also ensure prompts policy is correct
DROP POLICY IF EXISTS "prompts_select_policy" ON prompts;
CREATE POLICY "prompts_select_policy" ON prompts FOR SELECT USING (
  is_deleted = FALSE AND EXISTS (
    SELECT 1 FROM problems p
    WHERE p.id = prompts.problem_id
      AND p.is_deleted = FALSE
      AND (
        p.visibility = 'public'
        OR p.owner_id = auth.uid()
        OR (p.visibility = 'unlisted')  -- Anyone with link can see unlisted
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, auth.uid()))
      )
  )
);;
-- Add missing owner memberships for private problems
INSERT INTO problem_members (problem_id, user_id, role)
SELECT p.id, p.owner_id, 'owner'
FROM problems p
WHERE p.visibility = 'private'
  AND p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM problem_members pm 
    WHERE pm.problem_id = p.id AND pm.user_id = p.owner_id
  );;
-- Add improvement tracking to prompts
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS improvement_summary TEXT,
  ADD COLUMN IF NOT EXISTS best_for TEXT[] DEFAULT '{}';

-- Add pinned prompt to problems
ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS pinned_prompt_id UUID REFERENCES prompts(id);

-- Add onboarding and reputation to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upvotes_received INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forks_received INT DEFAULT 0;

-- Create prompt_reviews table for criteria-based voting
CREATE TABLE IF NOT EXISTS prompt_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criteria_met TEXT[] DEFAULT '{}',
  criteria_failed TEXT[] DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);;
-- Create the missing helper functions
CREATE OR REPLACE FUNCTION public.can_view_problem(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM problems p
    WHERE p.id = p_problem_id
      AND COALESCE(p.is_deleted, FALSE) = FALSE
      AND (
        p.visibility = 'public'
        OR p.owner_id = p_user_id
        OR (p.visibility = 'unlisted')
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, p_user_id))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_contribute_problem(p_problem_id UUID, p_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM problems p
    WHERE p.id = p_problem_id
      AND COALESCE(p.is_deleted, FALSE) = FALSE
      AND (
        (p.visibility IN ('public', 'unlisted') AND p_user_id IS NOT NULL)
        OR p.owner_id = p_user_id
        OR (p.visibility = 'private' AND public.is_problem_member(p.id, p_user_id))
      )
  );
$$;;
-- Enable RLS on prompt_reviews
ALTER TABLE prompt_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_reviews
DROP POLICY IF EXISTS "prompt_reviews_select" ON prompt_reviews;
CREATE POLICY "prompt_reviews_select" ON prompt_reviews FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM prompts pr
    WHERE pr.id = prompt_reviews.prompt_id
      AND COALESCE(pr.is_deleted, FALSE) = FALSE
      AND public.can_view_problem(pr.problem_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "prompt_reviews_insert" ON prompt_reviews;
CREATE POLICY "prompt_reviews_insert" ON prompt_reviews FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM prompts pr
    WHERE pr.id = prompt_reviews.prompt_id
      AND COALESCE(pr.is_deleted, FALSE) = FALSE
      AND public.can_contribute_problem(pr.problem_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "prompt_reviews_update" ON prompt_reviews;
CREATE POLICY "prompt_reviews_update" ON prompt_reviews FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prompt_reviews_delete" ON prompt_reviews;
CREATE POLICY "prompt_reviews_delete" ON prompt_reviews FOR DELETE 
USING (user_id = auth.uid());;
-- Remove the conflicting prompts_select_policy
DROP POLICY IF EXISTS "prompts_select_policy" ON prompts;

-- Ensure the correct policy exists and is properly named
DROP POLICY IF EXISTS "Anyone can view non-deleted public prompts" ON prompts;

-- Create a single, clear RLS policy for prompts
CREATE POLICY "prompts_public_select_policy" ON prompts
  FOR SELECT
  USING (
    (is_deleted = false OR is_deleted IS NULL) AND (
      -- Public prompts that are listed and not hidden
      (visibility = 'public' AND is_listed = true AND (is_hidden = false OR is_hidden IS NULL))
      OR
      -- Unlisted prompts that are not hidden (accessible via direct link)
      (visibility = 'unlisted' AND (is_hidden = false OR is_hidden IS NULL))
      OR
      -- Private prompts for workspace members
      (visibility = 'private' AND is_workspace_member(workspace_id, auth.uid()) AND (is_hidden = false OR is_hidden IS NULL))
      OR
      -- User's own prompts (regardless of visibility)
      (created_by = auth.uid())
    )
  );;
