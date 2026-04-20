---
number: 5
title: "Verify Framework Version Before Using APIs"
tags: [UNIVERSAL, FRAMEWORK_VERSION]
applies_to: [generic]
universal: true
source: prempawee KARPATHY.md §5
incident_refs: [AUDIT_LOG §13, AUDIT_LOG §17, AUDIT_LOG §18]
added_in_kit: 1.0.0
---

# 5. Verify Framework Version Before Using APIs

## Verbatim from Source

**Don't rely on training-data knowledge of API shapes — this stack moves faster than training cutoffs.**

Before using any framework or SDK API:
- Check installed version: `npm view <pkg> version` or read `package.json`
- For Next.js specifically, read `node_modules/next/dist/docs/` before assuming any convention
- For AI SDK, check migration guides between v5→v6 (especially tool-use APIs)
- If the API shape you "remember" feels confident but the version is new — stop. Verify.

**Known pitfalls in this codebase:**
- Next.js 16 renamed `middleware.ts` → `proxy.ts` (runs Node, not Edge) — see AUDIT_LOG §18
- AI SDK v6 replaced `maxSteps` with `stopWhen: stepCountIs(n)` — see §13
- Next.js 16 + Turbopack + strict-dynamic CSP requires specific nonce pipeline — see §17

**The test:** If your change depends on a framework behavior, you should be able to cite the doc path or source line that confirms it. "I think this works" is not confirmation.

## Generic Pattern (Strategy B Abstraction)

**Principle:** Never trust training-data memory of API shapes for any dependency that ships faster than your training cutoff. Verify against the installed version before writing code that depends on its behavior.

**When to apply:** Any task that touches a library, framework, SDK, or runtime whose docs may have changed since your last verified reference. Especially applies to fast-moving ecosystems (web frameworks, AI SDKs, cloud runtimes).

**How to apply (stack-agnostic):**
- Read the installed version from the package manifest (package.json, Cargo.toml, pyproject.toml, go.mod, etc.)
- Read the docs that ship with the installed version (vendored docs folders, `pip show <pkg>`, `cargo doc`) rather than online docs (which may track a different version).
- For SDK version bumps, read the migration/upgrade guide between old and new version before using any API that may have moved.
- If an API shape feels confident from memory but the version is new: stop. Cite the doc path or source line that confirms the shape before proceeding.

**Stack-specific manifestations:**
- **nextjs-vercel-supabase:** Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-<N>.md` before using any Next.js convention on a freshly-upgraded project. Check AI SDK v5 → v6 migration guide before using tool-use APIs. Verify Turbopack vs webpack differences for build-time features.
- **iot-multi-repo:** Check firmware SDK changelogs and vendor API references against the exact firmware version flashed on target devices.
- **generic:** Any dependency where version drift is a known failure mode (packages with breaking changes between minor versions, experimental flags that shift behavior across releases).
