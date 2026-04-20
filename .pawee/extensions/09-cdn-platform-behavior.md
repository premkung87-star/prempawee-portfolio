---
number: 9
title: "Platform-Specific CDN Behavior Requires Preview Verification"
tags: [VERCEL, CDN]
applies_to: [nextjs-vercel-supabase]
universal: false
source: prempawee KARPATHY.md §9
incident_refs: [AUDIT_LOG §21]
added_in_kit: 1.0.0
---

# 9. Platform-Specific CDN Behavior Requires Preview Verification

## Verbatim from Source

**Features that work locally can break on Vercel because the CDN re-encodes responses.**

Vercel's CDN applies Brotli/gzip encoding **after** your build produces files. This breaks any feature that depends on byte-exact content matching build-time hashes.

**Known incompatible features (do not enable):**
- `experimental.sri` in `next.config.ts` — integrity hashes don't match re-encoded bytes, Chrome silently blocks all scripts → zero hydration → fully dead site with no error output
  (AUDIT_LOG §21, upstream issue [vercel/next.js#91633](https://github.com/vercel/next.js/issues/91633))

**Rule:** Before enabling any build-time integrity, hash-based, or byte-exact feature:
1. Check AUDIT_LOG Patterns-to-Avoid
2. Search GitHub issues for `<feature> vercel` or `<feature> CDN`
3. Deploy to Vercel preview first (not direct to main)
4. Run Playwright against preview URL
5. Only merge if real browser verification passes

**The test:** "Will this feature's correctness depend on the bytes being identical between build output and what the browser receives?" If yes, assume Vercel CDN will re-encode unless proven otherwise.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Managed CDNs often apply transformations (compression, header rewrites, image optimization, minification) AFTER your build. Any feature whose correctness depends on byte-identical content between build output and what the client receives will break on the platform even if it works locally.

**When to apply:** Enabling any build-time integrity attribute (SRI), hash-based feature, or correctness requirement that assumes bytes don't change in transit. Also applies to features depending on exact header values that CDNs may strip, override, or add.

**How to apply (stack-agnostic):**
- Before enabling any build-time-hashed or byte-exact feature, ask: does correctness require identical bytes at the browser vs. the build output?
- Search issue trackers for `<feature> <platform>` or `<feature> CDN` before shipping. If others report incompatibility, treat as confirmed.
- Ship to a preview environment first, never directly to production.
- Verify with a real browser on the preview URL before merge.
- Document confirmed-incompatible features in an audit log so they stay disabled across sessions and contributors.

**Stack-specific manifestations:**
- **nextjs-vercel-supabase:** Vercel CDN applies Brotli/gzip after build, which breaks `experimental.sri` (SHA-256 integrity hashes no longer match the bytes Chrome receives). Never enable `experimental.sri` on this stack until upstream issue resolves AND a preview-URL Playwright run passes.
