<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:browser-verification-mandate -->
# Browser verification is mandatory for security/render-path changes

**Rule:** Any change touching the files below MUST pass `npm run test:e2e` locally AND in CI before merge. Curl + response headers + Supabase row counts do NOT prove React hydrated. Only a real browser click does.

**Files on the watchlist:**
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/proxy.ts` / `src/middleware.ts` (whichever is active)
- `src/components/chat.tsx`
- `next.config.ts` — ANY change to `experimental.*` flags
- Any CSP directive change

**Why:** `AUDIT_LOG.md §17` + `§20` documented two separate incidents where SSR HTML + 200 status + A+ security grades + 148 logged "conversations" all LIED — the site appeared healthy by every indirect signal while real users couldn't click a single button. Both regressions would have been caught in under 60 seconds by a headless browser clicking the consent button.

**Quick local check before any such commit:**
```bash
BASE_URL=https://prempawee.com npx playwright test
```
Or for a preview URL:
```bash
BASE_URL=https://prempawee-portfolio-<sha>.vercel.app npx playwright test
```

CI runs the same suite automatically on push-to-main via `.github/workflows/ci.yml` → `e2e` job.

**Never enable `experimental.sri` in `next.config.ts` on this project.** See `AUDIT_LOG §20` + [vercel/next.js#91633](https://github.com/vercel/next.js/issues/91633). The Vercel CDN re-encodes (Brotli/gzip) responses AFTER build-time hashing, invalidating every integrity attribute. Browsers silently refuse to execute the client runtime chunk → no hydration → fully broken site with zero error output. Revisit only after #91633 closes AND a real-browser test passes on a canary deploy.
<!-- END:browser-verification-mandate -->
