#!/bin/bash

# Manual test status update script for Claude statusline
# Usage: update-test-status.sh [success|failed] [passed_count] [failed_count]
# Example: update-test-status.sh failed 10 2
# Example: update-test-status.sh success 12 0

# Get git root for consistent status file path
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"

# Parse arguments
STATUS=${1:-failed}
PASSED=${2:-0}
FAILED=${3:-0}
TOTAL=$((PASSED + FAILED))

# Update the status file (atomic write)
TEMP_STATUS_FILE="${TEST_STATUS_FILE}.tmp"
echo "${STATUS}|$(date +%s)|${PASSED}|${FAILED}|${TOTAL}" > "$TEMP_STATUS_FILE"
mv "$TEMP_STATUS_FILE" "$TEST_STATUS_FILE"

echo "Test status updated: ${STATUS} (${PASSED} passed, ${FAILED} failed)"