# Prempawee.com Saturday Launch — Weakness Sweep + Upgrade Phase

**Date:** 2026-04-25 (Saturday, Bangkok)
**Author:** Foreman directive → Architect (Claude Opus 4.7) brainstorm
**Hard launch deadline:** 2026-04-26 12:00 Bangkok (Sunday noon)
**Philosophy:** *"Build strong infrastructure and minimize disadvantages before increasing advantages."* Eliminate the bounded weakness list first; do not hunt for new weaknesses. Then upgrade phase. Then ship.

---

## 1. Goal

Launch prempawee.com to active workforce-acquisition use by Sunday 2026-04-26 12:00 Bangkok with all known weaknesses eliminated and 2+ portfolio-quality upgrades shipped.

This spec is single-day (today + Sunday morning verification). It is NOT a roadmap.

## 2. Non-goals

- Find new weaknesses beyond the bounded list of 10. The list is closed.
- Refactor adjacent code that isn't broken. Karpathy §3.
- Optimize for hypothetical future requirements. KARPATHY §13.
- Pursue C-criterion (quality) at the expense of A-criterion (12:00 Sunday hard cap).

## 3. Bounded weakness list (closed at brainstorm time)

| # | Item | Severity | Source | Owner | Effort |
|---|---|---|---|---|---|
| 1 | Faithfulness 0.495 — chatbot fabricates prices/products | CRITICAL | AUDIT_LOG §32 | Claude (code) | 1–2hr |
| 2 | Sentry 3 alert rules not configured | MEDIUM | SSS axis #1 | **Prem (dashboard)** | 5–10min |
| 3 | Vercel WAF + BotID dashboard toggle | MEDIUM | SSS axis #6 | **Prem (dashboard)** | 2min |
| 4 | Supabase region pin (default `iad1` → SEA) | MEDIUM | SSS axis #5 | **Prem (dashboard)** | 1min |
| 5 | SSL Labs A+ scan + screenshot capture | LOW (verification) | SSS axis #8 | **Prem (URL click)** | 5min |
| 6 | HSTS preload status check (Chrome review) | LOW | SSS axis #8 | **Prem (URL click)** | 2min |
| 7 | `onRouterTransitionStart` hook missing in instrumentation-client.ts | LOW | §24 fu#1 | Claude (code) | 10min |
| 8 | E2E CSP test fails on localhost by design — env-scope it | MEDIUM | §24 fu#3 | Claude (code) | 15min |
| 9 | CI guard: fail merge if both `middleware.ts` AND `proxy.ts` exist | LOW–MED | §1 ticket | Claude (code) | 20min |
| 10 | Sentry Issues-classification probe (verify real app errors land) | LOW–MED | §24 fu (NEW) | Claude (code+verify) | 15min |

**Deferred as cosmetic-only (not weaknesses, do NOT fix in this sweep):** §24 fu#2 stale comment, 4 stale Vercel env vars from prior CLI fumbling.

## 4. Execution shape — Front-loaded dashboard parallelism (Shape A)

### 4.1 First action

Claude posts ONE consolidated "Prem manual checklist" message containing the 5 dashboard items (#2/#3/#4/#5/#6) with copy-paste instructions, dashboard URLs, and expected verification output for each. Prem executes them in one ~15min focused block.

### 4.2 In parallel — Claude code-side track

While Prem works dashboards, Claude opens 3 PRs against `main`:

- **PR-α: Faithfulness fix (#1).**
  - System prompt guardrail: forbid stating any number / price / product name / metric not present in `<relevant_context>` literally.
  - Optionally raise `match_count` 6→10 if guardrail alone doesn't lift faithfulness ≥0.85.
  - Re-run `npm run eval:rag` until faithfulness avg ≥0.85, no individual probe <0.6.
  - Watchlist file (`src/app/api/chat/route.ts`) → mandatory local + production-domain Playwright after merge.
  - Wiki query before drafting: search prior pawee-projects for hallucination-reduction precedents.

- **PR-β: §24 follow-up sweep (#7 + #8 + #10).**
  - Add `onRouterTransitionStart = Sentry.captureRouterTransitionStart` export.
  - Env-scope the localhost CSP test: `test.skip(baseURL.includes("localhost"), ...)` or split into env-tagged tests.
  - Trigger one intentional `/api/chat` failure on production preview, confirm Issue lands in Sentry Issues panel with correct fingerprint. Document outcome.
  - Single PR because all three touch Sentry/test config and travel together logically.

- **PR-γ: CI middleware/proxy coexistence guard (#9).**
  - Add a shell step to `.github/workflows/ci.yml` that fails if both `src/middleware.ts` and `src/proxy.ts` exist simultaneously.
  - Closes the §1 ticket.

### 4.3 Convergence — verification + dashboard reconcile

Once all 3 PRs merged AND all 5 dashboard tasks confirmed by Prem:
- Production live-browser E2E (`BASE_URL=https://prempawee.com npm run test:e2e`) — must be 6/6.
- Re-run `npm run eval:rag` against prod — confirm faithfulness ≥0.85 in production traffic.
- Curl probes: HSTS, CSP, Sentry endpoints, Supabase region (X-Vercel-Trace), Lighthouse CLI on homepage.

### 4.4 Upgrade phase — research-driven, bounded to 2–3 picks

Trigger: §4.3 green AND clock <22:00 Saturday.

- LLM WIKI query: portfolio site precedents in pawee-workflow-kit corpus.
- Web research: 3–5 "best in class" solo-AI-engineer or international portfolio sites (e.g., Brittany Chiang, Wes Bos, Linear's company sites, top 1% of Awwwards "Sites of the Day" filtered for "portfolio" tag in last 12 months).
- Distill: surface 5 candidate upgrades; pick top 2–3 by ROI for prempawee's specific audience (Thai businesses + AI-curious founders + LINE OA buyers).
- Implement each as its own PR with the same verification rigor as weakness fixes.

Concrete upgrade candidates to consider (NOT prescriptive — research will refine):
- Visible "what I shipped this week" microblog or activity ticker (recency signal).
- A real screenshot/video case study for VerdeX or NWL CLUB (prove the live URL claim).
- Conversion-track: clear "book a discovery call" CTA with calendar embed.
- Personality lift on first-paint: opening message warmer than current.

### 4.5 Stop criterion (C → B → A cascade)

- **C (preferred):** All 10 weaknesses eliminated + faithfulness ≥0.85 + Lighthouse ≥95 in all 4 categories (Performance, Accessibility, Best Practices, SEO) on `https://prempawee.com/` (homepage, mobile profile) + Mozilla Observatory still A+ + ≥2 upgrades shipped → I tell Prem **"time to launch."**
- **B (fallback):** If C bars haven't all cleared by Sunday 09:00 Bangkok, accept "10 weaknesses gone + 2–3 upgrades shipped" → I tell Prem **"time to launch."**
- **A (hard cap):** Sunday 12:00 Bangkok regardless of state. Whatever's merged ships. Whatever's open is reverted or shelved.

### 4.6 Launch checkpoints (claude-emitted status pings)

I post a brief status check to Prem at:
- Sat 14:00 (post-PR-α merge expected)
- Sat 18:00 (all 3 code PRs merged + dashboards done expected; upgrade research starting)
- Sat 23:00 (upgrade #1 shipped, #2 in flight)
- Sun 09:00 (B/C decision point — I commit to one or the other and announce stop signal target)
- Sun 12:00 (LAUNCH or HARD CAP fired)

Each ping is ≤5 lines: timestamp, what shipped since last ping, what's open, runway-to-noon-Sunday, escalations needed.

## 5. Risk + error handling

| Risk | Mitigation |
|---|---|
| WAF/BotID activation breaks real chat traffic | Code already gracefully no-ops on `checkBotId` failure (per AUDIT_LOG L439). Prem's verification step after toggle: send a test chat from his phone, confirm 200. If broken, dashboard toggle can be reverted in <30s. |
| Faithfulness guardrail makes bot too terse | Hard test: re-run eval. If overall_score drops below 0.7 (CI gate), revert prompt change and try alternative — raise match_count instead. Don't ship a prompt that breaks the eval gate even if faithfulness lifts. |
| Supabase region change adds latency to /api/chat for non-Thai traffic | Acceptable trade per SSS axis #5 documentation. Thai is target audience; sin1/sea1 Vercel runtime + sin1/sea1 Supabase = symmetric path. |
| CI guard PR breaks an unrelated workflow | Test on PR-γ branch only; Vercel preview build is the canary. Don't touch any other workflow file. |
| Upgrade research goes too deep (Karpathy §13 violation) | Hard timebox: 30min research + 30min decide + everything else is implementation. If at 23:00 we don't have 2 upgrades shipped, fall to B-criterion immediately. |
| Sunday morning crisis | Sunday 09:00 checkpoint is the no-going-back point. Anything in-flight at 09:00 must be merge-ready by 11:00 or it's reverted. |

## 6. Verification gate per weakness

| # | Verification |
|---|---|
| 1 | `npm run eval:rag` faithfulness avg ≥0.85, no probe <0.6, overall ≥0.7. + Production-domain Playwright 6/6. |
| 2 | Three test events fired in Sentry, three alert rules each show "would have triggered" in dry-run. |
| 3 | One real chat from Prem's phone post-toggle, returns 200 with assistant text. |
| 4 | Single chat round-trip latency ≤900ms p50 (vs current ~1.2s) measured via 5 curl probes. |
| 5 | SSL Labs A+ screenshot captured + linked from `docs/SSS_STATUS.md`. |
| 6 | hstspreload.org status flips from "pending" to "preloaded," OR Prem screenshots current state if still pending. |
| 7 | Sentry SDK no longer prints "ACTION REQUIRED" warning at build time. Navigation trace appears in Sentry Performance for one prod page-transition. |
| 8 | `npm run test:e2e` 6/6 green vs both `localhost:3000` AND prod (currently 5/6 vs localhost). |
| 9 | A test branch with both files present is rejected by CI; the same branch with only `proxy.ts` passes. |
| 10 | Triggered failure surfaces as one Sentry Issue with correct fingerprint + severity. |

## 7. Open questions / NEED-CLARIFICATION

None at brainstorm close. Bounded weakness list locked. Stop criterion locked. Execution shape locked.

## 8. Handoff

After this spec is committed and Prem signs off, the architect invokes `superpowers:writing-plans` to convert each PR (α/β/γ + 2 upgrade PRs) into a concrete implementation plan with TDD where applicable, then begins execution.
