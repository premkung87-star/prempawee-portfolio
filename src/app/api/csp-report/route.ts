// CSP violation receiver. Without this, browser-side CSP blocks (integrity
// mismatches, inline-script violations, etc.) only show up in the visitor's
// devtools console — completely invisible to us. Reporting them back here
// + logging at warn level means /admin/finops or Sentry will surface them.
//
// Wired via `report-to` / `report-uri` directives in src/proxy.ts CSP. See
// AUDIT_LOG §20 — had this existed during the 2026-04-17 A+ rollout, the
// integrity-mismatch root cause would have surfaced in minutes, not hours.

import { NextResponse } from "next/server";
import { logWarn } from "@/lib/logger";

export const runtime = "edge";

// Accepts both CSP level-2 (application/csp-report) and level-3 (application/
// reports+json, a batch array). Both shapes are logged with a normalized key.
export async function POST(req: Request): Promise<Response> {
  try {
    const ct = req.headers.get("content-type") ?? "";
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "empty_body" }, { status: 400 });
    }

    const reports = Array.isArray(body)
      ? body
      : body["csp-report"]
        ? [{ type: "csp-violation", body: body["csp-report"] }]
        : [body];

    for (const r of reports) {
      const payload = (r && r.body) || r;
      logWarn("csp.violation", {
        documentURI: payload?.["document-uri"] ?? payload?.documentURL,
        blockedURI: payload?.["blocked-uri"] ?? payload?.blockedURL,
        violatedDirective:
          payload?.["violated-directive"] ?? payload?.effectiveDirective,
        originalPolicy: String(payload?.["original-policy"] ?? "").slice(0, 300),
        sourceFile: payload?.["source-file"] ?? payload?.sourceFile,
        lineNumber: payload?.["line-number"] ?? payload?.lineNumber,
        disposition: payload?.disposition,
        ct: ct.slice(0, 80),
      });
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (err) {
    logWarn("csp.report.parse.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "parse_error" }, { status: 400 });
  }
}
