// POST /api/leads — direct-form lead capture (complement to the
// `capture_lead` Anthropic tool in /api/chat). Used if we ever add a
// non-chat contact surface (sidebar form, LINE widget callback, etc.).
//
// Zod-validates the body, applies the same constraints as the DB layer,
// inserts via service-role (bypasses the public insert policy which is
// fine — we control the validation here), and fires a notification
// webhook if NOTIFICATION_WEBHOOK_URL is set.

import { NextResponse } from "next/server";
import { z } from "zod";
import { insertLead } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logError, logInfo, logWarn } from "@/lib/logger";

export const runtime = "nodejs";

const leadSchema = z
  .object({
    name: z.string().max(200).optional(),
    email: z.string().email().max(320).optional(),
    line_id: z.string().max(100).optional(),
    business_type: z.string().max(100).optional(),
    package_interest: z.enum(["starter", "pro", "enterprise"]).optional(),
    message: z.string().max(2000).optional(),
    source: z.string().max(100).optional(),
  })
  .refine((v) => v.email || v.line_id, {
    message: "At least one of `email` or `line_id` is required.",
  });

async function notifyNewLead(payload: unknown) {
  const url = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "lead.captured",
        source: "api/leads",
        timestamp: new Date().toISOString(),
        payload,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    logWarn("notify.webhook.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON in request body." },
      { status: 400 },
    );
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    logWarn("leads.bad-request", { issues: parsed.error.issues.slice(0, 5) });
    return NextResponse.json(
      {
        error: "Invalid lead payload.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const result = await insertLead({
    name: parsed.data.name ?? null,
    email: parsed.data.email ?? null,
    line_id: parsed.data.line_id ?? null,
    business_type: parsed.data.business_type ?? null,
    package_interest: parsed.data.package_interest ?? null,
    message: parsed.data.message ?? null,
    source: parsed.data.source ?? "direct_form",
  });

  if (!result.ok) {
    logError("leads.insert.failed", { error: result.error });
    return NextResponse.json(
      { error: "Failed to save lead. Please contact Prempawee directly." },
      { status: 500 },
    );
  }

  notifyNewLead({ id: result.id, ...parsed.data });
  logInfo("leads.captured", {
    id: result.id,
    package_interest: parsed.data.package_interest,
    source: parsed.data.source ?? "direct_form",
  });

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
