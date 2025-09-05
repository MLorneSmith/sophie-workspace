#!/bin/bash

# Biome Lint Changed Hook
# Runs Biome linting on changed files after edit operations
# Based on ClaudeKit's lint-changed hook, adapted for Biome

set -euo pipefail

# Get the project root and hook configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Function to log messages
log() {
    echo "[biome-lint-changed] $*" >&2
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

# Check if this is a file operation
if [ -z "${CLAUDE_TOOL:-}" ]; then
    exit 0
fi

# Only run on file modification tools
case "$CLAUDE_TOOL" in
    Write|Edit|MultiEdit)
        ;;
    *)
        exit 0
        ;;
esac

# Get the file path from the tool parameters
FILE_PATH="${CLAUDE_PARAM_file_path:-}"

# Skip if no file path provided
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Skip non-JavaScript/TypeScript files
case "$FILE_PATH" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs)
        ;;
    *)
        exit 0
        ;;
esac

# Check if biome.json exists (indicating Biome is configured)
if [ ! -f "${PROJECT_ROOT}/biome.json" ]; then
    log "Biome not configured, skipping lint check"
    exit 0
fi

# Load configuration
BIOME_COMMAND=$(get_config "command" "npx biome")
TIMEOUT=$(get_config "timeout" "30")
AUTO_FIX=$(get_config "autoFix" "false")

log "🔍 Running Biome lint on ${FILE_PATH}..."

# Build Biome command
BIOME_CMD="$BIOME_COMMAND check"

# Add auto-fix if configured
if [ "$AUTO_FIX" = "true" ]; then
    BIOME_CMD="$BIOME_CMD --write"
fi

# Add file path (quote it to handle spaces)
BIOME_CMD="$BIOME_CMD \"$FILE_PATH\""

# Run Biome with timeout
set +e
if command -v timeout >/dev/null 2>&1; then
    LINT_OUTPUT=$(timeout "${TIMEOUT}s" bash -c "cd '$PROJECT_ROOT' && $BIOME_CMD" 2>&1)
    EXIT_CODE=$?
else
    LINT_OUTPUT=$(cd "$PROJECT_ROOT" && eval "$BIOME_CMD" 2>&1)
    EXIT_CODE=$?
fi
set -e

# Check if timeout occurred
if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ BIOME LINT TIMEOUT" >&2
    echo "" >&2
    echo "Biome linting timed out after ${TIMEOUT} seconds" >&2
    echo "The file may be too large or complex" >&2
    exit 2
fi

# Check for errors
if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ BIOME LINT FAILED" >&2
    echo "" >&2
    echo "$LINT_OUTPUT" >&2
    echo "" >&2
    echo "MANDATORY ACTIONS:" >&2
    echo "1. Fix ALL lint errors shown above" >&2
    echo "2. Run 'npx biome check' to verify all issues are resolved" >&2
    echo "3. Common fixes:" >&2
    echo "   - Missing semicolons or trailing commas" >&2
    echo "   - Unused variables (remove or use them)" >&2
    echo "   - Console statements (remove from production code)" >&2
    echo "   - Improper indentation or formatting" >&2
    echo "" >&2
    echo "To auto-fix: npx biome check --write \"$FILE_PATH\"" >&2
    exit 2
fi

# Success
log "✅ Biome lint check passed!"
exit 0