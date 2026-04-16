import { createClient } from "@supabase/supabase-js";
import { logError } from "./logger";

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
 * Log a conversation message. Returns the insert result so callers can react
 * to failures if needed. Content is truncated to 5000 chars to mirror the
 * database CHECK constraint from migration 001_hardening.sql.
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
  const { error } = await supabase.from("conversations").insert({
    session_id: sessionId,
    role,
    content: trimmed,
  });

  if (error) {
    logError("supabase.conversation.insert.failed", {
      error: { message: error.message, code: error.code },
      sessionId,
      role,
    });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Log an analytics event. Non-blocking semantics; failures logged structurally
 * but not thrown.
 */
export async function logAnalytics(
  eventType: string,
  eventData: Record<string, unknown> = {},
  sessionId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("analytics").insert({
    event_type: eventType,
    event_data: eventData,
    session_id: sessionId,
  });

  if (error) {
    logError("supabase.analytics.insert.failed", {
      error: { message: error.message, code: error.code },
      eventType,
      sessionId,
    });
    return { ok: false, error: error.message };
  }
  return { ok: true };
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
