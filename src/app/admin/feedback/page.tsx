import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Feedback = {
  id: number;
  type: "bug" | "suggestion" | "thanks" | "other";
  body: string;
  email: string | null;
  page_url: string | null;
  user_agent: string | null;
  ip_prefix: string | null;
  status: string;
  created_at: string;
};

async function getFeedback(): Promise<Feedback[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .select(
      "id, type, body, email, page_url, user_agent, ip_prefix, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return (data as Feedback[]) ?? [];
}

const TYPE_STYLES: Record<Feedback["type"], string> = {
  bug: "border-red-500/40 text-red-300 bg-red-500/[0.05]",
  suggestion: "border-yellow-500/40 text-yellow-300 bg-yellow-500/[0.05]",
  thanks: "border-green-500/40 text-green-300 bg-green-500/[0.05]",
  other: "border-white/20 text-[#aaa] bg-white/[0.02]",
};

export default async function AdminFeedback() {
  await requireAdmin();
  const feedback = await getFeedback();

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <div className="text-[10px] uppercase tracking-[2px] text-[#888]">
          PREMPAWEE AI {"// ADMIN / FEEDBACK"}
        </div>
        <Link
          href="/admin"
          className="text-[11px] text-[#888] hover:text-white underline underline-offset-2"
        >
          &larr; Admin
        </Link>
      </header>

      <h1 className="text-[24px] text-white font-medium mb-2">
        Feedback ({feedback.length})
      </h1>
      <p className="text-[12px] text-[#666] mb-8">
        Visitor submissions from the footer form on prempawee.com. Most-recent
        first. Showing up to 100 rows.
      </p>

      {feedback.length === 0 ? (
        <p className="text-[#888] text-sm">
          No feedback yet. The footer link goes live after the next deploy —
          submit one yourself to test the pipeline.
        </p>
      ) : (
        <div className="space-y-3">
          {feedback.map((row) => (
            <article
              key={row.id}
              className="border border-white/10 rounded p-4 bg-white/[0.02]"
            >
              <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-[10px] text-[#666]">#{row.id}</span>
                  <span
                    className={`text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 border rounded ${TYPE_STYLES[row.type]}`}
                  >
                    {row.type}
                  </span>
                  {row.status !== "new" ? (
                    <span className="text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 border border-white/10 rounded text-[#888]">
                      {row.status}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] text-[#666]">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-white leading-relaxed pt-2 border-t border-white/5 whitespace-pre-wrap [text-wrap:pretty]">
                {row.body}
              </p>
              <div className="space-y-1 text-xs text-[#aaa] mt-3 pt-3 border-t border-white/5">
                {row.email ? (
                  <div>
                    <span className="text-[#666]">Email:</span>{" "}
                    <a
                      href={`mailto:${row.email}`}
                      className="text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60"
                    >
                      {row.email}
                    </a>
                  </div>
                ) : null}
                {row.page_url ? (
                  <div>
                    <span className="text-[#666]">From page:</span>{" "}
                    <a
                      href={row.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ccc] underline underline-offset-2 decoration-white/20 hover:decoration-white/60"
                    >
                      {row.page_url}
                    </a>
                  </div>
                ) : null}
                {row.user_agent ? (
                  <div>
                    <span className="text-[#666]">UA:</span>{" "}
                    <span className="text-[#888] font-mono text-[11px]">
                      {row.user_agent.length > 100
                        ? row.user_agent.slice(0, 100) + "…"
                        : row.user_agent}
                    </span>
                  </div>
                ) : null}
                {row.ip_prefix ? (
                  <div>
                    <span className="text-[#666]">IP prefix:</span>{" "}
                    <span className="text-[#888] font-mono text-[11px]">
                      {row.ip_prefix}
                    </span>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
