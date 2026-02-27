#!/bin/bash
# enforce-session-ttl.sh — Kill sessions running too long without user activity
#
# A "TTL-exceeded" session is one where:
# - The last user message is >TTL_HOURS old (default 6h), AND
# - The session is still receiving activity (assistant messages, heartbeats)
#
# This catches runaway sessions before they burn excessive tokens.

SESSION_DIR="/home/ubuntu/.openclaw/agents/main/sessions"
LOG_FILE="/home/ubuntu/clawd/logs/session-ttl.log"
TTL_HOURS="${TTL_HOURS:-6}"
DRY_RUN="${DRY_RUN:-false}"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date -Iseconds)] $1" | tee -a "$LOG_FILE"
}

if [ ! -d "$SESSION_DIR" ]; then
  log "Session directory not found: $SESSION_DIR"
  exit 0
fi

log "=== Session TTL enforcement starting (threshold: ${TTL_HOURS}h) ==="

# Export sessions to database BEFORE cleanup
log "Exporting sessions to database..."
python3 /home/ubuntu/clawd/scripts/export-token-sessions.py --mark-ttl 2>&1 | while read line; do log "  $line"; done

killed=0
spared=0
errors=0

for f in "$SESSION_DIR"/*.jsonl; do
  [ -f "$f" ] || continue
  
  session_name=$(basename "$f" .jsonl)
  
  # Skip probe sessions (health checks)
  if [[ "$session_name" == probe-* ]]; then
    continue
  fi
  
  # Get last user message timestamp
  last_user=$(jq -r 'select(.type == "message" and .message.role == "user") | .timestamp' "$f" 2>/dev/null | tail -1)
  
  # Skip sessions with no user messages (probably just created)
  if [ -z "$last_user" ]; then
    continue
  fi
  
  # Get last activity of any kind
  last_activity=$(jq -r 'select(.type == "message") | .timestamp' "$f" 2>/dev/null | tail -1)
  
  if [ -z "$last_activity" ]; then
    continue
  fi
  
  # Calculate age of last user message
  user_epoch=$(date -d "$last_user" +%s 2>/dev/null)
  now_epoch=$(date +%s)
  user_age_hours=$(( (now_epoch - user_epoch) / 3600 ))
  
  # Check if TTL exceeded
  if [ "$user_age_hours" -gt "$TTL_HOURS" ]; then
    # Get activity since last user (to confirm it's still "running")
    activity_epoch=$(date -d "$last_activity" +%s 2>/dev/null)
    activity_age_hours=$(( (now_epoch - activity_epoch) / 3600 ))
    
    # Only kill if there was recent activity (within last 2h)
    # This distinguishes "runaway" from "abandoned" (zombie cleanup handles abandoned)
    if [ "$activity_age_hours" -lt 2 ]; then
      # Get session stats for logging
      msg_count=$(jq -r 'select(.type == "message" and .message.role == "assistant")' "$f" 2>/dev/null | wc -l)
      file_size=$(ls -lh "$f" | awk '{print $5}')
      
      log "TTL EXCEEDED: $session_name"
      log "  Last user: $last_user (${user_age_hours}h ago)"
      log "  Last activity: $last_activity (${activity_age_hours}h ago)"
      log "  Messages: $msg_count, Size: $file_size"
      
      if [ "$DRY_RUN" != "true" ]; then
        if rm "$f"; then
          ((killed++))
          log "  Killed"
        else
          ((errors++))
          log "  FAILED to kill"
        fi
      else
        log "  [DRY RUN] Would kill"
        ((killed++))
      fi
    else
      ((spared++))
    fi
  else
    ((spared++))
  fi
done

log "=== TTL enforcement complete: $killed killed, $spared spared, $errors errors ==="
