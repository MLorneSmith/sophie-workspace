#!/bin/bash
# migrate-todoist-ids.sh — one-time migration from old numeric Todoist IDs to new alphanumeric IDs
#
# Strategy:
# 1) Full Todoist sync (sync_token="*", resource_types=["items"]) to fetch all items
# 2) Fetch all MC tasks with todoistId
# 3) For each MC task whose todoistId is numeric-only, try to match Todoist item by content == MC task name
# 4) PATCH MC task todoistId to new alphanumeric id
# 5) Report matched/unmatched
#
# Usage:
#   ./migrate-todoist-ids.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

CONFIG="${CONFIG:-/home/ubuntu/clawd/config/todoist-mc-mapping.json}"
MC_API="${MC_API:-http://localhost:3001/api/v1}"
TODOIST_SYNC_URL="https://api.todoist.com/api/v1/sync"
RATE_LIMIT_SLEEP="${RATE_LIMIT_SLEEP:-0.3}"

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}
require jq
require curl

note() { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*"; }
api_sleep() { sleep "$RATE_LIMIT_SLEEP"; }

curl_json() {
  local method="$1"; shift
  local url="$1"; shift
  local body="${1:-}"

  local args=(
    --silent --show-error --fail
    --request "$method"
    --url "$url"
    --header "Content-Type: application/json"
  )

  if [[ -n "${TODOIST_TOKEN:-}" && "$url" == "https://api.todoist.com/"* ]]; then
    args+=(--header "Authorization: Bearer $TODOIST_TOKEN")
  fi

  if [[ -n "$body" ]]; then
    args+=(--data "$body")
  fi

  curl "${args[@]}"
}

todoist_sync() {
  local sync_token="$1"; shift
  local resource_types_json="$1"; shift

  local payload
  payload="$(jq -nc --arg st "$sync_token" --argjson rt "$resource_types_json" '{sync_token:$st, resource_types:$rt}')"

  api_sleep
  curl_json POST "$TODOIST_SYNC_URL" "$payload"
}

mc_get_tasks() {
  curl --silent --show-error --fail "$MC_API/tasks"
}

mc_patch_task() {
  local mc_id="$1"
  local payload="$2"

  if $DRY_RUN; then
    note "DRY-RUN: MC PATCH /tasks/$mc_id payload=$payload" >&2
    return 0
  fi

  api_sleep
  curl_json PATCH "$MC_API/tasks/$mc_id" "$payload" >/dev/null
}

if [[ ! -f "$CONFIG" ]]; then
  note "Config not found: $CONFIG" >&2
  exit 1
fi

TODOIST_TOKEN="$(jq -r '.todoistToken // empty' "$CONFIG")"
if [[ -z "$TODOIST_TOKEN" || "$TODOIST_TOKEN" == "null" ]]; then
  note "todoistToken missing in config: $CONFIG" >&2
  exit 1
fi

note "Fetching Todoist items (full sync)"
TODOIST_FULL_JSON="$(todoist_sync "*" '["items"]')"

# Build lookup: content -> [ids]
# Keep only non-deleted items; prefer unchecked first when choosing later.
TODOIST_LOOKUP_JSON="$(echo "$TODOIST_FULL_JSON" | jq -c '
  {
    items: (.items // [])
      | map(select((.is_deleted // 0) == 0))
      | map({id: .id, content: (.content // ""), checked:(.checked // 0)})
  }
')"

note "Fetching MC tasks"
MC_TASKS_JSON="$(mc_get_tasks)"

# MC tasks that have todoistId
MC_WITH_TODOIST="$(echo "$MC_TASKS_JSON" | jq -c '[.[] | select(.todoistId != null and .todoistId != "")]')"
mc_count="$(echo "$MC_WITH_TODOIST" | jq 'length')"

matched=0
unmatched=0
updated=0

declare -A USED_TODOIST_IDS

auto_match_id_for_content() {
  local content="$1"
  # Return best matching id for content:
  # - exact content match
  # - prefer unchecked (checked==0)
  # - if multiple, return first
  echo "$TODOIST_LOOKUP_JSON" | jq -r --arg c "$content" '
    [.items[] | select(.content == $c)]
    | sort_by(.checked)
    | .[0].id // empty
  '
}

note "Scanning $mc_count MC tasks with todoistId"

for ((i=0; i<mc_count; i++)); do
  t="$(echo "$MC_WITH_TODOIST" | jq -c ".[$i]")"
  mc_id="$(echo "$t" | jq -r '.id')"
  mc_name="$(echo "$t" | jq -r '.name // ""')"
  old_tid="$(echo "$t" | jq -r '.todoistId // ""')"

  [[ -n "$old_tid" ]] || continue

  # Only migrate numeric-only ids
  if [[ ! "$old_tid" =~ ^[0-9]+$ ]]; then
    continue
  fi

  new_tid="$(auto_match_id_for_content "$mc_name")"

  if [[ -z "$new_tid" ]]; then
    note "UNMATCHED: MC#$mc_id oldTodoistId=$old_tid name=\"$mc_name\""
    unmatched=$((unmatched+1))
    continue
  fi

  if [[ -n "${USED_TODOIST_IDS[$new_tid]:-}" ]]; then
    note "AMBIGUOUS: Todoist item $new_tid already used for another MC task; skipping MC#$mc_id name=\"$mc_name\"" >&2
    unmatched=$((unmatched+1))
    continue
  fi

  USED_TODOIST_IDS[$new_tid]=1
  matched=$((matched+1))

  payload="$(jq -nc --arg todoistId "$new_tid" '{todoistId:$todoistId}')"
  if mc_patch_task "$mc_id" "$payload"; then
    updated=$((updated+1))
    note "UPDATED: MC#$mc_id todoistId $old_tid -> $new_tid (\"$mc_name\")"
  else
    note "ERROR: Failed to update MC#$mc_id todoistId" >&2
  fi

done

# Report Todoist items that weren't matched (by exact content) to any migrated MC task.
# This is heuristic; it's mainly useful for sanity checking.
MATCHED_TODOIST_IDS_JSON="$(printf '%s\n' "${!USED_TODOIST_IDS[@]}" | jq -R -s -c 'split("\n") | map(select(length>0))')"

unmatched_todoist_count="$(echo "$TODOIST_LOOKUP_JSON" | jq --argjson used "$MATCHED_TODOIST_IDS_JSON" '
  (.items // [])
  | map(select(.id as $id | ($used | index($id) | not)))
  | length
')"

note "=== Migration report ==="
note "MC numeric todoistIds matched=$matched updated=$updated unmatched_mc=$unmatched"
note "Todoist non-deleted items unmatched_by_exact_name=$unmatched_todoist_count"

if $DRY_RUN; then
  note "Dry-run only: no MC tasks were modified."
fi
