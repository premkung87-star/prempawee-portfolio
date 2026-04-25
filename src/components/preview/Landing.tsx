"use client";

import { useEffect, useState } from "react";
import { Cursor } from "./Cursor";
import { FeaturedCase } from "./FeaturedCase";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Process } from "./Process";
import { ProofStrip } from "./ProofStrip";
import { WhatIBuild } from "./WhatIBuild";
import type { Lang } from "./preview-strings";

// Landing root for the preview redesign. Owns top-level lang state, persists
// to localStorage (key: "lang") same as the existing chat.tsx so the choice
// is shared across both /preview and / for users who flip between them.
// Mounted on /preview only — / continues to render the existing chat.tsx
// design until cutover.
//
// v2 senior pass (2026-04-25):
//   - MatrixBoot removed (decoration trim — chat is now the centerpiece, no
//     intro animation needed before the user can act).
//   - ChatSection removed — chat is now embedded inside Hero (right column).
//   - ProofStrip added between WhatIBuild and the second Marquee.
//   - FeaturedCase added between the second Marquee and Process — links to
//     the real /case-studies/verdex (not the design's fabricated NWL CLUB
//     metrics).
//   - MatrixBoot.tsx and ChatSection.tsx files left in place; this PR only
//     stops importing them. Cleanup is a follow-up.

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
      <Hero lang={lang} setLang={setLangState} />
      <Marquee />
      <WhatIBuild lang={lang} />
      <ProofStrip lang={lang} />
      <Marquee reverse />
      <FeaturedCase lang={lang} />
      <Process lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}
