# Bug Diagnosis: Admin E2E Tests Race Condition with Parallel Mode and Shared Test User

**ID**: ISSUE-pending
**Created**: 2025-12-04T17:45:00Z
**Reporter**: system (test run)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The admin E2E tests (ban user flow and reactivate user flow) fail intermittently due to a race condition caused by running tests in parallel mode while sharing the same test user (`test1@slideheroes.com`). Both tests modify the banned state of the same user, causing state corruption when tests execute concurrently.

## Environment

- **Application Version**: dev branch (e0dabf1f6)
- **Environment**: development (local test run)
- **Node Version**: v20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Intermittently passes when tests happen to run serially

## Reproduction Steps

1. Run `/test` or `/test 4` to execute admin tests
2. Observe shard 4 (Admin & Invitations) results
3. Tests fail ~50% of the time depending on execution order

## Expected Behavior

All admin tests pass consistently:
- "ban user flow" should ban the test user, verify ban, then cleanup
- "reactivate user flow" should ban then reactivate the user, verify reactivation

## Actual Behavior

Tests fail with:
1. **TimeoutError**: `page.waitForResponse: Timeout 45000ms exceeded while waiting for event "response"` at `auth.po.ts:538`
2. **Element not found**: `locator('tr').filter({ hasText: 'test1' }).locator('a')` - user not visible in table
3. **Auth error not visible**: `locator('[data-testid="auth-error-message"]')` - expected after banned user login attempt

## Diagnostic Data

### Console Output
```
[admin.spec.ts beforeAll] Test user test1@slideheroes.com was banned, now restored to active state
[admin.spec.ts] User unbanned after test: test1@slideheroes.com
[admin.spec.ts beforeAll] Test user test1@slideheroes.com was banned, now restored to active state
[admin.spec.ts] User unbanned after test: test1@slideheroes.com
```

Multiple `beforeAll` and cleanup hooks running interleaved confirms parallel execution with shared state.

### Test Configuration
```typescript
// apps/e2e/tests/admin/admin.spec.ts:29
test.describe.configure({ mode: "parallel" });

// apps/e2e/tests/admin/admin.spec.ts:443-445
async function createUser(_page: Page) {
  return "test1@slideheroes.com"; // Same user for ALL tests
}
```

### Failure Traces

**Reactivate user flow (line 204)**:
- First attempt: TimeoutError at `auth.po.ts:538` - auth API response timeout
- Retry: Element not found - `locator('tr').filter({ hasText: 'test1' })` not visible

**Ban user flow (line 143)**:
- Auth error message not visible after attempting login with banned user

## Error Stack Traces
```
TimeoutError: page.waitForResponse: Timeout 45000ms exceeded while waiting for event "response"
   at authentication/auth.po.ts:538
   at AuthPageObject.loginAsUser
   at /apps/e2e/tests/admin/admin.spec.ts:243:4

Error: expect(locator).toBeVisible() failed
   Locator: locator('tr').filter({ hasText: 'test1' }).locator('a')
   at selectAccount (/apps/e2e/tests/admin/admin.spec.ts:469:5)
   at /apps/e2e/tests/admin/admin.spec.ts:99:10
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts` - Lines 29, 143-202, 204-247
  - `apps/e2e/tests/utils/database-utilities.ts` - `unbanUser()` function
- **Recent Changes**: None (issue has been present, similar to #765, #767)
- **Suspected Functions**:
  - `createUser()` returns hardcoded `test1@slideheroes.com`
  - Parallel mode configuration at line 29

## Related Issues & Context

### Direct Predecessors
- #767 (CLOSED): "Bug Fix: E2E Test Shard 4 Leaves Test User Banned After Ban User Flow Test" - Added afterEach cleanup but didn't address parallel mode conflict
- #766 (CLOSED): "Bug Diagnosis: E2E Test Shard 4 Leaves Test User Banned" - Diagnosed cleanup issue
- #765 (CLOSED): "Bug Fix: E2E Shard 4 Serial Mode State Corruption" - Previous attempt to fix state issues

### Similar Symptoms
- #770 (CLOSED): "Admin & Invitations Tests Fail with Authentication API Timeout" - Same timeout symptoms
- #768 (CLOSED): Similar diagnosis of auth timeout issues

### Historical Context
This is a recurring issue pattern. Previous fixes (#767) added cleanup hooks but didn't address the fundamental problem: **parallel test execution with shared mutable state**.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Tests configured with `mode: "parallel"` share a single test user (`test1@slideheroes.com`), causing race conditions when multiple tests simultaneously modify the user's banned state.

**Detailed Explanation**:

1. The test suite has `test.describe.configure({ mode: "parallel" })` at line 29
2. Both "ban user flow" and "reactivate user flow" use the same user from `createUser()` which returns `"test1@slideheroes.com"` (line 445)
3. Each test's `beforeEach` hook navigates to admin accounts and selects this user
4. Each test modifies the user's banned state:
   - "ban user flow": Bans user, verifies ban, attempts login, expects error
   - "reactivate user flow": Bans user, unbans user, verifies unban, logs in successfully
5. When running in parallel, these state changes conflict:
   - Test A bans user while Test B is in `beforeEach`
   - Test A's `afterEach` unbans while Test B expects banned state
   - Race condition causes unpredictable behavior

**Supporting Evidence**:
- Log shows multiple interleaved `beforeAll` hooks running simultaneously
- Log shows `[admin.spec.ts] User unbanned after test` messages interleaved with other test activity
- Stack trace at `auth.po.ts:538` shows auth API timeout - user state was unexpectedly modified
- Stack trace shows `selectAccount` failing because user row isn't in expected state

### How This Causes the Observed Behavior

1. **Test A (ban user flow)** starts, bans `test1@slideheroes.com`
2. **Test B (reactivate user flow)** starts in parallel, runs `beforeEach`
3. Test B's `beforeEach` tries to select `test1` but encounters unexpected state:
   - Either: User is already banned (Test A succeeded first)
   - Or: User visibility/state is inconsistent during transition
4. Test A completes, `afterEach` unbans the user
5. Test B now has stale page state - user row may not reflect current DB state
6. Test B fails with element not found or auth errors

### Confidence Level

**Confidence**: High

**Reasoning**:
- Log evidence clearly shows parallel execution with multiple interleaved hooks
- Test code explicitly configures parallel mode
- Test code explicitly uses shared test user
- Previous issues (#765, #767) attempted fixes but didn't address the core parallelism problem
- The failure pattern (intermittent, timing-dependent) matches race condition behavior

## Fix Approach (High-Level)

Two viable options:

**Option 1 (Recommended)**: Change test execution mode to serial for the "Personal Account Management" describe block:
```typescript
test.describe("Personal Account Management", () => {
  test.describe.configure({ mode: "serial" }); // Run ban/reactivate tests sequentially
  // ...
});
```

**Option 2**: Use unique test users per test:
```typescript
async function createUser(_page: Page, testId: string) {
  // Use unique user per test, or create dynamic test users
  return `test-${testId}@slideheroes.com`;
}
```

Option 1 is simpler and ensures the ban/reactivate tests that explicitly depend on shared state run sequentially.

## Diagnosis Determination

The root cause is definitively identified: **parallel test execution with shared mutable state**. The tests are designed to modify a shared resource (user banned state) but configured to run concurrently, causing race conditions.

The fix requires either:
1. Changing the execution mode to serial for tests that share mutable state
2. Isolating tests with unique test data

## Additional Context

- Test count: 2 actual failures out of 206 E2E tests (~1% failure rate)
- These are the only non-intentional failures in the test suite
- Unit tests (588) all pass

---
*Generated by Claude Debug Assistant*
*Tools Used: grep, gh issue list, Read (admin.spec.ts, database-utilities.ts, auth.po.ts), test logs analysis*
