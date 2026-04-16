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
