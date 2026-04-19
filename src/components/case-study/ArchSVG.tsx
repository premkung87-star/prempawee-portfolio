import type { Bilingual } from "@/lib/case-study-types";

type BoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  line1: string;
  line2?: string;
};

function Box({ x, y, w, h, line1, line2 }: BoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2"
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <text
        x={x + w / 2}
        y={line2 ? y + h / 2 - 4 : y + h / 2 + 4}
        fill="#ccc"
        fontFamily="var(--font-jetbrains-mono)"
        fontSize="11"
        textAnchor="middle"
      >
        {line1}
      </text>
      {line2 ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + 10}
          fill="#888"
          fontFamily="var(--font-jetbrains-mono)"
          fontSize="10"
          textAnchor="middle"
        >
          {line2}
        </text>
      ) : null}
    </g>
  );
}

type ArrowProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  labelX?: number;
  labelY?: number;
};

function Arrow({ x1, y1, x2, y2, label, labelX, labelY }: ArrowProps) {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        markerEnd="url(#arrow)"
      />
      {label ? (
        <text
          x={labelX ?? (x1 + x2) / 2}
          y={labelY ?? (y1 + y2) / 2 - 6}
          fill="#888"
          fontFamily="var(--font-jetbrains-mono)"
          fontSize="10"
          textAnchor="middle"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function ArchSVG({
  caption,
  lang,
}: {
  caption: Bilingual;
  lang: "en" | "th";
}) {
  return (
    <div>
      <svg
        viewBox="0 0 900 520"
        width="100%"
        height="auto"
        role="img"
        aria-label={
          lang === "th"
            ? "แผนภาพสถาปัตยกรรมของระบบ"
            : "System architecture diagram"
        }
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.4)" />
          </marker>
        </defs>

        {/* Row 1 */}
        <Box x={40} y={30} w={160} h={50} line1="Browser" />
        <Box
          x={290}
          y={30}
          w={180}
          h={50}
          line1="Vercel Edge"
          line2="(proxy.ts)"
        />
        <Box
          x={560}
          y={30}
          w={200}
          h={50}
          line1="Next.js 16"
          line2="(App Router)"
        />

        <Arrow x1={200} y1={55} x2={290} y2={55} />
        <Arrow
          x1={470}
          y1={55}
          x2={560}
          y2={55}
          label="CSP nonce"
          labelX={515}
          labelY={48}
        />

        {/* Row 2 */}
        <Box
          x={290}
          y={150}
          w={180}
          h={50}
          line1="Upstash Redis"
          line2="(rate limit)"
        />
        <Box
          x={560}
          y={150}
          w={200}
          h={50}
          line1="Supabase"
          line2="(Postgres + RLS)"
        />

        <Arrow
          x1={380}
          y1={80}
          x2={380}
          y2={150}
          label="rate limit"
          labelX={380}
          labelY={120}
        />
        <Arrow x1={660} y1={80} x2={660} y2={150} />

        {/* Row 3 — Supabase tables */}
        <Box x={470} y={260} w={120} h={42} line1="conversations" line2="RAG" />
        <Box x={600} y={260} w={120} h={42} line1="leads" line2="contact" />
        <Box x={730} y={260} w={120} h={42} line1="analytics" line2="tokens" />

        <Arrow x1={530} y1={200} x2={530} y2={260} />
        <Arrow x1={660} y1={200} x2={660} y2={260} />
        <Arrow x1={790} y1={200} x2={790} y2={260} />

        {/* Row 4 — External */}
        <Box
          x={290}
          y={400}
          w={200}
          h={50}
          line1="Anthropic Claude API"
          line2="Opus + Sonnet"
        />
        <Box
          x={560}
          y={400}
          w={200}
          h={50}
          line1="Sentry"
          line2="errors + CSP reports"
        />

        <Arrow x1={660} y1={80} x2={390} y2={400} />
        <Arrow x1={660} y1={200} x2={660} y2={400} />
      </svg>
      <p className="text-[12px] text-[#888] mt-3 max-w-[720px] italic leading-relaxed">
        {caption[lang]}
      </p>
    </div>
  );
}
