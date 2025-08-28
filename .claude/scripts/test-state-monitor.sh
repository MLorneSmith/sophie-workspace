#!/bin/bash

# Test State Monitor Script
# Issue #267 Fix: Prevent test orchestrator stuck states
# This script monitors test execution and automatically cleans up stuck states

set -euo pipefail

# Configuration
readonly SCRIPT_NAME="test-state-monitor"
readonly MAX_EXECUTION_TIME=1800  # 30 minutes in seconds
readonly CHECK_INTERVAL=60        # Check every 60 seconds
readonly LOG_FILE="/tmp/${SCRIPT_NAME}.log"

# Get project root
readonly GIT_ROOT=$(git rev-parse --show-toplevel)
readonly STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
readonly RESULTS_FILE="/tmp/.claude_test_results.json"

# Logging function
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

# Check if test is currently running
is_test_running() {
    if [[ -f "$STATUS_FILE" ]]; then
        local status=$(cut -d'|' -f1 "$STATUS_FILE")
        [[ "$status" == "running" || "$status" == "initializing" ]]
    else
        false
    fi
}

# Get test start time from results file
get_test_start_time() {
    if [[ -f "$RESULTS_FILE" ]]; then
        # Try to parse JSON start time
        if command -v jq >/dev/null 2>&1; then
            jq -r '.startTime // empty' "$RESULTS_FILE" 2>/dev/null || echo ""
        else
            # Fallback: get file creation time
            stat -c %Y "$RESULTS_FILE" 2>/dev/null || echo ""
        fi
    else
        echo ""
    fi
}

# Get current timestamp
get_current_time() {
    date +%s
}

# Calculate elapsed time
get_elapsed_time() {
    local start_time="$1"
    local current_time=$(get_current_time)
    
    if [[ -n "$start_time" ]]; then
        echo $((current_time - start_time))
    else
        echo 0
    fi
}

# Check for stuck test processes
check_stuck_processes() {
    local stuck_processes=""
    
    # Check for playwright processes running > 30 minutes
    if command -v ps >/dev/null 2>&1; then
        local playwright_pids=$(pgrep -f playwright 2>/dev/null || true)
        if [[ -n "$playwright_pids" ]]; then
            for pid in $playwright_pids; do
                local elapsed=$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ' || echo "")
                if [[ -n "$elapsed" ]]; then
                    # Convert elapsed time to seconds (simplified check)
                    if [[ "$elapsed" =~ ^[0-9]+-.*$ ]] || [[ "$elapsed" =~ ^[2-9][0-9]:.* ]]; then
                        stuck_processes="$stuck_processes $pid"
                    fi
                fi
            done
        fi
    fi
    
    echo "$stuck_processes"
}

# Kill stuck test processes
kill_stuck_processes() {
    log "INFO" "Killing stuck test processes..."
    
    # Kill specific test-related processes
    pkill -f "playwright" >/dev/null 2>&1 || true
    pkill -f "test:shard" >/dev/null 2>&1 || true  
    pkill -f "vitest" >/dev/null 2>&1 || true
    pkill -f "next-server" >/dev/null 2>&1 || true
    
    # Clean up specific ports
    for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
        local pids=$(lsof -ti:"$port" 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            log "INFO" "Cleaning up port $port (PIDs: $pids)"
            kill -9 $pids >/dev/null 2>&1 || true
        fi
    done
    
    log "INFO" "Process cleanup completed"
}

# Mark test as timeout and cleanup
mark_test_timeout() {
    local current_time=$(get_current_time)
    
    # Update status file
    echo "timeout|${current_time}|0|0|0" > "$STATUS_FILE"
    log "WARN" "Updated status file: test marked as timeout"
    
    # Update results file if it exists
    if [[ -f "$RESULTS_FILE" ]]; then
        if command -v jq >/dev/null 2>&1; then
            local temp_file="${RESULTS_FILE}.tmp"
            jq '. + {status: "timeout", phase: "cleanup", timeoutAt: "'$current_time'"}' "$RESULTS_FILE" > "$temp_file" 2>/dev/null || true
            if [[ -f "$temp_file" ]]; then
                mv "$temp_file" "$RESULTS_FILE"
                log "INFO" "Updated results file: marked as timeout"
            fi
        fi
    fi
    
    # Kill stuck processes
    kill_stuck_processes
}

# Main monitoring function
monitor_test_state() {
    log "INFO" "Starting test state monitoring (PID: $$)"
    log "INFO" "Configuration: MAX_TIME=${MAX_EXECUTION_TIME}s, CHECK_INTERVAL=${CHECK_INTERVAL}s"
    
    while true; do
        if is_test_running; then
            local start_time=$(get_test_start_time)
            
            if [[ -n "$start_time" ]]; then
                local elapsed=$(get_elapsed_time "$start_time")
                log "INFO" "Test running for ${elapsed}s (max: ${MAX_EXECUTION_TIME}s)"
                
                if [[ $elapsed -gt $MAX_EXECUTION_TIME ]]; then
                    log "WARN" "Test execution exceeded maximum time (${elapsed}s > ${MAX_EXECUTION_TIME}s)"
                    
                    # Check for stuck processes
                    local stuck_pids=$(check_stuck_processes)
                    if [[ -n "$stuck_pids" ]]; then
                        log "WARN" "Stuck processes detected: $stuck_pids"
                    fi
                    
                    mark_test_timeout
                    log "ERROR" "Test orchestrator timeout detected and cleaned up"
                    break
                fi
            else
                log "WARN" "Test appears to be running but no start time found"
            fi
        else
            log "DEBUG" "No active test execution detected"
        fi
        
        sleep $CHECK_INTERVAL
    done
    
    log "INFO" "Test state monitoring completed"
}

# Handle signals gracefully
cleanup_monitor() {
    log "INFO" "Test state monitor shutting down gracefully"
    exit 0
}

# Standalone execution mode
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    trap cleanup_monitor SIGTERM SIGINT
    
    case "${1:-monitor}" in
        monitor)
            monitor_test_state
            ;;
        check)
            if is_test_running; then
                echo "Test is currently running"
                exit 0
            else
                echo "No test currently running"
                exit 1
            fi
            ;;
        cleanup)
            log "INFO" "Manual cleanup requested"
            mark_test_timeout
            ;;
        status)
            if [[ -f "$STATUS_FILE" ]]; then
                echo "Status file contents:"
                cat "$STATUS_FILE"
            else
                echo "No status file found"
            fi
            
            if [[ -f "$RESULTS_FILE" ]]; then
                echo "Results file exists ($(stat -c %s "$RESULTS_FILE") bytes)"
            else
                echo "No results file found"
            fi
            ;;
        *)
            echo "Usage: $0 [monitor|check|cleanup|status]"
            echo "  monitor  - Start monitoring (default)"
            echo "  check    - Check if test is running"  
            echo "  cleanup  - Force cleanup of stuck state"
            echo "  status   - Show current status files"
            exit 1
            ;;
    esac
fi