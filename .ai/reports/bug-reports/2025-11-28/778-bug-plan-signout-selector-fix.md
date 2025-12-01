# Bug Fix: Sign-out test selector mismatch

**Related Diagnosis**: #777
**Severity**: medium
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Commit `93bb87a32` changed the account dropdown's `data-testid` from `"account-dropdown-trigger"` to `"account-dropdown"`, but test selectors were not updated
- **Fix Approach**: Update 4 test/doc files to use the correct selector
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test "sign out clears session" fails because the `signOut()` method in `AuthPageObject` uses the old selector `[data-testid="account-dropdown-trigger"]` which no longer exists. The component was updated in commit `93bb87a32` to use `[data-testid="account-dropdown"]`, but the corresponding test files were not updated. This is a straightforward selector mismatch that prevents the test from finding the account dropdown trigger element.

For full details, see diagnosis issue #777.

### Solution Approaches Considered

#### Option 1: Update test selectors to match new component selector ⭐ RECOMMENDED

**Description**: Update all occurrences of `account-dropdown-trigger` to `account-dropdown` in the 4 affected files (`auth.po.ts`, `account-simple.spec.ts`, `AGENTS.md`, `CLAUDE.md`).

**Pros**:
- Simple find-and-replace fix with no logic changes needed
- Zero risk since we're simply correcting selectors to match the current component implementation
- Aligns test code with the actual component selector
- Resolves the immediate test failure
- Follows the principle of keeping test selectors synchronized with component implementation

**Cons**:
- None - this is a straightforward correction

**Risk Assessment**: low - This is purely a selector string fix with no behavioral changes

**Complexity**: simple - Text replacement in 4 files

#### Option 2: Revert commit 93bb87a32 to restore the old selector

**Description**: Undo the selector change from commit `93bb87a32` to restore `account-dropdown-trigger`.

**Why Not Chosen**: This approach would revert the data-test to data-testid standardization effort from PR #732, which was a broader quality initiative. The component change was intentional, so the tests should be updated to match, not the component reverted.

### Selected Solution: Update test selectors to match new component selector

**Justification**: This is a simple, low-risk selector correction. The component has already been updated with the new selector in production code, and the tests should reflect the current implementation. This aligns the test code with reality without introducing any behavioral changes or risking functionality.

**Technical Approach**:
- Replace `[data-testid="account-dropdown-trigger"]` with `[data-testid="account-dropdown"]` in `auth.po.ts` line 47
- Replace `[data-testid="account-dropdown-trigger"]` with `[data-testid="account-dropdown"]` in `account-simple.spec.ts` line 176
- Update documentation examples in `AGENTS.md` and `CLAUDE.md` to reflect the correct selector

**Architecture Changes** (if any):
None. This is purely a selector string update with no architectural impact.

**Migration Strategy** (if needed):
None needed. This is a simple correction to existing code.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/authentication/auth.po.ts:47` - Update `signOut()` method selector in AuthPageObject
- `apps/e2e/tests/account/account-simple.spec.ts:176` - Update selector in test file
- `apps/e2e/AGENTS.md:20` - Update documentation example with correct selector
- `apps/e2e/CLAUDE.md:20` - Update documentation example with correct selector

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update auth.po.ts selector

Update the `signOut()` method in `AuthPageObject` to use the correct selector.

- Open `apps/e2e/tests/authentication/auth.po.ts`
- Find line 47 where `signOut()` uses `[data-testid="account-dropdown-trigger"]`
- Replace with `[data-testid="account-dropdown"]`
- Verify the change is isolated to this selector only

**Why this step first**: This is the primary location where the selector is used in the Page Object Model, which is the source of truth for test selectors

#### Step 2: Update account-simple.spec.ts selector

Update the selector in the account-simple test file.

- Open `apps/e2e/tests/account/account-simple.spec.ts`
- Find line 176 where the old selector `[data-testid="account-dropdown-trigger"]` is used
- Replace with `[data-testid="account-dropdown"]`
- Verify context to ensure this is the correct location

**Why this step second**: This is the second test file location that needs correction

#### Step 3: Update AGENTS.md documentation

Update the documentation example to show the correct selector.

- Open `apps/e2e/AGENTS.md`
- Find line 20 with the example showing the old selector
- Replace `account-dropdown-trigger` with `account-dropdown`
- Verify the example is now consistent with actual component implementation

**Why this step third**: Documentation should reflect current implementation to avoid confusing developers

#### Step 4: Update CLAUDE.md documentation

Update the documentation example in CLAUDE.md.

- Open `apps/e2e/CLAUDE.md`
- Find line 20 with the example showing the old selector
- Replace `account-dropdown-trigger` with `account-dropdown`
- Verify the example is now consistent with actual component implementation

**Why this step fourth**: Documentation should reflect current implementation to avoid confusing developers

#### Step 5: Verify the fix

Run the affected test to confirm the fix works.

- Run the specific test that was failing: `pnpm --filter web-e2e test:shard2 -- auth-simple`
- Verify the "sign out clears session" test now passes
- Check that no other tests are negatively affected
- Run the full E2E test suite if time permits to ensure no regressions

**Why this step last**: Validation confirms the fix resolves the original issue

## Testing Strategy

### Unit Tests

No new unit tests needed for this fix. The test selectors are validated by the E2E tests themselves.

### Integration Tests

No new integration tests needed. This is a pure selector correction.

### E2E Tests

The existing "sign out clears session" test in `auth-simple.spec.ts` will validate this fix.

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - The primary test that validates the selector fix

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run E2E shard 2: `pnpm --filter web-e2e test:shard2`
- [ ] Verify the "sign out clears session" test passes
- [ ] Run full test suite: `pnpm --filter web-e2e test` (optional if time permits)
- [ ] Check browser console for any selector-related errors
- [ ] Verify account dropdown still functions correctly on the page

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Selector used in other locations**: If `account-dropdown-trigger` is used elsewhere in the codebase, this fix might be incomplete
   - **Likelihood**: low (diagnosis already identified the 4 affected files)
   - **Impact**: low (test would still fail if selector exists elsewhere)
   - **Mitigation**: After making changes, run a grep search for `account-dropdown-trigger` to confirm no other instances exist

2. **Component selector changed again**: If the component selector is changed in the future, tests will need to be updated again
   - **Likelihood**: low (selector changes should be coordinated with test updates going forward)
   - **Impact**: low (would result in test failure, easily detected and fixed)
   - **Mitigation**: Add to code review checklist: "If changing data-testid attributes, update corresponding test selectors"

**Rollback Plan**:

If this fix causes unexpected issues (unlikely):
1. Revert the 4 file changes using git
2. The test will return to its previous failing state (no harm)
3. Re-evaluate the root cause

**Monitoring** (if needed):

None needed. This is a simple selector fix with no runtime implications.

## Performance Impact

**Expected Impact**: none

No performance implications. This is purely a selector string update that corrects test code to match component implementation.

## Security Considerations

No security implications. This is purely fixing test code selectors.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the specific test shard with the failing test
pnpm --filter web-e2e test:shard2
```

**Expected Result**: The "sign out clears session" test fails with a timeout error waiting for `[data-testid="account-dropdown-trigger"]`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the specific test that was failing
pnpm --filter web-e2e test:shard2 -- auth-simple

# Run full E2E test suite to check for regressions
pnpm --filter web-e2e test
```

**Expected Result**: All commands succeed, "sign out clears session" test passes, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Check for any remaining references to the old selector
grep -r "account-dropdown-trigger" apps/e2e/ --include="*.ts" --include="*.tsx" --include="*.md"
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None needed

**Feature flags needed**: no

**Backwards compatibility**: maintained (this is a test fix, no API or component changes)

## Success Criteria

The fix is complete when:
- [ ] All 4 files have been updated with the correct selector
- [ ] The "sign out clears session" test passes
- [ ] No regressions detected in other E2E tests
- [ ] Grep search confirms no other references to `account-dropdown-trigger` exist
- [ ] Code review approved (if applicable)
- [ ] All validation commands pass

## Notes

This is a straightforward selector correction resulting from commit `93bb87a32` (PR #732) which standardized data-test attributes to data-testid but also renamed the dropdown trigger. The tests simply need to be updated to match the new selector name. No logic changes or behavioral modifications are needed.

The fix is low-risk because:
1. It's purely a selector string update
2. No component logic is changing
3. No API changes
4. No database changes
5. No new dependencies
6. All changes are isolated to test/documentation files

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #777*
