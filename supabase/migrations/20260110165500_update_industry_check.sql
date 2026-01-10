-- Update industry check constraint to include new categories from seed data
ALTER TABLE problems DROP CONSTRAINT IF EXISTS problems_industry_check;

ALTER TABLE problems ADD CONSTRAINT problems_industry_check CHECK (industry IS NULL OR industry IN (
  'video', 'dev', 'legal', 'marketing', 'data', 'content', 
  'support', 'sales', 'hr', 'finance', 'education', 'healthcare',
  'ai', 'business', 'coding', 'design', 'engineering', 'general', 
  'operations', 'product', 'strategy'
));
