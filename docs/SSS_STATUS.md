# SSS Infrastructure Status

Snapshot after Path-A full build-out (all 10 items). Refresh when axes move. Last refreshed 2026-04-19 (Session 2 close: axes #1/#7/#8 updated).

## The 10 axes

| # | Item | Status | Verify |
|---|---|---|---|
| 1 | **Sentry + 3 alerts** | 🟡 Transport live, alert rules pending | DSN configured (§22), SDK loads under Turbopack (§23–§24), CSP unblocked (§25), 52 spans captured in preview env. Alert rules config deferred to Session 4. |
| 2 | **pgvector semantic + hybrid rerank** | ⚠️ Code + SQL live, embeddings pending | Apply `migrations/002_semantic.sql` in Supabase SQL Editor, set `OPENAI_API_KEY` in Vercel env, then `npm run kb:embed`. Hybrid retrieval activates per-request. |
| 3 | **Ragas-style eval in CI** | ✅ Live | `npm run eval:rag` — 10 probes + LLM-as-judge faithfulness/relevancy. CI job `ragas-eval` blocks merge if threshold (default 0.7) not met. |
| 4 | **1h prompt caching** | ✅ Live | `cacheControl: { type: 'ephemeral', ttl: '1h' }` on system prompt. `/admin/finops` shows `cache_read_tokens` — aim for >80% hit rate once warm. |
| 5 | **Edge runtime + region pin** | ✅ Edge live, region pin pending | `/api/chat` declares `runtime = 'edge'`. For Supabase region pinning: Dashboard → Project Settings → Compute → set region closest to Vercel (iad1 default). |
| 6 | **Vercel WAF + BotID** | ⚠️ Code live, Pro upgrade pending | Middleware calls `checkBotId` with graceful fallback. Enable WAF + BotID in Vercel Dashboard → Firewall after upgrading to Pro. |
| 7 | **Preview-per-PR + required checks** | ✅ Live | CI runs on PR + branch protection enforced on `main` (2026-04-19). Required checks: `typecheck + lint + test`, `RAG answer quality`. Admin bind enabled (`enforce_admins=true`). Verified via GH006 rejection test. |
| 8 | **Custom domain + SSL A+** | 🟢 Live, HSTS preload pending Chrome review | Domain `prempawee.com` attached to Vercel. HSTS header deployed (`max-age=63072000; includeSubDomains; preload`). hstspreload.org status: `pending` (API verified 2026-04-19). SSL Labs A+ audit: outstanding. |
| 9 | **Post-mortem template + status page** | ✅ Live | Template at `docs/templates/POSTMORTEM.md`. Live status page at `/status` — real-time health checks on Supabase / Anthropic / Upstash / edge. |
| 10 | **FinOps token + cost dashboard** | ✅ Live | `/admin/finops` — 30-day cost, projected monthly, cache hit rate, daily chart, top sessions. Uses Claude Sonnet 4 pricing (update `CLAUDE_PRICING` when Anthropic changes). |

## Sentry: the 3 required alert rules

Configure in Sentry project UI → Alerts → Create Alert Rule. Our SDK emits
everything needed; these rules turn them into actionable alerts.

### Alert 1 — Error rate > 1%

- **Rule type:** Issue Alert (or Metric Alert)
- **Condition:** Number of errors is above **1%** of transactions in **5 minutes**
- **Filter:** `environment = production`
- **Action:** Email + Slack/Discord webhook

### Alert 2 — p95 latency on /api/chat > 3s

- **Rule type:** Metric Alert → Performance
- **Metric:** `transaction.duration` p95
- **Filter:** `transaction:/api/chat AND environment:production`
- **Threshold:** above **3000ms** for **5 minutes**
- **Action:** Email

### Alert 3 — RAG fetch failure

- **Rule type:** Issue Alert
- **Filter:** `event.message:"supabase.knowledge.all.failed" OR "supabase.knowledge.query.failed" OR "supabase.hybrid-search.failed"`
- **Threshold:** **any** event in the last **5 minutes**
- **Action:** Email (these should be very rare; even one matters)

## Semantic RAG: one-time setup

```bash
# 1. Apply the migration (Supabase SQL Editor — paste the contents of
#    migrations/002_semantic.sql, run)

# 2. Set OPENAI_API_KEY in Vercel env (upsert via Vercel API or dashboard)

# 3. Pull env locally + generate embeddings for existing rows
vercel env pull .env.local
npm run kb:embed

# 4. (Optional) re-run anytime you add new knowledge_base entries:
npm run kb:embed           # only embeds null-embedding rows
npm run kb:embed --force   # regenerates all
```

The chat route falls back to full-context retrieval if semantic infra
isn't configured — no regression risk, you can roll out gradually.

## GitHub branch protection (Item 7 finalization)

This is a repo-admin action, not a code change. Once you're ready:

```bash
gh api repos/premkung87-star/prempawee-portfolio/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["typecheck + lint + test","RAG answer quality"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews=null \
  --field restrictions=null
```

(The Vercel preview deploy status will auto-add itself to the required-
context list once Vercel's GitHub integration sees PRs.)

> **Session 2 note (2026-04-19):** Branch protection was configured via GitHub UI
> (Settings → Branches → classic rule) instead of the `gh api` command above.
> Final applied config: `enforce_admins=true` (stricter than the template),
> required checks = `["typecheck + lint + test", "RAG answer quality"]`,
> linear history enforced, force-push and deletion blocked.

## Custom domain attach (Item 8 finalization)

```bash
# After you've bought the domain + pointed DNS at Vercel:
DOMAIN=prempawee.com npm run attach:domain

# Then manually:
# - https://hstspreload.org/?domain=prempawee.com → submit preload
# - https://www.ssllabs.com/ssltest/analyze.html?d=prempawee.com → verify A+
```

## What changes grade to true SSS

Still ⚠️ (user-gated) after this build:

| Item | Unlock action | ETA |
|---|---|---|
| Sentry | Create account + paste DSN | 5 min |
| Semantic RAG | Paste OpenAI key + run `npm run kb:embed` | 10 min |
| Vercel WAF + BotID | Pro upgrade ($20/mo) | 2 min checkout |
| Supabase region pin | Dashboard setting | 1 min |

### Completed (Session 2 close, 2026-04-19)

| Item | Completion note | Completed in |
|---|---|---|
| Custom domain | `prempawee.com` attached to Vercel, HSTS preload submitted (status: pending) | Session 2 |
| Branch protection | Configured via GitHub UI (classic rule), verified via GH006 test | Session 2 |

Once all those are through, every axis of the SSS ranking reaches its
maximum. The code infrastructure — the part under my control — is already
complete.
