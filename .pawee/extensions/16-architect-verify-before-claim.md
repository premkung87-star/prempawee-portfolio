---
number: 16
title: "Architect Verify Before Claim"
tags: [UNIVERSAL, ARCHITECT_DISCIPLINE, VERIFICATION]
applies_to: [generic]
universal: true
source: kit AUDIT_LOG §2, §4, §5 (Phase 1.8b, 2.2b, 2.3)
incident_refs: [AUDIT_LOG §2, AUDIT_LOG §4, AUDIT_LOG §5]
added_in_kit: 1.0.1
---

# 16. Architect Verify Before Claim

## Problem Statement

Architect MUST verify claimed technical facts (file paths, file existence, bug existence, line numbers, API names, directory contents) against the actual working repository state before asserting them in prompts dispatched to Builder. When verification would be cheap (a single grep, ls, or cat), Architect performs it pre-dispatch. When verification requires Builder's environment (network, credentials), Architect structures the prompt as a split: TASK N investigates and halts, TASK N+1 acts only after Foreman reviews Builder's report.

### Rationale

Architect operates without direct repo access — technical claims drawn from conversation memory decay rapidly as the codebase evolves. Fabricated claims poison Builder's execution: Builder either follows the incorrect claim and produces wrong output, or catches the mismatch and wastes a checkpoint cycle on clarification. Either path degrades the kit's build velocity. The fix is upstream: Architect's verification burden shifts from post-hoc correction to pre-dispatch inspection.

## Source Incidents

1. **Phase 1.8b (AUDIT §2):** Architect's prompt for a sed fix specified `docs/PHILOSOPHY.md` as the target file. The phrase requiring replacement actually lived in `docs/DECISIONS.md`. Builder detected via pre-fix `grep` and extended scope to honor intent, reporting transparently. Commit `05551b3`.

2. **Phase 2.2b (AUDIT §4):** Architect's Task 3 inspection prompt referenced `pawee/extensions/__index.md` and asked Builder to `cat` it. The file had never been created in Phase 1.4a or 1.4b. Builder halted at CHECKPOINT and surfaced the planning gap before the prompt's main scope expanded to accommodate the missing file.

3. **Phase 2.3 (AUDIT §5):** Architect's prompt described a committed `grep ... && exit 1 || echo CLEAN` guard-bypass bug. Four separate greps across the kit found no such committed guard — the pattern Architect remembered was a Phase 1.9 release-time inline execution, never committed. Builder surfaced the mismatch at CHECKPOINT and offered four interpretations; Architect redirected to the real (different) bug Builder had uncovered in `docs/ADOPTION_GUIDE.md:167`.

Per KARPATHY §13, three incidents of the same umbrella pattern (Architect asserts technical fact from memory without verification) meet the promotion threshold.

## Examples

### WRONG (do not dispatch to Builder)

```text
Phase X.Y — Fix the bug in FILENAME.md on line N where we have
the PATTERN. Change it to NEWPATTERN.
```

Architect asserts FILENAME, line N, and PATTERN exist. If any of the three is wrong, Builder either executes incorrectly or spends a round-trip correcting Architect.

### RIGHT (safe to dispatch)

```text
Phase X.Y — TASK 1: Locate the bug.

  grep -rn 'EXPECTED_PATTERN' --include='*.md' <paths>

Report exact file, line number, and 5 lines of context to
Foreman.

CHECKPOINT: HALT after TASK 1. Architect will design the fix
based on the actual code shape.
```

Verification happens inside Builder's round-trip; Architect commits to nothing until Builder's investigation returns.

### Also acceptable (when verification is cheap for Architect)

Before dispatching, Architect asks Foreman to run `ls <path>`, `grep -n PATTERN file`, or `cat file` in the chat, then drafts the prompt against the confirmed state. This is faster than a round-trip when the verification query is trivial and the Foreman is actively responding.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Architect's prompts are contracts that Builder executes under STOP-guard discipline. Every technical claim in a prompt is a contract term. Unverified claims are contract terms the Architect cannot honor if challenged.

**When to apply:** Any prompt that names a file, a line number, an API identifier, a bug description, a committed pattern, or a directory layout. Essentially: any prompt that is more specific than "investigate X and report."

**How to apply (stack-agnostic):**

- If the claim is about file existence: verify with `ls` or `find` before drafting.
- If the claim is about file contents: verify with `grep`, `cat`, or `sed -n 'N,Mp'` before drafting.
- If the claim is about a bug: inspect the actual committed code before describing the failure mode.
- If verification is expensive or requires Builder's environment: structure the prompt as investigate-first with a CHECKPOINT halt, then design the fix in the continuation prompt after Foreman reviews Builder's report.

**Stack-specific manifestations:**

- **generic:** same principle applies to any codebase — the claims and verification commands are specific to the stack, but the discipline is universal.

## Enforcement

**Architect-side (primary):** Before dispatching any prompt with specific technical claims, Architect runs a mental (or literal) checklist: does the claim come from conversation memory alone, or from inspection of the current repo state? If memory alone, either verify now or split the prompt at a CHECKPOINT.

**Builder-side (fallback):** When Builder encounters a claim that doesn't match inspection, Builder HALTs at the nearest reasonable CHECKPOINT and reports the mismatch. Builder does not guess at Architect's intent; Builder surfaces the gap.

**Audit-side (escalation):** Every unverified-claim incident caught at CHECKPOINT is logged as a new AUDIT_LOG §N entry. A fourth incident after §16's promotion triggers a KARPATHY §13 review: is §16's wording insufficient? Is a tighter sub-rule needed?
