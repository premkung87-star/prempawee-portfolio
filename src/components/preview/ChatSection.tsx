"use client";

import { ChatPanel } from "./ChatPanel";
import { STR, type Lang } from "./preview-strings";

// Chat section — header kicker + oversized title, then the live ChatPanel
// in a centered ~800px column. The dot-wave visualizer sketched in the
// Claude Design artifact is deferred to Phase 2 — adding a third canvas
// to the page risks regressing Lighthouse mobile Performance below the
// 90 floor we just established.

export function ChatSection({ lang }: { lang: Lang }) {
  const t = STR[lang];
  return (
    <section
      className="bg-black text-white border-t border-white px-[6vw] pt-8 pb-15"
      data-screen-label="04 Chat"
    >
      <div className="font-mono text-xs tracking-[0.3em] opacity-60 mb-2">
        {t.chat_kicker}
      </div>
      <div
        className="font-mono font-bold leading-none mb-7"
        style={{
          fontSize: "clamp(36px, 5vw, 72px)",
          letterSpacing: "-0.03em",
        }}
      >
        {t.chat_title}
      </div>
      <div className="max-w-[860px] mx-auto">
        <ChatPanel lang={lang} />
      </div>
    </section>
  );
}
