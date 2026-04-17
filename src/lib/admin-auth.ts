// Minimal admin auth: constant-time compare of a cookie value against
// the ADMIN_SECRET env var. One-person ops; no user-management, no
// session store. Good enough for a private admin surface on a portfolio.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "pp_admin_token";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function isAdminAuthed(): Promise<boolean> {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  const store = await cookies();
  const provided = store.get(ADMIN_COOKIE)?.value ?? "";
  return constantTimeEq(provided, expected);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }
}

export function validateAdminSecret(provided: string): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  return constantTimeEq(provided, expected);
}
