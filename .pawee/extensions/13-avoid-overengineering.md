---
number: 13
title: "Avoid Overengineering (Opus 4.7)"
tags: [OPUS_4_7, SIMPLICITY]
applies_to: [generic]
universal: true
source: prempawee KARPATHY.md §13
incident_refs: []
added_in_kit: 1.0.0
---

# 13. Avoid Overengineering (Opus 4.7)

## Verbatim from Source

**Source:** Anthropic official guidance for Opus 4.7

Opus 4.7 has a tendency to overengineer by creating extra files, adding unnecessary abstractions, or building flexibility that was not requested. Reinforces KARPATHY Part 1 §2 (Simplicity First) and §3 (Surgical Changes).

**Recommended prompt:**

```
Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused:

- Scope: Don't add features, refactor code, or make "improvements" beyond what was asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.

- Documentation: Don't add docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident.

- Defensive coding: Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).

- Abstractions: Don't create helpers, utilities, or abstractions for one-time operations. Don't design for hypothetical future requirements. The right amount of complexity is the minimum needed for the current task.
```

## Generic Pattern (Strategy B Abstraction)

**Principle:** Scope discipline — the right amount of complexity is the minimum needed for the current task. Models optimized for proactivity may overshoot the scope; prompt them to stay within the stated bounds.

**When to apply:** Any coding task with a defined, bounded scope. Especially before refactors, bug fixes, or small feature additions where "while I'm in here..." urges tend to expand the diff.

**How to apply (stack-agnostic):**
- Scope: only make changes directly requested or clearly necessary. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.
- Documentation: do not add docstrings, comments, or type annotations to code you didn't change. Only add comments where logic isn't self-evident.
- Defensive coding: do not add error handling for scenarios that can't happen. Trust internal code and framework guarantees. Validate only at system boundaries (user input, external APIs).
- Abstractions: do not create helpers or utilities for one-time operations. Do not design for hypothetical future requirements.

**Stack-specific manifestations:**
- **generic:** Any coding task, any stack. Pairs with Karpathy baseline §2 (Simplicity First) and §3 (Surgical Changes) — those older rules remain the foundation; this Opus 4.7-era rule adds explicit anti-overengineering language the newer model specifically benefits from.
