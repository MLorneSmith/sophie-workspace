#!/usr/bin/env bash
set -euo pipefail

# Shared helpers for loop-runner.sh (thin wrapper today; kept for future expansion).

log() {
  printf "[%s] %s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$*" >&2
}

die() {
  log "ERROR: $*"
  exit 2
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

ensure_dir() {
  mkdir -p "$1"
}

mc_get_task() {
  local mc_base="$1" task_id="$2"
  require_cmd curl
  curl -fsS "${mc_base%/}/tasks/${task_id}"
}

mc_patch_task() {
  local mc_base="$1" task_id="$2" json_payload="$3"
  require_cmd curl
  curl -fsS -X PATCH "${mc_base%/}/tasks/${task_id}" \
    -H "Content-Type: application/json" \
    -d "$json_payload" >/dev/null
}
