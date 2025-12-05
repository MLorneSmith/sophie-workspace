# Bug Diagnosis: E2E Tests Failing Due to Aggressive Chromium Process Killing

**ID**: ISSUE-906
**Created**: 2025-12-04T18:24:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E tests are failing with "Target page, context or browser has been closed" errors because the test runner's timeout detection logic aggressively kills ALL chromium processes system-wide when it detects a timeout in one test. This causes other tests running in parallel (across different shards or within the same shard) to fail when their browser contexts are unexpectedly terminated.

## Environment

- **Application Version**: dev branch (commit dcdbd63c0)
- **Environment**: development (local testing)
- **Node Version**: (via pnpm)
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown - this appears to be an existing issue with the test runner

## Reproduction Steps

1. Run full E2E test suite: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
2. Wait for Payload CMS tests (Shards 7-8) to run with other shards
3. Observe that when one test times out, multiple tests fail with browser closed errors

## Expected Behavior

When a single test times out, only that specific test process should be killed. Other tests running concurrently should continue unaffected.

## Actual Behavior

When the test runner detects timeout-related output (e.g., "Test timeout of 120000ms exceeded"), it executes:
```bash
pkill -9 -f "chromium" || true
pkill -9 -f "playwright" || true
```

This kills ALL chromium and playwright processes system-wide, causing cascading failures in other tests.

## Diagnostic Data

### Console Output
```
[2025-12-04T18:18:01.807Z] INFO: [Shard 2] ⚠️ Playwright timeout detected - aggressively killing test
[2025-12-04T18:18:01.823Z] INFO: [Shard 2] ⚠️ Failed to kill timeout process: Command failed: pkill -9 -f "chromium" || true
Error: page.reload: Target page, context or browser has been closed

[2025-12-04T18:20:12.190Z] INFO: [Shard 1] ⚠️ Playwright timeout detected - aggressively killing test
Error: page.evaluate: Target page, context or browser has been closed
```

### Test Failures (All 5)
| Shard | Test File | Test Name | Error |
|-------|-----------|-----------|-------|
| Shard 5 (Accessibility) | accessibility-hybrid.spec.ts:421 | Lighthouse performance benchmark | browser.newContext: Target page, context or browser has been closed |
| Shard 7 (Payload CMS) | payload-collections.spec.ts:343 | should recover from temporary network issues | page.reload: Target page, context or browser has been closed |
| Shard 7 (Payload CMS) | payload-collections.spec.ts:397 | should handle session expiry gracefully | page.goto: Target page, context or browser has been closed |
| Shard 7 (Payload CMS) | payload-database.spec.ts:37 | should handle database schema initialization | page.goto: Target page, context or browser has been closed |
| Shard 8 (Payload Extended) | payload-database.spec.ts:326 | should maintain data integrity on concurrent updates | page.goto: Target page, context or browser has been closed |

### Network Analysis
N/A - Not a network issue

### Database Analysis
N/A - Not a database issue

### Performance Metrics
N/A - Not a performance issue

## Error Stack Traces
```
Error: page.reload: Target page, context or browser has been closed
    at E2ETestRunner.runShard (e2e-test-runner.cjs)

Error: browser.newContext: Target page, context or browser has been closed
    at HybridAccessibilityTester.runFullAudit (accessibility-hybrid.spec.ts:429)
```

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1185-1192`
  - `apps/e2e/tests/payload/payload-collections.spec.ts`
  - `apps/e2e/tests/payload/payload-database.spec.ts`
  - `apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts`
- **Recent Changes**: dcdbd63c0 - fix(e2e): resolve race condition in admin tests with serial mode
- **Suspected Functions**:
  - `e2e-test-runner.cjs` timeout detection handler (lines 1165-1199)
  - `pkill -9 -f "chromium"` command (line 1185)

## Related Issues & Context

### Direct Predecessors
None found - this is a new diagnosis of an existing infrastructure issue.

### Historical Context
The aggressive killing logic was likely added to handle stalled tests, but it creates a worse problem by killing all browser processes indiscriminately.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The E2E test runner uses `pkill -9 -f "chromium"` to kill ALL chromium processes when ANY test times out, causing collateral damage to other running tests.

**Detailed Explanation**:
The timeout detection in `e2e-test-runner.cjs` (lines 1165-1199) watches test output for timeout indicators like "Test timeout of" or "TimeoutError". When detected, it:
1. Kills the specific process and its process group (correct)
2. ALSO runs `pkill -9 -f "chromium"` (problematic - kills ALL chromium processes)
3. ALSO runs `pkill -9 -f "playwright"` (problematic - kills ALL playwright processes)

Since the test suite runs multiple shards in parallel (batch scheduling with 4 shards at once), killing all chromium processes affects tests running in other shards.

**Supporting Evidence**:
- Log shows timeout detected in Shard 2, followed by chromium kill
- Multiple tests across Shard 1, 2, 7, and 8 fail with "browser has been closed"
- All failures occur after a timeout is logged
- Code reference: `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1185`

```javascript
execSync(`pkill -9 -f "chromium" || true`, {
    stdio: "ignore",
    timeout: 1000,
});
```

### How This Causes the Observed Behavior

1. Test A in Shard X times out (e.g., Lighthouse benchmark)
2. Test runner detects "Test timeout of 120000ms exceeded" in output
3. Test runner runs `pkill -9 -f "chromium"` which kills ALL chromium processes
4. Tests B, C, D in other shards (or same shard) lose their browser context
5. Tests B, C, D fail with "Target page, context or browser has been closed"
6. Test results show 5 failures that appear unrelated but all stem from the same root cause

### Confidence Level

**Confidence**: High

**Reasoning**:
- The log clearly shows the sequence: timeout detected → pkill chromium → browser closed errors
- The code explicitly uses `pkill -9 -f "chromium"` which matches all chromium processes
- All 5 failures have identical error patterns
- The timing in logs correlates with the pkill commands

## Fix Approach (High-Level)

Remove or scope the aggressive `pkill` commands in the timeout handler:

1. **Option A (Recommended)**: Remove the global `pkill` commands entirely, rely only on process group killing (`process.kill(-proc.pid, "SIGKILL")`)
2. **Option B**: Make the pkill commands process-specific using the PID rather than pattern matching
3. **Option C**: Add process isolation so each shard uses separate chromium user data directories

The fix should be in `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` lines 1185-1192.

## Diagnosis Determination

The root cause is definitively identified: the test runner's aggressive timeout handling uses system-wide process killing that causes collateral damage to parallel tests. The fix is straightforward - remove or scope the `pkill` commands.

## Additional Context
- The test suite runs 778 total tests (588 unit, 190 E2E)
- Only 5 E2E tests failed, all with the same "browser closed" pattern
- The actual tests may not have bugs - they are victims of the aggressive killing strategy
- Once fixed, these tests may pass normally

---
*Generated by Claude Debug Assistant*
*Tools Used: grep, cat, read (test logs, test files, e2e-test-runner.cjs)*
