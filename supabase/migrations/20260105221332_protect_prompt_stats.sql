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
