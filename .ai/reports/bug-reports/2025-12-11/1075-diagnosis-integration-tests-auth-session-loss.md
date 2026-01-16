# Bug Diagnosis: Dev Integration Tests Auth Session Lost During Parallel Test Execution

**ID**: ISSUE-pending
**Created**: 2025-12-11T00:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests.yml workflow (run ID: 20111835119) failed with 2 test failures on 2025-12-10. Tests initially authenticate successfully and navigate to protected pages (`/home/settings`), but after ~20 seconds of parallel test execution, subsequent navigation attempts are redirected to `/auth/sign-in?next=/home/settings`. This occurs despite the fix in #1067 being present in the tested commit.

## Environment

- **Application Version**: commit f04b7454a65d356fb0c1c8af2f07b37a44d183c2
- **Environment**: CI (GitHub Actions) against Vercel preview deployment
- **Browser**: Chromium (Playwright)
- **Node Version**: Not specified in logs
- **Database**: Supabase hosted (ldebzombxtszzcgnylgq project)
- **Last Working**: 2025-12-10T16:29:06Z (run 20105824526)

## Reproduction Steps

1. Push to dev branch triggering dev-integration-tests workflow
2. Global setup authenticates 4 users via Supabase API
3. Auth cookies are injected into browser context with correct cookie name (`sb-ldebzombxtszzcgnylgq-auth-token`)
4. Tests start running in parallel (CI_WORKERS=1, but 21 tests with retries)
5. Initial navigations to `/home/settings` succeed (visible in logs at 20:12:08-20:12:19)
6. After ~20 seconds, navigations to `/home/settings` redirect to `/auth/sign-in?next=/home/settings`
7. Tests fail waiting for `team-selector` element which doesn't exist on sign-in page

## Expected Behavior

All 21 integration tests should complete successfully with authenticated sessions persisted throughout the test run.

## Actual Behavior

Tests initially work with authenticated sessions, but auth is lost mid-test causing:
- `Locator: locator('[data-testid="team-selector"]')` timeout errors
- Navigation to protected routes redirects to sign-in page
- 2 test failures out of 21 tests

## Diagnostic Data

### Console Output
```
[DEBUG_E2E_AUTH:global-setup:session:created] {
  "projectRef": "ldebzombxtszzcgnylgq",
  "cookieName": "sb-ldebzombxtszzcgnylgq-auth-token",
  "cookiesCreated": 1
}
✅ Session injected into cookies and localStorage for test user
✅ test user auth state saved successfully
```

### Navigation Flow Analysis
```
20:12:08 - browser.newContext succeeded
20:12:08 - navigating to "/home/settings"
20:12:09 - navigated to "/home/settings" (SUCCESS)
20:12:09 - navigated to "vercel.live/_next-live/feedback/feedback.html" (iframe)
...
20:12:30 - navigating to "/home/settings"
20:12:30 - navigated to "/auth/sign-in?next=/home/settings" (FAILURE - redirected)
```

### Cookie Configuration
```json
{
  "cookieName": "sb-ldebzombxtszzcgnylgq-auth-token",
  "domain": "2025slideheroes-r4zjb7ogv-slideheroes.vercel.app",
  "sameSite": "Lax",
  "secure": true,
  "httpOnly": false
}
```

### Network Analysis
- Vercel protection bypass header configured correctly
- Multiple successful requests to `/home/settings` before failure
- Vercel Live iframe loading on each page (`vercel.live/_next-live/feedback/feedback.html`)

### Database Analysis
- Health check passes (`Database=true`)
- Supabase API authentication succeeds
- Session tokens generated successfully

### Performance Metrics
- Global setup completes in ~15 seconds
- Initial page loads: 200-500ms
- Time to auth failure: ~20 seconds into test execution

### Screenshots
Not captured (failure occurred on retry)

## Error Stack Traces
```
Error: Timed out 30000ms waiting for expect(locator).toBeVisible()
Locator: locator('[data-testid="team-selector"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - waiting for locator('[data-testid="team-selector"]')
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts`
  - `apps/e2e/tests/team-accounts/team-accounts.po.ts`
  - `apps/e2e/global-setup.ts`
  - `.github/workflows/dev-integration-tests.yml`
- **Recent Changes**:
  - 8e48a2860 fix(e2e): unify Supabase URLs to fix auth session cookie mismatch
  - f04b7454a feat(course): add lesson image field to course lessons
- **Suspected Functions**:
  - `openAccountsSelector()` in team-accounts.po.ts
  - Session refresh/validation in Supabase middleware

## Related Issues & Context

### Direct Predecessors
- #1067 (CLOSED): "Bug Fix: Dev Integration Tests Auth Session Regression After #1063 Fix" - Same auth session issue, supposedly fixed
- #1066 (CLOSED): "Bug Diagnosis: Dev Integration Tests Auth Session Regression After #1063 Fix" - Previous diagnosis

### Infrastructure Issues
- #1063 (CLOSED): "Bug Fix: Dev Integration Tests Fail - Authentication Session Not Persisted to Server" - Cookie domain fix
- #1062 (CLOSED): "Bug Diagnosis: Dev Integration Tests Fail - Authentication Session Not Persisted to Server"

### Similar Symptoms
- #926 (CLOSED): "Bug Fix: Auth Storage State Test Configuration"
- #628 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Authentication State Not Persisting"

### Same Component
- #1051 (referenced): Issue addressing CI flakiness with hydration waits

### Historical Context
This is the 4th recurrence of auth session issues in dev-integration-tests since November. Previous fixes addressed:
1. Cookie name mismatch (#1062/#1063)
2. Cookie domain for Vercel preview (#1066/#1067)

This instance shows a new failure mode: auth works initially but fails after ~20 seconds of parallel test execution.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Session cookies are being invalidated or not sent correctly after multiple parallel page navigations, likely due to Supabase token refresh race conditions or Vercel Live iframe interference.

**Detailed Explanation**:
The fix in #1067 correctly unified cookie names between E2E setup and deployed middleware. However, the logs show:

1. Auth cookies are created and saved correctly during global setup
2. Initial navigations to `/home/settings` succeed (20+ successful navigations)
3. After ~20 seconds, a navigation suddenly redirects to `/auth/sign-in`
4. Every navigation contains a Vercel Live feedback iframe load (`vercel.live/_next-live/feedback/feedback.html`)

The most likely causes (in order of probability):

1. **Supabase Token Refresh Race Condition**: When multiple browser contexts (from parallel tests) attempt to refresh the access token simultaneously, they may invalidate each other's sessions. The Supabase middleware refreshes tokens that are close to expiration, and parallel refreshes can cause one to succeed while others get an invalid refresh token.

2. **Cookie Domain/SameSite Conflict**: The Vercel Live iframe loads from a different origin (`vercel.live`). If cookies are being modified or stripped during cross-origin requests, the session cookie might not be sent correctly.

3. **Storage State Staleness**: The saved storage state from global setup might have tokens close to expiration. After 20 seconds of test execution, the tokens could expire naturally.

**Supporting Evidence**:
- Log shows successful `/home/settings` navigations from 20:12:08 to 20:12:19
- Log shows redirect to `/auth/sign-in` at 20:12:30 (22 seconds later)
- Global setup creates tokens with `cookieExpires: 1765401112` (Unix timestamp) which is ~1 hour from creation
- CI workers set to 1, but 21 tests run sequentially creating multiple browser contexts
- Vercel Live iframe appears in every page load

### How This Causes the Observed Behavior

1. Global setup authenticates user and saves storage state with cookies
2. Tests start, each creating a new browser context from storage state
3. Multiple contexts share the same Supabase session (access + refresh tokens)
4. After ~20 seconds, something triggers auth invalidation:
   - Token refresh attempt fails due to race condition
   - Cross-origin request strips cookies
   - Middleware rejects seemingly-valid token
5. Subsequent navigations to protected routes redirect to sign-in

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- The timing correlation (20 seconds) suggests a systematic issue rather than random failure
- Previous fixes addressed static configuration issues; this appears to be a runtime/state management issue
- Cannot fully confirm without additional server-side logging or token inspection
- Vercel Live iframe is a potential confounding factor that wasn't present in local testing

## Fix Approach (High-Level)

Multiple approaches to investigate and fix:

1. **Disable Vercel Live iframe for E2E tests**: Add `?vercel-live=false` to test URLs or configure Vercel deployment to disable Live for automation bypass requests

2. **Add session refresh handling in E2E tests**: Implement explicit token refresh between tests or add middleware to detect and handle parallel refresh attempts

3. **Increase token lifetime for E2E tests**: Configure Supabase to issue longer-lived tokens for E2E test users, reducing the chance of refresh during tests

4. **Isolate browser contexts better**: Ensure each test gets a completely fresh session rather than sharing from storage state

5. **Add server-side logging**: Enable detailed middleware logging to capture exactly when/why the session is being rejected

## Diagnosis Determination

Root cause is **partially identified**: Auth session is lost mid-test after ~20 seconds. The exact trigger is one of:
- Supabase token refresh race condition (most likely)
- Vercel Live iframe interference
- Storage state token expiration

Additional investigation needed:
- Enable Supabase middleware debug logging
- Disable Vercel Live and re-run tests
- Monitor token refresh network requests during test execution

## Additional Context

- Workflow run ID: 20111835119
- Commit tested: f04b7454a65d356fb0c1c8af2f07b37a44d183c2
- Previous successful run: 20105824526 (4 hours earlier)
- CI configuration: 1 worker, 21 tests, 30-minute timeout

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh issue list, git log, file reads (global-setup.ts, team-accounts.spec.ts, etc.)*
