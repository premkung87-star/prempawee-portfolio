# KARPATHY.md

> **Source:** [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — MIT License
> **Derived from:** Andrej Karpathy's observations on LLM coding pitfalls
> **Original version pulled:** 2026-04-18

This file has **two parts**:
- **Part 1** — Karpathy's original guidelines (reproduced verbatim under MIT, universal baseline)
- **Part 2** — Prempawee Extensions (project-specific rules derived from our own AUDIT_LOG post-mortems)

Part 1 is the "factory baseline." Part 2 is the "custom modifications for our specific driving conditions" (Next.js 16, Vercel Edge, Supabase, CSP nonce pipeline).

Both parts apply together. Read in order. Don't skip Part 2 — it encodes failures we've already lived through.

---

# Part 1 — Karpathy Original (Universal Baseline)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Part 2 — Prempawee Extensions (Project-Specific)

These rules extend (not replace) Part 1. They address failure modes Karpathy's generic principles do not cover — specifically, failures caused by **framework version staleness**, **silent breakage via indirect signals**, and **platform-specific CDN behavior**. Each rule links to the AUDIT_LOG incident that taught us the lesson.

## 5. Verify Framework Version Before Using APIs

**Don't rely on training-data knowledge of API shapes — this stack moves faster than training cutoffs.**

Before using any framework or SDK API:
- Check installed version: `npm view <pkg> version` or read `package.json`
- For Next.js specifically, read `node_modules/next/dist/docs/` before assuming any convention
- For AI SDK, check migration guides between v5→v6 (especially tool-use APIs)
- If the API shape you "remember" feels confident but the version is new — stop. Verify.

**Known pitfalls in this codebase:**
- Next.js 16 renamed `middleware.ts` → `proxy.ts` (runs Node, not Edge) — see AUDIT_LOG §18
- AI SDK v6 replaced `maxSteps` with `stopWhen: stepCountIs(n)` — see §13
- Next.js 16 + Turbopack + strict-dynamic CSP requires specific nonce pipeline — see §17

**The test:** If your change depends on a framework behavior, you should be able to cite the doc path or source line that confirms it. "I think this works" is not confirmation.

## 6. Browser Verification Is The Only Valid Success Signal For Render-Path Changes

**Build passing, TypeScript passing, 200 OK, logs accumulating — none of these prove the page works.**

Signal hierarchy (from weakest to strongest):
```
npm run build ✓        ← weak (compile only)
npm run typecheck ✓    ← weak (types only)
Deploy successful      ← weak (upload only)
200 OK response        ← weak (SSR only, not hydration)
Supabase rows growing  ← weak (may be bots)
Playwright click ✓     ← STRONG (real browser)
Real user completes flow ← STRONGEST
```

**Rule:** For any change touching a watchlist file (see AGENTS.md), the minimum valid verification is:
```bash
BASE_URL=http://localhost:3000 npm run test:e2e
```

Followed by the same command against Vercel preview URL after deploy.

**Why:** AUDIT_LOG §20 documented a case where 4 "success" signals all lied simultaneously. Site appeared healthy by every indirect measure. 148 "conversations" logged. Mozilla A+. Zero errors in Sentry. Users couldn't click a single button because React hydration silently gave up.

**Counterintuitive corollary:** If Sentry is quiet, that's **not** evidence nothing is broken. Silent breakage is the default failure mode of hydration bugs.

## 7. One Logical Change Per Commit — Never Bundle Unrelated Hardening

**Bundled commits destroy the ability to bisect. Do not bundle.**

When making multiple related-but-separable changes:
- Create a feature branch
- Make change A → commit with clear message → verify
- Make change B → commit → verify
- Make change C → commit → verify
- Merge as separate commits (or squash at merge time, but only after all verified independently)

**Real failure mode:** AUDIT_LOG §20 — commit `899ae89` bundled five changes (proxy rename + experimental.sri + async RootLayout + connection() + CSP strict-dynamic). Site broke. Had to nuclear-revert all five. Took ~3 hours + another day to bisect which one was the real culprit. Turned out to be `experimental.sri` alone (§21).

**Cost breakdown:**
- Isolated commits: 5 commits × 15 min verify = ~75 min
- Bundled commit that breaks: 3 hrs incident + 1 day bisect = ~10 hrs
- **Math is not close. Don't bundle.**

**Acceptable exception:** Mechanical refactors across many files (e.g., renaming a type) may be a single commit. Logic changes must be isolated.

## 8. Edge Runtime: All Async Work Must Be Explicitly Awaited

**Fire-and-forget promises inside edge handlers silently drop.**

On Vercel's edge runtime, worker teardown can happen as soon as the main handler returns. Any `.catch()`-orphaned or unawaited promise is at risk of being killed mid-execution.

**Wrong:**
```ts
onFinish: async ({ text }) => {
  logConversation(text);  // ← fire-and-forget, drops in edge
  logAnalytics(event);    // ← same
}
```

**Right:**
```ts
onFinish: async ({ text }) => {
  await Promise.all([
    logConversation(text),
    logAnalytics(event),
  ]);
}
```

**Evidence:** AUDIT_LOG §19 — 1 of 148 `token_usage` events landed in production because all others were fire-and-forget. Looked fine in dev (Node doesn't tear down the same way). Only production + edge exposed the pattern.

**The test:** For every `.then()`, `.catch()`, or function call inside an edge handler, ask: "Is this awaited before the handler returns?" If not, refactor.

## 9. Platform-Specific CDN Behavior Requires Preview Verification

**Features that work locally can break on Vercel because the CDN re-encodes responses.**

Vercel's CDN applies Brotli/gzip encoding **after** your build produces files. This breaks any feature that depends on byte-exact content matching build-time hashes.

**Known incompatible features (do not enable):**
- `experimental.sri` in `next.config.ts` — integrity hashes don't match re-encoded bytes, Chrome silently blocks all scripts → zero hydration → fully dead site with no error output
  (AUDIT_LOG §21, upstream issue [vercel/next.js#91633](https://github.com/vercel/next.js/issues/91633))

**Rule:** Before enabling any build-time integrity, hash-based, or byte-exact feature:
1. Check AUDIT_LOG Patterns-to-Avoid
2. Search GitHub issues for `<feature> vercel` or `<feature> CDN`
3. Deploy to Vercel preview first (not direct to main)
4. Run Playwright against preview URL
5. Only merge if real browser verification passes

**The test:** "Will this feature's correctness depend on the bytes being identical between build output and what the browser receives?" If yes, assume Vercel CDN will re-encode unless proven otherwise.

## 10. Observability Before Features

**If a failure mode can occur and cannot be observed, do not ship the feature.**

Before adding any non-trivial feature, verify:
- Errors in that code path would appear in Sentry (if DSN is set)
- Violations/blocks in that code path would appear in CSP report endpoint
- Relevant user flow is covered by Playwright test
- State changes are logged to the appropriate table (conversations, leads, analytics)

**Rule:** If you find yourself thinking "this probably works, let's deploy and see" — stop. That sentence is the precondition for AUDIT_LOG §20. You cannot "see" silent hydration failures, fire-and-forget drops, or CDN-induced script blocks. Build the observation path first, then the feature.

**Anti-pattern:** Relying on user complaints as your error monitor. By the time a user complains, you've already lost them.

---

## How These 10 Rules Relate

Rules 1-4 (Karpathy) = **upstream discipline** — prevent mistakes before they happen.
Rules 5-10 (Prempawee) = **downstream safeguards** — catch mistakes when they inevitably happen.

Together they form a layered defense:
- Karpathy stops you from confidently writing wrong code
- Prempawee Extensions stop that wrong code from reaching users silently

Neither layer alone is sufficient. Use both.
