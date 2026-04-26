// Refreshes the Supabase `knowledge_base` table to match the current codebase
// state (stack, tools, metrics). Idempotent — uses UPDATE by title where the
// entry already exists, INSERT otherwise.
//
// Run:
//   node --env-file=.env.local scripts/refresh-knowledge-base.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. Uses service-role to
// bypass public RLS policies. Never ship this script to the browser.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "refresh-kb.env.missing",
      hint: "Run with `node --env-file=.env.local scripts/refresh-knowledge-base.mjs`. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    }),
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** @type {Array<{ title: string, category: string, content: string, metadata: Record<string, unknown> }>} */
const ENTRIES = [
  {
    title: "Skills and Tech Stack",
    category: "bio",
    content:
      "Prempawee's current tech stack (2026-04): Claude AI via Anthropic SDK and Vercel AI SDK v6 for chatbot intelligence. Next.js 16 App Router for the web layer with React 19 and TypeScript 5. Supabase Postgres for the RAG knowledge base (full-text search, pgvector-ready) plus conversation and analytics logging. Vercel for deployment (Edge Network, Analytics, Speed Insights). Upstash Redis for serverless-safe rate limiting. Cloudflare Workers for the VerdeX Farm subdomain. LINE Messaging API with Rich Menu, Flex Messages, and LIFF apps for all LINE OA work. Tailwind CSS v4 for styling. Zod for runtime validation at API boundaries. Structured JSON logging for observability. Development is done with Claude Code MAX 20X in a disciplined audit → fix → log pipeline, favoring production-grade systems over demos.",
    metadata: {
      primary_tools: [
        "Claude AI",
        "AI SDK v6",
        "Next.js 16",
        "Supabase",
        "Vercel",
        "Upstash Redis",
        "Cloudflare Workers",
        "LINE Messaging API",
        "Tailwind CSS v4",
      ],
      dev_tools: ["Claude Code MAX 20X", "Vercel MCP", "Supabase CLI"],
      observability: ["Vercel Analytics", "Vercel Speed Insights", "Structured JSON logs"],
      last_updated: "2026-04-17",
    },
  },
  {
    title: "Portfolio Website - This Site",
    category: "project",
    content:
      "This portfolio website is itself a project built by Prempawee. Instead of a traditional portfolio with static pages, visitors interact with an AI chatbot that dynamically presents information — pricing cards, a full portfolio overview, per-project case studies, tech stack, and contact info — through five Anthropic tool-use cards: show_portfolio (breadth-first overview of all 3 projects), show_case_study (deep-dive into VerdeX or NWL CLUB), show_pricing, show_tech_stack, show_contact. Built with Next.js 16, React 19, AI SDK v6, Claude Sonnet with ephemeral prompt caching, Supabase as the RAG knowledge base (5-min in-memory cache), Upstash Redis for rate limiting (in-memory fallback for dev), Vercel Analytics and Speed Insights, PDPA consent banner, error boundaries at segment and global levels, dynamic OG image generation via next/og file convention, structured JSON logging, input validation via Zod, and a static fallback page for offline mode. Supports English and Thai natively. The medium is the message — the portfolio proves I can build production AI chat systems.",
    metadata: {
      tech: [
        "Next.js 16",
        "React 19",
        "AI SDK v6",
        "Claude Sonnet",
        "Supabase pgvector RAG",
        "Upstash Redis",
        "Vercel Analytics",
        "Tailwind CSS v4",
        "Zod",
      ],
      design: "Matrix-inspired, black/white, monospace, dot grid",
      languages: ["English", "Thai"],
      tools_exposed: [
        "show_portfolio",
        "show_case_study",
        "show_pricing",
        "show_tech_stack",
        "show_contact",
      ],
      status: "Hardened infrastructure, preview deployable",
      last_updated: "2026-04-17",
    },
  },
  {
    title: "How many projects has Prempawee completed?",
    category: "faq",
    content:
      "Prempawee has built 3 major projects covering 6 web properties and 1 LINE bot: VerdeX Farm (landing page, blog, owner command center, intelligent LINE bot) = 3 web + 1 LINE bot. NWL CLUB (work tracker, community website) = 2 web. This AI-powered portfolio website = 1 web. Each project demonstrates different capabilities: AI chatbot systems, employee management, community platforms, and a meta-portfolio that itself is a working AI chat. Depth matters more than count — VerdeX Farm alone has 12 iterations across 6 major systems (ordering, stock, farm sensors, AI weekly reports, VIP tracking, automated morning reports).",
    metadata: {
      last_updated: "2026-04-17",
    },
  },
  {
    title: "What infrastructure powers this portfolio?",
    category: "faq",
    content:
      "The portfolio chat API is a Next.js 16 App Router route on Vercel's serverless functions. Incoming requests are rate-limited by IP using Upstash Redis with atomic fixed-window counters (3 sessions per hour in production, bypassed in development). Request bodies pass through Zod schema validation. The system prompt is composed from a base set of rules plus the Supabase knowledge_base RAG content (fetched and cached for 5 minutes per instance). Claude Sonnet streams responses through the AI SDK v6 with ephemeral prompt caching for lower cost. Tool calls map to rich UI cards on the client. Conversations and analytics events are logged to Supabase asynchronously with structured errors. CSP, HSTS, X-Frame-Options, and Permissions-Policy headers are set at the CDN edge. Error boundaries at both segment and global level catch any render failures, and a static fallback page (/fallback) serves the same breadth-first content without the AI when needed.",
    metadata: {
      last_updated: "2026-04-17",
      components: [
        "Vercel Edge Network",
        "Upstash Redis",
        "Supabase Postgres",
        "Anthropic Claude Sonnet",
        "AI SDK v6",
        "Next.js middleware",
        "error.tsx / global-error.tsx",
      ],
    },
  },
  {
    title: "What about NDAs and IP ownership?",
    category: "faq",
    content:
      "Prempawee will sign client-provided NDAs after a 15-minute discovery call. Default IP terms: the client owns all deliverables (source code, designs, documentation) on final payment. Prempawee retains the right to reference the work in his portfolio (project name, technology stack, public-facing screenshots), with any sensitive numbers, client identities, or business-confidential details redacted. If the client requires full confidentiality, this is negotiable but typically affects pricing because it removes the portfolio reference value.",
    metadata: { last_updated: "2026-04-25" },
  },
  {
    title: "What are the payment terms?",
    category: "faq",
    content:
      "Standard payment terms across all three packages: 50% upfront at kickoff, 50% on delivery. Preferred method is PromptPay (THB) for Thai clients; bank transfer is also accepted. Invoices are issued at kickoff and at delivery. International clients can pay via bank transfer in THB equivalent. The 50% upfront covers research, design, and initial build; the 50% on delivery is paid after the staging environment passes client acceptance and before production deploy.",
    metadata: { last_updated: "2026-04-25" },
  },
  {
    title: "What about maintenance after the warranty period?",
    category: "faq",
    content:
      "Each package includes a built-in warranty period: Starter 7 days, Pro 14 days, Enterprise 30 days. After the warranty period ends, ongoing maintenance is available two ways. Ad-hoc rate: 800 THB per hour, billed in 30-minute increments. Monthly retainer: 8,000 THB per month, includes 12 hours of work, with same-business-day response for any reported issue. Hours beyond the retainer are 700 THB per hour. Retainer can be paused or cancelled with 30 days notice. The retainer is the right choice for clients running production systems who want a predictable response SLA; ad-hoc is the right choice for occasional fixes.",
    metadata: { last_updated: "2026-04-25" },
  },
  {
    title: "Does Prempawee accept equity or revenue share instead of cash?",
    category: "faq",
    content:
      "At this stage of the business, Prempawee works on cash-only terms. Equity, revenue share, or other non-cash compensation may be considered case-by-case for unique opportunities — typically projects valued at 200,000 THB equivalent or higher with a clear product-market fit signal. For early-stage startups without funding, the more practical path is usually a smaller-scope cash-paid Starter or Pro package to validate the build before committing to a larger build with non-cash terms.",
    metadata: { last_updated: "2026-04-25" },
  },
  {
    title: "What are the working hours and meeting availability?",
    category: "faq",
    content:
      "Prempawee is based in Chiang Mai and works in Indochina Time (UTC+7). Standard working hours are weekdays, with response time of 2 to 4 hours during working hours for chat, email, and LINE messages. Synchronous video meetings are available for the free 15-minute consultation, kickoff, and major milestone reviews; otherwise the working style is async-first to maximize build time. International clients in EU or US time zones: meetings can be scheduled outside Bangkok working hours by mutual agreement, but day-to-day async communication remains the default.",
    metadata: { last_updated: "2026-04-25" },
  },
  {
    title: "What does the client receive on delivery day?",
    category: "faq",
    content:
      "On delivery day, every package includes the following 8 deliverables: (1) source code repository access on GitHub or as a zipped archive, (2) deployment credentials including hosting login and database access, (3) ENV variable documentation listing every required key with rotation guidance, (4) video tutorial in Thai walking through admin operations and common tasks, (5) written runbook in Markdown format with bilingual sections, (6) signed warranty terms document specifying the warranty window for the purchased package, (7) ongoing support channel via LINE chat or email, and (8) a system architecture diagram showing components and data flow. The Pro and Enterprise packages additionally include 30-minute and 60-minute live training sessions respectively.",
    metadata: { last_updated: "2026-04-25" },
  },
  {
    title: "What language are the deliverables and documentation in?",
    category: "faq",
    content:
      "Source code comments are in English, since the technical stack (TypeScript, React, Supabase, Anthropic SDK) and likely future maintainers expect English. Written documentation is in English with a Thai language summary at the top of each document, so a non-English-reading owner can understand the system at a glance. Video tutorials are recorded in Thai, since the daily operator is most often a Thai-speaking business owner or staff member. The chatbot itself, if part of the project, runs bilingually EN and TH from day one. If the client prefers Thai-only or English-only deliverables, this is configurable at kickoff.",
    metadata: { last_updated: "2026-04-25" },
  },
  {
    title: "When does the timeline start, and what causes delays?",
    category: "faq",
    content:
      "Quoted timelines (Starter 5 days, Pro 14 days, Enterprise 30 days) start from the approved-specification date, not the date of inquiry. The approved-specification milestone happens after the free 15-minute consultation, the requirement form is completed, and Prempawee delivers a flow diagram and Rich Menu wireframes for client approval. Common delay drivers, all flagged at kickoff: LINE OA admin access not granted from the LINE Developers Console adds typically 2 to 3 days, content and copy not provided by client adds 3 to 5 days, mid-project scope changes vary in impact and are quoted as a separate change order. Prempawee will surface delay risk in writing within 24 hours of the cause appearing, so neither side discovers a missed date in the final week.",
    metadata: { last_updated: "2026-04-25" },
  },
  // -------------------------------------------------------------------------
  // HR-reviewed bio refresh (2026-04-26, Session 7).
  // Spec authored by Foreman after Senior HR consultation. Removes
  // credibility risks (no GPA disclosure, no age disclosure, no negative
  // competitor framing). Repositions toward generalism + foundations-first
  // philosophy. The two existing-row edits use the existing titles so
  // upsertEntry() updates by title rather than inserting duplicates.
  // -------------------------------------------------------------------------
  {
    // E1 — edit existing row #1 (matched by title)
    title: "About Prempawee",
    category: "bio",
    content:
      "Prempawee is a One Person Business generalist who ships production AI systems end-to-end from Chiang Mai, Thailand. He graduated in 2026 from the Faculty of Mass Communication at Chiang Mai University, then transitioned into AI-native development with Claude Code as his primary craft. His working principle is simple: reduce weaknesses before adding strengths. Foundations before features, observability before scale. Started as a marketing intern for NWL, a streetwear brand from Bangkok, then grew into managing all digital operations for NWL CLUB. Founded VerdeX Farm, an AI-powered smart greenhouse project. Now builds intelligent LINE OA Chatbot systems, admin dashboards, AI agents, and bilingual systems for Thai businesses. Monthly income goal: 100,000 THB.",
    metadata: {
      education: "Mass Communication, Chiang Mai University, graduated 2026",
      location: "Chiang Mai, Thailand",
      english_level: "B1",
      languages: ["Thai", "English"],
      positioning: "One Person Business generalist",
      last_updated: "2026-04-26",
    },
  },
  {
    // E2 — edit existing row #16 (matched by title)
    title: "What makes Prempawee different from other chatbot developers?",
    category: "faq",
    content:
      "Four things set Prempawee apart from typical AI freelancers. First, foundations-first delivery — production-grade infrastructure, observability, and security ship before features. Maintenance is built-in, not retrofitted. Second, generalist breadth — as a One Person Business, he ships end-to-end across web apps, admin dashboards, IoT integrations, AI agents, and chatbots. No vendor coordination overhead, no integration gaps. Third, bilingual EN/TH delivery — Thai prompts that sound natural to Thai users, English documentation for international stakeholders, clean code-switching in production systems. Fourth, communication training — a Mass Communication background means project documentation, prompt design, and client conversations are treated as part of the engineering deliverable. LINE OA chatbots are one example among several surfaces he ships — the published packages are named around them because that's the most common request from Thai SMEs.",
    metadata: { last_updated: "2026-04-26" },
  },
  {
    // A1
    title: "Work Philosophy",
    category: "bio",
    content:
      "Prempawee's work philosophy is direct: reduce weaknesses before adding strengths. Foundations first, features second. Production-grade infrastructure ships before scale, observability before growth, maintenance built-in — never retrofitted. Rooted in Stoic discipline: no shortcuts, no silent failures. Adapted from how Prempawee runs his own portfolio site (production-grade security headers, RAG with grounding rules, full E2E test gates, audit log of every silent failure).",
    metadata: { last_updated: "2026-04-26" },
  },
  {
    // A2
    title: "Generalism over specialism",
    category: "bio",
    content:
      "Prempawee operates as a One Person Business generalist, not a single-surface specialist. He works end-to-end across LINE OA chatbots, admin dashboards, AI agents, IoT integrations, RAG systems, full-stack web apps, and bilingual Thai/English systems. The reasoning: a One Person Business with strong foundations can ship across surfaces faster than a multi-vendor team can coordinate — no hand-offs, no integration friction, no scope gaps between vendors.",
    metadata: { last_updated: "2026-04-26" },
  },
  {
    // A3
    title: "Mass Communication × AI — why the combo matters",
    category: "bio",
    content:
      "Prempawee graduated in 2026 from the Faculty of Mass Communication at Chiang Mai University — an unusual background for an AI developer. The combination shows up directly in delivery: Thai prompts in his chatbots sound like natural Thai speech, system prompts handle Thai-English code-switching cleanly, and project documentation is written so that non-technical owners can actually read it. Communication is treated as part of the engineering deliverable, not an afterthought.",
    metadata: { last_updated: "2026-04-26" },
  },
  {
    // A4
    title: "Personal values",
    category: "bio",
    content:
      "Prempawee values reading, writing, and Stoic discipline alongside building. In delivery, this translates to full ownership of the entire stack — design, infrastructure, code, observability, and post-launch maintenance all sit with one person. No hand-offs, no \"that's not my responsibility\" moments, no missing accountability between vendors.",
    metadata: { last_updated: "2026-04-26" },
  },
  {
    // A5
    title: "Are you only good at LINE OA chatbots?",
    category: "faq",
    content:
      "No. LINE OA chatbots are one of several surfaces Prempawee ships across. He delivers end-to-end on web apps (Next.js, Cloudflare Workers), admin dashboards (Supabase, real-time data), IoT integrations (sensors, MQTT), AI agents (Claude tool-use, RAG), and bilingual Thai/English systems. The published packages are named around chatbots because that's the most common request from Thai SMEs — but custom scopes are quoted on a per-project basis.",
    metadata: { last_updated: "2026-04-26" },
  },
];

/**
 * Upsert by title. Selects the existing row if present; updates it.
 * Otherwise inserts a new row. Avoids relying on the identity primary key.
 */
async function upsertEntry(entry) {
  const { title, category, content, metadata } = entry;

  const { data: existing, error: selectErr } = await supabase
    .from("knowledge_base")
    .select("id, title")
    .eq("title", title)
    .limit(1)
    .maybeSingle();

  if (selectErr) {
    throw new Error(`select ${title}: ${selectErr.message}`);
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from("knowledge_base")
      .update({ category, content, metadata, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (updateErr) {
      throw new Error(`update ${title}: ${updateErr.message}`);
    }
    return { title, action: "updated", id: existing.id };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("knowledge_base")
    .insert({ category, title, content, metadata })
    .select("id")
    .single();
  if (insertErr) {
    throw new Error(`insert ${title}: ${insertErr.message}`);
  }
  return { title, action: "inserted", id: inserted.id };
}

async function main() {
  const results = [];
  for (const entry of ENTRIES) {
    try {
      const result = await upsertEntry(entry);
      results.push(result);
      console.log(
        JSON.stringify({
          level: "info",
          message: "refresh-kb.entry",
          ...result,
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          level: "error",
          message: "refresh-kb.entry.failed",
          title: entry.title,
          error: message,
        }),
      );
      process.exitCode = 1;
    }
  }

  const updated = results.filter((r) => r.action === "updated").length;
  const inserted = results.filter((r) => r.action === "inserted").length;
  console.log(
    JSON.stringify({
      level: "info",
      message: "refresh-kb.complete",
      total: ENTRIES.length,
      updated,
      inserted,
    }),
  );
}

await main();
