-- Migration: Hybrid Scoring System and Rate Limiting
-- Phase 1 & 2 Implementation

-- 1. Rate Limiting Table
CREATE TABLE IF NOT EXISTS user_rate_limits (
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('create_prompt', 'edit_prompt')),
  window_start    DATE NOT NULL DEFAULT CURRENT_DATE,
  count           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action, window_start)
);

-- RLS for Rate Limits
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own limits" ON user_rate_limits 
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Trigger Function: Enforce Create Rate Limit (50/day)
CREATE OR REPLACE FUNCTION enforce_create_rate_limit() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_create_rate_limit ON prompts;
CREATE TRIGGER check_create_rate_limit
  BEFORE INSERT ON prompts
  FOR EACH ROW EXECUTE FUNCTION enforce_create_rate_limit();

-- 3. Trigger Function: Enforce Edit Rate Limit (300/day)
CREATE OR REPLACE FUNCTION enforce_edit_rate_limit() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_edit_rate_limit ON prompts;
CREATE TRIGGER check_edit_rate_limit
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION enforce_edit_rate_limit();


-- 4. Add Scoring Columns to prompt_stats
ALTER TABLE prompt_stats
  ADD COLUMN IF NOT EXISTS structure_score   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_quality_score  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_score     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_scored_at      TIMESTAMPTZ;

-- 5. Postgres Function: Calculate Structure Score (0-70 points)
CREATE OR REPLACE FUNCTION calculate_structure_score(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
  rec RECORD;
  s   INTEGER := 0;
BEGIN
  SELECT system_prompt, user_prompt_template, example_input, example_output,
         usage_context, tradeoffs, model, depth
  INTO   rec
  FROM   prompts WHERE id = p_id;

  IF rec.system_prompt IS NOT NULL AND length(trim(rec.system_prompt)) > 20 THEN s := s + 10; END IF;
  IF rec.user_prompt_template IS NOT NULL AND length(trim(rec.user_prompt_template)) > 20 THEN s := s + 8; END IF;
  IF rec.example_input  IS NOT NULL AND rec.example_input  <> '' THEN s := s + 6; END IF;
  IF rec.example_output IS NOT NULL AND rec.example_output <> '' THEN s := s + 6; END IF;
  IF rec.usage_context IS NOT NULL AND length(trim(rec.usage_context)) > 10 THEN s := s + 8; END IF;
  IF rec.tradeoffs IS NOT NULL AND length(trim(rec.tradeoffs)) > 10 THEN s := s + 7; END IF;
  IF rec.model IS NOT NULL AND length(trim(rec.model)) > 0 THEN s := s + 5; END IF;
  s := s + LEAST(15, COALESCE(rec.depth, 0) * 5);

  RETURN LEAST(70, s);
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Postgres Function: Calculate Aggregate Quality Score
CREATE OR REPLACE FUNCTION calculate_quality_score(
  p_structure_score   INTEGER,
  p_ai_score          INTEGER,
  p_upvotes           INTEGER,
  p_downvotes         INTEGER,
  p_works_count       INTEGER,
  p_fails_count       INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  total_interactions INTEGER;
  weight_s NUMERIC; weight_ai NUMERIC; weight_c NUMERIC; z NUMERIC := 1.96;
  vote_total INTEGER; review_total INTEGER; p_val NUMERIC;
  vote_wilson NUMERIC := 0; review_wilson NUMERIC := 0; community_score NUMERIC;
BEGIN
  total_interactions := COALESCE(p_upvotes, 0) + COALESCE(p_downvotes, 0) + COALESCE(p_works_count, 0) + COALESCE(p_fails_count, 0);

  -- Dynamic weights prioritizing community over time
  IF total_interactions < 5 THEN
    weight_s := 0.65; weight_ai := 0.30; weight_c := 0.05;
  ELSIF total_interactions < 15 THEN
    weight_s := 0.45; weight_ai := 0.25; weight_c := 0.30;
  ELSIF total_interactions < 30 THEN
    weight_s := 0.25; weight_ai := 0.20; weight_c := 0.55;
  ELSE
    weight_s := 0.15; weight_ai := 0.15; weight_c := 0.70;
  END IF;

  vote_total := COALESCE(p_upvotes, 0) + COALESCE(p_downvotes, 0);
  IF vote_total > 0 THEN
    p_val := COALESCE(p_upvotes, 0)::NUMERIC / vote_total;
    vote_wilson := (p_val + z*z/(2*vote_total) - z*sqrt((p_val*(1-p_val)+z*z/(4*vote_total))/vote_total)) / (1+z*z/vote_total);
  END IF;

  review_total := COALESCE(p_works_count, 0) + COALESCE(p_fails_count, 0);
  IF review_total > 0 THEN
    p_val := COALESCE(p_works_count, 0)::NUMERIC / review_total;
    review_wilson := (p_val + z*z/(2*review_total) - z*sqrt((p_val*(1-p_val)+z*z/(4*review_total))/review_total)) / (1+z*z/review_total);
  END IF;

  community_score := (vote_wilson * 50) + (review_wilson * 50);

  RETURN GREATEST(0, LEAST(100, ROUND(
    (COALESCE(p_structure_score, 0) * weight_s / 0.70) * weight_s * 100
    + COALESCE(p_ai_score, 0) * weight_ai
    + community_score * weight_c
  )));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Trigger Function: Auto-Update Scores on Prompt Edit
CREATE OR REPLACE FUNCTION trigger_update_scores() RETURNS TRIGGER AS $$
DECLARE
  s_score INTEGER;
  stats   RECORD;
BEGIN
  s_score := calculate_structure_score(NEW.id);
  
  -- Use a sub-transaction block to gracefully handle concurrent operations or missing stats rows initially
  BEGIN
    SELECT * INTO stats FROM prompt_stats WHERE prompt_id = NEW.id;
    IF FOUND THEN
      UPDATE prompt_stats SET
        structure_score = s_score,
        quality_score = calculate_quality_score(
          s_score, COALESCE(stats.ai_quality_score, 0),
          COALESCE(stats.upvotes, 0), COALESCE(stats.downvotes, 0), 
          COALESCE(stats.works_count, 0), COALESCE(stats.fails_count, 0)
        )
      WHERE prompt_id = NEW.id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors during stats update in trigger to prevent prompt insert from failing
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prompts_score_update ON prompts;
CREATE TRIGGER prompts_score_update
AFTER INSERT OR UPDATE OF system_prompt, user_prompt_template, example_input, example_output, usage_context, tradeoffs, model, depth
ON prompts FOR EACH ROW EXECUTE FUNCTION trigger_update_scores();

-- 8. Trigger Function: Update quality_score when ai_quality_score or community votes change in prompt_stats
CREATE OR REPLACE FUNCTION trigger_recalc_quality_score() RETURNS TRIGGER AS $$
BEGIN
  NEW.quality_score := calculate_quality_score(
    COALESCE(NEW.structure_score, 0),
    COALESCE(NEW.ai_quality_score, 0),
    COALESCE(NEW.upvotes, 0),
    COALESCE(NEW.downvotes, 0),
    COALESCE(NEW.works_count, 0),
    COALESCE(NEW.fails_count, 0)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalc_quality_score_on_stats_update ON prompt_stats;
CREATE TRIGGER recalc_quality_score_on_stats_update
BEFORE UPDATE OF ai_quality_score, upvotes, downvotes, works_count, fails_count, structure_score
ON prompt_stats FOR EACH ROW EXECUTE FUNCTION trigger_recalc_quality_score();
