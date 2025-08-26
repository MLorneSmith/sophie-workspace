#!/bin/bash

# Helper script to update codecheck status from various sources
# Usage: update-codecheck-status.sh <status> [errors] [warnings] [type_errors]

# Get git root for consistent status file path
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
CODECHECK_STATUS_FILE="/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}"

STATUS="$1"
ERRORS="${2:-0}"
WARNINGS="${3:-0}"
TYPE_ERRORS="${4:-0}"
TIMESTAMP=$(date +%s)

# Write status to file
echo "${STATUS}|${TIMESTAMP}|${ERRORS}|${WARNINGS}|${TYPE_ERRORS}" > "$CODECHECK_STATUS_FILE"