# CLAUDE.md

Entry point for Claude Code on the Prempawee Portfolio project.

This file is intentionally short. It imports the layered guidance files and states the session-opening ritual. For detailed playbooks, see `docs/CLAUDE_CODE_SOP.md`.

---

## Layered Guidance (read in this order)

@KARPATHY.md
@AGENTS.md

**Additional references (not imported but must be consulted when relevant):**
- `AUDIT_LOG.md` — historical incidents + Patterns to Avoid + Pre-Deploy Checklist
- `docs/OPERATIONS.md` — secrets matrix, day-to-day runbooks
- `docs/SSS_STATUS.md` — current state of 10 infrastructure axes
- `docs/CLAUDE_CODE_SOP.md` — detailed workflow playbook, prompt templates, risk classification

---

## Session-Opening Ritual (do this at the start of every session)

Execute these five steps before taking on any task. This ritual takes ~2 minutes and prevents most of the recurring failure modes documented in AUDIT_LOG.

### Step 1 — Load Context
- Re-read this file (CLAUDE.md)
- Confirm the imports above are active (`@KARPATHY.md` and `@AGENTS.md` are loaded)
- Skim the most recent section of `AUDIT_LOG.md` to recall recent incidents

### Step 2 — Classify Task Risk Level
Before accepting the user's task, classify it:

| Risk | Examples | Gate |
|---|---|---|
| **LOW** | Typo fix, content update in portfolio-data.ts, README edit | TypeScript + unit tests |
| **MEDIUM** | New component, new API route, new SQL migration | TypeScript + unit tests + build |
| **HIGH** | Any change to watchlist files (layout.tsx, page.tsx, proxy.ts, chat.tsx, next.config.ts) or CSP directive | + Mandatory Playwright E2E (local + preview) |
| **CRITICAL** | Schema migration, auth change, new experimental flag, framework upgrade | + All above + dedicated feature branch + AUDIT_LOG note |

State the classification explicitly. If the user's task spans risk levels, treat it as the highest level.

### Step 3 — Plan Before Code
Per Karpathy Principle 1: state assumptions, ask when unclear.

Produce a numbered plan with a verify step for each item (per Karpathy Principle 4):
```
1. [Action] → verify: [observable check]
2. [Action] → verify: [observable check]
```

Wait for user approval on the plan. Do not write code yet.

### Step 4 — Execute With Surgical Discipline
Per Karpathy Principle 3: touch only what the task requires.

- One logical change per commit (per KARPATHY.md Part 2 §7)
- Match existing style
- Do not improve adjacent code

### Step 5 — Verify With Signal-Appropriate Strength
Per KARPATHY.md Part 2 §6 — match the verification signal to the change's risk level.

For HIGH/CRITICAL tasks, the minimum bar is:
```bash
npm run typecheck && npm run test && npm run build
BASE_URL=http://localhost:3000 npm run test:e2e
git push
# After Vercel preview deploys:
BASE_URL=<preview-url> npm run test:e2e
```

Only merge if all green.

---

## Red Flags That Stop Work Immediately

If any of these appear, stop and raise to the user before proceeding:

- Task requires bundling 3+ logically-separate changes → propose splitting
- Task would enable a feature on the AUDIT_LOG "do not enable" list (e.g., `experimental.sri`) → refuse and cite §21
- Task requires skipping E2E tests for a watchlist-file change → refuse and cite §20
- Task assumes API shape from memory without version verification → pause and verify
- Task relies on fire-and-forget async in an edge handler → refactor before shipping
- User says "just make it work" without success criteria → ask for verifiable goal

---

## After Any Non-Trivial Change

Update `AUDIT_LOG.md` with a short entry if the change:
- Fixed a previously undocumented failure mode
- Introduced a new pattern worth remembering
- Touched a watchlist file
- Required a rollback

Even a 3-line note is valuable. Future sessions (and other engineers) will thank you.

---

**Version:** 1.0 · **Last updated:** 2026-04-18 · **Philosophy:** Reduce weaknesses before adding features.
