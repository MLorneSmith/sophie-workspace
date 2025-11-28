# Bug Fix: E2E Admin & Invitations Tests Fail with Authentication API Timeout

**Related Diagnosis**: #768 (REQUIRED)
**Severity**: high
**Bug Type**: e2e
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `AuthPageObject.signIn()` method submits the authentication form but does not wait for the Supabase `auth/v1/token` API response before returning. Tests then try to access authenticated-only features while authentication is still pending.
- **Fix Approach**: Replace all direct `signIn()` calls in admin and invitations tests with `loginAsUser()`, which properly waits for the auth API response using `Promise.all()`.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E test shard 4 (Admin & Invitations) has 9 out of 13 tests failing due to authentication API timeouts. Tests that call `AuthPageObject.signIn()` directly fail with "Auth API timeout after 15000ms" when waiting for the Supabase `auth/v1/token` endpoint response. The root cause is that `signIn()` does not wait for the API response before returning control to the test.

For full details, see diagnosis issue #768.

### Solution Approaches Considered

#### Option 1: Replace signIn() calls with loginAsUser() ⭐ RECOMMENDED

**Description**: Replace all direct `signIn()` calls in failing tests with `loginAsUser()` calls. The `loginAsUser()` method already exists in the `AuthPageObject` class and properly implements the correct pattern: using `Promise.all()` to ensure the auth API response listener is attached BEFORE the form is submitted, preventing race conditions.

**Pros**:
- ✅ Minimal code changes required (3 files, 3 lines)
- ✅ `loginAsUser()` method is battle-tested and used successfully in other tests
- ✅ Eliminates race condition by using `Promise.all()` pattern
- ✅ Improves test reliability with comprehensive network diagnostics
- ✅ Uses configurable timeouts from `testConfig` for consistency
- ✅ Zero risk of breaking existing functionality

**Cons**:
- None identified

**Risk Assessment**: low - We're adopting an already-proven pattern from `loginAsUser()`

**Complexity**: simple - Direct method replacement

#### Option 2: Fix signIn() method to wait for auth API response

**Description**: Modify the `signIn()` method to include the auth API response waiting logic from `loginAsUser()`, similar to how `loginAsSuperAdmin()` was fixed.

**Pros**:
- Would fix the underlying method for all future uses
- Educational for future developers

**Cons**:
- ❌ More invasive change to core authentication method
- ❌ Risk of introducing regressions in other tests using `signIn()`
- ❌ More complex testing requirements
- ❌ Unnecessary complexity for this specific use case

**Why Not Chosen**: The `loginAsUser()` method already exists with the correct implementation. Using it directly is simpler, safer, and follows the established pattern in the codebase (see `loginAsSuperAdmin()` which also calls `signIn()` and then waits for the API response separately).

#### Option 3: Add retry logic to existing signIn() calls

**Description**: Wrap the `signIn()` calls with retry logic to handle timing issues.

**Why Not Chosen**: This is a band-aid solution that masks the underlying problem. The root cause is the missing API wait, not intermittent failures.

### Selected Solution: Replace signIn() calls with loginAsUser()

**Justification**: The `loginAsUser()` method is already implemented with the correct pattern (using `Promise.all()` to synchronize the response listener with form submission). This is the safest, simplest, and most maintainable fix. It follows the established pattern in the codebase where authentication operations properly wait for API responses.

**Technical Approach**:
- Replace `await auth.signIn()` with `await auth.loginAsUser()` in 3 test cases
- No changes to the `AuthPageObject` class needed
- Tests will automatically benefit from proper timeout configuration and network diagnostics

**Architecture Changes**: None - this is a test implementation fix

**Migration Strategy**: Direct replacement - tests will work exactly the same way but with proper API wait semantics

## Implementation Plan

### Affected Files

List of files that need modification:

- `apps/e2e/tests/admin/admin.spec.ts` - Replace 2 `signIn()` calls with `loginAsUser()` at lines 155 and 243
- `apps/e2e/tests/team-accounts/team-invitation-mfa.spec.ts` - Verify usage pattern (check if signIn is used in this file)

Note: `apps/e2e/tests/invitations/invitations.spec.ts` does NOT use `signIn()` directly - it uses pre-authenticated states instead, so it does not need changes.

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Identify all failing test methods

Locate the exact test methods and line numbers where `signIn()` is called:

- Admin tests:
  - `Personal Account Management` suite > "ban user flow" (line ~155)
  - `Personal Account Management` suite > "delete team account flow" (line ~243)
- Check `team-invitation-mfa.spec.ts` for any `signIn()` usage

**Why this step first**: We need to ensure we identify all the affected tests before making changes

#### Step 2: Replace signIn() with loginAsUser() in admin tests

Replace the calls in `/apps/e2e/tests/admin/admin.spec.ts`:

**Location 1 (around line 155):**
```typescript
// BEFORE:
await auth.signIn({
  email: testUserEmail,
  password: "password",
});

// AFTER:
await auth.loginAsUser({
  email: testUserEmail,
  password: "password",
});
```

**Location 2 (around line 243):**
```typescript
// BEFORE:
await auth.signIn({
  email: testUserEmail,
  password: "password",
});

// AFTER:
await auth.loginAsUser({
  email: testUserEmail,
  password: "password",
});
```

#### Step 3: Check team-invitation-mfa.spec.ts for signIn usage

Verify if `team-invitation-mfa.spec.ts` contains any direct `signIn()` calls that need to be replaced.

#### Step 4: Verify no other test files use signIn() incorrectly

Run a grep search to ensure no other test files have the same pattern:

```bash
grep -r "await auth\.signIn\(" apps/e2e/tests --include="*.spec.ts"
```

Expected: Should only find the 2 calls we're replacing in admin.spec.ts

#### Step 5: Run the admin tests

Execute the admin tests to verify the fix:

```bash
pnpm test:e2e --grep="Admin"
```

Or run the specific failing shard:

```bash
pnpm test:e2e:shard 4
```

Verify that all 13 tests in the Admin & Invitations shard pass.

## Testing Strategy

### Unit Tests

No unit tests needed - this is a test implementation fix, not production code.

### Integration Tests

No integration tests needed.

### E2E Tests

**Verify these test cases pass after the fix:**

Admin tests:
- ✅ "ban user flow" - Test that users can be banned from admin panel
- ✅ "reactivate user flow" - Test that users can be reactivated
- ✅ "delete user flow" - Test that users can be deleted
- ✅ "can sign in as a user (impersonation)" - Test admin impersonation
- ✅ "delete team account flow" - Test team deletion

Invitation tests:
- ✅ "users-can-delete-invites" - Test deletion of pending invitations
- ✅ "users-can-update-invites" - Test role updates for invitations
- ✅ "can-accept-an-invite" - Test invitation acceptance flow

All 13 tests in the shard should pass.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run full admin test shard: `pnpm test:e2e:shard 4`
- [ ] Verify all 9 previously failing tests now pass
- [ ] Check console output for "Auth API responded" messages (confirms proper API wait)
- [ ] Verify no new timeouts occur
- [ ] Verify no new test failures appear in other shards
- [ ] Run full E2E test suite: `pnpm test:e2e` (verify no regressions)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Timeout in loginAsUser()**: The `loginAsUser()` method has its own timeout handling
   - **Likelihood**: very low (method is proven in other tests)
   - **Impact**: low (same timeout behavior as before, just working correctly)
   - **Mitigation**: The method has comprehensive error logging; failures will be visible

2. **Navigation differences**: `loginAsUser()` has additional navigation logic compared to `signIn()`
   - **Likelihood**: very low (examined source code, navigation is identical)
   - **Impact**: low (parameters are fully configurable)
   - **Mitigation**: Pass the same `next` parameter if needed

**Rollback Plan**:

If this fix causes issues:
1. Revert the changes to admin.spec.ts: `git checkout apps/e2e/tests/admin/admin.spec.ts`
2. Revert any changes to team-invitation-mfa.spec.ts if modified
3. Run tests to confirm rollback: `pnpm test:e2e:shard 4`

**Monitoring** (if needed):

None - this is a test fix, not production code

## Performance Impact

**Expected Impact**: minimal

The fix uses `loginAsUser()` which may have slightly more comprehensive network diagnostics logging, but this does not impact test performance. In fact, tests should pass faster since they won't timeout waiting for an API response that never comes.

## Security Considerations

**Security Impact**: none

This is a test-only fix with no changes to production code or authentication logic.

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Run the admin & invitations test shard
pnpm test:e2e:shard 4

# Expected: 9 tests fail with "Auth API timeout after 15000ms"
```

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# E2E tests - Run the admin & invitations shard
pnpm test:e2e:shard 4

# Expected: All 13 tests pass

# Full E2E test suite (verify no regressions)
pnpm test:e2e

# Expected: All tests pass
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Run specific authentication tests
pnpm test:e2e --grep="Auth|admin|invitation"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses existing `AuthPageObject.loginAsUser()` method, which is already in the codebase.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none (test-only fix)

**Special deployment steps**: None required - this only affects E2E tests, not production code

**Feature flags needed**: No

**Backwards compatibility**: maintained (test implementation detail)

## Success Criteria

The fix is complete when:
- [ ] All 13 tests in admin & invitations shard pass
- [ ] Admin "ban user flow" test passes (was failing)
- [ ] Admin "reactivate user flow" test passes (was failing)
- [ ] Admin "delete user flow" test passes (was failing)
- [ ] Admin "can sign in as a user" test passes (was failing)
- [ ] Admin "delete team account flow" test passes (was failing)
- [ ] Invitation "users-can-delete-invites" test passes (was failing)
- [ ] Invitation "users-can-update-invites" test passes (was failing)
- [ ] Invitation "can-accept-an-invite" test passes (was failing)
- [ ] No new test failures appear
- [ ] Console shows "Auth API responded" messages confirming proper API wait
- [ ] Zero timeout errors in test output
- [ ] pnpm typecheck passes
- [ ] pnpm lint passes
- [ ] Full E2E test suite passes (no regressions)

## Notes

The diagnosis revealed that `loginAsUser()` already exists with the correct implementation pattern. The method uses `Promise.all()` to ensure the response listener is attached before form submission, which prevents the race condition that causes timeouts.

Key insight: In the failing tests, `signIn()` was called and returned immediately without waiting for the API response. Tests then proceeded to access authenticated resources before authentication completed, causing the "Auth API timeout" error. The `loginAsUser()` method solves this by synchronizing the listener attachment with form submission.

This is a straightforward fix that leverages an existing, proven pattern in the codebase.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #768*
