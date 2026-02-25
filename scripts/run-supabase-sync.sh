#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="$HOME/.clawdbot/.env"
LOG_DIR="$HOME/clawd/logs"
LOG_FILE="$LOG_DIR/supabase-sync.log"
SCRIPT="$HOME/clawd/scripts/sync-supabase-bigquery.py"

mkdir -p "$LOG_DIR"

# Load env vars (SUPABASE_DB_URL, etc.)
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  echo "ERROR: Env file not found: $ENV_FILE" | tee -a "$LOG_FILE"
  exit 1
fi

{
  echo ""
  echo "===== $(date -u '+%Y-%m-%dT%H:%M:%SZ') ====="
  "$SCRIPT" "$@"
} >> "$LOG_FILE" 2>&1
