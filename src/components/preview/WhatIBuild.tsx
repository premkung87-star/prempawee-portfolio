"use client";

import { useState } from "react";
import { STR, type Lang } from "./preview-strings";

// "What I build" section — 3 horizontal panels with hover-expand behavior.
// Hovered panel grows to 1.6fr, neighbors compress to 0.7fr; bullet points
// fade in. Black/white invert on hover. Real data only — categories map to
// actual capability areas (CHATBOTS, DASHBOARDS, LINE OA), bullets cite
// verifiable details from portfolio-data.ts.

export function WhatIBuild({ lang }: { lang: Lang }) {
  const t = STR[lang];
  const [hover, setHover] = useState<number | null>(null);

  const cols = t.build
    .map((_, i) =>
      hover === null ? "1fr" : hover === i ? "1.6fr" : "0.7fr",
    )
    .join(" ");

  return (
    <section
      className="bg-black text-white border-t border-white pt-8"
      data-screen-label="02 What I Build"
    >
      <div className="px-[6vw] pb-6 font-mono text-xs tracking-[0.3em] opacity-60">
        {t.build_kicker}
      </div>
      <div
        className="grid border-t border-white transition-[grid-template-columns] duration-[380ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]"
        style={{ gridTemplateColumns: cols }}
      >
        {t.build.map((b, i) => (
          <div
            key={b.k}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="relative px-8 pt-14 pb-16 min-h-[380px] cursor-pointer transition-colors duration-[250ms]"
            style={{
              borderRight:
                i < t.build.length - 1 ? "1px solid #fff" : "none",
              background: hover === i ? "#fff" : "#000",
              color: hover === i ? "#000" : "#fff",
            }}
          >
            <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-6">
              0{i + 1} {"//"}
            </div>
            <div
              className="font-mono font-bold leading-none"
              style={{
                fontSize: "clamp(36px, 5vw, 72px)",
                letterSpacing: "-0.03em",
              }}
            >
              {b.k}
            </div>
            <div
              className="mt-9 font-mono text-[13px] tracking-[0.06em] transition-opacity duration-[280ms] delay-[80ms]"
              style={{ opacity: hover === i ? 1 : 0 }}
            >
              {b.points.map((p, j) => (
                <div
                  key={j}
                  className="flex gap-3 py-2"
                  style={{
                    borderTop:
                      j === 0
                        ? `1px solid ${hover === i ? "#000" : "#fff"}`
                        : "none",
                    borderBottom: `1px solid ${
                      hover === i ? "#000" : "#fff"
                    }`,
                  }}
                >
                  <span className="opacity-60 min-w-[24px]">0{j + 1}</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
            {/* corner crosshairs */}
            <div
              className="absolute top-2 right-2 w-2 h-2"
              style={{
                borderTop: `1px solid ${hover === i ? "#000" : "#fff"}`,
                borderRight: `1px solid ${hover === i ? "#000" : "#fff"}`,
              }}
            />
            <div
              className="absolute bottom-2 left-2 w-2 h-2"
              style={{
                borderBottom: `1px solid ${hover === i ? "#000" : "#fff"}`,
                borderLeft: `1px solid ${hover === i ? "#000" : "#fff"}`,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
