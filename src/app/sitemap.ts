import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // hreflang alternates: Thai locale served on the same route via client
  // toggle; declaring alternates helps Google surface to Thai searchers.
  const alternates = {
    languages: {
      en: SITE_URL,
      th: `${SITE_URL}/?lang=th`,
      "x-default": SITE_URL,
    },
  };
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates,
    },
    {
      url: `${SITE_URL}/fallback`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates,
    },
    {
      url: `${SITE_URL}/status`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.3,
    },
  ];
}
