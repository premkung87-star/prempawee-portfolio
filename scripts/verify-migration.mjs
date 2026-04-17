// Verifies migrations/001_hardening.sql applied successfully.
// Run: node --env-file=.env.local scripts/verify-migration.mjs
//
// Uses the service-role client to query pg_catalog tables + probe new tables
// and RPCs. Exits 0 if everything is in place, 1 otherwise.

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

const checks = [];

async function check(name, fn) {
  try {
    const result = await fn();
    checks.push({ name, ok: result === true, detail: result });
    console.log(
      JSON.stringify({
        level: result === true ? "info" : "warn",
        check: name,
        result,
      }),
    );
  } catch (err) {
    checks.push({ name, ok: false, detail: String(err) });
    console.log(
      JSON.stringify({
        level: "error",
        check: name,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

// 1. dev_audit_log table exists (by attempting a service-role read — empty is fine)
await check("table.dev_audit_log", async () => {
  const { error } = await supabase.from("dev_audit_log").select("id").limit(0);
  if (error) return `error: ${error.message}`;
  return true;
});

// 2. rate_limits table exists
await check("table.rate_limits", async () => {
  const { error } = await supabase.from("rate_limits").select("id").limit(0);
  if (error) return `error: ${error.message}`;
  return true;
});

// 3. log_dev_run RPC exists (we call with a benign test payload)
await check("rpc.log_dev_run", async () => {
  const { data, error } = await supabase.rpc("log_dev_run", {
    p_run_id: `verify-${Date.now()}`,
    p_stage: "summary",
    p_summary: "migration verification probe",
    p_details: { source: "scripts/verify-migration.mjs" },
    p_success: true,
  });
  if (error) return `error: ${error.message}`;
  if (typeof data !== "number" && typeof data !== "string") {
    return `unexpected return type: ${typeof data}`;
  }
  return true;
});

// 4. CHECK constraint rejects overlong conversations.content (must fail with 23514)
await check("constraint.conversations.content_len", async () => {
  const tooLong = "x".repeat(5001);
  const { error } = await supabase.from("conversations").insert({
    session_id: "verify-probe",
    role: "user",
    content: tooLong,
  });
  if (!error) {
    return "ERROR: insert succeeded — constraint NOT active";
  }
  // Expect 23514 (check_violation) or similar
  if (error.code === "23514" || /check/.test(error.message.toLowerCase())) {
    return true;
  }
  return `unexpected error: ${error.code} ${error.message}`;
});

// 5. CHECK constraint rejects bad knowledge_base category
await check("constraint.knowledge_base.category_allowed", async () => {
  const { error } = await supabase.from("knowledge_base").insert({
    category: "__not_allowed__",
    title: "verify-probe",
    content: "test",
  });
  if (!error) return "ERROR: insert succeeded — constraint NOT active";
  if (error.code === "23514" || /check/.test(error.message.toLowerCase())) {
    return true;
  }
  return `unexpected error: ${error.code} ${error.message}`;
});

// 6. Existing knowledge_base entries readable (sanity)
await check("read.knowledge_base.count", async () => {
  const { count, error } = await supabase
    .from("knowledge_base")
    .select("id", { count: "exact", head: true });
  if (error) return `error: ${error.message}`;
  return count !== null && count > 0 ? true : `count=${count}`;
});

const failed = checks.filter((c) => !c.ok);
if (failed.length === 0) {
  console.log(
    JSON.stringify({
      level: "info",
      message: "migration.verified",
      checks: checks.length,
    }),
  );
  process.exit(0);
} else {
  console.error(
    JSON.stringify({
      level: "error",
      message: "migration.verification.failed",
      failed: failed.map((f) => f.name),
    }),
  );
  process.exit(1);
}
