#!/bin/bash
# get-provider-health.sh — Get provider health metrics for a given day
# Output: JSON with availability, error taxonomy, and per-provider stats

YESTERDAY="${YESTERDAY:-$(date -d "yesterday" +%Y-%m-%d)}"
SESSION_DIR="/home/ubuntu/.openclaw/agents/main/sessions"

if [ ! -d "$SESSION_DIR" ]; then
  echo '{"providers":[],"errors":{"total":0,"byCategory":{},"byProvider":{}},"availability":{}}'
  exit 0
fi

# Extract all assistant messages with provider, model, and error info
# Output: provider|model|hasError|errorMessage
MESSAGES=$(cat "$SESSION_DIR"/*.jsonl 2>/dev/null | jq -r '
  select(.timestamp and (.timestamp | startswith("'"$YESTERDAY"'")) and .type == "message" and .message.role == "assistant") |
  "\(.message.provider // "unknown")|\(.message.model // "unknown")|\(if .message.errorMessage then 1 else 0 end)|\(.message.errorMessage // "")"'
)

# Count total messages and errors per provider
PROVIDER_STATS=$(echo "$MESSAGES" | awk -F'|' '
  {
    provider = $1
    model = $2
    hasError = $3
    errorMsg = $4
    
    total[provider]++
    if (hasError == 1) {
      errors[provider]++
      allErrors = allErrors errorMsg "\n"
    }
    
    # Track models per provider
    if (models[provider] == "") {
      models[provider] = model
    } else if (index(models[provider], model) == 0) {
      models[provider] = models[provider] "," model
    }
  }
  END {
    printf "["
    first = 1
    for (p in total) {
      if (!first) printf ","
      first = 0
      err = errors[p] + 0
      tot = total[p]
      avail = (tot > 0) ? 100 - (err * 100 / tot) : 100
      printf "{\"provider\":\"%s\",\"total\":%d,\"errors\":%d,\"availability\":%.1f,\"models\":\"%s\"}", p, tot, err, avail, models[p]
    }
    printf "]"
  }
')

# Categorize errors
ERROR_TAXONOMY=$(echo "$MESSAGES" | awk -F'|' '
  {
    errorMsg = $4
    provider = $1
    
    if (errorMsg == "") next
    
    # Categorize errors
    category = "unknown"
    
    # Rate limit / capacity (429)
    if (errorMsg ~ /^429/ || errorMsg ~ /[Rr]ate limit/ || errorMsg ~ /[Uu]sage limit/ || errorMsg ~ /overloaded/ || errorMsg ~ /insufficient capacity/) {
      category = "rate_limit"
    }
    # Auth/billing (401/403)
    else if (errorMsg ~ /^40[13]/ || errorMsg ~ /[Aa]uth/ || errorMsg ~ /expired/ || errorMsg ~ /[Kk]ey limit/ || errorMsg ~ /payment/) {
      category = "auth_billing"
    }
    # Bad request (400)
    else if (errorMsg ~ /^400/ || errorMsg ~ /[Ii]nvalid/ || errorMsg ~ /exceeds.*maximum/ || errorMsg ~ /below minimum/) {
      category = "bad_request"
    }
    # Server (5xx)
    else if (errorMsg ~ /^5[0-9][0-9]/ || errorMsg ~ /[Ii]nternal server error/ || errorMsg ~ /api_error/) {
      category = "server"
    }
    # Client/network
    else if (errorMsg ~ /[Tt]imeout/ || errorMsg ~ /[Cc]onnection/ || errorMsg ~ /[Aa]borted/ || errorMsg ~ /terminated/) {
      category = "client_network"
    }
    
    byCategory[category]++
    byProviderCategory[provider "|" category]++
  }
  END {
    # By category
    printf "{\"byCategory\":{"
    first = 1
    for (cat in byCategory) {
      if (!first) printf ","
      first = 0
      printf "\"%s\":%d", cat, byCategory[cat]
    }
    printf "},\"byProviderCategory\":{"
    
    # By provider+category
    first = 1
    for (key in byProviderCategory) {
      split(key, parts, "|")
      provider = parts[1]
      cat = parts[2]
      if (!first) printf ","
      first = 0
      printf "\"%s|%s\":%d", provider, cat, byProviderCategory[key]
    }
    printf "}}"
  }
')

# Calculate overall availability
OVERALL=$(echo "$MESSAGES" | awk -F'|' '
  {
    total++
    if ($3 == 1) errors++
  }
  END {
    avail = (total > 0) ? 100 - (errors * 100 / total) : 100
    printf "{\"total\":%d,\"errors\":%d,\"availability\":%.1f}", total, errors, avail
  }
')

# Combine into final output
jq -n \
  --argjson providers "$PROVIDER_STATS" \
  --argjson errors "$ERROR_TAXONOMY" \
  --argjson overall "$OVERALL" \
  --arg date "$YESTERDAY" \
  '{
    date: $date,
    overall: $overall,
    providers: $providers,
    errors: $errors
  }'
