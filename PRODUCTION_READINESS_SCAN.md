# 🔍 PRODUCTION READINESS SCAN

**Date:** January 28, 2026  
**Scan Type:** Full prod-ready + traffic handling  
**Status:** IN PROGRESS

---

## 1️⃣ CORE PRODUCT FLOWS

### Anonymous Browsing
- ✅ Browse problems - no permission denied
- ✅ Problem detail - RLS allows public/unlisted
- ✅ Prompt detail - inherits problem visibility
- ✅ Compare - RLS enforced
- ✅ Profile pages - public view available

### Pagination & Sorting
- ✅ Problems page - has pagination
- ✅ All prompts page - has pagination (12 per page)
- ✅ Stable sorting - created_at indexed
- ⚠️ **ISSUE:** Need to verify sorting options (newest/top/most forked)

### Card Attribution
- ✅ ProblemCard - has AuthorChip
- ✅ PromptCard - has AuthorChip
- ✅ Fallback to display_name
- ✅ Fallback to "Anonymous"
- ✅ Links to profile

### Authenticated Flows
- ✅ Create Problem → workspace visibility
- ✅ Create Prompt → prompt_stats created automatically (trigger)
- ✅ Fork Prompt → parent_prompt_id set, fork_count increments (trigger)
- ✅ Vote → UPSERT with unique constraint, atomic stats update
- ✅ Compare → RLS enforced on prompt_events

### Deletion/Hiding Behavior
- ✅ `is_deleted` field exists on problems & prompts
- ✅ `is_hidden` field exists on prompts
- ⚠️ **NEED TO VERIFY:** All queries filter by is_deleted/is_hidden
- ⚠️ **NEED TO DECIDE:** Deleted author behavior

---

## 2️⃣ PROFILES + ATTRIBUTION

### Data Model Rules
- ✅ `profiles.username` unique
- ✅ Case-insensitive uniqueness (LOWER index)
- ✅ Reserved usernames blocked (30+ words)
- ✅ Username format validation (3-20 chars, a-z0-9_)
- ✅ Username change tracking (username_changed_at)
- ⚠️ **NEED TO DECIDE:** Username immutability policy

### Public Profile Page
- ✅ `/u/[username]` route exists
- ✅ Header with avatar, display name, @username
- ✅ Tabs: Prompts, Forks, Problems
- ✅ Sorting options available
- ✅ Visibility enforcement via RLS
- ✅ ISR caching (300s)

### Attribution Everywhere
- ✅ Problem cards - AuthorChip
- ✅ Prompt cards - AuthorChip
- ⚠️ **NEED TO CHECK:** Compare cards
- ⚠️ **NEED TO CHECK:** Workspace members modal

### Performance
- ✅ Indexed on created_by
- ✅ Pagination implemented
- ✅ ISR caching on profile pages

---

## 3️⃣ SECURITY / ABUSE-RESISTANCE

### Account & Auth Hardening
- ⚠️ **TODO:** Enable leaked password protection (Supabase Dashboard)
- ✅ Rate limiting: 200 req/min per IP (middleware)
- ⚠️ **MISSING:** Per-endpoint rate limits (votes, reports, forks)
- ⚠️ **MISSING:** Bot protection (Turnstile/hCaptcha)

### Content Abuse
- ✅ Report deduplication constraint added
- ✅ Report workflow: pending → reviewed → dismissed/actioned
- ✅ Report count function (atomic)
- ⚠️ **MISSING:** Moderator UI
- ⚠️ **NEED TO VERIFY:** XSS protection in user content

### Privacy & Leakage
- ✅ Email never shown in UI
- ✅ Private problems filtered in profile pages
- ✅ Compare respects RLS
- ✅ Prompt events respect RLS
- ⚠️ **NEED TO VERIFY:** Search/autocomplete (if exists)

---

## 4️⃣ DATABASE + RLS PRODUCTION

### RLS Correctness
- ✅ All tables have RLS ON
- ✅ Policies optimized ((select auth.uid()))
- ✅ Duplicate policies removed
- ✅ No per-row auth.uid() recalculation

### Critical Indexes
**Problems:**
- ✅ `idx_problems_public_feed` (visibility, is_listed, created_at)
- ✅ `idx_problems_slug` (unique)
- ✅ `idx_problems_visibility`
- ✅ `idx_problems_deleted`

**Prompts:**
- ✅ `idx_prompts_public_feed` (problem_id, is_listed, created_at)
- ✅ `idx_prompts_created_by_date` (created_by, created_at)
- ✅ `idx_prompts_forks` (parent_prompt_id)
- ✅ `prompts_problem_id_slug_key` (unique)

**Prompt Stats:**
- ✅ `idx_prompt_stats_upvotes` (upvotes DESC)
- ✅ `idx_prompt_stats_forks` (fork_count DESC)
- ✅ `idx_prompt_stats_ranking` (score, upvotes, fork_count)

**Problem Members:**
- ✅ `idx_problem_members_lookup` (problem_id, user_id)

**Profiles:**
- ✅ `idx_profiles_username_lower` (LOWER(username))
- ✅ `profiles_username_key` (unique)

### Stats Drift Audit
- ✅ Triggers create stats automatically
- ✅ Atomic updates via SECURITY DEFINER functions
- ⚠️ **MISSING:** Admin repair function for stats rebuild

---

## 5️⃣ NEXT.JS PRODUCTION READINESS

### Rendering + Caching Strategy
**Current Implementation:**
- ✅ Homepage: ISR 60s
- ✅ Browse Problems: ISR 120s
- ✅ Problem Detail: ISR 300s
- ✅ All Prompts: ISR 120s
- ✅ Profile Pages: ISR 300s
- ✅ Workspace/Dashboard: Client-side (no cache)

### Request Control
- ✅ Middleware rate limiting (200 req/min per IP)
- ⚠️ **MISSING:** Per-endpoint rate limits
- ⚠️ **NEED TO VERIFY:** N+1 queries on profile pages

### Static + Asset Optimization
- ✅ Next Image configured for Supabase
- ✅ Avatar uploads working
- ⚠️ **NEED TO VERIFY:** Cache headers on static assets
- ⚠️ **NEED TO VERIFY:** Bundle size on list pages

---

## 6️⃣ OBSERVABILITY + OPS

### Error Monitoring
- ❌ **MISSING:** Sentry or equivalent
- ❌ **MISSING:** Structured logging
- ❌ **MISSING:** RLS denial tracking

### Basic Dashboards
- ❌ **MISSING:** Signups/day tracking
- ❌ **MISSING:** Prompts created/day
- ❌ **MISSING:** Forks/votes/day
- ❌ **MISSING:** Top endpoints by latency

**Note:** These are post-launch nice-to-haves

---

## 7️⃣ REAL-WORLD FEATURE POLISH

### Attribution Consistency
- ✅ Browse Problems shows "by @username"
- ✅ All Prompts shows author
- ✅ Email never shown
- ✅ AuthorChip component used consistently
- ✅ Avatar + @username link
- ✅ Fallback logic consistent

### Navigation
- ✅ Settings accessible from dashboard
- ⚠️ **NEED TO CHECK:** Settings link in nav when logged in

### Profile Access
- ✅ View profile from problem card
- ✅ View profile from prompt card
- ⚠️ **NEED TO CHECK:** View profile from compare

---

## 8️⃣ FINAL LAUNCH DAY CHECKLIST

### Pre-Launch Testing
- ⚠️ **TODO:** Test as logged out user
- ⚠️ **TODO:** Test as logged in non-member
- ⚠️ **TODO:** Test as member of private problem
- ⚠️ **TODO:** Test as admin/owner

### Load Testing
- ⚠️ **TODO:** Homepage load test
- ⚠️ **TODO:** Browse problems page 1
- ⚠️ **TODO:** Problem detail
- ⚠️ **TODO:** All prompts page 1
- ⚠️ **TODO:** Profile page of heavy user

### Database Performance
- ✅ Indexes in place
- ✅ RLS optimized
- ⚠️ **TODO:** Monitor CPU during load test

---

## 🚨 CRITICAL GAPS FOUND

### Must Fix Before Launch

1. **XSS Protection** ❌ CRITICAL
   - Need to verify user content is sanitized
   - Check: system_prompt, user_prompt_template, notes, descriptions

2. **Deleted Author Behavior** ⚠️ DECISION NEEDED
   - Option A: Keep credit, show "Deleted user"
   - Option B: Fully anonymize

3. **Per-Endpoint Rate Limiting** ⚠️ HIGH PRIORITY
   - Votes: 100/hour per user
   - Reports: 10/hour per user
   - Forks: 50/hour per user
   - Prompt creation: 20/hour per user

4. **Verify is_deleted/is_hidden Filtering** ⚠️ HIGH PRIORITY
   - Check all query functions
   - Check all list pages
   - Check search (if exists)

### Should Fix Before Launch

5. **Moderator UI** ⚠️ MEDIUM PRIORITY
   - View reports
   - Change status
   - Hide/unhide content

6. **Stats Repair Function** ⚠️ MEDIUM PRIORITY
   - Admin-only function to rebuild stats
   - Useful for data integrity

7. **Bot Protection** ⚠️ MEDIUM PRIORITY
   - Add Turnstile/hCaptcha on signup
   - Add on report submission

### Can Launch Without

8. **Error Monitoring** ℹ️ POST-LAUNCH
   - Set up Sentry
   - Add structured logging

9. **Analytics Dashboards** ℹ️ POST-LAUNCH
   - Track key metrics
   - Monitor performance

10. **Load Testing** ℹ️ POST-LAUNCH
    - Can do after initial launch
    - Monitor real traffic first

---

## 📊 PRODUCTION READINESS SCORE

### By Category:
1. **Core Product Flows:** 85% ✅
2. **Profiles + Attribution:** 95% ✅
3. **Security / Abuse:** 60% ⚠️
4. **Database + RLS:** 95% ✅
5. **Next.js Production:** 90% ✅
6. **Observability:** 20% ⚠️
7. **Feature Polish:** 90% ✅
8. **Launch Checklist:** 40% ⚠️

### Overall: 72% - NEEDS WORK ⚠️

---

## 🎯 ACTION PLAN

### Phase 1: Critical Fixes (2-3 hours)
1. Add XSS protection/sanitization
2. Verify is_deleted/is_hidden filtering everywhere
3. Add per-endpoint rate limiting
4. Decide deleted author behavior

### Phase 2: High Priority (2-3 hours)
5. Build basic moderator UI
6. Add stats repair function
7. Test all user roles
8. Verify no N+1 queries

### Phase 3: Launch Prep (1 hour)
9. Enable leaked password protection
10. Test critical flows
11. Deploy to production

### Phase 4: Post-Launch (Week 1)
12. Add error monitoring
13. Set up analytics
14. Add bot protection
15. Load testing

---

## 🚀 RECOMMENDATION

**STATUS: NOT QUITE READY** ⚠️

You're close (72%), but need to address:
- XSS protection verification
- Per-endpoint rate limiting
- Deleted content filtering verification

**Timeline:** 4-6 hours of focused work to get to 85%+ and launch-safe.

