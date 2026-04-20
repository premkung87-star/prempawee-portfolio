---
number: 8
title: "Edge Runtime: All Async Work Must Be Explicitly Awaited"
tags: [NEXTJS, EDGE_RUNTIME, ASYNC]
applies_to: [nextjs-vercel-supabase]
universal: false
source: prempawee KARPATHY.md §8
incident_refs: [AUDIT_LOG §19]
added_in_kit: 1.0.0
---

# 8. Edge Runtime: All Async Work Must Be Explicitly Awaited

## Verbatim from Source

**Fire-and-forget promises inside edge handlers silently drop.**

On Vercel's edge runtime, worker teardown can happen as soon as the main handler returns. Any `.catch()`-orphaned or unawaited promise is at risk of being killed mid-execution.

**Wrong:**
```ts
onFinish: async ({ text }) => {
  logConversation(text);  // ← fire-and-forget, drops in edge
  logAnalytics(event);    // ← same
}
```

**Right:**
```ts
onFinish: async ({ text }) => {
  await Promise.all([
    logConversation(text),
    logAnalytics(event),
  ]);
}
```

**Evidence:** AUDIT_LOG §19 — 1 of 148 `token_usage` events landed in production because all others were fire-and-forget. Looked fine in dev (Node doesn't tear down the same way). Only production + edge exposed the pattern.

**The test:** For every `.then()`, `.catch()`, or function call inside an edge handler, ask: "Is this awaited before the handler returns?" If not, refactor.

## Generic Pattern (Strategy B Abstraction)

**Principle:** In any runtime whose lifecycle is bounded by request/response completion, fire-and-forget asynchronous work silently drops. If you need a side-effect to persist, await it explicitly or use a platform primitive that extends the worker lifetime past response close.

**When to apply:** Code running in serverless functions, FaaS, edge workers, lambda runtimes, event handlers, streaming callbacks — anywhere the host can terminate the worker as soon as the primary response completes.

**How to apply (stack-agnostic):**
- Audit every `.then()`, `.catch()`, and orphaned async call inside a handler. Ask: is this awaited before the handler returns?
- Parallelize required async writes with `Promise.all` (or the language equivalent) and await the result.
- If side-effects must outlive the response (long-running logs, post-hoc analytics), use the platform's "run after response" primitive rather than fire-and-forget.
- Local-dev testing will NOT catch this because local runtimes (unrestricted Node.js, long-lived dev servers) don't tear down the same way as production edge/serverless workers.

**Stack-specific manifestations:**
- **nextjs-vercel-supabase:** Vercel Edge / Fluid Compute workers. In AI SDK callbacks (`onFinish`, `onAbort`, `onStepFinish`), make the callback `async` and `await` Supabase writes, analytics emissions, etc. For unavoidable post-response work, use Next.js `after()` from `next/server` or Vercel's `ctx.waitUntil()`.
