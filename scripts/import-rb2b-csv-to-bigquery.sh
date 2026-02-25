#!/usr/bin/env bash
set -euo pipefail

# Manual loader for RB2B CSV exports → BigQuery
# Usage:
#   ./scripts/import-rb2b-csv-to-bigquery.sh \
#     --file /path/to/rb2b_export.csv \
#     --table rb2b_leads_raw_2026_02_19 \
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
# - RB2B does not (currently) offer a native BigQuery export.
# - This script loads a CSV export into a raw staging table.
# - Autodetect is fine for initial ingestion; add an explicit schema once fields stabilize.

bq --project_id="$PROJECT" load \
  --source_format=CSV \
  --skip_leading_rows="$SKIP_LEADING_ROWS" \
  --allow_quoted_newlines \
  --autodetect \
  "$DATASET.$TABLE" \
  "$FILE"

echo "Loaded $FILE → $PROJECT:$DATASET.$TABLE"
