# Haiku 4.5 Migration + Cache Fix — Design Spec

**Date:** 2026-04-26
**Author:** Foreman (Prempawee) + Claude Opus 4.7 + vercel:ai-architect specialist
**Status:** APPROVED — 2026-04-26 (Foreman locked-in decisions: eval prompts committed to repo, HTML report review, PR 1 ships today)
**Predecessor PRs:** #51 (HR-reviewed bio), #52 (Renaissance font)

---

## Goal

Cut chat cost trajectory from **~$306/mo** to **<$50/mo** without sacrificing brand consistency, lead-capture quality, or bilingual UX. Diagnose and fix the 0% cache-hit rate before assuming the model is the problem.

## Architecture

Two PRs, shipped in order. Each is independently revertible. KARPATHY §7 — one logical change per commit.

- **PR 1 — Cache + runtime fix.** Edge → Node + `iad1` pin + correct `cacheControl` placement. **Keep Sonnet 4.** Verify cache reads light up. Recovers ~70-80% of the savings even with no model swap.
- **PR 2 — Haiku 4.5 swap.** Model swap + prompt deltas + sampling params, gated by a side-by-side A/B eval the user signs off on before merge. Adds another ~3-4× per-token reduction on top of PR 1.
- **Fallback path (only if PR 2 eval fails Thai politeness tests).** Two options: stay on Sonnet 4.5 with cache fix (drops model swap, keeps ~90% of cost win) OR drop Thai surface entirely and run prempawee.com as EN-only (Phase 3 spec, separate scope). Foreman decides at fail-time, not now.

## Tech stack

Next.js 16 App Router · AI SDK v6 (`ai`) · `@ai-sdk/anthropic` · Vercel Fluid Compute (Node 24) · Supabase analytics for cache verification.

---

## Why the cache is at 0% (root cause analysis)

Two independent bugs compound. Both must be fixed:

**Bug A — Edge runtime fragments cache across regions.**
`runtime = "edge"` (chat route line 25) sprays ~200-365 calls/day across 4-6 global edge regions (sin1, hkg1, syd1, fra1, iad1...). Anthropic's prompt cache is *regional*, not global. With ~50 calls/region/day and a 1h TTL, every isolate cold-starts to a brand-new cache write. There's never a second hit on a warm region.

**Bug B — `cacheControl` is on the wrong block.**
`providerOptions.anthropic.cacheControl` at the top level of `streamText` (line 305-312) does not reliably propagate to the system block in AI SDK v6. The cache breakpoint is landing on a moving target (probably the user message tail) instead of the stable system prefix. Diagnostic match: 421k cache writes vs 0 cache reads is consistent with cache-writes happening on a non-reusable block, not a TTL-expiry pattern.

**Verification the diagnosis is right:** after PR 1 deploys, `cache_read_tokens` should appear in `analytics_events.token_usage` rows within 1 hour. If it stays at 0, the marking is still on the wrong block and we debug from there before doing anything else.

---

## PR 1 — Cache Fix + Runtime Consolidation

### Files

- `src/app/api/chat/route.ts` — runtime + cacheControl placement only

### Changes

1. **Runtime move** (top of file)
   - `export const runtime = "edge"` → `export const runtime = "nodejs"`
   - Add `export const preferredRegion = "iad1"` — Anthropic API is US-east primary; Singapore pin would *add* ~180ms egress per call. Cache warmth compounds, per-call latency saves ~80ms once.
   - Add `export const maxDuration = 60` — now legal under Node runtime.

2. **Cache marking fix** (around line 301-312)
   - Convert the `system: systemPrompt` string parameter into an explicit message at the head of `messages`, with `providerOptions: { anthropic: { cacheControl: { type: "ephemeral", ttl: "1h" } } }` set on that specific message.
   - Verify against `node_modules/ai/dist/` source before committing — do NOT rely on memory of the AI SDK API shape (KARPATHY §5).
   - TTL stays at 1h. Anthropic charges the write premium once per write, not per minute. Longer TTL = more chances to hit on the same cache entry.

3. **Keep everything else identical**
   - Sonnet 4 model unchanged
   - Tools unchanged
   - System prompt content unchanged
   - Per-query semantic block placement in user message unchanged
   - All `await Promise.all` patterns preserved (§08/§19/§36 protections still load-bearing under Node, just no longer the only thing keeping the worker alive)

### Verification

- `npm run typecheck` · `npm run lint` · `npm run test` · `npm run build` ✓
- `BASE_URL=http://localhost:3000 npm run test:e2e` ✓ (chat route is on the watchlist file path → mandatory E2E)
- Post-deploy preview E2E ✓
- **Cache hit verification (24h watch on prod):** query `analytics_events` for `event_type = 'token_usage'` rows. Within 1h of deploy, expect `cache_read_tokens > 0` on at least one row. Within 24h, expect `cache_read_tokens >= 80% of input_tokens` for repeat requests within the same hour.

### Rollback

Single git revert restores edge runtime. No schema migration. No client-side change. Safe to rollback any time.

### Risks

- **Node teardown behavior differs from edge.** All critical writes already use `await Promise.all` (§19/§36 fixes), so this is paranoia rather than active risk. Node tears down on response close like edge does, but with longer grace.
- **`iad1` pin may add ~80ms TTFB for Thai users on cold starts.** Acceptable given the cache savings dwarf this. Re-evaluate if Speed Insights p75 LCP regresses post-deploy.
- **Cache marking may *still* be wrong** after the refactor if AI SDK v6 expects a different shape. Mitigation: verify against SDK source first, then watch `cache_read_tokens` post-deploy as the ground-truth signal.

### Cost projection after PR 1

- Today: ~$306/mo trajectory
- After PR 1: **~$60-90/mo** (~70-80% reduction, no model change)

---

## PR 2 — Haiku 4.5 Swap (Eval-Gated)

Only ship if Foreman is unsatisfied with PR 1's cost (target: <$50/mo).

### Files

- `src/app/api/chat/route.ts` — model + sampling + prompt deltas
- `tests/eval/haiku-vs-sonnet.spec.ts` — new side-by-side eval (or reuse `scripts/eval-rag.mjs` shape)

### Changes

1. **Model swap** (line 302)
   - `claude-sonnet-4-20250514` → `claude-haiku-4-5-20251001`
   - Update model string in `logAnalytics` call (line 366) to match — easy to miss, would mis-attribute Haiku spend to Sonnet on FinOps dashboard.

2. **Sampling parameters** (added to `streamText` call)
   - `temperature: 0.3` — Sonnet at default 1.0 was forgiving; Haiku at 1.0 wanders. 0.3 keeps creative-enough Thai phrasing while clamping fact drift.
   - `maxOutputTokens: 800` — Haiku is more prone to tail rambles than Sonnet; cap prevents runaway output.

3. **Prompt deltas in `baseSystemPrompt`** (lines 49-90)
   - **Tool disambiguation** (`show_case_study.description`, line 421): Lead with `"ONLY when visitor names a specific project (VerdeX or NWL CLUB). For general 'show me your work' queries, do not call this — call show_portfolio."` Sonnet infers from buried hints; Haiku is more literal and follows the lead sentence.
   - **Thai polite register** (line 63): Expand the language rule to: `"Respond in whatever language the visitor uses. When responding in Thai, use polite male register with ครับ. Match the formality the visitor uses — formal Thai gets formal Thai back, casual gets casual."` Closes the politeness gap that's Haiku 4.5's biggest Thai weakness.
   - **Grounding rule personalization** (line 52, after the existing rule): Add a closing line: `"If you state a number, price, or technology and cannot point to its exact location in the KNOWLEDGE BASE, you are violating this rule."` Haiku's "literal follower" tendency makes personalized rule-violation language stickier than abstract directives.
   - **Keep the line 90 REMINDER unchanged.** Haiku 4.5 benefits from end-of-prompt reinforcement *more* than Sonnet does.

4. **Do NOT enable extended thinking.** Haiku 4.5 supports it, but it adds latency without measurable quality gain on RAG-grounded short-form chat, and it's incompatible with the way we want to use prompt caching. `cacheControl` stays the only entry under `providerOptions.anthropic`.

### A/B Eval Gate (the hard pre-merge requirement)

**30 frozen prompts** covering the actual UX surface:

| Bucket | Count | Examples |
|---|---|---|
| Portfolio overview EN | 3 | "show me your work", "what have you built" |
| Portfolio overview TH | 3 | "ผลงาน", "นายมีผลงานอะไร", "ตัวอย่างงาน" |
| Specific project EN | 3 | "tell me about VerdeX", "what is NWL CLUB" |
| Specific project TH | 3 | "เล่าเรื่อง VerdeX", "โปรเจกต์ NWL เป็นยังไง" |
| Pricing EN | 2 | "how much", "what does it cost" |
| Pricing TH | 2 | "ราคาเท่าไหร่", "แพ็คเกจมีอะไรบ้าง" |
| Contact + lead capture | 4 | mix of EN/TH "I'm interested" → drop email/LINE |
| Grounding traps | 4 | "what's your uptime?", "do you do iOS apps?", "have you worked with [fake company]?", made-up tech version question |
| Thai politeness/register | 4 | 2 formal Thai (ครับ/ค่ะ heavy), 2 casual Thai (no particles, slang OK) |
| General/edge | 2 | "are you a real person?", "why should I hire you?" |

**Run mode:**
- For each prompt: capture current Sonnet output AND proposed Haiku output back-to-back (same KB state, same tools).
- Render as a side-by-side markdown table.
- Foreman manually reviews — manual is the right gate here because subjective Thai quality is the failure mode and an LLM judge can't reliably score it.

**Pass criteria (ALL must hold):**
- [ ] ≥24/30 prompts rated equal-or-better on Haiku output
- [ ] **0 hallucination escapes** — any fabricated number, price, percentage, or feature name on Haiku side = automatic FAIL regardless of count
- [ ] 10/10 tool selection accuracy on the 10 deterministic tool-routing prompts (portfolio + project + pricing + contact)
- [ ] 0 broken Thai register on the 4 Thai politeness tests (must use ครับ where formal, must not use ค่ะ since male persona, must mirror formality)

**If pass → merge PR 2.**

**If fail → Foreman picks the fallback at fail-time:**
- **Path X:** Stay on Sonnet 4.5 + PR 1's cache fix. Drops model swap. Still gets ~90% of the original cost reduction. Lowest-risk recovery.
- **Path Y:** Drop Thai entirely. Rebuild prempawee.com as EN-only. Separate Phase 3 spec — would touch every component using `lang` state, the KB, the eval scripts, the SEO meta. Significant scope. Only revisit if Path X also fails for some reason, OR if Foreman explicitly wants to narrow market to English-speaking buyers.

### Verification

- `npm run typecheck` · `npm run lint` · `npm run test` · `npm run build` ✓
- A/B eval pass (above)
- Local + preview E2E ✓
- AUDIT_LOG entry post-merge documenting runtime + cache marking + model swap as one §38 entry

### Cost projection after PR 2

- After PR 1 + PR 2: **~$15-30/mo** (~90-95% reduction vs today's trajectory)

---

## What this spec does NOT cover

- Phase 3 EN-only rebuild — explicitly out of scope. Will be a separate spec at fail-time only.
- DeepSeek / MiniMax / non-Anthropic alternatives — rejected during brainstorm for brand-consistency reasons (the site sells "Claude-powered" as a paid feature; using a non-Claude bot for the demo undermines the pitch).
- Anthropic Batch API — not applicable to streaming chat use case.
- Switching embedding provider — already on cheapest tier; not a meaningful cost lever here.

## Locked decisions (Foreman, 2026-04-26)

1. **Eval prompts live in repo** at `tests/eval/haiku-vs-sonnet.frozen.json`. Re-runnable for any future model evaluation.
2. **Side-by-side review format:** static HTML report (one scroll-through). Render via a script that emits `tests/eval/haiku-vs-sonnet.report.html` (gitignored — generated artifact, not committed).
3. **PR 1 ships today.** Pure cache fix, no model risk. PR 2 plan written separately after cache-read numbers land in FinOps.

## PR 1 verified — 2026-04-26

PR #53 (cache + runtime) shipped + PR #54 (analytics field fix) shipped. Verification ran 3 fresh chat requests against prempawee.com and queried `analytics.token_usage`. Result:

- **Cache hit ratio: 86-100%** on consecutive requests within a 1h cache window.
- Per-request cost: ~$0.0065 (down from ~$0.030 = **~78% reduction**).
- Projected monthly: $306/mo trajectory → ~$60-90/mo (matches architect's prediction).

**Discovered during verification:** AI SDK v6 moved cache token counts from `providerMetadata.anthropic.cacheReadInputTokens` (which doesn't exist in v6) to `usage.inputTokenDetails.{cacheReadTokens, cacheWriteTokens}`. PR #54 fixed the field reads — the underlying caching was working all along, the analytics was lying. Lesson logged for future SDK migrations: verify telemetry field names, not just types.

**Status:** PR 1 scope COMPLETE. PR 2 (Haiku 4.5 swap) deferred — Foreman will decide based on a 24h cost trend whether the additional ~3-4× reduction is worth the eval work.
