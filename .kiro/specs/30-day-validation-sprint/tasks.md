# Implementation Plan: 30-Day Validation Sprint (MINIMAL)

## Overview

This is a **validation sprint**, not a feature build. The goal is to prove indie SaaS founders will use and fork prompts within 30 days. Everything else is noise.

**Success Criteria:**
- 50 real signups
- 20 forks
- 10 returning users
- 1 fork chain depth ≥ 2

**What Already Exists:**
- ✅ `prompt_events` table with fork tracking
- ✅ `parent_prompt_id` for fork chains
- ✅ `prompt_stats` with `fork_count`
- ✅ Fork depth calculation

**What We're NOT Building:**
- ❌ New analytics tables
- ❌ Custom dashboards
- ❌ Property-based tests
- ❌ Fork visualization components
- ❌ Distribution tracking database
- ❌ Complex metrics calculation

## Tasks

- [x] 1. Update homepage positioning (30 minutes)
  - [x] 1.1 Update hero copy to target indie SaaS founders
    - Change value prop to "Production-ready prompts for real SaaS problems"
    - Add subtitle: "Built by indie founders, for indie founders"
    - Add concrete example block above the fold:
      ```
      Example problems you'll find here:
      • Reduce hallucinations in financial summaries
      • Extract structured data from messy support tickets
      • Generate Stripe webhook SQL safely
      ```
    - File: `app/(marketing)/page.tsx`

- [x] 2. Add fork notification email (2 hours)
  - [x] 2.1 Install Resend
    - Run: `npm install resend`
    - Add `RESEND_API_KEY` to `.env.local`
  
  - [x] 2.2 Create simple email template
    - File: `lib/email/fork-notification.ts`
    - Subject: "[Promptvexity] Your prompt was forked!"
    - Body: "Hi {author}, {forker} just forked your prompt '{title}'. See how your prompt evolves → {link}"
    - The phrase "See how your prompt evolves" frames the platform as evolutionary
  
  - [x] 2.3 Add email trigger to fork action
    - File: `lib/actions/prompts.actions.ts` (existing fork function)
    - After fork succeeds, call Resend API
    - If email fails, log error and continue (don't block fork)

- [x] 3. Seed 50 surgical SaaS problems (THIS IS 80% OF THE WORK)
  - [x] 3.1 Write 50 real SaaS AI problems
    - File: `scripts/seed-validation-problems.ts`
    - **CRITICAL: Each problem must pass this test:**
      - If a SaaS founder reads it, do they think: "I literally dealt with this last week"?
      - If not, it's filler. Delete it.
    - **Be surgical, not generic:**
      - ❌ BAD: "Generate better SQL queries"
      - ✅ GOOD: "Prevent hallucinated financial totals when summarizing Stripe exports"
      - ❌ BAD: "Summarize documents"
      - ✅ GOOD: "Extract SLA breach indicators from support ticket threads"
      - ❌ BAD: "Write marketing emails"
      - ✅ GOOD: "Generate refund emails that prevent chargeback escalation"
    - 10 financial problems (Stripe export summaries, expense categorization with tax codes, etc.)
    - 10 support problems (churn-risk classification, SLA breach detection, etc.)
    - 10 API problems (idempotent migration generation, webhook payload validation, etc.)
    - 10 content problems (SEO meta for SaaS landing pages, changelog generation from commits, etc.)
    - 10 dev problems (PR descriptions from diffs, test case generation from bug reports, etc.)
    - Each with 1-2 strong example prompts
    - **Specificity = credibility**
  
  - [x] 3.2 Run seeding script
    - Run: `npm run seed:validation`
    - Verify all 50 problems appear on /problems page

- [x] 4. Manual metrics tracking (NO DASHBOARD)
  - [x] 4.1 Create SQL queries file
    - File: `scripts/validation-metrics.sql`
    - Query 1: Total signups
    - Query 2: Total forks
    - Query 3: Users who forked
    - Query 4: Returning users (2+ days)
    - Query 5: Fork chains (depth >= 2)
  
  - [x] 4.2 Run queries weekly in Supabase SQL editor
    - No UI needed
    - Copy results to spreadsheet

## Distribution Plan (NOT CODING)

**Week 1:**
- Finalize positioning
- Seed 50 problems
- Deploy

**Week 2:**
- DM 30 SaaS founders on Twitter
  - **CRITICAL: Don't say "Check out my prompt platform"**
  - **DO say: "I built a problem-first prompt evolution system for SaaS builders. I'd love 10 minutes of brutal feedback."**
  - You're recruiting co-builders, not selling
  - That tone matters
- Post in 3 AI Discord servers
- Post in Indie Hackers
- Share in 1 founder Slack

**Week 3:**
- Watch users live
- Collect feedback
- Fix friction points
- **DO NOT disappear back into code after 3 DMs**

**Week 4:**
- Run SQL queries
- Measure fork activity
- Decide: pivot or double down

## Manual Metrics (Run Weekly)

```sql
-- Total signups
SELECT COUNT(*) FROM profiles;

-- Total forks
SELECT COUNT(*) FROM prompt_events WHERE event_type = 'fork';

-- Users who forked
SELECT COUNT(DISTINCT user_id) FROM prompt_events WHERE event_type = 'fork';

-- Returning users (2+ different days)
SELECT user_id 
FROM prompt_events 
GROUP BY user_id 
HAVING COUNT(DISTINCT DATE(created_at)) >= 2;

-- Fork chains (depth >= 2)
SELECT COUNT(*) FROM prompts WHERE depth >= 2;

-- 🎯 THE REAL SIGNAL METRIC: Fork conversion rate
-- If people view but don't fork, your evolution mechanic is weak
SELECT 
  (SELECT COUNT(*) FROM prompt_events WHERE event_type = 'fork')::float / 
  NULLIF((SELECT COUNT(*) FROM prompt_events WHERE event_type = 'view'), 0) * 100 
  AS fork_conversion_percentage;
```

**Focus on:** `forks / prompt_views` - This ratio tells you more than raw fork count.

## What We're NOT Building

- ❌ validation_events table (use existing prompt_events)
- ❌ fork_notifications table (just send email, don't track)
- ❌ distribution_activities table (use spreadsheet)
- ❌ Validation dashboard UI
- ❌ Metrics calculation functions
- ❌ Property-based tests
- ❌ Fork chain visualization
- ❌ Charting libraries
- ❌ Pricing page (not needed yet)

## Success Criteria (30 Days)

- 50 real signups
- 20 forks
- 10 returning users
- 1 fork chain depth ≥ 2

If you don't hit this, it's a positioning issue, not an infrastructure issue.
