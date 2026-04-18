# Claude Code SOP — Detailed Playbook

Operational guide for working with Claude Code on the Prempawee Portfolio project.

This document is the **detailed version** of the ritual stated in `CLAUDE.md`. Use `CLAUDE.md` as the daily opener; reference this document when you need templates, specific workflows, or edge-case handling.

---

## Table of Contents

1. [Session Opener — Detailed](#1-session-opener--detailed)
2. [Risk Classification Matrix](#2-risk-classification-matrix)
3. [Verification Signal Hierarchy](#3-verification-signal-hierarchy)
4. [Prompt Templates by Task Type](#4-prompt-templates-by-task-type)
5. [Red Flags Checklist](#5-red-flags-checklist)
6. [Recovery Procedures](#6-recovery-procedures)
7. [Session Closer — Detailed](#7-session-closer--detailed)

---

## 1. Session Opener — Detailed

The `CLAUDE.md` version is the 5-step ritual. This is the expanded version with rationale and example dialogue.

### Opening dialogue template

When you start a new session, open with this explicit handshake:

```
You are working on prempawee-portfolio. Before taking the task:

1. Confirm you have read:
   - CLAUDE.md (this project's entry point)
   - KARPATHY.md (universal + Prempawee-specific coding rules)
   - AGENTS.md (browser-verification mandate + watchlist files)

2. Summarize in 2-3 sentences what you understand as the most important
   constraints for this project.

3. Then wait. I will give you the task next.
```

**Why this works:** Forces Claude Code to demonstrate context loading before committing to any action. If the summary is wrong or thin, you know the context didn't stick — re-instruct before tasking.

### Expected summary contents (if context loaded correctly)

A good summary should mention at minimum:
- Watchlist files require Playwright E2E before merge
- Never enable `experimental.sri`
- One logical change per commit (no bundling)
- `proxy.ts` (not `middleware.ts`) for Next.js 16
- Edge runtime requires awaited async
- Portfolio-data.ts is single source of truth for portfolio content

If three or more of these are missing, repeat the context-loading step.

---

## 2. Risk Classification Matrix

Every task falls into one of four risk levels. Classification determines the verification gate.

### LOW Risk

**Examples:**
- Fix typo in README
- Update portfolio-data.ts content (text, URLs, prices)
- Add a new feature to an existing test
- Update documentation

**Gate:**
- `npm run typecheck`
- `npm run test` (related unit tests)

**Commit style:** Single commit, descriptive message.

### MEDIUM Risk

**Examples:**
- New React component that doesn't touch layout/page/proxy
- New API route that doesn't replace existing auth/rate-limit
- New SQL migration that adds columns (not schema-breaking)
- New utility function in `src/lib/`

**Gate:**
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Manual local smoke test of affected feature

**Commit style:** Feature branch. PR with description. Merge after local verification.

### HIGH Risk — Watchlist Files

**Per AGENTS.md, these files require mandatory browser verification:**
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/proxy.ts` / `src/middleware.ts`
- `src/components/chat.tsx`
- `next.config.ts` (ANY change to `experimental.*` flags)
- Any CSP directive change

**Gate:**
- All MEDIUM checks
- `BASE_URL=http://localhost:3000 npm run test:e2e` — must pass
- Deploy to Vercel preview
- `BASE_URL=<preview-url> npm run test:e2e` — must pass on preview
- Visual QA on mobile (375px) and desktop (1440px)

**Commit style:** Feature branch. PR. Include `git diff` review before merge. AUDIT_LOG entry required.

### CRITICAL Risk

**Examples:**
- Schema migration that drops columns or changes types
- Authentication logic change
- New `experimental.*` flag in Next.js config
- Framework major version upgrade (Next.js 16 → 17)
- CSP policy change beyond additive directives
- Any change documented in AUDIT_LOG as a known failure mode

**Gate:**
- All HIGH checks
- Additional parallel review via subagents (see [Prompt Template E](#e-critical-risk-change))
- Rollback plan documented before deploy
- Manual test on multiple browsers (Chrome + Safari + Firefox)
- AUDIT_LOG entry mandatory — even if nothing breaks

**Commit style:** Dedicated feature branch. Force squash on merge for clean revert path. Explicit go/no-go decision from human.

---

## 3. Verification Signal Hierarchy

When Claude Code claims "it works," ask which signal was observed. Signals below have documented failure modes where they reported green but the site was broken.

### Weak Signals (do not accept as sole proof for HIGH/CRITICAL changes)

| Signal | Why it's weak |
|---|---|
| `npm run build` succeeds | Only proves compilation. Runtime behavior untested. |
| `npm run typecheck` clean | Only proves types. Semantic bugs invisible. |
| Deploy to Vercel succeeded | Only proves upload + SSR render. Hydration untested. |
| `curl` returns 200 OK | Only proves server responded. Browser JS untested. |
| Response HTML contains expected content | Only proves SSR. Hydration may have silently failed (§20). |
| Supabase conversation table has new rows | May be bot probes (§20 — 148 bot conversations passed as "real traffic"). |
| Sentry is quiet | May mean no errors — OR may mean hydration failed before error handlers attached. |

### Strong Signals

| Signal | Why it's strong |
|---|---|
| Playwright test clicks a button and verifies response | Proves JS hydrated, events attached, state updated. |
| Manual browser interaction completes full flow | Proves the exact user experience. |
| Real user completes a conversion | Proves end-to-end including payment/lead/etc. |
| Multiple days of production traffic without issue reports | Proves robustness across real-world variance. |

### The Rule

For any HIGH/CRITICAL change, require **at least one Strong Signal** before declaring done. Weak signals can be used to fail-fast (catch obvious issues early) but cannot be used to prove success.

---

## 4. Prompt Templates by Task Type

### A. Low-Risk Change

```
TASK: [describe what you want]

Constraints:
- This is LOW risk per docs/CLAUDE_CODE_SOP.md §2
- Touch only the files directly needed
- After change, run: npm run typecheck && npm run test

Show me the diff before committing.
```

### B. Medium-Risk Change

```
TASK: [describe what you want]

Classification: MEDIUM risk per docs/CLAUDE_CODE_SOP.md §2

Workflow:
1. First, propose a plan with verify steps (per Karpathy §4). Do NOT code yet.
2. Wait for my approval.
3. Create feature branch: feat/<short-description>
4. Implement on branch
5. Run: npm run typecheck && npm run test && npm run build
6. Show me git diff
7. After my approval, push branch

Constraints:
- One logical change per commit
- Match existing style
- No speculative abstractions
```

### C. High-Risk Change (Watchlist File)

```
TASK: [describe what you want]

Classification: HIGH risk per docs/CLAUDE_CODE_SOP.md §2 — touches watchlist file.
Per AGENTS.md, Playwright E2E is MANDATORY before merge.

Workflow:
1. Propose plan with verify steps. Do NOT code yet.
2. Wait for my approval.
3. Before coding: write a Playwright test describing expected behavior.
   Run it — it should fail (nothing built yet). Show me the failing test.
4. After my approval, implement the change.
5. Run full suite:
     npm run typecheck && npm run test && npm run build
     BASE_URL=http://localhost:3000 npm run test:e2e
6. Show me git diff + test output.
7. After my approval, push.
8. After Vercel preview deploys, run:
     BASE_URL=<preview-url> npm run test:e2e
9. Show me preview test output.
10. Only after both test runs pass will we merge.

Constraints:
- Preserve CSP nonce pipeline (do not add inline scripts)
- Preserve connection() call in page.tsx if touching it
- Do NOT enable experimental.sri (see AUDIT_LOG §21)
- One logical change per commit
```

### D. RAG / Knowledge Base Update

```
TASK: Update RAG knowledge base to add/modify [content]

Classification: MEDIUM risk (does not touch watchlist files)

Workflow:
1. Show me the current relevant entries in scripts/refresh-knowledge-base.mjs
2. Propose the new/modified entries
3. After approval:
   a. Update the script
   b. Run: npm run kb:refresh
   c. Run: npm run kb:embed (if semantic RAG is active)
   d. POST to /api/revalidate to clear the 5-min cache
   e. Run: npm run eval:rag — check score doesn't regress
4. Show me before/after eval scores

Constraints:
- Never invent testimonials or client names
- Keep facts verifiable (URLs, metrics we can prove)
- Maintain bilingual EN/TH parity
```

### E. Critical-Risk Change

```
TASK: [describe what you want]

Classification: CRITICAL risk per docs/CLAUDE_CODE_SOP.md §2

Before I give you this task, launch 3 parallel subagents to investigate:

Subagent 1 — Code reviewer:
"Analyze the files that would need to change for [task]. Identify all 
risks. Bisect the proposed change into the smallest safe units."

Subagent 2 — Upstream research:
"Search GitHub issues, Next.js changelog, Vercel docs, and Anthropic 
SDK release notes for any known issues related to [task]. Report any 
documented pitfalls."

Subagent 3 — Platform check:
"Verify behavior on Vercel edge runtime specifically. Check for CDN 
re-encoding implications if the task involves any build-time hashing, 
integrity, or byte-exact features."

Report findings from all 3 before proposing the plan. If any subagent 
flags a documented failure mode, pause and bring it to me before 
proceeding.

After subagent review and my approval, proceed with HIGH-risk workflow 
(see template C), with these additions:
- Document rollback plan in AUDIT_LOG before deploying
- Multi-browser test (Chrome + Safari + Firefox)
- AUDIT_LOG entry mandatory, even on success
```

### F. Debugging A Reported Issue

```
ISSUE: [describe what's broken]

Workflow:
1. Reproduce the issue. Show me the exact steps and observed behavior.
2. Do NOT propose a fix yet.
3. Read relevant AUDIT_LOG sections — has this class of issue occurred before?
4. If yes, reference the prior section number.
5. Write a failing test that captures the bug (per Karpathy §4).
6. Only after the test reliably reproduces the issue, propose a fix.
7. Apply the fix. Test should now pass.
8. Run full regression suite to verify no other tests broke.
9. Add an AUDIT_LOG entry if this was a new class of issue.
```

---

## 5. Red Flags Checklist

If any of these appear during a session, stop and raise the concern before proceeding.

### During Planning

- [ ] Claude Code proposes a change that bundles 3+ separable concerns
- [ ] Plan does not include verify steps
- [ ] Plan assumes API shapes without citing the version
- [ ] Plan touches watchlist file without mentioning Playwright
- [ ] Plan would enable a flag documented as "do not enable" in AUDIT_LOG

### During Execution

- [ ] Claude Code writes 200+ lines where 50 would do (Karpathy §2)
- [ ] New "flexibility" or configuration was added that wasn't requested
- [ ] Adjacent code was "improved" beyond task scope (Karpathy §3)
- [ ] Pre-existing dead code was deleted without asking
- [ ] Fire-and-forget promises appear in edge handlers

### During Verification

- [ ] Success is claimed based only on build/typecheck passing
- [ ] Deploy is proposed without local Playwright run first
- [ ] E2E test is skipped "because dev testing was fine"
- [ ] Sentry is quiet so "it must be working"
- [ ] Supabase has new rows so "users are happy" (could be bots)

### Post-Change

- [ ] AUDIT_LOG was not updated after a non-trivial change
- [ ] Rollback path was not documented for CRITICAL-risk changes
- [ ] Deploy went direct to main without preview verification

---

## 6. Recovery Procedures

When something goes wrong, these are the standard recovery paths.

### Recovery 1: Hydration failure detected

**Symptoms:** Site renders (SSR ok), but buttons don't respond; no JS errors visible.

**Procedure:**
1. Do NOT try to fix forward. Revert first.
2. `git log --oneline -20` — find the last known-good commit
3. `git revert <breaking-commit>` (safer than reset for main)
4. Push revert immediately
5. Verify with `BASE_URL=https://prempawee.com npm run test:e2e`
6. Only after site is restored, investigate the root cause
7. Document in AUDIT_LOG as new section with findings

**Why this order:** Hydration failures are customer-facing outages. Revert time = lost revenue. Never debug on production.

### Recovery 2: E2E Test Fails On Preview But Not Locally

**Symptoms:** `test:e2e` passes locally, fails on Vercel preview URL.

**Procedure:**
1. Likely platform-specific behavior (per KARPATHY.md §9)
2. Check: does the failure involve CDN-cached responses, byte-exact content, or build-time hashes?
3. Run Playwright in headed mode locally pointed at preview:
   `BASE_URL=<preview> npx playwright test --headed`
4. Observe where hydration fails / clicks don't register
5. Check Vercel deployment logs for anything unusual
6. Before fixing: read AUDIT_LOG §21 and similar entries
7. Fix with full preview re-verification, not blind retry

### Recovery 3: Sentry Suddenly Spikes

**Symptoms:** Error count in Sentry goes up after deploy.

**Procedure:**
1. Open the most recent deployment's diff
2. Cross-reference Sentry error signature with recent changes
3. If signature matches a line in recent diff → revert that change
4. If signature is novel → investigate with dedicated session
5. Do not mass-ignore errors in Sentry. Each unique signature deserves a decision.

### Recovery 4: RAG Eval Score Drops

**Symptoms:** `npm run eval:rag` score regresses after knowledge base update.

**Procedure:**
1. Compare diff of knowledge_base table entries
2. Likely causes:
   - New content contradicts existing content
   - Removed content that was supporting other answers
   - Embedding drift (if semantic RAG is on)
3. Fix: add clarifying entries rather than editing existing ones (additive is safer)
4. Re-run `npm run kb:embed` if embedding drift
5. Don't merge until eval score returns to baseline or better

---

## 7. Session Closer — Detailed

At the end of every session, do these three things before disconnecting.

### 7.1 Commit Hygiene

- All changes committed with descriptive messages
- Branch pushed to GitHub (even if not merged yet)
- No local-only "work in progress" stashed silently (use a WIP commit on the branch instead)

### 7.2 Documentation Updates

For any non-trivial change, add:

- **AUDIT_LOG.md entry** — what was changed, what was verified, any patterns learned
- **OPERATIONS.md update** — if a new env var, secret, or runbook was introduced
- **SSS_STATUS.md update** — if an axis moved from ⚠️ to ✅ (or vice versa)

### 7.3 Handoff Note

At the end of the session, ask Claude Code to produce a handoff note:

```
Produce a handoff note with:
1. What was accomplished this session
2. What is still pending (with file locations + context)
3. Any red flags or concerns the next session should address
4. Any AUDIT_LOG entries added and why
```

Save this note. The next session's opener will benefit from reading it.

---

## Appendix A: Quick Reference Card

Print this and pin it to your monitor.

```
BEFORE CODE:
1. Load context (CLAUDE.md, KARPATHY.md, AGENTS.md)
2. Classify risk (LOW/MEDIUM/HIGH/CRITICAL)
3. Plan with verify steps
4. Wait for approval

DURING CODE:
5. Surgical changes only (Karpathy §3)
6. One logical change per commit
7. Match existing style

VERIFICATION LADDER:
  weak → strong
  build < typecheck < deploy < SSR 200 < Supabase rows < Playwright click < real user

HIGH-RISK (watchlist) MINIMUM:
  typecheck + test + build + e2e local + e2e preview

RED FLAGS:
  - "just make it work"
  - bundled changes
  - skip E2E "because dev was fine"
  - enable flag on do-not-list
  - fire-and-forget in edge

AFTER CODE:
- AUDIT_LOG entry
- Handoff note
```

---

## Appendix B: Common Mistakes and Their AUDIT_LOG References

| Mistake | Evidence | Avoid by |
|---|---|---|
| Using middleware.ts on Next.js 16 | §18 | Use proxy.ts; read Next.js 16 docs first |
| Forgetting await in edge handler | §19 | Use `await Promise.all([...])` in onFinish |
| Enabling experimental.sri | §21 | Don't. Ever. Re-check if #91633 closes. |
| Bundling CSP hardening changes | §20 | One flag per commit with Playwright verify |
| English-only trigger words in chat tools | §11 | Always include Thai examples in tool descriptions |
| Hardcoded breadth claims in system prompt | §14 | Read from RAG / portfolio-data.ts, never hardcode |
| z.enum without fallback in tool schemas | §10 | Use `.optional()` + default, or overview/detail split |
| Fire-and-forget token logging | §19 | Await all DB writes before onFinish returns |

---

**Version:** 1.0
**Last updated:** 2026-04-18
**Companion files:** CLAUDE.md · KARPATHY.md · AGENTS.md · AUDIT_LOG.md
**Philosophy:** Karpathy's foundation + Prempawee's hard-won patterns.
