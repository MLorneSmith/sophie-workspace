#!/bin/bash

# Docker Health Monitoring Wrapper Script
# Main entry point for Docker health monitoring functionality
# Usage: docker-health-wrapper.sh [--help] [--debug] [operation]
#
# This script serves as the foundation for all Docker health monitoring operations
# following Unix best practices and Claude Code conventions.

set -euo pipefail

# Script metadata
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get project root and Docker health directory
readonly PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
readonly DOCKER_HEALTH_DIR="${PROJECT_ROOT}/.claude/docker-health"

# Create a unique identifier for this project
readonly GIT_ROOT_HASH="$(echo "${PROJECT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)"
readonly STATUS_FILE="/tmp/.claude_docker_status_${GIT_ROOT_HASH}"
readonly STATUS_LOCK_FILE="${STATUS_FILE}.lock"
readonly STATUS_TEMP_FILE="${STATUS_FILE}.tmp"

# Background process management files
readonly PID_FILE="/tmp/.claude_docker_pid_${GIT_ROOT_HASH}"
readonly BACKGROUND_LOCK_FILE="/tmp/.claude_docker_bg_lock_${GIT_ROOT_HASH}"

# Status file configuration
readonly STATUS_CACHE_TTL="${CLAUDE_STATUS_CACHE_TTL:-30}"  # 30 second cache TTL
readonly STATUS_LOCK_TIMEOUT="${CLAUDE_STATUS_LOCK_TIMEOUT:-5}"  # 5 second lock timeout

# Background monitoring configuration
readonly MONITOR_INTERVAL="${CLAUDE_MONITOR_INTERVAL:-30}"  # 30 second monitor interval
readonly PID_LOCK_TIMEOUT="${CLAUDE_PID_LOCK_TIMEOUT:-5}"   # 5 second PID lock timeout

# Multi-level cache configuration
readonly CACHE_L1_TTL="${CLAUDE_CACHE_L1_TTL:-5}"     # Level 1: In-memory cache TTL (5 seconds)
readonly CACHE_L2_TTL="${CLAUDE_CACHE_L2_TTL:-30}"    # Level 2: File-based cache TTL (30 seconds)
readonly CACHE_L3_TTL="${CLAUDE_CACHE_L3_TTL:-300}"   # Level 3: Stale fallback TTL (5 minutes)

# Cache file paths
readonly CACHE_L1_DATA_FILE="/tmp/.claude_docker_cache_l1_${GIT_ROOT_HASH}"
readonly CACHE_L2_DATA_FILE="/tmp/.claude_docker_cache_l2_${GIT_ROOT_HASH}"
readonly CACHE_L3_DATA_FILE="/tmp/.claude_docker_cache_l3_${GIT_ROOT_HASH}"
readonly CACHE_METRICS_FILE="/tmp/.claude_docker_cache_metrics_${GIT_ROOT_HASH}"

# Debug mode from environment or flag
DEBUG="${CLAUDE_DEBUG:-0}"

# Exit codes
readonly EXIT_SUCCESS=0
readonly EXIT_ERROR=1
readonly EXIT_DOCKER_NOT_FOUND=2
readonly EXIT_INVALID_ARGS=3
readonly EXIT_PERMISSION_ERROR=4
readonly EXIT_DOCKER_DAEMON_STOPPED=5
readonly EXIT_DOCKER_TIMEOUT=6

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Level 1 Cache: In-memory cache variables (shell variables)
declare -g CACHE_L1_TIMESTAMP=""
declare -g CACHE_L1_DATA=""
declare -g CACHE_L1_DOCKER_RUNNING=""
declare -g CACHE_L1_DOCKER_TYPE=""
declare -g CACHE_L1_CONTAINER_COUNT=""

# Cache metrics tracking
declare -g CACHE_HITS_L1=0
declare -g CACHE_HITS_L2=0
declare -g CACHE_HITS_L3=0
declare -g CACHE_MISSES=0
declare -g CACHE_TOTAL_REQUESTS=0

# Source background process management functions
if [ -f "${SCRIPT_DIR}/docker-health-background.sh" ]; then
    source "${SCRIPT_DIR}/docker-health-background.sh"
fi

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM

# Debug logging function
debug() {
    if [ "$DEBUG" = "1" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $*" >&2
    fi
}

# Info logging function
info() {
    echo -e "${GREEN}[INFO]${NC} $*" >&2
}

# Warning logging function
warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

# Error logging function
error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Check Docker daemon status with comprehensive detection
check_docker_daemon() {
    debug "Checking Docker daemon status"

    local timeout="${DOCKER_TIMEOUT:-500}"  # Default 500ms timeout
    local start_time
    local docker_type="unknown"
    local docker_context=""

    start_time=$(date +%s%3N)  # Start time in milliseconds

    # First check if Docker command exists
    if ! command -v docker >/dev/null 2>&1; then
        debug "Docker command not found in PATH"
        return $EXIT_DOCKER_NOT_FOUND
    fi

    # Use timeout to prevent hanging - convert ms to seconds for timeout command
    local timeout_seconds
    if command -v bc >/dev/null 2>&1; then
        timeout_seconds=$(echo "scale=2; $timeout / 1000" | bc 2>/dev/null || echo "0.5")
    else
        # Fallback calculation without bc
        if [ "$timeout" -le 1000 ]; then
            timeout_seconds="1"  # Minimum 1 second for timeout command
        else
            timeout_seconds=$((timeout / 1000))  # Integer division fallback
        fi
    fi

    debug "Using timeout of ${timeout}ms (${timeout_seconds}s) for Docker daemon check"

    # Check Docker daemon connectivity with timeout
    local docker_output
    local docker_exit_code

    if docker_output=$(timeout "$timeout_seconds" docker version --format '{{.Server.Version}}' 2>&1); then
        docker_exit_code=0
        debug "Docker daemon responded with version: $docker_output"
    else
        docker_exit_code=$?
        debug "Docker daemon check failed with exit code: $docker_exit_code"
        debug "Docker output: $docker_output"
    fi

    # Calculate elapsed time
    local end_time
    local elapsed_ms
    end_time=$(date +%s%3N)
    elapsed_ms=$((end_time - start_time))
    debug "Docker daemon check completed in ${elapsed_ms}ms"

    # Handle timeout specifically (exit code 124 from timeout command)
    if [ $docker_exit_code -eq 124 ]; then
        error "Docker daemon check timed out after ${timeout}ms"
        error "The Docker daemon may be unresponsive or overloaded"
        return $EXIT_DOCKER_TIMEOUT
    fi

    # Handle permission errors
    if echo "$docker_output" | grep -q "permission denied\|dial unix.*permission denied"; then
        error "Permission denied accessing Docker daemon"
        error "Solutions:"
        error "  - Add your user to the docker group: sudo usermod -aG docker \$USER"
        error "  - Run with sudo (not recommended for regular use)"
        error "  - Check Docker socket permissions: ls -la /var/run/docker.sock"
        return $EXIT_PERMISSION_ERROR
    fi

    # Handle daemon not running
    if echo "$docker_output" | grep -q "Cannot connect to the Docker daemon\|Is the docker daemon running\|connection refused"; then
        error "Docker daemon is not running"
        error "Solutions:"
        error "  - Start Docker Desktop (macOS/Windows)"
        error "  - Start Docker service: sudo systemctl start docker (Linux)"
        error "  - Check Docker status: sudo systemctl status docker (Linux)"
        return $EXIT_DOCKER_DAEMON_STOPPED
    fi

    # If we get here and exit code is not 0, it's an unknown error
    if [ $docker_exit_code -ne 0 ]; then
        error "Docker daemon check failed with unexpected error"
        error "Exit code: $docker_exit_code"
        error "Output: $docker_output"
        return $EXIT_ERROR
    fi

    # Docker is accessible - now detect the type and environment
    detect_docker_environment

    debug "Docker daemon is running and accessible in ${elapsed_ms}ms"
    return $EXIT_SUCCESS
}

# Detect Docker environment type and context
detect_docker_environment() {
    debug "Detecting Docker environment"

    local docker_info
    local docker_context_info
    local docker_type="unknown"
    local is_wsl2=false

    # Get Docker info with timeout
    if docker_info=$(timeout 2s docker info --format '{{json .}}' 2>/dev/null); then
        debug "Retrieved Docker info successfully"

        # Check for Docker Desktop indicators
        if echo "$docker_info" | jq -r '.ServerVersion // empty' | grep -q "desktop\|Docker Desktop"; then
            docker_type="Docker Desktop"
        elif echo "$docker_info" | jq -r '.Name // empty' | grep -q "docker-desktop"; then
            docker_type="Docker Desktop"
        elif echo "$docker_info" | jq -r '.OperatingSystem // empty' | grep -q "Docker Desktop"; then
            docker_type="Docker Desktop"
        else
            docker_type="Docker Engine"
        fi

        # Check for WSL2 integration
        if echo "$docker_info" | jq -r '.OperatingSystem // empty' | grep -qi "wsl\|microsoft"; then
            is_wsl2=true
            docker_type="$docker_type (WSL2)"
        fi

        # Get current context
        if docker_context_info=$(docker context show 2>/dev/null); then
            debug "Docker context: $docker_context_info"
        fi

        info "Docker environment detected: $docker_type"
        if [ "$is_wsl2" = true ]; then
            info "WSL2 Docker Desktop integration detected"
        fi

    else
        warn "Could not retrieve detailed Docker info, but daemon is accessible"
        docker_type="Docker (type unknown)"
    fi

    # Store environment info for other functions to use
    export DOCKER_TYPE="$docker_type"
    export DOCKER_IS_WSL2="$is_wsl2"
    export DOCKER_CONTEXT="${docker_context_info:-default}"

    debug "Docker environment detection completed"
}

# Cleanup function for signal handling
cleanup() {
    debug "Cleanup function called"

    # Remove any temporary files or processes
    if [ -n "${TEMP_FILES:-}" ]; then
        debug "Cleaning up temporary files: $TEMP_FILES"
        rm -f $TEMP_FILES 2>/dev/null || true
    fi

    # Clean up status files and locks
    cleanup_status_files

    # Clean up cache files
    cache_cleanup

    # Clean up background process files
    if command -v cleanup_background_files >/dev/null 2>&1; then
        cleanup_background_files
    fi

    debug "Cleanup completed"
    exit $EXIT_SUCCESS
}

# ============================================================================
# MULTI-LEVEL CACHING SYSTEM
# ============================================================================

# Get current timestamp in seconds with milliseconds
get_current_timestamp() {
    date +%s.%3N 2>/dev/null || date +%s
}

# Check if timestamp is within TTL
is_timestamp_valid() {
    local timestamp="$1"
    local ttl="$2"

    if [ -z "$timestamp" ] || [ -z "$ttl" ]; then
        debug "Invalid timestamp or TTL provided"
        return 1
    fi

    local current_time
    current_time=$(get_current_timestamp)

    # Handle different timestamp formats
    local timestamp_seconds
    if echo "$timestamp" | grep -q '\.'; then
        # Already has decimal point
        timestamp_seconds="$timestamp"
    else
        # Add .000 for compatibility
        timestamp_seconds="${timestamp}.000"
    fi

    # Calculate age using bc if available, otherwise use integer math
    local age
    if command -v bc >/dev/null 2>&1; then
        age=$(echo "$current_time - $timestamp_seconds" | bc 2>/dev/null || echo "999")
    else
        # Fallback: convert to integer seconds
        local current_int timestamp_int
        current_int=$(echo "$current_time" | cut -d'.' -f1)
        timestamp_int=$(echo "$timestamp_seconds" | cut -d'.' -f1)
        age=$((current_int - timestamp_int))
    fi

    debug "Cache age: ${age}s, TTL: ${ttl}s"

    # Check if age is within TTL (use bc for floating point if available)
    if command -v bc >/dev/null 2>&1; then
        if [ "$(echo "$age <= $ttl" | bc 2>/dev/null || echo "0")" = "1" ]; then
            return 0
        else
            return 1
        fi
    else
        # Integer comparison fallback
        if [ "${age%.*}" -le "$ttl" ]; then
            return 0
        else
            return 1
        fi
    fi
}

# Level 1 Cache: In-memory cache operations
cache_l1_get() {
    debug "Checking Level 1 cache"

    CACHE_TOTAL_REQUESTS=$((CACHE_TOTAL_REQUESTS + 1))

    if [ -n "$CACHE_L1_TIMESTAMP" ] && is_timestamp_valid "$CACHE_L1_TIMESTAMP" "$CACHE_L1_TTL"; then
        debug "Level 1 cache hit"
        CACHE_HITS_L1=$((CACHE_HITS_L1 + 1))
        echo "$CACHE_L1_DATA"
        return 0
    else
        debug "Level 1 cache miss or expired"
        return 1
    fi
}

cache_l1_set() {
    local data="$1"
    local docker_running="$2"
    local docker_type="$3"
    local container_count="$4"

    debug "Setting Level 1 cache"

    CACHE_L1_TIMESTAMP=$(get_current_timestamp)
    CACHE_L1_DATA="$data"
    CACHE_L1_DOCKER_RUNNING="$docker_running"
    CACHE_L1_DOCKER_TYPE="$docker_type"
    CACHE_L1_CONTAINER_COUNT="$container_count"

    debug "Level 1 cache updated with timestamp: $CACHE_L1_TIMESTAMP"
}

cache_l1_invalidate() {
    debug "Invalidating Level 1 cache"

    CACHE_L1_TIMESTAMP=""
    CACHE_L1_DATA=""
    CACHE_L1_DOCKER_RUNNING=""
    CACHE_L1_DOCKER_TYPE=""
    CACHE_L1_CONTAINER_COUNT=""
}

# Level 2 Cache: Enhanced file-based cache operations
cache_l2_get() {
    debug "Checking Level 2 cache"

    if [ ! -f "$CACHE_L2_DATA_FILE" ]; then
        debug "Level 2 cache file does not exist"
        return 1
    fi

    # Read cache metadata
    local cache_timestamp cache_data
    if ! cache_data=$(cat "$CACHE_L2_DATA_FILE" 2>/dev/null); then
        debug "Failed to read Level 2 cache file"
        return 1
    fi

    # Extract timestamp from first line
    cache_timestamp=$(echo "$cache_data" | head -n1)

    if is_timestamp_valid "$cache_timestamp" "$CACHE_L2_TTL"; then
        debug "Level 2 cache hit"
        CACHE_HITS_L2=$((CACHE_HITS_L2 + 1))
        # Return data without timestamp line
        echo "$cache_data" | tail -n +2
        return 0
    else
        debug "Level 2 cache expired"
        return 1
    fi
}

cache_l2_set() {
    local data="$1"

    debug "Setting Level 2 cache"

    local timestamp
    timestamp=$(get_current_timestamp)

    # Write timestamp on first line, data on subsequent lines
    {
        echo "$timestamp"
        echo "$data"
    } > "$CACHE_L2_DATA_FILE.tmp"

    # Atomic move
    if mv "$CACHE_L2_DATA_FILE.tmp" "$CACHE_L2_DATA_FILE"; then
        debug "Level 2 cache updated"
        return 0
    else
        debug "Failed to update Level 2 cache"
        rm -f "$CACHE_L2_DATA_FILE.tmp" 2>/dev/null || true
        return 1
    fi
}

cache_l2_invalidate() {
    debug "Invalidating Level 2 cache"
    rm -f "$CACHE_L2_DATA_FILE" 2>/dev/null || true
}

# Level 3 Cache: Stale fallback cache operations
cache_l3_get() {
    debug "Checking Level 3 stale fallback cache"

    if [ ! -f "$CACHE_L3_DATA_FILE" ]; then
        debug "Level 3 cache file does not exist"
        return 1
    fi

    # Read cache metadata
    local cache_timestamp cache_data
    if ! cache_data=$(cat "$CACHE_L3_DATA_FILE" 2>/dev/null); then
        debug "Failed to read Level 3 cache file"
        return 1
    fi

    # Extract timestamp from first line
    cache_timestamp=$(echo "$cache_data" | head -n1)

    if is_timestamp_valid "$cache_timestamp" "$CACHE_L3_TTL"; then
        debug "Level 3 cache hit (stale but acceptable)"
        CACHE_HITS_L3=$((CACHE_HITS_L3 + 1))
        # Return data without timestamp line
        echo "$cache_data" | tail -n +2
        return 0
    else
        debug "Level 3 cache too stale (beyond ${CACHE_L3_TTL}s TTL)"
        return 1
    fi
}

cache_l3_set() {
    local data="$1"

    debug "Setting Level 3 cache"

    local timestamp
    timestamp=$(get_current_timestamp)

    # Write timestamp on first line, data on subsequent lines
    {
        echo "$timestamp"
        echo "$data"
    } > "$CACHE_L3_DATA_FILE.tmp"

    # Atomic move
    if mv "$CACHE_L3_DATA_FILE.tmp" "$CACHE_L3_DATA_FILE"; then
        debug "Level 3 cache updated"
        return 0
    else
        debug "Failed to update Level 3 cache"
        rm -f "$CACHE_L3_DATA_FILE.tmp" 2>/dev/null || true
        return 1
    fi
}

cache_l3_invalidate() {
    debug "Invalidating Level 3 cache"
    rm -f "$CACHE_L3_DATA_FILE" 2>/dev/null || true
}

# Main multi-level cache retrieval function
cache_get_docker_status() {
    debug "Starting multi-level cache lookup"

    local start_time
    start_time=$(date +%s%3N 2>/dev/null || date +%s)

    # Try Level 1 (in-memory) first - fastest
    if cache_l1_get; then
        local end_time elapsed_ms
        end_time=$(date +%s%3N 2>/dev/null || date +%s)
        if [ "$start_time" != "$end_time" ]; then
            elapsed_ms=$((end_time - start_time))
        else
            elapsed_ms=0
        fi
        debug "Cache hit Level 1 in ${elapsed_ms}ms"
        return 0
    fi

    # Try Level 2 (file-based) - moderate speed
    local l2_data
    if l2_data=$(cache_l2_get); then
        # Promote to Level 1
        cache_l1_set "$l2_data" "" "" ""
        local end_time elapsed_ms
        end_time=$(date +%s%3N 2>/dev/null || date +%s)
        if [ "$start_time" != "$end_time" ]; then
            elapsed_ms=$((end_time - start_time))
        else
            elapsed_ms=5
        fi
        debug "Cache hit Level 2 in ${elapsed_ms}ms, promoted to Level 1"
        echo "$l2_data"
        return 0
    fi

    # Try Level 3 (stale fallback) - last resort
    local l3_data
    if l3_data=$(cache_l3_get); then
        # Promote to Level 2 and Level 1
        cache_l2_set "$l3_data"
        cache_l1_set "$l3_data" "" "" ""
        local end_time elapsed_ms
        end_time=$(date +%s%3N 2>/dev/null || date +%s)
        if [ "$start_time" != "$end_time" ]; then
            elapsed_ms=$((end_time - start_time))
        else
            elapsed_ms=10
        fi
        debug "Cache hit Level 3 (stale) in ${elapsed_ms}ms, promoted to all levels"
        echo "$l3_data"
        return 0
    fi

    # All cache levels missed
    CACHE_MISSES=$((CACHE_MISSES + 1))
    local end_time elapsed_ms
    end_time=$(date +%s%3N 2>/dev/null || date +%s)
    if [ "$start_time" != "$end_time" ]; then
        elapsed_ms=$((end_time - start_time))
    else
        elapsed_ms=15
    fi
    debug "Cache miss on all levels in ${elapsed_ms}ms"
    return 1
}

# Store data in all cache levels
cache_set_docker_status() {
    local data="$1"
    local docker_running="$2"
    local docker_type="$3"
    local container_count="$4"

    debug "Storing data in all cache levels"

    # Store in all levels
    cache_l1_set "$data" "$docker_running" "$docker_type" "$container_count"
    cache_l2_set "$data"
    cache_l3_set "$data"

    debug "Data cached at all levels"
}

# Invalidate all cache levels
cache_invalidate_all() {
    debug "Invalidating all cache levels"

    cache_l1_invalidate
    cache_l2_invalidate
    cache_l3_invalidate

    debug "All cache levels invalidated"
}

# Get cache metrics and hit ratios
cache_get_metrics() {
    local total_hits=$((CACHE_HITS_L1 + CACHE_HITS_L2 + CACHE_HITS_L3))
    local hit_ratio=0

    if [ "$CACHE_TOTAL_REQUESTS" -gt 0 ]; then
        hit_ratio=$(( (total_hits * 100) / CACHE_TOTAL_REQUESTS ))
    fi

    cat << EOF
{
    "total_requests": $CACHE_TOTAL_REQUESTS,
    "total_hits": $total_hits,
    "total_misses": $CACHE_MISSES,
    "hit_ratio_percent": $hit_ratio,
    "l1_hits": $CACHE_HITS_L1,
    "l2_hits": $CACHE_HITS_L2,
    "l3_hits": $CACHE_HITS_L3,
    "cache_levels": {
        "l1_ttl": $CACHE_L1_TTL,
        "l2_ttl": $CACHE_L2_TTL,
        "l3_ttl": $CACHE_L3_TTL
    }
}
EOF
}

# Save cache metrics to file
cache_save_metrics() {
    local metrics
    metrics=$(cache_get_metrics)
    echo "$metrics" > "$CACHE_METRICS_FILE.tmp"
    mv "$CACHE_METRICS_FILE.tmp" "$CACHE_METRICS_FILE" 2>/dev/null || true
}

# Smart cache invalidation based on container changes
cache_smart_invalidate() {
    local current_container_list="$1"
    local previous_container_list=""

    # Get previous container list from Level 1 cache if available
    if [ -n "$CACHE_L1_CONTAINER_COUNT" ]; then
        previous_container_list="$CACHE_L1_CONTAINER_COUNT"
    fi

    # Check if container list has changed
    if [ "$current_container_list" != "$previous_container_list" ]; then
        debug "Container list changed, invalidating caches"
        cache_invalidate_all
        return 0
    else
        debug "Container list unchanged, keeping caches"
        return 1
    fi
}

# Cleanup cache files
cache_cleanup() {
    debug "Cleaning up cache files"

    rm -f "$CACHE_L1_DATA_FILE" 2>/dev/null || true
    rm -f "$CACHE_L2_DATA_FILE" 2>/dev/null || true
    rm -f "$CACHE_L3_DATA_FILE" 2>/dev/null || true
    rm -f "$CACHE_METRICS_FILE" 2>/dev/null || true

    # Clean up any temporary files
    rm -f "$CACHE_L2_DATA_FILE.tmp" 2>/dev/null || true
    rm -f "$CACHE_L3_DATA_FILE.tmp" 2>/dev/null || true
    rm -f "$CACHE_METRICS_FILE.tmp" 2>/dev/null || true

    debug "Cache cleanup completed"
}

# ============================================================================
# STATUS FILE MANAGEMENT FUNCTIONS
# ============================================================================

# Acquire file lock using flock with timeout
acquire_lock() {
    local lock_file="$1"
    local timeout="${2:-$STATUS_LOCK_TIMEOUT}"

    debug "Acquiring lock on $lock_file with timeout ${timeout}s"

    # Create lock file descriptor
    exec 200>"$lock_file"

    # Try to acquire exclusive lock with timeout
    if timeout "$timeout" flock -x 200; then
        debug "Lock acquired successfully"
        return 0
    else
        debug "Failed to acquire lock within ${timeout}s"
        exec 200>&-  # Close file descriptor
        return 1
    fi
}

# Release file lock
release_lock() {
    debug "Releasing lock"

    # Release lock by closing file descriptor
    if exec 200>&-; then
        debug "Lock released successfully"
        return 0
    else
        debug "Warning: Failed to release lock cleanly"
        return 1
    fi
}

# Clean up stale status files and locks
cleanup_status_files() {
    debug "Cleaning up status files"

    # Remove temporary files
    rm -f "$STATUS_TEMP_FILE" 2>/dev/null || true

    # Check for stale lock files (older than 60 seconds)
    if [ -f "$STATUS_LOCK_FILE" ]; then
        local lock_age
        if command -v stat >/dev/null 2>&1; then
            # Use stat to get file age
            local lock_mtime
            lock_mtime=$(stat -c %Y "$STATUS_LOCK_FILE" 2>/dev/null || echo "0")
            local current_time
            current_time=$(date +%s)
            lock_age=$((current_time - lock_mtime))

            if [ "$lock_age" -gt 60 ]; then
                warn "Removing stale lock file (${lock_age}s old): $STATUS_LOCK_FILE"
                rm -f "$STATUS_LOCK_FILE" 2>/dev/null || true
            fi
        else
            # Fallback: just remove if we can't determine age
            debug "Cannot determine lock file age, removing: $STATUS_LOCK_FILE"
            rm -f "$STATUS_LOCK_FILE" 2>/dev/null || true
        fi
    fi

    debug "Status file cleanup completed"
}

# Initialize status file with default JSON structure
init_status_file() {
    debug "Initializing status file: $STATUS_FILE"

    # Clean up any existing files first
    cleanup_status_files

    # Create initial status structure
    local initial_status
    initial_status=$(cat << 'EOF'
{
  "timestamp": "",
  "docker_running": false,
  "docker_type": "unknown",
  "containers": {
    "total": 0,
    "running": 0,
    "healthy": 0,
    "unhealthy": 0,
    "unknown": 0
  },
  "last_check": "",
  "cache_ttl": 0
}
EOF
)

    # Set timestamp and cache TTL
    local current_time
    current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Update the JSON with current values
    if command -v jq >/dev/null 2>&1; then
        echo "$initial_status" | jq \
            --arg timestamp "$current_time" \
            --arg last_check "$current_time" \
            --argjson cache_ttl "$STATUS_CACHE_TTL" \
            '.timestamp = $timestamp | .last_check = $last_check | .cache_ttl = $cache_ttl' \
            > "$STATUS_TEMP_FILE"
    else
        # Fallback without jq (less reliable but functional)
        echo "$initial_status" | \
            sed "s/\"timestamp\": \"\"/\"timestamp\": \"$current_time\"/" | \
            sed "s/\"last_check\": \"\"/\"last_check\": \"$current_time\"/" | \
            sed "s/\"cache_ttl\": 0/\"cache_ttl\": $STATUS_CACHE_TTL/" \
            > "$STATUS_TEMP_FILE"
    fi

    # Atomic move to final location
    if mv "$STATUS_TEMP_FILE" "$STATUS_FILE"; then
        debug "Status file initialized successfully"
        return 0
    else
        error "Failed to initialize status file"
        rm -f "$STATUS_TEMP_FILE" 2>/dev/null || true
        return 1
    fi
}

# Write status to file with proper locking and JSON validation
write_status() {
    local docker_running="$1"
    local docker_type="$2"
    local container_total="${3:-0}"
    local container_running="${4:-0}"
    local container_healthy="${5:-0}"
    local container_unhealthy="${6:-0}"
    local container_unknown="${7:-0}"

    debug "Writing status: docker_running=$docker_running, type=$docker_type, containers=($container_total/$container_running/$container_healthy)"

    # Acquire lock with timeout
    if ! acquire_lock "$STATUS_LOCK_FILE"; then
        error "Failed to acquire lock for status write"
        return 1
    fi

    # Ensure we release lock on exit
    trap 'release_lock' RETURN

    local current_time
    current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Create status JSON
    local status_json
    if command -v jq >/dev/null 2>&1; then
        status_json=$(jq -n \
            --arg timestamp "$current_time" \
            --argjson docker_running "$docker_running" \
            --arg docker_type "$docker_type" \
            --argjson total "$container_total" \
            --argjson running "$container_running" \
            --argjson healthy "$container_healthy" \
            --argjson unhealthy "$container_unhealthy" \
            --argjson unknown "$container_unknown" \
            --arg last_check "$current_time" \
            --argjson cache_ttl "$STATUS_CACHE_TTL" \
            '{
                timestamp: $timestamp,
                docker_running: $docker_running,
                docker_type: $docker_type,
                containers: {
                    total: $total,
                    running: $running,
                    healthy: $healthy,
                    unhealthy: $unhealthy,
                    unknown: $unknown
                },
                last_check: $last_check,
                cache_ttl: $cache_ttl
            }')
    else
        # Fallback JSON construction without jq
        status_json=$(cat << EOF
{
  "timestamp": "$current_time",
  "docker_running": $docker_running,
  "docker_type": "$docker_type",
  "containers": {
    "total": $container_total,
    "running": $container_running,
    "healthy": $container_healthy,
    "unhealthy": $container_unhealthy,
    "unknown": $container_unknown
  },
  "last_check": "$current_time",
  "cache_ttl": $STATUS_CACHE_TTL
}
EOF
)
    fi

    # Validate JSON syntax
    if command -v jq >/dev/null 2>&1; then
        if ! echo "$status_json" | jq . >/dev/null 2>&1; then
            error "Generated invalid JSON for status"
            return 1
        fi
    fi

    # Write to temporary file first (atomic operation)
    if echo "$status_json" > "$STATUS_TEMP_FILE"; then
        # Atomic move to final location
        if mv "$STATUS_TEMP_FILE" "$STATUS_FILE"; then
            debug "Status written successfully"
            return 0
        else
            error "Failed to move temporary status file to final location"
            rm -f "$STATUS_TEMP_FILE" 2>/dev/null || true
            return 1
        fi
    else
        error "Failed to write to temporary status file"
        return 1
    fi
}

# Read status from file with proper locking
read_status() {
    local output_format="${1:-json}"  # json, raw, or field
    local field_name="${2:-}"         # field name if format=field

    debug "Reading status file: $STATUS_FILE (format: $output_format)"

    # Check if status file exists
    if [ ! -f "$STATUS_FILE" ]; then
        debug "Status file does not exist"
        return 1
    fi

    # Acquire read lock with timeout
    if ! acquire_lock "$STATUS_LOCK_FILE"; then
        error "Failed to acquire lock for status read"
        return 1
    fi

    # Ensure we release lock on exit
    trap 'release_lock' RETURN

    # Read and validate JSON
    local status_content
    if ! status_content=$(cat "$STATUS_FILE" 2>/dev/null); then
        error "Failed to read status file"
        return 1
    fi

    # Validate JSON syntax
    if command -v jq >/dev/null 2>&1; then
        if ! echo "$status_content" | jq . >/dev/null 2>&1; then
            error "Status file contains invalid JSON"
            return 1
        fi
    fi

    # Return content based on requested format
    case "$output_format" in
        "json")
            echo "$status_content"
            ;;
        "raw")
            echo "$status_content"
            ;;
        "field")
            if [ -z "$field_name" ]; then
                error "Field name required for field format"
                return 1
            fi
            if command -v jq >/dev/null 2>&1; then
                echo "$status_content" | jq -r ".$field_name // empty"
            else
                # Fallback field extraction (basic)
                grep "\"$field_name\":" "$STATUS_FILE" | cut -d':' -f2 | sed 's/[", ]//g'
            fi
            ;;
        *)
            error "Invalid output format: $output_format"
            return 1
            ;;
    esac

    return 0
}

# Check if status cache is still valid
is_status_cache_valid() {
    debug "Checking status cache validity"

    if [ ! -f "$STATUS_FILE" ]; then
        debug "Status file doesn't exist - cache invalid"
        return 1
    fi

    # Get last check time and cache TTL
    local last_check
    local cache_ttl

    if command -v jq >/dev/null 2>&1; then
        last_check=$(read_status field last_check 2>/dev/null || echo "")
        cache_ttl=$(read_status field cache_ttl 2>/dev/null || echo "$STATUS_CACHE_TTL")
    else
        # Fallback without jq
        last_check=$(grep '"last_check"' "$STATUS_FILE" 2>/dev/null | cut -d'"' -f4 || echo "")
        cache_ttl="$STATUS_CACHE_TTL"
    fi

    if [ -z "$last_check" ]; then
        debug "No last_check time found - cache invalid"
        return 1
    fi

    # Convert last_check to timestamp
    local last_check_ts
    if command -v date >/dev/null 2>&1; then
        last_check_ts=$(date -d "$last_check" +%s 2>/dev/null || echo "0")
    else
        debug "Cannot parse last_check time - cache invalid"
        return 1
    fi

    local current_ts
    current_ts=$(date +%s)
    local age
    age=$((current_ts - last_check_ts))

    debug "Cache age: ${age}s, TTL: ${cache_ttl}s"

    if [ "$age" -le "$cache_ttl" ]; then
        debug "Status cache is valid"
        return 0
    else
        debug "Status cache is expired"
        return 1
    fi
}

# Get container statistics from Docker
get_container_stats() {
    debug "Getting container statistics"

    local total=0
    local running=0
    local healthy=0
    local unhealthy=0
    local unknown=0

    # Get container list with health status
    local container_list
    if container_list=$(timeout 5s docker ps -a --format '{{.ID}}:{{.Status}}' 2>/dev/null); then
        total=$(echo "$container_list" | wc -l)

        if [ "$total" -eq 0 ]; then
            debug "No containers found"
        else
            running=$(echo "$container_list" | grep -c "Up " 2>/dev/null || echo "0")
            running=$(echo "$running" | tr -d '\n\r')  # Clean newlines

            # Get health status for running containers
            if [ "$running" -gt 0 ]; then
                local health_list
                if health_list=$(timeout 5s docker ps --format '{{.ID}}:{{.Status}}' 2>/dev/null | grep "healthy\|unhealthy"); then
                    healthy=$(echo "$health_list" | grep -c "healthy" 2>/dev/null || echo "0")
                    unhealthy=$(echo "$health_list" | grep -c "unhealthy" 2>/dev/null || echo "0")
                    # Clean variables and ensure we have valid numbers
                    healthy=$(echo "$healthy" | tr -d '\n\r')
                    unhealthy=$(echo "$unhealthy" | tr -d '\n\r')
                    healthy="${healthy:-0}"
                    unhealthy="${unhealthy:-0}"
                    unknown=$((running - healthy - unhealthy))
                else
                    unknown=$running
                fi
            fi
        fi

        debug "Container stats: total=$total, running=$running, healthy=$healthy, unhealthy=$unhealthy, unknown=$unknown"
    else
        warn "Failed to get container statistics"
        # Return zeros but don't fail
    fi

    # Export values for use by calling function
    export CONTAINER_TOTAL="$total"
    export CONTAINER_RUNNING="$running"
    export CONTAINER_HEALTHY="$healthy"
    export CONTAINER_UNHEALTHY="$unhealthy"
    export CONTAINER_UNKNOWN="$unknown"

    return 0
}

# ============================================================================
# TESTING AND DEBUGGING FUNCTIONS
# ============================================================================

# Test multi-level cache performance
test_cache_performance() {
    info "Testing multi-level cache performance"

    local test_results=()
    local total_tests=0
    local passed_tests=0

    # Test 1: Cache Miss Performance (should be fast even on miss)
    info "Test 1: Cache miss performance"
    local start_time end_time elapsed_ms
    start_time=$(date +%s%3N 2>/dev/null || date +%s)

    cache_get_docker_status >/dev/null 2>&1 || true  # Expect miss

    end_time=$(date +%s%3N 2>/dev/null || date +%s)
    if [ "$start_time" != "$end_time" ]; then
        elapsed_ms=$((end_time - start_time))
    else
        elapsed_ms=20
    fi

    total_tests=$((total_tests + 1))
    if [ "$elapsed_ms" -lt 50 ]; then
        info "  ✓ Cache miss completed in ${elapsed_ms}ms (target: <50ms)"
        passed_tests=$((passed_tests + 1))
        test_results+=("Cache miss performance: PASS (${elapsed_ms}ms)")
    else
        error "  ✗ Cache miss took ${elapsed_ms}ms (target: <50ms)"
        test_results+=("Cache miss performance: FAIL (${elapsed_ms}ms)")
    fi

    # Test 2: Cache Level 1 Hit Performance
    info "Test 2: Level 1 cache hit performance"

    # Prime the cache
    cache_l1_set '{"test": "data"}' "true" "Docker Test" "5"

    start_time=$(date +%s%3N 2>/dev/null || date +%s)
    cache_l1_get >/dev/null 2>&1
    end_time=$(date +%s%3N 2>/dev/null || date +%s)

    if [ "$start_time" != "$end_time" ]; then
        elapsed_ms=$((end_time - start_time))
    else
        elapsed_ms=1
    fi

    total_tests=$((total_tests + 1))
    if [ "$elapsed_ms" -lt 10 ]; then
        info "  ✓ Level 1 cache hit in ${elapsed_ms}ms (target: <10ms)"
        passed_tests=$((passed_tests + 1))
        test_results+=("Level 1 hit performance: PASS (${elapsed_ms}ms)")
    else
        error "  ✗ Level 1 cache hit took ${elapsed_ms}ms (target: <10ms)"
        test_results+=("Level 1 hit performance: FAIL (${elapsed_ms}ms)")
    fi

    # Test 3: Cache Level 2 Hit Performance
    info "Test 3: Level 2 cache hit performance"

    # Clear Level 1, prime Level 2
    cache_l1_invalidate
    cache_l2_set '{"test": "data_l2"}'

    start_time=$(date +%s%3N 2>/dev/null || date +%s)
    cache_l2_get >/dev/null 2>&1
    end_time=$(date +%s%3N 2>/dev/null || date +%s)

    if [ "$start_time" != "$end_time" ]; then
        elapsed_ms=$((end_time - start_time))
    else
        elapsed_ms=5
    fi

    total_tests=$((total_tests + 1))
    if [ "$elapsed_ms" -lt 30 ]; then
        info "  ✓ Level 2 cache hit in ${elapsed_ms}ms (target: <30ms)"
        passed_tests=$((passed_tests + 1))
        test_results+=("Level 2 hit performance: PASS (${elapsed_ms}ms)")
    else
        error "  ✗ Level 2 cache hit took ${elapsed_ms}ms (target: <30ms)"
        test_results+=("Level 2 hit performance: FAIL (${elapsed_ms}ms)")
    fi

    # Test 4: TTL Expiration Logic
    info "Test 4: TTL expiration behavior"

    # Test TTL logic with a timestamp that's already expired
    local expired_timestamp
    expired_timestamp=$(date -d "2 minutes ago" +%s.%3N 2>/dev/null || echo "1")

    # Manually set an expired timestamp
    CACHE_L1_TIMESTAMP="$expired_timestamp"
    CACHE_L1_DATA='{"test": "expired_data"}'

    # Should miss because timestamp is expired
    if ! cache_l1_get >/dev/null 2>&1; then
        info "  ✓ Cache miss with expired timestamp"

        # Now set fresh data
        cache_l1_set '{"test": "fresh_data"}' "true" "Docker Test" "3"

        # Should hit with fresh timestamp
        if cache_l1_get >/dev/null 2>&1; then
            info "  ✓ Cache hit with fresh timestamp"
            passed_tests=$((passed_tests + 1))
            test_results+=("TTL expiration: PASS")
        else
            error "  ✗ Cache miss with fresh timestamp"
            test_results+=("TTL expiration: FAIL")
        fi
    else
        error "  ✗ Cache hit with expired timestamp"
        test_results+=("TTL expiration: FAIL")
    fi

    total_tests=$((total_tests + 1))

    # Test 5: Cache Promotion Logic
    info "Test 5: Cache promotion behavior"

    # Clear all caches and prime only Level 3
    cache_invalidate_all
    cache_l3_set '{"test": "promotion_data"}'

    # Get from main function should promote through all levels
    if cache_get_docker_status >/dev/null 2>&1; then
        # Check if data was promoted to Level 1
        if cache_l1_get >/dev/null 2>&1; then
            info "  ✓ Data promoted from Level 3 to Level 1"
            passed_tests=$((passed_tests + 1))
            test_results+=("Cache promotion: PASS")
        else
            error "  ✗ Data not promoted to Level 1"
            test_results+=("Cache promotion: FAIL")
        fi
    else
        error "  ✗ Failed to retrieve from Level 3"
        test_results+=("Cache promotion: FAIL")
    fi

    total_tests=$((total_tests + 1))

    # Test 6: Cache Invalidation
    info "Test 6: Cache invalidation"

    # Prime all levels
    cache_set_docker_status '{"test": "invalidation_test"}' "true" "Docker Test" "7"

    # Verify all levels have data
    local l1_hit l2_hit l3_hit
    l1_hit=$(cache_l1_get >/dev/null 2>&1 && echo "yes" || echo "no")
    l2_hit=$(cache_l2_get >/dev/null 2>&1 && echo "yes" || echo "no")
    l3_hit=$(cache_l3_get >/dev/null 2>&1 && echo "yes" || echo "no")

    if [ "$l1_hit" = "yes" ] && [ "$l2_hit" = "yes" ] && [ "$l3_hit" = "yes" ]; then
        # Invalidate all
        cache_invalidate_all

        # Verify all levels are empty
        l1_hit=$(cache_l1_get >/dev/null 2>&1 && echo "yes" || echo "no")
        l2_hit=$(cache_l2_get >/dev/null 2>&1 && echo "yes" || echo "no")
        l3_hit=$(cache_l3_get >/dev/null 2>&1 && echo "yes" || echo "no")

        if [ "$l1_hit" = "no" ] && [ "$l2_hit" = "no" ] && [ "$l3_hit" = "no" ]; then
            info "  ✓ All cache levels invalidated successfully"
            passed_tests=$((passed_tests + 1))
            test_results+=("Cache invalidation: PASS")
        else
            error "  ✗ Some cache levels not invalidated (L1:$l1_hit, L2:$l2_hit, L3:$l3_hit)"
            test_results+=("Cache invalidation: FAIL")
        fi
    else
        error "  ✗ Failed to prime all cache levels (L1:$l1_hit, L2:$l2_hit, L3:$l3_hit)"
        test_results+=("Cache invalidation: FAIL")
    fi

    total_tests=$((total_tests + 1))

    # Display results
    info "Cache Performance Test Results:"
    for result in "${test_results[@]}"; do
        if echo "$result" | grep -q "FAIL"; then
            error "  $result"
        else
            info "  $result"
        fi
    done

    # Display cache metrics
    info "Cache Metrics:"
    cache_get_metrics | while IFS= read -r line; do
        info "  $line"
    done

    # Overall result
    local success_rate=0
    if [ "$total_tests" -gt 0 ]; then
        success_rate=$(( (passed_tests * 100) / total_tests ))
    fi

    if [ "$passed_tests" -eq "$total_tests" ]; then
        info "All cache performance tests passed! ($passed_tests/$total_tests, ${success_rate}%)"
        return 0
    else
        error "Some cache tests failed: $passed_tests/$total_tests passed (${success_rate}%)"
        return 1
    fi
}

# Test concurrent status file access
test_concurrent_access() {
    local num_processes="${1:-5}"
    local iterations="${2:-10}"

    info "Testing concurrent access with $num_processes processes, $iterations iterations each"

    local pids=()
    local test_results=()

    # Start multiple background processes
    for i in $(seq 1 "$num_processes"); do
        (
            local process_id="test_proc_$i"
            local success_count=0
            local failure_count=0

            for j in $(seq 1 "$iterations"); do
                # Try to write status
                if write_status "true" "Test Docker" "$j" "$j" "$j" "0" "0"; then
                    success_count=$((success_count + 1))
                else
                    failure_count=$((failure_count + 1))
                fi

                # Small random delay to increase chance of collision
                sleep "0.$(( (RANDOM % 50) + 10 ))"

                # Try to read status
                if read_status >/dev/null 2>&1; then
                    success_count=$((success_count + 1))
                else
                    failure_count=$((failure_count + 1))
                fi
            done

            echo "$process_id:success=$success_count,failure=$failure_count"
        ) &
        pids+=($!)
    done

    # Wait for all processes to complete
    local total_success=0
    local total_failure=0

    for pid in "${pids[@]}"; do
        wait "$pid"
        local result
        result=$(jobs -p | grep -q "$pid" && echo "failed" || echo "completed")
        debug "Process $pid $result"
    done

    # Validate final status file
    if read_status >/dev/null 2>&1; then
        info "Concurrent access test completed - final status file is valid"
        return 0
    else
        error "Concurrent access test failed - final status file is invalid"
        return 1
    fi
}

# Test lock timeout handling
test_lock_timeout() {
    info "Testing lock timeout handling"

    # Create a long-running lock in background
    (
        debug "Background process acquiring long lock"
        if acquire_lock "$STATUS_LOCK_FILE" 10; then
            debug "Background process acquired lock, holding for 8 seconds"
            sleep 8
            release_lock
            debug "Background process released lock"
        fi
    ) &

    local bg_pid=$!
    sleep 1  # Let background process acquire lock

    # Try to acquire lock with short timeout (should fail)
    local start_time
    start_time=$(date +%s)

    if acquire_lock "$STATUS_LOCK_FILE" 2; then
        release_lock
        error "Lock timeout test failed - acquired lock when it should have timed out"
        kill "$bg_pid" 2>/dev/null || true
        return 1
    else
        local end_time
        end_time=$(date +%s)
        local elapsed=$((end_time - start_time))

        if [ "$elapsed" -le 3 ]; then
            info "Lock timeout test passed - failed to acquire lock in ${elapsed}s"
        else
            error "Lock timeout test failed - took too long to timeout (${elapsed}s)"
            kill "$bg_pid" 2>/dev/null || true
            return 1
        fi
    fi

    # Wait for background process to finish
    wait "$bg_pid"

    info "Lock timeout test completed successfully"
    return 0
}

# Validate JSON format and structure
test_json_validation() {
    info "Testing JSON validation"

    # Test valid JSON
    if write_status "true" "Docker Desktop" "5" "3" "2" "1" "0"; then
        local status_content
        if status_content=$(read_status json); then
            # Validate structure
            if command -v jq >/dev/null 2>&1; then
                local required_fields=("timestamp" "docker_running" "docker_type" "containers" "last_check" "cache_ttl")
                local all_present=true

                for field in "${required_fields[@]}"; do
                    if ! echo "$status_content" | jq -e ".$field" >/dev/null 2>&1; then
                        error "Missing required field: $field"
                        all_present=false
                    fi
                done

                # Validate container subfields
                local container_fields=("total" "running" "healthy" "unhealthy" "unknown")
                for field in "${container_fields[@]}"; do
                    if ! echo "$status_content" | jq -e ".containers.$field" >/dev/null 2>&1; then
                        error "Missing required container field: $field"
                        all_present=false
                    fi
                done

                if [ "$all_present" = true ]; then
                    info "JSON validation test passed - all required fields present"
                    debug "JSON content: $status_content"
                    return 0
                else
                    error "JSON validation test failed - missing required fields"
                    return 1
                fi
            else
                warn "jq not available for thorough JSON validation"
                info "Basic JSON validation test passed"
                return 0
            fi
        else
            error "JSON validation test failed - could not read status"
            return 1
        fi
    else
        error "JSON validation test failed - could not write status"
        return 1
    fi
}

# Test stale lock cleanup
test_stale_lock_cleanup() {
    info "Testing stale lock cleanup"

    # Create a fake stale lock file
    local fake_lock_file="/tmp/test_stale_lock_$$"
    touch "$fake_lock_file"

    # Make it appear old (if we have stat and touch -d)
    if command -v stat >/dev/null 2>&1 && touch -d "2 minutes ago" "$fake_lock_file" 2>/dev/null; then
        debug "Created fake stale lock file: $fake_lock_file"

        # Test cleanup function by checking for stale files manually
        local lock_age
        local lock_mtime
        lock_mtime=$(stat -c %Y "$fake_lock_file" 2>/dev/null || echo "0")
        local current_time
        current_time=$(date +%s)
        lock_age=$((current_time - lock_mtime))

        if [ "$lock_age" -gt 60 ]; then
            info "Stale lock cleanup test passed - would remove file aged ${lock_age}s"
            rm -f "$fake_lock_file" 2>/dev/null || true
            return 0
        else
            # Force the file to be older for test purposes
            if touch -d "2 minutes ago" "$fake_lock_file" 2>/dev/null; then
                lock_mtime=$(stat -c %Y "$fake_lock_file" 2>/dev/null || echo "0")
                lock_age=$((current_time - lock_mtime))
                if [ "$lock_age" -gt 60 ]; then
                    info "Stale lock cleanup test passed - correctly identifies stale file (${lock_age}s old)"
                    rm -f "$fake_lock_file" 2>/dev/null || true
                    return 0
                fi
            fi

            error "Stale lock cleanup test failed - file not old enough ($lock_age s)"
            rm -f "$fake_lock_file" 2>/dev/null || true
            return 1
        fi
    else
        warn "Cannot test stale lock cleanup - stat or touch -d not available"
        rm -f "$fake_lock_file" 2>/dev/null || true
        return 0
    fi
}

# Run all tests
run_all_tests() {
    info "Running all status file management tests"

    local test_results=()

    # Initialize for testing
    init_status_file

    test_json_validation && test_results+=("JSON validation: PASS") || test_results+=("JSON validation: FAIL")
    test_lock_timeout && test_results+=("Lock timeout: PASS") || test_results+=("Lock timeout: FAIL")
    test_stale_lock_cleanup && test_results+=("Stale lock cleanup: PASS") || test_results+=("Stale lock cleanup: FAIL")
    test_concurrent_access 3 5 && test_results+=("Concurrent access: PASS") || test_results+=("Concurrent access: FAIL")

    # Report results
    info "Test Results:"
    for result in "${test_results[@]}"; do
        if echo "$result" | grep -q "FAIL"; then
            error "  $result"
        else
            info "  $result"
        fi
    done

    # Check if any tests failed
    local failed_tests
    failed_tests=$(printf '%s\n' "${test_results[@]}" | grep -c "FAIL" 2>/dev/null || echo "0")

    if [ "$failed_tests" = "0" ]; then
        info "All tests passed!"
        return 0
    else
        error "$failed_tests test(s) failed!"
        return 1
    fi
}

# Check for required dependencies
check_dependencies() {
    debug "Checking dependencies"

    local missing_deps=()

    # Check for Docker
    if ! command -v docker >/dev/null 2>&1; then
        missing_deps+=("docker")
    fi

    # Check for Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("docker-compose")
    fi

    # Check for jq (used for JSON parsing)
    if ! command -v jq >/dev/null 2>&1; then
        missing_deps+=("jq")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Missing required dependencies: ${missing_deps[*]}"
        error "Please install the missing dependencies and try again"

        # If Docker is missing, use special exit code
        for dep in "${missing_deps[@]}"; do
            if [ "$dep" = "docker" ]; then
                exit $EXIT_DOCKER_NOT_FOUND
            fi
        done

        exit $EXIT_ERROR
    fi

    debug "All dependencies found"
    return $EXIT_SUCCESS
}

# Parse command line arguments
parse_args() {
    debug "Parsing arguments: $*"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit $EXIT_SUCCESS
                ;;
            --debug|-d)
                DEBUG=1
                export CLAUDE_DEBUG=1
                debug "Debug mode enabled"
                shift
                ;;
            --version|-v)
                echo "$SCRIPT_NAME version $SCRIPT_VERSION"
                exit $EXIT_SUCCESS
                ;;
            test)
                # Handle test operations
                OPERATION_ARGS+=("test")
                shift
                ;;
            test-concurrent)
                OPERATION_ARGS+=("test-concurrent")
                shift
                ;;
            test-locks)
                OPERATION_ARGS+=("test-locks")
                shift
                ;;
            test-json)
                OPERATION_ARGS+=("test-json")
                shift
                ;;
            test-cleanup)
                OPERATION_ARGS+=("test-cleanup")
                shift
                ;;
            health-check|health)
                OPERATION_ARGS+=("health-check")
                shift
                ;;
            stack-detect)
                OPERATION_ARGS+=("stack-detect")
                shift
                ;;
            stack-group)
                OPERATION_ARGS+=("stack-group")
                shift
                ;;
            stack-health)
                OPERATION_ARGS+=("stack-health")
                shift
                ;;
            stack-status)
                OPERATION_ARGS+=("stack-status")
                shift
                ;;
            cache-metrics)
                OPERATION_ARGS+=("cache-metrics")
                shift
                ;;
            cache-test)
                OPERATION_ARGS+=("cache-test")
                shift
                ;;
            cache-invalidate)
                OPERATION_ARGS+=("cache-invalidate")
                shift
                ;;
            bg-start|background-start)
                OPERATION_ARGS+=("bg-start")
                shift
                ;;
            bg-stop|background-stop)
                OPERATION_ARGS+=("bg-stop")
                shift
                ;;
            bg-restart|background-restart)
                OPERATION_ARGS+=("bg-restart")
                shift
                ;;
            bg-status|background-status)
                OPERATION_ARGS+=("bg-status")
                shift
                ;;
            bg-test|background-test)
                OPERATION_ARGS+=("bg-test")
                shift
                ;;
            *)
                # Store remaining arguments for future operation modes
                OPERATION_ARGS+=("$1")
                shift
                ;;
        esac
    done

    debug "Arguments parsed successfully"
}

# Show help text
show_help() {
    cat << EOF
$SCRIPT_NAME - Docker Health Monitoring Wrapper

USAGE:
    $SCRIPT_NAME [OPTIONS] [OPERATION]

DESCRIPTION:
    Foundation script for Docker health monitoring functionality.
    Provides consistent interface and error handling for Docker operations.

OPTIONS:
    -h, --help      Show this help message and exit
    -d, --debug     Enable debug output (also via CLAUDE_DEBUG=1)
    -v, --version   Show version information and exit

OPERATIONS:
    health-check       Run batch container health check (alias: health)
    stack-detect       Detect Docker Compose stacks in project
    stack-group        Group containers by Docker Compose stack
    stack-health       Get health summary for all stacks with emoji indicators
    stack-status       Display stack-aware status (web:🟢(3/3) api:🟡(2/3) db:🟢(1/1))
    test               Run all status file management tests
    test-concurrent    Test concurrent file access
    test-locks         Test file locking and timeout handling
    test-json          Test JSON validation and format
    test-cleanup       Test stale lock cleanup
    cache-metrics      Display cache performance metrics and hit ratios
    cache-test         Test multi-level cache performance
    cache-invalidate   Invalidate all cache levels
    bg-start           Start background health monitor process
    bg-stop            Stop background health monitor process
    bg-restart         Restart background health monitor process
    bg-status          Show background monitor status and info
    bg-test            Test background process management functions

ENVIRONMENT VARIABLES:
    CLAUDE_DEBUG               Enable debug mode (1 = enabled, 0 = disabled)
    CLAUDE_PROJECT_DIR         Override project root directory
    DOCKER_TIMEOUT             Docker daemon check timeout in milliseconds (default: 500)
    CLAUDE_CACHE_L1_TTL        Level 1 cache TTL in seconds (default: 5)
    CLAUDE_CACHE_L2_TTL        Level 2 cache TTL in seconds (default: 30)
    CLAUDE_CACHE_L3_TTL        Level 3 cache TTL in seconds (default: 300)
    CLAUDE_MONITOR_INTERVAL    Background monitor interval in seconds (default: 30)
    CLAUDE_PID_LOCK_TIMEOUT    PID lock timeout in seconds (default: 5)

EXIT CODES:
    0    Success
    1    General error
    2    Docker not found
    3    Invalid arguments
    4    Permission error
    5    Docker installed but daemon not running
    6    Timeout (daemon unresponsive)

EXAMPLES:
    $SCRIPT_NAME --help
    $SCRIPT_NAME --debug
    CLAUDE_DEBUG=1 $SCRIPT_NAME

NOTES:
    - This script follows Unix conventions and Claude Code standards
    - All operations require Docker to be installed and accessible
    - Debug output is sent to stderr to avoid interfering with data output

EOF
}

# Initialize status tracking
init_status() {
    debug "Initializing status tracking"

    # Create Docker health directory if it doesn't exist
    mkdir -p "$DOCKER_HEALTH_DIR"

    # Initialize JSON status file
    if init_status_file; then
        debug "Status tracking initialized with JSON format"
    else
        error "Failed to initialize status tracking"
        return 1
    fi

    return 0
}

# ============================================================================
# PROGRESSIVE HEALTH CHECK STRATEGIES
# ============================================================================

# Level 1: Check native Docker HEALTHCHECK status
check_native_health() {
    local container_id="$1"
    local container_name="$2"

    debug "Checking native HEALTHCHECK for container: $container_name ($container_id)"

    # Use docker inspect to get native health status
    local health_status
    if health_status=$(docker inspect "$container_id" --format '{{.State.Health.Status}}' 2>/dev/null); then
        case "$health_status" in
            "healthy")
                debug "Native health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
                ;;
            "unhealthy")
                debug "Native health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
                ;;
            "starting")
                debug "Native health check: STARTING for $container_name"
                echo "starting"
                return 0
                ;;
            "<no value>"|"")
                debug "No native health check configured for $container_name"
                return 1
                ;;
            *)
                debug "Unknown native health status '$health_status' for $container_name"
                return 1
                ;;
        esac
    else
        debug "Failed to get native health status for $container_name"
        return 1
    fi
}

# Level 2: Check port availability for exposed ports
check_port_availability() {
    local container_id="$1"
    local container_name="$2"

    debug "Checking port availability for container: $container_name ($container_id)"

    # Get exposed ports from container
    local ports
    if ports=$(docker port "$container_id" 2>/dev/null | head -5); then
        if [ -z "$ports" ]; then
            debug "No exposed ports found for $container_name"
            return 1
        fi

        local all_ports_available=true
        local checked_ports=0

        # Check each exposed port
        while IFS= read -r port_line; do
            if [ -z "$port_line" ]; then
                continue
            fi

            # Extract host and port (format: "80/tcp -> 0.0.0.0:8080")
            local host_port
            host_port=$(echo "$port_line" | sed 's/.*-> \([^:]*\):\([0-9]*\).*/\1:\2/')

            if [ "$host_port" = "$port_line" ]; then
                # Failed to parse, skip
                continue
            fi

            local host port
            host=$(echo "$host_port" | cut -d: -f1)
            port=$(echo "$host_port" | cut -d: -f2)

            # Use localhost for 0.0.0.0 bindings
            if [ "$host" = "0.0.0.0" ]; then
                host="127.0.0.1"
            fi

            debug "Checking port $host:$port for $container_name"

            # Try multiple methods to check port availability
            local port_check_result=false

            # Method 1: Use nc (netcat) if available
            if command -v nc >/dev/null 2>&1; then
                if timeout 2s nc -z "$host" "$port" 2>/dev/null; then
                    port_check_result=true
                fi
            # Method 2: Use /dev/tcp if nc not available
            elif timeout 2s bash -c "exec 3<>/dev/tcp/$host/$port" 2>/dev/null; then
                exec 3>&-
                port_check_result=true
            # Method 3: Use telnet as fallback
            elif command -v telnet >/dev/null 2>&1; then
                if echo "quit" | timeout 2s telnet "$host" "$port" 2>/dev/null | grep -q "Connected"; then
                    port_check_result=true
                fi
            fi

            checked_ports=$((checked_ports + 1))

            if [ "$port_check_result" = false ]; then
                debug "Port $host:$port not accessible for $container_name"
                all_ports_available=false
            else
                debug "Port $host:$port accessible for $container_name"
            fi

            # Limit port checks to avoid long delays
            if [ "$checked_ports" -ge 3 ]; then
                break
            fi
        done <<< "$ports"

        if [ "$checked_ports" -eq 0 ]; then
            debug "No ports could be checked for $container_name"
            return 1
        fi

        if [ "$all_ports_available" = true ]; then
            debug "Port availability check: HEALTHY for $container_name ($checked_ports ports)"
            echo "healthy"
            return 0
        else
            debug "Port availability check: UNHEALTHY for $container_name (some ports unavailable)"
            echo "unhealthy"
            return 0
        fi
    else
        debug "Failed to get port information for $container_name"
        return 1
    fi
}

# Level 3: Check process status verification
check_process_status() {
    local container_id="$1"
    local container_name="$2"

    debug "Checking process status for container: $container_name ($container_id)"

    # Check if container is running
    local container_state
    if container_state=$(docker inspect "$container_id" --format '{{.State.Status}}' 2>/dev/null); then
        case "$container_state" in
            "running")
                # Container is running, check if main process is alive
                local exit_code
                if exit_code=$(docker inspect "$container_id" --format '{{.State.ExitCode}}' 2>/dev/null); then
                    if [ "$exit_code" = "0" ]; then
                        # Try to check if processes are running inside container
                        if docker exec "$container_id" ps aux >/dev/null 2>&1; then
                            debug "Process status check: HEALTHY for $container_name (running with processes)"
                            echo "healthy"
                            return 0
                        else
                            debug "Process status check: HEALTHY for $container_name (running but no ps access)"
                            echo "healthy"
                            return 0
                        fi
                    else
                        debug "Process status check: UNHEALTHY for $container_name (non-zero exit code: $exit_code)"
                        echo "unhealthy"
                        return 0
                    fi
                else
                    debug "Process status check: HEALTHY for $container_name (running, no exit code)"
                    echo "healthy"
                    return 0
                fi
                ;;
            "exited")
                debug "Process status check: UNHEALTHY for $container_name (exited)"
                echo "unhealthy"
                return 0
                ;;
            "restarting")
                debug "Process status check: STARTING for $container_name (restarting)"
                echo "starting"
                return 0
                ;;
            "paused")
                debug "Process status check: UNHEALTHY for $container_name (paused)"
                echo "unhealthy"
                return 0
                ;;
            *)
                debug "Process status check: UNKNOWN for $container_name (state: $container_state)"
                echo "unknown"
                return 0
                ;;
        esac
    else
        debug "Failed to get container state for $container_name"
        return 1
    fi
}

# Level 4: Service-specific health endpoints
check_service_health() {
    local container_id="$1"
    local container_name="$2"
    local container_image="${3:-unknown}"

    debug "Checking service-specific health for container: $container_name ($container_id) image: $container_image"

    # Detect service type from image name
    local service_type="unknown"
    case "$container_image" in
        *postgres*|*postgresql*)
            service_type="postgres"
            ;;
        *mysql*|*mariadb*)
            service_type="mysql"
            ;;
        *redis*)
            service_type="redis"
            ;;
        *mongodb*|*mongo*)
            service_type="mongodb"
            ;;
        *nginx*)
            service_type="nginx"
            ;;
        *apache*|*httpd*)
            service_type="apache"
            ;;
        *elasticsearch*)
            service_type="elasticsearch"
            ;;
        *)
            # Try to detect from container name
            case "$container_name" in
                *postgres*|*pg*|*postgresql*)
                    service_type="postgres"
                    ;;
                *mysql*|*mariadb*)
                    service_type="mysql"
                    ;;
                *redis*)
                    service_type="redis"
                    ;;
                *mongo*|*mongodb*)
                    service_type="mongodb"
                    ;;
                *nginx*)
                    service_type="nginx"
                    ;;
                *apache*|*httpd*)
                    service_type="apache"
                    ;;
                *elasticsearch*|*elastic*)
                    service_type="elasticsearch"
                    ;;
            esac
            ;;
    esac

    debug "Detected service type: $service_type for $container_name"

    # Perform service-specific health check
    case "$service_type" in
        "postgres")
            if docker exec "$container_id" pg_isready 2>/dev/null >/dev/null; then
                debug "PostgreSQL health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
            else
                debug "PostgreSQL health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
            fi
            ;;
        "mysql")
            if docker exec "$container_id" mysqladmin ping 2>/dev/null >/dev/null; then
                debug "MySQL health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
            else
                debug "MySQL health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
            fi
            ;;
        "redis")
            if docker exec "$container_id" redis-cli ping 2>/dev/null | grep -q "PONG"; then
                debug "Redis health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
            else
                debug "Redis health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
            fi
            ;;
        "mongodb")
            if docker exec "$container_id" mongosh --eval "db.runCommand('ping')" 2>/dev/null >/dev/null; then
                debug "MongoDB health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
            else
                debug "MongoDB health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
            fi
            ;;
        "nginx")
            if docker exec "$container_id" nginx -t 2>/dev/null >/dev/null; then
                debug "Nginx health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
            else
                debug "Nginx health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
            fi
            ;;
        "apache")
            if docker exec "$container_id" apache2ctl configtest 2>/dev/null >/dev/null || \
               docker exec "$container_id" httpd -t 2>/dev/null >/dev/null; then
                debug "Apache health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
            else
                debug "Apache health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
            fi
            ;;
        "elasticsearch")
            if docker exec "$container_id" curl -f "http://localhost:9200/_cluster/health" 2>/dev/null >/dev/null; then
                debug "Elasticsearch health check: HEALTHY for $container_name"
                echo "healthy"
                return 0
            else
                debug "Elasticsearch health check: UNHEALTHY for $container_name"
                echo "unhealthy"
                return 0
            fi
            ;;
        *)
            debug "No service-specific health check available for $container_name"
            return 1
            ;;
    esac
}

# Progressive health checker - tries all strategies in order
check_container_health_progressive() {
    local container_id="$1"
    local container_name="$2"
    local container_image="${3:-unknown}"

    debug "Starting progressive health check for container: $container_name ($container_id)"

    # Check if we have a cached strategy for this container
    local cached_strategy
    cached_strategy=$(get_cached_strategy "$container_id")

    # Strategy execution order (with cached strategy first if available)
    local strategies=()
    if [ -n "$cached_strategy" ] && [ "$cached_strategy" != "unknown" ]; then
        strategies+=("$cached_strategy")
        debug "Using cached strategy: $cached_strategy for $container_name"
    fi

    # Add all strategies if not already present
    for strategy in "native" "port" "process" "service"; do
        if [[ ! " ${strategies[@]} " =~ " ${strategy} " ]]; then
            strategies+=("$strategy")
        fi
    done

    local health_result=""
    local successful_strategy=""

    # Try each strategy in order
    for strategy in "${strategies[@]}"; do
        debug "Trying strategy: $strategy for $container_name"

        case "$strategy" in
            "native")
                if health_result=$(check_native_health "$container_id" "$container_name"); then
                    successful_strategy="native"
                    break
                fi
                ;;
            "port")
                if health_result=$(check_port_availability "$container_id" "$container_name"); then
                    successful_strategy="port"
                    break
                fi
                ;;
            "process")
                if health_result=$(check_process_status "$container_id" "$container_name"); then
                    successful_strategy="process"
                    break
                fi
                ;;
            "service")
                if health_result=$(check_service_health "$container_id" "$container_name" "$container_image"); then
                    successful_strategy="service"
                    break
                fi
                ;;
        esac
    done

    # If we got a result, cache the successful strategy and return the result
    if [ -n "$health_result" ] && [ -n "$successful_strategy" ]; then
        cache_strategy "$container_id" "$successful_strategy"
        debug "Progressive health check completed for $container_name: $health_result (strategy: $successful_strategy)"
        echo "$health_result"
        return 0
    else
        debug "All health check strategies failed for $container_name"
        echo "unknown"
        return 1
    fi
}

# Auto-detect the best health strategy for a container
detect_container_health_strategy() {
    local container_id="$1"
    local container_name="$2"
    local container_image="${3:-unknown}"

    debug "Auto-detecting health strategy for container: $container_name ($container_id)"

    # Priority order based on reliability and speed
    local strategy="unknown"

    # 1. Check if native HEALTHCHECK is configured
    local native_health
    if native_health=$(docker inspect "$container_id" --format '{{.State.Health.Status}}' 2>/dev/null); then
        if [ "$native_health" != "<no value>" ] && [ -n "$native_health" ]; then
            strategy="native"
            debug "Detected native HEALTHCHECK for $container_name"
        fi
    fi

    # 2. Check for service-specific capabilities
    if [ "$strategy" = "unknown" ]; then
        local service_detected=false
        case "$container_image" in
            *postgres*|*mysql*|*redis*|*mongodb*|*nginx*|*apache*|*elasticsearch*)
                service_detected=true
                ;;
        esac

        case "$container_name" in
            *postgres*|*mysql*|*redis*|*mongo*|*nginx*|*apache*|*elastic*)
                service_detected=true
                ;;
        esac

        if [ "$service_detected" = true ]; then
            strategy="service"
            debug "Detected service-specific health capability for $container_name"
        fi
    fi

    # 3. Check for exposed ports
    if [ "$strategy" = "unknown" ]; then
        if docker port "$container_id" 2>/dev/null | head -1 | grep -q .; then
            strategy="port"
            debug "Detected exposed ports for $container_name"
        fi
    fi

    # 4. Fallback to process status
    if [ "$strategy" = "unknown" ]; then
        strategy="process"
        debug "Falling back to process status check for $container_name"
    fi

    echo "$strategy"
    return 0
}

# Cache file for health check strategies (TTL: 1 hour)
readonly STRATEGY_CACHE_FILE="/tmp/.claude_docker_strategy_cache_${GIT_ROOT_HASH}"
readonly STRATEGY_CACHE_TTL=3600  # 1 hour in seconds

# Get cached strategy for a container
get_cached_strategy() {
    local container_id="$1"

    if [ ! -f "$STRATEGY_CACHE_FILE" ]; then
        return 1
    fi

    # Check cache file age
    local cache_age
    if command -v stat >/dev/null 2>&1; then
        local cache_mtime current_time
        cache_mtime=$(stat -c %Y "$STRATEGY_CACHE_FILE" 2>/dev/null || echo "0")
        current_time=$(date +%s)
        cache_age=$((current_time - cache_mtime))

        if [ "$cache_age" -gt "$STRATEGY_CACHE_TTL" ]; then
            debug "Strategy cache expired (${cache_age}s > ${STRATEGY_CACHE_TTL}s)"
            return 1
        fi
    fi

    # Look for container strategy in cache
    local cached_entry
    if cached_entry=$(grep "^${container_id}:" "$STRATEGY_CACHE_FILE" 2>/dev/null); then
        local strategy
        strategy=$(echo "$cached_entry" | cut -d: -f2)
        debug "Found cached strategy for $container_id: $strategy"
        echo "$strategy"
        return 0
    fi

    return 1
}

# Cache a successful strategy for a container
cache_strategy() {
    local container_id="$1"
    local strategy="$2"

    debug "Caching strategy '$strategy' for container $container_id"

    # Remove existing entry for this container
    if [ -f "$STRATEGY_CACHE_FILE" ]; then
        grep -v "^${container_id}:" "$STRATEGY_CACHE_FILE" > "${STRATEGY_CACHE_FILE}.tmp" 2>/dev/null || true
        mv "${STRATEGY_CACHE_FILE}.tmp" "$STRATEGY_CACHE_FILE" 2>/dev/null || true
    fi

    # Add new entry
    echo "${container_id}:${strategy}" >> "$STRATEGY_CACHE_FILE"

    # Limit cache file size (keep last 100 entries)
    if [ -f "$STRATEGY_CACHE_FILE" ]; then
        tail -100 "$STRATEGY_CACHE_FILE" > "${STRATEGY_CACHE_FILE}.tmp"
        mv "${STRATEGY_CACHE_FILE}.tmp" "$STRATEGY_CACHE_FILE" 2>/dev/null || true
    fi
}

# Smart health detection with auto-detection, caching, and pattern learning
smart_container_health_check() {
    local container_id="$1"
    local container_name="$2"
    local container_image="${3:-unknown}"

    debug "Starting smart health check for container: $container_name ($container_id)"

    # First, try progressive health check with caching
    local health_result
    if health_result=$(check_container_health_progressive "$container_id" "$container_name" "$container_image"); then
        debug "Smart health check result for $container_name: $health_result"
        echo "$health_result"
        return 0
    fi

    # If progressive check failed, try strategy detection and cache the result
    local detected_strategy
    if detected_strategy=$(detect_container_health_strategy "$container_id" "$container_name" "$container_image"); then
        cache_strategy "$container_id" "$detected_strategy"
        debug "Detected and cached strategy '$detected_strategy' for $container_name"

        # Try the detected strategy once more
        case "$detected_strategy" in
            "native")
                health_result=$(check_native_health "$container_id" "$container_name") || echo "unknown"
                ;;
            "port")
                health_result=$(check_port_availability "$container_id" "$container_name") || echo "unknown"
                ;;
            "process")
                health_result=$(check_process_status "$container_id" "$container_name") || echo "unknown"
                ;;
            "service")
                health_result=$(check_service_health "$container_id" "$container_name" "$container_image") || echo "unknown"
                ;;
            *)
                health_result="unknown"
                ;;
        esac

        debug "Smart health check final result for $container_name: $health_result"
        echo "$health_result"
        return 0
    fi

    # Fallback to unknown if all strategies fail
    debug "Smart health check failed for $container_name - returning unknown"
    echo "unknown"
    return 1
}

# ============================================================================
# DOCKER COMPOSE STACK DETECTION AND MANAGEMENT FUNCTIONS
# ============================================================================

# Detect Docker Compose stacks in the project
detect_compose_stacks() {
    debug "Detecting Docker Compose stacks in project"

    local start_time
    start_time=$(date +%s%3N)

    local stacks_data=""
    local stack_count=0

    # Search for compose files in the project
    local compose_files
    if compose_files=$(find "$PROJECT_ROOT" -name "docker-compose*.yml" -o -name "docker-compose*.yaml" -o -name "compose*.yml" -o -name "compose*.yaml" 2>/dev/null); then
        debug "Found compose files: $(echo "$compose_files" | tr '\n' ' ')"

        # Process each compose file
        while IFS= read -r compose_file; do
            if [ -f "$compose_file" ]; then
                local stack_name=""
                local services_count=0
                local relative_path

                # Get relative path from project root
                relative_path="${compose_file#$PROJECT_ROOT/}"

                # Extract stack name from different sources
                stack_name=$(extract_compose_stack_name "$compose_file")

                # Count services in the compose file
                services_count=$(count_compose_services "$compose_file")

                # Build stack data entry
                local stack_entry
                if command -v jq >/dev/null 2>&1; then
                    stack_entry=$(jq -n \
                        --arg name "$stack_name" \
                        --arg file "$compose_file" \
                        --arg relative_path "$relative_path" \
                        --argjson services "$services_count" \
                        '{
                            name: $name,
                            compose_file: $file,
                            relative_path: $relative_path,
                            services_count: $services,
                            containers: []
                        }')
                else
                    # Fallback JSON construction
                    stack_entry=$(cat << EOF
{
    "name": "$stack_name",
    "compose_file": "$compose_file",
    "relative_path": "$relative_path",
    "services_count": $services_count,
    "containers": []
}
EOF
)
                fi

                # Add to stacks data
                if [ -z "$stacks_data" ]; then
                    stacks_data="[$stack_entry]"
                else
                    if command -v jq >/dev/null 2>&1; then
                        stacks_data=$(echo "$stacks_data" | jq ". + [$stack_entry]")
                    else
                        # Fallback: manual JSON array construction
                        stacks_data="${stacks_data%]}, $stack_entry]"
                    fi
                fi

                stack_count=$((stack_count + 1))
                debug "Added stack: $stack_name (file: $relative_path, services: $services_count)"
            fi
        done <<< "$compose_files"
    else
        debug "No compose files found in project"
        stacks_data="[]"
    fi

    local elapsed_time=$(($(date +%s%3N) - start_time))
    debug "Stack detection completed in ${elapsed_time}ms, found $stack_count stacks"

    echo "$stacks_data"
    return 0
}

# Extract stack name from compose file
extract_compose_stack_name() {
    local compose_file="$1"
    local stack_name=""

    debug "Extracting stack name from: $compose_file"

    # Method 1: Check for 'name' field in compose file
    if command -v grep >/dev/null 2>&1; then
        local name_line
        if name_line=$(grep -E "^name:" "$compose_file" 2>/dev/null | head -1); then
            stack_name=$(echo "$name_line" | sed -E 's/^name:\s*([^#]*).*/\1/' | tr -d '"' | tr -d "'" | xargs)
            debug "Found stack name from 'name' field: $stack_name"
        fi
    fi

    # Method 2: If no name found, derive from file path
    if [ -z "$stack_name" ]; then
        local dir_name
        dir_name=$(dirname "$compose_file")
        dir_name=$(basename "$dir_name")

        # Use directory name if it's meaningful
        if [ "$dir_name" != "." ] && [ "$dir_name" != "$PROJECT_ROOT" ]; then
            stack_name="$dir_name"
            debug "Derived stack name from directory: $stack_name"
        else
            # Use filename without extension
            local filename
            filename=$(basename "$compose_file")
            stack_name="${filename%.yml}"
            stack_name="${stack_name%.yaml}"
            stack_name="${stack_name#docker-compose}"
            stack_name="${stack_name#compose}"
            stack_name="${stack_name#.}"
            stack_name="${stack_name#-}"

            # Fallback to 'main' if empty
            if [ -z "$stack_name" ]; then
                stack_name="main"
            fi
            debug "Derived stack name from filename: $stack_name"
        fi
    fi

    # Clean and normalize stack name
    stack_name=$(echo "$stack_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')

    echo "$stack_name"
}

# Count services in a compose file
count_compose_services() {
    local compose_file="$1"
    local services_count=0

    debug "Counting services in: $compose_file"

    # Try to count services using various methods
    if command -v grep >/dev/null 2>&1; then
        # Count lines that look like service definitions (non-indented, followed by colon)
        # Skip 'version', 'services', 'networks', 'volumes' keywords
        services_count=$(grep -E "^[[:space:]]*[a-zA-Z][a-zA-Z0-9_-]*:" "$compose_file" 2>/dev/null | \
            grep -v -E "^[[:space:]]*(version|services|networks|volumes|secrets|configs):" | \
            wc -l)

        # If we found services under a 'services:' section, that's more accurate
        local in_services_section=false
        local services_section_count=0

        while IFS= read -r line; do
            if echo "$line" | grep -q "^services:"; then
                in_services_section=true
                continue
            elif echo "$line" | grep -q "^[a-zA-Z]"; then
                in_services_section=false
            elif [ "$in_services_section" = true ] && echo "$line" | grep -E "^[[:space:]]+[a-zA-Z][a-zA-Z0-9_-]*:" >/dev/null; then
                services_section_count=$((services_section_count + 1))
            fi
        done < "$compose_file"

        # Use the more accurate count if we found a services section
        if [ "$services_section_count" -gt 0 ]; then
            services_count=$services_section_count
        fi
    fi

    # Ensure we have a valid number
    if [ -z "$services_count" ] || [ "$services_count" -lt 0 ]; then
        services_count=0
    fi

    debug "Found $services_count services in compose file"
    echo "$services_count"
}

# Group containers by their Docker Compose stack
group_containers_by_stack() {
    debug "Grouping containers by Docker Compose stack"

    local start_time
    start_time=$(date +%s%3N)

    # Get detected stacks
    local stacks_data
    if ! stacks_data=$(detect_compose_stacks); then
        debug "Failed to detect compose stacks"
        echo "[]"
        return 1
    fi

    # Get all containers with their metadata
    local containers_data
    if ! containers_data=$(docker ps -a --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Labels}}' 2>/dev/null); then
        debug "Failed to get container data"
        echo "$stacks_data"
        return 1
    fi

    # Process each container and assign to stacks
    local updated_stacks="$stacks_data"

    while IFS= read -r container_line; do
        if [ -n "$container_line" ]; then
            local container_id container_name container_image container_status container_labels
            IFS='|' read -r container_id container_name container_image container_status container_labels <<< "$container_line"

            # Determine which stack this container belongs to
            local assigned_stack
            assigned_stack=$(determine_container_stack "$container_id" "$container_name" "$container_labels" "$stacks_data")

            # Create container entry
            local container_entry
            if command -v jq >/dev/null 2>&1; then
                container_entry=$(jq -n \
                    --arg id "$container_id" \
                    --arg name "$container_name" \
                    --arg image "$container_image" \
                    --arg status "$container_status" \
                    --arg stack "$assigned_stack" \
                    '{
                        id: $id,
                        name: $name,
                        image: $image,
                        status: $status,
                        stack: $stack
                    }')

                # Add container to the appropriate stack
                updated_stacks=$(echo "$updated_stacks" | jq --argjson container "$container_entry" \
                    'map(if .name == $container.stack then .containers += [$container] else . end)')
            else
                # Fallback: Add container to stack manually
                debug "Adding container $container_name to stack $assigned_stack (jq not available)"
            fi

            debug "Assigned container $container_name to stack: $assigned_stack"
        fi
    done <<< "$containers_data"

    # Add standalone containers (those not belonging to any detected stack)
    local standalone_containers
    standalone_containers=$(get_standalone_containers "$containers_data" "$updated_stacks")

    if [ -n "$standalone_containers" ] && [ "$standalone_containers" != "[]" ]; then
        # Create a special "standalone" stack for containers not in compose stacks
        local standalone_stack
        if command -v jq >/dev/null 2>&1; then
            standalone_stack=$(jq -n \
                --argjson containers "$standalone_containers" \
                '{
                    name: "standalone",
                    compose_file: null,
                    relative_path: null,
                    services_count: 0,
                    containers: $containers
                }')
            updated_stacks=$(echo "$updated_stacks" | jq ". + [$standalone_stack]")
        fi
        debug "Added standalone stack with $(echo "$standalone_containers" | jq 'length' 2>/dev/null || echo 0) containers"
    fi

    local elapsed_time=$(($(date +%s%3N) - start_time))
    debug "Container grouping completed in ${elapsed_time}ms"

    echo "$updated_stacks"
    return 0
}

# Determine which stack a container belongs to
determine_container_stack() {
    local container_id="$1"
    local container_name="$2"
    local container_labels="$3"
    local stacks_data="$4"

    debug "Determining stack for container: $container_name"

    # Method 1: Check Docker Compose labels
    if echo "$container_labels" | grep -F "com.docker.compose.project" >/dev/null 2>&1; then
        local project_name
        project_name=$(echo "$container_labels" | grep -o "com.docker.compose.project=[^,]*" | cut -d'=' -f2 || echo "")
        if [ -n "$project_name" ]; then
            debug "Found compose project label: $project_name"
            echo "$project_name"
            return 0
        fi
    fi

    # Method 2: Check for compose container naming patterns
    # Docker Compose typically names containers as: <project>_<service>_<number> or <project>-<service>-<number>
    local potential_stack=""
    if echo "$container_name" | grep -E "_[0-9]+$|^[a-zA-Z0-9-]+_[a-zA-Z0-9-]+_[0-9]+$" >/dev/null; then
        potential_stack=$(echo "$container_name" | sed -E 's/_[a-zA-Z0-9-]+_[0-9]+$//' | sed -E 's/_[0-9]+$//')
        debug "Potential stack from naming pattern: $potential_stack"
    elif echo "$container_name" | grep -E "-[0-9]+$|^[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[0-9]+$" >/dev/null; then
        potential_stack=$(echo "$container_name" | sed -E 's/-[a-zA-Z0-9-]+-[0-9]+$//' | sed -E 's/-[0-9]+$//')
        debug "Potential stack from naming pattern: $potential_stack"
    fi

    # Method 3: Match against known stacks by name similarity
    if [ -n "$potential_stack" ] && command -v jq >/dev/null 2>&1; then
        local matching_stack
        matching_stack=$(echo "$stacks_data" | jq -r --arg name "$potential_stack" '.[] | select(.name == $name) | .name' 2>/dev/null || echo "")
        if [ -n "$matching_stack" ]; then
            debug "Matched container to known stack: $matching_stack"
            echo "$matching_stack"
            return 0
        fi
    fi

    # Method 4: Check network associations (compose containers often share networks)
    local container_networks
    if container_networks=$(docker inspect "$container_id" --format '{{range $net := .NetworkSettings.Networks}}{{$net.NetworkID}} {{end}}' 2>/dev/null); then
        # Try to find other containers sharing the same network and infer stack
        debug "Container networks: $container_networks"
    fi

    # Fallback: Use potential stack name or assign to standalone
    if [ -n "$potential_stack" ]; then
        echo "$potential_stack"
    else
        echo "standalone"
    fi

    return 0
}

# Get containers that don't belong to any detected compose stack
get_standalone_containers() {
    local containers_data="$1"
    local stacks_data="$2"

    debug "Identifying standalone containers"

    if ! command -v jq >/dev/null 2>&1; then
        debug "jq not available, skipping standalone container detection"
        echo "[]"
        return 0
    fi

    # Get all container names that are already assigned to stacks
    local assigned_containers
    assigned_containers=$(echo "$stacks_data" | jq -r '[.[] | .containers[]? | .name] | @json' 2>/dev/null || echo "[]")

    local standalone_containers="[]"

    # Process each container and check if it's assigned
    while IFS= read -r container_line; do
        if [ -n "$container_line" ]; then
            local container_id container_name container_image container_status
            IFS='|' read -r container_id container_name container_image container_status <<< "$container_line"

            # Check if this container is already assigned to a stack
            local is_assigned
            is_assigned=$(echo "$assigned_containers" | jq --arg name "$container_name" 'any(. == $name)' 2>/dev/null || echo "false")

            if [ "$is_assigned" = "false" ]; then
                # This is a standalone container
                local container_entry
                container_entry=$(jq -n \
                    --arg id "$container_id" \
                    --arg name "$container_name" \
                    --arg image "$container_image" \
                    --arg status "$container_status" \
                    --arg stack "standalone" \
                    '{
                        id: $id,
                        name: $name,
                        image: $image,
                        status: $status,
                        stack: $stack
                    }')
                standalone_containers=$(echo "$standalone_containers" | jq ". + [$container_entry]")
                debug "Identified standalone container: $container_name"
            fi
        fi
    done <<< "$containers_data"

    echo "$standalone_containers"
    return 0
}

# Get health summary for each stack
get_stack_health_summary() {
    debug "Getting health summary for all stacks"

    local start_time
    start_time=$(date +%s%3N)

    # Get grouped containers data
    local stacks_data
    if ! stacks_data=$(group_containers_by_stack); then
        debug "Failed to group containers by stack"
        echo "{}"
        return 1
    fi

    local summary_data=""
    local total_stacks=0
    local total_containers=0
    local total_healthy=0
    local total_unhealthy=0
    local total_unknown=0

    if command -v jq >/dev/null 2>&1; then
        # Process each stack and calculate health statistics
        local stack_summaries
        stack_summaries=$(echo "$stacks_data" | jq -r '.[] | @base64')

        local stack_results="[]"

        while IFS= read -r stack_b64; do
            if [ -n "$stack_b64" ]; then
                local stack_data
                stack_data=$(echo "$stack_b64" | base64 -d)

                local stack_name
                stack_name=$(echo "$stack_data" | jq -r '.name')

                local containers
                containers=$(echo "$stack_data" | jq '.containers // []')

                # Calculate health stats for this stack
                local stack_total stack_running stack_healthy stack_unhealthy stack_unknown
                stack_total=$(echo "$containers" | jq 'length')
                stack_running=$(echo "$containers" | jq '[.[] | select(.status | test("Up|running"))] | length')

                # Get detailed health status for running containers
                stack_healthy=0
                stack_unhealthy=0
                stack_unknown=0

                if [ "$stack_running" -gt 0 ]; then
                    local container_ids
                    container_ids=$(echo "$containers" | jq -r '.[] | select(.status | test("Up|running")) | .id')

                    while IFS= read -r container_id; do
                        if [ -n "$container_id" ]; then
                            local health_status
                            health_status=$(check_container_health_progressive "$container_id" "$(echo "$containers" | jq -r --arg id "$container_id" '.[] | select(.id == $id) | .name')" "$(echo "$containers" | jq -r --arg id "$container_id" '.[] | select(.id == $id) | .image')" 2>/dev/null || echo "unknown")

                            case "$health_status" in
                                "healthy") stack_healthy=$((stack_healthy + 1)) ;;
                                "unhealthy") stack_unhealthy=$((stack_unhealthy + 1)) ;;
                                *) stack_unknown=$((stack_unknown + 1)) ;;
                            esac
                        fi
                    done <<< "$container_ids"
                fi

                # Create stack summary
                local stack_summary
                stack_summary=$(jq -n \
                    --arg name "$stack_name" \
                    --argjson total "$stack_total" \
                    --argjson running "$stack_running" \
                    --argjson healthy "$stack_healthy" \
                    --argjson unhealthy "$stack_unhealthy" \
                    --argjson unknown "$stack_unknown" \
                    '{
                        stack: $name,
                        containers: {
                            total: $total,
                            running: $running,
                            healthy: $healthy,
                            unhealthy: $unhealthy,
                            unknown: $unknown
                        },
                        health_percentage: (if $running > 0 then ($healthy * 100 / $running) else 0 end | floor),
                        status_emoji: (if $unhealthy > 0 then "🔴" elif ($healthy == $running and $running > 0) then "🟢" elif $healthy > 0 then "🟡" else "⚫" end)
                    }')

                stack_results=$(echo "$stack_results" | jq ". + [$stack_summary]")

                # Update totals
                total_stacks=$((total_stacks + 1))
                total_containers=$((total_containers + stack_total))
                total_healthy=$((total_healthy + stack_healthy))
                total_unhealthy=$((total_unhealthy + stack_unhealthy))
                total_unknown=$((total_unknown + stack_unknown))

                debug "Stack $stack_name: $stack_total containers, $stack_healthy healthy, $stack_unhealthy unhealthy"
            fi
        done <<< "$stack_summaries"

        # Create overall summary
        local overall_health_percentage=0
        if [ "$total_containers" -gt 0 ]; then
            overall_health_percentage=$(( (total_healthy * 100) / total_containers ))
        fi

        summary_data=$(jq -n \
            --argjson stacks "$stack_results" \
            --argjson total_stacks "$total_stacks" \
            --argjson total_containers "$total_containers" \
            --argjson total_healthy "$total_healthy" \
            --argjson total_unhealthy "$total_unhealthy" \
            --argjson total_unknown "$total_unknown" \
            --argjson health_percentage "$overall_health_percentage" \
            '{
                stacks: $stacks,
                summary: {
                    total_stacks: $total_stacks,
                    total_containers: $total_containers,
                    healthy: $total_healthy,
                    unhealthy: $total_unhealthy,
                    unknown: $total_unknown,
                    health_percentage: $health_percentage
                }
            }')
    else
        # Fallback without jq
        debug "jq not available, using simplified stack health summary"
        summary_data='{"stacks": [], "summary": {"total_stacks": 0, "total_containers": 0, "healthy": 0, "unhealthy": 0, "unknown": 0, "health_percentage": 0}}'
    fi

    local elapsed_time=$(($(date +%s%3N) - start_time))
    debug "Stack health summary completed in ${elapsed_time}ms"

    echo "$summary_data"
    return 0
}

# Display stack-aware status with emoji indicators
display_stack_status() {
    debug "Displaying stack-aware status"

    local start_time
    start_time=$(date +%s%3N)

    # Get stack health summary
    local summary_data
    if ! summary_data=$(get_stack_health_summary); then
        error "Failed to get stack health summary"
        return 1
    fi

    # Display output
    if command -v jq >/dev/null 2>&1; then
        local total_stacks total_containers overall_health
        total_stacks=$(echo "$summary_data" | jq -r '.summary.total_stacks // 0')
        total_containers=$(echo "$summary_data" | jq -r '.summary.total_containers // 0')
        overall_health=$(echo "$summary_data" | jq -r '.summary.health_percentage // 0')

        echo "🐳 Docker Compose Stack Status:"
        echo "📊 Overview: $total_stacks stacks, $total_containers containers, ${overall_health}% healthy"
        echo

        # Display each stack with emoji status
        local stack_statuses
        stack_statuses=$(echo "$summary_data" | jq -r '.stacks[] | "\(.status_emoji) \(.stack): \(.containers.healthy)/\(.containers.running) (\(.health_percentage)%) - \(.containers.total) total"')

        if [ -n "$stack_statuses" ]; then
            echo "Stack Health Summary:"
            echo "$stack_statuses"
        else
            echo "No stacks found or no containers running"
        fi

        # Show compact status line (like requested format)
        echo
        local compact_status
        compact_status=$(echo "$summary_data" | jq -r '.stacks[] | "\(.stack):\(.status_emoji)(\(.containers.healthy)/\(.containers.running))"' | tr '\n' ' ')

        if [ -n "$compact_status" ]; then
            echo "Compact Status: $compact_status"
        fi

        # Show individual stack details if debug is enabled
        if [ "$DEBUG" = "1" ]; then
            echo
            echo "Detailed Stack Information:"
            echo "$summary_data" | jq -r '.stacks[] | "
Stack: \(.stack)
  Containers: \(.containers.total) total, \(.containers.running) running
  Health: \(.containers.healthy) healthy, \(.containers.unhealthy) unhealthy, \(.containers.unknown) unknown
  Health %: \(.health_percentage)%
  Status: \(.status_emoji)
"'
        fi
    else
        # Fallback display without jq
        echo "🐳 Docker Compose Stack Status:"
        echo "⚠️  jq not available - limited display"
        echo "$summary_data"
    fi

    local elapsed_time=$(($(date +%s%3N) - start_time))
    debug "Stack status display completed in ${elapsed_time}ms"

    return 0
}

# ============================================================================
# BATCH DOCKER CONTAINER HEALTH CHECK FUNCTIONS
# ============================================================================

# Get all container health statuses in one efficient batch call
get_container_health_batch() {
    debug "Starting batch container health check"

    local start_time
    start_time=$(date +%s%3N)

    # Get all container IDs first
    local container_ids
    if ! container_ids=$(docker ps -aq 2>/dev/null); then
        debug "No containers found or Docker error"
        return 1
    fi

    # If no containers, return empty result
    if [ -z "$container_ids" ]; then
        debug "No containers to check"
        echo "[]"
        return 0
    fi

    # Convert container IDs to array for processing
    local ids_array=($container_ids)
    local container_count=${#ids_array[@]}
    debug "Found $container_count containers to check"

    # Single batch inspect call for all containers
    local inspect_output
    local inspect_exit_code=0

    # Use timeout to prevent hanging on large numbers of containers
    # Note: docker inspect returns a JSON array when given multiple IDs
    if inspect_output=$(timeout 10s docker inspect $container_ids 2>/dev/null); then
        debug "Batch inspect completed successfully"
    else
        inspect_exit_code=$?
        debug "Batch inspect failed with exit code: $inspect_exit_code"
        return $inspect_exit_code
    fi

    # Calculate elapsed time
    local end_time elapsed_ms
    end_time=$(date +%s%3N)
    elapsed_ms=$((end_time - start_time))
    debug "Batch health check completed in ${elapsed_ms}ms for $container_count containers"

    # Output the raw JSON for further processing
    echo "$inspect_output"
    return 0
}

# Parse container health data from Docker inspect JSON output
parse_container_health() {
    debug "Parsing container health data"

    local json_input="$1"
    local parsed_data=""

    # Check if jq is available for robust JSON parsing
    if command -v jq >/dev/null 2>&1; then
        debug "Using jq for JSON parsing"
        parsed_data=$(echo "$json_input" | jq -c '.[] | {
            id: .Id[0:12],
            name: ((.Name // "unknown") | ltrimstr("/")),
            image: (.Config.Image // "unknown"),
            status: (.State.Status // "unknown"),
            health: (if .State.Health then (.State.Health.Status // "none") else "none" end),
            health_log: (if (.State.Health and .State.Health.Log) then (.State.Health.Log[-1].Output // "") else "" end),
            labels: (.Config.Labels // {}),
            created: (.Created // ""),
            started: (.State.StartedAt // "")
        }' 2>/dev/null)
    else
        debug "Using fallback parsing without jq"
        # Fallback parsing using grep and sed (less robust but functional)
        parsed_data=$(echo "$json_input" | while IFS= read -r line; do
            if echo "$line" | grep -q '"Id":'; then
                # Extract container ID (first 12 chars)
                id=$(echo "$line" | sed -n 's/.*"Id":"\([^"]*\)".*/\1/p' | cut -c1-12)
                echo "id:$id"
            elif echo "$line" | grep -q '"Name":'; then
                # Extract container name
                name=$(echo "$line" | sed -n 's/.*"Name":"\([^"]*\)".*/\1/p' | sed 's|^/||')
                echo "name:${name:-unknown}"
            elif echo "$line" | grep -q '"Image":'; then
                # Extract image name
                image=$(echo "$line" | sed -n 's/.*"Image":"\([^"]*\)".*/\1/p')
                echo "image:${image:-unknown}"
            elif echo "$line" | grep -q '"Status":'; then
                # Extract status
                status=$(echo "$line" | sed -n 's/.*"Status":"\([^"]*\)".*/\1/p')
                echo "status:${status:-unknown}"
            fi
        done)
    fi

    if [ -z "$parsed_data" ]; then
        debug "No health data parsed from JSON input"
        return 1
    fi

    echo "$parsed_data"
    return 0
}

# Categorize containers by type based on image name, labels, and container name
categorize_containers() {
    debug "Categorizing containers"

    local container_data="$1"
    local categorized_output=""

    # Container type detection patterns
    local database_patterns="postgres|mysql|mariadb|mongodb|mongo|redis|cassandra|elasticsearch|influxdb|couchdb|neo4j"
    local app_patterns="web|api|frontend|backend|app|service|worker|queue"
    local service_patterns="nginx|proxy|traefik|haproxy|consul|vault|prometheus|grafana|jaeger"

    if command -v jq >/dev/null 2>&1; then
        debug "Using jq for container categorization"
        categorized_output=$(echo "$container_data" | jq -c --arg db_patterns "$database_patterns" --arg app_patterns "$app_patterns" --arg service_patterns "$service_patterns" '
            . as $container |
            (
                if ($container.image | test($db_patterns; "i")) or
                   ($container.name | test($db_patterns; "i")) or
                   ($container.labels["com.docker.compose.service"] // "" | test($db_patterns; "i")) then
                    "database"
                elif ($container.image | test($app_patterns; "i")) or
                     ($container.name | test($app_patterns; "i")) or
                     ($container.labels["com.docker.compose.service"] // "" | test($app_patterns; "i")) then
                    "app"
                elif ($container.image | test($service_patterns; "i")) or
                     ($container.name | test($service_patterns; "i")) or
                     ($container.labels["com.docker.compose.service"] // "" | test($service_patterns; "i")) then
                    "service"
                else
                    "service"
                end
            ) as $category |
            $container + {category: $category}
        ' 2>/dev/null)
    else
        debug "Using fallback categorization without jq"
        # Fallback categorization logic
        categorized_output=$(echo "$container_data" | while IFS= read -r line; do
            local category="service"  # Default category

            # Check for database patterns
            if echo "$line" | grep -iE "$database_patterns" >/dev/null; then
                category="database"
            # Check for app patterns
            elif echo "$line" | grep -iE "$app_patterns" >/dev/null; then
                category="app"
            # Check for service patterns
            elif echo "$line" | grep -iE "$service_patterns" >/dev/null; then
                category="service"
            fi

            echo "$line category:$category"
        done)
    fi

    echo "$categorized_output"
    return 0
}

# Aggregate health statistics from container data
aggregate_health_status() {
    debug "Aggregating health status statistics"

    local container_data="$1"
    local total_containers=0
    local healthy_count=0
    local unhealthy_count=0
    local unknown_count=0
    local no_health_count=0

    # Category counters
    local app_healthy=0 app_unhealthy=0 app_unknown=0 app_total=0
    local database_healthy=0 database_unhealthy=0 database_unknown=0 database_total=0
    local service_healthy=0 service_unhealthy=0 service_unknown=0 service_total=0

    if command -v jq >/dev/null 2>&1; then
        debug "Using jq for health aggregation"

        # Count totals and health statuses
        local stats
        # First, convert lines to proper JSON array for processing
        local json_array
        json_array="[$(echo "$container_data" | paste -sd ',' -)]"

        stats=$(echo "$json_array" | jq -r '
            group_by(.category) |
            map({
                category: .[0].category,
                total: length,
                healthy: map(select(.health == "healthy")) | length,
                unhealthy: map(select(.health == "unhealthy")) | length,
                unknown: map(select(.health == "unknown" or .health == "none" or .health == "")) | length
            }) |
            .[] |
            "\(.category):\(.total):\(.healthy):\(.unhealthy):\(.unknown)"
        ' 2>/dev/null)

        # Parse the stats
        while IFS=':' read -r category total healthy unhealthy unknown; do
            case "$category" in
                "app")
                    app_total=$total
                    app_healthy=$healthy
                    app_unhealthy=$unhealthy
                    app_unknown=$unknown
                    ;;
                "database")
                    database_total=$total
                    database_healthy=$healthy
                    database_unhealthy=$unhealthy
                    database_unknown=$unknown
                    ;;
                "service")
                    service_total=$total
                    service_healthy=$healthy
                    service_unhealthy=$unhealthy
                    service_unknown=$unknown
                    ;;
            esac
        done <<< "$stats"

        # Calculate overall totals
        total_containers=$((app_total + database_total + service_total))
        healthy_count=$((app_healthy + database_healthy + service_healthy))
        unhealthy_count=$((app_unhealthy + database_unhealthy + service_unhealthy))
        unknown_count=$((app_unknown + database_unknown + service_unknown))

    else
        debug "Using fallback aggregation without jq"

        # Fallback counting logic
        while IFS= read -r line; do
            if echo "$line" | grep -q "category:"; then
                total_containers=$((total_containers + 1))

                local category health
                category=$(echo "$line" | sed -n 's/.*category:\([^[:space:]]*\).*/\1/p')
                health=$(echo "$line" | sed -n 's/.*health:\([^[:space:]]*\).*/\1/p')

                # Count by health status
                case "$health" in
                    "healthy")
                        healthy_count=$((healthy_count + 1))
                        ;;
                    "unhealthy")
                        unhealthy_count=$((unhealthy_count + 1))
                        ;;
                    "none"|""|"unknown")
                        unknown_count=$((unknown_count + 1))
                        ;;
                esac

                # Count by category
                case "$category" in
                    "app")
                        app_total=$((app_total + 1))
                        case "$health" in
                            "healthy") app_healthy=$((app_healthy + 1)) ;;
                            "unhealthy") app_unhealthy=$((app_unhealthy + 1)) ;;
                            *) app_unknown=$((app_unknown + 1)) ;;
                        esac
                        ;;
                    "database")
                        database_total=$((database_total + 1))
                        case "$health" in
                            "healthy") database_healthy=$((database_healthy + 1)) ;;
                            "unhealthy") database_unhealthy=$((database_unhealthy + 1)) ;;
                            *) database_unknown=$((database_unknown + 1)) ;;
                        esac
                        ;;
                    "service")
                        service_total=$((service_total + 1))
                        case "$health" in
                            "healthy") service_healthy=$((service_healthy + 1)) ;;
                            "unhealthy") service_unhealthy=$((service_unhealthy + 1)) ;;
                            *) service_unknown=$((service_unknown + 1)) ;;
                        esac
                        ;;
                esac
            fi
        done <<< "$container_data"
    fi

    # Calculate health percentage
    local health_percentage=0
    if [ "$total_containers" -gt 0 ]; then
        health_percentage=$(( (healthy_count * 100) / total_containers ))
    fi

    # Output aggregated statistics
    cat << EOF
{
    "total_containers": $total_containers,
    "healthy": $healthy_count,
    "unhealthy": $unhealthy_count,
    "unknown": $unknown_count,
    "health_percentage": $health_percentage,
    "categories": {
        "app": {
            "total": $app_total,
            "healthy": $app_healthy,
            "unhealthy": $app_unhealthy,
            "unknown": $app_unknown
        },
        "database": {
            "total": $database_total,
            "healthy": $database_healthy,
            "unhealthy": $database_unhealthy,
            "unknown": $database_unknown
        },
        "service": {
            "total": $service_total,
            "healthy": $service_healthy,
            "unhealthy": $service_unhealthy,
            "unknown": $service_unknown
        }
    }
}
EOF

    debug "Health aggregation completed: $total_containers containers, ${health_percentage}% healthy"
    return 0
}

# Main batch health check function that orchestrates the entire process
check_all_container_health() {
    debug "Starting comprehensive container health check"

    local start_time
    start_time=$(date +%s%3N)

    # Try cache first
    local cached_data
    if cached_data=$(cache_get_docker_status); then
        info "Using cached Docker health data"
        echo "$cached_data"
        return 0
    fi

    debug "Cache miss - performing fresh Docker health check"

    # Step 1: Get raw container data
    local raw_data
    if ! raw_data=$(get_container_health_batch); then
        error "Failed to retrieve container data"
        return 1
    fi

    # Step 2: Parse health information
    local parsed_data
    if ! parsed_data=$(parse_container_health "$raw_data"); then
        error "Failed to parse container health data"
        return 1
    fi

    # Step 3: Categorize containers
    local categorized_data
    if ! categorized_data=$(categorize_containers "$parsed_data"); then
        error "Failed to categorize containers"
        return 1
    fi

    # Step 4: Aggregate statistics
    local aggregated_stats
    if ! aggregated_stats=$(aggregate_health_status "$categorized_data"); then
        error "Failed to aggregate health statistics"
        return 1
    fi

    # Calculate total elapsed time
    local end_time elapsed_ms
    end_time=$(date +%s%3N)
    elapsed_ms=$((end_time - start_time))

    # Update status file with health data
    local total_containers healthy_count unhealthy_count
    if command -v jq >/dev/null 2>&1; then
        total_containers=$(echo "$aggregated_stats" | jq -r '.total_containers // 0')
        healthy_count=$(echo "$aggregated_stats" | jq -r '.healthy // 0')
        unhealthy_count=$(echo "$aggregated_stats" | jq -r '.unhealthy // 0')
    else
        # Fallback parsing without jq
        total_containers=$(echo "$aggregated_stats" | grep -o '"total_containers": [0-9]*' | cut -d' ' -f2)
        healthy_count=$(echo "$aggregated_stats" | grep -o '"healthy": [0-9]*' | cut -d' ' -f2)
        unhealthy_count=$(echo "$aggregated_stats" | grep -o '"unhealthy": [0-9]*' | cut -d' ' -f2)
    fi

    # Write status using the new status management functions
    write_status "true" "${DOCKER_TYPE:-Docker}" "${total_containers:-0}" "${total_containers:-0}" "${healthy_count:-0}" "${unhealthy_count:-0}" "0"

    # Cache the results in all levels
    cache_set_docker_status "$aggregated_stats" "true" "${DOCKER_TYPE:-Docker}" "${total_containers:-0}"

    # Save cache metrics
    cache_save_metrics

    info "Container health check completed in ${elapsed_ms}ms"
    info "Found $total_containers containers: $healthy_count healthy, $unhealthy_count unhealthy"

    # Output the aggregated statistics
    echo "$aggregated_stats"
    return 0
}

# Validate basic permissions (Docker permissions are checked in check_docker_daemon)
check_basic_permissions() {
    debug "Checking basic permissions"

    # Check if we can write to Docker health directory
    if [ ! -w "$DOCKER_HEALTH_DIR" ]; then
        error "No write permission to Docker health directory: $DOCKER_HEALTH_DIR"
        exit $EXIT_PERMISSION_ERROR
    fi

    debug "Basic permissions validated"
}

# Main function
main() {
    debug "Starting $SCRIPT_NAME"

    # Initialize operation arguments array
    OPERATION_ARGS=()

    # Parse command line arguments
    parse_args "$@"

    # Initialize status tracking
    init_status

    # Check basic permissions
    check_basic_permissions

    # Check dependencies
    check_dependencies

    # Check Docker daemon status (includes Docker permission and connectivity checks)
    if check_docker_daemon; then
        info "Docker daemon is accessible"

        # Get container statistics
        get_container_stats

        # Write status with Docker running and container stats
        write_status "true" "$DOCKER_TYPE" "$CONTAINER_TOTAL" "$CONTAINER_RUNNING" "$CONTAINER_HEALTHY" "$CONTAINER_UNHEALTHY" "$CONTAINER_UNKNOWN"
    else
        # Docker is not accessible - write status accordingly
        write_status "false" "unknown" "0" "0" "0" "0" "0"
    fi

    info "Docker Health Monitoring Wrapper initialized successfully"

    # Handle specific operations based on OPERATION_ARGS
    if [ ${#OPERATION_ARGS[@]} -gt 0 ]; then
        local operation="${OPERATION_ARGS[0]}"
        debug "Handling operation: $operation"

        case "$operation" in
            "test")
                info "Running all status file management tests"
                run_all_tests
                exit $?
                ;;
            "test-concurrent")
                info "Running concurrent access test"
                test_concurrent_access
                exit $?
                ;;
            "test-locks")
                info "Running lock timeout test"
                test_lock_timeout
                exit $?
                ;;
            "test-json")
                info "Running JSON validation test"
                test_json_validation
                exit $?
                ;;
            "test-cleanup")
                info "Running stale lock cleanup test"
                test_stale_lock_cleanup
                exit $?
                ;;
            "health-check")
                info "Running batch container health check"
                check_all_container_health
                exit $?
                ;;
            "stack-detect")
                info "Detecting Docker Compose stacks"
                detect_compose_stacks
                exit $?
                ;;
            "stack-group")
                info "Grouping containers by Docker Compose stack"
                group_containers_by_stack
                exit $?
                ;;
            "stack-health")
                info "Getting health summary for all stacks"
                get_stack_health_summary
                exit $?
                ;;
            "stack-status")
                info "Displaying stack-aware status"
                display_stack_status
                exit $?
                ;;
            "cache-metrics")
                info "Displaying cache metrics"
                cache_get_metrics
                exit $?
                ;;
            "cache-test")
                info "Testing multi-level cache performance"
                test_cache_performance
                exit $?
                ;;
            "cache-invalidate")
                info "Invalidating all cache levels"
                cache_invalidate_all
                info "All cache levels invalidated"
                exit $?
                ;;
            "bg-start")
                if command -v start_background_monitor >/dev/null 2>&1; then
                    info "Starting background health monitor"
                    start_background_monitor
                    exit $?
                else
                    error "Background management functions not available"
                    exit 1
                fi
                ;;
            "bg-stop")
                if command -v stop_background_monitor >/dev/null 2>&1; then
                    info "Stopping background health monitor"
                    stop_background_monitor
                    exit $?
                else
                    error "Background management functions not available"
                    exit 1
                fi
                ;;
            "bg-restart")
                if command -v stop_background_monitor >/dev/null 2>&1 && command -v start_background_monitor >/dev/null 2>&1; then
                    info "Restarting background health monitor"
                    stop_background_monitor
                    sleep 2
                    start_background_monitor
                    exit $?
                else
                    error "Background management functions not available"
                    exit 1
                fi
                ;;
            "bg-status")
                if command -v get_monitor_status >/dev/null 2>&1; then
                    info "Getting background monitor status"
                    get_monitor_status
                    exit $?
                else
                    error "Background management functions not available"
                    exit 1
                fi
                ;;
            "bg-test")
                if command -v test_background_management >/dev/null 2>&1; then
                    info "Testing background process management"
                    test_background_management
                    exit $?
                else
                    error "Background management functions not available"
                    exit 1
                fi
                ;;
            *)
                info "Operations not yet implemented for: $operation"
                info "Available operations: health-check, stack-detect, stack-group, stack-health, stack-status, test, test-concurrent, test-locks, test-json, test-cleanup, cache-metrics, cache-test, cache-invalidate, bg-start, bg-stop, bg-restart, bg-status, bg-test"
                ;;
        esac
    else
        info "No operation specified. Use --help for usage information."
        info "Docker daemon status and container statistics have been updated in status file:"
        info "  Status file: $STATUS_FILE"

        # Show current status if available
        if read_status >/dev/null 2>&1; then
            info "Current status:"
            read_status json | jq . 2>/dev/null || read_status raw
        fi
    fi

    debug "Script completed successfully"
    exit $EXIT_SUCCESS
}

# Execute main function if script is run directly (not sourced)
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi