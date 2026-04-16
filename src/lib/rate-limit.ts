// Rate limiter with Upstash Redis primary + in-memory fallback.
//
// Usage:
//   const { allowed, remaining, resetAt } = await rateLimit(getClientIp(req));
//
// Priority order:
//   1. Development mode → bypass (localhost collapses to a single bucket per
//      AUDIT_LOG §15).
//   2. Upstash env vars present → use Upstash (serverless-safe, atomic).
//   3. Otherwise → in-memory Map (per-lambda-instance, not safe across
//      serverless instances; acceptable for MVP before Upstash is provisioned).

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logError, logWarn } from "./logger";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

// --- Upstash client (module-scoped so Fluid Compute reuses across invocations)
const hasUpstash = Boolean(
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN),
);

const upstashLimiter: Ratelimit | null = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.fixedWindow(MAX_REQUESTS, "1 h"),
      analytics: true,
      prefix: "rl:chat",
    })
  : null;

// --- In-memory fallback (works until Upstash is wired)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memMap = new Map<string, RateLimitEntry>();

// Cleanup expired entries. Runs on every rateLimit() call, cheap even at scale.
function cleanupExpired(now: number) {
  for (const [key, entry] of memMap) {
    if (now >= entry.resetAt) memMap.delete(key);
  }
}

function inMemoryRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  cleanupExpired(now);
  const entry = memMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    memMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (entry.count < MAX_REQUESTS) {
    entry.count += 1;
    return {
      allowed: true,
      remaining: MAX_REQUESTS - entry.count,
      resetAt: entry.resetAt,
    };
  }

  return { allowed: false, remaining: 0, resetAt: entry.resetAt };
}

export async function rateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  // Bypass in development so localhost testing is not throttled.
  // In dev, getClientIp() returns "unknown" for all local requests, so a single
  // bucket would rate-limit the entire dev session (see AUDIT_LOG §15).
  if (process.env.NODE_ENV === "development") {
    return {
      allowed: true,
      remaining: MAX_REQUESTS,
      resetAt: Date.now() + WINDOW_MS,
    };
  }

  if (upstashLimiter) {
    try {
      const { success, remaining, reset } = await upstashLimiter.limit(ip);
      return { allowed: success, remaining, resetAt: reset };
    } catch (err) {
      logError("rate-limit.upstash.failed", {
        error: err instanceof Error ? err : { message: String(err) },
        fallback: "in-memory",
      });
      // Fall through to in-memory on transient Upstash error
    }
  } else {
    // Only warn once per cold start to avoid log spam
    if (!loggedMissingUpstash) {
      logWarn("rate-limit.upstash.not-configured", {
        note: "using in-memory fallback; rate limit will not be shared across serverless instances",
      });
      loggedMissingUpstash = true;
    }
  }

  return inMemoryRateLimit(ip);
}

let loggedMissingUpstash = false;

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}
