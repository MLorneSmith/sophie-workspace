# Bug Fix: E2E Shard 4 Tests Fail Due to Redundant Login Attempts

**Related Diagnosis**: #719
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Tests call `loginAsUser()` or `loginAsSuperAdmin()` on pages already authenticated via pre-loaded storage states, causing immediate redirects and API timeouts
- **Fix Approach**: Remove redundant authentication calls from tests using storage states; let pre-authenticated sessions navigate directly to protected pages
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E shard 4 tests fail because they load pre-authenticated storage states via `AuthPageObject.setupSession()` but then call `loginAsUser()` or `loginAsSuperAdmin()`. When tests navigate to `/auth/sign-in` with an already-authenticated session, the server redirects to `/home` immediately. The test continues waiting for `auth/v1/token` API responses that never arrive, causing 15-120 second timeouts.

**Key Evidence**:
```
[Phase 1] Waiting for Supabase auth/v1/token API response (timeout: 15000ms)...
[Phase 1] ❌ Auth API timeout after 15000ms
Current URL: http://localhost:3001/home    <-- Already at /home, not /auth/sign-in!
```

The URL being `/home` instead of `/auth/sign-in` proves the session is valid and caused an automatic redirect.

For full details, see diagnosis issue #719.

### Solution Approaches Considered

#### Option 1: Remove Redundant Login Calls ⭐ RECOMMENDED

**Description**: Remove `loginAsUser()` or `loginAsSuperAdmin()` calls from tests that already use `setupSession()` to load pre-authenticated storage states. Tests should navigate directly to protected pages instead of going through the authentication flow.

**Pros**:
- Simplest fix with minimal code changes
- Eliminates all race conditions and timeouts
- Preserves existing authentication session setup patterns
- No impact on other tests or functionality
- Clear and maintainable: storage states are loaded, no redundant auth attempts

**Cons**:
- Requires understanding which tests have redundant calls
- Changes test structure slightly (less explicit auth flow)

**Risk Assessment**: low - Only removes code that's causing failures; nothing is broken by this approach.

**Complexity**: simple - Straightforward removal of problematic method calls.

#### Option 2: Detect Pre-Authenticated Sessions in loginAsUser()

**Description**: Modify `loginAsUser()` and `loginAsSuperAdmin()` to detect if a session is already authenticated and skip the sign-in flow if so.

**Pros**:
- Defensive approach that handles both cases
- Makes the methods more robust for future use

**Cons**:
- More complex implementation
- Adds runtime overhead to every login call
- Masks the underlying issue rather than fixing it
- Harder to debug if issues arise

**Why Not Chosen**: This approach hides the root cause. Tests should be explicit about whether they're using pre-authenticated sessions or performing authentication. The redundant calls indicate a test design issue that should be fixed directly, not hidden.

#### Option 3: Use Separate Methods for Pre-Authenticated Tests

**Description**: Create new methods like `navigateAsAuthenticatedUser()` that assume session is already loaded and navigate directly to protected pages.

**Pros**:
- Makes test intent clearer
- Prevents accidental redundant auth calls in the future

**Cons**:
- Requires more code changes
- Duplicates methods with different names
- More boilerplate for tests

**Why Not Chosen**: Option 1 is simpler and achieves the same goal. Adding new methods adds unnecessary complexity when the issue is simply calling the wrong method.

### Selected Solution: Remove Redundant Login Calls

**Justification**: The diagnosis identified exactly where the problem is: tests using `setupSession()` shouldn't also call login methods. This is a simple fix that removes code causing failures. The issue is test design, not missing functionality. Removing the redundant calls is the most direct, maintainable solution.

**Technical Approach**:
1. In `admin.spec.ts`: Remove `loginAsUser()` / `loginAsSuperAdmin()` calls from tests that use `AuthPageObject.setupSession()`
2. In `invitations.spec.ts`: Remove `loginAsUser()` call from the "Full Invitation Flow" test that uses `setupSession()`
3. Allow tests to navigate directly to protected pages using the pre-authenticated session
4. Tests that need to perform actual authentication (like sign-out → sign-in flows) continue using login methods

**Architecture Changes** (if any):
- No architectural changes needed
- Tests follow existing patterns more correctly
- Improves clarity: storage state setup = pre-authenticated, login methods = perform auth flow

**Migration Strategy** (if needed):
- No data migration needed
- Simple code removal in test files
- All sessions remain valid; no session handling changes

## Implementation Plan

### Affected Files

- `apps/e2e/tests/admin/admin.spec.ts` - Remove redundant login calls from admin tests
- `apps/e2e/tests/invitations/invitations.spec.ts` - Remove redundant login call from full invitation flow test

### New Files

None needed - this is a test fix, not a feature.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix admin.spec.ts - Remove redundant auth calls from pre-authenticated tests

The test file uses `AuthPageObject.setupSession()` to load storage states but then navigates directly to protected pages. The setup is correct; the problem is the test structure shouldn't have login calls.

**Current problem pattern** (lines 102-141 in admin.spec.ts):
```typescript
test("ban user flow", async ({ page }) => {
  // Already authenticated via setupSession in beforeEach
  // No login needed - go directly to admin page or use admin flow

  // ❌ WRONG: This shouldn't be here if using setupSession
  await auth.loginAsUser({ email: testUserEmail, password: ... });

  // Then tries to wait for auth/v1/token API response that never comes
})
```

**Specific actions**:
- Review `admin.spec.ts` test structure (lines 59-147 show the issue)
- In the "ban user flow" test (line 102+), the test calls `createUser()` and `filterAccounts()` which navigate pages
- The `beforeEach` already sets up the session via `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)`
- Tests can navigate directly to `/admin/accounts` - no auth flow needed
- Remove any `loginAsUser()` or `loginAsSuperAdmin()` calls that appear within tests in this file

**Why this step first**: The admin tests fail because of this redundant auth pattern. Fixing it unblocks the entire admin test suite.

#### Step 2: Fix invitations.spec.ts - Remove redundant auth call from full invitation flow test

The "Full Invitation Flow" test (lines 101-150) calls `loginAsUser()` on line 111, but this test doesn't use `setupSession()` - it's legitimately performing authentication. However, the issue is this test is in a separate `test.describe()` block without storage state setup, so it's actually correct to call `loginAsUser()`.

Wait - re-reading the code: the test at line 101 **does not** use `setupSession()`. It's in a separate test.describe block (line 100) that doesn't have storage state. So this test's `loginAsUser()` call is **correct** and should not be removed.

**Specific actions**:
- Review lines 6-98 (main "Invitations" test.describe block) - these use `setupSession(AUTH_STATES.TEST_USER)`
- All tests in this block (lines 26-97) should NOT have login calls - they use pre-authenticated sessions
- Review each test to confirm none call `loginAsUser()` or `loginAsSuperAdmin()`
- Confirm tests navigate directly to protected pages

**Why this step second**: After fixing admin.spec.ts, we verify invitations.spec.ts is correct or fix any similar issues.

#### Step 3: Add/update tests for pre-authenticated session behavior

Update or create regression tests to ensure:
- Tests using `setupSession()` can navigate directly to protected pages
- Pre-authenticated sessions don't cause redirects when navigating to `/auth/sign-in`
- Login methods work correctly when NOT using pre-authenticated sessions

**Specific actions**:
- Review existing test coverage for authentication flows
- Confirm tests cover both patterns: pre-authenticated (via setupSession) and active auth flow (via login methods)
- No new test files needed; just verify test coverage is adequate

#### Step 4: Validation

Run tests and verify all timeouts are resolved.

**Why this step last**: Confirms the fix works completely across all affected tests.

## Testing Strategy

### Unit Tests

None needed - this is a test file fix, not application code change.

### Integration Tests

None needed - this is a test file fix, not application code change.

### E2E Tests

The fix IS in the E2E tests themselves. Run the full shard 4 test suite to verify fixes:

**Test files**:
- `apps/e2e/tests/admin/admin.spec.ts` - All admin tests should now pass
- `apps/e2e/tests/invitations/invitations.spec.ts` - All invitation tests should now pass

### Manual Testing Checklist

Execute these tests before considering the fix complete:

- [ ] Run shard 4 tests: `pnpm test:e2e --shard=4/4`
- [ ] Verify all 8 tests pass (currently 2 pass, 6 fail)
- [ ] Confirm no API timeouts in console output
- [ ] Check for no "auth/v1/token" timeout errors
- [ ] Verify tests complete in reasonable time (<120s per test)
- [ ] Check for any new regressions in other shards

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Accidental removal of legitimate auth calls**: Could break tests that actually need to perform authentication
   - **Likelihood**: low - We're only removing calls that follow setupSession() usage
   - **Impact**: low - If removed incorrectly, tests will fail immediately and be obvious
   - **Mitigation**: Carefully review each method call; only remove those paired with setupSession(); examine test flow

2. **Pre-authenticated sessions expiring during test**: Though unlikely, sessions could theoretically expire
   - **Likelihood**: very low - Tests run quickly, sessions valid for duration
   - **Impact**: low - Test would fail with clear indication of session expiration
   - **Mitigation**: Sessions are properly set up for test duration; no additional handling needed

3. **Other tests depending on the current behavior**: Could be masked by this fix
   - **Likelihood**: low - We're fixing tests that are clearly broken (timeouts)
   - **Impact**: low - Any issues would be obvious failures
   - **Mitigation**: Run full E2E test suite after fix to check for new failures

**Rollback Plan**:

If issues arise after this fix:
1. Revert the changes to admin.spec.ts and invitations.spec.ts
2. The tests will return to previous state (with timeouts but code-wise unchanged)
3. Investigate the specific test failure with more context

**Monitoring** (if needed):
- Monitor E2E test pass rates after deployment
- Watch for any unexpected auth-related timeouts in subsequent test runs
- Alert on >50% shard 4 test failure rate

## Performance Impact

**Expected Impact**: minimal but positive

The fix removes unnecessary API calls and waits:
- Removes 6 failed timeout waits (each up to 120 seconds)
- Eliminates redundant navigation and form submission
- Tests complete faster
- Less CI infrastructure load

**Estimated time savings**: 6 tests × ~90-120s per timeout = ~540-720s per test run (9-12 minutes)

## Security Considerations

No security implications. This is a test file change that:
- Uses existing, validated authentication patterns
- Maintains proper session isolation via storage states
- Doesn't change production code
- Doesn't modify authentication logic

**Security Impact**: none

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Run shard 4 tests - should see failures
pnpm test:e2e --shard=4/4

# Expected result:
# - 2/8 tests pass (Admin Dashboard auth flow, non-admin access)
# - 6/8 tests fail with timeouts or element not found errors
# - Test logs show "Auth API timeout after 15000ms" with URL showing /home instead of /auth/sign-in
```

**Expected Result**: 6 tests timeout/fail with auth-related errors; console shows redirects to /home during sign-in attempt.

### After Fix (Bugs Should Be Resolved)

```bash
# Type check (no changes to application code, but verify no regressions)
pnpm typecheck

# Lint test files (ensure code quality)
pnpm lint apps/e2e/tests/admin/admin.spec.ts apps/e2e/tests/invitations/invitations.spec.ts

# Format test files
pnpm format apps/e2e/tests/admin/admin.spec.ts apps/e2e/tests/invitations/invitations.spec.ts

# Run the fixed shard 4 tests
pnpm test:e2e --shard=4/4

# Run full E2E test suite to check for regressions
pnpm test:e2e

# Verify build succeeds
pnpm build
```

**Expected Result**: All shard 4 tests pass (8/8), no regressions in other shards, full E2E suite passes.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no side effects
pnpm test:e2e

# Check all shards pass
pnpm test:e2e --shard=1/4
pnpm test:e2e --shard=2/4
pnpm test:e2e --shard=3/4
pnpm test:e2e --shard=4/4
```

## Dependencies

No new dependencies required.

## Database Changes

**No database changes required** - this is a test file fix.

## Deployment Considerations

**Deployment Risk**: none - This is a test file change only.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: N/A - Test files are not part of production deployment.

## Success Criteria

The fix is complete when:
- [ ] All 8 tests in shard 4 pass (0 failures)
- [ ] No "auth/v1/token timeout" errors in test output
- [ ] Tests complete in reasonable time (<120s each)
- [ ] Full E2E test suite passes (all shards)
- [ ] No regressions in other E2E tests
- [ ] Code formatting and linting pass
- [ ] TypeScript type checking passes

## Notes

### Key Insights from Diagnosis

The diagnosis clearly identified the issue: tests use `setupSession()` to load pre-authenticated storage states, but then call `loginAsUser()` which attempts to navigate to `/auth/sign-in` and authenticate. With an active session, the auth page immediately redirects to `/home`, and the authentication flow never completes.

The fix is straightforward: remove the redundant login calls. Tests that use `setupSession()` should navigate directly to protected pages using the pre-authenticated session.

### Implementation Order

1. Fix admin.spec.ts (simpler, more obvious redundant calls)
2. Review invitations.spec.ts (verify it doesn't have similar issues)
3. Run full E2E suite to verify no regressions
4. Commit changes with test results

### Related Patterns

This diagnosis and fix teach us the correct patterns:
- **Pattern 1 (Pre-authenticated)**: Use `AuthPageObject.setupSession()` → Navigate directly to protected pages
- **Pattern 2 (Active auth)**: Don't use `setupSession()` → Call `loginAsUser()` or `loginAsSuperAdmin()` → Navigate

Tests should clearly use one pattern, not mix both.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #719*
