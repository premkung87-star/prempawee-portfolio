// Next 16 instrumentation hook. Runs once per runtime on cold start.
// Dynamically loads the correct Sentry config for each runtime.
// No-op when SENTRY_DSN is unset — safe to ship immediately.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Forward Next.js request errors to Sentry (when DSN is configured).
// Next.js calls this for any unhandled error in a server / edge handler.
export const onRequestError: (
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: { routerKind: string; routePath: string; routeType: string },
) => void = (err, request, context) => {
  if (!process.env.SENTRY_DSN) return;
  try {
    Sentry.captureException(err, {
      tags: {
        path: request.path,
        method: request.method,
        routeType: context.routeType,
      },
    });
  } catch {
    // Never let Sentry break the error handler
  }
};
