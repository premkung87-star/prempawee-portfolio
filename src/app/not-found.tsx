import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col h-dvh bg-[#0a0a0a] bg-grid text-[#e0e0e0] font-mono">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-sm tracking-[3px] uppercase text-white">
          PREMPAWEE <span className="text-[#666]">{"// AI"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#888]" />
          404
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-[600px] w-full">
          <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
            PREMPAWEE AI // NOT FOUND
          </div>
          <h1 className="text-[28px] text-white font-medium mb-4 leading-tight">
            This route doesn&apos;t exist.
          </h1>
          <p className="text-[15px] text-[#ccc] leading-relaxed mb-6">
            The URL you tried isn&apos;t wired up. Head back to the chat —
            that&apos;s where everything lives.
          </p>

          <Link
            href="/"
            className="group inline-flex items-center gap-3 px-4 py-2 border border-white/10 bg-white/[0.02] hover:bg-white/10 transition-colors text-[14px] text-white"
          >
            <span className="text-[#888] select-none">&gt;</span>
            <span>return home</span>
            <span className="w-2 h-4 bg-white cursor-blink" />
          </Link>
        </div>
      </main>
    </div>
  );
}
