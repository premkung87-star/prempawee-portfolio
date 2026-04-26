// Shared types for the feedback feature. The `FeedbackType` literal union
// must stay in sync with the `feedback_type` Postgres enum in
// migrations/003_feedback.sql. Validation pivots on this union both
// client-side (FeedbackForm) and server-side (Zod schema in route.ts).

export const FEEDBACK_TYPES = [
  "bug",
  "suggestion",
  "thanks",
  "other",
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/** Wire shape: what the client POSTs to /api/feedback. */
export interface FeedbackPayload {
  type: FeedbackType;
  body: string;
  email?: string;
  /** Honeypot. Real clients leave this empty/undefined; bots populate it. */
  website?: string;
}

/** Server response shape (discriminated union). */
export type FeedbackResponse =
  | { ok: true; id: number }
  | { ok: false; error: "validation"; issues?: unknown }
  | { ok: false; error: "rate_limited" }
  | { ok: false; error: "server" };
