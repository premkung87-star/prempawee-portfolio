"use client";

import { useState } from "react";
import type { CaseStudy } from "@/lib/case-study-types";
import { Hero } from "./Hero";
import { Section } from "./Section";
import { MetricGrid } from "./MetricGrid";
import { ArchSVG } from "./ArchSVG";
import { ScreenshotFrame } from "./ScreenshotFrame";
import { LangToggle } from "./LangToggle";

export function CaseStudyShell({
  caseStudy,
  slug,
}: {
  caseStudy: CaseStudy;
  slug: string;
}) {
  const [lang, setLang] = useState<"en" | "th">("en");

  return (
    <>
      <LangToggle lang={lang} setLang={setLang} />

      <Hero
        title={caseStudy.hero.title}
        subtitle={caseStudy.hero.subtitle}
        lang={lang}
      />

      <Section label="PROBLEM" noBorder>
        <div className="text-[15px] text-[#ccc] leading-relaxed max-w-[720px] whitespace-pre-wrap">
          {caseStudy.problem[lang]}
        </div>
      </Section>

      <Section label="ARCHITECTURE">
        <ArchSVG caption={caseStudy.architecture.caption} lang={lang} />
      </Section>

      <Section label="METRICS">
        <MetricGrid metrics={caseStudy.metrics} lang={lang} />
      </Section>

      <Section label="ADMIN WALKTHROUGH">
        <p className="text-[15px] text-[#ccc] leading-relaxed max-w-[720px] mb-6">
          {caseStudy.adminIntro[lang]}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {caseStudy.screenshots.map((s) => (
            <ScreenshotFrame
              key={s.filename}
              screenshot={s}
              lang={lang}
              slug={slug}
            />
          ))}
        </div>
      </Section>

      <Section label="SECURITY">
        <ul className="space-y-3 max-w-[720px]">
          {caseStudy.security.map((item) => (
            <li key={item.key}>
              <div className="text-[13px] text-white font-medium">
                <span className="text-[#666] mr-2" aria-hidden="true">
                  →
                </span>
                {item.title[lang]}
              </div>
              <div className="text-[12px] text-[#888] leading-relaxed mt-1 pl-5">
                {item.detail[lang]}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="OBSERVABILITY">
        <div className="text-[15px] text-[#ccc] leading-relaxed max-w-[720px] whitespace-pre-wrap">
          {caseStudy.observability[lang]}
        </div>
      </Section>

      <Section label="WORKFLOW">
        <div className="text-[15px] text-[#ccc] leading-relaxed max-w-[720px] whitespace-pre-wrap">
          {caseStudy.workflow[lang]}
        </div>
      </Section>

      <Section label="WORK WITH ME">
        <h2 className="text-[20px] md:text-[24px] text-white font-medium mb-3">
          {caseStudy.cta.heading[lang]}
        </h2>
        <p className="text-[15px] text-[#ccc] leading-relaxed max-w-[720px] mb-6">
          {caseStudy.cta.body[lang]}
        </p>
        <a
          href={caseStudy.cta.mailto}
          className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-sm text-white transition-colors"
        >
          {caseStudy.cta.buttonLabel[lang]}
        </a>
      </Section>

      <footer className="max-w-[1000px] mx-auto px-6 py-10 text-[11px] text-[#666] border-t border-white/10">
        © {new Date().getFullYear()} Prempawee
      </footer>
    </>
  );
}
