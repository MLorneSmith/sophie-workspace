#!/bin/bash

# Parse test output and update Claude statusline test status
# Usage: echo "test output" | parse-test-output.sh
# Or: parse-test-output.sh < test-output.txt

# Get git root for consistent status file path
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"

# Read all input into a variable
INPUT=$(cat)

# Check if tests failed based on common patterns
if echo "$INPUT" | grep -qE "(FAIL|FAILED|✗|✕|failed|failing|Error:|Test failed|Tests failed|test failures|accessibility violations)"; then
    # Tests failed - try to extract counts
    
    # Look for Playwright-specific patterns
    FAILED=$(echo "$INPUT" | grep -E "([0-9]+) failed" | grep -oE "[0-9]+" | tail -1)
    PASSED=$(echo "$INPUT" | grep -E "([0-9]+) passed" | grep -oE "[0-9]+" | tail -1)
    
    # If no Playwright pattern, look for other patterns
    if [ -z "$FAILED" ]; then
        # Count occurrences of failure indicators
        FAILED=$(echo "$INPUT" | grep -cE "(FAIL|FAILED|✗|✕|test failed)" || echo "1")
    fi
    
    # Default values if not found
    FAILED=${FAILED:-1}
    PASSED=${PASSED:-0}
    TOTAL=$((PASSED + FAILED))
    
    echo "failed|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
    echo "❌ Test status updated: failed ($FAILED failed, $PASSED passed)"
    
elif echo "$INPUT" | grep -qE "(PASS|PASSED|✓|✔|All tests passed|Tests passed|Success)"; then
    # Tests passed - try to extract counts
    
    # Look for pass count
    PASSED=$(echo "$INPUT" | grep -E "([0-9]+) (passed|pass)" | grep -oE "[0-9]+" | tail -1)
    
    # Default value if not found
    PASSED=${PASSED:-1}
    FAILED=0
    TOTAL=$PASSED
    
    echo "success|$(date +%s)|$PASSED|$FAILED|$TOTAL" > "$TEST_STATUS_FILE"
    echo "✅ Test status updated: success ($PASSED passed)"
    
else
    # Could not determine test status
    echo "⚠️  Could not determine test status from output"
    echo "Hint: Pipe test output to this script or use update-test-status.sh manually"
fi