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

// Negative cache: once OpenAI returns 429 insufficient_quota, back off for
// N minutes instead of hammering the API + spamming Sentry with the same
// non-actionable error. Module-scoped so it persists across warm invocations.
let openaiBackoffUntil = 0;
const OPENAI_BACKOFF_MS = 10 * 60 * 1000; // 10 min

async function embedOpenAI(text: string): Promise<EmbeddingResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (Date.now() < openaiBackoffUntil) return null;
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
    if (res.status === 429) {
      // Quota / rate limit — flip negative cache, warn (not error) once.
      openaiBackoffUntil = Date.now() + OPENAI_BACKOFF_MS;
      logWarn("embeddings.openai.quota-exceeded", {
        cooldown_minutes: OPENAI_BACKOFF_MS / 60_000,
        hint: "Add credit at platform.openai.com/settings/organization/billing",
      });
      return null;
    }
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

// Voyage fallback intentionally removed — mixing embedding providers across
// the same corpus silently corrupts cosine similarity (zero-padding drags
// scores toward 0 vs native OpenAI vectors). If future need arises, add a
// separate `embedding_voyage` vector column to knowledge_base, gate
// retrieval by provider, and only blend-match within a single provider.
// Until then: OpenAI is the only provider; without it, retrieval falls
// back to full-context (see getKnowledgeContext).

/**
 * Embed a single piece of text via OpenAI. Returns null when:
 *   - no API key configured (chat falls back to full-context retrieval)
 *   - OpenAI quota exceeded (backoff active, see embedOpenAI)
 *   - network / schema error (logged, fall through)
 */
export async function embed(text: string): Promise<EmbeddingResult | null> {
  const clean = text.trim().slice(0, 8000);
  if (!clean) return null;
  return embedOpenAI(clean);
}

export function isEmbeddingConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
