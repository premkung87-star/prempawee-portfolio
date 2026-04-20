# Pattern: Incident → Fix → Rule

## The 3-Part Structure
Every entry in `AUDIT_LOG.md` should have exactly three labeled parts:

```
### N. Short title describing the incident
**What happened:** <The incident in concrete terms. Include error messages,
                    symptoms, what was being done at the time, and how the
                    incident was discovered. No blame, no judgement, just facts.>

**Fix applied:** <What was actually done to resolve the incident in the moment.
                  Include commit SHAs, PR numbers, file paths. Distinguish between
                  the immediate hotfix and the longer-term remediation.>

**Rule:** <The generalized lesson. Phrased as an imperative ("Always X" or
           "Never Y"). This becomes a candidate for promotion into KARPATHY.md
           Part 2 or AGENTS.md if the rule is broadly applicable.>
```

## Why This Structure Works

- **What happened** captures empirical reality. Future-you needs to recognize the same incident shape if it recurs.
- **Fix applied** captures the specific resolution. Useful for re-applying if the same incident reoccurs before the rule is internalized.
- **Rule** captures the generalization. This is the part that prevents recurrence.

## Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails |
|---|---|
| Skipping "What happened" and going straight to "Rule" | Loses the empirical evidence that justifies the rule. Future-you may dismiss the rule as paranoia. |
| Writing "Fix" without commit SHAs or PR numbers | When the same incident recurs, you cannot find the previous fix to learn from. |
| Writing "Rule" as a description ("X is risky") instead of an imperative ("Never do X") | Descriptive rules do not create action. Imperative rules create automatic refusal. |
| Bundling 2 incidents into one entry to "save space" | Cross-references break. Future searches for one incident find an entry that talks about both. |

## Example Entry (Anonymized)

```
### 26. Force-push to main bypassed branch protection by mistake
**What happened:** During a hotfix session, used `git push --force origin main`
to discard a bad commit. Branch protection was OFF for the personal account
during a 5-minute window because of an unrelated GitHub setting test. Force
push succeeded. CI did not gate the push. The bad commit's removal also
removed an unrelated commit that had been merged 10 minutes earlier.

**Fix applied:** Reverted the force-push by reflog recovery (commit abc1234).
Re-merged the lost commit via cherry-pick. Re-enabled branch protection
within 2 minutes. Documented the gap in the protection settings change log.

**Rule:** Branch protection on main must be ALWAYS ON. Never disable, even
"for a minute." If a force-push seems necessary, it is a signal to revert
+ re-commit forward, not to bypass protection.
```

## Promotion Path
When an audit entry's "Rule" applies broadly enough to be a project-wide
discipline, promote it to:

- **KARPATHY.md Part 2** — if it is a behavioral rule for Claude Code or any
  human contributor
- **AGENTS.md** — if it is a code-level rule about specific files or directives
- **CLAUDE.md** — if it is a workflow-level discipline (session opening, risk
  classification)

After promotion, the AUDIT_LOG entry stays in place forever as the empirical
justification. Cross-link both directions.
