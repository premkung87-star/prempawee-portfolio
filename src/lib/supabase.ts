import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { logError, logWarn } from "./logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only admin client (service role). Do NOT import from client components.
// Used for RAG knowledge-base upserts, dev_audit_log writes, and other writes
// that should bypass public RLS policies.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export type KnowledgeEntry = {
  id: number;
  category: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
};

/**
 * Fetch knowledge base entries by category.
 * For the current scale (~20 entries), loading by category is faster
 * and more accurate than vector search.
 */
export async function getKnowledgeByCategory(
  categories: string[]
): Promise<KnowledgeEntry[]> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("id, category, title, content, metadata")
    .in("category", categories)
    .order("id");

  if (error) {
    logError("supabase.knowledge.query.failed", {
      error: { message: error.message, code: error.code },
    });
    return [];
  }

  return data || [];
}

/**
 * Fetch ALL knowledge base entries.
 * At ~20 entries (~4,000 tokens), this is cheap and gives Claude full context.
 */
export async function getAllKnowledge(): Promise<KnowledgeEntry[]> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("id, category, title, content, metadata")
    .order("category")
    .order("id");

  if (error) {
    logError("supabase.knowledge.all.failed", {
      error: { message: error.message, code: error.code },
    });
    return [];
  }

  return data || [];
}

/**
 * Search knowledge base by keyword (full-text search).
 */
export async function searchKnowledge(
  query: string,
  category?: string
): Promise<KnowledgeEntry[]> {
  const { data, error } = await supabase.rpc("search_knowledge", {
    search_query: query,
    category_filter: category || null,
    result_limit: 10,
  });

  if (error) {
    logError("supabase.knowledge.search.failed", {
      error: { message: error.message, code: error.code },
      query,
      category,
    });
    return [];
  }

  return data || [];
}

/**
 * Log a conversation message via service-role so it bypasses any drift in the
 * public RLS policies (migration 001 tightened them). If anon-key writes ever
 * start failing silently, we lose our entire chat history. Admin client
 * guarantees we land the row or surface an error.
 * Content is truncated to 5000 chars to mirror the database CHECK constraint.
 */
export async function logConversation(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = content.substring(0, 5000);
  if (trimmed.length === 0) {
    return { ok: false, error: "empty_content" };
  }
  const client = supabaseAdmin ?? supabase;
  const { error } = await client.from("conversations").insert({
    session_id: sessionId,
    role,
    content: trimmed,
  });

  if (error) {
    logError("supabase.conversation.insert.failed", {
      error: { message: error.message, code: error.code },
      sessionId,
      role,
      via: supabaseAdmin ? "service_role" : "anon",
    });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Log an analytics event via service-role (same rationale as
 * logConversation — protect against RLS drift silently dropping all ops
 * telemetry).
 */
export async function logAnalytics(
  eventType: string,
  eventData: Record<string, unknown> = {},
  sessionId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = supabaseAdmin ?? supabase;
  const { error } = await client.from("analytics").insert({
    event_type: eventType,
    event_data: eventData,
    session_id: sessionId,
  });

  if (error) {
    logError("supabase.analytics.insert.failed", {
      error: { message: error.message, code: error.code },
      eventType,
      sessionId,
      via: supabaseAdmin ? "service_role" : "anon",
    });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Insert a lead (service-role required). Mirrors the DB-level CHECK
 * constraints from migration 001_hardening.sql. Returns the new row id.
 */
export type LeadInput = {
  name?: string | null;
  email?: string | null;
  line_id?: string | null;
  business_type?: string | null;
  package_interest?: "starter" | "pro" | "enterprise" | null;
  message?: string | null;
  source?: string | null;
};

export async function insertLead(
  input: LeadInput,
): Promise<{ ok: boolean; id?: number; error?: string }> {
  if (!supabaseAdmin) {
    return { ok: false, error: "service_role_not_configured" };
  }
  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      name: input.name?.slice(0, 200) ?? null,
      email: input.email?.slice(0, 320) ?? null,
      line_id: input.line_id?.slice(0, 100) ?? null,
      business_type: input.business_type?.slice(0, 100) ?? null,
      package_interest: input.package_interest ?? null,
      message: input.message?.slice(0, 2000) ?? null,
      source: input.source?.slice(0, 100) ?? "portfolio_chat",
    })
    .select("id")
    .single();
  if (error) {
    logError("supabase.leads.insert.failed", {
      error: { message: error.message, code: error.code },
    });
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data.id };
}

/**
 * Insert a feedback row (service-role required). Mirrors the DB-level CHECK
 * constraints from migration 003_feedback.sql. Returns the new row id.
 */
export type FeedbackInput = {
  type: "bug" | "suggestion" | "thanks" | "other";
  body: string;
  email?: string | null;
  page_url?: string | null;
  user_agent?: string | null;
  ip_prefix?: string | null;
};

export async function insertFeedback(
  input: FeedbackInput,
): Promise<{ ok: boolean; id?: number; error?: string }> {
  if (!supabaseAdmin) {
    return { ok: false, error: "service_role_not_configured" };
  }
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .insert({
      type: input.type,
      body: input.body.slice(0, 4000),
      email: input.email?.slice(0, 254) ?? null,
      page_url: input.page_url?.slice(0, 2048) ?? null,
      user_agent: input.user_agent?.slice(0, 500) ?? null,
      ip_prefix: input.ip_prefix?.slice(0, 64) ?? null,
    })
    .select("id")
    .single();
  if (error) {
    logError("supabase.feedback.insert.failed", {
      error: { message: error.message, code: error.code },
    });
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------------
// RAG knowledge-base cache — two-tier: L1 in-memory per-isolate (30s fast
// path), L2 Upstash Redis (global, 5min, cross-isolate). /api/revalidate
// clears L2 → next miss on L1 re-reads L2 → miss → re-fetches from Supabase.
// Fixes the edge/Node cache split where the old module-scoped `let` was
// only invalidated in one runtime.
// ---------------------------------------------------------------------------

const cacheRedis = (() => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
})();

const KB_CACHE_KEY = "rag:kb:v1";
const L2_TTL_SECONDS = 5 * 60; // 5 min Upstash TTL (global)
const L1_TTL_MS = 30 * 1000; // 30s per-isolate fast path

let l1Cache: { data: string; timestamp: number } | null = null;

type SemanticRow = {
  id: number;
  category: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
  semantic_score: number;
  fulltext_score: number;
  combined_score: number;
};

/**
 * Get the full knowledge-base dump formatted as markdown.
 *   L1 (30s per-isolate) → L2 (Upstash, 5min global) → Supabase.
 * Invalidated globally by /api/revalidate (drops L2; L1 expires naturally).
 */
export async function getKnowledgeContext(): Promise<string> {
  const now = Date.now();
  // L1 — per-isolate fast path
  if (l1Cache && now - l1Cache.timestamp < L1_TTL_MS) {
    return l1Cache.data;
  }
  // L2 — global (Upstash)
  if (cacheRedis) {
    try {
      const cached = await cacheRedis.get<string>(KB_CACHE_KEY);
      if (typeof cached === "string" && cached.length > 0) {
        l1Cache = { data: cached, timestamp: now };
        return cached;
      }
    } catch (err) {
      logWarn("kb.cache.get.failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  // Miss on both tiers → fetch fresh from Supabase
  const entries = await getAllKnowledge();
  const formatted = formatKnowledgeForPrompt(entries);
  // Populate both tiers (best-effort on L2)
  l1Cache = { data: formatted, timestamp: now };
  if (cacheRedis) {
    cacheRedis
      .set(KB_CACHE_KEY, formatted, { ex: L2_TTL_SECONDS })
      .catch((err) =>
        logWarn("kb.cache.set.failed", {
          error: err instanceof Error ? err.message : String(err),
        }),
      );
  }
  return formatted;
}

/**
 * Semantic + full-text hybrid retrieval. Uses the match_knowledge_hybrid RPC
 * added in migration 002_semantic.sql. Returns null if the RPC fails
 * (not applied yet, or DB error) so callers can gracefully fall back.
 */
export async function hybridSearchKnowledge(
  queryEmbedding: number[],
  queryText: string,
  matchCount = 8,
): Promise<SemanticRow[] | null> {
  const { data, error } = await supabase.rpc("match_knowledge_hybrid", {
    query_embedding: queryEmbedding,
    query_text: queryText.slice(0, 2000),
    match_count: matchCount,
    semantic_weight: 0.6,
    fulltext_weight: 0.4,
    category_filter: null,
  });
  if (error) {
    logError("supabase.hybrid-search.failed", {
      error: { message: error.message, code: error.code },
    });
    return null;
  }
  return (data as SemanticRow[]) ?? [];
}

/**
 * Format a retrieved subset of knowledge_base rows into prompt context.
 * Used after hybrid retrieval. Order preserved (assumed caller ranked).
 */
export function formatSemanticRowsForPrompt(rows: SemanticRow[]): string {
  if (rows.length === 0) return "";
  const items = rows.map((r) => {
    let text = `### ${r.title}\n${r.content}`;
    if (r.metadata && Object.keys(r.metadata).length > 0) {
      const meta = r.metadata as Record<string, unknown>;
      if (meta.url) text += `\nURL: ${meta.url}`;
      if (meta.tech) text += `\nTech: ${(meta.tech as string[]).join(", ")}`;
      if (meta.status) text += `\nStatus: ${meta.status}`;
      if (meta.price)
        text += `\nPrice: ฿${(meta.price as number).toLocaleString()}`;
    }
    return text;
  });
  return `## RETRIEVED CONTEXT (top ${rows.length} by hybrid score)\n\n${items.join("\n\n")}`;
}

/**
 * Invalidate both L1 and L2. L1 is per-isolate so this only clears the
 * isolate we're currently in — but that's fine because L1 TTL is 30s anyway
 * and L2 (Upstash) is global, so every other isolate picks up the fresh
 * content on its next cache miss.
 */
export async function clearKnowledgeCache(): Promise<void> {
  l1Cache = null;
  if (cacheRedis) {
    try {
      await cacheRedis.del(KB_CACHE_KEY);
    } catch (err) {
      logWarn("kb.cache.del.failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/**
 * Format knowledge entries into context for Claude's system prompt.
 */
export function formatKnowledgeForPrompt(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return "";

  const grouped: Record<string, KnowledgeEntry[]> = {};
  for (const entry of entries) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }

  const sections: string[] = [];

  for (const [category, items] of Object.entries(grouped)) {
    const label = category.toUpperCase();
    const itemTexts = items.map((item) => {
      let text = `### ${item.title}\n${item.content}`;
      if (item.metadata && Object.keys(item.metadata).length > 0) {
        const meta = item.metadata as Record<string, unknown>;
        if (meta.url) text += `\nURL: ${meta.url}`;
        if (meta.tech)
          text += `\nTech: ${(meta.tech as string[]).join(", ")}`;
        if (meta.status) text += `\nStatus: ${meta.status}`;
        if (meta.price)
          text += `\nPrice: ฿${(meta.price as number).toLocaleString()}`;
      }
      return text;
    });
    sections.push(`## ${label}\n\n${itemTexts.join("\n\n")}`);
  }

  return sections.join("\n\n---\n\n");
}
