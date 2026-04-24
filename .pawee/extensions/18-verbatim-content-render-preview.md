---
number: 18
title: "Verbatim Content Render Preview Before Dispatch"
tags: [UNIVERSAL, ARCHITECT_DISCIPLINE, VERIFICATION, MARKDOWN]
applies_to: [generic]
universal: true
source: wiki/code/audit/ (Phase C, Mistakes #23 and #24)
incident_refs:
  - wiki/code/audit/2026-04-23-mistake-23-markdown-syntax-collision.md
  - wiki/code/audit/2026-04-23-mistake-24-markdown-recurrence-handoff-doc.md
added_in_kit: 2.0.0-beta.3
---

# 18. Verbatim Content Render Preview Before Dispatch

## Problem Statement

Architect MUST mentally render verbatim Markdown content as final
rendered output before sending the dispatch to Builder, checking
for syntax collisions created by line-wrapping interactions with
prefix-sensitive tokens (heading markers, bullet markers, ordered
list markers, blockquote markers, fenced code markers). Source-
text editing-pass verification is necessary but NOT sufficient;
rendered-output inspection is additionally required for any
dispatch containing 50 or more lines of verbatim Markdown content.

For dispatches containing fewer than 50 lines of verbatim
Markdown, inline-token backtick-wrap audit of the draft text is
sufficient without full render preview.

### Rationale

§17 covers structural claim verification about dispatch content:
"did I include the right H2 sections?" §18 covers semantic claim
verification about how parsers will interpret the draft: "will
any of my prose lines accidentally BECOME an H2 section?" Both
are pre-dispatch disciplines with identical failure mode
(Architect asserts compliance from memory without literal
render-state check). Only the verification target differs. §17
verifies structural presence (required sections included). §18
verifies structural absence (no phantom sections accidentally
created by line-wrap interactions).

When Architect mentions structural Markdown tokens in prose
without wrapping them in inline-code backticks, source-text width
and line-wrapping can push those tokens to line-start position
where Markdown parsers read them as literal structure. Result is
phantom sections polluting the table of contents, malformed
lists, and silent rendering drift that source-text review does
not catch.

## Source Incidents

Two documented incidents in Phase C plus meta-recurrence:

1. **Mistake #23 (2026-04-23, C.6b1-revised followup):**
Architect's verbatim Mistake #22 content referenced peer H2
section names in Resolution prose. Three unescaped inline
mentions of the level-2 heading marker in the prose wrapped to
line-start at source width. Markdown parser rendered Mistake #22
with 9 H2 sections instead of the canonical 8, with a phantom
section polluting the H2 table of contents. Caught by Builder
post-commit audit.

2. **Mistake #24 (2026-04-23, Session 1 wrap):** Architect's
Session 1 handoff doc prose discussed Mistake #23's drift class
itself. Five unescaped inline mentions of the level-2 heading
marker appeared in handoff-doc prose. One wrapped to line-start
at source width, creating a spurious H2 section in the handoff
doc. META-RECURRENCE: the document whose subject was Mistake #23
reproduced Mistake #23's exact drift class. Caught by Architect
post-draft audit before commit (no Builder round trip).

Per KARPATHY §13 (three-plus incidents → universal rule), §18
promotes on two direct instances plus meta-recurrence as
confidence multiplier. Meta-recurrence counts as a confidence
multiplier because a pattern recurring in a document whose
primary purpose is to document the pattern proves the drift is
stable and not attention-dependent.

## Examples

### WRONG (do not dispatch to Builder)

```text
Verbatim content for mistake-22.md Resolution section:

After normalization, sibling H2 lists for mistakes #16, #20, #21
are all canonically ## Root cause, matching peer precedent.
Mistake #17 retains the justified split (## Root cause Architect
plus ## Root cause Builder plus ## Joint failure note) per its
joint-failure nature.
```

The inline mentions of the heading-marker sequences are bare (no
backtick wrapping). When prose wraps at source-text width, any
mention pushed to start a line creates a phantom H2 heading in
the rendered document.

### RIGHT (safe to dispatch)

```text
Verbatim content for mistake-22.md Resolution section:

After normalization, sibling H2 lists for mistakes #16, #20, #21
are all canonically `## Root cause`, matching peer precedent.
Mistake #17 retains the justified split (`## Root cause
Architect` plus `## Root cause Builder` plus `## Joint failure
note`) per its joint-failure nature.
```

Every inline mention of a structural Markdown token is wrapped in
inline-code backticks. Line-wrapping at any source width now
cannot produce a prose line that begins with a bare heading
marker. Parser reads the backtick-wrapped form as inline code,
not as structure.

### Also acceptable (authorship pivot for large verbatim)

For dispatches with 50 or more lines of verbatim Markdown, per
the Phase C Session 2 authorship pivot (Mistake #23 Lessons #3),
Architect delegates verbatim authorship to Builder by providing
specification only: file path, H2 section list with purpose
statements, source facts, cross-reference constraints,
verification commands. Builder authors the Markdown bodies
in-repo where render preview is free via git-diff and GitHub
preview. This strictly reduces §18 risk surface because Architect
never produces rendered Markdown in the dispatch text itself.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Architect's dispatches containing verbatim Markdown
content can fail in two structural ways — wrong headers present
(covered by §17) or prose that accidentally becomes headers
(covered by §18). Both are contract terms Architect cannot honor
if challenged unless verified pre-dispatch. §18 closes the
rendered-output gap §17 leaves open.

**When to apply:** Any dispatch containing verbatim Markdown
prose that mentions structural Markdown tokens (heading markers,
bullet markers, ordered list markers, blockquote markers, fenced
code markers).

**How to apply:**

- Identify every prose mention of a structural Markdown token in
  the draft text.
- Wrap each mention in inline-code backticks. The bare
  heading-marker sequence becomes the backtick-wrapped form
  (the token surrounded by single backticks).
- For multi-token patterns inside parentheticals or lists, wrap
  each mention individually. Do not rely on a single early-wrap
  to cover subsequent mentions — parsers honor backticks per
  occurrence, not per mention set.
- Before sending, mentally render the draft at source-text width:
  ask "if this prose line wrapped at column N, would it
  accidentally begin with a structural token?"
- For dispatches with 50 or more lines of verbatim Markdown:
  switch to specification-based authorship (see Examples / Also
  acceptable), delegating body authorship to Builder.

**Stack-specific manifestations:**

- **generic:** Applies regardless of stack. Markdown-syntax
  collision is a rendering-layer concern independent of code
  language or framework.

## Enforcement

**Architect-side (primary):** Before sending any dispatch
containing verbatim Markdown content, Architect audits every
prose mention of structural Markdown tokens for inline-code
backtick wrapping. If any mention is bare, Architect wraps it
before sending. For dispatches with 50 or more lines of verbatim
Markdown, Architect switches to specification-based authorship
instead.

**Builder-side (fallback):** When Builder receives verbatim
Markdown content with bare structural tokens in prose, Builder
HALTs at pre-commit and reports the drift. Builder does not
silently escape Architect's output.

**Audit-side (escalation):** Every §18 violation caught at
Builder HALT or post-commit audit is logged as a new audit entry
in `wiki/code/audit/`. A fourth violation after §18 promotion
triggers a KARPATHY §13 review: is §18's wording insufficient?
Should specification-based authorship be mandatory for all
dispatches containing verbatim Markdown regardless of size?
