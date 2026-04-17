import { connection } from "next/server";
import { Chat } from "@/components/chat";

// Nonce-based CSP requires dynamic rendering so each request can receive a
// fresh nonce that Next.js injects into framework <script> tags. connection()
// opts this page out of static generation. See src/proxy.ts for the CSP.
export default async function Home() {
  await connection();
  return <Chat />;
}
