# Bug Fix: CI Dropdown Tests Still Failing - Radix UI DismissableLayer Blocking Clicks

**Related Diagnosis**: #1911
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Radix UI's `DismissableLayer` applies `pointer-events: none` to the `<html>` element when dropdown is open, blocking clicks to the trigger button
- **Fix Approach**: Use `force: true` on Playwright clicks when the dropdown is open, or use Escape key to close
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The regression test `dropdown email remains visible on fast interactions` fails because it attempts to click the dropdown trigger while the dropdown is open. Radix UI's `DismissableLayer` component blocks pointer events on the `<html>` element to enforce its dismiss-on-outside-click behavior. The test times out after 180 seconds of retry attempts.

The previous fix (#1910) incorrectly increased wait times from 100ms to 350ms, which didn't address the actual root cause.

For full details, see diagnosis issue #1911.

### Solution Approaches Considered

#### Option 1: Use `force: true` on Clicks ⭐ RECOMMENDED

**Description**: Use Playwright's `force: true` option to bypass pointer-events blocking when clicking the dropdown trigger to close it.

**Pros**:
- Minimal test changes (single line per problematic click)
- Directly addresses the root cause (bypasses DismissableLayer's pointer-events:none)
- No changes to application code
- Works with existing Radix UI DismissableLayer design
- Playwright-documented pattern for pointer-events issues

**Cons**:
- Slightly less realistic (forces click when element would normally block it)
- Doesn't test the exact user interaction flow (though the user would use keyboard/outside clicks instead)

**Risk Assessment**: low - This is a test-only change, not application code. `force: true` is specifically designed for this scenario.

**Complexity**: simple - Add parameter to existing click calls.

#### Option 2: Use Escape Key to Close Dropdown

**Description**: Instead of clicking the trigger to close, press Escape key which dismisses dropdowns by design.

**Pros**:
- More realistic user interaction (matches actual user behavior)
- Tests Radix UI's keyboard handling
- No pointer-events issues with keyboard input

**Cons**:
- Requires refactoring test flow (not just adding parameters)
- More test code changes
- May not test the specific trigger-click-to-close flow

**Why Not Chosen**: Option 1 is simpler and more direct. If the test is meant to verify rapid toggle behavior, `force: true` is more appropriate.

#### Option 3: Remove the Rapid-Click Test

**Description**: Remove the `dropdown email remains visible on fast interactions` test entirely.

**Pros**:
- Simplifies test suite
- Removes test that verifies Radix UI behavior rather than app behavior

**Cons**:
- Loses regression test for rapid interactions
- Doesn't fix root cause of the pointer-events issue
- Reduces test coverage

**Why Not Chosen**: The test has value (verifies rapid dropdown toggles work), but the implementation needs fixing, not removal.

### Selected Solution: Use `force: true` on Clicks

**Justification**: The root cause is architectural (Radix UI's DismissableLayer design prevents clicks on elements when the dropdown is open). Playwright's `force: true` is the documented pattern for bypassing pointer-events blocking. This is a test-only change with minimal risk and maximum simplicity. The test still verifies the functionality (email visibility and dropdown toggle) while working with Radix UI's design.

**Technical Approach**:
- Identify all clicks on the dropdown trigger that fail due to pointer-events blocking
- Add `{ force: true }` option to those specific clicks
- Ensure other assertions remain unchanged
- Verify the test now passes while still checking email visibility and dropdown state

**Architecture Changes**: None. This is a test-only fix.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/account/account-simple.spec.ts` (lines 262-309) - Contains the failing test with dropdown trigger clicks
  - Specific changes: Add `{ force: true }` to clicks on `[data-testid="account-dropdown"]` that occur when the dropdown is already open

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Understand the Current Test Flow

<describe what this step accomplishes>
- Read the failing test in `apps/e2e/tests/account/account-simple.spec.ts` (lines 262-309)
- Identify which specific click attempts fail (those with `data-state="open"` in the error logs)
- Note the exact sequence: click to open (success) → wait → click to close (FAILS)

**Why this step first**: Must understand the test flow before applying the fix to ensure we target the right clicks.

#### Step 2: Apply `force: true` to Problem Clicks

<describe what this step accomplishes>
- Locate line 288 in `account-simple.spec.ts` where the second click fails
- Change the click to include `{ force: true }` option
- If there are other rapid-toggle tests with the same issue, apply the same fix

**Example change**:
```typescript
// BEFORE (fails with pointer-events blocking)
await accountDropdownTrigger.click();

// AFTER (bypasses pointer-events:none)
await accountDropdownTrigger.click({ force: true });
```

#### Step 3: Update Test for `settings page shows user email`

<describe what this step accomplishes>
- Investigate if this test fails for the same reason
- Apply `force: true` fix if needed
- Verify this test targets line 213 area

#### Step 4: Run the Fixed Tests Locally

<describe what this step accomplishes>
- Execute the specific failing test to verify the fix works
- Run both tests mentioned in the diagnosis:
  - `dropdown email remains visible on fast interactions` (line 262)
  - `settings page shows user email` (line 213)
- Confirm no timeout errors and tests complete successfully

#### Step 5: Run Full Test Suite to Check for Regressions

<describe what this step accomplishments>
- Run the entire `apps/e2e/tests/account/account-simple.spec.ts` file
- Verify no other tests are affected
- Check that test assertions still verify email visibility correctly

#### Step 6: Validate Against Original Issue (#1908)

<describe what this step accomplishes>
- Confirm that the email visibility feature (original issue #1908) still works correctly
- Verify that the test still checks for email in the dropdown
- Ensure the fix doesn't bypass the actual functionality being tested

## Testing Strategy

### Unit Tests

No unit tests needed - this is a test-only fix with no application code changes.

### Integration Tests

No integration tests needed.

### E2E Tests

**Tests to verify**:
- ✅ `dropdown email remains visible on fast interactions` (line 262) - should now pass
- ✅ `settings page shows user email` (line 213) - should now pass or be investigated
- ✅ Email remains visible in dropdown menu (original fix from #1908)
- ✅ Dropdown correctly opens and closes with multiple interactions
- ✅ No timeout errors or pointer-events failures

**Test files**:
- `apps/e2e/tests/account/account-simple.spec.ts` - Primary test file with the failing tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run test locally: `pnpm --filter e2e test tests/account/account-simple.spec.ts`
- [ ] Verify test passes without timeout
- [ ] Check CI logs show both failing tests now passing
- [ ] Verify no other account tests were affected
- [ ] Confirm email is visible in dropdown menu (visual verification if needed)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test No Longer Tests "Natural" Click**: Using `force: true` bypasses the pointer-events blocking that would normally prevent the click.
   - **Likelihood**: medium
   - **Impact**: low - The test still verifies functionality; it's just forcing the click instead of waiting for pointer-events to clear
   - **Mitigation**: This is acceptable because the root cause (Radix UI's design) is architectural. A real user would close the dropdown via Escape key or outside click, not by clicking the trigger. The test is verifying toggle behavior, which still works with `force: true`.

2. **Other Tests Using Dropdown**: If other tests have similar dropdown interaction patterns, they might also need fixing.
   - **Likelihood**: low - Only this specific test was reported as failing
   - **Impact**: medium - Could mask other issues
   - **Mitigation**: Run full E2E suite to detect other similar issues.

3. **Radix UI Version Changes**: Future Radix UI updates might change DismissableLayer behavior.
   - **Likelihood**: low
   - **Impact**: low - If DismissableLayer behavior changes, the `force: true` might no longer be needed (or might cause different issues)
   - **Mitigation**: Monitor Radix UI changelog; revisit if major version updates occur.

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the `{ force: true }` additions in `account-simple.spec.ts`
2. Consider alternative approaches (Escape key, removing test)
3. Open new issue for further investigation

**Monitoring** (if needed):

- Monitor CI logs for this test shard (shard 3 per the config)
- No application monitoring needed (test-only change)

## Performance Impact

**Expected Impact**: none

No performance impact - this is a test change only, not application code. The test may run slightly faster if the `force: true` eliminates timeout retry loops.

## Security Considerations

**Security Impact**: none

This is a test-only change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to test directory
cd /home/msmith/projects/2025slideheroes

# Run the specific failing tests
pnpm --filter e2e test tests/account/account-simple.spec.ts --grep "dropdown email remains visible"

# Expected Result: Test times out after 180+ seconds with:
# "locator.click: Test timeout of 180000ms exceeded"
# "\<html\> intercepts pointer events"
```

**Expected Result**: Test fails with pointer-events blocking error, times out.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the specific fixed tests
pnpm --filter e2e test tests/account/account-simple.spec.ts --grep "dropdown email remains visible|settings page shows user email"

# Run full account tests to check for regressions
pnpm --filter e2e test tests/account/account-simple.spec.ts

# Run full E2E suite (if possible)
pnpm --filter e2e test
```

**Expected Result**: All commands succeed, both failing tests now pass, no new failures introduced, email visibility verified in dropdown.

### Regression Prevention

```bash
# Run full account test suite to ensure no regressions
pnpm --filter e2e test tests/account/account-simple.spec.ts

# Run shard 3 (contains account tests)
pnpm --filter e2e test:shard3

# Additional regression checks
# (verify no other dropdown tests are affected)
pnpm --filter e2e test --grep "dropdown"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - Using existing Playwright `{ force: true }` option.

### Existing Dependencies Used

- Playwright (already in use)
- Radix UI DropdownMenu (already in use)

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none (test-only change)

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained

This is a test fix, not a code change. No deployment considerations.

## Success Criteria

The fix is complete when:
- [ ] Both failing tests pass without timeout errors
- [ ] No pointer-events blocking errors in CI logs
- [ ] All other account tests pass (no regressions)
- [ ] Full E2E test suite passes
- [ ] Email visibility in dropdown is still verified by the test
- [ ] CI workflow completes successfully
- [ ] Code review approved (if applicable)

## Notes

The root cause (Radix UI's DismissableLayer applying `pointer-events: none`) is by design and not a bug in the application. The test was attempting to interact with the page in a way that conflicts with Radix UI's architecture. Using `force: true` is the appropriate fix for this scenario, as documented in Playwright's troubleshooting guides for pointer-events issues.

The test still provides value by verifying:
1. Dropdown can be toggled multiple times
2. Email remains visible in the dropdown
3. No errors or timeouts occur during rapid interactions

This fix makes the test compatible with Radix UI's design while maintaining these verification goals.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1911*
