// Proxy (formerly middleware pre-Next.js 16): per-request CSP nonce,
// CSRF origin check, Vercel BotID.
//
// Renamed from middleware.ts per the Next.js 16 deprecation. Runs on the
// Node.js runtime (edge is not supported in proxy). This rename is what
// unlocks proper nonce propagation — under the old `middleware.ts` +
// Turbopack path (AUDIT_LOG §17), nonces never reached framework-
// generated <script> tags and CSP `strict-dynamic` silently blocked 100%
// of scripts. The Node.js proxy runtime injects nonces into the SSR
// output correctly, so we can finally drop `'unsafe-inline'`.
//
// Combined with experimental.sri in next.config.ts (adds integrity=
// sha256 to every Next.js-built script), the CSP is:
//   - nonce-based for inline + dynamically imported scripts
//   - integrity-based for build-time scripts
//   - strict-dynamic so nonce'd loaders can transitively trust their
//     own chunk imports without us listing every hash.

import { NextRequest, NextResponse } from "next/server";

// BotID check — installed as a soft import to tolerate package API drift and
// Hobby-plan absence. Returns { isBot: boolean } or null when unavailable.
async function runBotCheck(): Promise<{ isBot: boolean } | null> {
  try {
    const mod = (await import("@vercel/firewall")) as unknown as {
      checkBotId?: () => Promise<{ isBot?: boolean }>;
    };
    if (typeof mod.checkBotId !== "function") return null;
    const v = await mod.checkBotId();
    return { isBot: Boolean(v?.isBot) };
  } catch {
    return null;
  }
}

const ALLOWED_ORIGIN_HOSTS = [
  "prempawee-portfolio.vercel.app",
  "prempawee.com",
  "www.prempawee.com",
  "localhost:3000",
  "localhost:3001",
];

// Only enforce origin checks on state-changing methods
const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Expensive endpoints that are worth spending a BotID check on
const BOT_PROTECTED_PATHS = ["/api/chat", "/api/leads"];

function buildCsp(nonce: string, isDev: boolean): string {
  if (isDev) {
    // CSP disabled in development (React/Turbopack need eval + inline
    // for debugging + HMR).
    return "";
  }
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com`,
    `style-src 'self' 'unsafe-inline'`,
    `connect-src 'self' https://*.supabase.co https://api.anthropic.com https://*.upstash.io https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
    `img-src 'self' data: blob: https://*.sentry.io`,
    `font-src 'self' https://fonts.gstatic.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `worker-src 'self' blob:`,
  ];
  return directives.join("; ");
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    if (ALLOWED_ORIGIN_HOSTS.includes(host)) return true;
    if (/^prempawee-portfolio-[a-z0-9-]+\.vercel\.app$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  if (CSRF_METHODS.has(req.method) && req.nextUrl.pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    if (!isAllowedOrigin(origin) && !isDev) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden origin." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (
    !isDev &&
    req.method === "POST" &&
    BOT_PROTECTED_PATHS.includes(req.nextUrl.pathname)
  ) {
    const verification = await runBotCheck();
    if (verification?.isBot) {
      return new NextResponse(
        JSON.stringify({ error: "Automated traffic blocked." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const csp = buildCsp(nonce, isDev);

  // The nonce must be exposed upstream so layout.tsx can read it via
  // headers() and pass it to <Analytics>, <SpeedInsights>, and the JSON-LD
  // <script>. Next.js also parses the Content-Security-Policy request
  // header itself to auto-inject the nonce into framework scripts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  if (csp) {
    requestHeaders.set("Content-Security-Policy", csp);
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (csp) {
    res.headers.set("Content-Security-Policy", csp);
  }
  return res;
}

export const config = {
  matcher: [
    // Match everything except static assets and image-optimization internals.
    // Critical: DO NOT exclude the homepage — proxy must run on / for the
    // nonce pipeline to work there.
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
