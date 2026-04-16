-- SQL Migration to fix SECURITY DEFINER vulnerabilities in Rate Limiting Functions

-- 1. Fix Create Rate Limit Function
CREATE OR REPLACE FUNCTION enforce_create_rate_limit() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  INSERT INTO user_rate_limits (user_id, action, window_start, count)
  VALUES (auth.uid(), 'create_prompt', CURRENT_DATE, 1)
  ON CONFLICT (user_id, action, window_start) 
  DO UPDATE SET count = user_rate_limits.count + 1
  RETURNING count INTO current_count;

  IF current_count > 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 50 new prompts per day per user.';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Fix Edit Rate Limit Function
CREATE OR REPLACE FUNCTION enforce_edit_rate_limit() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  INSERT INTO user_rate_limits (user_id, action, window_start, count)
  VALUES (auth.uid(), 'edit_prompt', CURRENT_DATE, 1)
  ON CONFLICT (user_id, action, window_start) 
  DO UPDATE SET count = user_rate_limits.count + 1
  RETURNING count INTO current_count;

  IF current_count > 300 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 300 prompt edits per day per user.';
  END IF;

  RETURN NEW;
END;
$$;
