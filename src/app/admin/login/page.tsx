import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  validateAdminSecret,
} from "@/lib/admin-auth";

export const metadata = {
  title: "Admin · PREMPAWEE AI",
  robots: { index: false, follow: false },
};

async function login(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (!validateAdminSecret(token)) {
    redirect("/admin/login?error=1");
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  redirect("/admin");
}

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <div className="flex flex-col h-dvh bg-[#0a0a0a] bg-grid text-[#e0e0e0] font-mono items-center justify-center px-4">
      <div className="max-w-[400px] w-full">
        <div className="text-[10px] uppercase tracking-[2px] text-[#888] mb-3">
          PREMPAWEE AI {"// ADMIN"}
        </div>
        <h1 className="text-[20px] text-white font-medium mb-6">
          Enter admin token
        </h1>
        <form action={login} className="space-y-3">
          <input
            type="password"
            name="token"
            required
            autoFocus
            autoComplete="off"
            placeholder="ADMIN_SECRET"
            className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded text-white text-sm font-mono placeholder:text-[#555] focus:border-white/30 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors text-white text-sm rounded"
          >
            Unlock
          </button>
          {hasError ? (
            <p className="text-xs text-red-400">Token rejected.</p>
          ) : null}
        </form>
        <p className="text-[11px] text-[#666] mt-6 leading-relaxed">
          Set `ADMIN_SECRET` in the Vercel env to enable this surface. No user
          management — this is a single-tenant admin for ops.
        </p>
      </div>
    </div>
  );
}
