// POST /api/revalidate — forces the in-memory RAG knowledge-base cache to
// expire immediately so freshly-seeded content shows without waiting for
// the 5-minute TTL. Intended to be called from scripts/refresh-knowledge-
// base.mjs after an upsert, or from a Supabase Database Webhook on row
// changes. Protected by a shared secret.

import { NextResponse } from "next/server";
import { clearKnowledgeCache } from "@/lib/supabase";
import { logInfo, logWarn } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(req: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    logWarn("revalidate.no-secret-configured");
    return NextResponse.json(
      { error: "Revalidation is not configured on the server." },
      { status: 503 },
    );
  }

  const provided = req.headers.get("x-revalidate-secret") || "";
  if (!constantTimeEq(provided, expected)) {
    logWarn("revalidate.unauthorized");
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await clearKnowledgeCache();
  logInfo("revalidate.cache.cleared");
  return NextResponse.json({ ok: true, clearedAt: new Date().toISOString() });
}
