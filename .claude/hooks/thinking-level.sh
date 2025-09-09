#!/bin/bash

# Dynamic Thinking Level Enhancement Hook for Claude Code
# Intelligently adjusts thinking level based on command complexity
# 
# Levels: 0 (none), 1 (think), 2 (think hard), 3 (ultrathink)
#
# User Override Prefixes:
#   quick: <command>       - Forces level 0 (no thinking)
#   think: <command>       - Forces level 1 (light thinking)
#   think hard: <command>  - Forces level 2 (deep thinking)
#   ultrathink: <command>  - Forces level 3 (maximum thinking)
#
# Configuration in .claude/settings.json:
# "thinking-level": {
#   "level": 1  # Default level when no pattern matches
# }

set -euo pipefail

# Get project root
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# Default thinking level
DEFAULT_LEVEL=1

# Function to get default thinking level from settings
get_default_level() {
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo "$DEFAULT_LEVEL"
        return
    fi
    
    # Extract thinking level from settings.json
    if command -v jq &> /dev/null; then
        level=$(jq -r '.["thinking-level"].level // 1' "$SETTINGS_FILE" 2>/dev/null || echo "$DEFAULT_LEVEL")
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

# Function to detect command complexity from prompt
detect_complexity() {
    local prompt="$1"
    local prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')
    
    # Check for user override prefixes first
    if [[ "$prompt_lower" =~ ^quick:\ .* ]]; then
        echo 0
        return
    elif [[ "$prompt_lower" =~ ^think:\ .* ]] && [[ ! "$prompt_lower" =~ ^think\ hard:\ .* ]]; then
        echo 1
        return
    elif [[ "$prompt_lower" =~ ^think\ hard:\ .* ]]; then
        echo 2
        return
    elif [[ "$prompt_lower" =~ ^ultrathink:\ .* ]]; then
        echo 3
        return
    fi
    
    # Simple file operations and queries - no thinking needed
    if echo "$prompt_lower" | grep -qE '^(ls|cat|pwd|cd|echo|read|show|list|what is|how many|display|view|get|fetch)\b'; then
        echo 0
        return
    fi
    
    # All git commands - no thinking needed
    # This includes all git subcommands and any commands from .claude/commands/git
    if echo "$prompt_lower" | grep -qE '^git\b' || echo "$prompt_lower" | grep -qE '^/git:'; then
        echo 0
        return
    fi
    
    # Git-related commands (commit, push, checkout, etc.) - no thinking needed
    if echo "$prompt_lower" | grep -qE '^/(commit|push|checkout|status)\b'; then
        echo 0
        return
    fi
    
    # Simple questions - no thinking needed
    if echo "$prompt_lower" | grep -qE '^(what|when|where|who|which|how much|how many|is|are|can|does|do)\b' && \
       [[ ${#prompt} -lt 50 ]]; then
        echo 0
        return
    fi
    
    # Build/test/lint commands - light thinking
    if echo "$prompt_lower" | grep -qE '(npm|pnpm|yarn|npx|build|test|lint|format|typecheck)\b'; then
        echo 1
        return
    fi
    
    # Complex architectural/security tasks - think hard
    if echo "$prompt_lower" | grep -qE '(refactor|architect|security|vulnerability|optimize performance|design pattern|scale|migrate|upgrade framework|analyze complexity|review architecture|audit|threat model)'; then
        echo 2
        return
    fi
    
    # Implementation and debugging - light to medium thinking
    if echo "$prompt_lower" | grep -qE '(implement|create|add|update|fix|debug|solve|write|develop|code|function|component|feature)'; then
        # Check for complexity indicators
        if echo "$prompt_lower" | grep -qE '(complex|advanced|sophisticated|comprehensive|full|complete|entire|all)'; then
            echo 2
            return
        fi
        echo 1
        return
    fi
    
    # Research and analysis tasks - medium thinking
    if echo "$prompt_lower" | grep -qE '(research|analyze|investigate|explore|compare|evaluate|assess|review code|find all|search for)'; then
        echo 2
        return
    fi
    
    # Default to configured level
    get_default_level
}

# Function to get keyword for level
get_keyword_for_level() {
    local level=$1
    
    case $level in
        0) echo "" ;;
        1) echo "think" ;;
        2) echo "think hard" ;;
        3) echo "ultrathink" ;;
        *) echo "think" ;;  # Default to level 1
    esac
}

# Main execution
main() {
    # Get the user prompt from stdin (passed by Claude Code hook system)
    local prompt=""
    if [ -t 0 ]; then
        # No stdin available, use default level
        level=$(get_default_level)
    else
        # Read prompt from stdin
        prompt=$(cat)
        # Detect complexity based on prompt
        level=$(detect_complexity "$prompt")
    fi
    
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