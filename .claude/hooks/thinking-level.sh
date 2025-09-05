#!/bin/bash

# Thinking Level Enhancement Hook for Claude Code
# Based on ClaudeKit's thinking level implementation
# 
# This hook injects thinking level keywords to enhance Claude's responses
# Levels: 0 (none), 1 (think), 2 (think hard), 3 (ultrathink)
#
# Configuration in .claude/settings.json:
# "thinking-level": {
#   "level": 2
# }

set -euo pipefail

# Get project root
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# Default thinking level
DEFAULT_LEVEL=2

# Function to get thinking level from settings
get_thinking_level() {
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo "$DEFAULT_LEVEL"
        return
    fi
    
    # Extract thinking level from settings.json
    # Using jq if available, otherwise fallback to grep/sed
    if command -v jq &> /dev/null; then
        level=$(jq -r '.["thinking-level"].level // 2' "$SETTINGS_FILE" 2>/dev/null || echo "$DEFAULT_LEVEL")
    else
        # Fallback to grep/sed for systems without jq
        level=$(grep -A2 '"thinking-level"' "$SETTINGS_FILE" 2>/dev/null | \
                grep '"level"' | \
                sed -E 's/.*"level"[[:space:]]*:[[:space:]]*([0-9]).*/\1/' || echo "$DEFAULT_LEVEL")
    fi
    
    # Validate level is 0-3
    if [[ ! "$level" =~ ^[0-3]$ ]]; then
        level="$DEFAULT_LEVEL"
    fi
    
    echo "$level"
}

# Function to get keyword for level
get_keyword_for_level() {
    local level=$1
    
    case $level in
        0) echo "" ;;
        1) echo "think" ;;
        2) echo "think hard" ;;
        3) echo "ultrathink" ;;
        *) echo "think hard" ;;  # Default to level 2
    esac
}

# Main execution
main() {
    # Get the configured level
    level=$(get_thinking_level)
    
    # Get the keyword for this level
    keyword=$(get_keyword_for_level "$level")
    
    # If level 0 or empty keyword, don't inject anything
    if [ "$level" = "0" ] || [ -z "$keyword" ]; then
        exit 0
    fi
    
    # Output JSON response for Claude Code hooks
    # This format allows the hook to inject additional context
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "$keyword"
  }
}
EOF
}

# Run main function
main