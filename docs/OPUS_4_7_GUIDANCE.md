# Opus 4.7 Guidance for Prempawee Workflow

**Source:** https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
**Captured:** 2026-04-20
**Purpose:** Tactical reference for tuning Prempawee workflow to align with Claude Opus 4.7 behavior changes from 4.6

---

## Critical Behavioral Changes: 4.6 → 4.7

### 1. Literal Instruction Following

Opus 4.7 interprets prompts more literally than 4.6, particularly at lower effort levels.

**Behavior:**
- Will NOT silently generalize from one item to another
- Will NOT infer requests not explicitly made
- Architect prompts must specify scope explicitly ("apply to every X" not "apply to the X")

**Connection to AUDIT_LOG:** §26 (branch protection blocked direct push) was caused by literal interpretation of "ship to main" prompt — model executed exactly what was asked, not what was implied.

### 2. Reduced Tool Use, Increased Reasoning

Opus 4.7 uses tools less often than 4.6 and reasons more before acting.

**Behavior:**
- Defaults to single response over fanning out
- May reason over partial context rather than reading additional files
- Produces better results in most cases, but specific instruction needed when tool use is desired

**Connection to AUDIT_LOG:** §26-§28 numbering collision (initially proposed as §22-§24) likely caused by 4.7 reading partial AUDIT_LOG.md (tail) rather than full file before designing append. Architect prompts must explicitly require full-file reads before append operations.

### 3. Reduced Subagent Spawning

Opus 4.7 spawns fewer subagents by default than 4.6.

**Behavior:**
- Defaults to in-response work over subagent delegation
- Steerable via explicit prompts when parallelization is wanted

**Implication for VerdeX:** The 9-agent orchestration system needs explicit prompts post-Opus 4.7 migration to maintain parallel execution patterns.

### 4. Better Code Review (Recall + Precision)

Opus 4.7 has 11pp better recall on hard bug-finding evals based on real Anthropic PRs.

**Behavior:**
- Higher precision (fewer false positives)
- Higher recall (more bugs found)
- BUT: may filter findings if prompt says "only report high-severity" — does same depth investigation, reports fewer findings

**Recommendation:** Use coverage-first prompts in code review. See "Recommended Prompts" section below.

### 5. Stronger Default Design Style

Opus 4.7 has consistent default house style: warm cream/off-white backgrounds (~#F4F1EA), serif display type (Georgia, Fraunces, Playfair), italic accents, terracotta/amber accent.

**Behavior:**
- Reads well for editorial, hospitality, portfolio briefs
- Feels off for dashboards, dev tools, fintech, healthcare, enterprise apps
- Persistent default — generic instructions ("don't use cream") shift to different fixed palette, not variety

**Mitigation:**
- Specify concrete alternatives with hex codes
- Or use "propose 4 options first" pattern before building

---

## Recommended Effort Levels per Risk Class

Map effort parameter to Risk Matrix (per CLAUDE.md):

| Risk Level | Effort | Rationale |
|---|---|---|
| LOW | medium | Cost-efficient for typo fixes, content updates |
| MEDIUM | high | Balanced for new components, API routes |
| HIGH | xhigh | Default for coding (per Anthropic recommendation), watchlist file changes |
| CRITICAL | max | Schema migrations, auth changes, framework upgrades |

**Token budget:** Set max output tokens to 64k for xhigh/max effort to allow room for reasoning and subagent calls.

---

## 4 Recommended Prompts to Adopt

These are Anthropic-recommended verbatim prompts for Opus 4.7. Use as-is in CLAUDE.md or KARPATHY.md updates.

### Prompt 1: Code Review Coverage

For use during code review sessions to prevent silent filtering of findings:

```
Report every issue you find, including ones you are uncertain about or consider low-severity. Do not filter for importance or confidence at this stage - a separate verification step will do that. Your goal here is coverage: it is better to surface a finding that later gets filtered out than to silently drop a real bug. For each finding, include your confidence level and an estimated severity so a downstream filter can rank them.
```

### Prompt 2: Investigate Before Answering

For use to prevent code hallucination and force file reads:

```
Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer - give grounded and hallucination-free answers.
```

### Prompt 3: Avoid Overengineering

For use to keep solutions minimal and focused:

```
Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused:

- Scope: Don't add features, refactor code, or make "improvements" beyond what was asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.

- Documentation: Don't add docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident.

- Defensive coding: Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).

- Abstractions: Don't create helpers, utilities, or abstractions for one-time operations. Don't design for hypothetical future requirements. The right amount of complexity is the minimum needed for the current task.
```

### Prompt 4: Balance Autonomy and Safety

For use to require confirmation on destructive or hard-to-reverse actions:

```
Consider the reversibility and potential impact of your actions. You are encouraged to take local, reversible actions like editing files or running tests, but for actions that are hard to reverse, affect shared systems, or could be destructive, ask the user before proceeding.

Examples of actions that warrant confirmation:
- Destructive operations: deleting files or branches, dropping database tables, rm -rf
- Hard to reverse operations: git push --force, git reset --hard, amending published commits
- Operations visible to others: pushing code, commenting on PRs/issues, sending messages, modifying shared infrastructure

When encountering obstacles, do not use destructive actions as a shortcut. For example, do not bypass safety checks (e.g. --no-verify) or discard unfamiliar files that may be in-progress work.
```

---

## Action Items for Phase 0b (PR #12)

The following changes will be applied to Prempawee workflow files in PR #12:

### CLAUDE.md Updates
- [ ] Add "Recommended Effort" column to Risk Matrix table
- [ ] Update Session-Opening Ritual Step 1: explicit "read FULL file before any append operation"
- [ ] Add note: "Architect prompts must be literal-explicit. Opus 4.7 follows literally, not generatively. State scope explicitly (every X, not the X)."
- [ ] Bump version to 1.2 with Last updated date

### KARPATHY.md Part 2 Additions
- [ ] Section: Code Review Coverage (Prompt 1 verbatim)
- [ ] Section: Investigate Before Answering (Prompt 2 verbatim)
- [ ] Section: Avoid Overengineering (Prompt 3 verbatim)
- [ ] Section: Balance Autonomy and Safety (Prompt 4 verbatim)

### AUDIT_LOG.md Append
- [ ] §29: Anti-laziness prompts need tuning for Opus 4.7
- [ ] §30: Effort parameter calibration per risk class

---

## What NOT to Change

Per Anthropic recommendations and existing system strengths:

- **Risk classification structure** — already aligned with effort tiers, well-designed
- **AUDIT_LOG / SESSION_N pattern** — designed perfectly for Opus 4.7's long-horizon reasoning strength
- **Branch protection** — explicit guardrail aligns with "Balance Autonomy and Safety" principle
- **Foreman-Architect-Builder pattern** — three-tier verification proven in Session 3 (caught 2 architect mistakes)
- **English-only Claude Code prompts** — already adopted, aligns with "literal interpretation" recommendation

---

## Reading Notes

This section is for personal observations as you read official docs and apply patterns. Add timestamped entries when new insights emerge from sessions.

### 2026-04-20 Initial Capture
- Confirmed Session 3 lessons (§26 branch protection, §28 numbering collision) trace to Opus 4.7 literal interpretation behavior
- Validated existing workflow design aligns with Opus 4.7's strengths (long-horizon, state tracking, multi-context windows)
- Identified gap: anti-laziness prompts in KARPATHY.md may over-trigger on Opus 4.7 vs 4.6

---

## Source References

- Anthropic prompting best practices: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- What's new in Opus 4.7: https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7
- Migration guide: https://platform.claude.com/docs/en/about-claude/models/migration-guide

---

**Status:** Reference document, used by Phase 0b (PR #12) to drive specific workflow file updates. Not auto-imported by CLAUDE.md.
