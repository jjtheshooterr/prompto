# Weekly Validation Metrics - How to Run

This guide explains how to manually run validation metrics queries each week during the 30-day validation sprint.

## Overview

The validation sprint tracks 5 core metrics to determine if indie SaaS founders are engaging with Promptvexity's core loop (discover → fork → improve → share). Instead of building a custom dashboard, we run SQL queries directly in Supabase and track results in a spreadsheet.

## Success Criteria (30 Days)

- **50 real signups**
- **20 forks**
- **10 returning users** (visited on 2+ different days)
- **1 fork chain** with depth ≥ 2

## Weekly Process

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Promptvexity project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Core Metrics Queries

Copy and paste each query from `scripts/validation-metrics.sql` into the SQL editor and run them one at a time. Record the results in your tracking spreadsheet.

#### Query 1: Total Signups

```sql
SELECT COUNT(*) AS total_signups 
FROM profiles;
```

**Target:** 50+ signups by day 30

#### Query 2: Total Forks

```sql
SELECT COUNT(*) AS total_forks 
FROM prompt_events 
WHERE event_type = 'fork';
```

**Target:** 20+ forks by day 30

#### Query 3: Users Who Forked

```sql
SELECT COUNT(DISTINCT user_id) AS users_who_forked 
FROM prompt_events 
WHERE event_type = 'fork';
```

**What it means:** How many unique users have created at least one fork

#### Query 4: Returning Users

```sql
SELECT COUNT(*) AS returning_users
FROM (
  SELECT user_id 
  FROM prompt_events 
  GROUP BY user_id 
  HAVING COUNT(DISTINCT DATE(created_at)) >= 2
) AS returning_user_list;
```

**Target:** 10+ returning users by day 30  
**What it means:** Users who visited on 2+ different calendar days

#### Query 5: Fork Chains (Depth ≥ 2)

```sql
SELECT COUNT(*) AS fork_chains_depth_2_plus 
FROM prompts 
WHERE depth >= 2;
```

**Target:** 1+ fork chain by day 30  
**What it means:** Prompts that were forked from other forks (organic evolution)

#### 🎯 THE REAL SIGNAL: Fork Conversion Rate

```sql
SELECT 
  (SELECT COUNT(*) FROM prompt_events WHERE event_type = 'fork')::float / 
  NULLIF((SELECT COUNT(*) FROM prompt_events WHERE event_type = 'view'), 0) * 100 
  AS fork_conversion_percentage;
```

**What it means:** Percentage of prompt views that result in forks  
**Why it matters:** If people view but don't fork, your evolution mechanic is weak. This ratio tells you more than raw fork count.

### Step 3: Record Results in Spreadsheet

Create a Google Sheet or Excel file with these columns:

| Week | Date | Signups | Forks | Users Who Forked | Returning Users | Fork Chains | Fork Conversion % |
|------|------|---------|-------|------------------|-----------------|-------------|-------------------|
| 1    | 2024-03-01 | 12 | 3 | 2 | 1 | 0 | 5.2% |
| 2    | 2024-03-08 | 28 | 8 | 5 | 4 | 1 | 7.1% |
| 3    | 2024-03-15 | ... | ... | ... | ... | ... | ... |
| 4    | 2024-03-22 | ... | ... | ... | ... | ... | ... |

### Step 4: Run Bonus Queries (Optional)

These queries provide additional context but aren't required for validation success:

#### Detailed Fork Chain Analysis

See which prompts are generating the most evolution:

```sql
SELECT 
  p.id,
  p.title,
  p.depth,
  p.fork_count,
  u.username AS author
FROM prompts p
LEFT JOIN profiles u ON p.created_by = u.id
WHERE p.depth >= 2
ORDER BY p.depth DESC, p.fork_count DESC
LIMIT 20;
```

#### Daily Signup Trend

Track signup velocity over time:

```sql
SELECT 
  DATE(created_at) AS signup_date,
  COUNT(*) AS signups_that_day
FROM profiles
GROUP BY DATE(created_at)
ORDER BY signup_date DESC
LIMIT 30;
```

#### Most Active Forkers

Identify power users driving evolution:

```sql
SELECT 
  u.username,
  COUNT(*) AS fork_count
FROM prompt_events pe
JOIN profiles u ON pe.user_id = u.id
WHERE pe.event_type = 'fork'
GROUP BY u.username
ORDER BY fork_count DESC
LIMIT 10;
```

## Interpreting Results

### Week 1-2: Seeding Phase
- **Expected:** Low numbers, mostly testing
- **Focus:** Are the 50 seeded problems resonating? Are people viewing them?
- **Action:** If views are low, positioning might be off

### Week 2-3: Distribution Phase
- **Expected:** Signups increasing, first forks appearing
- **Focus:** Fork conversion rate - are people forking after viewing?
- **Action:** If conversion is <5%, the evolution mechanic isn't compelling

### Week 3-4: Validation Phase
- **Expected:** Returning users appearing, potential fork chains
- **Focus:** Are people coming back? Are forks being forked?
- **Action:** If no returning users, engagement loop is broken

## Red Flags

🚩 **Fork conversion <3%:** People don't see value in forking  
🚩 **No returning users by week 3:** Engagement loop is broken  
🚩 **Signups but no forks:** Positioning attracts wrong audience  
🚩 **Forks but no fork chains:** Evolution mechanic isn't working

## Green Flags

✅ **Fork conversion >10%:** Strong evolution mechanic  
✅ **Returning users by week 2:** Engagement loop working  
✅ **Fork chains appearing:** Organic prompt evolution happening  
✅ **Active forkers list growing:** Power users emerging

## What to Do After 30 Days

### If You Hit Success Criteria:
- You've validated product-market fit
- Double down on distribution
- Start building Pro tier features
- Consider raising pre-seed

### If You Miss Success Criteria:
- **Missed signups but hit engagement:** Distribution problem, not product problem
- **Hit signups but missed engagement:** Positioning problem - attracting wrong audience
- **Low fork conversion:** Evolution mechanic isn't compelling - rethink forking UX
- **No fork chains:** Prompts aren't good enough to evolve - improve seeded content quality

## Tips

- **Run queries same day each week** (e.g., every Monday morning)
- **Don't obsess over daily changes** - weekly trends matter more
- **Focus on fork conversion rate** - it's the leading indicator
- **Talk to users who fork** - they're your early adopters
- **Talk to users who view but don't fork** - they'll tell you what's missing

## Questions?

If queries fail or return unexpected results:
1. Check that `prompt_events` table exists and has data
2. Verify `event_type` values are correct ('fork', 'view')
3. Confirm `prompts.depth` field is being calculated correctly
4. Check Supabase logs for any database errors

Remember: This is a validation sprint, not a feature build. The goal is to prove indie SaaS founders will use and fork prompts. Everything else is noise.
