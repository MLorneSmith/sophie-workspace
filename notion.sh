#!/usr/bin/env bash
set -euo pipefail
TOKEN=$(grep -m1 '^NOTION_TOKEN=' ~/.openclaw/.secrets.env | cut -d= -f2- | tr -d '\r\n')
NOTION_VERSION=2022-06-28

notion() {
  local method=$1; shift
  local path=$1; shift
  local data=${1:-}
  if [[ -n "${data}" ]]; then
    curl -sS -X "$method" "https://api.notion.com/v1$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Notion-Version: $NOTION_VERSION" \
      -H 'Content-Type: application/json' \
      --data "$data"
  else
    curl -sS -X "$method" "https://api.notion.com/v1$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Notion-Version: $NOTION_VERSION"
  fi
}

