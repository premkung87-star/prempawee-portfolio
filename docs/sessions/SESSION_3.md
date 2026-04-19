# Session 3 — Case Studies Infrastructure

**Date:** 19 April 2026
**Duration:** ~6 hours
**Outcome:** 4 PRs merged · ~1,010 net lines · 0 regressions
**Final HEAD:** `a775798` on `main`

---

## Mission

Establish reusable case study infrastructure on prempawee.com, with `this-portfolio` (a meta case study about the portfolio site itself) as the first published entry. Open SEO so Google can index the case study route.

---

## PRs Shipped

| # | Title | SHA | Δ Lines |
|---|---|---|---|
| #5 | `feat(positioning): reposition as Solo AI Developer` | `ff1270a` | +54 / -38 |
| #6 | `test(e2e): update smoke assertions for Solo AI Dev positioning` | `ba2289e` | +4 / -2 |
| #7 | `feat(case-studies): scaffold /case-studies/[slug] route with this-portfolio entry` | `c4dd919` | +917 / -0 |
| #8 | `feat(case-studies): swap stub screenshots for real redacted WebP + open SEO` | `a775798` | +35 / -15 |

---

## Architectural Decisions

### Routing
- **Slug-based URLs**: `/case-studies/[slug]` (kebab-case, SEO-friendly)
- Added `slug: string` field to `Project` type in `src/lib/portfolio-data.ts`
- Slugs: `verdex`, `nwl-club`, `this-portfolio`
- Did NOT extend `show_case_study` zod enum — portfolio reached via direct URL only

### Data Source
- Case study content lives on `caseStudy` field of `Project` type (not separate file)
- Bilingual content via `Bilingual<T>` type (`{ en: T, th: T }`) from `src/lib/case-study-types.ts`
- Single source of truth: `src/lib/portfolio-data.ts`

### Component Architecture
- Server page: `src/app/case-studies/[slug]/page.tsx` (async params, `generateStaticParams`, `generateMetadata`, `notFound()` fallback)
- Client wrapper: `CaseStudyShell` owns `lang` state (server can't `useState`, but lang toggle requires it)
- Layout: `src/app/case-studies/layout.tsx` mirrors `admin/layout.tsx` (sets `bg-grid`)

### Stub-First Pattern (PR #7 → PR #8 transition)
Released `/case-studies/this-portfolio` in PR #7 with:
- All content populated EXCEPT screenshots (placeholder + `stubbed: true`)
- `robots: { index: false, follow: false }` to prevent Google indexing incomplete page

PR #8 flipped both gates atomically:
- Replaced placeholder with 4 real WebP screenshots
- Removed noindex
- Added sitemap entry

**Pattern is reusable for PR #3 (NWL case study).**

### Metrics: Target + Transparency
Site just launched, no real data yet. Used 4 Target metrics with transparency note explaining honest engineering vs. fake numbers:
- p95 < 3s
- Error rate < 1%
- Uptime 99.9% (placeholder — to be replaced with real RAG recall after Session 4)
- Cost/request ~$0.003

### Screenshot Pipeline
1. Seeded Supabase with 8 fake leads + 16 conversations + 16 analytics events (cleanup SQL in seed script footer)
2. Captured 4 full-page screenshots via Chrome DevTools (⌘⇧P → "Capture full size screenshot")
3. Converted PNG → WebP via `cwebp -q 85`
4. Total payload: ~335KB for 4 screenshots

### CLS Prevention
Extended `Screenshot` type with optional `width?: number; height?: number` because 4 real screenshots have different intrinsic ratios. Measured pixel dims via `sips`. Fallback `screenshot.width ?? 2302` retained for backward compatibility.

---

## Reusable Components Created

Located in `src/components/case-study/`:

| Component | Lines | Purpose |
|---|---|---|
| `CaseStudyShell.tsx` | 111 | Client wrapper, owns `lang` state |
| `Hero.tsx` | 30 | Title + tagline + lang toggle |
| `Section.tsx` | 24 | Generic content section with heading |
| `MetricGrid.tsx` | 45 | 2×2 metric cards with target/actual labels |
| `ArchSVG.tsx` | 217 | Inline architecture diagram |
| `ScreenshotFrame.tsx` | 42 | next/image wrapper with caption + dim hints |
| `LangToggle.tsx` | 42 | EN/TH toggle button (matches homepage pattern) |

**Used by PR #3 (NWL) and any future case study.**

---

## Deviations from Original Plan (Approved)

1. **`CaseStudyShell` component added** — original plan had no client wrapper, but server page needs `async params` while lang toggle needs `useState`. Wrapper separates concerns.
2. **Test file relocated** from `tests/unit/` to `src/lib/case-study.test.ts` — vitest include pattern is `src/**/*.test.{ts,tsx}` only.
3. **Extended `Screenshot` type with width/height** in PR #8 — needed for CLS prevention with real screenshots of varying ratios.
4. **PR #7 delivered 12 files (plan said 11)** — `case-study-types.ts` justified by Bilingual type extraction.
5. **PR #8 modified 6 files (plan said 5)** — `case-study-types.ts` updated for dimension fields.

---

## Verification

- ✅ typecheck PASS
- ✅ lint PASS
- ✅ vitest 12/12 new suite + 55/55 full suite
- ✅ build PASS — SSG route `/case-studies/this-portfolio` confirmed
- ✅ next/image optimization verified (25892 → 5896 bytes via `_next/image`)
- ✅ Manual dev smoke 6/6 (homepage, case study EN, case study TH, sitemap.xml, robots meta absent, mailto pre-fill)
- ✅ Production verified: https://prempawee.com/case-studies/this-portfolio

---

## Final Git State

```
HEAD: a775798 (feat(case-studies): swap stub screenshots for real redacted WebP + open SEO (#8))
Branch: main (working tree clean)
Local branches: main only
Remote refs: origin/main only
```

All feature branches pruned post-merge. Tree pristine.

---

## Open Follow-ups for Future Sessions

| Item | Owner Session | Notes |
|---|---|---|
| Replace "Uptime 99.9%" target metric with real RAG recall | Session 4 | After `eval:rag` harness produces measurable recall |
| Sentry deprecation warnings (`disableLogger`, `onRouterTransitionStart` hook) | Session 5 | Noise only, not blocking |
| Cleanup fake seed data from Supabase | After real traffic | DELETE statements in seed script footer |
| Add `tool-results.tsx` deep-link "View full case study →" | PR #3 (Session 7) | Deferred from PR #7 |

---

## Production State (End of Session)

**Live URL:** https://prempawee.com/case-studies/this-portfolio

Sections rendered:
1. Hero (title + tagline + lang toggle)
2. Problem
3. Architecture (inline SVG diagram + caption)
4. Metrics (4 target cards + transparency note)
5. Admin Walkthrough (4 real WebP screenshots)
6. Security (6 items: CSP, HSTS, rate-limit, RLS, branch-protection, auth-gate)
7. Observability
8. Dev Workflow
9. CTA (Work with me → pre-filled mailto)

Bilingual EN/TH toggle functional. Sitemap-listed. Google-indexable.
