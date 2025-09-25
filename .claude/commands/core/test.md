---
description: Execute comprehensive test suites with intelligent orchestration and detailed reporting
allowed-tools: [Bash, Read, TodoWrite]
category: quality
argument-hint: [--quick | --unit | --e2e | --debug | --continue]
---

# Test Command

Execute comprehensive test suites with intelligent orchestration, detailed reporting, and flexible configuration options.

## Key Features
- **Multi-Suite Orchestration**: Runs unit, integration, and E2E tests in optimal order
- **Intelligent Parallelization**: Executes independent test suites simultaneously
- **Detailed Reporting**: Provides comprehensive test results and coverage metrics
- **Flexible Configuration**: Supports quick, focused, and debug modes
- **Deterministic Execution**: Bypasses timeouts for long-running test suites

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/standards/code-standards.md

## Prompt

You are a Test Execution Assistant that runs test suites with real-time progress visibility. You execute tests directly using the Bash tool to ensure users can see live output, just like running pnpm commands directly.

## Instructions

Parse the test arguments and execute the appropriate test commands directly:

```bash
# Parse arguments from user input
ARGS="${ARGUMENTS:-}"

# Build argument string for test controller
TEST_ARGS=""
[[ "$ARGS" == *"--quick"* ]] && TEST_ARGS="$TEST_ARGS --quick"
[[ "$ARGS" == *"--unit"* ]] && TEST_ARGS="$TEST_ARGS --unit"
[[ "$ARGS" == *"--e2e"* ]] && TEST_ARGS="$TEST_ARGS --e2e"
[[ "$ARGS" == *"--debug"* ]] && TEST_ARGS="$TEST_ARGS --debug"
[[ "$ARGS" == *"--continue"* ]] && TEST_ARGS="$TEST_ARGS --continue"

# Check for test controller
TEST_CONTROLLER=".claude/scripts/testing/infrastructure/test-controller.cjs"

echo "🚀 Starting test execution with live progress..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Execute tests directly for real-time output visibility
if [[ -f "$TEST_CONTROLLER" ]]; then
  # Use test controller for organized execution
  if [[ "$ARGS" == *"--debug"* ]]; then
    DEBUG_TEST=true node "$TEST_CONTROLLER" $TEST_ARGS
  else
    node "$TEST_CONTROLLER" $TEST_ARGS
  fi
  EXIT_CODE=$?
else
  # Fallback to direct pnpm commands
  echo "📦 Using direct test execution..."

  if [[ "$ARGS" == *"--unit"* ]]; then
    pnpm test:unit
    EXIT_CODE=$?
  elif [[ "$ARGS" == *"--e2e"* ]]; then
    pnpm test:e2e
    EXIT_CODE=$?
  elif [[ "$ARGS" == *"--quick"* ]]; then
    pnpm test:unit -- --testPathPattern="smoke"
    EXIT_CODE=$?
  else
    # Run all tests
    pnpm test:unit && pnpm test:e2e
    EXIT_CODE=$?
  fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Report final status
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "✅ **TEST EXECUTION SUCCESSFUL**"
else
  echo "❌ **TEST EXECUTION FAILED**"
  echo ""
  echo "💡 Debugging Tips:"
  echo "  • Re-run with --debug for verbose output"
  echo "  • Use --unit or --e2e to run specific suites"
  echo "  • Add --continue to run all tests despite failures"
fi

exit $EXIT_CODE
```

## Help

🧪 **Test Command - Live Test Execution**

Execute test suites with real-time progress visibility.

**Usage:**
- `/test` - Run full test suite
- `/test --quick` - Quick smoke tests
- `/test --unit` - Unit tests only
- `/test --e2e` - E2E tests only
- `/test --debug` - Enable debug output
- `/test --continue` - Continue on failures

**Key Features:**
- **Live Progress**: See test output in real-time
- **Direct Execution**: No subagent buffering
- **Full Visibility**: Same experience as running pnpm commands

The command now executes tests directly instead of using a subagent, providing immediate feedback on test progress and results.