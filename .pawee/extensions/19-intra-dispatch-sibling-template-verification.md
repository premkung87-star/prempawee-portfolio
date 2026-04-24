---
number: 19
title: "Intra-Dispatch Sibling-Template Verification"
tags: [UNIVERSAL, ARCHITECT_DISCIPLINE, VERIFICATION, TEMPLATE]
applies_to: [generic]
universal: true
source: wiki/code/audit/ (Phase C, Mistakes #20 and #22)
incident_refs:
  - wiki/code/audit/2026-04-23-mistake-20-sibling-template-drift.md
  - wiki/code/audit/2026-04-23-mistake-22-sibling-drift-recurrence.md
added_in_kit: 2.0.0-beta.3
---

# 19. Intra-Dispatch Sibling-Template Verification

## Problem Statement

Architect MUST run literal H2 cross-comparison between all
structural siblings in the same dispatch before sending. When a
dispatch contains verbatim content for two or more sibling files
(audit files, rule files, agent files, documentation templates),
Architect enumerates H2 headers in each draft, runs `diff` or
equivalent literal comparison, fixes mismatches before sending.

For dispatches with 50 or more lines of verbatim multi-sibling
content, Architect switches to specification-based authorship with
locked shared H2 list communicated explicitly to Builder.

### Rationale

§17 covers per-file structural-presence verification: "did I
include the right H2 sections in THIS file?" §18 covers per-file
rendered-output verification: "will any of my prose lines in THIS
file accidentally become an H2 section?" §19 covers inter-file
structural-parallel verification: "do my N sibling files share
identical H2 tokens?"

Three disciplines, three targets, identical failure mode
(Architect asserts compliance from memory without literal check).
Only the verification scope differs. §17 verifies structural
presence inside one file. §18 verifies structural absence of
phantom headers inside one file. §19 verifies structural
parallelism across N sibling files. §16 / §17 / §18 / §19 now
form the complete Architect-verification quartet.

## Source Incidents

Two documented incidents in Phase C plus meta-recurrence:

1. **Mistake #20 (2026-04-23, Phase C C.6b):** Architect's
C.6b dispatch wrote mistake-16 and mistake-17 audit files
simultaneously. Mistake-16 was drafted with H2 section
`## Significance`; mistake-17 was drafted with H2 section
`## Pattern significance`. Same-dispatch structural siblings
with diverging H2 tokens. Architect believed the two H2 names
were synonymous and thus structurally parallel. Caught by Builder
post-commit sibling-diff.

2. **Mistake #22 (2026-04-23, Phase C C.6b1):** Architect's
C.6b1 dispatch wrote mistake-20 (which documented the #20
sibling-template-naming drift class) and mistake-21 (which
documented a different drift class). Mistake-20 was drafted with
single `## Root cause`; mistake-21 was drafted with three-way
split `## Root cause (Architect)`, `## Root cause (Builder)`,
`## Joint failure note`. 1-H2 vs 3-H2 sibling mismatch.
META-RECURRENCE: the dispatch writing these files was about
sibling-template-naming drift itself, reproducing the exact class
of drift it was documenting. Caught by Builder post-commit
sibling-diff plus Architect C.6b1-revised self-check.

Per KARPATHY §13 (three-plus incidents → universal rule), §19
promotes on two direct instances plus meta-recurrence as
confidence multiplier. Identical evidence shape to §18's
promotion pattern. Meta-recurrence counts as a confidence
multiplier because a pattern recurring in a document whose
primary purpose is to document the pattern proves the drift is
stable and not context-dependent.

## Examples

### WRONG (do not dispatch to Builder)

```text
Verbatim content for two sibling audit files in one dispatch.

File A (mistake-16.md) H2 sequence:
  1. `## Context`
  2. `## What happened`
  3. `## Significance`

File B (mistake-17.md) H2 sequence:
  1. `## Context`
  2. `## What happened`
  3. `## Pattern significance`
```

Architect believed `Significance` and `Pattern significance` were
semantically equivalent and thus structurally parallel. Architect
did not run `diff` between the two drafts. Parallelism was a
false assertion: sibling audit files must share literal H2 tokens,
not just semantic equivalence, because future grep-based cross-
file queries must target one token.

### RIGHT (safe to dispatch)

Before sending, Architect runs
`diff <(grep '^## ' A) <(grep '^## ' B)` literally. Diff is empty
(identical H2 sequences). If non-empty, Architect normalizes one
side to the other (typically the stronger-precedent form) before
sending. For N > 2 siblings, Architect runs the pairwise diff for
every pair, or equivalently uses a shared H2 list as the
reference for all N drafts.

### Also acceptable (authorship pivot for large multi-sibling)

Per §18's authorship pivot, for dispatches with 50 or more lines
of verbatim multi-sibling content, Architect spec-dispatches
with an explicit locked shared H2 list: "These N files share H2
sequence: H2-A, H2-B, H2-C, ..." communicated to Builder. Builder
authors all N files from the same H2 list in-repo. Sibling cross-
comparison happens automatically at authorship time because all
N files are generated from one spec, eliminating §19 violation
surface.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Architect dispatches containing verbatim content
for N ≥ 2 structural siblings (same-category files in same
dispatch) must guarantee H2-structural parallelism across all N.
§17 covers within-file sectional correctness; §19 covers between-
file sectional consistency. Both are pre-dispatch disciplines
with identical failure mode (Architect asserts compliance from
memory without literal check).

**When to apply:** Any dispatch containing verbatim content for
two or more files in the same structural category where spec or
peer precedent dictates shared H2 structure (audit files, rule
files, agent files, documentation templates, promotion stories).

**How to apply:**

- Identify all sibling files in the dispatch scope.
- For each sibling pair, run literal H2 diff (grep-based or
  equivalent mental token-level comparison).
- If any mismatch, normalize before sending. Typically choose
  the stronger-precedent form; if siblings have no precedent
  yet, choose one and apply to all N.
- For 50 or more lines of verbatim multi-sibling content: spec-
  dispatch with a locked shared H2 list, delegating body
  authorship to Builder.
- Justified exceptions (e.g., joint-failure audit with 3-H2
  split vs single-failure audit with 1-H2) MUST be explicitly
  documented in the exception file's prose AND cross-referenced
  in the peer files' prose, so future readers understand the
  deliberate divergence.

**Stack-specific manifestations:**

- **generic:** Applies regardless of stack. Structural
  parallelism is a convention-layer concern independent of code
  language or framework.

## Enforcement

**Architect-side (primary):** Before sending any dispatch
containing verbatim content for 2+ structural siblings, Architect
runs literal H2 cross-comparison between all siblings. For multi-
sibling dispatches with 50 or more lines of verbatim content,
Architect switches to specification-based authorship with a
locked shared H2 list instead.

**Builder-side (fallback):** When Builder receives verbatim
content for siblings with diverging H2 tokens, Builder HALTs at
pre-commit and reports the sibling-diff drift. Builder does not
silently normalize Architect's output.

**Audit-side (escalation):** Every §19 violation caught at
Builder HALT or post-commit sibling-diff is logged as a new audit
entry in `wiki/code/audit/`. A fourth violation after §19
promotion triggers a KARPATHY §13 review: is §19's wording
insufficient? Should spec-dispatch with a locked H2 list be
mandatory for all multi-sibling dispatches regardless of size?
