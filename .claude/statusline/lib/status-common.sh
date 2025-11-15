#!/bin/bash
# Shared library for Claude statusline status file operations
# Provides atomic writes, validation, and consistent path generation

# Strict error handling (can be disabled by sourcing script)
set -u

# ============================================================================
# Configuration & Constants
# ============================================================================

# Enable debug logging via DEBUG_STATUSLINE=true environment variable
: "${DEBUG_STATUSLINE:=false}"
: "${STATUS_LOG_FILE:=/tmp/.claude_statusline_debug.log}"

# Status file retention (30 days in seconds)
readonly STATUS_MAX_AGE=$((30 * 24 * 60 * 60))

# Lock timeout in tenths of seconds (5 seconds = 50)
readonly LOCK_TIMEOUT=50

# ============================================================================
# Path Generation
# ============================================================================

# Get git root or fall back to PWD (consistent across all operations)
get_git_root() {
    git rev-parse --show-toplevel 2>/dev/null || echo "$PWD"
}

# Generate consistent status file path
# Args: $1 = status type (build|test|codecheck|ci|pr|docker)
get_status_file_path() {
    local status_type="$1"
    local git_root
    git_root=$(get_git_root)
    echo "/tmp/.claude_${status_type}_status_${git_root//\//_}"
}

# Generate consistent PID file path for running processes
# Args: $1 = process type (build|test|codecheck)
get_pid_file_path() {
    local process_type="$1"
    local git_root
    git_root=$(get_git_root)
    echo "/tmp/.claude_${process_type}_running_${git_root//\//_}.pid"
}

# ============================================================================
# Debug Logging
# ============================================================================

log_debug() {
    if [ "$DEBUG_STATUSLINE" = "true" ]; then
        local timestamp
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$timestamp] [PID:$$] $*" >> "$STATUS_LOG_FILE"
    fi
}

log_error() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [ERROR] [PID:$$] $*" >&2
    log_debug "ERROR: $*"
}

# ============================================================================
# File Locking (Optional, for high-contention scenarios)
# ============================================================================

# Acquire file lock with timeout
# Args: $1 = lock file path
# Returns: 0 on success, 1 on timeout
acquire_lock() {
    local lock_file="$1"
    local elapsed=0

    log_debug "Attempting to acquire lock: $lock_file"

    while [ $elapsed -lt $LOCK_TIMEOUT ]; do
        # Use set -C to create file atomically (noclobber)
        if (set -C; echo "$$" > "$lock_file") 2>/dev/null; then
            log_debug "Lock acquired: $lock_file"
            return 0
        fi

        sleep 0.1
        elapsed=$((elapsed + 1))
    done

    log_error "Failed to acquire lock after timeout: $lock_file"
    return 1
}

# Release file lock
# Args: $1 = lock file path
release_lock() {
    local lock_file="$1"

    # Only release if we own the lock
    if [ -f "$lock_file" ]; then
        local lock_pid
        lock_pid=$(cat "$lock_file" 2>/dev/null || echo "")
        if [ "$lock_pid" = "$$" ]; then
            rm -f "$lock_file"
            log_debug "Lock released: $lock_file"
        else
            log_debug "Not releasing lock (owned by PID $lock_pid): $lock_file"
        fi
    fi
}

# ============================================================================
# Atomic Status File Operations
# ============================================================================

# Write status file atomically
# Args: $1 = status file path
#       $2 = status content (pipe-delimited string)
#       $3 = use locking (optional, default: false)
write_status_atomic() {
    local status_file="$1"
    local content="$2"
    local use_lock="${3:-false}"
    local temp_file="${status_file}.tmp.$$"
    local lock_file="${status_file}.lock"

    log_debug "Writing status atomically: $status_file"
    log_debug "Content: $content"

    # Optional locking for high-contention scenarios
    if [ "$use_lock" = "true" ]; then
        if ! acquire_lock "$lock_file"; then
            log_error "Could not acquire lock for: $status_file"
            return 1
        fi
    fi

    # Write to temp file first
    if ! echo "$content" > "$temp_file"; then
        log_error "Failed to write temp file: $temp_file"
        [ "$use_lock" = "true" ] && release_lock "$lock_file"
        return 1
    fi

    # Verify temp file was written
    if [ ! -s "$temp_file" ]; then
        log_error "Temp file is empty: $temp_file"
        rm -f "$temp_file"
        [ "$use_lock" = "true" ] && release_lock "$lock_file"
        return 1
    fi

    # Atomic move
    if ! mv "$temp_file" "$status_file"; then
        log_error "Failed to move temp file to: $status_file"
        rm -f "$temp_file"
        [ "$use_lock" = "true" ] && release_lock "$lock_file"
        return 1
    fi

    # Verify final file
    if [ -f "$status_file" ]; then
        local actual_content
        actual_content=$(cat "$status_file")
        if [ "$actual_content" = "$content" ]; then
            log_debug "Status file written and verified: $status_file"
        else
            log_error "Status file content mismatch after write!"
        fi
    else
        log_error "Status file not found after atomic write!"
        [ "$use_lock" = "true" ] && release_lock "$lock_file"
        return 1
    fi

    # Release lock if used
    [ "$use_lock" = "true" ] && release_lock "$lock_file"

    return 0
}

# ============================================================================
# Status File Validation
# ============================================================================

# Validate status file format and freshness
# Args: $1 = status file path
#       $2 = required field count (optional, default: 3)
# Returns: 0 if valid, 1 if invalid
validate_status_file() {
    local status_file="$1"
    local required_fields="${2:-3}"

    log_debug "Validating status file: $status_file"

    # Check file exists and is readable
    if [ ! -f "$status_file" ]; then
        log_debug "Status file does not exist: $status_file"
        return 1
    fi

    # Read content
    local content
    content=$(cat "$status_file" 2>/dev/null)
    if [ -z "$content" ]; then
        log_error "Status file is empty: $status_file"
        return 1
    fi

    # Parse fields
    IFS='|' read -r status timestamp remaining <<< "$content"

    # Validate required fields exist
    if [ -z "$status" ]; then
        log_error "Missing status field: $status_file"
        return 1
    fi

    if [ -z "$timestamp" ]; then
        log_error "Missing timestamp field: $status_file"
        return 1
    fi

    # Validate timestamp is numeric
    if ! [[ "$timestamp" =~ ^[0-9]+$ ]]; then
        log_error "Invalid timestamp (not numeric): $timestamp"
        return 1
    fi

    # Check age (not too old)
    local current_time
    current_time=$(date +%s)
    local age=$((current_time - timestamp))

    if [ $age -gt $STATUS_MAX_AGE ]; then
        log_debug "Status file is too old (${age}s): $status_file"
        return 1
    fi

    # Validate field count if specified
    if [ "$required_fields" -gt 0 ]; then
        local field_count
        field_count=$(echo "$content" | tr -cd '|' | wc -c)
        field_count=$((field_count + 1))

        if [ "$field_count" -lt "$required_fields" ]; then
            log_error "Insufficient fields (expected $required_fields, got $field_count): $status_file"
            return 1
        fi
    fi

    log_debug "Status file validated successfully (age: ${age}s)"
    return 0
}

# Clean up invalid/corrupted status files
# Args: $1 = status file path
cleanup_invalid_status() {
    local status_file="$1"

    if ! validate_status_file "$status_file" 0; then
        log_debug "Removing invalid status file: $status_file"
        rm -f "$status_file"
        return 0
    fi

    return 1
}

# ============================================================================
# PID File Operations (Process Tracking)
# ============================================================================

# Mark process as running by creating PID file
# Args: $1 = process type (build|test|codecheck)
mark_process_running() {
    local process_type="$1"
    local pid_file
    pid_file=$(get_pid_file_path "$process_type")

    echo "$$" > "$pid_file"
    log_debug "Process marked as running: $pid_file (PID: $$)"
}

# Check if process is actually running
# Args: $1 = process type (build|test|codecheck)
# Returns: 0 if running, 1 if not
is_process_running() {
    local process_type="$1"
    local pid_file
    pid_file=$(get_pid_file_path "$process_type")

    if [ ! -f "$pid_file" ]; then
        return 1
    fi

    local pid
    pid=$(cat "$pid_file" 2>/dev/null)

    if [ -z "$pid" ]; then
        log_debug "PID file empty: $pid_file"
        rm -f "$pid_file"
        return 1
    fi

    # Check if process with that PID exists
    if ps -p "$pid" > /dev/null 2>&1; then
        log_debug "Process is running: $process_type (PID: $pid)"
        return 0
    else
        log_debug "Process not found (stale PID file): $pid_file"
        rm -f "$pid_file"
        return 1
    fi
}

# Clear process running marker
# Args: $1 = process type (build|test|codecheck)
clear_process_running() {
    local process_type="$1"
    local pid_file
    pid_file=$(get_pid_file_path "$process_type")

    # Only remove if we own it
    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file" 2>/dev/null)
        if [ "$pid" = "$$" ]; then
            rm -f "$pid_file"
            log_debug "Process running marker cleared: $pid_file"
        else
            log_debug "Not clearing PID file (owned by PID $pid): $pid_file"
        fi
    fi
}

# ============================================================================
# Status Update Helpers
# ============================================================================

# Update build status
# Args: $1 = result (success|failed)
#       $2 = error count (default: 0)
#       $3 = use locking (optional, default: false)
update_build_status() {
    local result="$1"
    local errors="${2:-0}"
    local use_lock="${3:-false}"
    local timestamp
    timestamp=$(date +%s)

    local status_file
    status_file=$(get_status_file_path "build")

    local content="${result}|${timestamp}|${errors}"
    write_status_atomic "$status_file" "$content" "$use_lock"
}

# Update test status
# Args: $1 = result (success|failed)
#       $2 = passed count
#       $3 = failed count
#       $4 = total count (optional, will calculate if not provided)
#       $5 = use locking (optional, default: false)
update_test_status() {
    local result="$1"
    local passed="$2"
    local failed="$3"
    local total="${4:-$((passed + failed))}"
    local use_lock="${5:-false}"
    local timestamp
    timestamp=$(date +%s)

    local status_file
    status_file=$(get_status_file_path "test")

    local content="${result}|${timestamp}|${passed}|${failed}|${total}"
    write_status_atomic "$status_file" "$content" "$use_lock"
}

# Update codecheck status
# Args: $1 = result (success|failed)
#       $2 = errors count
#       $3 = warnings count
#       $4 = type errors count
#       $5 = use locking (optional, default: false)
update_codecheck_status() {
    local result="$1"
    local errors="$2"
    local warnings="$3"
    local type_errors="$4"
    local use_lock="${5:-false}"
    local timestamp
    timestamp=$(date +%s)

    local status_file
    status_file=$(get_status_file_path "codecheck")

    local content="${result}|${timestamp}|${errors}|${warnings}|${type_errors}"
    write_status_atomic "$status_file" "$content" "$use_lock"
}

# ============================================================================
# Utility Functions
# ============================================================================

# Clear all status files for current repository
clear_all_status() {
    local git_root
    git_root=$(get_git_root)
    local pattern="/tmp/.claude_*_status_${git_root//\//_}"

    log_debug "Clearing all status files matching: $pattern"

    # Remove status files
    rm -f ${pattern} 2>/dev/null || true

    # Remove PID files
    rm -f /tmp/.claude_*_running_${git_root//\//_}.pid 2>/dev/null || true

    # Remove lock files
    rm -f ${pattern}.lock 2>/dev/null || true

    echo "Cleared all statusline files for $(basename "$git_root")"
}

# Sanitize numeric input (ensure it's a valid number)
# Args: $1 = value to sanitize
#       $2 = default value (optional, default: 0)
sanitize_number() {
    local value="$1"
    local default="${2:-0}"

    if [[ "$value" =~ ^[0-9]+$ ]]; then
        echo "$value"
    else
        echo "$default"
    fi
}

# ============================================================================
# Note: Functions are available when sourced (no explicit export needed)
# ============================================================================

# Functions are automatically available in the sourcing shell
# No need to export -f (which doesn't work in zsh anyway)
