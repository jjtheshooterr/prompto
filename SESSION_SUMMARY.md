# 🧠 Prompto - Core Project Architecture & AI Handoff Ledger

**Last Updated:** April 17, 2026 (Session 2)
**Current Branch:** `main` (pushed — fully up to date)

---

## 🚀 Project Overview

**Prompto** is a high-performance crowdsourced marketplace and evaluation platform for AI Prompts. Users organically discover "Problems," submit "Prompts" as solutions, and the community ranks them through Upvotes, Downvotes, and Forcing evaluations.

The core hook of Prompto is its **Creator Studio & Analytics Dashboard**, alongside complex automated **AI Quality Scoring** integrations where user-submitted prompts are evaluated against underlying LLM architectures (like DeepSeek or Gemini) for algorithmic effectiveness. 

### 🧰 Tech Stack
* **Framework**: Next.js (App Router, Turbopack, React Server Components)
* **Language**: TypeScript throughout
* **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth Triggers)
* **Edge Routing & Abuse Protection**: Upstash (Redis Rate Limiting) + Cloudflare (Turnstile)
* **Styling**: Tailwind CSS
* **Hosting**: Vercel `production` + `preview`

---

## 🛡️ Recent Systems Upgrades (March - April 2026)

This application has recently undergone a deep refactoring phase targeting **Enterprise Hardening, Blackhat Vulnerabilities, and Bot Protection**.

### 1. The Cloudflare + Upstash Defense Grid (April 11)
To protect Prompto from credential stuffing and scraping, we integrated edge and application-level shields:
* **Turnstile Integration**: Implemented `@marsidev/react-turnstile` across `SignInForm.tsx`, `SignUpForm.tsx`, and `SimpleLoginForm.tsx`.
* **Server-Side Token Validation**: Established a strict Turnstile verification server action (`lib/actions/turnstile.actions.ts`). 
* **Edge Rate Limiting**: Shifted rate-limiting logic directly into `middleware.ts` via `@upstash/ratelimit`. Global traffic gets 100 req/10s, while Authentication endpoints are strictly limited to 5 req/60s. The middleware gracefully "fails open" if the Upstash variables are absent.
* **Vercel CSP**: Adjusted `next.config.js` to whitelist `https://challenges.cloudflare.com`, fixing blocking issues inside Vercel's strict `Content-Security-Policy`. All production keys have been injected directly into the Vercel REST API natively.

### 2. Enterprise Moderation & Shadowban (April 2)
Shadowbanned users were leaking to the public view; we aggressively sealed these routes.
* Actively patched `search_prompts_v1` SQL materialised views, perfectly scrubbing Cmd+K global search queries.
* Built exclusionary parameters into `listPromptsByProblem` preventing URL-direct index leaking.

### 3. Creator Analytics & Scoring Vulns (March 21)
The Creator Studio was drastically overhauled and secured.
* **Financial Modeling**: Baked in token conversion pricing grids for 13 distinct models (GPT-4, Opus, Gemini 2.5) to translate raw Prompt token usage into real-world monetary savings arrays (`getCreatorStats` / `getCreatorTrends`).
* **AI Quality Scoring Hardening**: Blocked a lethal Race Condition bypassing the 30-minute scoring cooldown by dropping standard SELECTs for monolithic, optimistic-locking SQL updates. 
* **IDOR Protection**: Secured Deepseek job triggers specifically checking `created_by === user.id`.
* **Database Definer Neutralization**: Ran migration `20260321150000_fix_analytics_vulnerabilities` forcing `SET search_path = public, pg_temp` over internal RPC analytics to prevent PostgreSQL privilege escalation.

---

## 📂 Project Organization & Cleanup Note

**Important Note for the Next Model**: Over the past year, nearly 100 orphaned markdown logs, checklists, execution guides, and "Job Complete" reports have bloated the root directory.

As of April 11, **all 94 obsolete historical `.md` files have been vacuumed and archived inside the `/docs/historical_logs/` folder**. 

When looking for operational flow and logic, rely exclusively on:
1. `README.md`
2. `EXECUTIVE_SUMMARY.md` 
3. This exact `SESSION_SUMMARY.md` tracking file.

---

---

## 🎯 Current Status & Production Readiness

**Current State**: 🚀 **Production-Ready & Enterprise-Hardened**

The platform has successfully cleared all security and compliance milestones. The defense-in-depth grid is active, and administrative operational workflows are now secure and audited. 

**Operations Checklist for Next Handover**:
1. **Routing Integrity**: Reserved word guards are active at both the UI (real-time preview) and API levels.
2. **GDPR Integrity**: Export and deletion flows are verified; file download issues are resolved with late-cleanup logic.
3. **Audit Trail**: Every admin role shift is permanently logged.
4. **Automation**: Permanent and temporary bans are handled autonomously via `pg_cron`.

#### 5. Latest Updates & Troubleshooting
*   **Root Admin Login Fix (daniel@orygn.tech):**
    *   **Issue:** Encountered `500 Internal Server Error` during login due to `NULL` values in internal Auth fields (`confirmation_token`, etc.).
    *   **Resolution:** Manually updated the `auth.users` record to replace `NULL` token fields with empty strings (`''`). This aligns the record with the Supabase Auth server's expected schema for manual SQL-provisioned accounts.
    *   **Status:** Account is now fully functional and verified as an `admin` in the `profiles` table.
*   **Audit Log Investigation (March 29 Activity):**
    *   **Query:** Investigated abnormal shadowban/ban activity by `testuser1`.
    *   **Findings:** Confirmed all actions were part of an automated E2E test suite. 
    *   **Evidence:** High-speed execution (20+ actions in 15s), use of known test accounts (`e2e_tester_123`, `uitester2`), and explicit "Testing Ban" reasons in the details. 
    *   **Cleanup:** All test states were reverted immediately after each test passed.

---

**Developer Note:** The platform is stable, secure, and ready for deployment. The admin provisioning workflow is now fully understood and hardened.
Before introducing deep logical shifts, ensure compliance with the `sanitizeSlug` utility to maintain URL-space integrity. Proceed with product expansion or UI polish as needed.

---

## 🔐 Security & Compliance Hardening (April 12, 2026)

### Feature 1 — Ban Expiry Auto-Lift ✅ (Hardened & Verified)
- Daily `pg_cron` job `lift-expired-bans` deletes rows from `user_bans` where `expires_at < NOW()` and is NOT NULL.
- **Verified (Stress Test)**: Manually ran logic with concurrent expired/permanent bans. Verified that permanent bans remain while expired bans are purged and profile states are restored.

### Feature 2 — Slug Reserved Word Blacklist ✅ (Hardened)
- Shared utility: `lib/utils/slug.ts` — `sanitizeSlug(title, options)`.
- Blacklist of 40+ reserved words (admin, api, dashboard, signin, etc.).
- **Live Preview UI**: Real-time "URL Preview" added to creation forms (`CreateProblemClient.tsx`) and fork modals (`ForkModal.tsx`).
- **Suffix Guard**: If a reserved word is detected, a unique suffix is auto-generated and shown in the preview. 
- **Forking Logic**: Updated to use `forceRandom: true`, ensuring forked solutions always have unique, safe URLs regardless of title collisions.
- Applied to all 4 generation sites: `problems.actions.ts`, `CreateProblemClient.tsx`, `prompts.actions.ts`, `ForkModal.tsx`.

### Feature 3 — Admin Promotion UI ✅
- New server actions in `lib/actions/admin.actions.ts`: `promoteToAdmin()` and `revokeAdmin()`.
- Both gated behind `verifyAdmin()` — only existing admins can call them.
- Self-modification explicitly blocked (acting admin's own row is locked).
- Every promotion/revocation writes an immutable audit log entry to `admin_audit_logs`.
- UI: `components/admin/UsersTable.tsx` — new "Admin Role" column with **Make Admin** / **Revoke Admin** buttons. Calling admin's own row shows "You" (inert).

### Feature 4 — GDPR Data Export & Account Deletion ✅
- New file: `lib/actions/gdpr.actions.ts`
  - `exportUserData()` — exports profile, prompts, problems, prompt_reviews, votes, prompt_comparisons, reports, workspaces as a JSON file download.
  - `deleteAccount(confirmationEmail)` — requires server-side email match. Disassociates prompts/problems (keeps content, nulls FK), deletes activity rows, anonymises profile, then deletes the Supabase Auth user (revokes all sessions).
- UI: `app/(app)/settings/page.tsx` — new "Data & Privacy" section:
  - **Export Data** button (triggers JSON download).
  - **Fixed Download Bug**: Implemented 3-second cleanup delay to ensure browser captures `prompto-data-export-YYYY-MM-DD.json` filename before blob revocation.
  - **Delete Account** — secure two-step flow with server-side email matching. Non-reversible.

### Feature 5 — Root Admin Provisioning ✅
- Provisioned `daniel@orygn.tech` as a root admin.
- **Security Check**: Verified passwords are hashed using **Bcrypt (10 rounds)** within high-security `auth.users` schema.
- Role elevation: Manually forced `role = 'admin'` in `public.profiles` for this account.
- Status: **Active & Verified**.

### Feature 6 — Owner Role Hierarchy ✅
- Added `owner` as a role above `admin`. Only owners can promote/demote admins; admins can no longer self-escalate.
- RLS + server actions (`lib/actions/admin.actions.ts`) updated: `promoteToAdmin()` and `revokeAdmin()` gated behind `verifyOwner()` check.
- `isAdminOrOwner` helper used throughout — owners receive all admin capabilities.
- `daniel@orygn.tech` is the root owner account.

---

## 🎨 UI / Dark Mode Overhaul (April 14-17, 2026)

### Header Redesign ✅ (`components/layout/Header.tsx` — full rewrite)
- Replaced overcrowded 12-item nav with clean 7-item layout: Logo | Search | Browse | Leaderboard | Compare | Guide | ThemeToggle | Avatar.
- **Avatar dropdown** (logged-in): Dashboard, Workspace, Create Problem, Admin Panel (conditional), Sign Out — all with Lucide icons.
- Click-outside close via `useRef<HTMLDivElement>` + `mousedown` listener.
- Profile query extended: `select('role, username, display_name, avatar_url')`.
- Mobile menu has user info strip (avatar + name + email) with same nav items.
- All CSS variables — zero hardcoded colors.

### Marketing Page Dark Mode Fix ✅ (`app/(marketing)/page.tsx`)
- Architecture section: `bg-slate-900` → two-column layout with CSS vars + visual hierarchy diagram (Problem → prompt cards with scores → Fork).
- CTA section: `bg-slate-900 text-white text-slate-400/500` → `bg-card text-foreground text-muted-foreground border-border`.
- Philosophy icons: standardized — Problem=`bg-muted`, Prompt=`bg-primary`, Score=`bg-emerald-500`, Improve=`bg-amber-500`.

### PromptDetailClient Dark Mode Fix ✅ (`app/(public)/prompts/[slug]/PromptDetailClient.tsx`)
- Usage Context: `bg-blue-50 border-blue-100 text-blue-900` → `bg-primary/5 border-primary/20 text-foreground`
- Tradeoffs / Notes / Output / Fork Summary: all `bg-*-50 border-*-100/200 text-*-900` → `bg-muted border-border text-foreground`
- Score tooltip: `bg-slate-900 text-white` → `bg-popover border-border text-popover-foreground`

### Leaderboard Improvements ✅ (`app/(public)/leaderboard/LeaderboardClient.tsx`)
- Top 3 rows get medal emoji (🥇🥈🥉) + subtle tinted row backgrounds.
- Rank #1 gets 👑 Leader badge inline.
- Tighter column padding, truncate on long text cells.
- Page container widened: `max-w-5xl` → `max-w-6xl`.

---

## 🐛 Bug Fixes (April 14-17, 2026)

### Compare Feature (`app/(public)/compare/`)
- **Root cause**: API filtered `.eq('status', 'published')` — 288 of 341 prompts were drafts, nothing returned.
- **Fix**: Removed status filter; added auth check; JS-side draft allowance only if `created_by === auth.uid()`.
- **Added**: Visible error state on the compare page so API failures are no longer silent.

### Workspace Link Parameter Bug (Fix #6 Regression)
- Antigravity changed `?problemId=` to `?problem=` and passed `problem.slug` as value — but `CreatePromptClient` uses the value as a UUID FK (`problem_id`). Slug failed FK constraint.
- **Fix**: Keep param name `?problem=` but restore value to `problem.id` (UUID).

### Git Merge Conflict — `app/(public)/problems/[slug]/page.tsx`
- Conflict between our duplicate-`<h1>` removal and Jaxon's `toDisplayString()` wrapping of the same element.
- **Resolution**: Kept the deletion (h1 was already rendered at line 184 above).

---

## 🎓 Onboarding Tour (April 17, 2026) — In Progress

### Design
- **Visual style**: Dim overlay (`bg-black/50 z-[100]`) + glowing ring around target element (`z-[101]`) + tooltip card (`z-[102]`).
- **Trigger**: Logged-in user on `/problems` page with `onboarding_completed === false` in `profiles`.
- **Completion**: `supabase.from('profiles').update({ onboarding_completed: true })` on Next or Skip.
- `onboarding_completed BOOLEAN DEFAULT FALSE` already exists on `profiles` table (migration `20260107173640`).

### 4-Step Flow
1. **Welcome** (centered modal, no target) — intro copy
2. **Filters sidebar** (target: `[data-tour="filters"]`, placement: right) — explain search/filter
3. **Problem card** (target: `[data-tour="problem-card"]`, placement: bottom) — explain card actions
4. **Finish** (centered modal, no target) — call to action

### Files Created / Modified
- `components/tour/TourTooltip.tsx` — presentational card with rotated-square arrow, progress dots, Skip/Next buttons
- `components/tour/TourProvider.tsx` — context, Supabase check, step state, DOM position calculation, overlay + highlight rendering
- `app/providers.tsx` — `<TourProvider>` wraps children inside `AuthContext.Provider`
- `app/(public)/problems/page.tsx` — `data-tour="filters"` on `<aside>`, `data-tour="problem-card"` on first problem card `<Link>`

---

## 🔍 Live Search — `/api/search` (April 17, 2026)

### Architecture
- New API route `app/api/search/route.ts` — replaces direct Supabase RPC calls from the browser client
- Works for **anonymous users** (server-side Supabase client with anon key + cookie session)
- Dedicated Upstash rate limiter: **30 req/60s per IP**, prefix `rl:search`, separate from global middleware limiter
- Two modes: **trending** (`q` empty/< 2 chars) and **live search** (`q` ≥ 2 chars)
- Trending response cached at CDN: `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- Returns `{ results, isTrending, isAnon }` — max 5 results, problems before prompts

### GlobalSearch.tsx (rewritten)
- Zero direct Supabase calls from client
- **Trending on focus**: clicking the bar with empty query shows 5 most recently updated published problems; result cached in a ref (no re-fetch on repeat focuses)
- **Live search**: 350ms debounce, min 2 chars
- **Anon CTA row**: pinned at the bottom of every dropdown for non-logged-in users — "Create a free account / Submit prompts & track your ranking"
- Clean icon-based result rows (chat bubble = problem, code brackets = prompt)

---

## 🔢 Pagination Jump (April 17, 2026)

- `components/ui/Pagination.tsx` updated: "Page X of Y" label is now a **clickable button**
- Clicking it toggles an inline number input; Enter or blur navigates; Escape cancels
- Validates range (1–totalPages), ignores invalid/out-of-range input silently
- Spinner arrows hidden via Tailwind appearance-none; preserves all existing query params

---

## 🐛 Additional Bug Fixes (April 17, 2026)

### Sort pills on problem detail page
- **Bug**: Sort links (`Best / Top Rated / Most Improved / Newest`) used `/problems/${problem.slug}?sort=...` — missing the `short_id` suffix, causing a canonical redirect that stripped the `?sort` param
- **Fix**: Changed to `href={/problems/${slugParam}?sort=${value}}` — `slugParam` is already the validated `slug-shortid` string

### Compare page empty state
- **Bug**: Stale IDs in localStorage caused an API error, showing a red error card instead of the friendly empty state
- **Fix**: Any non-200 API response now clears localStorage and falls through to the "No Prompts Selected" state. Error card UI kept as dead code (never rendered)

---

---

## 🐛 Bug Fixes — Admin Reports (April 17, 2026, Session 2)

### Root Cause
The admin reports page was silently returning no data due to **two compounding issues**:

1. **RLS Policy gap**: `is_moderator()` SQL function only checked for `role IN ('admin', 'moderator')` — it never included `'owner'`. Since `daniel@orygn.tech` is `role = 'owner'`, the `reports_select_mod` policy denied all SELECT queries.
2. **Supabase join syntax**: The query used `reporter:profiles!reporter_id(username)` — a double join to the same table via different FKs — which can silently fail when FK constraint names don't match exactly.

### Fixes Applied
- **`lib/supabase/admin.ts`** (new): Service-role Supabase client using `SUPABASE_SERVICE_ROLE_KEY`. Bypasses RLS entirely. Safe because it's only instantiated after verifying `admin` or `owner` role in the authenticated session.
- **`app/(app)/admin/reports/page.tsx`** (rewritten):
  - Uses `createAdminClient()` for all data queries (reports, counts, profiles, slugs) — no more RLS blocking
  - Removed the fragile double-join; instead does 3 clean batch lookups: reports → profile usernames → content slugs
  - Fixed **tab counts**: was computing from the filtered dataset (when on Pending tab, Reviewed count was always 0). Now a separate `select('id, status')` query fetches all statuses for accurate counts on all tabs.
  - Fixed **View Content links**: `content_slug` doesn't exist as a DB column (never stored). Now does a batch lookup of actual slugs from `prompts` and `problems` tables.
  - Added error banner (shows query error message if something goes wrong — aids debugging).
  - Badge colors converted from hardcoded `bg-yellow-100 text-yellow-800` to opacity variants (`bg-yellow-500/15 text-yellow-700 dark:text-yellow-400`) for proper dark mode.
- **`supabase/migrations/20260417000000_fix_owner_moderator_rls.sql`** (new): Updates `is_moderator()` to include `'owner'` — belt-and-suspenders fix for any other RLS policies using this function. Run manually in Supabase SQL editor.

---

## 📋 Pending / Deferred Work

- **Apply migration manually**: Run `supabase/migrations/20260417000000_fix_owner_moderator_rls.sql` in the Supabase SQL editor to update `is_moderator()` to include `'owner'`.
- **Create Problem page**: Add contextual tooltips + visual redesign with smart placement.
- **Cookie Consent UI**: Waiting on Jaxon for GA/Tag Manager setup. Will need region-based display + banner component.
- **Header hover tooltips** (separate from onboarding tour): Score badge breakdown, tier badge, fork count — deferred.
- **`scratch/` dir + `scripts/create-daniel-admin.ts`**: Test artifacts from Antigravity — not committed.
