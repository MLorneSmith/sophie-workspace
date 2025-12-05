# Bug Fix: auth-simple.spec.ts Tests Timeout - React Query Hydration Race Condition

**Related Diagnosis**: #927 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: React Query hydration detection in `loginAsUser()` is unreliable, causing form submission to fail silently before the auth API is called
- **Fix Approach**: Replace flaky DOM-based hydration detection with explicit network interception + `toPass()` retry pattern
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Two E2E tests in `auth-simple.spec.ts` consistently timeout waiting for Supabase auth API responses. Network diagnostics show **zero POST requests** to `/auth/v1/token` despite form submission succeeding. The `loginAsUser()` helper detects React Query readiness by checking for `[data-rq-client]` DOM element or `window.__REACT_QUERY__` global variable—neither of which exist in production builds, causing the 1-second fallback delay to be insufficient.

This creates a race condition:
1. Test clears storage state → fresh browser context
2. `signIn()` checks for React Query → detection fails
3. Form submits with only 1s delay (insufficient)
4. React Query mutation handler hasn't initialized yet
5. Form submission triggers before handler is ready
6. Mutation silently fails → no API call made
7. Test times out waiting for response

For full details, see diagnosis issue #927.

### Solution Approaches Considered

#### Option 1: Network Interception + Reliable Wait ⭐ RECOMMENDED

**Description**: Set up request interception BEFORE form submission to detect when the auth endpoint is actually called. This eliminates guessing about React Query readiness—we wait for evidence of the actual operation.

**Implementation**:
```typescript
// Listen for the auth request BEFORE submitting
const authRequestPromise = this.page.waitForResponse(
  resp => resp.url().includes('/auth/v1/token')
);

// Now submit the form
await this.page.fill('input[name="email"]', email);
await this.page.fill('input[name="password"]', password);
await this.page.click('button[type="submit"]');

// Wait for the actual response with retry logic
await expect(async () => {
  const response = await authRequestPromise;
  expect(response.status()).toBe(200);
}).toPass({
  intervals: [500, 1000, 2000, 5000]
});
```

**Pros**:
- No guessing about React Query state—we wait for actual evidence
- Immune to changes in React Query initialization patterns
- Works in both dev and production builds
- Reliable Playwright pattern used industry-wide
- Automatically retries if initial attempt fails

**Cons**:
- Slightly more complex test logic
- Need to handle both success (200) and expected error responses (401)

**Risk Assessment**: low - This is a standard Playwright pattern with proven reliability

**Complexity**: simple - Straightforward network interception pattern

#### Option 2: Increased Fixed Delay

**Description**: Simply increase the hardcoded delay from 1 second to 3 seconds, hoping it's enough for React Query to initialize.

**Pros**:
- Minimal code change
- Quick to implement

**Cons**:
- Still guessing about timing—may fail on slow CI systems
- Adds 2 extra seconds to every sign-in test (slower test suite)
- Doesn't fix the root cause, just masks it
- Fragile: could fail again if CI gets slower
- No retry capability if timing varies

**Why Not Chosen**: This is a band-aid that doesn't solve the fundamental problem. Test timeouts are symptoms of unreliable detection, not timing issues. Adding more time doesn't improve reliability.

#### Option 3: DOM Ready Check with `toPass()` Retry

**Description**: Check for form readiness (button enabled, form handlers attached) with retry logic.

**Pros**:
- More reliable than hydration detection
- Waits for actual form state

**Cons**:
- Still indirect—detecting form readiness doesn't guarantee the mutation handler is initialized
- React Query could initialize after button is enabled but before mutation handler
- More complex than network interception

**Why Not Chosen**: Network interception is more direct and reliable—we wait for the actual operation to occur rather than proxies for readiness.

### Selected Solution: Network Interception + Reliable Wait

**Justification**: This approach is proven, reliable, and doesn't depend on React Query's internal implementation details. By waiting for actual evidence that the auth API is being called, we eliminate the race condition entirely. This is the pattern recommended by Playwright for handling async operations and is less fragile than DOM-based detection.

**Technical Approach**:
- Set up response listener before form submission
- Wrap in `toPass()` with exponential backoff intervals
- Handle both successful responses (200) and expected errors (401) gracefully
- Ensures sign-in doesn't proceed until API call is actually made

**Architecture Changes** (if any):
- None—this is localized to the test helper method
- No changes to application code required

**Migration Strategy** (if needed):
- N/A—test-only change

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/authentication/auth.po.ts:487-600` - Update `loginAsUser()` method to use network interception
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - May need minor adjustments if helper signature changes (likely none)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Understand Current Implementation

Read the current `loginAsUser()` method to understand hydration detection logic.

- Review `apps/e2e/tests/authentication/auth.po.ts:487-600`
- Identify the hydration check (lines 487-520 approximately)
- Note current error handling and retry logic
- Document what the method currently does

**Why this step first**: Must understand existing code before modifying to avoid introducing regressions

#### Step 2: Implement Network Interception Pattern

Replace hydration detection with network-based approach.

- Set up `waitForResponse()` before form submission
- Modify submit logic to wait for actual API call
- Wrap in `toPass()` with exponential backoff: [500, 1000, 2000, 5000] ms
- Handle both 200 (success) and 401 (invalid credentials) responses
- Keep existing error messages for invalid credentials

#### Step 3: Update Helper Method Signature (if needed)

Check if the method signature needs updates.

- If network interception changes async behavior, document it
- Ensure backward compatibility with existing tests
- No changes should be required—this is internal implementation detail

#### Step 4: Add/Update Tests

Add integration test for the new `loginAsUser()` implementation.

- Test successful login with valid credentials
- Test failed login with invalid credentials (401 response)
- Test timeout if no auth request is made (should fail after retries)
- Add regression test: ensure auth API is actually called (not just DOM checks)

#### Step 5: Manual Testing & Verification

Run the failing tests locally to confirm fix.

- Clear browser storage state
- Run `auth-simple.spec.ts:61` locally
- Verify no timeout errors
- Run `auth-simple.spec.ts:107` locally
- Verify session is properly cleared on logout
- Run full auth test suite to check for regressions

## Testing Strategy

### Unit Tests

No unit tests needed for this change—it's a test helper modification, not application code.

### Integration Tests

The E2E tests themselves ARE the integration tests here. Update the failing tests to verify:
- ✅ `user can sign in with valid credentials` - No timeout, successful login
- ✅ `sign out clears session` - No timeout, session properly cleared
- ✅ Network request is verified - Auth API is actually called before proceeding
- ✅ Retry logic works - If first attempt fails, retries on backoff schedule
- ✅ Regression test - Invalid credentials still result in 401, not timeout

### E2E Tests

These ARE the affected E2E tests:

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts:61` - Sign in test
- `apps/e2e/tests/authentication/auth-simple.spec.ts:107` - Sign out test

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm --filter web-e2e test:debug auth-simple` locally
- [ ] Verify `user can sign in with valid credentials` passes without timeout
- [ ] Verify `sign out clears session` passes without timeout
- [ ] Test with fresh browser context (clear storage state)
- [ ] Test in CI environment if possible
- [ ] Verify no new timeout errors appear
- [ ] Run full auth test suite: `pnpm --filter web-e2e test authentication`
- [ ] Check browser console for any auth-related errors
- [ ] Verify login works with different email/password combinations
- [ ] Verify logout properly clears session and authentication state

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Network interception conflicts with other tests**: If other tests in the same file set up their own response listeners, listeners could interfere.
   - **Likelihood**: low
   - **Impact**: medium (test interference)
   - **Mitigation**: Scope listener to specific auth endpoint, check for conflicts with other tests in same file

2. **Timing of response listener setup**: If listener is set up after request is already made, it could miss the response.
   - **Likelihood**: low
   - **Impact**: high (test failure)
   - **Mitigation**: Set up listener BEFORE any form interaction, use proper async/await ordering

3. **Different HTTP status codes**: If Supabase returns unexpected status codes (e.g., 503 on auth endpoint), test could fail.
   - **Likelihood**: low
   - **Impact**: medium (flaky test)
   - **Mitigation**: Handle common error codes (401, 403, 500), log response details for debugging

**Rollback Plan**:

If this fix causes issues in CI:
1. Revert `auth.po.ts` to previous version with hydration detection
2. Tests will return to previous behavior (may timeout but won't break other tests)
3. Increase delay to 3 seconds as interim measure
4. File new bug report with additional CI-specific diagnostics

**Monitoring** (if needed):
- Monitor test duration after fix—should remain unchanged or improve
- Watch for new timeout patterns in CI runs
- Alert if auth API tests fail with status codes other than 200/401

## Performance Impact

**Expected Impact**: none

Network interception adds negligible overhead. Exponential backoff [500, 1000, 2000, 5000] ms provides fast success path (~500ms) while handling slow CI systems.

**Performance Testing**:
- Measure auth test execution time before and after fix
- Should be equivalent or faster (fewer retries due to more reliable detection)

## Security Considerations

**Security Impact**: none

This is a test-only change. No changes to authentication logic or production code.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing tests—should timeout
pnpm --filter web-e2e test auth-simple
```

**Expected Result**: Tests timeout waiting for auth API response, often reaching 30-second timeout

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the previously failing tests
pnpm --filter web-e2e test auth-simple

# Run full authentication test suite
pnpm --filter web-e2e test authentication

# Run all E2E tests
pnpm --filter web-e2e test
```

**Expected Result**: All commands succeed, no timeout errors, auth tests pass consistently

### Regression Prevention

```bash
# Run full E2E suite multiple times to ensure no flakiness
for i in {1..3}; do
  echo "Run $i:"
  pnpm --filter web-e2e test auth-simple || exit 1
done

# Check for any new console errors
pnpm --filter web-e2e test auth-simple --debug 2>&1 | grep -i error
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. Uses existing Playwright `waitForResponse()` and `toPass()` APIs.

### Existing Dependencies Used

- `@playwright/test` - Already in use, uses `waitForResponse()` and `toPass()`
- No additional packages needed

## Database Changes

**Migration needed**: no

No database changes required—this is a test-only change.

## Deployment Considerations

**Deployment Risk**: none

This is a test-only change with zero impact on production code or deployment.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: N/A (tests only)

## Success Criteria

The fix is complete when:
- [ ] `auth-simple.spec.ts:61` passes without timeout
- [ ] `auth-simple.spec.ts:107` passes without timeout
- [ ] Network request verification confirms auth API is actually called
- [ ] Full authentication test suite passes (no regressions)
- [ ] Manual testing checklist complete
- [ ] No new timeout patterns appear in CI runs
- [ ] Test execution time unchanged or improved

## Notes

This fix addresses the core race condition without adding arbitrary delays. The network interception pattern is recommended by Playwright for exactly this type of async operation validation and is more maintainable than hydration detection that depends on internal React Query implementation details.

The exponential backoff retry intervals [500, 1000, 2000, 5000] provide:
- **Fast path**: 500ms for normal cases
- **Retry safety**: Progressive delays for slow systems
- **Total max wait**: 8.5 seconds (well under 30s test timeout)
- **CI-friendly**: Handles variable system load gracefully

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #927*
