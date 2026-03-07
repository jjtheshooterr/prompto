-- Add short_id column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'short_id') THEN
        ALTER TABLE problems ADD COLUMN short_id TEXT;
    END IF;
END $$;

-- Populate existing rows
UPDATE problems SET short_id = LEFT(id::text, 8) WHERE short_id IS NULL;

-- Automatically set short_id for new rows
CREATE OR REPLACE FUNCTION set_problem_short_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NOT NULL THEN
        NEW.short_id := LEFT(NEW.id::text, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS problems_set_short_id ON problems;
CREATE TRIGGER problems_set_short_id
    BEFORE INSERT ON problems
    FOR EACH ROW
    EXECUTE FUNCTION set_problem_short_id();

-- Ensure all existing problems have a slug (using title) if they didn't
UPDATE problems 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE slug IS NULL OR slug = '';
