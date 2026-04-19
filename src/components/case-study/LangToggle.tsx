"use client";

export function LangToggle({
  lang,
  setLang,
}: {
  lang: "en" | "th";
  setLang: (next: "en" | "th") => void;
}) {
  return (
    <div
      className="fixed top-6 right-6 z-50 flex items-center gap-1 text-[11px]"
      role="group"
      aria-label="Display language"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-2 py-1 rounded transition-colors ${
          lang === "en"
            ? "text-white bg-white/10"
            : "text-[#888] hover:text-[#ccc]"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("th")}
        aria-pressed={lang === "th"}
        className={`px-2 py-1 rounded transition-colors ${
          lang === "th"
            ? "text-white bg-white/10"
            : "text-[#888] hover:text-[#ccc]"
        }`}
      >
        TH
      </button>
    </div>
  );
}
