# Feedback Button (PR A: backend + form) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working feedback feature visible to visitors at the bottom of prempawee.com — footer link expands to an inline form, submission persists to Supabase + notifies Foreman, anti-spam via existing rate-limit + honeypot. Admin review surface (`/admin/feedback`) is **out of scope for PR A** — it ships as a separate PR after PR A soaks.

**Architecture:** Mirrors the existing `/api/leads` + `lead_submissions` (`leads` table) pattern. New nodejs-runtime POST endpoint, new Supabase table with RLS, new helper in `src/lib/supabase.ts`, new bilingual React component embedded in `Footer.tsx`. Single source of truth for strings in `preview-strings.ts`.

**Tech Stack:** Next.js 16 (nodejs runtime), Supabase Postgres + RLS, Upstash rate limit (existing helper, shared bucket with chat), Zod validation, Vercel webhooks for notifications, Playwright for E2E. TypeScript strict.

**Spec source:** `docs/superpowers/specs/2026-04-26-feedback-button-design.md`

---

## File map

**New files:**
- `migrations/003_feedback.sql` — table + RLS + indexes
- `src/lib/feedback-types.ts` — shared TypeScript types
- `src/components/preview/FeedbackForm.tsx` — inline form component
- `src/app/api/feedback/route.ts` — POST handler
- `tests/e2e/feedback.spec.ts` — E2E coverage (or appended to smoke.spec.ts)

**Modified files:**
- `src/lib/supabase.ts` — add `insertFeedback()` helper
- `src/components/preview/Footer.tsx` — add link + conditional form mount
- `src/components/preview/preview-strings.ts` — bilingual strings

**Watchlist files NOT touched:** `layout.tsx`, `page.tsx`, `proxy.ts`, `next.config.ts` (chat.tsx already deleted).

---

## Task 1: Database migration

**Files:**
- Create: `migrations/003_feedback.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================================
-- Migration: 003_feedback.sql
-- Project : Prempawee Portfolio (Supabase Postgres)
-- Author  : generated 2026-04-26 (Session 7)
-- Intent  : Add `feedback` table for visitor feedback submissions from the
--           prempawee.com footer. Mirrors the privacy posture of the
--           existing `leads` table (truncated IP, optional email, no PII
--           collection beyond what the visitor types).
--
-- Spec    : docs/superpowers/specs/2026-04-26-feedback-button-design.md
-- Idempotent: every statement uses IF NOT EXISTS / CREATE OR REPLACE patterns.
-- ============================================================================

begin;

-- 1. Type enum for feedback categories
do $$
begin
  if not exists (select 1 from pg_type where typname = 'feedback_type') then
    create type feedback_type as enum ('bug', 'suggestion', 'thanks', 'other');
  end if;
end$$;

-- 2. Table
create table if not exists public.feedback (
  id          bigserial primary key,
  type        feedback_type not null,
  body        text not null,
  email       text null,
  page_url    text null,
  user_agent  text null,
  ip_prefix   text null,
  status      text not null default 'new',
  created_at  timestamptz not null default now()
);

-- 3. CHECK constraints (belt-and-suspenders alongside Zod validation)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'feedback_body_len_chk'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_body_len_chk
      check (char_length(body) between 1 and 4000);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'feedback_email_format_chk'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_email_format_chk
      check (email is null or (char_length(email) <= 254 and email ~* '^[^@]+@[^@]+\.[^@]+$'));
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'feedback_status_chk'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_status_chk
      check (status in ('new', 'triaged', 'resolved', 'spam'));
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'feedback_page_url_len_chk'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_page_url_len_chk
      check (page_url is null or char_length(page_url) <= 2048);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'feedback_user_agent_len_chk'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_user_agent_len_chk
      check (user_agent is null or char_length(user_agent) <= 500);
  end if;
end$$;

-- 4. Indexes
create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

create index if not exists feedback_type_status_idx
  on public.feedback (type, status)
  where status != 'spam';

-- 5. Row-level security (matches the leads-table convention from
--    migrations/001_hardening.sql — only service role can read or write,
--    anon/authenticated have no policy and therefore no access).
alter table public.feedback enable row level security;

drop policy if exists feedback_service_role_all on public.feedback;
create policy feedback_service_role_all on public.feedback
  for all
  to service_role
  using (true)
  with check (true);

commit;

-- Rollback (commented; uncomment + run if needed):
-- begin;
--   drop table if exists public.feedback;
--   drop type if exists feedback_type;
-- commit;
```

- [ ] **Step 2: Apply the migration to the live Supabase project**

Run via the Supabase SQL editor (or psql against the migrations URL):

```bash
# Foreman runs this in Supabase Studio's SQL Editor, OR locally if psql
# is configured against the project:
psql "$SUPABASE_DB_URL" -f migrations/003_feedback.sql
```

Expected: `BEGIN`, multiple `CREATE`/`ALTER` outputs, `COMMIT`. No errors.

- [ ] **Step 3: Verify the table exists with expected shape**

Run in Supabase SQL Editor:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'feedback'
order by ordinal_position;

select policyname, permissive, cmd
from pg_policies
where schemaname = 'public' and tablename = 'feedback';
```

Expected: 9 columns (id/type/body/email/page_url/user_agent/ip_prefix/status/created_at), `feedback_service_role_all` policy present.

- [ ] **Step 4: Commit the migration file**

```bash
git add migrations/003_feedback.sql
git commit -m "feat(db): add feedback table migration (003)

New table for visitor feedback from prempawee.com footer. Schema:
type enum (bug/suggestion/thanks/other), body, optional email,
optional page_url + user_agent + truncated ip_prefix, status enum
(new/triaged/resolved/spam), created_at.

RLS service_role-only matches the existing leads/conversations
pattern from 001_hardening.sql. Idempotent (IF NOT EXISTS, DO blocks
for constraints) so safe to re-apply.

Spec: docs/superpowers/specs/2026-04-26-feedback-button-design.md"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/lib/feedback-types.ts`

- [ ] **Step 1: Write the types module**

```ts
// Shared types for the feedback feature. The `FeedbackType` literal union
// must stay in sync with the `feedback_type` Postgres enum in
// migrations/003_feedback.sql. Validation pivots on this union both
// client-side (FeedbackForm) and server-side (Zod schema in route.ts).

export const FEEDBACK_TYPES = [
  "bug",
  "suggestion",
  "thanks",
  "other",
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/** Wire shape: what the client POSTs to /api/feedback. */
export interface FeedbackPayload {
  type: FeedbackType;
  body: string;
  email?: string;
  /** Honeypot. Real clients leave this empty/undefined; bots populate it. */
  website?: string;
}

/** Server response shape. */
export type FeedbackResponse =
  | { ok: true; id: number }
  | { ok: false; error: "validation"; issues?: unknown }
  | { ok: false; error: "rate_limited" }
  | { ok: false; error: "server" };
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: clean exit (no output before prompt returns).

- [ ] **Step 3: Commit**

```bash
git add src/lib/feedback-types.ts
git commit -m "feat(feedback): add shared TypeScript types

FeedbackType union mirrors the feedback_type Postgres enum.
FeedbackPayload is the wire shape (includes honeypot field).
FeedbackResponse is the discriminated server response shape."
```

---

## Task 3: Supabase helper

**Files:**
- Modify: `src/lib/supabase.ts` (add `insertFeedback`)

- [ ] **Step 1: Read the existing `insertLead` function as the pattern**

```bash
grep -A 30 "insertLead" src/lib/supabase.ts | head -40
```

Confirm it uses `getServiceRoleClient()` (or similar) and returns `{ id, error }` shape. Match that.

- [ ] **Step 2: Add `insertFeedback` function**

Append to `src/lib/supabase.ts`:

```ts
import type { FeedbackType } from "@/lib/feedback-types";

export interface InsertFeedbackInput {
  type: FeedbackType;
  body: string;
  email: string | null;
  page_url: string | null;
  user_agent: string | null;
  ip_prefix: string | null;
}

export interface InsertFeedbackResult {
  id?: number;
  error?: string;
}

/** Insert a feedback row via the service-role client. RLS service_role
 *  policy on `public.feedback` permits the write; anon/authenticated
 *  callers cannot reach this function (it requires SUPABASE_SERVICE_ROLE_KEY). */
export async function insertFeedback(
  input: InsertFeedbackInput,
): Promise<InsertFeedbackResult> {
  const client = getServiceRoleClient();
  if (!client) {
    return { error: "supabase service-role client unavailable" };
  }
  const { data, error } = await client
    .from("feedback")
    .insert({
      type: input.type,
      body: input.body,
      email: input.email,
      page_url: input.page_url,
      user_agent: input.user_agent,
      ip_prefix: input.ip_prefix,
    })
    .select("id")
    .single();
  if (error) {
    return { error: error.message };
  }
  return { id: data?.id };
}
```

(Adjust import / client-getter name to match what `insertLead` already uses in the file.)

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat(feedback): add insertFeedback service-role helper

Mirrors insertLead pattern. Inserts a row into the feedback table via
the service-role client (RLS only permits service_role writes).
Returns { id } on success or { error } on failure."
```

---

## Task 4: API route

**Files:**
- Create: `src/app/api/feedback/route.ts`

- [ ] **Step 1: Read existing `/api/leads/route.ts` as the reference**

```bash
cat src/app/api/leads/route.ts
```

Note the structure: imports, runtime, Zod schema, `notifyNewLead()` inline, POST handler with rate limit + Zod parse + insert + await notify.

- [ ] **Step 2: Write the feedback route**

```ts
// POST /api/feedback — visitor feedback capture from the footer form.
//
// Mirrors /api/leads/route.ts: nodejs runtime, Zod validation,
// service-role insert, awaited webhook (no fire-and-forget per
// AUDIT_LOG §08/§19/§36).

import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { insertFeedback } from "@/lib/supabase";
import { logError, logInfo } from "@/lib/logger";
import { FEEDBACK_TYPES } from "@/lib/feedback-types";
import type { FeedbackResponse } from "@/lib/feedback-types";

export const runtime = "nodejs";

const FeedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  body: z.string().trim().min(1, "Body is required.").max(4000),
  email: z
    .string()
    .trim()
    .email("Email format invalid.")
    .max(254)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // Honeypot. Bots fill this; humans never see it. If non-empty,
  // we silently 200 OK without inserting anything.
  website: z.string().optional(),
});

/** Truncate IP for privacy parity with the leads table (§24-style). */
function truncateIp(ip: string | null): string | null {
  if (!ip) return null;
  if (ip.includes(":")) {
    // IPv6 — keep first 4 hextets (/64)
    return ip.split(":").slice(0, 4).join(":");
  }
  // IPv4 — keep first 3 octets (/24)
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip.slice(0, 64);
}

async function notifyFeedback(payload: {
  id: number;
  type: string;
  body: string;
  email: string | null;
}) {
  const url = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!url) return; // dev / test environments without a webhook configured
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "new_feedback",
        ...payload,
      }),
    });
    if (!res.ok) {
      logError("feedback.notify.failed", { status: res.status });
    }
  } catch (err) {
    logError("feedback.notify.threw", { err: String(err) });
  }
}

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  const ipPrefix = truncateIp(ip);

  // 1. Rate limit (shared bucket with /api/chat — see rate-limit.ts).
  const rl = await rateLimit(ip ?? "unknown");
  if (!rl.allowed) {
    return Response.json(
      { ok: false, error: "rate_limited" } satisfies FeedbackResponse,
      { status: 429 },
    );
  }

  // 2. Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { ok: false, error: "validation" } satisfies FeedbackResponse,
      { status: 400 },
    );
  }

  const parsed = FeedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: "validation",
        issues: parsed.error.issues,
      } satisfies FeedbackResponse,
      { status: 400 },
    );
  }

  // 3. Honeypot — silently 200 without inserting if filled.
  if (parsed.data.website && parsed.data.website.trim() !== "") {
    logInfo("feedback.honeypot.tripped", { ip_prefix: ipPrefix });
    return Response.json({ ok: true, id: -1 } satisfies FeedbackResponse, {
      status: 200,
    });
  }

  // 4. Insert
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const referer = req.headers.get("referer")?.slice(0, 2048) ?? null;
  const result = await insertFeedback({
    type: parsed.data.type,
    body: parsed.data.body,
    email: parsed.data.email ?? null,
    page_url: referer,
    user_agent: userAgent,
    ip_prefix: ipPrefix,
  });

  if (result.error || result.id === undefined) {
    logError("feedback.insert.failed", { error: result.error });
    return Response.json(
      { ok: false, error: "server" } satisfies FeedbackResponse,
      { status: 500 },
    );
  }

  // 5. Notify (awaited per §08/§19/§36 — even though nodejs runtime is
  //    less catastrophic than edge, the invariant is "always await").
  await notifyFeedback({
    id: result.id,
    type: parsed.data.type,
    body: parsed.data.body,
    email: parsed.data.email ?? null,
  });

  logInfo("feedback.insert.ok", { id: result.id, type: parsed.data.type });
  return Response.json(
    { ok: true, id: result.id } satisfies FeedbackResponse,
    { status: 200 },
  );
}
```

- [ ] **Step 3: Verify typecheck + build**

```bash
npm run typecheck && npm run build
```

Expected: typecheck clean, build emits `/api/feedback` in the route table.

- [ ] **Step 4: Test the route locally with curl**

Start dev server:

```bash
npm run dev > /tmp/feedback-dev.log 2>&1 & sleep 5
```

Submit a valid feedback:

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"type":"suggestion","body":"hello world","email":"test@example.com"}'
```

Expected: `HTTP/1.1 200 OK` with body `{"ok":true,"id":1}`.

Test validation failure:

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"type":"invalid","body":""}'
```

Expected: `HTTP/1.1 400 Bad Request` with body containing `"error":"validation"`.

Test honeypot:

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"type":"bug","body":"test","website":"http://spam.example"}'
```

Expected: `HTTP/1.1 200 OK` body `{"ok":true,"id":-1}` — silent trap, no DB row.

Stop dev server:

```bash
kill %1 2>/dev/null; pkill -f "next-server" 2>/dev/null
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/feedback/route.ts
git commit -m "feat(feedback): add POST /api/feedback route

Nodejs runtime. Zod validation, IP rate limit (shared bucket with chat),
honeypot trap, IP truncation for privacy. Awaits notification webhook
per §08/§19/§36 (every async call awaited, no fire-and-forget).

Verified locally: 200 on valid, 400 on validation fail, 200 silent
trap on honeypot."
```

---

## Task 5: Bilingual strings

**Files:**
- Modify: `src/components/preview/preview-strings.ts`

- [ ] **Step 1: Add EN strings to the `en` block**

Find the EN block (around line 36, before `nav_*` entries). Append these keys before the closing `}` of the `en` object:

```ts
// Feedback form (footer link → inline expansion)
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
feedback_close: "CLOSE",
feedback_error: "Couldn't send. Please try again or email directly.",
feedback_error_validation: "Please fill out the form correctly.",
feedback_error_rate_limited: "Too many submissions. Try again in an hour.",
```

- [ ] **Step 2: Add TH translations to the `th` block**

Find the TH block. Append the same keys with Thai translations:

```ts
feedback_link: "ส่งข้อเสนอแนะ",
feedback_kicker: "[ข้อเสนอแนะ]",
feedback_type_label: "ประเภท",
feedback_types: {
  bug: "บัก",
  suggestion: "ข้อเสนอแนะ",
  thanks: "ขอบคุณ",
  other: "อื่น ๆ",
},
feedback_body_label: "ข้อความ",
feedback_body_placeholder: "อยากบอกอะไรกับเราไหม?",
feedback_email_label: "อีเมล",
feedback_email_help: "(ไม่บังคับ — ถ้าอยากให้ติดต่อกลับ)",
feedback_email_placeholder: "you@example.com",
feedback_consent:
  "การส่งข้อเสนอแนะเท่ากับยินยอมให้เก็บข้อความและอีเมล (ถ้ามี) ไม่มีการแชร์ข้อมูลกับบุคคลที่สาม",
feedback_submit: "ส่ง",
feedback_submitting: "กำลังส่ง...",
feedback_thanks: "ขอบคุณ บันทึกข้อเสนอแนะของคุณแล้ว",
feedback_close: "ปิด",
feedback_error: "ส่งไม่สำเร็จ กรุณาลองใหม่หรือส่งอีเมลโดยตรง",
feedback_error_validation: "กรุณากรอกแบบฟอร์มให้ถูกต้อง",
feedback_error_rate_limited: "ส่งบ่อยเกินไป รอ 1 ชั่วโมงแล้วลองใหม่",
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: clean. If there's a type mismatch (EN has keys TH doesn't, etc.), the strict shape will catch it.

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/preview-strings.ts
git commit -m "feat(feedback): bilingual EN/TH strings for footer feedback form

All form labels, errors, and confirmation messages localized.
Type taxonomy (BUG/SUGGESTION/THANKS/OTHER) translated.
PDPA consent line in both languages."
```

---

## Task 6: FeedbackForm component

**Files:**
- Create: `src/components/preview/FeedbackForm.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useId } from "react";
import { STR, type Lang } from "./preview-strings";
import {
  FEEDBACK_TYPES,
  type FeedbackType,
  type FeedbackResponse,
} from "@/lib/feedback-types";

// Inline form rendered inside Footer.tsx when the visitor clicks
// "GIVE FEEDBACK". Owns all form state. Submits to /api/feedback.
// On success, replaces fields with a thank-you confirmation that
// the parent Footer collapses on close-button click.
//
// Accessibility:
// - Each input has a programmatic label via htmlFor + useId
// - Submit button has aria-busy during in-flight requests
// - Status updates announced via aria-live on the status region
//
// Honeypot:
// - Hidden "website" input, off-screen, aria-hidden, with autocomplete=off
// - Bots typically fill anything labeled "website"; humans never see it

type Status = "idle" | "submitting" | "done" | "error";

interface Props {
  lang: Lang;
  onClose: () => void;
}

export function FeedbackForm({ lang, onClose }: Props) {
  const t = STR[lang];
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const typeId = useId();
  const bodyId = useId();
  const emailId = useId();
  const statusId = useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          body: body.trim(),
          email: email.trim() || undefined,
          website: website.trim() || undefined,
        }),
      });
      const data: FeedbackResponse = await res.json();
      if (data.ok) {
        setStatus("done");
        return;
      }
      // Error branch
      const map: Record<string, string> = {
        validation: t.feedback_error_validation,
        rate_limited: t.feedback_error_rate_limited,
      };
      setErrorMsg(map[data.error] ?? t.feedback_error);
      setStatus("error");
    } catch {
      setErrorMsg(t.feedback_error);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        id={statusId}
        aria-live="polite"
        className="border-t border-white/15 mt-6 pt-6 text-sm text-white"
      >
        <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-3">
          {t.feedback_kicker}
        </div>
        <p className="mb-4 leading-relaxed">{t.feedback_thanks}</p>
        <button
          type="button"
          onClick={onClose}
          className="border border-white px-4 py-2 font-mono text-xs tracking-[0.18em] cursor-pointer min-h-[44px] hover:bg-white hover:text-black transition-colors"
          data-cursor="hover"
        >
          {t.feedback_close}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-white/15 mt-6 pt-6 flex flex-col gap-4 text-sm text-white"
      noValidate
    >
      <div className="font-mono text-[11px] tracking-[0.3em] opacity-60">
        {t.feedback_kicker}
      </div>

      {/* Type selector */}
      <fieldset className="flex flex-col gap-2">
        <legend
          id={typeId}
          className="font-mono text-[11px] tracking-[0.18em] opacity-70"
        >
          {t.feedback_type_label}
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={typeId}>
          {FEEDBACK_TYPES.map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={type === opt}
              onClick={() => setType(opt)}
              className="border border-white px-3 py-1.5 font-mono text-xs tracking-[0.1em] cursor-pointer min-h-[44px] min-w-[44px] transition-colors"
              style={{
                background: type === opt ? "#fff" : "transparent",
                color: type === opt ? "#000" : "#fff",
              }}
              data-cursor="hover"
            >
              {t.feedback_types[opt]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Body */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={bodyId}
          className="font-mono text-[11px] tracking-[0.18em] opacity-70"
        >
          {t.feedback_body_label}
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.feedback_body_placeholder}
          required
          maxLength={4000}
          rows={4}
          className="bg-transparent border border-white/20 text-white px-3 py-2 font-mono text-[13px] outline-none focus:border-white placeholder:text-white/40 resize-y min-h-[100px]"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={emailId}
          className="font-mono text-[11px] tracking-[0.18em] opacity-70"
        >
          {t.feedback_email_label}{" "}
          <span className="opacity-50">{t.feedback_email_help}</span>
        </label>
        <input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.feedback_email_placeholder}
          maxLength={254}
          autoComplete="email"
          className="bg-transparent border border-white/20 text-white px-3 py-2 font-mono text-[13px] outline-none focus:border-white placeholder:text-white/40 min-h-[44px]"
        />
      </div>

      {/* Honeypot (off-screen, aria-hidden, never tab-focusable) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="fb-website">Website</label>
        <input
          id="fb-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Consent */}
      <p className="text-[11px] leading-relaxed opacity-60 [text-wrap:pretty]">
        {t.feedback_consent}
      </p>

      {/* Error region */}
      {status === "error" && errorMsg && (
        <p
          id={statusId}
          aria-live="polite"
          className="text-[12px] text-red-400 [text-wrap:pretty]"
        >
          {errorMsg}
        </p>
      )}

      {/* Submit + close */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          aria-busy={status === "submitting"}
          disabled={status === "submitting"}
          className="border border-white bg-white text-black px-4 py-2 font-mono text-xs tracking-[0.18em] cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
          data-cursor="hover"
        >
          {status === "submitting" ? t.feedback_submitting : t.feedback_submit}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-white/40 px-4 py-2 font-mono text-xs tracking-[0.18em] cursor-pointer min-h-[44px] hover:border-white transition-colors"
          data-cursor="hover"
        >
          {t.feedback_close}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/preview/FeedbackForm.tsx
git commit -m "feat(feedback): inline FeedbackForm component

Owns all form state (type/body/email/honeypot/status/errorMsg).
POSTs to /api/feedback. On success: replaces fields with thank-you +
close button. On error: localized error message above submit, fields
remain so user can adjust.

Accessibility:
- Programmatic labels via useId + htmlFor
- aria-busy on submit during in-flight
- aria-live on status region (announces success/error)
- 44x44 minimum touch targets

Honeypot \"website\" field rendered off-screen + aria-hidden +
tabIndex=-1 — bots fill it, humans never see it."
```

---

## Task 7: Footer wiring

**Files:**
- Modify: `src/components/preview/Footer.tsx`

- [ ] **Step 1: Read current Footer.tsx structure**

```bash
cat src/components/preview/Footer.tsx
```

Identify:
- The block that renders the existing `footer_links` array (VERDEX / PORTFOLIO META / FALLBACK / STATUS)
- Whether the component is already a client component (`"use client"`)
- Where to inject the conditional `<FeedbackForm />` mount

- [ ] **Step 2: Add `useState` import + isOpen state + GIVE FEEDBACK link + conditional mount**

Modify Footer.tsx as follows. Adapt to actual file structure — these are the conceptual changes:

```tsx
"use client";

import { useState } from "react";
import { STR, type Lang } from "./preview-strings";
import { FeedbackForm } from "./FeedbackForm";
// ... other existing imports unchanged

export function Footer({ lang }: { lang: Lang }) {
  const t = STR[lang];
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // ... existing markup ...

  return (
    <footer
      id="contact"
      className="..."  // existing classes preserved
    >
      {/* ... existing content (logo, contact rail, BinaryStarField, etc.) ... */}

      {/* Existing footer_links block — add GIVE FEEDBACK as a button entry */}
      <nav aria-label="Footer links" className="...">
        {t.footer_links.map((link) => (
          <a
            key={link.k}
            href={link.href}
            className="..."
            data-cursor="hover"
          >
            {link.k} →
          </a>
        ))}
        <button
          type="button"
          onClick={() => setFeedbackOpen((v) => !v)}
          aria-expanded={feedbackOpen}
          aria-controls="feedback-form-region"
          className="..."  // matches the link styling above
          data-cursor="hover"
        >
          {t.feedback_link} {feedbackOpen ? "↑" : "→"}
        </button>
      </nav>

      {/* Inline expansion region */}
      {feedbackOpen && (
        <div id="feedback-form-region" className="max-w-[720px]">
          <FeedbackForm lang={lang} onClose={() => setFeedbackOpen(false)} />
        </div>
      )}
    </footer>
  );
}
```

If Footer.tsx is currently NOT a client component, the `"use client"` directive must be added at top. (BinaryStarField inside Footer suggests it's already client.)

- [ ] **Step 3: Verify typecheck + lint + build**

```bash
npm run typecheck && npm run lint && rm -rf .next && npm run build
```

Expected: typecheck clean, lint clean, build emits without errors, route table shows `/api/feedback`.

- [ ] **Step 4: Local visual smoke test**

```bash
npm run start > /tmp/feedback-build.log 2>&1 & sleep 5
```

Open `http://localhost:3000/` in a browser, scroll to footer, click `GIVE FEEDBACK →`. Verify:
- Footer expands to show form
- Type radio works (clicking switches selected type's color)
- Submitting with valid body + email returns "Thanks." confirmation
- Clicking CLOSE collapses the footer back
- Re-opening shows fresh empty form

```bash
kill %1 2>/dev/null; pkill -f "next-server" 2>/dev/null
```

- [ ] **Step 5: Commit**

```bash
git add src/components/preview/Footer.tsx
git commit -m "feat(feedback): footer GIVE FEEDBACK link + inline form mount

Adds a 5th entry to footer's link rail: GIVE FEEDBACK button.
Toggles isOpen state which conditionally mounts <FeedbackForm /> below
the link rail. aria-expanded + aria-controls wire the button to the
expansion region for screen readers."
```

---

## Task 8: E2E tests

**Files:**
- Create: `tests/e2e/feedback.spec.ts`

- [ ] **Step 1: Write the test file**

```ts
import { test, expect, type Page } from "@playwright/test";

// E2E coverage for the feedback feature shipped in PR A.
// Tests run against a live URL (BASE_URL env var) — works against
// local dev/prod-build, Vercel preview, or live prempawee.com.

async function freshVisitor(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {}
  });
  await page.goto("/");
}

test.describe("prempawee.com · feedback button", () => {
  test("footer link is visible after scroll", async ({ page }) => {
    await freshVisitor(page);
    // Scroll to bottom so the footer enters view
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const link = page.getByRole("button", { name: /GIVE FEEDBACK/i });
    await expect(link).toBeVisible();
  });

  test("clicking the link expands the inline form (no modal)", async ({
    page,
  }) => {
    await freshVisitor(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();
    // Form fields appear in-place
    await expect(page.getByRole("radiogroup", { name: /TYPE/i })).toBeVisible();
    await expect(page.getByLabel(/MESSAGE/i)).toBeVisible();
    await expect(page.getByLabel(/EMAIL/i)).toBeVisible();
    // No modal overlay — confirm body is still scrollable (no lock)
    const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflow).not.toBe("hidden");
  });

  test("submitting valid feedback shows the thanks confirmation", async ({
    page,
  }) => {
    await freshVisitor(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();

    // Pick a type, fill the body
    await page.getByRole("radio", { name: /SUGGESTION/i }).click();
    await page.getByLabel(/MESSAGE/i).fill("E2E test feedback — please ignore.");

    // Submit
    await page.getByRole("button", { name: /^SUBMIT$/i }).click();

    // Thanks message appears within a reasonable timeout
    await expect(
      page.getByText(/Thanks\. Your feedback is logged\./i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("honeypot field is not visible to users", async ({ page }) => {
    await freshVisitor(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();
    // The honeypot input exists in DOM but is positioned off-screen
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveCount(1);
    // Bounding box should be at negative coordinates or zero-size
    const box = await honeypot.boundingBox();
    if (box) {
      expect(box.x < 0 || box.width <= 1 || box.height <= 1).toBe(true);
    }
  });

  test("close button collapses the form", async ({ page }) => {
    await freshVisitor(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: /GIVE FEEDBACK/i }).click();
    await expect(page.getByLabel(/MESSAGE/i)).toBeVisible();
    await page.getByRole("button", { name: /^CLOSE$/i }).click();
    await expect(page.getByLabel(/MESSAGE/i)).toBeHidden();
  });
});
```

- [ ] **Step 2: Run the new tests against local dev**

```bash
npm run dev > /tmp/feedback-e2e-dev.log 2>&1 & sleep 5
until curl -sf http://localhost:3000/ -o /dev/null; do sleep 1; done
BASE_URL=http://localhost:3000 npx playwright test tests/e2e/feedback.spec.ts --reporter=list
kill %1 2>/dev/null; pkill -f "next-server" 2>/dev/null
```

Expected: 5/5 pass.

- [ ] **Step 3: Run the FULL existing E2E suite to confirm no regression**

```bash
npm run dev > /tmp/feedback-e2e-full.log 2>&1 & sleep 5
until curl -sf http://localhost:3000/ -o /dev/null; do sleep 1; done
BASE_URL=http://localhost:3000 npm run test:e2e
kill %1 2>/dev/null; pkill -f "next-server" 2>/dev/null
```

Expected: existing tests still pass + new tests pass = 10+ green, 1 skipped (the localhost CSP one per §24 fu#3).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/feedback.spec.ts
git commit -m "test(feedback): E2E coverage for footer feedback flow

5 tests:
- footer link visible after scroll
- click expands inline form (no modal scroll-lock)
- valid submission shows thanks confirmation
- honeypot field exists but is not visible to users
- close button collapses the form

Verified against local dev: 5/5 pass."
```

---

## Task 9: Verification + push + PR

- [ ] **Step 1: Final local validation gate**

```bash
rm -rf .next
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: all green. Build route table shows `/api/feedback` as ƒ (dynamic) entry.

- [ ] **Step 2: Local prod-build E2E (full suite)**

```bash
npm run start > /tmp/feedback-prodbuild.log 2>&1 & sleep 5
until curl -sf http://localhost:3000/ -o /dev/null; do sleep 1; done
BASE_URL=http://localhost:3000 npm run test:e2e
kill %1 2>/dev/null; pkill -f "next-server" 2>/dev/null
```

Expected: all green. The prod-build test catches CSP nonce + Tailwind build issues that dev mode hides.

- [ ] **Step 3: Push to remote**

```bash
git push -u origin feat/feedback-button-spec
```

- [ ] **Step 4: Open PR**

```bash
gh pr create --title "feat(feedback): footer feedback button + backend (PR A)" --body "$(cat <<'EOF'
## Summary

Implements the **PR A** scope from the feedback button spec at `docs/superpowers/specs/2026-04-26-feedback-button-design.md`.

Visitors can now submit feedback (BUG / SUGGESTION / THANKS / OTHER) from a footer button on prempawee.com. The form expands inline (no modal), persists to a new \`feedback\` Supabase table, and notifies the Foreman via the existing \`NOTIFICATION_WEBHOOK_URL\` pattern.

**Out of scope (deferred to PR B):** \`/admin/feedback\` review surface. Will ship after PR A soaks and there's actual feedback to review.

## Diff

**New files:**
- \`migrations/003_feedback.sql\` — table + CHECKs + RLS + indexes
- \`src/lib/feedback-types.ts\` — shared types
- \`src/components/preview/FeedbackForm.tsx\` — inline form
- \`src/app/api/feedback/route.ts\` — POST endpoint
- \`tests/e2e/feedback.spec.ts\` — 5 E2E tests

**Modified:**
- \`src/lib/supabase.ts\` — added \`insertFeedback()\`
- \`src/components/preview/Footer.tsx\` — GIVE FEEDBACK link + form mount
- \`src/components/preview/preview-strings.ts\` — bilingual EN/TH strings

**Watchlist files NOT touched** (\`layout.tsx\`, \`page.tsx\`, \`proxy.ts\`, \`next.config.ts\`).

## Verification

| Gate | Status |
|---|---|
| Local typecheck | ✓ |
| Local lint | ✓ |
| Local unit tests | ✓ |
| Local build | ✓ |
| Local dev E2E (5 new + existing suite) | ✓ |
| Local prod-build E2E (5 new + existing suite) | ✓ |
| Migration applied to Supabase | ✓ (manual via SQL Editor) |
| curl probe: 200 valid / 400 validation / 200 honeypot trap | ✓ |

## Risk

MEDIUM (new component + new API route + new SQL migration). Per CLAUDE.md gate, mandatory E2E run completed.

Rate limit shares the existing Upstash bucket with /api/chat (rate-limit.ts \`rl:chat\` prefix). If feedback abuse becomes an issue, splitting into a dedicated bucket is a 5-line change to rate-limit.ts.

## Test plan

- [x] Local typecheck / lint / unit / build green
- [x] Local dev + prod-build E2E green
- [x] curl validation pass / fail / honeypot pass
- [ ] CI green on this PR
- [ ] Vercel preview deploy: visit footer, submit a real feedback, confirm row in Supabase + webhook fired
- [ ] Squash and merge after CI green

## Rollback

\`git revert\` is mechanical (purely additive change). Migration is idempotent; if rollback ever needed: \`drop table public.feedback; drop type feedback_type;\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.

- [ ] **Step 5: Wait for CI to pass + merge**

Poll CI:

```bash
gh pr checks <PR_NUMBER>
```

Once typecheck + lint + test + RAG eval all SUCCESS:

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
git checkout main && git pull --ff-only
```

- [ ] **Step 6: Verify on production after Vercel deploys**

After Vercel auto-deploys main:

```bash
BASE_URL=https://prempawee.com npm run test:e2e tests/e2e/feedback.spec.ts
```

Expected: 5/5 pass against live prempawee.com. Manual verification: scroll to footer, submit a real "thanks" feedback, confirm webhook arrives + row appears in Supabase.

---

## Self-review checklist (run before declaring done)

- [ ] All 9 tasks complete, each with its own commit
- [ ] No watchlist files modified (verify with `git diff main --stat`)
- [ ] All gates green (typecheck, lint, unit, build, E2E local + prod)
- [ ] Migration verified live in Supabase (table + RLS + constraints present)
- [ ] curl probe results captured (200 valid / 400 validation / 200 honeypot trap)
- [ ] PR description references the spec at `docs/superpowers/specs/2026-04-26-feedback-button-design.md`
- [ ] Live prempawee.com submits real feedback successfully (one end-to-end smoke)

## Out of scope for PR A (tracked for PR B)

- `/admin/feedback` page (auth, list view, filters, status updates, CSV export)
- Email notification beyond webhook (e.g., direct SMTP) — webhook to Slack or Discord is sufficient
- Real-time admin updates (manual refresh is fine)
- Feedback analytics dashboard

PR B can ship 1-2 weeks after PR A once there are real feedback rows to design the admin UI against.
