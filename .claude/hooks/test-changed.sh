#!/bin/bash
# Test Changed Hook
# Runs tests related to changed files
# Adapted from ClaudeKit for shell-based implementation

set -euo pipefail

# Get payload from stdin
PAYLOAD=$(cat)

# Extract file path from payload
FILE_PATH=$(echo "$PAYLOAD" | jq -r '.tool_input.file_path // ""')

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only run tests for source files (not test files themselves)
if ! echo "$FILE_PATH" | grep -qE '\.(js|jsx|ts|tsx)$'; then
  exit 0
fi

# Skip test files themselves
if echo "$FILE_PATH" | grep -qE '\.(test|spec)\.(js|jsx|ts|tsx)$'; then
  exit 0
fi

# Skip files in node_modules or dist directories
if echo "$FILE_PATH" | grep -qE '(node_modules|dist|build|coverage)/'; then
  exit 0
fi

echo "🧪 Running tests related to: $FILE_PATH..." >&2

# Extract base name and directory
BASE_NAME=$(basename "$FILE_PATH" | sed 's/\.[^.]*$//')
DIR_NAME=$(dirname "$FILE_PATH")
EXT="${FILE_PATH##*.}"

# Find related test files
TEST_FILES=""

# Common test file patterns
TEST_PATTERNS=(
  "$DIR_NAME/$BASE_NAME.test.$EXT"
  "$DIR_NAME/$BASE_NAME.spec.$EXT"
  "$DIR_NAME/__tests__/$BASE_NAME.test.$EXT"
  "$DIR_NAME/__tests__/$BASE_NAME.spec.$EXT"
  "$DIR_NAME/../__tests__/$BASE_NAME.test.$EXT"
  "$DIR_NAME/../__tests__/$BASE_NAME.spec.$EXT"
)

# Check each pattern
for PATTERN in "${TEST_PATTERNS[@]}"; do
  if [ -f "$PATTERN" ]; then
    TEST_FILES="$TEST_FILES $PATTERN"
  fi
done

# Trim whitespace
TEST_FILES=$(echo "$TEST_FILES" | xargs)

# If no test files found, provide helpful message
if [ -z "$TEST_FILES" ]; then
  echo "⚠️  No test files found for $(basename "$FILE_PATH")" >&2
  echo "   Consider creating tests in: $DIR_NAME/$BASE_NAME.test.$EXT" >&2
  exit 0
fi

echo "📋 Found test files: $TEST_FILES" >&2

# Determine which package contains the file
if echo "$FILE_PATH" | grep -q "apps/web/"; then
  PACKAGE_FILTER="--filter web"
elif echo "$FILE_PATH" | grep -q "apps/web-e2e/"; then
  # Skip E2E tests in test-changed (too slow for instant feedback)
  echo "⏭️  Skipping E2E tests for instant feedback (will run in test-project)" >&2
  exit 0
elif echo "$FILE_PATH" | grep -q "packages/"; then
  # Extract package name
  PACKAGE_NAME=$(echo "$FILE_PATH" | sed -E 's|packages/([^/]+)/.*|\1|')
  PACKAGE_FILTER="--filter $PACKAGE_NAME"
else
  # Default to web package
  PACKAGE_FILTER="--filter web"
fi

# Run the tests using pnpm with vitest's related file detection
# Using --run for non-interactive mode and --reporter=verbose for clear output
echo "▶️  Running: pnpm $PACKAGE_FILTER test:unit --run -- $TEST_FILES" >&2

# Run tests and capture output
if pnpm $PACKAGE_FILTER test:unit --run -- $TEST_FILES 2>&1; then
  echo "✅ All related tests passed!" >&2
  exit 0
else
  EXIT_CODE=$?
  echo "" >&2
  echo "❌ Tests failed for $FILE_PATH" >&2
  echo "" >&2
  echo "🔧 Required Actions:" >&2
  echo "  1. Review the test output above to understand what's broken" >&2
  echo "  2. Run tests individually for details: pnpm $PACKAGE_FILTER test:unit -- $TEST_FILES" >&2
  echo "  3. Fix ALL failing tests by:" >&2
  echo "     - Reading each test to understand its purpose" >&2
  echo "     - Determining if the test or implementation needs updating" >&2
  echo "     - Updating whichever needs to change for correct behavior" >&2
  echo "     - NEVER skip or comment out tests" >&2
  echo "" >&2
  echo "💡 Common fixes:" >&2
  echo "  - Update mock data to match new types/interfaces" >&2
  echo "  - Fix async timing with proper await/waitFor" >&2
  echo "  - Update component props in tests to match changes" >&2
  echo "  - Ensure test state is properly reset" >&2
  echo "  - Check if API contracts have changed" >&2
  
  # Exit with code 2 to indicate hook failure (blocks further actions)
  exit 2
fi