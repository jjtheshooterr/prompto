# Performance & Security Implementation Plan

## Current State Analysis

### Rendering Strategy Issues
- ❌ Most public pages are client-side ('use client')
- ❌ No ISR/revalidation configured
- ❌ No caching strategy defined
- ❌ Client-side data fetching everywhere

### Security Issues
- ❌ No rate limiting on any endpoints
- ❌ Server actions exposed without throttling
- ❌ No IP-based limits

### Performance Issues
- ❌ RLS policies use `auth.uid()` directly (not optimized)
- ❌ No query performance analysis done
- ❌ Missing indexes on hot paths

## Implementation Priority

### Phase 1: Critical Security (DO FIRST)
1. Add rate limiting middleware
2. Protect server actions
3. Add IP throttling

### Phase 2: Rendering Strategy (TRAFFIC MULTIPLIER)
1. Convert public pages to SSR with ISR
2. Add revalidation tags
3. Keep private pages dynamic

### Phase 3: Database Performance
1. Optimize RLS policies
2. Add missing indexes
3. Run EXPLAIN ANALYZE on hot queries

## Detailed Implementation

### 1. Rate Limiting Strategy

**Endpoints to protect:**
- `/api/*` - All API routes
- Server actions: votes, reviews, reports, prompt_events
- Authentication endpoints

**Implementation:**
- Use middleware with simple in-memory rate limiting (start)
- Upgrade to Upstash Redis for production
- Per-user limits: 100 req/min
- Per-IP limits: 200 req/min

### 2. Page Rendering Strategy

**Public Pages (ISR with revalidation):**
- `/` (homepage) - ISR 60s
- `/problems` - ISR 120s
- `/problems/[slug]` - ISR 300s
- `/prompts` - ISR 120s
- `/prompts/[id]` - ISR 300s
- `/u/[username]` - ISR 300s
- `/compare` - Client (interactive)

**Private Pages (SSR/Client):**
- `/dashboard` - Client
- `/workspace` - Client
- `/settings` - Client
- `/create/*` - Client
- `/admin/*` - SSR (no cache)

### 3. RLS Optimization

**Replace in all policies:**
```sql
-- Before
auth.uid()

-- After
(select auth.uid())
```

**Add indexes for membership checks:**
```sql
CREATE INDEX IF NOT EXISTS idx_workspace_members_lookup 
ON workspace_members(workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_problem_members_lookup 
ON problem_members(problem_id, user_id);
```

### 4. Query Performance Indexes

**Feed queries:**
```sql
-- For browsing by score
CREATE INDEX IF NOT EXISTS idx_prompts_score_created 
ON prompts(is_listed, is_hidden, visibility, created_at DESC) 
WHERE is_deleted = false;

-- For problem prompts
CREATE INDEX IF NOT EXISTS idx_prompts_problem_created 
ON prompts(problem_id, is_listed, created_at DESC) 
WHERE is_deleted = false;
```

## Testing Checklist

- [ ] Rate limiting blocks excessive requests
- [ ] Public pages cache correctly
- [ ] Private pages don't leak data
- [ ] RLS policies use optimized auth.uid()
- [ ] EXPLAIN ANALYZE shows index usage
- [ ] No N+1 queries in feeds
- [ ] Avatar uploads work with new filenames
- [ ] Pagination works on all list pages

## Rollout Plan

1. **Week 1**: Security (rate limiting)
2. **Week 2**: Rendering strategy (ISR)
3. **Week 3**: Database optimization (RLS + indexes)
4. **Week 4**: Performance testing & tuning
