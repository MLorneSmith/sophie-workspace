#!/usr/bin/env bash
#
# Minimal Test Runner
# Absolutely minimal output to prevent Claude Code crashes
# Shows ONLY final summary - all details in log file

set -euo pipefail

# Configuration
LOG_FILE="${TEST_OUTPUT_FILE:-/tmp/test-output.log}"
CONTROLLER_SCRIPT="$(dirname "$0")/test-controller.cjs"

# Clear old log
> "$LOG_FILE"

# Run tests with ALL output to log file only
# No intermediate output to prevent buffering issues
node "$CONTROLLER_SCRIPT" "$@" &> "$LOG_FILE"
TEST_EXIT_CODE=$?

# Now show ONLY the summary (no risk of overflow)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Parse results (safe - only extracts numbers)
PASSED=$(grep -o "[0-9]* passed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]*" || echo "0")
FAILED=$(grep -o "[0-9]* failed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]*" || echo "0")

if [[ $FAILED -eq 0 ]]; then
    echo "✓ All tests passed ($PASSED tests)"
else
    echo "✗ Tests failed: $PASSED passed, $FAILED failed"
fi

echo ""
LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
echo "Full log: $LOG_FILE ($LOG_SIZE)"
echo ""
echo "View details:"
echo "  cat $LOG_FILE | less"
echo "  grep -i error $LOG_FILE"
echo "  grep 'FAIL' $LOG_FILE"
echo ""

exit $TEST_EXIT_CODE
