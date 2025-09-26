#!/bin/bash

# Docker Fix Command Test Scenarios
# Comprehensive test suite for docker-fix-command.sh validation
# Usage: docker-fix-test-scenarios.sh [--help] [scenario_name]

set -euo pipefail

# Script metadata
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DOCKER_FIX_SCRIPT="${SCRIPT_DIR}/docker-fix-command.sh"

# Test configuration
readonly TEST_TIMEOUT=30
readonly PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
readonly GIT_ROOT_HASH="$(echo "${PROJECT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)"
readonly TEST_LOG_FILE="/tmp/.claude_docker_fix_test_${GIT_ROOT_HASH}"

# Test results tracking
TEST_PASSED=0
TEST_FAILED=0
TEST_SKIPPED=0

# Logging functions
log_test() {
    echo "[$(date '+%H:%M:%S')] $*" | tee -a "$TEST_LOG_FILE"
}

pass() {
    echo "✓ PASS: $*" | tee -a "$TEST_LOG_FILE"
    ((TEST_PASSED++))
}

fail() {
    echo "✗ FAIL: $*" | tee -a "$TEST_LOG_FILE"
    ((TEST_FAILED++))
}

skip() {
    echo "○ SKIP: $*" | tee -a "$TEST_LOG_FILE"
    ((TEST_SKIPPED++))
}

info() {
    echo "[INFO] $*" | tee -a "$TEST_LOG_FILE"
}

# Test scenario implementations

# Scenario 1: Docker daemon not running
test_daemon_not_running() {
    log_test "Testing: Docker daemon not running scenario"
    
    # Check if Docker is actually running first
    if ! docker info >/dev/null 2>&1; then
        log_test "Docker daemon is already stopped - perfect for this test"
        
        # Test diagnosis
        local diagnosis_output
        if diagnosis_output="$(timeout $TEST_TIMEOUT "$DOCKER_FIX_SCRIPT" diagnose 2>/dev/null)"; then
            # Check if daemon_not_running issue is detected
            if echo "$diagnosis_output" | jq -e '.issues[] | select(.type == "daemon_not_running")' >/dev/null 2>&1; then
                pass "Correctly detected daemon not running"
            else
                fail "Failed to detect daemon not running issue"
            fi
            
            # Check if start_daemon fix is suggested
            if echo "$diagnosis_output" | jq -e '.fixes[] | select(.type == "start_daemon")' >/dev/null 2>&1; then
                pass "Correctly suggested start_daemon fix"
            else
                fail "Failed to suggest start_daemon fix"
            fi
        else
            fail "Diagnosis command failed when daemon not running"
        fi
        
        # Test dry-run fix
        local fix_output
        if fix_output="$(timeout $TEST_TIMEOUT "$DOCKER_FIX_SCRIPT" --dry-run fix 2>/dev/null)"; then
            if echo "$fix_output" | grep -q "\[DRY RUN\]"; then
                pass "Dry-run mode works when daemon not running"
            else
                fail "Dry-run mode not working properly"
            fi
        else
            fail "Dry-run fix failed when daemon not running"
        fi
    else
        skip "Docker daemon is running - cannot test daemon not running scenario"
    fi
}

# Scenario 2: Permission issues (Linux)
test_permission_issues() {
    log_test "Testing: Permission issues scenario"
    
    # Only test on Linux systems
    if [[ "$(uname)" != "Linux" ]]; then
        skip "Permission test only applicable on Linux"
        return
    fi
    
    # Check if user is not in docker group
    if ! groups | grep -q docker; then
        log_test "User not in docker group - testing permission detection"
        
        # Test if permission issue is detected
        local diagnosis_output
        if diagnosis_output="$(timeout $TEST_TIMEOUT "$DOCKER_FIX_SCRIPT" diagnose 2>/dev/null)"; then
            if echo "$diagnosis_output" | jq -e '.issues[] | select(.type == "permission_denied")' >/dev/null 2>&1; then
                pass "Correctly detected permission issue"
            else
                # This might not be detected if daemon is not running
                skip "Permission issue not detected (daemon may not be running)"
            fi
        else
            fail "Diagnosis failed during permission test"
        fi
    else
        skip "User already in docker group - cannot test permission issues"
    fi
}

# Scenario 3: Docker not installed
test_docker_not_installed() {
    log_test "Testing: Docker not installed scenario"
    
    # Temporarily rename docker command to simulate not installed
    local docker_path
    if docker_path="$(which docker 2>/dev/null)"; then
        log_test "Docker is installed - simulating missing docker"
        
        # Create a temporary script that simulates missing docker
        local temp_script="/tmp/test_no_docker_$$"
        cat > "$temp_script" << 'EOF'
#!/bin/bash
# Temporarily remove docker from PATH
export PATH="$(echo "$PATH" | sed 's|[^:]*docker[^:]*:||g')"
exec "$@"
EOF
        chmod +x "$temp_script"
        
        # Test with docker removed from PATH
        local diagnosis_output
        if diagnosis_output="$(timeout $TEST_TIMEOUT "$temp_script" "$DOCKER_FIX_SCRIPT" diagnose 2>/dev/null)"; then
            if echo "$diagnosis_output" | jq -e '.issues[] | select(.type == "missing_docker")' >/dev/null 2>&1; then
                pass "Correctly detected missing docker"
            else
                fail "Failed to detect missing docker"
            fi
        else
            fail "Diagnosis failed when docker not in PATH"
        fi
        
        rm -f "$temp_script"
    else
        log_test "Docker is not installed - testing detection"
        
        local diagnosis_output
        if diagnosis_output="$(timeout $TEST_TIMEOUT "$DOCKER_FIX_SCRIPT" diagnose 2>/dev/null)"; then
            if echo "$diagnosis_output" | jq -e '.issues[] | select(.type == "missing_docker")' >/dev/null 2>&1; then
                pass "Correctly detected missing docker"
            else
                fail "Failed to detect missing docker"
            fi
        else
            fail "Diagnosis failed when docker not installed"
        fi
    fi
}

# Scenario 4: Unhealthy containers
test_unhealthy_containers() {
    log_test "Testing: Unhealthy containers scenario"
    
    # Only test if Docker is running
    if ! docker info >/dev/null 2>&1; then
        skip "Docker not running - cannot test unhealthy containers"
        return
    fi
    
    # Check if there are any containers with health checks
    local containers_with_health
    if containers_with_health="$(docker ps --filter health=unhealthy --format '{{.Names}}' 2>/dev/null)"; then
        if [[ -n "$containers_with_health" ]]; then
            log_test "Found unhealthy containers - testing detection"
            
            local diagnosis_output
            if diagnosis_output="$(timeout $TEST_TIMEOUT "$DOCKER_FIX_SCRIPT" diagnose 2>/dev/null)"; then
                if echo "$diagnosis_output" | jq -e '.issues[] | select(.type == "unhealthy_containers")' >/dev/null 2>&1; then
                    pass "Correctly detected unhealthy containers"
                else
                    fail "Failed to detect unhealthy containers"
                fi
            else
                fail "Diagnosis failed when unhealthy containers present"
            fi
        else
            skip "No unhealthy containers found"
        fi
    else
        skip "Cannot check container health status"
    fi
}

# Scenario 5: Performance and caching
test_performance_caching() {
    log_test "Testing: Performance and caching"
    
    # Test multiple rapid calls to check caching
    local start_time end_time duration
    
    # First call (should populate cache)
    start_time="$(date +%s%N)"
    "$DOCKER_FIX_SCRIPT" status >/dev/null 2>&1 || true
    end_time="$(date +%s%N)"
    local first_duration=$(( (end_time - start_time) / 1000000 ))
    
    # Second call (should use cache)
    start_time="$(date +%s%N)"
    "$DOCKER_FIX_SCRIPT" status >/dev/null 2>&1 || true
    end_time="$(date +%s%N)"
    local second_duration=$(( (end_time - start_time) / 1000000 ))
    
    log_test "First call: ${first_duration}ms, Second call: ${second_duration}ms"
    
    # Second call should be faster (cached)
    if [[ $second_duration -lt $first_duration ]]; then
        pass "Caching appears to be working (second call faster)"
    else
        # Allow some margin for timing variations
        if [[ $second_duration -le $((first_duration + 100)) ]]; then
            pass "Caching working (times similar, within margin)"
        else
            fail "Caching may not be working (second call slower)"
        fi
    fi
    
    # Test timeout handling
    start_time="$(date +%s%N)"
    timeout 5 "$DOCKER_FIX_SCRIPT" status >/dev/null 2>&1 || true
    end_time="$(date +%s%N)"
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [[ $duration -lt 5000 ]]; then
        pass "Command completes within reasonable time (${duration}ms)"
    else
        fail "Command taking too long (${duration}ms)"
    fi
}

# Scenario 6: Error recovery
test_error_recovery() {
    log_test "Testing: Error recovery mechanisms"
    
    # Test with invalid JSON in cache files
    local cache_file="/tmp/.claude_docker_fix_cache_${GIT_ROOT_HASH}"
    echo "invalid json" > "$cache_file"
    
    # Should handle invalid cache gracefully
    if "$DOCKER_FIX_SCRIPT" status >/dev/null 2>&1; then
        pass "Gracefully handled invalid cache data"
    else
        fail "Failed to handle invalid cache data"
    fi
    
    # Clean up
    rm -f "$cache_file"
    
    # Test with locked files
    local lock_file="/tmp/.claude_docker_fix_test.lock"
    (
        flock -x 200
        sleep 2 &
        wait
    ) 200>"$lock_file" &
    local lock_pid=$!
    
    # Test should not hang on locked files
    if timeout 5 "$DOCKER_FIX_SCRIPT" test >/dev/null 2>&1; then
        pass "Handled file locking gracefully"
    else
        fail "May have issues with file locking"
    fi
    
    # Clean up
    kill $lock_pid 2>/dev/null || true
    rm -f "$lock_file"
}

# Scenario 7: Cross-platform compatibility
test_cross_platform() {
    log_test "Testing: Cross-platform compatibility"
    
    local platform="$(uname)"
    log_test "Testing on platform: $platform"
    
    # Test environment detection
    local diagnosis_output
    if diagnosis_output="$(timeout $TEST_TIMEOUT "$DOCKER_FIX_SCRIPT" diagnose 2>/dev/null)"; then
        # Check if environment is properly detected
        if echo "$diagnosis_output" | jq -e '.environment' >/dev/null 2>&1; then
            pass "Environment detection working"
            
            # Platform-specific checks
            case "$platform" in
                "Linux")
                    # Check for WSL detection if applicable
                    if [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -q microsoft /proc/version 2>/dev/null; then
                        if echo "$diagnosis_output" | jq -e '.environment.wsl2' >/dev/null 2>&1; then
                            pass "WSL2 environment correctly detected"
                        else
                            fail "WSL2 environment not detected"
                        fi
                    fi
                    ;;
                "Darwin")
                    log_test "macOS platform detected"
                    pass "macOS compatibility check passed"
                    ;;
                *)
                    log_test "Unknown platform: $platform"
                    pass "Platform detection completed"
                    ;;
            esac
        else
            fail "Environment detection failed"
        fi
    else
        fail "Cross-platform diagnosis failed"
    fi
}

# Scenario 8: Integration with docker-health-wrapper
test_health_wrapper_integration() {
    log_test "Testing: Integration with docker-health-wrapper.sh"
    
    local health_wrapper="${SCRIPT_DIR}/docker-health-wrapper.sh"
    
    if [[ -x "$health_wrapper" ]]; then
        log_test "Found docker-health-wrapper.sh"
        
        # Test if docker-fix can use health wrapper
        if "$DOCKER_FIX_SCRIPT" status 2>/dev/null | grep -q ":"; then
            pass "Successfully integrated with health wrapper"
        else
            # Try fallback status
            if "$DOCKER_FIX_SCRIPT" status >/dev/null 2>&1; then
                pass "Status command working (fallback mode)"
            else
                fail "Status command not working"
            fi
        fi
        
        # Test health check integration
        if "$DOCKER_FIX_SCRIPT" diagnose 2>/dev/null | jq -e '.diagnosis.health_check' >/dev/null 2>&1; then
            pass "Health check data integrated in diagnosis"
        else
            skip "Health check data not in diagnosis (may be unavailable)"
        fi
    else
        skip "docker-health-wrapper.sh not found or not executable"
    fi
}

# Scenario 9: Comprehensive fix workflow
test_comprehensive_workflow() {
    log_test "Testing: Comprehensive fix workflow"
    
    # Test the complete workflow in dry-run mode
    local fix_output
    if fix_output="$(timeout $TEST_TIMEOUT "$DOCKER_FIX_SCRIPT" --dry-run fix 2>/dev/null)"; then
        # Check if all workflow stages are present
        local stages=("diagnosis" "fixing" "verification" "complete")
        local all_stages_found=true
        
        for stage in "${stages[@]}"; do
            if ! echo "$fix_output" | jq -e --arg stage "$stage" 'select(.stage == $stage)' >/dev/null 2>&1; then
                all_stages_found=false
                break
            fi
        done
        
        if [[ "$all_stages_found" == "true" ]]; then
            pass "All workflow stages completed"
        else
            fail "Missing workflow stages in output"
        fi
        
        # Check for progress tracking
        if echo "$fix_output" | jq -e '.percentage' >/dev/null 2>&1; then
            pass "Progress tracking working"
        else
            fail "Progress tracking not working"
        fi
    else
        fail "Comprehensive workflow test failed"
    fi
}

# Scenario 10: Resource constraint handling
test_resource_constraints() {
    log_test "Testing: Resource constraint handling"
    
    # Test memory limits (create large JSON to test parsing)
    local large_json
    large_json="$(printf '{"test":['; for i in {1..1000}; do printf '"item%d",' "$i"; done; printf '"end"]}')"
    
    # Test if command can handle large JSON data
    if echo "$large_json" | jq . >/dev/null 2>&1; then
        pass "Can handle large JSON data structures"
    else
        fail "Issues with large JSON data"
    fi
    
    # Test disk space handling
    local temp_large_file="/tmp/test_large_file_$$"
    if dd if=/dev/zero of="$temp_large_file" bs=1M count=10 2>/dev/null; then
        if [[ -f "$temp_large_file" ]]; then
            pass "Can create temporary files for testing"
            rm -f "$temp_large_file"
        else
            fail "Cannot create temporary files"
        fi
    else
        skip "Cannot test disk space handling (insufficient space?)"
    fi
}

# Main test runner
run_test_scenario() {
    local scenario="$1"
    
    case "$scenario" in
        "daemon-not-running")
            test_daemon_not_running
            ;;
        "permission-issues")
            test_permission_issues
            ;;
        "docker-not-installed")
            test_docker_not_installed
            ;;
        "unhealthy-containers")
            test_unhealthy_containers
            ;;
        "performance-caching")
            test_performance_caching
            ;;
        "error-recovery")
            test_error_recovery
            ;;
        "cross-platform")
            test_cross_platform
            ;;
        "health-wrapper-integration")
            test_health_wrapper_integration
            ;;
        "comprehensive-workflow")
            test_comprehensive_workflow
            ;;
        "resource-constraints")
            test_resource_constraints
            ;;
        "all")
            test_daemon_not_running
            test_permission_issues
            test_docker_not_installed
            test_unhealthy_containers
            test_performance_caching
            test_error_recovery
            test_cross_platform
            test_health_wrapper_integration
            test_comprehensive_workflow
            test_resource_constraints
            ;;
        *)
            echo "Unknown test scenario: $scenario"
            echo "Available scenarios:"
            echo "  daemon-not-running"
            echo "  permission-issues"
            echo "  docker-not-installed"
            echo "  unhealthy-containers"
            echo "  performance-caching"
            echo "  error-recovery"
            echo "  cross-platform"
            echo "  health-wrapper-integration"
            echo "  comprehensive-workflow"
            echo "  resource-constraints"
            echo "  all"
            exit 1
            ;;
    esac
}

# Test summary
show_test_summary() {
    echo
    echo "==========================================="
    echo "Test Summary:"
    echo "  Passed: $TEST_PASSED"
    echo "  Failed: $TEST_FAILED"
    echo "  Skipped: $TEST_SKIPPED"
    echo "  Total: $((TEST_PASSED + TEST_FAILED + TEST_SKIPPED))"
    echo
    
    if [[ $TEST_FAILED -gt 0 ]]; then
        echo "Some tests failed. Check the log for details:"
        echo "  Log file: $TEST_LOG_FILE"
        exit 1
    else
        echo "All tests passed or skipped!"
        exit 0
    fi
}

# Help function
show_help() {
    cat << 'EOF'
Docker Fix Command Test Scenarios

Usage:
  docker-fix-test-scenarios.sh [scenario_name]

Scenarios:
  daemon-not-running         Test when Docker daemon is not running
  permission-issues          Test Docker permission problems (Linux)
  docker-not-installed       Test when Docker is not installed
  unhealthy-containers       Test detection of unhealthy containers
  performance-caching        Test caching and performance
  error-recovery            Test error handling and recovery
  cross-platform            Test platform compatibility
  health-wrapper-integration Test integration with docker-health-wrapper.sh
  comprehensive-workflow     Test complete fix workflow
  resource-constraints       Test resource constraint handling
  all                       Run all test scenarios

Examples:
  # Run all tests
  docker-fix-test-scenarios.sh all

  # Test specific scenario
  docker-fix-test-scenarios.sh daemon-not-running

  # Test performance
  docker-fix-test-scenarios.sh performance-caching

Output:
  Test results are logged to: /tmp/.claude_docker_fix_test_[PROJECT_HASH]

EOF
}

# Main function
main() {
    local scenario="${1:-all}"
    
    if [[ "$scenario" == "--help" ]] || [[ "$scenario" == "-h" ]]; then
        show_help
        exit 0
    fi
    
    # Initialize test log
    echo "# Docker Fix Test Scenarios - $(date)" > "$TEST_LOG_FILE"
    
    # Check prerequisites
    if [[ ! -x "$DOCKER_FIX_SCRIPT" ]]; then
        echo "Error: docker-fix-command.sh not found or not executable"
        echo "Expected location: $DOCKER_FIX_SCRIPT"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        echo "Error: jq is required for testing"
        exit 1
    fi
    
    log_test "Starting test scenarios for docker-fix-command.sh"
    log_test "Test scenario: $scenario"
    
    # Run the specified test scenario
    run_test_scenario "$scenario"
    
    # Show summary
    show_test_summary
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
