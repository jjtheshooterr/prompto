-- Add is_listed to prompts table
ALTER TABLE prompts ADD COLUMN is_listed BOOLEAN DEFAULT TRUE;;
