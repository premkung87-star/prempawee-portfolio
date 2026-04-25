"use client";

import { useEffect, useMemo, useState } from "react";

// Binary-art stars — small ASCII silhouettes built from cycling 0/1 (with
// rare !/-/. for texture). Five shape masks (sparkle | fivept | asterisk |
// tiny | burst). Default cycle 220ms; hover 90ms; click scatters and reforms.
//
// prefers-reduced-motion: cycle disabled (static), no scatter animation.
// Each star is a div with role="button" + aria-label so it's still
// keyboard-discoverable. Wrapper sets pointer-events: none on the field
// but pointer-events: auto on the inner so layouts above the field still
// receive pointer events (chat, buttons, etc).
//
// Performance budget (per Foreman): max 8 stars across the whole page —
// well below the 12 the design used. Distribution per Landing:
//   Hero 2 · WhatIBuild 1 · Process 2 · Footer 1 · ProofStrip 1 · FeaturedCase 1
//
// Spec source: design_handoff_v2/.../landing.jsx lines 113–301.

export type StarShape = "sparkle" | "fivept" | "asterisk" | "tiny" | "burst";

export type StarConfig = {
  id: string;
  /** percent of container width, 0–100 */
  x: number;
  /** percent of container height, 0–100 */
  y: number;
  scale?: number;
  charSize?: number;
  /** multiplier on the cycle interval; >1 = faster */
  speed?: number;
  shape?: StarShape;
  rotation?: number;
};

// 4-point sparkle (tall + diamond)
const MASK_SPARKLE: number[][] = [
  "0000000010000000",
  "0000000011100000",
  "0000000111110000",
  "0000000011100000",
  "0000111111111110",
  "0011111111111111",
  "1111111111111111",
  "1111111111111111",
  "0011111111111111",
  "0000111111111110",
  "0000000011100000",
  "0000000111110000",
  "0000000011100000",
  "0000000010000000",
].map((r) => r.split("").map(Number));

// Classic 5-point star (slightly asymmetric)
const MASK_FIVEPT: number[][] = [
  "00000001100000000",
  "00000011110000000",
  "00000011110000000",
  "11111111111111111",
  "01111111111111110",
  "00111111111111100",
  "00011111111111000",
  "00111111111111100",
  "00111110001111100",
  "01111100001111110",
  "11111000000111111",
  "11100000000001111",
  "10000000000000011",
].map((r) => r.split("").map(Number));

// 6-point asterisk star
const MASK_ASTERISK: number[][] = [
  "0000000111000000",
  "0000000111000000",
  "1100000111000011",
  "1110000111000111",
  "0111000111001110",
  "0011101110011100",
  "0001111111111000",
  "0011111111111100",
  "0011111111111100",
  "0001111111111000",
  "0011101110011100",
  "0111000111001110",
  "1110000111000111",
  "1100000111000011",
].map((r) => r.split("").map(Number));

// Tiny 4-point sparkle (compact)
const MASK_TINY: number[][] = [
  "00010000",
  "00111000",
  "00010000",
  "11111111",
  "11111111",
  "00010000",
  "00111000",
  "00010000",
].map((r) => r.split("").map(Number));

// Burst star (irregular, multi-pointed)
const MASK_BURST: number[][] = [
  "0000010001000000",
  "0010001011000010",
  "0011001011001100",
  "0001101111011000",
  "0000111111110000",
  "1111111111111111",
  "0011111111111100",
  "0011111111111100",
  "1111111111111111",
  "0000111111110000",
  "0001101111011000",
  "0011001011001100",
  "0010001011000010",
  "0000010001000000",
].map((r) => r.split("").map(Number));

const STAR_SHAPES: Record<StarShape, number[][]> = {
  sparkle: MASK_SPARKLE,
  fivept: MASK_FIVEPT,
  asterisk: MASK_ASTERISK,
  tiny: MASK_TINY,
  burst: MASK_BURST,
};

type Cell = { r: number; c: number; ch: string };

function pickChar(): string {
  const rand = Math.random();
  if (rand < 0.45) return "0";
  if (rand < 0.85) return "1";
  if (rand < 0.93) return "!";
  if (rand < 0.97) return "-";
  return ".";
}

function BinaryStar({
  x,
  y,
  scale = 1,
  charSize = 8,
  speed = 1,
  shape = "sparkle",
  rotation = 0,
}: Omit<StarConfig, "id">) {
  const mask = STAR_SHAPES[shape] ?? MASK_SPARKLE;
  const MW = mask[0].length;
  const MH = mask.length;
  const [hover, setHover] = useState(false);
  const [scattered, setScattered] = useState(false);
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Defer randomized chars to post-mount so SSR and first client render produce
  // identical output (deterministic checkerboard) — avoids React hydration
  // mismatch warning. After mount the cycle takes over via `tick`.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) return; // static when reduced motion
    const interval = (hover ? 90 : 220) / speed;
    const id = setInterval(() => setTick((t) => t + 1), interval);
    return () => clearInterval(id);
  }, [hover, speed, reduced]);

  const cells = useMemo<Cell[]>(() => {
    const arr: Cell[] = [];
    for (let r = 0; r < MH; r++) {
      for (let c = 0; c < MW; c++) {
        if (mask[r][c]) {
          const ch = mounted ? pickChar() : (r + c) % 2 === 0 ? "0" : "1";
          arr.push({ r, c, ch });
        }
      }
    }
    return arr;
    // tick + shape + mounted drive the recompute. mask/MW/MH are derived from shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, shape, mounted]);

  function onClick() {
    if (reduced) return;
    setScattered(true);
    setTimeout(() => setScattered(false), 900);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  const w = MW * charSize;
  const h = MH * charSize;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      aria-label="binary star"
      tabIndex={-1}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: w,
        height: h,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation + (hover && !reduced ? 8 : 0)}deg)`,
        transformOrigin: "center",
        cursor: "pointer",
        userSelect: "none",
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        fontSize: charSize,
        lineHeight: `${charSize}px`,
        color: "#fff",
        opacity: hover ? 1 : 0.55,
        textShadow: hover ? "0 0 8px rgba(255,255,255,0.6)" : "none",
        transition: reduced
          ? "none"
          : "opacity 280ms, transform 380ms cubic-bezier(.2,.9,.2,1)",
        zIndex: 1,
        pointerEvents: "auto",
      }}
    >
      {cells.map((cell, i) => {
        let sx = 0;
        let sy = 0;
        if (scattered && !reduced) {
          const cx = MW / 2;
          const cy = MH / 2;
          const dx = cell.c - cx;
          const dy = cell.r - cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          sx = (dx / len) * 40 + (Math.random() - 0.5) * 20;
          sy = (dy / len) * 40 + (Math.random() - 0.5) * 20;
        }
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: cell.c * charSize,
              top: cell.r * charSize,
              width: charSize,
              height: charSize,
              transform: `translate(${sx}px, ${sy}px)`,
              opacity: scattered ? 0.3 : 1,
              transition: reduced
                ? "none"
                : "transform 700ms cubic-bezier(.2,.7,.3,1), opacity 700ms",
            }}
          >
            {cell.ch}
          </span>
        );
      })}
    </div>
  );
}

export function BinaryStarField({ stars }: { stars: StarConfig[] }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
        {stars.map((s) => (
          <BinaryStar
            key={s.id}
            x={s.x}
            y={s.y}
            scale={s.scale}
            charSize={s.charSize}
            speed={s.speed}
            shape={s.shape}
            rotation={s.rotation}
          />
        ))}
      </div>
    </div>
  );
}
