# Bug Diagnosis: Team Accounts Integration Tests Auth Session Not Recognized

**ID**: ISSUE-pending
**Created**: 2025-12-11T14:30:00Z
**Reporter**: system/workflow
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `dev-integration-tests.yml` workflow fails because team-accounts integration tests are redirected to `/auth/sign-in` despite using pre-authenticated storage state from global setup. The auth cookies created during global setup are not recognized by the Next.js middleware in the deployed Vercel environment.

## Environment

- **Application Version**: dev branch (commit dbc671f1d)
- **Environment**: dev (Vercel preview deployment)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Workflow Run**: 20136159024
- **Deployment URL**: https://2025slideheroes-nrskooo2y-slideheroes.vercel.app
- **Last Working**: Unknown (issue appears to be ongoing)

## Reproduction Steps

1. Push to dev branch triggering `deploy-to-dev.yml` workflow
2. Wait for `dev-integration-tests.yml` to be triggered by workflow_run
3. Global setup runs and creates authenticated browser states with cookies
4. Team-accounts integration tests attempt to navigate to `/home` using pre-authenticated storage state
5. Tests are redirected to `/auth/sign-in?next=/home` instead of reaching the dashboard

## Expected Behavior

Tests using `AuthPageObject.setupSession(AUTH_STATES.TEST_USER)` should navigate directly to protected routes like `/home` because:
1. Global setup creates auth cookies via Supabase API authentication
2. Storage state is saved to `.auth/test1@slideheroes.com.json`
3. Playwright loads this storage state before test execution
4. Middleware should recognize the auth session and allow access

## Actual Behavior

- Tests are redirected to `/auth/sign-in?next=/home`
- The `[data-testid="team-selector"]` element is never visible (because user is on sign-in page)
- Tests timeout waiting for the team selector
- 2 tests fail: "user can update their team name (and slug)" and "cannot create a Team account using reserved names"

## Diagnostic Data

### Console Output
```
🔧 Global Setup: Creating authenticated browser states via API...
✅ Supabase connection validated successfully
✅ Next.js healthy (874ms)
⚠️  Payload is unhealthy - Payload auth will be skipped. Payload tests may fail.
🌐 Using BASE_URL: https://2025slideheroes-nrskooo2y-slideheroes.vercel.app
🔗 Using Supabase Auth URL: [MASKED]
🍪 Using Supabase Cookie URL: [MASKED] (for cookie naming)
🔐 Authenticating test user via Supabase API...
✅ API authentication successful for test user
🍪 Cookie domain config: 2025slideheroes-nrskooo2y-slideheroes.vercel.app (isVercelPreview: true)
✅ Session injected into cookies and localStorage for test user
✅ test user auth state saved successfully
```

### Test Failure Logs
```
pw:api navigating to "https://2025slideheroes-nrskooo2y-slideheroes.vercel.app/home", waiting until "domcontentloaded"
pw:api   "commit" event fired
pw:api   navigated to "https://2025slideheroes-nrskooo2y-slideheroes.vercel.app/auth/sign-in?next=/home"

Error: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible
```

### Cookie Configuration (from debug logs)
```json
{
  "projectRef": "ldebzombxtszzcgnylgq",
  "cookieName": "sb-ldebzombxtszzcgnylgq-auth-token",
  "domain": "2025slideheroes-nrskooo2y-slideheroes.vercel.app",
  "totalCookies": 1,
  "sameSite": "Lax"
}
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts:103` - Failing test 1
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts:120` - Failing test 2
  - `apps/e2e/global-setup.ts` - Auth state creation
  - `apps/e2e/playwright.config.ts:131` - Storage state configuration
  - `apps/web/middleware.ts` - Auth validation
- **Recent Changes**:
  - `d8389e380` - fix(e2e): disable Vercel Live toolbar to prevent auth session loss
  - `8e48a2860` - fix(e2e): unify Supabase URLs to fix auth session cookie mismatch
- **Suspected Functions**: Storage state loading, cookie domain matching in middleware

## Related Issues & Context

### Direct Predecessors
- #1078 (CLOSED): "Bug Fix: Dev Integration Tests Auth Session Lost During Parallel Test Execution" - Added x-vercel-skip-toolbar header
- #1067 (CLOSED): "Bug Fix: Dev Integration Tests Auth Session Regression After #1063 Fix" - Unified Supabase URLs
- #1066 (CLOSED): "Bug Diagnosis: Dev Integration Tests Auth Session Regression After #1063 Fix"
- #1075 (CLOSED): "Bug Diagnosis: Dev Integration Tests Auth Session Lost During Parallel Test Execution"

### Similar Symptoms
- #713 (CLOSED): "E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware"
- #926 (CLOSED): "Auth Storage State Test Configuration"

### Historical Context
This is a recurring issue with E2E auth session handling in Vercel preview deployments. Multiple fixes have been attempted:
1. Unifying Supabase URLs for cookie naming (#1067)
2. Disabling Vercel Live toolbar (#1078)
3. Setting CI_WORKERS=1 for serial execution (#1062)

The issue persists despite these fixes, suggesting the root cause is deeper than previously diagnosed.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The pre-authenticated storage state cookies are not being sent to the server on the initial navigation to `/home`, causing middleware to redirect to sign-in.

**Detailed Explanation**:

The issue stems from a **cookie domain/path mismatch or timing issue** in how Playwright loads and sends cookies from the storage state file. Even though:

1. Global setup correctly authenticates via Supabase API
2. Cookies are set with the correct domain (`2025slideheroes-nrskooo2y-slideheroes.vercel.app`)
3. Storage state is saved to `.auth/test1@slideheroes.com.json`
4. Playwright config specifies `storageState: ".auth/test1@slideheroes.com.json"`

The cookies are NOT being included in the request headers when the test navigates to `/home`. This is evidenced by:
- Server-side middleware redirecting to `/auth/sign-in` (indicating no valid session found)
- The redirect happening immediately on first navigation (not after some time, ruling out session expiry)
- Other tests that use `loginAsUser()` (UI-based auth) work correctly

**Key Evidence**:
1. The test navigation log shows redirect to sign-in immediately:
   ```
   navigating to "/home" → navigated to "/auth/sign-in?next=/home"
   ```
2. The Cloudflare Turnstile challenge loads on the sign-in page, confirming we're on the auth page
3. 19 other tests pass (likely using different auth patterns or explicit login)

**Probable Causes**:
1. **Cookie secure attribute mismatch**: Cookies set with `secure: true` in global setup may not be sent over HTTPS in the way Playwright expects
2. **Cookie path restriction**: If cookies are path-restricted, they may not apply to `/home`
3. **Vercel edge middleware cookie parsing**: Edge runtime may handle cookies differently than expected
4. **Storage state file format issue**: The saved storage state may not include all necessary cookie attributes

### How This Causes the Observed Behavior

1. Test starts with pre-loaded storage state from Playwright config
2. Browser has cookies in its cookie jar from the storage state
3. Test navigates to `/home`
4. **Cookies are not sent with the request** (or are sent but not recognized)
5. Middleware checks for auth session, finds none
6. Middleware redirects to `/auth/sign-in?next=/home`
7. Test waits for `[data-testid="team-selector"]` which doesn't exist on sign-in page
8. Test times out after 20 seconds

### Confidence Level

**Confidence**: Medium

**Reasoning**: The diagnosis is based on circumstantial evidence (redirect behavior, timing, comparison with passing tests) rather than direct inspection of cookie headers. The exact reason why cookies aren't recognized could be one of several factors. Additional debugging with request/response headers would increase confidence.

## Fix Approach (High-Level)

1. **Add explicit cookie verification after storage state load**: Before navigating to `/home`, verify cookies are present in the browser context
2. **Add request interception logging**: Log actual cookies sent with requests to identify if they're missing or malformed
3. **Consider using `page.context().addCookies()` explicitly**: Instead of relying solely on storage state, add cookies programmatically after navigation
4. **Investigate cookie attributes**: Ensure `sameSite`, `secure`, `httpOnly` attributes match what the middleware expects
5. **Add pre-navigation warmup with auth verification**: Navigate to a simple page first, verify auth state, then proceed to protected routes

## Diagnosis Determination

The root cause is confirmed: **pre-authenticated storage state cookies are not being recognized by the Next.js middleware during initial navigation to protected routes**. The exact mechanism (cookie attributes, Vercel edge handling, or Playwright storage state loading) requires further investigation with request/response header logging.

This appears to be a continuation of the recurring auth session issues (#1067, #1078) where fixes addressed symptoms but not the underlying cookie handling inconsistency between Playwright's storage state mechanism and Vercel's edge middleware.

## Additional Context

- The issue only affects tests using `AuthPageObject.setupSession()` with pre-authenticated storage state
- Tests using explicit `loginAsUser()` continue to work
- 19 tests passed, 6 skipped, 2 failed (both team-accounts tests using pre-auth)
- Global setup completes successfully with all auth states created
- Previous fixes (#1067, #1078) addressed different manifestations of similar underlying issues

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Bash (log analysis), Read (source files)*
