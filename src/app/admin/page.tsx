import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Counts = {
  conversations: number | null;
  leads: number | null;
  analytics: number | null;
  feedback: number | null;
};

async function getCounts(): Promise<Counts> {
  if (!supabaseAdmin) {
    return {
      conversations: null,
      leads: null,
      analytics: null,
      feedback: null,
    };
  }
  const [conv, leads, analytics, feedback] = await Promise.all([
    supabaseAdmin.from("conversations").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("leads").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("analytics").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("feedback").select("id", { count: "exact", head: true }),
  ]);
  return {
    conversations: conv.count ?? null,
    leads: leads.count ?? null,
    analytics: analytics.count ?? null,
    feedback: feedback.count ?? null,
  };
}

export default async function AdminIndex() {
  await requireAdmin();
  const counts = await getCounts();

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-10">
        <div className="text-[10px] uppercase tracking-[2px] text-[#888]">
          PREMPAWEE AI {"// ADMIN"}
        </div>
        <Link
          href="/"
          className="text-[11px] text-[#888] hover:text-white underline underline-offset-2"
        >
          Back to chat &rarr;
        </Link>
      </header>

      <h1 className="text-[24px] text-white font-medium mb-8">Overview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Conversations" value={counts.conversations} />
        <StatCard label="Leads" value={counts.leads} />
        <StatCard label="Feedback" value={counts.feedback} />
        <StatCard label="Events" value={counts.analytics} />
      </div>

      <nav className="space-y-2">
        <AdminLink href="/admin/leads" title="Leads" desc="Captured lead submissions, newest first" />
        <AdminLink href="/admin/feedback" title="Feedback" desc="Visitor feedback from the footer form (bug / suggestion / thanks / other)" />
        <AdminLink href="/admin/conversations" title="Conversations" desc="Recent chat sessions — user + assistant messages" />
        <AdminLink href="/admin/finops" title="FinOps" desc="Token usage + $ cost + cache hit rate (last 30 days)" />
      </nav>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="border border-white/10 rounded p-4 bg-white/[0.02]">
      <div className="text-[32px] text-white leading-none">
        {value === null ? "–" : value.toLocaleString()}
      </div>
      <div className="text-[10px] uppercase tracking-[2px] text-[#888] mt-2">
        {label}
      </div>
    </div>
  );
}

function AdminLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-white/10 rounded p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-white text-sm font-medium">{title}</span>
        <span className="text-[#666] text-xs">&rarr;</span>
      </div>
      <p className="text-[#888] text-xs mt-1">{desc}</p>
    </Link>
  );
}
