"use client";

import { useEffect, useRef, useState } from "react";
import { DotMatrixNumber } from "./DotMatrixNumber";
import { STR, type Lang } from "./preview-strings";

// Process section — 4-step sticky-scroll. As the user scrolls, each step locks
// to viewport center for ~25% of the section's scroll distance. Left rail
// lets you click to jump. Arrow-key navigation. Dot-matrix step numerals.
// Content mirrors HOW_I_WORK in portfolio-data.ts verbatim.

export function Process({ lang }: { lang: Lang }) {
  const t = STR[lang];
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const p = Math.max(0, Math.min(1, -r.top / total));
      const idx = Math.min(
        t.process.length - 1,
        Math.floor(p * t.process.length),
      );
      setActive(idx);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setActive((a) => Math.min(t.process.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        setActive((a) => Math.max(0, a - 1));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [t.process.length]);

  return (
    <section
      ref={wrapRef}
      className="bg-black text-white border-t border-white relative"
      style={{ height: `${t.process.length * 90}vh` }}
      data-screen-label="03 Process"
    >
      <div className="sticky top-0 h-dvh flex flex-col md:flex-row items-stretch px-4 sm:px-[6vw]">
        {/* rail — top on mobile, left on desktop */}
        <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white py-5 md:py-8 flex flex-col gap-3 md:gap-6">
          <div className="font-mono text-xs tracking-[0.3em] opacity-60">
            {t.process_kicker}
          </div>
          <div className="flex md:flex-col gap-2 md:gap-4 overflow-x-auto md:overflow-visible">
            {t.process.map((p, i) => (
              <button
                key={p.n}
                onClick={() => setActive(i)}
                className="bg-transparent border-none text-left p-0 font-mono text-[13px] tracking-[0.1em] min-h-[32px] whitespace-nowrap shrink-0"
                style={{
                  color: active === i ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              >
                <span className="inline-block w-6">
                  {active === i ? "▸" : " "}
                </span>
                {p.n} · {p.t}
              </button>
            ))}
          </div>
        </div>

        {/* main */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-[5vw] py-8 md:py-0 relative">
          <div className="absolute top-3 md:top-6 right-3 md:right-6 font-mono text-[10px] tracking-[0.3em] opacity-50">
            STEP {active + 1} / {t.process.length}
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-14 items-start md:items-center max-w-[900px] w-full">
            <div className="shrink-0">
              <DotMatrixNumber str={t.process[active].n} dot={10} />
            </div>
            <div className="md:border-l md:border-white md:pl-10 max-w-[480px]">
              <div
                className="font-mono font-bold leading-tight mb-3 md:mb-5"
                style={{
                  fontSize: "clamp(24px, 3.6vw, 48px)",
                  letterSpacing: "-0.02em",
                }}
              >
                {t.process[active].t}
              </div>
              <div className="font-mono text-[13px] md:text-sm leading-relaxed opacity-85 [text-wrap:pretty]">
                {t.process[active].d}
              </div>
            </div>
          </div>
          {/* progress bar */}
          <div className="absolute bottom-4 md:bottom-8 left-2 right-2 sm:left-[5vw] sm:right-[5vw] flex gap-1.5">
            {t.process.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-0.5"
                style={{
                  background:
                    i <= active ? "#fff" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
