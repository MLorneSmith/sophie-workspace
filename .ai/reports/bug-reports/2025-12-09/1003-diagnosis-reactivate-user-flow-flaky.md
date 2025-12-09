# Bug Diagnosis: "reactivate user flow" test flaky timeout in loginAsUser()

**ID**: ISSUE-1003
**Created**: 2025-12-09T15:30:00Z
**Reporter**: user (via /test command output)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E test "Admin > Personal Account Management > reactivate user flow" (`apps/e2e/tests/admin/admin.spec.ts:214`) intermittently fails with an authentication timeout in the `loginAsUser()` method. The test successfully bans and reactivates a user, but then times out when attempting to verify the reactivated user can log in again. The root cause is that `loginAsUser()` does not wait for the sign-in page to be fully hydrated before setting up the response listener, causing a race condition where the auth API response is sometimes missed.

## Environment

- **Application Version**: dev branch (commit f25a1f4dd)
- **Environment**: development (local Docker, port 3001)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Intermittent - passes ~90% of runs

## Reproduction Steps

1. Run E2E shard 4: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
2. Wait for "Personal Account Management" tests to execute
3. Observe "reactivate user flow" test - fails intermittently (~10% failure rate)

## Expected Behavior

After banning and reactivating a user, the test should:
1. Clear cookies to log out
2. Navigate to sign-in page
3. Successfully authenticate with `loginAsUser()`
4. Test passes

## Actual Behavior

The `loginAsUser()` method times out waiting for the auth API response:
```
Error: page.waitForResponse: Timeout 8000ms exceeded while waiting for event "response"
  at AuthPageObject.loginAsUser (auth.po.ts:582)
```

The form is submitted but the auth API request either:
- Is not fired (React Query not hydrated)
- Fires before the response listener is attached (race condition)

## Diagnostic Data

### Console Output
```
[loginAsUser] Starting login for test1@slideheroes.com, target: /home
[loginAsUser] Form submitted, waiting for auth API...
Error: page.waitForResponse: Timeout 8000ms exceeded while waiting for event "response"
```

### Error Stack Trace
```
Error: page.waitForResponse: Timeout 8000ms exceeded while waiting for event "response"

Call Log:
- Timeout 45000ms exceeded while waiting on the predicate

   at authentication/auth.po.ts:582

  580 |             );
  581 |         }
> 582 |     }).toPass({
      |        ^
  583 |         // Use environment-aware retry intervals from testConfig
  584 |         // CI environments get longer intervals for network latency resilience
  585 |         intervals: authIntervals,
    at AuthPageObject.loginAsUser (/home/msmith/projects/2025slideheroes/apps/e2e/tests/authentication/auth.po.ts:582:6)
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/admin/admin.spec.ts:253:15
```

### Test Flow Analysis
```
Test: reactivate user flow (admin.spec.ts:214)
├── Ban user via admin UI (PASS)
├── Reactivate user via admin UI (PASS)
├── Verify "Banned" badge removed (PASS)
├── Clear cookies (PASS)
├── Navigate to /auth/sign-in (PASS)
└── loginAsUser() (TIMEOUT)
    ├── goToSignIn() - navigates again (redundant)
    ├── Wait for email input (PASS)
    ├── Set up waitForResponse listener (PASS)
    ├── Fill form fields (PASS)
    ├── Click submit (PASS)
    └── Wait for auth API response (TIMEOUT - 8000ms)
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts` (lines 214-257)
  - `apps/e2e/tests/authentication/auth.po.ts` (lines 487-592)
  - `apps/e2e/tests/utils/test-config.ts` (timeout configuration)

- **Recent Changes**: Multiple timeout adjustments in #987, #989, #990, #992

- **Suspected Functions**:
  - `AuthPageObject.loginAsUser()` - race condition between form submission and response listener
  - `AuthPageObject.goToSignIn()` - uses `waitUntil: "domcontentloaded"` which doesn't guarantee React hydration

## Related Issues & Context

### Direct Predecessors
- #969 (CLOSED): "Bug Diagnosis: Admin 'reactivate user flow' test fails due to unreliable filter mechanism" - Same test, different root cause (filter mechanism)
- #987 (CLOSED): "Bug Diagnosis: E2E Test Failures - Auth Timeout and Missing Error Element" - Same symptom pattern

### Related Infrastructure Issues
- #992 (CLOSED): "Bug Fix: E2E Test Infrastructure Systemic Architecture Problems" - Addressed overall timeout strategy
- #991 (CLOSED): "Bug Diagnosis: E2E Tests Have Systemic Architecture Problems" - Root cause analysis

### Same Component
- #928 (CLOSED): "Bug Fix: auth-simple.spec.ts Tests Timeout - React Query Hydration Race Condition" - Same underlying hydration race

### Historical Context

This is a recurring pattern. Issue #928 introduced the `toPass()` wrapper with response listener pattern to address React Query hydration races. However, the current implementation has a subtle bug: the response listener is set up AFTER navigating but BEFORE form submission. If the page auto-submits (due to browser autofill) or if React hydration happens very quickly and fires a request, the listener might miss it.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `loginAsUser()` method has a race condition where the auth API response can fire before the `waitForResponse` listener is fully attached, especially after cookie clearing which may trigger unexpected page behavior.

**Detailed Explanation**:

The `loginAsUser()` function (auth.po.ts:487-592) has the following flow:

```typescript
await expect(async () => {
  // 1. Navigate to sign-in page
  await this.goToSignIn(params.next);  // Uses domcontentloaded, not networkidle

  // 2. Wait for email input to be visible
  await emailInput.waitFor({ state: "visible", timeout: perAttemptTimeout });

  // 3. Set up response listener
  const authResponsePromise = this.page.waitForResponse(...);

  // 4. Fill form and submit
  await emailInput.fill(params.email);
  await passwordInput.fill(params.password);
  await this.page.click('button[type="submit"]');

  // 5. Wait for auth response
  const response = await authResponsePromise;  // TIMEOUT HERE
}).toPass({ intervals: authIntervals, timeout: authTimeout });
```

**The problem**:
1. `goToSignIn()` uses `waitUntil: "domcontentloaded"` which returns before JavaScript execution completes
2. React hydration happens asynchronously after domcontentloaded
3. The email input may become visible before React has attached form handlers
4. When the user fills the form and clicks submit, React may not have fully hydrated yet
5. The `toPass()` retry mechanism should handle this, but the 8-second per-attempt timeout is sometimes too short for the full hydration + auth flow

**Additionally**, the test at line 249 does a redundant `page.goto("/auth/sign-in")` before calling `loginAsUser()`, which then navigates again via `goToSignIn()`. This double-navigation can cause timing issues where cached page state interferes with the fresh navigation.

**Supporting Evidence**:
- Error shows "Timeout 8000ms" which is `perAttemptTimeout` for local (non-CI) environment
- The `toPass()` wrapper has `intervals: [500, 1500, 3000, 6000]` for local - only 4 retries
- Total timeout: 45s (local medium timeout), but with 4 retries at 8s each = 32s max used before exhausting retries
- The Playwright retry (#1) also failed, suggesting the issue persists across attempts

### How This Causes the Observed Behavior

1. Test clears cookies (line 246)
2. Test navigates to `/auth/sign-in` (line 249) - page loads
3. `loginAsUser()` calls `goToSignIn()` again (line 513) - potentially loads from cache or causes navigation conflict
4. Form becomes visible but React is still hydrating
5. `waitForResponse` listener attached
6. Form filled and submitted
7. Either:
   - React wasn't hydrated so form submission doesn't trigger API call
   - React fires API call before listener was ready (unlikely but possible)
   - Network is slow and response takes >8s
8. 8-second timeout expires, retry triggered
9. All retries exhausted, test fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- This exact pattern was identified and partially fixed in #928
- The error consistently occurs at the same location (auth.po.ts:582)
- The symptom (auth API not responding) matches React hydration race conditions
- Previous issues (#987, #989, #990, #992) confirm systemic auth timeout problems
- The timeout value (8000ms) matches local `perAttemptTimeout` configuration

## Fix Approach (High-Level)

Two improvements needed:

1. **Remove redundant navigation in test**: The test at line 249 navigates to `/auth/sign-in`, then `loginAsUser()` navigates again at line 513. Remove line 249's navigation since `loginAsUser()` handles it:

```typescript
// Before (admin.spec.ts:245-256)
await page.context().clearCookies();
await page.goto("/auth/sign-in");  // REMOVE THIS LINE
const auth = new AuthPageObject(page);
await auth.loginAsUser({ email: testUserEmail, password: ... });

// After
await page.context().clearCookies();
const auth = new AuthPageObject(page);
await auth.loginAsUser({ email: testUserEmail, password: ... });
```

2. **Add explicit hydration wait in loginAsUser()**: Before setting up the response listener, wait for a React-specific hydration indicator or use `networkidle` state:

```typescript
// Option A: Wait for networkidle after navigation
await this.goToSignIn(params.next);
await this.page.waitForLoadState('networkidle');

// Option B: Wait for a hydration indicator (if available)
await this.page.waitForFunction(() => window.__NEXT_HYDRATED === true);

// Option C: Wait for form to be not just visible but also interactive
await this.page.locator('button[type="submit"]').waitFor({ state: 'attached' });
await this.page.locator('button[type="submit"]:not([disabled])').waitFor({ state: 'visible' });
```

3. **Consider increasing local perAttemptTimeout**: The 8s timeout is aggressive. Increasing to 15s (matching CI) would provide more resilience:

```typescript
// test-config.ts line 100
short: Math.min(isCI ? 15000 : 15000, TIMEOUT_CAPS.AUTH_MAX),  // Was 8000 for local
```

## Diagnosis Determination

The flaky timeout in "reactivate user flow" is caused by a race condition between React hydration and the response listener setup in `loginAsUser()`. The test has a redundant navigation that may exacerbate timing issues, and the 8-second per-attempt timeout provides insufficient margin for React to complete hydration on slower runs.

This is a test infrastructure issue, not an application bug. The recommended fix is to:
1. Remove the redundant navigation in the test
2. Add explicit hydration waiting in `loginAsUser()`
3. Optionally increase local perAttemptTimeout to match CI

## Additional Context

- This test is part of serial execution (line 88: `test.describe.configure({ mode: "serial" })`) within the "Personal Account Management" describe block
- The test runs after "ban user flow" which modifies the same test user state
- The `beforeEach` hook navigates to `/admin/accounts` and filters for the test user
- The `afterEach` hook cleans up by unbanning the user via database utility

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (gh issue list, gh issue view), test log analysis*
