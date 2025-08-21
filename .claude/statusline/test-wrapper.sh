#!/bin/bash

# Test wrapper script that tracks test execution status for Claude statusline
# Usage: test-wrapper.sh [test command and arguments]

# Status file for tracking test results
TEST_STATUS_FILE="/tmp/.claude_test_status_${PWD//\//_}"

# Mark test as running
echo "running|$(date +%s)|0|0|0" > "$TEST_STATUS_FILE"

# Run the actual test command
"$@"
TEST_EXIT_CODE=$?

# Parse test results based on common test framework outputs
if [ $TEST_EXIT_CODE -eq 0 ]; then
    # Try to extract test counts from output if possible
    # This regex pattern works for Jest, Vitest, and similar frameworks
    PASSED=$(grep -E "([0-9]+) (passed|passing)" /tmp/test_output_$$ 2>/dev/null | grep -oE "[0-9]+" | head -1 || echo "0")
    FAILED="0"
    TOTAL="$PASSED"
    echo "success|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
else
    # Try to extract failure counts
    FAILED=$(grep -E "([0-9]+) (failed|failing)" /tmp/test_output_$$ 2>/dev/null | grep -oE "[0-9]+" | head -1 || echo "1")
    PASSED=$(grep -E "([0-9]+) (passed|passing)" /tmp/test_output_$$ 2>/dev/null | grep -oE "[0-9]+" | head -1 || echo "0")
    TOTAL=$((PASSED + FAILED))
    echo "failed|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
fi

# Clean up temp file if it exists
rm -f /tmp/test_output_$$

# Exit with the same code as the test command
exit $TEST_EXIT_CODE