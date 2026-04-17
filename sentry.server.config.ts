// Server-side (Node.js runtime) Sentry init. No-op when SENTRY_DSN unset.
// Loaded via instrumentation.ts.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Full trace capture in dev, sample in prod
    tracesSampleRate:
      process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,

    // Tag every event with the deployment region
    initialScope: {
      tags: {
        region: process.env.VERCEL_REGION ?? "unknown",
        runtime: "nodejs",
      },
    },

    sampleRate: 1.0,
  });
}
