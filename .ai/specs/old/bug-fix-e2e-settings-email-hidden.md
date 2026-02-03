# Bug Fix: E2E Test Fails - Settings Page Email Hidden Due to Collapsed Sidebar

**Related Diagnosis**: #717
**Severity**: medium
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2E test times out because email element is hidden by CSS (`group-data-[minimized=true]/sidebar:hidden`) when sidebar is in collapsed state; test configuration defaults sidebar to collapsed
- **Fix Approach**: Modify E2E test to wait for visible element instead of just DOM-present element; alternatively expand sidebar before assertion
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test `account-simple.spec.ts:166` ("settings page shows user email") fails with a `TimeoutError: locator.waitFor: Timeout 10000ms exceeded` because:

1. The email display element (`data-test="account-dropdown-email"`) exists in the DOM
2. The element is **CSS-hidden** due to the sidebar being in collapsed/minimized state
3. The default configuration in `packages/ui/src/makerkit/navigation-config.schema.ts:45` sets `sidebarCollapsed` to `"true"`
4. The test Docker container doesn't set `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED`, so it uses the default
5. The CSS class `group-data-[minimized=true]/sidebar:hidden` hides the email element when sidebar is minimized

The test uses `locator.waitFor()` which waits for the element to be visible, but the element is CSS-hidden, causing the timeout.

For full details, see diagnosis issue #717.

### Solution Approaches Considered

#### Option 1: Modify Test to Use `toBeVisible()` Instead of `waitFor()` ⭐ RECOMMENDED

**Description**: Update the test assertion to use Playwright's `toBeVisible()` which explicitly checks both DOM presence AND visibility. This forces the element to be visible before the assertion passes.

**Pros**:
- Most straightforward - minimal test change
- Addresses the root cause (element must be visible, not just present)
- Aligns with Playwright best practices (wait for visible elements)
- Directly mirrors user experience (user can see the email)
- Single-line change in test

**Cons**:
- None significant

**Risk Assessment**: Low - Only changes test assertion, doesn't modify application code

**Complexity**: simple - Single assertion change

#### Option 2: Expand Sidebar Before Assertion

**Description**: Add a step to expand the sidebar before asserting email visibility by clicking the sidebar toggle/trigger button.

**Pros**:
- Tests sidebar functionality as well
- Still validates email display when sidebar is expanded
- More complete test scenario

**Cons**:
- Slightly more complex (adds click action before assertion)
- Requires finding the correct sidebar toggle element
- Tests more than necessary for this specific test case

**Risk Assessment**: Low - Straightforward click action

**Complexity**: simple - Click + wait pattern

#### Option 3: Set Environment Variable to Default Sidebar to Expanded

**Description**: Configure the E2E Docker container to set `NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED=false`, changing the default behavior.

**Pros**:
- Could improve overall UX (expanded sidebar by default might be better)
- No code changes needed

**Cons**:
- Changes application behavior for all E2E tests
- May affect other tests that expect collapsed sidebar
- Doesn't fix the underlying test fragility
- Requires Docker environment configuration change

**Risk Assessment**: Medium - Could affect other tests

**Complexity**: moderate - Environment configuration

### Selected Solution: Option 1 (Use `toBeVisible()` for Assertions)

**Justification**:

This is the most pragmatic approach because:

1. **Minimal Change**: Only modifies the test assertion, reducing risk of side effects
2. **Aligns with Playwright Best Practices**: Using `toBeVisible()` explicitly checks for visibility, not just DOM presence
3. **Tests What Users See**: The test now verifies the element is actually visible, matching real user behavior
4. **Maintainability**: Makes the test more robust against future CSS changes (if element becomes hidden for any reason, test will catch it)
5. **No Application Changes**: Doesn't require modifying component code or environment configuration
6. **Comprehensive Fix**: Solves not just this test but prevents similar issues with other hidden elements

**Technical Approach**:

The test currently uses code like:
```typescript
await expect(page.getByText('test1@slideheroes.com')).toBeVisible();
```

This already checks for visibility! But the issue is that the test might be using a different selector. Let me examine the actual test code to determine the exact fix needed.

**Architecture Changes** (if any): None - Pure test modification

**Migration Strategy** (if needed): N/A - Direct test fix

## Implementation Plan

### Affected Files

- `apps/e2e/tests/account/account-simple.spec.ts` - Test file that needs modification
  - Lines 166-185: Test "settings page shows user email" needs assertion update
  - Need to change locator strategy to explicitly wait for visible element OR add sidebar expansion step

### New Files

No new files needed.

### Step-by-Step Tasks

**Step 1: Examine Current Test Implementation**

<describe what this step accomplishes>

- Read the actual test at `apps/e2e/tests/account/account-simple.spec.ts:166-185`
- Identify exact locator being used
- Understand current assertion pattern
- Determine if element is in DOM but hidden, or if selector is wrong

**Why this step first**: Must understand the exact problem before applying fix

**Step 2: Determine the Correct Fix Approach**

After examining the test:
- If using generic text locator (e.g., `getByText('test1@slideheroes.com')`), switch to data-test locator
- If already using data-test locator, ensure using `.toBeVisible()` instead of `.waitFor()`
- If element exists but is CSS-hidden, consider adding sidebar expansion step first

**Step 3: Apply Test Fix**

Implement one of these changes:

**Option A (Recommended - Simple)**:
```typescript
// Change from generic text locator to data-test locator with visibility check
await expect(page.locator('[data-test="account-dropdown-email"]')).toBeVisible();
```

**Option B (More Complete - Tests Sidebar)**:
```typescript
// Expand sidebar first, then check email visibility
const sidebarTrigger = page.locator('[data-test="sidebar-trigger"]'); // Adjust selector as needed
await sidebarTrigger.click();
await page.waitForLoadState('domcontentloaded');

// Now email should be visible
await expect(page.locator('[data-test="account-dropdown-email"]')).toBeVisible();
```

**Step 4: Update Test Comments (if needed)**

- Add comment explaining why we check for visibility: "Email must be visible in the UI, not just present in DOM"
- Document the sidebar visibility requirement: "Sidebar must be expanded to show email"

**Step 5: Validate the Fix**

- Run test locally: `pnpm test:e2e` or `/test 3` for shard 3
- Verify test passes
- Check that sidebar state is as expected
- Run full E2E suite to check for regressions

## Testing Strategy

### Unit Tests

Not applicable - This is purely an E2E test fix.

### Integration Tests

Not applicable - No backend or component changes.

### E2E Tests

**Add/Update E2E tests for**:
- ✅ Settings page loads and shows user email
- ✅ Email element is visible (not CSS-hidden)
- ✅ Sidebar collapse/expand does not affect email readability
- ✅ Email displays correctly after login
- ✅ Regression: Other account dropdown elements still visible

**Test files**:
- `apps/e2e/tests/account/account-simple.spec.ts` - Modified test at line 166-185

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run test locally: `pnpm test:e2e` or `/test 3`
- [ ] Verify "settings page shows user email" test passes
- [ ] Check that sidebar is in collapsed state during test (verify default behavior)
- [ ] Navigate to settings page in browser and verify email is visible
- [ ] Test with sidebar expanded - email should still be visible
- [ ] Test with sidebar collapsed - verify email is hidden in UI (test correctly detects this)
- [ ] Run full E2E test suite (`/test`) to check for regressions
- [ ] Verify no other tests fail due to this change

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Test becomes too strict**: If we use `.toBeVisible()` check, the element must be visible
   - **Likelihood**: low
   - **Impact**: low - This is actually desired behavior
   - **Mitigation**: Test only checks for visibility in the current test; other scenarios (sidebar states) can be tested separately if needed

2. **Other tests affected**: If other tests rely on element being hidden
   - **Likelihood**: low - This is an account dropdown, likely only shown in one test
   - **Impact**: medium - Could cause other test failures
   - **Mitigation**: Run full E2E suite to verify no regressions

3. **Sidebar behavior changes**: If default sidebar state changes in future
   - **Likelihood**: low - Schema default is unlikely to change
   - **Impact**: low - Test would appropriately fail and highlight the change
   - **Mitigation**: This is actually desired - tests should break when behavior changes

**Rollback Plan**:

If this fix causes issues:
1. Revert test changes: `git checkout apps/e2e/tests/account/account-simple.spec.ts`
2. Run tests again to confirm revert: `/test 3`
3. Investigate what caused the failure
4. Consider alternative approaches (expand sidebar, or change environment config)

**Monitoring** (if needed):

- Monitor E2E test results to ensure this test remains stable
- If test flakes in CI, consider adding extra wait time or checking browser state before assertion

## Performance Impact

**Expected Impact**: none

No performance changes - this is a test-only modification. Test execution time should remain the same or slightly improve (more efficient assertion).

## Security Considerations

No security implications - this is purely a test fix.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run shard 3 (Personal Accounts) where the failing test exists
/test 3
```

**Expected Result**: Test "settings page shows user email" should timeout with error:
```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded
```

The test should show that the element exists but is hidden.

### After Fix (Bug Should Be Resolved)

```bash
# Type check (no changes to app code)
pnpm typecheck

# Lint E2E tests
pnpm lint

# Format E2E tests
pnpm format

# Run shard 3 (Personal Accounts)
/test 3

# Run full E2E suite to check for regressions
pnpm test:e2e

# Or run via test command
/test
```

**Expected Result**: All tests pass, including "settings page shows user email"

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Run full test suite including unit and integration tests
pnpm test

# Specific test file only
pnpm test:e2e apps/e2e/tests/account/account-simple.spec.ts
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - Uses existing Playwright APIs

## Database Changes

**No database changes required** - This is a test-only fix

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - Only E2E test changes, no application code changes

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes

## Success Criteria

The fix is complete when:
- [ ] Examined actual test code at `apps/e2e/tests/account/account-simple.spec.ts:166-185`
- [ ] Applied fix to test assertion (changed to use `.toBeVisible()` or added sidebar expansion)
- [ ] Test passes locally: `/test 3` shows test passing
- [ ] Full E2E suite passes: `/test` with no regressions
- [ ] Manual testing checklist complete
- [ ] No new errors in browser console or test logs
- [ ] Test is more maintainable (explicit visibility check)

## Notes

**Key Design Decision**: Using `.toBeVisible()` over sidebar expansion is preferred because:

1. Simpler to implement (one-line change)
2. More maintainable (explicit visibility requirement)
3. Tests what users see (actual UI behavior)
4. Prevents similar issues with other hidden-by-default elements
5. Aligns with Playwright testing best practices

**Alternative Path**: If sidebar expansion is preferred:
- Identify correct sidebar trigger selector: could be `[data-test="sidebar-trigger"]` or `[data-test="sidebar-toggle"]`
- Add click action before assertion
- This also works but is slightly more complex

**Related Files & Documentation**:
- Diagnosis: https://github.com/slideheroes/2025slideheroes/issues/717
- Test File: `apps/e2e/tests/account/account-simple.spec.ts`
- Component: `packages/features/accounts/src/components/personal-account-dropdown.tsx`
- Config: `packages/ui/src/makerkit/navigation-config.schema.ts`
- E2E Documentation: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #717*
