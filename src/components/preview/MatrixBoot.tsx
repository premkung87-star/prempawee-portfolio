"use client";

import { useEffect, useRef, useState } from "react";

// Matrix-rain boot sequence ~1.5s, resolves into PREMPAWEE // AI wordmark.
// Skippable via any keypress / click. localStorage flag prevents replay on
// subsequent visits. prefers-reduced-motion → skip straight to wordmark + 200ms fade.
// White-on-black, NOT green — this is the Prempawee brand. Plays on / only;
// /case-studies/* would feel performative.

const FLAG_KEY = "boot-seen-v1";

type Phase = "rain" | "resolve" | "done";

export function MatrixBoot({ duration = 1500 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>("rain");

  // First-visit gate. Runs only on client; SSR returns null wrapper so no flash.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(FLAG_KEY) === "1";
    } catch {
      // private mode — fine, just play it
    }
    if (seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage gate
      setShow(false);
      setPhase("done");
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShow(true);
    if (reduced) {
      setPhase("done");
      try {
        localStorage.setItem(FLAG_KEY, "1");
      } catch {}
      const t = setTimeout(() => setShow(false), 250);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase("resolve"), duration * 0.55);
    const t2 = setTimeout(() => {
      setPhase("done");
      try {
        localStorage.setItem(FLAG_KEY, "1");
      } catch {}
    }, duration);
    const t3 = setTimeout(() => setShow(false), duration + 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [duration]);

  // Skip on any input
  useEffect(() => {
    if (!show) return;
    const skip = () => {
      setPhase("done");
      try {
        localStorage.setItem(FLAG_KEY, "1");
      } catch {}
      setTimeout(() => setShow(false), 250);
    };
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("click", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
  }, [show]);

  // Canvas rain animation
  useEffect(() => {
    if (!show || phase === "done") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();

    const fontSize = 14;
    const charset = "01ABCDEF<>/{}[]=*+#$%PREMPAWEEAI//".split("");
    const w = canvas.getBoundingClientRect().width;
    const cols = Math.floor(w / fontSize);
    const drops = Array(cols)
      .fill(0)
      .map(() => Math.random() * -50);

    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const t = (performance.now() - start) / duration;
      const r = canvas.getBoundingClientRect();
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = charset[Math.floor(Math.random() * charset.length)];
        const y = drops[i] * fontSize;
        ctx.fillStyle = `rgba(255,255,255,${0.95 - Math.min(0.7, t * 0.7)})`;
        ctx.fillText(ch, i * fontSize, y);
        if (y > r.height && Math.random() > 0.965) drops[i] = 0;
        drops[i] += 1 + Math.random() * 0.6;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [show, phase, duration]);

  if (!show) return null;

  const wordOpacity = phase === "rain" ? 0 : phase === "resolve" ? 0.6 : 1;
  const rainOpacity = phase === "done" ? 0 : phase === "resolve" ? 0.4 : 1;

  return (
    <div
      role="status"
      aria-label="Loading prempawee.com"
      className="fixed inset-0 bg-black z-[9999] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full transition-opacity duration-300"
        style={{ opacity: rainOpacity }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center flex-col gap-3.5">
        <div
          className="font-mono text-white font-bold tracking-[0.04em] transition-opacity duration-300"
          style={{
            fontSize: "clamp(28px, 6vw, 72px)",
            opacity: wordOpacity,
            textShadow: "0 0 24px rgba(255,255,255,0.25)",
          }}
        >
          {"PREMPAWEE "}<span style={{ opacity: 0.7 }}>{"//"}</span>{" AI"}
        </div>
        <div
          className="font-mono text-white text-[11px] tracking-[0.3em] transition-opacity duration-300"
          style={{ opacity: wordOpacity * 0.6 }}
        >
          [ INIT_OK · {phase.toUpperCase()} ]
        </div>
      </div>
      <div className="absolute top-3 left-3.5 font-mono text-[10px] text-white opacity-40 tracking-[0.1em]">
        BOOT_SEQ :: 1.5s :: skippable
      </div>
    </div>
  );
}
