#!/usr/bin/env bash
# spec-lock-precondition.sh — SubagentStop hook
#
# Validates pawee-architect spec file before transitioning phase
# state from architect to builder. Uses python3 for JSON-safe
# parsing of final_message (handles escaped quotes correctly).
# All silent-exit paths log rejections for future diagnostic.

set -euo pipefail

STATE_FILE="${PAWEE_PHASE_STATE_FILE:-.claude/pawee-phase-state}"
REJECT_LOG="${PAWEE_REJECTION_LOG:-.claude/pawee-phase-rejections.log}"

log_rejection() {
    local reason="$1"
    mkdir -p "$(dirname "$REJECT_LOG")"
    echo "$(date -u +%FT%TZ) REJECTED: $reason" >> "$REJECT_LOG"
}

# JSON-safe extraction via python3. Falls back to empty on parse error.
json_field() {
    local field="$1"
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    v = data.get('$field', '')
    print(v if isinstance(v, str) else '')
except Exception:
    pass
" 2>/dev/null || echo ""
}

# Slurp stdin once
input="$(cat)"

# Parse fields
# Field naming: Claude Code's actual SubagentStop payload uses `agent_type`
# (not `subagent_type`) and `last_assistant_message` (not `final_message`).
# Empirically captured shape (Bug 6 investigation 2026-04-25):
#   {"session_id":"...","transcript_path":"...","cwd":"...",
#    "permission_mode":"...","agent_id":"...","agent_type":"pawee-architect",
#    "hook_event_name":"SubagentStop","stop_hook_active":false,
#    "agent_transcript_path":"...","last_assistant_message":"SPEC LOCKED: ..."}
# See tests/fixtures/captured-real-subagent-stop-payload.json for the
# permanent regression fixture. See AUDIT_LOG Bug 5 + Bug 6 entries.
agent_type="$(echo "$input" | json_field agent_type)"
last_assistant_message="$(echo "$input" | json_field last_assistant_message)"

# Empty agent_type means malformed/unparsable input or non-subagent context — log and pass
if [[ -z "$agent_type" ]]; then
    log_rejection "malformed hook input: agent_type field missing or unparseable (input head=$(echo "$input" | head -c 200))"
    exit 0
fi

# Only act on pawee-architect subagent stops
if [[ "$agent_type" != "pawee-architect" ]]; then
    exit 0
fi

# Must contain SPEC LOCKED marker to trigger precondition check
if ! echo "$last_assistant_message" | grep -q "SPEC LOCKED"; then
    log_rejection "pawee-architect returned without SPEC LOCKED marker (last_assistant_message length=${#last_assistant_message})"
    exit 0
fi

# Extract spec file path from message
spec_path="$(echo "$last_assistant_message" | grep -oE 'SPEC LOCKED:[[:space:]]*[^[:space:]]+' | head -1 | sed -E 's/^SPEC LOCKED:[[:space:]]*//' || true)"

if [[ -z "$spec_path" ]]; then
    log_rejection "SPEC LOCKED marker present but no path extractable from: $(echo "$last_assistant_message" | head -c 200)"
    exit 1
fi

if [[ ! -f "$spec_path" ]]; then
    log_rejection "spec file not found on disk: $spec_path"
    exit 1
fi

# Precondition checks — each section must exist and have non-whitespace content
check_section_non_empty() {
    local section="$1"
    local body
    body="$(awk -v sec="## $section" '
        $0 == sec { flag=1; next }
        /^## / && flag { flag=0 }
        flag { print }
    ' "$spec_path")"
    local stripped
    stripped="$(echo "$body" | tr -d '[:space:]' | tr -d '-')"
    [[ -n "$stripped" ]]
}

failures=()
for section in "Wiki precedents checked" "Target file paths" "H2 section list" "Verification commands"; do
    if ! check_section_non_empty "$section"; then
        failures+=("empty section: $section")
    fi
done

if [[ ${#failures[@]} -gt 0 ]]; then
    {
        echo "$(date -u +%FT%TZ) REJECTED: $spec_path"
        for f in "${failures[@]}"; do
            echo "  - $f"
        done
    } >> "$REJECT_LOG"
    exit 1
fi

# All checks passed — transition state
echo "builder" > "$STATE_FILE"
exit 0
