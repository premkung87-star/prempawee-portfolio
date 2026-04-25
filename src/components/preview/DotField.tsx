"use client";

import { useEffect, useRef } from "react";

// Cursor-reactive dot field — canvas-based, runs at 60fps via requestAnimationFrame.
// Dots within ~200px of the cursor brighten and gently displace toward it.
// Static fallback for prefers-reduced-motion. Pointer-only enhancement (hover: hover).
// Recommendation per design notes: keep this in HERO ONLY — competing canvases
// elsewhere on the page hurt Lighthouse Performance and visually fight the chat.

export function DotField({
  step = 22,
  radius = 200,
  baseAlpha = 0.16,
  baseSize = 3,
}: {
  step?: number;
  radius?: number;
  baseAlpha?: number;
  baseSize?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
      mouseRef.current.active = true;
    };
    const onLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    let raf = 0;
    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      ctx.clearRect(0, 0, w, h);
      const r2 = radius * radius;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const active = mouseRef.current.active && !reduced;

      for (let x = 0; x <= w; x += step) {
        for (let y = 0; y <= h; y += step) {
          let alpha = baseAlpha;
          let size = baseSize;
          let dx = 0;
          let dy = 0;
          if (active) {
            const ddx = x - mx;
            const ddy = y - my;
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 < r2) {
              const t = 1 - Math.sqrt(d2) / radius;
              alpha = baseAlpha + t * (1 - baseAlpha);
              size = baseSize + t * 4;
              dx = -ddx * 0.08 * t;
              dy = -ddy * 0.08 * t;
            }
          }
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillRect(x + dx - size / 2, y + dy - size / 2, size, size);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [step, radius, baseAlpha, baseSize]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
