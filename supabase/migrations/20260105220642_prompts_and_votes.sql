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
