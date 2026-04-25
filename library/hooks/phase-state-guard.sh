#!/usr/bin/env bash
# phase-state-guard.sh — PreToolUse hook
#
# Blocks Edit/Write/Bash/NotebookEdit tools when pawee phase state
# is "architect", EXCEPT when the subagent is pawee-architect AND
# the Write targets a spec file under docs/superpowers/specs/*.md.
# This carve-out lets the Architect subagent persist its locked
# spec during Phase 1 without opening a broader write surface.
#
# Input: JSON on stdin with at least {"tool_name":"...","agent_type":"...","tool_input":{"file_path":"..."}}
# Field naming note: Claude Code's actual hook payload uses `agent_type`
# (not `subagent_type`) for the originating subagent identifier. See
# https://code.claude.com/docs/en/hooks PreToolUse schema.
# State file: $PAWEE_PHASE_STATE_FILE (default: .claude/pawee-phase-state)
# Exit 0 = allow. Exit 2 = block.

set -euo pipefail

STATE_FILE="${PAWEE_PHASE_STATE_FILE:-.claude/pawee-phase-state}"
BLOCKED_TOOLS="^(Edit|Write|Bash|NotebookEdit)$"
ARCHITECT_WRITE_ALLOW_PREFIX="docs/superpowers/specs/"

# Default to idle if state file missing
if [[ ! -f "$STATE_FILE" ]]; then
    exit 0
fi

state="$(tr -d '[:space:]' < "$STATE_FILE")"

# Only architect state triggers guard
if [[ "$state" != "architect" ]]; then
    exit 0
fi

# Slurp stdin once for repeated parsing
input="$(cat)"

# Extract tool_name (anchored to prevent key-suffix false positives)
tool_name="$(echo "$input" | grep -oE '(^|[,{[:space:]])"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"([^"]*)"$/\1/' || true)"

if [[ -z "$tool_name" ]]; then
    # Malformed input — allow (don't break the session)
    exit 0
fi

# Non-blocked tools always allowed
if ! [[ "$tool_name" =~ $BLOCKED_TOOLS ]]; then
    exit 0
fi

# Blocked tool under architect state — check carve-out for Write from pawee-architect
if [[ "$tool_name" == "Write" ]]; then
    agent_type="$(echo "$input" | grep -oE '(^|[,{[:space:]])"agent_type"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"([^"]*)"$/\1/' || true)"
    if [[ "$agent_type" == "pawee-architect" ]]; then
        # Architect Write — check target path
        file_path="$(echo "$input" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"([^"]*)"$/\1/' || true)"
        # Normalize to repo-relative if absolute
        file_path_rel="${file_path#/}"
        file_path_rel="${file_path_rel#*/pawee-workflow-kit/}"
        file_path_rel="${file_path_rel#*/pawee-workflow-kit.fix/}"
        if [[ "$file_path_rel" == "$ARCHITECT_WRITE_ALLOW_PREFIX"* && "$file_path_rel" == *.md ]]; then
            # Carve-out match: allow
            exit 0
        fi
    fi
fi

# Default: block
echo "pawee-phase-guard: BLOCKED — tool '$tool_name' disabled during Phase 1 (architect). Spec must be locked before Builder executes." >&2
exit 2
