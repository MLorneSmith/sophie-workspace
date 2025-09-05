#!/bin/bash

# Biome Format Changed Hook
# Automatically formats changed files using Biome
# Based on ClaudeKit patterns, adapted for shell and Biome

set -euo pipefail

# Get the project root and hook configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Function to log messages
log() {
    echo "[biome-format-changed] $*" >&2
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

# Check if file is formattable by Biome
case "$FILE_PATH" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.json|*.jsonc)
        ;;
    *)
        # Skip files Biome doesn't format
        exit 0
        ;;
esac

# Check if biome.json exists (indicating Biome is configured)
if [ ! -f "${PROJECT_ROOT}/biome.json" ]; then
    log "Biome not configured, skipping format"
    exit 0
fi

# Load configuration
BIOME_COMMAND=$(get_config "command" "npx biome")
FORMAT_ENABLED=$(get_config "formatOnSave" "true")
TIMEOUT=$(get_config "formatTimeout" "10")

# Check if format-on-save is enabled
if [ "$FORMAT_ENABLED" = "false" ]; then
    exit 0
fi

log "📝 Formatting ${FILE_PATH} with Biome..."

# Build Biome format command
BIOME_CMD="$BIOME_COMMAND format --write \"$FILE_PATH\""

# Run Biome format with timeout
set +e
if command -v timeout >/dev/null 2>&1; then
    FORMAT_OUTPUT=$(timeout "${TIMEOUT}s" bash -c "cd '$PROJECT_ROOT' && $BIOME_CMD" 2>&1)
    EXIT_CODE=$?
else
    FORMAT_OUTPUT=$(cd "$PROJECT_ROOT" && eval "$BIOME_CMD" 2>&1)
    EXIT_CODE=$?
fi
set -e

# Check if timeout occurred
if [ $EXIT_CODE -eq 124 ]; then
    log "⚠️ Format timeout after ${TIMEOUT}s, file unchanged"
    exit 0  # Don't fail on format timeout
fi

# Check for errors
if [ $EXIT_CODE -ne 0 ]; then
    log "⚠️ Biome format failed (non-fatal):"
    echo "$FORMAT_OUTPUT" >&2
    exit 0  # Don't fail the hook on format errors
fi

# Check if file was actually modified
if echo "$FORMAT_OUTPUT" | grep -q "Formatted"; then
    log "✅ File formatted successfully"
else
    log "✅ File already properly formatted"
fi

exit 0