---
number: 10
title: "Observability Before Features"
tags: [UNIVERSAL, OBSERVABILITY]
applies_to: [generic]
universal: true
source: prempawee KARPATHY.md §10
incident_refs: [AUDIT_LOG §20]
added_in_kit: 1.0.0
---

# 10. Observability Before Features

## Verbatim from Source

**If a failure mode can occur and cannot be observed, do not ship the feature.**

Before adding any non-trivial feature, verify:
- Errors in that code path would appear in Sentry (if DSN is set)
- Violations/blocks in that code path would appear in CSP report endpoint
- Relevant user flow is covered by Playwright test
- State changes are logged to the appropriate table (conversations, leads, analytics)

**Rule:** If you find yourself thinking "this probably works, let's deploy and see" — stop. That sentence is the precondition for AUDIT_LOG §20. You cannot "see" silent hydration failures, fire-and-forget drops, or CDN-induced script blocks. Build the observation path first, then the feature.

**Anti-pattern:** Relying on user complaints as your error monitor. By the time a user complains, you've already lost them.

## Generic Pattern (Strategy B Abstraction)

**Principle:** A feature whose failure mode cannot be observed is indistinguishable from a feature that is broken. Build the observation path BEFORE the feature, not after the outage.

**When to apply:** Before shipping any non-trivial feature (new API endpoint, new UI flow, new integration, new scheduled job). The test applies equally to first-time features and modifications to existing ones.

**How to apply (stack-agnostic):**
- For each failure mode the feature could have, ask: which observability surface would catch it? (error tracker, structured log, metric, UI regression test, database row count, user feedback channel.)
- If any failure mode has no observation path, build that path first, then the feature.
- Avoid the anti-pattern "this probably works, let's deploy and see." Silent failures do not surface on their own.
- Relying on user complaints as your error monitor means you've already lost the user.

**Stack-specific manifestations:**
- **generic:** Every stack has observability options (error trackers, log aggregators, metrics platforms, feature-flag platforms, user-feedback channels). Match the observation surface to the failure mode: error tracker for exceptions, log aggregator for control flow, metrics for rate/latency, regression tests for UI, database queries for state integrity.
