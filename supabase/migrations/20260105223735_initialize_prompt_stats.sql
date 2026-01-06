-- Initialize prompt stats for all prompts that don't have stats yet
INSERT INTO prompt_stats (prompt_id, upvotes, downvotes, score, copy_count, view_count, fork_count)
SELECT id, 0, 0, 0, 0, 0, 0 
FROM prompts 
WHERE id NOT IN (SELECT prompt_id FROM prompt_stats);

-- Add some sample stats to make it more interesting
UPDATE prompt_stats SET 
  upvotes = 15, 
  downvotes = 2, 
  score = 13,
  view_count = 234,
  copy_count = 45,
  fork_count = 8
WHERE prompt_id = (SELECT id FROM prompts WHERE title = 'Contact Information Extractor');

UPDATE prompt_stats SET 
  upvotes = 12, 
  downvotes = 1, 
  score = 11,
  view_count = 189,
  copy_count = 32,
  fork_count = 5
WHERE prompt_id = (SELECT id FROM prompts WHERE title = 'Concise Article Summarizer');

UPDATE prompt_stats SET 
  upvotes = 8, 
  downvotes = 3, 
  score = 5,
  view_count = 156,
  copy_count = 28,
  fork_count = 3
WHERE prompt_id = (SELECT id FROM prompts WHERE title = 'Python Function Generator');;
