# Bug Diagnosis: E2E auth-simple test timeout due to networkidle in loginAsUser

**ID**: ISSUE-pending
**Created**: 2025-12-10T14:00:00Z
**Reporter**: system (workflow failure)
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `dev-integration-tests.yml` workflow is failing because the `auth-simple.spec.ts` test "user can sign in with valid credentials" times out waiting for `waitForLoadState('networkidle')` in the `loginAsUser()` function. This is a regression of a previously fixed issue (#643/#644) where the same `networkidle` strategy was removed from navigation calls but missed in the `auth.po.ts` login helper.

## Environment

- **Application Version**: dev branch (commit f5089fc4f)
- **Environment**: CI (GitHub Actions) against Vercel preview deployment
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: Supabase (remote dev)
- **Last Working**: 2025-12-09T19:31:32Z (run 20076029679)

## Reproduction Steps

1. Push to `dev` branch
2. Wait for `dev-integration-tests.yml` workflow to trigger
3. Observe "Integration Tests" job failure
4. The test `auth-simple.spec.ts:65:6 - user can sign in with valid credentials` times out

## Expected Behavior

The test should complete within the 60 second timeout, authenticating the user and verifying successful login.

## Actual Behavior

The test hangs for 59+ seconds waiting for `waitForLoadState('networkidle')` to complete, then times out with:
```
Error: Test timeout of 60000ms exceeded
   at authentication/auth.po.ts:594
```

## Diagnostic Data

### Console Output
```
[loginAsUser] Starting login for ***, target: /home
[loginAsUser] Waiting for network idle to ensure Supabase auth initialization...
pw:api => page.waitForLoadState started +1ms
pw:api <= page.waitForLoadState failed +4ms  (after ~59 seconds)
```

### Network Analysis
```
Network never reaches "idle" state due to:
- Analytics scripts (Vercel Analytics, PostHog, etc.)
- Third-party tracking pixels
- Persistent WebSocket connections
- Background API polling
```

### Screenshots
Screenshots captured at `test-results/authentication-auth-simple-c8944-n-in-with-valid-credentials-chromium-retry1/test-failed-1.png`

## Error Stack Traces
```
Error: Test timeout of 60000ms exceeded
   at authentication/auth.po.ts:594
   at AuthPageObject.loginAsUser (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/authentication/auth.po.ts:594:6)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/authentication/auth.po.ts` (line 527)
  - `apps/e2e/tests/authentication/auth-simple.spec.ts` (line 65)
- **Recent Changes**: No recent changes to these files
- **Suspected Functions**: `AuthPageObject.loginAsUser()` at line 527

## Related Issues & Context

### Direct Predecessors
- #643 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - networkidle Timeout" - Same root cause
- #644 (CLOSED): "Bug Fix: E2E Tests Failing - networkidle Timeout in CI" - Fix implemented but missed auth.po.ts

### Historical Context
This is a **REGRESSION** of issue #643/#644. The original fix removed `networkidle` from navigation calls but the `loginAsUser()` function in `auth.po.ts` still uses it at line 527.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `loginAsUser()` function in `auth.po.ts:527` uses `waitForLoadState('networkidle')` which never completes in deployed environments due to persistent analytics connections.

**Detailed Explanation**:
The `loginAsUser()` function has a hydration wait guard at line 527:
```typescript
// Hydration wait guard 1: Ensure Supabase auth is initialized
// waitForLoadState('networkidle') ensures auth SDK and React Query are fully hydrated
console.log(
  "[loginAsUser] Waiting for network idle to ensure Supabase auth initialization...",
);
await this.page.waitForLoadState("networkidle");
```

In deployed environments (Vercel preview deployments), analytics scripts, tracking pixels, and other third-party code maintain persistent network connections. This prevents the page from ever reaching a "network idle" state, causing an infinite wait.

The test uses `testConfig.getTimeout("medium")` which is 60000ms in CI. The `waitForLoadState('networkidle')` call at line 527 has no explicit timeout, so it inherits the test timeout and runs until the 60 second test limit is reached.

**Supporting Evidence**:
- Log shows: `[loginAsUser] Waiting for network idle to ensure Supabase auth initialization...`
- `pw:api => page.waitForLoadState started` at 14:04:41.3079627Z
- `pw:api <= page.waitForLoadState failed` at 14:05:40.6188133Z (~59 seconds later)
- Error trace points to `auth.po.ts:594` which is inside the `loginAsUser` function's toPass block

### How This Causes the Observed Behavior

1. Test calls `auth.loginAsUser({email, password})`
2. `loginAsUser()` navigates to sign-in page with `domcontentloaded` (correct)
3. `loginAsUser()` then calls `waitForLoadState('networkidle')` (problematic line 527)
4. Analytics/tracking scripts keep network active
5. `networkidle` event never fires
6. Test times out after 60 seconds
7. Playwright marks test as failed

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error trace explicitly points to `auth.po.ts:594` within `loginAsUser`
2. The log output shows "Waiting for network idle" immediately before the timeout
3. This exact issue was diagnosed and fixed before (#643/#644)
4. The fix was applied to navigation calls but missed this instance in `loginAsUser()`

## Fix Approach (High-Level)

Replace `waitForLoadState('networkidle')` at `auth.po.ts:527` with `waitForLoadState('domcontentloaded')` or remove it entirely since the function already navigates with `domcontentloaded` at line 513. The 150ms safety timeout on line 532 provides sufficient time for React hydration.

Alternative: Add explicit wait for auth-related elements instead of network idle:
```typescript
// Wait for sign-in form to be interactive (indicates hydration complete)
await this.page.waitForSelector('[data-testid="sign-in-email"]', { state: 'visible' });
```

## Diagnosis Determination

**Root cause confirmed**: The `waitForLoadState('networkidle')` call at `apps/e2e/tests/authentication/auth.po.ts:527` is incompatible with deployed environments that have persistent analytics connections. This is a regression of previously fixed issue #643/#644.

## Additional Context

- The fix for #644 was implemented on 2025-11-19 but only addressed navigation calls
- The `loginAsUser` function was likely added or modified after the fix
- 13/27 tests passed, 6 skipped, 7 did not run, 1 failed
- This single failure causes the entire workflow to fail

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh issue list, grep, file reads*
