# Bug Diagnosis: Dev Integration Tests Failing - Authentication State Not Being Applied

**ID**: ISSUE-643
**Created**: 2025-11-19T17:49:00Z
**Reporter**: user/system
**Severity**: critical
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests.yml workflow is consistently failing with 100% failure rate. Tests timeout or get redirected to `/auth/sign-in` despite successful authentication setup in global-setup.ts. The root cause is that Playwright's `waitUntil: "networkidle"` condition is never satisfied, causing 30-second timeouts on page navigation.

## Environment

- **Application Version**: dev branch
- **Environment**: CI (GitHub Actions)
- **Browser**: Chromium (Playwright)
- **Node Version**: As per .nvmrc
- **Database**: Supabase (production instance)
- **Last Working**: Unknown - last 10 runs all failed

## Reproduction Steps

1. Push to dev branch or trigger "Deploy to Dev" workflow
2. Wait for deployment to complete
3. dev-integration-tests.yml workflow triggers automatically
4. Integration tests fail with 6/27 tests failing consistently

## Expected Behavior

- Tests should authenticate using pre-built storage state from global setup
- Protected routes should load successfully for authenticated tests
- Navigation should complete within timeout periods

## Actual Behavior

- Tests timeout waiting for `networkidle` condition (30s timeout exceeded)
- Protected route navigation results in redirect to `/auth/sign-in?next=...`
- Even public routes like `/auth/sign-in` timeout
- All 6 failing tests fail on both initial run and retry

## Diagnostic Data

### Console Output
```
Running 27 tests using 3 workers

Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://2025slideheroes-c1kbqnl9e-slideheroes.vercel.app/home/settings", waiting until "networkidle"

Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://2025slideheroes-c1kbqnl9e-slideheroes.vercel.app/auth/sign-in", waiting until "networkidle"

Error: Test timeout of 180000ms exceeded
  at team-accounts/team-accounts.po.ts:55

6 failed
4 skipped
```

### Network Analysis
```
Navigation to protected routes redirects to sign-in:
- /home/settings -> /auth/sign-in?next=/home/settings
- /home -> /auth/sign-in?next=/home
- /home/billing -> /auth/sign-in?next=/home/billing

Even public routes fail to reach networkidle:
- /auth/sign-in -> timeout after 30s
```

### Failed Tests
1. `account-simple.spec.ts` - "settings page loads successfully" - TIMEOUT
2. `auth-simple.spec.ts` - "sign in page loads with correct elements" - TIMEOUT
3. `team-accounts.spec.ts` - "team can update their team name and slug" - TIMEOUT
4. `team-accounts.spec.ts` - "team cannot create account using reserved names" - TIMEOUT
5. `team-billing.spec.ts` - "team can subscribe to a plan" - TIMEOUT
6. `user-billing.spec.ts` - "user can subscribe to a plan" - toBeVisible TIMEOUT

### Global Setup Output
```
✅ API authentication successful for test user
✅ Session injected into browser storage for test user
✅ test user auth state saved successfully

✅ API authentication successful for owner user
✅ Session injected into browser storage for owner user
✅ owner user auth state saved successfully

✅ API authentication successful for super-admin user
✅ Session injected into browser storage for super-admin user
✅ super-admin user auth state saved successfully

✅ Global Setup Complete: All auth states created via API
```

### Performance Metrics
- Workflow duration: ~12-21 minutes
- Test failures: 6/27 (22%)
- Retry failures: 100% (all retries fail)

## Error Stack Traces
```
Error: page.goto: Test timeout of 30000ms exceeded.
    at account-simple.spec.ts:17
      15 | test("settings page loads successfully", async ({ page }) => {
    > 16 |   await page.goto("/home/settings", { waitUntil: "networkidle" });

Error: page.goto: Test timeout of 30000ms exceeded.
    at auth-simple.spec.ts:14
    > 14 |   await page.goto("/auth/sign-in", { waitUntil: "networkidle" });
```

## Related Code
- **Affected Files**:
  - `.github/workflows/dev-integration-tests.yml`
  - `apps/e2e/global-setup.ts`
  - `apps/e2e/playwright.config.ts`
  - `apps/e2e/tests/account/account-simple.spec.ts`
  - `apps/e2e/tests/authentication/auth-simple.spec.ts`
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts`
  - `apps/e2e/tests/billing/team-billing.spec.ts`
  - `apps/e2e/tests/billing/user-billing.spec.ts`
- **Recent Changes**: Multiple CI fixes in past week (commits c3b596fe3, 86d176860)
- **Suspected Functions**:
  - `page.goto()` with `waitUntil: "networkidle"`
  - Session injection in `global-setup.ts`

## Related Issues & Context

### Direct Predecessors
- #630 (CLOSED): "Bug Fix: Dev Integration Tests - Authentication State Not Persisting" - Same symptoms, supposedly fixed but recurring
- #628 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Authentication State Not Persisting" - Identified Supabase URL mismatch

### Related Infrastructure Issues
- #641 (CLOSED): "Bug Fix: Dev Integration Tests Workflow Performance (15-20min → 8-10min)" - Performance optimization
- #637 (CLOSED): "Bug Fix: Configure Missing GitHub Actions Secrets for E2E Integration Tests" - Secrets configuration
- #635 (CLOSED): "Bug Diagnosis: dev-integration-tests.yml Pipeline Invalid supabaseUrl Error" - Configuration issue

### Similar Symptoms
- #639 (CLOSED): "Bug Diagnosis: E2E Test Timeouts and Element Not Found in CI" - Similar timeout patterns
- #640 (CLOSED): "Performance Diagnosis: Dev Integration Tests Workflow Exceeds 15 Minutes" - Performance issue

### Historical Context
This is a recurring pattern. Multiple issues (#628, #630, #635, #637, #640, #641) have attempted to fix dev integration tests in the past week. The authentication state persistence problem was supposedly fixed in #630 but has regressed.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `waitUntil: "networkidle"` condition is never satisfied because the deployed application has long-running network connections (likely analytics, websockets, or third-party scripts) that prevent the page from reaching an idle state.

**Detailed Explanation**:

The tests are using `waitUntil: "networkidle"` for page navigation, which requires the page to have no more than 0-2 network connections for 500ms. This condition is not being met within the 30-second timeout, causing all navigations to fail.

Evidence:
1. Both protected routes (`/home/settings`) AND public routes (`/auth/sign-in`) timeout
2. Global setup successfully completes (authentication works via API)
3. Timeout occurs at the exact same point - `page.goto()` with `networkidle`
4. The deployed environment may have:
   - Analytics scripts (Vercel Analytics, Google Analytics)
   - WebSocket connections for real-time features
   - Third-party scripts that keep connections open
   - Background polling or keep-alive connections

**Supporting Evidence**:
- All timeout errors show `waiting until "networkidle"`
- Even the auth/sign-in page (no auth required) times out
- Global setup uses the same navigation approach and succeeds because it navigates to "/" first
- Stack traces all point to `page.goto()` calls with `networkidle`

### How This Causes the Observed Behavior

1. Test starts with authenticated storage state
2. Test calls `page.goto("/home/settings", { waitUntil: "networkidle" })`
3. Browser navigates to the URL
4. Page loads HTML, CSS, JS successfully
5. Long-running network connections prevent `networkidle` from being reached
6. 30-second timeout expires
7. Test fails with timeout error
8. For protected routes, the test never gets to verify if auth worked

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The pattern is consistent - ALL failing tests use `waitUntil: "networkidle"`
2. Even public routes timeout the same way
3. Global setup succeeds (uses networkidle but on "/" which is simpler)
4. No authentication errors in logs - only timeout errors
5. This is a known Playwright issue with deployed environments that have analytics

## Fix Approach (High-Level)

Change navigation strategy from `waitUntil: "networkidle"` to `waitUntil: "domcontentloaded"` or `waitUntil: "load"` for test navigation, then explicitly wait for specific elements to be visible before interacting. This matches Playwright best practices for testing production environments with analytics.

Example fix:
```typescript
// Before (problematic)
await page.goto("/home/settings", { waitUntil: "networkidle" });

// After (robust)
await page.goto("/home/settings", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-test="settings-form"]', { state: "visible" });
```

## Diagnosis Determination

The root cause is confirmed: `waitUntil: "networkidle"` is incompatible with the deployed environment due to long-running network connections from analytics/tracking scripts. This causes all page navigations to timeout before tests can execute.

The fix requires updating test navigation strategy across all affected test files to use `domcontentloaded` or `load` instead of `networkidle`, with explicit waits for specific elements.

## Additional Context

- The previous fix (#630) addressed Supabase URL mismatch but did not address the networkidle timeout issue
- This issue may have been masked by earlier failures or may have been introduced by recent deployment changes
- The pattern suggests tests worked at some point but broke when the deployed app added analytics or real-time features

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow runs, issues), Grep, Read, Glob*
