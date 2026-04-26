import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Strip the X-Powered-By: Next.js fingerprint
  poweredByHeader: false,

  // NOTE ON `experimental.sri`: deliberately NOT enabled. See AUDIT_LOG §20
  // + open Next.js issue vercel/next.js#91633. Enabling it on Next 16 +
  // Turbopack + Vercel causes SILENT React 19 hydration failure because
  // Vercel's CDN re-encodes responses (Brotli/gzip) after build-time
  // hashing, invalidating every integrity= attribute. Chrome blocks the
  // client-runtime chunk with zero console output → no useEffect fires →
  // no onClick attaches → the site looks rendered but is completely dead.
  // We hit this on 2026-04-17 and lost 3 hours to it. Revisit when #91633
  // closes. A+ grades on Mozilla Observatory (+25 bonus for strict CSP)
  // and securityheaders.com are already achieved via nonce + strict-dynamic
  // alone — SRI was only ever redundant bonus points.

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
          // NOTE: Content-Security-Policy is injected by src/proxy.ts per
          // request with a per-request nonce + 'strict-dynamic'. Do NOT
          // re-add a static CSP here — it would collide with the dynamic one.
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

  // 301 redirects. /preview was the staging route for the redesign that now
  // lives at /. Permanent redirect keeps any external backlinks (the design
  // was previewed on internal/social channels during Session 6) routed to
  // the canonical URL. AUDIT_LOG §38 / Phase 2 cutover (Session 7).
  async redirects() {
    return [
      {
        source: "/preview",
        destination: "/",
        permanent: true,
      },
    ];
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
