# Bug Fix: E2E Test Failures - Auth Timeout and Missing Error Element

**Related Diagnosis**: #987 (REQUIRED)
**Severity**: medium
**Bug Type**: testing
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: (1) Auth API response timeout too short for edge cases (5000ms); (2) Missing translation key for banned user error message
- **Fix Approach**: Increase `short` timeout and add missing translation key with improved error message assertion pattern
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Two E2E tests are failing intermittently in local test runs with a 99.8% pass rate (941/943):

1. **"user can sign in with valid credentials"** fails with auth API timeout (5000ms per-attempt timeout too short for edge cases)
2. **"ban user flow"** fails because `data-testid="auth-error-message"` element is not visible when a banned user tries to sign in

Both failures are timing/flakiness issues rather than actual functionality bugs.

For full details, see diagnosis issue #987.

### Solution Approaches Considered

#### Option 1: Increase Timeout and Add Translation Key ⭐ RECOMMENDED

**Description**:
- Increase the `short` timeout in `test-config.ts` from 5000ms to 8000ms (60% increase to handle edge cases)
- Add the missing `user_banned` translation key to `auth.json`
- Update the ban user test to use `toPass()` pattern for better reliability

**Pros**:
- Surgical fix addresses both root causes directly
- Minimal code changes with zero impact on other tests
- 8000ms still reasonable for CI/local execution (not excessive)
- `toPass()` pattern aligns with Playwright best practices for flaky operations
- Translation key improves localization coverage

**Cons**:
- Doesn't address potential underlying hydration race conditions (but documented as existing pattern)
- Timeouts are band-aids for timing issues (though documented as intentional in code)

**Risk Assessment**: low - timeout increase is conservative, translation addition is purely additive

**Complexity**: simple - only configuration changes and translation addition

#### Option 2: Refactor Auth Flow with Explicit Hydration Checks

**Description**:
- Add explicit React Query hydration checks before form submission
- Implement custom retry logic with state validation
- More comprehensive but invasive changes

**Why Not Chosen**:
- Over-engineering for the problem scope
- Requires changes to auth flow logic and test utilities
- Higher risk of introducing new bugs
- 99.8% pass rate indicates current approach works in production
- Code comments already document hydration race condition as known pattern

#### Option 3: Rewrite Ban User Test with Conditional Logic

**Description**:
- Add special error message detection for banned users with fallbacks
- Implement custom assertion helper for banned user flows

**Why Not Chosen**:
- Adds complexity to test code
- Doesn't fix the root cause (missing translation key)
- Workarounds fragile test assertions instead of fixing the underlying issue

### Selected Solution: Increase Timeout and Add Translation Key

**Justification**: This approach directly addresses both root causes identified in the diagnosis with minimal changes, zero breaking changes, and low risk. The timeout increase is conservative (5s → 8s, 60% increase) and aligns with existing Playwright patterns documented in code. The missing translation key is purely additive and improves the application's localization coverage.

**Technical Approach**:

1. **Timeout Configuration** (`apps/e2e/tests/utils/test-config.ts:66`):
   - Increase `short: 5000` → `short: 8000` in both CI and local environments
   - This affects `page.waitForResponse` and form field waits in `loginAsUser`
   - 8 seconds accommodates:
     - Cold starts on CI runners
     - Network latency (Supabase, auth providers)
     - React Query hydration edge cases
     - Database query delays

2. **Translation Key** (`apps/web/public/locales/en/auth.json`):
   - Add missing `user_banned` key with appropriate error message
   - Matches the translation key referenced in the ban user test error assertion

3. **Test Assertion Pattern** (`apps/e2e/tests/admin/admin.spec.ts:202-205`):
   - Replace direct `.toBeVisible()` with `toPass()` pattern for resilience
   - Handles React state update timing races
   - Aligns with Playwright best practices (documented in e2e-testing.md)

**Architecture Changes**: None - these are configuration and translation additions, not architectural changes.

**Migration Strategy**: Not needed - no data migrations or breaking changes.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/utils/test-config.ts:66` - Increase `short` timeout from 5000ms to 8000ms
- `apps/web/public/locales/en/auth.json` - Add `user_banned` translation key
- `apps/e2e/tests/admin/admin.spec.ts:202-206` - Update ban user test to use `toPass()` pattern

### New Files

None - all fixes are to existing files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Increase Timeout Configuration

Update the `short` timeout in the test config to accommodate edge cases.

- Modify `apps/e2e/tests/utils/test-config.ts` line 66
- Change `short: isCI ? 10000 : 5000` to `short: isCI ? 12000 : 8000`
- Rationale: Increases timeout by 60% (5s → 8s locally, 10s → 12s CI) to handle:
  - Supabase cold starts
  - Network latency
  - React Query hydration races
  - Database query delays

**Why this step first**: Timeout configuration must be in place before tests run, foundational to both failing tests.

#### Step 2: Add Missing Translation Key

Add the `user_banned` translation key to the auth.json file.

- Open `apps/web/public/locales/en/auth.json`
- Add the key under an appropriate section (likely near other error messages)
- Use a descriptive error message: `"Your account has been banned. Please contact support."`
- Ensure JSON formatting remains valid

#### Step 3: Update Ban User Test with toPass() Pattern

Improve the ban user test assertion reliability using the `toPass()` pattern.

- Modify `apps/e2e/tests/admin/admin.spec.ts` lines 202-206
- Replace direct `expect().toBeVisible()` with `expect(async () => { ... }).toPass()`
- Add appropriate retry intervals from `testConfig.getRetryIntervals("auth")`
- Include helpful logging for debugging

**Example transformation**:
```typescript
// Before
await expect(page.locator('[data-testid="auth-error-message"]'))
  .toBeVisible({ timeout: 15000 });

// After
await expect(async () => {
  const element = page.locator('[data-testid="auth-error-message"]');
  await expect(element).toBeVisible();
}).toPass({
  intervals: testConfig.getRetryIntervals("auth"),
  timeout: 30000,
});
```

#### Step 4: Run Tests and Validate

Execute the test suite to verify fixes resolve the flaky tests.

- Run affected tests: `pnpm test:e2e --grep "sign in|ban user"`
- Run full E2E suite: `pnpm test:e2e`
- Monitor for test stability (run multiple times if needed)
- Verify no new regressions in other tests

#### Step 5: Verify Zero Regressions

Ensure no other tests are negatively affected by the timeout increase.

- Run full test suite: `pnpm test:e2e`
- Check TypeScript compilation: `pnpm typecheck`
- Verify lint passes: `pnpm lint`
- Ensure no performance degradation from slightly longer timeouts

## Testing Strategy

### Unit Tests

No unit tests needed - these are configuration and E2E test changes only.

### Integration Tests

No integration tests needed - changes are isolated to E2E test infrastructure.

### E2E Tests

Add/update E2E test coverage for:

- ✅ **Authentication timeout resilience**: Existing "user can sign in with valid credentials" test will now pass reliably
- ✅ **Ban user flow error messaging**: Updated ban user test with better assertion pattern
- ✅ **Timeout edge cases**: Current tests already cover this, now with adequate timeout budget
- ✅ **Regression test**: Ensure other authentication tests still pass with increased timeouts

**Test files affected**:
- `apps/e2e/tests/authentication/auth.spec.ts` - "user can sign in with valid credentials" test
- `apps/e2e/tests/admin/admin.spec.ts` - "ban user flow" test

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run test suite locally: `pnpm test:e2e` (verify all tests pass)
- [ ] Run with CI config: `CI=true pnpm test:e2e` (verify CI timeouts work)
- [ ] Manually test login flow in browser (auth works correctly)
- [ ] Manually test ban user flow in admin panel (error message displays correctly)
- [ ] Verify no "timeout" errors in test output (indicates timeout is sufficient)
- [ ] Check test duration hasn't increased significantly (8s timeout is reasonable)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Timeout Too Short Still**: Remaining edge cases could still exceed 8000ms
   - **Likelihood**: low
   - **Impact**: medium (test fails intermittently)
   - **Mitigation**: Monitor test runs; if failures persist, increase to 10000ms. 8000ms is chosen conservatively.

2. **Translation Key Mismatch**: Translation key doesn't match error component lookup
   - **Likelihood**: low
   - **Impact**: low (only affects banned user error message display)
   - **Mitigation**: Verify translation key matches what auth error handler expects. Check `apps/web` for `user_banned` references.

3. **Race Condition Still Exists**: `toPass()` might not fully resolve React state race condition
   - **Likelihood**: low
   - **Impact**: medium (test still flaky)
   - **Mitigation**: `toPass()` with retry intervals handles this pattern. If issues persist, investigate React Query hydration more deeply.

**Rollback Plan**:

If this fix causes issues in production:

1. Revert timeout change: `git revert <commit-hash>`
2. Revert translation addition: Remove `user_banned` key from `auth.json`
3. Revert test assertion change: Use direct `.toBeVisible()` without `toPass()`
4. Run tests to verify rollback is clean
5. Investigate deeper: Consider whether longer timeout increase needed or auth flow changes required

**Monitoring** (if needed):

- Monitor E2E test pass rate: Target >99% (currently 99.8%)
- Track test execution time: Ensure no significant increase from timeout changes
- Monitor timeout errors in test output: None should appear if timeout is adequate

## Performance Impact

**Expected Impact**: minimal

- Timeout increase (5s → 8s) only affects test execution when responses are delayed
- Adds at most 3 seconds per test in worst case (only if form fills/auth is slow)
- No impact on application performance (configuration-only change)
- Translation addition is negligible (< 1KB added to JSON file)

**Performance Testing**: None needed - this is test infrastructure, not application code.

## Security Considerations

**Security Impact**: none

- Configuration timeout changes don't affect application security
- Translation key addition is purely UX improvement for banned users
- No authentication or authorization logic changes
- No exposure of sensitive data

## Validation Commands

### Before Fix (Tests Should Fail Intermittently)

```bash
# Run the specific failing tests multiple times
for i in {1..5}; do
  echo "Run $i"
  pnpm test:e2e --grep "user can sign in with valid credentials"
done

for i in {1..5}; do
  echo "Run $i"
  pnpm test:e2e --grep "ban user flow"
done
```

**Expected Result**: At least 1-2 failures out of 5 runs in each test (intermittent failures demonstrating the bug).

### After Fix (Tests Should Pass Reliably)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (ensure no regressions)
pnpm test:unit

# E2E tests - run full suite
pnpm test:e2e

# E2E tests - run specific tests multiple times
for i in {1..3}; do
  echo "Run $i"
  pnpm test:e2e --grep "user can sign in with valid credentials"
done

for i in {1..3}; do
  echo "Run $i"
  pnpm test:e2e --grep "ban user flow"
done

# Build to ensure no issues
pnpm build
```

**Expected Result**: All tests pass consistently, no timeout errors, no new failures.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Check for timeout errors in output
pnpm test:e2e 2>&1 | grep -i "timeout"

# Verify auth tests still pass
pnpm test:e2e --grep "auth"

# Verify admin tests still pass
pnpm test:e2e --grep "admin"
```

## Dependencies

### New Dependencies

**No new dependencies required** - all changes use existing infrastructure (Playwright, testConfig, translation system).

## Database Changes

**No database changes required** - translation addition is JSON file only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a test infrastructure fix with zero impact on production code or infrastructure.

**Feature flags needed**: no

**Backwards compatibility**: maintained - no breaking changes to application code or APIs.

## Success Criteria

The fix is complete when:

- [ ] Timeout configuration updated: 5000ms → 8000ms (locally), 10000ms → 12000ms (CI)
- [ ] Translation key added: `user_banned` in `apps/web/public/locales/en/auth.json`
- [ ] Ban user test updated: Uses `toPass()` pattern with retry intervals
- [ ] Both failing tests now pass reliably (run 5+ times with no failures)
- [ ] All other tests pass: No regressions in authentication or admin test suites
- [ ] TypeScript compilation succeeds: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Code formatting correct: `pnpm format`
- [ ] Build succeeds: `pnpm build`
- [ ] Test execution time reasonable: <5 second increase for affected tests

## Notes

### Why These Specific Timeout Values?

- **5000ms → 8000ms locally**: 60% increase covers most edge cases while maintaining fast feedback
- **10000ms → 12000ms CI**: Accounts for CI runner cold starts and network latency
- **8000ms is not excessive**: Still allows fast test feedback; E2E tests typically expect 10-15s per test

### Why `toPass()` for Ban User Test?

The Playwright documentation and project's E2E testing guide (apps/e2e/CLAUDE.md) recommend `toPass()` for operations that race with React state updates. Ban user test exhibits this pattern because:
1. Auth API returns 400 (banned)
2. React Query updates state
3. Error message is rendered asynchronously
4. Direct assertion races with React rendering

The `toPass()` pattern handles this by retrying the assertion until the element is visible.

### Translation Key Placement

The `user_banned` key should be added to the auth error messages section of `apps/web/public/locales/en/auth.json`. This aligns with:
- Project's localization pattern (namespace-based keys)
- Existing auth error messages in the file
- Error handling in authentication components

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #987*
