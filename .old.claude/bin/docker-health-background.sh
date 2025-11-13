#!/bin/bash

# Docker Health Background Process Management
# This module provides background process management functionality for Docker health monitoring
# It can be sourced into the main docker-health-wrapper.sh script or used standalone

# Set strict error handling if not already set
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    set -euo pipefail
fi

# ============================================================================
# BACKGROUND PROCESS MANAGEMENT FUNCTIONS
# ============================================================================

# Acquire PID file lock using flock with timeout
acquire_pid_lock() {
    local lock_file="$1"
    local timeout="${2:-$PID_LOCK_TIMEOUT}"

    debug "Acquiring PID lock on $lock_file with timeout ${timeout}s"

    # Create lock file descriptor
    exec 201>"$lock_file"

    # Try to acquire exclusive lock with timeout
    if timeout "$timeout" flock -x 201; then
        debug "PID lock acquired successfully"
        return 0
    else
        debug "Failed to acquire PID lock within ${timeout}s"
        exec 201>&-  # Close file descriptor
        return 1
    fi
}

# Release PID file lock
release_pid_lock() {
    debug "Releasing PID lock"

    # Release lock by closing file descriptor
    if exec 201>&-; then
        debug "PID lock released successfully"
        return 0
    else
        debug "Warning: Failed to release PID lock cleanly"
        return 1
    fi
}

# Write PID to file with locking
write_pid_file() {
    local pid="$1"

    debug "Writing PID $pid to file: $PID_FILE"

    # Acquire lock with timeout
    if ! acquire_pid_lock "$BACKGROUND_LOCK_FILE"; then
        error "Failed to acquire PID lock for write"
        return 1
    fi

    # Ensure we release lock on exit
    trap 'release_pid_lock' RETURN

    # Write PID to file
    if echo "$pid" > "$PID_FILE"; then
        debug "PID written successfully"
        return 0
    else
        error "Failed to write PID to file"
        return 1
    fi
}

# Read PID from file with validation
read_pid_file() {
    debug "Reading PID from file: $PID_FILE"

    if [ ! -f "$PID_FILE" ]; then
        debug "PID file does not exist"
        return 1
    fi

    # Acquire read lock with timeout
    if ! acquire_pid_lock "$BACKGROUND_LOCK_FILE"; then
        error "Failed to acquire PID lock for read"
        return 1
    fi

    # Ensure we release lock on exit
    trap 'release_pid_lock' RETURN

    # Read PID from file
    local pid
    if pid=$(cat "$PID_FILE" 2>/dev/null); then
        # Validate PID is numeric
        if [[ "$pid" =~ ^[0-9]+$ ]]; then
            echo "$pid"
            return 0
        else
            error "Invalid PID format in file: $pid"
            return 1
        fi
    else
        error "Failed to read PID file"
        return 1
    fi
}

# Check if process is running by PID
is_process_running() {
    local pid="$1"

    debug "Checking if process $pid is running"

    if [ -z "$pid" ]; then
        debug "No PID provided"
        return 1
    fi

    # Check if PID is valid and running
    if kill -0 "$pid" 2>/dev/null; then
        debug "Process $pid is running"
        return 0
    else
        debug "Process $pid is not running"
        return 1
    fi
}

# Check if background monitor is running
is_monitor_running() {
    debug "Checking if background monitor is running"

    local pid
    if pid=$(read_pid_file 2>/dev/null); then
        if is_process_running "$pid"; then
            debug "Background monitor is running with PID $pid"
            return 0
        else
            debug "PID file exists but process is not running"
            # Clean up stale PID file
            rm -f "$PID_FILE" 2>/dev/null || true
            return 1
        fi
    else
        debug "No PID file found"
        return 1
    fi
}

# Stop background monitor gracefully
stop_background_monitor() {
    debug "Stopping background monitor"

    local pid
    if pid=$(read_pid_file 2>/dev/null); then
        if is_process_running "$pid"; then
            info "Stopping background monitor (PID: $pid)"

            # Send TERM signal first
            if kill -TERM "$pid" 2>/dev/null; then
                # Wait up to 10 seconds for graceful shutdown
                local wait_count=0
                while [ $wait_count -lt 10 ] && is_process_running "$pid"; do
                    sleep 1
                    wait_count=$((wait_count + 1))
                done

                # Check if process stopped gracefully
                if ! is_process_running "$pid"; then
                    info "Background monitor stopped gracefully"
                else
                    warn "Process did not stop gracefully, using KILL signal"
                    kill -KILL "$pid" 2>/dev/null || true
                    sleep 1
                fi
            else
                warn "Failed to send TERM signal to process $pid"
                return 1
            fi
        else
            debug "Process with PID $pid is not running"
        fi
    else
        debug "No background monitor PID file found"
    fi

    # Clean up PID file
    rm -f "$PID_FILE" 2>/dev/null || true
    rm -f "$BACKGROUND_LOCK_FILE" 2>/dev/null || true

    return 0
}

# Background monitoring loop function
background_monitor_loop() {
    debug "Starting background monitor loop with ${MONITOR_INTERVAL}s interval"

    # Set up signal handlers for graceful shutdown
    trap 'debug "Received TERM signal, shutting down gracefully"; exit 0' TERM
    trap 'debug "Received INT signal, shutting down gracefully"; exit 0' INT

    local iteration=0

    # Give the parent process time to write PID file
    sleep 1

    while true; do
        iteration=$((iteration + 1))
        debug "Background monitor iteration $iteration"

        # Check if we should exit (in case PID file is removed)
        # But skip the check on first iteration to avoid race conditions
        if [ $iteration -gt 1 ] && [ ! -f "$PID_FILE" ]; then
            debug "PID file removed, exiting background monitor"
            exit 0
        fi

        # Perform health check if Docker is available
        if check_docker_daemon >/dev/null 2>&1; then
            debug "Docker daemon accessible, updating health status"

            # Get container statistics
            get_container_stats >/dev/null 2>&1

            # Write status with current stats
            write_status "true" "$DOCKER_TYPE" "$CONTAINER_TOTAL" "$CONTAINER_RUNNING" "$CONTAINER_HEALTHY" "$CONTAINER_UNHEALTHY" "$CONTAINER_UNKNOWN" >/dev/null 2>&1

            debug "Health status updated: $CONTAINER_TOTAL containers, $CONTAINER_HEALTHY healthy"
        else
            debug "Docker daemon not accessible, marking as down"
            write_status "false" "unknown" "0" "0" "0" "0" "0" >/dev/null 2>&1
        fi

        # Sleep for the configured interval
        sleep "$MONITOR_INTERVAL"
    done
}

# Start background monitor process
start_background_monitor() {
    debug "Starting background monitor"

    # Check if already running
    if is_monitor_running; then
        local pid
        pid=$(read_pid_file)
        warn "Background monitor is already running (PID: $pid)"
        return 0
    fi

    # Start background process
    info "Starting background Docker health monitor (interval: ${MONITOR_INTERVAL}s)"

    # Fork background process and capture PID
    (
        # Run the background loop
        background_monitor_loop
    ) &

    local bg_pid=$!

    # Write PID to file
    if write_pid_file "$bg_pid"; then
        info "Background monitor started with PID: $bg_pid"

        # Give process a moment to start up (reduced from 1s to avoid race condition)
        sleep 2

        # Verify it's still running
        if is_process_running "$bg_pid"; then
            info "Background monitor is running successfully"
            return 0
        else
            error "Background monitor failed to start or died immediately"
            rm -f "$PID_FILE" 2>/dev/null || true
            return 1
        fi
    else
        error "Failed to write PID file for background monitor"
        kill "$bg_pid" 2>/dev/null || true
        return 1
    fi
}

# Restart background monitor if needed
restart_monitor_if_needed() {
    debug "Checking if monitor restart is needed"

    if is_monitor_running; then
        debug "Background monitor is running, no restart needed"
        return 0
    else
        info "Background monitor is not running, starting it"
        start_background_monitor
        return $?
    fi
}

# Clean up background process files
cleanup_background_files() {
    debug "Cleaning up background process files"

    # Remove PID file and lock files
    rm -f "$PID_FILE" 2>/dev/null || true
    rm -f "$BACKGROUND_LOCK_FILE" 2>/dev/null || true

    debug "Background files cleanup completed"
}

# Get background monitor status
get_monitor_status() {
    debug "Getting background monitor status"

    local status_json
    local pid=""
    local running=false
    local uptime=""
    local last_update=""

    # Check if monitor is running
    if pid=$(read_pid_file 2>/dev/null); then
        if is_process_running "$pid"; then
            running=true

            # Get process start time if available
            if command -v ps >/dev/null 2>&1; then
                uptime=$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ' || echo "unknown")
            fi
        fi
    fi

    # Get last status update time
    if [ -f "$STATUS_FILE" ]; then
        if command -v jq >/dev/null 2>&1; then
            last_update=$(jq -r '.last_check // "unknown"' "$STATUS_FILE" 2>/dev/null || echo "unknown")
        else
            last_update=$(grep '"last_check"' "$STATUS_FILE" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
        fi
    fi

    # Create status JSON
    if command -v jq >/dev/null 2>&1; then
        status_json=$(jq -n \
            --arg pid "$pid" \
            --argjson running "$running" \
            --arg uptime "$uptime" \
            --arg last_update "$last_update" \
            --argjson interval "$MONITOR_INTERVAL" \
            '{
                pid: $pid,
                running: $running,
                uptime: $uptime,
                last_update: $last_update,
                interval_seconds: $interval,
                pid_file: "'$PID_FILE'",
                lock_file: "'$BACKGROUND_LOCK_FILE'"
            }')
    else
        # Fallback JSON construction
        status_json=$(cat << EOF
{
    "pid": "$pid",
    "running": $running,
    "uptime": "$uptime",
    "last_update": "$last_update",
    "interval_seconds": $MONITOR_INTERVAL,
    "pid_file": "$PID_FILE",
    "lock_file": "$BACKGROUND_LOCK_FILE"
}
EOF
)
    fi

    echo "$status_json"
    return 0
}

# Test background process management functions
test_background_management() {
    info "Testing background process management"

    local test_results=()
    local total_tests=0
    local passed_tests=0

    # Test 1: PID file operations
    info "Test 1: PID file operations"
    total_tests=$((total_tests + 1))

    # Test writing and reading PID
    local test_pid=12345
    if write_pid_file "$test_pid"; then
        local read_pid
        if read_pid=$(read_pid_file); then
            if [ "$read_pid" = "$test_pid" ]; then
                info "  ✓ PID file write/read operations successful"
                passed_tests=$((passed_tests + 1))
                test_results+=("PID file operations: PASS")
            else
                error "  ✗ PID mismatch: wrote $test_pid, read $read_pid"
                test_results+=("PID file operations: FAIL")
            fi
        else
            error "  ✗ Failed to read PID file"
            test_results+=("PID file operations: FAIL")
        fi
    else
        error "  ✗ Failed to write PID file"
        test_results+=("PID file operations: FAIL")
    fi

    # Clean up test PID file
    rm -f "$PID_FILE" 2>/dev/null || true

    # Test 2: Process detection
    info "Test 2: Process detection"
    total_tests=$((total_tests + 1))

    # Test with current process (should be running)
    local current_pid=$$
    if is_process_running "$current_pid"; then
        # Test with non-existent PID (should not be running)
        local fake_pid=999999
        if ! is_process_running "$fake_pid"; then
            info "  ✓ Process detection working correctly"
            passed_tests=$((passed_tests + 1))
            test_results+=("Process detection: PASS")
        else
            error "  ✗ False positive: non-existent process detected as running"
            test_results+=("Process detection: FAIL")
        fi
    else
        error "  ✗ Current process not detected as running"
        test_results+=("Process detection: FAIL")
    fi

    # Test 3: Monitor status when not running
    info "Test 3: Monitor status when not running"
    total_tests=$((total_tests + 1))

    if ! is_monitor_running; then
        info "  ✓ Correctly detected monitor not running"
        passed_tests=$((passed_tests + 1))
        test_results+=("Monitor status detection: PASS")
    else
        error "  ✗ False positive: monitor detected as running when not started"
        test_results+=("Monitor status detection: FAIL")
    fi

    # Test 4: Status JSON generation
    info "Test 4: Status JSON generation"
    total_tests=$((total_tests + 1))

    local status_json
    if status_json=$(get_monitor_status); then
        # Validate JSON structure
        if command -v jq >/dev/null 2>&1; then
            if echo "$status_json" | jq . >/dev/null 2>&1; then
                local required_fields=("pid" "running" "uptime" "last_update" "interval_seconds")
                local all_present=true

                for field in "${required_fields[@]}"; do
                    if ! echo "$status_json" | jq -e ".$field" >/dev/null 2>&1; then
                        error "  ✗ Missing required field: $field"
                        all_present=false
                    fi
                done

                if [ "$all_present" = true ]; then
                    info "  ✓ Status JSON generated successfully"
                    passed_tests=$((passed_tests + 1))
                    test_results+=("Status JSON generation: PASS")
                else
                    test_results+=("Status JSON generation: FAIL")
                fi
            else
                error "  ✗ Invalid JSON generated"
                test_results+=("Status JSON generation: FAIL")
            fi
        else
            info "  ✓ Status JSON generated (jq not available for validation)"
            passed_tests=$((passed_tests + 1))
            test_results+=("Status JSON generation: PASS")
        fi
    else
        error "  ✗ Failed to generate status JSON"
        test_results+=("Status JSON generation: FAIL")
    fi

    # Display results
    info "Background Management Test Results:"
    for result in "${test_results[@]}"; do
        if echo "$result" | grep -q "FAIL"; then
            error "  $result"
        else
            info "  $result"
        fi
    done

    # Overall result
    local success_rate=0
    if [ "$total_tests" -gt 0 ]; then
        success_rate=$(( (passed_tests * 100) / total_tests ))
    fi

    if [ "$passed_tests" -eq "$total_tests" ]; then
        info "All background management tests passed! ($passed_tests/$total_tests, ${success_rate}%)"
        return 0
    else
        error "Some background management tests failed: $passed_tests/$total_tests passed (${success_rate}%)"
        return 1
    fi
}

# ============================================================================
# STANDALONE SCRIPT FUNCTIONALITY
# ============================================================================

# Show help for standalone usage
show_background_help() {
    cat << EOF
docker-health-background.sh - Background Process Management for Docker Health Monitoring

USAGE:
    docker-health-background.sh [OPTIONS] [OPERATION]

DESCRIPTION:
    Manages background processes for Docker health monitoring.
    This script can be sourced into other scripts or used standalone.

OPTIONS:
    -h, --help      Show this help message and exit
    -d, --debug     Enable debug output
    -v, --version   Show version information and exit

OPERATIONS:
    start           Start background monitor
    stop            Stop background monitor
    restart         Restart background monitor
    status          Show monitor status
    test            Run background management tests

ENVIRONMENT VARIABLES:
    PID_FILE              Path to PID file
    BACKGROUND_LOCK_FILE  Path to lock file
    MONITOR_INTERVAL      Monitor interval in seconds (default: 30)
    PID_LOCK_TIMEOUT      PID lock timeout in seconds (default: 5)

EXAMPLES:
    docker-health-background.sh start
    docker-health-background.sh --debug status
    docker-health-background.sh stop

EOF
}

# Main function for standalone usage
main_background() {
    # Set defaults if not already set
    DEBUG="${DEBUG:-0}"
    MONITOR_INTERVAL="${MONITOR_INTERVAL:-30}"
    PID_LOCK_TIMEOUT="${PID_LOCK_TIMEOUT:-5}"

    # Set default file paths if not provided
    if [ -z "${PID_FILE:-}" ]; then
        local project_root="${PROJECT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
        local git_root_hash="$(echo "${project_root}" | sha256sum | cut -d' ' -f1 | head -c16)"
        PID_FILE="/tmp/.claude_docker_pid_${git_root_hash}"
        BACKGROUND_LOCK_FILE="/tmp/.claude_docker_bg_lock_${git_root_hash}"
        STATUS_FILE="/tmp/.claude_docker_status_${git_root_hash}"
    fi

    # Define logging functions if not already defined
    if ! command -v debug >/dev/null 2>&1; then
        debug() { [ "$DEBUG" = "1" ] && echo "[DEBUG] $*" >&2; }
        info() { echo "[INFO] $*" >&2; }
        warn() { echo "[WARN] $*" >&2; }
        error() { echo "[ERROR] $*" >&2; }
    fi

    # Define required functions stubs if not available
    if ! command -v check_docker_daemon >/dev/null 2>&1; then
        check_docker_daemon() { command -v docker >/dev/null 2>&1 && docker version >/dev/null 2>&1; }
        get_container_stats() {
            export CONTAINER_TOTAL=0 CONTAINER_RUNNING=0 CONTAINER_HEALTHY=0 CONTAINER_UNHEALTHY=0 CONTAINER_UNKNOWN=0
        }
        write_status() { debug "Stub write_status called with: $*"; }
    fi

    # Parse arguments
    local operation=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_background_help
                exit 0
                ;;
            --debug|-d)
                DEBUG=1
                shift
                ;;
            --version|-v)
                echo "docker-health-background.sh version 1.0.0"
                exit 0
                ;;
            start|stop|restart|status|test)
                operation="$1"
                shift
                ;;
            *)
                error "Unknown option: $1"
                show_background_help
                exit 1
                ;;
        esac
    done

    # Execute operation
    case "$operation" in
        "start")
            start_background_monitor
            ;;
        "stop")
            stop_background_monitor
            ;;
        "restart")
            stop_background_monitor
            sleep 2
            start_background_monitor
            ;;
        "status")
            get_monitor_status
            ;;
        "test")
            test_background_management
            ;;
        *)
            error "No operation specified. Use --help for usage information."
            exit 1
            ;;
    esac
}

# Execute main function if script is run directly (not sourced)
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main_background "$@"
fi