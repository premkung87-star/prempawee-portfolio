# Operations guide — Prempawee Portfolio

Runbooks for ongoing operations. Pair with `AUDIT_LOG.md` (root) for the
historical list of patterns-to-avoid.

## Production surface

- **URL**: https://prempawee-portfolio.vercel.app
- **Vercel project**: `premkung87-stars-projects/prempawee-portfolio`
- **GitHub repo**: https://github.com/premkung87-star/prempawee-portfolio
- **Supabase project**: `eirrhcdjcswttrkigwzw` (pro plan)
- **Upstash Redis**: `obliging-seal-100531` (free tier)
- **Region**: `iad1` (US East)

## Secrets / env matrix

Set in Vercel project env for Production + Preview + Development:

| Name | Purpose | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API access | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe key (new `sb_publishable_*`) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key (`sb_secret_*`) | ✅ |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis rate limiter | Auto-injected by integration |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for sitemap / OG | Optional |
| `REVALIDATE_SECRET` | Secret for `/api/revalidate` RAG cache clear | Optional |
| `ADMIN_SECRET` | Cookie value for `/admin` | Optional (admin disabled without it) |
| `NOTIFICATION_WEBHOOK_URL` | Slack/Discord/n8n URL for lead alerts | Optional |
| `SENTRY_DSN` | Error tracking (see §Observability) | Optional |
| `FLAG_*` | Runtime feature flags (see `src/lib/feature-flags.ts`) | Optional |

## Day-to-day tasks

### Update RAG content

Edit `scripts/refresh-knowledge-base.mjs` (add / modify entries in `ENTRIES`),
then:

```bash
npm run kb:refresh
# Then clear the 5-min in-memory cache so visitors see it immediately:
curl -X POST https://prempawee-portfolio.vercel.app/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET"
```

Alternatively, edit the `knowledge_base` table directly in the Supabase
dashboard and call `/api/revalidate`.

### Watch new leads

- **Admin UI**: https://prempawee-portfolio.vercel.app/admin/leads (requires `ADMIN_SECRET` cookie — log in at `/admin/login`)
- **Webhook**: set `NOTIFICATION_WEBHOOK_URL` to a Slack/Discord/n8n incoming-webhook URL. Lead inserts POST a JSON payload:
  ```json
  {"event":"lead.captured","timestamp":"...","lead":{"id":..,"email":"...",...}}
  ```
- **Direct SQL**: `select * from leads order by created_at desc limit 20` in Supabase SQL Editor.

### Review conversations

- **Admin UI**: `/admin/conversations` — last 30 sessions grouped by `session_id`.
- **Direct SQL**: query the `conversations` table in Supabase.

### Rotate a secret

1. Generate new value (Anthropic console / Supabase API Keys tab / Upstash / etc.)
2. Update Vercel env via API (same-shot for all 3 environments):
   ```bash
   TOKEN=$(python3 -c "import json; print(json.load(open(\"$HOME/Library/Application Support/com.vercel.cli/auth.json\"))['token'])")
   curl -s -X POST "https://api.vercel.com/v10/projects/prempawee-portfolio/env?teamId=team_Aiz7wItp92y8Ea5zqwGITwlv&upsert=true" \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"key":"NAME","value":"NEW_VALUE","type":"encrypted","target":["production","preview","development"]}'
   ```
3. Update `.env.local` locally.
4. Redeploy: `vercel deploy --prod --yes` (or push a commit — GitHub auto-deploys).
5. Revoke the old value in its source system.

### Run the answer-quality eval

```bash
npm run eval:rag
# or against a different target:
EVAL_TARGET=http://localhost:3000 npm run eval:rag
```

10 canned probes covering the core tools + identity + objection-handling +
multilingual triggers. Exits 1 on any failure. Good thing to run after editing
the system prompt.

### Clear the rate-limit bucket (unbrick dev)

```bash
UPSTASH_URL=$(grep KV_REST_API_URL .env.local | cut -d= -f2 | tr -d '"')
UPSTASH_TOKEN=$(grep KV_REST_API_TOKEN .env.local | cut -d= -f2 | tr -d '"')
curl -X POST "$UPSTASH_URL/flushdb" -H "Authorization: Bearer $UPSTASH_TOKEN"
```

Or surgical delete of just rate-limit keys:
```bash
curl -X POST "$UPSTASH_URL/keys/rl:chat*" -H "Authorization: Bearer $UPSTASH_TOKEN"
# then DEL each returned key
```

## Observability

### Current

- **Vercel Analytics + Speed Insights** (enabled in `src/app/layout.tsx`)
- **Structured JSON logs** (`src/lib/logger.ts`) visible in Vercel Runtime Logs and via `mcp__plugin_vercel_vercel__get_runtime_logs`
- **`dev_audit_log` table** for autonomous-run records

### Recommended next step — error tracking

Without real error aggregation, a 500 in prod goes unnoticed until a visitor
complains. Two options:

**Option A — Sentry (most full-featured):**
1. Create a free Sentry project at https://sentry.io
2. `npm i @sentry/nextjs`
3. Run `npx @sentry/wizard@latest -i nextjs`
4. Set `SENTRY_DSN` in Vercel env
5. The logger in `src/lib/logger.ts` can be extended to forward `logError()` calls to Sentry.

**Option B — Axiom or similar via Vercel Log Drain (cheaper, log-only):**
1. Sign up at https://axiom.co (free tier)
2. Vercel Dashboard → Integrations → Axiom → connect
3. Structured JSON logs automatically get parsed and indexed.
4. Set up alerts on `"level":"error"` fields.

Both are non-invasive — do either when you're ready.

## Database backup

Supabase Pro includes **automatic daily backups** with a 7-day retention
window. These are point-in-time, no action needed to activate.

**Manual / on-demand**: Dashboard → Database → Backups → "Create a backup".

**Restore dry-run** (recommended once a quarter to verify):
1. Create a new Supabase project (free tier is fine for a test).
2. Dashboard → Database → Backups → click a recent backup → "Restore" → target the new project.
3. Verify `knowledge_base` row count matches original.
4. Delete the test project.

For catastrophic loss, the path is: Dashboard → Database → Backups → Restore.
Plan on ~minutes of downtime during restore.

## Deploy pipeline

- `main` branch = production (auto-deploys on push)
- No staging — every merge is live
- To stage, open a PR against `main`. Vercel will create a preview deployment
  for the PR branch automatically (since the repo is git-linked and public).
- CI runs on push + PR: typecheck + lint + test (see `.github/workflows/ci.yml`)

## Known limitations

- **Single admin, no multi-user** — `ADMIN_SECRET` is a shared static token. For more, migrate to Supabase Auth.
- **Rate limiter scope is IP** — not per-session-cookie. A visitor behind the same NAT shares a quota with neighbors.
- **No queue / background jobs** — if future features need async processing (send an email, summarize a long conversation, etc.), add Upstash QStash.
- **Repo is public** — Hobby-plan constraint. Private repo needs Vercel Pro OR commit-author email matching the Vercel team owner.
- **Custom domain not attached** — still on `*.vercel.app`.
