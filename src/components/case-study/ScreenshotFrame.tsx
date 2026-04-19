import Image from "next/image";
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
        <Image
          src={`/case-studies/${slug}/${screenshot.filename}`}
          alt={screenshot.alt[lang]}
          width={screenshot.width ?? 2302}
          height={screenshot.height ?? 2624}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="w-full h-auto rounded border border-white/10"
        />
      )}
      <figcaption className="text-[11px] text-[#888] leading-relaxed mt-2">
        {screenshot.caption[lang]}
      </figcaption>
    </figure>
  );
}
