// Edge middleware: per-request CSP nonce + CSRF origin check + Vercel BotID.
//
// Replaces the static CSP header previously set in next.config.ts. The nonce
// pattern removes the `'unsafe-inline'` script-src dependency and is the
// recommended posture per the Next.js CSP guide.
//
// Enforces a same-origin check for state-changing requests (POST/PUT/
// PATCH/DELETE) against known Vercel/localhost origins to provide a light
// CSRF defense for the /api/* surface.
//
// Invokes Vercel BotID on expensive endpoints (/api/chat, /api/leads) to
// block automated abuse. BotID is Pro-plan — when unavailable the check
// silently passes through, so this code is safe to ship on Hobby and
// activates on upgrade.

import { NextRequest, NextResponse } from "next/server";

// BotID check — installed as a soft import to tolerate package API drift and
// Hobby-plan absence. Returns { isBot: boolean } or null when unavailable.
async function runBotCheck(): Promise<{ isBot: boolean } | null> {
  try {
    // @vercel/firewall exports evolved across versions; look up checkBotId
    // dynamically. On Hobby / unavailable, the import itself succeeds but
    // the function returns a no-op verdict that we treat as "allow."
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
    // CSP disabled in development (React needs eval for debugging)
    return "";
  }
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com`,
    `style-src 'self' 'unsafe-inline'`,
    `connect-src 'self' https://*.supabase.co https://api.anthropic.com https://*.upstash.io https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
    `img-src 'self' data: blob:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ];
  return directives.join("; ");
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // no origin (e.g. same-origin navigation) is fine
  try {
    const host = new URL(origin).host;
    if (ALLOWED_ORIGIN_HOSTS.includes(host)) return true;
    // Accept Vercel auto-generated preview URLs from this project
    if (/^prempawee-portfolio-[a-z0-9-]+\.vercel\.app$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = crypto.randomUUID().replaceAll("-", "");

  // --- CSRF check for state-changing API requests ---
  if (CSRF_METHODS.has(req.method) && req.nextUrl.pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    if (!isAllowedOrigin(origin) && !isDev) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden origin." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // --- Vercel BotID on expensive endpoints ---
  // BotID is Pro-plan only — dynamic import so the build doesn't require
  // a specific @vercel/firewall API shape. When unavailable the check
  // returns null and we pass through. Upstash rate limiter is the backup.
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

  // --- CSP with per-request nonce ---
  const csp = buildCsp(nonce, isDev);

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
    // Skip static assets and image-optimization internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
