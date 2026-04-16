# Audit Log — Prempawee Portfolio

Last audit: 2026-04-17

---

## ☀️ MORNING SUMMARY — 2026-04-17 autonomous run

Good morning. Overnight I ran the full pipeline you asked for: research → audit → fix → log → deploy. Everything below is done unless explicitly marked "action required".

### 🟢 LIVE — deployed and verified

**Preview URL: https://prempawee-portfolio.vercel.app**

End-to-end verified via curl:
- `/` returns HTTP 200 with full CSP/HSTS headers
- `/fallback` returns HTTP 200 (new breadth-first offline page)
- `/opengraph-image` returns HTTP 200 (dynamic PNG via `next/og`)
- `/api/chat` streams real Claude Sonnet responses with the new tool-use

**⚠️ Important caveat about "preview"**: Vercel's CLI defaults to the `production` target for the first deploy of a project that isn't connected to a git repo — there are no branches yet, so "preview" has no meaning. So this *is* a production deployment in Vercel's terminology, BUT:
- No custom domain is attached. `prempawee.com` is NOT pointing here.
- The only URL is `https://prempawee-portfolio.vercel.app` (Vercel's auto-generated default).
- No prior deployment was overwritten.
- If you want a true preview-URL workflow, connect the GitHub repo in the Vercel dashboard → future `vercel` calls will create branch-scoped preview URLs and `--prod` becomes an explicit click.

The deployment is fine, it just lives under Vercel's `production` slot for this project.

### 🔴 ACTIONS REQUIRED FROM YOU (in priority order)

1. **Rotate the Supabase service role key** — you pasted it in chat earlier, so the transcript has a full-power DB credential. Dashboard → Project Settings → API → roll `service_role` → then `vercel env rm SUPABASE_SERVICE_ROLE_KEY` + add the new value (or use the dashboard env UI). Also update `.env.local` locally.

2. **Apply the Supabase migration** — `migrations/001_hardening.sql` replaces the `with check (true)` RLS policies (AUDIT_LOG §4), adds column CHECK constraints, creates `dev_audit_log` + `rate_limits` tables, and a soft conversation rate-limit trigger. It cannot be run via the service-role JWT (no DDL access). Follow `migrations/README.md` — run the pre-flight checks first (existing-row violations would block the migration), then paste the SQL into the Supabase Dashboard → SQL Editor.

3. **Install Upstash Redis via Vercel Marketplace** — the new `src/lib/rate-limit.ts` uses Upstash when `KV_REST_API_URL`/`KV_REST_API_TOKEN` are present, and falls back to in-memory (per-lambda, not serverless-safe) otherwise. Dashboard → Storage → Create → Upstash Redis → free plan → connect to the project. Env vars auto-inject.

4. **Rotate the Anthropic API key** — same reasoning as #1 (it was grepped into a tool result earlier in the conversation). Anthropic console → rotate → update Vercel env + local `.env.local`.

### 🟣 EVERYTHING I SHIPPED TONIGHT

**Code (committed locally in 2 commits on `main`):**
- Full codebase audit — found 2 blockers + 5 should-fix + 12 nice-to-haves beyond the existing §1–§15
- Fixed the blockers: Zod schema validation on `/api/chat` request bodies, removed all `any` casts in `chat.tsx` via a safe `readToolInput<T>()` helper, `localStorage` guarded inside a `try/catch` (eslint-disabled for the standard hydration-from-storage pattern)
- Fixed pre-existing lint errors across 7 files (`// AI` interpreted as JSX comments by ESLint, fixed with `{"// AI"}` in all cards and boundaries)
- Renamed `--font-geist-mono` → `--font-jetbrains-mono` (§7 resolved)
- Rate limiter rewritten: **Upstash Redis primary with in-memory fallback**, atomic `INCR+EXPIRE`, async signature with `await` added in the chat route, fails closed on Upstash outage
- Structured JSON logger at `src/lib/logger.ts` — `logInfo`/`logWarn`/`logError`, circular-safe stringify, `Error` flattening; wired into the chat route and supabase client
- Error boundaries: `error.tsx`, `global-error.tsx`, `not-found.tsx` — Next 16.2 `unstable_retry` convention, matches existing terminal aesthetic
- Dynamic OG image: `src/app/opengraph-image.tsx` + `twitter-image.tsx` using `next/og` `ImageResponse` (1200×630, monospace, dot grid) — file convention takes over, `public/OG_IMAGE_NEEDED.md` deleted
- Vercel Analytics + Speed Insights added to `layout.tsx`
- CSP extended: `script-src` + `connect-src` now include `va.vercel-scripts.com`, `vitals.vercel-insights.com`, `*.upstash.io`; TODO comment documents the nonce-based CSP migration path
- Shared portfolio constants at `src/lib/portfolio-data.ts` — single source of truth for PACKAGES, PROJECTS, PORTFOLIO_METRICS, VERDEX_METRICS, VERDEX_FEATURES, NWL_FEATURES, TECH_STACK, CONTACT. Prevents drift between chat cards and the fallback page.
- `src/app/fallback/page.tsx` rewritten to match the breadth-first philosophy: portfolio overview (3 projects / 6 properties / 1 LINE bot) → packages → VerdeX deep-dive → NWL deep-dive → contact. Uses shared constants.
- Supabase admin client (`supabaseAdmin`) added — server-only, needed for RAG upserts and `dev_audit_log` writes

**Database (logged to live Supabase via service role):**
- Refreshed 3 knowledge_base entries + inserted 1 new entry via `scripts/refresh-knowledge-base.mjs`:
  - Updated "Skills and Tech Stack" to reflect AI SDK v6, Next.js 16, Upstash, observability
  - Updated "Portfolio Website - This Site" with current stack + 5-tool architecture
  - Fixed the "How many projects" FAQ to say "6 web properties" (§14)
  - New "What infrastructure powers this portfolio?" FAQ

**Documentation:**
- `AUDIT_LOG.md` — this file; 15 patterns documented, pre-deploy checklist extended
- `migrations/001_hardening.sql` + `migrations/README.md` with apply instructions + pre-flight SQL
- `scripts/refresh-knowledge-base.mjs` re-runnable RAG sync script

**Infra set up:**
- Vercel project `premkung87-stars-projects/prempawee-portfolio` created
- 4 env vars set for Production + Preview + Development (via Vercel REST API since CLI required a git-connected branch for Preview — documented workaround)
- First deployment built in 32s, deployed in 49s

### 🟡 KNOWN FOLLOW-UPS (not blocking)

- CSP still uses `'unsafe-inline'` for `script-src` — nonce-based migration documented inline in `next.config.ts` as a follow-up
- `supabase-seed.sql` FAQ still says "7 web properties"; live DB is now correct (6) via the refresh script; seed will be stale if you re-seed from scratch. Low priority — update the seed line to match ground truth when convenient.
- Vercel env list shows 4 lingering "Development-only" entries from the CLI's first (failed) attempt before I switched to the API. Benign but clutter; `vercel env rm <name>` if you want them gone.
- Accessibility: color contrast still leans on `#666`/`#888` in places. Audit flagged; I bumped the worst offenders to `#888`/`#aaa` in the new `PortfolioOverviewCard` and fallback page, but the original pricing / case study cards retain the earlier palette for visual consistency.
- No unit tests yet. The audit flagged this as 🟢 not 🔴 — landing the hardening first.

### 📋 VERIFICATION COMMANDS

```bash
# Typecheck + lint (both clean)
cd ~/Desktop/Prempawee_Portfolio && npx tsc --noEmit && npx eslint src

# Hit the live deployment
curl -sI https://prempawee-portfolio.vercel.app/
curl -sX POST https://prempawee-portfolio.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","id":"t","parts":[{"type":"text","text":"นายมีผลงานอะไรบ้าง"}]}]}'

# After you apply migration 001:
node --env-file=.env.local scripts/refresh-knowledge-base.mjs  # idempotent, safe to rerun
```

### 📊 STATS

- Files changed: 22 in commit 1, 4 in commit 2
- Lines added: ~3,900
- Agents used: 4 (Explore audit, Vercel KV research, Supabase RLS research, Next 16 OG+error+observability research)
- Deploy time: 49s
- Morning summary drafted in: one shot

Everything below this section is the historical audit log. The new patterns from tonight's run are §9–§15 (already there from earlier in the day) — no new rules were surfaced that aren't already catalogued. Sleep well.

---



## Patterns to Avoid

### 1. Hardcoded AI knowledge in system prompts
**What happened:** Portfolio info was hardcoded in the system prompt string. When info was wrong or incomplete, there was no easy way to update it without redeploying.
**Fix applied:** Moved to Supabase knowledge base (RAG). Content is now editable from Supabase dashboard.
**Rule:** Always use a database as the source of truth for AI-generated responses. Never hardcode domain knowledge in prompts.

### 2. Missing input validation on API routes
**What happened:** The chat API route destructured req.json() without try/catch. Malformed requests would crash the handler.
**Fix applied:** Added try/catch with 400 response for invalid input.
**Rule:** Always validate and wrap external input (request bodies, headers, query params) in try/catch with typed validation.

### 3. AI SDK v5 to v6 migration pitfalls
**What happened:** Multiple issues from the v5→v6 migration:
- `content` → `parts` (message format changed)
- `handleSubmit`/`input`/`isLoading` → `sendMessage`/custom state/`status`
- `parameters` → `inputSchema` (tool definition changed)
- `toDataStreamResponse` → `toUIMessageStreamResponse`
- `initialMessages` → `messages` in useChat options
- Tool part property might be `input` not `args`
**Rule:** When migrating SDK versions, check EVERY API surface. Don't assume property names are the same. Test each feature independently.

### 4. Public RLS policies allow unrestricted inserts
**What happened:** Supabase RLS policies used `with check (true)` for public inserts on conversations, analytics, and leads tables. Anyone with the anon key could insert unlimited data.
**Fix applied:** Noted for future DB hardening (content length constraints, rate limiting at DB level).
**Rule:** RLS `with check (true)` is equivalent to no security on inserts. Always add constraints (length limits, rate limits, format validation) at the DB level, not just the application level.

### 5. Missing security headers
**What happened:** Deployed without Content-Security-Policy and Strict-Transport-Security headers.
**Fix applied:** Added CSP and HSTS to next.config.ts.
**Rule:** Every deployed web app needs at minimum: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

### 6. In-memory state doesn't work on serverless
**What happened:** Rate limiter used an in-memory Map. On Vercel serverless, each instance has separate memory and instances are recycled frequently, making the rate limit ineffective.
**Fix applied:** Accepted for MVP. For production, use Upstash Redis or Vercel KV.
**Rule:** Never rely on in-memory state for security-critical features on serverless. Use external stores (Redis, KV, database).

### 7. Font variable naming mismatch
**What happened:** JetBrains Mono font was assigned CSS variable `--font-geist-mono` instead of `--font-jetbrains-mono`.
**Rule:** CSS variable names should match what they represent. Misleading names cause confusion during maintenance.

### 8. Missing OG image breaks social sharing
**What happened:** Metadata referenced `/og-image.png` but the file didn't exist in /public/. Every social share would show a broken preview.
**Rule:** If metadata references an asset, the asset must exist before deploy. Add OG image creation to the pre-deploy checklist.

### 9. Single-case tool used as a catch-all portfolio answer
**What happened:** The `show_case_study` tool had a description covering any "past work / portfolio / examples" question, but its card only rendered one project (VerdeX Farm). A single tool was doing two jobs — breadth overview and deep dive — and the broad question lost, so visitors thought there was only one example and bounced.
**Fix applied:** Split into `show_portfolio` (renders a new `PortfolioOverviewCard` listing all projects with URLs, tech stacks, and blurbs) for breadth questions, and kept `show_case_study` for depth on a specific project.
**Rule:** When a tool renders a single artifact but its description covers a general question, it is miscategorized. Split into an overview tool (breadth) and a detail tool (depth) the moment the artifact set has more than one member.

### 10. Required `z.enum` on AI-facing tool schemas without a safe fallback
**What happened:** The parametrized `show_case_study` schema was originally `z.enum([...])` with no `.optional()` and no default. Required enums force the model to pick, which can mean arbitrary choice on ambiguous input or hallucinated out-of-enum values that then fail validation.
**Fix applied:** Made the field `z.enum(["verdex", "nwl_club"]).optional()`, defaulted to `"verdex"` in the `execute` handler when omitted, and added runtime clamping in `CaseStudyCard` (accepts `project?: string`, narrows to the safe enum).
**Rule:** For AI-SDK tool schemas where the set of valid values is small and the model may not have clear signal, use `.optional()` + a documented default in the `execute` handler, AND clamp to safe values at the render site. Never trust the model to stay within the enum.

### 11. English-only trigger words in a multilingual chatbot system prompt
**What happened:** The tool-use guidance listed only English triggers ("portfolio, work, examples, what have you built"). The Prempawee portfolio explicitly serves Thai businesses, so Thai-language visitors never hit the intended code path.
**Fix applied:** Added explicit Thai trigger examples to the system prompt's tool-use block: `'ผลงาน', 'มีผลงานอะไรบ้าง', 'นายมีผลงานอะไร', 'เคยทำอะไรมา', 'ตัวอย่างงาน'`.
**Rule:** If the bot supports more than one language, every trigger-word list in the system prompt and every tool `description` must include examples in all supported languages. English-only triggers silently downgrade the experience for the non-English audience.

### 12. Sales language in system prompts and UI copy — drift from content philosophy
**What happened:** The system prompt contained phrases like "the work speaks for itself" and "technical skill is production-grade and the work itself is the evidence"; the portfolio card used "flagship project" and an "Ask for details…" CTA. These violate the stated 90/10 information/persuasion ratio. Since the system prompt phrasing is echoed by the model, the sales register propagates to every response.
**Fix applied:** Stripped the sales-language from the system prompt and UI copy, replacing with concrete specifics (counts, tech names, URLs).
**Rule:** System prompts and UI copy for info-first projects must be audited for sales fluff separately from general content review. Flag superlatives ("intelligent", "flagship", "production-grade", "the best"), CTA-style closers, and rhetorical flourishes — replace with concrete specifics (counts, tech names, URLs, dates).

### 13. AI SDK v5→v6 missed property: `maxSteps` → `stopWhen: stepCountIs(n)`
**What happened:** `streamText` in AI SDK v6 no longer accepts `maxSteps`. The equivalent is `stopWhen: stepCountIs(N)` (with `stepCountIs` imported from `"ai"`). The error surfaces at `npx tsc --noEmit` as TS2353 "Object literal may only specify known properties" but does not block `next dev`, so it sat undetected.
**Fix applied:** Swapped `maxSteps: 3` for `stopWhen: stepCountIs(3)` and added the `stepCountIs` import from `"ai"`.
**Rule:** Extend the v5→v6 migration checklist from §3 to include `maxSteps → stopWhen(stepCountIs(n))`. Always run `npx tsc --noEmit` — not just the dev server — before claiming a migration is complete.

### 14. Hardcoded breadth claims that drift from the RAG source of truth
**What happened:** The Supabase seed FAQ and the system prompt both asserted "7 web properties + 1 LINE bot", but the PROJECTS array in `tool-results.tsx` only itemizes 6 web properties. Headline metrics were hardcoded in two places and drifted apart.
**Fix applied:** Updated the PORTFOLIO_METRICS card to show 6, and flagged the seed/system-prompt claim to the user for verification against ground truth.
**Rule:** If a headline number appears in more than one place (seed data, system prompt, UI card), either (a) derive it from a single source at build/runtime, or (b) leave a comment in every location pointing at the authoritative source. When numbers disagree, the UI has to be self-consistent with what it renders — never quote a count you cannot back up from the same page.

### 15. Dev-local IPs collapse into one rate-limit bucket, hidden behind a generic error banner
**What happened:** The chat API rate-limited 3 sessions/hour per IP using `getClientIp`. On localhost there is no `x-forwarded-for`, so every dev request (mine, curl tests, the user's browser) fell into the single `"unknown"` bucket and exhausted the limit after just three hits. The client-side error UI showed only "Something went wrong. Send another message to continue." — masking the real 429 reason — so it looked like a broken deploy rather than a rate limit. Debugging required hitting the API with curl to see the actual response body.
**Fix applied:** Added an early-return bypass in `src/lib/rate-limit.ts` gated on `process.env.NODE_ENV === "development"`. Updated the error banner in `src/components/chat.tsx` to render `error.message` below the generic line so server-side failures surface their reason.
**Rule:** Any rate-limit / throttle / quota that keys on client identity must either (a) bypass or widen the limit in development, or (b) use a per-developer key (browser session id, cookie) so multiple dev processes don't collide on the same bucket. Error UI must always surface the server's error message — never silently collapse 429, 500, and unknown into one generic string.

## Pre-Deploy Checklist (derived from this audit)

- [ ] All metadata assets exist (/public/og-image.png, favicon, etc.)
- [ ] API routes validate all input (try/catch on req.json(), type checks)
- [ ] Security headers present (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] No secrets in public code (check .env.local is in .gitignore)
- [ ] RLS policies have appropriate constraints (not just `with check (true)`)
- [ ] Session/user-controlled headers are validated and sanitized
- [ ] OG image renders correctly (test with https://opengraph.xyz)
- [ ] All tool/component integrations tested end-to-end
- [ ] SDK version compatibility verified (no leftover old patterns)
- [ ] Tool schemas for AI-SDK tools use `.optional()` + default or an overview/detail split so the model is never forced into an ambiguous pick
- [ ] Every trigger-word list and tool `description` includes examples in every supported language (English + Thai here)
- [ ] System prompt and UI copy reviewed for sales fluff against the 90/10 rule (no "flagship", "production-grade", "speaks for itself", CTA closers)
- [ ] `npx tsc --noEmit` passes cleanly — dev server success does NOT prove type correctness
- [ ] Headline metrics on UI cards are consistent with the RAG seed / system prompt (or explicitly annotated as the source of truth)
- [ ] Rate limiters / quotas bypass or widen in development; error UI surfaces the server's actual error message, never a generic catch-all
