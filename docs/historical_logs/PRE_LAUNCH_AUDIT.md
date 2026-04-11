# 🚀 PRE-LAUNCH COMPREHENSIVE AUDIT

**Date:** January 28, 2026  
**Project:** Prompto  
**Database:** yknsbonffoaxxcwvxrls  
**Status:** IN PROGRESS

---

## 🔍 AUDIT SCOPE

Checking against the 7-point launch readiness checklist:
1. Identity & Trust Layer
2. Profile → Content Graph
3. Discoverability & SEO
4. Abuse & Moderation
5. UX Paper Cuts
6. Data Lifecycle & Scaling
7. Performance Sanity

---

## 1️⃣ IDENTITY & TRUST LAYER

### Username System ✅ MOSTLY COMPLETE

**Database Constraints:**
- ✅ `profiles_username_key` - UNIQUE constraint exists
- ✅ `profiles_username_format` - CHECK constraint: `^[a-z0-9_]{3,20}$`
- ✅ Format validation: lowercase, alphanumeric + underscore, 3-20 chars
- ✅ NULL allowed (optional usernames)

**Missing:**
- ⚠️ **Case-insensitive uniqueness** - Current UNIQUE constraint is case-sensitive
  - Need: `CREATE UNIQUE INDEX idx_profiles_username_lower ON profiles(LOWER(username));`
- ⚠️ **Reserved words blocking** - No check for admin, support, api, settings, etc.
- ⚠️ **Edit limitations** - No constraint preventing username changes after X days

**UI Implementation:**
- ✅ Username claiming in `/settings` page
- ✅ Availability checking with `is_username_available()` function
- ✅ Format validation in UI
- ✅ Profile URL: `/u/[username]`

### Profile Credibility Signals ✅ IMPLEMENTED

**Database Fields (profiles table):**
- ✅ `created_at` - Join date
- ✅ `reputation` - Total reputation score
- ✅ `upvotes_received` - Total upvotes
- ✅ `forks_received` - Total forks

**UI Display:**
- ✅ ProfilePageClient shows all stats
- ✅ Member since date formatted
- ✅ Stats displayed prominently

### Email Privacy ✅ SECURE
- ✅ `public_profiles` view excludes email
- ✅ No email displayed in UI components
- ⚠️ **SECURITY ISSUE:** `public_profiles` view has SECURITY DEFINER (linter warning)

---

## 2️⃣ PROFILE → CONTENT GRAPH

### On Problems Page ❌ MISSING
- ❌ Owner profile card not shown
- ❌ Collaborators (problem_members) not displayed
- ❌ No clickable avatars → profile

### On Profile Page ✅ IMPLEMENTED
**Tabs:**
- ✅ Prompts tab (UserPromptsList)
- ✅ Forks tab (UserForksList)
- ✅ Problems tab (UserProblemsList)

**Features:**
- ✅ RLS respects visibility
- ⚠️ **Pagination:** Uses offset-based (should be cursor-based for scale)
- ✅ ISR caching enabled (300s revalidation)

### On Prompt Cards ❌ MISSING
- ❌ Author attribution not shown on PromptCard
- ❌ No clickable profile links

---

## 3️⃣ DISCOVERABILITY & SEO

### Metadata ✅ PARTIALLY IMPLEMENTED

**Root Layout:**
- ✅ OpenGraph tags configured
- ✅ Twitter card configured
- ✅ Metadata base URL set
- ✅ Icons and manifest configured

**Dynamic Metadata:**
- ✅ Profile pages have `generateMetadata()`
- ⚠️ Problem pages - need to check
- ⚠️ Prompt pages - need to check

### Missing SEO Essentials:
- ❌ **Sitemap generation** - No sitemap.xml for public content
- ❌ **Robots.txt** - Exists in public/ but may need updating
- ❌ **Canonical URLs** - Not verified on all pages
- ❌ **Noindex for private content** - Not implemented
- ❌ **JSON-LD structured data** - Not implemented

---

## 4️⃣ ABUSE & MODERATION

### Reports System ⚠️ INCOMPLETE

**Database:**
- ✅ Reports table exists
- ✅ Report status tracking (pending, reviewed, dismissed, actioned)
- ❌ **CRITICAL:** No unique constraint on (content_type, content_id, reporter_id)
  - Users can spam multiple reports for same content
- ✅ Soft-hide fields exist (is_hidden on prompts/problems)

**UI:**
- ✅ ReportModal component exists
- ❌ Rate limiting on report submissions - not verified
- ❌ "Content under review" banner - not implemented
- ❌ Moderator tools - not implemented

### Moderator Tools ❌ NOT IMPLEMENTED
- ❌ View reports interface
- ❌ Change status functionality
- ❌ Hide/unhide content controls
- ❌ Admin dashboard for moderation

---

## 5️⃣ UX PAPER CUTS

### Auth & Onboarding ⚠️ NEEDS IMPROVEMENT
- ✅ Username onboarding in settings
- ❌ No clear explanation of public vs private visibility
- ❌ No preview before publishing
- ❌ No "Who can see this?" helper text

### Editing Flows ❌ MISSING
- ❌ No autosave
- ❌ No warning on unsaved changes
- ❌ No confirm on destructive actions
- ❌ Fork UX attribution explanation missing

---

## 6️⃣ DATA LIFECYCLE & SCALING

### Event & Stats Tables ⚠️ PARTIAL

**Retention Policy:**
- ❌ No retention policy for prompt_events
- ❌ No periodic rollups configured
- ❌ No cron job for old event pruning

**Soft Deletes:**
- ✅ `is_deleted` field exists on problems and prompts
- ⚠️ UI respect for is_deleted - needs verification
- ⚠️ Search/feeds filtering - needs verification

---

## 7️⃣ PERFORMANCE SANITY

### Query Performance ✅ MOSTLY OPTIMIZED
- ✅ ISR caching on all public pages
- ✅ Performance indexes applied
- ✅ Rate limiting implemented (200 req/min per IP)

### Issues Found:
- ⚠️ **Auth RLS InitPlan** - 10 policies re-evaluate auth.uid() for each row
  - Tables affected: profiles, workspaces, workspace_members, prompts
- ⚠️ **Multiple Permissive Policies** - Performance degradation
  - problems, profiles, prompts, workspace_members, workspaces
- ⚠️ **Duplicate Indexes** - Wasting storage and write performance
  - problem_members, prompt_reviews, prompts (2 sets)
- ℹ️ **Unused Indexes** - 40+ indexes never used (expected for new project)

### N+1 Queries ⚠️ NOT VERIFIED
- ❌ Profile pages not tested for N+1
- ❌ Problem detail pages not tested
- ❌ Prompt lists not tested

### Error Handling ⚠️ NOT VERIFIED
- ❌ Empty states not verified
- ❌ Skeleton loading not verified
- ❌ Graceful failures not tested

---

## 🚨 CRITICAL ISSUES (MUST FIX BEFORE LAUNCH)

### 1. Security Definer View ⚠️ ERROR
**Issue:** `public_profiles` view has SECURITY DEFINER property  
**Risk:** Bypasses RLS, potential security vulnerability  
**Fix:** Remove SECURITY DEFINER or add proper RLS

### 2. Report Spam Prevention ❌ CRITICAL
**Issue:** No unique constraint on reports table  
**Risk:** Users can spam unlimited reports for same content  
**Fix:**
```sql
ALTER TABLE reports 
ADD CONSTRAINT reports_unique_per_user 
UNIQUE (content_type, content_id, reporter_id);
```

### 3. Leaked Password Protection ⚠️ WARN
**Issue:** HaveIBeenPwned password checking disabled  
**Risk:** Users can use compromised passwords  
**Fix:** Enable in Supabase Dashboard → Auth → Password Settings

### 4. Case-Insensitive Username Uniqueness ⚠️ IMPORTANT
**Issue:** Current UNIQUE constraint is case-sensitive  
**Risk:** "john" and "John" can both be claimed  
**Fix:**
```sql
DROP INDEX IF EXISTS profiles_username_key;
CREATE UNIQUE INDEX idx_profiles_username_lower 
ON profiles(LOWER(username)) 
WHERE username IS NOT NULL;
```

---

## ⚠️ HIGH PRIORITY (FIX WEEK 1)

### 5. Reserved Username Blocking
**Missing:** No check for reserved words (admin, api, support, settings, etc.)  
**Fix:** Add CHECK constraint or validation function

### 6. Author Attribution UI
**Missing:** No author chips on problem/prompt cards  
**Impact:** Users can't discover content creators  
**Fix:** Add AuthorChip component to all cards

### 7. Moderator Tools
**Missing:** No UI for viewing/managing reports  
**Impact:** Can't moderate reported content  
**Fix:** Build admin dashboard for reports

### 8. SEO Basics
**Missing:** Sitemap, proper noindex, canonical URLs  
**Impact:** Poor search engine discoverability  
**Fix:** Generate sitemap, add noindex to private pages

---

## 🟡 MEDIUM PRIORITY (FIX WEEK 2-3)

### 9. RLS Performance Optimization
**Issue:** 10+ policies re-evaluate auth.uid() per row  
**Impact:** Slower queries at scale  
**Fix:** Replace `auth.uid()` with `(select auth.uid())`

### 10. Duplicate Index Cleanup
**Issue:** 4 sets of duplicate indexes  
**Impact:** Wasted storage, slower writes  
**Fix:** Drop duplicate indexes

### 11. UX Improvements
**Missing:** Autosave, unsaved warnings, visibility helpers  
**Impact:** User frustration, data loss  
**Fix:** Add progressive enhancements

### 12. Event Retention Policy
**Missing:** No cleanup for old prompt_events  
**Impact:** Database bloat over time  
**Fix:** Add cron job or edge function for cleanup

---

## ℹ️ LOW PRIORITY (POST-LAUNCH)

### 13. Unused Index Cleanup
**Issue:** 40+ indexes never used  
**Note:** Expected for new project  
**Action:** Monitor for 30 days, then drop unused

### 14. Cursor-Based Pagination
**Current:** Offset-based pagination  
**Better:** Cursor-based for large datasets  
**Action:** Refactor when scaling issues appear

### 15. JSON-LD Structured Data
**Missing:** Rich snippets for search engines  
**Impact:** Less attractive search results  
**Action:** Add when SEO becomes priority

---

## 📊 LAUNCH READINESS SCORE

### By Category:
1. **Identity & Trust:** 70% ✅ (username system good, needs case-insensitive + reserved words)
2. **Profile → Content Graph:** 50% ⚠️ (profiles done, attribution missing)
3. **Discoverability & SEO:** 40% ⚠️ (basics done, missing sitemap/noindex)
4. **Abuse & Moderation:** 30% ❌ (schema done, UI/dedup missing)
5. **UX Paper Cuts:** 40% ⚠️ (basic flows work, polish missing)
6. **Data Lifecycle:** 50% ⚠️ (soft deletes done, retention missing)
7. **Performance:** 80% ✅ (caching/indexes done, RLS optimization needed)

### Overall: 51% - NOT LAUNCH READY ⚠️

---

## 🎯 MINIMUM VIABLE LAUNCH REQUIREMENTS

To launch safely, you MUST fix:

### Critical (Do Now):
1. ✅ Fix security definer view
2. ✅ Add report deduplication constraint
3. ✅ Enable leaked password protection
4. ✅ Add case-insensitive username uniqueness

### High Priority (Before Public Launch):
5. Add author attribution to all cards
6. Add reserved username blocking
7. Build basic moderator tools
8. Add sitemap generation
9. Add noindex to private pages

### Can Launch Without (But Fix Week 1):
- RLS performance optimization
- Duplicate index cleanup
- UX polish (autosave, warnings)
- Event retention policy

---

## 📋 NEXT STEPS

1. **Immediate:** Fix 4 critical database issues
2. **This Week:** Implement author attribution UI
3. **Before Launch:** Add moderator tools + SEO basics
4. **Week 1:** Performance optimization + cleanup
5. **Ongoing:** Monitor and iterate

---

**Recommendation:** DO NOT LAUNCH until critical issues are fixed. Current state has security vulnerabilities and spam prevention gaps that could be exploited immediately.

**Timeline to Launch Ready:** 2-3 days of focused work on critical + high priority items.

