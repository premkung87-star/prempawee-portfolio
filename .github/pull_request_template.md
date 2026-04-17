<!-- PR title format: <type>(<scope>): <short summary> -->

## What changed

<Brief description of what this PR does. Link relevant audit-log entries.>

## Why

<Motivation — what problem, what user benefit, what business outcome.>

## How verified

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run eval:rag` passes (if touching chat/prompt/RAG)
- [ ] Tested on Vercel Preview URL: <paste-url-here>
- [ ] Manually tried the feature end-to-end

## Risk

- Blast radius: <which surfaces does this affect?>
- Rollback plan: <how do we undo if broken in prod?>
- Data migration: <none / required / documented in `migrations/`>

## Screenshots / logs (if UI / runtime change)

<Paste before/after, curl outputs, Sentry traces, etc.>

## Docs touched

- [ ] `AUDIT_LOG.md` (for new patterns to avoid)
- [ ] `docs/OPERATIONS.md` (for new ops procedures)
- [ ] `migrations/README.md` (for SQL changes)
- [ ] None required

<!--
Review checklist (for me / future contributors):
- No hardcoded secrets
- No regression in existing tests
- Error paths logged via src/lib/logger.ts (structured JSON)
- User-visible copy passes the 90/10 info-vs-sales philosophy
- If touching the system prompt: test multilingual triggers (EN + TH)
-->
