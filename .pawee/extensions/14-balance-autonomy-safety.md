---
number: 14
title: "Balance Autonomy and Safety (Opus 4.7)"
tags: [OPUS_4_7, SAFETY]
applies_to: [generic]
universal: true
source: prempawee KARPATHY.md §14
incident_refs: [AUDIT_LOG §26]
added_in_kit: 1.0.0
---

# 14. Balance Autonomy and Safety (Opus 4.7)

## Verbatim from Source

**Source:** Anthropic official guidance for Opus 4.7

Opus 4.7 may take actions that are difficult to reverse or affect shared systems without prompting. Reinforces existing branch protection guardrail at the prompt level.

**Recommended prompt for production work:**

```
Consider the reversibility and potential impact of your actions. You are encouraged to take local, reversible actions like editing files or running tests, but for actions that are hard to reverse, affect shared systems, or could be destructive, ask the user before proceeding.

Examples of actions that warrant confirmation:
- Destructive operations: deleting files or branches, dropping database tables, rm -rf
- Hard to reverse operations: git push --force, git reset --hard, amending published commits
- Operations visible to others: pushing code, commenting on PRs/issues, sending messages, modifying shared infrastructure

When encountering obstacles, do not use destructive actions as a shortcut. For example, do not bypass safety checks (e.g. --no-verify) or discard unfamiliar files that may be in-progress work.
```

**Connection to AUDIT_LOG §26:** Branch protection enforces this at the infrastructure level. This prompt enforces it at the reasoning level. Use both.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Classify every proposed action by reversibility and blast radius. Local reversible actions can run freely; hard-to-reverse or shared-system actions require explicit user confirmation.

**When to apply:** Before any agentic action against version control, shared infrastructure, databases, or external services. Especially applies to destructive operations and actions visible to other people.

**How to apply (stack-agnostic):**
- Local + reversible (editing files, running tests): proceed freely.
- Hard-to-reverse (force-push, hard reset, published-commit amend): ask before proceeding.
- Destructive (delete, drop, rm -rf): ask before proceeding.
- Visible to others (push, PR comment, issue, external message, infrastructure change): ask before proceeding.
- Never use destructive actions as a shortcut to bypass safety checks (no `--no-verify`, no discarding unfamiliar files that may be in-progress work).

**Stack-specific manifestations:**
- **generic:** Pairs well with infrastructure-level guardrails (branch protection rules, RBAC, protected environments, approval workflows). Use both: prompts enforce the discipline at reasoning time; infrastructure enforces it even when the prompt is forgotten or not loaded.
