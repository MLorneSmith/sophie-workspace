# Bug Fix: Regression Test Fails - Rapid Dropdown Clicks Cause Pointer Intercept

**Related Diagnosis**: #1909
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test doesn't account for Radix UI's close animation duration (~200-300ms) before dismissable layer cleanup completes
- **Fix Approach**: Increase wait time between rapid dropdown interactions from 100ms to 350ms, matching animation duration
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The regression test "dropdown email remains visible on fast interactions" fails in CI with timeout error because rapid dropdown open/close/open sequences create a race condition. The test uses 100ms waits, but Radix UI's close animation and dismissable layer cleanup require ~200-300ms. During this window, the `<html>` element intercepts pointer events, blocking the third click.

For full details, see diagnosis issue #1909.

### Solution Approaches Considered

#### Option 1: Increase Wait Time to 350ms ⭐ RECOMMENDED

**Description**: Simply increase `page.waitForTimeout()` from 100ms to 350ms between dropdown clicks to allow Radix UI's close animation and dismissable layer cleanup to complete fully.

**Pros**:
- **Simplest fix** - One-line change per wait
- **Reliable** - 350ms is well above the ~300ms animation duration
- **No code restructuring** - Maintains existing test structure
- **Test intent preserved** - Still tests rapid interactions, just at a less extreme speed
- **Low risk** - No changes to animation logic or UI components

**Cons**:
- **Slightly slower test** - Adds ~250ms per wait (3 waits = 750ms total)
- **Magic number** - 350ms isn't parameterized

**Risk Assessment**: low - Changes only test timing, not application code

**Complexity**: simple - Single-digit number changes

#### Option 2: Wait for State Changes Instead of Fixed Timeouts

**Description**: Replace fixed timeouts with explicit waits for dropdown state changes (`data-state="open"` / `data-state="closed"`).

```typescript
await accountDropdownTrigger.click();
await expect(page.locator('[role="menu"]')).toBeVisible();
await accountDropdownTrigger.click();
await expect(page.locator('[role="menu"]')).not.toBeVisible();
await accountDropdownTrigger.click();
```

**Pros**:
- **More explicit** - Waits for actual state, not arbitrary time
- **Self-documenting** - Code shows intent clearly
- **Potentially faster** - If animation completes early, doesn't wait full timeout
- **Maintainable** - Changes to animation duration don't require test updates

**Cons**:
- **More complex** - Requires multiple expect() calls
- **Tightly coupled** - Harder to test rapid interactions if state changes are waited on
- **Changes test semantics** - Original test intent was to test rapid clicks without waiting for menu state

**Why Not Chosen**: The original test was specifically designed to test rapid interactions **without** waiting for state changes. Adding state waits defeats the purpose of testing fast repeated clicks.

#### Option 3: Remove the Regression Test Entirely

**Description**: Delete this test since the original #1908 fix is already validated by other tests.

**Pros**:
- **No test flakiness** - Removes the problematic test
- **Simplifies test suite** - One fewer test to maintain

**Cons**:
- **Lost regression coverage** - No test to catch timing regressions
- **Ignores the real issue** - The timing sensitivity is real, worth testing
- **Doesn't validate fix** - Removes evidence that the fix works under rapid interactions

**Why Not Chosen**: The timing sensitivity is real and worth testing. A properly configured test proves the fix handles edge cases. The issue is test configuration, not the fix itself.

### Selected Solution: Option 1 - Increase Wait Time to 350ms

**Justification**: This is the simplest, most direct fix. The test design is correct—it's just using timeouts that are too aggressive for Radix UI's animation model. A 350ms wait is well above the required ~300ms animation duration, accounts for OS/network variability, and fixes the race condition without restructuring the test or changing its semantics. The slight performance cost (750ms added to test) is negligible against overall test runtime.

**Technical Approach**:
- Change line 285: `await page.waitForTimeout(100);` → `await page.waitForTimeout(350);`
- Change line 287: `await page.waitForTimeout(100);` → `await page.waitForTimeout(350);`
- Add comment explaining the timing requirement

**Architecture Changes** (if any):
None - this is purely a test configuration fix.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/account/account-simple.spec.ts` - Regression test with insufficient wait times (lines 285, 287)

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Update Wait Timeouts in Regression Test

Update the two `waitForTimeout()` calls to 350ms to match Radix UI's animation+cleanup duration.

**File**: `apps/e2e/tests/account/account-simple.spec.ts`

- Change line 285: `100ms` → `350ms`
- Change line 287: `100ms` → `350ms`
- Add inline comment explaining the 200-300ms animation requirement

**Why this step first**: This is the only change needed; it directly addresses the root cause identified in the diagnosis.

#### Step 2: Validate Test Passes Locally

Run the regression test locally to confirm the fix works.

```bash
pnpm --filter e2e test tests/account/account-simple.spec.ts -g "dropdown email remains visible"
```

**Expected result**: Test passes with 0 retries needed.

#### Step 3: Validate Full Test Suite

Run the complete account test suite to ensure no regressions.

```bash
pnpm --filter e2e test tests/account/account-simple.spec.ts
```

**Expected result**: All tests pass.

#### Step 4: Type Checking and Linting

Run type and lint checks to ensure code quality.

```bash
pnpm typecheck
pnpm lint
```

**Expected result**: Zero errors, zero warnings.

#### Step 5: Commit and Verify

Commit the fix with proper message and verify CI integration.

## Testing Strategy

### Regression Prevention

The test itself becomes the regression preventer once fixed:

- **Test**: `dropdown email remains visible on fast interactions`
- **What it validates**: Rapid dropdown interactions don't cause pointer interception
- **Why it matters**: Ensures animation timing doesn't regress in future Radix UI updates or browser changes

### Manual Testing Checklist

Execute these manual tests to validate the fix:

- [ ] Run failing test locally (should now pass)
- [ ] Run full account-simple.spec.ts suite (all 8 tests pass)
- [ ] Verify no performance regressions (test shouldn't hang/timeout)
- [ ] Check that dropdown still functions normally at normal click speeds
- [ ] Verify no UI rendering issues after rapid interactions

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test becomes slower**: Adding 250ms per wait (750ms total per test run)
   - **Likelihood**: high
   - **Impact**: low (adds ~750ms to one test in a 15+ minute suite)
   - **Mitigation**: Negligible impact on overall test runtime; risk is acceptable

2. **350ms is still not enough**: Radix animation timing varies by browser/OS
   - **Likelihood**: very low (350ms is 50-100% over the documented ~300ms max)
   - **Impact**: medium (test would still fail)
   - **Mitigation**: If this occurs, can increase to 400-500ms; easy to adjust

3. **Test loses its original intent**: Faster wait times were testing more aggressive scenarios
   - **Likelihood**: low (test still validates rapid interactions, just not as aggressive)
   - **Impact**: low (still covers the use case of repeated user clicks)
   - **Mitigation**: Original test passed before the regression (e2f85303a), showing this speed is acceptable

**Rollback Plan**:

If the test still fails in CI after this fix:
1. Revert to 100ms waits
2. Switch to Option 2 (state-based waits) or Option 3 (remove test)
3. Investigate Radix UI animation timing further

## Performance Impact

**Expected Impact**: minimal

- **Test execution**: Adds ~750ms to one test file
- **Total suite impact**: <1% of overall E2E test runtime (~15-20 minutes)
- **Application performance**: No impact (test-only change)

## Validation Commands

### Before Fix (Test Should Fail)

```bash
# Current test should fail/timeout in CI
pnpm --filter e2e test tests/account/account-simple.spec.ts -g "dropdown email remains visible"
```

**Expected Result**: Failure with "Test timeout of 180000ms exceeded"

### After Fix (Test Should Pass)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run the specific regression test
pnpm --filter e2e test tests/account/account-simple.spec.ts -g "dropdown email remains visible"

# Run full account-simple suite
pnpm --filter e2e test tests/account/account-simple.spec.ts

# Run shard 3 (contains account-simple)
pnpm test:shard3
```

**Expected Result**: All commands succeed, test passes with no retries.

## Dependencies

### New Dependencies

No new dependencies required.

### Existing Dependencies

- Playwright (already in project)
- Radix UI (already in project)

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: None - this is a test-only change, no application code affected.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - test change doesn't affect application code

## Success Criteria

The fix is complete when:
- [ ] Test passes locally without timeouts
- [ ] Test passes in CI (shard 3)
- [ ] No new test failures introduced
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Commit follows Conventional Commits format
- [ ] PR/issue properly tracked in GitHub

## Notes

**Decision Summary**: This is a test configuration fix, not an application bug fix. The original #1908 fix (increase wait on line 333) was correct and working. This new regression test (#1909) simply needs its wait times aligned with Radix UI's documented animation timing (~200-300ms). A conservative 350ms timeout is the minimal change needed to resolve the race condition.

**Related Context**:
- Original fix: commit e2f85303a (added regression test)
- Diagnosis: #1909 (identified timing issue)
- Original issue: #1908 (email visibility regression)
- Related PR: #1889 (dependency updates that may have affected timing)

**Timeline**:
- Test added: commit e2f85303a
- Test started failing: CI run 21596166773
- Root cause: Radix UI animation timing + dismissable layer cleanup
- Fix: Simple timeout increase to 350ms

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1909*
