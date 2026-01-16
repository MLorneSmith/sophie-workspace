# Bug Fix: Team Accounts Integration Tests Fail on Retry Due to Auth Session Loss

**Related Diagnosis**: #1492 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Playwright test retries create fresh browser contexts that don't inherit pre-authenticated storage state from beforeEach setup
- **Fix Approach**: Implement storage state preservation across test retries with explicit selector waiting in beforeEach
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Team-accounts integration tests fail intermittently when:

1. Initial test attempt times out waiting for `[data-testid="team-selector"]` (hydration delay on Vercel)
2. Playwright automatically retries by creating a fresh browser context (no auth cookies)
3. Fresh context navigates to `/home` but gets redirected to `/auth/sign-in?next=/home`
4. Test fails waiting for team selector on sign-in page instead of home page

**Evidence from CI logs**:
```
19:05:30.140 => waiting for '[data-testid="team-selector"]' to be visible
19:05:36.174 <= page.waitForSelector failed [6s timeout]
19:05:36.759 => browserType.launch started [RETRY - NEW BROWSER]
19:05:36.815 => browser.newContext started [FRESH - NO AUTH]
19:05:37.379    navigated to "/auth/sign-in?next=/home" [REDIRECT]
```

Failed tests:
- `tests/team-accounts/team-accounts.spec.ts:103:6` - user can update their team name
- `tests/team-accounts/team-accounts.spec.ts:120:6` - cannot create a Team account using reserved names

For full details, see diagnosis issue #1492.

### Solution Approaches Considered

#### Option 1: Preserve Storage State Across Retries with Enhanced Selector Waiting ⭐ RECOMMENDED

**Description**: Combine two mitigations:
1. Add explicit wait for page sidebar (not just team-selector) in beforeEach to ensure hydration is complete
2. Preserve browser context with restored auth state across retries

**Pros**:
- Addresses both the immediate timeout (hydration delay) and underlying retry issue
- No external dependencies required
- Keeps authentication state intact when retries occur
- Follows Playwright best practices for flaky tests
- Reusable pattern for other integration tests

**Cons**:
- Requires modifying global test setup
- Slightly more complex than single-line fix
- Need to ensure storage state preservation works with Supabase Auth cookies

**Risk Assessment**: low - The pattern is well-established in Playwright docs, and we're not changing core auth logic

**Complexity**: moderate - Two-part solution requiring coordination between beforeEach and test setup

#### Option 2: Increase Initial Timeout and Add More Specific Hydration Waits

**Description**: Just increase timeouts and add more granular selector waits to avoid the initial timeout

**Pros**:
- Quick fix (5-10 lines)
- No coordination needed between test parts
- Safe, low-risk change

**Cons**:
- Doesn't solve underlying retry issue
- Still suffers from flakiness if hydration is slower than adjusted timeout
- Masks the real problem rather than fixing it
- Temporary solution that will fail again if CI infrastructure changes

**Why Not Chosen**: This is a band-aid that doesn't address the root cause. The test will still fail on retry if initial wait times out. We need to fix the retry behavior itself.

#### Option 3: Disable Test Retries Entirely

**Description**: Configure Playwright to not retry failing tests (uses `{ retries: 0 }` in test configuration)

**Pros**:
- Eliminates the auth loss issue entirely

**Cons**:
- Reduces test reliability - tests fail on first transient timeout
- Doesn't address hydration delays on CI
- Tests will be flakier, not more reliable
- Goes against CI best practices

**Why Not Chosen**: This makes reliability worse. Test retries are essential for handling CI variance and transient network issues.

### Selected Solution: Preserve Storage State Across Retries with Enhanced Selector Waiting

**Justification**:

This approach solves both the immediate problem (hydration delays causing timeouts) and the underlying issue (context loss on retry). By:

1. **Waiting for sidebar in beforeEach** - ensures the page is fully hydrated and interactive before test runs, increasing likelihood the initial attempt succeeds
2. **Preserving storage state on retry** - if a timeout still occurs and Playwright retries, the fresh context will have auth cookies restored automatically

This aligns with Playwright's philosophy: "make the test more resilient" rather than "hope the infrastructure is fast enough".

**Technical Approach**:

- Add explicit wait for sidebar container (parent of team-selector) in `beforeEach` hook
- Implement context-level storage state preservation mechanism
- Configure test to restore storage state on context creation
- Keep existing timeout values (they're already well-calibrated)

**Architecture Changes** (if any):

None at the application level. Changes are purely in E2E test infrastructure:
- `tests/utils/base-test.ts` - may add context fixture enhancement
- `tests/team-accounts/team-accounts.spec.ts` - updated beforeEach with better selector waiting
- `tests/team-accounts/team-accounts.po.ts` - may add storage state restoration helper

**Migration Strategy** (if needed):

No data migration. Tests need to be updated to use new patterns, but existing tests will continue to work.

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/e2e/tests/utils/wait-for-hydration.ts` - Add new helper for comprehensive page readiness checking
- `apps/e2e/tests/utils/base-test.ts` - Implement context-level storage state preservation
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Update beforeEach with enhanced selector waiting
- `apps/e2e/tests/team-accounts/team-accounts.po.ts` - Add context restoration helper if needed
- `apps/e2e/playwright.config.ts` - Verify retry configuration is optimal (review, may not need changes)

### New Files

No new files needed - all changes are in existing infrastructure.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Comprehensive Page Readiness Utility

Add a new function to `wait-for-hydration.ts` that waits for the sidebar container and team selector to be ready:

```typescript
/**
 * Wait for the team sidebar layout to be fully rendered and interactive.
 * This is more comprehensive than waiting just for team-selector.
 *
 * Addresses Issue #1492: Ensures hydration is complete before test starts.
 */
export async function waitForTeamSidebarReady(
  page: Page,
  options: {
    timeout?: number;
    debug?: boolean;
  } = {},
): Promise<void> {
  const {
    timeout = CI_TIMEOUTS.hydration,
    debug = process.env.DEBUG === 'true',
  } = options;

  if (debug) {
    console.log('[TeamSidebarReady] Waiting for team sidebar to be ready...');
  }

  // Wait for the sidebar container itself (parent element)
  await page.waitForSelector('[data-testid="sidebar"]', {
    state: 'visible',
    timeout,
  });

  // Wait for team selector within the sidebar
  await page.waitForSelector('[data-testid="team-selector"]', {
    state: 'visible',
    timeout,
  });

  if (debug) {
    console.log('[TeamSidebarReady] Team sidebar is ready');
  }
}
```

**Why this step first**: We need this utility in place before updating the tests. This establishes the foundation for more reliable hydration waiting.

#### Step 2: Enhance Base Test to Preserve Storage State on Context Recreation

Update `apps/e2e/tests/utils/base-test.ts` to implement storage state preservation:

The key issue is that Playwright's `test.use({ storageState: ... })` only applies once at the beginning of the test. When a test retries, it creates a new browser context without reloading the storage state.

Add helper to restore storage state on retry:

```typescript
/**
 * Helper to ensure storage state is restored when tests retry.
 *
 * When Playwright retries a test, it creates a fresh browser context.
 * This helper ensures authenticated cookies are available in the new context.
 *
 * Usage in beforeEach:
 *   await restoreAuthStorageState(page);
 */
export async function restoreAuthStorageState(page: Page): Promise<void> {
  // Get the storage state from the initial context
  const storageState = await page.context().storageState();

  if (!storageState || storageState.cookies.length === 0) {
    return; // No auth cookies to restore
  }

  // Reapply cookies to ensure they're in place
  // This is idempotent - safe to call multiple times
  await page.context().addCookies(storageState.cookies);

  // Restore local storage
  if (storageState.origins && storageState.origins.length > 0) {
    for (const origin of storageState.origins) {
      for (const [key, value] of Object.entries(origin.localStorage || {})) {
        await page.evaluate(
          ({ key: k, value: v }) => localStorage.setItem(k, v),
          { key, value }
        );
      }
    }
  }
}
```

**Why this step**: Without this, retried tests will have no auth context. This restores the authenticated state across retries.

#### Step 3: Update beforeEach in Team Accounts Test

Update `apps/e2e/tests/team-accounts/team-accounts.spec.ts` beforeEach hook:

Replace:
```typescript
test.beforeEach(async ({ page }) => {
  teamAccounts = new TeamAccountsPageObject(page);

  // Navigate to home first with hydration wait - required because Playwright
  // starts with blank page even when using pre-authenticated storage state
  // Use navigateAndWaitForHydration for CI reliability (Issue #1051)
  await navigateAndWaitForHydration(page, "/home", {
    timeout: CI_TIMEOUTS.navigation,
  });

  // Create a team for the test
  const teamName = teamAccounts.createTeamName();
  slug = teamName.slug;

  await teamAccounts.createTeam({
    teamName: teamName.teamName,
    slug: teamName.slug,
  });
});
```

With:
```typescript
test.beforeEach(async ({ page }) => {
  teamAccounts = new TeamAccountsPageObject(page);

  // Restore auth storage state in case this is a retry
  // Addresses Issue #1492: Storage state lost when Playwright retries
  await restoreAuthStorageState(page);

  // Navigate to home first with hydration wait - required because Playwright
  // starts with blank page even when using pre-authenticated storage state
  // Use navigateAndWaitForHydration for CI reliability (Issue #1051)
  await navigateAndWaitForHydration(page, "/home", {
    timeout: CI_TIMEOUTS.navigation,
    waitForSelector: '[data-testid="sidebar"]', // More specific: wait for sidebar, not just body
  });

  // Wait for team selector to be interactive
  // This ensures hydration is complete before proceeding
  // Addresses Issue #1492: Reduces timeouts on initial attempt
  await waitForTeamSidebarReady(page, {
    timeout: CI_TIMEOUTS.hydration,
  });

  // Create a team for the test
  const teamName = teamAccounts.createTeamName();
  slug = teamName.slug;

  await teamAccounts.createTeam({
    teamName: teamName.teamName,
    slug: teamName.slug,
  });
});
```

**Why this step**: This adds the storage state restoration and more specific hydration waiting. The combination addresses both the initial timeout and retry issues.

#### Step 4: Verify Playwright Configuration

Check `apps/e2e/playwright.config.ts` to ensure test retry configuration is optimal:

Look for:
```typescript
use: {
  retries: process.env.CI ? 2 : 0, // Should retry on CI
  // ...
}
```

And timeout settings:
```typescript
timeout: 120_000, // 120s per test
expect: {
  timeout: 30_000, // 30s per expect statement
},
```

**Current configuration should be fine** - we have 2 retries on CI which is appropriate.

If needed, you can adjust based on CI flakiness patterns, but current setup is reasonable.

#### Step 5: Add Tests for Storage State Preservation

Create or update tests to verify the fix works:

No new test needed - the existing failing tests will validate that the fix works. When they pass consistently without flakiness, the fix is successful.

However, consider adding a test utility that explicitly tests:
```typescript
test('storage state is preserved across retries @retry', async ({ page }) => {
  // This test validates that auth state persists even if test times out
  // It's hard to force a real retry in test code, but we can verify
  // the helper function works correctly

  const auth = new AuthPageObject(page);
  await auth.loginAsUser({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

  // Get initial storage state
  const initialStorage = await page.context().storageState();
  expect(initialStorage.cookies.length).toBeGreaterThan(0);

  // Simulate what would happen on retry
  await restoreAuthStorageState(page);

  // Verify cookies still exist
  const restoredStorage = await page.context().storageState();
  expect(restoredStorage.cookies.length).toBe(initialStorage.cookies.length);
});
```

**Why this step**: Validates that the storage preservation mechanism works before relying on it in real tests.

#### Step 6: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `waitForTeamSidebarReady()` waits for correct selectors
- ✅ `restoreAuthStorageState()` restores cookies correctly
- ✅ `restoreAuthStorageState()` handles empty storage state
- ✅ Edge case: Called on already-authenticated context

**Test files**:
- `apps/e2e/tests/utils/wait-for-hydration.spec.ts` - Already exists, add new function tests

### Integration Tests

No new integration tests needed - the existing team-accounts tests will serve as validation.

**Existing tests that will validate the fix**:
- `tests/team-accounts/team-accounts.spec.ts:103` - user can update their team name
- `tests/team-accounts/team-accounts.spec.ts:120` - cannot create a Team account using reserved names

These tests are currently flaky; they should become stable with this fix.

### E2E Tests

The failing team-accounts tests ARE the E2E tests that validate this fix. Running them repeatedly should show improved pass rate.

**Test files**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Main validation

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run team-accounts tests 5 times in succession: `pnpm --filter e2e test:shard=1 team-accounts.spec.ts`
- [ ] Verify both failing tests pass consistently
- [ ] Check that no new errors appear in browser console
- [ ] Verify page redirects correctly to `/home` (not `/auth/sign-in`)
- [ ] Run full E2E test suite to check for regressions
- [ ] Test on local environment (not just CI)
- [ ] Verify team selector loads and displays correctly
- [ ] Check that storage state is preserved in browser DevTools

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Storage state not restored properly on retry**
   - **Likelihood**: low
   - **Impact**: medium (tests still flaky)
   - **Mitigation**: Test storage state restoration helper thoroughly before relying on it. Verify cookies exist after restoration.

2. **Restored storage state has expired cookies**
   - **Likelihood**: low
   - **Impact**: medium (test fails with auth error)
   - **Mitigation**: Supabase session tokens are long-lived in dev/test. Monitor token expiration in tests. Consider adding explicit token refresh if needed.

3. **Side effects from restoring storage state in beforeEach**
   - **Likelihood**: very low
   - **Impact**: low (test isolation issue)
   - **Mitigation**: `restoreAuthStorageState()` is idempotent - safe to call multiple times. No state is cleared, only restored.

**Rollback Plan**:

If this fix causes issues in production (unlikely since this is E2E test code only):

1. Revert the three files modified (wait-for-hydration.ts, base-test.ts, team-accounts.spec.ts)
2. Remove the `restoreAuthStorageState()` call from beforeEach
3. Revert to original simpler hydration waiting
4. Tests will revert to original flakiness level

The fix is additive only - no existing functionality is changed, only enhanced.

**Monitoring** (if needed):

- Monitor CI flakiness rate for team-accounts tests
- Track pass rate over next 5-10 CI runs
- Alert if pass rate drops below 95% (indicates new issue)

## Performance Impact

**Expected Impact**: minimal

- `waitForTeamSidebarReady()` adds ~500ms to beforeEach (waiting for additional selector)
- `restoreAuthStorageState()` adds ~50ms (in-memory operations)
- Total impact: ~550ms per test (acceptable)
- Trade-off: More reliable tests worth the small performance cost

**Performance Testing**:

- Measure beforeEach duration before and after fix
- Ensure overall test suite time doesn't increase significantly
- Expected: +0.5s per team-accounts test (acceptable)

## Security Considerations

**Security Impact**: none

The fix only:
- Restores authenticated cookies that were already present
- Does not create new auth tokens or change auth logic
- Does not bypass security features
- Uses standard Playwright APIs

No security review needed - this is strictly an E2E test reliability fix.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run team-accounts tests multiple times - should see failures
pnpm --filter e2e test team-accounts.spec.ts -- --repeat-each=5

# Expected: Intermittent failures when `team-selector` timeout occurs
# Failures will show: "page.waitForSelector failed [6s timeout]"
```

**Expected Result**: Tests fail intermittently due to hydration delays and subsequent auth loss on retry.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# E2E tests - team accounts specific
pnpm --filter e2e test team-accounts.spec.ts

# E2E tests - full suite
pnpm --filter e2e test

# Run tests multiple times to check for flakiness
for i in {1..5}; do
  echo "Run $i"
  pnpm --filter e2e test team-accounts.spec.ts
done
```

**Expected Result**: All tests pass consistently. No timeouts. No redirects to `/auth/sign-in`.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions in other tests
pnpm --filter e2e test

# Verify no new console errors
# Check for "page.goto failed" or "waitForSelector timeout" messages
pnpm --filter e2e test team-accounts.spec.ts 2>&1 | grep -i "timeout\|error\|failed"
# Expected: Clean output, no matches
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses only:
- Existing Playwright APIs (`context.storageState()`, `context.addCookies()`)
- Existing test utilities (`navigateAndWaitForHydration`, `waitForHydration`)
- No external packages

### No database changes required

## Deployment Considerations

**Deployment Risk**: none

**Why**: This is purely E2E test code. It doesn't affect the application itself. Changes are to `apps/e2e/` only.

**Special deployment steps**: None needed

**Feature flags needed**: no

**Backwards compatibility**: maintained (changes are additive)

## Success Criteria

The fix is complete when:

- [ ] `waitForTeamSidebarReady()` utility is implemented and tested
- [ ] `restoreAuthStorageState()` helper is implemented in base-test
- [ ] `beforeEach` in team-accounts.spec.ts updated with storage restoration
- [ ] Team-accounts tests pass 10 times in succession without timeouts
- [ ] No "page redirected to /auth/sign-in" errors in logs
- [ ] All E2E tests pass (zero regressions)
- [ ] Code review approved
- [ ] Local and CI test execution both successful

## Notes

**Key insights from diagnosis**:

1. The real issue isn't the initial timeout - it's the context loss on retry. Even with longer timeouts, tests will fail on retry.

2. Playwright's retry mechanism creates a fresh browser context, but doesn't reload the `storageState` that was set at test start.

3. The `navigateAndWaitForHydration()` utility is good, but we need to wait for more specific elements (sidebar) not just body.

4. This pattern applies to all integration tests that use pre-authenticated state. Consider documenting it as a best practice.

**Related documentation**:
- Playwright test retries: https://playwright.dev/docs/test-retries
- Storage state: https://playwright.dev/docs/auth#reusing-signed-in-state
- Page Object pattern: https://playwright.dev/docs/pom

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1492*
