---
platform: Twitter (X)
audience: Dev Twitter — international, technical, skeptical, appreciates specifics
length: 5 tweets, each <= 280 chars
est_read_seconds: 60
post_when: 2026-04-26 12:00 Asia/Bangkok (Sunday hard launch)
---

<!-- Char counts measured manually; verify with a tweet-length checker before posting. -->

[1/5] (271 chars)

Just launched prempawee.com — a portfolio that's also an AI chatbot you can interrogate.

Solo One Person Business based in Chiang Mai. Early in the business — but the systems are real, deployed, instrumented.

The medium is the message. Thread on the stack ↓

---

[2/5] (276 chars)

The chat is grounded by a hard rule: it can only quote facts that appear verbatim in a Supabase RAG knowledge base. No hallucinated metrics, no fake testimonials.

If it doesn't know, it says so and offers to take your contact.

Claude Opus + Sonnet via AI SDK v6.

---

[3/5] (272 chars)

Edge runtime everywhere. Per-request CSP nonce + strict-dynamic at the edge proxy. Upstash Redis rate limiting per-IP. Supabase RLS on every table (conversations, leads, analytics). HSTS preload. PDPA consent banner.

Solo build, instrumented from day 1.

---

[4/5] (266 chars)

What's shipped: 3 projects, 6 web properties, 1 LINE bot.

VerdeX Farm — solo-built smart greenhouse for sweet basil DWC hydroponics. 12 iterations, 6 subsystems incl. 07:00 daily morning report + Claude Opus weekly pulse.

prempawee.com/case-studies/verdex

---

[5/5] (211 chars)

Three packages, fixed scope:
• LINE OA Starter ฿5,000 / 5d
• Smart Chatbot Pro ฿18,000 / 14d
• Enterprise AI ฿45,000 / 30d

Talk to the site, ask it anything, then talk to me.

https://prempawee.com

<!-- src: "Solo One Person Business" — src/app/api/chat/route.ts:49; supabase-seed.sql:11 -->
<!-- src: "Chiang Mai" — src/lib/portfolio-data.ts:607 (TRUST_FACTS) -->
<!-- src: "early in the business" — src/app/api/chat/route.ts:82 -->
<!-- src: GROUNDING RULE behavior (verbatim KB only, no fake testimonials) — src/app/api/chat/route.ts:51-58 -->
<!-- src: Supabase RAG — src/lib/portfolio-data.ts:357,361; scripts/refresh-knowledge-base.mjs:36-37 -->
<!-- src: Claude Opus + Sonnet — src/lib/portfolio-data.ts:610 (TRUST_FACTS.stack) -->
<!-- src: AI SDK v6 — src/lib/portfolio-data.ts:355; package.json:32 -->
<!-- src: Edge runtime — src/app/api/chat/route.ts:25 -->
<!-- src: CSP nonce + strict-dynamic at edge proxy — src/lib/portfolio-data.ts:379,488 -->
<!-- src: Upstash Redis rate limiting per-IP — src/lib/portfolio-data.ts:90,504 -->
<!-- src: Supabase RLS on conversations/leads/analytics — src/lib/portfolio-data.ts:512 -->
<!-- src: HSTS preload — src/lib/portfolio-data.ts:496 -->
<!-- src: PDPA consent banner — src/lib/portfolio-data.ts:361 -->
<!-- src: 3 projects / 6 web / 1 LINE bot — src/lib/portfolio-data.ts:561-565; src/app/api/chat/route.ts:72 -->
<!-- src: VerdeX = sweet basil DWC hydroponics — src/lib/portfolio-data.ts:101,132 -->
<!-- src: 12 iterations / 6 subsystems — src/lib/portfolio-data.ts:101,148,124,158 -->
<!-- src: 07:00 morning report — src/lib/portfolio-data.ts:175,178 -->
<!-- src: Claude Opus weekly pulse — src/lib/portfolio-data.ts:142 -->
<!-- src: ฿5,000 / 5d, ฿18,000 / 14d, ฿45,000 / 30d — src/lib/portfolio-data.ts:38-70 -->
<!-- src: case-study URL pattern — src/app/case-studies/[slug]/page.tsx routing per CLAUDE.md "Case Study Pattern" -->
