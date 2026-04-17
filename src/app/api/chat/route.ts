import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { z } from "zod";
import {
  getAllKnowledge,
  formatKnowledgeForPrompt,
  logConversation,
  logAnalytics,
} from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logError, logInfo, logWarn } from "@/lib/logger";

// UI message schema from the client (AI SDK v6 shape).
// We validate each element defensively before passing to convertToModelMessages.
const uiPartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

const uiMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(["user", "assistant", "system"]),
    parts: z.array(uiPartSchema),
  })
  .passthrough();

const uiMessagesSchema = z.array(uiMessageSchema).min(1).max(100);

export const maxDuration = 30;

const baseSystemPrompt = `You are Prempawee's portfolio AI. You represent a One Person Business that builds intelligent LINE OA Chatbots for Thai businesses.

BEHAVIOR RULES:
- Respond in whatever language the visitor uses. If they write Thai, respond in Thai. If English, respond in English.
- Be professional, knowledgeable, and direct.
- Aim for roughly 90% information and 10% persuasion — favor specifics (technologies, components, live URLs, iteration counts) over generic claims.
- Keep responses concise. Let the conversation flow naturally.
- Never make up client names or fake testimonials.
- Do NOT use emojis in responses.

TOOL USAGE — CRITICAL:
- When a visitor asks about portfolio, work, past projects, examples, or "what have you built" in ANY language — including Thai phrases like "ผลงาน", "มีผลงานอะไรบ้าง", "นายมีผลงานอะไร", "เคยทำอะไรมา", "ตัวอย่างงาน", "โปรเจกต์ของคุณ" — ALWAYS call show_portfolio FIRST. It displays the full breadth: 3 projects, 6 web properties, 1 LINE bot. Never lead with a single case study for a general portfolio question.
- Call show_case_study ONLY when the visitor asks for deep detail on a SPECIFIC project by name (e.g., "tell me more about VerdeX", "เล่าเรื่อง VerdeX", "what did you build for NWL?", "โปรเจกต์ NWL เป็นยังไง"). Pass project="verdex" or project="nwl_club". There is NO deep-dive card for this portfolio site itself — if asked about it, answer conversationally without a tool call.
- Call show_pricing for cost/rates/packages questions. Call show_tech_stack for technical or architecture questions. Call show_contact when they want to get in touch.
- Prefer a single relevant tool call per turn. Do not stack tools.

HANDLING EDGE CASES:
- If a visitor still expresses doubt after seeing the portfolio overview, emphasize DEPTH with specifics: VerdeX Farm has 12 iterations across 6 major systems (ordering, stock, farm sensors, AI weekly reports, VIP tracking, automated morning reports).
- Do not validate negative framing like "only one?" or "not much?" — the overview already answers it. Stay calm and factual; point to the live URLs.
- Prempawee is early in the business. State this honestly if asked; do not inflate claims.

CONTACT INFO:
- LINE: Prempawee (personal LINE)
- Email: prempaweet20@gmail.com
- LinkedIn: linkedin.com/in/prempawee
- Fastwork: for ordering packages directly

IMPORTANT: The knowledge base below is your source of truth. All information about Prempawee's projects, skills, packages, and background comes from this database. Do not invent details beyond what is provided.`;

// Cache knowledge base for 5 minutes to reduce DB calls
let knowledgeCache: { data: string; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getKnowledgeContext(): Promise<string> {
  const now = Date.now();
  if (knowledgeCache && now - knowledgeCache.timestamp < CACHE_TTL) {
    return knowledgeCache.data;
  }

  const entries = await getAllKnowledge();
  const formatted = formatKnowledgeForPrompt(entries);
  knowledgeCache = { data: formatted, timestamp: now };
  return formatted;
}

export async function POST(req: Request) {
  const requestStart = Date.now();
  const ip = getClientIp(req);

  // Rate limit by client IP (async — Upstash call with in-memory fallback)
  const { allowed, remaining, resetAt } = await rateLimit(ip);

  if (!allowed) {
    logWarn("chat.rate-limited", { ip, resetAt });
    return new Response(
      JSON.stringify({
        error:
          "Too many requests from your network. Please try again later, or reach out on LINE / email.",
        resetAt,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(resetAt),
        },
      },
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Malformed JSON in request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Validate shape
  const parsed = uiMessagesSchema.safeParse(
    (body as { messages?: unknown })?.messages,
  );
  if (!parsed.success) {
    logWarn("chat.bad-request", {
      ip,
      issues: parsed.error.issues.slice(0, 5),
    });
    return new Response(
      JSON.stringify({
        error: "Invalid request: 'messages' array failed validation.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const uiMessages = parsed.data;

  // zod validated the shape at runtime; the AI-SDK type is nominally stricter
  // (it enumerates every valid tool-part variant). Widen via unknown is the
  // intended pattern here.
  const messages = await convertToModelMessages(
    uiMessages as unknown as Parameters<typeof convertToModelMessages>[0],
  );

  // Load knowledge base from Supabase
  const knowledgeContext = await getKnowledgeContext();

  // Build the full system prompt: base rules + knowledge from DB
  const systemPrompt = knowledgeContext
    ? `${baseSystemPrompt}\n\n--- KNOWLEDGE BASE (from database) ---\n\n${knowledgeContext}`
    : baseSystemPrompt;

  // Log the user's message (non-blocking)
  // Validate session ID: max 64 chars, alphanumeric + hyphens only
  const rawSessionId = req.headers.get("x-session-id") || "";
  const SESSION_ID_RE = /^[a-zA-Z0-9-]{1,64}$/;
  const sessionId = SESSION_ID_RE.test(rawSessionId)
    ? rawSessionId
    : `server-${Date.now()}`;
  const userMessages = uiMessages.filter((m) => m.role === "user");
  if (userMessages.length > 0) {
    const lastMsg = userMessages[userMessages.length - 1];
    const parts = Array.isArray(lastMsg.parts) ? lastMsg.parts : [];
    const textPart = parts.find((p) => p.type === "text");
    const text =
      textPart && typeof textPart.text === "string" ? textPart.text : "";
    logConversation(sessionId, "user", text).catch((err) =>
      logError("chat.log.conversation.failed", {
        error: err instanceof Error ? err : { message: String(err) },
      }),
    );
    logAnalytics("chat_message", { role: "user" }, sessionId).catch((err) =>
      logError("chat.log.analytics.failed", {
        error: err instanceof Error ? err : { message: String(err) },
      }),
    );
  }

  logInfo("chat.request.accepted", {
    ip,
    sessionId,
    remaining,
    msgCount: uiMessages.length,
  });

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
    stopWhen: stepCountIs(3),
    tools: {
      show_pricing: tool({
        description:
          "Show pricing packages when visitor asks about cost, pricing, packages, or what services are available",
        inputSchema: z.object({
          highlight: z
            .enum(["starter", "pro", "enterprise"])
            .optional()
            .describe("Which package to highlight as recommended"),
        }),
        execute: async ({ highlight }) => {
          return { displayed: "pricing", highlight: highlight || "all" };
        },
      }),
      show_portfolio: tool({
        description:
          "Show the FULL portfolio overview — all 3 projects (VerdeX Farm, NWL CLUB, this Portfolio) with components, live URLs, tech stacks, and depth. USE THIS FIRST whenever the visitor asks about work, portfolio, past projects, examples, or 'what have you built' in ANY language (English or Thai — e.g. 'ผลงาน', 'มีผลงานอะไรบ้าง', 'นายมีผลงานอะไร', 'เคยทำอะไรมา', 'ตัวอย่างงาน'). Do not lead with a single case study for a general portfolio question.",
        inputSchema: z.object({
          _unused: z
            .string()
            .optional()
            .describe("Leave empty — this tool takes no arguments"),
        }),
        execute: async () => {
          return { displayed: "portfolio_overview" };
        },
      }),
      show_case_study: tool({
        description:
          "Show a DEEP-DIVE case study for ONE specific project by name. Call this ONLY when the visitor explicitly asks about a specific project (e.g. 'tell me more about VerdeX', 'เล่าเรื่อง VerdeX', 'what did you build for NWL?', 'โปรเจกต์ NWL เป็นยังไง'). For general portfolio questions use show_portfolio instead. There is NO deep-dive card for this portfolio site itself — if asked about it, answer conversationally without this tool.",
        inputSchema: z.object({
          project: z
            .enum(["verdex", "nwl_club"])
            .optional()
            .describe(
              "Which project to deep-dive: 'verdex' = VerdeX Farm (AI smart greenhouse, sweet basil, Chiang Mai); 'nwl_club' = NWL CLUB (Bangkok streetwear brand, 2 production sites). Defaults to 'verdex' if omitted."
            ),
        }),
        execute: async ({ project }) => {
          return { displayed: "case_study", project: project ?? "verdex" };
        },
      }),
      show_tech_stack: tool({
        description:
          "Show the technology stack when a developer or agency asks about technical capabilities, tools, or architecture",
        inputSchema: z.object({
          _unused: z.string().optional().describe("Not used"),
        }),
        execute: async () => {
          return { displayed: "tech_stack" };
        },
      }),
      show_contact: tool({
        description:
          "Show contact information when visitor is ready to hire, wants to get in touch, start a project, or asks how to reach Prempawee",
        inputSchema: z.object({
          _unused: z.string().optional().describe("Not used"),
        }),
        execute: async () => {
          return { displayed: "contact" };
        },
      }),
    },
  });

  const response = result.toUIMessageStreamResponse({
    headers: {
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(resetAt),
    },
  });

  logInfo("chat.response.started", {
    sessionId,
    durationMs: Date.now() - requestStart,
  });

  return response;
}
