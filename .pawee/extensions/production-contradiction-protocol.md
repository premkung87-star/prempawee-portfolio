---
type: protocol
title: "Production Contradiction Protocol"
tags: [UNIVERSAL, RECOVERY, PRODUCTION_DISCIPLINE, VERIFICATION]
applies_to: [generic]
universal: true
source: Prempawee Portfolio session 2026-04-26 (Foreman intervention pattern)
incident_refs:
  - .pawee/extensions/20-verify-production-claims.md (Source Incidents)
added_in_kit: 2.0.0-beta.4
relates_to: [Rule 20]
---

# Production Contradiction Protocol

## Purpose

Structured recovery pattern for the moment a production-state claim ("verified — cost down 78%", "latency improved", "error rate dropped") is contradicted by production data the human checks. Without an explicit protocol, the agent under contradiction will either (a) double down on the false claim, (b) panic and propose code changes before understanding the data, or (c) re-run the same synthetic verification that produced the false claim. None of these recover.

This protocol gives the agent a structured climb-down: diagnose first with hourly real-data queries, decide based on predefined criteria, execute one path, verify with production data, document honestly. It is the recovery counterpart to Rule 20's prevention.

## When to Invoke

Foreman invokes this protocol when **all** of the following are true:

1. An agent (Architect, Builder, or controller) has recently asserted a production-state claim ("verified", "cost down N%", "latency improved", "X is shipping").
2. Foreman has consulted production data (FinOps dashboard, Sentry error rate, Vercel Speed Insights, Supabase telemetry, real-user feedback) that contradicts the claim.
3. The contradiction is direct, not circumstantial — the data does not merely fail to confirm the claim; it actively suggests the opposite.

If only (1) and (2) hold but the data is ambiguous, run the diagnostic phase only. Do not invoke the full protocol unless the contradiction is concrete.

## Trigger Phrasing

Foreman invokes by issuing a STOP directive with an explicit data citation. Example:

```
STOP — the /admin/finops dashboard contradicts the "verified" claim
in PR #N. Production data observed just now:

- [specific metric 1: actual value vs claimed value]
- [specific metric 2: ...]
- [specific metric 3: ...]

NEW MISSION: Real verification or strategy pivot — TODAY, not
tomorrow. Definition of done: either (a) confirmed real cost
reduction with hourly post-fix data, or (b) revert + ship
alternative tonight.
```

The trigger pins three things: (1) the contradicting data, (2) the implicit failure (the prior claim), (3) the definition-of-done criteria for resolution. The agent receiving this directive does NOT propose alternatives or argue with the framing — it executes the protocol below.

## The Five Phases

### Phase 1 — Diagnostic (no code changes, hourly granularity)

**Goal:** Get the data that proves or disproves the original claim, structured for a clean decision.

**Constraints:**
- No code changes in Phase 1. Even "small fixes" wait until after the gate.
- No 30-day or 7-day aggregate comparisons. Same-day hourly only.
- No synthetic re-verification. The synthetic test that produced the false claim is the failure mode being recovered from; running it again with different parameters does not help.
- Self-traffic must be filtered or labeled (CI smoke runs, deploy-verification curls, developer testing).

**Execution:**
1. Get the exact merge timestamp of the claim's underlying change from `git log` (UTC).
2. Query the relevant telemetry table at hourly granularity for the last 24 hours.
3. Bucket calls into pre-merge and post-merge windows of equal duration (e.g., 4h pre vs 4h post).
4. Compute the metric the claim asserts (per-call cost, p95 latency, error rate, conversion) for each bucket.
5. Compute the metric's effect size and direction.
6. Produce a structured report covering:
   - Hourly breakdown table marking the merge moment
   - Pre/post comparison summary with n in each bucket
   - Distribution of the underlying behavior (session length, request shape, regional spread) over a longer window (7 days) for context
   - Per-session or per-request effectiveness check that exposes whether the mechanism is actually being exercised
   - Net cost / latency / error impact computed from the actual data, including a "what would it have been without this change" hypothetical for comparison

The Prempawee 2026-04-26 session used `scripts/diagnostic-cache.mjs` for this — see that file as a template.

### Phase 2 — Decision Gate (predefined criteria, no options)

**Goal:** Translate Phase 1 data into one action. The agent does NOT present options or recommendations; the data picks the gate, the agent executes.

**Gate format:** Foreman pre-defines the gate criteria when invoking the protocol. Each gate has explicit numeric thresholds. The agent reads Phase 1 data, checks which gate's criteria are met, and announces the gate. If multiple gates' criteria are met, the most-conservative gate wins (preserve more, change less).

**Example gate set from Prempawee 2026-04-26:**

```
GATE A — Mechanism is working, aggregate just lags
  Criteria: post-merge hourly metric improved >=30% vs pre-merge
            AND mechanism's effectiveness signal is positive
  Action:   Update spec to honest finding ("verified by hourly
            comparison; aggregate dashboard will lag for one
            full window cycle"). No code change. Proceed to
            Phase 5.

GATE B — Mechanism is wrong tool for this traffic
  Criteria: median session shape makes mechanism inapplicable
            OR mechanism's effectiveness signal is negative
            OR no measurable hourly improvement
  Action:   Revert the change. Open a fix/revert-* branch.
            Then proceed to Phase 3 to ship the alternative.

GATE C — Mixed: mechanism helps some traffic, hurts other
  Criteria: long sessions / hot regions show benefit; short
            sessions / cold regions show waste
  Action:   Conditional application of the mechanism. Open
            fix/conditional-* branch with the gating logic.
            Then Phase 4 verification under partial rollout.
```

The exact gates are situation-specific. The pattern is: pre-defined criteria, no options, agent executes the gate that matches the data.

### Phase 3 — Execution per Gate

**Goal:** Ship the gate's action. Standard development discipline applies (one logical change per commit, full test gate, watchlist E2E if applicable).

**For revert gates:** open a `fix/revert-*` branch. Reverts are NOT free — they leave the codebase in a known-good state but lose any incidental improvements that piggybacked on the original change. Document what was reverted and why.

**For replacement gates (e.g., model swap):** open a `feat/*` branch. Run any pre-merge eval gates the spec requires (e.g., the 30-prompt EN+TH eval Foreman pre-locked for the Haiku swap). Pass criteria are non-negotiable.

**For docs-only gates:** see Phase 5 directly.

### Phase 4 — Production Verification (mandatory after any merge)

**Goal:** Prove the gate's action actually moved production state.

**Constraints:**
- No synthetic tests. Use only real-traffic telemetry.
- "Verified" requires: metric improvement >= 20% AND n >= 20 calls in the post-deploy window (or higher thresholds set by Foreman).
- Wait at least 30 minutes after deploy for traffic to accumulate before measuring.
- Compare the post-deploy 30-minute window against the same 30-minute window from yesterday or the day before, NOT against earlier today (which may have its own pre-merge contamination).

If criteria not met: do NOT claim "verified". Document the gap honestly and either iterate (re-enter Phase 1) or revert.

### Phase 5 — Docs (only after Phase 4 confirms)

**Goal:** Update the relevant spec / commit / AUDIT_LOG entry to reflect the honest reality.

**Required updates:**
- Delete any fabricated "verified" sections from the spec
- Replace with "Phase 1 findings" + "Phase 4 production results" sections
- Add a "Lessons learned" subsection with the architect mistake pattern that produced the original false claim
- If a new pattern was discovered, append it as a candidate kit rule (file in `.pawee/extensions/` with `proposed-kit-version: ...`) for upstream consideration

The docs PR is the closing artifact. Once it merges, the protocol exits.

## Guardrails

- **No synthetic re-verification.** The synthetic test that produced the false claim is the failure mode being recovered from. Running it again is not progress.
- **No 30-day aggregate comparisons.** Within the first cycle of a rolling window, the aggregate is dominated by pre-fix data and structurally cannot reflect today's change.
- **No options presented at the gate.** The data picks the gate. The agent's job is to read the data accurately and execute, not to present a menu.
- **No "I think it's working but the dashboard is wrong" without proving the dashboard math.** If you suspect the dashboard is misleading, prove it by reading the dashboard code (cost formula, window boundaries) and showing exactly which step lags. "The dashboard is wrong" is a strong claim; back it with the same rigor as any other production-state claim.
- **Self-traffic must be filtered.** CI smoke runs and verification curls inflate post-merge samples. Either filter at query time or compute the metric with and without self-traffic and report both numbers.
- **The protocol exits via Phase 5, not via Phase 4 success.** Even if Phase 4 confirms "verified", the docs update in Phase 5 is mandatory — the original claim was wrong, the spec/commit/AUDIT_LOG must reflect that.

## Worked Example — Prempawee Portfolio, 2026-04-26

**Original false claim (PR #55, 2026-04-26T07:52Z):** "PR 1 cache fix verified — 78% cost reduction." Verification methodology: 6 rapid same-session curls against `/api/chat`, observed 86–100% cache hit ratio, computed per-request cost as $0.0065 vs $0.030.

**Foreman intervention (~1 hour later):** Checked `/admin/finops`, found cache hit rate 3.8%, projected/mo $340.54 (HIGHER than $306 baseline), today's per-call cost $0.0348 (essentially identical to yesterday). Issued STOP directive with Phase 1/2/3/4/5 structure and pre-defined gates A/B/C.

**Phase 1 execution:** Wrote `scripts/diagnostic-cache.mjs`. Queried `analytics.token_usage`. Found:
- Q1: hourly per-call cost dropped −49.6% post-PR#53 (4h pre vs 4h post)
- Q2: 99.9% sessions had 1 user message (median=1, max=5)
- Q3: 0 within-session write→read pairs (misleading metric — cache amortizes across sessions)
- Q4: cache_read 124× cache_write across post-PR#54 sample → caching net positive

**Phase 2 gate decision:** GATE A. Criteria met: hourly improvement >30% (-49.6%) AND mechanism effective (cache_read >> cache_write). Action: docs-only correction.

**Phase 3:** Skipped (Gate A is docs-only).

**Phase 4:** N/A for Gate A (no merge to verify; the prior merge already succeeded mechanically). The 24h cost trend monitoring was scheduled for next-day check.

**Phase 5 (PR #56):** Deleted fabricated "Verified result" section from spec. Replaced with Phase 1 findings + caveats + lessons learned. Logged architect mistake pattern: "Synthetic test verification is not production economic verification — always check FinOps dashboard with same-day pre/post comparison before claiming a cost optimization worked." Promoted to kit Rule 20 in PR #57.

**Total recovery cost:** ~2 hours including Phase 1 diagnostic + spec correction + protocol documentation. The cost of the original fabrication (had it been allowed to stand) would have been: misinformed PR 2 deferral logic, false confidence in unrelated future cost claims, and an AUDIT_LOG entry that would have permanently misrepresented the cache-fix's impact. The protocol's overhead is dramatically lower than the cost of unrecovered fabrication.

## Relationship to Other Rules

- **Rule 20** (Verify Production Claims with Production Data) is the prevention. This protocol is the recovery.
- **Rule 16** (Architect Verify Before Claim) covers the architect-level discipline. This protocol covers the post-claim contradiction case.
- **KARPATHY §13** (Avoid Overengineering) applies in Phase 3 — when executing a revert or replacement, do the minimum that addresses the gate's criteria. Don't bundle "while we're here" cleanups.

When a project adopts this protocol, the natural next addition is a session-opener checklist item ("if today involves a production-impact claim, the verification methodology must be production-tier per Rule 20; if a prior claim is contradicted, the Production Contradiction Protocol applies").
