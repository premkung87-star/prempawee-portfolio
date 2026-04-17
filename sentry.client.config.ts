// Client-side Sentry init. Runs in the browser. No-op when SENTRY_DSN is
// unset — safe to ship to production immediately; user activates by adding
// the DSN env var. See docs/OPERATIONS.md#observability for setup.

import * as Sentry from "@sentry/nextjs";

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

    // Filter out noise
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random network errors from bad connections
      "Network request failed",
      "NetworkError",
      "Failed to fetch",
      // React hydration warnings in dev
      /Hydration failed/,
    ],

    // Sample rate for error events (1.0 = all errors reported)
    sampleRate: 1.0,
  });
}
