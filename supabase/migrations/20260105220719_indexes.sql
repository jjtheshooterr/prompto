-- Create indexes for performance
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_workspace_visibility ON problems(workspace_id, visibility);
CREATE INDEX idx_problems_visibility_listed ON problems(visibility, is_listed) WHERE NOT is_hidden;
CREATE INDEX idx_prompts_problem_visibility ON prompts(problem_id, visibility);
CREATE INDEX idx_prompts_workspace ON prompts(workspace_id);
CREATE INDEX idx_votes_prompt ON votes(prompt_id);
CREATE INDEX idx_prompt_events_prompt ON prompt_events(prompt_id);
CREATE INDEX idx_prompt_events_type ON prompt_events(event_type);;
