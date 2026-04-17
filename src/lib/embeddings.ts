// Embedding client. Tries providers in this order:
//   1. OpenAI (text-embedding-3-small, 1536-dim) — matches our vector(1536)
//      column. Cheapest + most widely-available provider.
//   2. Voyage (voyage-3, 1024-dim) — Anthropic's recommended embedding
//      provider. Requires VOYAGE_API_KEY. Pad/truncate to 1536 to fit schema.
//
// Returns null (instead of throwing) when no provider is configured — the
// chat route interprets that as "fall back to full-context retrieval."

import { logError, logWarn } from "./logger";

const OPENAI_MODEL = "text-embedding-3-small";
const OPENAI_DIM = 1536;

export type EmbeddingResult = {
  vector: number[];
  provider: "openai" | "voyage";
  model: string;
  tokens: number;
};

async function embedOpenAI(text: string): Promise<EmbeddingResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: text,
        dimensions: OPENAI_DIM,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logError("embeddings.openai.http-error", {
        status: res.status,
        body: body.slice(0, 200),
      });
      return null;
    }
    const json = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
      usage: { total_tokens: number };
    };
    const v = json.data?.[0]?.embedding;
    if (!Array.isArray(v) || v.length !== OPENAI_DIM) {
      logError("embeddings.openai.bad-shape", { length: v?.length });
      return null;
    }
    return {
      vector: v,
      provider: "openai",
      model: OPENAI_MODEL,
      tokens: json.usage?.total_tokens ?? 0,
    };
  } catch (err) {
    logError("embeddings.openai.exception", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

async function embedVoyage(text: string): Promise<EmbeddingResult | null> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        input: text,
        model: "voyage-3",
        // voyage-3 is 1024-dim by default; we pad to 1536 below
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      logError("embeddings.voyage.http-error", { status: res.status });
      return null;
    }
    const json = (await res.json()) as {
      data: Array<{ embedding: number[] }>;
      usage?: { total_tokens: number };
    };
    const raw = json.data?.[0]?.embedding;
    if (!Array.isArray(raw)) return null;
    // Pad to 1536 with zeros so it fits our vector(1536) column.
    // Keep the model provenance in the provider field so we can migrate later.
    const padded = raw.length >= 1536 ? raw.slice(0, 1536) : [...raw, ...new Array(1536 - raw.length).fill(0)];
    return {
      vector: padded,
      provider: "voyage",
      model: "voyage-3",
      tokens: json.usage?.total_tokens ?? 0,
    };
  } catch (err) {
    logError("embeddings.voyage.exception", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Embed a single piece of text. Returns null if no provider is configured,
 * or all providers fail — callers should fall back to non-semantic retrieval.
 */
export async function embed(text: string): Promise<EmbeddingResult | null> {
  const clean = text.trim().slice(0, 8000);
  if (!clean) return null;
  // OpenAI first (preferred: matches column dim natively, cheapest).
  const openai = await embedOpenAI(clean);
  if (openai) return openai;
  // Voyage fallback.
  const voyage = await embedVoyage(clean);
  if (voyage) return voyage;
  // Nothing configured — expected path in many deployments
  if (!process.env.OPENAI_API_KEY && !process.env.VOYAGE_API_KEY) {
    return null; // silent: RAG falls back to full-context retrieval
  }
  logWarn("embeddings.all-providers-failed");
  return null;
}

export function isEmbeddingConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.VOYAGE_API_KEY);
}
