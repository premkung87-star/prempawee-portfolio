-- ============================================================================
-- Migration: 001_hardening.sql
-- Project : Prempawee Portfolio (Supabase Postgres)
-- Author  : generated 2026-04-16
-- Intent  : Production-grade hardening for the public-insert tables
--           (conversations, leads, analytics) plus new audit/rate-limit
--           infrastructure.
--
-- Addresses AUDIT_LOG.md §4: the original INSERT policies used
-- `with check (true)` and were flagged as unacceptable. This migration
-- replaces them with bounded CHECK clauses, adds column CHECK constraints
-- (belt-and-suspenders), introduces a dev_audit_log and rate_limits table,
-- a SECURITY DEFINER RPC, a trigger-based soft rate limiter on
-- conversations, and a handful of missing composite / ordered indexes.
--
-- Idempotent: every statement uses IF NOT EXISTS / CREATE OR REPLACE /
-- DROP ... IF EXISTS patterns and is safe to run repeatedly.
--
-- NOTE: column CHECK constraints are added via DO $$ ... $$ blocks that
-- look up pg_constraint by name, since Postgres has no native
-- `ADD CONSTRAINT IF NOT EXISTS` for check constraints.
--
-- Rollback SQL lives at the bottom of this file, commented out.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Extensions (defensive — already enabled by supabase-schema.sql)
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Column CHECK constraints
-- ---------------------------------------------------------------------------

-- conversations.content: 1..5000 chars
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_content_len_chk'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_content_len_chk
      check (char_length(content) between 1 and 5000);
  end if;
end$$;

-- leads.email: RFC-5322-ish regex when not null
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_email_format_chk'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_email_format_chk
      check (
        email is null
        or email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
      );
  end if;
end$$;

-- leads.name <= 200
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_name_len_chk'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_name_len_chk
      check (name is null or char_length(name) <= 200);
  end if;
end$$;

-- leads.business_type <= 100
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_business_type_len_chk'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_business_type_len_chk
      check (business_type is null or char_length(business_type) <= 100);
  end if;
end$$;

-- leads.package_interest <= 50
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_package_interest_len_chk'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_package_interest_len_chk
      check (package_interest is null or char_length(package_interest) <= 50);
  end if;
end$$;

-- leads.message <= 2000
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_message_len_chk'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_message_len_chk
      check (message is null or char_length(message) <= 2000);
  end if;
end$$;

-- analytics.event_type <= 100
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_event_type_len_chk'
      and conrelid = 'public.analytics'::regclass
  ) then
    alter table public.analytics
      add constraint analytics_event_type_len_chk
      check (char_length(event_type) between 1 and 100);
  end if;
end$$;

-- analytics.event_data: must be a JSON object and <= 16KB on-disk
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'analytics_event_data_shape_chk'
      and conrelid = 'public.analytics'::regclass
  ) then
    alter table public.analytics
      add constraint analytics_event_data_shape_chk
      check (
        event_data is null
        or (
          jsonb_typeof(event_data) = 'object'
          and pg_column_size(event_data) <= 16384
        )
      );
  end if;
end$$;

-- knowledge_base.title: 1..500
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'kb_title_len_chk'
      and conrelid = 'public.knowledge_base'::regclass
  ) then
    alter table public.knowledge_base
      add constraint kb_title_len_chk
      check (char_length(title) between 1 and 500);
  end if;
end$$;

-- knowledge_base.content: 1..10000
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'kb_content_len_chk'
      and conrelid = 'public.knowledge_base'::regclass
  ) then
    alter table public.knowledge_base
      add constraint kb_content_len_chk
      check (char_length(content) between 1 and 10000);
  end if;
end$$;

-- knowledge_base.category: allowed list
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'kb_category_allowed_chk'
      and conrelid = 'public.knowledge_base'::regclass
  ) then
    alter table public.knowledge_base
      add constraint kb_category_allowed_chk
      check (category in (
        'project', 'skill', 'bio', 'faq', 'package', 'testimonial'
      ));
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- 2. Tighten RLS INSERT policies (replace `with check (true)`)
-- ---------------------------------------------------------------------------

-- conversations
drop policy if exists "Public insert conversations" on public.conversations;
create policy "Public insert conversations"
  on public.conversations
  for insert
  with check (
    role in ('user', 'assistant')
    and session_id is not null
    and char_length(session_id) between 1 and 200
    and content is not null
    and char_length(content) between 1 and 5000
    and (tokens_used is null or tokens_used between 0 and 100000)
  );

-- analytics
drop policy if exists "Public insert analytics" on public.analytics;
create policy "Public insert analytics"
  on public.analytics
  for insert
  with check (
    event_type is not null
    and char_length(event_type) between 1 and 100
    and (
      event_data is null
      or (
        jsonb_typeof(event_data) = 'object'
        and pg_column_size(event_data) <= 16384
      )
    )
    and (session_id is null or char_length(session_id) <= 200)
  );

-- leads
drop policy if exists "Public insert leads" on public.leads;
create policy "Public insert leads"
  on public.leads
  for insert
  with check (
    (name is null or char_length(name) <= 200)
    and (
      email is null
      or (
        char_length(email) <= 320
        and email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
      )
    )
    and (line_id is null or char_length(line_id) <= 100)
    and (business_type is null or char_length(business_type) <= 100)
    and (package_interest is null or char_length(package_interest) <= 50)
    and (message is null or char_length(message) <= 2000)
    and (source is null or char_length(source) <= 100)
  );

-- ---------------------------------------------------------------------------
-- 3. dev_audit_log table (autonomous-run records)
-- ---------------------------------------------------------------------------
create table if not exists public.dev_audit_log (
  id          bigint primary key generated always as identity,
  run_id      text not null,
  stage       text not null check (stage in ('research', 'fix', 'deploy', 'summary')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  summary     text,
  details     jsonb not null default '{}'::jsonb,
  success     boolean
);

create index if not exists idx_dev_audit_run_id on public.dev_audit_log (run_id);
create index if not exists idx_dev_audit_stage  on public.dev_audit_log (stage);

alter table public.dev_audit_log enable row level security;

-- Force RLS even for table owners to avoid accidental leaks.
alter table public.dev_audit_log force row level security;

-- service-role only (no anon/authenticated access).
drop policy if exists "dev_audit_log service all" on public.dev_audit_log;
create policy "dev_audit_log service all"
  on public.dev_audit_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4. rate_limits table (KV fallback)
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  id         bigint primary key generated always as identity,
  bucket_key text not null,
  count      int  not null default 0 check (count >= 0),
  reset_at   timestamptz not null,
  constraint rate_limits_bucket_key_unique unique (bucket_key)
);

create index if not exists idx_rate_limits_reset_at on public.rate_limits (reset_at);

alter table public.rate_limits enable row level security;
alter table public.rate_limits force row level security;

drop policy if exists "rate_limits service all" on public.rate_limits;
create policy "rate_limits service all"
  on public.rate_limits
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 5. Missing useful indexes
-- ---------------------------------------------------------------------------
-- conversations(session_id, created_at desc) — for recent-per-session lookups
create index if not exists idx_conv_session_created_desc
  on public.conversations (session_id, created_at desc);

-- analytics(created_at desc) — for time-series scans
create index if not exists idx_analytics_created_desc
  on public.analytics (created_at desc);

-- knowledge_base(category, id) — for filtered list pagination
create index if not exists idx_kb_category_id
  on public.knowledge_base (category, id);

-- ---------------------------------------------------------------------------
-- 6. RPC: log_dev_run (SECURITY DEFINER, append-only)
-- ---------------------------------------------------------------------------
create or replace function public.log_dev_run(
  p_run_id  text,
  p_stage   text,
  p_summary text,
  p_details jsonb,
  p_success boolean
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id bigint;
begin
  if p_run_id is null or char_length(p_run_id) = 0 then
    raise exception 'log_dev_run: p_run_id must be non-empty';
  end if;
  if p_stage not in ('research', 'fix', 'deploy', 'summary') then
    raise exception 'log_dev_run: invalid stage %', p_stage;
  end if;

  insert into public.dev_audit_log (
    run_id, stage, started_at, finished_at, summary, details, success
  )
  values (
    p_run_id,
    p_stage,
    now(),
    now(),
    p_summary,
    coalesce(p_details, '{}'::jsonb),
    p_success
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Lock ownership + execute privileges: only service_role may call it.
revoke all on function public.log_dev_run(text, text, text, jsonb, boolean) from public;
revoke all on function public.log_dev_run(text, text, text, jsonb, boolean) from anon, authenticated;
grant execute on function public.log_dev_run(text, text, text, jsonb, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- 7. Trigger: soft rate limit on conversations
--    (<= 100 rows per session_id in the trailing 1 hour)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_conversations_session_rate_limit()
returns trigger
language plpgsql
as $$
declare
  v_count int;
begin
  if new.session_id is null then
    return new;
  end if;

  select count(*)
    into v_count
    from public.conversations
   where session_id = new.session_id
     and created_at >= now() - interval '1 hour';

  if v_count >= 100 then
    raise exception
      'conversations rate limit: session % exceeded 100 messages/hour (current=%)',
      new.session_id, v_count
      using errcode = '23514';  -- check_violation
  end if;

  return new;
end;
$$;

drop trigger if exists trg_conversations_rate_limit on public.conversations;
create trigger trg_conversations_rate_limit
  before insert on public.conversations
  for each row
  execute function public.enforce_conversations_session_rate_limit();

commit;

-- ============================================================================
-- ROLLBACK (inverse migration) — uncomment and run to undo 001_hardening.sql
-- ============================================================================
-- begin;
--
-- -- 7. trigger
-- drop trigger if exists trg_conversations_rate_limit on public.conversations;
-- drop function if exists public.enforce_conversations_session_rate_limit();
--
-- -- 6. rpc
-- drop function if exists public.log_dev_run(text, text, text, jsonb, boolean);
--
-- -- 5. indexes
-- drop index if exists public.idx_kb_category_id;
-- drop index if exists public.idx_analytics_created_desc;
-- drop index if exists public.idx_conv_session_created_desc;
--
-- -- 4. rate_limits
-- drop policy if exists "rate_limits service all" on public.rate_limits;
-- drop table if exists public.rate_limits;
--
-- -- 3. dev_audit_log
-- drop policy if exists "dev_audit_log service all" on public.dev_audit_log;
-- drop table if exists public.dev_audit_log;
--
-- -- 2. restore permissive insert policies (as in supabase-schema.sql)
-- drop policy if exists "Public insert leads" on public.leads;
-- create policy "Public insert leads" on public.leads
--   for insert with check (true);
--
-- drop policy if exists "Public insert analytics" on public.analytics;
-- create policy "Public insert analytics" on public.analytics
--   for insert with check (true);
--
-- drop policy if exists "Public insert conversations" on public.conversations;
-- create policy "Public insert conversations" on public.conversations
--   for insert with check (true);
--
-- -- 1. drop column CHECK constraints
-- alter table public.knowledge_base drop constraint if exists kb_category_allowed_chk;
-- alter table public.knowledge_base drop constraint if exists kb_content_len_chk;
-- alter table public.knowledge_base drop constraint if exists kb_title_len_chk;
-- alter table public.analytics      drop constraint if exists analytics_event_data_shape_chk;
-- alter table public.analytics      drop constraint if exists analytics_event_type_len_chk;
-- alter table public.leads          drop constraint if exists leads_message_len_chk;
-- alter table public.leads          drop constraint if exists leads_package_interest_len_chk;
-- alter table public.leads          drop constraint if exists leads_business_type_len_chk;
-- alter table public.leads          drop constraint if exists leads_name_len_chk;
-- alter table public.leads          drop constraint if exists leads_email_format_chk;
-- alter table public.conversations  drop constraint if exists conversations_content_len_chk;
--
-- commit;
-- ============================================================================
