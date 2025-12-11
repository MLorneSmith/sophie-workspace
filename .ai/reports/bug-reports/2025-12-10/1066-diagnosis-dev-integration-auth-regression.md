# Bug Diagnosis: Dev Integration Tests Auth Session Regression After #1063 Fix

**ID**: ISSUE-[pending]
**Created**: 2025-12-10T19:30:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests.yml workflow fails with 2 test failures after the fix for #1062/#1063 was deployed. The fix introduced `getCookieDomainConfig()` which correctly handles Vercel preview URLs, but the underlying authentication session is still not being recognized by the deployed Vercel middleware. Tests navigate to `/home` but are redirected to `/auth/sign-in?next=/home`, indicating the server-side middleware does not recognize the injected Supabase session cookies.

## Environment

- **Application Version**: a61e0a9601af66b933659ad83bc41ae467ac4a0a
- **Environment**: dev (Vercel preview deployment)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Workflow Run**: 20110447103
- **Last Working**: 20105824526 (SHA: 331d6b48b2bb553e2ccad7c16369949e5e5192ca)

## Reproduction Steps

1. Push code to dev branch that triggers Deploy to Dev workflow
2. Wait for deployment to complete
3. Dev Integration Tests workflow triggers automatically
4. Observe 2 test failures in team-accounts tests
5. Tests redirect to `/auth/sign-in` instead of loading the authenticated dashboard

## Expected Behavior

- Tests should use pre-authenticated storage states from global setup
- Navigation to `/home` should succeed with authenticated session
- Team selector should be visible on the dashboard

## Actual Behavior

- Global setup successfully authenticates via Supabase API
- Session cookies are injected into browser context
- Storage state is saved correctly
- **But**: When tests navigate to `/home`, middleware redirects to `/auth/sign-in?next=/home`
- Sign-in page loads with Cloudflare Turnstile challenge
- Tests timeout waiting for `[data-testid="team-selector"]`

## Diagnostic Data

### Console Output

```
🔧 Global Setup: Creating authenticated browser states via API...
✅ All validations passed
🏥 Running server health checks...
  ✅ Supabase: Supabase healthy (26ms)
  ✅ Next.js: Next.js healthy (928ms)
⚠️  Payload is unhealthy - Payload auth will be skipped.
🌐 Using BASE_URL: https://2025slideheroes-kbwedv32i-slideheroes.vercel.app
🔗 Using Supabase Auth URL: [masked]
🍪 Using Supabase Cookie URL: [masked] (for cookie naming)
🔐 Authenticating test user via Supabase API...
✅ API authentication successful for test user
🍪 Cookie domain config: 2025slideheroes-kbwedv32i-slideheroes.vercel.app (isVercelPreview: true)
✅ Session injected into cookies and localStorage for test user
✅ test user auth state saved successfully
```

### Test Failure Trace

```
navigating to "https://2025slideheroes-kbwedv32i-slideheroes.vercel.app/home"
navigated to "https://2025slideheroes-kbwedv32i-slideheroes.vercel.app/auth/sign-in?next=/home"
navigated to "https://vercel.live/_next-live/feedback/feedback.html?..."
navigated to "https://challenges.cloudflare.com/.../turnstile/..."
```

### Performance Metrics

```
- 19 tests passed (vs 21 in last successful run)
- 6 tests skipped (same)
- 2 tests failed (vs 0 in last successful run)
- Total time: 2.8m
```

## Error Stack Traces

```
Error: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible

   at TeamAccountsPageObject.openAccountsSelector (apps/e2e/tests/team-accounts/team-accounts.po.ts:105:6)
   at TeamAccountsPageObject.createTeam (apps/e2e/tests/team-accounts/team-accounts.po.ts:125:14)
   at team-accounts.spec.ts:97:22
```

## Related Code

### Affected Files
- `apps/e2e/global-setup.ts` (getCookieDomainConfig function at lines 37-89)
- `apps/web/proxy.ts` (middleware auth validation at lines 226-290)
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` (lines 103, 120 - failing tests)
- `apps/e2e/tests/team-accounts/team-accounts.po.ts` (line 105 - timeout location)

### Recent Changes
- `f2d7bab0e` fix(e2e): resolve dev integration test auth session failures (INTRODUCED REGRESSION)
- Commit added `getCookieDomainConfig()` helper
- Changed cookie domain handling for Vercel preview URLs

### Suspected Functions
- `getCookieDomainConfig()` in global-setup.ts - may be setting incorrect cookie domain
- `createMiddlewareClient()` in proxy.ts - not finding session cookies
- The Supabase cookie name derivation (sb-{projectRef}-auth-token)

## Related Issues & Context

### Direct Predecessors
- #1062 (CLOSED): "Bug Diagnosis: Dev Integration Tests Fail - Authentication Session Not Persisted to Server" - Same issue, fix was attempted
- #1063 (CLOSED): "Bug Fix: Dev Integration Tests Fail - Authentication Session Not Persisted to Server" - The fix that introduced this regression

### Related Infrastructure Issues
- #649 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Supabase URL Mismatch" - Similar cookie naming issue
- #628 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Authentication State Not Persisting" - Same symptom

### Similar Symptoms
- #925 (CLOSED): "Bug Diagnosis: Auth Simple Test Fails Due to Pre-Authenticated Storage State"
- #927 (CLOSED): "Bug Diagnosis: auth-simple.spec.ts Tests Timeout - React Query Hydration Race Condition"

### Historical Context
This is a recurring issue pattern (6+ similar issues closed). The root cause is the complex interaction between:
1. Supabase SSR cookie naming (based on Supabase URL hostname)
2. Cookie domain settings (must match deployment URL)
3. Vercel preview deployment URLs (unique per deployment)
4. Middleware session validation

## Root Cause Analysis

### Identified Root Cause

**Summary**: Cookie naming mismatch between E2E setup and deployed Vercel middleware - the E2E setup uses `E2E_SUPABASE_URL` to derive the cookie name (e.g., `sb-{projectRef}-auth-token`), but this may not match what the deployed Vercel application expects when using `NEXT_PUBLIC_SUPABASE_URL`.

**Detailed Explanation**:

The global-setup.ts creates Supabase session cookies with names derived from the `supabaseCookieUrl`:
```typescript
// Line 353-364 in global-setup.ts
const supabaseAuthUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54521";
const supabaseCookieUrl =
    process.env.E2E_SERVER_SUPABASE_URL ||
    (process.env.CI === "true"
        ? supabaseAuthUrl  // In CI, uses E2E_SUPABASE_URL
        : "http://host.docker.internal:54521");
```

The cookie name is derived at line 619:
```typescript
const projectRef = new URL(supabaseCookieUrl).hostname.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;
```

For the production Supabase instance (e.g., `https://abcd1234.supabase.co`), this would create cookies named `sb-abcd1234-auth-token`. However, the E2E setup may be using a different Supabase URL that creates a different cookie name.

The deployed Vercel middleware uses `@kit/supabase/middleware-client` which reads cookies based on `NEXT_PUBLIC_SUPABASE_URL`. If these don't match, the middleware won't find the session cookies.

**Supporting Evidence**:
1. Global setup logs show "✅ Session injected into cookies" - cookies ARE being set
2. Middleware redirects to sign-in - cookies are NOT being recognized
3. Successful run (331d6b48b) didn't have the `getCookieDomainConfig()` changes
4. Failed run (a61e0a96) includes the #1063 fix with cookie domain changes
5. The workflow logs mask `E2E_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`, but they may be pointing to different Supabase instances or using different cookie naming

### How This Causes the Observed Behavior

1. Global setup authenticates user via Supabase API (works)
2. Session is set using `@supabase/ssr`'s `createServerClient` with `supabaseCookieUrl`
3. Cookies are named based on `supabaseCookieUrl` (e.g., `sb-xyz-auth-token`)
4. Storage state is saved with these cookies
5. Test starts and loads storage state
6. Test navigates to `/home`
7. Vercel middleware creates Supabase client using `NEXT_PUBLIC_SUPABASE_URL`
8. Middleware looks for cookies named based on `NEXT_PUBLIC_SUPABASE_URL` (e.g., `sb-abc-auth-token`)
9. **Cookie name mismatch** - middleware doesn't find session
10. Middleware redirects to `/auth/sign-in`

### Confidence Level

**Confidence**: Medium-High

**Reasoning**:
- The evidence strongly points to a cookie naming mismatch (proven pattern from 6+ similar issues)
- The #1063 fix changed cookie domain handling but may have introduced inconsistency
- The exact cookie names are masked in CI logs, so we can't verify directly
- The successful run vs failed run timing correlates with the #1063 fix deployment

## Fix Approach (High-Level)

1. **Ensure cookie name consistency**: The E2E global setup must use the SAME Supabase URL as the deployed application for cookie name derivation. This means:
   - `E2E_SUPABASE_URL` should equal `NEXT_PUBLIC_SUPABASE_URL` in CI
   - Or add explicit `E2E_SERVER_SUPABASE_URL` that overrides cookie naming to match deployment

2. **Enable DEBUG_E2E_AUTH in CI**: Add `DEBUG_E2E_AUTH: true` to the workflow environment to capture detailed cookie/session logs for verification

3. **Verify cookie names match**: Add logging to print the exact cookie name being used in both global-setup.ts and the deployed middleware

4. **Consider a single source of truth**: Instead of having multiple Supabase URL env vars, ensure the CI workflow passes the same URL to both the deployment and the E2E tests

## Diagnosis Determination

The root cause is a cookie naming mismatch where the E2E test setup creates Supabase session cookies with a name derived from `E2E_SUPABASE_URL`, while the deployed Vercel middleware looks for cookies based on `NEXT_PUBLIC_SUPABASE_URL`. The #1063 fix improved cookie domain handling but did not address the fundamental cookie name derivation issue.

The fix requires ensuring both the E2E setup and the deployed application use the EXACT same Supabase URL for cookie name derivation, or explicitly configuring the cookie name to bypass URL-based derivation.

## Additional Context

- The `getCookieDomainConfig()` function correctly handles the cookie DOMAIN for Vercel preview URLs
- The issue is with cookie NAME, not domain
- Debug logging (`DEBUG_E2E_AUTH`) is disabled in CI, preventing detailed session validation logs
- The successful run used code BEFORE the #1063 fix, suggesting the fix introduced a subtle change in cookie handling

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Read, Bash, Grep*
