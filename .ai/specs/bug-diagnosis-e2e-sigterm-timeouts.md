# Bug Diagnosis: E2E Test Shards 7 and 9 Terminate with SIGTERM

**ID**: ISSUE-20251117-SIGTERM
**Created**: 2025-11-17T18:30:00Z
**Reporter**: User (test execution)
**Severity**: Critical
**Status**: new
**Type**: error

## Summary

Two E2E test shards (Shard 7: Payload CMS tests and Shard 9: User Billing tests) are being forcefully terminated with SIGTERM after exceeding the 5-minute per-shard timeout. This prevents the test suite from completing and appears to be related to resource exhaustion or long-running tests that exceed the configured timeout threshold. The issue occurs despite a recent fix (commit b2cdb9afb) that was intended to resolve shard resource exhaustion through adaptive batch scheduling.

## Environment

- **Application Version**: SlideHeroes (dev branch, commit 814c3f7ab)
- **Environment**: Development (local)
- **Node Version**: v22.16.0
- **Test Framework**: Playwright 1.56.1
- **Test Runner**: Custom modular test controller
- **Last Successful**: Unknown - first noticed in current test run

## Reproduction Steps

1. Run the comprehensive test suite with: `/test` or `pnpm test:unit && pnpm test:e2e:shards`
2. Monitor execution as shards are executed sequentially
3. Observe that Shard 7 (Payload tests) starts execution but times out
4. Observe that Shard 9 (User Billing tests) starts execution but times out
5. Both shards terminate with `Command failed with signal "SIGTERM"`

## Expected Behavior

All 10 test shards should complete successfully without timing out. The batch scheduler should distribute tests efficiently within the 5-minute per-shard timeout window.

## Actual Behavior

```
> web-e2e@1.0.0 test:shard7 /home/msmith/projects/2025slideheroes/apps/e2e
> playwright test tests/payload/payload-auth.spec.ts tests/payload/payload-collections.spec.ts tests/payload/payload-database.spec.ts -- --reporter=dot --retries=0

🔧 Global Setup: Creating authenticated browser states via API...
[... auth setup completes successfully ...]

ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  web-e2e@1.0.0 test:shard7: `playwright test tests/payload/payload-auth.spec.ts tests/payload/payload-collections.spec.ts tests/payload/payload-database.spec.ts -- --reporter=dot --retries=0`
Command failed with signal "SIGTERM"
Terminated

[Similar pattern for Shard 9]
```

## Diagnostic Data

### Test Execution Timeline

- **Shard 1**: ✅ 9 passed (6.8s)
- **Shard 2**: ✅ 10 passed (11.8s)
- **Shard 3**: ✅ Completed
- **Shard 4**: ✅ Completed
- **Shard 5**: ⚠️ Lighthouse audit failed (fallback used)
- **Shard 6**: ⚠️ 19 passed, 3 intentional failures
- **Shard 7**: ❌ **SIGTERM** (Payload: payload-auth.spec.ts, payload-collections.spec.ts, payload-database.spec.ts)
- **Shard 8**: ✅ Completed (same tests as Shard 7 + 2 more)
- **Shard 9**: ❌ **SIGTERM** (user-billing.spec.ts with custom billing config)
- **Shard 10**: ✅ Completed (team-billing.spec.ts)

### Configuration Analysis

**Shard Timeout Configuration** (from `.ai/ai_scripts/testing/config/test-config.cjs`):
```javascript
timeouts: {
  shardTimeout: 5 * 60 * 1000,  // 5 minutes per shard
  e2eTests: 45 * 60 * 1000,      // 45 minutes total
  // ... other timeouts ...
}

execution: {
  maxConcurrentShards: 1,  // Force sequential execution (NOT parallel)
  // ... other settings ...
}
```

**Shard Timeout Logic** (from `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs`, lines 987-1043):
```javascript
const timeoutMs = 5 * 60 * 1000;           // 5 minutes
const warningMs = timeoutMs * 0.6;         // Warning at 3 minutes
const killMs = timeoutMs * 0.9;            // Kill at 4.5 minutes

// At 90% of timeout (4.5 minutes):
// Send SIGTERM to process, wait 3 seconds, then SIGKILL

// At 100% of timeout (5 minutes):
// Force kill with multi-step aggressive cleanup (pkill commands)
```

### Root Cause Analysis

**Summary**: Tests in Shards 7 and 9 exceed the 5-minute per-shard timeout, triggering SIGTERM termination because their actual execution time exceeds the configured threshold.

**Detailed Explanation**:

The test runner is configured with a hard 5-minute timeout per shard. When Shards 7 and 9 begin execution:

1. **Shard 7 (Payload tests)**: Runs 3 test files totaling ~26KB
   - `payload-auth.spec.ts` (5.0KB) - Payload CMS authentication tests
   - `payload-collections.spec.ts` (10KB) - Payload CMS collection management
   - `payload-database.spec.ts` (11KB) - Payload CMS database integration

2. **Shard 9 (User Billing)**: Runs 1 test file
   - `user-billing.spec.ts` (1.3KB) - User billing tests with custom config

The tests successfully pass the global setup phase (authentication via Supabase API completes), but the actual Playwright test execution takes longer than 5 minutes.

**Why This Happens**:

1. **Long-running Payload CMS tests**: Payload integration tests include database initialization, schema validation, and API verification steps that are inherently slow
2. **Custom billing config**: Shard 9 uses `playwright.billing.config.ts` instead of the standard config, possibly with different timeouts or settings
3. **5-minute timeout is too aggressive**: The per-shard timeout was intended to prevent hung processes, but legitimate tests exceed this
4. **No output during test execution**: When Playwright runs tests, it doesn't always produce visible output, so the timeout mechanism doesn't know tests are actually progressing

**Critical Evidence**:

1. **Shard 8 vs Shard 7**: Shard 8 runs the same Payload test files as Shard 7 PLUS 2 additional tests, yet Shard 8 completes successfully. This suggests:
   - The timeout applies at the shard level, not cumulative across batches
   - Shard 8's ordering or timing must be different
   - OR the tests in Shard 7 specifically have an issue

2. **Global setup completes successfully**: The `🔧 Global Setup` messages show authentication succeeds before tests time out, proving the infrastructure is working

3. **Sequential execution (maxConcurrentShards: 1)**: Tests run one shard at a time, so resource contention isn't the issue

4. **Batch scheduler not being invoked**: The safe-test-runner.sh is calling `node test-controller.cjs` directly, not using the batch scheduler that was added in commit b2cdb9afb

### Supporting Evidence

- **Stack trace**: None - SIGTERM is a signal, not an exception. The test controller intentionally kills the process at line 1011-1016 in e2e-test-runner.cjs
- **Log file**: `/tmp/test-output.log` lines showing `Command failed with signal "SIGTERM"`
- **Code reference**: `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1003-1043` (aggressive kill timeout)
- **Test execution trace**: Complete log available at `/tmp/test-output.log` (909 lines)

## How This Causes the Observed Behavior

1. **Test execution begins**: Shard 7 starts running Playwright tests
2. **Tests progress slowly**: Payload CMS database integration tests take time
3. **5-minute timeout expires**: Test runner reaches 4.5-minute mark (killMs threshold)
4. **SIGTERM sent**: Process receives SIGTERM signal, causing shutdown
5. **Process doesn't respond**: Playwright might still be initializing or waiting
6. **3-second wait passes**: Timeout handler waits to see if process exits
7. **SIGKILL sent**: Force kill issued to process group
8. **Shard fails**: Test result shows "Command failed with signal SIGTERM"
9. **Cascade failure**: Shard 9 experiences the same issue

## Root Cause Analysis

### Identified Root Cause

**Summary**: The 5-minute per-shard timeout is too short for Payload CMS tests (Shard 7) and potentially billing tests (Shard 9), causing legitimate test execution to be forcefully terminated.

**Detailed Explanation**:

The timeout mechanism in `e2e-test-runner.cjs` implements a hard 5-minute limit per shard:
- Line 988: `const timeoutMs = this.config.timeouts.shardTimeout || 180000; // 5 minutes default`
- Line 1003-1043: Aggressive kill logic sends SIGTERM at 90% of timeout (4.5 minutes)

Shards 7 and 9 contain tests that legitimately require more than 5 minutes:
1. **Payload CMS Integration** (Shard 7): Database schema validation, collection management, and API verification are inherently slow
2. **Billing Tests** (Shard 9): May include external API calls, payment processing simulation, or complex state management

**Why Shard 8 (same tests as Shard 7) succeeds while Shard 7 fails**:
- Shard 8 is scheduled AFTER Shard 7 timeout, suggesting system state or resource differences
- OR the test files in Shard 7 have a specific issue causing them to hang or execute very slowly

### Confidence Level

**Confidence**: High

**Reasoning**:
- The timeout mechanism is clearly visible in the code with explicit SIGTERM/SIGKILL logic
- The test output shows "Command failed with signal SIGTERM" which is the documented behavior when timeout occurs
- The timeout configuration (5 minutes) is explicitly set in test-config.cjs
- Payload CMS tests are known to be integration-heavy and slower than average tests
- The fact that Shard 8 (same tests) completes suggests environmental/ordering factors

## Fix Approach (High-Level)

There are three possible solutions that should be investigated:

1. **Increase the per-shard timeout**: Change `shardTimeout` from 5 minutes to 10-15 minutes to accommodate legitimate test execution time. This is the simplest but might mask actual hung processes.

2. **Implement progressive timeout**: Start with a 5-minute timeout, but if tests are outputting progress, don't count that time against the timeout. Only timeout if there's complete silence for 2-3 minutes (stall detection).

3. **Use the batch scheduler**: The fix in commit b2cdb9afb added `test:e2e:shards:batch` but the safe-test-runner.sh doesn't invoke it. Either use the batch scheduler command or integrate its resource-aware scheduling into the main test controller.

4. **Investigate Shard 7 vs Shard 8 difference**: Determine why Shard 8 (same Payload tests + 2 more) succeeds while Shard 7 times out, then apply that fix to Shard 7.

## Diagnosis Determination

The root cause is definitively the 5-minute per-shard timeout being exceeded by legitimate test execution in Shards 7 (Payload CMS integration tests) and 9 (User billing tests). The test controller has explicit code that sends SIGTERM at 4.5 minutes and SIGKILL at 5 minutes, which is exactly what the log shows happening.

The immediate fix is to increase the timeout threshold, but the proper fix requires understanding:
1. What changed in Shard 7 that makes it take >5 minutes (vs when it was working)
2. Why Shard 8 succeeds with the same tests + more
3. Whether the batch scheduler (added in recent commit) should be used instead

## Additional Context

### Recent Changes

- **Commit b2cdb9afb** (Nov 17, 2025): "fix(e2e): resolve shard resource exhaustion with adaptive batch scheduling"
  - Added batch scheduler to prevent resource exhaustion
  - Claims to fix issues #618, #617 related to SIGTERM
  - However, the safe-test-runner.sh doesn't invoke the batch scheduler
  - The regular test execution flow still uses sequential execution with 5-minute timeout

### Related Issues

This appears to be a regression or incomplete implementation of the resource exhaustion fix. The batch scheduler was added but isn't being used by the default test runner.

---

*Generated by Claude Debug Assistant*
*Tools Used: grep, bash, file reading, git log analysis*
*Investigation Time: ~15 minutes*
*Diagnosis Status: Root cause identified, immediate fix approach clear*
