---
number: 7
title: "One Logical Change Per Commit — Never Bundle Unrelated Hardening"
tags: [UNIVERSAL, GIT_DISCIPLINE]
applies_to: [generic]
universal: true
source: prempawee KARPATHY.md §7
incident_refs: [AUDIT_LOG §20, AUDIT_LOG §21]
added_in_kit: 1.0.0
---

# 7. One Logical Change Per Commit — Never Bundle Unrelated Hardening

## Verbatim from Source

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

## Generic Pattern (Strategy B Abstraction)

**Principle:** Commits are the unit of bisect. Bundling unrelated logical changes into one commit destroys the ability to isolate which change broke something, turning a 15-minute bisect into a multi-day forensic exercise.

**When to apply:** Any multi-change work item where two or more changes could logically ship independently. Especially applies to "while I'm in here, let me also..." additions, security hardening bundles, and cleanup-alongside-feature patterns.

**How to apply (stack-agnostic):**
- Create a feature branch before committing anything.
- Commit each logical change independently, with a verification step between each.
- Each commit should pass its own verification bar (compile, tests, runtime smoke appropriate to the change).
- Merge as separate commits, or squash at merge time only after all commits verified green independently.
- Acceptable exception: purely mechanical refactors across many files (rename a type, remove a deprecated import) may be a single commit because the change is uniform.

**Stack-specific manifestations:**
- **generic:** Any VCS-backed project. The math is universal — isolated commits pay ~15 min each to verify; a bundled commit that breaks costs hours of incident response plus days of bisect.
