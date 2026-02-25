#!/usr/bin/env bash
set -euo pipefail

# Manual loader for Apollo CSV exports → BigQuery
# Usage:
#   ./scripts/import-apollo-csv-to-bigquery.sh \
#     --file /path/to/export.csv \
#     --table apollo_tam_raw_2026_02_15 \
#     --dataset staging \
#     --project slideheroes-data-platform

FILE=""
TABLE=""
DATASET="staging"
PROJECT="${GCP_PROJECT_ID:-slideheroes-data-platform}"
SKIP_LEADING_ROWS=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) FILE="$2"; shift 2;;
    --table) TABLE="$2"; shift 2;;
    --dataset) DATASET="$2"; shift 2;;
    --project) PROJECT="$2"; shift 2;;
    --skip-leading-rows) SKIP_LEADING_ROWS="$2"; shift 2;;
    -h|--help)
      sed -n '1,40p' "$0"; exit 0;;
    *)
      echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

if [[ -z "$FILE" || -z "$TABLE" ]]; then
  echo "Missing --file or --table" >&2
  exit 1
fi

if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

# Notes:
# - autodetect is fine for v0 loads.
# - consider adding an explicit schema once we stabilize exports.
# - write_disposition is append by default; use --replace to override (not included here intentionally).

bq --project_id="$PROJECT" load \
  --source_format=CSV \
  --skip_leading_rows="$SKIP_LEADING_ROWS" \
  --allow_quoted_newlines \
  --autodetect \
  "$DATASET.$TABLE" \
  "$FILE"

echo "Loaded $FILE → $PROJECT:$DATASET.$TABLE"
