#!/bin/bash
# Test wrapper script that tracks test execution status for Claude statusline
# Usage: test-wrapper.sh [test command and arguments]
# Example: test-wrapper.sh pnpm test
# Example: test-wrapper.sh npm run test:unit

# Get script directory and source common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/status-common.sh
source "$SCRIPT_DIR/lib/status-common.sh"

# Exit on error, but capture exit codes for reporting
set -u

# Temp file for capturing test output
TEMP_OUTPUT="/tmp/test_output_$$"

# Cleanup function
cleanup() {
    local exit_code=$?
    rm -f "$TEMP_OUTPUT"
    clear_process_running "test"
    exit $exit_code
}
trap cleanup EXIT INT TERM

# ============================================================================
# Output Parsing Functions
# ============================================================================

# Parse test results from various test frameworks
# Returns: passed|failed|total
parse_test_results() {
    local output_file="$1"
    local exit_code="$2"
    local passed=0
    local failed=0
    local skipped=0
    local total=0

    log_debug "Parsing test results from: $output_file (exit code: $exit_code)"

    # ========================================================================
    # Success Case (exit code 0)
    # ========================================================================
    if [ "$exit_code" -eq 0 ]; then
        # Vitest: "X passed" or "✓ X tests passed"
        if grep -qE "([0-9]+) (passed|test.*passed)" "$output_file" 2>/dev/null; then
            passed=$(grep -oE "([0-9]+) (passed|test.*passed)" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        # Jest: "X passed, X total"
        if [ "$passed" -eq 0 ] && grep -qE "[0-9]+ passed.*[0-9]+ total" "$output_file" 2>/dev/null; then
            passed=$(grep -oE "([0-9]+) passed" "$output_file" | grep -oE "[0-9]+" | head -1)
        fi

        # Playwright: "X passed"
        if [ "$passed" -eq 0 ] && grep -qE "[0-9]+ passed" "$output_file" 2>/dev/null; then
            passed=$(grep -oE "([0-9]+) passed" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        # Mocha: "X passing"
        if [ "$passed" -eq 0 ] && grep -qE "[0-9]+ passing" "$output_file" 2>/dev/null; then
            passed=$(grep -oE "([0-9]+) passing" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        # Skipped tests (optional)
        if grep -qE "[0-9]+ (skipped|skip)" "$output_file" 2>/dev/null; then
            skipped=$(grep -oE "([0-9]+) (skipped|skip)" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        failed=0
        total=$((passed + skipped))

        log_debug "Tests passed: $passed, skipped: $skipped, total: $total"

    # ========================================================================
    # Failure Case (exit code non-zero)
    # ========================================================================
    else
        # Try to extract passed count even on failure
        if grep -qE "([0-9]+) (passed|passing)" "$output_file" 2>/dev/null; then
            passed=$(grep -oE "([0-9]+) (passed|passing)" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        # Vitest/Jest: "X failed"
        if grep -qE "([0-9]+) failed" "$output_file" 2>/dev/null; then
            failed=$(grep -oE "([0-9]+) failed" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        # Playwright: "X failed"
        if [ "$failed" -eq 0 ] && grep -qE "[0-9]+ failed" "$output_file" 2>/dev/null; then
            failed=$(grep -oE "([0-9]+) failed" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        # Mocha: "X failing"
        if [ "$failed" -eq 0 ] && grep -qE "[0-9]+ failing" "$output_file" 2>/dev/null; then
            failed=$(grep -oE "([0-9]+) failing" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        # Generic: Count FAIL/FAILED markers
        if [ "$failed" -eq 0 ]; then
            failed=$(grep -cE "(FAIL|FAILED|✗|✕)" "$output_file" 2>/dev/null || echo "0")
        fi

        # Ensure at least 1 failure if exit code non-zero
        if [ "$failed" -eq 0 ]; then
            failed=1
        fi

        # Skipped tests
        if grep -qE "[0-9]+ (skipped|skip)" "$output_file" 2>/dev/null; then
            skipped=$(grep -oE "([0-9]+) (skipped|skip)" "$output_file" | grep -oE "[0-9]+" | tail -1)
        fi

        total=$((passed + failed + skipped))

        log_debug "Tests failed: passed=$passed, failed=$failed, skipped=$skipped, total=$total"
    fi

    # Sanitize all numbers
    passed=$(sanitize_number "$passed" "0")
    failed=$(sanitize_number "$failed" "0")
    total=$(sanitize_number "$total" "$((passed + failed))")

    echo "${passed}|${failed}|${total}"
}

# ============================================================================
# Main Execution
# ============================================================================

log_debug "Test wrapper started with args: $*"

# Validate we have a command to run
if [ $# -eq 0 ]; then
    log_error "No test command specified"
    echo "Usage: $0 <test command and arguments>"
    echo "Example: $0 pnpm test"
    exit 1
fi

# Mark test as running
mark_process_running "test"
log_debug "Test process marked as running (PID: $$)"

# Run the actual test command and capture output
log_debug "Executing test command: $*"
"$@" 2>&1 | tee "$TEMP_OUTPUT"
TEST_EXIT_CODE=${PIPESTATUS[0]}

log_debug "Test command completed with exit code: $TEST_EXIT_CODE"

# Parse results
RESULTS=$(parse_test_results "$TEMP_OUTPUT" "$TEST_EXIT_CODE")
IFS='|' read -r PASSED FAILED TOTAL <<< "$RESULTS"

log_debug "Parsed results: passed=$PASSED, failed=$FAILED, total=$TOTAL"

# Adjust for intentional test failures (test-configuration-verification.spec.ts)
# This test file contains 3 intentional failures to verify Playwright configuration
if grep -q "test-configuration-verification.spec.ts" "$TEMP_OUTPUT" 2>/dev/null; then
    INTENTIONAL_FAILURES=3

    # Count how many intentional failures actually failed
    INTENTIONAL_COUNT=$(grep -c "Intentional FAILURE" "$TEMP_OUTPUT" 2>/dev/null || echo "0")

    # Only subtract if we found the expected intentional failures
    if [ "$INTENTIONAL_COUNT" -ge "$INTENTIONAL_FAILURES" ]; then
        FAILED=$((FAILED - INTENTIONAL_FAILURES))
        log_debug "Excluded $INTENTIONAL_FAILURES intentional failures. Adjusted failed count: $FAILED"
    fi
fi

# Update status based on results
if [ "$TEST_EXIT_CODE" -eq 0 ]; then
    log_debug "Tests succeeded"
    update_test_status "success" "$PASSED" "$FAILED" "$TOTAL"
else
    # Mark as success if all failures were intentional
    if [ "$FAILED" -eq 0 ]; then
        log_debug "All failures were intentional - marking as success"
        update_test_status "success" "$PASSED" "$FAILED" "$TOTAL"
    else
        log_debug "Tests failed"
        update_test_status "failed" "$PASSED" "$FAILED" "$TOTAL"
    fi
fi

# Cleanup happens in trap, exit with same code as test command
exit $TEST_EXIT_CODE
