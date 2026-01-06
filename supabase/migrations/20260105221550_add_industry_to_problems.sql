-- Add industry field to problems for vertical organization
ALTER TABLE problems ADD COLUMN industry TEXT;

-- Add a check constraint for common industries (can be expanded later)
ALTER TABLE problems ADD CONSTRAINT problems_industry_check 
  CHECK (industry IS NULL OR industry IN (
    'video', 'dev', 'legal', 'marketing', 'data', 'content', 
    'support', 'sales', 'hr', 'finance', 'education', 'healthcare'
  ));

-- Add index for industry filtering
CREATE INDEX idx_problems_industry ON problems(industry) WHERE industry IS NOT NULL;;
