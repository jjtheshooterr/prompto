-- Seeding Prompts (Forks)

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'landing-page-message-test', 
  'Landing Page Message Testing', 
  'Generate 5 positioning angles, choose the strongest, then write a full landing page and explain why this angle wins.', 
  (SELECT id FROM problems WHERE slug = 'write-high-converting-landing-page'), 
  (SELECT id FROM prompts WHERE slug = 'landing-page-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'landing-page-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'landing-page-short', 
  'Short-Form Landing Page', 
  'Write a concise landing page optimized for fast scanning and conversions.', 
  (SELECT id FROM problems WHERE slug = 'write-high-converting-landing-page'), 
  (SELECT id FROM prompts WHERE slug = 'landing-page-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'landing-page-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'seo-outline-gap', 
  'SEO Outline with Content Gaps', 
  'Analyze likely competitor gaps and build an outline that fills them.', 
  (SELECT id FROM problems WHERE slug = 'seo-blog-post-outline'), 
  (SELECT id FROM prompts WHERE slug = 'seo-outline-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'seo-outline-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'seo-outline-snippet', 
  'SEO Outline for Featured Snippets', 
  'Optimize outline sections specifically for featured snippets.', 
  (SELECT id FROM problems WHERE slug = 'seo-blog-post-outline'), 
  (SELECT id FROM prompts WHERE slug = 'seo-outline-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'seo-outline-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'cold-email-a-b', 
  'Cold Email A/B Variants', 
  'Generate two variants: direct and friendly. Explain intent differences.', 
  (SELECT id FROM problems WHERE slug = 'cold-email-personalized'), 
  (SELECT id FROM prompts WHERE slug = 'cold-email-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'cold-email-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'cold-email-followup', 
  'Cold Email Follow-Up', 
  'Write a polite follow-up email referencing the original message.', 
  (SELECT id FROM problems WHERE slug = 'cold-email-personalized'), 
  (SELECT id FROM prompts WHERE slug = 'cold-email-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'cold-email-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'react-debug-hooks', 
  'React Hooks Edge Cases', 
  'Debug issues related to hooks, dependencies, and stale state.', 
  (SELECT id FROM problems WHERE slug = 'react-bug-triage'), 
  (SELECT id FROM prompts WHERE slug = 'react-debug-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'react-debug-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'react-debug-performance', 
  'React Performance Debug', 
  'Identify unnecessary re-renders and performance bottlenecks.', 
  (SELECT id FROM problems WHERE slug = 'react-bug-triage'), 
  (SELECT id FROM prompts WHERE slug = 'react-debug-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'react-debug-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'rls-admin', 
  'Advanced RLS with Admin Roles', 
  'Extend RLS with admin roles and least-privilege access.', 
  (SELECT id FROM problems WHERE slug = 'supabase-rls-generator'), 
  (SELECT id FROM prompts WHERE slug = 'rls-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'rls-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'rls-soft-delete', 
  'RLS with Soft Deletes', 
  'Add soft-delete logic while preserving security.', 
  (SELECT id FROM problems WHERE slug = 'supabase-rls-generator'), 
  (SELECT id FROM prompts WHERE slug = 'rls-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'rls-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'yt-curiosity', 
  'Curiosity-Driven Titles', 
  'Generate curiosity-based titles without clickbait.', 
  (SELECT id FROM problems WHERE slug = 'youtube-title-thumbnail'), 
  (SELECT id FROM prompts WHERE slug = 'yt-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'yt-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'yt-education', 
  'Educational YouTube Titles', 
  'Generate titles optimized for learning-focused audiences.', 
  (SELECT id FROM problems WHERE slug = 'youtube-title-thumbnail'), 
  (SELECT id FROM prompts WHERE slug = 'yt-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'yt-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'shorts-editing', 
  'Shorts Editing Notes', 
  'Add b-roll, captions, and pacing suggestions.', 
  (SELECT id FROM problems WHERE slug = 'shorts-script-hooks'), 
  (SELECT id FROM prompts WHERE slug = 'shorts-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'shorts-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'shorts-hooks-only', 
  'Shorts Hook Generator', 
  'Generate 10 opening hooks for Shorts.', 
  (SELECT id FROM problems WHERE slug = 'shorts-script-hooks'), 
  (SELECT id FROM prompts WHERE slug = 'shorts-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'shorts-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'meeting-summary', 
  'Meeting Summary Generator', 
  'Write a concise executive summary from meeting notes.', 
  (SELECT id FROM problems WHERE slug = 'meeting-notes-actions'), 
  (SELECT id FROM prompts WHERE slug = 'meeting-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'meeting-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'meeting-followups', 
  'Meeting Follow-Up Email', 
  'Generate a follow-up email summarizing action items.', 
  (SELECT id FROM problems WHERE slug = 'meeting-notes-actions'), 
  (SELECT id FROM prompts WHERE slug = 'meeting-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'meeting-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pricing-value', 
  'Value-Based Pricing', 
  'Create pricing based on customer value metrics rather than cost-plus.', 
  (SELECT id FROM problems WHERE slug = 'saas-pricing-strategy'), 
  (SELECT id FROM prompts WHERE slug = 'pricing-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'pricing-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pricing-freemium', 
  'Freemium Pricing Model', 
  'Design a freemium model with clear upgrade triggers.', 
  (SELECT id FROM problems WHERE slug = 'saas-pricing-strategy'), 
  (SELECT id FROM prompts WHERE slug = 'pricing-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'pricing-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sql-index', 
  'SQL Index Recommendations', 
  'Suggest optimal indexes for query performance.', 
  (SELECT id FROM problems WHERE slug = 'sql-query-optimizer'), 
  (SELECT id FROM prompts WHERE slug = 'sql-optimize-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'sql-optimize-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sql-explain', 
  'SQL Execution Plan Analysis', 
  'Interpret EXPLAIN output and identify bottlenecks.', 
  (SELECT id FROM problems WHERE slug = 'sql-query-optimizer'), 
  (SELECT id FROM prompts WHERE slug = 'sql-optimize-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'sql-optimize-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'resume-action', 
  'Action-Driven Resume Bullets', 
  'Start each bullet with strong action verbs and quantify impact.', 
  (SELECT id FROM problems WHERE slug = 'resume-bullet-metrics'), 
  (SELECT id FROM prompts WHERE slug = 'resume-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'resume-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'resume-star', 
  'STAR Method Resume Bullets', 
  'Use Situation, Task, Action, Result framework for bullets.', 
  (SELECT id FROM problems WHERE slug = 'resume-bullet-metrics'), 
  (SELECT id FROM prompts WHERE slug = 'resume-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'resume-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'support-refund', 
  'Refund Request Response', 
  'Handle refund requests professionally while protecting company interests.', 
  (SELECT id FROM problems WHERE slug = 'customer-support-reply'), 
  (SELECT id FROM prompts WHERE slug = 'support-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'support-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'support-bug', 
  'Bug Report Response', 
  'Acknowledge bug reports and set clear expectations.', 
  (SELECT id FROM problems WHERE slug = 'customer-support-reply'), 
  (SELECT id FROM prompts WHERE slug = 'support-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'support-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prd-technical', 
  'Technical PRD', 
  'Add technical specifications, API contracts, and data models to PRD.', 
  (SELECT id FROM problems WHERE slug = 'feature-requirements-doc'), 
  (SELECT id FROM prompts WHERE slug = 'prd-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prd-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prd-one-pager', 
  'One-Page PRD', 
  'Condense PRD into a single-page executive format.', 
  (SELECT id FROM problems WHERE slug = 'feature-requirements-doc'), 
  (SELECT id FROM prompts WHERE slug = 'prd-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prd-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'api-openapi', 
  'OpenAPI Specification', 
  'Generate OpenAPI/Swagger spec from API description.', 
  (SELECT id FROM problems WHERE slug = 'api-documentation'), 
  (SELECT id FROM prompts WHERE slug = 'api-docs-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'api-docs-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'api-sdk', 
  'SDK Documentation', 
  'Write SDK documentation with code examples in multiple languages.', 
  (SELECT id FROM problems WHERE slug = 'api-documentation'), 
  (SELECT id FROM prompts WHERE slug = 'api-docs-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'api-docs-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-benchmark', 
  'Prompt Benchmarking', 
  'Create a systematic benchmark for prompt performance.', 
  (SELECT id FROM problems WHERE slug = 'prompt-evaluation'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-eval-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-eval-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-ab-test', 
  'Prompt A/B Testing', 
  'Design an A/B test framework for prompt optimization.', 
  (SELECT id FROM problems WHERE slug = 'prompt-evaluation'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-eval-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-eval-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'job-desc-dei', 
  'Inclusive Job Description', 
  'Remove biased language and make job description more inclusive.', 
  (SELECT id FROM problems WHERE slug = 'job-description'), 
  (SELECT id FROM prompts WHERE slug = 'job-desc-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'job-desc-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'job-desc-remote', 
  'Remote Job Description', 
  'Optimize job description for remote-first roles.', 
  (SELECT id FROM problems WHERE slug = 'job-description'), 
  (SELECT id FROM prompts WHERE slug = 'job-desc-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'job-desc-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'linkedin-thought', 
  'Thought Leadership Post', 
  'Position yourself as an expert with insights and analysis.', 
  (SELECT id FROM problems WHERE slug = 'linkedin-post'), 
  (SELECT id FROM prompts WHERE slug = 'linkedin-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'linkedin-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'linkedin-carousel', 
  'LinkedIn Carousel Post', 
  'Create a multi-slide carousel post with key points.', 
  (SELECT id FROM problems WHERE slug = 'linkedin-post'), 
  (SELECT id FROM prompts WHERE slug = 'linkedin-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'linkedin-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ad-copy-pain', 
  'Pain-Point Ad Copy', 
  'Focus on customer pain points and urgent solutions.', 
  (SELECT id FROM problems WHERE slug = 'ad-copy-variants'), 
  (SELECT id FROM prompts WHERE slug = 'ad-copy-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ad-copy-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ad-copy-benefit', 
  'Benefit-Driven Ad Copy', 
  'Emphasize benefits and transformation over features.', 
  (SELECT id FROM problems WHERE slug = 'ad-copy-variants'), 
  (SELECT id FROM prompts WHERE slug = 'ad-copy-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ad-copy-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ux-copy-onboarding', 
  'Onboarding Microcopy', 
  'Guide users through onboarding with clear, encouraging copy.', 
  (SELECT id FROM problems WHERE slug = 'ux-copy-variants'), 
  (SELECT id FROM prompts WHERE slug = 'ux-copy-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ux-copy-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ux-copy-empty-states', 
  'Empty State Microcopy', 
  'Turn empty states into opportunities with actionable copy.', 
  (SELECT id FROM problems WHERE slug = 'ux-copy-empty'), 
  (SELECT id FROM prompts WHERE slug = 'ux-copy-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ux-copy-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'error-technical', 
  'Technical Error Messages', 
  'Balance technical accuracy with user-friendliness.', 
  (SELECT id FROM problems WHERE slug = 'error-messages'), 
  (SELECT id FROM prompts WHERE slug = 'error-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'error-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'error-validation', 
  'Form Validation Messages', 
  'Write clear validation messages that guide users to correct input.', 
  (SELECT id FROM problems WHERE slug = 'error-messages'), 
  (SELECT id FROM prompts WHERE slug = 'error-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'error-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'followup-sequence', 
  'Follow-Up Sequence', 
  'Create a 3-email follow-up sequence with increasing urgency.', 
  (SELECT id FROM problems WHERE slug = 'email-follow-up'), 
  (SELECT id FROM prompts WHERE slug = 'followup-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'followup-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'followup-value', 
  'Value-Add Follow-Up', 
  'Include additional value in follow-up to re-engage.', 
  (SELECT id FROM problems WHERE slug = 'email-follow-up'), 
  (SELECT id FROM prompts WHERE slug = 'followup-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'followup-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sales-script-demo', 
  'Demo Call Script', 
  'Structure a product demo that addresses specific customer needs.', 
  (SELECT id FROM problems WHERE slug = 'sales-call-script'), 
  (SELECT id FROM prompts WHERE slug = 'sales-script-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'sales-script-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sales-script-objection', 
  'Objection Handling Script', 
  'Prepare responses to common sales objections.', 
  (SELECT id FROM problems WHERE slug = 'sales-call-script'), 
  (SELECT id FROM prompts WHERE slug = 'sales-script-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'sales-script-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'proposal-executive', 
  'Executive Proposal Summary', 
  'Write a concise executive summary for proposals.', 
  (SELECT id FROM problems WHERE slug = 'proposal-outline'), 
  (SELECT id FROM prompts WHERE slug = 'proposal-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'proposal-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'proposal-sow', 
  'Statement of Work', 
  'Detail scope, deliverables, and terms in SOW format.', 
  (SELECT id FROM problems WHERE slug = 'proposal-outline'), 
  (SELECT id FROM prompts WHERE slug = 'proposal-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'proposal-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'content-cal-seo', 
  'SEO Content Calendar', 
  'Build content calendar around keyword clusters and search intent.', 
  (SELECT id FROM problems WHERE slug = 'content-calendar'), 
  (SELECT id FROM prompts WHERE slug = 'content-cal-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'content-cal-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'content-cal-social', 
  'Social Media Calendar', 
  'Create a social-first content calendar with platform-specific content.', 
  (SELECT id FROM problems WHERE slug = 'content-calendar'), 
  (SELECT id FROM prompts WHERE slug = 'content-cal-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'content-cal-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'twitter-educational', 
  'Educational Twitter Thread', 
  'Break down complex topics into digestible thread format.', 
  (SELECT id FROM problems WHERE slug = 'twitter-thread'), 
  (SELECT id FROM prompts WHERE slug = 'twitter-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'twitter-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'twitter-storytelling', 
  'Story-Based Twitter Thread', 
  'Use narrative structure to engage and teach.', 
  (SELECT id FROM problems WHERE slug = 'twitter-thread'), 
  (SELECT id FROM prompts WHERE slug = 'twitter-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'twitter-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'blog-intro-question', 
  'Question-Based Introduction', 
  'Start with a provocative question that resonates.', 
  (SELECT id FROM problems WHERE slug = 'blog-introduction'), 
  (SELECT id FROM prompts WHERE slug = 'blog-intro-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'blog-intro-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'blog-intro-story', 
  'Story-Based Introduction', 
  'Open with a relatable story or anecdote.', 
  (SELECT id FROM problems WHERE slug = 'blog-introduction'), 
  (SELECT id FROM prompts WHERE slug = 'blog-intro-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'blog-intro-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'case-study-video', 
  'Video Case Study Script', 
  'Create a script for video case study testimonial.', 
  (SELECT id FROM problems WHERE slug = 'case-study'), 
  (SELECT id FROM prompts WHERE slug = 'case-study-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'case-study-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'case-study-technical', 
  'Technical Case Study', 
  'Deep-dive into technical implementation and results.', 
  (SELECT id FROM problems WHERE slug = 'case-study'), 
  (SELECT id FROM prompts WHERE slug = 'case-study-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'case-study-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'value-prop-canvas', 
  'Value Proposition Canvas', 
  'Use the canvas framework to map value to customer jobs.', 
  (SELECT id FROM problems WHERE slug = 'value-proposition'), 
  (SELECT id FROM prompts WHERE slug = 'value-prop-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'value-prop-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'value-prop-test', 
  'Value Proposition Testing', 
  'Create variants to test with target audience.', 
  (SELECT id FROM problems WHERE slug = 'value-proposition'), 
  (SELECT id FROM prompts WHERE slug = 'value-prop-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'value-prop-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'competitive-swot', 
  'SWOT Analysis', 
  'Perform SWOT analysis for competitive positioning.', 
  (SELECT id FROM problems WHERE slug = 'competitive-analysis'), 
  (SELECT id FROM prompts WHERE slug = 'competitive-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'competitive-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'competitive-matrix', 
  'Competitive Matrix', 
  'Create a visual comparison matrix of competitors.', 
  (SELECT id FROM problems WHERE slug = 'competitive-analysis'), 
  (SELECT id FROM prompts WHERE slug = 'competitive-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'competitive-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'feature-priority-kano', 
  'Kano Model Prioritization', 
  'Use Kano model to categorize features by customer satisfaction.', 
  (SELECT id FROM problems WHERE slug = 'feature-prioritization'), 
  (SELECT id FROM prompts WHERE slug = 'feature-priority-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'feature-priority-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'feature-priority-moscow', 
  'MoSCoW Prioritization', 
  'Categorize features as Must-have, Should-have, Could-have, Won''t-have.', 
  (SELECT id FROM problems WHERE slug = 'feature-prioritization'), 
  (SELECT id FROM prompts WHERE slug = 'feature-priority-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'feature-priority-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'roadmap-now-next', 
  'Now-Next-Later Roadmap', 
  'Use flexible roadmap format focused on outcomes.', 
  (SELECT id FROM problems WHERE slug = 'roadmap-planning'), 
  (SELECT id FROM prompts WHERE slug = 'roadmap-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'roadmap-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'roadmap-okr', 
  'OKR-Aligned Roadmap', 
  'Align roadmap initiatives with company OKRs.', 
  (SELECT id FROM problems WHERE slug = 'roadmap-planning'), 
  (SELECT id FROM prompts WHERE slug = 'roadmap-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'roadmap-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'onboarding-saas', 
  'SaaS Onboarding Emails', 
  'Guide users to first value moment in SaaS product.', 
  (SELECT id FROM problems WHERE slug = 'onboarding-emails'), 
  (SELECT id FROM prompts WHERE slug = 'onboarding-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'onboarding-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'onboarding-educational', 
  'Educational Onboarding', 
  'Teach product features progressively through email.', 
  (SELECT id FROM problems WHERE slug = 'onboarding-emails'), 
  (SELECT id FROM prompts WHERE slug = 'onboarding-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'onboarding-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'churn-winback', 
  'Win-Back Campaign', 
  'Design campaign to re-engage churned customers.', 
  (SELECT id FROM problems WHERE slug = 'churn-reduction'), 
  (SELECT id FROM prompts WHERE slug = 'churn-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'churn-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'churn-survey', 
  'Churn Survey', 
  'Create exit survey to understand churn reasons.', 
  (SELECT id FROM problems WHERE slug = 'churn-reduction'), 
  (SELECT id FROM prompts WHERE slug = 'churn-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'churn-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pricing-page-faq', 
  'Pricing FAQ', 
  'Address common pricing objections in FAQ format.', 
  (SELECT id FROM problems WHERE slug = 'pricing-page-copy'), 
  (SELECT id FROM prompts WHERE slug = 'pricing-page-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'pricing-page-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pricing-page-comparison', 
  'Pricing Comparison Table', 
  'Create clear comparison table highlighting value.', 
  (SELECT id FROM problems WHERE slug = 'pricing-page-copy'), 
  (SELECT id FROM prompts WHERE slug = 'pricing-page-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'pricing-page-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'affiliate-comparison', 
  'Affiliate Comparison Review', 
  'Compare multiple products to help readers choose.', 
  (SELECT id FROM problems WHERE slug = 'affiliate-review'), 
  (SELECT id FROM prompts WHERE slug = 'affiliate-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'affiliate-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'affiliate-tutorial', 
  'Affiliate Tutorial Review', 
  'Combine review with how-to tutorial for added value.', 
  (SELECT id FROM problems WHERE slug = 'affiliate-review'), 
  (SELECT id FROM prompts WHERE slug = 'affiliate-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'affiliate-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'faq-seo', 
  'SEO-Optimized FAQ', 
  'Structure FAQs for featured snippets and search visibility.', 
  (SELECT id FROM problems WHERE slug = 'faq-generator'), 
  (SELECT id FROM prompts WHERE slug = 'faq-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'faq-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'faq-technical', 
  'Technical FAQ', 
  'Answer technical questions for developer audience.', 
  (SELECT id FROM problems WHERE slug = 'faq-generator'), 
  (SELECT id FROM prompts WHERE slug = 'faq-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'faq-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'macro-personalized', 
  'Personalized Support Macros', 
  'Add personalization variables to maintain human touch.', 
  (SELECT id FROM problems WHERE slug = 'support-macro'), 
  (SELECT id FROM prompts WHERE slug = 'macro-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'macro-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'macro-escalation', 
  'Escalation Macros', 
  'Handle escalations with empathy and clear next steps.', 
  (SELECT id FROM problems WHERE slug = 'support-macro'), 
  (SELECT id FROM prompts WHERE slug = 'macro-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'macro-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'kb-troubleshooting', 
  'Troubleshooting Guide', 
  'Create step-by-step troubleshooting articles.', 
  (SELECT id FROM problems WHERE slug = 'knowledge-base'), 
  (SELECT id FROM prompts WHERE slug = 'kb-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'kb-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'kb-video', 
  'Video Tutorial Script', 
  'Write scripts for video knowledge base content.', 
  (SELECT id FROM problems WHERE slug = 'knowledge-base'), 
  (SELECT id FROM prompts WHERE slug = 'kb-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'kb-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'release-technical', 
  'Technical Release Notes', 
  'Detail technical changes for developer audience.', 
  (SELECT id FROM problems WHERE slug = 'release-notes'), 
  (SELECT id FROM prompts WHERE slug = 'release-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'release-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'release-marketing', 
  'Marketing Release Notes', 
  'Frame releases as customer benefits for marketing.', 
  (SELECT id FROM problems WHERE slug = 'release-notes'), 
  (SELECT id FROM prompts WHERE slug = 'release-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'release-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'bug-report-template', 
  'Bug Report Template', 
  'Create a standardized bug report template.', 
  (SELECT id FROM problems WHERE slug = 'bug-report'), 
  (SELECT id FROM prompts WHERE slug = 'bug-report-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'bug-report-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'bug-report-priority', 
  'Bug Prioritization', 
  'Categorize bugs by severity and impact.', 
  (SELECT id FROM problems WHERE slug = 'bug-report'), 
  (SELECT id FROM prompts WHERE slug = 'bug-report-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'bug-report-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'git-commit-conventional', 
  'Conventional Commits', 
  'Use conventional commit format (feat, fix, docs, etc).', 
  (SELECT id FROM problems WHERE slug = 'git-commit-message'), 
  (SELECT id FROM prompts WHERE slug = 'git-commit-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'git-commit-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'git-commit-detailed', 
  'Detailed Commit Messages', 
  'Include context and reasoning in commit body.', 
  (SELECT id FROM problems WHERE slug = 'git-commit-message'), 
  (SELECT id FROM prompts WHERE slug = 'git-commit-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'git-commit-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'code-review-security', 
  'Security Code Review', 
  'Focus on security vulnerabilities and best practices.', 
  (SELECT id FROM problems WHERE slug = 'code-review'), 
  (SELECT id FROM prompts WHERE slug = 'code-review-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'code-review-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'code-review-style', 
  'Style and Consistency Review', 
  'Ensure code follows style guide and conventions.', 
  (SELECT id FROM problems WHERE slug = 'code-review'), 
  (SELECT id FROM prompts WHERE slug = 'code-review-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'code-review-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'refactor-legacy', 
  'Legacy Code Refactoring', 
  'Approach legacy code refactoring with minimal risk.', 
  (SELECT id FROM problems WHERE slug = 'refactor-plan'), 
  (SELECT id FROM prompts WHERE slug = 'refactor-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'refactor-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'refactor-architecture', 
  'Architecture Refactoring', 
  'Plan large-scale architectural improvements.', 
  (SELECT id FROM problems WHERE slug = 'refactor-plan'), 
  (SELECT id FROM prompts WHERE slug = 'refactor-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'refactor-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'schema-nosql', 
  'NoSQL Schema Design', 
  'Design document-based schema for MongoDB/DynamoDB.', 
  (SELECT id FROM problems WHERE slug = 'database-schema'), 
  (SELECT id FROM prompts WHERE slug = 'schema-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'schema-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'schema-migration', 
  'Schema Migration Plan', 
  'Plan safe database migrations with rollback strategy.', 
  (SELECT id FROM problems WHERE slug = 'database-schema'), 
  (SELECT id FROM prompts WHERE slug = 'schema-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'schema-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'api-auth-rbac', 
  'Role-Based Access Control', 
  'Implement RBAC for API authorization.', 
  (SELECT id FROM problems WHERE slug = 'api-auth-design'), 
  (SELECT id FROM prompts WHERE slug = 'api-auth-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'api-auth-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'api-auth-refresh', 
  'Token Refresh Strategy', 
  'Handle token refresh and session management.', 
  (SELECT id FROM problems WHERE slug = 'api-auth-design'), 
  (SELECT id FROM prompts WHERE slug = 'api-auth-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'api-auth-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'rate-limit-redis', 
  'Redis-Based Rate Limiting', 
  'Implement distributed rate limiting with Redis.', 
  (SELECT id FROM problems WHERE slug = 'rate-limiting'), 
  (SELECT id FROM prompts WHERE slug = 'rate-limit-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'rate-limit-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'rate-limit-tiered', 
  'Tiered Rate Limiting', 
  'Create different rate limits for different user tiers.', 
  (SELECT id FROM problems WHERE slug = 'rate-limiting'), 
  (SELECT id FROM prompts WHERE slug = 'rate-limit-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'rate-limit-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'log-analysis-elk', 
  'ELK Stack Log Analysis', 
  'Use Elasticsearch queries to analyze logs.', 
  (SELECT id FROM problems WHERE slug = 'log-analysis'), 
  (SELECT id FROM prompts WHERE slug = 'log-analysis-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'log-analysis-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'log-analysis-metrics', 
  'Log-Based Metrics', 
  'Extract metrics and insights from application logs.', 
  (SELECT id FROM problems WHERE slug = 'log-analysis'), 
  (SELECT id FROM prompts WHERE slug = 'log-analysis-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'log-analysis-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'postmortem-template', 
  'Postmortem Template', 
  'Create standardized postmortem template.', 
  (SELECT id FROM problems WHERE slug = 'incident-postmortem'), 
  (SELECT id FROM prompts WHERE slug = 'postmortem-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'postmortem-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'postmortem-communication', 
  'Incident Communication', 
  'Communicate incidents to stakeholders clearly.', 
  (SELECT id FROM problems WHERE slug = 'incident-postmortem'), 
  (SELECT id FROM prompts WHERE slug = 'postmortem-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'postmortem-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'monitoring-sre', 
  'SRE Monitoring', 
  'Implement SRE best practices for observability.', 
  (SELECT id FROM problems WHERE slug = 'monitoring-setup'), 
  (SELECT id FROM prompts WHERE slug = 'monitoring-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'monitoring-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'monitoring-cost', 
  'Cost-Effective Monitoring', 
  'Balance monitoring coverage with infrastructure costs.', 
  (SELECT id FROM problems WHERE slug = 'monitoring-setup'), 
  (SELECT id FROM prompts WHERE slug = 'monitoring-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'monitoring-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'kpi-product', 
  'Product KPI Dashboard', 
  'Track product metrics like activation, retention, and engagement.', 
  (SELECT id FROM problems WHERE slug = 'kpi-dashboard'), 
  (SELECT id FROM prompts WHERE slug = 'kpi-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'kpi-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'kpi-business', 
  'Business KPI Dashboard', 
  'Monitor revenue, growth, and business health metrics.', 
  (SELECT id FROM problems WHERE slug = 'kpi-dashboard'), 
  (SELECT id FROM prompts WHERE slug = 'kpi-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'kpi-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'financial-saas', 
  'SaaS Financial Model', 
  'Model SaaS metrics like MRR, CAC, LTV, and churn.', 
  (SELECT id FROM problems WHERE slug = 'financial-model'), 
  (SELECT id FROM prompts WHERE slug = 'financial-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'financial-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'financial-scenario', 
  'Scenario Planning Model', 
  'Create best/worst/expected case financial scenarios.', 
  (SELECT id FROM problems WHERE slug = 'financial-model'), 
  (SELECT id FROM prompts WHERE slug = 'financial-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'financial-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'unit-econ-cohort', 
  'Cohort-Based Unit Economics', 
  'Analyze unit economics by customer cohort.', 
  (SELECT id FROM problems WHERE slug = 'unit-economics'), 
  (SELECT id FROM prompts WHERE slug = 'unit-econ-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'unit-econ-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'unit-econ-channel', 
  'Channel Unit Economics', 
  'Compare unit economics across acquisition channels.', 
  (SELECT id FROM problems WHERE slug = 'unit-economics'), 
  (SELECT id FROM prompts WHERE slug = 'unit-econ-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'unit-econ-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pitch-seed', 
  'Seed Round Pitch', 
  'Tailor pitch for seed-stage investors.', 
  (SELECT id FROM problems WHERE slug = 'investor-pitch'), 
  (SELECT id FROM prompts WHERE slug = 'pitch-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'pitch-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pitch-series-a', 
  'Series A Pitch', 
  'Focus on traction and growth for Series A.', 
  (SELECT id FROM problems WHERE slug = 'investor-pitch'), 
  (SELECT id FROM prompts WHERE slug = 'pitch-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'pitch-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'exec-summary-business', 
  'Business Plan Executive Summary', 
  'Summarize business plan for investors or partners.', 
  (SELECT id FROM problems WHERE slug = 'exec-summary'), 
  (SELECT id FROM prompts WHERE slug = 'exec-summary-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'exec-summary-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'exec-summary-report', 
  'Report Executive Summary', 
  'Distill lengthy reports into actionable summaries.', 
  (SELECT id FROM problems WHERE slug = 'exec-summary'), 
  (SELECT id FROM prompts WHERE slug = 'exec-summary-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'exec-summary-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'market-size-bottoms-up', 
  'Bottom-Up Market Sizing', 
  'Calculate market size from customer segments and pricing.', 
  (SELECT id FROM problems WHERE slug = 'market-sizing'), 
  (SELECT id FROM prompts WHERE slug = 'market-size-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'market-size-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'market-size-validation', 
  'Market Size Validation', 
  'Validate market size estimates with data sources.', 
  (SELECT id FROM problems WHERE slug = 'market-sizing'), 
  (SELECT id FROM prompts WHERE slug = 'market-size-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'market-size-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'persona-jobs', 
  'Jobs-to-be-Done Personas', 
  'Frame personas around jobs customers are trying to accomplish.', 
  (SELECT id FROM problems WHERE slug = 'user-personas'), 
  (SELECT id FROM prompts WHERE slug = 'persona-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'persona-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'persona-segment', 
  'Persona Segmentation', 
  'Segment users into distinct persona groups.', 
  (SELECT id FROM problems WHERE slug = 'user-personas'), 
  (SELECT id FROM prompts WHERE slug = 'persona-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'persona-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'interview-discovery', 
  'Discovery Interview Script', 
  'Structure interviews for problem discovery.', 
  (SELECT id FROM problems WHERE slug = 'user-interviews'), 
  (SELECT id FROM prompts WHERE slug = 'interview-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'interview-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'interview-solution', 
  'Solution Validation Interview', 
  'Test solution concepts with target users.', 
  (SELECT id FROM problems WHERE slug = 'user-interviews'), 
  (SELECT id FROM prompts WHERE slug = 'interview-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'interview-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'survey-nps', 
  'NPS Survey', 
  'Design Net Promoter Score survey with follow-ups.', 
  (SELECT id FROM problems WHERE slug = 'survey-questions'), 
  (SELECT id FROM prompts WHERE slug = 'survey-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'survey-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'survey-satisfaction', 
  'Customer Satisfaction Survey', 
  'Measure satisfaction across key touchpoints.', 
  (SELECT id FROM problems WHERE slug = 'survey-questions'), 
  (SELECT id FROM prompts WHERE slug = 'survey-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'survey-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ab-test-multivariate', 
  'Multivariate Test Plan', 
  'Test multiple variables simultaneously.', 
  (SELECT id FROM problems WHERE slug = 'ab-test-plan'), 
  (SELECT id FROM prompts WHERE slug = 'ab-test-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ab-test-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ab-test-sequential', 
  'Sequential Testing', 
  'Design sequential tests to reach significance faster.', 
  (SELECT id FROM problems WHERE slug = 'ab-test-plan'), 
  (SELECT id FROM prompts WHERE slug = 'ab-test-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ab-test-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'conversion-cro', 
  'CRO Audit Checklist', 
  'Systematic conversion rate optimization audit.', 
  (SELECT id FROM problems WHERE slug = 'conversion-audit'), 
  (SELECT id FROM prompts WHERE slug = 'conversion-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'conversion-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'conversion-mobile', 
  'Mobile Conversion Audit', 
  'Focus on mobile-specific conversion issues.', 
  (SELECT id FROM problems WHERE slug = 'conversion-audit'), 
  (SELECT id FROM prompts WHERE slug = 'conversion-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'conversion-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'subject-ab', 
  'Subject Line A/B Testing', 
  'Create variants for subject line testing.', 
  (SELECT id FROM problems WHERE slug = 'email-subject-lines'), 
  (SELECT id FROM prompts WHERE slug = 'subject-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'subject-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'subject-personalized', 
  'Personalized Subject Lines', 
  'Use personalization to boost open rates.', 
  (SELECT id FROM problems WHERE slug = 'email-subject-lines'), 
  (SELECT id FROM prompts WHERE slug = 'subject-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'subject-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'newsletter-curated', 
  'Curated Newsletter', 
  'Compile and contextualize curated content.', 
  (SELECT id FROM problems WHERE slug = 'newsletter-outline'), 
  (SELECT id FROM prompts WHERE slug = 'newsletter-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'newsletter-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'newsletter-educational', 
  'Educational Newsletter', 
  'Structure newsletter as learning resource.', 
  (SELECT id FROM problems WHERE slug = 'newsletter-outline'), 
  (SELECT id FROM prompts WHERE slug = 'newsletter-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'newsletter-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'brand-voice-tone', 
  'Tone of Voice Guidelines', 
  'Specify tone variations for different contexts.', 
  (SELECT id FROM problems WHERE slug = 'brand-voice'), 
  (SELECT id FROM prompts WHERE slug = 'brand-voice-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'brand-voice-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'brand-voice-examples', 
  'Brand Voice Examples', 
  'Provide before/after examples of brand voice.', 
  (SELECT id FROM problems WHERE slug = 'brand-voice'), 
  (SELECT id FROM prompts WHERE slug = 'brand-voice-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'brand-voice-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'tone-professional', 
  'Professional Tone Rewrite', 
  'Make copy more formal and professional.', 
  (SELECT id FROM problems WHERE slug = 'tone-rewrite'), 
  (SELECT id FROM prompts WHERE slug = 'tone-rewrite-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'tone-rewrite-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'tone-casual', 
  'Casual Tone Rewrite', 
  'Make copy more conversational and approachable.', 
  (SELECT id FROM problems WHERE slug = 'tone-rewrite'), 
  (SELECT id FROM prompts WHERE slug = 'tone-rewrite-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'tone-rewrite-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'legal-summary-contract', 
  'Contract Summary', 
  'Extract key terms and obligations from contracts.', 
  (SELECT id FROM problems WHERE slug = 'legal-summary'), 
  (SELECT id FROM prompts WHERE slug = 'legal-summary-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'legal-summary-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'legal-summary-risk', 
  'Legal Risk Summary', 
  'Identify potential legal risks in documents.', 
  (SELECT id FROM problems WHERE slug = 'legal-summary'), 
  (SELECT id FROM prompts WHERE slug = 'legal-summary-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'legal-summary-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'privacy-policy-ccpa', 
  'CCPA Privacy Policy', 
  'Add California-specific privacy requirements.', 
  (SELECT id FROM problems WHERE slug = 'privacy-policy'), 
  (SELECT id FROM prompts WHERE slug = 'privacy-policy-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'privacy-policy-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'privacy-policy-simple', 
  'Simplified Privacy Policy', 
  'Create user-friendly privacy policy summary.', 
  (SELECT id FROM problems WHERE slug = 'privacy-policy'), 
  (SELECT id FROM prompts WHERE slug = 'privacy-policy-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'privacy-policy-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'tos-saas', 
  'SaaS Terms of Service', 
  'Tailor terms for SaaS business model.', 
  (SELECT id FROM problems WHERE slug = 'terms-of-service'), 
  (SELECT id FROM prompts WHERE slug = 'tos-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'tos-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'tos-marketplace', 
  'Marketplace Terms of Service', 
  'Include multi-sided marketplace provisions.', 
  (SELECT id FROM problems WHERE slug = 'terms-of-service'), 
  (SELECT id FROM prompts WHERE slug = 'tos-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'tos-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'risk-cybersecurity', 
  'Cybersecurity Risk Assessment', 
  'Assess security and data protection risks.', 
  (SELECT id FROM problems WHERE slug = 'risk-assessment'), 
  (SELECT id FROM prompts WHERE slug = 'risk-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'risk-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'risk-operational', 
  'Operational Risk Assessment', 
  'Evaluate operational and process risks.', 
  (SELECT id FROM problems WHERE slug = 'risk-assessment'), 
  (SELECT id FROM prompts WHERE slug = 'risk-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'risk-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'process-doc-flowchart', 
  'Process Flowchart', 
  'Create visual process documentation.', 
  (SELECT id FROM problems WHERE slug = 'process-documentation'), 
  (SELECT id FROM prompts WHERE slug = 'process-doc-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'process-doc-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'process-doc-checklist', 
  'Process Checklist', 
  'Convert process into actionable checklist.', 
  (SELECT id FROM problems WHERE slug = 'process-documentation'), 
  (SELECT id FROM prompts WHERE slug = 'process-doc-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'process-doc-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sop-training', 
  'Training SOP', 
  'Design SOP for employee training and onboarding.', 
  (SELECT id FROM problems WHERE slug = 'sop-generator'), 
  (SELECT id FROM prompts WHERE slug = 'sop-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'sop-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sop-compliance', 
  'Compliance SOP', 
  'Create SOPs for regulatory compliance.', 
  (SELECT id FROM problems WHERE slug = 'sop-generator'), 
  (SELECT id FROM prompts WHERE slug = 'sop-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'sop-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'vendor-scorecard', 
  'Vendor Scorecard', 
  'Create weighted scorecard for vendor evaluation.', 
  (SELECT id FROM problems WHERE slug = 'vendor-comparison'), 
  (SELECT id FROM prompts WHERE slug = 'vendor-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'vendor-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'vendor-rfi', 
  'Vendor RFI/RFP', 
  'Generate request for information or proposal.', 
  (SELECT id FROM problems WHERE slug = 'vendor-comparison'), 
  (SELECT id FROM prompts WHERE slug = 'vendor-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'vendor-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'automation-roi', 
  'Automation ROI Analysis', 
  'Calculate ROI for automation investments.', 
  (SELECT id FROM problems WHERE slug = 'automation-ideas'), 
  (SELECT id FROM prompts WHERE slug = 'automation-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'automation-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'automation-roadmap', 
  'Automation Roadmap', 
  'Prioritize and sequence automation initiatives.', 
  (SELECT id FROM problems WHERE slug = 'automation-ideas'), 
  (SELECT id FROM prompts WHERE slug = 'automation-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'automation-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'zapier-multi-step', 
  'Multi-Step Zapier Workflow', 
  'Create complex workflows with filters and paths.', 
  (SELECT id FROM problems WHERE slug = 'zapier-workflow'), 
  (SELECT id FROM prompts WHERE slug = 'zapier-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'zapier-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'zapier-error', 
  'Zapier Error Handling', 
  'Add error handling and notifications to workflows.', 
  (SELECT id FROM problems WHERE slug = 'zapier-workflow'), 
  (SELECT id FROM prompts WHERE slug = 'zapier-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'zapier-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ai-usecase-roi', 
  'AI Use Case ROI', 
  'Estimate ROI for AI implementation.', 
  (SELECT id FROM problems WHERE slug = 'ai-use-cases'), 
  (SELECT id FROM prompts WHERE slug = 'ai-usecase-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ai-usecase-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ai-usecase-roadmap', 
  'AI Implementation Roadmap', 
  'Sequence AI initiatives by value and feasibility.', 
  (SELECT id FROM problems WHERE slug = 'ai-use-cases'), 
  (SELECT id FROM prompts WHERE slug = 'ai-usecase-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'ai-usecase-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-lib-templates', 
  'Prompt Templates', 
  'Design templated prompts with variables.', 
  (SELECT id FROM problems WHERE slug = 'prompt-library'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-lib-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-lib-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-lib-versioning', 
  'Prompt Versioning', 
  'Track and version prompt improvements.', 
  (SELECT id FROM problems WHERE slug = 'prompt-library'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-lib-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-lib-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-fork-ab', 
  'Prompt Fork A/B Testing', 
  'Test forked prompts against originals.', 
  (SELECT id FROM problems WHERE slug = 'prompt-forking'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-fork-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-fork-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-fork-documentation', 
  'Prompt Fork Documentation', 
  'Document what changed and why in forks.', 
  (SELECT id FROM problems WHERE slug = 'prompt-forking'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-fork-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-fork-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-failure-edge', 
  'Edge Case Handling', 
  'Identify and handle prompt edge cases.', 
  (SELECT id FROM problems WHERE slug = 'prompt-failure'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-failure-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-failure-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-failure-validation', 
  'Prompt Output Validation', 
  'Add validation to catch prompt failures.', 
  (SELECT id FROM problems WHERE slug = 'prompt-failure'), 
  (SELECT id FROM prompts WHERE slug = 'prompt-failure-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'prompt-failure-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'benchmark-metrics', 
  'Prompt Quality Metrics', 
  'Define metrics for prompt evaluation.', 
  (SELECT id FROM problems WHERE slug = 'benchmark-prompts'), 
  (SELECT id FROM prompts WHERE slug = 'benchmark-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'benchmark-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'benchmark-dataset', 
  'Benchmark Dataset Creation', 
  'Create test datasets for prompt evaluation.', 
  (SELECT id FROM problems WHERE slug = 'benchmark-prompts'), 
  (SELECT id FROM prompts WHERE slug = 'benchmark-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'benchmark-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'model-comp-cost', 
  'Model Cost Comparison', 
  'Compare models by cost and performance.', 
  (SELECT id FROM problems WHERE slug = 'model-comparison'), 
  (SELECT id FROM prompts WHERE slug = 'model-comp-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'model-comp-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'model-comp-latency', 
  'Model Latency Comparison', 
  'Benchmark model response times.', 
  (SELECT id FROM problems WHERE slug = 'model-comparison'), 
  (SELECT id FROM prompts WHERE slug = 'model-comp-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'model-comp-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'cost-opt-caching', 
  'Prompt Caching Strategy', 
  'Implement caching to reduce redundant API calls.', 
  (SELECT id FROM problems WHERE slug = 'cost-optimization'), 
  (SELECT id FROM prompts WHERE slug = 'cost-opt-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'cost-opt-core');

INSERT INTO prompts (slug, title, system_prompt, problem_id, parent_prompt_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'cost-opt-batching', 
  'Batch Processing Optimization', 
  'Optimize costs through batching and async processing.', 
  (SELECT id FROM problems WHERE slug = 'cost-optimization'), 
  (SELECT id FROM prompts WHERE slug = 'cost-opt-core'),
  '8ef93276-ac37-4068-b426-d7ebafaddaaa', 
  'gpt-4', 
  true, 
  'Provide your input here', 
  '\"Example input\"', 
  '\"Example output\"'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  parent_prompt_id = (SELECT id FROM prompts WHERE slug = 'cost-opt-core');
