"use client";

import Link from "next/link";
import { BinaryStarField } from "./BinaryStarField";
import { STR, type Lang } from "./preview-strings";

// Featured case study link card. REPLACES the design's fabricated "NWL CLUB
// case" (which invented a 240-seat music venue, ESP32 IR sensors, and a
// −78% closing-error metric — none of that exists in portfolio-data.ts or
// supabase-seed.sql). Real depth lives at /case-studies/verdex; this section
// is a typographic gateway pointing there.
//
// Layout: meta strip → oversized headline (line 2 dim) → ~80-word honest
// subhead → big arrow CTA to /case-studies/verdex.
// Per CLAUDE.md GROUNDING RULE: no fake numbers, no fabricated testimonial.

export function FeaturedCase({ lang }: { lang: Lang }) {
  const t = STR[lang];
  return (
    <section
      id="case"
      className="relative bg-black text-white border-t border-white pt-24 pb-28 sm:pt-28 sm:pb-32 overflow-hidden"
      data-screen-label="03 Featured Case"
    >
      <BinaryStarField
        stars={[
          {
            id: "fc1",
            x: 94,
            y: 12,
            scale: 0.45,
            charSize: 6,
            speed: 0.85,
            shape: "fivept",
            rotation: 18,
          },
        ]}
      />

      {/* meta strip */}
      <div className="relative z-[2] px-4 sm:px-[6vw] pb-12 flex flex-wrap justify-between items-baseline gap-4 font-mono text-[11px] tracking-[0.3em] opacity-60">
        <span>{t.featured_kicker}</span>
        <span>{t.featured_meta}</span>
      </div>

      {/* headline + body */}
      <div className="relative z-[2] px-4 sm:px-[6vw] grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-10 lg:gap-20 items-end mb-16">
        <h2
          className="font-mono font-bold m-0 [text-wrap:pretty]"
          style={{
            fontSize: "clamp(40px, 7vw, 116px)",
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
          }}
        >
          {t.featured_headline_l1}
          <br />
          <span style={{ opacity: 0.4 }}>{t.featured_headline_l2}</span>
        </h2>
        <p className="font-mono text-sm leading-relaxed m-0 opacity-85 max-w-[480px] [text-wrap:pretty]">
          {t.featured_body}
        </p>
      </div>

      {/* CTA */}
      <div className="relative z-[2] px-4 sm:px-[6vw]">
        <Link
          href="/case-studies/verdex"
          data-cursor="hover"
          className="group inline-flex items-center gap-4 border border-white text-white no-underline px-6 sm:px-8 py-5 sm:py-6 font-mono font-bold tracking-[0.18em] hover:bg-white hover:text-black transition-colors duration-200 min-h-[56px]"
          style={{
            fontSize: "clamp(14px, 1.4vw, 18px)",
          }}
        >
          {t.featured_cta}
        </Link>
      </div>
    </section>
  );
}
