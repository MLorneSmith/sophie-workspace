#!/bin/bash

# Docker Fix Command - Optimized Infrastructure Tool
# Integrates with docker-health-wrapper.sh for diagnosis-driven fixing
# Usage: docker-fix-command.sh [--help] [--debug] [--dry-run] [operation]

set -euo pipefail

# Script metadata
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Integration with docker-health-wrapper.sh
readonly HEALTH_WRAPPER="${SCRIPT_DIR}/docker-health-wrapper.sh"
readonly PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
readonly GIT_ROOT_HASH="$(echo "${PROJECT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)"

# Exit codes (aligned with docker-health-wrapper.sh)
readonly EXIT_SUCCESS=0
readonly EXIT_ERROR=1
readonly EXIT_DOCKER_NOT_FOUND=2
readonly EXIT_INVALID_ARGS=3
readonly EXIT_PERMISSION_ERROR=4
readonly EXIT_DOCKER_DAEMON_STOPPED=5
readonly EXIT_DOCKER_TIMEOUT=6
readonly EXIT_FIX_FAILED=7
readonly EXIT_FIX_PARTIAL=8

# Configuration
readonly DEBUG="${CLAUDE_DEBUG:-${DEBUG:-0}}"
readonly VERBOSE="${CLAUDE_VERBOSE:-${VERBOSE:-0}}"
readonly DRY_RUN="${DOCKER_FIX_DRY_RUN:-0}"

# Status and cache files (reuse existing infrastructure)
readonly STATUS_FILE="/tmp/.claude_docker_status_${GIT_ROOT_HASH}"
readonly FIX_LOG_FILE="/tmp/.claude_docker_fix_log_${GIT_ROOT_HASH}"
readonly FIX_STATE_FILE="/tmp/.claude_docker_fix_state_${GIT_ROOT_HASH}"

# Logging functions
debug() {
    if [[ "$DEBUG" == "1" ]]; then
        echo "[DEBUG] $*" >&2
    fi
}

info() {
    echo "[INFO] $*" >&2
}

warn() {
    echo "[WARN] $*" >&2
}

error() {
    echo "[ERROR] $*" >&2
}

log_fix() {
    local timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    echo "[$timestamp] $*" >> "$FIX_LOG_FILE"
}

# Performance optimization: Cache health status for 10 seconds during fix operations
get_cached_health_status() {
    local cache_file="/tmp/.claude_docker_fix_cache_${GIT_ROOT_HASH}"
    local cache_ttl=10
    
    if [[ -f "$cache_file" ]] && [[ $(($(date +%s) - $(stat -c %Y "$cache_file" 2>/dev/null || echo 0))) -lt $cache_ttl ]]; then
        cat "$cache_file"
        return 0
    fi
    
    # Use docker-health-wrapper for fresh status
    if [[ -x "$HEALTH_WRAPPER" ]]; then
        local status
        if status="$("$HEALTH_WRAPPER" health-check 2>/dev/null)"; then
            echo "$status" > "$cache_file"
            echo "$status"
            return 0
        fi
    fi
    
    # Fallback: basic docker check
    if docker info >/dev/null 2>&1; then
        echo '{"docker_running":true,"basic_check":true}'
    else
        echo '{"docker_running":false,"basic_check":true}'
    fi
}

# Efficient Docker environment detection
detect_docker_environment() {
    debug "Detecting Docker environment"
    
    local env_info="{}"
    
    # Check Docker Desktop (Windows/macOS)
    if command -v docker >/dev/null 2>&1; then
        local docker_version
        if docker_version="$(docker version --format '{{.Client.Platform.Name}}' 2>/dev/null)"; then
            env_info="$(echo "$env_info" | jq --arg platform "$docker_version" '. + {platform: $platform}')"
        fi
    fi
    
    # Check WSL2 environment
    if [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -q microsoft /proc/version 2>/dev/null; then
        env_info="$(echo "$env_info" | jq '. + {wsl2: true}')"
    fi
    
    # Check Docker context
    if command -v docker >/dev/null 2>&1; then
        local context
        if context="$(docker context show 2>/dev/null)"; then
            env_info="$(echo "$env_info" | jq --arg ctx "$context" '. + {context: $ctx}')"
        fi
    fi
    
    echo "$env_info"
}

# Comprehensive Docker issue diagnosis
diagnose_docker_issues() {
    debug "Running comprehensive Docker diagnosis"
    
    local issues="[]"
    local fixes="[]"
    
    # 1. Check if Docker command exists
    if ! command -v docker >/dev/null 2>&1; then
        issues="$(echo "$issues" | jq '. + [{"type":"missing_docker","severity":"critical","description":"Docker command not found"}]')"
        fixes="$(echo "$fixes" | jq '. + [{"type":"install_docker","description":"Install Docker Engine or Docker Desktop","automated":false}]')"
    fi
    
    # 2. Check Docker daemon connectivity
    if command -v docker >/dev/null 2>&1; then
        if ! docker info >/dev/null 2>&1; then
            local docker_exit_code=$?
            case $docker_exit_code in
                1)
                    issues="$(echo "$issues" | jq '. + [{"type":"daemon_not_running","severity":"high","description":"Docker daemon not running"}]')"
                    fixes="$(echo "$fixes" | jq '. + [{"type":"start_daemon","description":"Start Docker daemon/service","automated":true}]')"
                    ;;
                *)
                    issues="$(echo "$issues" | jq --arg code "$docker_exit_code" '. + [{"type":"daemon_error","severity":"high","description":"Docker daemon error","exit_code":($code|tonumber)}]')"
                    fixes="$(echo "$fixes" | jq '. + [{"type":"restart_daemon","description":"Restart Docker daemon","automated":true}]')"
                    ;;
            esac
        fi
    fi
    
    # 3. Check Docker permissions (Linux)
    if command -v docker >/dev/null 2>&1 && [[ "$(uname)" == "Linux" ]]; then
        if ! docker ps >/dev/null 2>&1 && [[ $? -eq 1 ]]; then
            # Check if it's a permission issue vs daemon issue
            if sudo docker ps >/dev/null 2>&1; then
                issues="$(echo "$issues" | jq '. + [{"type":"permission_denied","severity":"medium","description":"Docker requires sudo access"}]')"
                fixes="$(echo "$fixes" | jq '. + [{"type":"fix_permissions","description":"Add user to docker group","automated":true}]')"
            fi
        fi
    fi
    
    # 4. Check Docker Compose availability
    if command -v docker >/dev/null 2>&1; then
        if ! docker compose version >/dev/null 2>&1 && ! docker-compose --version >/dev/null 2>&1; then
            issues="$(echo "$issues" | jq '. + [{"type":"compose_missing","severity":"low","description":"Docker Compose not available"}]')"
            fixes="$(echo "$fixes" | jq '. + [{"type":"install_compose","description":"Install Docker Compose","automated":false}]')"
        fi
    fi
    
    # 5. Use docker-health-wrapper for advanced diagnosis
    if [[ -x "$HEALTH_WRAPPER" ]]; then
        local health_status
        if health_status="$("$HEALTH_WRAPPER" health-check 2>/dev/null)"; then
            # Extract issues from health check
            local unhealthy_count
            if unhealthy_count="$(echo "$health_status" | jq -r '.containers.unhealthy // 0' 2>/dev/null)"; then
                if [[ "$unhealthy_count" -gt 0 ]]; then
                    issues="$(echo "$issues" | jq --arg count "$unhealthy_count" '. + [{"type":"unhealthy_containers","severity":"medium","description":"Unhealthy containers detected","count":($count|tonumber)}]')"
                    fixes="$(echo "$fixes" | jq '. + [{"type":"restart_unhealthy","description":"Restart unhealthy containers","automated":true}]')"
                fi
            fi
        fi
    fi
    
    # 6. Check for resource constraints
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        local docker_info
        if docker_info="$(docker system df --format json 2>/dev/null)"; then
            # Check for disk space issues
            local total_size
            if total_size="$(echo "$docker_info" | jq -r '.Images[0].Size // "0B"' 2>/dev/null)"; then
                debug "Docker disk usage: $total_size"
            fi
        fi
    fi
    
    # Combine results
    local diagnosis
    diagnosis="$(jq -n --argjson issues "$issues" --argjson fixes "$fixes" '{
        issues: $issues,
        fixes: $fixes,
        timestamp: now,
        environment: {}
    }')"
    
    # Add environment info
    local env_info
    env_info="$(detect_docker_environment)"
    diagnosis="$(echo "$diagnosis" | jq --argjson env "$env_info" '.environment = $env')"
    
    echo "$diagnosis"
}

# Automated fix implementations
apply_automated_fixes() {
    local diagnosis="$1"
    local applied_fixes="[]"
    local failed_fixes="[]"
    
    debug "Applying automated fixes"
    
    # Extract automated fixes
    local automated_fixes
    automated_fixes="$(echo "$diagnosis" | jq -r '.fixes[] | select(.automated == true) | .type' 2>/dev/null || echo "")"
    
    while IFS= read -r fix_type; do
        [[ -z "$fix_type" ]] && continue
        
        info "Applying fix: $fix_type"
        log_fix "Attempting fix: $fix_type"
        
        local fix_success=false
        
        case "$fix_type" in
            "start_daemon")
                if apply_start_daemon_fix; then
                    fix_success=true
                fi
                ;;
            "restart_daemon")
                if apply_restart_daemon_fix; then
                    fix_success=true
                fi
                ;;
            "fix_permissions")
                if apply_fix_permissions; then
                    fix_success=true
                fi
                ;;
            "restart_unhealthy")
                if apply_restart_unhealthy_containers; then
                    fix_success=true
                fi
                ;;
            *)
                warn "Unknown fix type: $fix_type"
                ;;
        esac
        
        if [[ "$fix_success" == "true" ]]; then
            applied_fixes="$(echo "$applied_fixes" | jq --arg type "$fix_type" '. + [$type]')"
            log_fix "Fix applied successfully: $fix_type"
        else
            failed_fixes="$(echo "$failed_fixes" | jq --arg type "$fix_type" '. + [$type]')"
            log_fix "Fix failed: $fix_type"
        fi
    done <<< "$automated_fixes"
    
    # Return results
    jq -n --argjson applied "$applied_fixes" --argjson failed "$failed_fixes" '{
        applied: $applied,
        failed: $failed,
        timestamp: now
    }'
}

# Individual fix implementations
apply_start_daemon_fix() {
    debug "Attempting to start Docker daemon"
    
    if [[ "$DRY_RUN" == "1" ]]; then
        info "[DRY RUN] Would start Docker daemon"
        return 0
    fi
    
    # Detect system and start appropriate service
    if command -v systemctl >/dev/null 2>&1; then
        # systemd systems
        if sudo systemctl start docker 2>/dev/null; then
            sleep 3
            if docker info >/dev/null 2>&1; then
                return 0
            fi
        fi
    elif command -v service >/dev/null 2>&1; then
        # SysV init systems
        if sudo service docker start 2>/dev/null; then
            sleep 3
            if docker info >/dev/null 2>&1; then
                return 0
            fi
        fi
    elif [[ "$(uname)" == "Darwin" ]]; then
        # macOS - try to start Docker Desktop
        if open -a "Docker Desktop" 2>/dev/null; then
            info "Starting Docker Desktop... (may take 30-60 seconds)"
            # Wait for Docker to be ready
            local attempts=0
            while [[ $attempts -lt 30 ]]; do
                if docker info >/dev/null 2>&1; then
                    return 0
                fi
                sleep 2
                ((attempts++))
            done
        fi
    fi
    
    return 1
}

apply_restart_daemon_fix() {
    debug "Attempting to restart Docker daemon"
    
    if [[ "$DRY_RUN" == "1" ]]; then
        info "[DRY RUN] Would restart Docker daemon"
        return 0
    fi
    
    if command -v systemctl >/dev/null 2>&1; then
        if sudo systemctl restart docker 2>/dev/null; then
            sleep 5
            if docker info >/dev/null 2>&1; then
                return 0
            fi
        fi
    elif command -v service >/dev/null 2>&1; then
        if sudo service docker restart 2>/dev/null; then
            sleep 5
            if docker info >/dev/null 2>&1; then
                return 0
            fi
        fi
    fi
    
    return 1
}

apply_fix_permissions() {
    debug "Attempting to fix Docker permissions"
    
    if [[ "$DRY_RUN" == "1" ]]; then
        info "[DRY RUN] Would add user to docker group"
        return 0
    fi
    
    # Add current user to docker group
    if sudo usermod -aG docker "$USER" 2>/dev/null; then
        info "User added to docker group. Please log out and back in for changes to take effect."
        info "Or run: newgrp docker"
        return 0
    fi
    
    return 1
}

apply_restart_unhealthy_containers() {
    debug "Attempting to restart unhealthy containers"
    
    if [[ "$DRY_RUN" == "1" ]]; then
        info "[DRY RUN] Would restart unhealthy containers"
        return 0
    fi
    
    # Get unhealthy containers
    local unhealthy_containers
    if unhealthy_containers="$(docker ps --filter health=unhealthy --format '{{.Names}}' 2>/dev/null)"; then
        if [[ -n "$unhealthy_containers" ]]; then
            while IFS= read -r container; do
                [[ -z "$container" ]] && continue
                info "Restarting unhealthy container: $container"
                if docker restart "$container" >/dev/null 2>&1; then
                    info "Restarted: $container"
                else
                    warn "Failed to restart: $container"
                fi
            done <<< "$unhealthy_containers"
            return 0
        fi
    fi
    
    return 1
}

# Verification function
verify_fixes() {
    debug "Verifying applied fixes"
    
    local verification_results="{}"
    
    # Check if Docker is now working
    if docker info >/dev/null 2>&1; then
        verification_results="$(echo "$verification_results" | jq '. + {docker_working: true}')"
        
        # Run health check if available
        if [[ -x "$HEALTH_WRAPPER" ]]; then
            local health_status
            if health_status="$("$HEALTH_WRAPPER" health-check 2>/dev/null)"; then
                verification_results="$(echo "$verification_results" | jq --argjson health "$health_status" '. + {health_check: $health}')"
            fi
        fi
    else
        verification_results="$(echo "$verification_results" | jq '. + {docker_working: false}')"
    fi
    
    # Check container status
    if docker ps >/dev/null 2>&1; then
        local running_count
        running_count="$(docker ps --format '{{.Names}}' | wc -l)"
        verification_results="$(echo "$verification_results" | jq --arg count "$running_count" '. + {containers_running: ($count|tonumber)}')"
    fi
    
    echo "$verification_results"
}

# Progress tracking
update_progress() {
    local stage="$1"
    local message="$2"
    local percentage="${3:-}"
    
    local progress_data
    progress_data="$(jq -n --arg stage "$stage" --arg msg "$message" --arg pct "$percentage" '{
        stage: $stage,
        message: $msg,
        percentage: (if $pct != "" then ($pct|tonumber) else null end),
        timestamp: now
    }')"
    
    echo "$progress_data" > "$FIX_STATE_FILE"
    
    if [[ -n "$percentage" ]]; then
        info "[$percentage%] $stage: $message"
    else
        info "$stage: $message"
    fi
}

# Main fix operation
run_docker_fix() {
    local fix_type="${1:-comprehensive}"
    
    info "Starting Docker fix operation: $fix_type"
    update_progress "initialization" "Starting Docker fix process" "0"
    
    # Step 1: Diagnosis (20%)
    update_progress "diagnosis" "Diagnosing Docker issues" "20"
    local diagnosis
    if ! diagnosis="$(diagnose_docker_issues)"; then
        error "Failed to diagnose Docker issues"
        return $EXIT_ERROR
    fi
    
    local issue_count
    issue_count="$(echo "$diagnosis" | jq -r '.issues | length')"
    
    if [[ "$issue_count" == "0" ]]; then
        info "No issues detected - Docker appears to be working correctly"
        update_progress "complete" "No fixes needed" "100"
        return $EXIT_SUCCESS
    fi
    
    info "Found $issue_count issue(s) to fix"
    
    # Step 2: Apply fixes (40-80%)
    update_progress "fixing" "Applying automated fixes" "40"
    local fix_results
    if ! fix_results="$(apply_automated_fixes "$diagnosis")"; then
        error "Failed to apply fixes"
        return $EXIT_FIX_FAILED
    fi
    
    # Step 3: Verification (90%)
    update_progress "verification" "Verifying fixes" "90"
    local verification
    if ! verification="$(verify_fixes)"; then
        error "Failed to verify fixes"
        return $EXIT_ERROR
    fi
    
    # Step 4: Report results (100%)
    update_progress "complete" "Fix operation completed" "100"
    
    # Generate final report
    local final_report
    final_report="$(jq -n \
        --argjson diagnosis "$diagnosis" \
        --argjson fixes "$fix_results" \
        --argjson verification "$verification" \
        '{
            diagnosis: $diagnosis,
            fixes_applied: $fixes,
            verification: $verification,
            timestamp: now,
            success: ($verification.docker_working // false)
        }')"
    
    echo "$final_report"
    
    # Determine exit code
    local docker_working
    docker_working="$(echo "$verification" | jq -r '.docker_working // false')"
    
    if [[ "$docker_working" == "true" ]]; then
        local failed_fixes
        failed_fixes="$(echo "$fix_results" | jq -r '.failed | length')"
        if [[ "$failed_fixes" == "0" ]]; then
            return $EXIT_SUCCESS
        else
            return $EXIT_FIX_PARTIAL
        fi
    else
        return $EXIT_FIX_FAILED
    fi
}

# Quick diagnostic-only operation
run_docker_diagnose() {
    info "Running Docker diagnosis"
    
    local diagnosis
    if ! diagnosis="$(diagnose_docker_issues)"; then
        error "Failed to diagnose Docker issues"
        return $EXIT_ERROR
    fi
    
    echo "$diagnosis"
    return $EXIT_SUCCESS
}

# Status display operation
run_docker_status() {
    info "Getting Docker status"
    
    # Use docker-health-wrapper if available for rich status
    if [[ -x "$HEALTH_WRAPPER" ]]; then
        "$HEALTH_WRAPPER" stack-status 2>/dev/null || {
            warn "Health wrapper failed, falling back to basic status"
            get_cached_health_status
        }
    else
        get_cached_health_status
    fi
}

# Test operation for validation
run_docker_test() {
    info "Testing Docker fix command functionality"
    
    # Test 1: Basic Docker connectivity
    info "Test 1: Docker connectivity"
    if docker info >/dev/null 2>&1; then
        info "✓ Docker is accessible"
    else
        info "✗ Docker is not accessible"
    fi
    
    # Test 2: Health wrapper integration
    info "Test 2: Health wrapper integration"
    if [[ -x "$HEALTH_WRAPPER" ]]; then
        if "$HEALTH_WRAPPER" test >/dev/null 2>&1; then
            info "✓ Health wrapper is working"
        else
            info "✗ Health wrapper tests failed"
        fi
    else
        info "✗ Health wrapper not found or not executable"
    fi
    
    # Test 3: Diagnosis functionality
    info "Test 3: Diagnosis functionality"
    if diagnose_docker_issues >/dev/null 2>&1; then
        info "✓ Diagnosis function is working"
    else
        info "✗ Diagnosis function failed"
    fi
    
    # Test 4: File permissions
    info "Test 4: File permissions"
    if touch "$FIX_STATE_FILE" 2>/dev/null; then
        info "✓ Can write to temp directory"
        rm -f "$FIX_STATE_FILE"
    else
        info "✗ Cannot write to temp directory"
    fi
    
    return $EXIT_SUCCESS
}

# Help display
show_help() {
    cat << 'EOF'
Docker Fix Command - Optimized Infrastructure Tool

Usage:
  docker-fix-command.sh [options] [operation]

Operations:
  fix         Comprehensive Docker fix (diagnosis + automated fixes)
  diagnose    Run diagnosis only (no fixes applied)
  status      Show current Docker status
  test        Test command functionality

Options:
  --help, -h      Show this help message
  --debug, -d     Enable debug output
  --verbose, -v   Enable verbose logging
  --dry-run       Show what would be done without applying fixes
  --version       Show version information

Examples:
  # Run comprehensive fix
  docker-fix-command.sh fix

  # Diagnose issues only
  docker-fix-command.sh diagnose

  # Show current status
  docker-fix-command.sh status

  # Test in dry-run mode
  docker-fix-command.sh --dry-run fix

Environment Variables:
  CLAUDE_DEBUG              Enable debug mode (0 or 1)
  CLAUDE_VERBOSE            Enable verbose logging (0 or 1)
  DOCKER_FIX_DRY_RUN       Enable dry-run mode (0 or 1)

Exit Codes:
  0    Success
  1    General error
  2    Docker not found
  3    Invalid arguments
  4    Permission error
  5    Docker daemon stopped
  6    Docker timeout
  7    Fix failed
  8    Fix partially successful

Integration:
  This command integrates with docker-health-wrapper.sh for advanced
  diagnosis and leverages the existing caching infrastructure for
  optimal performance.

EOF
}

# Argument parsing
parse_arguments() {
    local operation="fix"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit $EXIT_SUCCESS
                ;;
            --debug|-d)
                export DEBUG=1
                export CLAUDE_DEBUG=1
                debug "Debug mode enabled"
                shift
                ;;
            --verbose|-v)
                export VERBOSE=1
                export CLAUDE_VERBOSE=1
                shift
                ;;
            --dry-run)
                export DRY_RUN=1
                export DOCKER_FIX_DRY_RUN=1
                info "Dry-run mode enabled"
                shift
                ;;
            --version)
                echo "$SCRIPT_NAME version $SCRIPT_VERSION"
                exit $EXIT_SUCCESS
                ;;
            fix|diagnose|status|test)
                operation="$1"
                shift
                ;;
            *)
                error "Unknown option: $1"
                echo "Use --help for usage information."
                exit $EXIT_INVALID_ARGS
                ;;
        esac
    done
    
    echo "$operation"
}

# Main function
main() {
    debug "Starting $SCRIPT_NAME v$SCRIPT_VERSION"
    
    # Parse arguments
    local operation
    operation="$(parse_arguments "$@")"
    
    # Validate environment
    if ! command -v jq >/dev/null 2>&1; then
        error "jq is required but not installed"
        exit $EXIT_ERROR
    fi
    
    # Initialize logging
    echo "# Docker Fix Log - $(date)" > "$FIX_LOG_FILE"
    
    # Execute operation
    case "$operation" in
        fix)
            run_docker_fix
            ;;
        diagnose)
            run_docker_diagnose
            ;;
        status)
            run_docker_status
            ;;
        test)
            run_docker_test
            ;;
        *)
            error "Invalid operation: $operation"
            exit $EXIT_INVALID_ARGS
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
