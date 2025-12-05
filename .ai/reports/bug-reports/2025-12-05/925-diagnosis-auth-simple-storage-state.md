# Bug Diagnosis: Auth Simple Test Fails Due to Pre-Authenticated Storage State

**ID**: ISSUE-pending
**Created**: 2025-12-05T17:00:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `sign in page loads with correct elements` test in `auth-simple.spec.ts` fails because it runs with a pre-authenticated storage state from `playwright.config.ts`. When an authenticated user navigates to `/auth/sign-in`, the Next.js middleware redirects them to `/home/settings` (authenticated dashboard), so the sign-in form elements are never visible.

## Environment

- **Application Version**: dev branch (commit 02cfe9154)
- **Environment**: dev deployment on Vercel
- **Browser**: Chromium (Playwright)
- **Node Version**: CI runner default
- **Database**: Production Supabase
- **Workflow Run**: 19969575299
- **Last Working**: Unknown

## Reproduction Steps

1. Run `pnpm --filter web-e2e test:integration` or trigger dev-integration-tests.yml workflow
2. The global setup creates authenticated browser states in `.auth/` directory
3. Test `sign in page loads with correct elements` starts with pre-authenticated session
4. Test navigates to `/auth/sign-in`
5. Middleware detects authenticated session and redirects to `/home/settings`
6. Test times out waiting for `[data-testid="sign-in-email"]` which doesn't exist on settings page

## Expected Behavior

The test should navigate to `/auth/sign-in` and see the sign-in form with email input, password input, and submit button.

## Actual Behavior

The test navigates to `/auth/sign-in` but is immediately redirected to `/home/settings` because the browser context has an authenticated session. The test then times out waiting for sign-in form elements.

## Diagnostic Data

### Console Output
```
1) [chromium] > tests/authentication/auth-simple.spec.ts:13:6 > Authentication - Simple Tests @auth @integration > sign in page loads with correct elements

    TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
    Call log:
      - waiting for locator('[data-testid="sign-in-email"]') to be visible

    at /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/authentication/auth-simple.spec.ts:17:14
```

### Playwright Debug Logs
```
// Test navigates to sign-in
pw:api navigating to "https://2025slideheroes-h3frzelrm-slideheroes.vercel.app/auth/sign-in", waiting until "domcontentloaded"

// But page shows Settings (authenticated page)
pw:api locator resolved to 4 elements. Proceeding with the first one: <h1 class="font-heading text-base leading-none font-bold tracking-tight dark:text-white">Settings</h1>
```

### Configuration Analysis
```typescript
// playwright.config.ts - Line 117
// ALL tests in chromium project use pre-authenticated state
{
  name: "chromium",
  use: {
    ...devices["Desktop Chrome"],
    storageState: ".auth/test1@slideheroes.com.json", // <-- PROBLEM
  },
}
```

### Test Code
```typescript
// auth-simple.spec.ts - Line 13-20
test("sign in page loads with correct elements", async ({ page }) => {
  // No storageState override - uses project default (authenticated)
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });

  // This will never be visible because user is redirected to /home
  await page.waitForSelector('[data-testid="sign-in-email"]', {
    state: "visible",
    timeout: 10000,
  });
});
```

## Error Stack Traces
```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="sign-in-email"]') to be visible

at /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/authentication/auth-simple.spec.ts:17:14
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/authentication/auth-simple.spec.ts:17` - Test that fails
  - `apps/e2e/playwright.config.ts:117` - Project config with storageState
  - `apps/e2e/global-setup.ts` - Creates authenticated browser states
  - `apps/web/middleware.ts` - Redirects authenticated users away from auth pages
- **Recent Changes**: None recent - this is a design flaw in test configuration
- **Suspected Functions**: Playwright storageState configuration for auth tests

## Related Issues & Context

### Direct Predecessors
- #923 (OPEN): "Bug Diagnosis: Dev Integration Tests Failing - Auth and Billing Tests" - Previous diagnosis missed the root cause
- #657 (CLOSED): "Bug Diagnosis: Auth-Simple E2E Test Failing - Password Provider Not Enabled"
- #628 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Authentication State Not Persisting"

### Same Component
- #714 (CLOSED): "Bug Fix: E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware"

### Historical Context
The auth-simple test was designed to test sign-in page elements but the project-level storageState configuration was added later for test speed optimization. This created a conflict where tests that need unauthenticated state are running with authenticated sessions.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test runs with a pre-authenticated storage state that causes the Next.js middleware to redirect away from `/auth/sign-in` to `/home/settings`.

**Detailed Explanation**:
The Playwright configuration (`playwright.config.ts:117`) sets `storageState: ".auth/test1@slideheroes.com.json"` for all tests in the `chromium` project. This storage state is created by `global-setup.ts` and contains valid authentication cookies and localStorage data.

When the `sign in page loads with correct elements` test navigates to `/auth/sign-in`:
1. The browser sends the request with authenticated cookies
2. The Next.js middleware in `apps/web/middleware.ts` detects the valid session
3. Middleware redirects authenticated users away from auth pages to `/home` or `/home/settings`
4. The test page shows the Settings page instead of the sign-in form
5. `waitForSelector('[data-testid="sign-in-email"]')` times out because that element only exists on the sign-in page

**Supporting Evidence**:
- Playwright logs show `locator resolved to 4 elements. Proceeding with the first one: <h1 class="font-heading">Settings</h1>` - this is the Settings page, not sign-in
- Navigation logs show `navigated to "/home/settings"` after requesting `/auth/sign-in`
- The `data-testid="sign-in-email"` exists in `packages/features/auth/src/components/password-sign-in-form.tsx` - it's not missing from the codebase
- Other tests in `auth-simple.spec.ts` that need authenticated state (like sign-out test) pass because they start with valid sessions

### How This Causes the Observed Behavior

1. `global-setup.ts` creates `.auth/test1@slideheroes.com.json` with authenticated session
2. `playwright.config.ts` applies this storage state to all chromium project tests
3. Test `sign in page loads with correct elements` starts with authenticated browser
4. `page.goto("/auth/sign-in")` triggers Next.js middleware auth check
5. Middleware sees valid session, redirects to `/home/settings`
6. Test waits for sign-in form elements that don't exist on current page
7. Test times out after 10 seconds

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Playwright logs explicitly show the page is on "Settings" not sign-in page
2. The configuration clearly shows all tests use the same authenticated storage state
3. This is standard Next.js middleware behavior for authenticated users accessing auth pages
4. The pattern matches other tests that properly override storageState (see `apps/e2e/tests/utils/team-test-helpers.ts:47`)

## Fix Approach (High-Level)

Add `test.use({ storageState: undefined })` at the top of the `auth-simple.spec.ts` describe block for tests that require unauthenticated state. Alternatively, clear cookies/context at the start of individual tests.

```typescript
// Option 1: Override at describe level for all tests that need unauthenticated state
test.describe("Authentication - Simple Tests @auth @integration", () => {
  test.use({ storageState: undefined }); // Clear auth state for these tests
  // ... tests
});

// Option 2: Clear for specific tests
test("sign in page loads with correct elements", async ({ page, context }) => {
  await context.clearCookies(); // Clear authenticated state
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
  // ... assertions
});
```

## Diagnosis Determination

The root cause is definitively identified: the test configuration applies an authenticated storage state to tests that need unauthenticated browser sessions. The fix is straightforward - either override `storageState: undefined` for the test file or clear cookies before navigating to auth pages.

This is NOT a page rendering issue, Vercel cold start, or React hydration problem as suggested in the previous diagnosis (#923). The page is rendering correctly - it's just the wrong page (Settings instead of sign-in).

## Additional Context

- Test artifacts (screenshots) from workflow run 19969575299 would show the Settings page, not sign-in page
- The same pattern exists in `apps/e2e/tests/utils/team-test-helpers.ts:47` where `storageState: undefined` is used for fresh contexts
- Other tests in `auth-simple.spec.ts` that need authenticated state (sign out, session persistence) work correctly because they benefit from the pre-authenticated session

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Read, Grep, Bash*
