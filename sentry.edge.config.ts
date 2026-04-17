// Edge-runtime Sentry init. No-op when SENTRY_DSN unset. Loaded via
// instrumentation.ts when the runtime === "edge".

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    tracesSampleRate:
      process.env.VERCEL_ENV === "production" ? 0.1 : 1.0,

    initialScope: {
      tags: {
        region: process.env.VERCEL_REGION ?? "unknown",
        runtime: "edge",
      },
    },

    sampleRate: 1.0,
  });
}
