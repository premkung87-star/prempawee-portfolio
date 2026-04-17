# Supabase Migrations

SQL migrations that can't be applied through `@supabase/supabase-js` (the
service-role JWT grants REST/PostgREST + RPC access, but not DDL). Paste each
file into the Supabase Dashboard → SQL Editor to apply.

## 001_hardening.sql

Production-grade hardening for the public-insert tables (conversations, leads,
analytics) plus new audit/rate-limit infrastructure. Addresses `AUDIT_LOG.md`
§4 (`with check (true)` was equivalent to no security).

**What it does:**

1. Adds column-level `CHECK` constraints — length caps on conversations /
   leads / analytics / knowledge_base; email format regex; category allow-list
   on knowledge_base; JSON-object shape + 16KB size cap on analytics.event_data.
2. Replaces `with check (true)` RLS INSERT policies with bounded checks that
   mirror the column constraints (belt-and-suspenders).
3. Creates `dev_audit_log` table for autonomous-run records (service-role
   only, force RLS).
4. Creates `rate_limits` table (service-role only) as an in-DB fallback store.
5. Adds useful indexes: `(session_id, created_at desc)` on conversations,
   `(created_at desc)` on analytics, `(category, id)` on knowledge_base.
6. Creates `log_dev_run(run_id, stage, summary, details, success)` RPC
   (SECURITY DEFINER, append-only).
7. Adds a trigger on `conversations` enforcing ≤ 100 rows per session per
   hour (soft DB-level backstop behind the app-level Upstash limiter).

Every statement is idempotent — safe to run multiple times.

## Pre-flight (run these BEFORE applying to catch existing-data issues)

CHECK constraints validate immediately. If any current row violates the new
limits, `ALTER TABLE` will fail. Paste into SQL Editor before the migration:

```sql
-- Should all return 0
select count(*) from conversations where char_length(content) = 0 or char_length(content) > 5000;
select count(*) from leads where name is not null and char_length(name) > 200;
select count(*) from leads
  where email is not null
    and email !~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$';
select count(*) from leads where business_type is not null and char_length(business_type) > 100;
select count(*) from leads where package_interest is not null and char_length(package_interest) > 50;
select count(*) from leads where message is not null and char_length(message) > 2000;
select count(*) from analytics where char_length(event_type) = 0 or char_length(event_type) > 100;
select count(*) from analytics
  where event_data is not null
    and (jsonb_typeof(event_data) != 'object' or pg_column_size(event_data) > 16384);
select count(*) from knowledge_base where char_length(title) = 0 or char_length(title) > 500;
select count(*) from knowledge_base where char_length(content) = 0 or char_length(content) > 10000;
select count(*) from knowledge_base
  where category not in ('project', 'skill', 'bio', 'faq', 'package', 'testimonial');
```

If any return > 0, fix the offending rows first (shorten, fix email, etc.) or
adjust the constraint bounds in `001_hardening.sql` before applying.

## Apply

1. Run the pre-flight block above. All counts should be 0.
2. Open the migration file and paste the full contents (including `begin;` and
   `commit;`) into the SQL Editor. Run.
3. Verify:
   ```sql
   -- Should list all new check constraints
   select conname from pg_constraint where conrelid = 'public.conversations'::regclass;
   -- Should list the new tables
   select tablename from pg_tables where schemaname = 'public' and tablename in ('dev_audit_log', 'rate_limits');
   ```

## Rollback

The inverse migration lives as a commented-out block at the bottom of
`001_hardening.sql`. Copy the lines between `-- begin;` and `-- commit;`,
uncomment, paste into the SQL Editor, run.

## After applying

The `src/lib/supabase.ts` file exports `supabaseAdmin` (service-role client).
Once the migration is in, you can use it to:

- Write to `dev_audit_log` via the `log_dev_run(...)` RPC for future
  autonomous-run records.
- Use `rate_limits` as a secondary rate-limit store if Upstash is unavailable
  (code in `src/lib/rate-limit.ts` would need a small tweak to add the
  Supabase fallback branch).
- Upsert new `knowledge_base` entries from scripts
  (see `scripts/refresh-knowledge-base.mjs`).

## Backups

Supabase Pro includes **automatic daily backups** (7-day retention). No action
required to enable. To verify restore-path health once a quarter:

1. Dashboard → Database → Backups → pick a recent backup → "Restore to new project"
2. Target a throwaway Supabase project (free tier is fine)
3. Verify `select count(*) from knowledge_base` matches production
4. Tear down the test project

For on-demand backups: Dashboard → Database → Backups → "Create a backup".

See `docs/OPERATIONS.md` for the full runbook.
