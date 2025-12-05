# Bug Diagnosis: E2E Test Runner Timeout Detection Kills Tests That Intentionally Handle Timeouts

**ID**: ISSUE-911
**Created**: 2025-12-04T19:00:00Z
**Reporter**: system
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E test runner's timeout detection pattern (lines 1163-1189 in `e2e-test-runner.cjs`) kills processes whenever ANY output contains "Timeout" or "TimeoutError", even when tests are intentionally testing timeout recovery behavior. This causes the test "should recover from connection timeout" to fail because the test runner kills the process before the test can complete its recovery logic.

## Environment

- **Application Version**: dev branch (commit f6ab653b3)
- **Environment**: development (local testing)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown - test may have always been flaky due to this behavior

## Reproduction Steps

1. Run the E2E test suite: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
2. Wait for Payload CMS Extended shard (shard 8) to run
3. Observe test "should recover from connection timeout" fails with `net::ERR_ABORTED; maybe frame was detached?`
4. Check logs for: `[Shard 2] ⚠️ Playwright timeout detected - aggressively killing test`

## Expected Behavior

Tests that intentionally catch and handle timeouts should be allowed to complete their recovery logic. The test "should recover from connection timeout" is designed to:
1. Set a short 5000ms timeout
2. Catch the timeout error in a try/catch
3. Increase the timeout to 30000ms
4. Reload the page and continue

## Actual Behavior

When the test times out and Playwright outputs "TimeoutError", the test runner sees this text and immediately kills the entire process via SIGKILL, preventing the test from executing its recovery logic.

The test then fails with:
```
Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
```

## Diagnostic Data

### Console Output
```
[2025-12-04T18:50:12.294Z] INFO: [Shard 2] ⚠️ Playwright timeout detected - aggressively killing test
[2025-12-04T18:50:12.294Z] INFO: [Shard 2] ⚠️ Playwright timeout detected - aggressively killing test
[2025-12-04T18:50:12.294Z] INFO: [Shard 2] ⚠️ Playwright timeout detected - aggressively killing test

Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
```

### Network Analysis
N/A - Not a network issue

### Database Analysis
N/A - Not a database issue

### Performance Metrics
N/A - Not a performance issue

## Error Stack Traces
```
Error: page.reload: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - waiting for navigation until "load"

    319 |     // Increase timeout and retry
    320 |     page.setDefaultTimeout(30000);
  > 321 |     await page.reload();
        |                ^
    322 |     await loginPage.waitForPageLoad();
    323 |   }
    324 | });
      at /home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/payload-database.spec.ts:321:15
```

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1163-1189`
  - `apps/e2e/tests/payload/payload-database.spec.ts:306-324`
- **Recent Changes**: f6ab653b3 - fix(e2e): remove aggressive global pkill commands from timeout handler
- **Suspected Functions**:
  - Timeout detection pattern in stdout handler (lines 1163-1189)
  - Overly broad text matching: `line.includes("Timeout") || line.includes("TimeoutError")`

## Related Issues & Context

### Direct Predecessors
- #909 (CLOSED): "Bug Fix: E2E Tests Failing Due to Aggressive Chromium Process Killing" - Fixed the global pkill commands, but did not address the overly aggressive timeout detection pattern

### Infrastructure Issues
- #906 (CLOSED): "Bug Diagnosis: E2E Tests Failing Due to Aggressive Chromium Process Killing" - Original diagnosis that led to #909

### Historical Context
Issue #909 removed the global `pkill chromium/playwright` commands that were killing processes across all shards. However, there is a SEPARATE aggressive killing mechanism that triggers on any "Timeout" text in the output. This was not addressed in #909.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The timeout detection code at lines 1163-1189 uses overly broad pattern matching that triggers on ANY occurrence of "Timeout" or "TimeoutError" in the test output, even when tests are intentionally testing timeout handling behavior.

**Detailed Explanation**:
The code in `e2e-test-runner.cjs` lines 1163-1189:

```javascript
// Check for timeout patterns
if (
  line.includes("Test timeout of") ||
  line.includes("exceeded while") ||
  line.includes("Timeout") ||
  line.includes("TimeoutError")
) {
  log(`${shardPrefix}⚠️ Playwright timeout detected - aggressively killing test`);
  if (proc && !proc.killed) {
    // ... SIGKILL the process
  }
}
```

This pattern is too aggressive because:
1. `line.includes("Timeout")` matches ANY line containing "Timeout" - including test names, log messages, and intentional timeout handling
2. `line.includes("TimeoutError")` matches Playwright's error output even when the test is designed to catch and handle those errors
3. The test "should recover from connection timeout" intentionally triggers a TimeoutError, but the runner kills it before recovery can happen

**Supporting Evidence**:
- Log shows timeout detection triggered: `[Shard 2] ⚠️ Playwright timeout detected - aggressively killing test`
- Error is `net::ERR_ABORTED; maybe frame was detached?` indicating the browser was killed mid-operation
- The test file shows the test is designed to catch TimeoutError and recover (lines 310-323)
- Code reference: `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1164-1189`

### How This Causes the Observed Behavior

1. Test "should recover from connection timeout" starts
2. Test sets a short 5000ms timeout intentionally
3. Test attempts to navigate, which times out (as intended)
4. Playwright outputs "TimeoutError" to stdout
5. Test runner sees "TimeoutError" in output and matches the pattern at line 1168
6. Test runner immediately kills the process via SIGKILL (lines 1173-1182)
7. The test's try/catch block never gets a chance to recover
8. Test fails with `net::ERR_ABORTED; maybe frame was detached?` because the browser was killed

### Confidence Level

**Confidence**: High

**Reasoning**:
- The log clearly shows the timeout detection triggered (`Playwright timeout detected - aggressively killing test`)
- The error message (`net::ERR_ABORTED; maybe frame was detached?`) confirms the browser was killed externally
- The code explicitly matches ANY line containing "Timeout" or "TimeoutError"
- The test is clearly designed to handle timeouts (has try/catch with recovery logic)

## Fix Approach (High-Level)

The timeout detection should be more intelligent:

**Option A (Recommended)**: Make timeout detection smarter - only kill on ACTUAL test failure patterns, not just any "Timeout" text. For example:
- Only trigger on `"Test timeout of"` (actual Playwright test timeout)
- Use a pattern like `"TimeoutError: Timeout"` instead of just `"TimeoutError"`
- Add an exception for tests that are explicitly testing timeout handling

**Option B**: Add a debounce/grace period before killing, allowing tests with try/catch to handle the error

**Option C**: Remove the aggressive timeout killing entirely and rely on Playwright's built-in test timeout handling (safer approach)

The fix should be in `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` lines 1163-1189.

## Diagnosis Determination

The root cause is definitively identified: the test runner's timeout detection pattern at lines 1163-1189 is too broad, matching ANY line containing "Timeout" or "TimeoutError" and killing the process. This prevents tests that intentionally test timeout handling from completing their recovery logic.

This is a separate issue from #909 which addressed global pkill commands. This issue addresses the timeout detection pattern being too aggressive.

## Additional Context
- The test suite shows 787 passed, 1 real failure (this test), 3 intentional failures (Config Verification)
- The test "should recover from connection timeout" has always been at risk of this behavior
- A similar pattern exists at line 1227 for stall detection, which may have similar issues
- There are still global pkill commands at lines 1242, 1338-1342, and 2037 that should be evaluated separately

---
*Generated by Claude Debug Assistant*
*Tools Used: grep, read, bash (test logs, e2e-test-runner.cjs, test files)*
