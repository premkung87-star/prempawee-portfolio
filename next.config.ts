import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

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
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // TODO (hardening follow-up): replace 'unsafe-inline' with nonce-based CSP.
            // That requires middleware.ts to generate a per-request nonce, set the
            // header dynamically, and pass the nonce to Next.js via headers().
            // See: https://nextjs.org/docs/app/guides/content-security-policy
            // Deferred: invasive change; current MVP uses unsafe-inline which is the
            // default Next.js starter pattern. Audit-flagged in chat.tsx review §🟢.
            value: isDev
              ? "" // CSP disabled in development (React needs eval for debugging)
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://*.upstash.io https://va.vercel-scripts.com https://vitals.vercel-insights.com; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
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

export default nextConfig;
