#!/bin/bash
# Hook Profile Script
# Measures performance of configured hooks
# Adapted from ClaudeKit for shell-based implementation

set -euo pipefail

# Configuration
CONFIG_FILE=".claude/settings.json"
HOOKS_DIR=".claude/hooks"

# Performance thresholds
SLOW_EXECUTION_MS=5000  # 5 seconds
MAX_OUTPUT_CHARS=30000  # Claude Code truncation limit
SAFE_OUTPUT_CHARS=20000 # Warning threshold

# ANSI colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RESET='\033[0m'

# Function to measure hook execution
measure_hook() {
  local HOOK_NAME=$1
  local HOOK_PATH="$HOOKS_DIR/$HOOK_NAME.sh"
  
  if [ ! -f "$HOOK_PATH" ]; then
    echo "Hook not found: $HOOK_NAME" >&2
    return 1
  fi
  
  # Prepare test payload based on hook type
  local TEST_PAYLOAD='{}'
  
  case "$HOOK_NAME" in
    test-changed|biome-lint-changed|biome-format-changed|typecheck-changed|check-any-types)
      # PostToolUse hooks need a file path
      TEST_PAYLOAD='{"tool_input": {"file_path": "src/test.ts"}}'
      ;;
    test-project|self-review|biome-project-check|create-checkpoint)
      # Stop hooks
      TEST_PAYLOAD='{"hook_event_name": "Stop", "session_id": "test-session"}'
      ;;
    codebase-map|thinking-level)
      # UserPromptSubmit hooks
      TEST_PAYLOAD='{"hook_event_name": "UserPromptSubmit", "session_id": "test-session", "user_message": "test"}'
      ;;
    file-guard)
      # PreToolUse hook with sensitive file
      TEST_PAYLOAD='{"tool_name": "Read", "tool_input": {"file_path": ".env"}}'
      ;;
  esac
  
  # Run hook and measure time
  local START_TIME=$(date +%s%3N)  # milliseconds
  local OUTPUT_FILE=$(mktemp)
  local EXIT_CODE=0
  
  # Execute hook with test payload
  echo "$TEST_PAYLOAD" | "$HOOK_PATH" > "$OUTPUT_FILE" 2>&1 || EXIT_CODE=$?
  
  local END_TIME=$(date +%s%3N)
  local DURATION=$((END_TIME - START_TIME))
  
  # Measure output size
  local CHAR_COUNT=$(wc -c < "$OUTPUT_FILE")
  local TOKEN_ESTIMATE=$((CHAR_COUNT / 4))  # Rough estimate: 4 chars per token
  
  # Clean up
  rm -f "$OUTPUT_FILE"
  
  echo "$HOOK_NAME|$DURATION|$CHAR_COUNT|$TOKEN_ESTIMATE|$EXIT_CODE"
}

# Function to display results
display_results() {
  echo ""
  echo "Hook Performance Profile"
  echo "════════════════════════════════════════════════════════════════════════"
  printf "%-30s %-12s %-15s %-10s %-10s\n" "Hook" "Time" "Characters" "Tokens" "Status"
  echo "────────────────────────────────────────────────────────────────────────"
  
  local HAS_ISSUES=false
  
  while IFS='|' read -r HOOK_NAME DURATION CHARS TOKENS EXIT_CODE; do
    local TIME_STR="${DURATION}ms"
    local STATUS="✅"
    
    if [ "$EXIT_CODE" -ne 0 ]; then
      STATUS="❌"
    fi
    
    # Determine if line should be colored
    local COLOR=""
    
    # Check time threshold
    if [ "$DURATION" -gt "$SLOW_EXECUTION_MS" ]; then
      COLOR="$RED"
      HAS_ISSUES=true
    fi
    
    # Check output size for UserPromptSubmit hooks
    if [[ "$HOOK_NAME" == "codebase-map" ]] || [[ "$HOOK_NAME" == "thinking-level" ]]; then
      if [ "$CHARS" -gt "$MAX_OUTPUT_CHARS" ]; then
        COLOR="$RED"
        HAS_ISSUES=true
      elif [ "$CHARS" -gt "$SAFE_OUTPUT_CHARS" ]; then
        if [ -z "$COLOR" ]; then
          COLOR="$YELLOW"
        fi
        HAS_ISSUES=true
      fi
    fi
    
    # Display row
    printf "${COLOR}%-30s %-12s %-15s %-10s %-10s${RESET}\n" \
      "$HOOK_NAME" "$TIME_STR" "$CHARS" "$TOKENS" "$STATUS"
  done
  
  echo "════════════════════════════════════════════════════════════════════════"
  
  # Display performance warnings if needed
  if [ "$HAS_ISSUES" = true ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Performance Issues Detected${RESET}"
    echo ""
    echo "Recommendations:"
    echo "• Hooks over ${SLOW_EXECUTION_MS}ms may cause noticeable delays"
    echo "• UserPromptSubmit hooks over ${MAX_OUTPUT_CHARS} chars will be truncated"
    echo "• Consider optimizing slow hooks or disabling them in .claude/settings.json"
  fi
}

# Main execution
main() {
  echo "🔍 Profiling Claude Code Hooks"
  echo "────────────────────────────────────────────────────────────────"
  
  # Check if specific hook requested
  if [ $# -eq 1 ]; then
    HOOKS_TO_PROFILE=("$1")
    echo "Profiling specific hook: $1"
  else
    # Get all configured hooks from settings.json
    if [ ! -f "$CONFIG_FILE" ]; then
      echo "No settings.json found. Profiling all available hooks..."
      HOOKS_TO_PROFILE=($(ls "$HOOKS_DIR"/*.sh 2>/dev/null | xargs -n1 basename | sed 's/\.sh$//' || true))
    else
      # Extract hook names from settings
      # This is simplified - would need more complex parsing for full accuracy
      HOOKS_TO_PROFILE=($(ls "$HOOKS_DIR"/*.sh 2>/dev/null | xargs -n1 basename | sed 's/\.sh$//' || true))
    fi
  fi
  
  if [ ${#HOOKS_TO_PROFILE[@]} -eq 0 ]; then
    echo "No hooks found to profile."
    exit 0
  fi
  
  echo "Found ${#HOOKS_TO_PROFILE[@]} hooks to profile"
  echo ""
  
  # Profile each hook
  RESULTS=""
  for HOOK in "${HOOKS_TO_PROFILE[@]}"; do
    echo -n "Profiling $HOOK... "
    
    if RESULT=$(measure_hook "$HOOK" 2>/dev/null); then
      echo "done"
      if [ -z "$RESULTS" ]; then
        RESULTS="$RESULT"
      else
        RESULTS="$RESULTS"$'\n'"$RESULT"
      fi
    else
      echo "failed"
    fi
  done
  
  # Display results
  if [ -n "$RESULTS" ]; then
    echo "$RESULTS" | display_results
  else
    echo "No hooks were successfully profiled."
  fi
  
  echo ""
  echo "Profile complete."
}

# Run main function
main "$@"