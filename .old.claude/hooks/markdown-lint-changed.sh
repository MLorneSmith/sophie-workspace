#!/bin/bash

# Markdown Lint Changed Hook
# Runs markdownlint-cli2 on changed markdown files after edit operations
# Based on biome-lint-changed hook, adapted for markdown files

set -euo pipefail

# Get the project root and hook configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Function to log messages
log() {
    echo "[markdown-lint-changed] $*" >&2
}

# Function to get config value from settings.json
get_config() {
    local key="$1"
    local default="$2"
    if [ -f "$CONFIG_FILE" ]; then
        value=$(jq -r ".markdown.${key} // null" "$CONFIG_FILE" 2>/dev/null || echo "null")
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

# Skip non-markdown files
case "$FILE_PATH" in
    *.md|*.markdown)
        ;;
    *)
        exit 0
        ;;
esac

# Skip .claude directory files (internal documentation)
case "$FILE_PATH" in
    */.claude/*)
        log "Skipping .claude directory file"
        exit 0
        ;;
esac

# Check if markdownlint-cli2 is available via pnpm
if ! pnpm list markdownlint-cli2 --depth=0 >/dev/null 2>&1; then
    log "markdownlint-cli2 not installed, skipping lint check"
    exit 0
fi

# Load configuration
MARKDOWN_COMMAND=$(get_config "command" "pnpm lint:md")
TIMEOUT=$(get_config "timeout" "30")
AUTO_FIX=$(get_config "autoFix" "false")

log "🔍 Running markdown lint on ${FILE_PATH}..."

# Build markdown lint command
MARKDOWN_CMD="npx markdownlint-cli2"

# Add auto-fix if configured
if [ "$AUTO_FIX" = "true" ]; then
    MARKDOWN_CMD="$MARKDOWN_CMD --fix"
fi

# Add file path (quote it to handle spaces)
MARKDOWN_CMD="$MARKDOWN_CMD \"$FILE_PATH\""

# Run markdownlint with timeout
set +e
if command -v timeout >/dev/null 2>&1; then
    LINT_OUTPUT=$(timeout "${TIMEOUT}s" bash -c "cd '$PROJECT_ROOT' && $MARKDOWN_CMD" 2>&1)
    EXIT_CODE=$?
else
    LINT_OUTPUT=$(cd "$PROJECT_ROOT" && eval "$MARKDOWN_CMD" 2>&1)
    EXIT_CODE=$?
fi
set -e

# Check if timeout occurred
if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ MARKDOWN LINT TIMEOUT" >&2
    echo "" >&2
    echo "Markdown linting timed out after ${TIMEOUT} seconds" >&2
    echo "The file may be too large or complex" >&2
    exit 2
fi

# Parse the output to check for actual errors
# markdownlint-cli2 exits with 1 if there are lint issues
if [ $EXIT_CODE -ne 0 ]; then
    # Check if output contains actual lint errors (not just the exit code)
    if echo "$LINT_OUTPUT" | grep -q "MD[0-9]"; then
        echo "❌ MARKDOWN LINT FAILED" >&2
        echo "" >&2
        echo "$LINT_OUTPUT" >&2
        echo "" >&2
        echo "MANDATORY ACTIONS:" >&2
        echo "1. Fix ALL markdown lint errors shown above" >&2
        echo "2. Run 'pnpm lint:md' to verify all issues are resolved" >&2
        echo "3. Common fixes:" >&2
        echo "   - MD013: Line too long (break lines at 120 chars)" >&2
        echo "   - MD022: Add blank lines around headings" >&2
        echo "   - MD032: Add blank lines around lists" >&2
        echo "   - MD040: Add language specifier to code blocks" >&2
        echo "   - MD047: Files should end with single newline" >&2
        echo "" >&2
        echo "To auto-fix: pnpm lint:md:fix (or npx markdownlint-cli2 --fix \"$FILE_PATH\")" >&2
        exit 2
    fi
fi

# Success
log "✅ Markdown lint check passed!"
exit 0