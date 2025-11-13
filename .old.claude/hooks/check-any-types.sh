#!/bin/bash

# Check Any Types Hook
# Detects and prevents usage of 'any' type in TypeScript files
# Based on ClaudeKit's check-any-changed implementation

set -euo pipefail

# Get the project root and hook configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Function to log messages
log() {
    echo "[check-any-types] $*" >&2
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

# Skip test files if configured
SKIP_TESTS=$(get_config "skipTestFiles" "true")
if [ "$SKIP_TESTS" = "true" ]; then
    case "$FILE_PATH" in
        *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx)
            log "Skipping test file"
            exit 0
            ;;
    esac
fi

# Load configuration
CHECK_ANY_ENABLED=$(get_config "forbidAny" "true")
ALLOW_UNKNOWN=$(get_config "allowUnknown" "true")

# Check if any type checking is enabled
if [ "$CHECK_ANY_ENABLED" = "false" ]; then
    exit 0
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    log "File not found: $FILE_PATH"
    exit 0
fi

log "🚫 Checking for 'any' types in ${FILE_PATH}..."

# Read the file content
FILE_CONTENT=$(cat "$FILE_PATH")

# Remove comments and strings to avoid false positives
# This is a simplified version - a more robust implementation would use proper parsing
remove_comments_and_strings() {
    # Remove single-line comments
    sed 's|//.*$||g' | \
    # Remove multi-line comments (basic - doesn't handle nested)
    perl -0pe 's|/\*.*?\*/||gs' | \
    # Remove string literals (basic - doesn't handle all cases)
    sed "s/'[^']*'//g" | \
    sed 's/"[^"]*"//g' | \
    sed 's/`[^`]*`//g'
}

# Clean the content
CLEANED_CONTENT=$(echo "$FILE_CONTENT" | remove_comments_and_strings)

# Patterns to detect 'any' usage
ANY_PATTERNS=(
    ': *any\b'           # Type annotation: any
    ': *any\['          # Type annotation: any[]
    '<any>'             # Generic: <any>
    'as +any\b'         # Type assertion: as any
    '= *any\b'          # Assignment: = any
    ': *Array<any>'     # Array generic
    ': *Promise<any>'   # Promise generic
    ': *Record<[^,>]*,\s*any>' # Record with any value
)

# Track found issues
FOUND_ISSUES=""
ISSUE_COUNT=0
LINE_NUM=0

# Check each line for any patterns
while IFS= read -r line; do
    LINE_NUM=$((LINE_NUM + 1))
    ORIGINAL_LINE=$(echo "$FILE_CONTENT" | sed -n "${LINE_NUM}p")
    CLEANED_LINE=$(echo "$line")
    
    # Skip empty lines
    if [ -z "$CLEANED_LINE" ]; then
        continue
    fi
    
    # Skip lines with test utilities
    if echo "$CLEANED_LINE" | grep -qE 'expect\.any\(|\.any\('; then
        continue
    fi
    
    # Check each pattern
    for pattern in "${ANY_PATTERNS[@]}"; do
        if echo "$CLEANED_LINE" | grep -qE "$pattern"; then
            FOUND_ISSUES="${FOUND_ISSUES}Line ${LINE_NUM}: ${ORIGINAL_LINE}\n"
            ISSUE_COUNT=$((ISSUE_COUNT + 1))
            break
        fi
    done
done <<< "$CLEANED_CONTENT"

# Report results
if [ $ISSUE_COUNT -gt 0 ]; then
    echo "❌ FORBIDDEN 'any' TYPES DETECTED" >&2
    echo "" >&2
    echo "Found $ISSUE_COUNT usage(s) of 'any' type:" >&2
    echo "" >&2
    echo -e "$FOUND_ISSUES" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "REQUIRED: Replace ALL 'any' types with proper types" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "" >&2
    echo "RECOMMENDED FIXES:" >&2
    echo "1. Define specific interfaces or types:" >&2
    echo "   Instead of: data: any" >&2
    echo "   Use: interface Data { field: string; ... }" >&2
    echo "" >&2
    echo "2. Use union types for multiple possibilities:" >&2
    echo "   Instead of: value: any" >&2
    echo "   Use: value: string | number | boolean" >&2
    echo "" >&2
    echo "3. Use generics for flexible types:" >&2
    echo "   Instead of: items: any[]" >&2
    echo "   Use: items: T[] or items: Array<Item>" >&2
    echo "" >&2
    
    if [ "$ALLOW_UNKNOWN" = "true" ]; then
        echo "4. Use 'unknown' for truly unknown types:" >&2
        echo "   Instead of: response: any" >&2
        echo "   Use: response: unknown (with type guards)" >&2
        echo "" >&2
    fi
    
    echo "5. Use Record for object types:" >&2
    echo "   Instead of: config: any" >&2
    echo "   Use: config: Record<string, unknown>" >&2
    
    exit 2
fi

# Success
log "✅ No 'any' types found - good TypeScript practices!"
exit 0