// Populate knowledge_base.embedding for every row via the configured
// embedding provider (OpenAI preferred, Voyage fallback). Idempotent:
// rows that already have a non-null embedding are skipped unless --force.
//
// Usage:
//   node --env-file=.env.local scripts/generate-embeddings.mjs
//   node --env-file=.env.local scripts/generate-embeddings.mjs --force
//
// Requires: SUPABASE_SERVICE_ROLE_KEY + (OPENAI_API_KEY or VOYAGE_API_KEY)

import { createClient } from "@supabase/supabase-js";

const force = process.argv.includes("--force");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const voyageKey = process.env.VOYAGE_API_KEY;

if (!url || !serviceKey) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "missing.env",
      need: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    }),
  );
  process.exit(1);
}
if (!openaiKey && !voyageKey) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "missing.embedding.provider",
      hint: "Set OPENAI_API_KEY (preferred) or VOYAGE_API_KEY",
    }),
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function embedOpenAI(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    }),
  });
  if (!res.ok) {
    throw new Error(`openai http ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data[0].embedding;
}

async function embedVoyage(text) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${voyageKey}`,
    },
    body: JSON.stringify({ input: text, model: "voyage-3" }),
  });
  if (!res.ok) throw new Error(`voyage http ${res.status}`);
  const json = await res.json();
  const raw = json.data[0].embedding;
  return raw.length >= 1536
    ? raw.slice(0, 1536)
    : [...raw, ...new Array(1536 - raw.length).fill(0)];
}

async function embed(text) {
  return openaiKey ? embedOpenAI(text) : embedVoyage(text);
}

async function main() {
  const query = supabase
    .from("knowledge_base")
    .select("id, title, content, embedding");

  const { data, error } = await query;
  if (error) throw new Error(`select: ${error.message}`);

  const rows = data ?? [];
  const toEmbed = force ? rows : rows.filter((r) => r.embedding === null);
  console.log(
    JSON.stringify({
      level: "info",
      message: "embed.start",
      total: rows.length,
      toEmbed: toEmbed.length,
      skipped: rows.length - toEmbed.length,
      provider: openaiKey ? "openai" : "voyage",
      force,
    }),
  );

  let done = 0;
  let failed = 0;
  for (const row of toEmbed) {
    try {
      // Include title for context in the embedding
      const doc = `${row.title}\n\n${row.content}`;
      const vector = await embed(doc);
      const { error: updErr } = await supabase
        .from("knowledge_base")
        .update({ embedding: vector })
        .eq("id", row.id);
      if (updErr) throw new Error(updErr.message);
      done++;
      console.log(
        JSON.stringify({
          level: "info",
          message: "embed.row.done",
          id: row.id,
          title: row.title.slice(0, 60),
        }),
      );
      // Gentle rate limit on the provider side
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      failed++;
      console.error(
        JSON.stringify({
          level: "error",
          message: "embed.row.failed",
          id: row.id,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }

  console.log(
    JSON.stringify({
      level: failed ? "warn" : "info",
      message: "embed.complete",
      done,
      failed,
      total: toEmbed.length,
    }),
  );
  process.exit(failed ? 1 : 0);
}

await main();
