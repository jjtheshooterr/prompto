-- Seeding Problems

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('write-high-converting-landing-page', 'Write a high-converting SaaS landing page', 'Create a landing page optimized for conversions', 'marketing', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('seo-blog-post-outline', 'Create an SEO blog post outline that ranks', 'Generate an intent-driven SEO outline', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('cold-email-personalized', 'Write a personalized cold email that gets replies', 'High-response outbound email', 'sales', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['sales', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('react-bug-triage', 'Debug a React bug from console errors', 'Find root cause and fix', 'coding', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('supabase-rls-generator', 'Generate Supabase RLS policies securely', 'Correct multi-tenant RLS', 'coding', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('youtube-title-thumbnail', 'Generate YouTube titles and thumbnails with high CTR', 'Improve click-through rate', 'video', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['video', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('shorts-script-hooks', 'Write viral Shorts hooks and scripts', 'Short-form video scripts', 'video', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['video', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('meeting-notes-actions', 'Turn meeting notes into action items', 'Structured tasks from notes', 'general', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['general', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('saas-pricing-strategy', 'Design a SaaS pricing strategy', 'Create pricing tiers', 'strategy', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['strategy', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('sql-query-optimizer', 'Optimize a slow SQL query', 'Improve database performance', 'data', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['data', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('resume-bullet-metrics', 'Rewrite resume bullets with metrics', 'Impact-driven resume bullets', 'general', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['general', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('customer-support-reply', 'Write a calm support reply', 'De-escalate customer issues', 'general', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['general', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('feature-requirements-doc', 'Generate a product requirements document', 'Clear PRDs', 'product', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('api-documentation', 'Write clean API documentation', 'Developer-friendly docs', 'coding', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('prompt-evaluation', 'Compare AI prompt outputs', 'Benchmark prompt quality', 'ai', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('job-description', 'Write a compelling job description', 'Attract qualified candidates', 'hr', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['hr', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('linkedin-post', 'Write a LinkedIn post that gets engagement', 'Increase reach', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('ad-copy-variants', 'Generate ad copy variants for testing', 'A/B ad testing', 'marketing', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('ux-microcopy', 'Write UX microcopy for apps', 'Improve usability', 'design', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['design', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('error-messages', 'Write helpful error messages', 'Improve UX clarity', 'design', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['design', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('email-follow-up', 'Write a follow-up email that gets responses', 'Increase reply rates', 'sales', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['sales', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('sales-call-script', 'Create a sales discovery call script', 'Qualify leads', 'sales', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['sales', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('proposal-outline', 'Generate a client proposal outline', 'Win deals', 'sales', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['sales', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('content-calendar', 'Build a 30-day content calendar', 'Plan content', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('twitter-thread', 'Write a viral Twitter/X thread', 'Increase engagement', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('blog-introduction', 'Write a compelling blog introduction', 'Hook readers', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('case-study', 'Write a customer case study', 'Show proof', 'marketing', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('value-proposition', 'Define a clear value proposition', 'Clarify positioning', 'strategy', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['strategy', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('competitive-analysis', 'Run a competitive analysis', 'Market positioning', 'strategy', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['strategy', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('feature-prioritization', 'Prioritize product features', 'Product roadmap', 'product', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('roadmap-planning', 'Create a product roadmap', 'Align execution', 'product', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('onboarding-emails', 'Write onboarding email sequence', 'Improve activation', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('churn-reduction', 'Generate churn reduction ideas', 'Improve retention', 'strategy', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['strategy', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('pricing-page-copy', 'Write pricing page copy', 'Increase conversions', 'marketing', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('affiliate-review', 'Write an affiliate product review', 'Drive conversions', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('faq-generator', 'Generate FAQs for a product page', 'Reduce objections', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('support-macro', 'Create support macros', 'Speed up support', 'general', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['general', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('knowledge-base', 'Write knowledge base articles', 'Self-serve support', 'general', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['general', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('release-notes', 'Write product release notes', 'Communicate updates', 'product', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('bug-report', 'Write a clear bug report', 'Improve engineering flow', 'coding', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('git-commit-message', 'Write better git commit messages', 'Readable history', 'coding', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('code-review', 'Perform a code review', 'Improve quality', 'coding', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('refactor-plan', 'Create a refactoring plan', 'Reduce tech debt', 'coding', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('database-schema', 'Design a database schema', 'Scalable data model', 'data', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['data', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('api-auth-design', 'Design API authentication', 'Secure APIs', 'coding', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('rate-limiting', 'Design API rate limiting', 'Protect services', 'coding', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['coding', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('log-analysis', 'Analyze application logs', 'Debug issues', 'data', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['data', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('incident-postmortem', 'Write an incident postmortem', 'Improve reliability', 'engineering', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['engineering', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('monitoring-setup', 'Design monitoring and alerts', 'Observe systems', 'engineering', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['engineering', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('kpi-dashboard', 'Define KPIs and dashboards', 'Measure success', 'data', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['data', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('financial-model', 'Build a startup financial model', 'Forecast revenue', 'finance', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['finance', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('unit-economics', 'Analyze unit economics', 'Understand profitability', 'finance', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['finance', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('investor-pitch', 'Create an investor pitch outline', 'Raise capital', 'finance', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['finance', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('exec-summary', 'Write an executive summary', 'Communicate clearly', 'business', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['business', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('market-sizing', 'Estimate market size (TAM/SAM/SOM)', 'Market analysis', 'strategy', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['strategy', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('user-personas', 'Create user personas', 'Understand customers', 'product', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('user-interviews', 'Generate user interview questions', 'Customer research', 'product', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('survey-questions', 'Write effective survey questions', 'Collect insights', 'product', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('ab-test-plan', 'Design an A/B test plan', 'Experimentation', 'product', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['product', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('conversion-audit', 'Audit a funnel for conversion leaks', 'Improve growth', 'marketing', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('email-subject-lines', 'Generate high open-rate subject lines', 'Increase opens', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('newsletter-outline', 'Create a newsletter outline', 'Audience engagement', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('brand-voice', 'Define a brand voice guide', 'Consistent messaging', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('tone-rewrite', 'Rewrite copy in a different tone', 'Adapt messaging', 'marketing', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['marketing', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('legal-summary', 'Summarize a legal document', 'Plain-English summary', 'legal', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['legal', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('privacy-policy', 'Generate a privacy policy draft', 'Compliance', 'legal', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['legal', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('terms-of-service', 'Generate terms of service draft', 'Compliance', 'legal', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['legal', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('risk-assessment', 'Perform a risk assessment', 'Identify risks', 'business', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['business', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('process-documentation', 'Document an internal process', 'Operational clarity', 'business', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['business', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('sop-generator', 'Create a standard operating procedure', 'Repeatable workflows', 'business', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['business', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('vendor-comparison', 'Compare vendors objectively', 'Decision support', 'business', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['business', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('automation-ideas', 'Generate automation opportunities', 'Save time', 'operations', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['operations', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('zapier-workflow', 'Design a Zapier automation', 'No-code automation', 'operations', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['operations', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('ai-use-cases', 'Identify AI use cases for a business', 'AI strategy', 'ai', 'beginner', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'beginner'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('prompt-library', 'Create a reusable prompt library', 'Prompt management', 'ai', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('prompt-forking', 'Improve a prompt via forking', 'Prompt iteration', 'ai', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('prompt-failure', 'Analyze prompt failures', 'Improve reliability', 'ai', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('benchmark-prompts', 'Benchmark multiple prompts', 'Find best output', 'ai', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('model-comparison', 'Compare AI model outputs', 'Model selection', 'ai', 'intermediate', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'intermediate'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;

INSERT INTO problems (slug, title, description, industry, difficulty, created_by, visibility, tags)
VALUES ('cost-optimization', 'Optimize AI usage costs', 'Reduce spend', 'ai', 'advanced', '8ef93276-ac37-4068-b426-d7ebafaddaaa', 'public', ARRAY['ai', 'advanced'])
ON CONFLICT (slug) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  industry = EXCLUDED.industry,
  difficulty = EXCLUDED.difficulty;
