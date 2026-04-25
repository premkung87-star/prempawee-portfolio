"use client";

import { Logo } from "./Logo";
import { STR, type Lang } from "./preview-strings";

// Footer — minimal: P// logo, contact links, route footer links, build SHA
// + timestamp (the engineer-flex detail that signals "I run a real CI
// pipeline"). All links open in new tabs where external; internal links
// route via Next normally.

const BUILD_TS = "2026.04.25.1900Z"; // updated per release; manual for now
const BUILD_SHA = "preview"; // replaced at deploy time once we cut over

export function Footer({ lang }: { lang: Lang }) {
  const t = STR[lang];
  return (
    <footer
      className="bg-black text-white border-t border-white px-[6vw] pt-10 pb-7 grid gap-8 items-start"
      style={{ gridTemplateColumns: "auto 1fr auto" }}
      data-screen-label="05 Footer"
    >
      <Logo size={56} />
      <div className="flex flex-col gap-4">
        <div className="flex gap-5 flex-wrap font-mono text-xs tracking-[0.18em]">
          {t.contact.map((c) => (
            <a
              key={c.k}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-white no-underline border-b border-white/30 pb-0.5 min-h-[32px] inline-flex items-center"
            >
              {c.k} →
            </a>
          ))}
        </div>
        <div className="flex gap-5 flex-wrap font-mono text-[11px] tracking-[0.18em] opacity-70">
          {t.footer_links.map((l) => (
            <a
              key={l.k}
              href={l.href}
              className="text-white no-underline min-h-[32px] inline-flex items-center"
            >
              {l.k}
            </a>
          ))}
        </div>
      </div>
      <div className="text-right font-mono text-[10px] opacity-45 tracking-[0.1em] leading-relaxed">
        build · {BUILD_TS}
        <br />
        sha · {BUILD_SHA} · main
        <br />
        {lang === "th" ? "เชียงใหม่ · TH" : "chiang mai · th"}
      </div>
    </footer>
  );
}
