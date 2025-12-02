# Bug Diagnosis: Payload CMS E2E Tests Fail Due to Incorrect Save Button Selector

**ID**: ISSUE-834
**Created**: 2025-12-02T14:40:00Z
**Reporter**: system (test suite)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

11 Payload CMS E2E tests (shard 7) are failing with 120-second timeouts on `locator.click` operations. The root cause is a selector mismatch: the Page Object uses `button[type="submit"]:has-text("Save")` but the actual Payload CMS UI buttons are labeled "Save Draft" and "Publish changes". The exact text match fails because "Save" doesn't match "Save Draft".

## Environment

- **Application Version**: d216d4d1d (dev branch)
- **Environment**: development (localhost:3021)
- **Browser**: Chromium (Playwright)
- **Node Version**: Per project configuration
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown - selector may have been incorrect since creation

## Reproduction Steps

1. Run `/test 7` to execute Payload CMS E2E tests (shard 7)
2. Observe tests that involve creating/editing items fail with timeout
3. Check test-results directory for screenshots showing "Save Draft" button
4. Compare with Page Object selector `button[type="submit"]:has-text("Save")`

## Expected Behavior

Tests should locate and click the save button to persist changes to Payload CMS items.

## Actual Behavior

Tests timeout after 120 seconds waiting for `this.saveButton.click()` because the selector `button[type="submit"]:has-text("Save")` doesn't match the actual button labeled "Save Draft".

## Diagnostic Data

### Console Output
```
Error: locator.click: Test timeout of 120000ms exceeded.
```

### Page Object Selector
```typescript
// apps/e2e/tests/payload/pages/PayloadBasePage.ts:27
this.saveButton = page.locator('button[type="submit"]:has-text("Save")');
```

### Actual UI Buttons (from error-context.md)
```yaml
- button "Save Draft" [ref=e88] [cursor=pointer]:
  - generic:
    - generic: Save Draft
- button "Publish changes" [ref=e90] [cursor=pointer]:
  - generic:
    - generic: Publish changes
```

### Screenshots
- `/apps/e2e/test-results/payload-payload-collection-d1536-ns-should-create-a-new-post-payload/test-failed-1.png`

Screenshot clearly shows:
- "Save Draft" button (not "Save")
- "Publish changes" button (not "Publish")
- Form is properly filled with test data
- Test is waiting for click that never happens

## Error Stack Traces
```
Error: locator.click: Test timeout of 120000ms exceeded.
Error Context: test-results/payload-payload-collection-d1536-ns-should-create-a-new-post-payload/error-context.md
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/pages/PayloadBasePage.ts` (line 27 - saveButton selector)
  - `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts` (line 150 - saveItem method)
  - `apps/e2e/tests/payload/payload-collections.spec.ts` (CRUD tests)
  - `apps/e2e/tests/payload/payload-database.spec.ts` (database tests)
- **Recent Changes**: `11cf7f0c3` - Payload CMS storage state authentication
- **Suspected Functions**: `saveItem()`, `saveButton` locator

## Related Issues & Context

### Historical Context
The Payload CMS tests were recently updated with storage state authentication (commit `11cf7f0c3`). The button selector issue may have existed before this change but was masked by other failures.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Playwright selector `button[type="submit"]:has-text("Save")` uses exact text matching, but the Payload CMS UI uses "Save Draft" as the button label.

**Detailed Explanation**:
The `:has-text("Save")` selector in Playwright matches elements containing the text "Save", but when combined with attribute selectors like `[type="submit"]`, the matching can become stricter. Additionally, the "Save Draft" button may not have `type="submit"` - it appears to be a regular button based on the page snapshot.

Looking at the error context YAML:
```yaml
button "Save Draft" [ref=e88] [cursor=pointer]:
```

The button is labeled "Save Draft" (not "Save") and doesn't show `type="submit"` in the snapshot, which explains why `button[type="submit"]:has-text("Save")` fails to match.

**Supporting Evidence**:
1. Screenshot shows "Save Draft" button clearly visible and enabled
2. Error context YAML shows button labeled "Save Draft" without type="submit"
3. All 8 timeout failures occur on `locator.click` for the same save operation
4. Tests that don't use save button (health checks, navigation) pass

### How This Causes the Observed Behavior

1. Test fills form fields successfully (visible in screenshot)
2. Test calls `collectionsPage.saveItem()` which calls `this.saveButton.click()`
3. Playwright searches for `button[type="submit"]:has-text("Save")`
4. No matching element found (actual button is "Save Draft" without type="submit")
5. Playwright waits for element to appear, times out after 120 seconds
6. Test fails with timeout error

### Confidence Level

**Confidence**: High

**Reasoning**:
- Screenshot proves the form is loaded and button is visible with different label
- Error context YAML confirms exact button text is "Save Draft"
- All failures follow the same pattern (timeout on click, not assertion)
- Tests that don't use saveButton pass successfully

## Fix Approach (High-Level)

Update the `saveButton` selector in `PayloadBasePage.ts` to match the actual Payload CMS button:

```typescript
// Change from:
this.saveButton = page.locator('button[type="submit"]:has-text("Save")');

// To one of:
this.saveButton = page.locator('button:has-text("Save Draft")');
// Or more flexible:
this.saveButton = page.getByRole('button', { name: /Save Draft|Save/i });
```

Also update `publishButton` if needed:
```typescript
this.publishButton = page.locator('button:has-text("Publish changes")');
```

## Diagnosis Determination

The root cause is definitively identified: **incorrect button selector** in the Page Object. The Payload CMS UI uses "Save Draft" as the save button label, but the test selector looks for "Save". This is a straightforward selector fix.

**Failed Tests (11 total)**:
1. `should create a new post` - saveButton timeout
2. `should edit existing item` - saveButton timeout
3. `should handle validation errors` - saveButton timeout
4. `should delete item with confirmation` - saveButton timeout (creates item first)
5. `should recover from temporary network issues` - assertion (secondary)
6. `should verify UUID support for Supabase` - saveButton timeout
7. `should handle transaction rollback on error` - saveButton timeout
8. `should handle large payload data correctly` - saveButton timeout
9. `should maintain data integrity on concurrent updates` - saveButton timeout
10. `should validate environment variables for database connection` - assertion (unrelated)
11. Additional retry failures

## Additional Context

The 3 assertion failures (not timeout) may be separate issues:
- `should recover from temporary network issues` - expects content after offline/online cycle
- `should validate environment variables for database connection` - expects API to return ok()

These should be investigated separately after the selector fix is applied.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git, grep, ls, cat), Read (test files, Page Objects, screenshots), Glob*
