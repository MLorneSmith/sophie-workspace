#!/bin/bash
# Log activity to Mission Control
# Usage: log-activity.sh <action> <summary> [details]

ACTION="${1:-update}"
SUMMARY="${2:-Sophie activity}"
DETAILS="${3:-}"

# Load credentials
ENV_FILE="$HOME/clawd/slideheroes-internal-tools/app/.env.local"
if [ -f "$ENV_FILE" ]; then
  CF_ACCESS_CLIENT_ID=$(grep '^CF_ACCESS_CLIENT_ID=' "$ENV_FILE" | cut -d '=' -f2-)
  CF_ACCESS_CLIENT_SECRET=$(grep '^CF_ACCESS_CLIENT_SECRET=' "$ENV_FILE" | cut -d '=' -f2-)
fi

if [ -z "$CF_ACCESS_CLIENT_ID" ] || [ -z "$CF_ACCESS_CLIENT_SECRET" ]; then
  echo "Error: CF Access credentials not found in $ENV_FILE"
  exit 1
fi

# Post to activity API
PAYLOAD=$(jq -n \
  --arg action "$ACTION" \
  --arg summary "$SUMMARY" \
  --arg details "$DETAILS" \
  '{action: $action, summary: $summary, details: (if $details == "" then null else $details end)}')

curl -s -X POST "https://internal.slideheroes.com/api/sophie/activity" \
  -H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo ""
