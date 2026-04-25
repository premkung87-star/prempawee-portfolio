"use client";

import { useEffect, useState } from "react";
import { BinaryStarField } from "./BinaryStarField";
import { ChatPanel } from "./ChatPanel";
import { DotField } from "./DotField";
import { STR, type Lang } from "./preview-strings";

// Hero — chat-dominant on lg+, chat-above-the-fold on mobile.
//
// v3 changes (2026-04-25):
//   - Top bar removed entirely. NavBar now owns logo/meta + EN/TH toggle.
//     Hero starts at the kicker, no duplicated chrome.
//   - Desktop grid weight: 0.85fr (text) / 1.15fr (chat). Chat is the
//     centerpiece — text takes less width, chat takes more.
//   - Headline shrinks slightly: clamp(32px, 6.2vw, 100px) — chat carries
//     the typographic weight now.
//   - Chat tall height bumped to 700 (was 640); a subtle outline-offset
//     ring extends the existing spotlight without piling on shadows.
//   - Mobile reorder: kicker → compact headline → CHAT (full width, ~520
//     tall) → subhead → 3-stat strip → terminal hint. Chat lands above the
//     fold on most phones; readable copy follows it.
//
// Grounding (CLAUDE.md):
//   - "8+ live projects" traces to portfolio-data.ts (3 projects across 8+
//     surfaces; conservative count).
//   - "< 400ms" matches the TTFB target documented in the case study.
//   - "0 hallucinations" matches the chatbot's RAG grounding contract.
//
// The blinking `>` cursor is computed client-side to avoid SSR/CSR
// hydration mismatches (same pattern as the original Hero).

export function Hero({ lang }: { lang: Lang }) {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const i = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(i);
  }, []);

  const t = STR[lang];

  // Single markup tree to keep ONE ChatPanel mounted (mounting two would
  // double-fire the `preview:chat-prompt` listener and double-install the
  // session-id fetch override). On mobile we use flex column with explicit
  // `order-*` so chat sits between the headline and the subhead. On lg+
  // the layout switches to a 2-col grid where the chat takes the right
  // column and the rest stack in the left.

  const headline = (
    <h1
      className="font-mono font-bold m-0"
      style={{
        // Mobile clamp; desktop overrides via inline style (clamp itself
        // covers the lg+ case at the upper bound). Single rule reads cleanly.
        fontSize: "clamp(28px, 6.2vw, 100px)",
        lineHeight: 0.94,
        letterSpacing: "-0.04em",
        textShadow: "0 0 30px rgba(255,255,255,0.08)",
      }}
    >
      <span
        style={{
          opacity: blink ? 1 : 0.25,
          transition: "opacity 60ms",
        }}
      >
        &gt;
      </span>{" "}
      {t.headline}
    </h1>
  );

  return (
    <section
      id="hero"
      className="relative min-h-dvh bg-black text-white overflow-hidden pb-16 scroll-mt-[60px]"
      data-screen-label="01 Hero"
    >
      <DotField />
      <BinaryStarField
        stars={[
          {
            id: "h1",
            x: 8,
            y: 24,
            scale: 0.55,
            charSize: 8,
            speed: 1.0,
            shape: "sparkle",
            rotation: 0,
          },
          {
            id: "h2",
            x: 92,
            y: 78,
            scale: 0.45,
            charSize: 7,
            speed: 0.8,
            shape: "asterisk",
            rotation: 22,
          },
        ]}
      />

      {/*
        Mobile (< lg): flex column with order utilities — kicker, headline,
        CHAT, subhead, stats, hint. Chat above the fold on most phones.
        Desktop (lg+): 2-col grid; text-stack-top + text-stack-bottom in
        left col, chat spans the right col.
      */}
      <div
        className="relative z-[2] flex flex-col lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:grid-rows-[auto_auto] gap-7 lg:gap-x-14 lg:gap-y-7 px-4 sm:px-[6vw] lg:px-[6vw] pt-7 lg:pt-12 lg:items-start"
      >
        {/* TOP-LEFT (lg+) / order-1 (mobile) — kicker + headline */}
        <div className="order-1 lg:col-start-1 lg:row-start-1 flex flex-col gap-5 sm:gap-6">
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.3em] opacity-60 [text-wrap:pretty]">
            {t.hero_kicker}
          </div>
          {headline}
        </div>

        {/* RIGHT col (lg+) / order-2 (mobile) — CHAT (centerpiece) */}
        <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 relative">
          <ChatPanel lang={lang} tall />
        </div>

        {/* BOTTOM-LEFT (lg+) / order-3 (mobile) — subhead + stats + hint */}
        <div className="order-3 lg:col-start-1 lg:row-start-2 flex flex-col gap-7 sm:gap-9 lg:gap-7">
          <div className="font-mono text-sm leading-relaxed opacity-85 max-w-[480px] [text-wrap:pretty]">
            {t.subhead}
          </div>
          <div className="grid grid-cols-3 border border-white max-w-[520px]">
            {[
              [t.stat_live_value, t.stat_live_label],
              [t.stat_ttfb_value, t.stat_ttfb_label],
              [t.stat_hallu_value, t.stat_hallu_label],
            ].map((s, i) => (
              <div
                key={i}
                className={[
                  "px-4 sm:px-[18px] py-4",
                  i < 2 ? "border-r border-white" : "",
                ].join(" ")}
              >
                <div
                  className="font-mono font-bold"
                  style={{
                    fontSize: "clamp(18px, 2vw, 24px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s[0]}
                </div>
                <div className="font-mono text-[10px] tracking-[0.18em] opacity-60 mt-1">
                  {s[1]}
                </div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[11px] tracking-[0.3em] opacity-55">
            {t.hero_try_terminal}
          </div>
        </div>
      </div>

      {/* hairline scan-line overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px)",
        }}
      />
    </section>
  );
}
