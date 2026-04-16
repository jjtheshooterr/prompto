# Unused Indexes Analysis

**Date:** February 27, 2026  
**Level:** INFO (not critical)  
**Total:** 54 unused indexes

## Overview

These indexes haven't been used yet according to Supabase's linter. This is common in development/staging environments with low traffic or limited query patterns.

## Recommendation

**DO NOT remove these indexes yet.** They were likely created for specific query patterns that will occur in production. Monitor them for 30-60 days in production before making removal decisions.

## Breakdown by Category

### Search Indexes (11 indexes)
**Tables:** `search_prompts_mv`, `search_problems_mv`, `prompts`, `problems`

These are critical for search functionality:
- `search_prompts_mv_trgm_idx` - Trigram search
- `search_prompts_mv_fts_idx` - Full-text search
- `search_prompts_mv_workspace_idx` - Workspace filtering
- `search_prompts_mv_visibility_idx` - Visibility filtering
- `search_problems_mv_trgm_idx` - Trigram search
- `search_problems_mv_fts_idx` - Full-text search
- `search_problems_mv_workspace_idx` - Workspace filtering
- `search_problems_mv_visibility_idx` - Visibility filtering
- `prompts_fts_idx` - Full-text search on prompts
- `problems_fts_idx` - Full-text search on problems
- `idx_problems_visibility` - Problem visibility queries

**Status:** ⚠️ KEEP - Essential for search features

### Lookup/Foreign Key Indexes (15 indexes)
**Purpose:** Speed up JOIN operations and foreign key lookups

- `idx_problem_members_problem` - Problem member lookups
- `idx_problem_members_lookup` - Composite lookup
- `idx_problem_members_user_id` - User's problems
- `idx_workspace_members_lookup` - Workspace member lookups
- `idx_workspace_members_workspace_id` - Workspace queries
- `votes_prompt_id_idx` - Vote lookups by prompt
- `idx_votes_user` - User's votes
- `idx_votes_user_id` - User vote queries
- `idx_votes_prompt_id_user_id` - Composite vote lookup
- `idx_prompt_events_prompt` - Event lookups by prompt
- `idx_prompt_events_user_id` - User event queries
- `idx_prompt_reviews_user_id` - User review queries
- `idx_reports_reviewed_by` - Moderator queries
- `idx_reports_reporter_id` - Reporter queries
- `idx_profiles_username` - Username lookups

**Status:** ⚠️ KEEP - Will be used for common queries

### Composite/Filtering Indexes (16 indexes)
**Purpose:** Optimize complex queries with multiple conditions

- `idx_prompts_workspace` - Workspace prompts
- `idx_prompts_deleted` - Soft delete filtering
- `idx_prompts_slug` - Slug lookups
- `idx_prompts_root_prompt_id` - Fork lineage
- `idx_prompts_problem_listing` - Problem prompt lists
- `idx_prompts_listing` - General listing queries
- `idx_prompts_public_explore` - Public explore page
- `idx_prompts_workspace_id_created_at` - Workspace activity
- `idx_problems_slug` - Problem slug lookups
- `idx_problems_workspace_visibility` - Workspace visibility
- `idx_problems_visibility_listed` - Public listings
- `idx_problems_deleted` - Soft delete filtering
- `idx_problems_public_feed` - Public feed queries
- `idx_prompt_tags_tag_id_lookup` - Tag filtering
- `idx_reports_status` - Report status filtering
- `idx_reports_moderation` - Moderation queue

**Status:** ⚠️ KEEP - Needed for listing/filtering pages

### Analytics/Stats Indexes (6 indexes)
**Purpose:** Speed up analytics and statistics queries

- `idx_prompt_stats_fork_count` - Popular prompts by forks
- `idx_prompt_stats_updated_at` - Recent activity
- `idx_prompt_stats_views` - Popular prompts by views
- `idx_prompt_events_type` - Event type analytics
- `idx_prompt_events_prompt_id_created_at` - Prompt activity timeline
- `idx_prompt_events_user_id_created_at` - User activity timeline

**Status:** ⚠️ KEEP - Used for dashboards and analytics

### Cleanup/Maintenance Indexes (2 indexes)
**Purpose:** Support background jobs and data cleanup

- `idx_prompt_events_cleanup` - Event cleanup jobs
- `idx_prompt_events_event_type_created_at` - Event processing

**Status:** ⚠️ KEEP - Needed for maintenance tasks

### Composite Report Indexes (4 indexes)
**Purpose:** Optimize moderation and reporting queries

- `idx_reports_content_type_content_id` - Content report lookups
- `idx_reports_status_created_at` - Moderation queue ordering
- `idx_reports_moderation` - Moderation dashboard
- `idx_reports_reviewed_by` - Moderator activity

**Status:** ⚠️ KEEP - Critical for moderation

## Indexes That Might Be Redundant

### Potentially Duplicate Username Indexes
- `idx_profiles_username` - Regular username index
- `idx_profiles_username_lower` - Case-insensitive username index

**Analysis:** If all username queries use `LOWER(username)`, the first index might be redundant.

**Action:** Monitor both. If `idx_profiles_username` is never used after 30 days, consider removing it.

## Monitoring Plan

1. **Production deployment:** Deploy all indexes to production
2. **Monitor for 30-60 days:** Track which indexes are actually used
3. **Review usage stats:** Query `pg_stat_user_indexes` to see scan counts
4. **Remove confirmed unused:** Only remove indexes with 0 scans after monitoring period

## Query to Check Index Usage in Production

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Conclusion

**All 54 unused indexes should be kept for now.** They support important features:
- Search functionality (11 indexes)
- Foreign key lookups (15 indexes)
- Listing/filtering pages (16 indexes)
- Analytics/dashboards (6 indexes)
- Moderation tools (4 indexes)
- Maintenance jobs (2 indexes)

Re-evaluate after production monitoring period.
