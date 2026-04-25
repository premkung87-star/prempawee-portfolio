# Session 7 — Opener / Handoff from Session 6

**Date:** 2026-04-26 (morning)
**Mode:** Foreman returns after 7-hour autonomous overnight session
**Last commit on main:** `3f272dd` (`fix(seo): replace fabricated 99.99% uptime with grounded specifics (§37) (#39)`)
**Working tree:** CLEAN
**CI:** GREEN throughout

---

## Read these first (in order)

1. **`docs/sessions/SESSION_6.md`** — Session 6 plan + outcomes summary
2. **`AUDIT_LOG.md` §34, §35, §36, §37** — the 4 patterns captured overnight (most important: §34 GROUNDING rescue, §36 edge fire-and-forget recurrence)
3. **`docs/PATTERNS.md`** — 6 reusable patterns with code snippets (BinaryStarField, CustomEvent triggers, GROUNDING grep, FeaturedCase link-out, dispatch checklist, one-ChatPanel-mount)

---

## What landed overnight (6 PRs, all merged, zero watchlist regressions)

| # | Title | SHA | Risk |
|---|---|---|---|
| #34 | `feat(preview): senior-pass v2 — chat-in-hero, ProofStrip, FeaturedCase` | `7786929` | MEDIUM |
| #35 | `feat(preview): v3 polish — sticky NavBar, chat-dominant hero, mobile reorder` | `8bdc63a` | MEDIUM |
| #36 | `chore(preview): delete orphan MatrixBoot + ChatSection` | `959c5aa` | LOW |
| #37 | `docs: SESSION_6 handoff + PATTERNS catalog + AUDIT_LOG §34-§37` | `ff3dfb2` | LOW (docs) |
| #38 | `fix(api): await notifyNewLead webhook to prevent edge tear-down drops (§36)` | `a873a96` | LOW |
| #39 | `fix(seo): replace fabricated 99.99% uptime with grounded specifics (§37)` | `3f272dd` | LOW |

**Total:** 21 files changed · +1,703 / −357 lines · 0 CI failures · 0 watchlist files touched

---

## Current `/preview` state (the redesign you should look at first)

URL: `https://prempawee.com/preview` (live), or local `npm run dev` → `localhost:3000/preview`

**Hero:**
- Sticky NavBar top: P// LOGO · WORK · PRICING · CASES · CONTACT · EN/TH (mobile: hamburger drawer with ESC-close + skip-to-content link)
- Desktop: 2-col grid (`0.85fr/1.15fr`) — kicker + small headline + 3-stat strip ("8+ live · <400ms TTFB · 0 hallucinations") on LEFT, ChatPanel (700px tall, with subtle outline ring + spotlight glow) on RIGHT
- Mobile: stacks `kicker → small headline → CHAT (above fold) → subhead → stats → hint`
- Cursor: corner-bracket reticle, **no READY tag** (PR #33 fix preserved through both v2 and v3)

**Page order:** `Hero → Marquee → WhatIBuild → ProofStrip → Marquee(reverse) → FeaturedCase → Process → Footer`

**Practical nav:**
- WORK → smooth-scroll to `#work` (WhatIBuild)
- **PRICING → dispatches `CustomEvent("preview:chat-prompt")` → ChatPanel sends "How much for a chatbot?" → renders inline pricing card** (the AI-native pattern; pricing is a chat interaction, not a static section)
- CASES → `next/link` to `/case-studies/verdex` (real published case)
- CONTACT → smooth-scroll to `#contact` (Footer)

**ProofStrip:** 3 REAL projects only — VerdeX Farm / NWL CLUB / Portfolio Meta. No fabricated SOI Assistant. No music-venue ESP32 nonsense. Status pills.

**FeaturedCase:** typographic gateway to the real `/case-studies/verdex` — no fake metrics, no fabricated testimonial.

**8 binary stars** distributed across page (varied shapes, perf-budgeted).

---

## Critical patterns for next session (do not reinvent)

### 1. GROUNDING-RULE pre-implementation grep
Before implementing any Claude Design handoff, grep `src/lib/portfolio-data.ts` and `supabase-seed.sql` for every named project + numeric claim. If it doesn't trace, drop it / reskin it / link out via `FeaturedCase` pattern. **Cost:** ~5 min. **Saves:** the fabrication-amplifier failure mode (AUDIT_LOG §34).

### 2. Edge handlers — every promise awaited or `ctx.waitUntil(...)`-wrapped
§08/§19/§36. The pattern recurs because §08 was scoped to one callsite. Audit every callback (`onFinish`, `onError`, tool `execute`, etc.) on any `runtime = "edge"` route. Fixed locations: `src/app/api/chat/route.ts:526` and `src/app/api/leads/route.ts:113`.

### 3. One ChatPanel mount, ever
Mobile/desktop differences via CSS `order-*` + grid-area, never via dual mounts. Two instances install two `installSessionIdFetchOverride` patches + two `preview:chat-prompt` listeners → double-message bugs. (AUDIT_LOG §35, PATTERNS §6.)

### 4. frontend-react-specialist dispatch checklist
- Absolute file paths to read (top-to-bottom, not skim)
- Constraints stated upfront (watchlist ban, GROUNDING RULE, no new deps/keyframes)
- Output format: FRONTEND REPORT
- "Foreman handles git ops" footer (specialist lacks Bash)
**Cost:** ~4 min brief. **Saves:** ~10–15 min round-trip per dispatch.

---

## Pending TaskList (Foreman to triage)

### Open in `TaskList`:

| ID | Subject | Risk | Notes |
|---|---|---|---|
| #34 | **Phase 2 cutover — swap /preview into /** | HIGH | Watchlist files. Plan from head-planning still valid (Q1 Option A move + Q3 Option B 301-redirect). Needs Foreman awake to verify with E2E gate per AUDIT_LOG §17/§20 |
| #37 | M2 — chat.tsx hardcoded contacts (watchlist) | MEDIUM | Import `CONTACT` from portfolio-data.ts. Watchlist file → mandatory E2E |
| #38 | M3 — Fastwork URL points to homepage | LOW | Needs your profile URL OR remove the section. Foreman input required |
| #39 | M4 — postcss XSS transitive (5 moderate) | LOW | Pin via `package.json` overrides: `"postcss": "^8.5.10"`. Don't run `npm audit fix --force` (proposes Next@9.3.3 downgrade) |
| #40 | LOW nits sweep (10 items) | LOW | See task description for full list. Recommended: group #4 #5 #6 into one tiny docs PR |

### What NOT to do autonomously without Foreman:
- Phase 2 cutover (HIGH risk, hydration regression precedent §17/§20)
- chat.tsx changes (watchlist; same gate)
- ADMIN_SECRET rotation (Vercel dashboard task, requires Foreman creds)
- Anything that touches `experimental.sri` (banned per §21)

---

## Other open from earlier sessions (still tracked in AUDIT_LOG followups)

- **Eval-rag judge defect** (§32 → §33 followup) — judge prompt passes only `{question, answer}` without KB context; faithfulness measures internal consistency rather than KB-faithfulness. Fix: inject `<relevant_context>` into judge prompt. ETA ~1h.
- **`/admin/finops` cost-per-conversation tracking** (§33 followup) — defer, low priority
- **Lighthouse mobile Performance 94 → 95+** (§33 followup) — defer until traffic data justifies
- **PageSpeed Insights API quota** unreliable from Claude Code's WebFetch — workaround: ask Foreman to run pagespeed.web.dev manually (§33 line)

---

## File / location quick-reference

```
docs/sessions/SESSION_6.md        # last session's plan + outcomes
docs/sessions/SESSION_7_OPENER.md # this file
docs/PATTERNS.md                  # 6 reusable patterns from S6
AUDIT_LOG.md §34 §35 §36 §37     # overnight findings + fixes

src/components/preview/           # the v2/v3 redesign lives here
  Landing.tsx                     # root, render order
  NavBar.tsx                      # NEW — sticky nav, AI-native PRICING
  Hero.tsx                        # 2-col desktop, mobile reorder
  ChatPanel.tsx                   # listens for preview:chat-prompt
  ProofStrip.tsx                  # NEW — 3 real projects
  FeaturedCase.tsx                # NEW — link-out to /case-studies/verdex
  BinaryStarField.tsx             # NEW — decorative primitive
  WhatIBuild.tsx, Process.tsx, Footer.tsx  # touched (anchor IDs + 1 star each)

src/components/chat.tsx           # WATCHLIST — original / chat (still serves /)
src/app/page.tsx                  # WATCHLIST — / route
src/app/layout.tsx                # WATCHLIST — root layout (JSON-LD lives here)
src/app/api/chat/route.ts         # edge runtime; fixed §36 fire-and-forget
src/app/api/leads/route.ts        # nodejs runtime; pattern parity fix

src/lib/portfolio-data.ts         # canonical content SoT
supabase-seed.sql                 # seed for fresh DB; aligned with refresh script
scripts/refresh-knowledge-base.mjs # canonical KB content (live source)
```

---

## Resume hints (what to say to the next session)

If the user wants to **continue the redesign**:
> "Continue Session 7. Read SESSION_7_OPENER.md, SESSION_6.md, AUDIT_LOG §34-§37. The /preview redesign is at v3 (chat-dominant hero, sticky NavBar, AI-native PRICING). Phase 2 cutover into / is paused; you have head-planning's decomposition from earlier (Q1 Option A move + Q3 Option B 301-redirect). What should we do first?"

If the user wants to **execute Phase 2 cutover**:
> Cutover playbook:
> 1. head-discovery scout (read-only) — confirm current state of `src/app/page.tsx`, `src/app/layout.tsx`, `next.config.ts`, `e2e/` selectors
> 2. head-planning re-issues plan deltas if scout contradicts assumptions
> 3. head-build dispatches frontend-react-specialist:
>    - `git mv src/app/preview/page.tsx src/app/page.tsx` (overwriting the old `/`)
>    - Move/merge layout if `/preview/layout.tsx` exists
>    - `next.config.ts` add a 301 from `/preview` → `/`
>    - Update sitemap (remove `/preview` if listed; ensure `/` indexable, no carryover noindex)
>    - Update e2e selectors to match Matrix-terminal markup
> 4. head-test runs E2E local, then Vercel preview URL
> 5. head-review: CSP nonce pipeline integrity, no `experimental.sri`, lang aria-pressed, fire-and-forget audit
> 6. head-deploy: preview-first, then `--squash` to main, then prod E2E
> 7. head-monitor: 24h Sentry watch + Lighthouse re-baseline candidate (separate PR)
> 8. head-audit: AUDIT_LOG §38 entry post-merge

If the user wants to **address task #37 (chat.tsx hardcoded contacts)**:
> Touches a watchlist file. Workflow: branch → import CONTACT → replace 2 strings → typecheck/lint/test/build → push → CI runs browser smoke gate → merge if green. Keep this PR isolated per §7.

If the user wants to **address task #39 (postcss vuln)**:
> Add `"overrides": { "postcss": "^8.5.10" }` to `package.json`. Run `npm i` + `npm audit` (verify 0 moderate) + `npm run build` (postcss is also Tailwind v4 dep). Single isolated PR.

---

## Trust signals for the next session

- 6 PRs merged with **0 watchlist file changes** through the entire night
- All CI green throughout (typecheck, lint, test 63/63, RAG quality, Vercel build)
- 2 critical bugs found AND fixed in the same session (audit → fix loop closed)
- 1 GROUNDING-RULE rescue (3 fabricated claims refused before ship)
- All decisions documented in AUDIT_LOG with citations
- KARPATHY §7 honored (one logical change per commit/PR)

---

**Stop signal:** Foreman explicitly invoked `/clear`. Session 6 ends here. Session 7 begins on next message.

— Claude Opus 4.7 (1M context) · 2026-04-26 (Bangkok)
