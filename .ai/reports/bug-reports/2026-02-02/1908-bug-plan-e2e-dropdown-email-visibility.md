# Bug Fix: E2E Test Timing Issue - Dropdown Email Visibility

**Related Diagnosis**: #1907
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `toPass()` retry wrapper combined with stale React Query cache and shared test data
- **Fix Approach**: Add `toPass()` wrapper to email visibility assertion + enable `refetchOnMount`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test "settings page shows user email" fails intermittently because:
1. Email visibility check lacks retry logic (unlike the dropdown click which uses `toPass()`)
2. React Query hook has `refetchOnMount: false` causing stale data from initial mount
3. Tests share `test1@slideheroes.com` across CI runs, creating data pollution
4. No explicit wait for menu to be visible before asserting email text

Evidence: Flaky test showed user timestamp from 4 days prior (Jan 29 vs Feb 2), with 92 retry attempts all showing same stale value.

### Solution Approaches Considered

#### Option 1: Test Hardening with toPass() ⭐ RECOMMENDED

**Description**: Wrap email visibility check in Playwright's `toPass()` retry wrapper to handle timing race conditions.

**Pros**:
- Directly addresses root cause (missing retry logic)
- Follows existing pattern in codebase (dropdown click already uses `toPass()`)
- Low complexity, minimal changes
- Doesn't introduce external dependencies
- Playwright handles retries at the assertion level

**Cons**:
- Doesn't fix underlying data freshness issue
- May mask data mutation problems

**Why Chosen**: Low-risk, proven pattern, directly targets the timing issue without overengineering the solution.

#### Option 2: Fix Data Freshness with refetchOnMount

**Description**: Enable `refetchOnMount: true` in `usePersonalAccountData` to ensure fresh data on component mount.

**Pros**:
- Fixes underlying stale data problem
- Improves data consistency across the application

**Cons**:
- May introduce unnecessary API calls
- Requires coordination with data strategy

**Why Not Chosen**: This is a complementary fix, not the primary issue. We'll include it as a secondary improvement.

#### Option 3: Isolated Test Data

**Description**: Use unique test email per run instead of shared `test1@slideheroes.com`.

**Pros**:
- Eliminates data pollution between runs
- More reliable test isolation

**Cons**:
- Requires database cleanup or test data generation
- More invasive changes to test setup

**Why Not Chosen**: Requires infrastructure changes; timeout/retry approach is more immediate.

### Selected Solution: Test Hardening + Optional Data Freshness

**Justification**: The timing issue is the immediate blocker. Adding `toPass()` fixes it reliably using existing Playwright patterns. As a secondary improvement, enabling `refetchOnMount` addresses the underlying data staleness problem, making the test more robust.

**Technical Approach**:
- Wrap email visibility assertion in `toPass()` with 2-second timeout
- Add explicit wait for `[role="menu"]` before asserting email
- Enable `refetchOnMount: true` in `usePersonalAccountData` hook
- Keep shared test user for simplicity (isolated test data is future improvement)

## Implementation Plan

### Affected Files

- `apps/e2e/tests/account/account-simple.spec.ts:213-241` - Test file with failing assertion
- `packages/features/accounts/src/hooks/use-personal-account-data.ts` - React Query hook configuration
- `packages/features/accounts/src/components/personal-account-dropdown.tsx` - Dropdown component (reference only)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Hardening Test Assertion

Make the email visibility check resilient to timing issues by wrapping in `toPass()`.

- Open `apps/e2e/tests/account/account-simple.spec.ts`
- Locate the email visibility assertion (line ~237)
- Wrap the visibility check in Playwright's `toPass()` helper:
  ```typescript
  await expect(async () => {
    await expect(page.locator('[role="menu"]')).toContainText(testUser.email);
  }).toPass();
  ```
- This adds automatic retries (up to 5 times by default) with exponential backoff

**Why this step first**: Directly fixes the immediate test failure using a proven Playwright pattern.

#### Step 2: Add Explicit Menu Wait

Ensure the dropdown menu is visible before asserting email content.

- After the dropdown click (line ~232), add an explicit wait:
  ```typescript
  await expect(page.locator('[role="menu"]')).toBeVisible();
  ```
- This ensures the DOM is ready before attempting the assertion

**Why this step second**: Combines with `toPass()` to provide defense-in-depth against timing issues.

#### Step 3: Enable refetchOnMount (Secondary)

Improve data freshness to prevent stale data scenarios.

- Open `packages/features/accounts/src/hooks/use-personal-account-data.ts`
- Locate the `useQuery` hook call
- Change `refetchOnMount: false` to `refetchOnMount: true` (or remove the default)
- This ensures fresh data is fetched when the component mounting, avoiding stale cache

**Why this step third**: Addresses the underlying root cause of data staleness. Improves robustness beyond just the timing issue.

#### Step 4: Add Regression Test

Create a test to prevent this regression from reoccurring.

- Add a new test case in the same file:
  ```typescript
  test('dropdown email remains visible on fast interactions', async ({ page }) => {
    // Rapid open/close/open cycle to test timing resilience
    await page.click('[data-testid="account-menu-button"]');
    await page.click('[data-testid="account-menu-button"]');
    await page.click('[data-testid="account-menu-button"]');

    // Email should still be visible despite rapid interactions
    await expect(page.locator('[role="menu"]')).toContainText(testUser.email);
  });
  ```

**Why this step fourth**: Ensures the bug doesn't regress when touching related code.

#### Step 5: Validation

Run all E2E tests to ensure fix resolves the issue without breaking anything else.

- Run the specific test multiple times to verify consistency
- Run full E2E suite to check for regressions
- Verify type checking passes

## Testing Strategy

### Unit Tests

No unit test changes needed. The fix is in E2E and hook configuration, not in component logic.

### Integration Tests

No integration test changes needed.

### E2E Tests

**Modified tests**:
- `account-simple.spec.ts:214-240` - Settings page email visibility test

**New tests**:
- Add regression test for rapid dropdown interactions (see Step 4)

**Test coverage**:
- ✅ Email displays correctly in dropdown menu
- ✅ Email remains visible under timing stress
- ✅ No data staleness from React Query cache
- ✅ Dropdown component renders correctly with fresh data

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm test:e2e -- account-simple.spec.ts` multiple times (10+ runs)
- [ ] Verify test passes consistently without timeouts
- [ ] Check that dropdown menu displays user email immediately after opening
- [ ] Verify no console errors related to React Query cache
- [ ] Test in CI environment (dev-integration-tests workflow)
- [ ] Confirm related tests still pass (`user can update display name`, etc.)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test masking real issues**: Using `toPass()` might hide underlying problems with data fetching.
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Enable `refetchOnMount` to keep data fresh; add regression test to catch cache issues

2. **Additional API calls**: `refetchOnMount: true` may cause extra queries on component mount.
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: Monitor performance metrics; can revert if measurable impact

3. **Test flakiness persists**: If root cause is elsewhere, adding retries won't help.
   - **Likelihood**: very low
   - **Impact**: high
   - **Mitigation**: Diagnosis identified timing + stale cache as root cause; fix directly addresses both

**Rollback Plan**:

If this fix causes new issues:
1. Revert changes to `account-simple.spec.ts` (remove `toPass()` wrapper and explicit wait)
2. Revert `usePersonalAccountData` hook configuration
3. Investigate alternative root causes (check Playwright version compatibility, browser performance)

**Monitoring** (if needed):

After deployment to CI:
- Monitor dev-integration-tests workflow success rate over 24 hours
- Watch for any new test failures in account-related tests
- Check Playwright HTML report for assertion timing patterns

## Performance Impact

**Expected Impact**: minimal

- `toPass()` wrapper adds minimal overhead (max 2 seconds additional timeout)
- `refetchOnMount: true` adds one extra API call per component mount (negligible impact)
- No changes to rendering performance or bundle size

## Security Considerations

**Security Impact**: none

The fix only affects test behavior and data fetching configuration. No security changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing test multiple times to see intermittent failures
pnpm test:e2e -- account-simple.spec.ts --repeat-each 20
```

**Expected Result**: Test fails intermittently with "element not found" or timeout errors in dropdown menu.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the specific test
pnpm test:e2e -- account-simple.spec.ts

# Run full E2E suite
pnpm test:e2e

# Run full test suite including unit tests
pnpm test
```

**Expected Result**: All tests pass consistently, zero regressions, no console errors.

### Regression Prevention

```bash
# Run the test suite 10 times to verify consistency
for i in {1..10}; do pnpm test:e2e -- account-simple.spec.ts || exit 1; done

# Full build validation
pnpm build

# Check for any data fetching issues
pnpm test:e2e -- account --verbose 2>&1 | grep -i "query\|cache\|refetch"
```

## Dependencies

### New Dependencies

None required.

### Existing Dependencies

- `@playwright/test` - Already in use for E2E testing
- `@tanstack/react-query` - Already in use for data fetching

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required.

**Feature flags needed**: no

**Backwards compatibility**: maintained - this fix doesn't change public APIs or data structures.

## Success Criteria

The fix is complete when:
- [ ] Test `settings page shows user email` passes consistently (10+ consecutive runs)
- [ ] No new test failures introduced in E2E suite
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Manual testing checklist complete
- [ ] Regression test added and passing

## Notes

**Test Stability**: The diagnosis identified 92 retry attempts over 90 seconds all showing the same stale value, indicating a data freshness issue rather than a pure timing issue. The combination of `toPass()` + explicit wait + `refetchOnMount` should comprehensively address both the timing and data staleness aspects.

**Alternative Consideration**: If this fix doesn't resolve the issue, consider:
- Investigating React Query cache configuration in the provider
- Adding test data reset before account tests
- Checking for race conditions in dropdown state management

**Related Issues**:
- #1116 - E2E test failures with account dropdown timing
- #777-778 - Sign out selector mismatch

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1907*
