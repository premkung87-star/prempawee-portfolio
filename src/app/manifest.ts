import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PREMPAWEE // AI — LINE OA Chatbot Developer",
    short_name: "Prempawee AI",
    description:
      "AI-powered portfolio for Prempawee's LINE OA Chatbot development services.",
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
