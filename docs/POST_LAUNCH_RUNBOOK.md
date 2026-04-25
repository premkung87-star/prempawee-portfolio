# Post-launch runbook — prempawee.com

Operational playbook for the first week after the Sun 2026-04-26 12:00 Bangkok hard launch. Pair with `docs/OPERATIONS.md` for steady-state runbooks and `AUDIT_LOG.md` for failure-mode history.

Time budget: ~5 minutes per dashboard skim; ~30 minutes per scheduled check-in window. If a decision-trigger fires, drop everything and execute the linked action.

---

## Launch declaration

### Pre-launch checklist (T-1h, run at 11:00 Bangkok Sun 2026-04-26)

GitHub-task-list format — every line is one observable check. Tick in the launch tracking issue (or paste this block into a personal note and tick locally).

- [ ] `BASE_URL=https://prempawee.com npm run test:e2e` — green (real-browser verification per AGENTS.md watchlist rule)
- [ ] `npm run typecheck && npm run test && npm run build` — green on local main
- [ ] `npm run eval:rag` — `overall_score >= 0.7` against current production
- [ ] `curl -I https://prempawee.com/sitemap.xml` — 200 OK, `last-modified` within last 24h
- [ ] `curl -sI https://prempawee.com/robots.txt | grep -i 'allow\|disallow'` — confirms indexable (no blanket `Disallow: /`)
- [ ] `curl -I https://prempawee.com` — 200 OK, `strict-transport-security: max-age=63072000; includeSubDomains; preload` present
- [ ] Sentry Issues dashboard — zero unresolved CRITICAL or HIGH severity issues in last 24h
- [ ] Vercel Runtime Logs — no `level=error` lines in last 1h
- [ ] `/admin/finops` — projected monthly cost within budget envelope (spot-check, no anomaly)
- [ ] Supabase — `select count(*) from knowledge_base where embedding is not null` returns full row count (semantic RAG healthy, axis #2)
- [ ] LinkedIn launch post drafted in Plan A queue, scheduled or ready to fire at 12:00
- [ ] Personal LINE handle (`CONTACT.contactUrl` in `src/lib/portfolio-data.ts`) verified by clicking from incognito mobile

### Hard launch criteria (T=0, 12:00 Bangkok Sun 2026-04-26)

All MUST be true at launch instant. If any fails, hold the LinkedIn post and triage first.

| # | Criterion | Verify command |
|---|---|---|
| 1 | Site loads, consent button clickable, chat streams a response | Real browser from incognito (mobile + desktop) |
| 2 | E2E suite green against production | `BASE_URL=https://prempawee.com npm run test:e2e` |
| 3 | Sentry transport active (envelope POSTs return 200) | DevTools Network tab on a live page load |
| 4 | `/api/chat` p95 latency < 5s under cold start | Vercel Speed Insights `/api/chat` route |
| 5 | RAG eval ≥ 0.7 in last run | `npm run eval:rag` output |
| 6 | No open watchlist-file PR pending merge | `gh pr list --state open` |
| 7 | Backup of `knowledge_base` table taken in last 24h | Supabase Dashboard → Database → Backups |

If criteria 1-3 fail: rollback per `## Rollback procedure`. Do not attempt hotfix forward at T=0.

If criteria 4-7 fail: launch is valid; resolve in Hours 4-24 window.

---

## First 4 hours (12:00-16:00 Bangkok Sun 2026-04-26)

Highest-attention window. Distribution channels (LinkedIn primary) drive the first traffic burst. Silent breakage manifests fastest here.

### Watch list (refresh every 15 min)

| Surface | Dashboard | Healthy state |
|---|---|---|
| Sentry error rate | `https://sentry.io` → Issues, last 1h, `environment:production` | < 1% of transactions |
| Vercel function invocations | https://vercel.com/premkung87-stars-projects/prempawee-portfolio/observability | `/api/chat` invocations growing, no spike in `5xx` |
| `/api/chat` 5xx rate | Vercel Runtime Logs filter `level=error AND route=/api/chat` | Zero or below 1% of total |
| `/admin/finops` cost-per-conversation | https://prempawee.com/admin/finops | Within 10% of pre-launch baseline |
| Supabase `conversations` row growth | Supabase SQL Editor | Monotonically increasing once first traffic arrives |
| Supabase `leads` row growth | Supabase SQL Editor | Any non-zero is a positive signal |
| Supabase `token_usage` row growth | Supabase SQL Editor | Should grow ~1:1 with `conversations` (per AUDIT_LOG §19 lesson) |

### Sample-rate target — manual probe

Every 30 min, from incognito on mobile + desktop alternating:

1. Visit `https://prempawee.com`.
2. Click PDPA consent button ("I understand").
3. Send chat message: `show portfolio`.
4. Verify streamed response renders within 5s and contains a portfolio reference.
5. Click the contact CTA → LINE app should open with Prem's handle.

If step 2 freezes the consent banner: this is the §17/§20 silent-hydration failure mode. Rollback immediately per `## Rollback procedure`.

### Decision triggers

| Observation | Threshold | Action |
|---|---|---|
| Sentry error rate > 2% | Sustained > 5 min | Open top issue, identify file, check if it maps to a watchlist file. If yes → rollback the matching PR. If no → hotfix forward only if cause is obvious in <15 min, else rollback. |
| Sentry surfaces single issue with > 5 events | Within 30 min | Triage now. Read stack trace, name the regression, decide rollback vs hotfix. |
| `/api/chat` 5xx rate > 1% | Sustained > 5 min | Check Vercel logs for the failing invocation. Common causes: rate limiter overload, Supabase RPC timeout, Anthropic API 429. Mitigate the source, not the symptom. |
| Zero `conversations` rows after 2h despite confirmed distribution | LinkedIn post live, > 100 impressions | Distribution channel reach failure (post invisible to network) OR client-side hydration failure (visitors arrive but cannot interact). Run manual probe immediately. If probe passes → marketing problem, not engineering. If probe fails → rollback. |
| `cost_per_conversation` jumps > 2× baseline | Single 30-min window | Check `/admin/finops` "top sessions" — likely one session is iteration-looping. If single session, no action (one-off). If pattern, check system prompt for prompt-injection or eval drift. |
| Rate limit 429s spike | > 10/hr in Vercel logs | Per AUDIT_LOG §16, IP-collapse is the usual cause. Bump `MAX_REQUESTS` in `src/lib/rate-limit.ts` only if confirmed legitimate traffic; otherwise let the limit do its job. |
| Consent button frozen on real-browser probe | Single occurrence | Treat as P0. Open DevTools → Console for hydration errors. Likely cause maps to one of PR #21-#24. Rollback per decision tree. |
| LINE CTA opens wrong handle | Single occurrence | Hotfix forward — edit `CONTACT.contactUrl` in `src/lib/portfolio-data.ts`. Doc-only-style fix, low risk. |

### What "all clear at T+4h" looks like

- Sentry: < 1% error rate sustained
- `conversations` table: > 5 rows from non-Prem IPs
- `token_usage` table: row count ≈ `conversations.assistant_message_count`
- Real-browser probe: 8/8 successful (every 30 min, mobile + desktop)
- No rollback executed

---

## Hours 4-24 (until Mon 12:00 Bangkok)

Decreased intensity. The first traffic burst has settled; second-order failures (cost drift, prompt-injection, RAG drift) become more likely than hydration breaks.

### Frequency

Hourly skim of dashboards. Set a phone alarm at :00 of each hour 16:00 Sun → 12:00 Mon Bangkok (20 hourly checkpoints; sleep window 00:00-07:00 acceptable to skip — pick up at 07:00 Mon).

### Watch list (delta from First 4 Hours)

| Surface | Frequency | Healthy state |
|---|---|---|
| Sentry Issues | Hourly | No new issue opened with > 3 events |
| `/admin/finops` daily cost | Hourly | Cumulative spend on track for projected monthly |
| `conversations` row growth rate | Hourly | Smooth growth, no zero-period > 2h during Bangkok daytime |
| `leads` row count | Every 4h | Any new lead → check `NOTIFICATION_WEBHOOK_URL` fired |
| Vercel Speed Insights p95 | Every 4h | `/api/chat` p95 < 5s, page LCP < 2.5s |
| Vercel Analytics / Page views | Every 4h | Distribution channel reach correlates with view spike |

### New triggers post first-traffic burst

| Observation | Threshold | Action |
|---|---|---|
| New Sentry issue with stack frame in `src/app/api/chat/route.ts` | First occurrence | Triage now. This is the highest-risk surface. |
| Lead captured but `notification_webhook` log shows non-200 | Any | Re-check `NOTIFICATION_WEBHOOK_URL` env. Doc-only fix on Vercel env. |
| Rate-limit 429 from a single IP repeatedly | Same IP > 5x in 1h | Likely a real user behind NAT (per AUDIT_LOG §16). No action; the limit is doing its job. |
| RAG retrieval returns zero rows for a TH query | Reported via chat log | Run RAG eval probe locally (`EVAL_TARGET=https://prempawee.com npm run eval:rag`). If degraded, check Supabase `match_knowledge_hybrid` RPC health. |
| Supabase backup did not run on schedule | Dashboard → Backups → no entry in last 24h | Open Supabase support ticket. Take manual on-demand backup immediately as buffer. |
| Inbound LinkedIn DM about site bug | Any | Trust the human signal more than dashboards. Reproduce in incognito immediately. |

### Cost ceiling (soft)

If `/admin/finops` projects monthly cost > 1.5× baseline by hour 24, add a TODO to investigate before Day 2. Do not act in this window — single-day projections are noisy with launch-traffic bursts.

---

## Day 2 (Mon 12:00 Bangkok - Tue 12:00 Bangkok)

Steady-state observation. The launch is no longer "fresh"; visitor patterns reflect real usage rather than novelty traffic.

### Frequency

2x daily check-ins:
- **Morning Bangkok** (~09:00): overnight traffic + Sentry issues review
- **Evening Bangkok** (~19:00): daytime traffic + cost dashboard review

### Day 2 actions

| Action | Where | Threshold for follow-up |
|---|---|---|
| Cost-per-conversation review | `/admin/finops` | If > 1.3× pre-launch baseline → investigate cache hit rate (target > 80%) |
| Sentry Issues triage | https://sentry.io | Resolve or assign every issue opened in last 48h |
| First post-launch RAG eval | `EVAL_TARGET=https://prempawee.com npm run eval:rag` | If `overall_score < 0.7` or `avg_faithfulness < 0.45` → drift event, see follow-up |
| Conversations sample read | `/admin/conversations` | Read 10 random sessions end-to-end. Flag any prompt-injection or off-brand response. |
| Lead count check | `/admin/leads` | Any non-zero is a win. Reply to leads within 4h business-hours window. |
| Supabase backup verify | Supabase Dashboard → Database → Backups | Confirm Day 1 daily backup ran. If not, escalate to Supabase support. |

### RAG drift evaluation (Day 2 first-pass)

The first eval-rag run against post-launch `conversations` data sets the new baseline. Compare against pre-launch:

| Metric | Pre-launch baseline (Session 4) | Day 2 target | Action if exceeded |
|---|---|---|---|
| `avg_relevancy` | 0.985 | ≥ 0.95 | Investigate `match_knowledge_hybrid` RPC; check if any new user phrasings miss retrieval |
| `avg_faithfulness` | 0.495 | ≥ 0.45 | Per AUDIT_LOG §32 follow-up — if drops further, tighten system prompt or raise `match_count` |
| `overall_score` | 0.74 | ≥ 0.70 | If breaks 0.70 floor, this is a P1 — schedule Session 5 fix, do not let drift compound |

Do NOT over-fit to one bad eval run. Re-run if any metric anomalies, then act on the second sample.

---

## Days 3-7 (Tue 2026-04-28 - Sun 2026-05-03)

Weekly observation cadence. Most acute failure modes have surfaced by now; the remaining risk is slow drift (cost, RAG faithfulness, conversion funnel).

### Frequency

Daily check-in (~5 min, morning Bangkok).

### Conversion tracking

The Plan A surface (LinkedIn launch post) is the primary distribution channel. Track its downstream funnel daily:

| Stage | Where | Healthy signal |
|---|---|---|
| LinkedIn post engagement | LinkedIn Analytics on the post | Impressions growing, comments from outside Prem's first-degree network = reach beyond network |
| Site page views | Vercel Analytics → Page Views | Daily views correlate with LinkedIn impression growth |
| Case study page views | Vercel Analytics filter `path:/case-studies/*` | Visitors discovering depth content = quality traffic |
| Contact button clicks | Vercel Analytics → Custom Events (if instrumented) OR Supabase `analytics_events` table | Click-through rate from page view to contact > 1% |
| Leads captured | `/admin/leads` | Any lead is a win at this stage |
| Conversations started | `/admin/conversations` | > 3/day sustained = healthy engagement |

### Daily actions

| Action | Frequency | Notes |
|---|---|---|
| Sentry Issues skim | Daily | Resolve known/triaged; investigate new |
| `/admin/finops` daily cost | Daily | Track 7-day rolling avg vs projected monthly |
| `/admin/conversations` sample | Daily | Read 5 random sessions; flag off-brand or unhelpful |
| `/admin/leads` check | Daily | Reply within 1 business day |
| RAG eval | Tue + Fri | Watch faithfulness trend, not single point |
| LinkedIn post engagement | Daily for first 3 days, then Mon/Thu | Reach-beyond-network signal is the key metric |

### Day 7 close-out

End of week 1 (Sun 2026-05-03 12:00 Bangkok):

- [ ] Update `docs/SSS_STATUS.md` with any axis status changes from week 1 observations
- [ ] Append AUDIT_LOG entry summarising launch outcomes (any incidents, any pattern-to-remember)
- [ ] If RAG faithfulness < 0.45 sustained → schedule Session 5 prompt-tightening per AUDIT_LOG §32 follow-up
- [ ] If LinkedIn reach failed to extend beyond first-degree network → Plan A retrospective (marketing surface, not engineering)
- [ ] If zero leads captured → CONTACT funnel review (CTA placement, copy, friction)
- [ ] Archive this runbook reference under `docs/sessions/SESSION_<n>_LAUNCH_OUTCOMES.md` if outcomes warrant a session record

---

## Rollback procedure

Use these EXACT commit SHAs (verified by head-discovery against `git log`).

### Rollback table

| PR | Merge SHA | Title | When to revert |
|---|---|---|---|
| #24 | `062c37ed3e` | feat: land VerdeX screenshots + swap CTA to direct LINE chat | If LINE URL is wrong / VerdeX images cause CLS regression |
| #23 | `bb6155c745` | fix(a11y): enlarge tap targets | Almost never (a11y improvement, low risk) |
| #22 | `80f1be0d5c` | feat(home): add How-I-work 4-step ribbon | If ribbon causes hydration regression detected by E2E |
| #21 | `333c9481a2` | feat(case-studies): add VerdeX Farm case study | Almost never (additive content) |

### Step-by-step rollback bash (single PR revert)

Run from a clean local main. Replace `<PR_NUM>` and `<SHA>` per the table.

```bash
git checkout main
git pull origin main
git checkout -b revert/<PR_NUM>
git revert <SHA>
git push -u origin revert/<PR_NUM>
gh pr create \
  --title "revert: PR #<PR_NUM> — <reason>" \
  --body "Reverts <SHA>. Reason: <observed symptom>. Linked decision trigger in POST_LAUNCH_RUNBOOK.md." \
  --base main
gh pr merge --squash --auto
```

After merge, immediately verify against production:

```bash
BASE_URL=https://prempawee.com npm run test:e2e
```

If green, the rollback is complete. If still red, escalate (potentially nuclear-revert per AUDIT_LOG §20 precedent — revert ALL recent watchlist-file changes and re-bisect post-incident).

### Multi-PR revert (rare — only if bisect points to a bundled regression)

```bash
git checkout main
git pull origin main
git checkout -b revert/multi-launch-rollback
git revert 062c37ed3e bb6155c745 80f1be0d5c 333c9481a2  # newest first
git push -u origin revert/multi-launch-rollback
gh pr create \
  --title "revert: roll back PRs #21-#24 (launch-week regression)" \
  --body "Nuclear revert per AUDIT_LOG §20 precedent. Bisect TBD post-stabilisation." \
  --base main
gh pr merge --squash --auto
```

### Rollback decision tree

```
Is the symptom a watchlist-file regression (hydration, CSP, render-path)?
├── YES → identify the most recent watchlist-touching PR in the table
│   ├── single suspect → revert that one PR
│   └── multiple suspects within 24h → multi-PR revert (newest first)
└── NO → is the symptom a content / data / copy regression?
    ├── YES → hotfix forward (edit + new commit, no revert needed)
    └── NO → is the symptom in third-party infra (Supabase, Anthropic, Upstash, Vercel)?
        ├── YES → check provider status pages; if confirmed, wait + monitor
        └── NO → cannot classify → revert most recent watchlist PR + investigate offline
```

### Hotfix-forward bar

Hotfix forward is acceptable when ALL of these hold:
1. Cause is obvious from a single dashboard or log line
2. Fix is < 10 LoC and touches NO watchlist file
3. E2E suite can verify the fix in < 15 min
4. AUDIT_LOG entry written within 24h documenting the hotfix

Anything that fails one of these criteria → rollback first, fix later.

---

## Dashboards reference

All URLs verified by head-discovery 2026-04-25.

### Vercel

| Surface | URL |
|---|---|
| Project | https://vercel.com/premkung87-stars-projects/prempawee-portfolio |
| Analytics | https://vercel.com/premkung87-stars-projects/prempawee-portfolio/analytics |
| Speed Insights | https://vercel.com/premkung87-stars-projects/prempawee-portfolio/speed-insights |
| Runtime Logs | https://vercel.com/premkung87-stars-projects/prempawee-portfolio/logs |
| Observability | https://vercel.com/premkung87-stars-projects/prempawee-portfolio/observability |
| Firewall (WAF / BotID) | https://vercel.com/premkung87-stars-projects/prempawee-portfolio/firewall |

### Admin (gated by `ADMIN_SECRET` cookie — log in at `/admin/login`)

| Surface | URL |
|---|---|
| Finops | https://prempawee.com/admin/finops |
| Conversations | https://prempawee.com/admin/conversations |
| Leads | https://prempawee.com/admin/leads |

### Public health surface

| Surface | URL | Notes |
|---|---|---|
| Status page | https://prempawee.com/status | Live (verified 2026-04-25, 200 OK). Route at `src/app/status/page.tsx`. Surfaces real-time health checks for Supabase / Anthropic / Upstash / edge runtime. Dynamic, re-runs on each request. |

### Sentry

| Surface | URL | Notes |
|---|---|---|
| Sentry org root | https://sentry.io | TODO: confirm org slug for direct deep-link |
| Issues (DSN-derived path) | https://o4511233259601920.ingest.us.sentry.io/api/4511233268908032/ | Ingest endpoint, not UI |
| Issues UI (placeholder — confirm slug) | `https://<org-slug>.sentry.io/issues/?project=4511233268908032` | TODO: replace `<org-slug>` after confirming with Foreman. SENTRY_ORG / SENTRY_PROJECT not set in `.env.local`. |

### Supabase

| Surface | URL |
|---|---|
| Project dashboard | https://supabase.com/dashboard/project/eirrhcdjcswttrkigwzw |
| SQL Editor | https://supabase.com/dashboard/project/eirrhcdjcswttrkigwzw/sql/new |
| Database backups | https://supabase.com/dashboard/project/eirrhcdjcswttrkigwzw/database/backups |
| Tables | https://supabase.com/dashboard/project/eirrhcdjcswttrkigwzw/editor |

### Upstash Redis (rate limiter)

| Surface | URL |
|---|---|
| Console | https://console.upstash.com/redis/obliging-seal-100531 |

### GitHub

| Surface | URL |
|---|---|
| Repo | https://github.com/premkung87-star/prempawee-portfolio |
| CI runs | https://github.com/premkung87-star/prempawee-portfolio/actions/workflows/ci.yml |
| Branch protection settings | https://github.com/premkung87-star/prempawee-portfolio/settings/branches |
| PRs | https://github.com/premkung87-star/prempawee-portfolio/pulls |

### Quick health-check one-liner

For a fast all-green check, run:

```bash
echo "--- prempawee.com health ---"
curl -sI https://prempawee.com | head -1
curl -sI https://prempawee.com/sitemap.xml | head -1
curl -sI https://prempawee.com/robots.txt | head -1
curl -sI https://prempawee.com/api/chat | head -1
curl -sI https://prempawee.com/status | head -1
echo "--- end ---"
```

Expected: all `HTTP/2 200` (or `405 Method Not Allowed` for `/api/chat` — POST-only endpoint).

---

## Known limitations

These are tracked but NOT blocking for the launch. Re-evaluate at end of week 1.

| Limitation | Source | Impact | Plan |
|---|---|---|---|
| p95 latency Sentry alert deferred | `docs/SSS_STATUS.md` axis #1, Session 5 update | No automated paging on slow `/api/chat` responses | Configure alert rule in Sentry UI when traffic justifies it |
| HSTS preload status pending | `docs/SSS_STATUS.md` axis #8 | Browser HSTS preload list not yet propagated | Wait for Chrome review; no action |
| WAF + BotID code-live, Pro upgrade pending | `docs/SSS_STATUS.md` axis #6 | Bot traffic unfiltered at edge | Upgrade Vercel Pro ($20/mo) when justified |
| RAG `avg_faithfulness` 0.495 baseline | `AUDIT_LOG.md` §32 follow-up | Model synthesises specifics not in KB | Track drift target post-launch; system-prompt tightening or `match_count` raise candidate fixes |
| Sentry org slug not in `.env.local` | head-discovery 2026-04-25 | Direct dashboard deep-links unavailable | TODO: confirm with Foreman; project ID `4511233268908032`, org ID `o4511233259601920` from DSN |
| Personal LINE URL is the contact CTA | `src/lib/portfolio-data.ts` `CONTACT.contactUrl` | If Prem's LINE handle changes, CTA breaks for all visitors | Update `CONTACT.contactUrl` and ship as a trivial doc-style hotfix |
| No multi-user admin (shared `ADMIN_SECRET`) | `docs/OPERATIONS.md` Known limitations | Cannot grant per-person admin access | Migrate to Supabase Auth when warranted |
| Rate limiter scope is IP-keyed | `docs/OPERATIONS.md` + `AUDIT_LOG.md` §16 | NAT-collapsed users share quota | Live with it; bump `MAX_REQUESTS` if observed in logs |

### Cross-references

- Watchlist files (must NOT be modified during launch week without E2E gate): `AGENTS.md`
- Pre-deploy checklist (canonical): `AUDIT_LOG.md` Pre-Deploy Checklist section
- Risk classification + effort matrix: `CLAUDE.md` Step 2
- Verify-before-claim discipline: `KARPATHY.md` Part 2 §16, `AUDIT_LOG.md` §32
- Rollback precedent (nuclear-revert): `AUDIT_LOG.md` §20

---

**Version:** 1.0 · **Created:** 2026-04-25 (T-1d before launch) · **Owner:** Prem (premkung87@gmail.com) · **Philosophy:** Reduce weaknesses before adding features. Real-browser verification is the only valid success signal for render-path changes.
