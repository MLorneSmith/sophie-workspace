#!/bin/bash
# get-model-usage.sh — Get model usage distribution for a given day
# Output: JSON array [{model, messages, tokens, inputTokens, outputTokens, source}] sorted by tokens descending
#
# Covers:
# 1. All session messages (main + isolated/sub-agent sessions)
# 2. Heartbeat usage (estimated from config, since HEARTBEAT_OK responses are discarded before logging)

# Use ET (America/Toronto) with 6am cutoff for day boundaries.
# A "day" runs from 6:00 AM ET to 5:59 AM ET the next day.
# This means nightly work (11pm-2am) belongs to the same "day" it started.
YESTERDAY="${YESTERDAY:-$(TZ=America/Toronto date -d "yesterday" +%Y-%m-%d)}"

# Day boundaries: yesterday 6:00 AM ET → today 6:00 AM ET
DAY_START_ET="${YESTERDAY}T06:00:00"
DAY_END_ET="$(TZ=America/Toronto date -d "$YESTERDAY + 1 day" +%Y-%m-%d)T06:00:00"
# Convert to UTC ISO timestamps
DAY_START_UTC=$(TZ=America/Toronto date -d "$DAY_START_ET" -u +%Y-%m-%dT%H:%M:%S)
DAY_END_UTC=$(TZ=America/Toronto date -d "$DAY_END_ET" -u +%Y-%m-%dT%H:%M:%S)
SESSION_DIR="/home/ubuntu/.openclaw/agents/main/sessions"
CONFIG_FILE="/home/ubuntu/.openclaw/openclaw.json"

if [ ! -d "$SESSION_DIR" ]; then
  echo '[]'
  exit 0
fi

# ─── 1. Session-logged model usage ───────────────────────────
# Scans ALL session files and extracts token usage from .message.usage
# Output format: model|messages|tokens|inputTokens|outputTokens

SESSION_DATA=$({
  for f in "$SESSION_DIR"/*.jsonl "$SESSION_DIR"/*.jsonl.deleted.*; do
    [ -f "$f" ] || continue
    jq -r '
      select(.timestamp and (.timestamp >= "'"$DAY_START_UTC"'" and .timestamp < "'"$DAY_END_UTC"'") and .type == "message" and .message.role == "assistant" and .message.model and (.message.model != "delivery-mirror")) |
      "\(.message.provider // "unknown")/\(.message.model)|1|\((.message.usage.input // 0) + (.message.usage.output // 0))|\(.message.usage.input // 0)|\(.message.usage.output // 0)"
    ' "$f" 2>/dev/null
  done
})

# Aggregate by model
if [ -n "$SESSION_DATA" ]; then
  SESSION_USAGE=$(echo "$SESSION_DATA" | awk -F'|' '
    {
      model[$1] = $1
      messages[$1] += $2
      tokens[$1] += $3
      input[$1] += $4
      output[$1] += $5
    }
    END {
      printf "["
      first = 1
      for (m in model) {
        if (!first) printf ","
        first = 0
        printf "{\"model\":\"%s\",\"messages\":%d,\"tokens\":%d,\"inputTokens\":%d,\"outputTokens\":%d,\"source\":\"sessions\"}", model[m], messages[m], tokens[m], input[m], output[m]
      }
      printf "]"
    }
  ')
else
  SESSION_USAGE="[]"
fi

# ─── 2. Heartbeat model usage ─────────────────────────────────
# Heartbeat responses are partially logged in session files (some HEARTBEAT_OK
# responses are captured, some are discarded). Rather than estimate with bad
# assumptions, we rely solely on the session data above. The heartbeat model's
# actual usage is already included in the session scan.

# ─── 3. Merge and sort ───────────────────────────────────────
# Group by model, sum all metrics, sort by tokens descending
echo "$SESSION_USAGE" | jq '
  group_by(.model) | 
  map({
    model: .[0].model, 
    messages: (map(.messages) | add),
    tokens: (map(.tokens) | add),
    inputTokens: (map(.inputTokens) | add),
    outputTokens: (map(.outputTokens) | add),
    sources: (map(.source) | unique | join("+"))
  }) | 
  sort_by(-.tokens)'
