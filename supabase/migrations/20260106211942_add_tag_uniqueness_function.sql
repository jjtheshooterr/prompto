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
