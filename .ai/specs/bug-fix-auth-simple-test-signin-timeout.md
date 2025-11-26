# Bug Fix: auth-simple.spec.ts sign-in test navigation timeout

**Related Diagnosis**: #702
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `signIn()` method submits the form but does NOT wait for the Supabase auth API response. The test immediately waits for navigation that depends on that response, causing a timeout.
- **Fix Approach**: Replace `signIn()` calls with `loginAsUser()` in the failing test, which properly awaits the auth API response before waiting for navigation.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test "user can sign in with valid credentials" in `auth-simple.spec.ts` fails with a 30-second timeout. The test successfully fills credentials and submits the form (button shows "Signing in..."), but navigation never occurs because the Supabase auth API response is not being awaited properly.

The `signIn()` method is designed for UI interaction only - it submits the form and returns without waiting for the API response. The test then immediately waits for URL navigation that depends on that API response completing, creating a race condition where navigation is expected before the API has responded.

For full details, see diagnosis issue #702.

### Solution Approaches Considered

#### Option 1: Use `loginAsUser()` instead of `signIn()` ⭐ RECOMMENDED

**Description**: Replace the direct `signIn()` call with the existing `loginAsUser()` method, which properly coordinates:
1. Setting up a listener for the Supabase auth API response
2. Submitting the form with `signIn()` in parallel
3. Waiting for the auth API response to complete
4. Then waiting for navigation

**Pros**:
- Minimal code change (single line replacement)
- Proven to work reliably (used in multiple other tests)
- Eliminates the race condition completely
- Better aligns with test best practices (API awareness)
- No infrastructure changes needed

**Cons**:
- Removes direct testing of the `signIn()` UI interaction in this one test
- Slightly less "isolated" but more realistic

**Risk Assessment**: low - The method is already battle-tested in the codebase with extensive logging and error handling.

**Complexity**: simple - Single method call replacement.

#### Option 2: Add explicit API response waiting to the existing test

**Description**: Modify the test to set up a listener for the auth API response before calling `signIn()`, then wait for that response before waiting for navigation.

**Pros**:
- Keeps the `signIn()` method call (more isolated test)
- Teaches the test about the async nature of authentication

**Cons**:
- More boilerplate code in the test
- Duplicates the logic already encapsulated in `loginAsUser()`
- Less maintainable (if auth API endpoint changes, need to update this test too)
- Creates inconsistency with other authentication tests

**Why Not Chosen**: Over-engineering the test. The `loginAsUser()` method already handles this correctly and is designed for exactly this scenario. Duplicating its logic would violate DRY principles.

#### Option 3: Increase timeouts to mask the race condition

**Description**: Increase the `waitForURL()` timeout to 60+ seconds hoping the API eventually responds.

**Cons**:
- Doesn't fix the root cause - just masks it
- Makes tests slower and more brittle
- Doesn't address the underlying race condition
- Fails to align with test best practices

**Why Not Chosen**: Poor practice - timeout increases hide problems rather than solving them.

### Selected Solution: Use `loginAsUser()` in the failing test

**Justification**: The `loginAsUser()` method is specifically designed to handle the complete authentication flow including proper async coordination. It's already proven to work reliably in other tests. Replacing the failing test's `signIn()` call with `loginAsUser()` is a surgical fix that eliminates the race condition without introducing unnecessary complexity or duplicating existing logic.

**Technical Approach**:
- The test already follows the same pattern as other passing sign-in tests (goToSignIn, sign-in method, waitForURL)
- `loginAsUser()` internally calls `signIn()` for the UI interaction, then properly awaits the API response and navigation
- This maintains the same test coverage while fixing the timing issue
- The method includes comprehensive logging and error diagnostics for troubleshooting

**Architecture Changes** (if any):
- None - Using existing infrastructure

**Migration Strategy** (if needed):
- None - This is a test-only change

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/authentication/auth-simple.spec.ts:56-82` - Replace `signIn()` call with `loginAsUser()` in the failing test

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update the failing test method

Modify the test "user can sign in with valid credentials" to use `loginAsUser()` instead of the lower-level `signIn()` method.

- Replace the `signIn()` call with `loginAsUser()` call
- Remove the explicit `waitForURL()` call (handled by `loginAsUser()`)
- Verify the test structure remains valid (AAA pattern maintained)

**Why this step first**: This is the only code change needed to fix the bug.

#### Step 2: Run the failing test to verify the fix

Execute the failing test in isolation to confirm it now passes:

- Run `/test 2` or specifically run `apps/e2e/tests/authentication/auth-simple.spec.ts`
- Verify the "user can sign in with valid credentials" test passes
- Check that the test completes without timeout
- Verify navigation to `/home` or `/onboarding` succeeds

#### Step 3: Run all authentication tests to verify no regressions

Ensure the change doesn't break other tests:

- Run the full authentication test suite: `pnpm --filter e2e test:shard2`
- Verify all tests pass
- Check for any flaky tests or new failures

#### Step 4: Code quality checks

Run linting and formatting to ensure code quality:

- Run `pnpm typecheck` to verify no type errors
- Run `pnpm lint` to check for linting issues
- Run `pnpm format` to check formatting

## Testing Strategy

### Unit Tests

No unit tests needed - this is an E2E test fix.

### Integration Tests

No new integration tests needed.

### E2E Tests

The fix is validated by the existing failing E2E test:

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts:56-82` - "user can sign in with valid credentials"

The test previously failed with a 30-second timeout. After the fix:
- Test should complete successfully
- Navigation to `/home` or `/onboarding` should succeed
- No timeouts should occur

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/test 2` and verify the failing test now passes
- [ ] Run full authentication test suite and verify no regressions
- [ ] Check test execution time (should be consistent with other sign-in tests)
- [ ] Verify no new console errors or warnings in test output
- [ ] Review the test output logs to confirm proper flow

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test becomes less isolated**: The test now uses a higher-level method that includes API response waiting.
   - **Likelihood**: low (intentional design)
   - **Impact**: low (increases realism of the test)
   - **Mitigation**: This is actually an improvement - the test now properly validates the complete authentication flow

2. **Behavioral change in related methods**: If `loginAsUser()` has any side effects not present in `signIn()`.
   - **Likelihood**: low (method is documented and widely used)
   - **Impact**: low (method already used in other passing tests)
   - **Mitigation**: Run full authentication test suite to verify

3. **Timeout mismatch if API is slow**: If the API takes longer than expected in some environments.
   - **Likelihood**: low (loginAsUser uses configurable test timeouts)
   - **Impact**: medium (test would fail in that environment)
   - **Mitigation**: `loginAsUser()` uses `testConfig` timeouts which are already calibrated for CI and local environments (90s CI, 30s local)

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the test to use `signIn()` + `waitForURL()` (original code)
2. The original test would fail again but wouldn't impact production code
3. Create a new issue to investigate the root cause more deeply

**Monitoring** (if needed):
- Monitor E2E test suite execution time (should remain consistent)
- Monitor test pass/fail rate for authentication tests (should improve)

## Performance Impact

**Expected Impact**: minimal

The test execution time should remain roughly the same. `loginAsUser()` internally calls `signIn()` so the user-facing behavior is identical. The only difference is that we now properly wait for the API response before waiting for navigation, which is already happening - we're just making it explicit in the test code.

**Performance Testing**:
- Compare execution time before and after fix using `/test 2`
- Expected: roughly equivalent (within 5% variance)

## Security Considerations

No security implications - this is a test fix only, not a production code change.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing test in isolation
pnpm --filter e2e test -- --grep "user can sign in with valid credentials"
```

**Expected Result**: Test fails with timeout error after 30 seconds, button remains in "Signing in..." state.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Run the specific test
pnpm --filter e2e test -- --grep "user can sign in with valid credentials"

# Run full auth test shard
pnpm test:e2e 2

# Manual verification - start the development server and manually test sign-in
pnpm dev
# Navigate to http://localhost:3000/auth/sign-in in browser
# Sign in with valid credentials (check TEST_USERS in helpers)
# Verify navigation to /home or /onboarding
```

**Expected Result**:
- All commands succeed without errors
- The "user can sign in with valid credentials" test passes
- Test completes in reasonable time (< 30 seconds)
- Navigation to home/onboarding succeeds
- Full authentication test suite passes

### Regression Prevention

```bash
# Run full authentication test suite to ensure no regressions
pnpm test:e2e 2

# Run full E2E suite if time permits
pnpm test:e2e
```

## Dependencies

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: none

This is a test-only change. No impact on production code or infrastructure.

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (test-only change)

## Success Criteria

The fix is complete when:
- [ ] The failing test "user can sign in with valid credentials" passes
- [ ] All authentication tests pass (full suite)
- [ ] Test execution time remains reasonable
- [ ] No regressions in other E2E tests
- [ ] Code quality checks pass (typecheck, lint, format)
- [ ] The fix properly handles the async authentication flow

## Notes

This is a straightforward test fix that replaces a lower-level method call with a higher-level method that properly coordinates async operations. The `loginAsUser()` method was designed for exactly this scenario and includes comprehensive error handling and logging.

The root cause is a race condition between form submission and navigation expectations. By using `loginAsUser()`, we properly sequence:
1. Set up API response listener
2. Submit form
3. Wait for API response (CRITICAL - prevents race condition)
4. Wait for navigation

This is a proven pattern used successfully in other test methods in the same codebase.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #702*
