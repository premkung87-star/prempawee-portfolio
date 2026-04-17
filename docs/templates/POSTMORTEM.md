# Incident Post-Mortem — `<YYYY-MM-DD-short-title>`

**Severity:** SEV-1 / SEV-2 / SEV-3
**Duration:** HH:MM (start → resolved)
**Author:** Prempawee
**Status:** Draft / Finalized
**Ticket:** link to Sentry issue / Linear / GitHub issue

> Blameless post-mortem. Focus on systems, not people.
> What went wrong, what we learned, what changes.

---

## TL;DR (1–2 sentences)

Between <start> and <end>, <what broke> caused <impact>. Root cause was
<root cause>. Fixed by <fix>. Preventive actions tracked below.

## Impact

- Users affected: <count / %>
- User-visible symptoms: <description>
- Data integrity: <any corruption? any lost writes?>
- Revenue impact: <estimated $ lost leads>
- Time to detect: <minutes>
- Time to mitigate: <minutes>
- Time to resolve: <minutes>

## Timeline (UTC)

All times UTC. Paste actual timestamps from Vercel logs / Sentry.

| Time | Event |
|---|---|
| HH:MM | First failure observed in `<surface>` |
| HH:MM | Sentry alert fired / visitor reported |
| HH:MM | On-call acknowledged |
| HH:MM | Root cause identified: <short note> |
| HH:MM | Mitigation deployed: <what> |
| HH:MM | Metrics returned to baseline |
| HH:MM | Incident closed |

## Root cause

What actually failed, at the code / config / infra level. Include:
- File:line when relevant
- Commit SHA that introduced the problem (if known)
- Why the existing guardrails didn't catch it

## Detection

How did we find out? Honest answer.
- [ ] Automated alert (Sentry / status page / log drain)
- [ ] Synthetic probe
- [ ] User report
- [ ] Noticed during unrelated work

If detection was by user report: **that's a detection gap** — what alert would have caught it earlier?

## Mitigation

What we did to stop the bleeding (may be different from the real fix):
- Code change / rollback / config flip / rate-limit bump / kill switch

## Resolution

The actual fix. May be the same as mitigation for small bugs.
- PR / commit link
- Deployed at HH:MM

## What went well

Don't skip this. Documenting strengths reinforces good patterns.

- Example: "Rollback pipeline worked; we were back in <N> minutes"
- Example: "Structured logs made root cause obvious in 2 minutes"

## What went poorly

- Gaps in detection / alerting / runbooks / testing / ownership

## Action items

Each item has an owner and a due date. Track in AUDIT_LOG.md or issues.

| # | Action | Owner | Due | Status |
|---|---|---|---|---|
| 1 | <specific fix — e.g. "add Sentry alert on X"> | Prempawee | <date> | ☐ |
| 2 | <preventive — e.g. "add regression test"> | Prempawee | <date> | ☐ |
| 3 | <docs/runbook update> | Prempawee | <date> | ☐ |

## Learning (the rule)

Write this as a generalizable rule for `AUDIT_LOG.md` — next time we see this
shape, we should recognize it immediately. (See `feedback_error_loop.md`.)

> Rule: <one sentence, future-facing>

---

_Template v1 — see `docs/templates/POSTMORTEM.md`. Copy into
`docs/post-mortems/<YYYY-MM-DD-title>.md` when writing a new one._
