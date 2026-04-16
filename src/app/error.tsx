"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logError("error.boundary.segment", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex flex-col h-dvh bg-[#0a0a0a] bg-grid text-[#e0e0e0] font-mono">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-sm tracking-[3px] uppercase text-white">
          PREMPAWEE <span className="text-[#666]">{"// AI"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-pulse" />
          Error
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-[600px] w-full">
          <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
            PREMPAWEE AI // EXCEPTION
          </div>
          <h1 className="text-[28px] text-white font-medium mb-4 leading-tight">
            Something went wrong.
          </h1>
          <p className="text-[15px] text-[#ccc] leading-relaxed mb-6">
            The session hit an unexpected error. You can retry, or reach me on
            LINE if it persists.
          </p>

          {error.digest ? (
            <div className="mb-6 text-[11px] text-[#888]">
              digest: <span className="text-[#aaa]">{error.digest}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => unstable_retry()}
            className="group inline-flex items-center gap-3 px-4 py-2 border border-white/10 bg-white/[0.02] hover:bg-white/10 transition-colors text-[14px] text-white"
          >
            <span className="text-[#888] select-none">&gt;</span>
            <span>retry</span>
            <span className="w-2 h-4 bg-white cursor-blink" />
          </button>
        </div>
      </main>
    </div>
  );
}
