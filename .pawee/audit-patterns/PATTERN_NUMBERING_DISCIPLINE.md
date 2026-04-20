# Pattern: Numbering Discipline for Append-Only Logs

## The Problem
`AUDIT_LOG.md` is append-only and uses sequential numbering (`### 1.`, `### 2.`, ...). When a new entry is appended without first reading the full file, the new entry can collide with an existing number (`### 14.` already exists, but the appender thinks the next is `### 14.`).

This happened in a real project. Recovery requires renumbering, which then breaks every cross-reference that pointed to the old numbers from extensions, READMEs, and other audit entries.

## The Discipline
Before appending any entry to `AUDIT_LOG.md`:

1. **Read the FULL file**, not just `tail -50` or `head -100`. Partial reads miss informal references like "see entry 14 above" buried mid-file.
2. **Identify the highest existing number** by running `grep -E "^### [0-9]+\." AUDIT_LOG.md | sort -V | tail -1`.
3. **Use the next sequential integer.** Do not skip numbers, do not reuse numbers, do not retroactively renumber.
4. **State the new number explicitly** in your commit message: `audit: append §29 (anti-laziness prompts)`.

## Why "Read Full File" Matters
LLM session context windows can hold the full file. Partial reads are an artifact of habit, not necessity. Opus 4.7 in particular reasons over what it has and may miss informal references in untouched sections — leading to confident-but-wrong next-number guesses.

## Recovery From Numbering Collision
If a collision is discovered after merge:

1. **Do not renumber historical entries.** Their numbers are referenced by countless other files.
2. **Append a clarifying entry** at the next available number that explicitly notes the collision and which entry takes the canonical spot.
3. **Update any cross-references** in extensions or KARPATHY rules that pointed to the colliding number, to disambiguate using titles or commit SHAs instead of numbers.

## Universal Application
This pattern applies to any append-only sequentially-numbered document:

- `AUDIT_LOG.md` entries
- `KARPATHY.md` Part 2 numbered rules
- `CHANGELOG.md` version sections
- ADR (Architectural Decision Record) folders with sequential filenames

For all of these: read full file, identify highest number, increment by exactly 1.

## Cross-Reference
This pattern was extracted from a real numbering-collision incident in a source project. The lesson is universal — every append-only numbered document benefits from this discipline.
