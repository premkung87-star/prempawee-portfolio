import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

describe("middleware — CSRF origin check", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function runMiddleware(init: {
    path: string;
    method: string;
    origin?: string;
  }): Promise<Response> {
    const { middleware } = await import("./middleware");
    const url = new URL(init.path, "https://prempawee.com");
    const headers = new Headers();
    if (init.origin !== undefined) headers.set("origin", init.origin);
    const req = new NextRequest(url, {
      method: init.method,
      headers,
    });
    return middleware(req);
  }

  it("allows POST /api/leads from prempawee.com origin", async () => {
    const res = await runMiddleware({
      path: "/api/leads",
      method: "POST",
      origin: "https://prempawee.com",
    });
    // Next's NextResponse.next() returns a 200 with special markers
    expect(res.status).not.toBe(403);
  });

  it("allows POST /api/leads from auto-generated Vercel preview origin", async () => {
    const res = await runMiddleware({
      path: "/api/leads",
      method: "POST",
      origin: "https://prempawee-portfolio-abc123-premkung87-stars-projects.vercel.app",
    });
    expect(res.status).not.toBe(403);
  });

  it("rejects POST /api/leads from disallowed origin", async () => {
    const res = await runMiddleware({
      path: "/api/leads",
      method: "POST",
      origin: "https://malicious.example.com",
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/forbidden/i);
  });

  it("allows GET requests regardless of origin", async () => {
    const res = await runMiddleware({
      path: "/api/chat",
      method: "GET",
      origin: "https://anywhere.com",
    });
    expect(res.status).not.toBe(403);
  });

  it("allows POST to non-/api/ paths (admin login, etc.) without origin check", async () => {
    const res = await runMiddleware({
      path: "/admin/login",
      method: "POST",
      origin: "https://anywhere.com",
    });
    expect(res.status).not.toBe(403);
  });

  it("in dev mode, bypasses origin check entirely", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await runMiddleware({
      path: "/api/leads",
      method: "POST",
      origin: "https://any.example.com",
    });
    expect(res.status).not.toBe(403);
  });
});
