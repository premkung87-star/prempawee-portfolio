---
number: 6
title: "Browser Verification Is The Only Valid Success Signal For Render-Path Changes"
tags: [BROWSER_E2E, NEXTJS]
applies_to: [nextjs-vercel-supabase, generic]
universal: true
source: prempawee KARPATHY.md §6
incident_refs: [AUDIT_LOG §20]
added_in_kit: 1.0.0
---

# 6. Browser Verification Is The Only Valid Success Signal For Render-Path Changes

## Verbatim from Source

**Build passing, TypeScript passing, 200 OK, logs accumulating — none of these prove the page works.**

Signal hierarchy (from weakest to strongest):
```
npm run build ✓        ← weak (compile only)
npm run typecheck ✓    ← weak (types only)
Deploy successful      ← weak (upload only)
200 OK response        ← weak (SSR only, not hydration)
Supabase rows growing  ← weak (may be bots)
Playwright click ✓     ← STRONG (real browser)
Real user completes flow ← STRONGEST
```

**Rule:** For any change touching a watchlist file (see AGENTS.md), the minimum valid verification is:
```bash
BASE_URL=http://localhost:3000 npm run test:e2e
```

Followed by the same command against Vercel preview URL after deploy.

**Why:** AUDIT_LOG §20 documented a case where 4 "success" signals all lied simultaneously. Site appeared healthy by every indirect measure. 148 "conversations" logged. Mozilla A+. Zero errors in Sentry. Users couldn't click a single button because React hydration silently gave up.

**Counterintuitive corollary:** If Sentry is quiet, that's **not** evidence nothing is broken. Silent breakage is the default failure mode of hydration bugs.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Indirect signals (compile success, HTTP 200, logs accumulating, security grades) do not prove a user-facing feature works. Only simulating what a user does in the runtime they actually encounter proves it.

**When to apply:** Any change that touches the user-interactive render path — pages that require client-side JavaScript, reactive UI, hydration, event handlers, form submissions. The risk multiplier is highest when the change is invisible to server-only checks.

**How to apply (stack-agnostic):**
- Rank verification signals by distance from real user behavior: compile < type check < response code < log row < automated browser click < real user flow.
- For render-path changes, the minimum bar is automated browser verification in a real DOM runtime.
- Silent breakage (no error, no warning, no log) is a normal failure mode, not an edge case. Absence of errors is not presence of success.
- Build the browser-level regression check BEFORE the feature, so the verification signal exists the moment it's needed.

**Stack-specific manifestations:**
- **nextjs-vercel-supabase:** Playwright E2E against `BASE_URL=http://localhost:3000` AND against the Vercel preview URL after deploy. Required for any change to layout, page, proxy/middleware, chat components, next.config experimental flags, or CSP directives.
- **generic:** Any UI project benefits from real-browser automation (Playwright, Cypress, WebDriverIO) on user-facing routes. Headless-browser + user simulation is the minimum valid verification for interactive UI.
