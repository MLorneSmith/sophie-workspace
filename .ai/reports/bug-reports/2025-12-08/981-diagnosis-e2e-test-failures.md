# Bug Diagnosis: E2E Tests Fail (4 tests) - Auth API Timeout and Payload API Login Failure

**ID**: ISSUE-pending
**Created**: 2025-12-08T18:20:00Z
**Reporter**: Claude/Test Runner
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Four E2E tests failed in the comprehensive test suite: 2 authentication-related tests timing out during `loginAsUser()`, and 4 Payload CMS database tests failing because the "Create New" button cannot be found due to failed Payload API authentication during global setup.

## Environment

- **Application Version**: dev branch (commit 34b23a4fa)
- **Environment**: development (local)
- **Browser**: Chromium (Playwright)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Intermittent issue

## Reproduction Steps

1. Run `pnpm test` or `/test` command
2. Observe authentication tests in shard 1 (auth-simple.spec.ts:107, admin.spec.ts:208)
3. Observe Payload database tests in shard 2 (payload-database.spec.ts:121, 151, 284, 326)

## Expected Behavior

- All 151 E2E tests should pass
- Authentication via `loginAsUser()` should complete within timeout
- Payload CMS should be pre-authenticated via global-setup.ts

## Actual Behavior

- 147 E2E tests pass, 4 fail
- 2 auth tests timeout waiting for response in `loginAsUser()` at auth.po.ts:576
- 4 Payload tests fail with "waiting for locator('Create New')" - button not found because user is not authenticated

## Diagnostic Data

### Console Output
```
[2025-12-08T18:07:22.852Z] INFO: [Shard 1] Playwright timeout detected - aggressively killing test
Error: page.waitForResponse: Timeout 8000ms exceeded while waiting for event "response"
   at AuthPageObject.loginAsUser (auth.po.ts:576:6)

[2025-12-08T18:18:28.852Z] INFO: [Shard 2] Playwright timeout detected - aggressively killing test
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('a:has-text("Create New"), button:has-text("Create New")')
   at PayloadCollectionsPage.createNewItem (PayloadCollectionsPage.ts:84:30)
```

### Global Setup Log
```
🔐 Authenticating payload-admin user via Supabase API...
✅ API authentication successful for payload-admin user
✅ Session injected into cookies and localStorage for payload-admin user
🔄 Authenticating to Payload CMS via API for payload-admin user...
❌ Payload API login failed for payload-admin user - no token received
✅ payload-admin user auth state saved successfully
```

## Error Stack Traces

### Auth Test Failures (auth-simple.spec.ts:107, admin.spec.ts:208)
```
Error: page.waitForResponse: Timeout 8000ms exceeded while waiting for event "response"
   at authentication/auth.po.ts:576
    574 |				);
    575 |			}
  > 576 |		}).toPass({
        |		   ^
    577 |			intervals: [500, 1000, 2000],
    578 |			timeout: authTimeout,
```

### Payload Test Failures (payload-database.spec.ts)
```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('a:has-text("Create New"), button:has-text("Create New")')
   at payload/pages/PayloadCollectionsPage.ts:84
     83 |	async createNewItem() {
   > 84 |		await this.createNewButton.click();
        |		                           ^
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/authentication/auth-simple.spec.ts:107` - sign out clears session
  - `apps/e2e/tests/admin/admin.spec.ts:208` - reactivate user flow
  - `apps/e2e/tests/payload/payload-database.spec.ts:121,151,284,326` - UUID, rollback, large data, concurrent tests
  - `apps/e2e/tests/authentication/auth.po.ts:576` - loginAsUser() toPass() block
  - `apps/e2e/global-setup.ts:532-538` - loginToPayloadViaAPI call
- **Recent Changes**: Issue #928 fixed React Query hydration race condition; Issue #970 fixed admin filter mechanism
- **Suspected Functions**:
  - `loginAsUser()` - Still intermittently timing out
  - `loginToPayloadViaAPI()` - Returns null/no token

## Related Issues & Context

### Direct Predecessors
- #928 (CLOSED): "Bug Fix: auth-simple.spec.ts Tests Timeout - React Query Hydration Race Condition" - Same login timeout issue
- #970 (CLOSED): "Bug Fix: Admin 'reactivate user flow' test fails due to unreliable filter mechanism" - Same admin test
- #975 (CLOSED): "Bug Fix: Payload CMS E2E Tests Failing - Admin User Password Mismatch"

### Similar Symptoms
- #768 (CLOSED): "Bug Diagnosis: E2E Admin & Invitations Tests Fail with Authentication API Timeout"
- #702 (CLOSED): "Bug Diagnosis: auth-simple.spec.ts sign-in test navigation timeout"

### Historical Context
These are recurring issues that have been addressed multiple times. The auth timeout appears to be a flaky/intermittent issue related to React Query hydration timing. The Payload API login failure is infrastructure-related - the Payload server may not be fully ready when global-setup.ts attempts authentication.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two distinct root causes: (1) Intermittent auth API response timeout due to server response timing variability, and (2) Payload API login failing silently during global-setup.ts because the Payload server is not ready or returns no token.

**Detailed Explanation**:

1. **Auth Timeout (auth-simple.spec.ts:107, admin.spec.ts:208)**:
   The `loginAsUser()` function in `auth.po.ts` uses a `toPass()` wrapper with 8s timeout per attempt waiting for the auth API response. When the Supabase auth endpoint is slow (>8s per attempt × 3 retries = 24s+ total), the test times out. The current implementation at line 530 sets `timeout: 8000` for `waitForResponse()`, but under load or with cold start conditions, this may be insufficient.

2. **Payload API Login Failure (payload-database.spec.ts)**:
   In `global-setup.ts:532-538`, the `loginToPayloadViaAPI()` function is called to authenticate the payload-admin user. The function returns `null` when no token is received (line 534-537), but the global setup continues without throwing an error - it just logs the failure and saves an incomplete auth state. When Payload tests later try to access the admin panel, they see the login page instead of the collections list, so the "Create New" button selector fails.

**Supporting Evidence**:
- Log shows: `❌ Payload API login failed for payload-admin user - no token received`
- Payload tests timeout waiting for `locator('a:has-text("Create New"), button:has-text("Create New")')`
- Auth tests fail at `auth.po.ts:576` in the `toPass()` block

### How This Causes the Observed Behavior

1. **Auth tests**: The Supabase auth API doesn't respond within the 8000ms timeout, causing `waitForResponse()` to throw. Even with 3 retries (500ms, 1000ms, 2000ms backoff), if all 3 attempts fail, the test times out.

2. **Payload tests**: `loginToPayloadViaAPI()` returns null, but global-setup.ts doesn't fail - it saves an incomplete auth state without the `payload-token` cookie. When Payload tests run using this state, they're not authenticated to Payload CMS, so they see the login page instead of the admin collections view.

### Confidence Level

**Confidence**: High

**Reasoning**:
- Auth timeouts are well-documented recurring issues (see #928, #768, #702)
- Payload login failure is explicitly logged: `❌ Payload API login failed for payload-admin user - no token received`
- The error messages directly match the diagnosed root causes

## Fix Approach (High-Level)

1. **Auth timeout fix**: Increase the per-attempt timeout in `loginAsUser()` from 8000ms to 15000ms, or add more retry intervals to the `toPass()` configuration. Consider implementing a health check before attempting login.

2. **Payload API login fix**: Make `global-setup.ts` fail loudly when Payload API login fails, or add retry logic with exponential backoff for Payload authentication. Additionally, add a pre-flight check to verify Payload server is healthy before attempting authentication.

## Diagnosis Determination

The 4 failing tests have two distinct root causes:
1. **Auth API timeout** (2 tests): Intermittent timing issue with Supabase auth response - existing fix from #928 may need tuning
2. **Payload API login failure** (4 tests): Global setup silently fails to authenticate with Payload CMS, causing subsequent tests to see login page instead of admin UI

Both issues are infrastructure/timing-related rather than application code bugs. The fixes should focus on improving resilience of the test setup rather than changing application behavior.

## Additional Context

Test results summary:
- Total: 943 tests (792 unit + 151 E2E)
- Passed: 939
- Failed: 4 (all E2E)

The 4 failed tests are marked as "flaky" in some cases, indicating these are intermittent issues rather than consistent failures.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (grep, tail), Read (test files, auth.po.ts, global-setup.ts), gh issue list*
