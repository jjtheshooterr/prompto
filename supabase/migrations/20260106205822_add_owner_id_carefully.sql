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
