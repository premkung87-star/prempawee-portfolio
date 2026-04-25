"use client";

import { useEffect, useRef, useState } from "react";

// Matrix / Terminal custom cursor.
// Replaces the OS cursor with a 28x28 corner-bracket reticle whose center
// glyph flickers every 90ms, drops Matrix-style character trail on movement,
// bursts [ ] / / on click, and morphs into [ READY ▮ ] tag on hover over
// interactive elements. mix-blend-mode: difference keeps it visible on both
// black and white surfaces. Pure B&W, JetBrains Mono only.
//
// Disabled on touch devices via `(hover: hover)` media query — component
// returns null and the OS cursor is preserved.
//
// prefers-reduced-motion: skips the trail / click ripple / glyph flicker
// (per design handoff README §Accessibility recommendation). The static
// reticle + READY tag remain.
//
// Spec source: design_handoff_matrix_cursor/README.md (high-fidelity).

const CHARSET =
  "01ABCDEF/{}[]<>=*+#$%01アカサタナハマヤラワ".split("");

export function Cursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [glyph, setGlyph] = useState("0");
  const [reduced, setReduced] = useState(false);

  // Mount gate — touch devices keep OS cursor (component returns null below).
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from media query
    setEnabled(true);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Listeners + flicker — depend on `reduced` so we re-bind without trail/flick when set.
  useEffect(() => {
    if (!enabled) return;
    let last = { x: 0, y: 0, t: 0 };

    const move = (e: MouseEvent) => {
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      if (reduced) return;
      const now = performance.now();
      const dist =
        Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y);
      if (now - last.t > 40 && dist > 6) {
        const ch = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        const span = document.createElement("span");
        span.textContent = ch;
        span.style.cssText = `
          position: fixed; left: ${e.clientX - 4}px; top: ${e.clientY - 8}px;
          font: 700 12px/1 'JetBrains Mono', monospace; color: #fff;
          pointer-events: none; z-index: 98; opacity: 0.9;
          text-shadow: 0 0 6px rgba(255,255,255,0.4);
          transition: opacity 600ms linear, transform 600ms ease-out;
        `;
        if (trailRef.current) {
          trailRef.current.appendChild(span);
          requestAnimationFrame(() => {
            span.style.opacity = "0";
            span.style.transform = `translate(${(Math.random() - 0.5) * 8}px, 18px)`;
          });
          window.setTimeout(() => span.remove(), 620);
        }
        last = { x: e.clientX, y: e.clientY, t: now };
      }
    };

    const over = (e: MouseEvent) => {
      const target = e.target as Element | null;
      // READY tag only triggers on real form controls or elements that
      // explicitly opt in via data-cursor="hover". Plain <a> tags and
      // section headings/divs do NOT trigger it — they get the regular
      // reticle, keeping the page typography readable. (Per Foreman 2026-04-25:
      // the original "any link or button" rule made section titles like
      // "ASK THE PORTFOLIO" feel overshadowed by the cursor's READY tag.)
      const optedOut = target?.closest('[data-cursor="default"]');
      if (optedOut) {
        setHovering(false);
        return;
      }
      const t = target?.closest(
        'button, input, textarea, [data-cursor="hover"]',
      );
      setHovering(!!t);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (reduced || !trailRef.current) return;
      const cx = e.clientX;
      const cy = e.clientY;
      ["[", "]", "/", "/"].forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch;
        span.style.cssText = `
          position: fixed; left: ${cx}px; top: ${cy}px;
          font: 700 14px/1 'JetBrains Mono', monospace; color: #fff;
          pointer-events: none; z-index: 98; opacity: 1;
          text-shadow: 0 0 8px rgba(255,255,255,0.6);
          transition: opacity 500ms linear, transform 500ms cubic-bezier(.2,.7,.2,1);
        `;
        trailRef.current!.appendChild(span);
        const angle = (i / 4) * Math.PI * 2;
        requestAnimationFrame(() => {
          span.style.opacity = "0";
          span.style.transform = `translate(${Math.cos(angle) * 36}px, ${Math.sin(angle) * 36}px)`;
        });
        window.setTimeout(() => span.remove(), 520);
      });
    };

    let flick: number | undefined;
    if (!reduced) {
      flick = window.setInterval(() => {
        setGlyph(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
      }, 90);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      if (flick !== undefined) clearInterval(flick);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [enabled, reduced]);

  if (!enabled) return null;

  return (
    <>
      <div ref={trailRef} aria-hidden="true" />
      <div
        ref={wrapRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 99,
          mixBlendMode: "difference",
          transition: "transform 40ms linear",
        }}
      >
        {/* default state: reticle + flickering glyph */}
        <div
          style={{
            position: "absolute",
            left: -14,
            top: -14,
            width: 28,
            height: 28,
            opacity: hovering ? 0 : 1,
            transition: "opacity 120ms",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
            aria-hidden="true"
          >
            <g
              stroke="#fff"
              strokeWidth="1.4"
              fill="none"
              style={{
                filter: "drop-shadow(0 0 3px rgba(255,255,255,0.6))",
              }}
            >
              <path d="M1 6 V1 H6" />
              <path d="M22 1 H27 V6" />
              <path d="M27 22 V27 H22" />
              <path d="M6 27 H1 V22" />
              <path d="M14 11 V17" />
              <path d="M11 14 H17" />
            </g>
          </svg>
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              font: "700 9px/1 'JetBrains Mono', monospace",
              color: "#fff",
              textShadow: "0 0 4px rgba(255,255,255,0.8)",
            }}
          >
            {glyph}
          </span>
        </div>

        {/* hover state: bracketed [ READY ▮ ] tag */}
        <div
          style={{
            position: "absolute",
            left: 12,
            top: -10,
            opacity: hovering ? 1 : 0,
            transition: "opacity 120ms",
            font: "700 11px/1 'JetBrains Mono', monospace",
            color: "#fff",
            letterSpacing: "0.18em",
            whiteSpace: "nowrap",
            padding: "5px 8px",
            border: "1px solid #fff",
            background: "#000",
            textShadow: "0 0 6px rgba(255,255,255,0.5)",
          }}
        >
          <span style={{ opacity: 0.6 }}>[</span> READY{" "}
          <span
            className="cursor-blink-block"
            style={{
              display: "inline-block",
              width: 7,
              height: 11,
              background: "#fff",
              verticalAlign: "-1px",
              marginLeft: 2,
            }}
          />
          <span style={{ opacity: 0.6, marginLeft: 4 }}>]</span>
        </div>
      </div>
    </>
  );
}
