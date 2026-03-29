-- Migration: Platform Health & Economics
-- Phase 3 Implementation

-- 1. Singleton Platform Settings Table for Emergency Controls
CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY CHECK (id = 1),
  is_emergency_lockdown BOOLEAN NOT NULL DEFAULT false,
  ai_generation_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert singleton row if it doesn't already exist
INSERT INTO platform_settings (id, is_emergency_lockdown, ai_generation_enabled)
VALUES (1, false, true)
ON CONFLICT (id) DO NOTHING;

-- Security Policies for Platform Settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access to platform settings" ON platform_settings;
CREATE POLICY "Public read access to platform settings" 
  ON platform_settings 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Admin update access" ON platform_settings;
CREATE POLICY "Admin update access" 
  ON platform_settings 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Daily Analytics Materialized View Equivalent (Standard View for real-time reads)
CREATE OR REPLACE VIEW admin_daily_metrics AS
SELECT 
  CURRENT_DATE as metric_date,
  (SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE created_at >= CURRENT_DATE) as daily_active_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) as new_signups,
  (SELECT COUNT(*) FROM prompts WHERE created_at >= CURRENT_DATE) as prompts_created,
  (SELECT COUNT(*) FROM prompt_stats WHERE ai_scored_at >= CURRENT_DATE) as ai_evaluations_today;

-- 3. Total Historic Metrics View
CREATE OR REPLACE VIEW admin_total_metrics AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM prompts) as total_prompts,
  (SELECT COUNT(*) FROM problems) as total_problems,
  (SELECT COUNT(*) FROM prompt_stats WHERE ai_scored_at IS NOT NULL) as total_ai_evaluations;
