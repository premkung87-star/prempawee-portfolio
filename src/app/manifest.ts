import type { MetadataRoute } from "next";

// Cache the manifest for a year — it's stable per-deploy.
export const revalidate = 31536000;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PREMPAWEE // AI — Solo AI Developer / Chiang Mai",
    short_name: "Prempawee AI",
    description:
      "AI-powered portfolio for Prempawee — Solo AI Developer in Chiang Mai shipping production systems.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
