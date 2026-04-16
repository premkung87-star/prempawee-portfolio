"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "error.boundary.global",
        digest: error.digest,
        errorMessage: error.message,
        stack: error.stack,
      }),
    );
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#0a0a0a",
          color: "#e0e0e0",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            PREMPAWEE <span style={{ color: "#666" }}>{"// AI"}</span>
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>Fatal</div>
        </header>

        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
          }}
        >
          <div style={{ maxWidth: 600, width: "100%" }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: 12,
              }}
            >
              PREMPAWEE AI // FATAL
            </div>
            <h1
              style={{
                fontSize: 28,
                color: "#fff",
                fontWeight: 500,
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              The app crashed.
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "#ccc",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Something broke outside the chat surface. Retrying reloads the
              shell.
            </p>

            {error.digest ? (
              <div style={{ fontSize: 11, color: "#888", marginBottom: 24 }}>
                digest: <span style={{ color: "#aaa" }}>{error.digest}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 16px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                color: "#fff",
                fontSize: 14,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#888" }}>&gt;</span>
              <span>retry</span>
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
