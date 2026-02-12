#!/bin/bash
# sync-mc-todoist.sh — Mission Control ↔ Todoist two-way sync
#
# Key rules:
# - NEVER match by name. ONLY by MC.todoistId ↔ Todoist item id.
# - Use Todoist Sync API with sync_token for deltas.
# - Soft-close pattern for deletions: close in Todoist, tombstone for 7 days.
# - Todoist tasks without MC link are created in MC (reverse sync).
#
# Usage:
#   ./sync-mc-todoist.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

CONFIG="${CONFIG:-/home/ubuntu/clawd/config/todoist-mc-mapping.json}"
STATE_FILE="${STATE_FILE:-/home/ubuntu/clawd/config/todoist-sync-state.json}"
MC_API="${MC_API:-http://localhost:3001/api/v1}"
TODOIST_SYNC_URL="https://api.todoist.com/api/v1/sync"
RATE_LIMIT_SLEEP="${RATE_LIMIT_SLEEP:-0.3}"
TOMBSTONE_TTL_SECS=$((7*24*60*60))

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}

require jq
require curl

note() { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*"; }
api_sleep() { sleep "$RATE_LIMIT_SLEEP"; }

curl_json() {
  # curl_json METHOD URL JSON_BODY(optional)
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

mc_get_tasks() {
  # Returns JSON array
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

mc_complete_task() {
  local mc_id="$1"

  if $DRY_RUN; then
    note "DRY-RUN: MC PATCH /tasks/$mc_id/complete" >&2
    return 0
  fi

  api_sleep
  curl --silent --show-error --fail \
    --request PATCH \
    --url "$MC_API/tasks/$mc_id/complete" \
    --header "Content-Type: application/json" \
    >/dev/null
}

# --- Todoist Sync API ---

todoist_sync() {
  # todoist_sync SYNC_TOKEN RESOURCE_TYPES_JSON COMMANDS_JSON(optional)
  local sync_token="$1"; shift
  local resource_types_json="$1"; shift
  local commands_json="${1:-}"

  local payload
  if [[ -n "$commands_json" ]]; then
    payload="$(jq -nc --arg st "$sync_token" --argjson rt "$resource_types_json" --argjson cmds "$commands_json" '{sync_token:$st, resource_types:$rt, commands:$cmds}')"
  else
    payload="$(jq -nc --arg st "$sync_token" --argjson rt "$resource_types_json" '{sync_token:$st, resource_types:$rt}')"
  fi

  api_sleep
  curl_json POST "$TODOIST_SYNC_URL" "$payload"
}

mc_priority_to_todoist() {
  # MC priority → Todoist priority (Todoist: 4=p1/urgent, 3=p2/high, 2=p3/medium, 1=p4/none)
  case "${1:-medium}" in
    high)   echo 4 ;;
    medium) echo 2 ;;
    low)    echo 1 ;;
    *)      echo 1 ;;
  esac
}

todoist_cmd_add_item() {
  # add item, echo new item id
  local content="$1"
  local description="$2"
  local project_id="$3"
  local section_id="${4:-}"
  local todoist_priority="${5:-1}"

  local uuid temp_id args cmd commands resp new_id
  uuid="$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)"
  temp_id="$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)"

  if [[ -n "$section_id" && "$section_id" != "null" ]]; then
    args="$(jq -nc --arg content "$content" --arg description "$description" --arg project_id "$project_id" --arg section_id "$section_id" --argjson priority "$todoist_priority" '{content:$content, description:$description, project_id:$project_id, section_id:$section_id, priority:$priority}')"
  else
    args="$(jq -nc --arg content "$content" --arg description "$description" --arg project_id "$project_id" --argjson priority "$todoist_priority" '{content:$content, description:$description, project_id:$project_id, priority:$priority}')"
  fi

  cmd="$(jq -nc --arg type "item_add" --arg uuid "$uuid" --arg temp_id "$temp_id" --argjson args "$args" '{type:$type, uuid:$uuid, temp_id:$temp_id, args:$args}')"
  commands="[$cmd]"

  if $DRY_RUN; then
    note "DRY-RUN: Todoist cmd item_add content=\"$content\" project_id=$project_id section_id=${section_id:-}" >&2
    echo "DRY_RUN_ID"
    return 0
  fi

  # Use current sync token to keep the response delta-small; resource_types empty.
  if ! resp="$(todoist_sync "$SYNC_TOKEN" '[]' "$commands" 2>/dev/null)"; then
    echo ""; return 1
  fi

  new_id="$(echo "$resp" | jq -r --arg tid "$temp_id" '.temp_id_mapping[$tid] // empty')"
  [[ -n "$new_id" ]] || return 1
  echo "$new_id"
}

todoist_cmd_update_item() {
  local id="$1"
  local content="$2"
  local description="$3"
  local todoist_priority="${4:-1}"

  local uuid args cmd commands
  uuid="$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)"

  args="$(jq -nc --arg content "$content" --arg description "$description" --argjson priority "$todoist_priority" '{content:$content, description:$description, priority:$priority}')"
  cmd="$(jq -nc --arg type "item_update" --arg uuid "$uuid" --argjson args "$args" --arg id "$id" '{type:$type, uuid:$uuid, args:($args + {id:$id})}')"
  commands="[$cmd]"

  if $DRY_RUN; then
    note "DRY-RUN: Todoist cmd item_update id=$id content=\"$content\"" >&2
    return 0
  fi

  todoist_sync "$SYNC_TOKEN" '[]' "$commands" >/dev/null
}

todoist_cmd_close_item() {
  local id="$1"

  local uuid cmd commands
  uuid="$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)"

  cmd="$(jq -nc --arg type "item_close" --arg uuid "$uuid" --arg id "$id" '{type:$type, uuid:$uuid, args:{id:$id}}')"
  commands="[$cmd]"

  if $DRY_RUN; then
    note "DRY-RUN: Todoist cmd item_close id=$id" >&2
    return 0
  fi

  # If already closed/deleted, Sync API may error; treat as non-fatal.
  todoist_sync "$SYNC_TOKEN" '[]' "$commands" >/dev/null 2>&1 || true
}

# --- State handling ---

init_state_if_missing() {
  if [[ -f "$STATE_FILE" ]]; then
    return 0
  fi
  note "State file missing; initializing: $STATE_FILE"
  if $DRY_RUN; then
    return 0
  fi
  mkdir -p "$(dirname "$STATE_FILE")"
  jq -nc '{sync_token:"*", lastSyncAt:null, tombstones:[], taskMappings:{}}' >"$STATE_FILE"
}

load_state() {
  init_state_if_missing
  if [[ -f "$STATE_FILE" ]]; then
    STATE_JSON="$(cat "$STATE_FILE")"
  else
    STATE_JSON='{"sync_token":"*","lastSyncAt":null,"tombstones":[],"taskMappings":{}}'
  fi

  SYNC_TOKEN="$(echo "$STATE_JSON" | jq -r '.sync_token // "*"')"
  [[ -n "$SYNC_TOKEN" ]] || SYNC_TOKEN="*"
}

prune_tombstones() {
  local now
  now="$(date +%s)"
  STATE_JSON="$(echo "$STATE_JSON" | jq --argjson now "$now" --argjson ttl "$TOMBSTONE_TTL_SECS" '
    .tombstones = ((.tombstones // []) | map(select((.closedAt // 0) + $ttl > $now)))
  ' )"
}

is_tombstoned() {
  local todoist_id="$1"
  echo "$STATE_JSON" | jq -e --arg tid "$todoist_id" '(.tombstones // []) | any(.todoistId == $tid)' >/dev/null 2>&1
}

add_tombstone() {
  local todoist_id="$1"
  local now
  now="$(date +%s)"
  STATE_JSON="$(echo "$STATE_JSON" | jq --arg tid "$todoist_id" --argjson now "$now" '
    .tombstones = ((.tombstones // []) + [{todoistId:$tid, closedAt:$now}])
  ' )"
}

set_known_link() {
  # set_known_link TODOIST_ID MC_ID
  local todoist_id="$1"
  local mc_id="$2"
  local now
  now="$(date +%s)"
  # Back-compat: treat old .known_links as .taskMappings
  STATE_JSON="$(echo "$STATE_JSON" | jq --arg tid "$todoist_id" --arg mcid "$mc_id" --argjson now "$now" '
    .taskMappings = (.taskMappings // (.known_links // {}))
    | .taskMappings[$tid] = ((.taskMappings[$tid] // {}) + {mcId:$mcid, lastSeen:$now})
    | del(.known_links)
  ' )"
}

set_last_pushed_hashes() {
  # set_last_pushed_hashes TODOIST_ID CONTENT_HASH DESC_HASH
  local todoist_id="$1"
  local ch="$2"
  local dh="$3"
  STATE_JSON="$(echo "$STATE_JSON" | jq --arg tid "$todoist_id" --arg ch "$ch" --arg dh "$dh" '
    .taskMappings = (.taskMappings // (.known_links // {}))
    | .taskMappings[$tid] = ((.taskMappings[$tid] // {}) + {lastPushed:{contentHash:$ch, descHash:$dh}})
    | del(.known_links)
  ' )"
}

get_last_pushed_hash() {
  local todoist_id="$1"
  local which="$2" # contentHash|descHash
  echo "$STATE_JSON" | jq -r --arg tid "$todoist_id" --arg which "$which" '(.taskMappings // (.known_links // {}))[$tid].lastPushed[$which] // empty'
}

save_state() {
  if $DRY_RUN; then
    note "DRY-RUN: Not writing state file ($STATE_FILE)" >&2
    return 0
  fi
  mkdir -p "$(dirname "$STATE_FILE")"
  echo "$STATE_JSON" | jq '.' >"$STATE_FILE"
}

sha1_str() {
  # portable sha1
  printf '%s' "$1" | sha1sum | awk '{print $1}'
}

# --------------------
# Main
# --------------------

if [[ ! -f "$CONFIG" ]]; then
  note "Config not found: $CONFIG" >&2
  exit 1
fi

TODOIST_TOKEN="$(jq -r '.todoistToken // empty' "$CONFIG")"
if [[ -z "$TODOIST_TOKEN" || "$TODOIST_TOKEN" == "null" ]]; then
  note "todoistToken missing in config: $CONFIG" >&2
  exit 1
fi

load_state
prune_tombstones

note "Starting sync (dry_run=$DRY_RUN)"

# Fetch MC tasks once.
if ! MC_TASKS_JSON="$(mc_get_tasks 2>/dev/null)"; then
  note "ERROR: Failed to fetch MC tasks" >&2
  exit 1
fi

# Build maps:
# - MC_BY_TODOIST_ID[todoistId] = mc task json
# - MC_PRESENT_TODOIST_IDS set
# Also gather list of MC tasks without todoistId for creation.

# shellcheck disable=SC2034
declare -A MC_JSON_BY_TODOIST
# shellcheck disable=SC2034
declare -A MC_ID_BY_TODOIST
# shellcheck disable=SC2034
declare -A MC_STATUS_BY_TODOIST

MC_TODOIST_IDS="$(echo "$MC_TASKS_JSON" | jq -r '.[] | select(.todoistId != null and .todoistId != "") | .todoistId')"
while IFS= read -r tid; do
  [[ -n "$tid" ]] || continue
  mc_task="$(echo "$MC_TASKS_JSON" | jq --arg tid "$tid" -c '[.[] | select(.todoistId == $tid)] | first')"
  mc_id="$(echo "$mc_task" | jq -r '.id')"
  mc_status="$(echo "$mc_task" | jq -r '.status // ""')"
  MC_JSON_BY_TODOIST["$tid"]="$mc_task"
  MC_ID_BY_TODOIST["$tid"]="$mc_id"
  MC_STATUS_BY_TODOIST["$tid"]="$mc_status"
  set_known_link "$tid" "$mc_id"
  # Update lastSeen on every run for present links
  # (pushed hashes handled below)
done <<<"$MC_TODOIST_IDS"

# ----------
# Phase A: Todoist delta → MC updates/completions
# ----------

note "Phase A: Todoist → MC (delta via Sync API)"

TODOIST_DELTA_JSON=""
if ! TODOIST_DELTA_JSON="$(todoist_sync "$SYNC_TOKEN" '["items"]' 2>/dev/null)"; then
  note "ERROR: Todoist sync failed; aborting" >&2
  exit 1
fi

NEW_SYNC_TOKEN="$(echo "$TODOIST_DELTA_JSON" | jq -r '.sync_token // empty')"
if [[ -z "$NEW_SYNC_TOKEN" ]]; then
  note "ERROR: Todoist sync response missing sync_token" >&2
  exit 1
fi

# From here on, use the latest sync token for commands to keep responses small.
SYNC_TOKEN="$NEW_SYNC_TOKEN"

# Build section → initiative reverse mapping (v1 section IDs from Sync API)
declare -A INITIATIVE_BY_SECTION
while IFS='=' read -r sid iid; do
  INITIATIVE_BY_SECTION["$sid"]="$iid"
done < <(jq -r '.sectionToInitiative // {} | to_entries[] | "\(.key)=\(.value)"' "$CONFIG" 2>/dev/null)
# Also include v2 section IDs as fallback
while IFS='=' read -r sid iid; do
  INITIATIVE_BY_SECTION["$sid"]="$iid"
done < <(jq -r '.sectionToInitiativeV2 // {} | to_entries[] | "\(.key)=\(.value)"' "$CONFIG" 2>/dev/null)

# Process changed items
mc_completed_from_todoist=0
mc_renamed_from_todoist=0
mc_moved_from_todoist=0

item_count="$(echo "$TODOIST_DELTA_JSON" | jq '.items | length')"
for ((i=0; i<item_count; i++)); do
  item="$(echo "$TODOIST_DELTA_JSON" | jq ".items[$i]")"
  tid="$(echo "$item" | jq -r '.id')"

  # Only act on linked items.
  if [[ -z "${MC_ID_BY_TODOIST[$tid]:-}" ]]; then
    continue
  fi

  mc_id="${MC_ID_BY_TODOIST[$tid]}"
  mc_status="${MC_STATUS_BY_TODOIST[$tid]}"

  checked="$(echo "$item" | jq -r '.checked // 0')"
  is_deleted="$(echo "$item" | jq -r '.is_deleted // 0')"
  is_archived="$(echo "$item" | jq -r '.is_archived // 0')"

  if [[ "$checked" == "1" || "$is_deleted" == "1" || "$is_archived" == "1" ]]; then
    if [[ "$mc_status" != "done" ]]; then
      if mc_complete_task "$mc_id" 2>/dev/null; then
        note "Completed MC#$mc_id because Todoist item $tid was completed/deleted"
        mc_completed_from_todoist=$((mc_completed_from_todoist+1))
      else
        note "ERROR: Failed to complete MC#$mc_id from Todoist item $tid" >&2
      fi
    fi
    continue
  fi

  # Active item: allow Todoist rename to update MC name
  todoist_content="$(echo "$item" | jq -r '.content // ""')"
  mc_name="$(echo "${MC_JSON_BY_TODOIST[$tid]}" | jq -r '.name // ""')"

  # Strip [#nnn] prefix and bold before comparing/updating MC
  todoist_clean="$(echo "$todoist_content" | sed -E 's/^\*\*\[#[0-9]+\] (.*)\*\*$/\1/' | sed -E 's/^\[#[0-9]+\] *//')"

  if [[ -n "$todoist_clean" && "$todoist_clean" != "$mc_name" ]]; then
    payload="$(jq -nc --arg name "$todoist_clean" '{name:$name}')"
    if mc_patch_task "$mc_id" "$payload" 2>/dev/null; then
      note "Renamed MC#$mc_id to match Todoist item $tid"
      mc_renamed_from_todoist=$((mc_renamed_from_todoist+1))
      # Update local cached name for any later comparisons this run
      MC_JSON_BY_TODOIST["$tid"]="$(echo "${MC_JSON_BY_TODOIST[$tid]}" | jq --arg name "$todoist_content" '.name=$name')"
    else
      note "ERROR: Failed to rename MC#$mc_id from Todoist item $tid" >&2
    fi
  fi

  # Detect section moves → update initiative in MC
  todoist_section="$(echo "$item" | jq -r '.section_id // ""')"
  if [[ -n "$todoist_section" && -n "${INITIATIVE_BY_SECTION[$todoist_section]:-}" ]]; then
    new_initiative="${INITIATIVE_BY_SECTION[$todoist_section]}"
    current_initiative="$(echo "${MC_JSON_BY_TODOIST[$tid]}" | jq -r '.initiativeId // ""')"
    if [[ "$new_initiative" != "$current_initiative" ]]; then
      payload="$(jq -nc --argjson iid "$new_initiative" '{initiativeId:$iid}')"
      if mc_patch_task "$mc_id" "$payload" 2>/dev/null; then
        note "Moved MC#$mc_id to initiative $new_initiative (was $current_initiative) from Todoist section move"
        mc_moved_from_todoist=$((mc_moved_from_todoist+1))
      else
        note "ERROR: Failed to move MC#$mc_id to initiative $new_initiative" >&2
      fi
    fi
  fi

done

# Update sync token in state
STATE_JSON="$(echo "$STATE_JSON" | jq --arg st "$NEW_SYNC_TOKEN" '.sync_token=$st')"

# ----------
# Phase A2: Todoist → MC (create MC tasks for unlinked Todoist items)
# ----------

note "Phase A2: Create MC tasks from unlinked Todoist items"

mc_created_from_todoist=0
mc_linked_existing=0

# We need ALL Todoist items, not just the delta. Do a full sync for items.
TODOIST_FULL_JSON=""
if ! TODOIST_FULL_JSON="$(todoist_sync "*" '["items"]' 2>/dev/null)"; then
  note "ERROR: Todoist full sync for items failed; skipping Phase A2" >&2
else

# Build set of all Todoist IDs already linked to MC
LINKED_TODOIST_IDS="$(echo "$MC_TASKS_JSON" | jq -r '.[] | select(.todoistId != null and .todoistId != "") | .todoistId' | sort -u)"

# Load reverse mappings
REVERSE_PROJECT_MAP="$(jq -c '.todoistProjectToObjective // {}' "$CONFIG")"
REVERSE_SECTION_MAP="$(jq -c '.todoistSectionToInitiative // {}' "$CONFIG")"
CATCH_ALL_MAP="$(jq -c '.catchAllProject // {}' "$CONFIG")"

full_item_count="$(echo "$TODOIST_FULL_JSON" | jq '.items | length')"
for ((j=0; j<full_item_count; j++)); do
  fitem="$(echo "$TODOIST_FULL_JSON" | jq ".items[$j]")"
  ftid="$(echo "$fitem" | jq -r '.id')"
  fchecked="$(echo "$fitem" | jq -r '.checked // 0')"
  fdeleted="$(echo "$fitem" | jq -r '.is_deleted // 0')"

  # Skip completed/deleted items
  [[ "$fchecked" == "0" && "$fdeleted" == "0" ]] || continue

  # Skip if already linked to MC
  if echo "$LINKED_TODOIST_IDS" | grep -Fqx "$ftid"; then
    continue
  fi

  # Skip if tombstoned
  if is_tombstoned "$ftid"; then
    continue
  fi

  fcontent="$(echo "$fitem" | jq -r '.content // ""')"
  fdesc="$(echo "$fitem" | jq -r '.description // ""')"
  fproject="$(echo "$fitem" | jq -r '.project_id // ""')"
  fsection="$(echo "$fitem" | jq -r '.section_id // ""')"

  # Resolve objective from project
  obj_id=""
  init_id=""

  # First try section → initiative (most specific)
  if [[ -n "$fsection" && "$fsection" != "null" ]]; then
    init_id="$(echo "$REVERSE_SECTION_MAP" | jq -r --arg sid "$fsection" '.[$sid] // empty')"
  fi

  # Then try project → objective
  if [[ -n "$fproject" ]]; then
    obj_id="$(echo "$REVERSE_PROJECT_MAP" | jq -r --arg pid "$fproject" '.[$pid] // empty')"
  fi

  # Try catch-all projects
  if [[ -z "$obj_id" && -n "$fproject" ]]; then
    obj_id="$(echo "$CATCH_ALL_MAP" | jq -r --arg pid "$fproject" '.[$pid].objectiveId // empty')"
  fi

  # Skip items from unmapped projects (personal lists, etc.)
  if [[ -z "$obj_id" ]]; then
    continue
  fi

  # Dedup: check if MC already has a task with a similar name
  # Strip markdown bold, week tags, and leading/trailing descriptions after " - "
  # Try multiple normalization levels for matching
  clean_name="$(echo "$fcontent" | sed 's/\*\*//g; s/\[W[0-9]\] //g; s/^ *//; s/ *$//')"
  # Also extract just the core title (before " - " description suffix)
  core_name="$(echo "$clean_name" | sed 's/ - .*//')"

  existing_mc_id="$(echo "$MC_TASKS_JSON" | jq -r --arg full "$clean_name" --arg core "$core_name" '
    # Normalize function
    def norm: ascii_downcase | gsub("\\*\\*";"") | gsub("^\\s+|\\s+$";"") | gsub("\\s+";" ");
    .[] | select(.todoistId == null or .todoistId == "") | select(.status != "done") |
    select(
      ((.name | norm) == ($full | norm)) or
      ((.name | norm) == ($core | norm)) or
      (($full | norm) | contains(.name | norm)) or
      ((.name | norm) | contains($core | norm))
    ) |
    .id' | head -1)"

  if [[ -n "$existing_mc_id" ]]; then
    # Link existing MC task to this Todoist item instead of creating
    if $DRY_RUN; then
      note "DRY-RUN: Would LINK existing MC#$existing_mc_id to Todoist item $ftid: \"$fcontent\""
    else
      link_payload="$(jq -nc --arg todoistId "$ftid" '{todoistId:$todoistId}')"
      if mc_patch_task "$existing_mc_id" "$link_payload" 2>/dev/null; then
        note "Linked existing MC#$existing_mc_id to Todoist item $ftid: \"$fcontent\""
        set_known_link "$ftid" "$existing_mc_id"
      else
        note "ERROR: Failed to link MC#$existing_mc_id to Todoist item $ftid" >&2
      fi
    fi
    mc_linked_existing=$((mc_linked_existing+1))
    continue
  fi

  # Create MC task
  mc_payload="$(jq -nc \
    --arg name "$fcontent" \
    --arg desc "$fdesc" \
    --arg todoistId "$ftid" \
    --arg objectiveId "$obj_id" \
    --arg initiativeId "${init_id:-}" \
    '{
      name: $name,
      description: (if $desc == "" then null else $desc end),
      todoistId: $todoistId,
      priority: "medium",
      status: "backlog"
    }
    + (if $objectiveId != "" then {objective_id: ($objectiveId|tonumber)} else {} end)
    + (if $initiativeId != "" then {initiative_id: ($initiativeId|tonumber)} else {} end)
    ')"

  if $DRY_RUN; then
    note "DRY-RUN: Would create MC task from Todoist item $ftid: \"$fcontent\" (obj=$obj_id init=${init_id:-})"
    mc_created_from_todoist=$((mc_created_from_todoist+1))
    continue
  fi

  api_sleep
  mc_resp=""
  http_code=""
  mc_resp=""
  mc_resp="$(curl --silent --show-error --write-out "\n%{http_code}" \
    --request POST --url "$MC_API/tasks" \
    --header "Content-Type: application/json" \
    --data "$mc_payload" 2>/dev/null)" || true
  http_code="$(echo "$mc_resp" | tail -1)"
  mc_resp="$(echo "$mc_resp" | sed '$d')"

  if [[ "$http_code" =~ ^2 ]]; then
    new_mc_id="$(echo "$mc_resp" | jq -r '.id // empty')"
    if [[ -n "$new_mc_id" ]]; then
      mc_created_from_todoist=$((mc_created_from_todoist+1))
      set_known_link "$ftid" "$new_mc_id"
      # Also update local MC data so Phase C sees the new task
      MC_ID_BY_TODOIST["$ftid"]="$new_mc_id"
      MC_STATUS_BY_TODOIST["$ftid"]="backlog"
      note "Created MC#$new_mc_id from Todoist item $ftid: \"$fcontent\""
    else
      note "ERROR: MC task created but no id returned for Todoist item $ftid" >&2
    fi
  else
    note "ERROR: Failed to create MC task from Todoist item $ftid (HTTP $http_code): $mc_resp" >&2
  fi

done

fi # end TODOIST_FULL_JSON check

# ----------
# Phase B: MC → Todoist (create/update/close) 
# ----------

note "Phase B: MC → Todoist"

created=0
updated=0
closed=0
linked=0
skipped=0

mc_count="$(echo "$MC_TASKS_JSON" | jq 'length')"
for ((i=0; i<mc_count; i++)); do
  t="$(echo "$MC_TASKS_JSON" | jq ".[$i]")"

  mc_id="$(echo "$t" | jq -r '.id')"
  status="$(echo "$t" | jq -r '.status // ""')"
  priority="$(echo "$t" | jq -r '.priority // "medium"')"
  raw_name="$(echo "$t" | jq -r '.name // ""')"

  # Format name for Todoist: [#id] prefix + bold if high priority
  # Strip any existing [#nnn] prefix first to avoid duplication
  clean_name="$(echo "$raw_name" | sed -E 's/^\[#[0-9]+\] *//')"
  clean_name="$(echo "$clean_name" | sed -E 's/^\*\*(.*)\*\*$/\1/')"  # strip bold
  if [[ "$priority" == "high" ]]; then
    name="**[#${mc_id}] ${clean_name}**"
  else
    name="[#${mc_id}] ${clean_name}"
  fi
  desc="$(echo "$t" | jq -r '.description // ""')"
  review="$(echo "$t" | jq -r '.reviewSummary // ""')"
  initiative_id="$(echo "$t" | jq -r '.initiativeId // empty')"
  objective_id="$(echo "$t" | jq -r '.objectiveId // empty')"
  todoist_id="$(echo "$t" | jq -r '.todoistId // empty')"

  # Build Todoist description
  todoist_desc="$desc"
  if [[ -n "$review" ]]; then
    if [[ -n "$todoist_desc" ]]; then
      todoist_desc="$todoist_desc\n\n---\nReview summary:\n$review"
    else
      todoist_desc="Review summary:\n$review"
    fi
  fi

  # Determine mapping (project/section)
  project_id=""
  section_id=""
  if [[ -n "$initiative_id" ]]; then
    project_id="$(jq -r --arg id "$initiative_id" '.initiativeToTodoist[$id].projectId // empty' "$CONFIG")"
    section_id="$(jq -r --arg id "$initiative_id" '.initiativeToTodoist[$id].sectionId // empty' "$CONFIG")"
  fi

  if [[ -z "$project_id" && -n "$objective_id" ]]; then
    project_id="$(jq -r --arg id "$objective_id" '.objectiveToProject[$id] // empty' "$CONFIG")"
    section_id=""
  fi

  if [[ -z "$project_id" ]]; then
    skipped=$((skipped+1))
    continue
  fi

  # If MC done and linked, close in Todoist (soft-close)
  if [[ "$status" == "done" && -n "$todoist_id" ]]; then
    if ! is_tombstoned "$todoist_id"; then
      if todoist_cmd_close_item "$todoist_id"; then
        closed=$((closed+1))
        add_tombstone "$todoist_id"
        note "Closed Todoist item $todoist_id because MC#$mc_id is done"
      else
        note "ERROR: Failed to close Todoist item $todoist_id (MC#$mc_id done)" >&2
      fi
    else
      note "Skipped already-tombstoned Todoist item $todoist_id (MC#$mc_id done)"
    fi
    continue
  fi

  # Skip creating/updating Todoist for already-done tasks without todoistId
  if [[ "$status" == "done" && -z "$todoist_id" ]]; then
    continue
  fi

  # Create Todoist task for MC tasks without todoistId
  if [[ -z "$todoist_id" ]]; then
    new_id=""
    todoist_pri="$(mc_priority_to_todoist "$priority")"
    if new_id="$(todoist_cmd_add_item "$name" "$todoist_desc" "$project_id" "$section_id" "$todoist_pri" 2>/dev/null)"; then
      created=$((created+1))
      if [[ "$new_id" != "DRY_RUN_ID" && -n "$new_id" ]]; then
        payload="$(jq -nc --arg todoistId "$new_id" '{todoistId:$todoistId}')"
        if mc_patch_task "$mc_id" "$payload" 2>/dev/null; then
          linked=$((linked+1))
          note "Created Todoist item $new_id for MC#$mc_id and linked"
          set_known_link "$new_id" "$mc_id"
          # Set last-pushed hashes so we don't re-update immediately next run
          set_last_pushed_hashes "$new_id" "$(sha1_str "$name")" "$(sha1_str "$todoist_desc")"
        else
          note "ERROR: Failed to link MC#$mc_id with todoistId=$new_id" >&2
        fi
      else
        note "DRY-RUN: Would create & link Todoist item for MC#$mc_id"
      fi
    else
      note "ERROR: Failed to create Todoist item for MC#$mc_id" >&2
    fi
    continue
  fi

  # Update Todoist if MC changed since last push (tracked in state)
  ch_now="$(sha1_str "${name}::pri=${priority}")"
  dh_now="$(sha1_str "$todoist_desc")"
  ch_prev="$(get_last_pushed_hash "$todoist_id" "contentHash")"
  dh_prev="$(get_last_pushed_hash "$todoist_id" "descHash")"

  if [[ "$ch_now" != "$ch_prev" || "$dh_now" != "$dh_prev" ]]; then
    todoist_pri="$(mc_priority_to_todoist "$priority")"
    if todoist_cmd_update_item "$todoist_id" "$name" "$todoist_desc" "$todoist_pri" 2>/dev/null; then
      updated=$((updated+1))
      note "Updated Todoist item $todoist_id from MC#$mc_id"
      set_last_pushed_hashes "$todoist_id" "$ch_now" "$dh_now"
    else
      note "ERROR: Failed to update Todoist item $todoist_id from MC#$mc_id" >&2
    fi
  fi

  # Check if Todoist item needs to move to a different section (initiative changed in MC)
  # Look up the current Todoist section from the full item data if available
  if [[ -n "$section_id" && -n "$TODOIST_FULL_JSON" ]]; then
    current_todoist_section="$(echo "$TODOIST_FULL_JSON" | jq -r --arg tid "$todoist_id" '.items[] | select(.id == $tid) | .section_id // ""' 2>/dev/null)"
    # Map v1 section ID back to initiative for comparison
    mapped_initiative=""
    if [[ -n "$current_todoist_section" ]]; then
      mapped_initiative="${INITIATIVE_BY_SECTION[$current_todoist_section]:-}"
    fi
    if [[ -n "$mapped_initiative" && "$mapped_initiative" != "$initiative_id" ]]; then
      # The task's Todoist section doesn't match its MC initiative — move it
      # Find v1 section ID for the target initiative
      target_v1_section="$(jq -r --arg iid "$initiative_id" '.sectionToInitiative | to_entries[] | select(.value == ($iid | tonumber)) | .key' "$CONFIG" 2>/dev/null | head -1)"
      if [[ -n "$target_v1_section" ]]; then
        move_uuid="$(python3 -c 'import uuid; print(uuid.uuid4())')"
        move_cmd="$(jq -nc --arg type "item_move" --arg uuid "$move_uuid" --arg id "$todoist_id" --arg section_id "$target_v1_section" '{type:$type, uuid:$uuid, args:{id:$id, section_id:$section_id}}')"
        if ! $DRY_RUN; then
          if todoist_sync "$SYNC_TOKEN" '[]' "[$move_cmd]" >/dev/null 2>&1; then
            note "Moved Todoist item $todoist_id to section $target_v1_section (initiative $initiative_id) from MC#$mc_id"
          else
            note "ERROR: Failed to move Todoist item $todoist_id to section $target_v1_section" >&2
          fi
        else
          note "DRY-RUN: Would move Todoist item $todoist_id to section $target_v1_section"
        fi
      fi
    fi
  fi

  set_known_link "$todoist_id" "$mc_id"

done

# ----------
# Phase C: MC deletions → close orphaned Todoist items (based on known_links)
# ----------

note "Phase C: Close Todoist items whose MC task was deleted (soft-close)"

# Re-fetch MC tasks to include any created in Phase A2
if ! MC_TASKS_FRESH="$(mc_get_tasks 2>/dev/null)"; then
  note "ERROR: Failed to re-fetch MC tasks for Phase C; using cached data" >&2
  MC_TASKS_FRESH="$MC_TASKS_JSON"
fi

# Build present set from BOTH the fresh MC data AND the in-memory maps
# (Phase A2 creates are tracked in MC_ID_BY_TODOIST even if MC API re-fetch is stale)
mc_present_set="$(echo "$MC_TASKS_FRESH" | jq -r '.[] | select(.todoistId != null and .todoistId != "") | .todoistId' | sort -u)"

# Also add any Todoist IDs we linked/created during this run (in-memory)
for mem_tid in "${!MC_ID_BY_TODOIST[@]}"; do
  mc_present_set="$(printf '%s\n%s' "$mc_present_set" "$mem_tid")"
done
mc_present_set="$(echo "$mc_present_set" | sort -u)"

# Iterate known_links keys
known_ids="$(echo "$STATE_JSON" | jq -r '(.taskMappings // (.known_links // {})) | keys[]?')"

deleted_closed=0
while IFS= read -r tid; do
  [[ -n "$tid" ]] || continue

  # If still present in MC (from DB or in-memory), not deleted.
  if echo "$mc_present_set" | grep -Fqx "$tid"; then
    continue
  fi

  # If already tombstoned recently, skip.
  if is_tombstoned "$tid"; then
    continue
  fi

  # Soft-close in Todoist.
  if todoist_cmd_close_item "$tid" 2>/dev/null; then
    add_tombstone "$tid"
    deleted_closed=$((deleted_closed+1))
    note "Closed Todoist item $tid because linked MC task appears deleted"
  else
    note "ERROR: Failed to close Todoist item $tid for presumed MC deletion" >&2
  fi

done <<<"$known_ids"

# Save state
save_state

note "=== Sync complete ==="
note "Todoist→MC: completed_in_mc=$mc_completed_from_todoist renamed_in_mc=$mc_renamed_from_todoist moved_in_mc=$mc_moved_from_todoist created_in_mc=$mc_created_from_todoist linked_existing=$mc_linked_existing"
note "MC→Todoist: created=$created updated=$updated closed=$closed linked=$linked skipped=$skipped"
note "MC deletions: closed_in_todoist=$deleted_closed"

exit 0
