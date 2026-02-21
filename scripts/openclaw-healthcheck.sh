#!/usr/bin/env bash
#
# OpenClaw Gateway Health Check Test Suite
# =========================================
# Comprehensive health checks for bare metal systemd deployment.
# Tests gateway, auth profiles, device scopes, config, cron jobs,
# services, resources, internal tools, connectivity, and latency.
#
# Usage:
#   ./openclaw-healthcheck.sh [OPTIONS]
#
# Options:
#   --section <name>  Run only specific section (gateway, auth, devices, config, cron, services, resources, internal, connectivity, latency)
#   --json            Output results as JSON
#   --notify          Send failures to Discord webhook
#   --help            Show this help message
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
#

set -o pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Paths
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
AUTH_PROFILES="$HOME/.openclaw/agents/main/agent/auth-profiles.json"
DEVICE_SCOPES="$HOME/.openclaw/devices/paired.json"
GATEWAY_URL="http://localhost:18789"
INTERNAL_TOOLS_URL="http://localhost:3001"
LOG_DIR="/tmp/openclaw"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/openclaw-$TODAY.log"
CLAWDBOT_ENV="$HOME/.clawdbot/.env"

# Counters
PASSED=0
FAILED=0
SKIPPED=0

# Results array for JSON output
declare -a RESULTS=()

# Options
JSON_OUTPUT=false
NOTIFY=false
SECTION_FILTER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --section)
            SECTION_FILTER="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --notify)
            NOTIFY=true
            shift
            ;;
        --help)
            sed -n '2,21p' "$0" | sed 's/^# //' | sed 's/^#//'
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Helper functions
pass() {
    local test_name="$1"
    local details="${2:-}"
    ((PASSED++))
    if [[ "$JSON_OUTPUT" == "false" ]]; then
        echo -e "  ${GREEN}✓${NC} $test_name${details:+ ($details)}"
    fi
    RESULTS+=("{\"name\":\"$test_name\",\"status\":\"pass\",\"details\":\"$details\"}")
}

fail() {
    local test_name="$1"
    local details="${2:-}"
    ((FAILED++))
    if [[ "$JSON_OUTPUT" == "false" ]]; then
        echo -e "  ${RED}✗${NC} $test_name${details:+ ($details)}"
    fi
    RESULTS+=("{\"name\":\"$test_name\",\"status\":\"fail\",\"details\":\"$details\"}")
}

skip() {
    local test_name="$1"
    local reason="${2:-}"
    ((SKIPPED++))
    if [[ "$JSON_OUTPUT" == "false" ]]; then
        echo -e "  ${YELLOW}⏭${NC} $test_name${reason:+ ($reason)}"
    fi
    RESULTS+=("{\"name\":\"$test_name\",\"status\":\"skip\",\"details\":\"$reason\"}")
}

section_header() {
    local name="$1"
    local count="$2"
    if [[ "$JSON_OUTPUT" == "false" ]]; then
        echo -e "\n${BOLD}━━━ $name ($count tests) ━━━${NC}"
    fi
}

should_run_section() {
    local section="$1"
    [[ -z "$SECTION_FILTER" || "$SECTION_FILTER" == "$section" ]]
}

# ============================================================================
# SECTION 1: Gateway Health (7 tests)
# ============================================================================
test_gateway_health() {
    should_run_section "gateway" || return
    section_header "Gateway Health" 7

    # 1. HTTP health check
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$GATEWAY_URL" 2>/dev/null)
    if [[ "$http_code" == "200" || "$http_code" == "404" ]]; then
        pass "HTTP health check" "status $http_code"
    else
        fail "HTTP health check" "got $http_code, expected 200"
    fi

    # 2. Version check
    local version
    if version=$(openclaw --version 2>/dev/null | head -1); then
        pass "Version check" "$version"
    else
        fail "Version check" "openclaw --version failed"
    fi

    # 3. systemd service is active
    if systemctl --user is-active --quiet openclaw-gateway.service 2>/dev/null; then
        pass "systemd service active"
    else
        fail "systemd service active" "openclaw-gateway.service not active"
    fi

    # 4. PID is alive
    local pid
    pid=$(systemctl --user show openclaw-gateway.service --property=MainPID --value 2>/dev/null)
    if [[ -n "$pid" && "$pid" != "0" ]] && kill -0 "$pid" 2>/dev/null; then
        pass "PID is alive" "PID $pid"
    else
        fail "PID is alive" "no valid PID"
    fi

    # 5. Uptime > 60 seconds
    local start_ts now_ts uptime_secs
    start_ts=$(systemctl --user show openclaw-gateway.service --property=ExecMainStartTimestampMonotonic --value 2>/dev/null)
    if [[ -n "$start_ts" && "$start_ts" != "0" ]]; then
        # Get uptime from ActiveEnterTimestamp
        local active_since
        active_since=$(systemctl --user show openclaw-gateway.service --property=ActiveEnterTimestamp --value 2>/dev/null)
        if [[ -n "$active_since" && "$active_since" != "" ]]; then
            # Parse timestamp and compare with now
            local start_epoch now_epoch
            start_epoch=$(date -d "$active_since" +%s 2>/dev/null)
            now_epoch=$(date +%s)
            if [[ -n "$start_epoch" ]]; then
                uptime_secs=$((now_epoch - start_epoch))
                if [[ $uptime_secs -gt 60 ]]; then
                    pass "Uptime > 60 seconds" "${uptime_secs}s"
                else
                    fail "Uptime > 60 seconds" "only ${uptime_secs}s (crash-looping?)"
                fi
            else
                skip "Uptime > 60 seconds" "could not parse timestamp"
            fi
        else
            skip "Uptime > 60 seconds" "no ActiveEnterTimestamp"
        fi
    else
        skip "Uptime > 60 seconds" "service not running"
    fi

    # 6. Memory usage < 1GB
    if [[ -n "$pid" && "$pid" != "0" ]]; then
        local mem_kb
        mem_kb=$(ps -o rss= -p "$pid" 2>/dev/null | tr -d ' ')
        if [[ -n "$mem_kb" ]]; then
            local mem_mb=$((mem_kb / 1024))
            if [[ $mem_mb -lt 1024 ]]; then
                pass "Memory usage < 1GB" "${mem_mb}MB"
            else
                fail "Memory usage < 1GB" "${mem_mb}MB"
            fi
        else
            skip "Memory usage < 1GB" "could not read memory"
        fi
    else
        skip "Memory usage < 1GB" "no PID"
    fi

    # 7. CPU not pegged
    if [[ -n "$pid" && "$pid" != "0" ]]; then
        local cpu_pct
        cpu_pct=$(ps -o %cpu= -p "$pid" 2>/dev/null | tr -d ' ')
        if [[ -n "$cpu_pct" ]]; then
            # Remove decimal part for comparison
            local cpu_int=${cpu_pct%.*}
            if [[ $cpu_int -lt 90 ]]; then
                pass "CPU not pegged" "${cpu_pct}%"
            else
                fail "CPU not pegged" "${cpu_pct}%"
            fi
        else
            skip "CPU not pegged" "could not read CPU"
        fi
    else
        skip "CPU not pegged" "no PID"
    fi
}

# ============================================================================
# SECTION 2: Auth Profiles (5 tests)
# ============================================================================
test_auth_profiles() {
    should_run_section "auth" || return
    section_header "Auth Profiles" 5

    # 1. Read auth-profiles.json
    if [[ ! -f "$AUTH_PROFILES" ]]; then
        skip "Auth profiles readable" "file not found"
        skip "No stuck cooldowns" "no auth profiles"
        skip "OpenAI Codex token valid" "no auth profiles"
        skip "Expected providers exist" "no auth profiles"
        skip "No excessive errors" "no auth profiles"
        return
    fi

    local profiles_json
    if profiles_json=$(cat "$AUTH_PROFILES" 2>/dev/null) && echo "$profiles_json" | jq . >/dev/null 2>&1; then
        pass "Auth profiles readable"
    else
        fail "Auth profiles readable" "invalid JSON"
        return
    fi

    # Extract profiles object (profiles are keyed like "anthropic:manual", "openai-codex:default")
    local profiles_obj
    profiles_obj=$(echo "$profiles_json" | jq '.profiles // {}' 2>/dev/null)

    # 2. Check no profiles have cooldownUntil in the future
    local now_ms stuck_count
    now_ms=$(($(date +%s) * 1000))
    stuck_count=$(echo "$profiles_obj" | jq --argjson now "$now_ms" '[to_entries[] | select(.value.cooldownUntil != null and .value.cooldownUntil > $now)] | length' 2>/dev/null)
    if [[ "$stuck_count" == "0" || -z "$stuck_count" ]]; then
        pass "No stuck cooldowns"
    else
        local stuck_providers
        stuck_providers=$(echo "$profiles_obj" | jq -r --argjson now "$now_ms" '[to_entries[] | select(.value.cooldownUntil != null and .value.cooldownUntil > $now) | .key] | join(", ")' 2>/dev/null)
        fail "No stuck cooldowns" "$stuck_count stuck: $stuck_providers"
    fi

    # 3. Check OpenAI Codex token expiry (expires is Unix timestamp in milliseconds)
    local codex_expires
    codex_expires=$(echo "$profiles_obj" | jq -r 'to_entries[] | select(.key | startswith("openai-codex")) | .value.expires // empty' 2>/dev/null | head -1)
    if [[ -z "$codex_expires" ]]; then
        skip "OpenAI Codex token valid" "no expires field"
    else
        local expires_epoch now_epoch now_ms
        now_ms=$(($(date +%s) * 1000))
        # expires is already in milliseconds
        if [[ "$codex_expires" =~ ^[0-9]+$ ]] && [[ $codex_expires -gt $now_ms ]]; then
            local ms_left=$((codex_expires - now_ms))
            local days_left=$((ms_left / 1000 / 86400))
            pass "OpenAI Codex token valid" "expires in ${days_left}d"
        else
            fail "OpenAI Codex token valid" "expired or invalid"
        fi
    fi

    # 4. Check all expected providers exist (keys are like "provider:name")
    local missing_providers=""
    for provider in anthropic openai-codex zai; do
        if echo "$profiles_obj" | jq -e "to_entries[] | select(.key | startswith(\"$provider:\"))" >/dev/null 2>&1; then
            :
        else
            missing_providers="$missing_providers $provider"
        fi
    done
    if [[ -z "$missing_providers" ]]; then
        pass "Expected providers exist" "anthropic, openai-codex, zai"
    else
        fail "Expected providers exist" "missing:$missing_providers"
    fi

    # 5. Check no profiles have excessive error counts
    local high_error_count
    high_error_count=$(echo "$profiles_obj" | jq '[to_entries[] | select((.value.errorCount // 0) > 20)] | length' 2>/dev/null)
    if [[ "$high_error_count" == "0" || -z "$high_error_count" ]]; then
        pass "No excessive errors"
    else
        local high_error_providers
        high_error_providers=$(echo "$profiles_obj" | jq -r '[to_entries[] | select((.value.errorCount // 0) > 20) | "\(.key):\(.value.errorCount)"] | join(", ")' 2>/dev/null)
        fail "No excessive errors" "$high_error_providers"
    fi
}

# ============================================================================
# SECTION 3: Device Scopes (3 tests)
# ============================================================================
test_device_scopes() {
    should_run_section "devices" || return
    section_header "Device Scopes" 3

    # 1. Read paired.json
    if [[ ! -f "$DEVICE_SCOPES" ]]; then
        skip "Device scopes readable" "file not found"
        skip "All devices have operator.read" "no device file"
        skip "All devices have operator.write" "no device file"
        return
    fi

    local devices_json
    if devices_json=$(cat "$DEVICE_SCOPES" 2>/dev/null) && echo "$devices_json" | jq . >/dev/null 2>&1; then
        pass "Device scopes readable"
    else
        fail "Device scopes readable" "invalid JSON"
        return
    fi

    # 2. All devices have operator.read scope
    local devices_without_read
    devices_without_read=$(echo "$devices_json" | jq '[.[] | select(.scopes != null) | select(.scopes | index("operator.read") | not)] | length' 2>/dev/null)
    if [[ "$devices_without_read" == "0" || -z "$devices_without_read" ]]; then
        pass "All devices have operator.read"
    else
        fail "All devices have operator.read" "$devices_without_read missing"
    fi

    # 3. All devices have operator.write scope
    local devices_without_write
    devices_without_write=$(echo "$devices_json" | jq '[.[] | select(.scopes != null) | select(.scopes | index("operator.write") | not)] | length' 2>/dev/null)
    if [[ "$devices_without_write" == "0" || -z "$devices_without_write" ]]; then
        pass "All devices have operator.write"
    else
        fail "All devices have operator.write" "$devices_without_write missing"
    fi
}

# ============================================================================
# SECTION 4: Config Validation (6 tests)
# ============================================================================
test_config_validation() {
    should_run_section "config" || return
    section_header "Config Validation" 6

    # 1. Config exists and is valid JSON
    if [[ ! -f "$OPENCLAW_CONFIG" ]]; then
        fail "Config exists and valid JSON" "file not found"
        skip "ZAI baseUrl is coding plan" "no config"
        skip "Primary model set" "no config"
        skip "Fallback models configured" "no config"
        skip "Discord channel configured" "no config"
        skip "Billing cooldown < 1 hour" "no config"
        return
    fi

    local config_json
    if config_json=$(cat "$OPENCLAW_CONFIG" 2>/dev/null) && echo "$config_json" | jq . >/dev/null 2>&1; then
        pass "Config exists and valid JSON"
    else
        fail "Config exists and valid JSON" "invalid JSON"
        return
    fi

    # 2. ZAI baseUrl contains "coding/paas"
    local zai_url
    zai_url=$(echo "$config_json" | jq -r '.models.providers.zai.baseUrl // empty' 2>/dev/null)
    if [[ -z "$zai_url" ]]; then
        skip "ZAI baseUrl is coding plan" "no zai config"
    elif [[ "$zai_url" == *"coding/paas"* ]]; then
        pass "ZAI baseUrl is coding plan"
    else
        fail "ZAI baseUrl is coding plan" "using regular API, not coding plan"
    fi

    # 3. Primary model is set (check agents.main.defaults.model.primary or agents.defaults.model.primary)
    local primary_model
    primary_model=$(echo "$config_json" | jq -r '.agents.main.defaults.model.primary // .agents.defaults.model.primary // .models.default // empty' 2>/dev/null)
    if [[ -n "$primary_model" ]]; then
        pass "Primary model set" "$primary_model"
    else
        fail "Primary model set" "no default model"
    fi

    # 4. Fallback models are configured
    local fallback_count
    fallback_count=$(echo "$config_json" | jq '(.agents.main.defaults.model.fallbacks // .agents.defaults.model.fallbacks // .models.fallback // []) | length' 2>/dev/null)
    if [[ -n "$fallback_count" && "$fallback_count" -gt 0 ]]; then
        pass "Fallback models configured" "$fallback_count fallbacks"
    else
        fail "Fallback models configured" "no fallbacks"
    fi

    # 5. Discord channel is configured
    local discord_channel
    discord_channel=$(echo "$config_json" | jq -r '.channels.discord // empty' 2>/dev/null)
    if [[ -n "$discord_channel" ]]; then
        pass "Discord channel configured"
    else
        # Try alternate path
        discord_channel=$(echo "$config_json" | jq -r '.discord.channelId // empty' 2>/dev/null)
        if [[ -n "$discord_channel" ]]; then
            pass "Discord channel configured"
        else
            fail "Discord channel configured" "no discord config"
        fi
    fi

    # 6. Billing cooldown hours are set low
    local cooldown_hours
    cooldown_hours=$(echo "$config_json" | jq -r '.billing.cooldownHours // .cooldownHours // empty' 2>/dev/null)
    if [[ -z "$cooldown_hours" ]]; then
        skip "Billing cooldown < 1 hour" "not configured"
    else
        # Use awk for float comparison
        local is_low
        is_low=$(echo "$cooldown_hours" | awk '{print ($1 < 1) ? 1 : 0}' 2>/dev/null)
        if [[ "$is_low" == "1" ]]; then
            pass "Billing cooldown < 1 hour" "${cooldown_hours}h"
        else
            fail "Billing cooldown < 1 hour" "${cooldown_hours}h"
        fi
    fi
}

# ============================================================================
# SECTION 5: Cron Jobs (4 tests)
# ============================================================================
test_cron_jobs() {
    should_run_section "cron" || return
    section_header "Cron Jobs" 4

    # 1. openclaw cron list succeeds
    local cron_output
    if cron_output=$(openclaw cron list 2>&1); then
        pass "Cron list succeeds"
    else
        fail "Cron list succeeds" "command failed"
        skip "Morning brief cron exists" "cron list failed"
        skip "No failed cron jobs" "cron list failed"
        skip "At least 3 cron jobs" "cron list failed"
        return
    fi

    # 2. Morning brief cron exists
    if echo "$cron_output" | grep -qi "morning\|brief\|daily"; then
        pass "Morning brief cron exists"
    else
        fail "Morning brief cron exists" "not found"
    fi

    # 3. No cron jobs with failed status
    if echo "$cron_output" | grep -qi "failed"; then
        fail "No failed cron jobs" "found failed jobs"
    else
        pass "No failed cron jobs"
    fi

    # 4. At least 3 cron jobs configured
    local cron_count
    cron_count=$(echo "$cron_output" | grep -c "^[0-9]\|│" 2>/dev/null || echo 0)
    if [[ $cron_count -ge 3 ]]; then
        pass "At least 3 cron jobs" "$cron_count jobs"
    else
        fail "At least 3 cron jobs" "only $cron_count"
    fi
}

# ============================================================================
# SECTION 6: Service Health (4 tests)
# ============================================================================
test_service_health() {
    should_run_section "services" || return
    section_header "Service Health" 4

    # 1. Watchdog service is active
    if systemctl --user is-active --quiet watchdog-openclaw.service 2>/dev/null; then
        pass "Watchdog service active"
    else
        fail "Watchdog service active" "not running"
    fi

    # 2. No OOM kills in journalctl (last 24h)
    local oom_count
    oom_count=$(journalctl --user --since "24 hours ago" 2>/dev/null | grep -ciE "oom|out of memory" | tr -d '\n' || echo 0)
    oom_count=${oom_count:-0}
    if [[ "$oom_count" =~ ^[0-9]+$ ]] && [[ $oom_count -eq 0 ]]; then
        pass "No OOM kills (24h)"
    else
        fail "No OOM kills (24h)" "$oom_count found"
    fi

    # 3. Gateway service not in failed/restarting state
    local service_state
    service_state=$(systemctl --user show openclaw-gateway.service --property=ActiveState --value 2>/dev/null)
    if [[ "$service_state" == "active" ]]; then
        pass "Gateway not failed/restarting" "$service_state"
    else
        fail "Gateway not failed/restarting" "$service_state"
    fi

    # 4. Log file exists for today
    if [[ -f "$LOG_FILE" ]]; then
        local log_size
        log_size=$(du -h "$LOG_FILE" 2>/dev/null | cut -f1)
        pass "Today's log file exists" "$log_size"
    else
        fail "Today's log file exists" "$LOG_FILE not found"
    fi
}

# ============================================================================
# SECTION 7: Disk & Resources (4 tests)
# ============================================================================
test_disk_resources() {
    should_run_section "resources" || return
    section_header "Disk & Resources" 4

    # 1. Disk usage < 85%
    local disk_pct
    disk_pct=$(df / 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
    if [[ -n "$disk_pct" && $disk_pct -lt 85 ]]; then
        pass "Disk usage < 85%" "${disk_pct}%"
    else
        fail "Disk usage < 85%" "${disk_pct}%"
    fi

    # 2. Available memory > 500MB
    local avail_mb
    avail_mb=$(free -m 2>/dev/null | awk '/^Mem:/ {print $7}')
    if [[ -n "$avail_mb" && $avail_mb -gt 500 ]]; then
        pass "Available memory > 500MB" "${avail_mb}MB"
    else
        fail "Available memory > 500MB" "${avail_mb}MB"
    fi

    # 3. Log files not growing unbounded (today's log < 100MB)
    if [[ -f "$LOG_FILE" ]]; then
        local log_kb
        log_kb=$(du -k "$LOG_FILE" 2>/dev/null | cut -f1)
        local log_mb=$((log_kb / 1024))
        if [[ $log_mb -lt 100 ]]; then
            pass "Today's log < 100MB" "${log_mb}MB"
        else
            fail "Today's log < 100MB" "${log_mb}MB"
        fi
    else
        skip "Today's log < 100MB" "no log file"
    fi

    # 4. /tmp has > 1GB free
    local tmp_avail_kb
    tmp_avail_kb=$(df /tmp 2>/dev/null | tail -1 | awk '{print $4}')
    local tmp_avail_gb=$((tmp_avail_kb / 1024 / 1024))
    if [[ $tmp_avail_gb -ge 1 ]]; then
        pass "/tmp has > 1GB free" "${tmp_avail_gb}GB"
    else
        local tmp_avail_mb=$((tmp_avail_kb / 1024))
        fail "/tmp has > 1GB free" "${tmp_avail_mb}MB"
    fi
}

# ============================================================================
# SECTION 8: Internal Tools (4 tests)
# ============================================================================
test_internal_tools() {
    should_run_section "internal" || return
    section_header "Internal Tools" 4

    # 1. Mission Control API responds
    local mc_response
    mc_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$INTERNAL_TOOLS_URL/api/v1/tasks?limit=1" 2>/dev/null)
    if [[ "$mc_response" == "200" ]]; then
        pass "Mission Control API responds"
    else
        fail "Mission Control API responds" "HTTP $mc_response"
    fi

    # 2. Feed monitor is accessible
    local feed_response
    feed_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$INTERNAL_TOOLS_URL/feed" 2>/dev/null)
    if [[ "$feed_response" == "200" || "$feed_response" == "302" ]]; then
        pass "Feed monitor accessible"
    else
        # Try alternative path
        feed_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$INTERNAL_TOOLS_URL/" 2>/dev/null)
        if [[ "$feed_response" == "200" || "$feed_response" == "302" ]]; then
            pass "Feed monitor accessible"
        else
            fail "Feed monitor accessible" "HTTP $feed_response"
        fi
    fi

    # 3. Caddy proxy working
    local caddy_response
    caddy_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 -H "Host: internal.slideheroes.com" "http://localhost:80" 2>/dev/null)
    if [[ "$caddy_response" == "200" || "$caddy_response" == "302" || "$caddy_response" == "401" || "$caddy_response" == "403" ]]; then
        pass "Caddy proxy working" "HTTP $caddy_response"
    else
        # May not have Caddy locally, try systemctl
        if systemctl is-active --quiet caddy 2>/dev/null; then
            pass "Caddy proxy working" "service active"
        else
            skip "Caddy proxy working" "Caddy not local"
        fi
    fi

    # 4. No internal-tools service crashes
    if systemctl is-active --quiet internal-tools 2>/dev/null; then
        pass "internal-tools service healthy"
    else
        # Try with --user flag
        if systemctl --user is-active --quiet internal-tools 2>/dev/null; then
            pass "internal-tools service healthy"
        else
            skip "internal-tools service healthy" "service not found"
        fi
    fi
}

# ============================================================================
# SECTION 9: Channel Connectivity (3 tests)
# ============================================================================
test_channel_connectivity() {
    should_run_section "connectivity" || return
    section_header "Channel Connectivity" 3

    # 1. Check gateway log for Discord connection status
    if [[ -f "$LOG_FILE" ]]; then
        # Look for messageChannel=discord or discord session patterns in recent logs
        local discord_activity
        discord_activity=$(tail -500 "$LOG_FILE" 2>/dev/null | grep -c 'messageChannel=discord\|discord:channel\|channel=discord' 2>/dev/null || echo 0)
        discord_activity=$(echo "$discord_activity" | tr -cd '0-9')
        if [[ -n "$discord_activity" && "$discord_activity" -gt 0 ]]; then
            pass "Discord connection established" "$discord_activity events"
        elif tail -500 "$LOG_FILE" 2>/dev/null | grep -qi "discord"; then
            pass "Discord connection established" "discord activity found"
        else
            fail "Discord connection established" "no discord activity"
        fi
    else
        skip "Discord connection established" "no log file"
    fi

    # 2. No repeated reconnect patterns (actual errors, not heartbeat stats)
    if [[ -f "$LOG_FILE" ]]; then
        local reconnect_count
        # Look for actual reconnect error events, not JSON data containing reconnectAttempts
        reconnect_count=$(tail -2000 "$LOG_FILE" 2>/dev/null | grep -c '"reconnecting"\|connection.lost\|disconnect.*error\|reconnect.failed' 2>/dev/null || echo 0)
        reconnect_count=$(echo "$reconnect_count" | tr -cd '0-9')
        reconnect_count=${reconnect_count:-0}
        if [[ $reconnect_count -lt 10 ]]; then
            pass "No repeated reconnects" "$reconnect_count events"
        else
            fail "No repeated reconnects" "$reconnect_count reconnect events"
        fi
    else
        skip "No repeated reconnects" "no log file"
    fi

    # 3. WebSocket connection established (web gateway heartbeat shows WS is working)
    if [[ -f "$LOG_FILE" ]]; then
        local ws_activity
        ws_activity=$(tail -500 "$LOG_FILE" 2>/dev/null | grep -c 'web gateway heartbeat\|gateway/ws\|sessions\.patch' 2>/dev/null || echo 0)
        ws_activity=$(echo "$ws_activity" | tr -cd '0-9')
        if [[ -n "$ws_activity" && "$ws_activity" -gt 0 ]]; then
            pass "WebSocket connection established" "$ws_activity events"
        elif tail -500 "$LOG_FILE" 2>/dev/null | grep -qi "gateway"; then
            pass "WebSocket connection established" "gateway activity found"
        else
            skip "WebSocket connection established" "no ws logs"
        fi
    else
        skip "WebSocket connection established" "no log file"
    fi
}

# ============================================================================
# SECTION 10: Latency (3 tests)
# ============================================================================
test_latency() {
    should_run_section "latency" || return
    section_header "Latency" 3

    # 1. Gateway HTTP response < 500ms
    local gateway_time
    gateway_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "$GATEWAY_URL" 2>/dev/null)
    if [[ -n "$gateway_time" ]]; then
        local gateway_ms
        gateway_ms=$(echo "$gateway_time" | awk '{printf "%.0f", $1 * 1000}' 2>/dev/null)
        gateway_ms=${gateway_ms:-0}
        if [[ "$gateway_ms" =~ ^[0-9]+$ ]] && [[ $gateway_ms -lt 500 ]]; then
            pass "Gateway response < 500ms" "${gateway_ms}ms"
        else
            fail "Gateway response < 500ms" "${gateway_ms}ms"
        fi
    else
        fail "Gateway response < 500ms" "no response"
    fi

    # 2. Mission Control API response < 2000ms
    local mc_time
    mc_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "$INTERNAL_TOOLS_URL/api/v1/tasks?limit=1" 2>/dev/null)
    if [[ -n "$mc_time" ]]; then
        local mc_ms
        mc_ms=$(echo "$mc_time" | awk '{printf "%.0f", $1 * 1000}' 2>/dev/null)
        mc_ms=${mc_ms:-0}
        if [[ "$mc_ms" =~ ^[0-9]+$ ]] && [[ $mc_ms -lt 2000 ]]; then
            pass "Mission Control < 2000ms" "${mc_ms}ms"
        else
            fail "Mission Control < 2000ms" "${mc_ms}ms"
        fi
    else
        fail "Mission Control < 2000ms" "no response"
    fi

    # 3. DNS resolution working
    local dns_time
    dns_time=$(curl -s -o /dev/null -w "%{time_namelookup}" --max-time 5 "https://google.com" 2>/dev/null)
    if [[ -n "$dns_time" && "$dns_time" != "0.000000" ]]; then
        local dns_ms
        # Use awk instead of bc for better compatibility
        dns_ms=$(echo "$dns_time" | awk '{printf "%.0f", $1 * 1000}' 2>/dev/null)
        dns_ms=${dns_ms:-0}
        if [[ "$dns_ms" =~ ^[0-9]+$ ]] && [[ $dns_ms -lt 1000 ]]; then
            pass "DNS resolution working" "${dns_ms}ms"
        else
            fail "DNS resolution working" "${dns_ms}ms"
        fi
    else
        # Check if DNS works at all
        if host google.com >/dev/null 2>&1; then
            pass "DNS resolution working" "host lookup ok"
        else
            fail "DNS resolution working" "lookup failed"
        fi
    fi
}

# ============================================================================
# Main
# ============================================================================

# Run all tests
if [[ "$JSON_OUTPUT" == "false" ]]; then
    echo -e "${BOLD}OpenClaw Gateway Health Check${NC}"
    echo -e "$(date '+%Y-%m-%d %H:%M:%S %Z')"
fi

test_gateway_health
test_auth_profiles
test_device_scopes
test_config_validation
test_cron_jobs
test_service_health
test_disk_resources
test_internal_tools
test_channel_connectivity
test_latency

# Output results
if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "{"
    echo "  \"timestamp\": \"$(date -Iseconds)\","
    echo "  \"passed\": $PASSED,"
    echo "  \"failed\": $FAILED,"
    echo "  \"skipped\": $SKIPPED,"
    echo "  \"results\": ["
    first=true
    for result in "${RESULTS[@]}"; do
        if [[ "$first" == "true" ]]; then
            echo "    $result"
            first=false
        else
            echo "    ,$result"
        fi
    done
    echo "  ]"
    echo "}"
else
    echo -e "\n${BOLD}━━━ Summary ━━━${NC}"
    echo -e "${GREEN}✓ Passed:${NC} $PASSED"
    echo -e "${RED}✗ Failed:${NC} $FAILED"
    echo -e "${YELLOW}⏭ Skipped:${NC} $SKIPPED"
fi

# Send Discord notification if requested and there are failures
if [[ "$NOTIFY" == "true" && $FAILED -gt 0 ]]; then
    if [[ -f "$CLAWDBOT_ENV" ]]; then
        DISCORD_WEBHOOK=$(grep "^DISCORD_DEPLOY_WEBHOOK=" "$CLAWDBOT_ENV" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r\n')
        if [[ -n "$DISCORD_WEBHOOK" ]]; then
            failed_tests=$(printf '%s\n' "${RESULTS[@]}" | grep '"status":"fail"' | jq -r '.name' 2>/dev/null | head -10 | tr '\n' ', ' | sed 's/,$//')
            curl -s -X POST "$DISCORD_WEBHOOK" \
                -H "Content-Type: application/json" \
                -d "{\"content\": \"⚠️ **OpenClaw Health Check Failed**\n\n**Passed:** $PASSED | **Failed:** $FAILED | **Skipped:** $SKIPPED\n\n**Failed tests:** ${failed_tests:-see logs}\"}" \
                >/dev/null 2>&1
        fi
    fi
fi

# Exit code
if [[ $FAILED -gt 0 ]]; then
    exit 1
else
    exit 0
fi
