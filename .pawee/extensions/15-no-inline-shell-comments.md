---
number: 15
title: "No Inline # Comments in Architect Shell Commands"
tags: [UNIVERSAL, GIT_DISCIPLINE]
applies_to: [generic]
universal: true
source: kit AUDIT_LOG §3 (Phase 2.2b)
incident_refs: [AUDIT_LOG §3]
added_in_kit: 1.0.1
---

# 15. No Inline # Comments in Architect Shell Commands

## Problem Statement

Architect-provided shell command blocks (in prompts dispatched from the Architect to the Builder) must NOT contain inline `# comment` text on the same line as a command. Comments must live on dedicated preceding lines, or be omitted.

### Rationale

`zsh` (the default shell on macOS since Catalina) does **not** enable `interactive_comments` in interactive mode by default. When a command like

```
echo "hello"  # inline comment
```

is pasted into a zsh prompt, zsh parses `#` as a command token — not as a comment marker — and emits:

```
zsh: command not found: #
```

This noise contaminates the Builder's output, obscures real errors, and violates the clean-report contract Builders owe Foreman.

`bash` (the default on most Linux distributions and in non-interactive contexts like CI) handles `#` as a comment in interactive mode. Commands written for `bash` users may pass through silently, but the same commands on a `zsh` Foreman machine fail loudly.

**Dedicated comment lines** (`#` at column 0 or after leading whitespace, with the command on a separate line) work universally in both `bash` and `zsh`, as well as in non-interactive shells.

## Source Incidents

Three recorded incidents on the kit's own build, all on Foreman's zsh shell:

1. **Phase 1.9 (Release prep)** — CHANGELOG literal-pattern guard test used an inline `# comment` in a bash pipeline. Produced `zsh: command not found: #` noise during the pre-commit verification step.
2. **Phase 2.1 (SKIP message fix verification)** — A `git log -2 --oneline` + `git status` verification command-chain with inline comments triggered the same noise post-merge.
3. **Phase 2.2a (`setopt interactive_comments` verification)** — An `echo "hello"  # comment` probe intended to verify the zsh option change produced the same error before the option took effect.

Per KARPATHY §13 ("3+ incidents of the same pattern = promote to rule"), the pattern is now formalized.

See `AUDIT_LOG.md` §3 for the full incident record with resolution and promotion note.

## Examples

### WRONG (do not dispatch to Builder)

```bash
git status  # check working tree
git log -1 --oneline  # verify last commit
echo "hello"  # smoke test
```

On zsh, each line produces `zsh: command not found: #` noise in addition to the intended output.

### RIGHT (safe on zsh and bash)

```bash
# check working tree
git status

# verify last commit
git log -1 --oneline

# smoke test
echo "hello"
```

Comments on dedicated lines are correctly parsed by both shells and do not contaminate output.

### Also acceptable

```bash
git status
git log -1 --oneline
echo "hello"
```

Omitting the comments entirely is always safe.

## Generic Pattern (Strategy B Abstraction)

**Principle:** When dispatching executable content (shell commands, scripts) from one role to another across potentially heterogeneous shell environments, do not embed explanatory metadata in syntax forms whose meaning differs across those environments. Keep metadata on dedicated structural elements that parse identically everywhere.

**When to apply:** Any time the Architect drafts a shell command block for the Builder to execute. Especially applies when the target shell is unknown (Foreman may have customized their shell) and the command will be pasted into an interactive prompt.

**How to apply (stack-agnostic):**
- Move all comments to dedicated lines starting with `#` at column 0 (or after leading whitespace).
- Do not write `<command>  # <inline explanation>` on the same line, even if the command is obvious.
- If explanatory context is critical, consider writing it as a markdown paragraph before the code block rather than inside it — this is always safe and also reads better in prompts.
- When in doubt, omit the comment — the command's intent should be inferable from surrounding prose in the prompt.

**Stack-specific manifestations:**
- **generic:** Any shell-dispatch workflow benefits from the dedicated-comment-line rule. Applies equally to zsh, bash, dash, fish (which treats `#` as comment but still differs on other syntax), and non-interactive CI shells.

## Enforcement

**Architect-side (primary):** The Architect checks own prompts before dispatch. If a prompt contains an inline `# comment` pattern, rewrite before sending.

**Builder-side (fallback):** If a prompt slips through and the Builder observes `zsh: command not found: #` in its own output, the Builder reports the noise in its final report. The Architect fixes the prompt for next time.

**Audit-side (escalation):** If this rule is repeatedly violated beyond the 3 incidents that led to its creation, log a new AUDIT_LOG entry and consider whether the rule needs to become an automated pre-dispatch lint or a mandatory template header.
