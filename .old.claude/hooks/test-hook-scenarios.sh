#!/bin/bash
#
# Test Hook Scenarios - Verify thinking-level.sh works correctly with different inputs
#

set -euo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
HOOK_SCRIPT="$PROJECT_ROOT/.claude/hooks/thinking-level.sh"

echo "Testing thinking-level.sh hook scenarios..."
echo "============================================"

# Test 1: JSON input with /codecheck (should be level 0 - no output)
echo "Test 1: JSON input with /codecheck"
result=$(echo '{"prompt": "/codecheck", "session_id": "test"}' | bash "$HOOK_SCRIPT")
if [ -z "$result" ]; then
    echo "✅ PASS - No output (level 0)"
else
    echo "❌ FAIL - Got output: '$result'"
fi
echo

# Test 2: JSON input with /core:codecheck (should be level 0 - no output)
echo "Test 2: JSON input with /core:codecheck"
result=$(echo '{"prompt": "/core:codecheck", "session_id": "test"}' | bash "$HOOK_SCRIPT")
if [ -z "$result" ]; then
    echo "✅ PASS - No output (level 0)"
else
    echo "❌ FAIL - Got output: '$result'"
fi
echo

# Test 3: JSON input with thinking command (should be level 1 - "think")
echo "Test 3: JSON input with implement command"
result=$(echo '{"prompt": "implement a new feature", "session_id": "test"}' | bash "$HOOK_SCRIPT")
if [ "$result" = "think" ]; then
    echo "✅ PASS - Got 'think' (level 1)"
else
    echo "❌ FAIL - Got: '$result'"
fi
echo

# Test 4: Raw text input for backward compatibility
echo "Test 4: Raw text input with /codecheck"
result=$(echo "/codecheck" | bash "$HOOK_SCRIPT")
if [ -z "$result" ]; then
    echo "✅ PASS - No output (level 0)"
else
    echo "❌ FAIL - Got output: '$result'"
fi
echo

# Test 5: JSON input with complex task (should be level 2 - "think hard")
echo "Test 5: JSON input with research command"
result=$(echo '{"prompt": "research and analyze the codebase architecture", "session_id": "test"}' | bash "$HOOK_SCRIPT")
if [ "$result" = "think hard" ]; then
    echo "✅ PASS - Got 'think hard' (level 2)"
else
    echo "❌ FAIL - Got: '$result'"
fi
echo

echo "Test completed!"