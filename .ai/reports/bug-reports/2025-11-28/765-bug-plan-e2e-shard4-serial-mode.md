# Bug Fix: E2E Shard 4 Serial Mode State Corruption

**Related Diagnosis**: #764
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Serial test mode (`test.describe.configure({ mode: "serial" })`) causes browser context sharing, allowing earlier tests to corrupt authentication state for subsequent tests via `clearCookies()` and `signOut()`
- **Fix Approach**: Remove serial mode configuration from test describe blocks to enable parallel execution with isolated browser contexts
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shard 4 (Admin & Invitations) experiences a 67% failure rate (6 of 9 tests failing). The root cause is that tests configured with `test.describe.configure({ mode: "serial" })` share a single browser context. When earlier tests clear cookies or sign out to verify post-action behavior (e.g., verifying a banned user can't log in), subsequent tests inherit this corrupted state and fail with timeouts or wrong authentication contexts.

For full details, see diagnosis issue #764.

### Solution Approaches Considered

#### Option 1: Remove Serial Mode ⭐ RECOMMENDED

**Description**: Change `test.describe.configure({ mode: "serial" })` to `test.describe.configure({ mode: "parallel" })` in the two affected describe blocks (lines 28 and 266 in admin.spec.ts).

**Pros**:
- Each test gets a fresh browser context with pre-authenticated state from storage files
- Eliminates state corruption by design
- Playwright's auth storage feature (`AuthPageObject.setupSession()`) already provides isolated auth state per test
- Simplest fix with lowest risk
- Matches the pattern used successfully in other test suites
- No code logic changes needed

**Cons**:
- Tests run in parallel instead of serial (not a real downside, actually beneficial)
- Slightly higher resource usage during test execution (acceptable)

**Risk Assessment**: low - This leverages existing Playwright patterns already used throughout the test suite. Auth storage state ensures each test starts fresh regardless of previous test execution.

**Complexity**: simple - Just change one line in two places.

#### Option 2: Add State Restoration After Destructive Operations

**Description**: After calling `clearCookies()`, `signOut()`, or similar destructive operations, explicitly restore auth state using storage state files before the next test's `beforeEach` hook runs.

**Pros**:
- Maintains serial mode if there's a reason to keep tests sequential
- Explicit control over auth state restoration

**Cons**:
- Requires adding cleanup/restoration code to multiple tests
- More complex to maintain
- Still doesn't fully solve the problem if later tests depend on auth state
- Contradicts Playwright's recommended pattern (use fresh contexts for each test)
- Higher risk of missed edge cases

**Why Not Chosen**: Option 1 is simpler and more reliable. Serial mode itself is the root cause - fixing it at the source (removing serial mode) is better than working around it with restoration logic.

#### Option 3: Isolate Destructive Tests into Separate Describe Block

**Description**: Move tests that call `clearCookies()` or `signOut()` into their own `describe` block without serial mode, keeping other tests serial if needed.

**Pros**:
- Minimal code changes
- Keeps non-destructive tests serial if there's a requirement

**Cons**:
- Doesn't address the root cause
- Still requires investigation into why serial mode was added
- More complex test organization
- Harder to maintain consistency across test suites

**Why Not Chosen**: Serial mode appears to have been added without a clear purpose. Option 1 is simpler and doesn't have the downsides of maintaining multiple parallel/serial blocks.

### Selected Solution: Remove Serial Mode

**Justification**:

Playwright's documentation and best practices strongly recommend **parallel test execution with isolated contexts**. The `AuthPageObject.setupSession()` method already provides per-test auth state isolation through storage files. Serial mode is:
- Redundant (auth state is already isolated per test)
- Problematic (context sharing enables state corruption)
- Slower (tests run sequentially instead of in parallel)

The fix is surgical: remove two lines that configure serial mode, allowing tests to run in parallel with fresh contexts. This aligns with Playwright patterns used successfully elsewhere in the test suite and eliminates the root cause by design.

**Technical Approach**:
1. Change line 28 from `test.describe.configure({ mode: "serial" });` to `test.describe.configure({ mode: "parallel" });`
2. Change line 266 from `test.describe.configure({ mode: "serial" });` to `test.describe.configure({ mode: "parallel" });`
3. Run tests to verify all 9 tests in shard 4 pass
4. Add regression test to prevent serial mode from being re-introduced

**Architecture Changes**: None - this is a test configuration change only, no application code changes.

**Migration Strategy**: N/A - no data migration needed.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/admin/admin.spec.ts` - Change serial mode to parallel mode on lines 28 and 266
- No other files affected - this is a test-only fix

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Remove Serial Mode from Admin Dashboard Tests (Line 28)

Change line 28 in `apps/e2e/tests/admin/admin.spec.ts`:
```typescript
// FROM:
test.describe.configure({ mode: "serial" });

// TO:
test.describe.configure({ mode: "parallel" });
```

**Why this step first**: The admin dashboard tests come first in the file and are independent of later tests.

#### Step 2: Remove Serial Mode from Personal Account Management Tests (Line 266)

Change line 266 in `apps/e2e/tests/admin/admin.spec.ts`:
```typescript
// FROM:
test.describe.configure({ mode: "serial" });

// TO:
test.describe.configure({ mode: "parallel" });
```

**Why this step second**: This is the second serial mode configuration in the same file and controls the tests with the problematic `clearCookies()` calls.

#### Step 3: Run Shard 4 Tests and Verify All Pass

Execute the test shard to verify the fix:
```bash
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
```

Expected result: All 9 tests pass (0 failures).

**Specific scenarios to verify**:
- ✅ "ban user flow" should now show admin panel (not sign-in page)
- ✅ "delete team account flow" should have correct user context
- ✅ "users can delete invites" and "users can update invites" should not timeout
- ✅ "accept invite flow" should not get stuck on onboarding

#### Step 4: Run Full E2E Test Suite

Run the complete E2E test suite to ensure no regressions in other shards:
```bash
pnpm test:e2e
```

Expected result: All shards pass with same or better results than before.

#### Step 5: Add Documentation Comment

Add a comment in the code explaining why parallel mode is used:
```typescript
// Use parallel mode to ensure each test gets a fresh browser context
// with isolated auth state. Serial mode caused state corruption when
// earlier tests cleared cookies (e.g., to verify banned users can't log in).
// See issue #764 for details.
test.describe.configure({ mode: "parallel" });
```

## Testing Strategy

### Unit Tests

No unit tests needed - this is a test configuration change only.

### Integration Tests

No integration tests needed.

### E2E Tests

**Existing tests validate the fix**:
- Running `pnpm test:e2e` with shard 4 verifies all 9 tests pass
- Auth state isolation is validated by the pre-existing storage state mechanisms

**Manual Testing Checklist**

Execute these manual tests before considering the fix complete:

- [ ] Run shard 4: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4`
- [ ] Verify all 9 tests pass (0 failures)
- [ ] Verify "ban user flow" test completes without timeout
- [ ] Verify "delete team account flow" test uses correct auth context
- [ ] Verify "users can delete invites" test doesn't timeout
- [ ] Verify "users can update invites" test doesn't timeout
- [ ] Verify "accept invite flow" test completes without "Email body not found" error
- [ ] Run full E2E suite: `pnpm test:e2e`
- [ ] Verify no new failures in other shards

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Tests were intentionally serial for a reason**: If serial mode was added for a specific purpose (e.g., test data isolation), removing it could break something.
   - **Likelihood**: low - The code has no comments explaining why serial mode was added, and auth state is already isolated per test via storage files
   - **Impact**: medium - Could cause failures in other scenarios
   - **Mitigation**: Run full E2E suite after making change; monitor test results; investigate if failures occur
   - **Note**: If serial mode was needed, the diagnosis issue would likely have mentioned it during investigation

2. **Parallel mode resource exhaustion**: Running multiple tests in parallel could exceed system resources.
   - **Likelihood**: low - E2E tests already run in parallel in other shards
   - **Impact**: low - Would manifest as timeout/resource errors
   - **Mitigation**: Monitor resource usage during test runs; adjust parallelism if needed

3. **Test flakiness due to shared test data**: If tests depend on shared test data state (database records), parallel execution could cause conflicts.
   - **Likelihood**: low - Each test creates its own test users and data
   - **Impact**: medium - Could cause intermittent failures
   - **Mitigation**: Verify tests use isolated test data; review beforeEach/afterEach hooks

**Rollback Plan**:

If parallel mode causes unexpected failures:
1. Change mode back to `test.describe.configure({ mode: "serial" });` on the affected lines
2. Investigate root cause of the failure
3. File a new issue with detailed failure information
4. Implement Option 2 (state restoration) instead

**Monitoring** (if needed):

After deploying the fix:
- Monitor CI test results for shard 4 across multiple runs
- Watch for any new test failures in shard 4 or related shards
- Alert if failure rate increases

## Performance Impact

**Expected Impact**: minimal

The fix may actually slightly improve performance:
- Parallel execution is faster than serial execution
- Tests should complete faster overall

## Security Considerations

**Security Impact**: none

This is a test infrastructure change only - no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run shard 4 with serial mode - should fail with 6 failures
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
```

**Expected Result**: 6 test failures (67% failure rate)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 4 - should pass all tests
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4

# Run full E2E suite - should pass or improve
pnpm test:e2e

# Build
pnpm build
```

**Expected Result**: All commands succeed, shard 4 passes all 9 tests, no regressions in other shards.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks - verify shard 4 specifically
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
```

## Dependencies

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (test infrastructure change only)

## Success Criteria

The fix is complete when:
- [ ] Line 28 in admin.spec.ts changed from `serial` to `parallel`
- [ ] Line 266 in admin.spec.ts changed from `serial` to `parallel`
- [ ] All 9 tests in shard 4 pass
- [ ] All validation commands pass
- [ ] No new failures in other E2E shards
- [ ] No regressions detected in full test suite

## Notes

### Why Serial Mode Was Problematic

Playwright's serial mode is designed for scenarios where tests must run in a specific order due to shared database state or dependencies between tests. This test suite doesn't have that requirement - each test uses `AuthPageObject.setupSession()` to set up isolated auth state via storage files.

With serial mode enabled and shared context, the state from one test persists to the next. When the "ban user flow" test calls `page.context().clearCookies()` on line 131, it clears the SUPER_ADMIN session for all subsequent tests in the describe block.

### Why Parallel Mode Works

Parallel mode enables each test to get a fresh browser context with pre-authenticated state from the storage file. The `AuthPageObject.setupSession()` method ensures each test starts with the correct auth state regardless of what previous tests did.

### Design Pattern

This approach follows Playwright's recommended pattern:
1. Create storage state files for different user roles (via global setup)
2. Use `page.context({ storageState })` or `AuthPageObject.setupSession()` to load isolated state per test
3. Run tests in parallel with isolated contexts

### Related Documentation

- Playwright docs: https://playwright.dev/docs/auth#multi-user-authentication
- Project E2E testing guide: `apps/e2e/CLAUDE.md`
- Test utilities: `apps/e2e/tests/utils/auth-state.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #764*
