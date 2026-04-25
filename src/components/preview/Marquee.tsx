"use client";

// Brutalist marquee band — section divider per design spec.
// Pause on hover via CSS. prefers-reduced-motion: reduce → static.
// Content uses GROUNDING-RULE-safe brand keywords only (every term traces
// to portfolio-data.ts or supabase-seed.sql).

const MARQUEE_TEXT =
  "SOLO BUILDER // CHIANG MAI // CLAUDE OPUS + SONNET // PRODUCTION SYSTEMS // EDGE RUNTIME // BILINGUAL EN/TH // RAG-GROUNDED // ZERO HALLUCINATIONS // ";

export function Marquee({ reverse = false }: { reverse?: boolean }) {
  return (
    <div
      className="marquee border-y border-white overflow-hidden whitespace-nowrap py-3.5 font-mono text-sm tracking-[0.18em]"
      aria-hidden="true"
    >
      <div
        className="marquee-track inline-block"
        style={{
          animation: `marq 38s linear infinite${reverse ? " reverse" : ""}`,
        }}
      >
        {Array(6).fill(MARQUEE_TEXT).join("")}
      </div>
    </div>
  );
}
