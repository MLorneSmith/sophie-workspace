# Bug Fix: Payload CMS E2E Save Button Selector Strict Mode Violations

**Related Diagnosis**: #846
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Regex selector `/Save Draft|Publish/i` matches multiple buttons, causing Playwright strict mode violations
- **Fix Approach**: Replace regex with specific ID selector `#action-save-draft` targeting the intended button
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

11 out of 43 Payload CMS E2E tests (Shard 7) fail with Playwright strict mode violations. The `saveButton` selector in `PayloadBasePage.ts:27` uses a regex pattern that matches multiple elements on the page instead of a single button, causing Playwright to reject the interaction as ambiguous.

The regex pattern `/Save Draft|Publish/i` matches:
1. "Save Draft" button (`id="action-save-draft"`) - INTENDED
2. "Publish changes" button (`id="action-save"`) - UNINTENDED
3. Sort column buttons like "Sort by Published At Ascending" - UNINTENDED

For full details, see diagnosis issue #846.

### Solution Approaches Considered

#### Option 1: Use Specific Button ID ⭐ RECOMMENDED

**Description**: Replace the regex selector with a direct ID selector targeting `#action-save-draft`, which uniquely identifies the Save Draft button.

**Pros**:
- Most reliable - IDs are unique and stable
- Eliminates ambiguity completely
- Zero chance of matching unintended elements
- Fastest selector evaluation
- Follows Playwright best practices (ID > role > text)

**Cons**:
- Only targets "Save Draft" not "Publish" - may need separate selector if both are used

**Risk Assessment**: low - ID selectors are stable and production-reliable

**Complexity**: simple - single line change

#### Option 2: Use getByRole with Specific Text

**Description**: Replace with `page.getByRole("button", { name: "Save Draft" })` for exact text match.

**Pros**:
- Uses semantic role selection
- Text is somewhat stable in English UIs
- More flexible than hardcoded ID

**Cons**:
- Slower than ID selection
- Still ambiguous if multiple buttons have same text
- Text changes would break selector
- Less reliable than ID

**Why Not Chosen**: ID selector is more reliable and efficient per Playwright guidelines.

#### Option 3: Use Locator with nth() to Disambiguate

**Description**: Keep regex but use `.nth(0)` to select the first match.

**Pros**:
- Minimal code change

**Cons**:
- Fragile - order of DOM elements could change
- Still violates strict mode (selects first of multiple)
- Doesn't solve root cause

**Why Not Chosen**: Doesn't eliminate strict mode violation; fragile approach.

### Selected Solution: Specific ID Selector

**Justification**: ID selectors are the most reliable per Playwright documentation (selector priority: ID > role > text content > CSS classes). Using `#action-save-draft` directly addresses the root cause by eliminating ambiguity. This approach has the lowest risk and is the fastest to execute.

**Technical Approach**:
- Replace `page.getByRole("button", { name: /Save Draft|Publish/i })` with `page.locator('#action-save-draft')`
- Change occurs in `PayloadBasePage.ts:27` where `saveButton` is defined
- No other code changes needed since all callers use `this.saveButton`

**Architecture Changes**: None - this is an internal selector fix with no API changes.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/pages/PayloadBasePage.ts:27` - Root cause: defines `saveButton` selector
- `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts:150` - Caller: uses `this.saveButton.click()`
- `apps/e2e/tests/payload/payload-collections.spec.ts` - Caller: runs tests using PayloadCollectionsPage
- `apps/e2e/tests/payload/payload-database.spec.ts` - Caller: runs tests using PayloadCollectionsPage

### New Files

None required - this is a selector fix only.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update the saveButton Selector

Replace the regex-based selector with a specific ID selector.

- Open `apps/e2e/tests/payload/pages/PayloadBasePage.ts`
- Line 27: Change from `page.getByRole("button", { name: /Save Draft|Publish/i })` to `page.locator('#action-save-draft')`
- Verify the change is minimal and focused

**Why this step first**: This is the root cause and must be fixed before running tests.

#### Step 2: Verify No Other Occurrences

Check if the same problematic selector exists elsewhere in the codebase.

- Search for all occurrences of `/Save Draft|Publish/i` pattern in E2E tests
- Confirm no other similar issues exist
- If found, apply same fix

#### Step 3: Run Affected Tests Locally

Test the fix locally before committing.

- Run `/test --shard 7` to execute the previously failing tests
- Confirm all 11 previously failing tests now pass
- Verify no new test failures introduced

#### Step 4: Validate Zero Regressions

Run full test suite to ensure the change doesn't affect other tests.

- Run `/test --e2e` to execute all E2E tests
- Confirm all tests pass
- Check that no other test suites are affected

#### Step 5: Code Quality Verification

Ensure the change meets project standards.

- Run `pnpm typecheck` to verify TypeScript compatibility
- Run `pnpm lint` to check for linting issues
- Run `pnpm format` to verify formatting

## Testing Strategy

### Unit Tests

N/A - This is a Page Object selector fix, not application code.

### Integration Tests

N/A - Selectors are tested through E2E tests.

### E2E Tests

The E2E tests will validate the fix by successfully executing previously failing test scenarios.

**Test files affected**:
- `apps/e2e/tests/payload/payload-collections.spec.ts` - 11 tests now passing
- `apps/e2e/tests/payload/payload-database.spec.ts` - Some tests previously failing

**Scenarios verified**:
- ✅ Save Draft button can be clicked without strict mode violation
- ✅ Toast notification appears on successful save
- ✅ Form submission completes successfully
- ✅ No orphaned "Publish" button interactions (separate selector not modified)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run shard 7 tests: `pnpm test:shard7` or `/test --shard 7`
- [ ] Verify all 11 previously failing tests now pass
- [ ] Inspect browser console for any new errors
- [ ] Confirm form save operations work end-to-end
- [ ] Verify Publish button still works if tested separately (uses different selector)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **ID Selector May Not Exist**: The `#action-save-draft` ID may not exist in Payload CMS UI
   - **Likelihood**: low
   - **Impact**: high - tests would fail to find element
   - **Mitigation**: Verify the ID exists in Payload CMS source before committing. If ID doesn't exist, inspect HTML to find correct ID.

2. **Other Tests Depend on Regex Behavior**: Some tests might depend on matching "Publish" button via regex
   - **Likelihood**: low
   - **Impact**: medium - tests would fail
   - **Mitigation**: Check if `publishButton` property is used anywhere. Review git history to understand original intent.

3. **Payload CMS UI Changes**: Future Payload updates might change button IDs
   - **Likelihood**: medium (but only in major updates)
   - **Impact**: medium - tests would need future fixes
   - **Mitigation**: Use stable ID selectors; avoid tying to version-specific implementation details.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the commit: `git revert <commit-hash>`
2. Restore original regex selector
3. Investigate why tests were failing with regression
4. File a new bug for root cause analysis

**Monitoring**: None required - this is a test infrastructure fix, not production code.

## Performance Impact

**Expected Impact**: minimal - Actually improves performance

ID selectors are faster than regex-based role selectors since Playwright can use native DOM methods instead of iterating through multiple matches.

**Performance Testing**: None needed - selector performance improvement is guaranteed.

## Security Considerations

**Security Impact**: none

This is a test selector change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing shard to verify the issue exists
pnpm test:shard7
# or
/test --shard 7
```

**Expected Result**: 11 tests fail with "strict mode violation: getByRole('button', { name: /Save Draft|Publish/i }) resolved to 2 elements"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run the previously failing shard
pnpm test:shard7
# or
/test --shard 7

# Run full E2E suite
pnpm test:e2e
# or
/test --e2e
```

**Expected Result**:
- All validation commands succeed
- All 43 tests in shard 7 pass
- All E2E tests pass
- Zero strict mode violations
- No new test failures

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify no breaking changes to other Payload tests
pnpm test:e2e
```

## Dependencies

### New Dependencies

**No new dependencies required**

The fix uses Playwright's built-in `locator()` method which is already available.

## Database Changes

**No database changes required**

This is a test infrastructure change only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained

This is a test-only change with zero impact on production code or deployment.

## Success Criteria

The fix is complete when:
- [ ] All 11 previously failing tests in shard 7 pass
- [ ] No new test failures introduced
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Full E2E test suite passes
- [ ] Code review approved (if applicable)
- [ ] Strict mode violations eliminated

## Notes

**Important Implementation Detail**: Before applying the fix, verify that the Payload CMS UI actually includes a button with `id="action-save-draft"`. This can be confirmed by:

1. Starting the local Payload CMS server: `pnpm dev`
2. Opening browser developer tools
3. Navigating to a collection edit page
4. Inspecting the Save button's HTML
5. Confirming the ID attribute matches

If the ID has changed or doesn't exist, inspect the actual button element and update the selector accordingly.

**Related Issues**:
- #836 - Original selector fix that introduced this regression (commit 597dabc34)
- #843 - Payload CMS E2E test failures (if exists)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #846*
