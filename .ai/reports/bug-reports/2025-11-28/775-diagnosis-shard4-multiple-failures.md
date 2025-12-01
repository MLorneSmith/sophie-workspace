# Bug Diagnosis: E2E Shard 4 Multiple Test Failures (7 of 12 Tests)

**ID**: ISSUE-pending
**Created**: 2025-11-28T21:30:00Z
**Reporter**: system/test-execution
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E Shard 4 (Admin & Invitations) has 7 failing tests out of 12 total. The failures stem from THREE distinct root causes: (1) server-side impersonation API failure, (2) team account selector popup not opening, and (3) test user authentication state issues when tests require fresh login.

## Environment

- **Application Version**: dev branch (commit 2167774f7)
- **Environment**: development (local)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Never consistently working since recent changes

## Reproduction Steps

1. Run E2E shard 4: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
2. Observe 7 test failures across admin and invitation tests

## Expected Behavior

All 12 tests in shard 4 should pass, including admin operations (ban, delete, impersonate) and team invitation flows.

## Actual Behavior

7 tests fail with different error patterns:
- Admin impersonation: Server returns "Failed to impersonate user" error
- Team account delete: `account-selector-content` element not visible
- All invitation tests: Test timeout waiting for `account-selector-content` to become visible
- Delete user flow: Navigation timeout waiting for `/admin/accounts` redirect

## Diagnostic Data

### Console Output
```
[Shard 1] ⚠️ Playwright timeout detected - aggressively killing test
TimeoutError: page.waitForURL: Timeout 90000ms exceeded.
waiting for navigation to "/admin/accounts" until "load"
waiting for navigation to "/home" until "load"
```

### Error Context (Impersonation Test)
```yaml
alertdialog "Impersonate User":
  - alert:
    - heading "Error" [level=5]
    - generic: Failed to impersonate user. Please check the logs to understand what went wrong.
  - textbox "Type CONFIRM to confirm": CONFIRM
```

### Team Account Selector Failure
```
Error: Test timeout of 120000ms exceeded
at TeamAccountsPageObject.openAccountsSelector (team-accounts.po.ts:89)
```

### Screenshots
- Invitation test: **Blank white page** (page never loaded)
- Team account delete: On team dashboard instead of admin panel

## Error Stack Traces
```
1) admin.spec.ts:225 › delete user flow
   TimeoutError: page.waitForURL("/admin/accounts") Timeout 90000ms exceeded

2) admin.spec.ts:290 › can sign in as a user (Impersonation)
   TimeoutError: page.waitForURL("/home") Timeout 90000ms exceeded
   Error dialog shows: "Failed to impersonate user"

3) admin.spec.ts:366 › delete team account flow
   Error: expect(locator).toBeVisible() - element not found
   > await expect(dropdownTrigger).toBeVisible({ timeout: 15000 });

4-7) invitations.spec.ts:26,48,74,104 › All invitation tests
   Error: Test timeout of 120000ms exceeded
   at TeamAccountsPageObject.openAccountsSelector
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts:225,290,366`
  - `apps/e2e/tests/invitations/invitations.spec.ts:26,48,74,104`
  - `apps/e2e/tests/team-accounts/team-accounts.po.ts:82-90`
  - `packages/features/admin/src/lib/server/services/admin-auth-user.service.ts:64-120`
- **Recent Changes**: Commit 2167774f7 (auth selector fixes), 0589421da (unban cleanup), 479e306d5 (parallel mode)
- **Suspected Functions**:
  - `AdminAuthUserService.impersonateUser()` - Server-side magic link generation
  - `TeamAccountsPageObject.openAccountsSelector()` - Popup visibility
  - `AuthPageObject.signOut()` - Session cleanup

## Related Issues & Context

### Direct Predecessors
- #768 (CLOSED): "Bug Diagnosis: E2E Admin & Invitations Tests Fail with Authentication API Timeout" - Same shard, different symptoms
- #770 (CLOSED): "Bug Fix: E2E Admin & Invitations Tests Fail with Authentication API Timeout" - Partial fix applied
- #764 (CLOSED): "E2E Shard 4 Serial Test Failures - State Corruption from Serial Mode" - Changed to parallel mode

### Related Infrastructure Issues
- #756 (CLOSED): "E2E Invitation Tests Hang Due to Missing Email Config" - Email config fixed
- #757 (CLOSED): "Bug Fix: E2E Invitation Tests Hang" - Timeout config added

### Historical Context
This is the SIXTH diagnosis for shard 4 failures. Previous fixes addressed:
1. Selector mismatches (data-test → data-testid)
2. Serial mode state corruption
3. Authentication timeouts
4. Missing MFA in global setup

However, the underlying issues persist with new symptoms.

## Root Cause Analysis

### Identified Root Causes (THREE DISTINCT ISSUES)

**Root Cause 1: Server-Side Impersonation API Failure**

**Summary**: The `impersonateUser()` function fails when fetching magic link tokens from Supabase redirect.

**Detailed Explanation**:
The impersonation flow in `admin-auth-user.service.ts:95-115` generates a magic link and fetches it with `redirect: "manual"` to extract tokens from the Location header. This approach is fragile because:
1. It depends on Supabase returning a redirect with tokens in the hash
2. Local development may have different redirect behavior than production
3. The fetch may fail silently if the magic link expires or is invalid

**Supporting Evidence**:
- Error context shows: "Failed to impersonate user. Please check the logs"
- Code at `admin-auth-user.service.ts:102-115` throws if Location header missing or tokens not found
- Test screenshot shows impersonation dialog with error message visible

**Root Cause 2: Team Account Selector Not Opening**

**Summary**: The `[data-testid="team-selector"]` click doesn't trigger the popover, causing `account-selector-content` to never become visible.

**Detailed Explanation**:
The `openAccountsSelector()` method in `team-accounts.po.ts:82-90` clicks `[data-testid="team-selector"]` and expects `[data-testid="account-selector-content"]` to appear. This fails because:
1. The page may not be fully loaded when click occurs (blank white page screenshot)
2. The user's authenticated session may not have any team accounts yet
3. The Radix UI Popover may have timing issues in test environment

**Supporting Evidence**:
- Invitation test screenshot shows completely blank white page
- Error occurs at `team-accounts.po.ts:89` inside `toPass()` retry loop
- All 4 invitation tests fail at the same line

**Root Cause 3: Test User Authentication State Issues**

**Summary**: Tests requiring fresh login after `signOut()` fail because the test user (test1@slideheroes.com) may be in an invalid state from previous test runs.

**Detailed Explanation**:
The admin tests use `test1@slideheroes.com` as the target user for ban/delete operations. After operations like banning, the `afterEach` hook tries to unban the user. If this cleanup fails:
1. The user remains banned across test runs
2. Subsequent tests that try to sign in as this user will fail
3. The delete user test expects redirect to `/admin/accounts` but never completes

**Supporting Evidence**:
- Delete user test waits for `/admin/accounts` redirect that never happens
- Ban user flow marked as "flaky" in test output
- `afterEach` hook has try/catch for unban but may silently fail

### How These Cause the Observed Behavior

1. **Impersonation test**: Server returns error → test waits for `/home` navigation that never happens → 90s timeout
2. **Team account delete**: User authenticated but selector broken → dropdown never appears → assertion fails
3. **Invitation tests**: Page never loads properly → selector click does nothing → 120s timeout
4. **Delete user test**: Server action may fail or redirect logic broken → waiting for URL that never loads

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error context file explicitly shows "Failed to impersonate user" error message
- Screenshot evidence shows blank page and wrong navigation state
- Code analysis reveals fragile patterns (fetch with redirect: manual, popup timing)
- Multiple previous diagnoses addressed surface symptoms but not these root causes

## Fix Approach (High-Level)

1. **Impersonation**: Add error logging to identify why magic link fetch fails. Consider using Supabase Admin API's `generateLink` response directly instead of fetching the redirect.

2. **Team Selector**: Add explicit page load wait before clicking selector. Ensure `page.goto("/home")` completes with `waitUntil: "networkidle"` before interacting with UI.

3. **Test User State**: Reset test user state in `beforeAll` hook, not just `afterEach`. Use database utilities to ensure user is in clean state before each test file runs.

## Diagnosis Determination

The shard 4 failures stem from three distinct but related issues:
1. A server-side API that relies on fragile redirect-based token extraction
2. UI interaction timing that assumes page is ready when it may not be
3. Test data state management that doesn't guarantee clean state

These issues compound each other - when one test fails and corrupts state, subsequent tests are more likely to fail even if their specific root cause is different.

## Additional Context

This is a recurring pattern in shard 4. The fundamental issue is that admin and invitation tests require complex multi-step flows (authentication → navigation → UI interaction → server action → redirect) where any step can fail independently.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git log, grep), Read (test files, service files, screenshots), Grep (codebase search)*
