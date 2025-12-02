# Bug Fix: Payload CMS E2E Save Button Selector Mismatch

**Related Diagnosis**: #834
**Severity**: medium
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Playwright selector `button[type="submit"]:has-text("Save")` doesn't match Payload CMS buttons labeled "Save Draft" and "Publish changes"
- **Fix Approach**: Update selector to use flexible text matching with `getByRole()` for better resilience
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

11 Payload CMS E2E tests in shard 7 are timing out (120 seconds) on `saveButton.click()` operations. The root cause is a selector mismatch:

**Current Selector** (`PayloadBasePage.ts:27`):
```typescript
this.saveButton = page.locator('button[type="submit"]:has-text("Save")');
```

**Actual Button Labels**:
- "Save Draft" (primary save action)
- "Publish changes" (secondary action)
- No `type="submit"` attribute visible in Payload UI

The selector fails to match any button, causing 120-second timeouts before test failure.

For full diagnostic details, see issue #834.

### Solution Approaches Considered

#### Option 1: Use `getByRole()` with flexible matching ⭐ RECOMMENDED

**Description**: Use Playwright's `getByRole()` API with a regex pattern to match "Save Draft" or "Publish" buttons by their semantic role, making the selector resilient to minor text variations.

**Pros**:
- Follows Playwright best practices (uses semantic selectors)
- Resilient to minor UI text changes
- More maintainable than complex CSS selectors
- Automatically handles accessibility attributes

**Cons**:
- May match unintended buttons if multiple similar buttons exist on page
- Requires understanding of Playwright's `getByRole()` API

**Risk Assessment**: Low - Payload CMS button labels are stable and unlikely to change frequently

**Complexity**: Simple - Single-line selector change

#### Option 2: Use text-based `:has-text()` with alternate labels

**Description**: Update selector to include "Save Draft" in the text matching: `button:has-text("Save Draft")`

**Pros**:
- Simple one-line fix
- Very specific to current UI

**Cons**:
- Fragile - breaks if button label changes to "Save changes" or similar
- Doesn't follow Playwright best practices
- CSS selector is less maintainable than semantic selectors

**Why Not Chosen**: Less resilient than semantic selector approach; increases maintenance burden

#### Option 3: Use `data-testid` attribute

**Description**: Add `data-testid="save-button"` attribute to Payload CMS button component and use that in tests

**Pros**:
- Most explicit and reliable selector
- Best for critical test operations

**Cons**:
- Requires modifying Payload CMS component code
- Out of scope for this bug (testing tooling issue, not CMS issue)
- Adds test-specific attributes to production code

**Why Not Chosen**: Scope creep; not necessary given Option 1's reliability

### Selected Solution: Use `getByRole()` with Regex

**Justification**: This approach combines:
1. **Playwright best practices**: `getByRole()` is the recommended selector strategy
2. **Resilience**: Regex pattern `/Save Draft|Publish/i` tolerates minor variations
3. **Simplicity**: Single-line change with no additional dependencies
4. **Maintainability**: Semantic selectors are self-documenting

**Technical Approach**:

The Page Object selector will be updated to use:
```typescript
this.saveButton = this.page.getByRole('button', { name: /Save Draft|Publish/i });
```

This selector:
- Uses `getByRole('button')` to find elements with button semantics
- Matches buttons with "Save Draft" OR "Publish" in the name (case-insensitive)
- Auto-waits for element to be visible and enabled
- Will fail fast with clear error messages if button not found

**Architecture Changes**: None - this is purely a Page Object selector update

**Migration Strategy**: None needed - backward compatible change in test infrastructure

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/pages/PayloadBasePage.ts` - Update `saveButton` selector definition (line 27)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update PageObject selector

Update the `saveButton` locator in `PayloadBasePage.ts` to use the resilient `getByRole()` selector:

```typescript
// Line 27 - Change from:
this.saveButton = page.locator('button[type="submit"]:has-text("Save")');

// To:
this.saveButton = page.getByRole('button', { name: /Save Draft|Publish/i });
```

**Why this step first**: This is the root cause fix; all test timeouts stem from this selector failure.

#### Step 2: Run tests to verify fix

Execute the failing test shard to confirm the selector now matches buttons correctly:

```bash
/test --shard 7
```

Expected result: All 11 previously failing tests should now pass.

#### Step 3: Verify no regressions

Run the full E2E test suite to ensure the new selector doesn't inadvertently match unintended buttons:

```bash
/test
```

Expected result: All E2E tests pass with no new failures.

#### Step 4: Update documentation (optional)

Add a comment in `PayloadBasePage.ts` explaining the selector choice:

```typescript
// Use getByRole() for semantic reliability
// Matches buttons labeled "Save Draft" or "Publish" (case-insensitive)
this.saveButton = page.getByRole('button', { name: /Save Draft|Publish/i });
```

## Testing Strategy

### Unit Tests

Not applicable - this is a Page Object selector update with no business logic changes.

### Integration Tests

Not applicable for this change.

### E2E Tests

These are the actual tests that verify the fix:

**Test files affected**:
- `apps/e2e/tests/payload/payload-collection.spec.ts` - All 11 failing tests

**Tests that will now pass**:
1. ✅ "should create a new post" - Was timing out on saveButton.click()
2. ✅ "should edit existing item" - Was timing out on saveButton.click()
3. ✅ "should handle validation errors" - Was timing out on saveButton.click()
4. ✅ "should delete item with confirmation" - Was timing out on saveButton.click()
5. ✅ "should verify UUID support for Supabase" - Was timing out on saveButton.click()
6. ✅ "should handle transaction rollback on error" - Was timing out on saveButton.click()
7. ✅ "should handle large payload data correctly" - Was timing out on saveButton.click()
8. ✅ "should maintain data integrity on concurrent updates" - Was timing out on saveButton.click()
9. ✅ "should recover from temporary network issues" - Was timing out on saveButton.click()
10. ✅ "should validate environment variables" - Was timing out on saveButton.click()
11. ✅ "should handle API error scenarios" - Was timing out on saveButton.click()

**Regression tests**:
- Run all E2E tests to confirm no other tests are affected by the selector change
- Verify tests that use `saveButton` in other Page Objects still work correctly

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Locate the "Save Draft" button in Payload CMS UI (should be visible after creating/editing a post)
- [ ] Verify button has semantic role="button" (check in browser DevTools)
- [ ] Confirm button text matches regex `/Save Draft|Publish/i`
- [ ] Run `/test --shard 7` and verify all 11 tests pass
- [ ] Run `/test` (full suite) and verify zero new failures
- [ ] Spot-check that saveButton.click() works correctly in one test
- [ ] Verify no other selectors in PayloadBasePage.ts need similar updates

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Selector matches unintended buttons**: If multiple buttons with "Save Draft" text exist on the same page
   - **Likelihood**: Low - Payload CMS form layouts typically have single save button per form
   - **Impact**: Low - Test would click wrong button but likely fail with clear error
   - **Mitigation**: Regex pattern is specific; Playwright's `getByRole()` prioritizes visible buttons

2. **Payload CMS UI changes button label**: If future versions use different text
   - **Likelihood**: Medium - UI may evolve over time
   - **Impact**: Medium - Tests would fail with timeout again
   - **Mitigation**: Using regex pattern `/Save Draft|Publish/i` is flexible; easy to add new labels if needed

3. **getByRole() not available in Playwright version**: If project uses old Playwright
   - **Likelihood**: Very Low - getByRole() has been stable since Playwright v1.25 (2022)
   - **Impact**: Low - Would need to fall back to alternative selector
   - **Mitigation**: Project uses Playwright v1.40+; this is not a concern

**Rollback Plan**:

If this fix causes issues:

1. Revert the selector change in `PayloadBasePage.ts`:
   ```bash
   git checkout apps/e2e/tests/payload/pages/PayloadBasePage.ts
   ```

2. Return to the original (broken) selector to identify the issue:
   ```typescript
   this.saveButton = page.locator('button[type="submit"]:has-text("Save")');
   ```

3. Investigate why the new selector failed:
   - Check Playwright version compatibility
   - Verify button semantics in Payload UI
   - Consider Option 2 (text-based selector) as fallback

**Monitoring**: None needed - this is a test infrastructure fix with no production impact

## Performance Impact

**Expected Impact**: Positive

- Timeouts eliminated (120s → immediate match)
- Test execution time reduced by ~120s per failing test
- Total improvement for shard 7: ~1,320 seconds (22 minutes)
- Full suite improvement: Depends on shard execution; estimate 5-15% faster

## Security Considerations

**Security Impact**: None

This is a test infrastructure change with no security implications. The selector change doesn't modify authentication, authorization, or data handling.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing test shard to reproduce the 120-second timeouts
/test --shard 7
```

**Expected Result**: Tests timeout after 120 seconds waiting for `saveButton.click()` to succeed. Test output shows:
```
Timeout waiting for button[type="submit"]:has-text("Save")
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the previously-failing shard
/test --shard 7

# Run full E2E suite to check for regressions
/test
```

**Expected Result**:
- All type checking passes
- All linting passes
- All formatting is correct
- All 11 tests in shard 7 pass (previously failed)
- All E2E tests pass (zero regressions)

### Regression Prevention

```bash
# Run full test suite to ensure selector change doesn't break other tests
pnpm test:e2e

# Optional: Run only Payload-related tests
/test --shard 7
```

## Dependencies

### New Dependencies

No new dependencies required.

### Existing Dependencies Used

- `@playwright/test@1.40+` - `getByRole()` API (already in project)
- TypeScript type definitions (already in project)

## Database Changes

**Migration needed**: No

No database schema or data changes required for this fix.

## Deployment Considerations

**Deployment Risk**: Very Low

This is a test infrastructure change with no impact on production code or deployment.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - no breaking changes

## Success Criteria

The fix is complete when:

- [ ] Selector change applied to `PayloadBasePage.ts` line 27
- [ ] All type checking passes (`pnpm typecheck`)
- [ ] All linting passes (`pnpm lint`)
- [ ] All formatting correct (`pnpm format`)
- [ ] Shard 7 tests pass (`/test --shard 7`) - all 11 previously failing tests now pass
- [ ] Full E2E suite passes (`/test`) - zero regressions detected
- [ ] Manual testing checklist completed
- [ ] Code review approved (if applicable)

## Notes

**Selector Strategy Rationale**:

This fix demonstrates the importance of following Playwright best practices:

1. **Semantic Selectors** (`getByRole()`) > CSS selectors > Text-based selectors
   - Semantic selectors are resilient to UI changes
   - They follow accessibility standards
   - They provide better error messages when elements aren't found

2. **Why the original selector failed**:
   - `button[type="submit"]` - Payload CMS doesn't use `type="submit"` on save buttons
   - `:has-text("Save")` - Buttons are labeled "Save Draft", not just "Save"
   - Result: No button matches → timeout

3. **Why the new selector succeeds**:
   - `getByRole('button')` - Finds all button elements (semantic role)
   - `{ name: /Save Draft|Publish/i }` - Filters to buttons with matching text
   - Result: Button matches → click succeeds

**Future Improvements**:

If Payload CMS adds more save-like buttons in the future (e.g., "Save and Continue"), the regex can be easily extended:
```typescript
{ name: /Save Draft|Publish|Save and Continue/i }
```

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #834*
