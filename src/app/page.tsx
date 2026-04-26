import { connection } from "next/server";
import { Landing } from "@/components/preview/Landing";

// Nonce-based CSP requires dynamic rendering so each request can receive a
// fresh nonce that Next.js injects into framework <script> tags. connection()
// opts this page out of static generation. See src/proxy.ts for the CSP.
//
// Phase 2 cutover (Session 7, 2026-04-26): renders the Landing redesign that
// previously lived at /preview. Old chat.tsx-based design retired; the
// /preview route is gone and 301-redirects to / via next.config.ts.
export default async function Home() {
  await connection();
  return <Landing />;
}
