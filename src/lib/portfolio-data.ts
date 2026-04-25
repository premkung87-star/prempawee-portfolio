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
    caseStudy: {
      hero: {
        title: {
          en: "VerdeX Farm — AI-powered smart greenhouse",
          th: "VerdeX Farm — โรงเรือนอัจฉริยะขับเคลื่อนด้วย AI",
        },
        subtitle: {
          en: "A solo-built smart farm platform for sweet basil (DWC hydroponics) in Chiang Mai. 12 iterations across 4 subsystems: landing page, blog, owner command center, and a feature-rich LINE OA bot with Claude Opus powering weekly AI insight reports.",
          th: "Smart farm platform ที่สร้างคนเดียวสำหรับโหระพา (DWC hydroponics) ในเชียงใหม่ 12 iteration ครอบคลุม 4 subsystems: landing page, blog, owner command center, และ LINE OA bot ที่ขับเคลื่อนด้วย Claude Opus สำหรับ AI weekly pulse reports",
        },
      },
      problem: {
        en: "A working smart farm needs more than sensors. The owner needs to sell product, track inventory, monitor the environment, respond to VIP customers, and see trends before they become problems — all from a phone, in Thai, without hiring a dashboard engineer.\n\nOff-the-shelf farm software doesn't connect to LINE (the daily-driver messaging app in Thailand). Off-the-shelf e-commerce doesn't understand hydroponics. Off-the-shelf analytics doesn't generate business-grade weekly reports in natural language.\n\nVerdeX Farm solves all of it from one codebase: a LINE OA bot that is simultaneously a sales channel for customers and a command console for the owner, a web-based command center for deeper work, and a Claude Opus-backed weekly pulse report that reads the sensor logs, the revenue, and the harvest weight — then explains the week in two paragraphs. The software is fully functional through 12 refinement rounds; the hardware sensor rig is pending final assembly.",
        th: "Smart farm ที่ใช้ได้จริงต้องมากกว่า sensor เจ้าของต้องขายของ, จัดการ stock, monitor สภาพแวดล้อม, ตอบ VIP, และเห็น trend ก่อนที่จะเป็นปัญหา — ทำทั้งหมดนี้จากมือถือ เป็นภาษาไทย โดยไม่ต้องจ้าง dashboard engineer\n\nSoftware farm สำเร็จรูปไม่เชื่อมกับ LINE (แอปคุยงานหลักของคนไทย) E-commerce สำเร็จรูปไม่เข้าใจ hydroponics Analytics สำเร็จรูปไม่สร้าง weekly report ระดับธุรกิจเป็นภาษาธรรมชาติ\n\nVerdeX Farm แก้ทุกข้อจาก codebase เดียว: LINE OA bot ที่เป็นทั้งช่องทางขายสำหรับลูกค้าและ command console สำหรับเจ้าของ, web-based command center สำหรับงานลึก, และ weekly pulse report จาก Claude Opus ที่อ่าน sensor log, รายได้, และน้ำหนักผลผลิต — สรุปสัปดาห์เป็น 2 ย่อหน้า Software ทำงานได้จริงครบ 12 รอบ; Hardware sensor rig กำลังประกอบรอบสุดท้าย",
      },
      architecture: {
        caption: {
          en: "Cloudflare Workers deliver the web surface at the edge. Supabase stores orders, stock, sensor logs, harvest records, and customer profiles with RLS. The LINE OA webhook lives in the same Workers runtime — Rich Menu + Flex Messages render the UI, while commands dispatch to typed handlers. Claude Opus runs once a week (Sunday 07:00 ICT) against the last 7 days of sensor + business data, generating a natural-language Weekly Pulse Report that posts to the owner's LINE thread. An automated Morning Report runs daily at 07:00 with live sensor snapshot + open orders.",
          th: "Cloudflare Workers ให้บริการ web surface ที่ edge Supabase เก็บ orders, stock, sensor logs, harvest records, และ customer profiles พร้อม RLS LINE OA webhook อยู่ใน Workers runtime เดียวกัน — Rich Menu + Flex Messages เป็น UI, คำสั่ง dispatch ไปยัง typed handlers Claude Opus ทำงานสัปดาห์ละครั้ง (อาทิตย์ 07:00 ICT) กับข้อมูล 7 วันล่าสุดของ sensor และธุรกิจ สร้าง Weekly Pulse Report แบบภาษาธรรมชาติและ post ไปที่ LINE thread ของเจ้าของ Morning Report อัตโนมัติรายวัน 07:00 พร้อม sensor snapshot สดและ order ที่รอจัดส่ง",
        },
      },
      metrics: [
        {
          value: "12",
          label: { en: "Iterations", th: "รอบการพัฒนา" },
          footnote: {
            en: "Round 12 — continuous refinement with real farm feedback",
            th: "Round 12 — พัฒนาต่อเนื่องจาก feedback จากสวนจริง",
          },
          isTarget: false,
        },
        {
          value: "6",
          label: { en: "Major subsystems", th: "ระบบย่อยหลัก" },
          footnote: {
            en: "Ordering · Stock · Sensors · AI Weekly · VIP · Morning Reports",
            th: "Ordering · Stock · Sensors · AI Weekly · VIP · Morning Reports",
          },
          isTarget: false,
        },
        {
          value: "3 + 1",
          label: { en: "Web + LINE surfaces", th: "Web + LINE surfaces" },
          footnote: {
            en: "Landing · Blog · Command Center + LINE OA bot",
            th: "Landing · Blog · Command Center + LINE OA bot",
          },
          isTarget: false,
        },
        {
          value: "07:00",
          label: { en: "Daily morning report", th: "Morning report รายวัน" },
          footnote: {
            en: "Automated sensor + orders snapshot to owner's LINE",
            th: "ส่ง snapshot ของ sensor + orders อัตโนมัติไป LINE เจ้าของ",
          },
          isTarget: false,
        },
      ],
      adminIntro: {
        en: "The owner's primary surface is LINE OA — the same app they already check every few minutes. Rich Menu lets them jump between modes (sales / stock / sensors / reports); Flex Messages render order cards, stock states, and the Weekly Pulse. The web-based Command Center handles deeper work: customer CRM detail, batch harvest logging, historical sensor analysis. Both are gated per customer type (owner vs. regular customer) via LINE user-ID mapping.",
        th: "Surface หลักของเจ้าของคือ LINE OA — แอปที่เปิดดูทุกไม่กี่นาทีอยู่แล้ว Rich Menu ให้ jump ระหว่างโหมด (sales / stock / sensors / reports) Flex Messages render order cards, stock states, และ Weekly Pulse Web-based Command Center รองรับงานลึก: CRM รายละเอียดลูกค้า, batch harvest log, sensor analysis ย้อนหลัง ทั้งคู่ gate ตามประเภทผู้ใช้ (owner vs ลูกค้า) ผ่าน LINE user-ID mapping",
      },
      screenshots: [
        {
          filename: "01-landing.webp",
          alt: {
            en: "VerdeX Farm public landing page with brand hero",
            th: "หน้า landing ของ VerdeX Farm พร้อม brand hero",
          },
          caption: {
            en: "Public landing at verdex-web.verdexfarm.workers.dev — brand-first narrative for the smart farm concept.",
            th: "Landing สาธารณะที่ verdex-web.verdexfarm.workers.dev — เล่า brand smart farm concept เป็นหลัก",
          },
          stubbed: false,
          width: 1600,
          height: 888,
        },
        {
          filename: "02-blog.webp",
          alt: {
            en: "VerdeX blog listing with articles on smart farming",
            th: "รายการบทความ VerdeX blog",
          },
          caption: {
            en: "Blog surface for project updates + AI agriculture content.",
            th: "Blog สำหรับ project update + เนื้อหา AI agriculture",
          },
          stubbed: false,
          width: 1600,
          height: 890,
        },
        {
          filename: "03-command-center.webp",
          alt: {
            en: "VerdeX Command Center admin dashboard",
            th: "VerdeX Command Center admin dashboard",
          },
          caption: {
            en: "Owner-facing Command Center — real-time farm status, orders, CRM, operations. The brain alongside the LINE bot.",
            th: "Command Center สำหรับเจ้าของ — สถานะฟาร์มแบบสด, orders, CRM, operations สมองที่ทำงานร่วมกับ LINE bot",
          },
          stubbed: false,
          width: 1600,
          height: 891,
        },
        {
          filename: "04-morning-report.webp",
          alt: {
            en: "Daily 07:00 Morning Report rendered in LINE Flex Message",
            th: "Morning Report 07:00 รายวัน render เป็น LINE Flex Message",
          },
          caption: {
            en: "Automated 07:00 ICT Morning Report — live sensor snapshot + open orders, posted to owner's LINE thread.",
            th: "Morning Report 07:00 ICT อัตโนมัติ — sensor snapshot สด + order ที่รอจัดส่ง post ไป LINE thread เจ้าของ",
          },
          stubbed: false,
          width: 600,
          height: 1305,
        },
        {
          filename: "05-weekly-pulse.webp",
          alt: {
            en: "Claude Opus-generated Weekly Pulse Report with sensor stability score and AI insight",
            th: "Weekly Pulse Report จาก Claude Opus พร้อม sensor stability score และ AI insight",
          },
          caption: {
            en: "Weekly Pulse Report — Claude Opus analyzes 7 days of sensor + business data. Example: Sensor Stability 44/100, water 22.9°C (33% in range), air 27.3°C (67% in range), humidity 60.4%, revenue 360 THB, 3 orders, 5.5 kg harvested.",
            th: "Weekly Pulse Report — Claude Opus วิเคราะห์ข้อมูล 7 วันของ sensor และธุรกิจ ตัวอย่าง: Sensor Stability 44/100, น้ำ 22.9°C (ในช่วงปกติ 33%), อากาศ 27.3°C (ในช่วงปกติ 67%), ความชื้น 60.4%, รายได้ 360 บาท, 3 orders, 5.5 กก. ที่เก็บเกี่ยว",
          },
          stubbed: false,
          width: 600,
          height: 1305,
        },
      ],
      security: [
        {
          key: "tenancy",
          title: { en: "LINE user-ID tenancy", th: "LINE user-ID tenancy" },
          detail: {
            en: "Owner vs customer surfaces dispatched from the same webhook by user-ID lookup — no shared admin surface exposed to regular customers.",
            th: "Surface ของเจ้าของและลูกค้า dispatch จาก webhook เดียวด้วย user-ID lookup — ไม่มี admin surface เปิดให้ลูกค้าทั่วไปเห็น",
          },
        },
        {
          key: "rls",
          title: { en: "Row-Level Security", th: "Row-Level Security" },
          detail: {
            en: "Supabase RLS on orders, stock, sensor_logs, harvests, and customers — service-role only for webhook writes.",
            th: "Supabase RLS บน orders, stock, sensor_logs, harvests, และ customers — เขียนได้เฉพาะ service-role จาก webhook",
          },
        },
        {
          key: "signing",
          title: { en: "LINE signature verification", th: "LINE signature verification" },
          detail: {
            en: "Every webhook request HMAC-verified against the channel secret before dispatch.",
            th: "ทุก webhook request verify HMAC กับ channel secret ก่อน dispatch",
          },
        },
        {
          key: "secrets",
          title: { en: "Edge-scoped secrets", th: "Edge-scoped secrets" },
          detail: {
            en: "Channel access token, Supabase service-role key, and Anthropic key live in Cloudflare Workers secrets — never bundled in client code.",
            th: "Channel access token, Supabase service-role key, และ Anthropic key อยู่ใน Cloudflare Workers secrets — ไม่เคย bundle เข้า client",
          },
        },
      ],
      observability: {
        en: "Workers logs stream every webhook event with the owner / customer tag and the dispatched command. Supabase's built-in query logs catch slow queries. The Weekly Pulse itself is an observability signal — if sensor stability drops week-over-week, Claude's AI Insight flags it before the owner notices in the raw numbers.",
        th: "Workers log stream ทุก webhook event พร้อม tag owner/ลูกค้าและ command ที่ถูก dispatch Supabase query logs จับ slow query Weekly Pulse เองเป็น observability signal — ถ้า sensor stability ลดลง week-over-week Claude AI Insight จะ flag ก่อนที่เจ้าของจะสังเกตเห็นจากตัวเลขดิบ",
      },
      workflow: {
        en: "Twelve iteration rounds, each triggered by a real constraint from operating the farm: early rounds added ordering + stock; middle rounds added sensor logging and the owner CRM; later rounds layered in the Weekly Pulse AI report, VIP tracking, and automated morning reports. Each round shipped as a discrete release — the system's been working in production the entire time, with the owner as primary QA.",
        th: "12 iteration แต่ละรอบเกิดจาก constraint จริงในการ operate ฟาร์ม: รอบแรกๆ เพิ่ม ordering + stock, รอบกลางๆ เพิ่ม sensor logging และ owner CRM, รอบหลังๆ เพิ่ม Weekly Pulse AI report, VIP tracking, และ automated morning reports แต่ละรอบ ship เป็น release แยก — ระบบใช้งานจริงมาตลอด โดยมีเจ้าของเป็น QA หลัก",
      },
      cta: {
        heading: {
          en: "Build me something like this",
          th: "อยากได้แบบนี้บ้าง",
        },
        body: {
          en: "If you run a business that lives on LINE OA and needs a bespoke system — e-commerce, customer-ops, internal workflow, or AI-powered analytics — I can build it end-to-end, solo. Start with a free 15-minute consultation.",
          th: "ถ้าคุณมีธุรกิจที่อยู่บน LINE OA และต้องการระบบที่ fit กับธุรกิจ — e-commerce, customer-ops, internal workflow, หรือ AI analytics — ผมสร้าง end-to-end ให้ได้คนเดียว เริ่มด้วยคุยฟรี 15 นาที",
        },
        mailto:
          "mailto:prempaweet20@gmail.com?subject=Project%20Inquiry%20from%20prempawee.com%2Fverdex&body=Hi%20Prem%2C%0A%0AI%20saw%20the%20VerdeX%20Farm%20case%20study%20at%20prempawee.com%2Fcase-studies%2Fverdex%20and%20would%20like%20to%20discuss%20a%20project.%0A%0AProject%20type%3A%20%0ATimeline%3A%20%0ABudget%20range%3A%20%0A%0AThanks%2C",
        buttonLabel: {
          en: "Start a project →",
          th: "เริ่มโปรเจค →",
        },
      },
    },
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
  linkedin: "https://www.linkedin.com/in/prempaweedevth",
  line: "Prempawee (Personal LINE)",
  // Direct LINE chat URL — Thai buyers prefer LINE over email, and
  // opening a 1:1 chat with the actual developer (vs an OA) converts
  // better for project intake. Email remains available as a secondary
  // path via the LeadCaptureCard / error-fallback surfaces.
  contactUrl: "https://line.me/ti/p/EeqOwz9udS",
  mailtoFallback:
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

// 4-step work process shown above the chat. Content mirrors KB row #18
// ("What is the work process?") so buyers who skim the ribbon see the
// same story the chatbot tells — no AI hallucination surface.
export const HOW_I_WORK: Array<{
  n: string;
  title: { en: string; th: string };
  body: { en: string; th: string };
}> = [
  {
    n: "01",
    title: { en: "Discovery", th: "คุยงาน" },
    body: {
      en: "Requirement form: business, customers, FAQs, desired flow.",
      th: "แบบฟอร์มสรุป business, ลูกค้า, FAQs, flow ที่ต้องการ",
    },
  },
  {
    n: "02",
    title: { en: "Design", th: "ออกแบบ" },
    body: {
      en: "Flow diagrams + Rich Menu wireframes — approved before code.",
      th: "Flow diagram + Rich Menu wireframes — ต้อง approve ก่อนเขียน code",
    },
  },
  {
    n: "03",
    title: { en: "Build & test", th: "สร้าง & ทดสอบ" },
    body: {
      en: "Staging environment you can poke before production.",
      th: "Staging ให้กดทดสอบก่อนขึ้น production",
    },
  },
  {
    n: "04",
    title: { en: "Deploy & handoff", th: "ส่งมอบ" },
    body: {
      en: "Production deploy + docs + video tutorial + warranty window.",
      th: "Deploy production + doc + วิดีโอสอน + warranty",
    },
  },
];
