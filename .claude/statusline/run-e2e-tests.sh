#!/bin/bash

# E2E test runner with statusline integration
# This script runs E2E tests and updates the Claude statusline status

# Get git root for consistent status file path
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
TEMP_OUTPUT="/tmp/e2e_test_output_$$"

# Mark test as running
echo "running|$(date +%s)|0|0|0" > "$TEST_STATUS_FILE"

echo "Running E2E tests..."

# Run the E2E tests and capture output
cd "$GIT_ROOT" && pnpm --filter web test:e2e 2>&1 | tee "$TEMP_OUTPUT"
TEST_EXIT_CODE=${PIPESTATUS[0]}

# Parse Playwright test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    # Extract passed count from Playwright output
    PASSED=$(grep -E "([0-9]+) passed" "$TEMP_OUTPUT" 2>/dev/null | grep -oE "[0-9]+" | tail -1 || echo "0")
    FAILED="0"
    echo "success|$(date +%s)|$PASSED|$FAILED|$PASSED" > "$TEST_STATUS_FILE"
    echo "✅ E2E tests passed: $PASSED tests"
else
    # Extract failure and pass counts from Playwright output
    FAILED=$(grep -E "([0-9]+) failed" "$TEMP_OUTPUT" 2>/dev/null | grep -oE "[0-9]+" | tail -1 || echo "1")
    PASSED=$(grep -E "([0-9]+) passed" "$TEMP_OUTPUT" 2>/dev/null | grep -oE "[0-9]+" | tail -1 || echo "0")
    TOTAL=$((PASSED + FAILED))
    echo "failed|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
    echo "❌ E2E tests failed: $FAILED failed, $PASSED passed"
fi

# Clean up temp file
rm -f "$TEMP_OUTPUT"

# Exit with the same code as the test command
exit $TEST_EXIT_CODE