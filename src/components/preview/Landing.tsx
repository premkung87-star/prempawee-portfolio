"use client";

import { useEffect, useState } from "react";
import { Cursor } from "./Cursor";
import { FeaturedCase } from "./FeaturedCase";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { NavBar } from "./NavBar";
import { Philosophy } from "./Philosophy";
import { Process } from "./Process";
import { ProofStrip } from "./ProofStrip";
import { WhatIBuild } from "./WhatIBuild";
import type { Lang } from "./preview-strings";

// Landing root for the prempawee.com homepage. Owns top-level lang state,
// persists to localStorage (key: "lang"). Originally lived at /preview as
// the staging surface for the redesign; promoted to / in the Phase 2 cutover
// (Session 7, AUDIT_LOG §38). The /preview route is gone and 301-redirects
// to / via next.config.ts.
//
// v3 senior pass (2026-04-25):
//   - NavBar mounted at the top — sticky, single source of truth for the
//     EN/TH toggle (was duplicated in Hero), plus practical WORK / PRICING /
//     CASES / CONTACT buttons. PRICING dispatches `preview:chat-prompt` so
//     the chat answers (AI-native nav).
//   - Sections wrapped in <main id="main"> so the NavBar skip-link works.
//   - Hero no longer needs `setLang` — NavBar owns the toggle now.
//
// v2 senior pass (2026-04-25):
//   - MatrixBoot removed (decoration trim — chat is now the centerpiece, no
//     intro animation needed before the user can act).
//   - ChatSection removed — chat is now embedded inside Hero (right column).
//   - ProofStrip added between WhatIBuild and the second Marquee.
//   - FeaturedCase added between the second Marquee and Process — links to
//     the real /case-studies/verdex (not the design's fabricated NWL CLUB
//     metrics).

export function Landing() {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from URL query or localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get("lang");
      const fromStorage = localStorage.getItem("lang");
      const initial: Lang | null =
        fromQuery === "th" || fromQuery === "en"
          ? fromQuery
          : fromStorage === "th" || fromStorage === "en"
            ? (fromStorage as Lang)
            : null;
      if (initial) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating
        setLangState(initial);
      }
    } catch {}
  }, []);

  // Persist + sync <html lang>
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);

  return (
    <div className="bg-black text-white font-mono cursor-hidden">
      <Cursor />
      <NavBar lang={lang} setLang={setLangState} />
      <main id="main">
        <Hero lang={lang} />
        <Marquee />
        <WhatIBuild lang={lang} />
        <ProofStrip lang={lang} />
        <Philosophy lang={lang} />
        <Marquee reverse />
        <FeaturedCase lang={lang} />
        <Process lang={lang} />
      </main>
      <Footer lang={lang} />
    </div>
  );
}
