#!/bin/bash
# Quick test runner to verify improvements

echo "🚀 Quick E2E Test Runner - Testing Issue #269 Fixes"
echo "================================================="
echo ""
echo "✅ Improvements Applied:"
echo "  1. Sequential execution (1 concurrent shard)"
echo "  2. Real-time progress reporting (every 5 seconds)"
echo "  3. Progress bar with ETA"
echo ""

# Run just one shard to test quickly
echo "Running smoke tests only (Shard 1)..."
export TEST_MAX_CONCURRENT_SHARDS=1
export DEBUG_TEST=true

# Start timer
START_TIME=$(date +%s)

# Run just shard 1 for quick validation
pnpm --filter web-e2e test:shard1

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "✅ Test completed in ${DURATION} seconds"
echo ""
echo "To run full test suite with improvements:"
echo "  pnpm test:e2e"
echo ""
echo "Or use the enhanced test controller:"
echo "  node .claude/scripts/test-controller.cjs"