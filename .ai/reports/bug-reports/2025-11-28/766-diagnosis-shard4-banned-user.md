# Bug Diagnosis: E2E Test Shard 4 Leaves Test User Banned After Ban User Flow Test

**ID**: ISSUE-pending
**Created**: 2025-11-28T00:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The "ban user flow" test in `apps/e2e/tests/admin/admin.spec.ts` (shard 4) bans the test user `test1@slideheroes.com` but does not unban them after the test completes. This causes subsequent test runs to fail because the global setup's Supabase authentication fails for a banned user.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development (local and CI)
- **Browser**: Chromium (Playwright)
- **Node Version**: N/A
- **Database**: Supabase/PostgreSQL
- **Last Working**: N/A (design issue from initial implementation)

## Reproduction Steps

1. Run `/test 4` (or `pnpm --filter web-e2e test:shard4`) to execute shard 4 tests
2. The "ban user flow" test successfully bans `test1@slideheroes.com`
3. Run `/test 4` again
4. Global setup fails when trying to authenticate `test1@slideheroes.com` because the user is still banned

## Expected Behavior

After the "ban user flow" test completes, the test user `test1@slideheroes.com` should be unbanned/reactivated so that subsequent test runs can authenticate the user successfully.

## Actual Behavior

The "ban user flow" test bans the user but provides no cleanup mechanism. The user remains banned in the database, causing:
1. Global setup authentication to fail on the next test run
2. All subsequent E2E tests that depend on `test1@slideheroes.com` to fail

## Diagnostic Data

### Root Cause Analysis

**Identified Root Cause**

**Summary**: The `ban user flow` test at `apps/e2e/tests/admin/admin.spec.ts:102` bans `test1@slideheroes.com` via the admin UI but has no `test.afterEach()` hook to restore the user to an unbanned state.

**Detailed Explanation**:

1. **Test File**: `apps/e2e/tests/admin/admin.spec.ts`
2. **Failing Test**: `ban user flow` (line 102-147)
3. **Test User**: `test1@slideheroes.com` (returned by `createUser()` function at line 343-348)
4. **Ban Mechanism**: The test clicks the ban button (line 103), confirms with "CONFIRM" (line 118-121), and verifies the user shows "Banned" badge (line 129)
5. **Missing Cleanup**: No `test.afterEach()` or `test.afterAll()` hook exists to unban the user after test completion

The test correctly verifies that:
- The ban dialog appears
- Invalid confirmation is rejected
- Valid confirmation bans the user
- Banned user cannot log in

However, it does not restore the user state after completion.

**Supporting Evidence**:

1. **Admin spec has no afterEach hooks**:
   ```bash
   grep -n "afterEach\|afterAll" apps/e2e/tests/admin/admin.spec.ts
   # No matches found
   ```

2. **Contrast with account.spec.ts which HAS cleanup**:
   ```typescript
   // apps/e2e/tests/account/account.spec.ts:26
   test.afterEach(async () => {
     const restored = await restoreOriginalPassword("test1@slideheroes.com");
   });
   ```

3. **Global setup authenticates test1@slideheroes.com** (`apps/e2e/global-setup.ts:119-123`):
   ```typescript
   const authStates = [
     {
       name: "test user",
       role: "test" as const,
       filePath: join(authDir, "test1@slideheroes.com.json"),
     },
     // ...
   ];
   ```

4. **Supabase banning mechanism** (`packages/features/admin/src/lib/server/services/admin-auth-user.service.ts:44-47`):
   ```typescript
   async banUser(userId: string) {
     await this.assertUserIsNotCurrentSuperAdmin(userId);
     return this.setBanDuration(userId, "876600h"); // 100 years
   }
   ```

5. **Reactivation API exists** (`admin-auth-user.service.ts:54-58`):
   ```typescript
   async reactivateUser(userId: string) {
     await this.assertUserIsNotCurrentSuperAdmin(userId);
     return this.setBanDuration(userId, "none");
   }
   ```

### How This Causes the Observed Behavior

1. Test shard 4 runs `ban user flow` test
2. Test bans `test1@slideheroes.com` by calling the admin ban action
3. Supabase sets `banned_until` to a date 100 years in the future
4. Test completes without cleanup
5. On next test run, `global-setup.ts` tries to authenticate `test1@slideheroes.com`
6. Supabase rejects authentication because `banned_until` is set
7. Global setup fails with authentication error
8. All tests fail

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code inspection confirms no cleanup hook exists
- The test explicitly bans the user with no restoration
- Similar cleanup pattern already exists in `account.spec.ts` for password restoration
- The `reactivate user flow` test (line 149) also bans then reactivates, but if it runs after `ban user flow`, the user is already banned and needs to be reactivated first
- Both tests run in parallel mode (`test.describe.configure({ mode: "parallel" })`), so execution order is not guaranteed

## Fix Approach (High-Level)

Add an `afterEach` hook to the "Personal Account Management" test suite that unbans `test1@slideheroes.com` after each test. This can be done by:

1. Creating a new utility function `unbanUser(email: string)` in `apps/e2e/tests/utils/database-utilities.ts` that directly updates `banned_until` to `null` in `auth.users` table
2. Adding `test.afterEach()` hook in the "Personal Account Management" describe block to call this utility
3. Alternatively, use the Supabase Admin API to call `updateUserById` with `ban_duration: "none"`

The pattern already exists in `account.spec.ts:26` with `restoreOriginalPassword()` - follow the same approach.

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts` (missing cleanup hook)
  - `apps/e2e/global-setup.ts` (fails when user is banned)
  - `apps/e2e/tests/utils/database-utilities.ts` (needs unban utility)
- **Recent Changes**: N/A (design issue from initial implementation)
- **Suspected Functions**:
  - `ban user flow` test (line 102-147)
  - `createUser()` helper (line 343-348)

## Related Issues & Context

### Similar Patterns in Codebase
- `apps/e2e/tests/account/account.spec.ts` uses `test.afterEach()` with `restoreOriginalPassword()` for cleanup
- This is the established pattern for test state restoration

### Potential Improvements
- The `reactivate user flow` test (line 149) also bans the user but then reactivates
- Consider adding a `beforeEach` that ensures user is unbanned before running each test
- Consider adding a global teardown that resets all test user states

## Diagnosis Determination

The root cause is conclusively identified: the `ban user flow` test at `apps/e2e/tests/admin/admin.spec.ts:102` bans `test1@slideheroes.com` without any cleanup mechanism, causing subsequent test runs to fail during global setup authentication.

The fix requires adding a `test.afterEach()` hook that unbans the user, following the existing pattern in `account.spec.ts` for password restoration.

## Additional Context

- Shard 4 configuration: `"test:shard4": "playwright test tests/admin/admin.spec.ts tests/invitations/invitations.spec.ts"` (from `apps/e2e/package.json:27`)
- The test uses `test1@slideheroes.com` which is also the default storage state for all Playwright tests
- The `verify-test-users.js` script already detects banned users but provides no automatic fix

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Glob, Read, Bash*
