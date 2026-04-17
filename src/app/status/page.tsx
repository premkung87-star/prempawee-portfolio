// Public status page. Runs live health checks on each dependency and renders
// a transparent up/degraded/down surface for visitors + enterprise buyers.
// No external dep (Instatus / Better Uptime) required — but can be bolted on
// later by pointing a monitoring service at /api/health (which this page
// effectively exposes via its render).

import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Status — PREMPAWEE AI",
  description:
    "Live health of the Prempawee AI portfolio chatbot infrastructure.",
  robots: { index: true, follow: true },
};

type Check = {
  name: string;
  status: "ok" | "degraded" | "down";
  latencyMs?: number;
  note?: string;
};

async function timed<T>(
  fn: () => Promise<T>,
  timeoutMs = 5000,
): Promise<{ value?: T; error?: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    const value = await fn();
    clearTimeout(t);
    return { value, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
    };
  }
}

async function checkSupabase(): Promise<Check> {
  const r = await timed(async () => {
    const { error } = await supabase
      .from("knowledge_base")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return true;
  });
  if (r.error) return { name: "Supabase (RAG)", status: "down", note: r.error, latencyMs: r.latencyMs };
  if (r.latencyMs > 2000) return { name: "Supabase (RAG)", status: "degraded", latencyMs: r.latencyMs, note: "slow" };
  return { name: "Supabase (RAG)", status: "ok", latencyMs: r.latencyMs };
}

async function checkAnthropic(): Promise<Check> {
  // Don't spend tokens — just verify API reachability via 401 on bad auth.
  // Response time tells us the network path is healthy.
  const r = await timed(async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "sk-ant-probe",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "." }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    // We EXPECT a 401 (bad key) or 400 — confirms network path is good.
    if (res.status === 0) throw new Error("no response");
    return res.status;
  });
  if (r.error) return { name: "Anthropic API", status: "down", note: r.error, latencyMs: r.latencyMs };
  return { name: "Anthropic API", status: "ok", latencyMs: r.latencyMs };
}

async function checkUpstash(): Promise<Check> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return {
      name: "Upstash Redis (rate limit)",
      status: "degraded",
      note: "not configured — in-memory fallback active",
    };
  }
  const r = await timed(async () => {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return res.json();
  });
  if (r.error) return { name: "Upstash Redis (rate limit)", status: "down", note: r.error, latencyMs: r.latencyMs };
  return { name: "Upstash Redis (rate limit)", status: "ok", latencyMs: r.latencyMs };
}

async function checkSelf(): Promise<Check> {
  // The page is rendering, so "self" is up. Report the region for observability.
  const region =
    process.env.VERCEL_REGION ??
    process.env.AWS_REGION ??
    "unknown";
  return { name: "Edge surface", status: "ok", note: `region=${region}` };
}

export default async function StatusPage() {
  const [self, supa, anth, ups] = await Promise.all([
    checkSelf(),
    checkSupabase(),
    checkAnthropic(),
    checkUpstash(),
  ]);
  const checks = [self, supa, anth, ups];

  const worst: "ok" | "degraded" | "down" = checks.some((c) => c.status === "down")
    ? "down"
    : checks.some((c) => c.status === "degraded")
      ? "degraded"
      : "ok";

  const summary =
    worst === "ok"
      ? "All systems operational"
      : worst === "degraded"
        ? "Some systems degraded"
        : "Systems experiencing issues";

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0a] bg-grid text-[#e0e0e0] font-mono">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-sm tracking-[3px] uppercase text-white">
          PREMPAWEE <span className="text-[#666]">{"// AI"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
          <StatusDot status={worst} />
          Status
        </div>
      </header>

      <main className="flex-1 px-4 py-10 max-w-[800px] w-full mx-auto">
        <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-2">
          PREMPAWEE AI {"// STATUS"}
        </div>
        <h1 className="text-[28px] text-white font-medium leading-tight mb-1">
          {summary}
        </h1>
        <p className="text-[#888] text-xs mb-8">
          Live checks. Refresh this page to re-run. Last run:{" "}
          {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
        </p>

        <div className="space-y-2 mb-10">
          {checks.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between gap-4 px-4 py-3 border border-white/10 rounded bg-white/[0.02]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <StatusDot status={c.status} />
                <div className="min-w-0">
                  <div className="text-white text-sm truncate">{c.name}</div>
                  {c.note ? (
                    <div className="text-[11px] text-[#888] truncate">
                      {c.note}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="text-[11px] text-[#aaa] shrink-0 text-right">
                {c.latencyMs !== undefined ? (
                  <span>{c.latencyMs}ms</span>
                ) : null}
                <div className="text-[10px] uppercase tracking-[1px] text-[#666]">
                  {c.status}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#666]">
          Incidents and post-mortems: open the repo&apos;s{" "}
          <code className="text-[#aaa]">docs/post-mortems/</code>. Status history
          may later graduate to Instatus or Better Uptime — for now this page
          is authoritative.
        </p>
      </main>
    </div>
  );
}

function StatusDot({ status }: { status: "ok" | "degraded" | "down" }) {
  const cls =
    status === "ok"
      ? "bg-green-400"
      : status === "degraded"
        ? "bg-yellow-400"
        : "bg-red-500";
  return (
    <span
      aria-hidden
      className={`w-2 h-2 rounded-full ${cls} status-pulse shrink-0`}
    />
  );
}
