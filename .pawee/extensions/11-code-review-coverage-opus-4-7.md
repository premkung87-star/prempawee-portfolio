---
number: 11
title: "Code Review Coverage (Opus 4.7)"
tags: [OPUS_4_7, CODE_REVIEW]
applies_to: [generic]
universal: true
source: prempawee KARPATHY.md §11
incident_refs: []
added_in_kit: 1.0.0
---

# 11. Code Review Coverage (Opus 4.7)

## Verbatim from Source

**Source:** Anthropic official guidance for Opus 4.7

When invoking code review (local /review or /ultrareview), use coverage-first prompts to prevent silent filtering of findings. Opus 4.7 follows "be conservative" instructions literally and may drop findings it judges below the stated bar.

**Recommended prompt:**

```
Report every issue you find, including ones you are uncertain about or consider low-severity. Do not filter for importance or confidence at this stage - a separate verification step will do that. Your goal here is coverage: it is better to surface a finding that later gets filtered out than to silently drop a real bug. For each finding, include your confidence level and an estimated severity so a downstream filter can rank them.
```

**Test:** If recall on bug-finding evals dropped after Opus 4.7 migration, this is likely a harness effect from "be conservative" language, not a capability regression.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Modern code-review LLMs follow "be conservative" instructions literally — they will silently drop findings they judge below the stated bar. To preserve recall, prompt for coverage first and filter downstream in a separate step.

**When to apply:** Any automated or LLM-assisted code review step where the model has discretion over which findings to report. Especially for models (like Opus 4.7) that strictly respect user-provided filters rather than generalizing from the spirit of the request.

**How to apply (stack-agnostic):**
- Instruct the reviewer to report every finding, including uncertain or low-severity ones.
- Ask the reviewer to attach a confidence level and estimated severity to each finding.
- Apply filtering in a separate downstream step: human triage, a second LLM with explicit severity rules, or a heuristic.
- If recall drops after a model upgrade, check for "be conservative" or "high-severity only" language in the prompt before suspecting capability regression.

**Stack-specific manifestations:**
- **generic:** Any LLM-assisted code review pipeline benefits from the coverage-first pattern. Applies equally to `/review` slash commands, PR-bot reviews, and ad-hoc model-based audits. Pair with a downstream severity filter to keep the final signal actionable.
