#!/bin/bash

# Verification script to ensure test agents update statusline correctly

echo "=== Statusline Test Component Verification ==="

# Get git root
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
TEST_STATUS_FILE="/tmp/.claude_test_status_${GIT_ROOT//\//_}"
TEST_WRAPPER="$GIT_ROOT/.claude/statusline/test-wrapper.sh"

echo "Git Root: $GIT_ROOT"
echo "Status File: $TEST_STATUS_FILE"
echo "Test Wrapper: $TEST_WRAPPER"

# Check if wrapper exists
if [ -f "$TEST_WRAPPER" ]; then
    echo "✓ Test wrapper script found"
else
    echo "✗ Test wrapper script not found!"
    exit 1
fi

# Test status update simulation
echo "Testing status updates..."

# 1. Test running status
echo "running|$(date +%s)|0|0|0" > "$TEST_STATUS_FILE"
echo "Set status to: running"
sleep 1

# 2. Test success status
echo "success|$(date +%s)|100|0|100" > "$TEST_STATUS_FILE"
echo "Set status to: success (100 passed)"
sleep 1

# 3. Test failed status
echo "failed|$(date +%s)|95|5|100" > "$TEST_STATUS_FILE"
echo "Set status to: failed (95 passed, 5 failed)"
sleep 1

# Check if statusline reads it
if [ -f "$GIT_ROOT/.claude/statusline/statusline.sh" ]; then
    echo ""
    echo "Current statusline output:"
    # Create mock input for statusline
    echo '{"model": {"display_name": "Claude"}}' | "$GIT_ROOT/.claude/statusline/statusline.sh"
    echo ""
fi

# Cleanup
echo "success|$(date +%s)|0|0|0" > "$TEST_STATUS_FILE"

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Key requirements for test agents:"
echo "1. Always use wrapper: $TEST_WRAPPER"
echo "2. Status file format: status|timestamp|passed|failed|total"
echo "3. Valid statuses: running, success, failed"
echo "4. Update file at: $TEST_STATUS_FILE"