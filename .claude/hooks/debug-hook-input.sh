#!/bin/bash
#
# Debug Hook Input - Capture what Claude Code actually sends to UserPromptSubmit hooks
#
# Usage: Replace your thinking-level.sh hook temporarily with this script
# to capture the actual input format from Claude Code

set -euo pipefail

# Get project root
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
DEBUG_LOG="$PROJECT_ROOT/.claude/hooks/debug-input.log"

# Read all input from stdin
INPUT=$(cat)

# Log the input with timestamp
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$DEBUG_LOG"
echo "RAW INPUT:" >> "$DEBUG_LOG"
echo "$INPUT" >> "$DEBUG_LOG"
echo "" >> "$DEBUG_LOG"

# Try to parse as JSON
if command -v jq &> /dev/null; then
    echo "PARSED JSON:" >> "$DEBUG_LOG"
    if echo "$INPUT" | jq . 2>/dev/null; then
        echo "$INPUT" | jq . >> "$DEBUG_LOG" 2>&1

        # Extract prompt field
        PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)
        echo "EXTRACTED PROMPT: '$PROMPT'" >> "$DEBUG_LOG"
    else
        echo "NOT VALID JSON" >> "$DEBUG_LOG"
        echo "TREATING AS RAW TEXT: '$INPUT'" >> "$DEBUG_LOG"
    fi
else
    echo "JQ NOT AVAILABLE - RAW INPUT ONLY" >> "$DEBUG_LOG"
fi

echo "============================================" >> "$DEBUG_LOG"

# Always exit successfully to not interfere with Claude Code
exit 0