-- Add slug column to prompts table for SEO-friendly URLs
ALTER TABLE prompts ADD COLUMN slug TEXT;

-- Add unique constraint on workspace_id and slug
ALTER TABLE prompts ADD CONSTRAINT prompts_workspace_slug_unique UNIQUE (workspace_id, slug);

-- Create index for performance
CREATE INDEX idx_prompts_slug ON prompts(slug);
