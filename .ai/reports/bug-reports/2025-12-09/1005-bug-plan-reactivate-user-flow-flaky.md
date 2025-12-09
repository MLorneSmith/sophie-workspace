# Bug Fix: Flaky timeout in 'reactivate user flow' test due to React hydration race

**Related Diagnosis**: #1003 (REQUIRED)
**Severity**: medium
**Bug Type**: test
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Race condition in `loginAsUser()` where auth API response fires before `waitForResponse` listener is attached, especially after cookie clearing. Double navigation on line 249 adds timing uncertainty.
- **Fix Approach**: Remove redundant navigation + add hydration wait guard in `loginAsUser()` to ensure React handlers are ready before form submission
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "reactivate user flow" test intermittently fails (~10% failure rate) with an authentication timeout when the E2E test tries to log back in after reactivating a banned user. The root cause is a race condition in the `loginAsUser()` method where:

1. The test clears cookies (line 246) to force a fresh login
2. `loginAsUser()` calls `goToSignIn()` which uses `waitUntil: "domcontentloaded"`
3. `domcontentloaded` fires before React hydration completes
4. The form appears visually but event handlers aren't attached yet
5. When the test submits the form, the React Query mutation doesn't fire
6. The `waitForResponse` listener times out waiting for the auth API
7. The redundant navigation at line 249 (before calling `loginAsUser()`) adds extra timing variance

**Additionally**, line 249 does a redundant `page.goto("/auth/sign-in")` before calling `loginAsUser()`, which then calls `goToSignIn()` internally. This double-navigation causes timing variance and unnecessary delays.

For full details, see diagnosis issue #1003.

### Solution Approaches Considered

#### Option 1: Add hydration wait guard in loginAsUser() ⭐ RECOMMENDED

**Description**: Before form submission, wait for React hydration completion indicators:
- Wait for `networkidle` state (all pending network requests complete)
- Add a small hydration safety timeout (100-300ms) to ensure JavaScript execution
- These happen AFTER the initial form is visible but BEFORE form submission

**Pros**:
- Directly addresses the root cause (React not ready)
- Minimal code changes - centralized in one method
- Works for all `loginAsUser()` callers throughout the test suite
- Consistent with Playwright best practices (wait for actual state, not arbitrary timing)
- Prevents similar race conditions in future tests

**Cons**:
- Slight performance impact (~200-300ms per login)
- Adds conditional logic for different wait strategies

**Risk Assessment**: Low - doesn't change test logic, only adds additional wait conditions. The hydration wait is a defensive measure that helps with flaky browser execution patterns.

**Complexity**: Simple - two additional wait calls before form submission.

#### Option 2: Increase timeout values only

**Description**: Increase `perAttemptTimeout` from 8s to 15s to match CI timeout configuration.

**Pros**:
- Very simple change
- No code logic changes

**Cons**:
- Doesn't fix the root cause, just masks it
- Tests will still be unreliable, just fail slower
- Other races could still occur with longer timeouts

**Why Not Chosen**: Masking symptoms rather than fixing root cause. Timeouts are already adequate - the issue is timing, not insufficient duration.

#### Option 3: Remove cookie clearing + implement dedicated sign-out flow

**Description**: Instead of raw cookie clearing, use the application's sign-out flow to properly clear session state.

**Pros**:
- Cleaner application state management
- Consistent with how real users sign out

**Cons**:
- More complex test changes needed
- The test is testing admin functionality (banning/reactivating), not sign-out flow
- Other tests successfully use `page.context().clearCookies()` - this pattern is established

**Why Not Chosen**: The cookie clearing pattern is standard in the test suite. The issue isn't the clearing method but the subsequent login race condition.

### Selected Solution: Add hydration wait guard in loginAsUser()

**Justification**: This directly addresses the root cause (React not hydrated) without masking symptoms. The fix is minimal, centralized in one method, and benefits all `loginAsUser()` callers throughout the test suite. This is consistent with Playwright best practices of waiting for actual application state rather than arbitrary timeouts.

**Technical Approach**:
1. After `goToSignIn()` returns and form is visible, add `page.waitForLoadState('networkidle')` before form submission
2. Add a small 100-150ms additional safety timeout to ensure JavaScript execution context is ready
3. These waits happen sequentially before form interaction, ensuring hydration is complete
4. Remove the redundant navigation at line 249 in admin.spec.ts

**Architecture Changes** (minimal):
- In `auth.po.ts` `loginAsUser()`: Add hydration wait guards after form visibility check (lines 515-520)
- In `admin.spec.ts`: Remove redundant navigation at line 249

**Migration Strategy** (none needed):
- These are test-only changes
- No user-facing code changes
- No database changes

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/authentication/auth.po.ts` (lines 487-592) - Add hydration wait guards before form submission
- `apps/e2e/tests/admin/admin.spec.ts` (line 249) - Remove redundant navigation

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Remove redundant navigation in admin.spec.ts

<describe what this step accomplishes>
This removes the double-navigation issue that adds timing variance. The test currently navigates to `/auth/sign-in` twice - once manually, then again inside `loginAsUser()`. We'll remove the manual navigation since `loginAsUser()` handles it.

- Remove line 249: `await page.goto("/auth/sign-in");`
- `loginAsUser()` already calls `goToSignIn()` which performs the navigation
- This also improves test clarity by using the page object method consistently

**Why this step first**: Removing the redundant navigation reduces timing variance before we add the hydration guards. This makes the subsequent test more deterministic.

#### Step 2: Add hydration wait guards in loginAsUser()

<describe what this step accomplishes>
This adds explicit waits for React hydration completion before form submission. Currently, the method waits for form visibility (which happens during React initial render) but doesn't wait for event handler attachment (which happens during hydration).

- After the form visibility check (line 520), add `await this.page.waitForLoadState('networkidle')` with a 10-second timeout
- After networkidle, add a small 150ms safety timeout to allow JavaScript execution
- Add console log before waiting: `"[loginAsUser] Waiting for hydration..."`
- Add console log after waiting: `"[loginAsUser] Hydration complete, submitting form"`

**Technical reasoning**:
- `networkidle` ensures all pending network requests are complete (Supabase auth initialized)
- 150ms safety timeout allows browser's JavaScript execution queue to settle
- These waits are defensive - they may complete immediately if app is fast, but prevent race conditions if slow
- Console logs help debug future timeout issues

**Why this step here**: The redundant navigation removal in Step 1 makes this change easier to reason about - there's only one navigation path now.

#### Step 3: Verify changes compile and lint

<describe the validation strategy>
Ensure the TypeScript and formatting changes are valid.

- Run TypeScript compiler: `pnpm typecheck`
- Run linter: `pnpm lint:fix` (to auto-fix any style issues)

#### Step 4: Run the previously-failing test in isolation

<describe what this step accomplishes>
Test the specific fix by running just the "reactivate user flow" test multiple times to verify the race condition is resolved.

- Run the flaky test 5 times: `for i in {1..5}; do bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4 -- --grep "reactivate user flow"; done`
- Or run shard 4 (which contains the test): `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
- Watch for "✅ Login complete" messages in test output to confirm hydration waits succeeded
- Verify test passes all 5 runs without timeouts

#### Step 5: Run full admin test suite

<describe what this step accomplishes>
Verify the fix doesn't break other tests in the same file and that related authentication paths are stable.

- Run admin tests: `pnpm --filter e2e test apps/e2e/tests/admin/admin.spec.ts`
- Verify all tests pass (ban flow, reactivate flow, impersonation skipped tests)
- Check console for any new warnings or errors

#### Step 6: Run authentication test suite

<describe what this step accomplishes>
Verify changes to `auth.po.ts` don't break other tests that use `loginAsUser()`. The method is used throughout the test suite, so we need to ensure the hydration waits don't cause issues elsewhere.

- Run auth tests: `pnpm --filter e2e test apps/e2e/tests/authentication/`
- Verify all auth-related tests pass (sign-in, sign-up, password reset)
- The additional waits should be transparent - tests should complete in similar time

#### Step 7: Run full test suite

<describe what this step accomplishes>
Final comprehensive validation that the fix doesn't introduce regressions.

- Run all E2E tests: `pnpm --filter e2e test`
- Or run individual shards to verify each area: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh [1-12]`
- Verify shard 4 (admin tests) completes without "reactivate user flow" failures

## Testing Strategy

### Unit Tests

No unit tests apply - this is an E2E test fix.

### Integration Tests

No integration tests needed - the fix is isolated to test infrastructure.

### E2E Tests

Key E2E test scenarios to validate:

- ✅ **Admin > Personal Account Management > ban user flow** - Verify ban functionality works before reactivate test
- ✅ **Admin > Personal Account Management > reactivate user flow** - Primary test being fixed; run 5+ times to verify race condition is resolved
- ✅ **Authentication > sign-in flow** - Other tests using `loginAsUser()` should work consistently
- ✅ **Admin > Personal Account Management > reactivate user flow with fresh session** - After reactivate, verify user can login with clear cookies (the race condition scenario)
- ✅ **Regression: No performance degradation** - Hydration waits should complete quickly for a healthy app; measure total test time

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run the "reactivate user flow" test 10 times: `for i in {1..10}; do bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4 -- --grep "reactivate user flow"; done`
- [ ] Verify 100% pass rate (no timeouts or race condition failures)
- [ ] Check console logs show "Hydration complete, submitting form" messages
- [ ] Run full shard 4 (admin tests): `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
- [ ] Verify all admin tests pass without regressions
- [ ] Run shard 2 (authentication tests): `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 2`
- [ ] Verify auth tests complete without timeout issues
- [ ] Check that test execution time doesn't significantly increase (hydration should be fast)

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Hydration waits could be too strict for slow CI environments**:
   - **Likelihood**: Low
   - **Impact**: Medium - tests might timeout in CI
   - **Mitigation**: Use `waitForLoadState('networkidle')` which is designed for this; if issues occur in CI, we can add `timeout: testConfig.getTimeout('medium')` parameter

2. **Performance regression from additional waits**:
   - **Likelihood**: Low
   - **Impact**: Low - waits should complete immediately in most cases
   - **Mitigation**: Hydration waits are conditional - they only block if app is actually hydrating. Well-built React apps hydrate in <50ms.

3. **Breaking other tests that use loginAsUser()**:
   - **Likelihood**: Very Low
   - **Impact**: High - widespread test failures
   - **Mitigation**: Additional waits are defensive and shouldn't hurt. Tests already using `loginAsUser()` expect React to be hydrated. Run full auth test suite to verify.

**Rollback Plan**:

If this fix causes issues in production CI:
1. Revert both files to original state: `git checkout apps/e2e/tests/authentication/auth.po.ts apps/e2e/tests/admin/admin.spec.ts`
2. Re-open issue #1003 to re-diagnose the problem
3. Consider Option 2 (increase timeouts) as fallback if hydration approach proves incompatible

**Monitoring** (if needed):
- Monitor shard 4 pass rate in CI after merge
- Watch for any timeout errors in auth-related tests
- Log hydration timing to understand app startup patterns

## Performance Impact

**Expected Impact**: Minimal

The additional waits in `loginAsUser()` will add 150-300ms per login in worst case (when app is slow to hydrate). However:
- Hydration typically completes in <50ms for a healthy app
- The waits will likely complete immediately most of the time
- Tests that were failing due to race conditions will now reliably pass
- Overall test suite time should improve since we eliminate intermittent retries from flaky timeouts

The removal of redundant navigation (Step 1) actually improves performance slightly by eliminating one unnecessary page load.

## Security Considerations

No security implications - this is a test infrastructure fix. The changes don't affect production code or authentication mechanisms.

**Security Impact**: None

## Validation Commands

### Before Fix (Bug Should Reproduce)

Current behavior: "reactivate user flow" test fails intermittently with timeout:

```bash
# Run shard 4 multiple times to see intermittent failures
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4

# Watch for failures like:
# Error: page.waitForResponse: Timeout 8000ms exceeded...
# at AuthPageObject.loginAsUser (auth.po.ts:582)
```

**Expected Result**: Occasional timeout failures in "reactivate user flow" test (approximately 10% failure rate based on diagnosis).

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Run the specific failing test 5 times
for i in {1..5}; do bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4 -- --grep "reactivate user flow"; done

# Run full shard 4 (admin tests)
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4

# Run shard 2 (authentication tests) to verify loginAsUser() changes don't break other tests
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 2

# Run full test suite
pnpm --filter e2e test
```

**Expected Result**: All commands succeed, "reactivate user flow" test passes consistently (100% pass rate across multiple runs), no regressions in other tests, console shows "✅ Login complete" messages.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm --filter e2e test

# Additional regression checks - verify specific test flows
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 2  # Auth tests
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 3  # Account tests
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4  # Admin tests
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. The fix uses existing Playwright APIs (`waitForLoadState`).

**No new dependencies required**

## Database Changes

No database changes required. This is a test-only fix.

**No database changes required**

## Deployment Considerations

**Deployment Risk**: None - test infrastructure change only

No special deployment steps needed. This change is test-only and doesn't affect production code.

**Feature flags needed**: No

**Backwards compatibility**: N/A - test changes

## Success Criteria

The fix is complete when:
- [ ] "reactivate user flow" test passes 100% of the time when run repeatedly
- [ ] Admin test suite (shard 4) completes without failures
- [ ] Authentication test suite (shard 2) completes without failures
- [ ] Full E2E test suite passes without regressions
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] No new timeout errors appear in test output
- [ ] Console logs show "Hydration complete" messages confirming waits were applied

## Notes

### Related Issues

- #969: Same test, different root cause (filter mechanism issue) - separate from this fix
- #928: React Query hydration race condition fix - similar pattern resolved previously
- #992: E2E Test Infrastructure Systemic Architecture Problems - broader testing stability work

### Implementation Notes

1. The `testConfig.getTimeout("short")` used in the current implementation is good; keep those timeout values
2. The hydration wait should use `networkidle` because it waits for Supabase auth initialization
3. The 150ms safety timeout after `networkidle` allows the browser's event loop to settle
4. The redundant navigation removal (line 249) is important - it reduces non-deterministic timing variance
5. Console logs are helpful for future debugging when timeout issues occur

### Why This Fix Works

The core issue is that `page.waitForLoadState('domcontentloaded')` returns before React hydration completes. React hydration involves:
1. Downloading JavaScript (already done by domcontentloaded)
2. Parsing and executing JavaScript
3. Attaching event handlers to DOM elements (this is the "hydration" step)

By adding `page.waitForLoadState('networkidle')` after the form is visible:
- We wait for Supabase auth client to fully initialize
- We ensure React Query is ready to handle mutations
- We add a safety timeout for JavaScript execution context

This is a proven pattern in Playwright E2E testing for handling client-side framework hydration.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1003*
