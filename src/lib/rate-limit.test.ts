import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// NOTE: rate-limit.ts reads process.env at module load. We need to stub env
// BEFORE importing it, then dynamically import inside each test so a fresh
// module graph runs with the desired env state.

describe("getClientIp", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("takes the first ip from x-forwarded-for", async () => {
    const { getClientIp } = await import("./rate-limit");
    const req = new Request("http://test", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", async () => {
    const { getClientIp } = await import("./rate-limit");
    const req = new Request("http://test", {
      headers: { "x-real-ip": "198.51.100.7" },
    });
    expect(getClientIp(req)).toBe("198.51.100.7");
  });

  it("returns 'unknown' when no header is set", async () => {
    const { getClientIp } = await import("./rate-limit");
    const req = new Request("http://test");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("rateLimit in development", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("always allows requests in dev (per AUDIT_LOG §15)", async () => {
    const { rateLimit } = await import("./rate-limit");
    for (let i = 0; i < 20; i++) {
      const { allowed } = await rateLimit("unknown");
      expect(allowed).toBe(true);
    }
  });
});

describe("rateLimit in production (in-memory fallback)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows up to MAX_REQUESTS then blocks", async () => {
    const { rateLimit } = await import("./rate-limit");
    // MAX_REQUESTS = 10 per src/lib/rate-limit.ts
    for (let i = 0; i < 10; i++) {
      const r = await rateLimit("ip-a");
      expect(r.allowed).toBe(true);
    }
    const eleventh = await rateLimit("ip-a");
    expect(eleventh.allowed).toBe(false);
    expect(eleventh.remaining).toBe(0);
  });

  it("isolates buckets by ip", async () => {
    const { rateLimit } = await import("./rate-limit");
    for (let i = 0; i < 10; i++) {
      await rateLimit("ip-b");
    }
    const otherIp = await rateLimit("ip-c");
    expect(otherIp.allowed).toBe(true);
  });
});
