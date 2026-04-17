export const metadata = {
  title: "Admin · PREMPAWEE AI",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] bg-grid text-[#e0e0e0] font-mono">
      {children}
    </div>
  );
}
