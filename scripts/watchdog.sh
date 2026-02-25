#!/usr/bin/env bash
# OpenClaw Gateway Watchdog
#
# Purpose
# - Keep OpenClaw gateway running
# - Auto-recover from the known ZAI/GLM false "billing cooldown" lockout
# - Restart if gateway appears stuck (no logs for >10 minutes)
#
# Installation (systemd --user)
# 1) chmod +x ~/clawd/scripts/watchdog.sh
# 2) mkdir -p ~/.config/systemd/user
# 3) cp ~/clawd/scripts/watchdog.service ~/.config/systemd/user/watchdog-openclaw.service
# 4) systemctl --user daemon-reload
# 5) systemctl --user enable --now watchdog-openclaw.service
# 6) Tail logs: tail -f ~/clawd/logs/watchdog.log
#
# Notes
# - This watchdog expects the gateway to run as a systemd --user service named:
#     openclaw-gateway.service
#   (This is how it is configured on this box as of 2026-02.)
# - Gateway logs are read from journald via journalctl.
# - No packages are installed; requires bash + curl + jq.

set -euo pipefail

### Config ############################################################

GATEWAY_SERVICE="openclaw-gateway.service"
GATEWAY_PROCESS_NAME="openclaw-gateway"

WATCHDOG_ROOT="/home/ubuntu/clawd"
LOG_DIR="${WATCHDOG_ROOT}/logs"
STATE_DIR="${WATCHDOG_ROOT}/state"
WATCHDOG_LOG="${LOG_DIR}/watchdog.log"
STATE_JSON="${STATE_DIR}/watchdog-openclaw.json"

# How often to run the watchdog loop
LOOP_SECONDS=60

# Restart if no gateway logs have been emitted in this long (seconds)
STUCK_SECONDS=600

# ZAI false billing cooldown detection
BILLING_WAIT_SECONDS=30
BILLING_PATTERNS_REGEX='API provider returned a billing error|billing cooldown|\b402\b|\bcredit\b|\bbilling\b'

# Circuit breaker: max restarts per hour
MAX_RESTARTS_PER_HOUR=3

# ZAI endpoint (coding plan)
ZAI_ENDPOINT="https://api.z.ai/api/coding/paas/v4/chat/completions"
# Use a model that exists in the account; this is only a sanity check.
ZAI_TEST_MODEL="glm-4.7"

# Health check after restart
HEALTHCHECK_TIMEOUT_SECONDS=90

### Helpers ###########################################################

mkdir -p "${LOG_DIR}" "${STATE_DIR}"

log() {
  # shellcheck disable=SC2059
  printf "%s %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "${WATCHDOG_LOG}" >/dev/null
}

die() {
  log "ERROR: $*"
  exit 1
}

# Read an env var from ~/.clawdbot/.env without echoing secrets.
read_env_var() {
  local key="$1"
  local env_file="/home/ubuntu/.clawdbot/.env"
  [[ -f "${env_file}" ]] || return 1
  # Supports lines like: KEY=value OR export KEY=value
  # Strips surrounding quotes and CRLF.
  local val
  val="$(grep -E "^(export[[:space:]]+)?${key}=" "${env_file}" 2>/dev/null | tail -n1 | sed -E "s/^(export[[:space:]]+)?${key}=//" | sed -E 's/^"(.*)"$/\1/' | tr -d '\r\n')"
  [[ -n "${val}" ]] || return 1
  printf "%s" "${val}"
}

have_user_systemd() {
  command -v systemctl >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1
}

gateway_is_active() {
  if have_user_systemd && systemctl --user list-units --type=service --all | grep -q "${GATEWAY_SERVICE}"; then
    systemctl --user is-active --quiet "${GATEWAY_SERVICE}"
  else
    pgrep -x "${GATEWAY_PROCESS_NAME}" >/dev/null 2>&1
  fi
}

# Restart history tracking (for circuit breaker)
init_state_if_missing() {
  if [[ ! -f "${STATE_JSON}" ]]; then
    cat >"${STATE_JSON}" <<'JSON'
{
  "journalCursor": "",
  "lastGatewayLogEpoch": 0,
  "restarts": []
}
JSON
  fi
}

get_state() {
  local jq_expr="$1"
  init_state_if_missing
  jq -r "${jq_expr}" "${STATE_JSON}"
}

set_state() {
  local jq_expr="$1"
  init_state_if_missing
  tmp="$(mktemp)"
  jq "${jq_expr}" "${STATE_JSON}" >"${tmp}" && mv "${tmp}" "${STATE_JSON}"
}

prune_restart_history() {
  local now
  now="$(date +%s)"
  set_state ".restarts |= map(select(. >= (${now} - 3600)))"
}

restart_budget_ok() {
  prune_restart_history
  local count
  count="$(get_state '.restarts | length')"
  [[ "${count}" -lt "${MAX_RESTARTS_PER_HOUR}" ]]
}

record_restart() {
  local now
  now="$(date +%s)"
  set_state ".restarts += [${now}]"
}

# Pull new gateway logs since the last saved journal cursor.
# Outputs log lines to stdout and updates cursor in state.
fetch_new_gateway_logs() {
  init_state_if_missing

  # If there's no cursor yet, initialize it to current end of journal for the unit.
  local cursor
  cursor="$(get_state '.journalCursor')"

  if [[ -z "${cursor}" || "${cursor}" == "null" ]]; then
    # show-cursor prints cursor on stderr/extra line. Grab the cursor.
    local cur
    cur="$(journalctl --user -u "${GATEWAY_SERVICE}" -n 0 --show-cursor 2>/dev/null | sed -n 's/^-- cursor: //p' | tail -n1)"
    [[ -n "${cur}" ]] && set_state ".journalCursor = \"${cur}\""
    return 0
  fi

  # Read logs after cursor (cap lines to avoid runaway)
  local out
  out="$(journalctl --user -u "${GATEWAY_SERVICE}" --after-cursor="${cursor}" --show-cursor -n 500 2>/dev/null || true)"

  # Update cursor if present
  local new_cursor
  new_cursor="$(printf "%s\n" "${out}" | sed -n 's/^-- cursor: //p' | tail -n1)"
  if [[ -n "${new_cursor}" ]]; then
    set_state ".journalCursor = \"${new_cursor}\""
  fi

  # Print non-cursor lines
  printf "%s\n" "${out}" | grep -v '^-- cursor: ' || true
}

# Get the epoch timestamp of the most recent gateway journal entry.
# Returns 0 if none found.
get_last_gateway_log_epoch() {
  local js
  js="$(journalctl --user -u "${GATEWAY_SERVICE}" -n 1 --output=json 2>/dev/null || true)"
  [[ -n "${js}" ]] || { echo 0; return 0; }
  # __REALTIME_TIMESTAMP is microseconds since epoch
  echo "${js}" | jq -r '.__REALTIME_TIMESTAMP // 0' | awk '{printf "%d", $1/1000000}'
}

zai_api_works() {
  local api_key
  api_key="$(read_env_var 'ZAI_API_KEY' || true)"
  [[ -n "${api_key}" ]] || {
    log "WARN: ZAI_API_KEY not found in /home/ubuntu/.clawdbot/.env; skipping ZAI verification"
    return 2
  }

  # Minimal request; treat HTTP 200 + parseable JSON as OK.
  local resp http
  resp="$(mktemp)"
  http="$(curl -sS -m 20 -o "${resp}" -w '%{http_code}' \
    -H "Authorization: Bearer ${api_key}" \
    -H 'Content-Type: application/json' \
    -d "{\"model\":\"${ZAI_TEST_MODEL}\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":1}" \
    "${ZAI_ENDPOINT}" || echo "000")"

  if [[ "${http}" == "200" ]]; then
    if jq -e . >/dev/null 2>&1 <"${resp}"; then
      rm -f "${resp}"
      return 0
    fi
  fi

  rm -f "${resp}"
  return 1
}

restart_gateway() {
  local reason="$1"

  if ! restart_budget_ok; then
    log "CIRCUIT_BREAKER: restart suppressed (>${MAX_RESTARTS_PER_HOUR}/hour). reason=${reason}"
    return 1
  fi

  log "RESTART: initiating gateway restart. reason=${reason}"
  record_restart

  local start_epoch
  start_epoch="$(date +%s)"

  if have_user_systemd && systemctl --user list-units --type=service --all | grep -q "^${GATEWAY_SERVICE}"; then
    systemctl --user restart "${GATEWAY_SERVICE}" || true
  else
    # Fallback: kill process and start new gateway in background (best-effort)
    pkill -x "${GATEWAY_PROCESS_NAME}" || true
    (nohup openclaw gateway start >>"${LOG_DIR}/gateway.out" 2>&1 &)
  fi

  # Wait for gateway to be healthy
  local deadline=$((start_epoch + HEALTHCHECK_TIMEOUT_SECONDS))
  while (( $(date +%s) < deadline )); do
    if gateway_is_active; then
      # Consider it "healthy" once a new journal entry appears after restart time.
      local last
      last="$(get_last_gateway_log_epoch)"
      if [[ "${last}" -ge "${start_epoch}" ]]; then
        log "RESTART: gateway appears healthy (active + logs flowing)."
        return 0
      fi
    fi
    sleep 2
  done

  log "RESTART: gateway did not become healthy within ${HEALTHCHECK_TIMEOUT_SECONDS}s"
  return 1
}

### Main loop #########################################################

log "watchdog starting (loop=${LOOP_SECONDS}s stuck=${STUCK_SECONDS}s maxRestartsPerHour=${MAX_RESTARTS_PER_HOUR})"

# Ensure we have a journal cursor initialized.
init_state_if_missing
fetch_new_gateway_logs >/dev/null || true

while true; do
  # 1) Process monitor: restart if dead
  if ! gateway_is_active; then
    log "DETECT: gateway not running"
    restart_gateway "process_not_running" || true
    sleep "${LOOP_SECONDS}"
    continue
  fi

  # 2) Read new logs and look for billing/cooldown pattern
  new_logs="$(fetch_new_gateway_logs || true)"
  if [[ -n "${new_logs}" ]]; then
    # Update last log epoch whenever we see output
    now="$(date +%s)"
    set_state ".lastGatewayLogEpoch = ${now}"

    if printf "%s\n" "${new_logs}" | grep -Eqi "${BILLING_PATTERNS_REGEX}"; then
      log "DETECT: gateway logs matched billing/cooldown pattern; verifying ZAI after ${BILLING_WAIT_SECONDS}s"
      sleep "${BILLING_WAIT_SECONDS}"

      if zai_api_works; then
        log "VERIFY: ZAI API responds OK; treating gateway billing/cooldown as false-positive → restart"
        restart_gateway "false_billing_cooldown" || true
      else
        rc=$?
        if [[ "${rc}" -eq 2 ]]; then
          log "VERIFY: skipped ZAI API verification (missing key); not restarting"
        else
          log "VERIFY: ZAI API did NOT respond OK; assuming legitimate issue → no restart"
        fi
      fi
    fi
  fi

  # 3) Stuck detection: if no logs for >10 minutes, restart
  last_epoch="$(get_state '.lastGatewayLogEpoch')"
  if [[ "${last_epoch}" -eq 0 ]]; then
    # If we don't have a stored timestamp yet, seed from journal.
    last_epoch="$(get_last_gateway_log_epoch)"
    set_state ".lastGatewayLogEpoch = ${last_epoch}"
  fi

  now_epoch="$(date +%s)"
  if [[ "${last_epoch}" -gt 0 ]] && (( now_epoch - last_epoch > STUCK_SECONDS )); then
    log "DETECT: gateway appears stuck (no logs for $((now_epoch - last_epoch))s)"
    restart_gateway "stuck_no_logs" || true
  fi

  sleep "${LOOP_SECONDS}"
done
