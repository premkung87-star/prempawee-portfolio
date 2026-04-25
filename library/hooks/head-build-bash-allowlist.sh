#!/usr/bin/env bash
# head-build-bash-allowlist.sh — PreToolUse hook
#
# Blocks dangerous Bash commands when called from the head-build
# subagent (v2.2.0+). head-build was granted Bash for self-
# verification (npm test, tsc --noEmit, grep, etc.) but must not
# perform destructive or network-egress operations. This hook is
# the mechanical enforcement layer for the agent-doc allowlist
# in library/agents/heads/head-build.md "## Bash allowlist".
#
# Default: ALLOW. Block only on explicit forbidden-prefix match
# at the start of any shell-segment in the command (segments
# split on &&, ||, ;, |). One forbidden segment blocks the whole
# command.
#
# Input: JSON on stdin per Claude Code PreToolUse schema:
#   {"tool_name":"Bash","agent_type":"head-build",
#    "tool_input":{"command":"<bash string>"}, ...}
# Field naming follows Bug 5 + Bug 6 fixes (real Claude Code shape;
# see tests/fixtures/captured-real-subagent-stop-payload.json for
# precedent and library/hooks/spec-lock-precondition.sh for the
# canonical agent_type parsing pattern).
#
# Exit 0 = allow. Exit 2 = block (with diagnostic on stderr).

set -euo pipefail

# Slurp stdin to a temp file (frees stdin for python heredoc script
# invocation; cannot use python3 <<EOF directly without -c because
# the heredoc would consume stdin instead of providing the script.)
TMPJSON="$(mktemp -t pawee-bash-allowlist.XXXXXX)"
trap 'rm -f "$TMPJSON"' EXIT
cat > "$TMPJSON"

python3 - "$TMPJSON" <<'PYEOF'
import json, sys, re

try:
    with open(sys.argv[1]) as f:
        data = json.load(f)
except Exception:
    # Malformed input — allow (don't break the session)
    sys.exit(0)

# Only act on Bash tool calls
if data.get("tool_name") != "Bash":
    sys.exit(0)

# Only act on head-build subagent (agent_type per real Claude Code shape)
if data.get("agent_type") != "head-build":
    sys.exit(0)

command = data.get("tool_input", {}).get("command", "")
if not command or not isinstance(command, str):
    sys.exit(0)

# Forbidden command-prefix patterns. Each matches the START of a
# shell segment (after split by && || ; | and surrounding whitespace).
# Patterns use \b for word-boundary so e.g. "remove" does not match "rm".
FORBIDDEN = [
    r"rm\b",
    r"git\s+push\b",
    r"git\s+commit\b",
    r"npm\s+install\b",
    r"npm\s+i\s",
    r"pnpm\s+install\b",
    r"pnpm\s+i\s",
    r"yarn\s+add\b",
    r"yarn\s+install\b",
    r"mv\b",
    r"curl\b",
    r"wget\b",
    r"chmod\b",
    r"chown\b",
    r"sudo\b",
]

# Split command into shell segments by &&, ||, ;, |
segments = re.split(r"\s*(?:&&|\|\||;|\|)\s*", command)

for seg in segments:
    seg = seg.strip()
    if not seg:
        continue
    for pat in FORBIDDEN:
        if re.match(pat, seg):
            print(
                f"head-build-bash-allowlist: BLOCKED — segment {seg!r} "
                f"matches forbidden pattern {pat!r}",
                file=sys.stderr,
            )
            sys.exit(2)

sys.exit(0)
PYEOF
