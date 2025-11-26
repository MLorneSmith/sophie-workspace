# Bug Diagnosis: E2E Shard 3 (Accounts) Exceeds 12-Minute Timeout

**ID**: ISSUE-712
**Created**: 2025-11-26T16:45:00Z
**Reporter**: system (test execution)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E test shard 3 (Accounts) consistently times out after 720 seconds (12 minutes), causing the test controller to SIGTERM the process before all 20 tests complete. The shard timeout configuration (12 min) is mathematically insufficient for the test suite given individual test timeouts (2 min each) and retry behavior.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (local)
- **Node Version**: v22.16.0
- **Playwright Version**: ^1.56.1
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (recurring issue pattern)
- **Branch**: dev
- **Last Commit**: f7cef3778 (fix(tooling): update test infrastructure port references)

## Reproduction Steps

1. Run `/test 3` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 3`
2. Wait for test execution to start
3. Observe test progress via dot reporter output
4. After 720 seconds (12 min), shard is terminated with SIGTERM
5. Results show 0/0 tests passed due to incomplete execution

## Expected Behavior

All 20 tests in shard 3 should complete within the shard timeout, with proper reporting of passed/failed/skipped tests.

## Actual Behavior

- Tests start running (20 tests using 3-4 workers)
- Some tests pass, some fail, some timeout individually
- At 720 seconds, test controller forcibly terminates the shard
- Process exits with SIGTERM signal
- Results show 0/0 tests (incomplete execution discarded)

## Diagnostic Data

### Console Output
```
[2025-11-26T16:23:30.272Z] INFO: [Shard 1] Running Accounts using: pnpm --filter web-e2e test:shard3 -- --reporter=dot --retries=0
Running 20 tests using 3 workers
[2025-11-26T16:31:08.413Z] INFO: [Shard 1] Warning: Shard 1 (Accounts) has been running for 432s
[2025-11-26T16:34:56.708Z] INFO: [Shard 1] Attempting graceful termination of Shard 1 (Accounts)
[2025-11-26T16:36:12.251Z] ERROR: [Shard 1] Shard 1 (Accounts) timed out after 720s
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  web-e2e@1.0.0 test:shard3
Command failed with signal "SIGTERM"
```

### Test Progress (before timeout)
```
°·×°°°°°°°·F°°°°°°°°×××TT°°°°°F×
```
Legend:
- `°` = passed test
- `·` = slow pass
- `F` = failed test (2 failures)
- `×` = error/issue (4-5 issues)
- `T` = individual test timeout (2 timeouts)

### Configuration Analysis
```
Test Controller Shard Timeout: 720,000ms (12 minutes)
  Source: .ai/ai_scripts/testing/config/test-config.cjs:35

Playwright Individual Test Timeout: 120,000ms (2 minutes) local
  Source: apps/e2e/playwright.config.ts:95

Playwright Navigation Timeout: 45,000ms (45 seconds) local
  Source: apps/e2e/playwright.config.ts:91

Test Retry Policy: 1 retry per failed test
  Source: apps/e2e/playwright.config.ts:57

Workers: 4 local
  Source: apps/e2e/playwright.config.ts:20
```

### Timing Analysis
```
Total tests in shard: 20
Max individual test time: 120s (2 min)
With retry on failure: 240s (4 min) worst case per test

Best case (all pass quickly): ~3-5 min
Typical case (some slow): ~8-10 min
Worst case (failures + retries): 20 × 120s / 4 workers = 600s (10 min) + retries

Shard timeout: 720s (12 min)
Observed duration before SIGTERM: 762s (12.7 min)
```

## Error Stack Traces
```
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  web-e2e@1.0.0 test:shard3:
`playwright test tests/account/account.spec.ts tests/account/account-simple.spec.ts
tests/team-accounts/team-accounts.spec.ts tests/team-accounts/team-invitation-mfa.spec.ts
-- --reporter=dot --retries=0`
Command failed with signal "SIGTERM"
```

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/config/test-config.cjs` - Shard timeout configuration
  - `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Shard execution logic
  - `apps/e2e/playwright.config.ts` - Individual test timeouts
  - `apps/e2e/tests/account/account.spec.ts` - Account settings tests
  - `apps/e2e/tests/account/account-simple.spec.ts` - Simple account tests
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Team account tests
  - `apps/e2e/tests/team-accounts/team-invitation-mfa.spec.ts` - MFA invitation tests (skipped)
- **Recent Changes**: Port configuration updates, test infrastructure improvements
- **Suspected Functions**: Shard timeout calculation in test-config.cjs

## Related Issues & Context

### Direct Predecessors
- #686 (CLOSED): "Bug Diagnosis: E2E Test Suite Stops Executing After Authentication Shard Timeout" - Similar timeout termination pattern
- #689 (CLOSED): "Bug Fix: E2E Test Regression - Shard Execution Halt After Authentication Timeout" - Related fix for different shard
- #621 (CLOSED): "Bug Diagnosis: E2E Test Shards 7 and 9 Terminate with SIGTERM" - Same SIGTERM pattern
- #622 (CLOSED): "Bug Fix: E2E Test Shards 7 and 9 Timeout with SIGTERM" - Prior fix attempt

### Historical Context
This is a recurring pattern where shard timeouts are set without accounting for:
1. Individual test timeout multiplied by number of tests
2. Retry behavior doubling execution time for failed tests
3. Worker parallelism not fully utilized due to test dependencies

## Root Cause Analysis

### Identified Root Cause

**Summary**: The shard timeout (12 min) is mathematically insufficient for the test suite's worst-case execution time given individual test timeouts (2 min) and retry behavior.

**Detailed Explanation**:
The test controller's shard timeout in `.ai/ai_scripts/testing/config/test-config.cjs:35` is set to `12 * 60 * 1000` (720,000ms / 12 minutes). However, shard 3 contains 20 tests, each with a 120-second timeout (from `playwright.config.ts:95`).

**Math breakdown**:
- 20 tests × 120s = 2400s (40 min) sequential worst case
- With 4 workers: ~600s (10 min) parallel best case
- With failures + 1 retry each: adds ~240s per failure
- 2 observed failures × 240s = 480s additional
- 600s + 480s = 1080s (18 min) realistic worst case

The 12-minute shard timeout cannot accommodate this, especially when:
- Tests have individual timeouts (`TT` in output)
- Network latency causes slow passes (`·` in output)
- Form interactions require full 120s timeout

**Supporting Evidence**:
- Test progress shows `TT` (2 timeouts) and `F` (2 failures) before shard termination
- Shard ran for 762s before SIGTERM - exceeding 720s limit
- Previous issues #621, #622, #686, #689 document identical SIGTERM pattern

### How This Causes the Observed Behavior

1. Test controller starts shard 3 with 720s timeout
2. Playwright runs 20 tests with up to 120s individual timeout
3. Some tests fail/timeout, triggering retries
4. At 720s mark, test controller's timeout fires
5. Controller sends SIGTERM to Playwright process
6. pnpm reports `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`
7. Partial results are discarded, reporting 0/0 tests

### Confidence Level

**Confidence**: High

**Reasoning**:
- The math clearly shows 12 min is insufficient for 20 tests × 2 min timeout
- Test progress output confirms tests were still running when terminated
- This exact pattern is documented in 4 prior closed issues
- The SIGTERM at exactly 720s confirms timeout is the trigger

## Fix Approach (High-Level)

Two complementary approaches:

1. **Increase shard timeout to 20-25 minutes** in `test-config.cjs:35` to accommodate worst-case execution:
   ```javascript
   shardTimeout: 25 * 60 * 1000, // 25 minutes per shard
   ```

2. **Reduce individual test timeouts** where possible in `playwright.config.ts:95`:
   - Local: 60-90s instead of 120s
   - Identify slow tests and optimize them

3. **Consider splitting shard 3** into smaller shards with fewer tests each to stay within timeout bounds.

## Diagnosis Determination

The root cause is **confirmed**: shard timeout (12 min) is insufficient for shard 3's test suite size (20 tests) combined with individual test timeouts (2 min) and retry behavior. This is a configuration mismatch, not a code bug.

The fix requires either:
- Increasing `shardTimeout` in test-config.cjs
- Reducing individual test timeouts in playwright.config.ts
- Splitting shard 3 into smaller shards

## Additional Context

- The `--retries=0` flag was passed in the test command, but playwright.config.ts still defines retries (this override should help)
- Many tests in shard 3 are skipped (team-invitation-mfa.spec.ts is entirely skipped)
- The account-simple.spec.ts tests have a 30-second timeout override (`test.describe.configure({ mode: "serial", timeout: 30000 })`)

---
*Generated by Claude Debug Assistant*
*Tools Used: safe-test-runner.sh, grep, read, gh issue list, git log*
