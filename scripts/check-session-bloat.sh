#!/bin/bash
# check-session-bloat.sh — Detect sessions with excessive context size
# Output: JSON array of bloated sessions

SESSION_DIR="/home/ubuntu/.openclaw/agents/main/sessions"
THRESHOLD="${THRESHOLD:-50000}"  # Default 50K input tokens

if [ ! -d "$SESSION_DIR" ]; then
  echo '[]'
  exit 0
fi

# Find sessions where the last assistant message has input tokens > threshold
bloated=$(
  for f in "$SESSION_DIR"/*.jsonl; do
    [ -f "$f" ] || continue
    
    # Get the last assistant message's input tokens
    last_input=$(jq -r '
      select(.type == "message" and .message.role == "assistant" and .message.usage.input) |
      .message.usage.input
    ' "$f" 2>/dev/null | tail -1)
    
    if [ -n "$last_input" ] && [ "$last_input" -gt "$THRESHOLD" ] 2>/dev/null; then
      session_name=$(basename "$f" .jsonl)
      msg_count=$(jq -r 'select(.type == "message" and .message.role == "assistant")' "$f" 2>/dev/null | wc -l)
      
      # Get session age (first to last message)
      first_ts=$(jq -r 'select(.type == "message") | .timestamp' "$f" 2>/dev/null | head -1)
      last_ts=$(jq -r 'select(.type == "message") | .timestamp' "$f" 2>/dev/null | tail -1)
      
      printf '%s|%d|%d|%s|%s\n' "$session_name" "$last_input" "$msg_count" "$first_ts" "$last_ts"
    fi
  done
)

if [ -z "$bloated" ]; then
  echo '[]'
  exit 0
fi

# Format as JSON
echo "$bloated" | awk -F'|' '
  BEGIN {
    printf "["
    first = 1
  }
  {
    if (!first) printf ","
    first = 0
    printf "{\"session\":\"%s\",\"inputTokens\":%d,\"messages\":%d,\"firstTs\":\"%s\",\"lastTs\":\"%s\"}", $1, $2, $3, $4, $5
  }
  END {
    printf "]"
  }
' | jq 'sort_by(-.inputTokens)'
