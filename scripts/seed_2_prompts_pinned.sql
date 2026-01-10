-- Seeding Prompts (Pinned)

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'landing-page-core', 
  'Core SaaS Landing Page Prompt', 
  'You are a SaaS copywriter. Write a high-converting landing page using sections: Hero, Problem, Solution, Benefits, Social Proof, Objections, CTA. Use placeholders if data is missing.', 
  (SELECT id FROM problems WHERE slug = 'write-high-converting-landing-page'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'seo-outline-core', 
  'SEO Outline by Search Intent', 
  'Create an SEO outline using keyword intent. Include H1-H3s, FAQs, target word count, and internal links.', 
  (SELECT id FROM problems WHERE slug = 'seo-blog-post-outline'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'cold-email-core', 
  'Personalized Cold Email', 
  'Write a personalized cold email under 120 words with a clear reason to care and soft CTA.', 
  (SELECT id FROM problems WHERE slug = 'cold-email-personalized'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'react-debug-core', 
  'React Debugging Prompt', 
  'Given a console error and component snippet, identify root cause, fix, and prevention checklist.', 
  (SELECT id FROM problems WHERE slug = 'react-bug-triage'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'rls-core', 
  'Supabase RLS Generator', 
  'Generate SELECT, INSERT, UPDATE, DELETE RLS policies for a multi-tenant Supabase app.', 
  (SELECT id FROM problems WHERE slug = 'supabase-rls-generator'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'yt-core', 
  'YouTube Title + Thumbnail Pack', 
  'Generate 12 YouTube titles and 12 thumbnail hooks optimized for CTR.', 
  (SELECT id FROM problems WHERE slug = 'youtube-title-thumbnail'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'shorts-core', 
  'Viral Shorts Script', 
  'Write a 30–45s Shorts script with hook, payoff, and pattern interrupts.', 
  (SELECT id FROM problems WHERE slug = 'shorts-script-hooks'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'meeting-core', 
  'Meeting Notes to Actions', 
  'Convert raw notes into a table with owner, task, due date, and risks.', 
  (SELECT id FROM problems WHERE slug = 'meeting-notes-actions'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pricing-core', 
  'SaaS Pricing Strategy', 
  'Design a 3-tier pricing strategy with feature differentiation and psychological anchoring.', 
  (SELECT id FROM problems WHERE slug = 'saas-pricing-strategy'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sql-optimize-core', 
  'SQL Query Optimizer', 
  'Analyze a slow SQL query and provide optimized version with explanation.', 
  (SELECT id FROM problems WHERE slug = 'sql-query-optimizer'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'resume-core', 
  'Resume Bullet with Metrics', 
  'Rewrite resume bullets using the XYZ formula: Accomplished [X] as measured by [Y] by doing [Z].', 
  (SELECT id FROM problems WHERE slug = 'resume-bullet-metrics'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'support-core', 
  'Calm Support Reply', 
  'Write an empathetic support reply that de-escalates and solves the issue.', 
  (SELECT id FROM problems WHERE slug = 'customer-support-reply'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prd-core', 
  'Product Requirements Document', 
  'Create a PRD with problem statement, user stories, acceptance criteria, and success metrics.', 
  (SELECT id FROM problems WHERE slug = 'feature-requirements-doc'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'api-docs-core', 
  'API Documentation', 
  'Write clear API documentation with endpoints, parameters, examples, and error codes.', 
  (SELECT id FROM problems WHERE slug = 'api-documentation'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-eval-core', 
  'Prompt Evaluation Framework', 
  'Compare multiple prompt outputs using criteria: accuracy, clarity, completeness, and efficiency.', 
  (SELECT id FROM problems WHERE slug = 'prompt-evaluation'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'job-desc-core', 
  'Compelling Job Description', 
  'Write a job description that attracts qualified candidates with clear responsibilities and benefits.', 
  (SELECT id FROM problems WHERE slug = 'job-description'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'linkedin-core', 
  'Engaging LinkedIn Post', 
  'Write a LinkedIn post that drives engagement using storytelling and clear takeaways.', 
  (SELECT id FROM problems WHERE slug = 'linkedin-post'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ad-copy-core', 
  'Ad Copy Variants', 
  'Generate 5 ad copy variants for A/B testing with different hooks and CTAs.', 
  (SELECT id FROM problems WHERE slug = 'ad-copy-variants'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ux-copy-core', 
  'UX Microcopy', 
  'Write helpful, concise microcopy for buttons, tooltips, and empty states.', 
  (SELECT id FROM problems WHERE slug = 'ux-microcopy'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'error-core', 
  'Helpful Error Messages', 
  'Write error messages that explain what happened, why, and how to fix it.', 
  (SELECT id FROM problems WHERE slug = 'error-messages'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'followup-core', 
  'Follow-Up Email', 
  'Write a polite follow-up email that gets responses without being pushy.', 
  (SELECT id FROM problems WHERE slug = 'email-follow-up'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sales-script-core', 
  'Discovery Call Script', 
  'Create a discovery call script that qualifies leads and uncovers pain points.', 
  (SELECT id FROM problems WHERE slug = 'sales-call-script'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'proposal-core', 
  'Client Proposal Outline', 
  'Create a winning proposal with problem, solution, timeline, and pricing.', 
  (SELECT id FROM problems WHERE slug = 'proposal-outline'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'content-cal-core', 
  '30-Day Content Calendar', 
  'Plan a month of content with topics, formats, and distribution channels.', 
  (SELECT id FROM problems WHERE slug = 'content-calendar'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'twitter-core', 
  'Viral Twitter Thread', 
  'Write a Twitter thread with a strong hook, value, and clear structure.', 
  (SELECT id FROM problems WHERE slug = 'twitter-thread'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'blog-intro-core', 
  'Compelling Blog Introduction', 
  'Write a blog intro that hooks readers and promises value.', 
  (SELECT id FROM problems WHERE slug = 'blog-introduction'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'case-study-core', 
  'Customer Case Study', 
  'Write a case study using before/after framework with metrics.', 
  (SELECT id FROM problems WHERE slug = 'case-study'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'value-prop-core', 
  'Clear Value Proposition', 
  'Define a value proposition that differentiates and resonates.', 
  (SELECT id FROM problems WHERE slug = 'value-proposition'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'competitive-core', 
  'Competitive Analysis', 
  'Analyze competitors across features, pricing, positioning, and gaps.', 
  (SELECT id FROM problems WHERE slug = 'competitive-analysis'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'feature-priority-core', 
  'Feature Prioritization', 
  'Prioritize features using RICE framework (Reach, Impact, Confidence, Effort).', 
  (SELECT id FROM problems WHERE slug = 'feature-prioritization'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'roadmap-core', 
  'Product Roadmap', 
  'Create a quarterly product roadmap with themes and milestones.', 
  (SELECT id FROM problems WHERE slug = 'roadmap-planning'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'onboarding-core', 
  'Onboarding Email Sequence', 
  'Create a 5-email onboarding sequence that drives activation.', 
  (SELECT id FROM problems WHERE slug = 'onboarding-emails'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'churn-core', 
  'Churn Reduction Strategy', 
  'Identify churn signals and create intervention strategies.', 
  (SELECT id FROM problems WHERE slug = 'churn-reduction'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pricing-page-core', 
  'Pricing Page Copy', 
  'Write pricing page copy that increases conversions and reduces friction.', 
  (SELECT id FROM problems WHERE slug = 'pricing-page-copy'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'affiliate-core', 
  'Affiliate Product Review', 
  'Write an honest affiliate review that drives conversions.', 
  (SELECT id FROM problems WHERE slug = 'affiliate-review'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'faq-core', 
  'Product FAQ Generator', 
  'Generate comprehensive FAQs that reduce objections and support tickets.', 
  (SELECT id FROM problems WHERE slug = 'faq-generator'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'macro-core', 
  'Support Macros', 
  'Create templated responses for common support issues.', 
  (SELECT id FROM problems WHERE slug = 'support-macro'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'kb-core', 
  'Knowledge Base Article', 
  'Write clear, searchable knowledge base articles with screenshots.', 
  (SELECT id FROM problems WHERE slug = 'knowledge-base'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'release-core', 
  'Product Release Notes', 
  'Write release notes that communicate value, not just features.', 
  (SELECT id FROM problems WHERE slug = 'release-notes'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'bug-report-core', 
  'Clear Bug Report', 
  'Write a bug report with steps to reproduce, expected vs actual behavior, and environment.', 
  (SELECT id FROM problems WHERE slug = 'bug-report'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'git-commit-core', 
  'Better Git Commit Messages', 
  'Write clear, conventional commit messages that explain why, not just what.', 
  (SELECT id FROM problems WHERE slug = 'git-commit-message'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'code-review-core', 
  'Code Review', 
  'Perform thorough code review checking for bugs, performance, and maintainability.', 
  (SELECT id FROM problems WHERE slug = 'code-review'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'refactor-core', 
  'Refactoring Plan', 
  'Create a safe refactoring plan with tests and incremental steps.', 
  (SELECT id FROM problems WHERE slug = 'refactor-plan'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'schema-core', 
  'Database Schema Design', 
  'Design a normalized, scalable database schema.', 
  (SELECT id FROM problems WHERE slug = 'database-schema'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'api-auth-core', 
  'API Authentication Design', 
  'Design secure API authentication using JWT or OAuth2.', 
  (SELECT id FROM problems WHERE slug = 'api-auth-design'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'rate-limit-core', 
  'API Rate Limiting', 
  'Design rate limiting strategy to protect API resources.', 
  (SELECT id FROM problems WHERE slug = 'rate-limiting'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'log-analysis-core', 
  'Application Log Analysis', 
  'Analyze logs to identify errors, performance issues, and patterns.', 
  (SELECT id FROM problems WHERE slug = 'log-analysis'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'postmortem-core', 
  'Incident Postmortem', 
  'Write blameless postmortem with timeline, root cause, and action items.', 
  (SELECT id FROM problems WHERE slug = 'incident-postmortem'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'monitoring-core', 
  'Monitoring and Alerts', 
  'Design comprehensive monitoring with SLIs, SLOs, and alerts.', 
  (SELECT id FROM problems WHERE slug = 'monitoring-setup'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'kpi-core', 
  'KPI Dashboard Design', 
  'Define KPIs and design dashboard for stakeholder visibility.', 
  (SELECT id FROM problems WHERE slug = 'kpi-dashboard'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'financial-core', 
  'Startup Financial Model', 
  'Build a 3-year financial model with revenue, costs, and runway.', 
  (SELECT id FROM problems WHERE slug = 'financial-model'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'unit-econ-core', 
  'Unit Economics Analysis', 
  'Calculate and optimize CAC, LTV, and payback period.', 
  (SELECT id FROM problems WHERE slug = 'unit-economics'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'pitch-core', 
  'Investor Pitch Outline', 
  'Create a compelling pitch deck outline covering problem, solution, market, traction, and ask.', 
  (SELECT id FROM problems WHERE slug = 'investor-pitch'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'exec-summary-core', 
  'Executive Summary', 
  'Write a concise executive summary that captures key points.', 
  (SELECT id FROM problems WHERE slug = 'exec-summary'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'market-size-core', 
  'Market Size Estimation', 
  'Estimate TAM, SAM, and SOM using top-down and bottom-up approaches.', 
  (SELECT id FROM problems WHERE slug = 'market-sizing'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'persona-core', 
  'User Personas', 
  'Create detailed user personas with goals, pain points, and behaviors.', 
  (SELECT id FROM problems WHERE slug = 'user-personas'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'interview-core', 
  'User Interview Questions', 
  'Generate open-ended questions that uncover real needs and behaviors.', 
  (SELECT id FROM problems WHERE slug = 'user-interviews'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'survey-core', 
  'Effective Survey Questions', 
  'Write unbiased survey questions that yield actionable insights.', 
  (SELECT id FROM problems WHERE slug = 'survey-questions'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ab-test-core', 
  'A/B Test Plan', 
  'Design statistically valid A/B test with hypothesis and success metrics.', 
  (SELECT id FROM problems WHERE slug = 'ab-test-plan'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'conversion-core', 
  'Conversion Funnel Audit', 
  'Audit funnel for drop-off points and optimization opportunities.', 
  (SELECT id FROM problems WHERE slug = 'conversion-audit'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'subject-core', 
  'High Open-Rate Subject Lines', 
  'Generate subject lines that increase open rates without clickbait.', 
  (SELECT id FROM problems WHERE slug = 'email-subject-lines'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'newsletter-core', 
  'Newsletter Outline', 
  'Create engaging newsletter outline with value-first content.', 
  (SELECT id FROM problems WHERE slug = 'newsletter-outline'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'brand-voice-core', 
  'Brand Voice Guide', 
  'Define brand voice with attributes, dos/don''ts, and examples.', 
  (SELECT id FROM problems WHERE slug = 'brand-voice'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'tone-rewrite-core', 
  'Tone Rewrite', 
  'Rewrite copy in different tones while preserving meaning.', 
  (SELECT id FROM problems WHERE slug = 'tone-rewrite'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'legal-summary-core', 
  'Legal Document Summary', 
  'Summarize legal documents in plain English.', 
  (SELECT id FROM problems WHERE slug = 'legal-summary'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'privacy-policy-core', 
  'Privacy Policy Draft', 
  'Generate GDPR-compliant privacy policy draft.', 
  (SELECT id FROM problems WHERE slug = 'privacy-policy'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'tos-core', 
  'Terms of Service Draft', 
  'Generate comprehensive terms of service draft.', 
  (SELECT id FROM problems WHERE slug = 'terms-of-service'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'risk-core', 
  'Risk Assessment', 
  'Identify, analyze, and prioritize business risks.', 
  (SELECT id FROM problems WHERE slug = 'risk-assessment'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'process-doc-core', 
  'Process Documentation', 
  'Document internal processes with clear steps and ownership.', 
  (SELECT id FROM problems WHERE slug = 'process-documentation'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'sop-core', 
  'Standard Operating Procedure', 
  'Create detailed SOP with purpose, scope, and procedures.', 
  (SELECT id FROM problems WHERE slug = 'sop-generator'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'vendor-core', 
  'Vendor Comparison', 
  'Compare vendors objectively across criteria.', 
  (SELECT id FROM problems WHERE slug = 'vendor-comparison'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'automation-core', 
  'Automation Opportunities', 
  'Identify repetitive tasks suitable for automation.', 
  (SELECT id FROM problems WHERE slug = 'automation-ideas'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'zapier-core', 
  'Zapier Automation Design', 
  'Design no-code automation workflow in Zapier.', 
  (SELECT id FROM problems WHERE slug = 'zapier-workflow'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'ai-usecase-core', 
  'AI Use Cases for Business', 
  'Identify practical AI applications for specific business.', 
  (SELECT id FROM problems WHERE slug = 'ai-use-cases'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-lib-core', 
  'Reusable Prompt Library', 
  'Create a library of reusable prompts for common tasks.', 
  (SELECT id FROM problems WHERE slug = 'prompt-library'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-fork-core', 
  'Prompt Forking Strategy', 
  'Improve prompts through systematic forking and testing.', 
  (SELECT id FROM problems WHERE slug = 'prompt-forking'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'prompt-failure-core', 
  'Prompt Failure Analysis', 
  'Analyze why prompts fail and how to fix them.', 
  (SELECT id FROM problems WHERE slug = 'prompt-failure'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'benchmark-core', 
  'Prompt Benchmarking', 
  'Systematically benchmark prompts for quality and consistency.', 
  (SELECT id FROM problems WHERE slug = 'benchmark-prompts'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'model-comp-core', 
  'AI Model Comparison', 
  'Compare outputs from different AI models.', 
  (SELECT id FROM problems WHERE slug = 'model-comparison'), 
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
  model = EXCLUDED.model;

INSERT INTO prompts (slug, title, system_prompt, problem_id, created_by, model, visibility, user_prompt_template, example_input, example_output)
VALUES (
  'cost-opt-core', 
  'AI Usage Cost Optimization', 
  'Reduce AI API costs without sacrificing quality.', 
  (SELECT id FROM problems WHERE slug = 'cost-optimization'), 
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
  model = EXCLUDED.model;
