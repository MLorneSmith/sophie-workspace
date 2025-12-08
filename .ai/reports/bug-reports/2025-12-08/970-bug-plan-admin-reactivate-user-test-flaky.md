# Bug Fix: Admin 'reactivate user flow' test fails due to unreliable filter mechanism

**Related Diagnosis**: #969
**Severity**: medium
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `filterAccounts()` function uses a hardcoded 250ms timeout that's insufficient for the admin accounts table to refresh with filtered results, causing intermittent test failures
- **Fix Approach**: Replace fixed timeout with Playwright's `toPass()` pattern that verifies table contains filtered results before proceeding
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test "Admin > Personal Account Management > reactivate user flow" fails intermittently in shard 4 due to an unreliable filter mechanism. The `filterAccounts()` function fills the filter input and presses Enter, then waits only 250ms for the table to refresh. This arbitrary timeout is insufficient when the DOM is slower to update, causing `selectAccount()` to fail because it can't find the filtered row in the table.

For full details, see diagnosis issue #969.

### Solution Approaches Considered

#### Option 1: Wrap filterAccounts() in toPass() with table verification ⭐ RECOMMENDED

**Description**: Use Playwright's `toPass()` pattern to automatically retry the entire filter operation until the table visibly contains the filtered results. After filling and pressing Enter, wait for the filtered row to appear before returning.

**Pros**:
- Aligns with established E2E testing patterns documented in `apps/e2e/CLAUDE.md`
- Handles variable DOM update latency without guessing timeouts
- True verification (we confirm row exists) rather than hoping timeout is long enough
- Follows same pattern as existing `selectAccount()` and `loginAsUser()` implementations
- Will catch future regressions if filter logic changes

**Cons**:
- Slightly more code than increasing the timeout
- None - this is the correct pattern

**Risk Assessment**: low - Playwright's `toPass()` is proven production pattern, no code logic changes

**Complexity**: simple - Copy existing pattern from `selectAccount()`

#### Option 2: Increase hardcoded timeout to 5000ms

**Description**: Simply increase the `waitForTimeout(250)` to `waitForTimeout(5000)` to accommodate slower DOM updates.

**Pros**:
- Minimal change, one line
- Immediately fixes the failing tests

**Cons**:
- Still relies on guessing a "safe" timeout that works everywhere
- No verification that table actually contains filtered results
- Will add 4.75 seconds to every test execution (cumulative across test suite)
- May still fail in very slow CI environments
- Violates E2E testing best practices (should never use arbitrary waits)

**Why Not Chosen**: Creates artificial test slowness and doesn't actually verify the state change we care about. The diagnostic already identified this hardcoded timeout as the PROBLEM, so fixing the symptom (timeout too short) is wrong - we need to fix the cause (no verification).

#### Option 3: Use networkidle instead

**Description**: Replace the timeout with `await page.waitForLoadState('networkidle')` to wait for network requests to settle.

**Pros**:
- No arbitrary timeout value to guess
- Waits for all network activity to complete

**Cons**:
- Table refresh may not involve network calls (could be local React state)
- `networkidle` can take indefinitely if there's background network noise
- Doesn't verify the actual UI state we need (filtered row visible)
- More fragile than direct DOM verification

**Why Not Chosen**: The filter is a client-side React component refresh, not a network operation. We need to verify the DOM changed, not network activity.

### Selected Solution: Wrap filterAccounts() in toPass() with table verification

**Justification**: This approach is proven in production code (`selectAccount()`, `loginAsUser()`), directly solves the root cause (no verification of filter application), and aligns with project standards documented in `apps/e2e/CLAUDE.md`. It's the same pattern recommended for all unreliable operations in Playwright.

**Technical Approach**:
- Wrap the filter operation in `await expect(async () => { ... }).toPass()`
- Fill the filter input and press Enter
- Wait for the filtered row to appear in the table (same selector as `selectAccount()`)
- Use exponential backoff intervals `[500, 1000, 2000]` matching other flaky operations
- Set timeout to 10000ms (10 seconds) to ensure it completes even on slow systems

**Architecture Changes** (if any):
- None - this is a localized test fix, no production code changes

**Migration Strategy** (if needed):
- Not applicable - pure test code fix

## Implementation Plan

### Affected Files

- `apps/e2e/tests/admin/admin.spec.ts` - `filterAccounts()` function (lines 452-460) - Replace hardcoded timeout with `toPass()` pattern
- `apps/e2e/tests/admin/admin.spec.ts` - All test calls to `filterAccounts()` - No changes needed, function signature stays the same

### New Files

- None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update filterAccounts() function with toPass() pattern

Update the function to wrap the filter operation in `expect().toPass()`:

```typescript
async function filterAccounts(page: Page, email: string) {
  // Wait for filter to be applied and row to appear in table
  await expect(async () => {
    // Fill and submit filter
    await page
      .locator('[data-testid="admin-accounts-table-filter-input"]')
      .first()
      .fill(email);

    await page.keyboard.press("Enter");

    // Verify filtered row appears in table
    // Use same selector as selectAccount() for consistency
    const row = page.locator("tr", { hasText: email.split("@")[0] });
    await expect(row).toBeVisible({ timeout: 2000 });
  }).toPass({
    intervals: [500, 1000, 2000],
    timeout: 10000,
  });
}
```

**Why this step first**: This is the core fix that resolves the flaky test. Everything else depends on this working correctly.

#### Step 2: Verify function logic

- Ensure the email domain is correctly stripped with `.split("@")[0]`
- Confirm the row selector matches what's used in `selectAccount()`
- Verify timeout intervals are reasonable (total: 3.5s backoff + 2s per attempt = ~10s max)

#### Step 3: Run test in isolation

Execute the specific failing test to verify the fix works:

```bash
pnpm --filter e2e test admin.spec.ts -g "reactivate user flow"
```

**Expected result**: Test should consistently pass multiple times

#### Step 4: Run full admin test suite

Run all admin tests to ensure no regressions:

```bash
pnpm --filter e2e test admin.spec.ts
```

**Expected result**: All admin tests should pass

#### Step 5: Run E2E shard 4

Run the full shard where the test fails to confirm fix in context:

```bash
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
```

**Expected result**: Shard 4 should pass with no flaky failures

## Testing Strategy

### Unit Tests

Not applicable - this is a test fixture fix, not production code.

### Integration Tests

Not applicable - this is E2E test maintenance.

### E2E Tests

Test the fix with the same E2E tests that were failing:

**Test files**:
- `apps/e2e/tests/admin/admin.spec.ts` - All tests using `filterAccounts()`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run "reactivate user flow" test 5 times in isolation - should pass all 5
- [ ] Run full admin.spec.ts test file - should pass with no flaky failures
- [ ] Run E2E shard 4 (where test originally fails) - should pass consistently
- [ ] Monitor test execution time - should not add significant delay
- [ ] Check console logs - should see "filter applied" message confirming new code path

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Filter selector changes**: If the DOM selector `[data-testid="admin-accounts-table-filter-input"]` changes, tests will fail
   - **Likelihood**: low (data-testid is stable attribute)
   - **Impact**: low (test will obviously fail, easy to fix)
   - **Mitigation**: Keep selector test in mind if modifying admin table component

2. **Email parsing edge case**: If email format contains multiple `@` symbols
   - **Likelihood**: very low (email format is standardized)
   - **Impact**: low (test would fail, would be caught immediately)
   - **Mitigation**: None needed for test emails, but worth noting

3. **Table row selector changes**: If the row HTML structure changes
   - **Likelihood**: low (tr with text is robust selector)
   - **Impact**: low (test would fail, easy to fix)
   - **Mitigation**: Selector is consistent with existing `selectAccount()` usage

**Rollback Plan**:

If this fix causes unexpected issues in production:
1. Revert to the original `filterAccounts()` function with 250ms timeout
2. Temporarily increase timeout to 5000ms as interim fix: `await page.waitForTimeout(5000);`
3. Re-run tests to confirm revert works

**Monitoring** (if needed):

None required - this is a test-only change with no production impact.

## Performance Impact

**Expected Impact**: none

The `toPass()` pattern will likely be slightly faster than arbitrary timeouts because it stops as soon as the condition is met, rather than always waiting for the full timeout. Test execution should be imperceptibly faster or equal.

## Security Considerations

None - this is test code only, no production impact or security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Clone the current behavior (will fail intermittently)
pnpm --filter e2e test admin.spec.ts -g "reactivate user flow"
# Run multiple times, some will fail with table filter timeout
```

**Expected Result**: Test fails intermittently with "Timeout 250ms exceeded waiting for filter results" or similar

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the specific test 5 times to verify consistency
pnpm --filter e2e test admin.spec.ts -g "reactivate user flow"
pnpm --filter e2e test admin.spec.ts -g "reactivate user flow"
pnpm --filter e2e test admin.spec.ts -g "reactivate user flow"
pnpm --filter e2e test admin.spec.ts -g "reactivate user flow"
pnpm --filter e2e test admin.spec.ts -g "reactivate user flow"

# Run full admin tests
pnpm --filter e2e test admin.spec.ts

# Run E2E shard 4 (where test originally fails)
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
```

**Expected Result**:
- All commands succeed
- "reactivate user flow" test passes 5 consecutive times
- Full admin test suite passes
- E2E shard 4 passes without flaky failures
- No timeout errors related to filter operation

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 1
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 2
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 3
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4

# All shards should pass
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. Uses existing Playwright `expect().toPass()` API.

## Database Changes

None - pure test code fix.

## Deployment Considerations

**Deployment Risk**: none

This is a test-only change with no production code modifications.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Not applicable - test-only change

## Success Criteria

The fix is complete when:
- [ ] `filterAccounts()` function updated with `toPass()` pattern
- [ ] "reactivate user flow" test passes 5 consecutive times
- [ ] Full admin test suite passes
- [ ] E2E shard 4 passes without flaky failures
- [ ] Code review approved (if applicable)
- [ ] No new console errors or warnings
- [ ] Test execution time unchanged or improved

## Notes

**Key decision**: This fix uses `toPass()` instead of simply increasing the timeout because:
1. The project documentation (`apps/e2e/CLAUDE.md`) explicitly recommends `toPass()` for all unreliable operations
2. The existing code already uses this pattern correctly in `selectAccount()` (line 463) and `loginAsUser()` (line 508)
3. Verification of actual state is more robust than guessing a safe timeout value

**Related patterns**: This fix applies the same pattern used successfully in:
- `selectAccount()` - waits for table row to appear before clicking
- `loginAsUser()` - uses `toPass()` with backoff intervals for React Query hydration issues

**Future prevention**: If other admin table operations become flaky, apply the same pattern rather than increasing timeouts.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #969*
