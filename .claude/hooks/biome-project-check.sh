#!/bin/bash

# Biome Project Check Hook
# Runs comprehensive Biome validation on entire project
# Executes on Stop hook to ensure code quality before session ends

set -euo pipefail

# Get the project root and hook configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Function to log messages
log() {
    echo "[biome-project-check] $*" >&2
}

# Function to get config value from settings.json
get_config() {
    local key="$1"
    local default="$2"
    if [ -f "$CONFIG_FILE" ]; then
        value=$(jq -r ".biome.${key} // null" "$CONFIG_FILE" 2>/dev/null || echo "null")
        if [ "$value" != "null" ]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Check if biome.json exists (indicating Biome is configured)
if [ ! -f "${PROJECT_ROOT}/biome.json" ]; then
    log "Biome not configured, skipping project check"
    exit 0
fi

# Load configuration
BIOME_COMMAND=$(get_config "command" "npx biome")
PROJECT_CHECK_ENABLED=$(get_config "projectCheck" "true")
TIMEOUT=$(get_config "projectCheckTimeout" "60")
CHECK_ON_STOP=$(get_config "checkOnStop" "true")

# Check if project check is enabled
if [ "$PROJECT_CHECK_ENABLED" = "false" ]; then
    exit 0
fi

# Only run on Stop hook if configured
if [ "${CLAUDE_HOOK:-}" = "Stop" ] && [ "$CHECK_ON_STOP" = "false" ]; then
    exit 0
fi

log "🔍 Running Biome check on entire project..."

# Build Biome command
BIOME_CMD="$BIOME_COMMAND check"

# Add paths to check (default to current directory)
CHECK_PATHS=$(get_config "checkPaths" ".")
BIOME_CMD="$BIOME_CMD $CHECK_PATHS"

# Run Biome with timeout
set +e
if command -v timeout >/dev/null 2>&1; then
    CHECK_OUTPUT=$(timeout "${TIMEOUT}s" bash -c "cd '$PROJECT_ROOT' && $BIOME_CMD" 2>&1)
    EXIT_CODE=$?
else
    CHECK_OUTPUT=$(cd "$PROJECT_ROOT" && eval "$BIOME_CMD" 2>&1)
    EXIT_CODE=$?
fi
set -e

# Check if timeout occurred
if [ $EXIT_CODE -eq 124 ]; then
    echo "⚠️ BIOME PROJECT CHECK TIMEOUT" >&2
    echo "" >&2
    echo "Project check timed out after ${TIMEOUT} seconds" >&2
    echo "Consider running 'npx biome check' manually" >&2
    exit 0  # Don't fail on timeout for project-wide checks
fi

# Parse the output to count issues
ERRORS=0
WARNINGS=0
if echo "$CHECK_OUTPUT" | grep -q "Found [0-9]* error"; then
    ERRORS=$(echo "$CHECK_OUTPUT" | grep -oE "Found [0-9]* error" | grep -oE "[0-9]*" | head -1)
fi
if echo "$CHECK_OUTPUT" | grep -q "Found [0-9]* warning"; then
    WARNINGS=$(echo "$CHECK_OUTPUT" | grep -oE "Found [0-9]* warning" | grep -oE "[0-9]*" | head -1)
fi

# Check for errors
if [ $EXIT_CODE -ne 0 ] && [ $ERRORS -gt 0 ]; then
    echo "❌ BIOME PROJECT CHECK FAILED" >&2
    echo "" >&2
    echo "$CHECK_OUTPUT" >&2
    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "CRITICAL: Project has $ERRORS error(s) and $WARNINGS warning(s)" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "" >&2
    echo "REQUIRED ACTIONS:" >&2
    echo "1. Review and fix all errors shown above" >&2
    echo "2. Run 'npx biome check --write' to auto-fix formatting issues" >&2
    echo "3. Run 'npx biome check' to verify all issues are resolved" >&2
    echo "" >&2
    echo "To see only errors: npx biome check --diagnostic-level=error" >&2
    echo "To auto-fix all: npx biome check --write" >&2
    exit 2
elif [ $WARNINGS -gt 0 ]; then
    log "⚠️ Project has $WARNINGS warning(s) - consider fixing them"
    # Show summary of warnings but don't fail
    echo "$CHECK_OUTPUT" | grep -A 2 "warning\[" | head -20 >&2
    exit 0
fi

# Success
log "✅ Biome project check passed - code is clean!"
exit 0