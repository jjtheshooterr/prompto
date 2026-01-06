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
