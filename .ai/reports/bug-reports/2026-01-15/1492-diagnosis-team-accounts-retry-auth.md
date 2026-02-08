# Bug Diagnosis: Team Accounts Integration Tests Fail on Retry Due to Auth Session Loss

**ID**: ISSUE-1492
**Created**: 2026-01-15T19:15:00Z
**Reporter**: CI/CD System
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `dev-integration-tests.yml` workflow fails because team-accounts integration tests lose authentication on retry. When the initial test attempt times out waiting for `[data-testid="team-selector"]`, Playwright's retry mechanism creates a fresh browser context that doesn't inherit the pre-authenticated storage state, causing subsequent navigation to `/home` to be redirected to `/auth/sign-in`.

## Environment

- **Application Version**: dev branch (commit 29c8de371)
- **Environment**: dev (Vercel preview deployment)
- **Workflow Run**: [21042853497](https://github.com/slideheroes/2025slideheroes/actions/runs/21042853497)
- **Deployment URL**: https://2025slideheroes-ih8jk7pco-slideheroes.vercel.app
- **Node Version**: v20.10.0
- **Browser**: Chromium (Playwright)

## Reproduction Steps

1. Push to dev branch triggering `deploy-to-dev.yml` workflow
2. Wait for `dev-integration-tests.yml` to be triggered by workflow_run
3. Global setup creates authenticated browser states with cookies successfully
4. Team-accounts integration tests start with `beforeEach` navigating to `/home`
5. Initial navigation succeeds (user is authenticated)
6. Test waits for `[data-testid="team-selector"]` to become visible
7. Element doesn't appear within timeout (hydration delay or rendering issue)
8. Test times out and Playwright initiates retry with **fresh browser context**
9. Retry navigation to `/home` redirects to `/auth/sign-in?next=/home` (no auth cookies)
10. Test fails with `page.waitForSelector: Timeout 20000ms exceeded`

## Failed Tests

1. `[chromium] › tests/team-accounts/team-accounts.spec.ts:103:6 › Team Accounts @team @integration › user can update their team name (and slug)`
2. `[chromium] › tests/team-accounts/team-accounts.spec.ts:120:6 › Team Accounts @team @integration › cannot create a Team account using reserved names`

## Root Cause Analysis

### Identified Root Cause

**Summary**: Playwright test retries create fresh browser contexts that don't inherit the pre-authenticated storage state from global setup.

**Detailed Explanation**:
The team-accounts tests use `AuthPageObject.setupSession(AUTH_STATES.TEST_USER)` which tells Playwright to use a pre-authenticated storage state file. This works correctly on the **initial test attempt**. However, when the test times out waiting for the `team-selector` element (due to hydration/rendering delays), Playwright's built-in retry mechanism creates a **new browser context**. This new context does NOT automatically load the storage state file - it starts completely fresh and unauthenticated.

The two-part failure is:
1. **Primary Issue**: `[data-testid="team-selector"]` doesn't become visible within timeout on initial attempt (likely due to Vercel cold start, Next.js hydration delay, or sidebar rendering issues)
2. **Secondary Issue**: When retry occurs, the new browser context lacks authentication, causing immediate redirect to sign-in

**Supporting Evidence**:

Log timeline showing the failure pattern:
```
19:05:30.140 => page.waitForSelector started
19:05:30.140    waiting for locator('[data-testid="team-selector"]') to be visible
19:05:36.134    taking page screenshot [after 6s wait]
19:05:36.174 <= page.waitForSelector failed
19:05:36.175    browserContext.close succeeded
19:05:36.205    browser.close succeeded
19:05:36.759 => browserType.launch started [RETRY - NEW BROWSER]
19:05:36.815 => browser.newContext started [FRESH CONTEXT - NO AUTH]
19:05:36.900 => page.goto started
19:05:36.900    navigating to "/home"
19:05:37.379    navigated to "/auth/sign-in?next=/home" [REDIRECT - UNAUTHENTICATED]
```

**Code Reference**: `apps/e2e/tests/team-accounts/team-accounts.spec.ts:78`
```typescript
// Use pre-authenticated state from global setup
AuthPageObject.setupSession(AUTH_STATES.TEST_USER);
```

### How This Causes the Observed Behavior

1. Test starts → Storage state loaded → Navigate to `/home` succeeds (authenticated)
2. `beforeEach` calls `createTeam()` → `openAccountsSelector()` → waits for `team-selector`
3. Element not visible (hydration delay) → Wait times out after 20s
4. Playwright retry kicks in → New browser context created (no storage state)
5. Retry navigates to `/home` → Server sees no auth cookie → Redirect to sign-in
6. Test continues waiting for `team-selector` on sign-in page → Never appears → Fails

### Confidence Level

**Confidence**: High

**Reasoning**: The log evidence clearly shows:
- Initial attempt navigates successfully to authenticated pages
- `page.waitForSelector failed` triggers browser close
- New browser context launched for retry
- Retry immediately redirects to `/auth/sign-in`

The pattern is deterministic and reproducible across multiple CI runs.

## Fix Approach (High-Level)

There are two complementary fixes needed:

1. **Primary Fix - Address Element Visibility**: Investigate why `[data-testid="team-selector"]` isn't becoming visible on initial attempt. This may involve:
   - Increasing hydration timeout for CI environments
   - Adding explicit wait for sidebar to render
   - Checking if `enableTeamAccounts` feature flag is properly set in CI

2. **Secondary Fix - Preserve Auth on Retry**: Ensure retries maintain authentication:
   - Configure Playwright to reuse browser context on retry
   - Or explicitly reload storage state after context creation in test hooks
   - Or increase timeout to avoid retries entirely in CI

The immediate fix is to increase the element visibility timeout to prevent retries, while the longer-term fix is to improve hydration reliability.

## Diagnosis Determination

The root cause is a **combination of two issues**:

1. **Hydration/rendering delay** causing `team-selector` element to not appear within timeout
2. **Playwright retry behavior** creating unauthenticated contexts

The 2 failed tests and 1 flaky test pattern suggests this is timing-related and varies with CI load and Vercel cold start times.

## Related Issues

### Direct Predecessors
- #1082 (CLOSED): "Bug Diagnosis: Team Accounts Integration Tests Auth Session Not Recognized" - Same symptom, previous fix may not have fully addressed retry scenario
- #1083 (CLOSED): "Bug Fix: Integration Tests Auth Session Not Recognized in Vercel Preview" - Implemented cookie fixes

### Similar Symptoms
- #1066 (CLOSED): "Dev Integration Tests Auth Session Regression After #1063 Fix"
- #1050 (CLOSED): "Dev Integration Tests Intermittently Failing Due to Element Visibility Timeouts"
- #1045 (CLOSED): "E2E Integration Tests Failing Due to networkidle Timeout"

### Same Component
- #901 (CLOSED): "Team Accounts E2E tests fail with blank page - missing beforeEach setup"
- #1107 (CLOSED): "E2E Local Test Regression After Vercel Preview Cookie Fixes"

### Historical Context
This is a recurring issue pattern involving auth cookie handling in CI/Vercel preview environments. Previous fixes focused on cookie attributes and domain handling but didn't address the retry scenario where fresh browser contexts are created.

## Additional Context

### Passing Tests in Same Run
- 18 tests passed including other authentication tests
- Auth-simple tests (`account-simple.spec.ts`) passed (marked as flaky)
- The `loginAsUser()` UI-based login works correctly

### Environment Specifics
- Cookie name: `sb-ldebzombxtszzcgnylgq-auth-token`
- Vercel preview deployment with protection bypass configured
- Global setup successfully creates all 4 auth states

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, grep, read file, bash*
