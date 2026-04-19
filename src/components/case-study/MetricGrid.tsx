import type { MetricCard } from "@/lib/case-study-types";

export function MetricGrid({
  metrics,
  lang,
}: {
  metrics: readonly MetricCard[];
  lang: "en" | "th";
}) {
  const note =
    lang === "th"
      ? "Targets สะท้อน engineering standards ค่าจริงติดตามใน Sentry + Finops dashboard"
      : "Targets reflect engineering standards. Actual values tracked in Sentry + Finops dashboard.";

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="relative border border-white/10 rounded p-4 bg-white/[0.02]"
          >
            {m.isTarget ? (
              <span className="absolute top-2 right-2 text-[8px] uppercase tracking-[2px] text-[#666]">
                TARGET
              </span>
            ) : null}
            <div className="text-[24px] md:text-[28px] font-medium text-white mb-1">
              {m.value}
            </div>
            <div className="text-[11px] uppercase tracking-[1px] text-[#aaa]">
              {m.label[lang]}
            </div>
            <div className="text-[11px] text-[#888] leading-relaxed mt-2">
              {m.footnote[lang]}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[#666] italic mt-4 max-w-[720px]">
        {note}
      </p>
    </div>
  );
}
