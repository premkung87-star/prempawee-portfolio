# Feedback Button — Design Spec

**Date:** 2026-04-26
**Status:** Approved (Foreman, Session 7)
**Risk:** MEDIUM (new component + new API route + new SQL migration; no watchlist files)
**Estimated effort:** 3–4 hours, can be split into 2 PRs

---

## 1. Goal

Allow visitors to prempawee.com to submit feedback (bug reports, suggestions, thanks, other) directly from the site without leaving the page. Feedback persists in Supabase for triage, fires a webhook to notify the Foreman, and is reviewable through `/admin/feedback`.

This is a complement to the existing lead-capture pipeline: leads are buyer-intent signals, feedback is product-quality signals. Both share infrastructure patterns (POST → Supabase → webhook → admin page) but are different tables with different schemas.

## 2. User flow

1. Visitor scrolls to footer.
2. Sees `GIVE FEEDBACK →` alongside existing footer links (`VERDEX`, `PORTFOLIO META`, `FALLBACK`, `STATUS`).
3. Clicks the link → footer expands inline to reveal the feedback form. No modal, no route change, no scroll lock.
4. Form fields (top to bottom):
   - **Type selector** (radio group): `BUG` · `SUGGESTION` · `THANKS` · `OTHER`. Default: `SUGGESTION`.
   - **Body** (textarea): "What's on your mind?" placeholder. 1–4000 chars.
   - **Email** (input, optional): "Email (optional, if you want a reply)".
   - **Consent line** (read-only text, no checkbox): "By submitting, you consent to storing your feedback and email if provided. No data shared with third parties."
   - **Submit button**: `SUBMIT`.
5. Submit → POST `/api/feedback` → row inserted into `feedback` table → outbound webhook fires (notify Foreman) → form replaces with `Thanks. Your feedback is logged.` confirmation in the same expanded footer space, plus a `CLOSE` button to collapse the footer back to its default state.
6. Errors (rate-limit, validation, server) replace the form with a localized error message and a retry hint; the form fields remain so the user can adjust and resubmit without re-typing.

## 3. UI placement decisions

| Decision | Choice | Rationale |
|---|---|---|
| Entry point | Footer link (5th entry) | Discreet, on-brand with matrix-terminal aesthetic, doesn't fight chat for attention, doesn't touch watchlist files |
| Reveal style | Inline expansion in footer | Zero modal infrastructure (no focus trap, no scroll lock, no escape handler); footer just gets taller |
| Type taxonomy | `bug / suggestion / thanks / other` (4 types, single-select) | Covers the breadth of feedback without forcing the visitor to over-categorize; "other" is the escape hatch |
| Email | Optional | Lowest friction for casual feedback; engaged visitors leave it; soft lead-gen for those who want a reply |
| Consent | Read-only sentence near submit, no checkbox | PDPA-compliant disclosure without adding a click; matches existing PDPA banner ergonomics |

## 4. Files

### New files

| Path | Purpose |
|---|---|
| `src/lib/feedback-types.ts` | TypeScript types: `FeedbackType`, `FeedbackPayload`, `FeedbackRow` |
| `src/components/preview/FeedbackForm.tsx` | Inline form component, owns state (type, body, email, status: idle/submitting/done/error), bilingual via `Lang` prop |
| `src/lib/notify-feedback.ts` | Outbound webhook helper; mirrors existing `notify-new-lead.ts` |
| `migrations/003_feedback.sql` | Table + RLS policies + indexes |
| `src/app/api/feedback/route.ts` | POST handler: validate (Zod), rate-limit, insert, notify, respond |
| `src/app/admin/feedback/page.tsx` | Server component listing feedback with filters + actions |

### Modified files

| Path | Change |
|---|---|
| `src/components/preview/Footer.tsx` | Add 5th footer link (`GIVE FEEDBACK`) + conditionally mount `<FeedbackForm />` based on `isOpen` state |
| `src/components/preview/preview-strings.ts` | Add bilingual EN/TH strings for feedback form labels, errors, type names |

**Watchlist files NOT touched:** `layout.tsx`, `page.tsx`, `proxy.ts`, `next.config.ts`. The previously-watchlisted `chat.tsx` is already deleted.

## 5. Data schema

```sql
-- migrations/003_feedback.sql

CREATE TYPE feedback_type AS ENUM ('bug', 'suggestion', 'thanks', 'other');

CREATE TABLE IF NOT EXISTS feedback (
  id          BIGSERIAL PRIMARY KEY,
  type        feedback_type NOT NULL,
  body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  email       TEXT NULL CHECK (
    email IS NULL OR
    (length(email) <= 254 AND email ~* '^[^@]+@[^@]+\.[^@]+$')
  ),
  page_url    TEXT NULL CHECK (page_url IS NULL OR length(page_url) <= 2048),
  user_agent  TEXT NULL CHECK (user_agent IS NULL OR length(user_agent) <= 500),
  ip_prefix   TEXT NULL CHECK (ip_prefix IS NULL OR length(ip_prefix) <= 64),
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'resolved', 'spam')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_type_status_idx ON feedback (type, status) WHERE status != 'spam';

-- RLS: only service-role API access. Anon/authenticated have no policy and
-- therefore no access. Final policy shape MUST match the existing pattern
-- used for `lead_submissions` — implementation step will inspect that
-- migration first and replicate verbatim, including any `service_role`
-- shape difference between Supabase versions.
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- Policy stub — replace with the verified service-role pattern from
-- migrations/001_*.sql (or wherever lead_submissions's RLS lives) during
-- implementation.
```

**Privacy notes:**
- `ip_prefix` stores truncated IP (`/24` for IPv4, `/64` for IPv6) — sufficient for rate-limit forensics, insufficient for individual identification. Aligns with existing `lead_submissions` privacy posture.
- `email` is nullable. Validation enforced both at API (Zod) and DB (CHECK).
- `page_url` captured from `Referer` header so we know which page surfaced the feedback (esp. useful once `/case-studies/*` see traffic).

## 6. API route

**Path:** `POST /api/feedback`
**Runtime:** `nodejs` (matches `/api/leads`, allows safe sync I/O)

### Request body (JSON)

```ts
{
  type: 'bug' | 'suggestion' | 'thanks' | 'other',
  body: string,        // 1..4000 chars
  email?: string,      // optional
  website?: string,    // honeypot — must be empty/missing or request silently 200's without insert
}
```

### Response shapes

| Status | Body | When |
|---|---|---|
| `200` | `{ ok: true }` | Success OR honeypot triggered (silent trap) |
| `400` | `{ ok: false, error: 'validation', issues: [...] }` | Zod validation failed |
| `429` | `{ ok: false, error: 'rate_limited' }` | Upstash rate limit triggered |
| `500` | `{ ok: false, error: 'server' }` | Supabase insert or webhook threw |

### Anti-spam stack

| Layer | Mechanism | Threshold |
|---|---|---|
| Honeypot | Hidden `website` input — populated by naive bots, ignored by humans | Silent 200, no DB insert |
| Rate limit | Upstash via existing helper (sliding window) | 3 submissions / IP / hour |
| Validation | Zod at API + CHECK at DB | Strict |
| RLS | Service-role-only writes | Direct anon submissions blocked |

No captcha. Easy to bolt on hCaptcha later if volume justifies; current stack handles expected scale.

### Edge-runtime correctness (§08, §19, §36)

`/api/feedback` runs on `nodejs` runtime, which makes fire-and-forget less catastrophic than the edge case. **Still, every async call MUST be awaited** to keep §36 invariant clean:

```ts
const inserted = await supabase.from('feedback').insert(...);
await notifyFeedbackWebhook(payload);   // never fire-and-forget
return Response.json({ ok: true });
```

## 7. Admin review surface

**Path:** `/admin/feedback`
**Auth:** Existing `ADMIN_SECRET` cookie gate (same as `/admin/leads`, `/admin/conversations`, `/admin/finops`)

### Layout

- Filter bar: type dropdown (all/bug/suggestion/thanks/other), status dropdown (all/new/triaged/resolved/spam)
- Table columns: created (relative time + tooltip absolute), type (colored pill), body (truncated 200ch + click to expand), email (mailto: link if present), status (dropdown to change), page_url (link)
- Actions per row: status change (new → triaged → resolved or → spam)
- Pagination: 50 rows per page, query-string driven
- CSV export button: dumps current filtered set

### Empty state

`No feedback yet. The footer link goes live in a few minutes — leave one yourself to test.`

## 8. Bilingual strings (`preview-strings.ts`)

**English keys (TH mirror added in same shape):**

```ts
feedback_link: "GIVE FEEDBACK",
feedback_kicker: "[FEEDBACK]",
feedback_type_label: "TYPE",
feedback_types: {
  bug: "BUG",
  suggestion: "SUGGESTION",
  thanks: "THANKS",
  other: "OTHER",
},
feedback_body_label: "MESSAGE",
feedback_body_placeholder: "What's on your mind?",
feedback_email_label: "EMAIL",
feedback_email_help: "(optional — if you'd like a reply)",
feedback_email_placeholder: "you@example.com",
feedback_consent:
  "By submitting, you consent to storing your feedback and email if provided. No data shared with third parties.",
feedback_submit: "SUBMIT",
feedback_submitting: "SENDING...",
feedback_thanks: "Thanks. Your feedback is logged.",
feedback_thanks_close: "CLOSE",
feedback_error: "Couldn't send. Please try again or email directly.",
feedback_error_validation: "Please fill out the form correctly.",
feedback_error_rate_limited: "Too many submissions. Try again in an hour.",
```

Thai translations follow the existing tone in `preview-strings.ts` — informal but professional.

## 9. Verification plan

### Local gate (per CLAUDE.md MEDIUM-risk)

```bash
npm run typecheck && npm run test && npm run build
BASE_URL=http://localhost:3000 npm run test:e2e
```

### New E2E coverage

Add to `tests/e2e/smoke.spec.ts` or new `tests/e2e/feedback.spec.ts`:

1. `feedback link in footer is visible after consent` — page loads, scroll to footer, see `GIVE FEEDBACK` link
2. `clicking feedback link expands form inline` — click, form fields visible, no scroll lock
3. `submitting feedback shows thanks confirmation` — fill type/body, submit, verify confirmation appears
4. `rate limit triggers after 3 submissions` — submit 4 times rapidly, verify 4th gets `Too many submissions` message
5. `honeypot silently traps bots` — manually populate hidden `website` field via JS, verify response is 200 OK but `feedback` table row count unchanged

### Manual / preview verification

- POST to `/api/feedback` from Postman/curl to verify validation, rate-limit, success
- Submit a real feedback row from prempawee.com preview URL after deploy
- Check `/admin/feedback` shows the row

### Rollback plan

- Component + API route + admin page are purely additive — `git revert` is mechanical
- Migration is idempotent (`CREATE TABLE IF NOT EXISTS`), so re-applying is safe; rollback if needed: `DROP TABLE feedback; DROP TYPE feedback_type;`

## 10. PR split strategy

Per KARPATHY §7 (one logical change per PR), split into 2 PRs:

**PR A — Backend + minimum form:**
- Migration applied to Supabase
- API route + types + webhook helper
- FeedbackForm component + footer link
- Bilingual strings
- E2E coverage for submit + rate limit + honeypot

**PR B — Admin review surface:**
- `/admin/feedback` page
- CSV export
- Status update actions

Optional: PR B can be deferred until first feedback rows arrive — no point building the admin UI before there's data to review.

## 11. Out of scope (deliberate YAGNI)

- No captcha (rate-limit + honeypot covers expected volume)
- No file uploads (text-only is sufficient for this audience)
- No threading / replies (one-way feedback)
- No public "wall of feedback" (no need for social proof of feedback itself)
- No analytics on the feedback button (would clutter the design)
- No real-time admin updates (manual page refresh is fine for the volume expected)

## 12. Open questions

None. All five brainstorming questions resolved (D-B-B-B-B). Sensible defaults applied to remaining decisions (anti-spam, fields, consent presentation).

---

**Approval:** Foreman, 2026-04-26 (Session 7, autonomous mode authorized).
**Next step:** invoke `superpowers:writing-plans` to produce the implementation plan.
