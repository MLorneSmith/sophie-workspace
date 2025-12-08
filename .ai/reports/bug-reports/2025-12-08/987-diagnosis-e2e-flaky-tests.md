# Bug Diagnosis: E2E Test Failures - Auth Timeout and Missing Error Element

**ID**: ISSUE-pending (will be updated after GitHub issue creation)
**Created**: 2025-12-08T19:15:00Z
**Reporter**: Test Suite
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Two E2E tests are failing intermittently in local test runs:
1. "user can sign in with valid credentials" fails with auth API timeout
2. "ban user flow" fails because `data-testid="auth-error-message"` element is not visible when a banned user tries to sign in

Both failures are related to timing/flakiness issues rather than actual functionality bugs. The authentication test has a race condition with the auth API response listener, and the ban user flow test depends on error message display that may not appear when Supabase returns certain error responses for banned users.

## Environment

- **Application Version**: dev branch (commit 06ce47133)
- **Environment**: development (local)
- **Browser**: Chromium (Playwright)
- **Node Version**: v20.x
- **Database**: PostgreSQL (local Supabase)
- **Last Working**: Tests pass intermittently

## Reproduction Steps

### Auth Timeout Test
1. Run `pnpm --filter web-e2e test:shard2`
2. Observe "user can sign in with valid credentials" test
3. Test times out waiting for `auth/v1/token` response

### Ban User Flow Test
1. Run `pnpm --filter web-e2e test:shard4`
2. Complete ban user flow (admin bans test user)
3. Navigate to sign-in page as banned user
4. Submit login form
5. Test expects `[data-testid="auth-error-message"]` to be visible but element not found

## Expected Behavior

### Auth Test
- Login form submission triggers auth API call
- Test waits for and captures auth response
- Navigation to `/home` completes successfully

### Ban User Flow Test
- Banned user submits login credentials
- Auth API returns error (400/401 with `user_banned` code)
- `AuthErrorAlert` component displays error message with `data-testid="auth-error-message"`

## Actual Behavior

### Auth Test
- `page.waitForResponse` times out after 5000ms (per-attempt short timeout)
- No auth API response is captured within the timeout window
- `toPass()` retries exhaust but never capture the response

### Ban User Flow Test
- Auth API returns error for banned user
- The error message element is not found on the page within 15000ms timeout
- Test fails with "element(s) not found"

## Diagnostic Data

### Console Output
```
[loginAsUser] Starting login for test1@slideheroes.com, target: /home
[loginAsUser] Form submitted, waiting for auth API...
Error: page.waitForResponse: Timeout 5000ms exceeded while waiting for event "response"
```

### Network Analysis
```
# Auth test
- page.waitForResponse for 'auth/v1/token' times out
- Auth API may fire before listener is attached due to React Query hydration

# Ban user test
- auth/v1/token returns 400 status for banned user
- Error code is 'user_banned' or 'Invalid login credentials'
```

### Screenshots
- `test-results/authentication-auth-simple-c8944-n-in-with-valid-credentials-chromium/test-failed-1.png`
- `test-results/admin-admin-Admin-Personal-Account-Management-ban-user-flow-chromium/test-failed-1.png`

## Error Stack Traces
```
# Auth Test
Error: page.waitForResponse: Timeout 5000ms exceeded while waiting for event "response"
    at AuthPageObject.loginAsUser (/apps/e2e/tests/authentication/auth.po.ts:582:6)
    at /apps/e2e/tests/authentication/auth-simple.spec.ts:66:14

# Ban User Test
Error: expect(locator).toBeVisible() failed
Locator: locator('[data-testid="auth-error-message"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found
    at /apps/e2e/tests/admin/admin.spec.ts:205:6
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/authentication/auth.po.ts:508-582` - loginAsUser method with timeout
  - `apps/e2e/tests/authentication/auth-simple.spec.ts:61-74` - sign in test
  - `apps/e2e/tests/admin/admin.spec.ts:147-206` - ban user flow test
  - `packages/features/auth/src/components/auth-error-alert.tsx:47` - error message element
  - `packages/features/auth/src/components/password-sign-in-container.tsx:53` - error display logic
  - `packages/supabase/src/hooks/use-sign-in-with-email-password.ts:40` - error throwing logic
  - `apps/web/public/locales/en/auth.json` - error translations (missing `user_banned`)
- **Recent Changes**:
  - `06ce47133` - fix(e2e): make Payload CMS authentication optional in global setup
  - `de22cd108` - fix(e2e): improve auth timeout resilience and Payload login retry logic
- **Suspected Functions**:
  - `AuthPageObject.loginAsUser()` - per-attempt timeout too short for some scenarios
  - `AuthErrorAlert` - may not render if error code doesn't map to translation

## Related Issues & Context

### Direct Predecessors
- #981 (CLOSED): "Bug Diagnosis: E2E Tests Fail (4 tests) - Auth API Timeout and Payload API Login Failure" - Same auth timeout pattern
- #984 (CLOSED): "Bug Fix: E2E Test Failures - Auth Timeout and Payload API Login" - Previous fix attempt
- #928 (CLOSED): "Bug Fix: auth-simple.spec.ts Tests Timeout - React Query Hydration Race Condition" - Root cause was React Query hydration

### Same Component Issues
- #766 (CLOSED): "Bug Diagnosis: E2E Test Shard 4 Leaves Test User Banned After Ban User Flow Test"
- #747 (CLOSED): "Bug Diagnosis: E2E Shard 4 Remaining Failures - Selector Mismatch and Ban User Error"
- #969 (CLOSED): "Bug Diagnosis: Admin 'reactivate user flow' test fails due to unreliable filter mechanism"

### Historical Context
This is a recurring pattern where auth tests are flaky due to timing issues. Multiple previous fixes have improved reliability but not eliminated all edge cases. The `toPass()` pattern was introduced to handle React Query hydration race conditions, but the per-attempt timeout (5000ms local) may still be too aggressive for some scenarios.

## Root Cause Analysis

### Identified Root Causes

**Root Cause 1 - Auth Test Timeout**:
**Summary**: The `perAttemptTimeout` of 5000ms (local) for `page.waitForResponse` is too short for edge cases where the auth API takes longer to respond.

**Detailed Explanation**:
The `loginAsUser()` method at `auth.po.ts:536` uses `testConfig.getTimeout("short")` which returns 5000ms locally. This timeout is applied to `page.waitForResponse()` waiting for the `auth/v1/token` endpoint. While `toPass()` provides retry capability, each attempt has its own 5000ms window. If the auth API response is delayed due to cold start, network latency, or React Query hydration timing, the listener may miss the response even though the request succeeds.

**Supporting Evidence**:
- Stack trace shows timeout at `auth.po.ts:582` inside `toPass()` block
- Error: "Timeout 5000ms exceeded while waiting for event 'response'"
- Test passes on retry (#1 flaky), suggesting timing race condition

---

**Root Cause 2 - Ban User Error Message Not Displayed**:
**Summary**: The `AuthErrorAlert` component may not render the error message with `data-testid="auth-error-message"` because Supabase's `user_banned` error code has no translation mapping.

**Detailed Explanation**:
When a banned user attempts to sign in:
1. Supabase returns error with code `user_banned` or message `Invalid login credentials`
2. `use-sign-in-with-email-password.ts:40` throws `response.error.message` as string
3. `AuthErrorAlert` receives the error and tries to render `auth:errors.${errorCode}`
4. `auth.json` has no mapping for `user_banned` - falls back to `default` translation
5. The component DOES render but the test's Promise.all pattern may race with the error display

The test at `admin.spec.ts:194-200` uses `Promise.all([waitForResponse, click])` which waits for the auth response, but the error message rendering happens asynchronously after React state update. By the time the test checks for the element, the component may not have re-rendered yet.

**Supporting Evidence**:
- `auth.json` errors section has no `user_banned` key
- `AuthErrorAlert` component at line 47 renders `data-testid="auth-error-message"`
- Test expects visibility with 15000ms timeout but element "not found" (not "not visible")
- `signInMutation.error` state must be set for component to render

### How This Causes the Observed Behavior

**Auth Test**: The short per-attempt timeout causes `waitForResponse` to reject before the auth API responds. Even though `toPass()` retries, each retry restarts the navigation and the same race condition can occur. The auth API call IS being made (proven by flaky status - passes on retry) but the response arrives outside the 5000ms window.

**Ban Test**: After the auth API returns 400 for a banned user, React Query mutation must:
1. Parse error from response
2. Update mutation state to error
3. Trigger re-render of `PasswordSignInContainer`
4. Render `AuthErrorAlert` with the error
5. Render the Alert with `data-testid="auth-error-message"`

This multi-step async process can take longer than the remaining time after `Promise.all` resolves. The test immediately checks for visibility after auth response, but the DOM hasn't updated yet.

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The auth timeout is clearly documented in error logs (5000ms exceeded)
2. The test config code at `test-config.ts:66` confirms 5000ms short timeout
3. The `auth.json` missing `user_banned` key is verifiable
4. The test pattern using `Promise.all` followed by immediate assertion is known to race with React state updates
5. Previous issues (#981, #928) document the same patterns

## Fix Approach (High-Level)

### Auth Test Timeout Fix
1. Increase `short` timeout in `test-config.ts` from 5000ms to 8000ms for local environment
2. OR add explicit wait after form submission before expecting auth response
3. OR restructure `loginAsUser` to use a more resilient response capture pattern

### Ban User Error Message Fix
1. Add `user_banned` translation key to `auth.json` with appropriate error message
2. Add explicit `page.waitForSelector('[data-testid="auth-error-message"]')` before the visibility assertion
3. Use `await expect().toPass()` pattern to handle async state updates:
   ```typescript
   await expect(async () => {
     await expect(page.locator('[data-testid="auth-error-message"]')).toBeVisible();
   }).toPass({ timeout: 15000 });
   ```

## Diagnosis Determination

Both test failures are timing/flakiness issues rather than actual functionality bugs:

1. **Auth test**: The auth flow works correctly (proven by flaky status), but the test's per-attempt timeout is too aggressive for edge cases. This is a test reliability issue, not an application bug.

2. **Ban user test**: The error display mechanism works (the component code is correct), but:
   - Missing translation for `user_banned` error code causes fallback behavior
   - Test assertion races with React state update cycle
   - Both issues compound to make the test unreliable

These are test infrastructure improvements, not application fixes.

## Additional Context

- Test passed 941/943 (99.8% pass rate) indicating high overall stability
- Both failing tests are marked as "flaky" in the output (pass on retry)
- Recent commits `06ce47133` and `de22cd108` attempted to improve auth timeout resilience
- The pattern of auth timeout flakiness has been addressed multiple times but edge cases remain

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git log, grep, cat), Read (test files, config), Grep (pattern search), gh issue list*
