---
platform: Fastwork (profile + gig edits, not a post)
audience: Thai Fastwork buyers researching LINE OA chatbot freelancers
length: 10 specific edits (numbered)
est_read_seconds: N/A — this is a checklist for Prem to apply
post_when: 2026-04-26 12:00 Asia/Bangkok (apply on Sunday hard launch)
---

# Fastwork Profile Update Checklist

Goal: drive Fastwork buyers to prempawee.com so they can experience the live AI demo before they commit to a package. Conversion lever = letting buyers ask the chatbot whatever they're nervous about, in Thai or English, before they message you on Fastwork.

Each edit is one specific change. Apply in order. Do not bundle edits.

---

1. **Bio paragraph — add new opening line.**
   Insert as the FIRST line of the Fastwork bio:
   `ลองคุยกับ portfolio AI ของผมก่อนได้ที่ prempawee.com — ตอบจาก knowledge base คำต่อคำ ไม่กุข้อมูล`
   (English mirror, if your Fastwork supports a second-language description: `Talk to my portfolio AI first at prempawee.com — answers verbatim from a knowledge base, no fabricated claims.`)

2. **Bio paragraph — add identity + location line right after the opener.**
   `Solo AI Developer / One Person Business จากเชียงใหม่ จบ Mass Comm มหาวิทยาลัยเชียงใหม่`

3. **Bio paragraph — add the breadth line (replaces or augments any vague "I do chatbots" line).**
   `ปัจจุบัน ship ระบบ production แล้ว 3 โปรเจค รวม 6 web + 1 LINE bot — VerdeX Farm (smart greenhouse โหระพา DWC hydroponics, 12 รอบ, 6 ระบบย่อย), NWL CLUB (streetwear แบรนด์กรุงเทพ), และ portfolio AI ตัวนี้เอง`

4. **LINE OA Starter gig — title append.**
   Append to the existing gig title: ` | Powered by Claude AI (Anthropic) — ดู demo สดที่ prempawee.com`
   Do NOT change the price. Do NOT change the delivery time. Title-only edit.

5. **LINE OA Starter gig — description first line.**
   Replace or prepend with: `แพ็คเกจเริ่มต้น ฿5,000 ส่งมอบ 5 วัน — Rich Menu, auto-reply (10 keywords), 1 Flex Message template, staging test + production deploy, 7-day bug warranty. ลองคุยกับเว็บ portfolio ผมก่อนตัดสินใจ: prempawee.com`

6. **Smart Chatbot Pro gig — title append.**
   Append to existing title: ` | Claude AI เข้าใจไทยตามธรรมชาติ — ดู live demo ที่ prempawee.com`

7. **Smart Chatbot Pro gig — description first line.**
   Replace or prepend with: `แพ็คเกจระดับกลาง ฿18,000 ส่งมอบ 14 วัน — ทุกอย่างใน Starter + Claude AI (เข้าใจภาษาไทยตามธรรมชาติ), 25 conversation paths, 3 Flex templates, Supabase customer DB, CRM dashboard (LIFF). คุยกับ AI ของผมที่ prempawee.com เพื่อดูว่า Claude เข้าใจไทยจริงแค่ไหน`

8. **Enterprise AI gig — title append.**
   Append: ` | Full AI system (booking, payments, loyalty) — สถาปัตยกรรมเหมือนที่ prempawee.com`

9. **Enterprise AI gig — description first line.**
   Replace or prepend with: `แพ็คเกจสูงสุด ฿45,000 ส่งมอบ 30 วัน — ทุกอย่างใน Pro + AI conversation memory, LIFF (booking/ordering), PromptPay verification, loyalty + membership, admin dashboard, broadcast + audience segmentation. ดูตัวอย่าง infrastructure ระดับ production ได้ที่ case study: prempawee.com/case-studies/verdex`

10. **All three gigs — add the same closing CTA paragraph at the END of the description.**
    `--- คุยฟรี 15 นาทีก่อนเริ่ม ทักผ่าน Fastwork chat หรือ LINE: https://line.me/ti/p/EeqOwz9udS — ตอบใน 2-4 ชม. (เวลาทำการ)`

---

## Things NOT to add to Fastwork

- Do not add "99.99% uptime" or any uptime number to a gig description. The portfolio chatbot itself refuses to quote uptime numbers (per the GROUNDING RULE in src/app/api/chat/route.ts:51-60). Fastwork copy must follow the same discipline.
- Do not add fake client logos or testimonials.
- Do not invent a fourth package. The 3 official prices are ฿5,000 / ฿18,000 / ฿45,000 only.
- Do not claim "trusted by N businesses" — N is unverifiable at this stage.
- Do not add emojis to titles or descriptions. House style.

<!-- src: "Solo AI Developer" — src/app/api/chat/route.ts:49 -->
<!-- src: "One Person Business" — supabase-seed.sql:11; user-memory feedback_one_person_business.md -->
<!-- src: "Chiang Mai" / "Mass Comm CMU" — src/lib/portfolio-data.ts:607; supabase-seed.sql:11 -->
<!-- src: 3 projects / 6 web / 1 LINE bot — src/lib/portfolio-data.ts:561-565 -->
<!-- src: VerdeX = sweet basil DWC, 12 iterations, 6 subsystems — src/lib/portfolio-data.ts:101,124,148,158 -->
<!-- src: NWL = streetwear from Bangkok — src/lib/portfolio-data.ts:324 -->
<!-- src: ฿5,000 / 5d Starter features (Rich Menu, 10 keywords, 1 Flex, staging, 7-day warranty) — src/lib/portfolio-data.ts:36-48 -->
<!-- src: ฿18,000 / 14d Pro features (Claude AI, 25 paths, 3 Flex, Supabase CRM, LIFF dashboard) — src/lib/portfolio-data.ts:50-65 -->
<!-- src: ฿45,000 / 30d Enterprise features (memory, LIFF booking, PromptPay, loyalty, broadcast) — src/lib/portfolio-data.ts:66-82 -->
<!-- src: Claude AI = Anthropic — src/lib/portfolio-data.ts:86 (TECH_STACK) -->
<!-- src: free 15-min consultation — src/lib/portfolio-data.ts:308 -->
<!-- src: response time 2-4h — src/lib/portfolio-data.ts:601,608 -->
<!-- src: LINE quick-add URL — src/lib/portfolio-data.ts:597 -->
<!-- src: GROUNDING RULE forbidding "99.99% uptime" — src/app/api/chat/route.ts:51-60 -->
