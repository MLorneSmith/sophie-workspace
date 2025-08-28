#!/bin/bash

# Test Resource Validator Script
# Issue #267 Phase 2: Pre-flight resource validation before test execution
# Validates system resources to prevent test failures due to insufficient resources

set -euo pipefail

# Configuration
readonly SCRIPT_NAME="test-resource-validator"
readonly LOG_FILE="/tmp/${SCRIPT_NAME}.log"

# Resource thresholds
readonly MIN_MEMORY_PERCENT=25          # Minimum 25% available memory
readonly MAX_CPU_LOAD=4.0              # Maximum CPU load average
readonly MAX_RESPONSE_TIME=3.0          # Maximum server response time (seconds)
readonly MIN_DISK_SPACE_GB=2           # Minimum 2GB disk space
readonly REQUIRED_PORTS=(3000 3020)    # Ports that must be available

# Logging function
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

# Check available memory
check_memory() {
    log "INFO" "Checking available memory..."
    
    if ! command -v free >/dev/null 2>&1; then
        log "WARN" "free command not available, skipping memory check"
        return 0
    fi
    
    local available_percent
    available_percent=$(free -m | awk 'NR==2{printf "%.0f", $7*100/$2}' 2>/dev/null || echo "0")
    
    log "INFO" "Available memory: ${available_percent}%"
    
    if [[ $available_percent -lt $MIN_MEMORY_PERCENT ]]; then
        log "ERROR" "Insufficient memory: ${available_percent}% < ${MIN_MEMORY_PERCENT}% required"
        echo "memory_insufficient:${available_percent}"
        return 1
    fi
    
    log "INFO" "Memory check passed: ${available_percent}% available"
    return 0
}

# Check CPU load
check_cpu_load() {
    log "INFO" "Checking CPU load..."
    
    if ! command -v uptime >/dev/null 2>&1; then
        log "WARN" "uptime command not available, skipping CPU check"
        return 0
    fi
    
    local cpu_load
    cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//' 2>/dev/null || echo "0")
    
    log "INFO" "CPU load average: ${cpu_load}"
    
    # Use bc if available, otherwise use basic comparison
    if command -v bc >/dev/null 2>&1; then
        if [[ $(echo "$cpu_load > $MAX_CPU_LOAD" | bc -l) -eq 1 ]]; then
            log "ERROR" "High CPU load: ${cpu_load} > ${MAX_CPU_LOAD} maximum"
            echo "cpu_overloaded:${cpu_load}"
            return 1
        fi
    else
        # Basic comparison for systems without bc
        if [[ ${cpu_load%.*} -gt ${MAX_CPU_LOAD%.*} ]]; then
            log "ERROR" "High CPU load: ${cpu_load} > ${MAX_CPU_LOAD} maximum"
            echo "cpu_overloaded:${cpu_load}"
            return 1
        fi
    fi
    
    log "INFO" "CPU load check passed: ${cpu_load}"
    return 0
}

# Check disk space
check_disk_space() {
    log "INFO" "Checking disk space..."
    
    local available_gb
    available_gb=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//' 2>/dev/null || echo "0")
    
    log "INFO" "Available disk space: ${available_gb}GB"
    
    if [[ $available_gb -lt $MIN_DISK_SPACE_GB ]]; then
        log "ERROR" "Insufficient disk space: ${available_gb}GB < ${MIN_DISK_SPACE_GB}GB required"
        echo "disk_insufficient:${available_gb}"
        return 1
    fi
    
    log "INFO" "Disk space check passed: ${available_gb}GB available"
    return 0
}

# Check port availability
check_ports() {
    log "INFO" "Checking port availability..."
    
    local unavailable_ports=()
    
    for port in "${REQUIRED_PORTS[@]}"; do
        if command -v lsof >/dev/null 2>&1; then
            if lsof -i:$port >/dev/null 2>&1; then
                local process_info
                process_info=$(lsof -i:$port | tail -n +2 | head -1 | awk '{print $1 " (PID " $2 ")"}')
                log "WARN" "Port $port is occupied by: $process_info"
                unavailable_ports+=("$port:$process_info")
            else
                log "INFO" "Port $port is available"
            fi
        else
            log "WARN" "lsof not available, cannot check port $port"
        fi
    done
    
    if [[ ${#unavailable_ports[@]} -gt 0 ]]; then
        log "ERROR" "Ports unavailable: ${unavailable_ports[*]}"
        echo "ports_unavailable:${unavailable_ports[*]}"
        return 1
    fi
    
    log "INFO" "All required ports are available"
    return 0
}

# Check server response time (if server is running)
check_server_response() {
    log "INFO" "Checking server response time..."
    
    if ! command -v curl >/dev/null 2>&1; then
        log "WARN" "curl not available, skipping server response check"
        return 0
    fi
    
    # Check if server is running first
    if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
        log "INFO" "Server not running, skipping response time check"
        return 0
    fi
    
    local response_time
    response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000 2>/dev/null || echo "999")
    
    log "INFO" "Server response time: ${response_time}s"
    
    # Use bc if available for precise comparison
    if command -v bc >/dev/null 2>&1; then
        if [[ $(echo "$response_time > $MAX_RESPONSE_TIME" | bc -l) -eq 1 ]]; then
            log "ERROR" "Slow server response: ${response_time}s > ${MAX_RESPONSE_TIME}s maximum"
            echo "server_slow:${response_time}"
            return 1
        fi
    else
        # Basic comparison for systems without bc
        if [[ ${response_time%.*} -gt ${MAX_RESPONSE_TIME%.*} ]]; then
            log "ERROR" "Slow server response: ${response_time}s > ${MAX_RESPONSE_TIME}s maximum"
            echo "server_slow:${response_time}"
            return 1
        fi
    fi
    
    log "INFO" "Server response check passed: ${response_time}s"
    return 0
}

# Check Supabase E2E status
check_supabase_status() {
    log "INFO" "Checking Supabase E2E status..."
    
    if [[ ! -d "apps/e2e" ]]; then
        log "WARN" "apps/e2e directory not found, skipping Supabase check"
        return 0
    fi
    
    # Check if Supabase is running
    if command -v curl >/dev/null 2>&1; then
        if ! curl -s http://127.0.0.1:55321/rest/v1/ >/dev/null 2>&1; then
            log "ERROR" "Supabase E2E not responding on port 55321"
            echo "supabase_not_running"
            return 1
        fi
        
        log "INFO" "Supabase E2E is responding"
    else
        log "WARN" "curl not available, cannot verify Supabase status"
    fi
    
    return 0
}

# Check Node.js memory limits
check_node_memory() {
    log "INFO" "Checking Node.js configuration..."
    
    local max_old_space=${NODE_OPTIONS:-""}
    
    if [[ "$max_old_space" =~ --max-old-space-size=([0-9]+) ]]; then
        local configured_mb=${BASH_REMATCH[1]}
        log "INFO" "Node.js max-old-space-size configured: ${configured_mb}MB"
        
        # Check if configured memory is reasonable (at least 2GB for E2E tests)
        if [[ $configured_mb -lt 2048 ]]; then
            log "WARN" "Node.js memory might be low for E2E tests: ${configured_mb}MB < 2048MB recommended"
        fi
    else
        log "INFO" "Node.js max-old-space-size not explicitly configured (using default)"
    fi
    
    return 0
}

# Generate resource report
generate_resource_report() {
    log "INFO" "Generating comprehensive resource report..."
    
    local report_file="/tmp/resource-validation-report.json"
    local timestamp=$(date -u +%s)
    
    # Get system information
    local total_memory=""
    local available_memory=""
    local cpu_cores=""
    local load_average=""
    local disk_total=""
    local disk_available=""
    
    if command -v free >/dev/null 2>&1; then
        total_memory=$(free -m | awk 'NR==2{print $2}')
        available_memory=$(free -m | awk 'NR==2{print $7}')
    fi
    
    if command -v nproc >/dev/null 2>&1; then
        cpu_cores=$(nproc)
    fi
    
    if command -v uptime >/dev/null 2>&1; then
        load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    fi
    
    if command -v df >/dev/null 2>&1; then
        disk_total=$(df -BG . | awk 'NR==2{print $2}' | sed 's/G//')
        disk_available=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    fi
    
    # Create JSON report
    cat > "$report_file" << EOF
{
  "timestamp": $timestamp,
  "validation": {
    "status": "completed",
    "thresholds": {
      "min_memory_percent": $MIN_MEMORY_PERCENT,
      "max_cpu_load": $MAX_CPU_LOAD,
      "max_response_time": $MAX_RESPONSE_TIME,
      "min_disk_space_gb": $MIN_DISK_SPACE_GB
    }
  },
  "system": {
    "memory": {
      "total_mb": ${total_memory:-0},
      "available_mb": ${available_memory:-0},
      "available_percent": $(free -m 2>/dev/null | awk 'NR==2{printf "%.1f", $7*100/$2}' || echo "0")
    },
    "cpu": {
      "cores": ${cpu_cores:-0},
      "load_average": "${load_average:-0}"
    },
    "disk": {
      "total_gb": ${disk_total:-0},
      "available_gb": ${disk_available:-0}
    }
  },
  "services": {
    "supabase_e2e": "$(curl -s http://127.0.0.1:55321/rest/v1/ >/dev/null 2>&1 && echo "running" || echo "stopped")",
    "web_server": "$(curl -s http://localhost:3000 >/dev/null 2>&1 && echo "running" || echo "stopped")",
    "backend_server": "$(curl -s http://localhost:3020 >/dev/null 2>&1 && echo "running" || echo "stopped")"
  }
}
EOF
    
    log "INFO" "Resource report generated: $report_file"
    echo "$report_file"
}

# Main validation function
validate_resources() {
    log "INFO" "Starting comprehensive resource validation"
    
    local validation_errors=()
    local validation_warnings=()
    
    # Run all validation checks
    local checks=(
        "check_memory"
        "check_cpu_load" 
        "check_disk_space"
        "check_ports"
        "check_server_response"
        "check_supabase_status"
        "check_node_memory"
    )
    
    for check in "${checks[@]}"; do
        if ! result=$($check 2>&1); then
            if [[ $result == *":"* ]]; then
                validation_errors+=("$result")
            else
                validation_errors+=("$check:unknown_error")
            fi
        fi
    done
    
    # Generate comprehensive report
    local report_file
    report_file=$(generate_resource_report)
    
    # Summary
    if [[ ${#validation_errors[@]} -eq 0 ]]; then
        log "INFO" "✅ All resource validation checks passed"
        log "INFO" "System is ready for test execution"
        echo "validation_passed:$report_file"
        return 0
    else
        log "ERROR" "❌ Resource validation failed with ${#validation_errors[@]} errors:"
        for error in "${validation_errors[@]}"; do
            log "ERROR" "  - $error"
        done
        echo "validation_failed:${validation_errors[*]}:$report_file"
        return 1
    fi
}

# Cleanup and optimization suggestions
suggest_optimizations() {
    log "INFO" "Generating optimization suggestions..."
    
    echo "🔧 SYSTEM OPTIMIZATION SUGGESTIONS:"
    echo
    
    # Memory optimization
    if command -v free >/dev/null 2>&1; then
        local available_percent
        available_percent=$(free -m | awk 'NR==2{printf "%.0f", $7*100/$2}')
        if [[ $available_percent -lt 40 ]]; then
            echo "💾 MEMORY OPTIMIZATION:"
            echo "  • Close unnecessary applications to free memory"
            echo "  • Consider increasing swap space"
            echo "  • Run: sync && echo 3 > /proc/sys/vm/drop_caches (as root)"
        fi
    fi
    
    # CPU optimization
    if command -v uptime >/dev/null 2>&1; then
        local cpu_load
        cpu_load=$(uptime | awk -F'load average:' '{print $1}' | awk '{print $NF}')
        if command -v bc >/dev/null 2>&1 && [[ $(echo "$cpu_load > 2.0" | bc -l) -eq 1 ]]; then
            echo "🔥 CPU OPTIMIZATION:"
            echo "  • Reduce test concurrency: PLAYWRIGHT_WORKERS=1"
            echo "  • Use sequential batch execution instead of parallel"
            echo "  • Check for background processes: top or htop"
        fi
    fi
    
    # Port optimization
    for port in "${REQUIRED_PORTS[@]}"; do
        if command -v lsof >/dev/null 2>&1 && lsof -i:$port >/dev/null 2>&1; then
            echo "🌐 PORT OPTIMIZATION:"
            echo "  • Kill processes on port $port: kill -9 \$(lsof -ti:$port)"
            echo "  • Or use alternative ports in configuration"
        fi
    done
    
    # Node.js optimization
    local current_node_mem=${NODE_OPTIONS:-""}
    if [[ ! "$current_node_mem" =~ --max-old-space-size ]]; then
        echo "🚀 NODE.JS OPTIMIZATION:"
        echo "  • Set Node.js memory limit: export NODE_OPTIONS=\"--max-old-space-size=4096\""
        echo "  • Add to your shell profile for persistence"
    fi
    
    echo
    echo "📊 For detailed system info, check: /tmp/resource-validation-report.json"
}

# Command-line interface
case "${1:-validate}" in
    validate)
        validate_resources
        ;;
    report)
        generate_resource_report
        ;;
    optimize)
        suggest_optimizations
        ;;
    check-memory)
        check_memory
        ;;
    check-cpu)
        check_cpu_load
        ;;
    check-ports)
        check_ports
        ;;
    check-services)
        check_supabase_status
        echo "Supabase check completed"
        check_server_response
        echo "Server response check completed"
        ;;
    *)
        echo "Usage: $0 [validate|report|optimize|check-memory|check-cpu|check-ports|check-services]"
        echo
        echo "Commands:"
        echo "  validate      - Run full resource validation (default)"
        echo "  report        - Generate detailed system report"
        echo "  optimize      - Show optimization suggestions"
        echo "  check-memory  - Check memory availability"
        echo "  check-cpu     - Check CPU load"
        echo "  check-ports   - Check port availability"
        echo "  check-services - Check service status"
        exit 1
        ;;
esac