#!/bin/bash

# Deterministic Test Runner Wrapper
# Simple bash script to execute tests without LLM involvement

set -e

# Get project root
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$PROJECT_ROOT"

# Parse arguments
RUN_UNIT=true
RUN_E2E=true
DEBUG_MODE=false
CONTINUE_ON_FAILURE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --unit)
      RUN_UNIT=true
      RUN_E2E=false
      shift
      ;;
    --e2e)
      RUN_UNIT=false
      RUN_E2E=true
      shift
      ;;
    --all)
      RUN_UNIT=true
      RUN_E2E=true
      shift
      ;;
    --debug)
      DEBUG_MODE=true
      export DEBUG_TEST=true
      shift
      ;;
    --continue)
      CONTINUE_ON_FAILURE=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Build arguments for Node.js controller
ARGS=""
if [ "$RUN_UNIT" = true ] && [ "$RUN_E2E" = false ]; then
  ARGS="$ARGS --unit"
fi
if [ "$RUN_E2E" = true ] && [ "$RUN_UNIT" = false ]; then
  ARGS="$ARGS --e2e"
fi
if [ "$DEBUG_MODE" = true ]; then
  ARGS="$ARGS --debug"
fi
if [ "$CONTINUE_ON_FAILURE" = true ]; then
  ARGS="$ARGS --continue"
fi

# Show what we're about to do
echo "🎯 Test Execution Plan"
echo "━━━━━━━━━━━━━━━━━━━━━"
echo "  Unit Tests: $([ "$RUN_UNIT" = true ] && echo "✅ Enabled" || echo "⏭️ Skipped")"
echo "  E2E Tests:  $([ "$RUN_E2E" = true ] && echo "✅ Enabled" || echo "⏭️ Skipped")"
echo "  Debug Mode: $([ "$DEBUG_MODE" = true ] && echo "🔍 Enabled" || echo "📝 Standard")"
echo ""

# Execute the Node.js controller
exec node "$PROJECT_ROOT/.claude/scripts/test-controller.cjs" $ARGS