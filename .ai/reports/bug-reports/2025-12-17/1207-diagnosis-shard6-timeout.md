# Bug Diagnosis: E2E Shard 6 Timeout - Mixed Test Types and Failing Payload Auth Tests

**ID**: ISSUE-pending
**Created**: 2025-12-17T18:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

E2E test shard 6 times out after 20 minutes without completing. The shard combines two incompatible test types (healthcheck + payload-auth) and the payload-auth tests are failing/timing out individually, compounding with retries to exceed the shard timeout.

## Environment

- **Application Version**: dev branch (commit a4f38d38c)
- **Environment**: development (local Docker test environment)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Playwright Version**: 1.57.0
- **Last Working**: Unknown (ongoing issue pattern)

## Reproduction Steps

1. Run `/test 6` to execute shard 6
2. Observe tests starting with global setup completing successfully
3. Watch test progress markers appear: `·×F°×T`
4. After ~19 minutes, graceful termination is attempted
5. Tests are killed with SIGTERM
6. Results show 0 tests completed (results not captured due to early termination)

## Expected Behavior

- Shard 6 completes within 20 minutes
- All 10 tests (1 healthcheck + 9 payload-auth) execute and report results
- Tests pass or fail with clear results

## Actual Behavior

- Tests run but many fail/timeout individually (90s per test)
- With retries (1 retry per test), failed tests take up to 180s each
- Total potential time: 9 tests × 90s × 2 = 27 minutes (exceeds 20 min shard timeout)
- Shard killed at 90% of timeout (~18 min) with SIGTERM
- Results show 0 tests completed because JSON results file wasn't written

## Diagnostic Data

### Console Output
```
[2025-12-17T17:35:08.582Z] INFO: 🔀 Running E2E tests with 2 parallel shards
✅ All validations passed
Running 10 tests using 1 worker
·[database-utilities] Unlocked Payload user: michael@slideheroes.com
×[database-utilities] Unlocked Payload user: michael@slideheroes.com
°×[database-utilities] Unlocked Payload user: michael@slideheroes.com
·×[database-utilities] Unlocked Payload user: michael@slideheroes.com
×[database-utilities] Unlocked Payload user: michael@slideheroes.com
[2025-12-17T17:54:18.337Z] INFO: [Shard 1] ⚠️ Attempting graceful termination of Shard 1 (Health & Payload Auth)
Command failed with signal "SIGTERM"
```

### Test Execution Analysis
```
When running payload-auth tests directly with timeout:
  ✘  1 [payload] › payload-auth.spec.ts:30:6 › should be able to access the login page without errors (11.5s)
  ✘  2 [payload] › payload-auth.spec.ts:30:6 › (retry #1) (12.1s)
  -  3 [payload] › payload-auth.spec.ts:43:6 › should create first user successfully [SKIPPED]
  ✘  4 [payload] › payload-auth.spec.ts:70:6 › should handle pre-seeded admin user correctly (1.0m)
  ✘  5 [payload] › payload-auth.spec.ts:70:6 › (retry #1) (1.0m)
  ✓  6 [payload] › payload-auth.spec.ts:92:6 › should handle database connection errors gracefully (1.6s)
  ✘  7 [payload] › payload-auth.spec.ts:121:6 › should login with existing user (1.0m)
  ✘  8 [payload] › payload-auth.spec.ts:121:6 › (retry #1) (1.0m)
```

### Timeout Configuration
```javascript
// test-config.cjs
shardTimeout: 20 * 60 * 1000, // 20 minutes per shard

// playwright.config.ts
timeout: process.env.CI ? 180 * 1000 : 90 * 1000, // 3 min CI, 90s local
retries: 1,
```

### Shard 6 Definition
```json
// package.json
"test:shard6": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/healthcheck.spec.ts tests/payload/payload-auth.spec.ts"

// e2e-test-runner.cjs
{
  id: 6,
  name: "Health & Payload Auth",
  shardCommand: "test:shard6",
  files: ["tests/healthcheck.spec.ts", "tests/payload/payload-auth.spec.ts"],
  expectedTests: 10, // healthcheck (1) + payload-auth (9)
}
```

## Error Stack Traces
```
No stack traces - tests killed by SIGTERM before completion
```

## Related Code
- **Affected Files**:
  - `apps/e2e/package.json` (shard definition)
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` (shard execution)
  - `.ai/ai_scripts/testing/config/test-config.cjs` (timeout config)
  - `apps/e2e/tests/payload/payload-auth.spec.ts` (failing tests)
  - `apps/e2e/tests/payload/pages/PayloadLoginPage.ts` (page object)
- **Recent Changes**: NODE_ENV fix applied to safe-test-runner.sh
- **Suspected Functions**: Login/auth flow in PayloadLoginPage

## Related Issues & Context

### Direct Predecessors
- #1135 (CLOSED): "Payload CMS E2E tests timeout without executing" - Same timeout pattern, fixed by adding --project=payload
- #1136 (CLOSED): "Bug Fix: Payload CMS E2E tests timeout without executing" - Related fix

### Related Infrastructure Issues
- #992 (CLOSED): "E2E Test Infrastructure Systemic Architecture Problems" - Broader test infra issues
- #686 (CLOSED): "E2E Test Suite Stops Executing After Authentication Shard Timeout" - Similar timeout pattern

### Similar Symptoms
- #1139 (CLOSED): "E2E Account Tests Timeout - Conflicting Timeout Architecture" - Timeout config issues
- #911 (CLOSED): "E2E Test Runner Timeout Detection Kills Tests That Intentionally Handle Timeouts"

### Historical Context
Multiple E2E timeout issues have been addressed. The pattern shows recurring problems with:
1. Shard timeouts vs individual test timeouts
2. Tests that legitimately take time being killed
3. Results not captured when tests are terminated early

## Root Cause Analysis

### Identified Root Cause

**Summary**: Shard 6 combines mismatched test types (fast healthcheck + slow UI auth tests) and the payload-auth tests are failing/timing out, which combined with retries exceeds the 20-minute shard timeout.

**Detailed Explanation**:

1. **Test Composition Mismatch**: Shard 6 contains:
   - `healthcheck.spec.ts`: 1 test, ~30ms, API-only
   - `payload-auth.spec.ts`: 9 tests, UI-based, each can take up to 90s

2. **Payload Auth Tests Are Failing**: Direct execution shows multiple tests hitting the 60-90s timeout, indicating underlying issues with:
   - Login flow timing
   - Authentication state verification
   - Element visibility waits

3. **Retry Amplification**: With `retries: 1`, each failed test is run twice:
   - Worst case: 9 tests × 90s × 2 = 27 minutes
   - Shard timeout: 20 minutes
   - Result: Tests killed before completion

4. **Result Capture Failure**: When SIGTERM is sent, Playwright doesn't finish writing the JSON results file, so the shard reports "0 tests completed" even though tests were running.

**Supporting Evidence**:
- Test execution log shows `·×F°×T` pattern (mix of passes/fails/timeouts)
- Graceful termination at 17:54:18, 19 min after start (17:35:08)
- Direct test run shows individual tests taking 1.0m (full timeout)
- Log: `Command failed with signal "SIGTERM"`

### How This Causes the Observed Behavior

1. User runs `/test 6`
2. Test controller starts shard 6 with 20-min timeout
3. Playwright runs 10 tests with 1 worker
4. Several payload-auth tests fail/timeout (90s each)
5. Retries add more time (another 90s per failed test)
6. At ~18 minutes (90% of timeout), graceful termination starts
7. SIGTERM kills Playwright before it writes results
8. Shard reports 0 tests, appears to have failed silently

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct observation of test execution times
- Log analysis shows exact timing pattern
- Math confirms shard timeout is insufficient for failing tests with retries
- Similar patterns documented in related issues (#1135, #1139)

## Fix Approach (High-Level)

**Recommended: Split shard 6 into two separate shards**

1. **Create test:shard6a** (Healthcheck only):
   ```json
   "test:shard6a": "playwright test tests/healthcheck.spec.ts"
   ```
   - Fast, reliable, API-only test
   - Completes in seconds

2. **Create test:shard6b** (Payload Auth only):
   ```json
   "test:shard6b": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-auth.spec.ts --project=payload"
   ```
   - Dedicated shard for payload auth tests
   - Can have its own timeout if needed

3. **Update e2e-test-runner.cjs** to reflect new shard IDs

**Alternative Options (if splitting not desired)**:
- **Option B**: Increase shard timeout to 30 minutes (masks issue, doesn't fix tests)
- **Option C**: Fix failing payload-auth tests (separate issue, should be done regardless)
- **Option D**: Disable retries for payload tests (reduces time by 50%)

## Diagnosis Determination

The root cause is definitively identified as a **timeout architecture mismatch** where:
1. Shard combines fast and slow tests inappropriately
2. Slow tests are failing/timing out (separate bug)
3. Retries push total time beyond shard timeout
4. Early termination prevents result capture

The fix is straightforward: split the shard. The failing payload-auth tests should be investigated separately as they indicate underlying issues with the Payload CMS login flow or test implementation.

## Additional Context

- NODE_ENV fix was applied today to safe-test-runner.sh - this fixed the pre-flight validation but exposed the underlying test failures
- Payload CMS is healthy and responding correctly on port 3021
- The issue is in the tests themselves and the shard composition, not infrastructure

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Grep, GitHub CLI (gh issue list/view)*
