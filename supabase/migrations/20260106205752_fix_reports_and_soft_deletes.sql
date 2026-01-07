-- Part 1: Fix reports table and add soft delete columns

-- 1. Fix the reports table structure
DROP TABLE IF EXISTS reports;

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('prompt', 'problem', 'comment')) NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add soft delete columns to prompts and problems
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE problems 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add role column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user', 'moderator', 'admin')) DEFAULT 'user';

-- 4. Create indexes for reports and soft deletes
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_prompts_deleted ON prompts(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_problems_deleted ON problems(is_deleted) WHERE is_deleted = FALSE;

-- 5. Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;;
