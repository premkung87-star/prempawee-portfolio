import { connection } from "next/server";
import type { Metadata } from "next";
import { Landing } from "@/components/preview/Landing";

// Preview redesign route. Mounted at /preview alongside the live / so we can
// visually compare the new design vs. the production design without risking
// the live chatbot or watchlist files. Cutover plan documented in AUDIT_LOG
// once Foreman approves the visual direction.
//
// Same nonce-based dynamic rendering as / so per-request CSP nonce reaches
// the dot-field canvas + matrix-boot canvas + cursor scripts.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PREMPAWEE // AI — preview redesign",
  description:
    "Preview build of the prempawee.com redesign. Same chatbot, new chrome. Solo AI Developer in Chiang Mai.",
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  await connection();
  return <Landing />;
}
