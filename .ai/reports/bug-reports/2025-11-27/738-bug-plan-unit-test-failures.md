# Bug Fix: Unit Test Failures and Configuration Issues

**Related Diagnosis**: #735
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Three separate pre-existing test failures: pptx-generator test assertion mismatch, missing Vitest config in @kit/e2b, and placeholder test script in slideheroes-claude-agent
- **Fix Approach**: Update test assertion to match implementation, remove test script from packages without tests, add Vitest config to @kit/e2b
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Three unit test failures prevent `pnpm test:unit` from passing:

1. **pptx-generator.test.ts (Line 85)**: Test expects `defineSlideMaster()` to be called 9 times, but the implementation never calls it. Test was written before implementation changed.
2. **@kit/e2b**: Missing `vitest.config.ts` causes Vitest to inherit root config with invalid workspace paths relative to the package directory.
3. **slideheroes-claude-agent**: Uses npm default placeholder test script that always fails.

These are pre-existing issues (433/434 web tests pass). They don't affect application functionality but block CI/CD pipelines.

For full details, see diagnosis issue #735.

### Solution Approaches Considered

#### Option 1: Fix Test Assertion in pptx-generator.test.ts ⭐ RECOMMENDED

**Description**: Update the test assertion on line 85 from `toHaveBeenCalledTimes(9)` to match the actual implementation behavior. The `defineSlideMaster` call is not made in the constructor, so remove that assertion entirely.

**Pros**:
- Simplest fix with minimal code change
- Test still validates constructor behavior properly
- No changes needed to implementation
- Maintains test coverage

**Cons**:
- Loses assertion about `defineSlideMaster` calls
- Need to verify what the correct assertion should be

**Risk Assessment**: low - the test was already failing, we're just fixing the expectation to match reality

**Complexity**: simple - one-line change

#### Option 2: Remove Unused Test Assertions ⭐ RECOMMENDED FOR THIS ISSUE

**Description**: Rather than fixing to the wrong expectation, review what the constructor SHOULD actually do and either:
1. Update test to match actual implementation
2. Update implementation to call `defineSlideMaster` if it should

**Pros**:
- Ensures test reflects intended behavior
- Makes explicit what the constructor should validate
- Better long-term correctness

**Cons**:
- Requires understanding intended behavior
- May need implementation changes

**Risk Assessment**: low - diagnosis clearly shows implementation doesn't call it

**Complexity**: simple - review and adjust assertion

### Selected Solution: Fix Test Assertions to Match Implementation

**Justification**: The diagnosis shows the implementation never calls `defineSlideMaster` in the constructor. The test expectation is simply wrong. We should remove or update the assertion to match actual behavior. The other two issues (missing config and placeholder test) are straightforward removals.

**Technical Approach**:
- **pptx-generator.test.ts**: Remove the `defineSlideMaster` assertion or replace with correct expectation
- **@kit/e2b/package.json**: Remove the test script entirely (no test files exist)
- **slideheroes-claude-agent/package.json**: Remove or set to `exit 0` to prevent failure

**Architecture Changes**: None - these are configuration and test fixes only

**Migration Strategy**: Not needed - these changes don't affect data or APIs

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.test.ts` - Remove incorrect `defineSlideMaster` assertion on line 85
- `packages/e2b/package.json` - Remove test script
- `packages/e2b/e2b-template/package.json` - Review and fix if also has placeholder test
- `packages/slideheroes-claude-agent/package.json` - Remove test script or set to `exit 0`

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix pptx-generator.test.ts

Review line 85 and remove the incorrect `defineSlideMaster` assertion.

- Read the test file to understand what's being tested
- Identify the exact assertion that's failing
- Remove or replace the assertion with correct expectation
- Verify the test passes

**Why this step first**: This is the primary test failure affecting the web application tests

#### Step 2: Remove test script from @kit/e2b

The package has no test files, so remove the placeholder test script.

- Check if `packages/e2b/package.json` has a test script
- Remove the test script entry
- Verify no test files exist in the package

**Why this step second**: Prevents Vitest from trying to run tests in this package

#### Step 3: Fix slideheroes-claude-agent package

Address the placeholder test script.

- Check `packages/slideheroes-claude-agent/package.json`
- Either remove the test script or change to `"test": "exit 0"`
- Verify no actual test files that need to run

#### Step 4: Verify all tests pass

Run the full test suite to ensure all fixes work.

- Run `pnpm test:unit` to verify all tests pass
- Confirm no new failures introduced
- Check that affected test files now pass

#### Step 5: Validation

Confirm the fixes are complete and correct.

- Run type checking: `pnpm typecheck`
- Run linting: `pnpm lint`
- Run formatting check: `pnpm format`

## Testing Strategy

### Unit Tests

Tests already exist and should now pass:
- ✅ `apps/web/app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.test.ts` - Constructor behavior validation
- ✅ All existing web tests (433 others already passing)

### Integration Tests

No integration tests needed for this fix.

### E2E Tests

No E2E tests affected by these configuration fixes.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm test:unit` - All tests pass
- [ ] Run `pnpm test` - Full test suite passes
- [ ] Verify web tests: `pnpm --filter web test:unit`
- [ ] Verify e2b tests don't fail: `pnpm --filter @kit/e2b test:unit` (should be skipped or pass)
- [ ] Verify pnpm lint runs without errors
- [ ] Verify pnpm typecheck passes

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Removing assertion might hide real issues**: The `defineSlideMaster` assertion was expecting behavior that never happened. If it's truly required, we need to update the implementation instead.
   - **Likelihood**: low
   - **Impact**: medium (would need to implement missing functionality)
   - **Mitigation**: Review the test comment/intent to understand if the assertion was intentional

2. **Breaking changes to test coverage**: Removing assertions reduces test coverage.
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Ensure test still validates the important constructor behaviors

3. **Other packages with similar placeholder tests**: slideheroes-claude-agent might not be the only one.
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Check other package.json files for similar patterns

**Rollback Plan**:

If the fixes cause issues:
1. Revert the three file changes using git
2. Re-diagnose why the test expectation was originally set to 9 calls
3. Update implementation if `defineSlideMaster` should truly be called

**Monitoring** (if needed):
- Monitor CI/CD pipeline to ensure tests pass consistently
- Watch for any pptx generation issues if the assertion removal affects real behavior

## Performance Impact

**Expected Impact**: none

These are test and configuration fixes only. No runtime code changes.

## Security Considerations

No security implications.

## Validation Commands

### Before Fix (Tests Should Fail)

```bash
# Run unit tests - should see 3 failures
pnpm test:unit
```

**Expected Result**: 3 failures:
1. pptx-generator.test.ts line 85 assertion failure
2. @kit/e2b test execution error
3. slideheroes-claude-agent placeholder test failure

### After Fix (All Tests Should Pass)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Unit tests
pnpm test:unit

# Full test suite
pnpm test

# Web-specific tests
pnpm --filter web test:unit
```

**Expected Result**: All commands succeed with no test failures.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specifically verify pptx tests
pnpm test:unit pptx-generator
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - these are test fixes only

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] `pnpm test:unit` passes with zero failures
- [ ] `pnpm test` passes with zero new failures
- [ ] No regressions detected
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

- These are pre-existing issues, not caused by recent changes
- 433/434 web tests already pass - only 1 actual test failure in the main app
- The issues don't affect application functionality, only CI/CD pipeline
- After fixing these, the test suite should be fully functional

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #735*
