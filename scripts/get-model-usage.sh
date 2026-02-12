#!/bin/bash
# get-model-usage.sh — Get model usage distribution for yesterday
# Output: JSON array [{model, count, source}] sorted by count descending
#
# Covers:
# 1. All session messages (main + isolated/sub-agent sessions)
# 2. Heartbeat usage (estimated from config, since HEARTBEAT_OK responses are discarded before logging)

YESTERDAY="${YESTERDAY:-$(date -d "yesterday" +%Y-%m-%d)}"
SESSION_DIR="/home/ubuntu/.openclaw/agents/main/sessions"
CONFIG_FILE="/home/ubuntu/.openclaw/openclaw.json"

if [ ! -d "$SESSION_DIR" ]; then
  echo '[]'
  exit 0
fi

# ─── 1. Session-logged model usage ───────────────────────────
# Scans ALL session files (main, isolated cron, sub-agent spawns)
# Including .deleted.* files — sub-agent sessions are cleaned up after completion
# but still contain usage data we need to count
# Use jq directly on each file but pre-filter with grep for performance.
# The grep narrows to lines containing the date in a timestamp field position,
# then jq validates the exact timestamp match.
SESSION_USAGE=$({
  for f in "$SESSION_DIR"/*.jsonl "$SESSION_DIR"/*.jsonl.deleted.*; do
    [ -f "$f" ] || continue
    jq -r "select(.timestamp and (.timestamp | startswith(\"$YESTERDAY\")) and .type == \"message\" and .message.role == \"assistant\" and .message.model and (.message.model != \"delivery-mirror\")) | \"\(.message.provider // \"unknown\")/\(.message.model)\"" "$f" 2>/dev/null
  done
} | \
  sort | uniq -c | sort -rn | \
  awk 'BEGIN{printf "["} NR>1{printf ","} {printf "{\"model\":\"%s\",\"count\":%d,\"source\":\"sessions\"}", $2, $1} END{printf "]"}')

# ─── 2. Heartbeat model usage (estimated) ────────────────────
# OpenClaw discards HEARTBEAT_OK responses before writing to session files,
# so heartbeat model usage is invisible in the logs.
# We estimate based on: heartbeat fires every ~30 min, ~16-18 hrs/day active.
# Count actual heartbeat-triggered user messages as a better proxy.

HEARTBEAT_MODEL=""
if [ -f "$CONFIG_FILE" ]; then
  HEARTBEAT_MODEL=$(jq -r '.agents.defaults.heartbeat.model // empty' "$CONFIG_FILE" 2>/dev/null)
fi

if [ -n "$HEARTBEAT_MODEL" ]; then
  # Count heartbeat poll messages (user role, contains the heartbeat prompt text)
  # These ARE logged even though the HEARTBEAT_OK responses may not be
  HB_COUNT=$(cat "$SESSION_DIR"/*.jsonl 2>/dev/null | \
    jq -r "select(.timestamp and (.timestamp | startswith(\"$YESTERDAY\")) and .type == \"message\" and .message.role == \"user\" and (.message.content // \"\" | tostring | test(\"HEARTBEAT\\.md|heartbeat\";\"i\")))" 2>/dev/null | wc -l)
  
  # If we can't detect heartbeat prompts in session logs, estimate from cron-like schedule
  # Default: ~30 min interval × ~18 active hours = ~36 heartbeats/day
  if [ "$HB_COUNT" -eq 0 ]; then
    HB_COUNT=36
    HB_NOTE="estimated"
  else
    HB_NOTE="counted"
  fi
  
  # Merge heartbeat into results
  if [ "$HB_COUNT" -gt 0 ]; then
    SESSION_USAGE=$(echo "$SESSION_USAGE" | jq --arg model "$HEARTBEAT_MODEL" --argjson count "$HB_COUNT" --arg note "$HB_NOTE" \
      '. + [{"model": $model, "count": $count, "source": ("heartbeat-" + $note)}]')
  fi
fi

# ─── 3. Merge and sort ───────────────────────────────────────
# Group by model (in case heartbeat model overlaps with session model), sum counts
echo "$SESSION_USAGE" | jq '
  group_by(.model) | 
  map({
    model: .[0].model, 
    count: (map(.count) | add),
    sources: (map(.source) | unique | join("+"))
  }) | 
  sort_by(-.count)'
