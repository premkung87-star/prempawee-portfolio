# tags/ — Tag Taxonomy and Stack-Profile Routing

## Purpose
This folder documents the **tag system** used in `../extensions/*.md` frontmatter. Tags drive two things:

1. **Discovery** — A reader can scan `tags:` lines to find all rules about, e.g., async behavior or git discipline.
2. **Routing** — `bootstrap/bootstrap.sh` uses the `applies_to:` field to decide which extension files to install in a new project, based on the chosen stack profile.

The tag definitions themselves live in this single README to avoid duplication. The pawee root README also references this taxonomy.

## Tag Categories

### Behavioral Tags (universal across stacks)
| Tag | Meaning | Example Rule |
|---|---|---|
| `UNIVERSAL` | Applies to all stacks, all projects | §5 Verify Framework Version |
| `OPUS_4_7` | Specific to Opus 4.7 model behavior | §11-§14 |
| `GIT_DISCIPLINE` | Commit hygiene, PR scope | §7 One Logical Change Per Commit |
| `SIMPLICITY` | Avoid overengineering | §13 |
| `SAFETY` | Reversibility, destructive action discipline | §14 |
| `CODE_REVIEW` | Code review process discipline | §11 |
| `INVESTIGATION` | Read before answering | §12 |
| `OBSERVABILITY` | Logging, monitoring, error tracking discipline | §10 |
| `FRAMEWORK_VERSION` | Verify framework version before using APIs | §5 |
| `BROWSER_E2E` | Browser-based end-to-end verification | §6 |

### Stack Tags (specific to a framework or platform)
| Tag | Stack | Example Rule |
|---|---|---|
| `NEXTJS` | Next.js framework | §6 Browser Verification, §8 Edge Runtime Async |
| `VERCEL` | Vercel deployment platform | §9 CDN Platform Behavior |
| `EDGE_RUNTIME` | Edge runtime environments (Cloudflare Workers, Vercel Edge) | §8 |
| `CDN` | CDN behavior (any CDN, but typically Vercel/Cloudflare) | §9 |
| `ASYNC` | Async/await discipline (any runtime that defers work) | §8 |

## Stack Profiles (`applies_to:` values)

| Profile | Description | Includes Rules Tagged |
|---|---|---|
| `generic` | Any project, any stack | UNIVERSAL, OPUS_4_7, GIT_DISCIPLINE, SIMPLICITY, SAFETY, CODE_REVIEW, INVESTIGATION, OBSERVABILITY, FRAMEWORK_VERSION |
| `nextjs-vercel-supabase` | Next.js + Vercel + Supabase (NWL CLUB, prempawee) | All `generic` + NEXTJS, VERCEL, EDGE_RUNTIME, CDN, ASYNC, BROWSER_E2E |
| `iot-multi-repo` | Multi-repo IoT/firmware (VerdeX) | All `generic` + (future IOT-specific tags) |

## How Bootstrap Uses This

```bash
# When a user runs:
./bootstrap.sh --stack=nextjs-vercel-supabase

# bootstrap.sh reads frontmatter from each pawee/extensions/*.md and includes
# the file in the destination project if its applies_to: list contains
# "nextjs-vercel-supabase" or "generic".
```

## Adding a New Tag

1. **Pick a category** (behavioral or stack).
2. **Add the tag to the appropriate table above** with a one-line meaning.
3. **Apply the tag to relevant extension files** by editing their frontmatter.
4. **If the tag implies new routing,** update the `applies_to` table to show which stack profiles include it.

## Adding a New Stack Profile

1. **Add a row to the Stack Profiles table** above.
2. **Decide which existing tags apply** to this stack and document them.
3. **Create a corresponding bootstrap stack file** at `bootstrap/stacks/<profile-name>.sh` (Phase 1.6).
4. **Existing extensions auto-route** based on their `applies_to:` lists. Add the new profile name to relevant extensions' `applies_to:` lists if they apply.

## Tag Stability
Tags are part of the kit's public surface. Renaming a tag is a **breaking change** that requires a major version bump (kit v2.0.0) and a migration note in `CHANGELOG.md`.

Adding a new tag is **non-breaking** and goes in a minor version bump (kit v1.x.0).
