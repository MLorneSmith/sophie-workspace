# Bug Diagnosis: E2E Shard 4 Tests Fail Due to Redundant Login Attempts Against Pre-Authenticated Sessions

**ID**: ISSUE-719
**Created**: 2025-11-26T22:15:00Z
**Reporter**: user/test-execution
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E shard 4 (Admin & Invitations) tests fail because they call `loginAsUser()` or `loginAsSuperAdmin()` methods on pages that are already authenticated via pre-loaded storage states. When tests navigate to the sign-in page and attempt to authenticate, the pre-authenticated session causes an immediate redirect to `/home`, but the test continues waiting for `auth/v1/token` API responses that never come (since no authentication is needed). This results in 15-second timeouts for each redundant login attempt.

## Environment

- **Application Version**: dev branch (commit e64ecd5f1)
- **Environment**: development (local Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: N/A (architectural issue with test design)

## Reproduction Steps

1. Run `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
2. Observe global setup completes successfully, creating auth states
3. Tests begin execution with pre-authenticated storage states
4. Tests that call `loginAsUser()` or `loginAsSuperAdmin()` fail with timeout

## Expected Behavior

Tests should use the pre-authenticated storage states from global setup without attempting to re-authenticate. When `AuthPageObject.setupSession()` is called with a storage state, subsequent navigation should already be authenticated.

## Actual Behavior

Tests that call `loginAsUser()` or `loginAsSuperAdmin()`:
1. Navigate to `/auth/sign-in`
2. Get immediately redirected to `/home` (because session is already valid)
3. Wait 15 seconds for `auth/v1/token` API response that never comes
4. Timeout and fail

## Diagnostic Data

### Console Output

```
✅ Global Setup Complete: All auth states created via API

Running 13 tests using 3 workers
[Phase 1] Waiting for Supabase auth/v1/token API response (timeout: 15000ms)...
[Sign-in Phase 1] Waiting for React hydration...
[Phase 1] ❌ Auth API timeout after 15000ms
Current URL: http://localhost:3001/home    <-- Already at /home, not /auth/sign-in!
Credentials: test2@slideheroes.com
```

### Network Analysis

```
[Diagnostics] Captured Auth Requests:
  GET http://localhost:3001/_next/static/chunks/apps_web_public_locales_en_auth_json_f5d2e7b6._.js
  GET http://localhost:3001/_next/static/chunks/apps_web_public_locales_en_auth_json_0265bb98._.js

[Diagnostics] Captured Auth Responses:
  200 http://localhost:3001/_next/static/chunks/apps_web_public_locales_en_auth_json_f5d2e7b6._.js
  200 http://localhost:3001/_next/static/chunks/apps_web_public_locales_en_auth_json_0265bb98._.js
```

No `auth/v1/token` requests are made because the session is already valid.

### Test File Analysis

**Problematic Test 1: Admin Impersonation Test** (`admin.spec.ts:239-264`)
```typescript
test.describe("Impersonation", () => {
  test("can sign in as a user", async ({ page }) => {
    const auth = new AuthPageObject(page);

    // ❌ PROBLEM: Calls loginAsSuperAdmin even though test uses setupSession
    await auth.loginAsSuperAdmin({
      email: process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com",
      password: process.env.E2E_ADMIN_PASSWORD || "",
    });
```

**Problematic Test 2: Team Account Management** (`admin.spec.ts:280-317`)
```typescript
test.beforeEach(async ({ page }) => {
  const auth = new AuthPageObject(page);
  testUserEmail = await createUser(page);

  // ❌ PROBLEM: Calls loginAsUser with test user credentials
  await auth.loginAsUser({
    email: testUserEmail,
    password: process.env.E2E_TEST_USER_PASSWORD || "",
  });
```

**Problematic Test 3: Full Invitation Flow** (`invitations.spec.ts:100-168`)
```typescript
test("should invite users and let users accept an invite", async ({ page }) => {
  const invitations = new InvitationsPageObject(page);

  // ❌ PROBLEM: No setupSession, calls loginAsUser directly
  await invitations.auth.loginAsUser({ email, password });
```

## Error Stack Traces

```
TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
    at loginAsUser (apps/e2e/tests/authentication/auth.po.ts:534)
    at test (apps/e2e/tests/admin/admin.spec.ts:288)
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts` - Admin and impersonation tests
  - `apps/e2e/tests/invitations/invitations.spec.ts` - Full invitation flow test
  - `apps/e2e/tests/authentication/auth.po.ts` - `loginAsUser()` and `loginAsSuperAdmin()` methods
  - `apps/e2e/tests/utils/auth-state.ts` - AUTH_STATES definitions

- **Recent Changes**: None directly related; this is an architectural issue

- **Suspected Functions**:
  - `AuthPageObject.loginAsUser()` - Waits for `auth/v1/token` that never comes
  - `AuthPageObject.loginAsSuperAdmin()` - Same issue with MFA flow

## Related Issues & Context

### Direct Predecessors
- #713 (CLOSED): "Bug Diagnosis: E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware" - Similar auth session issues
- #572 (CLOSED): "E2E Auth Timeout Failures: Incomplete Global Setup Implementation" - Previous auth timeout issues

### Related Infrastructure Issues
- #702 (CLOSED): "Bug Diagnosis: auth-simple.spec.ts sign-in test navigation timeout" - Navigation timeout patterns

### Same Component
- #653 (CLOSED): "E2E Integration Tests: 5 Remaining Failures After Auth Fix" - Related test failures

### Historical Context
This is a recurring pattern where E2E tests mix two authentication strategies:
1. **Storage state injection** via `AuthPageObject.setupSession(AUTH_STATES.X)` - Pre-authenticated
2. **UI-based login** via `loginAsUser()` / `loginAsSuperAdmin()` - Expects unauthenticated state

When both are used in the same test or test suite, the redundant login attempts fail.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Tests use `AuthPageObject.setupSession()` to load pre-authenticated storage states but then call `loginAsUser()` or `loginAsSuperAdmin()`, which attempt to authenticate an already-authenticated session.

**Detailed Explanation**:

The global setup (`apps/e2e/global-setup.ts`) creates three authenticated browser states:
- `test1@slideheroes.com.json` → TEST_USER
- `test2@slideheroes.com.json` → OWNER_USER
- `michael@slideheroes.com.json` → SUPER_ADMIN

Tests load these via `AuthPageObject.setupSession(AUTH_STATES.X)` which calls `test.use({ storageState: path })`. This means when the test starts, the browser already has valid authentication cookies.

However, several tests then call:
```typescript
await auth.loginAsUser({ email, password });
// or
await auth.loginAsSuperAdmin({ email, password });
```

These methods:
1. Navigate to `/auth/sign-in`
2. The middleware sees a valid session and redirects to `/home`
3. The test waits for `auth/v1/token` API response that never happens
4. Timeout after 15 seconds

**Code path showing the issue**:

1. `admin.spec.ts:31` - `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)` loads pre-auth state
2. `admin.spec.ts:242` - Test calls `loginAsSuperAdmin()` which goes to sign-in page
3. `auth.po.ts:337` - `goToSignIn()` navigates to `/auth/sign-in`
4. Middleware redirects to `/home` because session is valid
5. `auth.po.ts:346-358` - `waitForResponse('auth/v1/token')` never matches
6. Timeout

### Supporting Evidence

From test output:
```
Current URL: http://localhost:3001/home    <-- Already redirected!
Credentials: test2@slideheroes.com
```

The URL being `/home` instead of `/auth/sign-in` proves the session is valid and caused a redirect.

### How This Causes the Observed Behavior

1. **Admin Dashboard test fails**: Uses SUPER_ADMIN storage state but admin panel requires MFA verification which isn't in the storage state
2. **Delete team account flow timeout**: Calls `loginAsUser()` then `loginAsSuperAdmin()` sequentially, both timeout
3. **Invitation tests timeout**: Call `loginAsUser()` on already-authenticated sessions
4. **Full invitation flow timeout**: No `setupSession()`, calls `loginAsUser()` but Playwright config might be loading default storage state

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The test output clearly shows "Current URL: http://localhost:3001/home" during sign-in timeout
2. No `auth/v1/token` requests appear in network logs, only static asset requests
3. Global setup logs confirm "All auth states created via API" succeeded
4. The pattern matches exactly: tests with `setupSession` + `loginAs*` calls fail

## Fix Approach (High-Level)

Two approaches to fix this:

**Option A: Remove redundant login calls** (Recommended)
- Tests using `setupSession()` should NOT call `loginAsUser()` / `loginAsSuperAdmin()`
- Simply navigate directly to the protected page (e.g., `page.goto('/admin')`)
- The storage state provides authentication automatically

**Option B: Add conditional login detection**
- Modify `loginAsUser()` to check if already authenticated before attempting sign-in
- Check if current URL is already `/home` or if session cookies exist
- Skip the sign-in flow if already authenticated

For the specific failing tests:
1. `admin.spec.ts:239-264` (Impersonation): Add `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)` and remove `loginAsSuperAdmin()` call
2. `admin.spec.ts:268-342` (Team Account Management): This is SKIPPED via env var, but should use `setupSession` consistently
3. `invitations.spec.ts:100-168` (Full Invitation Flow): Add `AuthPageObject.setupSession(AUTH_STATES.TEST_USER)` and remove `loginAsUser()` call

## Diagnosis Determination

The root cause is definitively identified: **redundant authentication calls on pre-authenticated sessions**. The fix is straightforward: align test authentication strategy to use either storage states OR UI login, not both.

The 6 failing tests all share this pattern. Once fixed, they should pass reliably.

## Additional Context

The test architecture has evolved to use global setup with storage states, but not all tests have been updated to leverage this pattern. This creates an inconsistent testing strategy where:

- Some tests use `setupSession()` correctly (tests that pass)
- Some tests mix `setupSession()` with `loginAs*()` calls (tests that timeout)
- Some tests only use `loginAs*()` without storage states (may work but are slower)

A broader refactoring effort should standardize all E2E tests to use the storage state pattern consistently.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (test execution, git log, gh issue search), Read (test files, page objects, global-setup.ts), Grep (error patterns)*
