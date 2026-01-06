-- SQL functions for updating prompt stats

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, view_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE SET
    view_count = prompt_stats.view_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment copy count
CREATE OR REPLACE FUNCTION increment_copy_count(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, copy_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE SET
    copy_count = prompt_stats.copy_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment fork count
CREATE OR REPLACE FUNCTION increment_fork_count(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO prompt_stats (prompt_id, fork_count)
  VALUES (prompt_id, 1)
  ON CONFLICT (prompt_id) DO UPDATE SET
    fork_count = prompt_stats.fork_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;