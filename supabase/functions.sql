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

-- Function to recalculate vote stats for a prompt
CREATE OR REPLACE FUNCTION recalculate_vote_stats(prompt_id UUID)
RETURNS VOID AS $
DECLARE
  upvote_count INTEGER;
  downvote_count INTEGER;
  total_score INTEGER;
BEGIN
  -- Count upvotes and downvotes
  SELECT 
    COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(value), 0)
  INTO upvote_count, downvote_count, total_score
  FROM votes 
  WHERE votes.prompt_id = recalculate_vote_stats.prompt_id;

  -- Update or insert prompt_stats
  INSERT INTO prompt_stats (prompt_id, upvotes, downvotes, score)
  VALUES (prompt_id, upvote_count, downvote_count, total_score)
  ON CONFLICT (prompt_id) DO UPDATE SET
    upvotes = upvote_count,
    downvotes = downvote_count,
    score = total_score,
    updated_at = NOW();
END;
$ LANGUAGE plpgsql SECURITY DEFINER;