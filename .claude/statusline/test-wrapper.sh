#!/bin/bash

# Test wrapper script that tracks test execution status for Claude statusline
# Usage: test-wrapper.sh [test command and arguments]

# Status file for tracking test results
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
TEMP_OUTPUT="/tmp/test_output_$$"

# Mark test as running
echo "running|$(date +%s)|0|0|0" > "$TEST_STATUS_FILE"

# Run the actual test command and capture output
"$@" 2>&1 | tee "$TEMP_OUTPUT"
TEST_EXIT_CODE=${PIPESTATUS[0]}

# Parse test results based on common test framework outputs
if [ $TEST_EXIT_CODE -eq 0 ]; then
    # Try to extract test counts from output if possible
    # This regex pattern works for Jest, Vitest, Playwright, and similar frameworks
    PASSED=$(grep -E "([0-9]+) (passed|passing|pass)" "$TEMP_OUTPUT" 2>/dev/null | grep -oE "[0-9]+" | tail -1 || echo "0")
    FAILED="0"
    SKIPPED=$(grep -E "([0-9]+) (skipped|skip)" "$TEMP_OUTPUT" 2>/dev/null | grep -oE "[0-9]+" | tail -1 || echo "0")
    TOTAL="$PASSED"
    echo "success|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
else
    # Try to extract failure counts - check for various test framework output patterns
    # Playwright pattern: "X failed"
    # Vitest/Jest pattern: "X failed", "X failing"
    # Generic pattern: "FAIL", "FAILED", "✗", "✕"
    
    # Look for explicit failure counts
    FAILED=$(grep -E "([0-9]+) (failed|failing|fail)" "$TEMP_OUTPUT" 2>/dev/null | grep -oE "[0-9]+" | tail -1 || echo "")
    
    # If no explicit count, count FAIL/FAILED occurrences
    if [ -z "$FAILED" ] || [ "$FAILED" = "0" ]; then
        FAILED=$(grep -cE "(FAIL|FAILED|✗|✕)" "$TEMP_OUTPUT" 2>/dev/null || echo "1")
    fi
    
    # Make sure we have at least 1 failure if exit code is non-zero
    [ "$FAILED" = "0" ] && FAILED="1"
    
    PASSED=$(grep -E "([0-9]+) (passed|passing|pass)" "$TEMP_OUTPUT" 2>/dev/null | grep -oE "[0-9]+" | tail -1 || echo "0")
    TOTAL=$((PASSED + FAILED))
    echo "failed|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
fi

# Clean up temp file if it exists
rm -f "$TEMP_OUTPUT"

# Exit with the same code as the test command
exit $TEST_EXIT_CODE