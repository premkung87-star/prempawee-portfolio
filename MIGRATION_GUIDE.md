# Migration Guide — Adopting the Layered Claude Code SOP

This guide walks through integrating three new files into the prempawee-portfolio repo without disrupting the existing setup.

## What's Being Added

| File | Purpose | Size |
|---|---|---|
| `KARPATHY.md` | Universal baseline (Karpathy) + Prempawee Extensions | ~8 KB |
| `CLAUDE.md` (replaces existing) | Entry point + session ritual | ~3 KB |
| `docs/CLAUDE_CODE_SOP.md` | Detailed playbook | ~15 KB |

## What's NOT Changing

| File | Status |
|---|---|
| `AGENTS.md` | Untouched — still the project's hard rules |
| `AUDIT_LOG.md` | Untouched — still the historical memory |
| `docs/OPERATIONS.md` | Untouched |
| `docs/SSS_STATUS.md` | Untouched |
| Any source code | Untouched |

## Current State

Your current `CLAUDE.md` is 1 line:
```
@AGENTS.md
```

After migration:
```
(new CLAUDE.md with session ritual + both imports)
@KARPATHY.md
@AGENTS.md
```

## Step-by-Step Migration

### Step 1 — Create a branch
```bash
cd ~/Desktop/prempawee-portfolio
git checkout -b docs/add-karpathy-sop
git status  # should be clean
```

### Step 2 — Place the three files

Copy the three generated files to these locations:

```
prempawee-portfolio/
├── CLAUDE.md               ← REPLACE (was 1 line, now full entry point)
├── KARPATHY.md             ← NEW
└── docs/
    └── CLAUDE_CODE_SOP.md  ← NEW
```

### Step 3 — Verify imports work

The new `CLAUDE.md` uses Claude Code's `@-import` syntax to pull in KARPATHY.md and AGENTS.md. Verify this is working:

```bash
# Open Claude Code in the repo
claude

# In Claude Code, ask:
# "What files have you loaded as context? Summarize the rules you are operating under."

# Expected response should mention:
# - KARPATHY.md (both Part 1 Karpathy and Part 2 Prempawee extensions)
# - AGENTS.md (watchlist files, experimental.sri ban)
# - Session-opening ritual (5 steps)
```

If Claude Code does not mention all three sources, check:
- File paths are correct (KARPATHY.md at repo root, not in docs/)
- `@-import` syntax is on its own line in CLAUDE.md
- No syntax errors in imported files

### Step 4 — Test the ritual

Give Claude Code a small test task that would have previously triggered a Red Flag:

```
Please update the portfolio metrics in portfolio-data.ts to show 
"7 Production Systems" instead of "3 Projects". Also refactor the 
trust ticker display code while you're there since I noticed it 
could be cleaner.
```

**Expected Claude Code behavior (if ritual is working):**
- Classifies as LOW risk (content change to portfolio-data.ts)
- **Pushes back** on the "refactor trust ticker while you're there" part
- Cites Karpathy §3 (Surgical Changes — don't improve adjacent code)
- Proposes to do ONLY the metrics update first
- Asks if the ticker refactor should be a separate task

If Claude Code silently does both without pushing back, the ritual isn't loaded. Re-check imports.

### Step 5 — Commit

```bash
git add CLAUDE.md KARPATHY.md docs/CLAUDE_CODE_SOP.md
git status  # verify only these 3 files
git commit -m "docs: add layered Claude Code SOP (Karpathy + Prempawee extensions)

- KARPATHY.md: Karpathy's 4 universal principles (MIT, attributed)
  plus 6 Prempawee-specific rules derived from AUDIT_LOG §13-§21
- CLAUDE.md: replaced with entry point containing session ritual
  and imports of KARPATHY.md and AGENTS.md
- docs/CLAUDE_CODE_SOP.md: detailed playbook with risk matrix,
  verification hierarchy, prompt templates, red flags

Philosophy: Karpathy baseline + Prempawee project-specific hardening.
Prior CLAUDE.md was 1 line (import AGENTS.md only) — now loads full
layered discipline."
```

### Step 6 — Push and merge

```bash
git push -u origin docs/add-karpathy-sop
```

Create a PR on GitHub. Because this is a documentation-only change, it's LOW risk:
- CI should pass (no code touched)
- No Playwright needed (no watchlist file touched)
- Self-approve and merge

### Step 7 — Update AUDIT_LOG

After merging, add a short entry to AUDIT_LOG.md:

```markdown
## 📚 CLAUDE CODE SOP LAYERED — 2026-04-XX

Adopted Karpathy's CLAUDE.md (49.1k stars, MIT) as Part 1 of new
KARPATHY.md. Added Part 2 with 6 Prempawee-specific rules derived
from §13, §17, §18, §19, §20, §21 patterns.

Replaced prior CLAUDE.md (1-line AGENTS.md import) with entry point
containing session-opening ritual + dual import.

Created docs/CLAUDE_CODE_SOP.md with detailed playbook: risk matrix,
verification signal hierarchy, 6 prompt templates by task type,
red flags checklist, 4 recovery procedures.

Goal: future sessions start with the same discipline every time,
without relying on me to remember every rule in context.
```

## Verification That It's Working

Over the next 3-5 sessions, watch for these positive signals:

✅ Claude Code asks clarifying questions **before** coding, not after mistakes
✅ Claude Code pushes back when you ask for bundled changes
✅ Claude Code proposes plan + verify steps without being prompted
✅ Claude Code refuses to skip Playwright on watchlist-file changes
✅ Claude Code writes smaller, more surgical diffs
✅ When you ask "did it work?" Claude Code cites specific verification, not just "build passed"

Red flags that it's NOT working:

❌ Claude Code jumps to code without stating a plan
❌ Diffs contain "improvements" to code not related to the task
❌ "Deploy succeeded" is given as the only success signal
❌ Multiple unrelated changes in one commit
❌ When pushed back, Claude Code forgets the rules by the next session

If red flags appear, check:
- Is CLAUDE.md still being loaded at session start?
- Did someone accidentally revert CLAUDE.md to the 1-line version?
- Are you starting sessions with the opening handshake from SOP §1?

## Maintenance

### When Karpathy's repo updates

The Karpathy CLAUDE.md content was snapshotted on 2026-04-18. Check for updates periodically:

```bash
curl -s https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md > /tmp/karpathy-latest.md
diff KARPATHY.md /tmp/karpathy-latest.md  # see what changed
```

If Part 1 content needs updating, replace only the Part 1 section of KARPATHY.md. Leave Part 2 (Prempawee Extensions) alone.

### When you learn a new pattern

Add it to:
1. AUDIT_LOG.md — the incident narrative
2. KARPATHY.md Part 2 — the distilled rule (if generalizable)
3. AGENTS.md — the hard rule for this codebase (if specific)

All three layers stay in sync, each at the right altitude.

### When adding a new project

KARPATHY.md Part 1 is reusable as-is across projects. For a new repo:
1. Copy KARPATHY.md (both parts — Part 2 may still be relevant)
2. Write a new AGENTS.md specific to that repo's quirks
3. Write a short CLAUDE.md that imports both
4. Create a thin CLAUDE_CODE_SOP.md tailored to that repo

## Rollback Plan

If for any reason the new CLAUDE.md causes issues with Claude Code:

```bash
git log --oneline | grep "docs: add layered"
git revert <that-sha>
git push
```

This returns CLAUDE.md to the 1-line version. KARPATHY.md and docs/CLAUDE_CODE_SOP.md remain but are no longer auto-loaded. No other files are affected.

---

**Estimated total migration time:** 15-30 minutes including verification.
**Risk level:** LOW (documentation only, no code changes).
**Reversibility:** Fully reversible via git revert.
