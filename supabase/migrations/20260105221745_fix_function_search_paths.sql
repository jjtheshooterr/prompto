-- Fix search_path security warnings by setting explicit search_path
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_members.workspace_id = $1 
    AND workspace_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;;
