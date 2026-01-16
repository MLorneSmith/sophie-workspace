# Bug Diagnosis: Team Accounts Integration Tests Fail in CI Due to Auth Cookie Domain Mismatch

**ID**: ISSUE-1494
**Created**: 2026-01-15T20:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The dev-integration-tests CI workflow fails because team-accounts tests navigate to `/home` but get redirected to `/auth/sign-in?next=/home`. This indicates the authenticated session cookies are not being sent with requests in the CI environment. Tests pass locally against localhost but fail in CI against Vercel preview deployments. The root cause is that auth cookies created during global-setup use browser-default domain handling which doesn't work correctly for Vercel preview URLs.

## Environment

- **Application Version**: dev branch (commit 43d2d5f77)
- **Environment**: CI (GitHub Actions) against Vercel preview deployment
- **Browser**: Chromium (Playwright)
- **Node Version**: v20.10.0 (CI), v22.16.0 (local)
- **Base URL**: `https://2025slideheroes-l0u5g23up-slideheroes.vercel.app` (CI)
- **Last Working**: Unknown - this appears to be an ongoing issue

## Reproduction Steps

1. Push to `dev` branch to trigger CI workflow
2. CI runs `dev-integration-tests.yml` workflow
3. Global setup creates auth states successfully
4. Team-accounts tests run with pre-authenticated storage state
5. Tests navigate to `/home`
6. Navigation redirects to `/auth/sign-in?next=/home` instead of showing authenticated home page
7. Tests timeout waiting for `[data-testid="team-selector"]` which only exists on authenticated pages

## Expected Behavior

Navigation to `/home` should load the authenticated home page with the team selector visible, using the pre-authenticated storage state from global setup.

## Actual Behavior

Navigation to `/home` redirects to `/auth/sign-in?next=/home`, indicating the authentication cookies are not being sent with the request or are not recognized by the server.

## Diagnostic Data

### Local Test Results (PASS)
```
pnpm --filter web-e2e test team-accounts.spec.ts

Running 6 tests using 4 workers
  4 skipped
  2 passed (18.9s)
```

### CI Test Results (FAIL)
```
  2 failed
    [chromium] › tests/team-accounts/team-accounts.spec.ts:112:6 › Team Accounts @team @integration › user can update their team name (and slug)
    [chromium] › tests/team-accounts/team-accounts.spec.ts:129:6 › Team Accounts @team @integration › cannot create a Team account using reserved names
  19 passed (6.8m)
```

### CI Navigation Logs
```
navigating to "https://2025slideheroes-l0u5g23up-slideheroes.vercel.app/home", waiting until "domcontentloaded"
navigated to "https://2025slideheroes-l0u5g23up-slideheroes.vercel.app/auth/sign-in?next=/home"
waiting for locator('[data-testid="team-selector"]') to be visible
<= page.waitForSelector failed +20s
```

### Cookie Domain Configuration in CI
```
🍪 Cookie domain config: (browser default) (isVercelPreview: true)
[DEBUG_E2E_AUTH:global-setup:cookies:setting] {
  "user": "test user",
  "totalCookies": 1,
  "domainStrategy": "browser default (Vercel preview)",
  "cookies": [
    {
      "name": "sb-ldebzombxtszzcgnylgq-auth-token",
      "domain": "(browser default)",
      "path": "(derived from url)",
      "secure": true
    }
  ]
}
```

### Cookie Domain Configuration Locally
```
🍪 Cookie domain config: localhost (isVercelPreview: false)
   🍪 sb-host-auth-token:
      Domain: localhost
      SameSite: Lax
      Secure: false
      HttpOnly: false
```

## Error Stack Traces

```
Error: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible

    at waitForHydration (apps/e2e/tests/utils/wait-for-hydration.ts:114:13)
    at TeamAccountsPageObject.openAccountsSelector (apps/e2e/tests/team-accounts/team-accounts.po.ts:92:4)
    at TeamAccountsPageObject.createTeam (apps/e2e/tests/team-accounts/team-accounts.po.ts:125:3)
    at apps/e2e/tests/team-accounts/team-accounts.spec.ts:106:22
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Tests that fail
  - `apps/e2e/tests/team-accounts/team-accounts.po.ts` - Page object with `openAccountsSelector()`
  - `apps/e2e/global-setup.ts` - Creates auth states with cookie domain logic
  - `apps/e2e/tests/utils/base-test.ts` - Contains `restoreAuthStorageState()` helper
- **Recent Changes**: Added `restoreAuthStorageState()` helper in commit 43d2d5f77
- **Suspected Functions**: Cookie domain configuration in `global-setup.ts`

## Related Issues & Context

### Direct Predecessors
- #1492 (closed): "Bug Diagnosis: Team Accounts Integration Tests Fail on Retry Due to Auth Session Loss" - Previous diagnosis that led to `restoreAuthStorageState` fix
- #1493 (closed): "Bug Fix: Team Accounts Integration Tests Fail on Retry Due to Auth Session Loss" - The fix that was just implemented

### Related Infrastructure Issues
- #1051: "CI flakiness due to Vercel cold starts" - Added `navigateAndWaitForHydration` pattern
- #1082: "Team accounts auth redirect" - Similar auth redirect issues

### Same Component
Multiple previous issues with team-accounts tests timing out waiting for `[data-testid="team-selector"]`

### Historical Context
This appears to be a persistent issue with auth session handling in CI environments. The recent fix (#1493) addressed retry scenarios locally but didn't fix the CI-specific cookie domain issue.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Auth cookies created during global-setup use `domain: (browser default)` for Vercel preview URLs, which causes cookies to not be sent with subsequent requests to the same domain.

**Detailed Explanation**:
When running in CI against Vercel preview deployments:
1. Global setup creates auth cookies with `domain: (browser default)` (no explicit domain set)
2. Browser interprets this differently for preview URLs like `2025slideheroes-l0u5g23up-slideheroes.vercel.app`
3. When tests navigate to `/home`, the cookies are not attached to the request
4. Server sees an unauthenticated request and redirects to `/auth/sign-in`

Locally, cookies use `domain: localhost` explicitly, which works correctly.

The key evidence is the cookie configuration difference:
- **CI**: `"domain": "(browser default)"` with `isVercelPreview: true`
- **Local**: `Domain: localhost` with `isVercelPreview: false`

**Supporting Evidence**:
- CI logs show: `navigated to ".../auth/sign-in?next=/home"` (redirect indicates no auth)
- Local tests pass with 2/2 tests succeeding
- Cookie debug logs show different domain strategies between local and CI
- 19 other tests pass in CI (tests that don't rely on team-selector, or use manual login)

### How This Causes the Observed Behavior

1. Global setup runs and creates auth state files with cookies
2. Cookies are set without explicit domain (browser default) for Vercel preview URLs
3. Test starts, loads storage state file into browser context
4. Test navigates to `/home` via `navigateAndWaitForHydration`
5. Browser doesn't attach cookies to request (domain mismatch)
6. Server returns 302 redirect to `/auth/sign-in?next=/home`
7. Test lands on sign-in page, not home page
8. Test waits for `[data-testid="team-selector"]` which doesn't exist on sign-in page
9. Test times out after 20 seconds

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear evidence of cookie domain difference between local and CI
- Tests pass locally, fail only in CI
- Redirect to sign-in page directly indicates missing/invalid auth cookies
- Other tests that use manual login (not storage state) pass in CI

## Fix Approach (High-Level)

Modify the cookie domain configuration in `global-setup.ts` to explicitly set the domain for Vercel preview URLs. When `isVercelPreview: true`, extract the hostname from the URL and set it as the explicit cookie domain instead of relying on browser defaults.

Example fix in global-setup.ts:
```typescript
// Instead of: domain: undefined (browser default)
// Use: domain: new URL(baseURL).hostname
const hostname = new URL(baseURL).hostname;
cookies.forEach(cookie => {
  cookie.domain = hostname;
});
```

## Diagnosis Determination

The issue is definitively identified as a **cookie domain mismatch in CI environments**. The `restoreAuthStorageState` fix from #1493 does not address this issue because it only re-adds cookies that are already in the context - it doesn't fix the underlying domain configuration issue.

The fix requires updating the cookie creation logic in `global-setup.ts` to explicitly set domains for Vercel preview URLs.

## Additional Context

- The issue only affects tests that use pre-authenticated storage state AND navigate to pages that require auth
- Tests using manual `loginAsUser()` calls work because they create new cookies with correct domain
- The `account-simple.spec.ts` tests pass because they navigate to `/home/settings` which may have different auth handling

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs), grep (code search), file reads, local test execution*
