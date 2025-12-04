# Bug Diagnosis: Three Flaky Payload E2E Tests in Shard 8

**ID**: ISSUE-pending
**Created**: 2025-12-03T15:20:00Z
**Reporter**: system (detected during shard 8 test run)
**Severity**: low
**Status**: new
**Type**: bug

## Summary

Three Payload E2E tests in shard 8 exhibit intermittent failures (flaky behavior) - they fail on the first attempt but pass on retry. The tests pass consistently when run individually but occasionally fail during full shard parallel execution. Root causes are hardcoded timeouts, race conditions in authentication state checks, and network timing variations.

## Environment

- **Application Version**: dev branch
- **Environment**: development (test mode)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (Supabase local)
- **Playwright Version**: Latest
- **Last Working**: Tests pass on retry; issue is intermittent

## Affected Tests

1. `payload-auth.spec.ts:115` - "should login with existing user"
2. `payload-database.spec.ts:151` - "should handle transaction rollback on error"
3. `payload-database.spec.ts:369` - "should validate environment variables for database connection"

## Reproduction Steps

1. Run the full shard 8 test suite: `pnpm --filter web-e2e test:shard8`
2. Observe that 3 tests are marked as "flaky" (failed first, passed on retry)
3. Run the same tests individually - they pass consistently
4. The flakiness only manifests during parallel execution with other tests

## Expected Behavior

All tests should pass on the first attempt without requiring retries.

## Actual Behavior

Tests occasionally fail on first attempt but pass on automatic retry. Playwright marks them as "flaky" in the test report.

## Diagnostic Data

### Test 1: "should login with existing user" (payload-auth.spec.ts:115)

**Code Pattern**:
```typescript
await loginPage.login(email, password);
const isLoggedIn = await loginPage.checkAuthenticationState();
if (!isLoggedIn) {
  await loginPage.createFirstUser(email, password, "Admin User");
}
await loginPage.expectLoginSuccess();
```

**Root Cause**: The `checkAuthenticationState()` method makes an API call to `/api/users/me` immediately after login. During high load (parallel test execution), the session may not be fully established, causing the API call to return 401, which triggers the unnecessary `createFirstUser` fallback that can race with actual auth state.

### Test 2: "should handle transaction rollback on error" (payload-database.spec.ts:151)

**Code Pattern**:
```typescript
await page.click('button:has-text("Save")');
await page.waitForTimeout(1000); // <-- ANTI-PATTERN
const errorMessages = [...];
```

**Root Cause**: Uses `page.waitForTimeout(1000)` - a hardcoded wait that is inherently flaky. The 1000ms may be insufficient when the server is under load from parallel tests. Should use `waitForSelector` or `expect().toPass()` pattern instead.

### Test 3: "should validate environment variables for database connection" (payload-database.spec.ts:369)

**Code Pattern**:
```typescript
const configResponse = await page.request.get(`${loginPage.baseURL}/api/health`);
expect(configResponse.ok()).toBeTruthy();
```

**Root Cause**: Makes a direct API request to the health endpoint without retry logic. During parallel execution, the server may be briefly overloaded, causing occasional timeout or connection failures.

## Error Stack Traces

No explicit stack traces - tests simply fail assertions on first attempt. The "flaky" status means they succeed on Playwright's automatic retry.

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/payload/payload-auth.spec.ts:115`
  - `apps/e2e/tests/payload/payload-database.spec.ts:151`
  - `apps/e2e/tests/payload/payload-database.spec.ts:369`
  - `apps/e2e/tests/payload/pages/PayloadLoginPage.ts` (checkAuthenticationState method)

- **Recent Changes**: None specific to these tests
- **Suspected Functions**:
  - `checkAuthenticationState()` - races with session establishment
  - Hardcoded `waitForTimeout(1000)` - insufficient wait time

## Related Issues & Context

### Similar Symptoms
- #569 (CLOSED): "Authentication Setup Flakiness and Accessibility Violations in E2E Tests"
- #567 (CLOSED): "E2E Test Suite Failures: Accessibility Violations, Authentication Flakiness, and Test Infrastructure Issues"
- #564 (CLOSED): "Three Test Failures: Performance Flake, E2E Auth Rendering, and Test Runner Bug"

### Historical Context
Flaky tests have been addressed multiple times in this codebase. These three represent residual flakiness that wasn't fully resolved.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three distinct anti-patterns cause intermittent test failures during parallel execution: (1) race condition in auth state checking, (2) hardcoded timeout instead of proper async waiting, and (3) missing retry logic for health check API calls.

**Detailed Explanation**:

1. **Auth Race Condition (Test 1)**: The `checkAuthenticationState()` method immediately checks `/api/users/me` after login, but during parallel test execution, the session may not be fully propagated, causing a false negative that triggers unnecessary user creation logic.

2. **Hardcoded Timeout (Test 2)**: Using `page.waitForTimeout(1000)` is a known anti-pattern in Playwright. Error messages may take longer to render under load, causing the subsequent assertions to fail.

3. **Missing Retry Logic (Test 3)**: The health endpoint check doesn't have retry logic, making it susceptible to transient network issues during parallel execution.

**Supporting Evidence**:
- Tests pass 100% when run individually (confirmed with 3 runs)
- Tests only show flakiness during parallel shard execution
- Code review reveals anti-patterns documented in Playwright best practices

### How This Causes the Observed Behavior

During parallel test execution:
1. Multiple tests compete for server resources
2. API response times become variable
3. Hardcoded waits and immediate API checks become unreliable
4. First test attempt fails, but retry (with less contention) succeeds

### Confidence Level

**Confidence**: High

**Reasoning**: The anti-patterns identified (hardcoded timeouts, immediate API checks without retry) are well-documented causes of test flakiness. The behavior matches the expected symptoms: passing individually, flaky under load.

## Fix Approach (High-Level)

1. **Test 1**: Add retry logic to `checkAuthenticationState()` or use `expect().toPass()` pattern:
   ```typescript
   await expect(async () => {
     const isLoggedIn = await loginPage.checkAuthenticationState();
     expect(isLoggedIn).toBeTruthy();
   }).toPass({ timeout: 10000 });
   ```

2. **Test 2**: Replace `waitForTimeout(1000)` with proper element waiting:
   ```typescript
   await expect(async () => {
     const errorVisible = await errorMessages[0].isVisible();
     expect(errorVisible).toBeTruthy();
   }).toPass({ timeout: 5000 });
   ```

3. **Test 3**: Add retry logic to health check:
   ```typescript
   await expect(async () => {
     const response = await page.request.get(`${loginPage.baseURL}/api/health`);
     expect(response.ok()).toBeTruthy();
   }).toPass({ timeout: 10000 });
   ```

## Diagnosis Determination

Root causes have been identified with high confidence. The fix approach follows Playwright best practices for handling async operations. This is a low-severity issue since the retry mechanism catches the failures, but fixing it will improve test reliability and CI/CD performance.

## Additional Context

- The `expect().toPass()` pattern is recommended by Playwright for flaky operations
- These tests are part of shard 8 which has 69 total tests running in parallel
- Fixing these will eliminate the need for retries, improving test suite speed

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (test execution), Read (code analysis), Grep (pattern search), gh CLI (issue search)*
