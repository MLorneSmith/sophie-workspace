#!/bin/bash
# Robust status file updater for codecheck
# Ensures consistent statusline updates with atomic writes and validation

set -euo pipefail

# Get git root for consistent file naming
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
CODECHECK_STATUS_FILE="/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}"
TEMP_FILE="${CODECHECK_STATUS_FILE}.tmp.$$"
LOCK_FILE="${CODECHECK_STATUS_FILE}.lock"
LOG_FILE="/tmp/.claude_codecheck_debug.log"

# Enable debug logging if DEBUG_CODECHECK is set
DEBUG="${DEBUG_CODECHECK:-false}"

log_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    fi
}

# Function to acquire lock with timeout
acquire_lock() {
    local timeout=5
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if (set -C; echo $$ > "$LOCK_FILE") 2>/dev/null; then
            log_debug "Lock acquired by PID $$"
            return 0
        fi
        sleep 0.1
        elapsed=$((elapsed + 1))
    done
    
    log_debug "Failed to acquire lock after ${timeout}s"
    return 1
}

# Function to release lock
release_lock() {
    if [ -f "$LOCK_FILE" ] && [ "$(cat "$LOCK_FILE" 2>/dev/null)" = "$$" ]; then
        rm -f "$LOCK_FILE"
        log_debug "Lock released by PID $$"
    fi
}

# Set up cleanup trap
cleanup() {
    release_lock
    rm -f "$TEMP_FILE"
}
trap cleanup EXIT

# Function to update status file atomically
update_status() {
    local status="${1:-unknown}"
    local errors="${2:-0}"
    local warnings="${3:-0}"
    local type_errors="${4:-0}"
    local timestamp=$(date +%s)
    
    log_debug "Updating status: status=$status, errors=$errors, warnings=$warnings, type_errors=$type_errors"
    
    # Validate inputs
    if ! [[ "$errors" =~ ^[0-9]+$ ]]; then errors=0; fi
    if ! [[ "$warnings" =~ ^[0-9]+$ ]]; then warnings=0; fi
    if ! [[ "$type_errors" =~ ^[0-9]+$ ]]; then type_errors=0; fi
    
    # Prepare status line
    local status_line="${status}|${timestamp}|${errors}|${warnings}|${type_errors}"
    
    # Try to acquire lock
    if ! acquire_lock; then
        log_debug "Warning: Could not acquire lock, forcing update"
        # Force update anyway after timeout
        rm -f "$LOCK_FILE"
        acquire_lock
    fi
    
    # Write to temp file first (atomic write)
    echo "$status_line" > "$TEMP_FILE"
    
    # Verify temp file was written correctly
    if [ -f "$TEMP_FILE" ] && [ -s "$TEMP_FILE" ]; then
        # Move atomically
        mv -f "$TEMP_FILE" "$CODECHECK_STATUS_FILE"
        log_debug "Status file updated successfully: $status_line"
        
        # Verify final file
        if [ -f "$CODECHECK_STATUS_FILE" ]; then
            local actual_content=$(cat "$CODECHECK_STATUS_FILE")
            if [ "$actual_content" = "$status_line" ]; then
                log_debug "Status file verified: $actual_content"
                echo "✅ Status updated: $status_line"
            else
                log_debug "ERROR: Status file content mismatch!"
                echo "⚠️ Warning: Status file content mismatch"
            fi
        else
            log_debug "ERROR: Status file not found after update!"
            echo "❌ Error: Status file not created"
        fi
    else
        log_debug "ERROR: Failed to write temp file"
        echo "❌ Error: Failed to write status"
    fi
    
    # Release lock
    release_lock
}

# Function to verify status file is readable and current
verify_status() {
    if [ ! -f "$CODECHECK_STATUS_FILE" ]; then
        log_debug "Status file does not exist"
        return 1
    fi
    
    local content=$(cat "$CODECHECK_STATUS_FILE" 2>/dev/null || echo "")
    if [ -z "$content" ]; then
        log_debug "Status file is empty"
        return 1
    fi
    
    # Parse and validate format
    local IFS='|'
    read -r status timestamp errors warnings type_errors <<< "$content"
    
    if [ -z "$status" ] || [ -z "$timestamp" ]; then
        log_debug "Invalid status file format: $content"
        return 1
    fi
    
    # Check if timestamp is reasonable (within last 30 days)
    local current_time=$(date +%s)
    local max_age=$((30 * 24 * 60 * 60))  # 30 days in seconds
    
    if ! [[ "$timestamp" =~ ^[0-9]+$ ]]; then
        log_debug "Invalid timestamp: $timestamp"
        return 1
    fi
    
    local age=$((current_time - timestamp))
    if [ $age -gt $max_age ]; then
        log_debug "Status file is too old: ${age}s"
        return 1
    fi
    
    log_debug "Status file verified: $content (age: ${age}s)"
    echo "✅ Status verified: $status (${age}s old)"
    return 0
}

# Main execution
if [ $# -gt 0 ]; then
    # Check if first argument is a special command
    case "$1" in
        verify)
            verify_status
            ;;
        *)
            # Old-style invocation: script.sh <status> [errors] [warnings] [type_errors]
            STATUS="$1"
            ERRORS="${2:-0}"
            WARNINGS="${3:-0}"
            TYPE_ERRORS="${4:-0}"
            
            update_status "$STATUS" "$ERRORS" "$WARNINGS" "$TYPE_ERRORS"
            ;;
    esac
else
    echo "Usage: $0 <status> [errors] [warnings] [type_errors]"
    echo "       $0 verify"
    echo ""
    echo "Commands:"
    echo "  <status> - Update status (success|failed|running|unknown)"
    echo "  verify   - Verify status file is valid and current"
    echo ""
    echo "Parameters:"
    echo "  errors: number of errors (default: 0)"
    echo "  warnings: number of warnings (default: 0)"
    echo "  type_errors: number of TypeScript errors (default: 0)"
    exit 1
fi