# Bug Fix: PTY Wrapper Test Mock Missing isFeatureFailed Export

**Related Diagnosis**: #1859
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Commit `aa633fa89` added `isFeatureFailed` import to `pty-wrapper.ts` but test mock was not updated
- **Fix Approach**: Add `isFeatureFailed: vi.fn()` to the vi.mock() declaration and import it in tests
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

PR #1854 validation workflow fails on Unit Tests because the test file's mock for `progress-file.js` is incomplete. The `pty-wrapper.ts` implementation now calls `isFeatureFailed()` (added in bug fix #1852), but the test mock at lines 30-34 of `pty-wrapper.spec.ts` only mocks 3 functions instead of 4.

For full diagnosis details, see issue #1859.

### Solution Approaches Considered

#### Option 1: Add Missing Mock Export ⭐ RECOMMENDED

**Description**: Add `isFeatureFailed: vi.fn()` to the vi.mock() declaration in the test file, and import it alongside the other mocked functions. Configure its return values in relevant tests.

**Pros**:
- Minimal change (single line in mock declaration + import)
- Zero risk to production code
- Follows existing test patterns already established
- Maintains test clarity and consistency
- No new dependencies or complexity

**Cons**:
- None identified

**Risk Assessment**: Low - This is a straightforward mock synchronization issue with no side effects.

**Complexity**: Simple - Single mock function addition.

#### Option 2: Update Mock Using importOriginal Helper

**Description**: Use Vitest's `importOriginal` helper to import the actual function and merge with selective mocks, as suggested in the error message.

**Pros**:
- Automatically stays in sync if more functions are added later
- More resilient to future changes

**Cons**:
- Overkill for a simple fix
- More complex than necessary
- Changes test pattern from existing approach
- Harder to configure individual mock return values for specific tests

**Why Not Chosen**: The suggested approach is for partially mocking modules. This bug requires mocking the entire module anyway (all functions are already mocked), so the additional complexity is unnecessary. The simple addition of the missing mock is cleaner.

### Selected Solution: Add Missing Mock Export

**Justification**: This is the minimal, focused fix for a straightforward mock synchronization issue. It requires only one line in the mock declaration and follows the exact pattern already established in the test file. No additional complexity or risk.

**Technical Approach**:
- Add `isFeatureFailed: vi.fn()` to the mock object at line 30-34
- Import the mocked function at line 37-41 alongside other mocked imports
- Configure mock return value in test cases that exercise the `isFeatureFailed` code path (test at line 199)

**Architecture Changes**: None - This is purely a test fix with no changes to production code.

**Migration Strategy**: N/A - Not applicable to a test fix.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/__tests__/pty-wrapper.spec.ts` - Add `isFeatureFailed` to mock declaration and import statement

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update Mock Declaration

Update the `vi.mock()` call to include the missing function.

**Current code (lines 30-34)**:
```typescript
vi.mock("../progress-file.js", () => ({
	readProgressFile: vi.fn(),
	isProgressFileStale: vi.fn(),
	isFeatureCompleted: vi.fn(),
}));
```

**Updated code**:
```typescript
vi.mock("../progress-file.js", () => ({
	readProgressFile: vi.fn(),
	isProgressFileStale: vi.fn(),
	isFeatureCompleted: vi.fn(),
	isFeatureFailed: vi.fn(),  // Add this line
}));
```

**Why this step first**: The mock declaration must be in place before the import statement, as Vitest requires the mock to be defined before the module is imported.

#### Step 2: Update Mock Import Statement

Update the import to include the newly mocked function.

**Current code (lines 37-41)**:
```typescript
import {
	readProgressFile,
	isProgressFileStale,
	isFeatureCompleted,
} from "../progress-file.js";
```

**Updated code**:
```typescript
import {
	readProgressFile,
	isProgressFileStale,
	isFeatureCompleted,
	isFeatureFailed,  // Add this line
} from "../progress-file.js";
```

**Why this step next**: Now that the mock is defined, we can import it to use it in test configuration.

#### Step 3: Configure Mock in Relevant Tests

The test at line 199 ("should return stillRunning=true when progress file shows in_progress with recent heartbeat") exercises the code path that calls `isFeatureFailed()`. Configure the mock to return `false` for this test.

**Current code (line 214)**:
```typescript
vi.mocked(isFeatureCompleted).mockReturnValue(false);
```

**Add after this line**:
```typescript
vi.mocked(isFeatureFailed).mockReturnValue(false); // Feature has not failed
```

This configuration indicates that the feature has not explicitly failed, so the recovery code proceeds to check if it's still running.

#### Step 4: Verify All Existing Tests Still Pass

Run the unit tests to ensure the fix resolves the error without breaking anything.

```bash
pnpm --filter @slideheroes/alpha-scripts test:coverage
```

**Expected result**: All tests in `pty-wrapper.spec.ts` pass, including the test that was previously failing.

#### Step 5: Validation Commands

Run the full test suite to ensure no regressions.

```bash
pnpm test:unit
pnpm typecheck
pnpm lint
```

## Testing Strategy

### Unit Tests

The existing tests in `pty-wrapper.spec.ts` already provide comprehensive coverage:

- ✅ Normal completion test (line 117) - Already passing
- ✅ Timeout with recovery test (line 158) - Already passing
- ✅ In-progress with recent heartbeat test (line 199) - Will pass after mock is configured
- ✅ Stale progress file test (line 232) - Already passing
- ✅ Unavailable progress file test (line 269) - Already passing
- ✅ Telemetry tests (line 374) - Already passing
- ✅ Edge case: Default timeout (line 314) - Already passing

**No new test cases needed** - The existing tests already cover the `isFeatureFailed()` code path indirectly. This fix simply enables them to run without mock errors.

### Integration Tests

Not applicable - This is a unit test mock issue with no integration impact.

### E2E Tests

Not applicable - This is a unit test fix.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce the original failure (before applying fix):
  ```bash
  git checkout HEAD -- .ai/alpha/scripts/lib/__tests__/pty-wrapper.spec.ts
  pnpm --filter @slideheroes/alpha-scripts test:coverage
  ```
  Expected: Test fails with "No 'isFeatureFailed' export is defined" error

- [ ] Apply fix and verify bug is resolved:
  ```bash
  # Apply the changes above
  pnpm --filter @slideheroes/alpha-scripts test:coverage
  ```
  Expected: All tests pass

- [ ] Run full test suite:
  ```bash
  pnpm test:unit
  ```
  Expected: Zero test failures

- [ ] Verify CI passes:
  - Push branch and verify PR validation workflow completes successfully
  - Confirm Unit Tests job passes

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Mock Configuration Mismatch**: If the mock is configured incorrectly, tests could pass but fail in production.
   - **Likelihood**: Low (we're matching the existing pattern)
   - **Impact**: Medium (tests would be unreliable)
   - **Mitigation**: The fix follows the exact same pattern as the other three mocked functions. Visual code review will catch any issues.

2. **Incomplete Import**: If the import statement is not updated, the test will still fail.
   - **Likelihood**: Low (straightforward addition)
   - **Impact**: Medium (tests won't compile)
   - **Mitigation**: Vitest will immediately report compilation errors if import is missing.

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the commit: `git revert <commit-hash>`
2. Verify tests fail again with original error: `pnpm test:unit`
3. Investigate why the fix didn't work (unlikely given the simplicity)

**Monitoring**: No monitoring needed for this test fix - it's purely a code compilation issue.

## Performance Impact

**Expected Impact**: None

There is zero performance impact. This is a test fix that only affects the local development and CI environments. Production code is unchanged.

## Security Considerations

**Security Impact**: None

This is a test infrastructure change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reproduce the error
git checkout HEAD -- .ai/alpha/scripts/lib/__tests__/pty-wrapper.spec.ts
pnpm --filter @slideheroes/alpha-scripts test:coverage
```

**Expected Result**: Test fails with:
```
Error: [vitest] No "isFeatureFailed" export is defined on the "../progress-file.js" mock.
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (specific to the affected file)
pnpm --filter @slideheroes/alpha-scripts test:coverage

# Full unit test suite
pnpm test:unit

# Build
pnpm build
```

**Expected Result**: All commands succeed, tests pass, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# PR validation workflow should pass
# (verify in GitHub Actions)
```

## Dependencies

### New Dependencies

**No new dependencies required**

This fix uses only existing Vitest mocking capabilities already imported in the test file.

## Database Changes

**No database changes required**

This is a test infrastructure fix with no database implications.

## Deployment Considerations

**Deployment Risk**: None

This is a test fix only. No deployment is needed. The fix resolves a CI workflow issue without affecting production code.

**Backwards compatibility**: N/A - Test code only.

## Success Criteria

The fix is complete when:
- [ ] Mock declaration includes `isFeatureFailed: vi.fn()`
- [ ] Import statement includes `isFeatureFailed`
- [ ] Test at line 199 configures the mock: `vi.mocked(isFeatureFailed).mockReturnValue(false)`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm --filter @slideheroes/alpha-scripts test:coverage` passes
- [ ] `pnpm test:unit` passes with zero failures
- [ ] GitHub PR #1854 validation workflow completes successfully
- [ ] No regressions in other tests

## Notes

This is a straightforward mock synchronization issue caused by commit `aa633fa89` adding a new function import without updating the test mock. The fix is minimal (adding a single line to mock declaration and import) with zero risk.

The test at line 199 already exercises the code path that calls `isFeatureFailed()` but couldn't run because the mock wasn't defined. Once added, the existing test will validate the behavior correctly.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1859*
