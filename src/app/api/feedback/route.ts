// POST /api/feedback — visitor feedback capture from the prempawee.com
// footer form. Mirrors /api/leads/route.ts patterns: nodejs runtime,
// Zod validation, service-role insert, awaited webhook (no fire-and-forget
// per AUDIT_LOG §08/§19/§36).
//
// Spec: docs/superpowers/specs/2026-04-26-feedback-button-design.md
// Plan: docs/superpowers/plans/2026-04-26-feedback-button-pr-a.md

import { NextResponse } from "next/server";
import { z } from "zod";
import { insertFeedback } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { FEEDBACK_TYPES } from "@/lib/feedback-types";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  body: z.string().trim().min(1, "Body is required.").max(4000),
  email: z
    .union([z.literal(""), z.string().trim().email().max(254)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  // Honeypot: real clients leave this empty; bots populate it. If non-empty
  // we silently 200 OK without inserting anything.
  website: z.string().optional(),
});

/** Truncate IP for privacy — IPv4 to /24, IPv6 to /64. Never store the
 *  full address. Mirrors the privacy posture of the leads table (which
 *  doesn't store IPs at all — feedback stores a truncated version because
 *  the rate-limit forensics value is higher for unauthenticated form
 *  submissions). */
function truncateIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":");
  }
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip.slice(0, 64);
}

async function notifyNewFeedback(payload: unknown) {
  const url = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "feedback.captured",
        source: "api/feedback",
        timestamp: new Date().toISOString(),
        payload,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    logWarn("notify.feedback.webhook.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipPrefix = truncateIp(ip);

  // 1. Rate limit (shared bucket with /api/chat — see rate-limit.ts).
  const { allowed, remaining, resetAt } = await rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests from your network. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(resetAt),
        },
      },
    );
  }

  // 2. Parse JSON
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON in request body." },
      { status: 400 },
    );
  }

  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    logWarn("feedback.bad-request", {
      issues: parsed.error.issues.slice(0, 5),
    });
    return NextResponse.json(
      {
        error: "Invalid feedback payload.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // 3. Honeypot — silently 200 without inserting if filled.
  if (parsed.data.website && parsed.data.website.trim() !== "") {
    logInfo("feedback.honeypot.tripped", { ip_prefix: ipPrefix });
    return NextResponse.json({ ok: true, id: -1 }, { status: 200 });
  }

  // 4. Insert
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const referer = req.headers.get("referer")?.slice(0, 2048) ?? null;
  const result = await insertFeedback({
    type: parsed.data.type,
    body: parsed.data.body,
    email: parsed.data.email ?? null,
    page_url: referer,
    user_agent: userAgent,
    ip_prefix: ipPrefix,
  });

  if (!result.ok) {
    logError("feedback.insert.failed", { error: result.error });
    return NextResponse.json(
      { error: "Failed to save feedback. Please email Prempawee directly." },
      { status: 500 },
    );
  }

  // 5. Notify (awaited per §08/§19/§36 — every promise inside the handler
  //    is either awaited before return or wrapped in ctx.waitUntil).
  await notifyNewFeedback({
    id: result.id,
    type: parsed.data.type,
    body: parsed.data.body,
    email: parsed.data.email ?? null,
  });

  logInfo("feedback.captured", {
    id: result.id,
    type: parsed.data.type,
  });

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
