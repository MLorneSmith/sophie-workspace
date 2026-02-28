#!/usr/bin/env bash
set -euo pipefail

# bitwarden-get-item.sh
# Fetch a Bitwarden item by name (or id) and print selected fields.
#
# Safety:
# - Default output avoids secrets.
# - Use --password/--totp explicitly to output sensitive values.
# - Requires BW_SESSION to be set (or will attempt unlock using BW_PASSWORD).

usage() {
  cat <<'USAGE'
Usage:
  bitwarden-get-item.sh --name "Item Name" [--field username|password|totp|uri|notes] [--json]
  bitwarden-get-item.sh --id <item-id> [--field ...] [--json]

Options:
  --name <name>     Item name (exact match preferred; script will search and pick the first exact match)
  --id <id>         Item id
  --field <field>   One of: name, username, password, totp, uri, notes (default: username)
  --json            Output the full JSON item (SENSITIVE: may include secrets)
  --password        Shortcut for --field password (SENSITIVE)
  --totp            Shortcut for --field totp (SENSITIVE)
  --help            Show help

Environment:
  BW_SESSION        Bitwarden session token (recommended)
  BW_PASSWORD       If BW_SESSION is missing/expired, used to unlock via: bw unlock --passwordenv BW_PASSWORD

Examples:
  source ~/.openclaw/.secrets.env
  export BW_SESSION="$(bw unlock --passwordenv BW_PASSWORD --raw)"
  bitwarden-get-item.sh --name "GitHub" --field username
  bitwarden-get-item.sh --name "GitHub" --password | pbcopy
USAGE
}

NAME=""
ID=""
FIELD="username"
JSON=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="${2:-}"; shift 2;;
    --id) ID="${2:-}"; shift 2;;
    --field) FIELD="${2:-}"; shift 2;;
    --json) JSON=1; shift;;
    --password) FIELD="password"; shift;;
    --totp) FIELD="totp"; shift;;
    --help|-h) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

if [[ -z "$NAME" && -z "$ID" ]]; then
  echo "Error: provide --name or --id" >&2
  usage
  exit 2
fi

if ! command -v bw >/dev/null 2>&1; then
  echo "Error: bw CLI not found" >&2
  exit 127
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq not found" >&2
  exit 127
fi

# Ensure we have a session; attempt unlock if missing.
if [[ -z "${BW_SESSION:-}" ]]; then
  if [[ -z "${BW_PASSWORD:-}" ]]; then
    echo "Error: BW_SESSION not set and BW_PASSWORD missing; cannot unlock" >&2
    exit 3
  fi
  export BW_SESSION
  BW_SESSION="$(bw unlock --passwordenv BW_PASSWORD --raw)"
fi

get_item_json_by_id() {
  bw get item "$1"
}

get_item_json_by_name() {
  local name="$1"
  # Search and prefer exact match; fall back to first result.
  local items
  items="$(bw list items --search "$name")"
  local exact
  exact="$(printf '%s' "$items" | jq --arg n "$name" -c '[.[] | select(.name == $n)] | .[0]')"
  if [[ "$exact" != "null" ]]; then
    printf '%s\n' "$exact"
    return 0
  fi
  printf '%s' "$items" | jq -c '.[0]'
}

ITEM_JSON=""
if [[ -n "$ID" ]]; then
  ITEM_JSON="$(get_item_json_by_id "$ID")"
else
  ITEM_JSON="$(get_item_json_by_name "$NAME")"
fi

if [[ "$JSON" -eq 1 ]]; then
  # WARNING: full item JSON may contain secrets.
  printf '%s\n' "$ITEM_JSON"
  exit 0
fi

case "$FIELD" in
  name)
    printf '%s\n' "$(printf '%s' "$ITEM_JSON" | jq -r '.name // empty')"
    ;;
  username)
    printf '%s\n' "$(printf '%s' "$ITEM_JSON" | jq -r '.login.username // empty')"
    ;;
  password)
    # SENSITIVE
    printf '%s\n' "$(printf '%s' "$ITEM_JSON" | jq -r '.login.password // empty')"
    ;;
  totp)
    # SENSITIVE
    printf '%s\n' "$(printf '%s' "$ITEM_JSON" | jq -r '.login.totp // empty')"
    ;;
  uri)
    printf '%s\n' "$(printf '%s' "$ITEM_JSON" | jq -r '.login.uris[0].uri // empty')"
    ;;
  notes)
    printf '%s\n' "$(printf '%s' "$ITEM_JSON" | jq -r '.notes // empty')"
    ;;
  *)
    echo "Error: unknown field '$FIELD'" >&2
    usage
    exit 2
    ;;
esac
