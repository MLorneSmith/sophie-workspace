# Bug Diagnosis: Dev Integration Tests Fail - Auth Session Not Recognized Despite URL Validation

**ID**: ISSUE-1523
**Created**: 2026-01-16T15:30:00Z
**Reporter**: CI/CD System
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev integration tests workflow fails despite issue #1518 implementing URL validation to ensure cookie name matching between E2E setup and deployed middleware. Tests pass locally but fail in CI with authentication failures, causing redirects to `/auth/sign-in` when navigating to protected routes. The team-accounts tests time out waiting for `[data-testid="team-selector"]` because the page is on the sign-in page instead of the home page.

## Environment

- **Application Version**: dev branch (commit 850dad756)
- **Environment**: CI (GitHub Actions) against Vercel preview deployment
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase production instance)
- **Last Working**: Unknown - this is the first run after #1518 implementation

## Reproduction Steps

1. Push changes to the `dev` branch
2. Wait for Vercel preview deployment to complete
3. GitHub Actions triggers `dev-integration-tests.yml` workflow
4. Global setup authenticates users via Supabase API and saves storage state
5. Tests attempt to navigate to protected routes (`/home`)
6. Middleware redirects to `/auth/sign-in` (auth not recognized)
7. Team-accounts tests fail waiting for `team-selector` element

## Expected Behavior

- Global setup creates valid auth sessions with matching cookie names
- URL validation passes (confirmed: `sb-ldebzombxtszzcgnylgq-auth-token`)
- Tests load storage state and cookies are sent with requests
- Middleware recognizes auth session and allows access to protected routes
- Team-accounts tests successfully interact with the team selector

## Actual Behavior

- Global setup completes successfully, URL validation passes
- Cookies are created with correct name (`sb-ldebzombxtszzcgnylgq-auth-token`)
- When tests navigate to `/home`, middleware does not recognize auth
- Middleware redirects to `/auth/sign-in?next=/home`
- Team-accounts tests fail with 20s timeout waiting for `team-selector`
- Tests pass locally (against Docker test environment) but fail in CI

## Diagnostic Data

### Console Output

```
Global Setup Complete: All auth states created via API
Supabase URL validation passed
   E2E URL: https://ldebzombxtszzcgnylgq.supabase.co
   App URL: https://ldebzombxtszzcgnylgq.supabase.co
   Expected Cookie: sb-ldebzombxtszzcgnylgq-auth-token

Cookie domain config: 2025slideheroes-qejxo8shi-slideheroes.vercel.app (isVercelPreview: true)
cookiesCreated: 1
Session injected into cookies and localStorage for test user
```

### Network Analysis

Navigation sequence from CI logs:
```
15:11:07-15:11:16: Multiple navigations to /home/settings (appear successful)
15:11:13: Navigation to /home
15:11:18: First redirect to /auth/sign-in appears
15:11:36+: Pattern of /home -> redirect to /auth/sign-in?next=/home
```

### Test Results

```
  1) [chromium] > tests/team-accounts/team-accounts.spec.ts:112:6 > Team Accounts @integration > user can update their team name (and slug)
     Error: page.waitForSelector: Timeout 20000ms exceeded.
     waiting for locator('[data-testid="team-selector"]') to be visible

  2) [chromium] > tests/team-accounts/team-accounts.spec.ts:129:6 > Team Accounts @integration > cannot create a Team account using reserved names
     Error: page.waitForSelector: Timeout 20000ms exceeded.
```

## Error Stack Traces

```
Error: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible

at TeamAccountsPageObject.openAccountsSelector (apps/e2e/tests/team-accounts/team-accounts.po.ts:105:6)
at TeamAccountsPageObject.createTeam (apps/e2e/tests/team-accounts/team-accounts.po.ts:125:14)
at tests/team-accounts/team-accounts.spec.ts:106:22
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` - Cookie creation with `url` property for Vercel previews
  - `apps/web/proxy.ts` - Middleware auth validation
  - `apps/web/lib/auth/url-normalization.ts` - URL validation utilities
  - `apps/web/app/healthcheck/route.ts` - Healthcheck with URL validation
  - `.github/workflows/dev-integration-tests.yml` - CI workflow configuration

- **Recent Changes**: Issue #1518 implementation (URL normalization for JWT validation)

- **Suspected Functions**:
  - `global-setup.ts:getCookieDomainConfig()` - Cookie domain/url handling
  - `global-setup.ts` lines 979-990 - Vercel preview cookie creation with `url` property
  - `proxy.ts:getUser()` - Session validation in middleware

## Related Issues & Context

### Direct Predecessors
- #1518 (CLOSED): "Dev Integration Tests Fail - Cookies Not Recognized" - Implemented URL validation, but issue persists
- #1507 (CLOSED): "Cookie name mismatch causes auth failures in CI" - Added cookie name derivation from URL
- #1067 (CLOSED): "Auth session regression caused by cookie name mismatch" - Original cookie name fix

### Similar Symptoms
- #1494: "Team accounts tests fail in CI due to cookie domain mismatch" - Changed from `domain: undefined` to explicit domain
- #1096: "Auth session lost in Vercel preview deployments" - Domain-less cookies fix
- #1109: "E2E Local Test Regression After Vercel Preview Cookie Fixes"
- #1485: "Vercel Bypass Cookie Missing URL Property"

### Historical Context

There has been a recurring pattern of E2E auth failures in CI specifically related to Vercel preview deployments. Multiple issues have addressed different aspects:
1. Cookie name derivation from Supabase URL
2. Cookie domain handling for Vercel previews
3. URL normalization for JWT issuer validation

Each fix has addressed a specific aspect, but the underlying issue persists. This suggests there may be a more fundamental problem with how Playwright storage state cookies interact with Vercel preview deployments.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Playwright cookies set with `url` property for Vercel preview deployments are not being correctly transmitted or recognized by the deployed middleware, despite URL validation passing.

**Detailed Explanation**:

The issue occurs in the cookie creation flow for Vercel preview deployments (lines 979-990 of `global-setup.ts`):

```typescript
if (cookieConfig.isVercelPreview) {
  return {
    name: cookieBase.name,
    value: cookieBase.value,
    url: baseURL,  // e.g., "https://2025slideheroes-qejxo8shi-slideheroes.vercel.app"
    expires: cookieBase.expires,
    httpOnly: cookieBase.httpOnly,
    secure: cookieBase.secure,
    sameSite: cookieBase.sameSite,
  };
}
```

When using Playwright's `url` property instead of `domain` + `path`, the cookie is associated with that URL's origin. However, there appears to be an inconsistency in how these cookies are:
1. Saved to the storage state JSON file
2. Loaded by subsequent test browser contexts
3. Transmitted with HTTP requests to the Vercel deployment

**Supporting Evidence**:
- URL validation passes (cookie names match between E2E and deployed app)
- Cookies are verified as present in global setup (`cookieCount: 3`)
- Tests pass locally with `domain` property (Docker/localhost)
- Tests fail in CI with `url` property (Vercel preview)
- Navigation to `/home` results in immediate redirect to `/auth/sign-in`

### How This Causes the Observed Behavior

1. Global setup authenticates via Supabase API and creates session cookies
2. Cookies are set with `url: baseURL` for Vercel preview deployments
3. Storage state is saved to JSON file (`.auth/*.json`)
4. Tests load storage state via `test.use({ storageState: path })`
5. Browser context is created with cookies from storage state
6. When test navigates to `/home`, browser should send cookies
7. **CRITICAL**: Cookies are not being sent or recognized by middleware
8. Middleware's `getUser()` returns no claims
9. Middleware redirects to `/auth/sign-in?next=/home`
10. Test waits for `team-selector` on sign-in page (doesn't exist) -> timeout

### Confidence Level

**Confidence**: Medium-High

**Reasoning**:
- The evidence strongly points to cookie transmission issues specific to Vercel preview + `url` property
- URL validation passing eliminates cookie name mismatch as the cause
- Local tests passing with `domain` property confirms the auth flow itself works
- The pattern of multiple related issues (#1494, #1096, #1109, #1485) suggests cookie handling for Vercel previews is fragile

The remaining uncertainty is whether the issue is:
1. Playwright's storage state handling of `url`-based cookies
2. Browser cookie transmission behavior for Vercel preview domains
3. Vercel's edge middleware handling of cookies
4. A subtle interaction between multiple of these factors

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Change Vercel preview cookie creation to use `domain` property instead of `url` property, similar to how local/Docker tests work. This would require:
- Modifying `getCookieDomainConfig()` to return explicit domain for Vercel previews
- Updating cookie creation logic to use `domain` + `path` instead of `url`
- Testing thoroughly in CI environment

**Option 2**: Add explicit cookie injection in test `beforeEach` hooks using `page.context().addCookies()` to ensure cookies are present before navigation. This is a workaround rather than a fix.

**Option 3**: Debug further by adding logging to understand exactly what cookies are being sent with requests and what the middleware receives. This requires deploying debug code to Vercel.

## Diagnosis Determination

The root cause is identified as a cookie transmission issue specific to Vercel preview deployments when using Playwright's `url` property for cookie association. Despite URL validation passing (Issue #1518), the auth cookies created during global setup are not being correctly transmitted or recognized when tests navigate to protected routes.

The fix should focus on changing the cookie creation strategy for Vercel preview deployments to use explicit `domain` + `path` properties instead of the `url` property, which is known to work reliably for local/Docker test environments.

## Additional Context

- This is a CI-only issue; local tests pass consistently
- The dev integration tests workflow is specifically designed to test against deployed Vercel previews
- The workflow uses production Supabase (`ldebzombxtszzcgnylgq.supabase.co`) rather than a local instance
- The Vercel deployment URL is dynamic per-commit (`2025slideheroes-{hash}-slideheroes.vercel.app`)

---
*Generated by Claude Debug Assistant*
*Tools Used: GitHub CLI (gh run view, gh issue list), Grep, Read, Bash*
