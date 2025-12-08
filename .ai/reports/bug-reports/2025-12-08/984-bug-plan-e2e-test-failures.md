# Bug Fix: E2E Test Failures - Auth Timeout and Payload API Login

**Related Diagnosis**: #981 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Two distinct issues: (1) `loginAsUser()` auth API timeout under load with insufficient retry intervals, (2) Payload CMS API login failing silently without error propagation in global setup
- **Fix Approach**: Increase auth timeout and retry intervals in `loginAsUser()`, add retry logic and error handling to Payload API login in `global-setup.ts`
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Four E2E tests are failing due to two independent issues:

**Issue 1: Auth API Timeout (2 tests)**
- Tests: `auth-simple.spec.ts:107` ("sign out clears session"), `admin.spec.ts:208` ("reactivate user flow")
- Root cause: `loginAsUser()` in `auth.po.ts:576-581` times out waiting for Supabase auth API response
- Current per-attempt timeout: 8000ms with retry intervals `[500, 1000, 2000]` = 3.5s backoff
- Issue: Under test load, network latency exceeds per-attempt timeout; limited retry intervals don't provide sufficient recovery time
- Evidence: `Error: page.waitForResponse: Timeout 8000ms exceeded`

**Issue 2: Payload API Login Failure (4 tests)**
- Tests: `payload-database.spec.ts` lines 121, 151, 284, 326
- Root cause: `global-setup.ts:532-538` calls `loginToPayloadViaAPI()` which returns `null` silently
- Setup continues without throwing error, saves incomplete auth state
- Tests later see login page instead of authenticated UI, can't find "Create New" button
- Evidence: `Error: locator.click: waiting for locator('a:has-text(\"Create New\")')`

For full details, see diagnosis issue #981.

### Solution Approaches Considered

#### Option 1: Increase Auth Timeout with More Aggressive Retry Strategy ⭐ RECOMMENDED

**Description**: Increase the per-attempt timeout from 8000ms to 12000ms and add more retry intervals to handle network latency better. This approach keeps the same general structure but improves resilience.

**Pros**:
- Minimal code changes - only modify timeout constants and retry intervals
- Targeted fix addresses the specific network latency issue
- Maintains existing per-attempt timeout model which works well under normal conditions
- Additional retry intervals (e.g., 500, 1500, 3000, 5000, 8000) provide exponential backoff
- Combined with increased total timeout (28s → 35s+), this fits within test timeout budget
- Proven pattern in Playwright documentation for flaky operations

**Cons**:
- Doesn't address the root cause of network latency (just tolerates it)
- Tests run slightly slower on average
- May mask underlying performance issues

**Risk Assessment**: low - This change is backwards compatible and only affects timing

**Complexity**: simple - Only modify `testConfig.getRetryIntervals()` return values

#### Option 2: Add Circuit Breaker Pattern to Skip Retry After N Failures

**Description**: Track consecutive auth failures and skip retry after 3 consecutive failures to fail fast rather than exhaust the full timeout.

**Pros**:
- Fails faster on genuine errors (not transient failures)
- Provides better test diagnostics

**Cons**:
- Adds complexity to error handling
- Makes tests unpredictable (sometimes fast failures, sometimes slow)
- Harder to debug which attempt actually succeeded

**Why Not Chosen**: Adds unnecessary complexity without addressing the core issue. The current timeout-based approach is clearer.

#### Option 3: Use API-Based Authentication Instead of UI-Based

**Description**: Replace the entire UI-based login in test with direct API call to Supabase auth, similar to what global setup does.

**Pros**:
- Eliminates UI rendering/hydration issues entirely
- Much faster and more reliable
- Would fix both known and unknown UI-related auth issues

**Cons**:
- Doesn't test the actual UI sign-in flow (important for user-facing functionality)
- Changes test scope and reduces coverage
- Requires architectural changes to test structure

**Why Not Chosen**: Would reduce test value. We need to keep testing the actual UI sign-in experience.

### Payload API Login Issue Solutions

#### Option A: Add Retry Logic with Exponential Backoff ⭐ RECOMMENDED

**Description**: When `loginToPayloadViaAPI()` returns `null`, retry up to 3 times with exponential backoff before failing the setup.

**Pros**:
- Handles transient network failures
- Follows established retry pattern from auth tests
- Minimal code changes

**Cons**:
- Adds 5-10 seconds to setup on first failure
- If API is truly broken, will still fail after retries

**Complexity**: moderate - Add retry loop and exponential backoff logic

#### Option B: Throw Error Immediately and Fail Setup Loudly

**Description**: If Payload API login fails, throw an error immediately with a clear message rather than silently continuing.

**Pros**:
- Catches errors immediately instead of in random test failures
- Makes debugging much easier
- Tests fail at setup time with clear error message

**Cons**:
- Doesn't fix the underlying failure
- Combined with Option A, this is part of the full solution

**Why chosen together**: Option A + B is the complete fix. We retry on transient failures, but fail loudly if persistent.

### Selected Solution: Dual Fix

**Justification**:
1. For auth timeout issue: Increase timeout and retry intervals to handle network latency better under load
2. For Payload API login: Add retry logic (3 attempts) with exponential backoff, then throw clear error if all fail

This approach:
- Fixes both independent issues
- Maintains existing test patterns
- Low risk and backwards compatible
- Clear error messages for debugging
- Follows Playwright best practices for flaky operations

**Technical Approach**:
1. Update `testConfig.getRetryIntervals("auth")` to return extended intervals: `[500, 1500, 3000, 5000]` (8.5s total backoff)
2. Increase `testConfig.getTimeout("medium")` from ~20s to 25-30s to accommodate longer retry sequence
3. Add retry loop to `loginToPayloadViaAPI()` call in global-setup.ts with 3 attempts
4. Use exponential backoff: 500ms, 1000ms, 2000ms between retries
5. Throw descriptive error after all retries exhausted
6. Add debug logging to track which attempt succeeds

**Architecture Changes** (if any):
- No architecture changes needed
- Only modify timeout/retry configuration and error handling

**Migration Strategy** (if needed):
- No data migration needed
- No breaking changes to APIs or schemas
- Existing test setup will automatically use new timeouts/intervals

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/e2e/tests/utils/test-config.ts` - Increase timeouts and retry intervals for auth operations
- `apps/e2e/global-setup.ts` - Add retry logic and error handling to Payload API login

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Auth Timeout Configuration

Increase timeout and retry intervals in `test-config.ts` to handle network latency better under load.

- Increase `getTimeout("medium")` from ~20s to 28-32s
- Update `getRetryIntervals("auth")` to return `[500, 1500, 3000, 5000]` instead of shorter intervals
- Add explanatory comment about why these intervals were chosen
- Verify constants are used correctly in `loginAsUser()`

**Why this step first**: Configuration changes should be made before testing to establish baselines

#### Step 2: Add Retry Logic to Payload API Login

Add retry mechanism to `loginToPayloadViaAPI()` call in global-setup.ts.

- Create retry wrapper function: `loginToPayloadWithRetry(payloadUrl, email, password, maxAttempts=3)`
- Implement exponential backoff: 500ms, 1000ms, 2000ms between attempts
- Log each attempt with attempt number and result
- Throw descriptive error after all retries exhausted
- Update global-setup.ts to use `loginToPayloadWithRetry()` instead of direct call
- Add debug logging to track which attempt succeeds

**Why this step second**: Error handling should be in place before testing the fix

#### Step 3: Update Error Handling in Global Setup

Ensure Payload API login failures are properly propagated and don't silently fail.

- Check that error is thrown (not swallowed) when all retries fail
- Add try/catch around the Payload login attempt
- Log clear error message with actionable steps
- Ensure global setup fails loudly on auth failure

#### Step 4: Add/Update Tests

Add tests to prevent regression.

- Unit test: `test-config.ts` timeout/retry value validation
- Integration test: Verify `loginAsUser()` succeeds within new timeout budget
- Integration test: Verify Payload login retries on transient failure
- Add regression test: Verify login timeout error is caught and properly reported

#### Step 5: Validation

Run comprehensive testing to verify fixes.

- Run `pnpm typecheck` - Verify no type errors
- Run `pnpm lint` - Verify code quality
- Run `pnpm --filter e2e test:auth-simple` - Test auth timeout fix
- Run `pnpm --filter e2e test:admin` - Test admin auth timeout fix
- Run `pnpm --filter e2e test:payload-database` - Test Payload API login fix
- Run full E2E suite: `pnpm --filter e2e test` - Verify no regressions

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `testConfig.getRetryIntervals("auth")` returns extended intervals
- ✅ `testConfig.getTimeout("medium")` returns appropriate timeout value
- ✅ Exponential backoff calculation in retry logic

**Test files**:
- `apps/e2e/tests/utils/test-config.spec.ts` - Configuration validation

### Integration Tests

- ✅ `loginAsUser()` succeeds with new timeout budget under simulated latency
- ✅ `loginToPayloadWithRetry()` succeeds on first attempt normally
- ✅ `loginToPayloadWithRetry()` retries on transient 500 error
- ✅ `loginToPayloadWithRetry()` throws after 3 failed attempts
- ✅ Global setup fails loudly when Payload login fails

### E2E Tests

Run the originally failing tests to verify fixes:

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts:107` - "sign out clears session"
- `apps/e2e/tests/admin/admin.spec.ts:208` - "reactivate user flow"
- `apps/e2e/tests/payload/payload-database.spec.ts:121` - "should verify UUID support for Supabase"
- `apps/e2e/tests/payload/payload-database.spec.ts:151` - "should handle transaction rollback on error"
- `apps/e2e/tests/payload/payload-database.spec.ts:284` - "should handle large payload data correctly"
- `apps/e2e/tests/payload/payload-database.spec.ts:326` - "should maintain data integrity on concurrent updates"

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run full E2E test suite: `pnpm --filter e2e test` (should pass)
- [ ] Check no new timeout errors appear in logs
- [ ] Verify Payload login succeeds in global setup
- [ ] Test with slow network simulation (DevTools throttling) to verify timeouts work
- [ ] Check that errors are descriptive when failures occur
- [ ] Verify no performance regression (tests not significantly slower)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Risk: Tests run slower on average**: Longer timeouts and more retry intervals mean more time spent waiting for failures
   - **Likelihood**: medium
   - **Impact**: low (adds seconds to test suite)
   - **Mitigation**: Monitor test execution time; adjust intervals if average runtime increases >10%

2. **Risk: Timeout values don't work in CI environment**: Different network conditions in CI vs local
   - **Likelihood**: low
   - **Impact**: medium (tests still fail in CI)
   - **Mitigation**: Add CI-specific timeout overrides in playwright.config.ts if needed; monitor CI test results

3. **Risk: Payload login retry loop adds too much latency**: 3 retries with backoff could add 3.5s to setup
   - **Likelihood**: low (only on transient failures)
   - **Impact**: low (adds seconds to setup once)
   - **Mitigation**: Limit retries to 2 if latency becomes issue; adjust backoff intervals

**Rollback Plan**:

If this fix causes issues in production:
1. Revert timeout changes in `test-config.ts` to previous values
2. Remove retry loop from `loginToPayloadWithRetry()`
3. Re-run tests to verify rollback
4. Investigate alternative approaches (increase test parallel workers, optimize Supabase instance, etc.)

**Monitoring** (if needed):
- Monitor E2E test suite execution time after deployment
- Track auth timeout error rate (should decrease to near zero)
- Monitor Payload API login success rate in global setup

## Performance Impact

**Expected Impact**: minimal

- Per-test auth operations add ~0-5 seconds on average (only when retry needed)
- Payload login adds ~0-3.5 seconds to global setup (only on transient failures)
- Normal case (no failures): negligible impact
- Test suite total runtime: +0-10 minutes worst case on first run with failures

**Performance Testing**:
- Compare test suite execution time before/after fix
- Monitor P99 latencies for auth operations
- Verify no significant slowdown on CI infrastructure

## Security Considerations

**Security Impact**: none

No security implications:
- Timeout values don't affect authentication security
- Retry logic uses same credentials/validation
- Error messages don't leak sensitive information

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Run failing tests - should see auth timeouts and Payload login failures
pnpm --filter e2e test:auth-simple -- --grep "sign out clears session"
pnpm --filter e2e test:admin -- --grep "reactivate user flow"
pnpm --filter e2e test:payload-database -- --grep "should verify UUID support"
```

**Expected Result**: Tests timeout with `Error: page.waitForResponse: Timeout 8000ms exceeded` or Payload login failures

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run previously failing tests
pnpm --filter e2e test:auth-simple
pnpm --filter e2e test:admin
pnpm --filter e2e test:payload-database

# Full E2E test suite
pnpm --filter e2e test
```

**Expected Result**: All commands succeed, all tests pass, zero regressions, auth operations complete within timeout

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm --filter e2e test

# Check for new timeout-related errors
pnpm --filter e2e test 2>&1 | grep -i "timeout" | wc -l

# Verify Payload setup succeeds
pnpm --filter e2e test 2>&1 | grep "Payload API login" | head -5
```

## Dependencies

### New Dependencies (if any)

No new dependencies required - using existing libraries:
- Playwright for test operations (already installed)
- Supabase JS client for auth (already installed)

**Dependencies added**: none

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - Changes only affect test timeouts, not production code

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] All 6 originally failing tests now pass
- [ ] Full E2E test suite runs without auth/Payload timeout errors
- [ ] Zero regressions in other tests
- [ ] Code passes TypeScript strict mode
- [ ] Code passes linter and formatter
- [ ] Error messages are clear and actionable
- [ ] Performance acceptable (no significant slowdown)

## Notes

**Implementation Timeline**:
1. Update test-config.ts with new timeout values (5 min)
2. Add retry logic to global-setup.ts (10 min)
3. Run tests and verify fixes (15 min)
4. Adjust timeouts if needed based on test results (5 min)

**Testing Priority**: Run the 6 failing tests first to confirm fixes, then full suite for regressions

**Known Issues Fixed**:
- Auth timeout under load with insufficient retry intervals
- Silent Payload API login failure without error propagation

**Future Improvements** (not in scope):
- Consider moving to API-based auth for all E2E tests (reduces flakiness)
- Monitor and optimize Supabase instance performance in CI
- Add network simulation to E2E tests for better reliability testing

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #981*
