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
LOCKFILE="/tmp/.test-suite-running.lock"

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

# Duplicate-run protection
check_and_acquire_lock() {
    # Check if lockfile exists
    if [[ -f "$LOCKFILE" ]]; then
        LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || echo "")

        if [[ -n "$LOCK_PID" ]]; then
            # Check if process is still running
            if ps -p "$LOCK_PID" > /dev/null 2>&1; then
                # Check if it's actually a safe-test-runner process
                if ps -p "$LOCK_PID" -o command= 2>/dev/null | grep -q "safe-test-runner.sh"; then
                    echo -e "${RED}❌ Test suite is already running (PID: $LOCK_PID)${NC}"
                    echo ""
                    echo "Options:"
                    echo "  1. Wait for it to complete"
                    echo "  2. Kill it: kill $LOCK_PID"
                    echo "  3. View progress: tail -f $LOG_FILE"
                    echo ""
                    exit 1
                else
                    # Stale lockfile from a different process
                    echo -e "${YELLOW}⚠️  Removing stale lockfile (PID $LOCK_PID is not safe-test-runner)${NC}"
                    rm -f "$LOCKFILE"
                fi
            else
                # Process no longer exists, remove stale lockfile
                echo -e "${YELLOW}⚠️  Removing stale lockfile (process $LOCK_PID no longer exists)${NC}"
                rm -f "$LOCKFILE"
            fi
        fi
    fi

    # Create lockfile with current PID
    echo $$ > "$LOCKFILE"
}

# Cleanup function to remove lockfile on exit
cleanup_lock() {
    if [[ -f "$LOCKFILE" ]]; then
        LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || echo "")
        if [[ "$LOCK_PID" == "$$" ]]; then
            rm -f "$LOCKFILE"
        fi
    fi
}

# Set trap to clean up lockfile on exit (success or failure)
trap cleanup_lock EXIT INT TERM

# Acquire lock before proceeding
check_and_acquire_lock

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
        grep -E "(🧪|🚀|✓|✗|⚠️|📊|📋|📈|📝|🔧|🏗️|🌐|🧹|═|─|PHASE|Phase|Starting|Summary|Duration|passed|failed|skipped|INFO|ERROR|WARN|Total|Shard|Results)" | \
        head -n 100 || true
else
    # Normal mode: minimal output (progress + summary only)
    # CRITICAL: head -n 50 enforces hard limit to prevent Claude Code crash
    node "$CONTROLLER_SCRIPT" "${ARGS[@]}" 2>&1 | tee -a "$LOG_FILE" | \
        grep -E "(🧪|🚀|✓|✗|📊|📋|📈|═|PHASE|Phase|Summary|Duration|passed|failed|skipped|Total|Results)" | \
        head -n 50 || true
fi

TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Extract and display summary
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Parse results from JSON summary file (preferred) or fall back to log parsing
SUMMARY_JSON="/tmp/test-summary.json"

if [[ -f "$SUMMARY_JSON" ]] && command -v jq &> /dev/null; then
    # Use structured JSON summary for accurate results
    UNIT_PASSED=$(jq -r '.unit.passed // 0' "$SUMMARY_JSON")
    UNIT_FAILED=$(jq -r '.unit.failed // 0' "$SUMMARY_JSON")
    E2E_PASSED=$(jq -r '.e2e.passed // 0' "$SUMMARY_JSON")
    E2E_FAILED=$(jq -r '.e2e.failed // 0' "$SUMMARY_JSON")
    E2E_SKIPPED=$(jq -r '.e2e.skipped // 0' "$SUMMARY_JSON")
    TOTAL_PASSED=$(jq -r '.totals.passed // 0' "$SUMMARY_JSON")
    TOTAL_FAILED=$(jq -r '.totals.failed // 0' "$SUMMARY_JSON")
    INTENTIONAL_FAILURES=$(jq -r '.totals.intentionalFailures // 0' "$SUMMARY_JSON")
    DURATION=$(jq -r '.duration // 0' "$SUMMARY_JSON")
    STATUS=$(jq -r '.status // "unknown"' "$SUMMARY_JSON")

    # Calculate total tests
    TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))

    echo -e "${BLUE}(parsed from /tmp/test-summary.json)${NC}"
    echo ""
else
    # Fallback: Parse results from log (less accurate)
    echo -e "${YELLOW}(parsed from log - install jq for better results)${NC}"
    echo ""

    UNIT_PASSED=$(grep -o "Test Files.*[0-9]* passed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]* passed" | grep -o "[0-9]*" || echo "0")
    UNIT_FAILED=$(grep -o "Test Files.*[0-9]* failed" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]* failed" | grep -o "[0-9]*" || echo "0")
    E2E_PASSED=$(grep -E "✅ Passed:" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]*" || echo "0")
    E2E_FAILED=$(grep -E "❌ Failed:" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]*" || echo "0")
    E2E_SKIPPED=$(grep -E "⏭️  Skipped:" "$LOG_FILE" 2>/dev/null | tail -1 | grep -o "[0-9]*" || echo "0")

    TOTAL_PASSED=$((UNIT_PASSED + E2E_PASSED))
    TOTAL_FAILED=$((UNIT_FAILED + E2E_FAILED))
    INTENTIONAL_FAILURES=0
    DURATION="unknown"
    STATUS="unknown"

    # Adjust for intentional test failures
    if grep -q "test-configuration-verification.spec.ts" "$LOG_FILE" 2>/dev/null; then
        INTENTIONAL_COUNT=$(grep -c "Intentional FAILURE" "$LOG_FILE" 2>/dev/null || echo "0")
        if [[ $INTENTIONAL_COUNT -ge 3 ]]; then
            TOTAL_FAILED=$((TOTAL_FAILED - 3))
            INTENTIONAL_FAILURES=3
        fi
    fi

    TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))
fi

# Display results
if [[ $TOTAL_TESTS -gt 0 ]]; then
    if [[ $TOTAL_FAILED -eq 0 ]]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
    else
        echo -e "${RED}✗ Some tests failed${NC}"
    fi
    echo ""

    # Unit test results
    if [[ $UNIT_PASSED -gt 0 ]] || [[ $UNIT_FAILED -gt 0 ]]; then
        echo "Unit Tests:"
        echo -e "  ${GREEN}Passed: $UNIT_PASSED${NC}"
        if [[ $UNIT_FAILED -gt 0 ]]; then
            echo -e "  ${RED}Failed: $UNIT_FAILED${NC}"
        fi
        echo ""
    fi

    # E2E test results
    if [[ $E2E_PASSED -gt 0 ]] || [[ $E2E_FAILED -gt 0 ]]; then
        echo "E2E Tests:"
        echo -e "  ${GREEN}Passed: $E2E_PASSED${NC}"
        if [[ $E2E_FAILED -gt 0 ]]; then
            echo -e "  ${RED}Failed: $E2E_FAILED${NC}"
        fi
        if [[ ${E2E_SKIPPED:-0} -gt 0 ]]; then
            echo -e "  ${YELLOW}Skipped: $E2E_SKIPPED${NC}"
        fi
        echo ""
    fi

    # Totals
    echo "─────────────────────────"
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Total Passed: $TOTAL_PASSED${NC}"
    if [[ $TOTAL_FAILED -gt 0 ]]; then
        echo -e "${RED}Total Failed: $TOTAL_FAILED${NC}"
    fi
    if [[ ${INTENTIONAL_FAILURES:-0} -gt 0 ]]; then
        echo -e "${BLUE}(Intentional failures excluded: $INTENTIONAL_FAILURES)${NC}"
    fi
else
    echo "No test results found (check log for details)"
fi

echo ""

# Extract duration from JSON or log
if [[ -f "$SUMMARY_JSON" ]] && command -v jq &> /dev/null; then
    JSON_DURATION=$(jq -r '.duration // 0' "$SUMMARY_JSON")
    if [[ "$JSON_DURATION" != "0" ]] && [[ "$JSON_DURATION" != "null" ]]; then
        echo "Duration: ${JSON_DURATION}s"
        echo ""
    fi
else
    DURATION=$(grep -o "Time:.*" "$LOG_FILE" 2>/dev/null | tail -1 || echo "Unknown")
    if [[ "$DURATION" != "Unknown" ]]; then
        echo "Duration: $DURATION"
        echo ""
    fi
fi

# Show log location and size
LOG_SIZE=$(du -h "$LOG_FILE" 2>/dev/null | cut -f1 || echo "Unknown")
echo -e "💾 Full log: ${YELLOW}${LOG_FILE}${NC} (${LOG_SIZE})"

# Show failure details if any
if [[ $TOTAL_FAILED -gt 0 ]]; then
    echo ""
    echo -e "${RED}⚠️  Tests failed${NC}"

    # Show failures from dedicated failure log (limited to prevent crash)
    if [[ -f /tmp/test-failures.log ]]; then
        echo ""
        echo -e "${RED}Failed Tests:${NC}"
        # Show first 20 lines of failures (enough to see test names and errors)
        head -40 /tmp/test-failures.log

        FAILURE_LINES=$(wc -l < /tmp/test-failures.log)
        if [[ $FAILURE_LINES -gt 40 ]]; then
            echo ""
            echo -e "${YELLOW}... ($((FAILURE_LINES - 40)) more lines in /tmp/test-failures.log)${NC}"
        fi
    fi
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Batch Scheduler Information
echo ""
echo -e "${BLUE}📋 E2E Shard Organization${NC}"
echo "  Shards 1-10: Real business logic tests (run in CI)"
echo "  Shard 11: Configuration verification tests (local only, @skip-in-ci)"
echo ""
echo -e "${BLUE}📋 Batch Scheduler Configuration${NC}"
echo "  Batch scheduling enabled by default for E2E tests"
echo "  To run with batch scheduler:"
echo "    ${YELLOW}cd apps/e2e && npm run test:e2e:shards:batch${NC}"
echo "  Environment variables:"
echo "    ${YELLOW}E2E_SHARD_BATCH_SIZE${NC}=N (default: 4, number of shards per batch)"
echo "    ${YELLOW}E2E_ENABLE_BATCH_SCHEDULING${NC}=true/false (default: true)"
echo "    ${YELLOW}E2E_RESOURCE_CHECK_ENABLED${NC}=true/false (default: true)"

# Quick access commands
echo ""
echo "Quick access:"
echo "  View full log:       cat $LOG_FILE"
echo "  View test summary:   cat /tmp/test-summary.json | jq ."
echo "  View failures:       cat /tmp/test-failures.log 2>/dev/null || echo 'No failures'"
echo "  View shard results:  cat /tmp/test-summary.json | jq '.e2e.shards'"
echo "  View errors in log:  grep -E '\\[ERROR\\]|❌|Timeout|TIMEOUT' $LOG_FILE"
echo "  View phase output:   grep -E 'PHASE:|═' $LOG_FILE"

exit $TEST_EXIT_CODE
