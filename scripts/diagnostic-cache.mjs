// Phase 1 diagnostic — verify real production cache economics, not synthetic.
// Run: node --env-file=.env.local scripts/diagnostic-cache.mjs

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

// PR #53 merged at 2026-04-26T07:11:36Z. Vercel deploy ~50s, effects from 07:13Z.
// PR #54 merged at 2026-04-26T07:41:04Z, effects from 07:42Z.
const PR53_MERGE = new Date("2026-04-26T07:11:36Z");
const PR54_MERGE = new Date("2026-04-26T07:41:04Z");
const PR53_LIVE = new Date("2026-04-26T07:13:00Z");
const PR54_LIVE = new Date("2026-04-26T07:42:00Z");
const NOW = new Date();

// Sonnet 4 pricing per the FinOps dashboard's CLAUDE_PRICING constant.
// Approximate; verify against src/app/admin/finops/page.tsx after.
const PRICE = {
  input: 3 / 1_000_000,         // $3/MTok
  output: 15 / 1_000_000,       // $15/MTok
  cacheWrite: 3.75 / 1_000_000, // 1.25× input
  cacheRead: 0.30 / 1_000_000,  // 0.10× input
};

function cost(input, output, cacheCreate, cacheRead) {
  // input_tokens already excludes cached portion (Anthropic's billing model).
  const uncachedInput = Math.max(0, input - cacheRead);
  return (
    uncachedInput * PRICE.input +
    cacheCreate * PRICE.cacheWrite +
    cacheRead * PRICE.cacheRead +
    output * PRICE.output
  );
}

function costNoCache(input, output, cacheCreate, cacheRead) {
  // What it would have cost without caching: all tokens at full input rate.
  const totalInput = input + cacheRead; // Anthropic counts cache_read separately
  return totalInput * PRICE.input + output * PRICE.output;
}

// Pull last 24h of token_usage rows
const since24h = new Date(NOW.getTime() - 24 * 3600 * 1000);
const { data: rows24h, error } = await supabase
  .from("analytics")
  .select("created_at, session_id, event_data")
  .eq("event_type", "token_usage")
  .gte("created_at", since24h.toISOString())
  .order("created_at", { ascending: true });

if (error) {
  console.error("Query failed:", error);
  process.exit(1);
}

console.log("=".repeat(80));
console.log("PHASE 1 DIAGNOSTIC — REAL PRODUCTION DATA");
console.log("=".repeat(80));
console.log(`Now:       ${NOW.toISOString()}`);
console.log(`PR #53 merged: ${PR53_MERGE.toISOString()} (live ~${PR53_LIVE.toISOString()})`);
console.log(`PR #54 merged: ${PR54_MERGE.toISOString()} (live ~${PR54_LIVE.toISOString()})`);
console.log(`Last 24h: ${rows24h.length} token_usage rows\n`);

// ============================================================
// QUESTION 1: Hourly cost breakdown last 24h
// ============================================================
console.log("\n" + "=".repeat(80));
console.log("Q1. HOURLY COST BREAKDOWN (last 24h)");
console.log("=".repeat(80));

const hourBuckets = new Map();
for (const row of rows24h) {
  const t = new Date(row.created_at);
  const hourKey = `${t.toISOString().slice(0, 13)}:00Z`;
  const e = row.event_data;
  const input = Number(e.input_tokens || 0);
  const output = Number(e.output_tokens || 0);
  const cc = Number(e.cache_creation_tokens || 0);
  const cr = Number(e.cache_read_tokens || 0);
  if (!hourBuckets.has(hourKey)) {
    hourBuckets.set(hourKey, { calls: 0, input: 0, output: 0, cc: 0, cr: 0, c: 0, cNoCache: 0 });
  }
  const b = hourBuckets.get(hourKey);
  b.calls++;
  b.input += input;
  b.output += output;
  b.cc += cc;
  b.cr += cr;
  b.c += cost(input, output, cc, cr);
  b.cNoCache += costNoCache(input, output, cc, cr);
}

console.log(
  "hour".padEnd(22) +
    "calls".padStart(7) +
    "input".padStart(10) +
    "create".padStart(10) +
    "read".padStart(10) +
    "$ actual".padStart(11) +
    "$ no-cache".padStart(12) +
    "  delta",
);
console.log("-".repeat(95));
const hours = [...hourBuckets.keys()].sort();
for (const h of hours) {
  const b = hourBuckets.get(h);
  const t = new Date(h);
  const tag =
    t < PR53_LIVE ? "[pre-#53]"
    : t < PR54_LIVE ? "[post-#53/pre-#54]"
    : "[post-#54]";
  const delta = b.c - b.cNoCache;
  const deltaPct = b.cNoCache > 0 ? (delta / b.cNoCache) * 100 : 0;
  console.log(
    h.padEnd(22) +
      String(b.calls).padStart(7) +
      String(b.input).padStart(10) +
      String(b.cc).padStart(10) +
      String(b.cr).padStart(10) +
      ("$" + b.c.toFixed(4)).padStart(11) +
      ("$" + b.cNoCache.toFixed(4)).padStart(12) +
      "  " +
      (delta >= 0 ? "+" : "") +
      "$" + delta.toFixed(4) + ` (${deltaPct.toFixed(1)}%)` + " " + tag,
  );
}

// 4-hour pre-merge vs 4-hour post-merge comparison (PR #53)
const pre4 = new Date(PR53_LIVE.getTime() - 4 * 3600 * 1000);
const post4 = new Date(PR53_LIVE.getTime() + 4 * 3600 * 1000);
const preRows = rows24h.filter(r => new Date(r.created_at) >= pre4 && new Date(r.created_at) < PR53_LIVE);
const postRows = rows24h.filter(r => new Date(r.created_at) >= PR53_LIVE && new Date(r.created_at) < post4);

function summary(rows) {
  let calls = 0, input = 0, output = 0, cc = 0, cr = 0, c = 0;
  for (const r of rows) {
    const e = r.event_data;
    calls++;
    input += Number(e.input_tokens || 0);
    output += Number(e.output_tokens || 0);
    cc += Number(e.cache_creation_tokens || 0);
    cr += Number(e.cache_read_tokens || 0);
    c += cost(Number(e.input_tokens || 0), Number(e.output_tokens || 0), Number(e.cache_creation_tokens || 0), Number(e.cache_read_tokens || 0));
  }
  return { calls, input, output, cc, cr, c, perCall: calls > 0 ? c / calls : 0 };
}

const preSum = summary(preRows);
const postSum = summary(postRows);
console.log(`\n4h PRE-PR#53  (${pre4.toISOString().slice(11,16)} - ${PR53_LIVE.toISOString().slice(11,16)}):`);
console.log(`  calls=${preSum.calls}  cost=$${preSum.c.toFixed(4)}  per-call=$${preSum.perCall.toFixed(5)}  cache_create=${preSum.cc}  cache_read=${preSum.cr}`);
console.log(`4h POST-PR#53 (${PR53_LIVE.toISOString().slice(11,16)} - ${post4.toISOString().slice(11,16)}):`);
console.log(`  calls=${postSum.calls}  cost=$${postSum.c.toFixed(4)}  per-call=$${postSum.perCall.toFixed(5)}  cache_create=${postSum.cc}  cache_read=${postSum.cr}`);
const perCallDelta = postSum.perCall - preSum.perCall;
const perCallPct = preSum.perCall > 0 ? (perCallDelta / preSum.perCall) * 100 : 0;
console.log(`Per-call delta: ${perCallDelta >= 0 ? "+" : ""}$${perCallDelta.toFixed(5)} (${perCallPct.toFixed(1)}%)`);

// ============================================================
// QUESTION 2: Session length distribution (last 7 days)
// ============================================================
console.log("\n" + "=".repeat(80));
console.log("Q2. SESSION LENGTH DISTRIBUTION (last 7 days)");
console.log("=".repeat(80));

const since7d = new Date(NOW.getTime() - 7 * 24 * 3600 * 1000);
const { data: rows7d } = await supabase
  .from("analytics")
  .select("session_id, event_data")
  .eq("event_type", "chat_message")
  .gte("created_at", since7d.toISOString());

// Count user messages per session
const sessMsgs = new Map();
if (rows7d) {
  for (const r of rows7d) {
    const sid = r.session_id;
    if (!sid) continue;
    if (!sessMsgs.has(sid)) sessMsgs.set(sid, 0);
    if (r.event_data?.role === "user") sessMsgs.set(sid, sessMsgs.get(sid) + 1);
  }
}

const lengths = [...sessMsgs.values()].filter(n => n > 0).sort((a, b) => a - b);
const buckets = { "1": 0, "2": 0, "3-5": 0, "6-10": 0, "11+": 0 };
for (const n of lengths) {
  if (n === 1) buckets["1"]++;
  else if (n === 2) buckets["2"]++;
  else if (n <= 5) buckets["3-5"]++;
  else if (n <= 10) buckets["6-10"]++;
  else buckets["11+"]++;
}
const total = lengths.length;
console.log(`Total sessions with >=1 user message: ${total}`);
console.log(`Median messages/session: ${total > 0 ? lengths[Math.floor(total / 2)] : "n/a"}`);
console.log(`P75: ${total > 0 ? lengths[Math.floor(total * 0.75)] : "n/a"}`);
console.log(`P90: ${total > 0 ? lengths[Math.floor(total * 0.9)] : "n/a"}`);
console.log(`Max: ${total > 0 ? lengths[lengths.length - 1] : "n/a"}\n`);
console.log("Bucket    count   pct");
console.log("-".repeat(35));
for (const [k, v] of Object.entries(buckets)) {
  const pct = total > 0 ? (v / total) * 100 : 0;
  console.log(`${k.padEnd(10)}${String(v).padStart(5)}   ${pct.toFixed(1)}%`);
}

// ============================================================
// QUESTION 3: Per-session cache effectiveness (post-PR #54 only)
// ============================================================
console.log("\n" + "=".repeat(80));
console.log("Q3. PER-SESSION CACHE EFFECTIVENESS (post-PR#54)");
console.log("=".repeat(80));

const postPR54Rows = rows24h.filter(r => new Date(r.created_at) >= PR54_LIVE);
const sessions = new Map();
for (const r of postPR54Rows) {
  const sid = r.session_id;
  if (!sid) continue;
  if (!sessions.has(sid)) sessions.set(sid, []);
  sessions.get(sid).push(r);
}

let sessionsWithWrite = 0;
let sessionsWriteThenRead = 0;
let totalWastedWrites = 0; // cache_create tokens that never got read in same session
let totalUsefulWrites = 0;
for (const [sid, calls] of sessions) {
  calls.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const hasWrite = calls.some(c => Number(c.event_data.cache_creation_tokens || 0) > 0);
  if (hasWrite) {
    sessionsWithWrite++;
    // Find first write timestamp, check if any read happens within 5 min after
    const firstWriteIdx = calls.findIndex(c => Number(c.event_data.cache_creation_tokens || 0) > 0);
    const firstWrite = calls[firstWriteIdx];
    const writeTime = new Date(firstWrite.created_at);
    const writeTokens = Number(firstWrite.event_data.cache_creation_tokens || 0);
    const subsequent = calls.slice(firstWriteIdx + 1);
    const readWithin5Min = subsequent.some(c => {
      const dt = (new Date(c.created_at) - writeTime) / 1000;
      return dt <= 300 && Number(c.event_data.cache_read_tokens || 0) > 0;
    });
    if (readWithin5Min) {
      sessionsWriteThenRead++;
      totalUsefulWrites += writeTokens;
    } else {
      totalWastedWrites += writeTokens;
    }
  }
}

const writeFollowupRate = sessionsWithWrite > 0 ? (sessionsWriteThenRead / sessionsWithWrite) * 100 : 0;
console.log(`Post-PR#54 sessions: ${sessions.size}`);
console.log(`Sessions with at least one cache_create: ${sessionsWithWrite}`);
console.log(`Of those, sessions with a follow-up cache_read within 5 min TTL: ${sessionsWriteThenRead}`);
console.log(`Write-followup rate: ${writeFollowupRate.toFixed(1)}%`);
console.log(`Wasted cache_write tokens (never read in same session): ${totalWastedWrites}`);
console.log(`Useful cache_write tokens (followed by ≥1 read): ${totalUsefulWrites}`);
console.log(`Wasted-write cost (1.25× premium that bought nothing): $${(totalWastedWrites * (PRICE.cacheWrite - PRICE.input)).toFixed(4)}`);

// ============================================================
// QUESTION 4: Net cost impact (post-PR #54 only)
// ============================================================
console.log("\n" + "=".repeat(80));
console.log("Q4. NET COST IMPACT (post-PR#54 only — when analytics is honest)");
console.log("=".repeat(80));

const postPR54Sum = summary(postPR54Rows);
let costNoCache_total = 0;
for (const r of postPR54Rows) {
  const e = r.event_data;
  costNoCache_total += costNoCache(
    Number(e.input_tokens || 0),
    Number(e.output_tokens || 0),
    Number(e.cache_creation_tokens || 0),
    Number(e.cache_read_tokens || 0),
  );
}
const netDelta = postPR54Sum.c - costNoCache_total;
const netDeltaPct = costNoCache_total > 0 ? (netDelta / costNoCache_total) * 100 : 0;
console.log(`Calls (post-PR#54): ${postPR54Sum.calls}`);
console.log(`Tokens: input=${postPR54Sum.input}, output=${postPR54Sum.output}, cache_create=${postPR54Sum.cc}, cache_read=${postPR54Sum.cr}`);
console.log(`Actual cost (with caching):    $${postPR54Sum.c.toFixed(4)}  ($${postPR54Sum.perCall.toFixed(5)}/call)`);
console.log(`Hypothetical cost (no caching): $${costNoCache_total.toFixed(4)}  ($${(costNoCache_total / Math.max(postPR54Sum.calls, 1)).toFixed(5)}/call)`);
console.log(`Net delta from caching: ${netDelta >= 0 ? "+" : ""}$${netDelta.toFixed(4)} (${netDeltaPct.toFixed(1)}%)`);
if (netDelta > 0) {
  console.log(`>>> CACHING IS COSTING MORE THAN IT SAVES. Revert candidate. <<<`);
} else {
  console.log(`>>> Caching is net positive by ${Math.abs(netDeltaPct).toFixed(1)}%. <<<`);
}
