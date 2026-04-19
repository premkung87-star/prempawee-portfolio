import type { Screenshot } from "@/lib/case-study-types";

export function ScreenshotFrame({
  screenshot,
  lang,
  slug,
}: {
  screenshot: Screenshot;
  lang: "en" | "th";
  slug: string;
}) {
  const stubLabel =
    lang === "th" ? "กำลังจะมา" : "Screenshot coming soon";

  return (
    <figure>
      {screenshot.stubbed ? (
        <div
          className="aspect-[16/10] bg-white/[0.02] border border-dashed border-white/10 rounded flex items-center justify-center"
          role="img"
          aria-label={screenshot.alt[lang]}
        >
          <span className="text-[11px] text-[#666] uppercase tracking-[2px]">
            {stubLabel}
          </span>
        </div>
      ) : (
        // Plain <img> here — we don't have fixed dimensions until real
        // screenshots land in PR #2.1, so next/image wouldn't help yet.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/case-studies/${slug}/${screenshot.filename}`}
          alt={screenshot.alt[lang]}
          className="w-full rounded border border-white/10"
        />
      )}
      <figcaption className="text-[11px] text-[#888] leading-relaxed mt-2">
        {screenshot.caption[lang]}
      </figcaption>
    </figure>
  );
}
