"use client";

import { useEffect, useState } from "react";
import { Cursor } from "./Cursor";
import { MatrixBoot } from "./MatrixBoot";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { WhatIBuild } from "./WhatIBuild";
import { Process } from "./Process";
import { ChatSection } from "./ChatSection";
import { Footer } from "./Footer";
import type { Lang } from "./preview-strings";

// Landing root for the preview redesign. Owns top-level lang state, persists
// to localStorage (key: "lang") same as the existing chat.tsx so the choice
// is shared across both /preview and / for users who flip between them.
// Mounted on /preview only — / continues to render the existing chat.tsx
// design until cutover.

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
    <div className="bg-black text-white font-mono">
      <MatrixBoot />
      <Cursor />
      <Hero lang={lang} setLang={setLangState} />
      <Marquee />
      <WhatIBuild lang={lang} />
      <Marquee reverse />
      <Process lang={lang} />
      <Marquee />
      <ChatSection lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}
