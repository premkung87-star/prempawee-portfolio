"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Logo } from "./Logo";
import { STR, type Lang } from "./preview-strings";

// Sticky top navigation for the /preview redesign. Single source of truth for
// the EN/TH toggle (was duplicated in Hero — now lives only here). Provides
// four practical nav buttons: WORK (scroll to #work), PRICING (dispatches
// `preview:chat-prompt` so the chat answers — AI-native UX, since pricing
// IS a conversation here, not a static section), CASES (links to the real
// /case-studies/verdex), CONTACT (scroll to #contact in Footer).
//
// Desktop:  [ logo ] [ WORK · PRICING · CASES · CONTACT ] [ EN / TH ]
// Mobile:   [ logo ]                            [ ☰ ] [ EN / TH ]
//           (drawer slides down with the four links + skip-to-content)
//
// A11y: <nav aria-label="Primary"> · skip link · aria-expanded/controls on
// the hamburger · ESC closes the drawer · 44×44 min touch target.
//
// The PRICING handler dispatches a CustomEvent that ChatPanel listens for —
// no shared state, no context, just a window event. Cheapest possible
// glue between two unrelated subtrees.

type NavBarProps = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function NavBar({ lang, setLang }: NavBarProps) {
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  // Close drawer on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onWork() {
    setOpen(false);
    scrollToId("work");
  }
  function onPricing() {
    setOpen(false);
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent<{ text: string }>("preview:chat-prompt", {
        detail: { text: t.suggest_pricing },
      }),
    );
    // Bonus: scroll back to the hero so the user sees the chat respond.
    scrollToId("hero");
  }
  function onContact() {
    setOpen(false);
    scrollToId("contact");
  }

  const linkBase =
    "font-mono text-[11px] tracking-[0.18em] text-white/70 hover:text-white transition-colors duration-150 min-h-[44px] inline-flex items-center px-3";

  const drawerLinkBase =
    "font-mono text-[13px] tracking-[0.18em] text-white border border-white/30 min-h-[48px] inline-flex items-center justify-between px-4 py-3 hover:bg-white hover:text-black transition-colors duration-150";

  return (
    <>
      {/* Skip link — visible only when focused. Lands on <main id="main">. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-[60] focus-visible:bg-white focus-visible:text-black focus-visible:px-3 focus-visible:py-2 focus-visible:font-mono focus-visible:text-xs focus-visible:tracking-[0.18em]"
      >
        {t.nav_skip}
      </a>

      <nav
        aria-label="Primary"
        className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-white/15"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-[6vw] h-[52px] md:h-[56px]">
          {/* Left: logo */}
          <button
            type="button"
            onClick={() => scrollToId("hero")}
            aria-label="PREMPAWEE // AI — back to top"
            className="flex items-center gap-2.5 sm:gap-3.5 bg-transparent border-none p-0 cursor-pointer"
            data-cursor="hover"
          >
            <div className="scale-[0.55] sm:scale-[0.7] origin-left">
              <Logo size={56} />
            </div>
            <span className="hidden md:inline font-mono text-[11px] tracking-[0.18em] opacity-85">
              {"PREMPAWEE "}
              <span className="opacity-60">{"//"}</span>
              {" AI"}
            </span>
          </button>

          {/* Center (desktop): primary links */}
          <ul className="hidden md:flex items-center gap-1">
            <li>
              <button
                type="button"
                onClick={onWork}
                className={`${linkBase} cursor-pointer bg-transparent border-none`}
                data-cursor="hover"
              >
                {t.nav_work}
              </button>
            </li>
            <li aria-hidden="true" className="opacity-30 select-none px-1">·</li>
            <li>
              <button
                type="button"
                onClick={onPricing}
                className={`${linkBase} cursor-pointer bg-transparent border-none`}
                data-cursor="hover"
              >
                {t.nav_pricing}
              </button>
            </li>
            <li aria-hidden="true" className="opacity-30 select-none px-1">·</li>
            <li>
              <Link
                href="/case-studies/verdex"
                className={linkBase}
                data-cursor="hover"
              >
                {t.nav_cases}
              </Link>
            </li>
            <li aria-hidden="true" className="opacity-30 select-none px-1">·</li>
            <li>
              <button
                type="button"
                onClick={onContact}
                className={`${linkBase} cursor-pointer bg-transparent border-none`}
                data-cursor="hover"
              >
                {t.nav_contact}
              </button>
            </li>
          </ul>

          {/* Right: hamburger (mobile) + EN/TH toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={drawerId}
              aria-label={open ? t.nav_close_menu : t.nav_open_menu}
              className="md:hidden bg-transparent border border-white/35 text-white font-mono text-base leading-none w-11 h-11 grid place-items-center cursor-pointer"
              data-cursor="hover"
            >
              {open ? "×" : "☰"}
            </button>
            <div
              className="flex items-center border border-white font-mono text-xs"
              role="group"
              aria-label="Display language"
            >
              {(["en", "th"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className="border-none cursor-pointer tracking-[0.1em] min-h-[32px] min-w-[44px] px-3 py-1.5"
                  style={{
                    background: lang === l ? "#fff" : "transparent",
                    color: lang === l ? "#000" : "#fff",
                  }}
                  data-cursor="hover"
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div
            id={drawerId}
            className="md:hidden border-t border-white/15 bg-black/95 backdrop-blur px-4 py-4 flex flex-col gap-2.5"
          >
            <button
              type="button"
              onClick={onWork}
              className={`${drawerLinkBase} bg-transparent w-full text-left`}
              data-cursor="hover"
            >
              <span>{t.nav_work}</span>
              <span aria-hidden="true" className="opacity-60">→</span>
            </button>
            <button
              type="button"
              onClick={onPricing}
              className={`${drawerLinkBase} bg-transparent w-full text-left`}
              data-cursor="hover"
            >
              <span>{t.nav_pricing}</span>
              <span aria-hidden="true" className="opacity-60">↗</span>
            </button>
            <Link
              href="/case-studies/verdex"
              onClick={() => setOpen(false)}
              className={drawerLinkBase}
              data-cursor="hover"
            >
              <span>{t.nav_cases}</span>
              <span aria-hidden="true" className="opacity-60">→</span>
            </Link>
            <button
              type="button"
              onClick={onContact}
              className={`${drawerLinkBase} bg-transparent w-full text-left`}
              data-cursor="hover"
            >
              <span>{t.nav_contact}</span>
              <span aria-hidden="true" className="opacity-60">→</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
