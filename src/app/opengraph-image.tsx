import { ImageResponse } from "next/og";

export const alt = "PREMPAWEE // AI — Solo AI Developer / Chiang Mai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// OG image content is stable per-deploy — cache at the edge for a year.
// Invalidates automatically on new deploy because the filename fingerprint changes.
export const revalidate = 31536000;

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 112,
            fontWeight: 700,
            letterSpacing: "-2px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#ffffff" }}>PREMPAWEE</span>
          <span style={{ color: "#666666", margin: "0 24px" }}>{"//"}</span>
          <span style={{ color: "#ffffff" }}>AI</span>
        </div>

        <div
          style={{
            marginTop: 32,
            fontSize: 28,
            color: "#888888",
            letterSpacing: "4px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Solo AI Developer
        </div>
      </div>
    ),
    { ...size },
  );
}
