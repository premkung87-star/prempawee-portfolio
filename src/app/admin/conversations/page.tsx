import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

async function getRecentSessions(): Promise<Array<{ session_id: string; rows: Row[] }>> {
  if (!supabaseAdmin) return [];
  // Fetch the 500 most-recent rows, then group by session_id client-side
  // (small dataset — a grouping RPC would be nice-to-have but overkill).
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id, session_id, role, content, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return [];
  const rows = (data as Row[]) ?? [];

  const bySession = new Map<string, Row[]>();
  for (const r of rows) {
    if (!bySession.has(r.session_id)) bySession.set(r.session_id, []);
    bySession.get(r.session_id)!.push(r);
  }
  // Sort session rows chronologically within each session, sessions by latest row desc
  return Array.from(bySession.entries())
    .map(([session_id, sessionRows]) => ({
      session_id,
      rows: sessionRows.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    }))
    .sort((a, b) => {
      const aLatest = a.rows[a.rows.length - 1]?.created_at ?? "";
      const bLatest = b.rows[b.rows.length - 1]?.created_at ?? "";
      return bLatest.localeCompare(aLatest);
    })
    .slice(0, 30);
}

export default async function AdminConversations() {
  await requireAdmin();
  const sessions = await getRecentSessions();

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <div className="text-[10px] uppercase tracking-[2px] text-[#888]">
          PREMPAWEE AI {"// ADMIN / CONVERSATIONS"}
        </div>
        <Link
          href="/admin"
          className="text-[11px] text-[#888] hover:text-white underline underline-offset-2"
        >
          &larr; Admin
        </Link>
      </header>

      <h1 className="text-[24px] text-white font-medium mb-2">
        Recent conversations
      </h1>
      <p className="text-[#888] text-xs mb-8">
        Showing the last ~30 sessions (sorted by latest message). Older sessions
        available via Supabase Dashboard.
      </p>

      {sessions.length === 0 ? (
        <p className="text-[#888] text-sm">
          No conversations logged yet. Ask the bot something on the live site.
        </p>
      ) : (
        <div className="space-y-6">
          {sessions.map(({ session_id, rows }) => (
            <article
              key={session_id}
              className="border border-white/10 rounded p-4 bg-white/[0.02]"
            >
              <header className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                <span className="text-[11px] text-[#aaa] font-mono break-all">
                  {session_id}
                </span>
                <span className="text-[11px] text-[#666]">
                  {rows.length} msg{rows.length === 1 ? "" : "s"} ·{" "}
                  {new Date(
                    rows[rows.length - 1]?.created_at ?? "",
                  ).toLocaleString()}
                </span>
              </header>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className={
                      r.role === "user"
                        ? "text-white text-[13px] leading-relaxed border-l-2 border-white/30 pl-3"
                        : "text-[#aaa] text-[13px] leading-relaxed border-l-2 border-white/10 pl-3"
                    }
                  >
                    <span className="text-[10px] uppercase tracking-[1px] text-[#666] mr-2">
                      {r.role === "user" ? "U" : "A"}
                    </span>
                    <span className="whitespace-pre-wrap">
                      {r.content.length > 600
                        ? r.content.slice(0, 600) + "…"
                        : r.content}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
