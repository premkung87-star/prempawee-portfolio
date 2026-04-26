import { STR, type Lang } from "./preview-strings";

// Work philosophy block — quiet kicker section between FeaturedCase and
// Process. Single quote, no decorations beyond a left rule and the kicker.
// Bilingual: shows Foreman's literal English quote in EN mode, faithful
// Thai translation in TH mode.
//
// Source: Foreman's stated work philosophy (Session 7).
// Memory: feedback_generalism_over_specialism.md, user_philosophy_and_quote.md

export function Philosophy({ lang }: { lang: Lang }) {
  const t = STR[lang];
  return (
    <section
      id="philosophy"
      className="relative bg-black text-white border-t border-white px-4 sm:px-[6vw] py-16 sm:py-24"
      data-screen-label="02c Philosophy"
    >
      <div className="max-w-[900px] mx-auto">
        <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-6">
          {t.philosophy_kicker}
        </div>
        <blockquote className="border-l-2 border-white/40 pl-6 sm:pl-8">
          <p
            className="font-mono font-medium text-white leading-tight [text-wrap:balance]"
            style={{
              fontSize: "clamp(20px, 3.2vw, 32px)",
              letterSpacing: "-0.01em",
            }}
          >
            {t.philosophy_quote}
          </p>
          <footer className="mt-5 font-mono text-[11px] tracking-[0.18em] opacity-50 uppercase">
            — {t.philosophy_attribution}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
