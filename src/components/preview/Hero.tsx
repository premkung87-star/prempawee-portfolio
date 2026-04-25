"use client";

import { useEffect, useState } from "react";
import { BinaryStarField } from "./BinaryStarField";
import { ChatPanel } from "./ChatPanel";
import { DotField } from "./DotField";
import { Logo } from "./Logo";
import { STR, type Lang } from "./preview-strings";

// Hero — 2-column on lg+, stacked on mobile. Headline + 3-stat strip on the
// LEFT, the live ChatPanel (tall) on the RIGHT. The chat IS the centerpiece
// per Foreman's senior pass — Portfolio AI is the differentiator, and the
// first thing visitors should be able to *do*, not just read.
//
// Grounding (CLAUDE.md):
//   - "8+ live projects" traces to portfolio-data.ts (3 projects across 8+
//     surfaces; conservative count).
//   - "< 400ms" is the same TTFB target documented in the existing case
//     study (this-portfolio metrics).
//   - "0 hallucinations" matches the chatbot's RAG grounding contract.
//
// The blinking `>` cursor + ONLINE date are computed client-side to avoid
// SSR/CSR hydration mismatches (same pattern as the original Hero).

export function Hero({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const [blink, setBlink] = useState(true);
  const [today, setToday] = useState("");

  useEffect(() => {
    const i = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(i);
  }, []);

  // Date is computed client-side to avoid SSR/CSR mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date hydration
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const t = STR[lang];

  return (
    <section
      className="relative min-h-dvh bg-black text-white overflow-hidden pb-16"
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

      {/* top bar: logo + meta on left, EN/TH toggle on right */}
      <div className="relative z-[2] flex justify-between items-center gap-3 px-4 sm:px-[6vw] pt-5 sm:pt-6">
        <div className="flex gap-2.5 sm:gap-3.5 items-center">
          <div className="scale-75 sm:scale-100 origin-top-left">
            <Logo size={64} />
          </div>
          <div className="hidden sm:block font-mono text-[11px] leading-tight opacity-85">
            {"PREMPAWEE "}
            <span className="opacity-60">{"//"}</span>
            {" AI"}
            <br />
            <span className="opacity-50">{t.locale}</span>
          </div>
        </div>
        <div
          className="flex items-center border border-white font-mono text-xs"
          role="group"
          aria-label="Display language"
        >
          {(["en", "th"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className="border-none cursor-pointer tracking-[0.1em] min-h-[32px] min-w-[44px] px-3.5 py-2"
              style={{
                background: lang === l ? "#fff" : "transparent",
                color: lang === l ? "#000" : "#fff",
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* main grid — headline LEFT, chat RIGHT */}
      <div className="relative z-[2] grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-start px-4 sm:px-[6vw] pt-8 sm:pt-12">
        {/* LEFT — headline + stats */}
        <div>
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.3em] opacity-60 mb-5 sm:mb-6 [text-wrap:pretty]">
            {t.hero_kicker}
          </div>
          <h1
            className="font-mono font-bold m-0"
            style={{
              fontSize: "clamp(36px, 7vw, 120px)",
              lineHeight: 0.92,
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
          <div
            className="mt-6 sm:mt-7 font-mono text-sm leading-relaxed opacity-85 max-w-[480px] [text-wrap:pretty]"
          >
            {t.subhead}
          </div>

          {/* 3-stat strip */}
          <div className="mt-8 sm:mt-10 grid grid-cols-3 border border-white max-w-[520px]">
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

          <div className="mt-6 sm:mt-7 font-mono text-[11px] tracking-[0.3em] opacity-55">
            {t.hero_try_terminal}
          </div>
        </div>

        {/* RIGHT — chat (the centerpiece) */}
        <div className="relative">
          <div className="absolute -top-5 right-0 font-mono text-[10px] tracking-[0.3em] opacity-60 whitespace-nowrap">
            ◉ {t.hero_online} · {today || "----------"}
          </div>
          <ChatPanel lang={lang} tall />
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
