#!/usr/bin/env bash
#
# Safe Test Runner
# Prevents Claude Code crashes by enforcing hard output line limits
#
# Features:
# - All test output written to file (/tmp/test-output.log)
# - Hard line limits: 50 lines (normal mode) or 100 lines (verbose mode)
# - Complete logs always preserved for debugging
# - Works with all test modes (unit, e2e, quick, debug)
# - Defense-in-depth: grep filters content, head enforces line count

set -euo pipefail

# Configuration
LOG_FILE="${TEST_OUTPUT_FILE:-/tmp/test-output.log}"
CONTROLLER_SCRIPT="$(dirname "$0")/test-controller.cjs"
PROJECT_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
ARGS=("$@")
SHOW_VERBOSE=false

for arg in "$@"; do
    if [[ "$arg" == "--verbose" ]] || [[ "$arg" == "--debug" ]]; then
        SHOW_VERBOSE=true
    fi
done

# Clear old log
> "$LOG_FILE"

# Header
echo -e "${BLUE}🧪 Running SlideHeroes Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Show what we're running
if [[ ${#ARGS[@]} -eq 0 ]]; then
    echo "Mode: Comprehensive (unit + e2e)"
else
    echo "Mode: ${ARGS[*]}"
fi
echo -e "Log: ${YELLOW}${LOG_FILE}${NC}"
echo ""

# Export environment for file-only output
export TEST_OUTPUT_MODE=file
export TEST_OUTPUT_FILE="$LOG_FILE"

# Run test controller with intelligent filtering
echo -e "${BLUE}Starting test execution...${NC}"
echo ""

if [[ "$SHOW_VERBOSE" == "true" ]]; then
    # Verbose mode: show more output (but still filtered and limited)
    # CRITICAL: head -n 100 enforces hard limit to prevent Claude Code crash
    node "$CONTROLLER_SCRIPT" "${ARGS[@]}" 2>&1 | tee -a "$LOG_FILE" | \
        grep -E "(🧪|🚀|✓|✗|⚠️|📊|Phase|Starting|Summary|Duration|passed|failed|INFO|ERROR|WARN)" | \
        head -n 100 || true
else
    # Normal mode: minimal output (progress + summary only)
    # CRITICAL: head -n 50 enforces hard limit to prevent Claude Code crash
    node "$CONTROLLER_SCRIPT" "${ARGS[@]}" 2>&1 | tee -a "$LOG_FILE" | \
        grep -E "(🧪|🚀|✓|✗|📊|Phase|Summary|Duration)" | \
        head -n 50 || true
fi

TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Extract and display summary
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Parse results from log
UNIT_PASSED=$(grep -o "Test Files.*[0-9]* passed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]* passed" | grep -o "[0-9]*" || echo "0")
UNIT_FAILED=$(grep -o "Test Files.*[0-9]* failed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]* failed" | grep -o "[0-9]*" || echo "0")
E2E_PASSED=$(grep "E2E.*passed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]*" || echo "0")
E2E_FAILED=$(grep "E2E.*failed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]*" || echo "0")

# Calculate totals
TOTAL_PASSED=$((UNIT_PASSED + E2E_PASSED))
TOTAL_FAILED=$((UNIT_FAILED + E2E_FAILED))

# Adjust for intentional test failures (test-configuration-verification.spec.ts)
# This test file contains 3 intentional failures to verify Playwright configuration
if grep -q "test-configuration-verification.spec.ts" "$LOG_FILE" 2>/dev/null; then
    INTENTIONAL_FAILURES=3

    # Count how many intentional failures were actually reported
    INTENTIONAL_COUNT=$(grep -c "Intentional FAILURE" "$LOG_FILE" 2>/dev/null || echo "0")

    # Only subtract if we found the expected intentional failures
    if [[ $INTENTIONAL_COUNT -ge $INTENTIONAL_FAILURES ]]; then
        TOTAL_FAILED=$((TOTAL_FAILED - INTENTIONAL_FAILURES))
        echo -e "${BLUE}ℹ️  Excluded $INTENTIONAL_FAILURES intentional test failures (config verification)${NC}"
    fi
fi

TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))

# Display results
if [[ $TOTAL_TESTS -gt 0 ]]; then
    if [[ $TOTAL_FAILED -eq 0 ]]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
    else
        echo -e "${RED}✗ Some tests failed${NC}"
    fi
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $TOTAL_PASSED${NC}"
    if [[ $TOTAL_FAILED -gt 0 ]]; then
        echo -e "${RED}Failed: $TOTAL_FAILED${NC}"
    fi
else
    echo "No test results found (check log for details)"
fi

echo ""

# Extract duration
DURATION=$(grep -o "Time:.*" "$LOG_FILE" 2>/dev/null | tail -1 || echo "Unknown")
if [[ "$DURATION" != "Unknown" ]]; then
    echo "Duration: $DURATION"
    echo ""
fi

# Show log location and size
LOG_SIZE=$(du -h "$LOG_FILE" 2>/dev/null | cut -f1 || echo "Unknown")
echo -e "💾 Full log: ${YELLOW}${LOG_FILE}${NC} (${LOG_SIZE})"

# Show failure details if any (REMOVED to prevent Claude Code crash)
# The full failure details are available in the log file
# This was causing crashes by grepping large log files and outputting unbounded text
if [[ $TOTAL_FAILED -gt 0 ]]; then
    echo ""
    echo -e "${RED}⚠️  Tests failed - see full details below${NC}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Quick access commands
echo ""
echo "Quick access:"
echo "  View full log:    cat $LOG_FILE"
echo "  View failures:    grep -E 'FAIL|✗' $LOG_FILE"
echo "  View errors:      grep -i error $LOG_FILE"
echo "  View warnings:    grep -i warn $LOG_FILE"

exit $TEST_EXIT_CODE
