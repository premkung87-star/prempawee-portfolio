import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("embeddings.embed + isEmbeddingConfigured", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when OPENAI_API_KEY is unset", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { embed, isEmbeddingConfigured } = await import("./embeddings");
    expect(isEmbeddingConfigured()).toBe(false);
    expect(await embed("hello")).toBeNull();
  });

  it("returns a vector on a successful OpenAI response", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const vector = new Array(1536).fill(0).map((_, i) => i / 1536);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ embedding: vector }],
          usage: { total_tokens: 42 },
        }),
      }),
    );
    const { embed, isEmbeddingConfigured } = await import("./embeddings");
    expect(isEmbeddingConfigured()).toBe(true);
    const result = await embed("hello world");
    expect(result).not.toBeNull();
    expect(result?.provider).toBe("openai");
    expect(result?.model).toBe("text-embedding-3-small");
    expect(result?.vector).toHaveLength(1536);
    expect(result?.tokens).toBe(42);
  });

  it("returns null on 429 quota exceeded and sets backoff", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: "quota" } }),
      text: async () => '{"error":"quota"}',
    });
    vi.stubGlobal("fetch", fetchMock);
    const { embed } = await import("./embeddings");
    expect(await embed("first call")).toBeNull();
    // Second call within backoff window should short-circuit — no new fetch.
    expect(await embed("second call")).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns null on non-OK non-429 with logged error", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "bad" } }),
        text: async () => '{"error":"bad"}',
      }),
    );
    const { embed } = await import("./embeddings");
    expect(await embed("hello")).toBeNull();
  });

  it("returns null on malformed embedding response", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      }),
    );
    const { embed } = await import("./embeddings");
    expect(await embed("hello")).toBeNull();
  });

  it("returns null for empty text", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const { embed } = await import("./embeddings");
    expect(await embed("")).toBeNull();
    expect(await embed("   ")).toBeNull();
  });
});
