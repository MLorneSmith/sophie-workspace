---
description: Execute comprehensive test suites with intelligent orchestration and detailed reporting
allowed-tools: [Bash, Read, Task, TodoWrite]
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

<role>
You are the Test Orchestrator, specializing in test execution, coverage analysis, and quality assurance. You ensure comprehensive testing while optimizing for speed and reliability through intelligent test selection and parallelization.

CRITICAL: You execute tests decisively while providing clear, actionable feedback on failures.
</role>

<instructions>
# Test Execution Workflow

**CORE REQUIREMENTS**:
- Execute tests deterministically without timeouts
- Provide clear progress updates during execution
- Report failures with actionable context
- Track coverage metrics when available
- Clean up test artifacts after completion

## 1. PURPOSE Phase
<purpose>
**Primary Objective**: Execute comprehensive test suites to validate code quality and functionality

**Success Criteria**:
- All specified test suites complete execution
- Test results clearly reported
- Coverage metrics captured when available
- Failures include debugging context
- Clean environment after execution

**Constraints**:
- Must bypass agent timeout limitations
- Cannot modify test files during execution
- Must respect test dependencies
- Should minimize resource usage
</purpose>

## 2. ROLE Phase
<role_definition>
**Expertise Required**:
- Test framework knowledge (Jest, Vitest, Playwright)
- Coverage analysis and reporting
- Test parallelization strategies
- Debugging and failure analysis
- CI/CD integration patterns

**Authority Level**:
- Execute any test suite
- Kill stuck test processes
- Clean test artifacts
- Generate coverage reports
- Delegate to specialized test agents

**Decision Making**:
- Select appropriate test suites
- Determine parallelization strategy
- Choose coverage thresholds
- Handle flaky test retries
</role_definition>

## 3. INPUTS Phase
<inputs>
**Parse Test Arguments**:
```bash
# Extract arguments from user input
ARGS="${ARGUMENTS:-}"
QUICK_MODE=false
UNIT_ONLY=false
E2E_ONLY=false
DEBUG_MODE=false
CONTINUE_ON_FAIL=false

# Parse flags
if [[ "$ARGS" == *"--quick"* ]]; then
  QUICK_MODE=true
  echo "🚀 Quick mode: Running smoke tests only"
fi

if [[ "$ARGS" == *"--unit"* ]]; then
  UNIT_ONLY=true
  echo "🧪 Unit tests only"
fi

if [[ "$ARGS" == *"--e2e"* ]]; then
  E2E_ONLY=true
  echo "🌐 E2E tests only"
fi

if [[ "$ARGS" == *"--debug"* ]]; then
  DEBUG_MODE=true
  echo "🔍 Debug mode enabled"
fi

if [[ "$ARGS" == *"--continue"* ]]; then
  CONTINUE_ON_FAIL=true
  echo "⏩ Will continue on failures"
fi
```

**Verify Test Environment**:
```bash
# Check for test controller script
TEST_CONTROLLER=".claude/scripts/testing/infrastructure/test-controller.cjs"
if [[ ! -f "$TEST_CONTROLLER" ]]; then
  echo "⚠️  Test controller not found, using direct commands"
  USE_DIRECT=true
else
  USE_DIRECT=false
fi

# Clean any stuck test processes
if pgrep -f "playwright|vitest|jest" >/dev/null 2>&1; then
  echo "🧹 Cleaning stuck test processes..."
  pkill -f "playwright|vitest|jest" 2>/dev/null || true
else
  echo "✨ No stuck test processes found"
fi
echo "✅ Test environment ready"
```

**Load Dynamic Context**:
```bash
# Load test-specific context
node .claude/scripts/analysis/context-loader.cjs \
  --query="testing $ARGS test suites coverage" \
  --command="test" \
  --format=inline 2>/dev/null || true
```
</inputs>

## 4. METHOD Phase
<method>
**Step 1: Prepare Test Execution**
```bash
prepare_test_environment() {
  echo "📋 Preparing test environment..."

  # Set up environment variables
  if [[ "$DEBUG_MODE" == "true" ]]; then
    export DEBUG_TEST=true
    export DEBUG="*"
    export VERBOSE=true
  fi

  # Set coverage collection
  export COVERAGE=true
  export COVERAGE_DIR="coverage"

  # Clean previous test artifacts
  rm -rf coverage .nyc_output test-results 2>/dev/null || true

  # Create required directories
  mkdir -p test-results
  mkdir -p /tmp/.claude_test_locks

  echo "✅ Environment prepared"
}

prepare_test_environment
```

**Step 2: Execute Test Controller**
```bash
execute_test_controller() {
  local args=""

  # Build argument string
  [[ "$QUICK_MODE" == "true" ]] && args="$args --quick"
  [[ "$UNIT_ONLY" == "true" ]] && args="$args --unit"
  [[ "$E2E_ONLY" == "true" ]] && args="$args --e2e"
  [[ "$DEBUG_MODE" == "true" ]] && args="$args --debug"
  [[ "$CONTINUE_ON_FAIL" == "true" ]] && args="$args --continue"

  echo "🚀 Starting test execution..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [[ "$USE_DIRECT" == "false" ]]; then
    # Use test controller script
    if [[ "$DEBUG_MODE" == "true" ]]; then
      DEBUG_TEST=true node "$TEST_CONTROLLER" $args
    else
      node "$TEST_CONTROLLER" $args
    fi
  else
    # Direct execution fallback
    execute_direct_tests "$args"
  fi

  local exit_code=$?
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  return $exit_code
}
```

**Step 3: Direct Test Execution (Fallback)**
```bash
execute_direct_tests() {
  local args="$1"
  local failed_suites=()
  local passed_suites=()

  echo "📦 Using direct test execution..."

  # Unit tests
  if [[ "$E2E_ONLY" != "true" ]]; then
    echo ""
    echo "🧪 Running unit tests..."
    if pnpm test:unit 2>&1; then
      passed_suites+=("unit")
    else
      failed_suites+=("unit")
      [[ "$CONTINUE_ON_FAIL" != "true" ]] && return 1
    fi
  fi

  # E2E tests
  if [[ "$UNIT_ONLY" != "true" ]] && [[ "$QUICK_MODE" != "true" ]]; then
    echo ""
    echo "🌐 Running E2E tests..."
    if pnpm test:e2e 2>&1; then
      passed_suites+=("e2e")
    else
      failed_suites+=("e2e")
      [[ "$CONTINUE_ON_FAIL" != "true" ]] && return 1
    fi
  fi

  # Quick smoke tests
  if [[ "$QUICK_MODE" == "true" ]]; then
    echo ""
    echo "💨 Running smoke tests..."
    if pnpm test:unit -- --testPathPattern="smoke" 2>&1; then
      passed_suites+=("smoke")
    else
      failed_suites+=("smoke")
    fi
  fi

  # Report results
  echo ""
  echo "📊 Test Summary:"
  echo "  ✅ Passed: ${passed_suites[@]:-none}"
  echo "  ❌ Failed: ${failed_suites[@]:-none}"

  [[ ${#failed_suites[@]} -gt 0 ]] && return 1
  return 0
}
```

**Step 4: Coverage Analysis**
```bash
analyze_coverage() {
  echo ""
  echo "📊 Analyzing coverage..."

  if [[ -d "coverage" ]]; then
    # Extract coverage summary
    if [[ -f "coverage/coverage-summary.json" ]]; then
      local total=$(jq '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
      local statements=$(jq '.total.statements.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
      local branches=$(jq '.total.branches.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
      local functions=$(jq '.total.functions.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")

      echo "  📈 Coverage Metrics:"
      echo "    Lines:      ${total}%"
      echo "    Statements: ${statements}%"
      echo "    Branches:   ${branches}%"
      echo "    Functions:  ${functions}%"

      # Check thresholds
      if (( $(echo "$total < 80" | bc -l) )); then
        echo "  ⚠️  Coverage below 80% threshold"
      fi
    else
      echo "  ℹ️  Coverage data not available"
    fi

    echo "  📁 Full report: coverage/lcov-report/index.html"
  else
    echo "  ℹ️  No coverage data generated"
  fi
}
```

**Step 5: Execute and Report**
```bash
# Main execution
START_TIME=$(date +%s)

if execute_test_controller; then
  TEST_RESULT="success"
  EXIT_CODE=0
else
  TEST_RESULT="failure"
  EXIT_CODE=$?
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Analyze coverage if tests passed
if [[ "$TEST_RESULT" == "success" ]]; then
  analyze_coverage
fi

# Clean up processes
pkill -f "playwright|vitest|jest" 2>/dev/null || true
```
</method>

## 5. EXPECTATIONS Phase
<expectations>
**Validation Checks**:
```bash
# Verify test execution completed
if [[ -z "$TEST_RESULT" ]]; then
  echo "❌ Test execution did not complete properly"
  exit 1
fi

# Check for test artifacts
if [[ "$TEST_RESULT" == "success" ]]; then
  # Look for test results
  if [[ -d "test-results" ]] && [[ $(ls -A test-results 2>/dev/null | wc -l) -gt 0 ]]; then
    echo ""
    echo "📁 Test artifacts saved in test-results/"
  fi
fi
```

**Success Reporting**:
```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$TEST_RESULT" == "success" ]]; then
  echo "✅ **TEST EXECUTION SUCCESSFUL**"
else
  echo "❌ **TEST EXECUTION FAILED**"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Execution Summary:"
echo "  Duration: ${DURATION} seconds"
echo "  Mode: $([ "$QUICK_MODE" == "true" ] && echo "Quick" || echo "Full")"
echo "  Debug: $([ "$DEBUG_MODE" == "true" ] && echo "Enabled" || echo "Disabled")"

if [[ "$TEST_RESULT" != "success" ]]; then
  echo ""
  echo "💡 **Debugging Tips:**"
  echo "  1. Re-run with --debug flag for verbose output"
  echo "  2. Check test-results/ for detailed logs"
  echo "  3. Run specific suite: --unit or --e2e"
  echo "  4. Use --continue to run all tests despite failures"
fi

echo ""
echo "📝 **Next Steps:**"
if [[ "$TEST_RESULT" == "success" ]]; then
  echo "  1. Review coverage metrics"
  echo "  2. Commit if all tests pass"
  echo "  3. Create PR for review"
else
  echo "  1. Review failing tests"
  echo "  2. Fix identified issues"
  echo "  3. Re-run tests to verify fixes"
fi

exit $EXIT_CODE
```

**Cleanup Operations**:
```bash
# Ensure cleanup happens even on failure
cleanup_test_environment() {
  # Kill any hanging processes
  pkill -f "playwright|vitest|jest" 2>/dev/null || true

  # Clean temporary files
  rm -f /tmp/test-*.log 2>/dev/null || true

  # Reset environment variables
  unset DEBUG_TEST DEBUG VERBOSE COVERAGE
}

# Register cleanup
trap cleanup_test_environment EXIT
```
</expectations>
</instructions>

<patterns>
### Test Execution Patterns
- **Quick Mode**: Smoke tests only (2-3 minutes)
- **Full Suite**: All tests with coverage (15+ minutes)
- **Focused Testing**: Unit-only or E2E-only modes
- **Debug Mode**: Verbose output with detailed logging

### Parallelization Strategy
1. Independent test suites run concurrently
2. Shared resources managed through locks
3. Test sharding for large E2E suites
4. Optimal CPU utilization
</patterns>

<error_handling>
### Common Issues
1. **Timeout Issues**: Uses direct script execution to bypass limits
2. **Stuck Processes**: Kills hanging test processes before/after
3. **Flaky Tests**: Supports retry mechanisms
4. **Resource Conflicts**: Manages ports and databases
5. **Coverage Failures**: Continues despite coverage issues

### Recovery Procedures
```bash
# Kill stuck test processes
pkill -9 -f "playwright|vitest|jest"

# Clean test databases
pnpm test:clean

# Reset test environment
rm -rf node_modules/.cache
rm -rf test-results coverage

# Re-run specific failed suite
pnpm test:unit -- --testNamePattern="failing-test"
```
</error_handling>

<delegation>
### When to Delegate
- For test writing: Use test-suite-architect agent
- For specific framework issues: jest-testing-expert or vitest-testing-expert
- For E2E test development: playwright-expert
- For coverage optimization: testing-expert
</delegation>

<help>
🧪 **Test Command - Comprehensive Test Orchestration**

Execute test suites with intelligent orchestration and detailed reporting.

**Usage:**
- `/test` - Run full test suite
- `/test --quick` - Quick smoke tests (2-3 min)
- `/test --unit` - Unit tests only
- `/test --e2e` - E2E tests only
- `/test --debug` - Enable debug output
- `/test --continue` - Continue on failures

**Process:**
1. Parse test arguments and mode
2. Prepare test environment
3. Execute test controller or direct tests
4. Analyze coverage metrics
5. Report results and cleanup

**Features:**
- No timeout restrictions
- Parallel test execution
- Coverage analysis
- Debug mode support
- Automatic cleanup

Ready to validate your code quality!
</help>