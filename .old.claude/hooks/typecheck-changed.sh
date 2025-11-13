#!/bin/bash

# TypeScript Check Changed Hook
# Runs TypeScript type checking on changed files
# Based on ClaudeKit's typecheck implementation

set -euo pipefail

# Get the project root and hook configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Function to log messages
log() {
    echo "[typecheck-changed] $*" >&2
}

# Function to get config value from settings.json
get_config() {
    local key="$1"
    local default="$2"
    if [ -f "$CONFIG_FILE" ]; then
        value=$(jq -r ".typescript.${key} // null" "$CONFIG_FILE" 2>/dev/null || echo "null")
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

# Skip non-TypeScript files
case "$FILE_PATH" in
    *.ts|*.tsx)
        ;;
    *)
        exit 0
        ;;
esac

# Check if tsconfig.json exists (indicating TypeScript is configured)
if [ ! -f "${PROJECT_ROOT}/tsconfig.json" ] && [ ! -f "$(dirname "$FILE_PATH")/tsconfig.json" ]; then
    log "TypeScript not configured, skipping type check"
    exit 0
fi

# Load configuration
TSC_COMMAND=$(get_config "command" "npx tsc")
TIMEOUT=$(get_config "timeout" "30")
CHECK_ENABLED=$(get_config "checkOnChange" "true")
STRICT_MODE=$(get_config "strictMode" "false")

# Check if type checking is enabled
if [ "$CHECK_ENABLED" = "false" ]; then
    exit 0
fi

log "🔍 Type checking ${FILE_PATH}..."

# Build TypeScript command for single file checking
TSC_CMD="$TSC_COMMAND --noEmit --skipLibCheck"

# Add strict mode if configured
if [ "$STRICT_MODE" = "true" ]; then
    TSC_CMD="$TSC_CMD --strict"
fi

# Add the file path
TSC_CMD="$TSC_CMD \"$FILE_PATH\""

# Run TypeScript with timeout
set +e
if command -v timeout >/dev/null 2>&1; then
    TYPECHECK_OUTPUT=$(timeout "${TIMEOUT}s" bash -c "cd '$PROJECT_ROOT' && $TSC_CMD" 2>&1)
    EXIT_CODE=$?
else
    TYPECHECK_OUTPUT=$(cd "$PROJECT_ROOT" && eval "$TSC_CMD" 2>&1)
    EXIT_CODE=$?
fi
set -e

# Check if timeout occurred
if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ TYPESCRIPT CHECK TIMEOUT" >&2
    echo "" >&2
    echo "Type checking timed out after ${TIMEOUT} seconds" >&2
    echo "The file may have complex type dependencies" >&2
    exit 2
fi

# Parse TypeScript errors
if [ $EXIT_CODE -ne 0 ]; then
    # Count errors
    ERROR_COUNT=$(echo "$TYPECHECK_OUTPUT" | grep -c "error TS" || true)
    
    echo "❌ TYPESCRIPT TYPE ERRORS DETECTED" >&2
    echo "" >&2
    echo "$TYPECHECK_OUTPUT" >&2
    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "Found $ERROR_COUNT TypeScript error(s) in $FILE_PATH" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "" >&2
    echo "REQUIRED ACTIONS:" >&2
    echo "1. Fix ALL type errors shown above" >&2
    echo "2. Common fixes:" >&2
    echo "   - Add missing type annotations" >&2
    echo "   - Fix type mismatches" >&2
    echo "   - Import missing types" >&2
    echo "   - Use proper generic types" >&2
    echo "   - Avoid using 'any' type" >&2
    echo "" >&2
    echo "To check entire project: npx tsc --noEmit" >&2
    echo "To see all errors: npx tsc --noEmit --pretty" >&2
    exit 2
fi

# Success
log "✅ TypeScript check passed!"
exit 0