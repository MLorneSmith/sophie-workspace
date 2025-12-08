# Bug Diagnosis: Admin "reactivate user flow" test fails due to unreliable filter mechanism

**ID**: ISSUE-pending
**Created**: 2025-12-08T16:00:00Z
**Reporter**: system (test execution)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E test "Admin > Personal Account Management > reactivate user flow" in shard 4 fails intermittently due to two distinct issues: (1) authentication timeout on first attempt, and (2) unreliable account filter mechanism on retry that fails to locate `test1@slideheroes.com` in the admin accounts table.

## Environment

- **Application Version**: dev branch (commit 8adc4fd31)
- **Environment**: development (local Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (flaky test)

## Reproduction Steps

1. Run E2E shard 4: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
2. Wait for "Personal Account Management" tests to execute
3. Observe "reactivate user flow" test failure

## Expected Behavior

The test should:
1. Ban the user `test1@slideheroes.com` via admin UI
2. Reactivate the user via admin UI
3. Verify the "Banned" badge is removed
4. Successfully log in as the reactivated user

## Actual Behavior

**First attempt fails with:**
- `loginAsUser()` times out after 8 seconds waiting for `auth/v1/token` response
- Page remains on sign-in page

**Retry attempt fails with:**
- `selectAccount()` cannot find `test1@slideheroes.com` in the admin accounts table
- Locator `tr.filter({ hasText: 'test1' }).locator('a')` times out after 15 seconds
- Error context shows the search box is empty (filter not applied)

## Diagnostic Data

### Console Output
```
[admin.spec.ts beforeAll] Test user test1@slideheroes.com was banned, now restored to active state
[loginAsUser] Starting login for test1@slideheroes.com, target: /home
Error: page.waitForResponse: Timeout 8000ms exceeded while waiting for event "response"
```

### Network Analysis
```
First attempt: auth/v1/token request never completed within 8s timeout
Retry: Filter mechanism failed to trigger table refresh
```

### Error Stack Traces
```
Error: page.waitForResponse: Timeout 8000ms exceeded while waiting for event "response"

Call Log:
- Timeout 45000ms exceeded while waiting on the predicate

   at authentication/auth.po.ts:576

    574 |             );
    575 |         }
  > 576 |     }).toPass({
        |        ^
    577 |         intervals: [500, 1000, 2000],
    578 |         timeout: authTimeout,
    579 |     });
    at AuthPageObject.loginAsUser (apps/e2e/tests/authentication/auth.po.ts:576:6)
    at apps/e2e/tests/admin/admin.spec.ts:247:15

---

Retry #1:
Error: expect(locator).toBeVisible() failed

Locator: locator('tr').filter({ hasText: 'test1' }).locator('a')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

    at selectAccount (apps/e2e/tests/admin/admin.spec.ts:473:5)
    at apps/e2e/tests/admin/admin.spec.ts:103:10
```

### Screenshots
- `test-results/admin-admin-Admin-Personal-179fe-gement-reactivate-user-flow-chromium/test-failed-1.png` - Shows sign-in page (auth timeout)
- `test-results/admin-admin-Admin-Personal-179fe-gement-reactivate-user-flow-chromium-retry1/test-failed-1.png` - Shows admin accounts table without `test1` visible

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts` (lines 208-251, 452-474)
  - `apps/e2e/tests/authentication/auth.po.ts` (lines 500-586)
- **Recent Changes**: None relevant
- **Suspected Functions**:
  - `filterAccounts()` - Unreliable filter mechanism
  - `selectAccount()` - Missing wait for filter application
  - `loginAsUser()` - Timeout handling

## Related Issues & Context

### Similar Symptoms
- Authentication race conditions have been addressed before in auth.po.ts with `toPass()` pattern
- Filter mechanisms in E2E tests are known to be timing-sensitive

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `filterAccounts()` function has an unreliable filter mechanism that uses only a 250ms wait after pressing Enter, which is insufficient for the table to refresh with filtered results.

**Detailed Explanation**:

1. **Filter mechanism issue** (`apps/e2e/tests/admin/admin.spec.ts:452-460`):
```typescript
async function filterAccounts(page: Page, email: string) {
    await page.locator('[data-testid="admin-accounts-table-filter-input"]').first().fill(email);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250); // PROBLEM: Fixed timeout is unreliable
}
```

The function:
- Fills the search input
- Presses Enter to trigger filter
- Waits only 250ms (hardcoded)
- Does NOT verify the filter was applied

2. **Evidence from error context**: The retry attempt's page snapshot shows the search box (`textbox "Search account..."`) is **active but appears to not have the filter applied**, as `test1` doesn't appear in the visible table rows. The table shows `test2`, `michael`, `SlideHeroes Team`, and various `test-*` team accounts - 30 rows across 3 pages - but no `test1`.

3. **Secondary issue**: The first attempt fails because `loginAsUser()` times out waiting for auth API response. This could be due to:
   - React Query hydration delays (documented in auth.po.ts comments)
   - Network latency in Docker environment
   - Race condition with previous test's state cleanup

**Supporting Evidence**:
- Error context from retry shows empty/unfiltered table state
- 250ms wait is documented as a potential flakiness source in Playwright best practices
- The `toPass()` pattern is already used in `selectAccount()` but not in `filterAccounts()`

### How This Causes the Observed Behavior

1. Test starts `beforeEach` hook
2. `createUser()` returns `test1@slideheroes.com`
3. `filterAccounts()` fills search and presses Enter
4. 250ms passes (filter may not have applied yet)
5. `selectAccount()` looks for `tr` with `test1` text
6. Table still shows unfiltered/wrong page of results
7. Locator times out because `test1` isn't visible

### Confidence Level

**Confidence**: High

**Reasoning**: The error context from the retry clearly shows the search box is active but the table doesn't show `test1`. Combined with the minimal 250ms wait and lack of filter verification, this is a classic timing/flakiness pattern in E2E tests.

## Fix Approach (High-Level)

1. **Wrap `filterAccounts()` in `toPass()` pattern** with proper wait conditions:
   - Wait for network request/response to the accounts API
   - Or wait for table content to change
   - Verify the expected row is visible before returning

2. **Increase robustness of `selectAccount()`**:
   - Add retry logic that re-applies filter if target row not found
   - Consider pagination navigation if needed

3. **Example fix**:
```typescript
async function filterAccounts(page: Page, email: string) {
    await expect(async () => {
        await page.locator('[data-testid="admin-accounts-table-filter-input"]').first().fill(email);
        await page.keyboard.press("Enter");

        // Wait for table to show filtered results
        const row = page.locator('tr', { hasText: email.split('@')[0] });
        await expect(row).toBeVisible({ timeout: 5000 });
    }).toPass({
        intervals: [500, 1000, 2000],
        timeout: 15000
    });
}
```

## Diagnosis Determination

The test failure is caused by an **unreliable filter mechanism** in the `filterAccounts()` helper function. The 250ms hardcoded wait is insufficient for the admin accounts table to refresh with filtered results. This causes the subsequent `selectAccount()` call to fail because `test1@slideheroes.com` isn't visible in the table.

The fix requires wrapping the filter operation in a `toPass()` pattern with proper verification that the filtered row is visible before proceeding.

## Additional Context

- The test is part of a serial test group (`mode: "serial"`) to prevent race conditions
- The `beforeAll` hook attempts to unban `test1@slideheroes.com` before tests run
- The `afterEach` hook unbans the user after each test
- Authentication state is managed via `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)`

---
*Generated by Claude Debug Assistant*
*Tools Used: safe-test-runner.sh, grep, Read, error-context.md analysis*
