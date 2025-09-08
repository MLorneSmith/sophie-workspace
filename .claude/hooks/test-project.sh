#!/bin/bash
# Test Project Hook
# Runs full unit test suite at session end
# Adapted from ClaudeKit for shell-based implementation

set -euo pipefail

# Configuration
TIMEOUT_SECONDS=55  # Under Claude Code's 60s limit
CONFIG_FILE=".claude/settings.json"

# Get payload from stdin
PAYLOAD=$(cat)

# Check if already in a stop hook loop
STOP_HOOK_ACTIVE=$(echo "$PAYLOAD" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# Check if package.json exists and has test scripts
if [ ! -f "package.json" ]; then
  exit 0
fi

# Check for test script in package.json
if ! grep -q '"test"' package.json && ! grep -q '"test:unit"' package.json; then
  exit 0
fi

echo "" >&2
echo "════════════════════════════════════════════════════════════" >&2
echo "🧪 Running Project Unit Test Suite" >&2
echo "════════════════════════════════════════════════════════════" >&2

# Check for custom test command in config
CUSTOM_COMMAND=""
if [ -f "$CONFIG_FILE" ]; then
  CUSTOM_COMMAND=$(jq -r '.["test-project"].command // ""' "$CONFIG_FILE" 2>/dev/null || echo "")
fi

# Determine test command
if [ -n "$CUSTOM_COMMAND" ]; then
  TEST_COMMAND="$CUSTOM_COMMAND"
  echo "📋 Using custom command: $TEST_COMMAND" >&2
else
  # Default to unit tests only (fast, reliable)
  TEST_COMMAND="pnpm test:unit"
  echo "📋 Running unit tests (configure in $CONFIG_FILE for different command)" >&2
fi

# Start timer
START_TIME=$(date +%s)

# Run tests with timeout
# Use timeout command if available, otherwise rely on test framework timeout
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout $TIMEOUT_SECONDS"
else
  TIMEOUT_CMD=""
fi

echo "⏱️  Timeout: ${TIMEOUT_SECONDS}s" >&2
echo "────────────────────────────────────────────────────────────" >&2

# Execute test command and capture result
TEST_OUTPUT_FILE=$(mktemp)
TEST_EXIT_CODE=0

# Run test command (preserve pnpm environment variables)
if $TIMEOUT_CMD $TEST_COMMAND > "$TEST_OUTPUT_FILE" 2>&1; then
  TEST_EXIT_CODE=0
else
  TEST_EXIT_CODE=$?
fi

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Display test output
cat "$TEST_OUTPUT_FILE" >&2

echo "────────────────────────────────────────────────────────────" >&2

# Check for timeout (exit code 124 from timeout command)
if [ "$TEST_EXIT_CODE" -eq 124 ]; then
  echo "" >&2
  echo "⏱️  TEST SUITE TIMEOUT" >&2
  echo "────────────────────────────────────────────────────────────" >&2
  echo "The test suite was terminated after ${TIMEOUT_SECONDS}s" >&2
  echo "" >&2
  echo "RECOMMENDED ACTIONS:" >&2
  echo "1. Configure a faster test command in $CONFIG_FILE:" >&2
  echo '   {' >&2
  echo '     "hooks": {' >&2
  echo '       "test-project": {' >&2
  echo '         "command": "pnpm test:unit --shard=1/4"' >&2
  echo '       }' >&2
  echo '     }' >&2
  echo '   }' >&2
  echo "" >&2
  echo "2. Or disable this hook in $CONFIG_FILE" >&2
  echo "3. Or run tests manually: pnpm test:unit" >&2
  echo "════════════════════════════════════════════════════════════" >&2
  
  # Clean up
  rm -f "$TEST_OUTPUT_FILE"
  
  # Don't block on timeout
  exit 0
fi

# Display results
if [ "$TEST_EXIT_CODE" -eq 0 ]; then
  echo "" >&2
  echo "✅ ALL TESTS PASSED" >&2
  echo "────────────────────────────────────────────────────────────" >&2
  echo "Duration: ${DURATION}s" >&2
  echo "════════════════════════════════════════════════════════════" >&2
  
  # Clean up
  rm -f "$TEST_OUTPUT_FILE"
  exit 0
else
  echo "" >&2
  echo "❌ TEST FAILURES DETECTED" >&2
  echo "────────────────────────────────────────────────────────────" >&2
  echo "Duration: ${DURATION}s" >&2
  echo "" >&2
  echo "🔧 REQUIRED ACTIONS:" >&2
  echo "────────────────────────────────────────────────────────────" >&2
  echo "You MUST fix ALL test failures before committing:" >&2
  echo "" >&2
  echo "1. Review the test output above to identify failures" >&2
  echo "2. Run failing tests individually for detailed output" >&2
  echo "3. Fix each failure by:" >&2
  echo "   - Understanding what the test expects" >&2
  echo "   - Determining if test or code needs updating" >&2
  echo "   - Making necessary corrections" >&2
  echo "" >&2
  echo "4. Run full suite to verify: $TEST_COMMAND" >&2
  echo "" >&2
  echo "⚠️  DO NOT:" >&2
  echo "   - Skip or disable failing tests" >&2
  echo "   - Comment out test assertions" >&2
  echo "   - Use .skip() or .only() in tests" >&2
  echo "   - Commit with failing tests" >&2
  echo "════════════════════════════════════════════════════════════" >&2
  
  # Clean up
  rm -f "$TEST_OUTPUT_FILE"
  
  # Exit with error code 2 to indicate test failures
  # This blocks the session from ending until tests are fixed
  exit 2
fi