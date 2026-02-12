#!/bin/bash
# dispatch-model.sh — Deterministic model selection by task role
# Usage: dispatch-model.sh <role>
# Returns: model ID string
#
# Roles: code, research, bulk, default
# Config: ~/clawd/config/model-dispatch.json
#
# Example:
#   MODEL=$(~/clawd/scripts/dispatch-model.sh code)
#   # → openai-codex/gpt-5.2

set -euo pipefail

ROLE="${1:-default}"
CONFIG="$HOME/clawd/config/model-dispatch.json"

if [ ! -f "$CONFIG" ]; then
  echo "anthropic/claude-opus-4-6"
  exit 0
fi

MODEL=$(jq -r ".roles[\"$ROLE\"].model // .roles.default.model" "$CONFIG")

if [ -z "$MODEL" ] || [ "$MODEL" = "null" ]; then
  MODEL=$(jq -r '.roles.default.model' "$CONFIG")
fi

echo "$MODEL"
