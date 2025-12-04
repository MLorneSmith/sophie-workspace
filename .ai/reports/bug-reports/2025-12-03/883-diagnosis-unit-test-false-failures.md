# Bug Diagnosis: Unit Test Controller Reports False Failures from Retry Log Messages

**ID**: ISSUE-883
**Created**: 2025-12-03T21:15:00.000Z
**Reporter**: system (Claude diagnosis)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The unit test runner incorrectly reports test failures by parsing retry log messages from application code. When tests execute code that logs retry attempts (e.g., "Attempt 4/5 failed, retrying..."), the regex pattern `(\d+)\s+failed` matches "5 failed" from these log messages, causing the test controller to report 5 test failures even when all Vitest tests actually pass.

## Environment

- **Application Version**: dev branch (685eb76de)
- **Environment**: development
- **Node Version**: v20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - may have always had this bug

## Reproduction Steps

1. Run unit tests: `/test --unit`
2. Observe the summary output showing "Failed: 5"
3. Check `/tmp/test-output.log` for actual Vitest results showing all tests passed
4. Search log for "failed" patterns: `grep "failed" /tmp/test-output.log`
5. Notice retry log messages like "Attempt 4/5 failed, retrying..."

## Expected Behavior

Unit test summary should report **0 failures** when all Vitest tests pass:
- Unit Tests: Passed: 584, Failed: 0
- Total: 589 (584 passed + 1 skipped + 4 todo)

## Actual Behavior

Unit test summary incorrectly reports **5 failures**:
- Unit Tests: Passed: 584, Failed: 5
- Total: 593 (584 passed + 5 "failed" + 4 skipped)

The `failures` array in `/tmp/test-summary.json` is empty, proving no actual test failures occurred.

## Diagnostic Data

### Console Output
```
payload:test: [WARN] 2025-12-03T21:13:13.441Z Attempt 4/5 failed, retrying in 50ms
payload:test: [WARN] 2025-12-03T21:13:12.785Z Attempt 1/3 failed, retrying in 97ms
payload:test: [WARN] 2025-12-03T21:13:12.883Z Attempt 2/3 failed, retrying in 181ms
```

### Actual Vitest Results (All Passed)
```
payload:test: Test Files  22 passed (22)
payload:test: Tests  584 passed | 1 skipped (585)
web:test: Test Files  18 passed (18)
web:test: Tests  446 passed (446)
@kit/admin:test: Test Files  8 passed (8)
@kit/admin:test: Tests  165 passed (165)
```

### Incorrectly Parsed Patterns
```bash
$ grep -oE "[0-9]+ (passed|failed|skipped|todo)" /tmp/test-output.log | sort | uniq -c
      4 3 failed    # From "Attempt X/3 failed" patterns
      4 5 failed    # From "Attempt X/5 failed" patterns
```

### JSON Summary (Shows Bug)
```json
{
  "unit": {
    "total": 593,
    "passed": 584,
    "failed": 5     // <- INCORRECT
  },
  "failures": []    // <- Empty proves no actual failures
}
```

## Error Stack Traces

N/A - No actual errors; this is a parsing logic bug.

## Related Code

- **Affected Files**:
  - `.ai/ai_scripts/testing/runners/unit-test-runner.cjs:299-303`
- **Recent Changes**: None relevant
- **Suspected Functions**: `parseTestLine()` method

### Problematic Code
```javascript
// Line 299-303 in unit-test-runner.cjs
// Parse failed tests
const failedMatch = cleanLine.match(/(\d+)\s+failed/);
if (failedMatch) {
    const failed = parseInt(failedMatch[1], 10);
    results.failed = Math.max(results.failed, failed);
}
```

### Contrast with Correct Pattern
```javascript
// Line 291 - Correctly requires "Tests" prefix
const testMatch = cleanLine.match(/Tests\s+(\d+)\s+passed/);
```

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a newly identified bug.

### Similar Symptoms
- Issue #355: E2E test status reporting - Similar pattern matching issues

### Historical Context
The `passed` pattern was correctly implemented with the `Tests\s+` prefix, but the `failed` pattern was not updated to match, suggesting an oversight during initial implementation.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The regex pattern `(\d+)\s+failed` is too broad and matches any line containing a number followed by "failed", including retry log messages from application code.

**Detailed Explanation**:
The unit test runner's `parseTestLine()` function (line 299) uses the regex `/(\d+)\s+failed/` to detect test failures. This pattern incorrectly matches:
- `"Attempt 4/5 failed, retrying..."` → captures "5 failed"
- `"Attempt 2/3 failed, retrying..."` → captures "3 failed"

The `Math.max()` logic (line 302) then keeps the highest value seen (5), resulting in 5 reported failures.

In contrast, the `passed` pattern (line 291) correctly uses `/Tests\s+(\d+)\s+passed/` which requires the "Tests" prefix, preventing false matches.

**Supporting Evidence**:
- Log file shows 8 occurrences of retry "failed" patterns matching the regex
- Vitest summary shows 0 failed tests
- `/tmp/test-summary.json` has empty `failures` array
- Code comparison shows asymmetric regex patterns for passed vs failed

### How This Causes the Observed Behavior

1. Payload tests execute seed engine code with retry logic
2. Retry logic logs "Attempt X/Y failed, retrying..." messages
3. `parseTestLine()` processes each stdout line
4. Regex `/(\d+)\s+failed/` matches "5 failed" from "Attempt 4/5 failed..."
5. `Math.max(results.failed, 5)` sets failed count to 5
6. `results.total = 584 + 5 + 4 = 593` calculated incorrectly
7. Summary reports 5 failures despite all tests passing

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code tracing from regex to output confirms the bug
- Vitest shows 0 failures, JSON has empty failures array
- Log file contains exact patterns that trigger false matches
- Fix approach is clear and follows existing correct pattern

## Fix Approach (High-Level)

Update the failed test regex to match the correct Vitest summary format by requiring a prefix. Change:
```javascript
const failedMatch = cleanLine.match(/(\d+)\s+failed/);
```
To:
```javascript
const failedMatch = cleanLine.match(/Tests?\s+.*?(\d+)\s+failed/);
// Or more specifically:
const failedMatch = cleanLine.match(/(?:Tests|Test Files)\s+.*?(\d+)\s+failed/);
```

This ensures only actual Vitest summary lines are matched, not application retry logs.

## Diagnosis Determination

Root cause definitively identified: The regex pattern for detecting failed tests is too permissive, matching application log messages that contain "failed" rather than only Vitest test summary lines.

The fix is straightforward - update the regex to require a "Tests" or "Test Files" prefix, matching the pattern already used for passed tests.

## Additional Context

- This bug may have existed since the unit test runner was created
- It only manifests when tests execute code with retry logic that logs "X/Y failed"
- The bug is cosmetic but confusing - it makes passing test runs appear to have failures
- Related: The `skipped` regex also lacks prefix validation and could have similar issues

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (grep, cat), Read, Glob*
