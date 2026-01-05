-- Create trigger for auto workspace creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_personal_workspace();

-- Create function to update prompt stats
CREATE OR REPLACE FUNCTION update_prompt_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO prompt_stats (prompt_id, upvotes, downvotes, score)
    VALUES (NEW.prompt_id, 
            CASE WHEN NEW.value = 1 THEN 1 ELSE 0 END,
            CASE WHEN NEW.value = -1 THEN 1 ELSE 0 END,
            NEW.value)
    ON CONFLICT (prompt_id) DO UPDATE SET
      upvotes = prompt_stats.upvotes + CASE WHEN NEW.value = 1 THEN 1 ELSE 0 END,
      downvotes = prompt_stats.downvotes + CASE WHEN NEW.value = -1 THEN 1 ELSE 0 END,
      score = prompt_stats.score + NEW.value,
      updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE prompt_stats SET
      upvotes = upvotes - CASE WHEN OLD.value = 1 THEN 1 ELSE 0 END + CASE WHEN NEW.value = 1 THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN OLD.value = -1 THEN 1 ELSE 0 END + CASE WHEN NEW.value = -1 THEN 1 ELSE 0 END,
      score = score - OLD.value + NEW.value,
      updated_at = NOW()
    WHERE prompt_id = NEW.prompt_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prompt_stats SET
      upvotes = upvotes - CASE WHEN OLD.value = 1 THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN OLD.value = -1 THEN 1 ELSE 0 END,
      score = score - OLD.value,
      updated_at = NOW()
    WHERE prompt_id = OLD.prompt_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote stats
CREATE TRIGGER vote_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_prompt_stats();;
