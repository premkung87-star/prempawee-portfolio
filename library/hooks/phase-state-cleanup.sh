#!/usr/bin/env bash
# phase-state-cleanup.sh — Stop hook
# Transitions state from builder → idle at turn end.
# Leaves architect state alone (Phase 1 may span multiple turns).

set -euo pipefail
STATE_FILE="${PAWEE_PHASE_STATE_FILE:-.claude/pawee-phase-state}"

[[ -f "$STATE_FILE" ]] || exit 0
state="$(tr -d '[:space:]' < "$STATE_FILE")"
[[ "$state" == "builder" ]] && echo "idle" > "$STATE_FILE"
exit 0
