// Single source of truth for portfolio content shared between the live chat
// (src/components/tool-results.tsx) and the offline fallback page
// (src/app/fallback/page.tsx). Prevents the drift called out in the audit
// report (fallback duplicated all pricing/case-study markup).

export type ProjectComponent = {
  label: string;
  url: string | null;
  note?: string;
};

export type Project = {
  id: "verdex" | "nwl_club" | "portfolio";
  name: string;
  tagline: string;
  components: ProjectComponent[];
  tech: string[];
  depth: string;
};

export type Package = {
  id: "starter" | "pro" | "enterprise";
  name: string;
  price: string;
  delivery: string;
  desc: string;
  features: string[];
};

export const PACKAGES: readonly Package[] = [
  {
    id: "starter",
    name: "LINE OA Starter",
    price: "฿5,000",
    delivery: "5 days",
    desc: "Rich Menu, auto-reply, Flex Messages",
    features: [
      "Messaging API connection",
      "Rich Menu (6 buttons)",
      "Auto-reply (10 keywords)",
      "1 Flex Message template",
      "Staging test + production deploy",
      "7-day bug warranty",
    ],
  },
  {
    id: "pro",
    name: "Smart Chatbot Pro",
    price: "฿18,000",
    delivery: "14 days",
    desc: "Claude AI, Thai NLU, CRM dashboard",
    features: [
      "Everything in Starter",
      "Claude AI — understands Thai naturally",
      "25 conversation paths",
      "3 Flex Message templates",
      "Supabase customer database",
      "CRM dashboard (LIFF app)",
      "Video training + 14-day support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise AI",
    price: "฿45,000",
    delivery: "30 days",
    desc: "Full AI system with booking, payments, loyalty",
    features: [
      "Everything in Pro",
      "AI with conversation memory",
      "LIFF app (booking/ordering)",
      "PromptPay / payment verification",
      "Loyalty points + membership",
      "Admin dashboard",
      "Broadcast + audience segmentation",
      "Live training + 30-day support",
    ],
  },
] as const;

export const TECH_STACK = [
  { name: "Claude AI", desc: "Natural language understanding (Anthropic)" },
  { name: "Next.js 16", desc: "React framework with App Router" },
  { name: "Supabase", desc: "Postgres + RAG knowledge base" },
  { name: "Vercel", desc: "Deployment + edge network" },
  { name: "Upstash", desc: "Serverless Redis for rate limiting" },
  { name: "LINE API", desc: "Messaging, Rich Menu, Flex, LIFF" },
  { name: "Tailwind CSS v4", desc: "Design system" },
] as const;

export const PROJECTS: readonly Project[] = [
  {
    id: "verdex",
    name: "VerdeX Farm",
    tagline:
      "AI smart greenhouse for sweet basil (DWC hydroponics), Chiang Mai. 12 iterations.",
    components: [
      {
        label: "Landing Page",
        url: "https://verdex-web.verdexfarm.workers.dev/",
      },
      {
        label: "Blog",
        url: "https://verdex-web.verdexfarm.workers.dev/blog/",
      },
      {
        label: "Command Center",
        url: "https://verdex-app.verdexfarm.workers.dev/",
        note: "owner admin dashboard",
      },
      {
        label: "LINE Bot",
        url: null,
        note: "ordering, farm monitoring, AI reports, VIP tracking",
      },
    ],
    tech: ["Cloudflare Workers", "Supabase", "Claude Opus", "LINE API"],
    depth:
      "6 major systems — ordering, stock management, farm sensor logging, AI weekly analysis, VIP customers, automated morning reports",
  },
  {
    id: "nwl_club",
    name: "NWL CLUB",
    tagline: "2 production sites for NWL, a streetwear brand from Bangkok",
    components: [
      {
        label: "Work Tracker",
        url: "https://nwl-work-tracker.vercel.app/",
        note: "employee check-in + work logs",
      },
      {
        label: "Community Website",
        url: "https://nwl-club-website.vercel.app/",
        note: "brand customer community",
      },
    ],
    tech: ["Next.js", "Supabase", "Tailwind CSS", "Vercel"],
    depth:
      "Employee check-in / check-out with work tracking, plus a customer-facing brand community platform",
  },
  {
    id: "portfolio",
    name: "This Portfolio",
    tagline: "AI chat portfolio — the site you are using right now",
    components: [
      {
        label: "AI Chat UI",
        url: null,
        note: "streaming Claude responses, 5 tool-triggered cards",
      },
    ],
    tech: [
      "Next.js 16",
      "AI SDK v6",
      "Claude Sonnet",
      "Supabase RAG",
      "Tailwind v4",
    ],
    depth:
      "Anthropic tool-use (show_portfolio / show_case_study / show_pricing / show_tech_stack / show_contact), Supabase RAG knowledge base with 5-min cache, Upstash rate limiting, structured logging, Vercel Analytics + Speed Insights, PDPA consent banner, EN/TH UI",
  },
] as const;

export const PORTFOLIO_METRICS = [
  { value: "3", label: "Projects" },
  { value: "6", label: "Web Properties" },
  { value: "1", label: "LINE Bot" },
] as const;

export const VERDEX_METRICS = [
  { value: "24/7", label: "Availability" },
  { value: "AI", label: "Weekly Reports" },
  { value: "12", label: "Iterations" },
] as const;

export const VERDEX_FEATURES = [
  "Owner Console — commands for data, orders, stock, farm logs",
  "Customer ordering through LINE conversation",
  "Live sensor data (temperature, humidity) + web dashboard",
  "Automated morning reports + AI weekly analysis",
  "Stock management with 3 states (ready/low/out)",
  "VIP customer tracking + expense logging",
] as const;

export const NWL_FEATURES = [
  "Employee check-in / check-out with time tracking",
  "Work log entries with history view",
  "Community site for the brand's customer base",
  "Supabase-backed data layer, deployed on Vercel",
] as const;

export const CONTACT = {
  email: "prempaweet20@gmail.com",
  linkedin: "https://www.linkedin.com/in/prempawee",
  line: "Prempawee (Personal LINE)",
  // Direct LINE chat URL — Thai buyers prefer LINE over email. If the
  // personal LINE is addable, set to `https://line.me/ti/p/<lineId>`.
  // Until then, mailto: is the reliable fallback.
  contactUrl:
    "mailto:prempaweet20@gmail.com?subject=LINE%20OA%20Chatbot%20project&body=Hi%20Prempawee%2C%0A%0AI'm%20interested%20in%20a%20LINE%20OA%20Chatbot%20for%20my%20business.%0A%0ABusiness%20type%3A%0AWhich%20package%3A%0APreferred%20timeline%3A%0A%0AThanks%2C%0A",
  fastwork: "https://fastwork.co",
  responseTime: "2-4 hours during working hours",
} as const;

// Trust-ticker facts. Single source of truth for the first-viewport proof
// strip. Keep each item concrete + verifiable.
export const TRUST_FACTS = {
  location: { en: "Chiang Mai", th: "เชียงใหม่" },
  responseTime: { en: "Reply 2-4h", th: "ตอบใน 2-4 ชม." },
  projects: { en: "3 live bots", th: "3 บอทใช้งานจริง" },
  stack: { en: "Claude-powered", th: "ขับเคลื่อนด้วย Claude" },
} as const;

// Suggested prompt chips shown before first user turn. Each chip triggers
// either (a) a canned user message or (b) the AI's tool directly via keyword.
export const SUGGESTED_PROMPTS: Array<{
  en: string;
  th: string;
  send: { en: string; th: string };
}> = [
  {
    en: "Show your portfolio",
    th: "ขอดูผลงาน",
    send: {
      en: "Show me your portfolio.",
      th: "ขอดูผลงานทั้งหมดของคุณ",
    },
  },
  {
    en: "Pricing packages",
    th: "ราคาแพ็คเกจ",
    send: {
      en: "What are your pricing packages?",
      th: "ราคาแพ็คเกจเป็นยังไงบ้าง",
    },
  },
  {
    en: "VerdeX Farm case study",
    th: "เล่าเรื่อง VerdeX Farm",
    send: {
      en: "Tell me about VerdeX Farm in detail.",
      th: "เล่าเรื่อง VerdeX Farm ให้ฟังหน่อยครับ",
    },
  },
];
