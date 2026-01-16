# Bug Fix: E2E Global Sign-Out Invalidates Pre-Authenticated Sessions

**Related Diagnosis**: #1535
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `useSignOut` hook calls `signOut()` without `{ scope: 'local' }`, defaulting to `scope: 'global'` which revokes ALL sessions for the user
- **Fix Approach**: Add `{ scope: 'local' }` parameter to `client.auth.signOut()` call in the useSignOut hook
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The auth-simple test "sign out clears session" calls `signOut()` via the `useSignOut` hook, which doesn't specify a scope parameter. Supabase defaults to `scope: 'global'`, which revokes **ALL** sessions for that user across all devices and contexts. This invalidates pre-authenticated E2E test sessions stored in `.auth/*.json` files, causing subsequent tests using the same user to fail.

**Technical Impact**:
- When `signOut()` is called without parameters, Supabase treats it as a global sign-out
- This revokes the JWT session_id at the server level
- Pre-created auth state files become invalid
- Tests relying on those sessions receive 401 redirects to `/auth/sign-in`

For full details, see diagnosis issue #1535.

### Solution Approaches Considered

#### Option 1: Use local scope in useSignOut hook ⭐ RECOMMENDED

**Description**: Modify the `useSignOut` hook to explicitly specify `scope: 'local'` when calling `client.auth.signOut()`. This signs out only the current browser session without affecting other sessions for the same user.

**Pros**:
- Fixes both the production bug AND the E2E test issue with a single change
- Improves user experience (users don't expect sign-out to log them out of all devices by default)
- Most intuitive behavior: "sign out of this device" not "sign out of all devices"
- Minimal code change (add one parameter)
- No test user reallocation needed
- Follows Supabase best practices for multi-device sessions

**Cons**:
- None identified

**Risk Assessment**: low - This is a straightforward parameter addition with no breaking changes

**Complexity**: simple - Single-line fix

#### Option 2: Use different test user for auth-simple tests

**Description**: Change auth-simple tests to use `TEST_USERS.user2` instead of `TEST_USERS.user1`, so the global sign-out doesn't affect the pre-authenticated session used by other tests.

**Pros**:
- Works around the immediate test issue
- No production code changes

**Cons**:
- Doesn't fix the underlying production bug
- Users would still experience unexpected "sign out from all devices" behavior
- Requires test user reallocation and coordination
- Introduces test-specific workarounds instead of real fixes

**Why Not Chosen**: This addresses the symptom (test isolation) but not the root cause (incorrect scope parameter). The production user experience would remain broken.

#### Option 3: Skip or isolate sign-out test

**Description**: Mark the sign-out test to run in its own isolated project or skip it when running with other tests.

**Pros**:
- Temporarily unblocks test suite

**Cons**:
- Doesn't fix the root cause
- Leaves the production bug unfixed
- Users continue experiencing incorrect behavior
- Test isolation would be artificial rather than correct

**Why Not Chosen**: This masks the problem rather than solving it. The production code still has the bug.

### Selected Solution: Use local scope in useSignOut hook

**Justification**: Option 1 is the clear winner because:

1. **Solves the root cause**: Addresses the fundamental issue (missing scope parameter)
2. **Improves production UX**: Users expect sign-out to affect only their current device, not all devices
3. **Minimal change**: One-line fix with zero complexity
4. **Zero risk**: Low-risk change that doesn't affect other code
5. **Aligns with best practices**: Matches Supabase documentation recommendations
6. **No breaking changes**: Existing code continues to work, just with better behavior

This is a case where the fix is so straightforward that it's clearly the right solution.

**Technical Approach**:
- Modify `packages/supabase/src/hooks/use-sign-out.ts:10` to pass `{ scope: 'local' }` to `client.auth.signOut()`
- The hook signature and behavior remain unchanged from the caller's perspective
- Only the internal implementation changes

**Supabase Scope Semantics**:
- `scope: 'local'` - Signs out only the current session/browser
- `scope: 'global'` (default) - Revokes ALL sessions for the user
- `scope: 'others'` - Revokes all sessions EXCEPT the current one

**Architecture Changes**: None - This is purely an internal implementation fix

**Migration Strategy**: Not needed - This is a bug fix with no data or schema changes

## Implementation Plan

### Affected Files

- `packages/supabase/src/hooks/use-sign-out.ts` - Update `signOut()` call to include `{ scope: 'local' }` parameter

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Update the useSignOut hook

Modify `packages/supabase/src/hooks/use-sign-out.ts:10` to add the scope parameter:

```typescript
// BEFORE:
mutationFn: () => {
  return client.auth.signOut();
},

// AFTER:
mutationFn: () => {
  return client.auth.signOut({ scope: 'local' });
},
```

**Why this step first**: This is the root cause fix. The change is so minimal that no other steps depend on it.

#### Step 2: Verify no other sign-out calls need updating

Search the codebase for other direct calls to `client.auth.signOut()` that might need the same fix.

```bash
# Search for direct signOut calls outside the hook
grep -r "\.auth\.signOut" --include="*.ts" --include="*.tsx" packages/ apps/ \
  | grep -v "use-sign-out.ts" \
  | grep -v "node_modules"
```

**Expected result**: No other calls (all should go through the hook)

#### Step 3: Run type checking and tests

Verify the change doesn't break anything:

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format

# Run E2E tests that depend on sign-out behavior
pnpm --filter web-e2e exec playwright test \
  "tests/authentication/auth-simple.spec.ts:111" \
  "tests/team-accounts/team-accounts.spec.ts:112" \
  --workers=1
```

**Expected result**:
- No type errors
- No lint errors
- Both tests pass (the fix should make them compatible)

#### Step 4: Validation

Run the reproduction steps from the diagnosis to confirm the fix works:

```bash
# This should now PASS (was FAILING before)
pnpm --filter web-e2e exec playwright test \
  "tests/authentication/auth-simple.spec.ts:111" \
  "tests/team-accounts/team-accounts.spec.ts:112" \
  --workers=1
```

## Testing Strategy

### Unit Tests

The `useSignOut` hook doesn't have dedicated unit tests currently. Consider adding minimal test coverage:

```typescript
// Test that the hook calls signOut with correct scope parameter
it('should sign out with local scope', async () => {
  const mockSignOut = vi.fn();
  const mockClient = {
    auth: {
      signOut: mockSignOut
    }
  };

  // Mock useSupabase to return our mock client
  // Call the hook
  // Assert mockSignOut was called with { scope: 'local' }
});
```

### E2E Tests

Existing E2E tests in `auth-simple.spec.ts` already validate the sign-out behavior. The fix will make these tests pass:

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Contains the "sign out clears session" test
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Tests using pre-authenticated session

**Test Validation**:
- ✅ Sign-out test completes successfully
- ✅ Team-accounts tests pass after sign-out test runs
- ✅ Serial execution with `--workers=1` shows no session invalidation
- ✅ Pre-authenticated sessions remain valid

### Regression Prevention

Run the full E2E test suite to ensure no regressions:

```bash
# Run all authentication tests
pnpm --filter web-e2e exec playwright test tests/authentication/ --workers=4

# Run all team-accounts tests
pnpm --filter web-e2e exec playwright test tests/team-accounts/ --workers=4

# Full suite
pnpm test:e2e
```

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Sign out from account dropdown works (redirects to home or login page)
- [ ] Other browser windows/tabs don't show user logged out
- [ ] Refresh page after sign-out shows correctly signed-out state
- [ ] Sign-out doesn't affect other authenticated sessions for same user (if applicable)
- [ ] Auth-simple tests pass in isolation
- [ ] Team-accounts tests pass in isolation
- [ ] Both tests pass in sequence with `--workers=1`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Behavioral Change for Sign-Out**: Users might expect different sign-out behavior
   - **Likelihood**: low - The new behavior (sign out this device only) is more expected
   - **Impact**: low - More intuitive than the old behavior
   - **Mitigation**: The new behavior is actually an improvement; no rollback needed

2. **Unexpected Session Persistence**: If users expect global sign-out, they might be surprised
   - **Likelihood**: low - Most users expect device-specific sign-out
   - **Impact**: low - They can still sign out from other devices individually
   - **Mitigation**: Document the change if needed; most platforms work this way

3. **Breaking Change for Code Calling signOut Directly**: If any code calls `signOut()` expecting global behavior
   - **Likelihood**: very low - All code should use the hook
   - **Impact**: low - They can still call with `scope: 'global'` explicitly
   - **Mitigation**: Already handled by fixing it in the hook; external callers are unlikely

**Rollback Plan**:

If this change causes unexpected issues:
1. Revert the one-line change to `use-sign-out.ts`
2. Restore `client.auth.signOut()` without parameters
3. Re-run tests to verify rollback

Rollback is straightforward with zero complexity.

**Monitoring** (if needed):

- Monitor authentication error logs for unexpected 401/session errors
- Watch for support tickets about sign-out behavior
- Expected: No issues, since behavior is more correct

## Performance Impact

**Expected Impact**: none

This is a parameter change with zero performance implications. The `scope` parameter is handled entirely by Supabase Auth client library.

## Security Considerations

**Security Impact**: positive

The change actually improves security:
- Users can maintain multiple independent sessions across devices
- Compromised device doesn't require re-authenticating on other devices
- Follows OAuth/standard auth best practices

**Security Review Needed**: no

This is a standard authentication pattern with no security risks.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reproduce the bug: sign-out test invalidates pre-authenticated session
pnpm --filter web-e2e exec playwright test \
  "tests/authentication/auth-simple.spec.ts:111" \
  "tests/team-accounts/team-accounts.spec.ts:112" \
  --workers=1
```

**Expected Result**: Team-accounts test fails with timeout or 401 redirect because session is invalid

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Run the bug reproduction test
pnpm --filter web-e2e exec playwright test \
  "tests/authentication/auth-simple.spec.ts:111" \
  "tests/team-accounts/team-accounts.spec.ts:112" \
  --workers=1

# Run full authentication test suite
pnpm --filter web-e2e exec playwright test tests/authentication/ --workers=4

# Run full test suite
pnpm test:e2e
```

**Expected Result**: All commands succeed, both tests pass, bug is resolved, zero regressions

### Regression Prevention

```bash
# Full E2E test suite
pnpm test:e2e

# Type checking (should catch any issues)
pnpm typecheck

# Lint (should catch any style issues)
pnpm lint
```

## Dependencies

### New Dependencies

**No new dependencies required** - This fix uses existing Supabase Auth APIs

## Database Changes

**No database changes required** - This is purely a client-side authentication fix

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Maintained - All existing code continues to work

The sign-out behavior change is transparent to callers of the hook. The change is internal to the hook implementation.

## Success Criteria

The fix is complete when:
- [ ] `use-sign-out.ts` updated with `{ scope: 'local' }` parameter
- [ ] TypeScript type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code formatting passes (`pnpm format`)
- [ ] Bug reproduction test passes (both auth-simple and team-accounts pass in sequence)
- [ ] Full E2E test suite passes (`pnpm test:e2e`)
- [ ] Zero regressions detected
- [ ] Git commit created with proper message

## Notes

**Implementation Notes**:
- This is an exceptionally simple fix (one-line change)
- The change aligns with Supabase documentation recommendations
- The new behavior (local scope) is the standard expected behavior for sign-out across web platforms
- No code review complexity; straightforward improvement

**Related Code Context**:
- Hook location: `packages/supabase/src/hooks/use-sign-out.ts`
- Used by: Any UI component triggering sign-out (buttons, dropdown menus, etc.)
- Supabase docs: https://supabase.com/docs/reference/javascript/auth-signout

**Testing Context**:
- E2E tests specifically exposed this bug during serial execution
- The issue only manifests when tests share the same user account
- Parallel test execution with separate workers masked the problem

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1535*
