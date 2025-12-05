# Bug Fix: Admin E2E Tests Race Condition with Parallel Mode

**Related Diagnosis**: #904
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Admin tests configured with `mode: "parallel"` share a single test user (`test1@slideheroes.com`), causing race conditions when multiple tests simultaneously modify the user's banned state
- **Fix Approach**: Change test execution mode to serial for the "Personal Account Management" describe block where shared state modifications occur
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The admin E2E tests contain two tests that modify the same user's banned state:
- `ban user flow` (line 143)
- `reactivate user flow` (line 204)

Both tests use the same hardcoded test user (`test1@slideheroes.com`). When running in parallel mode, these tests interfere with each other, causing:
1. State corruption (one test bans the user while the other tries to interact with account details)
2. Timeout failures waiting for UI elements
3. Auth flow failures due to inconsistent user state
4. ~50% test failure rate depending on execution order

This is a classic test isolation issue where shared mutable state conflicts with parallel execution.

For full details, see diagnosis issue #904.

### Solution Approaches Considered

#### Option 1: Change "Personal Account Management" Block to Serial Mode ⭐ RECOMMENDED

**Description**: Wrap the "Personal Account Management" describe block (lines 84-314) with `test.describe.configure({ mode: "serial" })` to ensure ban and reactivate tests run sequentially while allowing other tests to run in parallel.

**Pros**:
- Minimal code change (1-2 lines)
- Addresses root cause directly (removes race condition)
- Other tests still run in parallel for speed
- No database changes needed
- No test data changes needed
- Simple to verify and understand
- Follows Playwright best practices for shared state tests

**Cons**:
- Slight increase in test execution time for that block
- Doesn't solve the underlying "one hardcoded user" design

**Risk Assessment**: low - Only changes test execution order for a specific block, doesn't modify application code or test data

**Complexity**: simple - Single configuration change

#### Option 2: Create Separate Test Users for Each Test

**Description**: Use unique test users for ban and reactivate tests instead of sharing `test1@slideheroes.com`.

**Why Not Chosen**:
- Creates unnecessary test data maintenance burden
- Complicates test cleanup (multiple users to unban)
- The tests are logically related (ban/reactivate are complementary flows)
- Running them sequentially is semantically correct (you must ban before you can reactivate)
- Serial mode is simpler and more maintainable

#### Option 3: Extract Ban/Reactivate into Separate Test File

**Description**: Move ban and reactivate tests to their own file with isolated configuration.

**Why Not Chosen**:
- Overkill for this issue
- Adds file fragmentation without benefit
- Serial mode solves the problem with less refactoring
- Tests are closely related and belong together

### Selected Solution: Serial Mode for "Personal Account Management"

**Justification**: This approach is the simplest, most maintainable, and most direct fix for the root cause. The "Personal Account Management" describe block naturally needs sequential execution because:
1. The tests modify shared state (the same user's banned status)
2. The reactivate test logically depends on the ban test succeeding
3. Ban and reactivate are complementary operations (ban → verify banned → reactivate → verify active)
4. This is a standard pattern in Playwright for tests with shared mutable state

**Technical Approach**:
- Add `test.describe.configure({ mode: "serial" });` at the start of the "Personal Account Management" describe block
- This configures only that block to run sequentially
- Other describe blocks (Admin Dashboard, Impersonation) continue running in parallel
- The existing `beforeEach` and `afterEach` hooks will execute correctly for each test

**Architecture Changes** (if any):
- None. This is purely a test infrastructure change.

**Migration Strategy** (if needed):
- None. This is backward compatible.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/admin/admin.spec.ts` (lines 84-314) - Add serial mode configuration to "Personal Account Management" describe block

### New Files

- None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Serial Mode Configuration

Add `test.describe.configure({ mode: "serial" });` to the "Personal Account Management" describe block (after line 84).

**Current code (lines 84-85)**:
```typescript
test.describe("Personal Account Management", () => {
	AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN);
```

**Updated code**:
```typescript
test.describe("Personal Account Management", () => {
	test.describe.configure({ mode: "serial" });
	AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN);
```

**Why this step first**: This is the only code change needed. All test infrastructure already supports this configuration.

#### Step 2: Add Tests to Verify Serial Execution

Update the test file to add a descriptive comment explaining why serial mode is necessary.

**Add comment before "Personal Account Management" block**:
```typescript
// SERIAL MODE REQUIRED: Ban and reactivate tests modify the same user's banned state.
// Running in parallel causes race conditions where one test bans the user while another
// tries to interact with account details. Serial execution ensures state consistency.
// See diagnosis issue #904 for full details.
test.describe("Personal Account Management", () => {
	test.describe.configure({ mode: "serial" });
	// ... rest of block
```

**Why this step**: Documents the rationale for future maintainers.

#### Step 3: Verify Tests Pass with Serial Mode

Run the admin tests to confirm serial mode fixes the race condition.

```bash
pnpm test:e2e apps/e2e/tests/admin/admin.spec.ts
```

Or run just the "Personal Account Management" tests:
```bash
pnpm test:e2e -g "Personal Account Management"
```

**Why this step**: Confirms the fix works and no regressions are introduced.

#### Step 4: Run Full E2E Test Suite

Execute the complete test suite to verify no other tests are affected.

```bash
pnpm test:e2e
```

Or use the full test command:
```bash
/test
```

**Why this step**: Ensures the change doesn't introduce unexpected side effects.

#### Step 5: Validation

Run all validation commands to ensure code quality.

- Run `pnpm typecheck` - ensure no type errors
- Run `pnpm lint` - ensure code quality
- Run `pnpm format` - ensure code style

## Testing Strategy

### Unit Tests

Not applicable - this is a test infrastructure change, not application code.

### Integration Tests

Not applicable - no API or database changes.

### E2E Tests

The existing E2E tests in `admin.spec.ts` serve as validation:

**Test files affected**:
- `apps/e2e/tests/admin/admin.spec.ts` - "Personal Account Management" describe block (lines 84-314)
  - ✅ `displays personal account details` - Should pass (no state modification)
  - ✅ `ban user flow` - Should pass with serial mode (no race condition)
  - ✅ `reactivate user flow` - Should pass with serial mode (no race condition)

**Regression tests**:
- ✅ All other admin tests should continue passing
- ✅ All other E2E tests should continue passing
- ✅ Test execution time should remain similar or slightly longer for the "Personal Account Management" block only

### Manual Testing Checklist

Execute these steps to verify the fix:

- [ ] Run admin tests 5-10 times in sequence
- [ ] Confirm no timeouts or race condition failures
- [ ] Verify ban user flow completes successfully
- [ ] Verify reactivate user flow completes successfully
- [ ] Check that other admin tests (Admin Dashboard, etc.) still run in parallel
- [ ] Verify overall test suite execution time is acceptable
- [ ] Confirm no new test failures appear in other areas

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test Execution Time**: Serial mode may increase test duration for "Personal Account Management" block
   - **Likelihood**: high
   - **Impact**: low (adds ~20-30 seconds max to ~15 minute suite)
   - **Mitigation**: This is acceptable trade-off for test reliability. The tests are naturally sequential anyway.

2. **Other Tests Affected**: Serial mode configuration might unexpectedly affect other tests
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: `test.describe.configure({ mode: "serial" })` only affects tests within that describe block. Isolated change with minimal scope.

3. **Regression**: Fix doesn't address underlying test user design issue
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: This is acceptable for now. A longer-term refactor to use unique test users per test can be done separately if needed. Serial mode is the correct immediate fix.

**Rollback Plan**:

If this fix causes issues:
1. Remove the `test.describe.configure({ mode: "serial" });` line
2. Revert to parallel mode
3. Investigate alternative solutions

**Monitoring** (if needed):

After deploying this fix:
- Monitor CI/CD test runs to confirm admin tests pass consistently
- Track test execution time to ensure serial mode doesn't cause unacceptable slowdown
- Alert if ban/reactivate tests fail again

## Performance Impact

**Expected Impact**: minimal

The "Personal Account Management" describe block will run sequentially instead of parallel. This adds approximately 30-50 seconds to test execution (one test after another instead of simultaneous). Total E2E suite is ~15 minutes, so this represents a ~3-5% increase in total execution time, which is acceptable for eliminating ~50% test failure rate.

**Performance Testing**:
- Run E2E tests before and after fix
- Compare execution time of admin shard
- Verify overall suite time is reasonable

## Security Considerations

None - this is a test-only change with no security implications.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run admin tests multiple times to see intermittent failures
pnpm test:e2e apps/e2e/tests/admin/admin.spec.ts
pnpm test:e2e apps/e2e/tests/admin/admin.spec.ts
pnpm test:e2e apps/e2e/tests/admin/admin.spec.ts
```

**Expected Result**: Intermittent timeouts and race condition failures (~50% failure rate) in ban/reactivate tests

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run admin tests (should pass consistently)
pnpm test:e2e apps/e2e/tests/admin/admin.spec.ts

# Run full E2E suite
pnpm test:e2e

# Or use the standard test command
/test
```

**Expected Result**:
- All validation commands pass
- Admin tests pass consistently (no intermittent failures)
- No race condition timeouts
- Zero regressions in other tests

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run E2E tests specifically
pnpm test:e2e

# Run admin tests multiple times (verify consistency)
for i in {1..5}; do pnpm test:e2e apps/e2e/tests/admin/admin.spec.ts || exit 1; done
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses existing Playwright configuration (`test.describe.configure()`), which is already available.

## Database Changes

**No database changes required**

This is a test-only change with no impact on the application database.

## Deployment Considerations

**Deployment Risk**: none

This is a test-only change that doesn't affect the application or production deployment.

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: fully maintained

## Success Criteria

The fix is complete when:
- [ ] Serial mode configuration added to "Personal Account Management" describe block
- [ ] Explanatory comment added for future maintainers
- [ ] All validation commands pass (`typecheck`, `lint`, `format`)
- [ ] Admin tests pass consistently (run 5+ times with no intermittent failures)
- [ ] Ban user flow completes without timeouts
- [ ] Reactivate user flow completes without race conditions
- [ ] Other admin tests (Admin Dashboard) continue running in parallel
- [ ] Full E2E test suite passes without regressions
- [ ] No new test failures appear in other test files

## Notes

### Why Serial Mode is Correct

Playwright's `mode: "parallel"` is designed for tests that are **completely independent**. The ban and reactivate tests are **dependent** on each other:
1. Both modify the same user's state
2. The reactivate test logically follows the ban test
3. Parallel execution creates race conditions

Serial mode is the appropriate choice for these tests. It's not a workaround—it's the correct design pattern for tests with shared mutable state.

### Long-Term Improvements (Out of Scope)

For future refactoring (not part of this fix):
1. Consider using unique test users per test instead of hardcoded `test1@slideheroes.com`
2. Add test isolation documentation to the E2E testing guide
3. Consider extracting a "shared state test" pattern for other E2E tests that might have similar issues

### Related Issues

- #767 (CLOSED): Added afterEach cleanup but didn't address parallel mode conflict
- #765 (CLOSED): Previous attempt to fix state corruption issues

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #904*
