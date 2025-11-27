# Bug Diagnosis: Unit test failures not captured in /test command output

**ID**: ISSUE-pending
**Created**: 2025-11-27T17:25:00.000Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/test` slash command and its underlying `safe-test-runner.sh` script do not properly capture and report unit test failures. While unit tests run successfully and failures are detected internally, the test summary JSON shows unit test results as all zeros, and failure details are not extracted or displayed.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (may have never worked correctly for unit test failures)

## Reproduction Steps

1. Introduce a failing unit test in `apps/payload` (or use existing failures)
2. Run `/test --unit` command
3. Observe the test summary output
4. Check `/tmp/test-summary.json` for unit test results

## Expected Behavior

- Unit test results should show actual counts (total, passed, failed) in the summary
- Failed unit tests should be listed with their file paths and error messages
- The `/tmp/test-failures.log` should include unit test failures

## Actual Behavior

- Summary shows `"unit": { "total": 0, "passed": 0, "failed": 0 }` despite tests running
- Totals section shows correct aggregated counts (443 tests, 434 passed, 5 failed)
- Failures array is empty (`"failures": []`) even when unit tests fail
- `/tmp/test-failures.log` is not created for unit test failures

## Diagnostic Data

### Console Output
```
📊 Unit tests completed in 138s
   Total Tests: 443
✅ Phase 'unit_tests' completed successfully in 138492ms

📊 Test Results Summary
━━━━━━━━━━━━━━━━━━━━━━━
(parsed from /tmp/test-summary.json)

✗ Some tests failed

─────────────────────────
Total Tests: 439
Total Passed: 434
Total Failed: 5
```

### test-summary.json Output
```json
{
  "timestamp": "2025-11-27T17:22:03.018Z",
  "status": "failed",
  "duration": 148,
  "unit": {
    "total": 0,
    "passed": 0,
    "failed": 0
  },
  "e2e": {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "shards": []
  },
  "totals": {
    "total": 443,
    "passed": 434,
    "failed": 5,
    "intentionalFailures": 0
  },
  "failures": []
}
```

## Error Stack Traces

N/A - This is a logic bug, not a runtime error.

## Related Code

- **Affected Files**:
  - `.ai/ai_scripts/testing/infrastructure/test-controller.cjs:854-858`
  - `.ai/ai_scripts/testing/utilities/test-status.cjs`
  - `.ai/ai_scripts/testing/runners/unit-test-runner.cjs`
  - `.ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`

- **Recent Changes**: None relevant

- **Suspected Functions**:
  - `TestController.writeSummaryFiles()` - lines 881-980
  - `TestStatus.getUnitTestResults()` - **DOES NOT EXIST** (line 854 calls it but it's not defined)

## Related Issues & Context

### Similar Symptoms
No related issues found in search.

### Historical Context
This appears to be a gap in the original implementation - the unit test result extraction and reporting was incomplete.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `TestStatus` class is missing the `getUnitTestResults()` method that `TestController` expects, causing unit test results to always be `{total: 0, passed: 0, failed: 0}`.

**Detailed Explanation**:

1. **Missing Method**: At `test-controller.cjs:854`, the code calls:
   ```javascript
   const unitResults = this.testStatus.getUnitTestResults?.() || {
       total: 0,
       passed: 0,
       failed: 0,
   };
   ```

   However, the `TestStatus` class (`test-status.cjs`) does NOT define a `getUnitTestResults()` method. The optional chaining (`?.`) causes it to return `undefined`, which falls back to the default empty object.

2. **Unit Test Failures Not Extracted**: The `writeSummaryFiles()` method only collects failures from `shardAnalysis.shardReports` (E2E test reports). There is no code to extract unit test failure details from the unit test runner output.

3. **Data Flow Gap**: While `UnitTestRunner.executeTests()` correctly calls `this.testStatus.updateUnitTests(results)` at line 225, and the results ARE stored in `this.status.unit`, there's no method to retrieve them for the summary.

**Supporting Evidence**:
- `test-status.cjs:82-85` shows `updateUnitTests()` exists but only an `update` method, not a `get` method
- `test-controller.cjs:854` uses optional chaining because the method doesn't exist
- `/tmp/test-summary.json` shows `"unit": {"total": 0, "passed": 0, "failed": 0}` despite tests running

### How This Causes the Observed Behavior

1. Unit tests run successfully through Turbo and Vitest
2. `UnitTestRunner` parses results and stores them in `TestStatus.status.unit`
3. In the reporting phase, `TestController.writeSummaryFiles()` tries to get unit results
4. `getUnitTestResults()` doesn't exist, so it returns the default `{total: 0, passed: 0, failed: 0}`
5. The summary JSON is written with zeros for unit tests
6. Failures are not extracted because the code only handles E2E shard failures
7. The safe-test-runner.sh displays the summary, showing correct totals but no unit details

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code inspection confirms `getUnitTestResults()` does not exist in TestStatus class
- The pattern of zeros in unit results and populated totals matches this hypothesis exactly
- The failure extraction code explicitly only processes `shardAnalysis.shardReports`

## Fix Approach (High-Level)

1. **Add `getUnitTestResults()` method** to `TestStatus` class that returns `this.status.unit`
2. **Extract unit test failures** in `UnitTestRunner` and store them in a retrievable format
3. **Update `writeSummaryFiles()`** to include unit test failures in the `allFailures` array
4. **Test the fix** by running `/test --unit` with a known failing test

## Diagnosis Determination

The root cause has been conclusively identified: The `getUnitTestResults()` method is missing from the `TestStatus` class, and there's no mechanism to extract and report unit test failure details. The fix is straightforward - add the missing getter method and implement unit test failure extraction in the summary generation.

## Additional Context

The `/test` command uses a three-tier architecture:
1. `safe-test-runner.sh` - Wrapper to prevent Claude Code output overflow
2. `test-controller.cjs` - Main orchestrator for test phases
3. `unit-test-runner.cjs` - Handles unit test execution and result parsing

The data flow for unit tests is:
```
turbo test → vitest → UnitTestRunner.parseTestLine() → TestStatus.updateUnitTests() → [GAP] → writeSummaryFiles()
```

The gap is the missing retrieval method.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash*
