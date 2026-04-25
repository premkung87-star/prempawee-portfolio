"use client";

import Link from "next/link";
import { BinaryStarField } from "./BinaryStarField";
import { STR, type Lang } from "./preview-strings";

// Proof strip — three live projects with one-line outcomes + status pills.
// Replaces the design's fabricated SOI Assistant entry. Every URL + claim
// here must trace verbatim to portfolio-data.ts or supabase-seed.sql per
// CLAUDE.md GROUNDING RULE.
//
// Real projects:
//   1. VerdeX Farm   — agritech, has full case study at /case-studies/verdex
//   2. NWL CLUB      — Bangkok streetwear brand, two production sites
//   3. This Portfolio — AI-native, RAG over Supabase, /case-studies/this-portfolio

type Proof = {
  id: string;
  name: string;
  role: string;
  outcome_en: string;
  outcome_th: string;
  href: string;
  status: "LIVE" | "PILOT";
  year: string;
};

const PROOF: readonly Proof[] = [
  {
    id: "verdex",
    name: "VERDEX FARM",
    role: "agritech · rag",
    outcome_en:
      "Smart greenhouse + landing + blog + command center + LINE bot. All in production.",
    outcome_th:
      "Smart greenhouse + landing + blog + command center + LINE bot. ใช้งานจริงทั้งหมด.",
    href: "/case-studies/verdex",
    status: "LIVE",
    year: "2026",
  },
  {
    id: "nwl",
    name: "NWL CLUB",
    role: "streetwear · ops",
    outcome_en:
      "Work tracker + community site for a Bangkok streetwear brand. Both in production on Vercel.",
    outcome_th:
      "Work tracker + เว็บคอมมูฯ ให้ NWL streetwear จาก กทม. รันบน Vercel.",
    href: "https://nwl-club-website.vercel.app/",
    status: "LIVE",
    year: "2025",
  },
  {
    id: "portfolio",
    name: "PORTFOLIO META",
    role: "this site · rag",
    outcome_en:
      "AI-native portfolio. RAG over real Supabase KB. Edge runtime, bilingual EN/TH.",
    outcome_th:
      "Portfolio AI-native. RAG บน Supabase KB จริง. Edge runtime, EN/TH.",
    href: "/case-studies/this-portfolio",
    status: "LIVE",
    year: "2026",
  },
] as const;

function Card({
  p,
  i,
  lang,
  isLast,
  readLabel,
}: {
  p: Proof;
  i: number;
  lang: Lang;
  isLast: boolean;
  readLabel: string;
}) {
  const isExternal = p.href.startsWith("http");
  const className = [
    "flex flex-col gap-4 min-h-[220px] relative no-underline text-white",
    "px-7 pt-8 pb-7",
    "transition-colors duration-200 hover:bg-white/[0.04]",
    isLast ? "" : "border-b sm:border-b-0 sm:border-r border-white",
  ].join(" ");

  const inner = (
    <>
      <div className="flex justify-between items-center font-mono text-[10px] tracking-[0.3em] opacity-60">
        <span>
          0{i + 1} / {p.year}
        </span>
        <span
          className="border border-white px-2 py-0.5 tracking-[0.18em]"
          style={{ opacity: p.status === "LIVE" ? 1 : 0.7 }}
        >
          {p.status === "LIVE" ? (
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-1.5 bg-white mr-1.5 align-middle"
              style={{ animation: "pulse 1.6s ease-in-out infinite" }}
            />
          ) : null}
          {p.status}
        </span>
      </div>
      <div
        className="font-mono font-bold leading-none"
        style={{ fontSize: 36, letterSpacing: "-0.03em" }}
      >
        {p.name}
      </div>
      <div className="font-mono text-[11px] tracking-[0.18em] opacity-60 uppercase">
        {p.role}
      </div>
      <div className="font-mono text-[13px] leading-relaxed mt-auto [text-wrap:pretty]">
        {lang === "th" ? p.outcome_th : p.outcome_en}
      </div>
      <div className="font-mono text-[10px] tracking-[0.3em] opacity-50">
        {readLabel} →
      </div>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={p.href}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="hover"
        className={className}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={p.href} data-cursor="hover" className={className}>
      {inner}
    </Link>
  );
}

export function ProofStrip({ lang }: { lang: Lang }) {
  const t = STR[lang];
  return (
    <section
      id="proof"
      className="relative bg-black text-white border-t border-white px-4 sm:px-[6vw] pt-14 pb-16 overflow-hidden"
      data-screen-label="02b Proof"
    >
      <BinaryStarField
        stars={[
          {
            id: "pr1",
            x: 96,
            y: 18,
            scale: 0.5,
            charSize: 7,
            speed: 0.95,
            shape: "tiny",
            rotation: -10,
          },
        ]}
      />
      <div className="relative z-[2] flex flex-wrap justify-between items-baseline gap-4 font-mono text-[11px] tracking-[0.3em] opacity-60 mb-9">
        <span>{t.proof_kicker}</span>
        <span>{t.proof_help}</span>
      </div>
      <div className="relative z-[2] grid grid-cols-1 sm:grid-cols-3 border border-white">
        {PROOF.map((p, i) => (
          <Card
            key={p.id}
            p={p}
            i={i}
            lang={lang}
            isLast={i === PROOF.length - 1}
            readLabel={t.proof_read}
          />
        ))}
      </div>
    </section>
  );
}
