#!/bin/bash
# get-model-usage.sh — Get model usage distribution for a given day
# Output: JSON array [{model, messages, tokens, inputTokens, outputTokens, source}] sorted by tokens descending
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
# Scans ALL session files and extracts token usage from .message.usage
# Output format: model|messages|tokens|inputTokens|outputTokens

SESSION_DATA=$({
  for f in "$SESSION_DIR"/*.jsonl "$SESSION_DIR"/*.jsonl.deleted.*; do
    [ -f "$f" ] || continue
    jq -r '
      select(.timestamp and (.timestamp | startswith("'"$YESTERDAY"'")) and .type == "message" and .message.role == "assistant" and .message.model and (.message.model != "delivery-mirror")) |
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

# ─── 2. Heartbeat model usage (estimated) ────────────────────
# OpenClaw discards HEARTBEAT_OK responses before writing to session files,
# so heartbeat model usage is invisible in the logs.
# Estimate tokens based on typical heartbeat exchange (~500 input, ~100 output)

HEARTBEAT_MODEL=""
if [ -f "$CONFIG_FILE" ]; then
  HEARTBEAT_MODEL=$(jq -r '.agents.defaults.heartbeat.model // empty' "$CONFIG_FILE" 2>/dev/null)
fi

if [ -n "$HEARTBEAT_MODEL" ]; then
  # Count heartbeat poll messages
  HB_COUNT=$(cat "$SESSION_DIR"/*.jsonl 2>/dev/null | \
    jq -r "select(.timestamp and (.timestamp | startswith(\"$YESTERDAY\")) and .type == \"message\" and .message.role == \"user\" and (.message.content // \"\" | tostring | test(\"HEARTBEAT\\\\.md|heartbeat\";\"i\")))" 2>/dev/null | wc -l)
  
  # Default estimate: ~36 heartbeats/day, ~600 tokens each
  if [ "$HB_COUNT" -eq 0 ]; then
    HB_COUNT=36
    HB_NOTE="estimated"
  else
    HB_NOTE="counted"
  fi
  
  # Estimate: 500 input + 100 output = 600 tokens per heartbeat
  HB_TOKENS=$((HB_COUNT * 600))
  HB_INPUT=$((HB_COUNT * 500))
  HB_OUTPUT=$((HB_COUNT * 100))
  
  # Merge heartbeat into results
  SESSION_USAGE=$(echo "$SESSION_USAGE" | jq \
    --arg model "$HEARTBEAT_MODEL" \
    --argjson messages "$HB_COUNT" \
    --argjson tokens "$HB_TOKENS" \
    --argjson input "$HB_INPUT" \
    --argjson output "$HB_OUTPUT" \
    --arg note "$HB_NOTE" \
    '. + [{"model": $model, "messages": $messages, "tokens": $tokens, "inputTokens": $input, "outputTokens": $output, "source": ("heartbeat-" + $note)}]')
fi

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
