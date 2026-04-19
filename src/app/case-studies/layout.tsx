import type { ReactNode } from "react";

export default function CaseStudiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] bg-grid text-[#e0e0e0] font-mono">
      {children}
    </div>
  );
}
