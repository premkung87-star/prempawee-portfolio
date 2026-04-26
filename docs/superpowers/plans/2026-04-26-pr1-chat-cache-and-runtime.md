# PR 1 — Chat Cache Fix + Runtime Move (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 0% prompt-cache hit rate and consolidate edge-region fragmentation by moving `src/app/api/chat/route.ts` to nodejs runtime pinned to `iad1` and attaching `cacheControl` to the system message itself instead of the top-level `streamText` call.

**Architecture:** Two surgical edits in one file. Convert `system: systemPrompt` (string) to `system: { role: "system", content: systemPrompt, providerOptions: { anthropic: { cacheControl: { type: "ephemeral", ttl: "1h" } } } }` (typed `SystemModelMessage`). Remove top-level `providerOptions`. Swap runtime constants. No test fixture changes, no migration, no client-side change.

**Tech Stack:** Next.js 16, AI SDK v6.0.168, `@ai-sdk/anthropic` 3.0.71, Vercel Fluid Compute (Node 24), `iad1` region.

**Spec:** [`docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md`](../specs/2026-04-26-haiku-cache-cost-cut-design.md)

**Watchlist:** `src/app/api/chat/route.ts` is on the AGENTS.md browser-verification watchlist. Mandatory E2E gate (local + preview) before merge.

---

## File Structure

- **Modify:** `src/app/api/chat/route.ts:25-26` — runtime + region constants
- **Modify:** `src/app/api/chat/route.ts:46-47` — remove obsolete maxDuration comment
- **Modify:** `src/app/api/chat/route.ts:301-313` — system message refactor + cacheControl placement

That's the entire scope. No new files, no other modifications.

---

## Task 1: Add runtime + region constants (replace edge with nodejs + iad1)

**Files:**
- Modify: `src/app/api/chat/route.ts:22-26` (the runtime declaration block)
- Modify: `src/app/api/chat/route.ts:46-47` (the obsolete maxDuration comment)

- [ ] **Step 1: Read current state of the runtime declaration**

Run: `sed -n '20,50p' src/app/api/chat/route.ts`
Expected output: confirms `export const runtime = "edge"` is on line 25 and the `maxDuration is Node-only` comment block is at lines 46-47.

- [ ] **Step 2: Replace edge runtime with nodejs + iad1 + maxDuration**

Replace this block (around line 22-26):

```ts
// Edge runtime — lower cold-start latency, global distribution, native Web
// APIs (fetch, crypto, streams). All our deps are edge-compatible:
// @ai-sdk/anthropic, @supabase/supabase-js, @upstash/redis, zod, sentry.
export const runtime = "edge";
```

With:

```ts
// Node runtime pinned to iad1. Anthropic API is US-east primary; pinning to
// Singapore would *add* ~180ms egress per call. More importantly, edge
// runtime fragmented our prompt cache across 4-6 regions (sin1, hkg1, syd1,
// fra1, iad1) — with ~200-365 calls/day, no single region warmed within the
// 1h TTL. Result: 421k cache writes / 0 cache reads in the first 30 days.
// Consolidating to one region recovers the cache. See
// docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md.
export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const maxDuration = 60;
```

- [ ] **Step 3: Remove obsolete maxDuration comment**

Replace this block (around line 46-47):

```ts
// maxDuration is Node-only; edge functions run under a different timeout model.
// The 30s chat cap is enforced by Claude-side request timeouts anyway.
```

With (delete entirely — no replacement needed; the new `export const maxDuration = 60` above is now the canonical declaration).

- [ ] **Step 4: Verify typecheck still passes after runtime swap**

Run: `npm run typecheck`
Expected: PASS (zero errors). The runtime swap is type-safe — Next.js accepts `"nodejs"` literal at this position.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "refactor(chat): nodejs runtime pinned to iad1 (cache fix step 1/2)

Edge runtime fragmented Anthropic prompt cache across 4-6 regions; with
~200-365 calls/day, no region warmed within the 1h TTL. Consolidating
to one US-east region (iad1) is precondition for cache_control to start
producing reads. Spec: docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md"
```

---

## Task 2: Move cacheControl onto the system message

**Files:**
- Modify: `src/app/api/chat/route.ts:301-313` (the `streamText` call's `system` + `providerOptions`)

- [ ] **Step 1: Read the current streamText invocation**

Run: `sed -n '300,315p' src/app/api/chat/route.ts`
Expected output: confirms `system: systemPrompt` is on line 303 and the top-level `providerOptions: { anthropic: { cacheControl: ... } }` is at lines 305-312.

- [ ] **Step 2: Replace `system: systemPrompt` (string) with a SystemModelMessage carrying `cacheControl`, and remove the top-level `providerOptions` block**

Replace this block (lines 301-313):

```ts
  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    providerOptions: {
      // 1h TTL prompt caching. Extends the default 5-min ephemeral tier.
      // Because the system prompt (base rules + full KB) is stable across
      // queries — per-query semantic retrieval lives in the user message —
      // this cache should hit on ~every request after warm-up. Measured
      // via cache_read_tokens in the onFinish callback below.
      anthropic: { cacheControl: { type: "ephemeral", ttl: "1h" } },
    },
    stopWhen: stepCountIs(3),
```

With:

```ts
  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    // 1h TTL prompt caching attached to the SYSTEM MESSAGE specifically.
    // Top-level providerOptions on streamText is NOT propagated to the
    // system content block in AI SDK v6.0.168 — verified against
    // node_modules/@ai-sdk/anthropic/dist/index.mjs line 2086-2092 (system
    // case reads providerOptions from the message itself). Putting it
    // here applies cache_control to the stable system prefix (base rules +
    // full KB), which is what we want cached. Per-query semantic retrieval
    // lives in the user message and stays out of the cached prefix.
    system: {
      role: "system",
      content: systemPrompt,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral", ttl: "1h" } },
      },
    },
    messages,
    stopWhen: stepCountIs(3),
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS. `system` accepts `SystemModelMessage` per `node_modules/ai/dist/index.d.ts` (`system?: string | SystemModelMessage | Array<SystemModelMessage>`).

If typecheck fails: check that `SystemModelMessage` is the exact shape `{ role: 'system'; content: string; providerOptions?: ProviderOptions }` — verified earlier from `node_modules/@ai-sdk/provider-utils/dist/index.d.ts`. Do not import the type — TypeScript infers it from the literal object.

- [ ] **Step 4: Verify lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Verify unit tests still pass**

Run: `npm run test`
Expected: PASS (63/63 tests). No test exercises the `streamText` system shape directly, so this is a smoke check that no peripheral code broke.

- [ ] **Step 6: Verify production build**

Run: `npm run build`
Expected: build succeeds. The Next.js build will detect the runtime change and emit `/api/chat` as a Node function (no longer Edge Middleware-style).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "fix(chat): cacheControl on system message, not top-level streamText

In AI SDK v6.0.168, providerOptions at the top level of streamText is
not propagated to the system content block. Verified against installed
@ai-sdk/anthropic 3.0.71 source (dist/index.mjs:2086-2092 — system case
reads providerOptions from the message itself).

This explains the 421k cache writes / 0 cache reads pattern in FinOps:
cache_control was landing on a moving target (probably user message
tail) rather than the stable system prefix. Moving the marker onto a
SystemModelMessage object now anchors it to the correct block.

Verification post-deploy: cache_read_tokens should appear in
analytics_events token_usage rows within 1 hour. Watch for 24h."
```

---

## Task 3: E2E gate locally (mandatory — chat route is on watchlist)

**Files:**
- No file edits. Pure verification.

- [ ] **Step 1: Start dev server in background**

```bash
PORT=3000 npm run dev
```

(Run with `run_in_background: true`. Do not block on it.)

- [ ] **Step 2: Wait for dev server ready**

Poll: `until grep -q "Ready in\|Local:" /tmp/dev.log; do sleep 1; done`
Expected: dev server prints "Ready in" or "Local:" within ~10 seconds. If it takes longer than 60s, check the background output for compile errors.

- [ ] **Step 3: Run Playwright E2E against localhost**

Run: `BASE_URL=http://localhost:3000 npm run test:e2e`
Expected: 10/10 passed + 1 skipped (the security-headers test that needs the prod domain). The chat-flow tests in `tests/e2e/smoke.spec.ts` (chat input, x-session-id, language toggle, consent) MUST all pass — those exercise the live chat route end-to-end.

If any chat-flow test fails: do NOT proceed. Investigate the runtime change first — most likely cause is that the Node runtime now requires something the edge runtime didn't (e.g., Sentry init shape).

- [ ] **Step 4: Stop dev server**

```bash
lsof -ti:3000 | xargs kill 2>/dev/null
```

Expected: clean shutdown.

---

## Task 4: Open PR + watch CI + verify preview deploy

**Files:**
- No file edits. Pure deploy.

- [ ] **Step 1: Push branch**

```bash
git push -u origin fix/chat-cache-and-runtime
```

Expected: push succeeds, GitHub returns the PR creation URL.

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "fix(chat): nodejs+iad1 runtime + cacheControl on system message" --body "$(cat <<'EOF'
## Summary
Fixes 0% prompt-cache hit rate (421k writes / 0 reads in 30 days). Two
surgical changes to src/app/api/chat/route.ts:

1. Edge → nodejs runtime, pinned to iad1. Anthropic API is US-east primary;
   edge fragmented our cache across 4-6 regions with no warm-up.
2. Moved cacheControl from top-level streamText.providerOptions onto the
   system message itself. AI SDK v6.0.168 does not propagate top-level
   providerOptions to the system content block (verified against installed
   @ai-sdk/anthropic 3.0.71 source).

Spec: docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md

## Cost projection
Before: ~$306/mo trajectory
After (this PR alone, Sonnet retained): ~$60-90/mo (~70-80% reduction)

## Validation gate
- [x] npm run typecheck
- [x] npm run lint
- [x] npm run test (63/63 passed)
- [x] npm run build
- [x] BASE_URL=http://localhost:3000 npm run test:e2e (10/10 + 1 skip)
- [ ] Preview E2E (Vercel deploy + GH Actions)
- [ ] Post-deploy cache_read verification (24h watch on analytics_events)

## Watchlist disclosure (per AGENTS.md)
src/app/api/chat/route.ts IS on the watchlist. Both edits are pure runtime
config + provider-options refactor. No render-path, hydration, or CSP
behavior touched. Sonnet model unchanged. KB content unchanged.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL returned.

- [ ] **Step 3: Watch CI checks until all pass**

```bash
gh pr checks <PR#> --watch
```

Expected: typecheck+lint+test (CI), Vercel preview build, and RAG answer quality all pass. Browser-smoke job will be marked `skipping` (it only runs on push-to-main per `.github/workflows/ci.yml`). That's expected and not a blocker.

- [ ] **Step 4: Get the Vercel preview URL from PR comments**

```bash
gh pr view <PR#> --json comments --jq '.comments[].body' | grep -oE 'https://prempawee-portfolio[^[:space:])"]*' | head -1
```

Expected: returns a URL like `https://prempawee-portfolio-git-fix-c-XXXX-premkung87-stars-projects.vercel.app`.

- [ ] **Step 5: Note that preview is behind Vercel SSO (401)**

A direct Playwright run against the preview URL returns 401 because of Vercel's automation protection. CI's browser-smoke job has the bypass token; we don't have it locally. This is expected — do not retry.

The post-merge browser-smoke against prod is the canonical CI verification. It runs automatically on push-to-main.

- [ ] **Step 6: Merge PR (only after Foreman approves)**

Wait for explicit Foreman approval. Then:

```bash
gh pr merge <PR#> --squash --delete-branch
```

Expected: merge succeeds, CI on main runs typecheck+lint+test + browser-smoke against prempawee.com + RAG answer quality. All three should pass.

---

## Task 5: Post-merge verification — confirm cache reads land

**Files:**
- No file edits. Pure observation.

- [ ] **Step 1: Watch the post-merge CI run on main**

```bash
gh run watch <run-id> --exit-status
```

Expected: all three jobs pass. Browser-smoke MUST pass — it runs the full chat flow against prod against the new nodejs/iad1 runtime. If it fails, this is the moment to investigate before users see breakage.

- [ ] **Step 2: Wait 60s for Vercel deploy to settle, then make 3 chat requests against prod**

Open https://prempawee.com in a browser, click consent, send 3 chat messages back-to-back ("show me your work", "what's your pricing", "tell me about VerdeX"). The first request will be a cache write; the 2nd and 3rd from the same region within an hour should be cache reads.

- [ ] **Step 3: Query analytics_events for cache_read_tokens**

Open Supabase SQL editor (Portfolio project), run:

```sql
select
  created_at,
  payload->>'model' as model,
  (payload->>'input_tokens')::int as input_tokens,
  (payload->>'cache_creation_tokens')::int as cache_create,
  (payload->>'cache_read_tokens')::int as cache_read,
  session_id
from analytics_events
where event_type = 'token_usage'
  and created_at > now() - interval '15 minutes'
order by created_at desc
limit 10;
```

Expected pattern: first row has `cache_create > 0` and `cache_read = 0`. Rows 2 and 3 have `cache_read > 0` (ideally `cache_read >= 0.8 * input_tokens`).

**If cache_read is still 0 on rows 2/3:** the marking is still on the wrong block. Possibilities to investigate (in order):
1. Anthropic returns `cache_creation_input_tokens` and `cache_read_input_tokens` only when prompt caching beta header is enabled — check provider source.
2. The system prompt size may be below the minimum cacheable threshold (1024 tokens). Check `knowledgeContext.length` — if KB is tiny, no caching happens.
3. Region-pinning may not have taken effect — check Vercel deployment logs for the function region.

Do NOT proceed to PR 2 design until cache_read is consistently > 0.

- [ ] **Step 4: Update spec status**

Edit `docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md` — under "Locked decisions", append a new line:

```
4. **PR 1 verified 2026-04-26.** cache_read_tokens consistently >0 in analytics_events.
```

Commit on main:

```bash
git checkout main
git pull
git add docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md
git commit -m "docs(spec): mark PR 1 cache fix verified (cache_read >0 confirmed)"
git push
```

- [ ] **Step 5: Report cost trend after 24h**

After 24h on the new runtime, screenshot the FinOps dashboard at https://prempawee.com/admin/finops. Compare the daily cost row for the day-after-merge vs the day-before-merge. Expected: ~70-80% drop.

If the drop is < 50%: cache is partially working but not as expected. Pull a fresh batch of `analytics_events.token_usage` rows and check the ratio of `cache_read_tokens / input_tokens` — should be 0.85+ on the cacheable portion of input.

---

## Self-review checklist (run after writing this plan)

- [x] Spec coverage — every change in Section "PR 1" of the spec is implemented in Tasks 1-2. Tasks 3-5 cover verification + the post-merge cache-read confirmation that the spec specifically calls out.
- [x] No placeholders — every step has actual code or actual command. No "TODO" or "TBD".
- [x] Type consistency — `SystemModelMessage` literal shape matches `@ai-sdk/provider-utils` source. `cacheControl` shape matches the schema in `@ai-sdk/anthropic/dist/index.d.mts:863`.
- [x] Watchlist gate honored — Task 3 mandates local E2E before PR, Task 5 confirms post-merge prod E2E ran.
- [x] One logical change per commit — Task 1 (runtime) and Task 2 (cacheControl placement) are committed separately. They could in principle be one commit, but separation makes it possible to bisect if cache_read never lights up post-deploy.
- [x] Rollback path — single git revert restores edge runtime. Documented in spec.
