#!/bin/bash
# cleanup-zombie-sessions.sh — Remove stale/zombie sessions
#
# A "zombie" session is one where:
# - The last user message is >72 hours old, AND
# - There's been system activity (heartbeats, etc) after that
#
# These sessions accumulate context indefinitely and waste tokens.

SESSION_DIR="/home/ubuntu/.openclaw/agents/main/sessions"
LOG_FILE="/home/ubuntu/clawd/logs/session-cleanup.log"
ZOMBIE_THRESHOLD_HOURS="${ZOMBIE_THRESHOLD_HOURS:-72}"
DRY_RUN="${DRY_RUN:-false}"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date -Iseconds)] $1" | tee -a "$LOG_FILE"
}

if [ ! -d "$SESSION_DIR" ]; then
  log "Session directory not found: $SESSION_DIR"
  exit 0
fi

log "=== Session cleanup starting (threshold: ${ZOMBIE_THRESHOLD_HOURS}h) ==="

# Export sessions to database BEFORE cleanup
log "Exporting sessions to database..."
python3 /home/ubuntu/clawd/scripts/export-token-sessions.py --mark-zombie 2>&1 | while read line; do log "  $line"; done

cleaned=0
skipped=0
errors=0

for f in "$SESSION_DIR"/*.jsonl; do
  [ -f "$f" ] || continue
  
  session_name=$(basename "$f" .jsonl)
  
  # Get last user message timestamp
  last_user=$(jq -r 'select(.type == "message" and .message.role == "user") | .timestamp' "$f" 2>/dev/null | tail -1)
  
  # If no user messages ever, check first message age
  if [ -z "$last_user" ]; then
    first_msg=$(jq -r 'select(.type == "message") | .timestamp' "$f" 2>/dev/null | head -1)
    if [ -n "$first_msg" ]; then
      first_epoch=$(date -d "$first_msg" +%s 2>/dev/null)
      now_epoch=$(date +%s)
      age_hours=$(( (now_epoch - first_epoch) / 3600 ))
      
      if [ "$age_hours" -gt "$ZOMBIE_THRESHOLD_HOURS" ]; then
        log "ZOMBIE (no user): $session_name (${age_hours}h old)"
        if [ "$DRY_RUN" != "true" ]; then
          rm "$f" && ((cleaned++)) || ((errors++))
        else
          log "  [DRY RUN] Would delete"
          ((cleaned++))
        fi
      fi
    fi
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
  
  # Check if session is stale (no user activity for threshold hours)
  if [ "$user_age_hours" -gt "$ZOMBIE_THRESHOLD_HOURS" ]; then
    # Get session stats for logging
    msg_count=$(jq -r 'select(.type == "message" and .message.role == "assistant")' "$f" 2>/dev/null | wc -l)
    file_size=$(ls -lh "$f" | awk '{print $5}')
    
    log "ZOMBIE: $session_name"
    log "  Last user: $last_user (${user_age_hours}h ago)"
    log "  Last activity: $last_activity"
    log "  Messages: $msg_count, Size: $file_size"
    
    if [ "$DRY_RUN" != "true" ]; then
      if rm "$f"; then
        ((cleaned++))
        log "  Deleted"
      else
        ((errors++))
        log "  FAILED to delete"
      fi
    else
      log "  [DRY RUN] Would delete"
      ((cleaned++))
    fi
  else
    ((skipped++))
  fi
done

log "=== Cleanup complete: $cleaned removed, $skipped kept, $errors errors ==="
