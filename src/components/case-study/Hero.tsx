import Link from "next/link";
import type { Bilingual } from "@/lib/case-study-types";

export function Hero({
  title,
  subtitle,
  lang,
}: {
  title: Bilingual;
  subtitle: Bilingual;
  lang: "en" | "th";
}) {
  const backLabel = lang === "th" ? "← กลับหน้าหลัก" : "← Back to portfolio";
  return (
    <header className="max-w-[1000px] mx-auto px-6 pt-20 pb-12">
      <Link
        href="/"
        className="inline-block text-[12px] text-[#888] hover:text-[#ccc] transition-colors mb-6"
      >
        {backLabel}
      </Link>
      <h1 className="text-[28px] md:text-[36px] font-medium text-white leading-tight">
        {title[lang]}
      </h1>
      <p className="text-[15px] md:text-[17px] text-[#aaa] leading-relaxed mt-3 max-w-[720px]">
        {subtitle[lang]}
      </p>
    </header>
  );
}
