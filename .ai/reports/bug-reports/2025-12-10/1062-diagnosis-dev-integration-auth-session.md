# Bug Diagnosis: Dev Integration Tests Fail - Authentication Session Not Persisted to Server

**ID**: ISSUE-pending
**Created**: 2025-12-10T18:50:00Z
**Reporter**: user (manual workflow investigation)
**Severity**: high
**Status**: new
**Type**: integration

## Summary

The dev-integration-tests.yml workflow fails because authenticated test users are being redirected to `/auth/sign-in` when accessing protected routes like `/home`. The global setup successfully creates authentication states and injects Supabase session cookies, but the deployed Vercel application does not recognize the session. This results in 4 test failures out of 27 tests (15 passed, 6 skipped).

## Environment

- **Application Version**: dev branch, commit 739b8fd8a
- **Environment**: CI (GitHub Actions) testing against Vercel Preview Deployment
- **Deployment URL**: https://2025slideheroes-g5y7nlbbg-slideheroes.vercel.app
- **Workflow Run**: 20109057743
- **Node Version**: 22.x
- **Supabase**: Production instance (ldebzombxtszzcgnylgq.supabase.co)
- **Last Working**: Unknown (intermittent)

## Reproduction Steps

1. Push code to dev branch
2. Deploy to Dev workflow triggers and completes successfully
3. Dev Integration Tests workflow triggers automatically
4. Global setup authenticates 4 users via Supabase API (all succeed)
5. Tests run with 3 workers in parallel
6. Tests navigate to protected routes (e.g., `/home`, `/home/settings`)
7. Some tests get redirected to `/auth/sign-in?next=/home`
8. Tests fail waiting for authenticated UI elements (e.g., `[data-testid="team-selector"]`)

## Expected Behavior

Tests should remain authenticated after global setup injects Supabase session cookies. Navigation to `/home` should show the authenticated dashboard with team selector visible.

## Actual Behavior

Some tests are redirected to sign-in page despite:
- Global setup successfully completing
- API authentication succeeding for all 4 users
- Session cookies being injected into storage state files
- 15 tests passing (indicating auth sometimes works)

Pattern observed:
- Initial tests may pass
- Later tests in parallel execution fail
- Retry attempts also fail

## Diagnostic Data

### Global Setup Logs (Successful)
```
🔧 Global Setup: Creating authenticated browser states via API...
✅ NODE_ENV: NODE_ENV is correctly set to 'test'
✅ Supabase: Supabase connection validated successfully
🌐 Using BASE_URL: https://2025slideheroes-g5y7nlbbg-slideheroes.vercel.app
🔗 Using Supabase Auth URL: [redacted]
🍪 Using Supabase Cookie URL: [redacted] (for cookie naming)
✅ API authentication successful for test user
✅ Session injected into cookies and localStorage for test user
✅ test user auth state saved successfully
✅ API authentication successful for owner user
✅ Session injected into cookies and localStorage for owner user
✅ owner user auth state saved successfully
✅ Global Setup Complete: All auth states created via API
```

### Test Execution Flow (Failing)
```
navigating to "https://2025slideheroes-g5y7nlbbg-slideheroes.vercel.app/home", waiting until "domcontentloaded"
navigated to "https://2025slideheroes-g5y7nlbbg-slideheroes.vercel.app/auth/sign-in?next=/home"
waiting for locator('[data-testid="team-selector"]') to be visible
<= page.waitForSelector failed +20s
```

### Test Results
```
Running 27 tests using 3 workers
6 skipped
15 passed (2.4m)
4 failed (exit code 1)
```

### Failed Tests
1. `account-simple.spec.ts:202` - settings page shows user email
2. `team-accounts.spec.ts:103` - user can update their team name (and slug)
3. `team-accounts.spec.ts:120` - cannot create a Team account using reserved names
4. `account-simple.spec.ts:22` - settings page loads successfully

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Supabase authentication session cookies are properly created in the browser's storage state, but the server-side middleware on Vercel does not recognize them consistently. This is likely due to a **cookie domain/path mismatch** or **session token not being validated correctly by the deployed server's Supabase middleware**.

**Detailed Explanation**:

The issue chain is:

1. **Global setup creates valid session**: The `global-setup.ts` authenticates users via Supabase API, gets valid JWT tokens, and injects them using `@supabase/ssr` library.

2. **Cookie injection succeeds locally**: The cookies are correctly added to the Playwright browser context and saved to `.auth/*.json` files.

3. **Server doesn't recognize session**: When tests navigate to protected routes, the Next.js middleware on Vercel calls Supabase to verify the session, but the session is not found or invalid from the server's perspective.

**Possible causes**:

**A. Cookie Name Mismatch (Less Likely After Fix)**
Previous issue #918 fixed the cookie URL logic for CI environments. The code now uses:
```typescript
const supabaseCookieUrl =
    process.env.E2E_SERVER_SUPABASE_URL ||
    (process.env.CI === "true"
        ? supabaseAuthUrl  // Uses same URL in CI
        : "http://host.docker.internal:54521");
```
This should generate correct cookie names like `sb-ldebzombxtszzcgnylgq-auth-token`.

**B. Cross-Origin Cookie Restrictions (Likely)**
The Vercel preview deployment URL (`https://2025slideheroes-g5y7nlbbg-slideheroes.vercel.app`) is different from production. Cookies set with `SameSite=Lax` may not be sent correctly on initial navigations, especially in parallel test workers.

**C. Session Token Expiration/Refresh Race (Likely)**
The global setup creates sessions at one point in time, but by the time parallel tests run, the tokens may need refresh. If the refresh token flow fails or races with parallel requests, sessions become invalid.

**D. Vercel Edge Middleware Caching (Possible)**
Vercel's Edge middleware may cache authentication state inconsistently across edge nodes, leading to some requests being recognized as authenticated and others not.

### Supporting Evidence

1. **15 tests pass**: Authentication DOES work for some tests, ruling out complete cookie misconfiguration.

2. **Pattern of failure**: Failures occur in parallel execution, suggesting a race condition or shared state issue.

3. **Redirect to sign-in**: The app clearly doesn't find a valid session - it's not a UI loading issue.

4. **Cookie domain matches**: Logs show cookies are being set on the correct Vercel deployment domain.

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- The root cause is in the authentication flow between E2E test setup and Vercel server
- Multiple factors could contribute (cookie handling, session refresh, parallel execution)
- Need server-side logs (Vercel runtime logs) to definitively determine which authentication check is failing
- The intermittent nature (15/27 pass) suggests race condition rather than configuration error

## Fix Approach (High-Level)

**Short-term (Workaround)**:
1. Run integration tests in serial mode instead of parallel (3 workers) to avoid session race conditions
2. Add session validation check in tests before proceeding to protected pages

**Medium-term (Investigation)**:
1. Enable DEBUG_E2E_AUTH in CI to get detailed cookie/session logging
2. Add Vercel runtime log collection to workflow to see server-side authentication failures
3. Verify cookie attributes (SameSite, Secure, Domain, Path) match what middleware expects

**Long-term (Fix)**:
1. Consider using Supabase's `auth.setSession()` on the server side rather than cookie injection
2. Add pre-flight session validation that refreshes tokens if needed
3. Implement per-test authentication instead of shared storage state for problematic tests

## Related Issues & Context

### Direct Predecessors
- #918 (CLOSED): "Bug Diagnosis: Dev Integration Tests Fail with host.docker.internal DNS Error" - Fixed CI cookie URL fallback
- #876 (CLOSED): "Bug Diagnosis: Playwright authentication fails due to Supabase cookie name mismatch" - Fixed local Docker scenario
- #714 (CLOSED): "Bug Fix: E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware" - Similar symptoms

### Related Infrastructure Issues
- #1051: Intermittent element visibility timeouts in CI (led to CI_TIMEOUTS implementation)
- #992: E2E Test Infrastructure Systemic Architecture Problems

### Historical Context
This appears to be a recurring issue pattern. Previous fixes addressed specific scenarios (local Docker, CI DNS), but the fundamental challenge of reliably passing authentication state from E2E setup to deployed Vercel server persists.

## Additional Context

### Vercel Runtime Logs
The user requested Vercel runtime logs but they were not available for past requests (only live streaming). The workflow should be enhanced to capture these logs during test execution.

### Configuration Review
- `playwright.config.ts` sets `storageState: ".auth/test1@slideheroes.com.json"` for all chromium tests
- `global-setup.ts` creates storage states with Supabase SSR-compatible cookie encoding
- Tests use `fullyParallel: true` with 3 workers in CI

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, gh run view --log, vercel ls, vercel logs, vercel inspect --logs, Read, Grep, Glob, gh issue list, gh issue view*
