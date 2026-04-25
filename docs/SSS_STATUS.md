# SSS Infrastructure Status

Snapshot after Path-A full build-out (all 10 items). Refresh when axes move. Last refreshed 2026-04-25 (Session 5: Saturday-launch sweep — 4 PRs merged, prod E2E 6/6 green, /case-studies/verdex indexable with real WebP assets, personal-LINE CTA wired).

## The 10 axes

| # | Item | Status | Verify |
|---|---|---|---|
| 1 | **Sentry + 3 alerts** | ✅ 2/3 alerts live, p95 rule deferred | DSN configured (§22), SDK loads under Turbopack (§23–§24), CSP unblocked (§25). Session 5 (2026-04-25): Alert 1 (error rate > 1%) and Alert 3 (RAG fetch failure) created via Sentry UI as Issue Alerts. Alert 2 (p95 latency on /api/chat) deferred — portfolio traffic too low for p95 to be meaningful signal pre-launch; revisit after ~200+ sessions accumulate. |
| 2 | **pgvector semantic + hybrid rerank** | ✅ Live (verified 2026-04-25) | Migration `002_semantic.sql` applied, `match_knowledge_hybrid` RPC callable, all 22 `knowledge_base` rows have OpenAI `text-embedding-3-small` (1536-dim) embeddings. Hybrid retrieval exercised on every `/api/chat` request — server log shows `semantic.{provider, model, top_ids, top_scores}` per turn. Cross-lingual TH↔EN retrieval verified (5 direct RPC probes + chat-route runtime probe). |
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

## Semantic RAG: one-time setup (✅ already complete)

The activation below was completed in Session 2 (2026-04-17 late afternoon)
and verified in Session 4 (2026-04-25). Re-run only if you add new
`knowledge_base` entries.

```bash
# 1. Apply the migration (Supabase SQL Editor — paste migrations/002_semantic.sql, run)
#    DONE — match_knowledge_hybrid RPC callable, idx_kb_embedding_ivfflat present

# 2. Set OPENAI_API_KEY in Vercel env (already done across all 3 envs)

# 3. Generate embeddings for existing rows
vercel env pull .env.local
npm run kb:embed
#    DONE — 22/22 rows embedded with text-embedding-3-small (1536-dim)

# 4. Re-run anytime you add new knowledge_base entries:
npm run kb:embed           # only embeds null-embedding rows
npm run kb:embed --force   # regenerates all
```

The chat route falls back to full-context retrieval if semantic infra
isn't configured — no regression risk, you can roll out gradually.

**Verification probe** — re-run anytime to confirm axis #2 is healthy:

```bash
node --env-file=.env.local --input-type=module -e '
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }});
const v = new Array(1536).fill(0);
const { error } = await sb.rpc("match_knowledge_hybrid", { query_embedding: v, query_text: "ping", match_count: 1, semantic_weight: 0.6, fulltext_weight: 0.4, category_filter: null });
const { count } = await sb.from("knowledge_base").select("id", { count: "exact", head: true }).not("embedding", "is", null);
console.log({ rpc_ok: !error, embedded_rows: count });
'
```

Healthy output: `{ rpc_ok: true, embedded_rows: 22 }` (or whatever the
current row count is — what matters is `embedded_rows == total_rows`).

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

### Completed (Session 4, 2026-04-25)

| Item | Completion note | Completed in |
|---|---|---|
| Semantic RAG axis #2 | Doc-reality drift discovered: activation actually shipped Session 2 (per AUDIT_LOG line 393) but SSS_STATUS row never flipped. Verified live 2026-04-25 via 5 direct RPC probes (3 EN + 2 TH) + chat-route runtime probe. All 22/22 rows embedded; `top_ids` consistent across direct-RPC vs chat-route paths. See AUDIT_LOG §32. | Session 4 |

### Completed (Session 5, 2026-04-25 — Saturday-launch sweep)

8 PRs merged in a single working day to close the bounded weakness list and ship the upgrade phase, all under the Sunday 2026-04-26 12:00 BKK hard cap. See AUDIT_LOG §33.

| Item | Completion note | Completed in |
|---|---|---|
| Sentry alerts (axis #1) | Alerts 1 (error rate >1%) + 3 (RAG fetch failure) created via Sentry UI. Alert 2 (p95 latency on /api/chat) deferred — portfolio traffic too low for p95 to be meaningful pre-launch; revisit after ~200+ sessions. Axis flipped 🟡 → ✅ (2/3 alerts live, p95 deferred). | Session 5 |
| GROUNDING RULE on chatbot | `src/app/api/chat/route.ts` `baseSystemPrompt` now opens with explicit anti-fabrication block. Forbids invented uptime numbers, iteration counts, package names, prices outside the 3 official ones. Closes RAG-eval `avg_faithfulness` 0.495 measurement defect path (PR #18). | Session 5 |
| Sentry §24 follow-ups closed | `src/instrumentation-client.ts` adds `onRouterTransitionStart` for Turbopack nav traces. E2E CSP-header test env-scoped to skip on localhost dev (PR #19). | Session 5 |
| CI middleware/proxy guard | New first step in `.github/workflows/ci.yml` `check` job: hard-fails any commit where both `src/middleware.ts` AND `src/proxy.ts` exist. Prevents §18 ping-pong recurrence (PR #20). | Session 5 |
| VerdeX Farm case study | New route `/case-studies/verdex` with stub-first pattern. Conditional noindex via `hasStubbedScreenshots`. Real WebP assets landed in PR #24 (5 images, ~210 KB total, dimensions measured) — page now indexable, sitemap updated (PRs #21, #24). | Session 5 |
| How-I-work 4-step ribbon | New section above chat on first load. Auto-hides once messages start. Bilingual EN/TH. Content mirrors KB row #18 verbatim — no hallucination surface. Adds visible CTA (PR #22). | Session 5 |
| Lighthouse-grade tap targets | EN/TH toggles, PDPA "I understand", suggested prompt chips all bumped to clear 24×24 mobile tap-target audit. Lighthouse mobile a11y holds at 98 (PR #23). | Session 5 |
| Personal LINE CTA | `CONTACT.contactUrl` swapped from mailto fallback to direct LINE URL. Both anchors get `target="_blank" rel="noopener noreferrer"`. Mailto preserved as `mailtoFallback`. Captures Thai-buyer intake at zero friction (PR #24). | Session 5 |
| KB +8 buyer-FAQ rows | NDA / payment / maintenance / equity / hours / Day-1 deliverables / bilingual handover / timeline drift answers added to `knowledge_base`. All 7 facts decided by Foreman, no improvisation. Plus 1-row drift fix between `supabase-seed.sql` and `scripts/refresh-knowledge-base.mjs`. KB now 30 rows, all embedded. RAG eval 10/10 from CI runner-IP (PR #27). | Session 5 |
| Launch announcement drafts | 4 ready-to-publish drafts at `docs/launch/`: LinkedIn bilingual, LINE Timeline TH, X EN thread (5 tweets), Fastwork bullet-update prompt. Same GROUNDING RULE applied — every numeric/proper-noun claim KB-traceable (PR #26). | Session 5 |
| Post-launch 48h runbook | New `docs/POST_LAUNCH_RUNBOOK.md` with pre-launch checklist, hourly-cadence triggers for first 4h, daily check-ins through Day 7, rollback procedure with PR #21–#24 SHAs verbatim (PR #25). | Session 5 |
| Lighthouse baseline (mobile / desktop) | 94/98/96/100 mobile · 96/98/96/100 desktop. CWV: CLS 0.005 / 0.001, LCP 1.7s / 0.8s. Diagnostics flagged (defer post-launch): Reduce unused JS 198 KiB, forced reflow on chat scroll, legacy JS 15 KiB, Document main landmark (fixed in this PR). | Session 5 |

Once all those are through, every axis of the SSS ranking reaches its
maximum. The code infrastructure — the part under my control — is already
complete.
