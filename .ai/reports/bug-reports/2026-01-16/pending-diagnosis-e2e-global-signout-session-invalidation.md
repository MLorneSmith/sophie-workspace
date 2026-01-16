# Bug Diagnosis: E2E Global Sign-Out Invalidates Pre-Authenticated Sessions

**ID**: ISSUE-pending
**Created**: 2026-01-16T18:40:00Z
**Reporter**: system (discovered during issue #1532 investigation)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The auth-simple test "sign out clears session" calls `signOut()` without specifying a scope, which defaults to Supabase's `scope: 'global'` behavior. This globally revokes ALL sessions for `test1@slideheroes.com`, including the pre-authenticated session stored in the auth state file (`.auth/test1@slideheroes.com.json`). When subsequent tests (like team-accounts) try to use this pre-authenticated session, the token is invalid and authentication fails.

## Environment

- **Application Version**: dev branch (commit c463e0432)
- **Environment**: development (local Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: v22.16.0
- **Supabase**: Local Docker (host.docker.internal:54521)
- **Last Working**: N/A (design flaw)

## Reproduction Steps

1. Run global-setup which creates pre-authenticated sessions (including `.auth/test1@slideheroes.com.json`)
2. Run auth-simple test "sign out clears session" (line 111 in `auth-simple.spec.ts`)
   - This test signs in as `test1@slideheroes.com`
   - Then calls `signOut()` via the UI
3. Run team-accounts tests which use `AUTH_STATES.TEST_USER` (same user: `test1@slideheroes.com`)
4. Team-accounts tests fail because the pre-authenticated session token has been globally revoked

**Minimal reproduction command:**
```bash
pnpm --filter web-e2e exec playwright test \
  "tests/authentication/auth-simple.spec.ts:111" \
  "tests/team-accounts/team-accounts.spec.ts:112" \
  --workers=1
```

## Expected Behavior

The auth-simple tests should only sign out the current browser session (local scope), leaving other sessions (including the pre-authenticated test session) intact.

## Actual Behavior

The `signOut()` call uses Supabase's default global scope, which revokes ALL sessions for the user across all devices/contexts. This invalidates the pre-authenticated session token stored in the auth state file.

## Diagnostic Data

### Evidence: Tests Pass Without Sign-Out Test

```bash
# Without sign-out test: PASSES
pnpm --filter web-e2e exec playwright test \
  "tests/authentication/auth-simple.spec.ts:22" \
  "tests/team-accounts/team-accounts.spec.ts:112" \
  --workers=1
# Result: 2 passed (15.3s)
```

### Evidence: Tests Fail After Sign-Out Test

```bash
# With sign-out test: FAILS
pnpm --filter web-e2e exec playwright test \
  "tests/authentication/auth-simple.spec.ts:111" \
  "tests/team-accounts/team-accounts.spec.ts:112" \
  --workers=1
# Result: 1 failed (team-accounts), 1 passed (auth-simple)
```

### Supabase Documentation Confirms Behavior

From Supabase Auth documentation:
- `signOut()` defaults to `scope: 'global'` which revokes ALL sessions
- To sign out only the current session, must use `signOut({ scope: 'local' })`

## Error Stack Traces

```
Error: Timeout 10000ms exceeded while waiting on the predicate

   at team-accounts/team-accounts.po.ts:105

    103 |        this.page.locator('[data-testid="account-selector-content"]'),
    104 |      ).toBeVisible({ timeout: CI_TIMEOUTS.element });
  > 105 |    }).toPass({
        |       ^
```

The test times out because the user is redirected to `/auth/sign-in` instead of `/home`, since their session token is invalid.

## Related Code

- **Affected Files**:
  - `packages/supabase/src/hooks/use-sign-out.ts:10` - Missing scope parameter
  - `apps/e2e/tests/authentication/auth-simple.spec.ts:111-131` - Sign-out test
  - `apps/e2e/tests/helpers/test-users.ts:11-14` - TEST_USERS.user1 definition
  - `apps/e2e/tests/utils/auth-state.ts:5` - AUTH_STATES.TEST_USER uses same user

- **The Problem Code** (`use-sign-out.ts:9-11`):
  ```typescript
  mutationFn: () => {
    return client.auth.signOut(); // Missing { scope: 'local' }
  },
  ```

- **User Overlap**:
  - `TEST_USERS.user1.email` = `test1@slideheroes.com`
  - `AUTH_STATES.TEST_USER` = `.auth/test1@slideheroes.com.json`
  - Both reference the SAME user account

## Related Issues & Context

### Direct Predecessors
- #1532 (CLOSED): "Bug Fix: E2E Storage State Transition Cookie Loss" - Initial investigation discovered this issue
- #925 (CLOSED): "Auth Simple Test Fails Due to Pre-Authenticated Storage State" - Related auth-simple configuration

### Related Infrastructure Issues
- #1075 (CLOSED): "Dev Integration Tests Auth Session Lost During Parallel Test Execution"
- #1492: "Storage state lost when Playwright retries" - Led to restoreAuthStorageState function

### Historical Context
This is not a regression but a design flaw that was always present. It was masked because:
1. Tests often run in isolation
2. When tests run in parallel with separate workers, each gets fresh state
3. Serial execution with workers=1 exposes the issue

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `useSignOut` hook calls `signOut()` without specifying `scope: 'local'`, causing Supabase to use the default `scope: 'global'` which revokes ALL sessions for that user, including pre-authenticated E2E test sessions.

**Detailed Explanation**:

1. **Global Setup** creates authenticated sessions for test users and saves them to `.auth/*.json` files
2. The auth-simple test "sign out clears session" signs in as `test1@slideheroes.com`
3. The test then triggers sign-out via the UI, which calls `useSignOut` → `client.auth.signOut()`
4. Supabase's default behavior is `scope: 'global'` - revokes ALL sessions for this user
5. The session stored in `.auth/test1@slideheroes.com.json` is now INVALID
6. Team-accounts tests use `AUTH_STATES.TEST_USER` (same file) to authenticate
7. The server rejects the invalid token and redirects to `/auth/sign-in`

**Supporting Evidence**:
- Supabase documentation confirms default `scope: 'global'` behavior
- Tests pass when sign-out test is excluded
- Tests fail when sign-out test runs before team-accounts tests
- Same user (`test1@slideheroes.com`) used by both auth-simple and AUTH_STATES.TEST_USER

### How This Causes the Observed Behavior

```
[Global Setup] → Creates session for test1@slideheroes.com → Saves to .auth/test1@slideheroes.com.json
     ↓
[Auth-Simple Sign-Out Test] → Signs in (new session) → Signs out with global scope
     ↓
[Supabase Server] → Revokes ALL sessions for test1@slideheroes.com (including the pre-created one)
     ↓
[Team-Accounts Test] → Tries to use .auth/test1@slideheroes.com.json → Token is INVALID
     ↓
[Server] → Redirects to /auth/sign-in → Test fails waiting for authenticated UI elements
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The behavior is reproducible and isolated to specific test ordering
2. Tests pass without sign-out test, fail with it
3. Supabase documentation explicitly states the default scope behavior
4. The code path is clear: useSignOut → signOut() → global scope → all sessions revoked

## Fix Approach (High-Level)

**Option 1: Use local scope in useSignOut hook (Recommended)**

Change `packages/supabase/src/hooks/use-sign-out.ts` to use local scope:
```typescript
mutationFn: () => {
  return client.auth.signOut({ scope: 'local' });
},
```

This is the safest fix because:
- Most users expect "sign out" to only sign out their current device
- Other devices/sessions should remain logged in
- Preserves E2E test isolation

**Option 2: Use a different test user for auth-simple tests**

Change auth-simple tests to use `TEST_USERS.user2` instead of `TEST_USERS.user1`, so the global sign-out doesn't affect the pre-authenticated session.

**Option 3: Skip sign-out test in CI or isolate it**

Mark the sign-out test to run in its own isolated project or skip it when running with other tests.

**Recommendation**: Option 1 is the best fix because it addresses the root cause and improves the production user experience (users don't expect sign-out to log them out of all devices by default).

## Diagnosis Determination

The root cause is definitively identified: the `useSignOut` hook uses Supabase's default `scope: 'global'` which revokes all sessions for a user. When auth-simple's sign-out test runs before tests that rely on pre-authenticated sessions for the same user, those sessions are invalidated.

## Additional Context

**Supabase signOut Scope Options**:
- `scope: 'local'` - Signs out only the current session
- `scope: 'global'` (default) - Revokes ALL sessions for the user
- `scope: 'others'` - Revokes all sessions EXCEPT the current one

**Test User Allocation**:
- `test1@slideheroes.com` - Used by AUTH_STATES.TEST_USER AND auth-simple tests (conflict!)
- `test2@slideheroes.com` - Used by AUTH_STATES.OWNER_USER
- `newuser@slideheroes.com` - Available for sign-up tests

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Bash, Task (context7-expert, perplexity-expert)*
