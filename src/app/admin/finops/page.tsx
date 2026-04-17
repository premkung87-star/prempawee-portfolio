// FinOps dashboard — Anthropic token usage + cost attribution.
// Reads analytics.token_usage rows logged by /api/chat's onFinish callback.
// Computes $ using current Claude Sonnet 4 pricing (update CLAUDE_PRICING
// when Anthropic adjusts rates).

import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// USD per 1M tokens. Current as of 2026-04. Update when Anthropic changes.
const CLAUDE_PRICING = {
  "claude-sonnet-4-20250514": {
    input_per_mtok: 3.0,
    output_per_mtok: 15.0,
    cache_write_per_mtok: 3.75, // 25% markup over input
    cache_read_per_mtok: 0.3, // 90% discount vs input
  },
} as const;

type TokenEvent = {
  id: number;
  session_id: string | null;
  event_data: {
    model?: string;
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_tokens?: number;
    cache_read_tokens?: number;
    duration_ms?: number;
    semantic?: { provider?: string; embed_tokens?: number } | null;
  };
  created_at: string;
};

function computeCostUSD(e: TokenEvent["event_data"]): number {
  const model = e.model ?? "claude-sonnet-4-20250514";
  const p =
    CLAUDE_PRICING[model as keyof typeof CLAUDE_PRICING] ??
    CLAUDE_PRICING["claude-sonnet-4-20250514"];
  const input = (e.input_tokens ?? 0) / 1_000_000;
  const output = (e.output_tokens ?? 0) / 1_000_000;
  const cacheWrite = (e.cache_creation_tokens ?? 0) / 1_000_000;
  const cacheRead = (e.cache_read_tokens ?? 0) / 1_000_000;
  return (
    input * p.input_per_mtok +
    output * p.output_per_mtok +
    cacheWrite * p.cache_write_per_mtok +
    cacheRead * p.cache_read_per_mtok
  );
}

async function getTokenEvents(sinceDaysAgo = 30): Promise<TokenEvent[]> {
  if (!supabaseAdmin) return [];
  const since = new Date(Date.now() - sinceDaysAgo * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("analytics")
    .select("id, session_id, event_data, created_at")
    .eq("event_type", "token_usage")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) return [];
  return (data as TokenEvent[]) ?? [];
}

export default async function FinopsDashboard() {
  await requireAdmin();
  const events = await getTokenEvents(30);

  // Aggregate
  const totalUsd = events.reduce((a, e) => a + computeCostUSD(e.event_data), 0);
  const totalIn = events.reduce((a, e) => a + (e.event_data.input_tokens ?? 0), 0);
  const totalOut = events.reduce((a, e) => a + (e.event_data.output_tokens ?? 0), 0);
  const totalCacheRead = events.reduce(
    (a, e) => a + (e.event_data.cache_read_tokens ?? 0),
    0,
  );
  const totalCacheCreate = events.reduce(
    (a, e) => a + (e.event_data.cache_creation_tokens ?? 0),
    0,
  );
  const cacheHitRate =
    totalIn + totalCacheRead > 0
      ? totalCacheRead / (totalIn + totalCacheRead)
      : 0;

  // Daily rollup
  const byDay = new Map<string, { count: number; usd: number }>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    const existing = byDay.get(day) ?? { count: 0, usd: 0 };
    existing.count++;
    existing.usd += computeCostUSD(e.event_data);
    byDay.set(day, existing);
  }
  const days = Array.from(byDay.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14);

  // Session rollup (top spenders)
  const bySession = new Map<string, { count: number; usd: number }>();
  for (const e of events) {
    const key = e.session_id ?? "unknown";
    const existing = bySession.get(key) ?? { count: 0, usd: 0 };
    existing.count++;
    existing.usd += computeCostUSD(e.event_data);
    bySession.set(key, existing);
  }
  const topSessions = Array.from(bySession.entries())
    .sort((a, b) => b[1].usd - a[1].usd)
    .slice(0, 10);

  // Projected monthly — simple: 30 * average-per-day of last 7 days
  const last7Days = days.slice(0, 7);
  const last7Total = last7Days.reduce((a, d) => a + d[1].usd, 0);
  const projMonthly = last7Days.length > 0 ? (last7Total / last7Days.length) * 30 : 0;

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <div className="text-[10px] uppercase tracking-[2px] text-[#888]">
          PREMPAWEE AI {"// ADMIN / FINOPS"}
        </div>
        <Link
          href="/admin"
          className="text-[11px] text-[#888] hover:text-white underline underline-offset-2"
        >
          &larr; Admin
        </Link>
      </header>

      <h1 className="text-[24px] text-white font-medium mb-2">
        Cost &amp; token usage
      </h1>
      <p className="text-[#888] text-xs mb-8">
        Last 30 days, {events.length.toLocaleString()} streamed responses.
        Pricing rates hardcoded from Claude Sonnet 4 schedule (update
        src/app/admin/finops/page.tsx → CLAUDE_PRICING when Anthropic
        changes).
      </p>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <Stat label="Spent (30d)" value={`$${totalUsd.toFixed(2)}`} />
        <Stat label="Projected / mo" value={`$${projMonthly.toFixed(2)}`} />
        <Stat
          label="Cache hit rate"
          value={`${(cacheHitRate * 100).toFixed(1)}%`}
          note={cacheHitRate < 0.5 ? "below 50% — check prompt stability" : undefined}
        />
        <Stat
          label="Responses"
          value={events.length.toLocaleString()}
        />
      </div>

      <Section title="Token breakdown (30d)">
        <div className="grid grid-cols-2 gap-4">
          <Row label="Input" value={totalIn.toLocaleString()} />
          <Row label="Output" value={totalOut.toLocaleString()} />
          <Row label="Cache read" value={totalCacheRead.toLocaleString()} />
          <Row label="Cache write" value={totalCacheCreate.toLocaleString()} />
        </div>
      </Section>

      <Section title="Daily (last 14 days)">
        {days.length === 0 ? (
          <p className="text-[#888] text-sm">
            No token_usage events yet — chat traffic will populate this.
          </p>
        ) : (
          <div className="space-y-1">
            {days.map(([day, agg]) => (
              <div
                key={day}
                className="flex items-center justify-between text-xs py-1.5 border-b border-white/5"
              >
                <span className="text-[#aaa] font-mono">{day}</span>
                <div className="flex items-center gap-6">
                  <span className="text-[#666]">
                    {agg.count} calls
                  </span>
                  <span className="text-white w-16 text-right">
                    ${agg.usd.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Top sessions by cost">
        {topSessions.length === 0 ? (
          <p className="text-[#888] text-sm">No sessions yet.</p>
        ) : (
          <div className="space-y-1">
            {topSessions.map(([sess, agg]) => (
              <div
                key={sess}
                className="flex items-center justify-between text-xs py-1.5 border-b border-white/5"
              >
                <span className="text-[#aaa] font-mono truncate mr-4">
                  {sess}
                </span>
                <div className="flex items-center gap-6 shrink-0">
                  <span className="text-[#666]">{agg.count} calls</span>
                  <span className="text-white w-16 text-right">
                    ${agg.usd.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <p className="text-[11px] text-[#666] mt-10">
        Vercel + Supabase + Upstash costs not included here — check each
        provider&apos;s dashboard for compute / bandwidth / storage costs.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border border-white/10 rounded p-4 bg-white/[0.02]">
      <div className="text-white text-[24px] leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-[2px] text-[#888] mt-2">
        {label}
      </div>
      {note ? (
        <div className="text-[10px] text-yellow-400 mt-1">{note}</div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
        {title}
      </h2>
      <div className="border border-white/10 rounded p-4 bg-white/[0.02]">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-xs">
      <span className="text-[#888]">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}
