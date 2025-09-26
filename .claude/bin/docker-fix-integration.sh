#!/bin/bash

# Docker Fix Integration Patterns
# Enhanced error handling and workflow integration for docker-fix-command.sh
# Usage: source docker-fix-integration.sh

# This file provides enhanced error handling patterns and integration hooks
# for the docker-fix-command.sh system

# Error handling patterns
DOCKER_FIX_ERROR_HANDLERS=()
DOCKER_FIX_RETRY_COUNT=3
DOCKER_FIX_RETRY_DELAY=2

# Enhanced error handling with retry logic
docker_fix_with_retry() {
    local operation="$1"
    local max_retries="${2:-$DOCKER_FIX_RETRY_COUNT}"
    local delay="${3:-$DOCKER_FIX_RETRY_DELAY}"
    
    local attempt=1
    local last_exit_code=0
    
    while [[ $attempt -le $max_retries ]]; do
        echo "[Attempt $attempt/$max_retries] Executing: $operation" >&2
        
        if eval "$operation"; then
            echo "Operation succeeded on attempt $attempt" >&2
            return 0
        else
            last_exit_code=$?
            echo "Operation failed on attempt $attempt (exit code: $last_exit_code)" >&2
            
            if [[ $attempt -lt $max_retries ]]; then
                echo "Retrying in $delay seconds..." >&2
                sleep "$delay"
                # Exponential backoff
                delay=$((delay * 2))
            fi
        fi
        
        ((attempt++))
    done
    
    echo "Operation failed after $max_retries attempts" >&2
    return $last_exit_code
}

# Progress tracking with callbacks
docker_fix_progress_callback() {
    local stage="$1"
    local message="$2"
    local percentage="${3:-}"
    
    # Call registered progress handlers
    for handler in "${DOCKER_FIX_PROGRESS_HANDLERS[@]:-}"; do
        if command -v "$handler" >/dev/null 2>&1; then
            "$handler" "$stage" "$message" "$percentage"
        fi
    done
    
    # Default progress display
    if [[ -n "$percentage" ]]; then
        printf "\r[%3d%%] %s: %s" "$percentage" "$stage" "$message" >&2
    else
        printf "\r       %s: %s" "$stage" "$message" >&2
    fi
}

# Error recovery strategies
docker_fix_error_recovery() {
    local error_type="$1"
    local error_context="$2"
    
    case "$error_type" in
        "docker_timeout")
            echo "Recovering from Docker timeout..." >&2
            # Clear any hanging Docker operations
            docker system prune -f >/dev/null 2>&1 || true
            ;;
        "permission_error")
            echo "Attempting permission recovery..." >&2
            # Clear temp files that might have wrong permissions
            rm -f /tmp/.claude_docker_*lock* 2>/dev/null || true
            ;;
        "daemon_error")
            echo "Attempting daemon recovery..." >&2
            # Wait for daemon to stabilize
            sleep 5
            ;;
        "network_error")
            echo "Recovering from network error..." >&2
            # Reset Docker network settings
            docker network prune -f >/dev/null 2>&1 || true
            ;;
        *)
            echo "Generic error recovery for: $error_type" >&2
            ;;
    esac
}

# Health status validation
validate_docker_health_status() {
    local status_json="$1"
    
    # Validate JSON structure
    if ! echo "$status_json" | jq empty 2>/dev/null; then
        echo "Invalid JSON in health status" >&2
        return 1
    fi
    
    # Check required fields
    local required_fields=("docker_running" "timestamp")
    for field in "${required_fields[@]}"; do
        if ! echo "$status_json" | jq -e ".${field}" >/dev/null 2>&1; then
            echo "Missing required field: $field" >&2
            return 1
        fi
    done
    
    # Validate timestamp is recent (within last hour)
    local timestamp
    timestamp="$(echo "$status_json" | jq -r '.timestamp // 0')"
    local current_time
    current_time="$(date +%s)"
    local age=$((current_time - timestamp))
    
    if [[ $age -gt 3600 ]]; then
        echo "Health status is stale (age: ${age}s)" >&2
        return 1
    fi
    
    return 0
}

# Resource constraint detection
detect_resource_constraints() {
    local constraints="[]"
    
    # Check disk space
    local disk_usage
    disk_usage="$(df /tmp | awk 'NR==2 {print $5}' | sed 's/%//')"
    if [[ $disk_usage -gt 90 ]]; then
        constraints="$(echo "$constraints" | jq '. + [{"type":"disk_space","severity":"high","usage":'"+$disk_usage+'"}]')"
    fi
    
    # Check memory usage
    if command -v free >/dev/null 2>&1; then
        local memory_usage
        memory_usage="$(free | awk 'NR==2{printf "%.0f", $3*100/$2 }')"
        if [[ $memory_usage -gt 90 ]]; then
            constraints="$(echo "$constraints" | jq '. + [{"type":"memory","severity":"high","usage":'"+$memory_usage+'"}]')"
        fi
    fi
    
    # Check load average
    if command -v uptime >/dev/null 2>&1; then
        local load_avg
        load_avg="$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')"
        local cpu_count
        cpu_count="$(nproc 2>/dev/null || echo 1)"
        local load_percentage
        load_percentage="$(echo "$load_avg $cpu_count" | awk '{printf "%.0f", ($1/$2)*100}')"
        
        if [[ $load_percentage -gt 200 ]]; then
            constraints="$(echo "$constraints" | jq '. + [{"type":"cpu_load","severity":"high","load":'"+$load_percentage+'"}]')"
        fi
    fi
    
    echo "$constraints"
}

# Graceful degradation patterns
docker_fix_graceful_degradation() {
    local preferred_operation="$1"
    local fallback_operations=("${@:2}")
    
    echo "Attempting preferred operation: $preferred_operation" >&2
    
    if eval "$preferred_operation"; then
        return 0
    fi
    
    echo "Preferred operation failed, trying fallbacks..." >&2
    
    for fallback in "${fallback_operations[@]}"; do
        echo "Trying fallback: $fallback" >&2
        if eval "$fallback"; then
            echo "Fallback succeeded: $fallback" >&2
            return 0
        fi
    done
    
    echo "All operations failed including fallbacks" >&2
    return 1
}

# Integration with existing docker-health infrastructure
integrate_with_docker_health() {
    local health_wrapper_path="$1"
    
    if [[ ! -x "$health_wrapper_path" ]]; then
        echo "Docker health wrapper not found: $health_wrapper_path" >&2
        return 1
    fi
    
    # Test integration
    if "$health_wrapper_path" test >/dev/null 2>&1; then
        echo "Docker health wrapper integration successful" >&2
        export DOCKER_FIX_HEALTH_WRAPPER="$health_wrapper_path"
        return 0
    else
        echo "Docker health wrapper tests failed" >&2
        return 1
    fi
}

# Performance optimization patterns
optimize_docker_operations() {
    # Set optimal Docker CLI configuration
    export DOCKER_CLI_HINTS=false
    export DOCKER_BUILDKIT=1
    
    # Configure optimal timeouts
    export DOCKER_CLIENT_TIMEOUT=60
    export COMPOSE_HTTP_TIMEOUT=60
    
    # Enable Docker context optimization
    if docker context ls >/dev/null 2>&1; then
        local current_context
        current_context="$(docker context show)"
        echo "Using Docker context: $current_context" >&2
    fi
}

# Concurrent operation handling
docker_fix_concurrent_lock() {
    local lock_file="$1"
    local timeout="${2:-30}"
    local lock_fd=200
    
    # Open lock file
    exec 200>"$lock_file"
    
    # Try to acquire exclusive lock with timeout
    if timeout "$timeout" flock -x 200; then
        echo "Lock acquired: $lock_file" >&2
        return 0
    else
        echo "Failed to acquire lock: $lock_file (timeout: ${timeout}s)" >&2
        exec 200>&-
        return 1
    fi
}

docker_fix_concurrent_unlock() {
    local lock_fd=200
    
    # Release lock
    exec 200>&-
    echo "Lock released" >&2
}

# Monitoring and metrics collection
collect_docker_fix_metrics() {
    local operation="$1"
    local start_time="$2"
    local end_time="$3"
    local exit_code="$4"
    
    local duration=$((end_time - start_time))
    local metrics_file="/tmp/.claude_docker_fix_metrics_$(echo "$PWD" | sha256sum | cut -d' ' -f1 | head -c16)"
    
    local metric_entry
    metric_entry="$(jq -n \
        --arg op "$operation" \
        --arg duration "$duration" \
        --arg exit_code "$exit_code" \
        --arg timestamp "$(date -Iseconds)" \
        '{
            operation: $op,
            duration_ms: ($duration | tonumber),
            exit_code: ($exit_code | tonumber),
            timestamp: $timestamp
        }')"
    
    # Append to metrics file
    echo "$metric_entry" >> "$metrics_file"
    
    # Keep only last 100 entries
    if [[ -f "$metrics_file" ]]; then
        tail -n 100 "$metrics_file" > "${metrics_file}.tmp" && mv "${metrics_file}.tmp" "$metrics_file"
    fi
}

# Enhanced logging with structured data
docker_fix_structured_log() {
    local level="$1"
    local component="$2"
    local message="$3"
    local context="${4:-{}}"
    
    local log_entry
    log_entry="$(jq -n \
        --arg level "$level" \
        --arg component "$component" \
        --arg message "$message" \
        --argjson context "$context" \
        --arg timestamp "$(date -Iseconds)" \
        '{
            level: $level,
            component: $component,
            message: $message,
            context: $context,
            timestamp: $timestamp
        }')"
    
    # Output structured log
    echo "$log_entry" >&2
}

# Platform-specific optimizations
apply_platform_optimizations() {
    local platform="$(uname)"
    
    case "$platform" in
        "Linux")
            # Linux-specific optimizations
            if [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
                echo "Applying WSL2 optimizations" >&2
                # WSL2-specific settings
                export DOCKER_HOST="unix:///var/run/docker.sock"
            fi
            ;;
        "Darwin")
            # macOS-specific optimizations
            echo "Applying macOS optimizations" >&2
            # Use Docker Desktop context
            export DOCKER_HOST="unix:///var/run/docker.sock"
            ;;
        "MINGW"*|"CYGWIN"*)
            # Windows-specific optimizations
            echo "Applying Windows optimizations" >&2
            # Windows Docker Desktop settings
            ;;
    esac
}

# Health check aggregation
aggregate_health_status() {
    local individual_statuses="$1"
    
    local aggregated
    aggregated="$(echo "$individual_statuses" | jq '{
        overall_health: (if all(.[]; .healthy == true) then "healthy" 
                        elif any(.[]; .healthy == true) then "partial" 
                        else "unhealthy" end),
        total_services: length,
        healthy_services: [.[] | select(.healthy == true)] | length,
        unhealthy_services: [.[] | select(.healthy == false)] | length,
        last_updated: max(.[].timestamp),
        summary: group_by(.health_status) | map({status: .[0].health_status, count: length})
    }')"
    
    echo "$aggregated"
}

# Export all functions for use in other scripts
export -f docker_fix_with_retry
export -f docker_fix_progress_callback
export -f docker_fix_error_recovery
export -f validate_docker_health_status
export -f detect_resource_constraints
export -f docker_fix_graceful_degradation
export -f integrate_with_docker_health
export -f optimize_docker_operations
export -f docker_fix_concurrent_lock
export -f docker_fix_concurrent_unlock
export -f collect_docker_fix_metrics
export -f docker_fix_structured_log
export -f apply_platform_optimizations
export -f aggregate_health_status

# Initialize optimizations when sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    apply_platform_optimizations
    optimize_docker_operations
    echo "Docker fix integration patterns loaded" >&2
fi
