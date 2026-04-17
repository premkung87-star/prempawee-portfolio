// Single source of truth for the canonical site URL. Consumed by layout
// metadata, sitemap, robots, and anywhere else that hardcodes the domain.
// Default is the production domain — the env override exists for
// localhost dev and preview URLs only.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://prempawee.com";
