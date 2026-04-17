import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            // Disables camera / mic / geo (not used), plus FLoC + topics-API
            // (don't leak visitor browsing-topic signals to the ad ecosystem).
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
          },
          // NOTE: Content-Security-Policy is now injected by src/middleware.ts
          // per request so a nonce can be used (replaces the old 'unsafe-inline'
          // script-src dependency). Do NOT re-add a static CSP here — it would
          // collide with the dynamic one.
          {
            // 2 years max-age + includeSubDomains + preload. Submit to
            // https://hstspreload.org once a custom domain is attached
            // (see scripts/attach-domain.mjs).
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Cross-origin isolation — defense in depth + perf optimizations.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

// Wrap with Sentry config. When SENTRY_DSN/SENTRY_AUTH_TOKEN are unset,
// the wrapper is inert — source map upload and tunneling are simply skipped.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Don't upload source maps if auth token is absent (local dev, or no Sentry)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  disableLogger: true,
});
