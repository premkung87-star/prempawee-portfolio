// Single source of truth for portfolio content shared between the live chat
// (src/components/tool-results.tsx) and the offline fallback page
// (src/app/fallback/page.tsx). Prevents the drift called out in the audit
// report (fallback duplicated all pricing/case-study markup).

import type { CaseStudy } from "./case-study-types";

export type ProjectComponent = {
  label: string;
  url: string | null;
  note?: string;
};

export type Project = {
  id: "verdex" | "nwl_club" | "portfolio";
  slug: string;
  name: string;
  tagline: string;
  components: ProjectComponent[];
  tech: string[];
  depth: string;
  caseStudy?: CaseStudy;
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
    slug: "verdex",
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
    slug: "nwl-club",
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
    slug: "this-portfolio",
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
    caseStudy: {
      hero: {
        title: {
          en: "This site is the case study",
          th: "เว็บนี้คือ case study",
        },
        subtitle: {
          en: "Portfolio infrastructure built like production software — shipped, instrumented, and documented by the same person you'd hire.",
          th: "Portfolio ที่สร้างด้วยมาตรฐานของ production software — ship, monitor, และ document โดยคนเดียวที่คุณกำลังจะจ้าง",
        },
      },
      problem: {
        en: "Most freelance portfolios are static marketing pages. They tell clients what the developer can build — they don't prove it.\n\nI needed a portfolio that would demonstrate three things at once: engineering depth, operational discipline, and the ability to ship real AI infrastructure solo. Off-the-shelf SaaS (Framer, Webflow, Notion) couldn't show any of that — the admin console, the observability pipeline, the security posture, the RAG chatbot. Those are the demo.\n\nSo the site became its own case study: a full-stack app with an admin dashboard, an AI chat interface grounded in a knowledge base, rate limiting, CSP, error tracking, and a CI/CD pipeline behind branch protection. Every decision is visible because the infrastructure is the pitch.",
        th: "Portfolio ของ freelance ส่วนใหญ่เป็นหน้า marketing แบบ static — บอกลูกค้าได้ว่า developer ทำอะไรได้ แต่ไม่ได้พิสูจน์\n\nผมต้องการ portfolio ที่แสดง 3 สิ่งพร้อมกัน: ความลึกทาง engineering, วินัยในการ operate, และความสามารถในการ ship AI infrastructure จริงคนเดียว SaaS สำเร็จรูป (Framer, Webflow, Notion) ทำไม่ได้ — admin console, observability pipeline, security posture, RAG chatbot สิ่งเหล่านี้คือ demo\n\nเว็บนี้จึงกลายเป็น case study ของตัวเอง: full-stack app พร้อม admin dashboard, AI chat ที่ grounded ด้วย knowledge base, rate limiting, CSP, error tracking, และ CI/CD pipeline ภายใต้ branch protection ทุกการตัดสินใจมองเห็นได้ เพราะ infrastructure คือ pitch",
      },
      architecture: {
        caption: {
          en: "Edge proxy injects per-request CSP nonce + rate-limit headers. Next.js App Router handles SSR, streaming, and tool-calling. Supabase stores conversations (for RAG context), leads, and analytics with row-level security. Sentry captures errors and CSP violations end-to-end.",
          th: "Edge proxy ฉีด per-request CSP nonce + rate-limit headers Next.js App Router จัดการ SSR, streaming, และ tool-calling Supabase เก็บ conversations (สำหรับ RAG context), leads, และ analytics โดยมี row-level security Sentry ดักจับ errors และ CSP violations แบบ end-to-end",
        },
      },
      metrics: [
        {
          value: "< 3s",
          label: { en: "p95 latency", th: "p95 latency" },
          footnote: {
            en: "/api/chat streaming first token",
            th: "first token ของ /api/chat streaming",
          },
          isTarget: true,
        },
        {
          value: "< 1%",
          label: { en: "Error rate", th: "Error rate" },
          footnote: {
            en: "Sentry-monitored with alerts",
            th: "Monitor ด้วย Sentry พร้อม alert",
          },
          isTarget: true,
        },
        {
          value: "99.9%",
          label: { en: "Uptime", th: "Uptime" },
          footnote: {
            en: "Vercel platform SLA",
            th: "Vercel platform SLA",
          },
          isTarget: true,
        },
        {
          value: "~$0.003",
          label: { en: "Cost / request", th: "Cost ต่อ request" },
          footnote: {
            en: "Claude Opus + Sonnet with 5-min cache",
            th: "Claude Opus + Sonnet พร้อม cache 5 นาที",
          },
          isTarget: true,
        },
      ],
      adminIntro: {
        en: "The admin surface is not a third-party dashboard — it's a custom Next.js area under /admin, gated by an ADMIN_COOKIE session, rendering directly from Supabase. Four views handle the operational needs.",
        th: "Admin ของเว็บนี้ไม่ใช่ dashboard จาก third-party — เป็น Next.js area ที่ custom เอง อยู่ใต้ /admin ปกป้องด้วย ADMIN_COOKIE session, render ตรงจาก Supabase 4 หน้าครอบคลุมงาน operation",
      },
      screenshots: [
        {
          filename: "01-login.webp",
          alt: {
            en: "Admin login screen with password gate",
            th: "หน้า admin login พร้อม password gate",
          },
          caption: {
            en: "Password gate using validateAdminSecret. Sets httpOnly SameSite=Strict session cookie.",
            th: "Password gate ด้วย validateAdminSecret ตั้ง httpOnly SameSite=Strict session cookie",
          },
          stubbed: false,
          width: 2310,
          height: 1970,
        },
        {
          filename: "02-overview.webp",
          alt: {
            en: "Admin overview with three count cards and navigation",
            th: "Admin overview พร้อม 3 count cards และ navigation",
          },
          caption: {
            en: "Overview shows live counts for conversations, leads, and analytics events — each a drill-down link into its detailed view.",
            th: "Overview แสดง count แบบ live สำหรับ conversations, leads, และ analytics events — แต่ละอันเป็น link ไปหน้าละเอียด",
          },
          stubbed: false,
          width: 2310,
          height: 1970,
        },
        {
          filename: "03-finops.webp",
          alt: {
            en: "Finops dashboard with 30-day token spend breakdown",
            th: "Finops dashboard พร้อม 30-day token spend breakdown",
          },
          caption: {
            en: "30-day token spend, cache hit rate, and per-event table computed against the Claude pricing constant. Useful for predicting margin on new client projects.",
            th: "30-day token spend, cache hit rate, และ per-event table คำนวณกับ Claude pricing constant — ใช้ predict margin สำหรับโปรเจคใหม่",
          },
          stubbed: false,
          width: 2302,
          height: 2624,
        },
        {
          filename: "04-leads.webp",
          alt: {
            en: "Leads list with 8 submissions across package tiers",
            th: "รายการ Leads 8 submissions แยก package tier",
          },
          caption: {
            en: "Every lead submission captured with full metadata: name, email, LINE ID, business type, package interest, and message. Newest first.",
            th: "ทุก lead submission เก็บ metadata ครบ: ชื่อ, email, LINE ID, business type, package ที่สนใจ, และ message เรียงใหม่สุดก่อน",
          },
          stubbed: false,
          width: 2302,
          height: 3264,
        },
      ],
      security: [
        {
          key: "csp",
          title: { en: "Content Security Policy", th: "Content Security Policy" },
          detail: {
            en: "Per-request nonce with strict-dynamic, injected at edge proxy",
            th: "Per-request nonce พร้อม strict-dynamic ฉีดที่ edge proxy",
          },
        },
        {
          key: "hsts",
          title: { en: "HSTS preload", th: "HSTS preload" },
          detail: {
            en: "max-age=63072000 with includeSubDomains and preload (submitted)",
            th: "max-age=63072000 พร้อม includeSubDomains และ preload (submit แล้ว)",
          },
        },
        {
          key: "rate-limit",
          title: { en: "Rate limiting", th: "Rate limiting" },
          detail: {
            en: "Upstash Redis, per-IP on /api/chat and form endpoints",
            th: "Upstash Redis, per-IP บน /api/chat และ form endpoints",
          },
        },
        {
          key: "rls",
          title: { en: "Row-Level Security", th: "Row-Level Security" },
          detail: {
            en: "Supabase RLS on conversations, leads, and analytics tables",
            th: "Supabase RLS บนตาราง conversations, leads, และ analytics",
          },
        },
        {
          key: "branch-protection",
          title: { en: "Branch protection", th: "Branch protection" },
          detail: {
            en: "main requires typecheck+lint+test and RAG answer quality checks; no force push",
            th: "main ต้องผ่าน typecheck+lint+test และ RAG answer quality checks; ห้าม force push",
          },
        },
        {
          key: "auth-gate",
          title: { en: "Admin auth gate", th: "Admin auth gate" },
          detail: {
            en: "ADMIN_COOKIE session, httpOnly with SameSite=Strict for admin surface",
            th: "ADMIN_COOKIE session, httpOnly พร้อม SameSite=Strict สำหรับ admin surface",
          },
        },
      ],
      observability: {
        en: "Sentry is wired end-to-end: client SDK (with a Turbopack visibility fix that took three iterations to nail), server SDK, and CSP violation reporting via the same transport. Errors, performance traces, and blocked CSP directives all land in one project. The setup is documented in SOPs §22–§25 as a reusable pipeline for future Next.js projects.",
        th: "Sentry ต่อไว้แบบ end-to-end: client SDK (มี Turbopack visibility fix ที่ลอง 3 รอบกว่าจะได้), server SDK, และ CSP violation reporting ผ่าน transport เดียวกัน Errors, performance traces, และ CSP directive ที่ถูก block มาอยู่ใน project เดียว Setup นี้ document ไว้ที่ SOPs §22–§25 ในฐานะ reusable pipeline สำหรับ Next.js project ต่อไป",
      },
      workflow: {
        en: "Every change flows through a disciplined pipeline: Claude Code (builder) operates on a feature branch with pre-flight validation; GitHub serves as ground truth — no auto-opened PRs, all merges manual and squash-only. Each PR represents exactly one logical change. Phase structure: Recon → Discovery → Plan → Pre-flight → Apply → Verify (typecheck + lint + vitest) → Report. This is how a solo developer ships at the quality of a small team.",
        th: "ทุก change ไหลผ่าน pipeline ที่มีวินัย: Claude Code (builder) ทำงานบน feature branch โดยมี pre-flight validation; GitHub เป็น ground truth — ไม่มี auto-open PR, merge ทุก PR แบบ manual และ squash เท่านั้น แต่ละ PR = 1 logical change เฟส: Recon → Discovery → Plan → Pre-flight → Apply → Verify (typecheck + lint + vitest) → Report นี่คือวิธีที่ solo developer ship ได้ในคุณภาพระดับทีมเล็ก",
      },
      cta: {
        heading: {
          en: "Work with me",
          th: "ร่วมงานกัน",
        },
        body: {
          en: "Need infrastructure like this for your business? I build production-grade web apps, AI chatbots, IoT systems, and internal tools — solo, fast, and instrumented from day one.",
          th: "ต้องการ infrastructure แบบนี้สำหรับธุรกิจของคุณ? ผมสร้าง web app, AI chatbot, IoT system, และ internal tool ระดับ production — คนเดียว เร็ว และ instrument ตั้งแต่วันแรก",
        },
        mailto:
          "mailto:prempaweet20@gmail.com?subject=Project%20Inquiry%20from%20prempawee.com&body=Hi%20Prem%2C%0A%0AI%20saw%20your%20case%20study%20at%20prempawee.com%2Fcase-studies%2Fthis-portfolio%20and%20would%20like%20to%20discuss%20a%20project.%0A%0AProject%20type%3A%20%0ATimeline%3A%20%0ABudget%20range%3A%20%0A%0AThanks%2C",
        buttonLabel: {
          en: "Start a project →",
          th: "เริ่มโปรเจค →",
        },
      },
    },
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
    "mailto:prempaweet20@gmail.com?subject=Project%20inquiry&body=Hi%20Prempawee%2C%0A%0AI'm%20interested%20in%20starting%20a%20project%20with%20you.%0A%0ABusiness%20type%3A%0AScope%2FRequirements%3A%0APreferred%20timeline%3A%0A%0AThanks%2C%0A",
  fastwork: "https://fastwork.co",
  responseTime: "2-4 hours during working hours",
} as const;

// Trust-ticker facts. Single source of truth for the first-viewport proof
// strip. Keep each item concrete + verifiable.
export const TRUST_FACTS = {
  location: { en: "Chiang Mai", th: "เชียงใหม่" },
  responseTime: { en: "Reply 2-4h", th: "ตอบใน 2-4 ชม." },
  projects: { en: "3 production systems", th: "3 ระบบใช้งานจริง" },
  stack: { en: "Claude Opus + Sonnet", th: "Claude Opus + Sonnet" },
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
