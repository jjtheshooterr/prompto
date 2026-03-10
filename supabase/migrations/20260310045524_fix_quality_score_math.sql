-- Fix quality_score algorithm math (removed rogue * 100 maxing it out to 4000)

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
    (COALESCE(p_structure_score, 0)::NUMERIC / 0.70) * weight_s
    + (COALESCE(p_ai_score, 0)::NUMERIC / 0.30) * weight_ai
    + community_score * weight_c
  )));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger updates to re-calculate everyone immediately
UPDATE prompt_stats SET structure_score = structure_score;
