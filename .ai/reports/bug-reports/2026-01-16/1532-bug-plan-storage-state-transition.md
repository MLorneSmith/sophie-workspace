# Bug Fix: E2E Storage State Transition Cookie Loss

**Related Diagnosis**: #1531 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `restoreAuthStorageState()` reads from `page.context().storageState()` which is empty after Playwright clears cookies during storage state transitions
- **Fix Approach**: Read storage state from the configured file path instead of the current context
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E tests fail when tests with different storage states run sequentially (e.g., auth-simple with empty state → team-accounts with pre-authenticated state). Playwright clears cookies during the transition, and `restoreAuthStorageState()` reads from the already-empty context instead of the storage state file.

For full details, see diagnosis issue #1531.

### Solution Approaches Considered

#### Option 1: Read from Storage State File ⭐ RECOMMENDED

**Description**: Modify `restoreAuthStorageState()` to accept the storage state file path as a parameter and read cookies directly from the file, bypassing the current context entirely.

**Technical approach**:
```typescript
export async function restoreAuthStorageState(
  page: Page,
  storageStatePath: string  // e.g., AUTH_STATES.TEST_USER
): Promise<void> {
  // Read from file, not from context
  const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'));

  if (storageState.cookies?.length > 0) {
    await page.context().addCookies(storageState.cookies);
  }
}
```

**Pros**:
- Addresses root cause directly - always reads from source of truth
- Simple implementation - add one parameter, change one line
- Works for retries AND storage state transitions
- No changes to page fixture or test infrastructure
- Maintains backward compatibility for tests that don't use it

**Cons**:
- Requires updating all call sites to pass storage state path
- Adds file I/O (minimal performance impact)

**Risk Assessment**: low - Reading from file is more reliable than reading from context that may be cleared

**Complexity**: simple - Single function signature change + parameter propagation to call sites

#### Option 2: Move to Page Fixture Initialization

**Description**: Move cookie restoration into the page fixture in `base-test.ts` so it runs after route interception but before test code.

**Pros**:
- Automatic - no need to call in beforeEach
- Runs at the right time in the lifecycle

**Cons**:
- Requires accessing the configured storage state from fixture context
- More complex - need to determine which storage state file to use
- Tightly couples fixture to test configuration
- Harder to debug issues

**Why Not Chosen**: Adds complexity to fixture infrastructure and makes the restoration implicit. Option 1 is more explicit and easier to reason about.

#### Option 3: Force Playwright to Not Clear Cookies

**Description**: Try to prevent Playwright's internal cookie clearing during storage state transitions.

**Why Not Chosen**: This is Playwright's intended isolation behavior. Fighting it would be fragile and could break with Playwright updates.

### Selected Solution: Read from Storage State File

**Justification**: This approach is simple, surgical, and addresses the root cause directly. It makes the function work correctly in all scenarios (retries AND storage state transitions) by reading from the authoritative source rather than the potentially-cleared context.

**Technical Approach**:
1. Update `restoreAuthStorageState()` signature to accept `storageStatePath: string`
2. Read storage state from file using `fs.readFileSync()`
3. Extract cookies from the parsed JSON
4. Add cookies to context using `page.context().addCookies()`
5. Update all call sites to pass the storage state path

**Architecture Changes**:
- Function signature changes from `restoreAuthStorageState(page)` to `restoreAuthStorageState(page, storageStatePath)`
- No changes to test infrastructure or fixtures
- No changes to global-setup or storage state creation

**Migration Strategy**:
- Update function in `apps/e2e/tests/utils/base-test.ts`
- Update imports in test files to include `AUTH_STATES`
- Update call sites to pass storage state path
- All changes in one atomic commit

## Implementation Plan

### Affected Files

- `apps/e2e/tests/utils/base-test.ts` - Update `restoreAuthStorageState()` function signature and implementation
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Update call site to pass `AUTH_STATES.TEST_USER`
- `apps/e2e/tests/utils/auth-state.ts` - Already exports `AUTH_STATES`, no changes needed

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update `restoreAuthStorageState()` function

Modify `apps/e2e/tests/utils/base-test.ts` to read from storage state file:

- Import `fs` from `node:fs` at the top of the file
- Update function signature to accept `storageStatePath: string` parameter
- Change implementation to read from file instead of context
- Update JSDoc comments to reflect the change
- Add error handling for missing/invalid storage state files

**Why this step first**: Core function must be updated before call sites can pass the new parameter

#### Step 2: Update test call sites

Update all tests that call `restoreAuthStorageState()`:

- Import `AUTH_STATES` from `'../utils/auth-state'` in test files
- Update `restoreAuthStorageState(page)` calls to `restoreAuthStorageState(page, AUTH_STATES.TEST_USER)`
- Verify the correct storage state is passed (TEST_USER, OWNER_USER, or SUPER_ADMIN)

**Files to update**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts`
- Any other test files using this function (search with grep)

#### Step 3: Add regression test

Add a test that verifies storage state restoration works across storage state transitions:

- Create test in `apps/e2e/tests/utils/` or alongside team-accounts tests
- Test should run auth-simple (empty state) then team-accounts (authenticated state)
- Verify cookies are properly restored
- Use the existing reproduction as the test case

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm the original bug is fixed

## Testing Strategy

### Unit Tests

Not applicable - this is an E2E test utility function tested by E2E tests themselves.

### Integration Tests

The E2E test suite serves as integration testing for this fix.

### E2E Tests

**Existing tests that will validate the fix**:
- ✅ `tests/team-accounts/team-accounts.spec.ts` - Will now pass after auth-simple tests
- ✅ All tests using pre-authenticated storage state
- ✅ Regression test: Original bug scenario (auth-simple → team-accounts with workers=1)

**Test files**:
- All existing E2E tests serve as regression tests
- The specific reproduction case from diagnosis serves as primary validation

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (run with old code - should fail)
  ```bash
  pnpm --filter web-e2e exec playwright test tests/authentication/auth-simple.spec.ts tests/team-accounts/team-accounts.spec.ts --workers=1
  ```
- [ ] Apply fix and verify bug is resolved (should pass)
- [ ] Run team-accounts tests in isolation (should still pass)
- [ ] Run full E2E suite with workers=1 (should pass)
- [ ] Run full E2E suite with workers=4 (should pass)
- [ ] Verify CI integration tests pass

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **File I/O failure**: Storage state file might not exist or be corrupted
   - **Likelihood**: low
   - **Impact**: medium (test fails immediately)
   - **Mitigation**: Add try-catch with clear error message. File is created by global-setup which runs before all tests.

2. **Wrong storage state passed**: Test might pass wrong storage state path
   - **Likelihood**: low
   - **Impact**: medium (test uses wrong auth state)
   - **Mitigation**: TypeScript ensures only valid AUTH_STATES values can be passed. Code review will catch any mistakes.

3. **Performance impact from file reads**: Reading from disk on every beforeEach
   - **Likelihood**: certain
   - **Impact**: low (file read is < 1ms, happens in beforeEach which already has other setup)
   - **Mitigation**: Not needed - impact is negligible. Could cache in memory if needed in future.

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit containing this change
2. Tests will fail in original way (storage state transitions)
3. No data loss or system impact - E2E test infrastructure only

**Monitoring**:
- Watch CI E2E test success rate
- Monitor for new "file not found" errors in test logs

## Performance Impact

**Expected Impact**: minimal

Reading a small JSON file (< 5KB) from disk adds ~0.5-1ms per test beforeEach. Given that beforeEach already includes navigation and hydration waiting (hundreds of milliseconds), this is negligible.

**Performance Testing**:
- Run E2E suite and compare total execution time before/after
- Expected difference: < 1% increase in total test time

## Security Considerations

**Security Impact**: none

This change only affects E2E test infrastructure. Storage state files are:
- Generated locally or in CI
- Never committed to git (in `.gitignore`)
- Contain test credentials only
- Used only in test environments

No production code or data is affected.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reproduce the bug - tests should fail
pnpm --filter web-e2e exec playwright test \
  tests/authentication/auth-simple.spec.ts \
  tests/team-accounts/team-accounts.spec.ts \
  --workers=1

# Expected: team-accounts tests fail with timeout waiting for [data-testid="team-selector"]
```

**Expected Result**: 2 tests fail (team-accounts tests), others pass

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Run the reproduction case - should now pass
pnpm --filter web-e2e exec playwright test \
  tests/authentication/auth-simple.spec.ts \
  tests/team-accounts/team-accounts.spec.ts \
  --workers=1

# Run team-accounts tests in isolation - should still pass
pnpm --filter web-e2e exec playwright test \
  tests/team-accounts/team-accounts.spec.ts \
  --workers=1

# Run full E2E suite with serial execution
pnpm --filter web-e2e test --workers=1

# Run full E2E suite with parallel execution
pnpm --filter web-e2e test

# Build (ensure no type errors)
pnpm build
```

**Expected Result**: All commands succeed, all tests pass, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full E2E test suite to ensure nothing broke
pnpm --filter web-e2e test

# Run in CI mode with 1 worker (simulates CI environment)
CI=true pnpm --filter web-e2e test --workers=1

# Verify all test shards work
for i in {1..15}; do
  echo "Testing shard $i..."
  pnpm --filter web-e2e test:shard$i
done
```

## Dependencies

### New Dependencies

**No new dependencies required**

The fix uses Node.js built-in `fs` module which is already available.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This change only affects E2E test infrastructure. No production code changes.

**Special deployment steps**:
- None required

**Feature flags needed**: no

**Backwards compatibility**: maintained (test code only)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (auth-simple → team-accounts passes with workers=1)
- [ ] All E2E tests pass with workers=1 (serial)
- [ ] All E2E tests pass with workers=4 (parallel)
- [ ] CI integration tests pass
- [ ] Zero regressions detected
- [ ] Code review approved
- [ ] Manual testing checklist complete

## Notes

**Key Insights**:
- The bug only manifests when storage states transition (empty → authenticated)
- Playwright's internal isolation mechanism clears cookies between these transitions
- Reading from the source file bypasses this issue entirely
- The fix is surgical - changes only one function and its call sites

**Related Work**:
- Issue #1492 originally added `restoreAuthStorageState()` for retry scenarios
- This fix extends it to handle storage state transitions as well
- The function now works correctly in both scenarios

**Testing Strategy**:
- The reproduction case from the diagnosis serves as the primary regression test
- All existing E2E tests validate no regressions were introduced
- CI will validate the fix in the actual failing environment

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1531*
