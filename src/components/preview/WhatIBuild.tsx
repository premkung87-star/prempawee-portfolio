"use client";

import { useState } from "react";
import { BinaryStarField } from "./BinaryStarField";
import { STR, type Lang } from "./preview-strings";

// "What I build" section.
// Desktop (>= sm): 3 horizontal panels with hover-expand. Hovered panel
// grows to 1.6fr, neighbors compress to 0.7fr; bullet points fade in;
// black/white invert on hover.
// Mobile (< sm): vertical stack, each panel always shows its bullet points
// (no hover state — touch can't hover), no color invert. Borders flip from
// vertical to horizontal so the brutalist grid still reads.

export function WhatIBuild({ lang }: { lang: Lang }) {
  const t = STR[lang];
  const [hover, setHover] = useState<number | null>(null);

  // Desktop column template; ignored on mobile via Tailwind grid-cols-1
  const cols = t.build
    .map((_, i) =>
      hover === null ? "1fr" : hover === i ? "1.6fr" : "0.7fr",
    )
    .join(" ");

  return (
    <section
      id="work"
      className="relative bg-black text-white border-t border-white pt-8 overflow-hidden scroll-mt-[60px]"
      data-screen-label="02 What I Build"
    >
      <BinaryStarField
        stars={[
          {
            id: "b1",
            x: 96,
            y: 70,
            scale: 0.65,
            charSize: 8,
            speed: 1.1,
            shape: "sparkle",
            rotation: 45,
          },
        ]}
      />
      <div className="relative z-[2] px-[6vw] pb-6 font-mono text-xs tracking-[0.3em] opacity-60">
        {t.build_kicker}
      </div>
      <div
        className="relative z-[2] grid grid-cols-1 sm:grid border-t border-white transition-[grid-template-columns] duration-[380ms] ease-[cubic-bezier(0.2,0.7,0.2,1)]"
        style={{
          // sm+ uses the dynamic columns; mobile inherits grid-cols-1
          ["--sm-cols" as string]: cols,
        }}
      >
        {t.build.map((b, i) => {
          const isHover = hover === i;
          return (
            <div
              key={b.k}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={[
                "relative px-6 sm:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16",
                "min-h-[280px] sm:min-h-[380px]",
                "transition-colors duration-[250ms]",
                // border between panels: vertical on desktop, horizontal stack on mobile
                i < t.build.length - 1
                  ? "border-b sm:border-b-0 sm:border-r border-white"
                  : "",
              ].join(" ")}
              style={{
                background: isHover ? "#fff" : "#000",
                color: isHover ? "#000" : "#fff",
              }}
            >
              <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-5 sm:mb-6">
                0{i + 1} {"//"}
              </div>
              <div
                className="font-mono font-bold leading-none"
                style={{
                  fontSize: "clamp(32px, 5vw, 72px)",
                  letterSpacing: "-0.03em",
                }}
              >
                {b.k}
              </div>
              {/* On mobile (touch) — always show bullets so users see content
                  without hover. On desktop — fade in only when hovered. */}
              <div
                className={[
                  "mt-7 sm:mt-9 font-mono text-[13px] tracking-[0.06em]",
                  "opacity-100 sm:transition-opacity sm:duration-[280ms] sm:delay-[80ms]",
                  isHover ? "sm:opacity-100" : "sm:opacity-0",
                ].join(" ")}
              >
                {b.points.map((p, j) => (
                  <div
                    key={j}
                    className="flex gap-3 py-2"
                    style={{
                      borderTop:
                        j === 0
                          ? `1px solid ${isHover ? "#000" : "#fff"}`
                          : "none",
                      borderBottom: `1px solid ${isHover ? "#000" : "#fff"}`,
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
                aria-hidden="true"
                style={{
                  borderTop: `1px solid ${isHover ? "#000" : "#fff"}`,
                  borderRight: `1px solid ${isHover ? "#000" : "#fff"}`,
                }}
              />
              <div
                className="absolute bottom-2 left-2 w-2 h-2"
                aria-hidden="true"
                style={{
                  borderBottom: `1px solid ${isHover ? "#000" : "#fff"}`,
                  borderLeft: `1px solid ${isHover ? "#000" : "#fff"}`,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Apply the dynamic sm+ columns via a small inline CSS rule scoped to
          this component (avoids a new utility class). */}
      <style>{`
        @media (min-width: 640px) {
          section[data-screen-label="02 What I Build"] > div.grid {
            grid-template-columns: var(--sm-cols);
          }
        }
      `}</style>
    </section>
  );
}
