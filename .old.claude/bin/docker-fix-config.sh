#!/bin/bash

# Docker Fix Configuration
# Performance and reliability settings for docker-fix infrastructure
# Usage: source docker-fix-config.sh

# Performance Configuration
export DOCKER_FIX_CACHE_TTL=${DOCKER_FIX_CACHE_TTL:-10}           # Cache TTL in seconds
export DOCKER_FIX_RETRY_COUNT=${DOCKER_FIX_RETRY_COUNT:-3}         # Max retry attempts
export DOCKER_FIX_RETRY_DELAY=${DOCKER_FIX_RETRY_DELAY:-2}         # Initial retry delay
export DOCKER_FIX_TIMEOUT=${DOCKER_FIX_TIMEOUT:-30}               # Operation timeout
export DOCKER_FIX_LOCK_TIMEOUT=${DOCKER_FIX_LOCK_TIMEOUT:-30}     # Lock acquisition timeout

# Reliability Configuration
export DOCKER_FIX_MAX_LOG_SIZE=${DOCKER_FIX_MAX_LOG_SIZE:-1048576} # 1MB log size limit
export DOCKER_FIX_MAX_METRICS=${DOCKER_FIX_MAX_METRICS:-100}       # Max metrics entries
export DOCKER_FIX_HEALTH_CHECK_INTERVAL=${DOCKER_FIX_HEALTH_CHECK_INTERVAL:-30} # Health check interval

# Integration Configuration
export DOCKER_FIX_HEALTH_WRAPPER=${DOCKER_FIX_HEALTH_WRAPPER:-".claude/bin/docker-health-wrapper.sh"}
export DOCKER_FIX_INTEGRATION_MODE=${DOCKER_FIX_INTEGRATION_MODE:-"auto"} # auto|health-wrapper|standalone

# Platform-Specific Configuration
case "$(uname)" in
    "Linux")
        # Linux optimizations
        export DOCKER_FIX_USE_SYSTEMD=${DOCKER_FIX_USE_SYSTEMD:-"auto"}
        if [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -q microsoft /proc/version 2>/dev/null; then
            # WSL2 specific settings
            export DOCKER_FIX_WSL2_MODE=true
            export DOCKER_FIX_TIMEOUT=60  # Longer timeout for WSL2
        fi
        ;;
    "Darwin")
        # macOS optimizations
        export DOCKER_FIX_MACOS_MODE=true
        export DOCKER_FIX_TIMEOUT=60  # Longer timeout for Docker Desktop startup
        ;;
    "MINGW"*|"CYGWIN"*)
        # Windows optimizations
        export DOCKER_FIX_WINDOWS_MODE=true
        export DOCKER_FIX_TIMEOUT=90  # Even longer timeout for Windows
        ;;
esac

# Debug and Logging Configuration
export DOCKER_FIX_DEBUG=${DOCKER_FIX_DEBUG:-${CLAUDE_DEBUG:-0}}
export DOCKER_FIX_VERBOSE=${DOCKER_FIX_VERBOSE:-${CLAUDE_VERBOSE:-0}}
export DOCKER_FIX_LOG_LEVEL=${DOCKER_FIX_LOG_LEVEL:-"info"} # debug|info|warn|error

# Cache Configuration (inherits from docker-health-wrapper patterns)
export DOCKER_FIX_CACHE_L1_TTL=${DOCKER_FIX_CACHE_L1_TTL:-${CLAUDE_CACHE_L1_TTL:-5}}
export DOCKER_FIX_CACHE_L2_TTL=${DOCKER_FIX_CACHE_L2_TTL:-${CLAUDE_CACHE_L2_TTL:-30}}
export DOCKER_FIX_CACHE_L3_TTL=${DOCKER_FIX_CACHE_L3_TTL:-${CLAUDE_CACHE_L3_TTL:-300}}

# Resource Constraint Thresholds
export DOCKER_FIX_DISK_THRESHOLD=${DOCKER_FIX_DISK_THRESHOLD:-90}   # Disk usage % threshold
export DOCKER_FIX_MEMORY_THRESHOLD=${DOCKER_FIX_MEMORY_THRESHOLD:-90} # Memory usage % threshold
export DOCKER_FIX_LOAD_THRESHOLD=${DOCKER_FIX_LOAD_THRESHOLD:-200}  # Load average % threshold

# Docker Operation Optimizations
export DOCKER_CLI_HINTS=${DOCKER_CLI_HINTS:-false}
export DOCKER_BUILDKIT=${DOCKER_BUILDKIT:-1}
export DOCKER_CLIENT_TIMEOUT=${DOCKER_CLIENT_TIMEOUT:-60}
export COMPOSE_HTTP_TIMEOUT=${COMPOSE_HTTP_TIMEOUT:-60}

# Path Configuration
readonly PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
readonly GIT_ROOT_HASH="$(echo "${PROJECT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)"
readonly DOCKER_FIX_BIN_DIR="${PROJECT_ROOT}/.claude/bin"

# File Path Configuration
readonly DOCKER_FIX_CACHE_DIR="/tmp"
readonly DOCKER_FIX_STATUS_FILE="${DOCKER_FIX_CACHE_DIR}/.claude_docker_status_${GIT_ROOT_HASH}"
readonly DOCKER_FIX_LOG_FILE="${DOCKER_FIX_CACHE_DIR}/.claude_docker_fix_log_${GIT_ROOT_HASH}"
readonly DOCKER_FIX_STATE_FILE="${DOCKER_FIX_CACHE_DIR}/.claude_docker_fix_state_${GIT_ROOT_HASH}"
readonly DOCKER_FIX_METRICS_FILE="${DOCKER_FIX_CACHE_DIR}/.claude_docker_fix_metrics_${GIT_ROOT_HASH}"
readonly DOCKER_FIX_CACHE_FILE="${DOCKER_FIX_CACHE_DIR}/.claude_docker_fix_cache_${GIT_ROOT_HASH}"

# Export read-only variables
export PROJECT_ROOT GIT_ROOT_HASH DOCKER_FIX_BIN_DIR
export DOCKER_FIX_CACHE_DIR DOCKER_FIX_STATUS_FILE DOCKER_FIX_LOG_FILE
export DOCKER_FIX_STATE_FILE DOCKER_FIX_METRICS_FILE DOCKER_FIX_CACHE_FILE

# Configuration validation
validate_docker_fix_config() {
    local errors=0
    
    # Check required commands
    local required_commands=("jq" "timeout" "flock")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            echo "Error: Required command not found: $cmd" >&2
            ((errors++))
        fi
    done
    
    # Check numeric configurations
    local numeric_vars=(
        "DOCKER_FIX_CACHE_TTL"
        "DOCKER_FIX_RETRY_COUNT"
        "DOCKER_FIX_TIMEOUT"
        "DOCKER_FIX_DISK_THRESHOLD"
        "DOCKER_FIX_MEMORY_THRESHOLD"
    )
    
    for var in "${numeric_vars[@]}"; do
        local value="${!var}"
        if ! [[ "$value" =~ ^[0-9]+$ ]]; then
            echo "Error: $var must be numeric: $value" >&2
            ((errors++))
        fi
    done
    
    # Check threshold ranges
    if [[ $DOCKER_FIX_DISK_THRESHOLD -lt 50 ]] || [[ $DOCKER_FIX_DISK_THRESHOLD -gt 100 ]]; then
        echo "Error: DOCKER_FIX_DISK_THRESHOLD must be between 50-100: $DOCKER_FIX_DISK_THRESHOLD" >&2
        ((errors++))
    fi
    
    # Check cache directory permissions
    if [[ ! -w "$DOCKER_FIX_CACHE_DIR" ]]; then
        echo "Error: Cache directory not writable: $DOCKER_FIX_CACHE_DIR" >&2
        ((errors++))
    fi
    
    return $errors
}

# Performance tuning based on system resources
auto_tune_performance() {
    local cpu_count
    cpu_count="$(nproc 2>/dev/null || echo 1)"
    
    local memory_kb
    memory_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 1048576)"
    local memory_gb=$((memory_kb / 1024 / 1024))
    
    # Adjust based on system resources
    if [[ $cpu_count -ge 8 ]] && [[ $memory_gb -ge 8 ]]; then
        # High-performance system
        export DOCKER_FIX_CACHE_L1_TTL=3
        export DOCKER_FIX_CACHE_L2_TTL=15
        export DOCKER_FIX_RETRY_DELAY=1
        export DOCKER_FIX_TIMEOUT=20
        echo "Applied high-performance tuning (${cpu_count} CPUs, ${memory_gb}GB RAM)" >&2
    elif [[ $cpu_count -ge 4 ]] && [[ $memory_gb -ge 4 ]]; then
        # Medium-performance system
        export DOCKER_FIX_CACHE_L1_TTL=5
        export DOCKER_FIX_CACHE_L2_TTL=30
        export DOCKER_FIX_RETRY_DELAY=2
        export DOCKER_FIX_TIMEOUT=30
        echo "Applied medium-performance tuning (${cpu_count} CPUs, ${memory_gb}GB RAM)" >&2
    else
        # Low-performance system
        export DOCKER_FIX_CACHE_L1_TTL=10
        export DOCKER_FIX_CACHE_L2_TTL=60
        export DOCKER_FIX_RETRY_DELAY=3
        export DOCKER_FIX_TIMEOUT=60
        echo "Applied low-performance tuning (${cpu_count} CPUs, ${memory_gb}GB RAM)" >&2
    fi
}

# Initialize configuration when sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    if [[ "$DOCKER_FIX_DEBUG" == "1" ]]; then
        echo "Loading Docker Fix configuration..." >&2
        echo "  Project root: $PROJECT_ROOT" >&2
        echo "  Cache directory: $DOCKER_FIX_CACHE_DIR" >&2
        echo "  Timeout: ${DOCKER_FIX_TIMEOUT}s" >&2
    fi
    
    # Validate configuration
    if ! validate_docker_fix_config; then
        echo "Warning: Configuration validation failed" >&2
    fi
    
    # Auto-tune if enabled
    if [[ "${DOCKER_FIX_AUTO_TUNE:-1}" == "1" ]]; then
        auto_tune_performance
    fi
    
    if [[ "$DOCKER_FIX_DEBUG" == "1" ]]; then
        echo "Docker Fix configuration loaded successfully" >&2
    fi
fi
