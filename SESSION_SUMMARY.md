# 🧠 Prompto - Core Project Architecture & AI Handoff Ledger

**Last Updated:** April 11, 2026
**Current Branch:** `main` (Fully Synchronized & Pushed)

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

## 🎯 Current Status & Next Steps

All code modifications are checked into `main` and Vercel has successfully compiled the cloud environment. 

**Next AI Model Operations**: The deployment footprint is highly stable. Before introducing deep logical shifts, parse any Vercel/Supabase environment variables locally. Ensure that you adhere strictly to App Router design paradigms. Proceed with the primary operator's next request.
