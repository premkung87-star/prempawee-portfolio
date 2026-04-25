"use client";

import { useEffect, useRef, useState } from "react";

// Custom 6×6 white dot cursor that grows to a 32px hollow ring on hover over
// interactive elements. Pointer-only (hover: hover) — touch devices fall back
// to native cursor. mix-blend-mode: difference keeps the ring visible on both
// black and white backgrounds.

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from media query
    setEnabled(true);

    const move = (e: MouseEvent) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${e.clientX - 16}px, ${e.clientY - 16}px)`;
      }
    };
    const over = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const t = target?.closest('a, button, input, textarea, [data-cursor="hover"]');
      setHovering(!!t);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white pointer-events-none z-[99] transition-opacity duration-150"
        style={{ opacity: hovering ? 0 : 1 }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[99] transition-opacity duration-150"
        style={{ opacity: hovering ? 1 : 0, mixBlendMode: "difference" }}
      />
    </>
  );
}
