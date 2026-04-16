# Audit Log — Prempawee Portfolio

Last audit: 2026-04-16

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
