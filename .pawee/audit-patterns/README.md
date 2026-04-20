# audit-patterns/ — How to Write Effective AUDIT_LOG Entries

## Purpose
Patterns and discipline for maintaining a project's `AUDIT_LOG.md` — the immutable record of incidents, fixes, and rules learned. A good AUDIT_LOG turns one-time pain into permanent knowledge.

## Why AUDIT_LOG Matters
Without an audit log, every project repeats the same incidents. With one, each incident becomes a permanent rule that future-you (and future Claude Code sessions) cannot accidentally violate. The kit's `pawee/extensions/` rules are themselves derived from a real project's AUDIT_LOG.

## Patterns in This Folder

| Pattern | When to Use |
|---|---|
| `PATTERN_INCIDENT_FIX_RULE.md` | Standard 3-part structure for every audit entry |
| `PATTERN_NUMBERING_DISCIPLINE.md` | How to avoid numbering collisions when appending entries |

## Universal Audit Discipline
1. **Append-only.** Never edit historical entries. If something turns out wrong, append a correction entry that references the original.
2. **Read before append.** Always read the FULL `AUDIT_LOG.md` before adding a new entry — partial reads cause numbering collisions and missed cross-references.
3. **One incident per entry.** Do not bundle multiple unrelated lessons into one numbered section.
4. **Future-you is the audience.** Write so that someone with no project context can reconstruct what happened, why it broke, and how to avoid it.
5. **Cross-reference rules.** When an audit entry teaches a new rule, also add or update the corresponding rule in `KARPATHY.md` (Part 2) or equivalent. Reference the audit entry from the rule, and reference the rule from the audit entry.
