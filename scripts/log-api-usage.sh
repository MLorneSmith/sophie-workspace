#!/bin/bash
# Usage: log-api-usage.sh <service> <endpoint> [cost_estimate] [metadata_json]
# Example: log-api-usage.sh perplexity "/chat/completions" 0.006 '{"model":"sonar"}'

set -euo pipefail

SERVICE="${1:-}"
ENDPOINT="${2:-}"
COST="${3:-0}"
METADATA="${4:-null}"

if [ -z "$SERVICE" ] || [ -z "$ENDPOINT" ]; then
  echo "Usage: log-api-usage.sh <service> <endpoint> [cost_estimate] [metadata_json]" >&2
  exit 1
fi

curl -s -X POST http://localhost:3001/api/v1/usage/log \
  -H "Content-Type: application/json" \
  -d "{\"service\":\"$SERVICE\",\"endpoint\":\"$ENDPOINT\",\"costEstimate\":$COST,\"metadata\":$METADATA}"
