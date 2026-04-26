import { STR, type Lang } from "./preview-strings";

// Work philosophy block — quiet kicker section between FeaturedCase and
// Process. Single quote, centered, with a Renaissance serif (EB Garamond,
// 1561) used only for the quote body to give it focal weight against the
// site's monospace identity. Kicker + attribution stay in JetBrains Mono.
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
      <div className="max-w-[900px] mx-auto text-center">
        <div className="font-mono text-[11px] tracking-[0.3em] opacity-60 mb-8">
          {t.philosophy_kicker}
        </div>
        <blockquote>
          <p
            className="font-medium italic text-white leading-snug [text-wrap:balance]"
            style={{
              fontFamily: "var(--font-renaissance), Georgia, serif",
              fontSize: "clamp(26px, 4vw, 44px)",
              letterSpacing: "-0.005em",
            }}
          >
            {t.philosophy_quote}
          </p>
          <footer className="mt-6 font-mono text-[11px] tracking-[0.18em] opacity-50 uppercase">
            — {t.philosophy_attribution}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
