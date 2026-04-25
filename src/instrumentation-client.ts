// Client-side Sentry init. Runs in the browser. No-op when SENTRY_DSN is
// unset. See docs/OPERATIONS.md#observability for setup.

import * as Sentry from "@sentry/nextjs";

// Required by @sentry/nextjs ≥10.49 for navigation traces under Turbopack.
// The SDK reads this exported binding from instrumentation-client.(ts|js).
// Safe to export unconditionally — captureRouterTransitionStart is a no-op
// when Sentry.init() has not run.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Traces: 10% sample in prod, 100% in non-prod
    tracesSampleRate:
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? 0.1 : 1.0,

    // Replay: capture 10% of all sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out noise. DO NOT add hydration errors here — §20 paid that
    // lesson in full. `Hydration failed` was previously filtered with a
    // comment saying "in dev", but the filter ran in production too and
    // silently suppressed the exact signal we needed during the 2026-04-17
    // CSP-A+ rollout. Keep every client-boundary failure visible; noise is
    // cheap, blind spots are expensive.
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random network errors from bad connections
      "Network request failed",
      "NetworkError",
      "Failed to fetch",
    ],

    // Sample rate for error events (1.0 = all errors reported)
    sampleRate: 1.0,
  });
}
