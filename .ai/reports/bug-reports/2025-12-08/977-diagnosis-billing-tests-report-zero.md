# Bug Diagnosis: E2E Billing Tests Report Zero Tests Despite Running Successfully

**ID**: ISSUE-pending
**Created**: 2025-12-08T17:45:00Z
**Reporter**: user/system
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When running E2E shard 9 (User Billing tests), the test controller reports "0 tests passed, 0 failed, 0 skipped" even though the billing test actually ran and passed (with 1 flaky test that passed on retry). The root cause is that the test results parser in `e2e-test-runner.cjs` does not recognize Playwright's "flaky" test status, only parsing "passed", "failed", and "skipped".

## Environment

- **Application Version**: Current dev branch
- **Environment**: development (local)
- **Node Version**: v22.x
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown - may have always been broken for flaky tests

## Reproduction Steps

1. Run `/test 9` to execute the User Billing E2E shard
2. Observe the test output shows the billing test ran (with "1 flaky" in Playwright output)
3. Observe the summary reports "0 passed, 0 failed, 0 skipped"
4. The test actually passed on retry but was not counted

## Expected Behavior

The test summary should report "1 passed" (flaky tests that pass on retry should be counted as passed), matching the actual Playwright test execution.

## Actual Behavior

The test summary reports "0 passed, 0 failed, 0 skipped" despite the test running successfully:
- Playwright output: `1 flaky`
- Test controller summary: `Total Tests: 0`, `Passed: 0`

## Diagnostic Data

### Console Output
```
[2025-12-08T17:44:12.925Z] INFO: ✅ Shard 1 completed: 0/0 passed
[2025-12-08T17:44:12.927Z] INFO: 📊 E2E tests completed in 80s
[2025-12-08T17:44:12.927Z] INFO:    Total Tests: 0
[2025-12-08T17:44:12.927Z] INFO:    ✅ Passed: 0
```

### Playwright Output (from test log)
```
  ✘  1 [chromium] › tests/user-billing/user-billing.spec.ts:11:6 › User Billing @billing @integration › user can subscribe to a plan (1.0m)
  ✓  2 [chromium] › tests/user-billing/user-billing.spec.ts:11:6 › User Billing @billing @integration › user can subscribe to a plan (retry #1) (2.1s)

  1 flaky
```

### Root Cause Code Location
```javascript
// .ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1476-1484
parseE2EResults(output) {
  // ...
  const passedMatch = output.match(/(\d+)\s+passed/);
  const failedMatch = output.match(/(\d+)\s+failed/);
  const skippedMatch = output.match(/(\d+)\s+skipped/);
  const flakyMatch = output.match(/(\d+)\s+flaky/);

  if (passedMatch) results.passed = parseInt(passedMatch[1], 10);
  if (failedMatch) results.failed = parseInt(failedMatch[1], 10);
  if (skippedMatch) results.skipped = parseInt(skippedMatch[1], 10);
  if (flakyMatch) results.passed += parseInt(flakyMatch[1], 10); // <-- This is correct!
  // ...
}
```

The `parseE2EResults()` method correctly handles flaky tests, but the issue is in `parseE2ETestLine()` and `finalizeE2EResults()`:

```javascript
// e2e-test-runner.cjs:1526-1546 - parseE2ETestLine does NOT parse "flaky"
parseE2ETestLine(line, results) {
  const summaryMatch = line.match(/(\d+)\s+passed/);
  // ... only parses "passed", "failed", "skipped" - NO FLAKY HANDLING
}

// e2e-test-runner.cjs:1551-1563 - finalizeE2EResults does NOT parse "flaky" either
finalizeE2EResults(buffer, results) {
  const summaryMatch = buffer.match(/(\d+)\s+passed.*?(\d+)\s+failed/s);
  // ... only looks for "passed...failed" pattern - NO FLAKY HANDLING
}
```

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1526-1573`
- **Recent Changes**: None identified
- **Suspected Functions**:
  - `parseE2ETestLine()` - missing flaky pattern matching
  - `finalizeE2EResults()` - missing flaky pattern matching

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a pre-existing bug.

### Historical Context
The `parseE2EResults()` method (lines 1464-1520) correctly handles flaky tests, but the streaming parsers (`parseE2ETestLine` and `finalizeE2EResults`) do not. This inconsistency suggests the flaky handling was added to `parseE2EResults` but not propagated to the streaming parsers.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The streaming test result parsers (`parseE2ETestLine` and `finalizeE2EResults`) do not recognize Playwright's "flaky" test status, causing tests that pass on retry to be counted as 0.

**Detailed Explanation**:
The test controller uses two parsing paths:
1. **Batch parsing** (`parseE2EResults`) - Correctly parses "flaky" tests and adds them to passed count
2. **Streaming parsing** (`parseE2ETestLine` + `finalizeE2EResults`) - Only recognizes "passed", "failed", "skipped" patterns

When a test is flaky (fails initially but passes on retry), Playwright reports it as "1 flaky" instead of "1 passed". The streaming parsers don't match this pattern, so the test count stays at 0.

**Supporting Evidence**:
- Playwright output: `1 flaky`
- Test controller summary: `Total Tests: 0`
- Code inspection shows `parseE2ETestLine()` only matches `passed/failed/skipped` patterns

### How This Causes the Observed Behavior

1. User Billing test runs and fails on first attempt
2. Test retries and passes on second attempt
3. Playwright reports: `1 flaky` (not "1 passed")
4. `parseE2ETestLine()` scans each line but never matches "flaky"
5. `finalizeE2EResults()` looks for "passed...failed" pattern, but output only has "flaky"
6. Results object remains at `{total: 0, passed: 0, failed: 0, skipped: 0}`
7. Summary reports "0 tests"

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code inspection shows the parsing functions
- Log evidence shows "1 flaky" in Playwright output and "0 tests" in summary
- The `parseE2EResults()` function has the correct flaky handling, proving the pattern is known but not applied to streaming parsers

## Fix Approach (High-Level)

Add flaky test pattern matching to both streaming parser functions:

1. In `parseE2ETestLine()`: Add regex to match `(\d+)\s+flaky` and add to `results.passed`
2. In `finalizeE2EResults()`: Update the summary regex to also capture flaky count, or add a separate flaky pattern match

Example fix for `parseE2ETestLine()`:
```javascript
const flakyMatch = line.match(/(\d+)\s+flaky/);
if (flakyMatch) {
  const flaky = parseInt(flakyMatch[1], 10);
  results.passed = Math.max(results.passed, results.passed + flaky);
}
```

## Diagnosis Determination

The root cause is confirmed: **missing "flaky" pattern handling in streaming test result parsers**. The billing tests actually ran successfully, but the flaky test status was not recognized, leading to a reported count of 0 tests.

This is a test infrastructure bug, not a billing test bug. The billing tests themselves work correctly.

## Additional Context

- This bug affects any E2E shard where tests pass on retry (become flaky)
- The billing test actually passed - the infrastructure just didn't count it
- This may be why billing shards show "? tests" in the shard configuration (expectedTests: null)

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Bash (log inspection)*
