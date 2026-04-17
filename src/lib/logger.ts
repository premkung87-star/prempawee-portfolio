// Structured JSON logger. One log line per call, emitted to the appropriate
// console method so Vercel log drains (and `vercel logs`) pick up the level
// correctly. All fields are JSON-serializable — pass primitive / plain-object
// metadata only. Circular references are stripped defensively.
//
// ALSO: logError() forwards to Sentry when SENTRY_DSN is configured.
// When DSN is unset, Sentry import is a no-op (see sentry.*.config.ts).

import * as Sentry from "@sentry/nextjs";

type Level = "info" | "warn" | "error";

type Metadata = Record<string, unknown>;

interface LogLine {
  timestamp: string;
  level: Level;
  message: string;
  [key: string]: unknown;
}

function safeStringify(obj: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }
    if (typeof value === "object" && value !== null) {
      if (seen.has(value as object)) return "[Circular]";
      seen.add(value as object);
    }
    return value;
  });
}

function emit(level: Level, message: string, metadata?: Metadata): void {
  const line: LogLine = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata ?? {}),
  };

  const payload = safeStringify(line);

  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}

export function logInfo(message: string, metadata?: Metadata): void {
  emit("info", message, metadata);
}

export function logWarn(message: string, metadata?: Metadata): void {
  emit("warn", message, metadata);
}

export function logError(message: string, metadata?: Metadata): void {
  emit("error", message, metadata);

  // Forward to Sentry when configured. When SENTRY_DSN is unset, Sentry.init
  // in sentry.*.config.ts is a no-op, so these calls are cheap and safe.
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    try {
      const errCandidate = metadata?.error;
      if (errCandidate instanceof Error) {
        Sentry.captureException(errCandidate, {
          tags: { message },
          extra: metadata,
        });
      } else {
        Sentry.captureMessage(message, {
          level: "error",
          extra: metadata,
        });
      }
    } catch {
      // Never let Sentry failures break the caller
    }
  }
}
