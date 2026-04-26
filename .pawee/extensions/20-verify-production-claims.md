---
number: 20
title: "Verify Production Claims with Production Data"
tags: [UNIVERSAL, VERIFICATION, PRODUCTION_DISCIPLINE]
applies_to: [generic]
universal: true
source: Prempawee Portfolio session 2026-04-26 (PR #55 fabrication, PR #56 correction)
incident_refs:
  - docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md (Phase 1 findings + Lessons learned)
added_in_kit: 2.0.0-beta.4
---

# 20. Verify Production Claims with Production Data

## Problem Statement

Architect / Builder / Foreman MUST NOT assert a production-impact claim (cost reduction, latency improvement, error-rate change, conversion lift, throughput gain, cache hit rate, model quality delta) based on **synthetic verification**. Synthetic tests prove a mechanism *works*. They do NOT prove the mechanism *delivers the claimed impact under real traffic shape*.

A claim's verification methodology MUST match the claim's class. Three tiers:

| Claim class | Example claim | Required verification |
|---|---|---|
| **Code path** | "This branch handles the empty-input case" | Unit test, integration test, single curl exercising the code path |
| **Mechanism** | "Anthropic prompt caching is wired correctly" | Synthetic test that exercises the mechanism once (one cache write + one cache read) |
| **Production impact** | "This change reduces cost by 78%" | Time-windowed pre/post against real production data, hourly granularity, n ≥ 20, exclude self-traffic (CI smoke tests, deploy-verification curls, developer testing) |

Asserting a production-impact claim with mechanism-tier verification is the canonical anti-pattern this rule prevents.

### Rationale

Synthetic tests are run under best-case conditions: same session, rapid consecutive requests, single warm region, no traffic dilution. Real production traffic has structurally different shape — single-message sessions arriving hours apart, distributed across regions, mixed cold/warm isolates, contaminated with CI and synthetic developer traffic. A mechanism that works perfectly under best-case conditions can deliver zero or negative impact under real traffic. The verification gap is not that the mechanism failed — it's that the wrong question was asked.

The cost of mis-classifying a verification is high: it produces a falsely-confident "shipped and verified" status that propagates into commit messages, PR descriptions, design specs, and AUDIT_LOG entries. Subsequent decisions (whether to ship a follow-up optimization, whether to deprecate the old code path, whether to invest in further work) are made against a fabricated baseline. Recovery requires explicit retraction, honest re-measurement, and a docs PR that admits the error — costs that vastly exceed the cost of running the correct verification the first time.

### Addendum — Rolling-Window Aggregates Lag Same-Day Fixes

Production dashboards (FinOps, latency, error rates) typically display aggregates over rolling windows: 24-hour, 7-day, or 30-day. **Within the first cycle of a window, the aggregate is dominated by pre-fix data** and will mislead any "fix verification" reading. A 30-day cost dashboard checked 30 minutes after a fix deploys reflects 29 days, 23 hours, 30 minutes of pre-fix state.

This is the same concept as the core rule applied to a different measurement context: the dashboard's aggregate is a perfectly valid measurement of the claim "what was the cost over the last 30 days?" It is NOT a valid measurement of "did today's fix work?" Asking the wrong measurement to answer the right question is the same anti-pattern.

**Mitigation:** For verifying a same-day fix, query the underlying telemetry table at hourly granularity and compute pre-merge vs post-merge buckets explicitly. Wait one full window cycle before trusting the aggregate trend line. Alternatively, tag rows with a `code_version` label so the dashboard can stratify pre/post automatically.

## Source Incidents

**Prempawee Portfolio session, 2026-04-26 (canonical anti-pattern → recovery):**

1. **PR #55 fabrication.** PR #53 deployed a chat-route prompt-cache fix at 07:11 UTC. PR #54 deployed an analytics-field correction at 07:41 UTC. At 07:52 UTC, Architect (Claude Opus 4.7) authored PR #55 claiming "PR 1 cache fix verified — 78% cost reduction." Verification methodology: 6 rapid same-session curl requests against `prempawee.com/api/chat`, observed 86–100% cache hit ratio in `analytics.token_usage`, computed per-request cost as ~$0.0065 vs ~$0.030 baseline. Spec was updated with "Verified result" section and merged.

2. **Foreman intervention.** Within ~1 hour, Foreman opened `/admin/finops` and observed: cache hit rate 3.8%, projected/mo $340.54 (HIGHER than the $306 pre-fix baseline), today's per-call cost $0.0348 (essentially identical to yesterday's $0.0344). Foreman issued a STOP directive citing "synthetic verification is not production economic verification" and prescribed a 5-phase recovery (see `production-contradiction-protocol.md`).

3. **PR #56 correction.** Phase 1 diagnostic against real production data (`scripts/diagnostic-cache.mjs`) found:
   - Hourly per-call cost did drop −49.6% post-PR#53 (4h pre vs 4h post comparison) → caching IS working
   - 99.9% of sessions in last 7 days had exactly 1 user message → within-session caching impossible
   - cache_read 124× cache_write across post-PR#54 sample → caching amortizes across sessions
   - Dashboard's $340.54/mo projection is misleading because the rolling-window aggregate is dominated by 29 days of pre-fix data; cost formula itself is correct
   
   Decision: GATE A (caching works, aggregate lags, no code change). Spec corrected, lessons logged, fabricated "Verified result" deleted.

The incident matched all three failure modes simultaneously: (a) wrong-tier verification (synthetic for a production-impact claim), (b) rolling-window aggregate misread, (c) failure to filter self-traffic from analytics (CI smoke + verification curls inflated the post-fix sample). All three are addressed by this rule.

Per KARPATHY §13, a single incident with three independent failure modes meets the promotion threshold (each mode would individually warrant a rule; together they constitute a class of error worth canonizing as one umbrella rule).

## Examples

### WRONG (do not assert)

```text
"PR #53 cache fix verified — 78% cost reduction confirmed."

Verification: ran 6 curl requests against /api/chat in a same-session
loop, observed cache_read tokens > 0 in analytics.token_usage, computed
per-request cost as $0.0065 vs $0.030 baseline.
```

This is mechanism-tier verification (does the cache_control marker land on the right block, does Anthropic acknowledge it). It does NOT verify that the mechanism reduces cost under real traffic. Real traffic has 99.9% single-message sessions, sparse arrival rate, distributed across regions — none of which are tested by 6 same-session curls.

### WRONG (also)

```text
"Cost is HIGHER post-fix — 30-day projection shows $340.54 vs $306
baseline. Caching made things worse, revert immediately."
```

This is a rolling-window aggregate misread. The 30-day window includes 29 days of pre-fix data. Within the first day after deploy, the aggregate is structurally incapable of reflecting the fix's impact. The correct read is hourly pre/post on the same day.

### RIGHT (production-impact claim with production-impact verification)

```text
"PR #53 hourly per-call cost dropped from $0.0385 (4h pre-merge) to
$0.0194 (4h post-merge) — 49.6% reduction across n=64 calls.

Verification: queried analytics.token_usage with hourly granularity,
bucketed by merge timestamp 2026-04-26T07:11:36Z (PR #53 live ~07:13
after Vercel deploy). Excluded self-traffic via session_id prefix
filter.

Caveats acknowledged:
- Sample contaminated by CI browser-smoke runs (~9 calls per merge × 3
  merges) and verification curls (~9 calls)
- Real-user-only traffic is sparse (~5-15 calls/hour)
- 24h trend monitoring required before claiming the magnitude holds for
  steady-state real traffic
- Dashboard 30d aggregate will continue to show old expensive numbers
  until the rolling window catches up — this is expected, not a regression"
```

This explicitly states the verification methodology, the data window, the n, and the limitations. A reader can replicate the measurement and judge whether the claim is supported. Future-self can re-verify against fresh data.

### Also acceptable (mechanism-tier claim, mechanism-tier verification)

```text
"AI SDK v6 cache_control marker correctly attaches to system message
when passed as SystemModelMessage object — verified by reading
node_modules/@ai-sdk/anthropic/dist/index.mjs:2086-2092 and observing
cache_creation_input_tokens > 0 on a single test request."
```

This is a mechanism claim, verified at the mechanism tier. Honest scope. Does NOT claim the mechanism saves money in production.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Verification is contractual. Every claim asserts an answer to a specific question. The question and the verification method must reference the same measurement. Synthetic tests answer "does the mechanism work?" Production data answers "did the production state change?" These are not interchangeable.

**When to apply:** Any time a commit message, PR description, design spec, or AUDIT_LOG entry asserts that something *changed* in production (cost, latency, error rate, conversion, quality). The trigger is the verb tense and the production-state framing — "reduces cost", "improves latency", "raises hit rate", "drops errors". Contrast with mechanism-state framing — "wires the cache correctly", "handles the empty case", "validates input shape" — which only require mechanism-tier verification.

**How to apply (stack-agnostic):**

1. **Classify the claim.** Is it a code path claim, a mechanism claim, or a production-impact claim? If multiple, use the highest tier's verification.
2. **Match the methodology.** Code path → unit/integration test. Mechanism → one synthetic exercise. Production impact → time-windowed pre/post against real production telemetry, hourly granularity, n ≥ 20, exclude self-traffic.
3. **State the methodology in the claim.** A claim without methodology is unfalsifiable and indistinguishable from fabrication. The reader must be able to replicate the measurement.
4. **Acknowledge caveats explicitly.** Sample contamination, small n, sparse traffic, rolling-window lag — name them in the same paragraph as the claim, not in a separate "if you're curious" footnote.
5. **For aggregate-window measurements:** wait one full window cycle (24h for 24h windows, 7 days for 7-day, 30 days for 30-day) before trusting the trend line. Within the first cycle, query underlying telemetry at finer granularity.

**Stack-specific manifestations:**

- **generic:** Any project that ships changes affecting production telemetry — cost dashboards, latency panels, conversion funnels, error budgets — benefits from the methodology-classification discipline.

## Enforcement

**Architect-side (primary):** Before drafting a commit message / PR description / spec section that asserts a production-state change, Architect runs the classification step. If the claim is production-impact tier, Architect rejects mechanism-tier evidence and either runs the production-impact verification or downgrades the claim to "mechanism verified, production impact pending 24h trend."

**Builder-side (fallback):** When a Builder is asked to author a "verified result" section based on synthetic tests alone, Builder HALTs and reports the methodology mismatch. Builder does not silently produce a fabricated verification.

**Foreman-side (intervention):** When production data contradicts a "verified" claim, Foreman invokes the Production Contradiction Protocol (see `.pawee/extensions/production-contradiction-protocol.md`). The protocol forces a 5-phase recovery: diagnostic, decision gate, execution, verification, docs. No options presented; the data picks the gate.

**Audit-side (escalation):** Each fabricated-verification incident logged in AUDIT_LOG triggers a review of why the methodology classification failed. After 3 incidents, escalate to: pre-merge linter that scans commit messages and PR descriptions for production-impact verbs ("reduces", "improves", "drops", "raises") + checks for accompanying methodology disclosure.
