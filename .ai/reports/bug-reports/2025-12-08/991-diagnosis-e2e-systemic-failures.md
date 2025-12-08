# Bug Diagnosis: E2E Tests Have Systemic Architecture Problems Causing Recurring Failures

**ID**: ISSUE-pending
**Created**: 2025-12-08T20:15:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Analysis of the last 10+ E2E test failure issues reveals that recurring E2E test failures are **not individual bugs** but symptoms of **systemic architectural problems** in the E2E test infrastructure. The same failure patterns appear across issues #974, #977, #981, #984, #985, #987, #989, #990 - each "fixed" with incremental timeout increases, yet failures continue. The root cause is a fragile, over-engineered test architecture that creates cascading failures.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development/CI
- **Node Version**: 22.x
- **Last Working**: Tests have never been stable - constant fix/fail cycle

## Recurring Failure Patterns Identified

Analysis of issues #974, #977, #981, #984, #985, #987, #989, #990 reveals **5 distinct systemic problems**:

### Pattern 1: Auth Timeout Escalation (Issues #987, #988, #989, #990)
- **Symptom**: `loginAsUser()` times out waiting for Supabase auth API
- **History**: Timeout increased 5s → 8s → 12s → 15s, still failing
- **Root Cause**: Testing auth through UI instead of API - fragile and slow

### Pattern 2: Global Setup Cascading Failures (Issue #985)
- **Symptom**: 24+ tests fail when Payload server not running
- **History**: Fixed by making Payload auth "optional", but underlying coupling remains
- **Root Cause**: Global setup is monolithic - one failure cascades to all tests

### Pattern 3: Aggressive Timeout Killing (Issues #989, #990)
- **Symptom**: Server crashes with `net::ERR_EMPTY_RESPONSE` after tests killed
- **History**: Test controller logs `⚠️ Playwright timeout detected - aggressively killing test` repeatedly
- **Root Cause**: Test controller kills processes on ANY timeout message, destabilizing Next.js server

### Pattern 4: Payload Auth State Mismatch (Issues #974, #981)
- **Symptom**: "Create New" button not found, admin panel shows login instead
- **History**: Fixed by re-seeding, fixing passwords, adding retries
- **Root Cause**: Test state depends on external Payload server state - no isolation

### Pattern 5: Flaky Test Result Parsing (Issue #977)
- **Symptom**: Test controller reports "0 tests" when Playwright reports "1 flaky"
- **History**: Parser didn't recognize "flaky" status
- **Root Cause**: Fragile string parsing of Playwright output instead of using JSON reporter

## Root Cause Analysis

### Identified Root Cause

**Summary**: The E2E test infrastructure has fundamental architectural flaws that make tests inherently unstable:

1. **UI-Based Authentication is Fragile**: Tests authenticate through the UI using `loginAsUser()` which depends on:
   - React Query hydration timing
   - Supabase API cold starts
   - Form submission race conditions
   - Navigation timing

   Each of these is a point of failure. The solution has been to increase timeouts (5s→8s→12s→15s), but this just delays failures.

2. **Global Setup is a Single Point of Failure**: The `global-setup.ts` file authenticates 4 users sequentially. If ANY authentication fails (e.g., Payload server down), the entire batch can fail depending on configuration. The fix in #985 made Payload auth "optional" but the architectural coupling remains.

3. **Test Controller Aggressively Kills Processes**: When ANY output contains "exceeded while" or "Test timeout of", the test controller immediately `SIGKILL`s the Playwright process. This:
   - Prevents Playwright's own retry mechanism from working
   - Destabilizes the Next.js dev server (causing `net::ERR_EMPTY_RESPONSE`)
   - Creates cascading failures for subsequent tests

4. **No Test Isolation**: Tests depend on:
   - Shared Payload server state (user passwords, seeding)
   - Shared Supabase database state (banned users not cleaned up)
   - Shared Next.js server (killed by controller, affects other tests)

5. **Result Parsing is Fragile**: The test controller parses Playwright's stdout text to count results. It didn't recognize "flaky" tests (#977) and could miss other edge cases. Should use `--reporter=json`.

### Supporting Evidence

From the recent test run (today):
```
[2025-12-08T20:10:51.361Z] INFO: [Shard 2] ⚠️ Playwright timeout detected - aggressively killing test
[2025-12-08T20:10:51.361Z] INFO: [Shard 2] ⚠️ Playwright timeout detected - aggressively killing test
[2025-12-08T20:10:51.361Z] INFO: [Shard 2] ⚠️ Playwright timeout detected - aggressively killing test
... (12 times total)
```

This aggressive killing creates cascading failures. The test controller killed Payload tests 12 times in rapid succession, and:
- Shard 1: 55/62 passed (7 failed due to timeouts killed prematurely)
- Shard 2: 65/89 passed (24 failed, mostly Payload CMS)

From issue history:
- #987, #988: Auth timeout 5s→8s
- #989, #990: Auth timeout 8s→12s→15s
- Tests still failing with 15s timeout

This "timeout escalation" pattern shows we're treating symptoms, not causes.

### How This Causes the Observed Behavior

1. **Test starts** → React Query not hydrated → form submit fails
2. **Auth API doesn't respond in time** → `page.waitForResponse` times out
3. **Timeout message appears in stdout** → Test controller regex matches
4. **Test controller kills Playwright** → `SIGKILL` sent
5. **Next.js server destabilized** → Subsequent requests fail with `ERR_EMPTY_RESPONSE`
6. **Subsequent tests fail** → Not because of their own bugs, but server crash
7. **Diagnosis blames individual tests** → Timeout increased
8. **Cycle repeats**

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear pattern across 10+ issues with same root causes
- Each "fix" (timeout increase) followed by same failure reappearing
- Code analysis confirms the aggressive killing behavior
- Today's test run demonstrates the pattern in action

## Fix Approach (High-Level)

The fix requires architectural changes, not more timeout increases:

### Short-Term (Immediate Stability)

1. **Remove Aggressive Process Killing**: The test controller should NOT kill processes on timeout detection. Let Playwright's built-in retry mechanism work. Remove the "aggressively killing test" logic from `e2e-test-runner.cjs:1164-1187`.

2. **Use JSON Reporter**: Replace stdout parsing with `--reporter=json` to get accurate test results without fragile regex parsing.

3. **Add Server Health Checks**: Before each shard, verify Next.js server is healthy. If not, restart it.

### Medium-Term (Architectural Fixes)

4. **API-Based Auth Instead of UI**: The `loginAsUser()` method should use the Supabase API directly (like `global-setup.ts` does) instead of filling forms. This eliminates React Query timing issues entirely.

5. **Decouple Global Setup**: Split authentication by user type. Payload users should only be authenticated when Payload shards run.

6. **Test Isolation**: Each test should clean up its state. The "ban user flow" test should unban the user in `afterEach`.

### Long-Term (Proper Architecture)

7. **Use Test Containers**: Run each shard with its own isolated Next.js + Supabase + Payload instance.

8. **Eliminate Shared State**: Each test creates its own test user via API, runs, cleans up.

## Related Issues & Context

### Direct Predecessors (Same Problem Pattern)
- #990 (CLOSED): "E2E Server Crash and Auth Timeout" - increased timeout to 15s
- #989 (CLOSED): "E2E Server Crash and Auth Timeout" - diagnosed server destabilization
- #988 (CLOSED): "E2E Flaky Tests" - added toPass() pattern
- #987 (CLOSED): "Auth Timeout and Missing Error Element" - increased timeout to 8s
- #985 (CLOSED): "Global Setup Crashes When Payload Not Running" - made Payload auth optional
- #984 (CLOSED): "E2E Test Failures - Auth Timeout" - same auth timeout issue
- #981 (CLOSED): "E2E Tests Fail (4 tests)" - auth timeout + Payload auth failure
- #977 (CLOSED): "Test Controller Reports Zero Tests for Flaky Tests" - parser didn't recognize "flaky"
- #974 (CLOSED): "Payload CMS E2E Tests Failing - Admin User Password Mismatch" - credential mismatch

### Historical Pattern
This represents the 10th+ iteration of "fixing" E2E test timeouts since November 2025. Each fix addresses a symptom while the architectural problems persist:

| Issue | Fix Applied | Result |
|-------|-------------|--------|
| #733 | Selector migration | New timeout issues emerged |
| #766 | Ban user cleanup | State isolation still broken |
| #776 | Shard 4 fixes | Same tests fail again in #981 |
| #886 | Stripe webhook fixes | Billing tests still flaky |
| #987-990 | Timeout increases (5s→15s) | Tests still timing out |

## Affected Files

- `apps/e2e/tests/authentication/auth.po.ts` - UI-based auth that should be API-based
- `apps/e2e/global-setup.ts` - Monolithic setup with cascading failure risk
- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:1164-1187` - Aggressive process killing
- `apps/e2e/tests/utils/test-config.ts` - Timeout configuration (symptom treatment)
- `apps/e2e/playwright.config.ts` - Retry configuration

## Reproduction Steps

1. Run `/test --e2e` or full test suite
2. Observe tests failing with auth timeouts
3. Observe test controller killing processes on timeout detection
4. Observe subsequent tests failing with `ERR_EMPTY_RESPONSE`
5. Check logs for pattern: multiple "aggressively killing test" messages followed by cascading failures

## Expected Behavior

- Tests should be stable (>99% pass rate)
- Individual test failures should not cascade
- Timeout handling should allow Playwright retries to work
- Auth should not depend on UI timing

## Actual Behavior

- Tests have ~97-98% pass rate with consistent 10-20 failures
- Single timeout causes cascading failures via server destabilization
- Test controller preemptively kills processes, preventing Playwright retries
- Auth depends on React Query hydration timing

## Additional Context

The fundamental issue is that this E2E test architecture was designed for simplicity but has accumulated complexity (aggressive killing, custom parsers, monolithic setup) that makes it fragile. Each "fix" adds more complexity without addressing the root cause.

The correct solution is to simplify: use API-based auth, remove aggressive killing, use JSON reporters, and ensure proper test isolation.

---
*Generated by Claude Debug Assistant*
*Tools Used: GitHub issue analysis, code inspection, pattern analysis*
