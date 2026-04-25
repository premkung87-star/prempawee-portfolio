---
platform: LinkedIn
audience: Mixed Thai + English-speaking professionals, hiring managers, fellow developers
length: ~600 words total (EN + TH co-equal sections)
est_read_seconds: 180
post_when: 2026-04-26 12:00 Asia/Bangkok (Sunday hard launch)
---

## EN

Today I'm launching prempawee.com — and the launch is the proof.

The site is itself the case study. Instead of a static gallery of screenshots, the portfolio is an AI chatbot you actually talk to. It runs on Claude Opus + Sonnet through the Vercel AI SDK v6, retrieves answers from a Supabase RAG knowledge base, and is grounded by a hard rule: it can only quote facts that appear verbatim in the knowledge base. No hallucinated metrics, no invented testimonials, no fictional clients. If a visitor asks something the KB does not know, it says so and offers to take their contact instead.

The chatbot exposes five tool-triggered cards — show_portfolio, show_case_study, show_pricing, show_tech_stack, show_contact — so you can drill into specifics on demand: pricing, tech stack, the VerdeX Farm case study, contact paths.

About me: I'm a Solo AI Developer and One Person Business based in Chiang Mai. Mass Communication grad from Chiang Mai University. Across the past year I've built 3 production systems: VerdeX Farm (an AI-powered smart greenhouse for sweet basil DWC hydroponics — 12 iterations, 6 major subsystems including ordering, stock, sensor logging, AI weekly reports, VIP tracking, automated 07:00 morning reports), NWL CLUB (work tracker + community website for a Bangkok streetwear brand), and this portfolio itself. Total surface: 6 web properties + 1 LINE bot.

What this site is meant to prove: production-grade infrastructure built solo. Edge proxy that injects per-request CSP nonce with strict-dynamic. Upstash Redis rate limiting. Row-level security on every Supabase table. PDPA consent banner. End-to-end Sentry instrumentation. Bilingual EN/TH from day one — because a Thai SME shouldn't get a worse experience than an English speaker.

I'm early in the business. The systems are real, deployed, and instrumented — but I'm not pretending to be an established agency. If you run a business that lives on LINE OA and needs a bespoke system — e-commerce, customer-ops, internal workflow, AI-powered analytics — I build end-to-end, solo. Three packages, fixed scope: LINE OA Starter at ฿5,000 (5 days), Smart Chatbot Pro at ฿18,000 (14 days), Enterprise AI at ฿45,000 (30 days). Free 15-minute consultation to start.

Try the site, ask it anything, and tell me what breaks: https://prempawee.com

LINE quick-add: https://line.me/ti/p/EeqOwz9udS

---

## TH

วันนี้เปิดตัว prempawee.com — และตัวเว็บคือบทพิสูจน์เอง

เว็บนี้คือ case study ของตัวเอง แทนที่จะเป็นแกลเลอรี screenshot นิ่งๆ portfolio เป็น AI chatbot ที่คุณคุยด้วยได้จริง ใช้ Claude Opus + Sonnet ผ่าน Vercel AI SDK v6 ดึงคำตอบจาก RAG knowledge base บน Supabase และมีกฎเหล็กข้อหนึ่ง — ตอบได้เฉพาะข้อเท็จจริงที่อยู่ใน knowledge base คำต่อคำเท่านั้น ไม่มี metric กุขึ้น ไม่มี testimonial ปลอม ไม่มีลูกค้าสมมติ ถ้าผู้ใช้ถามสิ่งที่ KB ไม่รู้ มันจะตอบตรงๆ ว่าไม่รู้ แล้วชวนฝากช่องทางติดต่อให้ผมตอบเอง

Chatbot มี tool 5 ตัว — show_portfolio, show_case_study, show_pricing, show_tech_stack, show_contact — กดดูได้ตามต้องการ: ราคา แพ็คเกจ tech stack VerdeX Farm case study วิธีติดต่อ

แนะนำตัว: ผมเป็น Solo AI Developer และ One Person Business อยู่ที่เชียงใหม่ จบ Mass Communication จาก Chiang Mai University ปีที่ผ่านมา ship ระบบ production 3 โปรเจค: VerdeX Farm (smart greenhouse ขับเคลื่อนด้วย AI สำหรับโหระพา DWC hydroponics — 12 รอบการพัฒนา, 6 ระบบย่อยหลัก ทั้ง ordering, stock, sensor logging, AI weekly reports, VIP tracking, morning report อัตโนมัติทุก 07:00), NWL CLUB (work tracker + community website สำหรับแบรนด์ streetwear จากกรุงเทพ), และ portfolio ตัวนี้เอง รวม 6 web properties + 1 LINE bot

เว็บนี้ตั้งใจพิสูจน์อะไร — infrastructure ระดับ production ที่สร้างคนเดียวได้ Edge proxy ฉีด CSP nonce แบบ per-request พร้อม strict-dynamic. Upstash Redis rate limiting. Row-level security บนทุก Supabase table. PDPA consent banner. Sentry instrumentation ครบ end-to-end. รองรับ EN/TH ตั้งแต่วันแรก — เพราะ SME ไทยไม่ควรได้ experience ที่ด้อยกว่าคนพูดอังกฤษ

ผมยังอยู่ช่วงต้นของธุรกิจ ระบบใช้งานจริงและ instrument ครบ — แต่ผมไม่ได้ทำตัวเป็น agency ใหญ่ ถ้าธุรกิจคุณอยู่บน LINE OA และต้องการระบบที่ fit จริง — e-commerce, customer-ops, internal workflow, หรือ AI analytics — ผมสร้าง end-to-end คนเดียว มี 3 แพ็คเกจ scope ชัด: LINE OA Starter ฿5,000 (5 วัน), Smart Chatbot Pro ฿18,000 (14 วัน), Enterprise AI ฿45,000 (30 วัน) คุยฟรี 15 นาทีก่อนเริ่ม

ลองเข้าไปคุยกับเว็บ แล้วบอกผมว่ามีอะไรที่พังบ้าง: https://prempawee.com

LINE: https://line.me/ti/p/EeqOwz9udS

<!-- src: "Solo AI Developer" / "Chiang Mai" — src/app/api/chat/route.ts:49 -->
<!-- src: "One Person Business" — supabase-seed.sql:11; user-memory feedback_one_person_business.md -->
<!-- src: "Mass Communication, Chiang Mai University" — supabase-seed.sql:11 -->
<!-- src: 3 projects / 6 web properties / 1 LINE bot — src/lib/portfolio-data.ts:561-565; src/app/api/chat/route.ts:72; supabase-seed.sql:53 -->
<!-- src: 12 iterations — src/lib/portfolio-data.ts:101,148; supabase-seed.sql:17 -->
<!-- src: 6 major subsystems — src/lib/portfolio-data.ts:124,158; src/app/api/chat/route.ts:80 -->
<!-- src: ordering/stock/sensors/AI weekly/VIP/morning reports — src/lib/portfolio-data.ts:160-161; src/app/api/chat/route.ts:80 -->
<!-- src: 07:00 morning report — src/lib/portfolio-data.ts:175,178 -->
<!-- src: VerdeX = sweet basil DWC hydroponics — src/lib/portfolio-data.ts:101,132; supabase-seed.sql:17 -->
<!-- src: NWL = streetwear brand from Bangkok — src/lib/portfolio-data.ts:324; supabase-seed.sql:31 -->
<!-- src: tools = show_portfolio/show_case_study/show_pricing/show_tech_stack/show_contact — src/lib/portfolio-data.ts:361 -->
<!-- src: Claude Opus + Sonnet — src/lib/portfolio-data.ts:610 (TRUST_FACTS.stack) -->
<!-- src: AI SDK v6 — src/lib/portfolio-data.ts:355 -->
<!-- src: Supabase RAG — src/lib/portfolio-data.ts:357 -->
<!-- src: Edge proxy + CSP nonce + strict-dynamic — src/lib/portfolio-data.ts:379,488 -->
<!-- src: Upstash rate limiting — src/lib/portfolio-data.ts:90,361 -->
<!-- src: PDPA consent banner — src/lib/portfolio-data.ts:361 -->
<!-- src: Sentry end-to-end — src/lib/portfolio-data.ts:534 -->
<!-- src: EN/TH — src/lib/portfolio-data.ts:361 -->
<!-- src: "early in the business" — src/app/api/chat/route.ts:82 -->
<!-- src: ฿5,000 / ฿18,000 / ฿45,000 + 5/14/30 days — src/lib/portfolio-data.ts:38-70 -->
<!-- src: free 15-min consultation — src/lib/portfolio-data.ts:308 -->
<!-- src: LINE quick-add URL — src/lib/portfolio-data.ts:597 (CONTACT.contactUrl) -->
