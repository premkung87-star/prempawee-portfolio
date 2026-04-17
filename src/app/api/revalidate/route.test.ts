import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Hoisted mock — clearKnowledgeCache must be testable without a real
// Supabase connection.
vi.mock("@/lib/supabase", () => ({
  clearKnowledgeCache: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 when REVALIDATE_SECRET is not configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const { POST } = await import("./route");
    const req = new Request("http://test/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "anything" },
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not configured/i);
  });

  it("returns 401 when secret is missing", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
    const { POST } = await import("./route");
    const req = new Request("http://test/api/revalidate", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret is wrong", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
    const { POST } = await import("./route");
    const req = new Request("http://test/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "wrong" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret is correct length but different (constant-time)", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "12345678");
    const { POST } = await import("./route");
    const req = new Request("http://test/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "12345679" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 and clears cache when secret matches", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
    const { clearKnowledgeCache } = await import("@/lib/supabase");
    const { POST } = await import("./route");
    const req = new Request("http://test/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "s3cret" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; clearedAt?: string };
    expect(body.ok).toBe(true);
    expect(typeof body.clearedAt).toBe("string");
    expect(clearKnowledgeCache).toHaveBeenCalledOnce();
  });
});
