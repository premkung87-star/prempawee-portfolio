import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow, disallow sensitive paths
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      // LLM crawlers — explicitly allow root so the site can be cited
      // when Thai buyers ask ChatGPT/Claude/Perplexity "who builds LINE
      // OA chatbots in Thailand?" Disallow admin/api same as above.
      { userAgent: "GPTBot", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "anthropic-ai", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "Perplexity-User", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "Applebot-Extended", allow: "/", disallow: ["/api/", "/admin/"] },
      { userAgent: "CCBot", allow: "/", disallow: ["/api/", "/admin/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
