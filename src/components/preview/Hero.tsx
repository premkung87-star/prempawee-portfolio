"use client";

import { useEffect, useState } from "react";
import { DotField } from "./DotField";
import { Logo } from "./Logo";
import { STR, type Lang } from "./preview-strings";

// Hero — full-viewport black canvas with cursor-reactive dot field, blinking
// shell-prompt cursor, oversized monospace headline, and a dot-matrix scroll
// indicator. Lang toggle in top-right preserves the existing aria-pressed
// contract and persists in localStorage (key: "lang").

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
      className="relative h-dvh min-h-[720px] bg-black text-white overflow-hidden"
      data-screen-label="01 Hero"
    >
      <DotField />
      {/* top-left: logo + system meta. Logo scales down on small screens to
          leave room for the lang toggle. Meta text hides on mobile to avoid
          overflow with the toggle on the right. */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex gap-2.5 sm:gap-3.5 items-center z-10">
        <div className="scale-75 sm:scale-100 origin-top-left">
          <Logo size={80} />
        </div>
        <div className="hidden sm:block font-mono text-[11px] leading-tight opacity-85">
          {"PREMPAWEE "}<span className="opacity-60">{"//"}</span>{" AI"}
          <br />
          <span className="opacity-50">{t.locale}</span>
        </div>
      </div>

      {/* top-right: EN/TH toggle */}
      <div
        className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center border border-white font-mono text-xs z-10"
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

      {/* center: status + headline + subhead */}
      <div className="absolute inset-0 flex flex-col justify-center items-start px-[6vw]">
        <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-6">
          [ {t.statusLabel} · {today} ]
        </div>
        <h1
          className="font-mono font-bold m-0"
          style={{
            fontSize: "clamp(48px, 10vw, 168px)",
            lineHeight: 0.95,
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
        <div className="mt-7 font-mono text-xs tracking-[0.2em] opacity-85">
          {t.subhead}
        </div>
      </div>

      {/* bottom: scroll indicator */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5">
        <div className="font-mono text-[10px] tracking-[0.4em] opacity-60">
          {t.scroll}
        </div>
        <div aria-hidden="true">
          {[0, 1, 2, 3, 4].map((r) => (
            <div
              key={r}
              className="flex justify-center gap-1 mb-1"
              style={{ opacity: 0.4 + r * 0.12 }}
            >
              {Array(Math.max(1, 5 - r))
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: 3,
                      background: "#fff",
                      animation: `pulse 1.4s ${r * 0.12}s ease-in-out infinite`,
                    }}
                  />
                ))}
            </div>
          ))}
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
