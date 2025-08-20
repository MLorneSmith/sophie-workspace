#!/bin/bash

# This script tracks build status for the statusline
# Usage: track-build.sh <success|failed> [error_count]

BUILD_LOG_FILE="/tmp/.claude_build_status_${PWD//\//_}"
STATUS="$1"
ERROR_COUNT="${2:-0}"
TIMESTAMP=$(date +%s)

# Write status to temp file
echo "${STATUS}|${TIMESTAMP}|${ERROR_COUNT}" > "$BUILD_LOG_FILE"