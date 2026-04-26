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
-- Plan    : docs/superpowers/plans/2026-04-26-feedback-button-pr-a.md
-- Idempotent: every statement uses IF NOT EXISTS / DO blocks for constraints.
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

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'feedback_ip_prefix_len_chk'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_ip_prefix_len_chk
      check (ip_prefix is null or char_length(ip_prefix) <= 64);
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
