// Inspects the last 10 minutes of analytics.token_usage rows to verify
// Anthropic prompt-cache behavior is healthy. Run after deploys that touch
// the chat route's caching logic, or any time the FinOps dashboard looks
// suspicious. Reports per-request input/output/create/read tokens + ratio
// + a 10-minute rollup hit rate.
//
// Usage: node --env-file=.env.local scripts/check-cache.mjs
//
// Healthy pattern: row 1 has cache_create > 0 (cold isolate), rows 2+ have
// cache_read >= 80% of input. If cache_read stays at 0 across a 5+ minute
// window, the cache_control marker is on the wrong block — investigate
// before assuming Anthropic-side issues.
//
// History: created 2026-04-26 to verify PR #53 (cache+runtime) after
// PR #54 fixed the AI SDK v6 field-name regression. See
// docs/superpowers/specs/2026-04-26-haiku-cache-cost-cut-design.md.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing env; run with --env-file=.env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("analytics")
  .select("created_at, session_id, event_data")
  .eq("event_type", "token_usage")
  .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
  .order("created_at", { ascending: true });

if (error) {
  console.error("Query failed:", error);
  process.exit(1);
}

console.log(`\nLast 10 minutes of token_usage events: ${data.length} rows\n`);
console.log(
  "time".padEnd(25) +
    "session".padEnd(35) +
    "input".padStart(8) +
    "output".padStart(8) +
    "create".padStart(10) +
    "read".padStart(10) +
    "  ratio",
);
console.log("-".repeat(100));

for (const row of data) {
  const p = row.event_data;
  const input = Number(p.input_tokens || 0);
  const create = Number(p.cache_creation_tokens || 0);
  const read = Number(p.cache_read_tokens || 0);
  const ratio = input > 0 ? (read / input) : 0;
  console.log(
    new Date(row.created_at).toISOString().padEnd(25) +
      String(row.session_id).slice(0, 33).padEnd(35) +
      String(input).padStart(8) +
      String(p.output_tokens || 0).padStart(8) +
      String(create).padStart(10) +
      String(read).padStart(10) +
      "  " +
      (ratio * 100).toFixed(1) +
      "%",
  );
}

const totals = data.reduce(
  (acc, row) => {
    acc.input += Number(row.event_data.input_tokens || 0);
    acc.create += Number(row.event_data.cache_creation_tokens || 0);
    acc.read += Number(row.event_data.cache_read_tokens || 0);
    return acc;
  },
  { input: 0, create: 0, read: 0 },
);

console.log("-".repeat(100));
console.log(`\nTOTALS: input=${totals.input}, create=${totals.create}, read=${totals.read}`);
console.log(`Cache hit ratio: ${(totals.read / Math.max(totals.input, 1) * 100).toFixed(1)}%`);

if (totals.read > 0) {
  console.log("\nCACHE READS ARE LIGHTING UP. Fix verified.");
} else {
  console.log("\nNo cache reads yet. Either the requests went to a cold isolate, or the marking is still wrong.");
}
