#!/bin/bash
# Run all signal detection queries and output results
# Usage: ./run-all-signals.sh [--json] [--limit N]

set -euo pipefail

source ~/.clawdbot/.env 2>/dev/null || true
export GOOGLE_APPLICATION_CREDENTIALS

FORMAT="pretty"
LIMIT=""
if [[ "${1:-}" == "--json" ]]; then FORMAT="json"; fi
if [[ "${2:-}" == "--limit" ]]; then LIMIT="LIMIT ${3:-10}"; fi

SIGNALS_DIR="$(dirname "$0")"
OUTPUT_DIR="/tmp/signals-$(date +%Y%m%d)"
mkdir -p "$OUTPUT_DIR"

echo "🔍 Running signal detection queries — $(date)"
echo "================================================"

for sql_file in "$SIGNALS_DIR"/[0-9]*.sql; do
  signal_name=$(basename "$sql_file" .sql)
  echo ""
  echo "📊 Signal: $signal_name"
  echo "---"
  
  result=$(bq query --use_legacy_sql=false --format="$FORMAT" --max_rows=20 < "$sql_file" 2>/dev/null)
  
  if [ -z "$result" ] || echo "$result" | grep -q "0 rows"; then
    echo "   No signals detected ✅"
  else
    echo "$result"
    echo "$result" > "$OUTPUT_DIR/$signal_name.txt"
  fi
done

echo ""
echo "================================================"
echo "✅ Complete. Results saved to $OUTPUT_DIR/"
