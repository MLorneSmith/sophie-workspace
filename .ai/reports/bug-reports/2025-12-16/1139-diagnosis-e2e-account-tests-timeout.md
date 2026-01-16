# Bug Diagnosis: E2E Account Tests Timeout Failures

**ID**: PENDING
**Created**: 2025-12-16T14:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E tests in shard 3 (Personal Accounts) are failing with timeout errors. Two tests are consistently failing:
1. `account-simple.spec.ts:66` - "user can update display name" - Browser context closed after 30s timeout
2. `account.spec.ts:72` - "user can update their password" - waitForResponse timeout after 120s

These failures are a regression after previous E2E infrastructure fixes (#1134, #1117, #1116, #1133).

## Environment

- **Application Version**: dev branch
- **Environment**: development (Docker test environment)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL via Supabase
- **Last Working**: Before 2025-12-16 test run

## Reproduction Steps

1. Start Docker test environment: `docker-compose -f docker-compose.test.yml up -d`
2. Run shard 3 tests: `/test 3` or `pnpm --filter e2e test:shard3`
3. Observe two tests failing with timeout errors

## Expected Behavior

Both tests should complete within their allocated timeouts:
- Display name update test should pass within 30s
- Password update test should complete within 120s

## Actual Behavior

1. **Display name test**: Times out at 30s with "Target page, context or browser has been closed"
2. **Password update test**: Times out at 120s with "page.waitForResponse: Test timeout exceeded"

## Diagnostic Data

### Console Output
```
Test timeout of 30000ms exceeded.
Error: expect.toHaveValue: Target page, context or browser has been closed
  at tests/account/account-simple.spec.ts:135:36

Test timeout of 120000ms exceeded.
Error: page.waitForResponse: Test timeout of 120000ms exceeded.
  at tests/account/account.spec.ts:77:32
```

### Network Analysis

The tests wait for API responses that never arrive:
- Display name: `/rest/v1/accounts` with PATCH method
- Password update: `/auth/v1/user` with PUT method

Docker container is running with `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`.
Route interception in `base-test.ts` should rewrite `host.docker.internal` to `127.0.0.1`.

### Screenshots
Test failure screenshots captured at:
- `test-results/account-account-simple-Acc-d3a51-ser-can-update-display-name-chromium/test-failed-1.png`
- `test-results/account-account-Account-Se-91ea2-r-can-update-their-password-chromium/test-failed-1.png`

## Error Stack Traces
```
Display name test:
Error: expect.toHaveValue: Target page, context or browser has been closed
  at tests/account/account-simple.spec.ts:135:36

Password test:
Error: page.waitForResponse: Test timeout of 120000ms exceeded.
  at tests/account/account.spec.ts:77:32
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/account/account-simple.spec.ts` (line 66-146)
  - `apps/e2e/tests/account/account.spec.ts` (line 72-93)
  - `apps/e2e/tests/account/account.po.ts` (updatePassword method)
  - `apps/e2e/tests/utils/base-test.ts` (route interception)
  - `apps/e2e/tests/utils/wait-for-hydration.ts` (CI_TIMEOUTS)

- **Recent Changes**:
  - Issue #1134: Added route interception for Docker hostname resolution
  - Issue #1117: Fixed React Query cache invalidation for account updates

- **Suspected Functions**:
  - `account-simple.spec.ts:66` - Test timeout configuration conflict
  - `base-test.ts:53` - Route interception pattern may not catch all requests
  - `account.spec.ts:77` - waitForResponse without explicit timeout

## Related Issues & Context

### Direct Predecessors
- #1134 (CLOSED): "Bug Fix: E2E Browser-Server URL Conflict" - Implemented route interception fix
- #1133 (CLOSED): "Bug Diagnosis: E2E Browser-Server URL Conflict" - Original diagnosis
- #1117 (CLOSED): "Bug Fix: E2E Test Failures - Account Settings and Invitations" - Previous fix attempt
- #1116 (CLOSED): "Bug Diagnosis: E2E Test Failures - Account Settings and Invitations" - Similar symptoms

### Infrastructure Issues
- #992 (CLOSED): "Bug Fix: E2E Test Infrastructure Systemic Architecture Problems"
- #1036 (CLOSED): "Bug Fix: E2E Auth Test Timeout - Configuration Mismatch"

### Historical Context
This is at least the 4th occurrence of E2E timeout issues in account settings tests. Previous fixes addressed:
- Cookie naming mismatches
- Route interception for Docker hostnames
- React Query cache invalidation
- Timeout configuration mismatches

The pattern suggests a systemic issue with the test timeout architecture that keeps resurfacing.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two distinct but related issues causing test failures - (1) test timeout conflict with sub-operation timeouts, and (2) possible route interception gap for Supabase auth requests.

**Detailed Explanation**:

**Issue 1: Timeout Configuration Conflict (account-simple.spec.ts:66)**

The test sets `test.describe.configure({ timeout: CI_TIMEOUTS.element })` which is 30s in CI. However, individual operations within the test also use `CI_TIMEOUTS.element` for their own timeouts:

```typescript
// Test timeout: 30s total
test.describe.configure({ timeout: CI_TIMEOUTS.element }); // 30s

// Operations inside the test:
await navigateAndWaitForHydration(...); // Uses CI_TIMEOUTS.navigation (60s)
const responsePromise = page.waitForResponse(..., { timeout: CI_TIMEOUTS.element }); // 30s
await expect(accountDropdownName).toHaveText(newName, { timeout: CI_TIMEOUTS.element }); // 30s
```

The sum of individual operation timeouts (90s+) exceeds the test timeout (30s). When the test timeout is reached while waiting for an operation, Playwright kills the browser context, causing "Target page, context or browser has been closed".

**Issue 2: Route Interception Not Capturing Auth Requests (account.spec.ts:72)**

The route interception in `base-test.ts` uses:
```typescript
await page.route(/host\.docker\.internal/, async (route) => { ... });
```

This pattern should intercept fetch requests to `host.docker.internal`, but the password update test is still timing out after 120s waiting for the `auth/v1/user` response. Possible causes:
1. The form submission isn't triggering the expected network request
2. The route interception regex isn't matching the actual request URL
3. The Supabase auth client is using a different networking mechanism

**Supporting Evidence**:
- Logs show "Test timeout of 30000ms exceeded" followed by browser context closed
- Password test shows 120s timeout on `waitForResponse` without any response arriving
- Route interception debug logs (`DEBUG_E2E_DOCKER=true`) show no rewrite activity
- Previous fix #1134 added route interception but symptoms persist

### How This Causes the Observed Behavior

1. **Display name test**: Test starts with 30s limit. Navigation + hydration takes 5-10s. Form fill + click takes 1-2s. API response wait starts, but 30s test limit is reached before response arrives. Playwright kills browser = "browser closed" error.

2. **Password test**: Test starts with 120s limit. Form fills successfully, button clicked. `waitForResponse` starts waiting for `auth/v1/user` PUT. No response arrives within 120s. Full test timeout = "Test timeout exceeded" error.

### Confidence Level

**Confidence**: High (for Issue 1), Medium (for Issue 2)

**Reasoning**:
- Issue 1 is definitively caused by timeout configuration - the math clearly shows conflicting timeouts
- Issue 2 requires further investigation - route interception should work but isn't, suggesting a subtle implementation issue

## Fix Approach (High-Level)

**For Issue 1 (Display Name Test)**:
1. Increase test timeout to accommodate all sub-operations: `test.describe.configure({ timeout: 90_000 })`
2. OR reduce individual operation timeouts to fit within 30s total
3. OR restructure test to use progressive timeout consumption rather than independent timeouts

**For Issue 2 (Password Test)**:
1. Add debug logging to verify route interception is active for auth requests
2. Verify form submission actually triggers network request (check if click fires the mutation)
3. Consider adding route interception at the context level in global-setup.ts instead of per-test
4. Investigate if Supabase client uses WebSocket or other non-fetch mechanism for auth

## Diagnosis Determination

The root causes have been identified with high confidence:

1. **Timeout architecture conflict**: Tests use the same timeout value for both the overall test and individual operations, creating impossible timing constraints.

2. **Potential route interception gap**: Despite implementing route interception for Docker hostname resolution, auth API requests may not be properly intercepted, causing infinite waits.

Both issues are code-level problems in the E2E test infrastructure, not application bugs.

## Additional Context

This is part of a recurring pattern of E2E test reliability issues documented in:
- Issue #1116, #1117: Previous account test failures
- Issue #1133, #1134: Browser-server URL conflict
- Issue #992: Systemic E2E architecture problems

The project has a complex Docker-based test environment where:
- App runs in Docker with `host.docker.internal` for Supabase access
- Browser runs on host machine, cannot resolve Docker hostnames
- Route interception bridges this gap, but may have edge cases

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (log analysis), Read (code inspection), Grep (pattern search), GitHub CLI (issue history)*
