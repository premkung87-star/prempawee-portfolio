# Session 8 — Opener / Handoff from Session 7

**Date:** 2026-04-26 (afternoon, end of Session 7)
**Last commit on main:** `a9bd855` (`feat(admin): /admin/feedback MVP page + count card on overview (#49)`)
**Working tree:** CLEAN

---

## What Session 7 shipped (9 PRs in one day)

| # | Title | Risk |
|---|---|---|
| #41 | `fix(preview): swap overflow-hidden → overflow-clip on Process so sticky pins` | LOW |
| #42 | `fix(preview): defer randomized chars in BinaryStarField to post-mount` | LOW |
| #43 | `docs(audit-log): §38 — overflow-clip + post-mount gate` | LOW |
| #44 | `docs(patterns): Pattern 7 (overflow-clip) + Pattern 8 (post-mount hydration gate)` | LOW |
| **#45** | **`feat(cutover): swap /preview redesign into /` — Phase 2 cutover** | **HIGH** |
| #46 | `chore: delete orphan src/components/chat.tsx` | LOW |
| #47 | `chore(deps): pin postcss ^8.5.10 via npm overrides — closes 5 moderate XSS` | LOW |
| #48 | `feat(feedback): footer feedback button + backend (PR A)` | MEDIUM |
| #49 | `feat(admin): /admin/feedback MVP page + count card on overview` | LOW |

**Net:** new design live on prempawee.com, feedback feature shipped end-to-end (table + API + form + admin page), 681 lines of dead code removed, 0 npm audit vulnerabilities.

---

## Roadmap to push prempawee.com from 8.5 → 10/10

Captured at end of Session 7. Ordered by ROI for the 100K THB freelancing goal.

### To push 8.5 → 9/10

1. **Post the LinkedIn announcement** — Tuesday 8-10am Bangkok. Draft is on Foreman's Desktop at `~/Desktop/linkedin-post-prempawee-relaunch.md`. Free move.
2. **Ship a second deep case study — NWL CLUB.** Even minimal: hero + problem + architecture + 2 screenshots + 1 outcome. ~2 hours. Use existing `CaseStudyShell` + `/case-studies/[slug]` pattern. Check `CLAUDE.md` "Case Study Pattern" section for the established workflow.
3. **Get one real testimonial** from any past client (NWL, VerdeX, anyone Foreman has shipped for). Even one line. Add to homepage as a small element near `ProofStrip` or `FeaturedCase`.
4. **Tighten the conversion path.** Add an explicit "BOOK A CALL" CTA that appears after the chat shows pricing OR after 5+ messages exchanged. Wire to a real Calendly / cal.com link. The chatbot already has a `show_pricing` tool — extend the tool result UI to include a "BOOK 15 MIN" button.

### To push 9 → 10/10

5. **Real conversion data — at least 1 paid project shipped through the new design.** The site can't be "10" until it's proven to convert. Until then it's a beautiful demo, not a proven funnel.
6. **5+ real feedback rows from non-test visitors → at least one used to improve the site.** Closes the feedback loop. The plumbing is in place (`/api/feedback`, `/admin/feedback`); now needs real visitors.
7. **Mobile Lighthouse Performance 95+** (currently 94 per AUDIT_LOG §33). Candidates: dynamic import of Sentry SDK (defer until first error), code-split AI SDK tool-use cards, eliminate forced reflow on chat auto-scroll. Defer until traffic data justifies the optimization.

---

## Other items still open (carry-over)

- **#38** Fastwork URL still points to homepage — needs Foreman's actual Fastwork profile URL OR remove the section
- **#40** LOW nits sweep (10 small items, see Session 7 task tracking)
- **§38 follow-up:** ESLint hydration guard (~1h dedicated lint-config PR)
- **§32 follow-up:** eval-rag judge defect — passes only `{question, answer}` without KB context, so faithfulness measures internal consistency rather than KB-faithfulness. Fix: inject `<relevant_context>` into judge prompt. ETA ~1h.
- **/admin/feedback v2:** filters (type/status), per-row status update actions, CSV export. Defer until triage volume justifies.

---

## What to do at session start

1. Run the `CLAUDE.md` 5-step session-opening ritual
2. Read `AUDIT_LOG.md` fully (especially §38)
3. Read `docs/PATTERNS.md` (now has 8 patterns)
4. Read this file
5. Ask Foreman which roadmap item to start with

If Foreman wants a fast win → item #1 (LinkedIn post is already drafted, just needs publishing).
If Foreman wants to ship code → item #2 (NWL CLUB case study) is the highest-leverage code work.

— Claude Opus 4.7, end of Session 7 (2026-04-26)
