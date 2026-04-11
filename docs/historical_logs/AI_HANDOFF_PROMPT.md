# AI Handoff Prompt — PromptVexity V2 Theme Refactoring

> **Date**: March 21, 2026  
> **Status**: IN PROGRESS — approximately 60% complete  
> **Previous AI stopped mid-file** on `app/(public)/prompts/[slug]/page.tsx`

---

## 1. PROJECT OVERVIEW

**PromptVexity** (codename "Prompto") is a Next.js 14+ prompt engineering platform where users:
- Browse and solve coding problems
- Submit prompt solutions graded by AI + community votes
- Fork, compare, and iterate on prompts
- Climb a tier-based leaderboard (Beginner → Grandmaster)

**Tech Stack**:
- **Framework**: Next.js 14 (App Router, `use client` + server components)
- **Styling**: Tailwind CSS with semantic CSS custom properties (HSL-based)
- **DB**: Supabase (Postgres + RLS + real-time)
- **Auth**: Supabase Auth
- **Deploy**: Vercel
- **Root dir**: `c:\Users\gibbi\Downloads\Github Repos\PromptVexity Fix attempt\prompto`

---

## 2. THE TASK: SEMANTIC CSS VARIABLE REFACTORING

### What We're Doing
Systematically replacing **hardcoded Tailwind color classes** (e.g., `bg-slate-50`, `text-blue-600`, `border-slate-200`) with **semantic CSS variable classes** (e.g., `bg-background`, `text-primary`, `border-border`) so the app supports **consistent light/dark mode theming**.

### The Design System (defined in `app/globals.css`)
Read this file first — it defines the CSS custom properties in `:root` (light) and `.dark` (dark):

| Semantic Class | Light Mode | Use For |
|---|---|---|
| `bg-background` | white | Page backgrounds |
| `bg-card` | white | Card/panel backgrounds |
| `bg-muted` | light gray | Subtle backgrounds, table headers |
| `text-foreground` | near-black | Primary text |
| `text-muted-foreground` | medium gray | Secondary/helper text |
| `text-primary` | blue | Links, accents, active states |
| `text-primary-foreground` | near-white | Text on primary buttons |
| `border-border` | light gray | All structural borders |
| `bg-primary` | blue | Primary buttons, active pills |
| `bg-primary/90` | blue (90% opacity) | Primary button hover state |
| `bg-primary/10` | blue (10% opacity) | Subtle primary tint background |
| `bg-destructive` | red | Destructive actions |

### Mapping Rules (CRITICAL — follow these exactly):
1. **`bg-white` / `bg-slate-50`** → `bg-background` (page) or `bg-card` (panels) or `bg-muted` (subtle areas like table headers)
2. **`text-slate-900`** → `text-foreground`
3. **`text-slate-500` / `text-slate-400` / `text-slate-600`** → `text-muted-foreground`
4. **`text-slate-700`** → `text-foreground` (if primary text) or `text-muted-foreground` (if secondary)
5. **`text-blue-600` / `text-blue-700`** → `text-primary`
6. **`bg-blue-600`** → `bg-primary`; hover `bg-blue-700` → `hover:bg-primary/90`
7. **`text-white` on blue buttons** → `text-primary-foreground`
8. **`border-slate-200` / `border-slate-100`** → `border-border`
9. **`divide-slate-200` / `divide-slate-100`** → `divide-border`
10. **`bg-slate-100` / `bg-slate-200`** → `bg-muted` (or `bg-muted/80` for hover)
11. **`hover:bg-slate-50`** → `hover:bg-muted`
12. **`focus:ring-blue-600`** → `focus:ring-primary`
13. **`bg-blue-100 text-blue-700`** (avatar initials) → `bg-primary/10 text-primary`
14. **`bg-blue-50 text-blue-700`** (badges) → `bg-primary/10 text-primary`

### What to PRESERVE (do NOT replace):
- **Decorative/semantic status colors**: green for success, red for failure, yellow for warnings, amber for draft
- **Difficulty tier colors**: green (beginner), yellow (intermediate), orange (advanced), red (expert)
- **Rank medal colors**: gold (#1), silver (#2), bronze (#3)
- **Quality score bar colors**: green ≥80, yellow ≥60, red <60
- **Industry tag accent**: `bg-blue-100 text-blue-800 border-blue-200` (intentional branding)
- **Tooltip dark backgrounds**: `bg-slate-900`, `text-slate-300` inside dark tooltips (these are always dark)
- **Usage context/tradeoff boxes**: `bg-blue-50`, `bg-purple-50`, `bg-amber-50`, `bg-orange-50` — these are intentional decorative callouts
- **Review status badges**: worked (green), failed (red), note (slate) — keep as-is

---

## 3. MASTER CHECKLIST — READ THIS FILE

**File**: `c:\Users\gibbi\.gemini\antigravity\brain\71566520-f234-4e1e-bbab-98ef6d7b3d1d\task.md`

This file has the full checklist with `[x]` for completed items and `[ ]` for remaining items. Here's the current summary:

### ✅ COMPLETED (do not touch these again):
- All Systems & Globals
- All 5 Application Layout Wrappers
- All 42 Global UI Components (Header, Footer, Auth, Prompts, Problems, Compare, Profile, Dashboard, Workspace, Misc)
- All 7 Public Route pages:
  - `app/(marketing)/page.tsx`
  - `app/(public)/guide/page.tsx`
  - `app/(public)/leaderboard/page.tsx` + `LeaderboardClient.tsx`
  - `app/(public)/problems/page.tsx`
  - `app/(public)/prompts/page.tsx` (redirect only, no colors)
  - `app/(public)/u/[username]/page.tsx`
  - `app/(public)/compare/page.tsx`

### ⚠️ PARTIALLY DONE:
- **`app/(public)/problems/[slug]/page.tsx`** — COMPLETED (refactored in last session but not yet marked in checklist)

### 🔴 NOT STARTED — YOUR WORK STARTS HERE:

#### Content Detail Views:
- `app/(public)/problems/[slug]/compare/page.tsx`
- **`app/(public)/prompts/[slug]/page.tsx`** ← **START HERE — 594 lines, heavy slate/blue usage, was actively being worked on when handoff happened**

#### Auth Flow (4 files):
- `app/(auth)/signup/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/confirm/page.tsx`
- `app/(auth)/auth-code-error/page.tsx`

#### Creator Workspace & Management (4 files):
- `app/(app)/dashboard/page.tsx`
- `app/(app)/workspace/page.tsx`
- `app/(app)/settings/page.tsx`
- `app/(app)/profile/[id]/page.tsx`

#### Creator Wizards & Editor (5 files):
- `app/(app)/create/problem/page.tsx`
- `app/(app)/problems/new/page.tsx`
- `app/(app)/create/prompt/page.tsx`
- `app/(app)/prompts/new/page.tsx`
- `app/(app)/prompts/[slug]/edit/page.tsx`

#### Admin Panel (2 files):
- `app/(app)/admin/login/page.tsx`
- `app/(app)/admin/reports/page.tsx`

---

## 4. HOW TO DO THE WORK

For each file:

1. **Read the full file** to understand its structure
2. **Identify all hardcoded `slate-*`, `gray-*`, and structural `blue-*` classes**
3. **Apply the mapping rules** from Section 2 above
4. **Preserve decorative colors** per the "What to PRESERVE" list
5. **Make the edits** using multi-replace for non-contiguous changes
6. **Mark the item `[x]` in the task.md checklist** after completing each file

### Tips:
- Use `grep_search` with query `slate-` or `blue-` on each file to find hardcoded colors quickly
- Don't change colors inside deliberately dark-themed sections (tooltips, dark cards)
- `bg-white` in code blocks/pre tags should become `bg-card` or `bg-muted`
- For focus states, `focus:ring-blue-*` → `focus:ring-primary`

---

## 5. VERIFICATION

After completing all files, run:
```
npm run dev
```
The dev server should already be running at `localhost:3000`. Check:
- Problems browse page (`/problems`)
- A problem detail page
- A prompt detail page
- Leaderboard (`/leaderboard`)
- Login/signup pages
- Dashboard (if authenticated)

All pages should look correct in light mode and have no broken styling.

---

## 6. KEY FILES TO READ FIRST

1. **Globals CSS** (design system definitions): `app/globals.css`
2. **Tailwind config**: `tailwind.config.js`
3. **Task checklist**: The task.md path listed in Section 3
4. **The file you need to start with**: `app/(public)/prompts/[slug]/page.tsx` — 594 lines, completely untouched

---

## 7. IMPORTANT CONTEXT

- The project is a **Next.js App Router** project with both server and client components
- Files with `'use client'` at the top are client components
- The dev server (`npm run dev`) is already running
- Don't touch any Supabase configs, API routes, or server actions — this is purely a **styling/class refactoring task**
- When you see `bg-slate-50 border border-slate-200` patterns, that's the most common pattern to replace → `bg-card border border-border` (for panels) or `bg-muted border border-border` (for subtle sections)

---

**Please confirm once you've read this document and the key files listed in Section 6. Then begin with `app/(public)/prompts/[slug]/page.tsx` and work through the remaining checklist items.**
