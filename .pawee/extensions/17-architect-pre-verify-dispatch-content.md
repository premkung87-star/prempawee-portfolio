---
number: 17
title: "Architect Pre-Verify Dispatch Content"
tags: [UNIVERSAL, ARCHITECT_DISCIPLINE, VERIFICATION]
applies_to: [generic]
universal: true
source: kit AUDIT_LOG §10 (Phase B, 11 instances across 4 contexts)
incident_refs: [AUDIT_LOG §10]
added_in_kit: 2.0.0-beta.2
---

# 17. Architect Pre-Verify Dispatch Content

## Problem Statement

Architect MUST verify dispatch verbatim content matches established kit
specifications (CONVENTIONS.md required sections, peer file template
structure, prior dispatch contract terms) BEFORE sending the dispatch to
Builder. For documents with five or more sections, literal counting of
section headers in Architect's own draft text is required. Mental
walk-through is sufficient only for known templates with fewer than five
sections.

### Rationale

§16 covers verification of technical facts about the repository (file
paths, line numbers, contents) — claims about external state. §17 covers
verification of the dispatch prompt itself against internal kit
conventions — claims about Architect's own output. Both are pre-dispatch
discipline; the failure mode is identical (Architect asserts compliance
from memory without literal check), but the verification target differs.
§16 verifies the world; §17 verifies the prompt that describes the work
in the world.

When Architect drafts verbatim content (agent files, rule files,
documentation templates) and fails to literally enumerate required
sections, Builder either commits the malformed file then catches the
gap during post-write inspection — wasting one round trip — or misses
the gap entirely, requiring later remediation PR. Either path degrades
kit build velocity. The fix is upstream: Architect counts headers in
own draft before sending.

## Source Incidents

1. **Phase B head-marketing dispatch (AUDIT_LOG §10, Mistake #10):**
Architect drafted head-marketing.md verbatim content omitting the
required `## Identity` first body section. All 14 prior heads followed
the `# H1 → ## Identity → body → ...` pattern per CONVENTIONS.md.
Builder caught the §16-style drift and HALTed; Architect issued PATCH
dispatch.

2. **Phase B accumulated drift (AUDIT_LOG §10, 10 additional instances
across heads, pawee-internal agents, specialists, CLAUDE.md edits, and
CONVENTIONS.md updates):** Same root cause across all 10 — Architect
mentally walked through dispatch content believing template compliance,
did not literally count H2 sections in own draft text against
CONVENTIONS spec or prior peer files. Eleven instances total within
Phase B, spanning four distinct dispatch contexts.

Per KARPATHY §13, eleven incidents of the same umbrella pattern
(Architect asserts dispatch-content compliance from memory without
literal section count) far exceed the three-incident promotion
threshold.

## Examples

### WRONG (do not dispatch to Builder)

```text
PHASE X.Y — Create new agent file matching CONVENTIONS.md template.

Verbatim content:

# Head of Foo

You are the Head of Foo, responsible for ...

## Mission
## Inputs
## Outputs
[... 7 more sections ...]
```

Architect asserts the verbatim block is CONVENTIONS-compliant. Architect
did not literally count H2 headers against CONVENTIONS spec. Required
`## Identity` is missing as first body section. Builder either commits
the malformed file or HALTs at inspection — both paths waste cycles.

### RIGHT (safe to dispatch)

Before drafting verbatim content, Architect runs an internal checklist
for any document with five or more sections:

1. List required sections per spec (CONVENTIONS.md, peer file
   precedent, or prior dispatch contract).
2. Enumerate H1/H2 headers in own draft text by literal scan.
3. Diff list (1) vs list (2). If mismatch, fix draft before sending.

For documents under five sections (short rules, simple agent
appendices), mental walk-through is acceptable.

### Also acceptable (when template is novel)

When verbatim content is large or template is not yet established,
Architect dispatches a Scout TASK first (per §22 scout-before-changes)
asking Builder to print the canonical template structure (e.g.,
`grep -n "^#" <peer-file>`), then drafts §17-compliant content from
the confirmed structure.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Architect's dispatches contain two classes of claims —
claims about the repository (covered by §16) and claims about the
dispatch's own structural compliance with kit conventions (covered by
§17). Both are contract terms Architect cannot honor if challenged
unless verified pre-dispatch.

**When to apply:** Any dispatch containing verbatim file content (agent
files, rule files, CLAUDE.md edits, CONVENTIONS.md edits, ORG_CHART.md
edits, template documents) where the file must conform to an
established kit convention.

**How to apply:**

- Identify the spec the verbatim content must satisfy (CONVENTIONS.md,
  peer file precedent, prior dispatch's stated requirements).
- For documents with five or more sections: literally enumerate section
  headers in own draft (count H1/H2/H3 by line scan), compare against
  spec list, fix mismatches before sending.
- For documents under five sections with known template: mental
  walk-through acceptable.
- When spec is novel or template not yet established: dispatch a Scout
  TASK to confirm canonical structure before drafting.

**Stack-specific manifestations:**

- **generic:** Verbatim content discipline applies regardless of stack.
  The specific specs (CONVENTIONS.md, peer file conventions) are
  kit-internal; the discipline of literal-count-before-send is
  universal.

## Enforcement

**Architect-side (primary):** Before sending any dispatch containing
verbatim file content, Architect performs the literal section-count
check for documents with five or more sections. If headers in own draft
do not match spec or peer precedent, Architect revises draft before
sending.

**Builder-side (fallback):** When Builder receives verbatim content
that fails inspection against CONVENTIONS.md or peer files, Builder
HALTs and reports the drift before committing. Builder does not
silently fix Architect's structural omissions.

**Audit-side (escalation):** Every §17 violation caught at Builder
HALT or post-merge audit is logged as a new AUDIT_LOG §N entry. A
fourth violation after §17's promotion triggers a KARPATHY §13 review:
is §17's wording insufficient? Does the threshold (five sections) need
adjustment? Is a tighter sub-rule needed?
