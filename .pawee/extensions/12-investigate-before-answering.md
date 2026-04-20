---
number: 12
title: "Investigate Before Answering (Opus 4.7)"
tags: [OPUS_4_7, INVESTIGATION]
applies_to: [generic]
universal: true
source: prempawee KARPATHY.md §12
incident_refs: [AUDIT_LOG §28]
added_in_kit: 1.0.0
---

# 12. Investigate Before Answering (Opus 4.7)

## Verbatim from Source

**Source:** Anthropic official guidance for Opus 4.7

Opus 4.7 uses tools less often than 4.6 by default and reasons more before acting. This is generally better, but for code questions about specific files, it can lead to speculation when reading was warranted.

**Recommended prompt for code questions:**

```
Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer - give grounded and hallucination-free answers.
```

**Connection to AUDIT_LOG §28:** Numbering collision was caused by partial-file read. Always read full files before append operations.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Models that "reason more, tool-use less" improve on most tasks but can speculate about code they haven't opened. For code-specific questions, require the model to read the file before answering.

**When to apply:** Any task that asks the model to reason about or modify specific files, functions, or logic. Especially applies before append operations, refactors, or claims about existing behavior — anywhere a file-wide invariant must be preserved.

**How to apply (stack-agnostic):**
- State explicitly that the model must read referenced files before answering.
- Require full-file reads for operations that depend on existing structure (appends, renames, renumberings, moves).
- Partial-file reads (head, tail, grep) are fine for quick lookups but insufficient for operations that must preserve file-wide invariants.
- If the model claims something about code without citing a read, treat the claim as speculation until verified.

**Stack-specific manifestations:**
- **generic:** Any LLM-assisted coding workflow. Applies to IDE integrations, slash commands, agentic sessions, and long-running background agents. The principle scales from one-file changes up to multi-repo refactors.
