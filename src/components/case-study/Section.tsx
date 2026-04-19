import type { ReactNode } from "react";

export function Section({
  label,
  children,
  noBorder = false,
}: {
  label: string;
  children: ReactNode;
  noBorder?: boolean;
}) {
  return (
    <section
      className={`py-10 max-w-[1000px] mx-auto px-6 ${
        noBorder ? "" : "border-t border-white/10"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[2px] text-[#888] mb-4 block">
        {label}
      </span>
      {children}
    </section>
  );
}
