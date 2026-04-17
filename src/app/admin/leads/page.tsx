import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Lead = {
  id: number;
  name: string | null;
  email: string | null;
  line_id: string | null;
  business_type: string | null;
  package_interest: string | null;
  message: string | null;
  source: string | null;
  created_at: string;
};

async function getLeads(): Promise<Lead[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select(
      "id, name, email, line_id, business_type, package_interest, message, source, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return (data as Lead[]) ?? [];
}

export default async function AdminLeads() {
  await requireAdmin();
  const leads = await getLeads();

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <div className="text-[10px] uppercase tracking-[2px] text-[#888]">
          PREMPAWEE AI {"// ADMIN / LEADS"}
        </div>
        <Link
          href="/admin"
          className="text-[11px] text-[#888] hover:text-white underline underline-offset-2"
        >
          &larr; Admin
        </Link>
      </header>

      <h1 className="text-[24px] text-white font-medium mb-8">
        Leads ({leads.length})
      </h1>

      {leads.length === 0 ? (
        <p className="text-[#888] text-sm">
          No leads yet. When the chatbot calls the `capture_lead` tool, rows
          land here.
        </p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="border border-white/10 rounded p-4 bg-white/[0.02]"
            >
              <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] text-[#666]">#{lead.id}</span>
                  <span className="text-white text-sm font-medium">
                    {lead.name || "(no name)"}
                  </span>
                  {lead.package_interest ? (
                    <span className="text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 border border-white/10 rounded text-[#aaa]">
                      {lead.package_interest}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] text-[#666]">
                  {new Date(lead.created_at).toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[#aaa] mb-2">
                {lead.email ? (
                  <div>
                    <span className="text-[#666]">Email:</span>{" "}
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60"
                    >
                      {lead.email}
                    </a>
                  </div>
                ) : null}
                {lead.line_id ? (
                  <div>
                    <span className="text-[#666]">LINE:</span>{" "}
                    <span className="text-[#ccc]">{lead.line_id}</span>
                  </div>
                ) : null}
                {lead.business_type ? (
                  <div>
                    <span className="text-[#666]">Business:</span>{" "}
                    <span className="text-[#ccc]">{lead.business_type}</span>
                  </div>
                ) : null}
                {lead.source ? (
                  <div>
                    <span className="text-[#666]">Source:</span>{" "}
                    <span className="text-[#ccc]">{lead.source}</span>
                  </div>
                ) : null}
              </div>
              {lead.message ? (
                <p className="text-xs text-[#ccc] leading-relaxed pt-2 border-t border-white/5 whitespace-pre-wrap">
                  {lead.message}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
