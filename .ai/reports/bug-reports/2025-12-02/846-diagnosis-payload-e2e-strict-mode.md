# Bug Diagnosis: Payload CMS E2E Save Button Selector Causes Strict Mode Violations

**ID**: ISSUE-pending
**Created**: 2025-12-02T16:18:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: regression

## Summary

11 out of 43 Payload CMS E2E tests (Shard 7) are failing with Playwright strict mode violations. The `saveButton` selector in `PayloadBasePage.ts` uses the regex `/Save Draft|Publish/i` which matches multiple elements on the page, causing the tests to fail immediately instead of interacting with the intended button. This is a regression introduced by commit `597dabc34` which attempted to fix a different selector issue.

## Environment

- **Application Version**: dev branch (commit 5dae1c5b6)
- **Environment**: development (local)
- **Payload CMS Version**: 3.65.0
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Before commit `597dabc34` (different failure mode - timeout)

## Reproduction Steps

1. Run `/test --shard 7` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --shard 7`
2. Navigate to any Payload CMS test that calls `saveItem()`
3. Observe strict mode violation error when clicking save button

## Expected Behavior

The `saveButton.click()` should click a single save button element (either "Save Draft" or the primary save action).

## Actual Behavior

Playwright throws a strict mode violation because the selector matches 2 elements:
- `id="action-save-draft"` button (text: "Save Draft")
- `id="action-save"` button (text: "Publish changes")

On list pages, it may also match:
- Sort buttons with "Publish" in aria-label (e.g., "Sort by Published At Ascending")

## Diagnostic Data

### Console Output
```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: /Save Draft|Publish/i }) resolved to 2 elements:
    1) <button type="button" id="action-save-draft" class="btn save-draft...">...</button>
       aka getByRole('button', { name: 'Save Draft' })
    2) <button type="button" id="action-save" class="btn...">...</button>
       aka getByRole('button', { name: 'Publish changes' })

Call log:
  - waiting for getByRole('button', { name: /Save Draft|Publish/i })

   at payload/pages/PayloadCollectionsPage.ts:150

    148 |
    149 |   async saveItem() {
  > 150 |     await this.saveButton.click();
          |                           ^
    151 |     await this.expectToastMessage("successfully");
    152 |   }
```

### Test Results Summary
```
Total Tests: 43
Passed: 32
Failed: 11
Skipped: 1
Duration: 364s
```

### Failed Tests
1. should create a new post
2. should edit existing item
3. should handle validation errors
4. should delete item with confirmation
5. should recover from temporary network issues
6. should verify database connection on startup
7. should verify UUID support for Supabase
8. should handle transaction rollback on error
9. should handle large payload data correctly
10. should maintain data integrity on concurrent updates
11. should handle environment variables for database connection

## Error Stack Traces
```
at PayloadCollectionsPage.saveItem (/home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts:150:25)
at /home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/payload-collections.spec.ts:177:25
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/pages/PayloadBasePage.ts:27` (root cause)
  - `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts:150` (caller)
  - `apps/e2e/tests/payload/payload-collections.spec.ts` (affected tests)
  - `apps/e2e/tests/payload/payload-database.spec.ts` (affected tests)
- **Recent Changes**:
  - Commit `597dabc34` changed selector from `button[type="submit"]:has-text("Save")` to `getByRole("button", { name: /Save Draft|Publish/i })`
- **Suspected Functions**:
  - `PayloadBasePage.constructor()` - defines `saveButton` selector
  - `PayloadCollectionsPage.saveItem()` - uses `saveButton`

## Related Issues & Context

### Direct Predecessors
- #836 (CLOSED): "Bug Fix: Payload CMS E2E Save Button Selector Mismatch" - The fix for this issue introduced the current regression

### Similar Symptoms
- #693 (CLOSED): "Bug Diagnosis: E2E Payload CMS Tests Failing - Server Not Running" - Different root cause but same shard affected

### Historical Context
This is a regression from commit `597dabc34` which fixed #836. The original issue was that the selector matched 0 elements (causing timeout). The "fix" introduced a new problem where the selector now matches 2+ elements (causing strict mode violation). The fix was incomplete - it broadened the selector too much.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The regex `/Save Draft|Publish/i` in the `saveButton` selector is too broad and matches multiple buttons in Payload CMS UI.

**Detailed Explanation**:
The selector `page.getByRole("button", { name: /Save Draft|Publish/i })` was introduced in commit `597dabc34` to fix a timeout issue where the old selector `button[type="submit"]:has-text("Save")` matched no elements. However, the new regex pattern:

1. Matches "Save Draft" button (`id="action-save-draft"`) - INTENDED
2. Matches "Publish changes" button (`id="action-save"`) - UNINTENDED (contains "Publish")
3. Matches sort column buttons like "Sort by Published At Ascending" - UNINTENDED (contains "Publish")

The regex operator precedence issue: `/Save Draft|Publish/i` is parsed as `/(Save Draft)|(Publish)/i`, meaning it matches either "Save Draft" OR anything containing "Publish".

**Supporting Evidence**:
- Stack trace shows error at `PayloadBasePage.ts:150` calling `saveButton.click()`
- Error message explicitly lists 2 matched elements with their IDs
- Git history shows commit `597dabc34` introduced this exact selector
- Payload CMS 3.65.0 UI has both "Save Draft" and "Publish changes" buttons visible simultaneously

### How This Causes the Observed Behavior

1. Test navigates to Payload CMS document edit page
2. Test calls `saveItem()` which clicks `this.saveButton`
3. `saveButton` is defined as `page.getByRole("button", { name: /Save Draft|Publish/i })`
4. Playwright finds 2 buttons matching this pattern (or 4 on list pages with sort columns)
5. Playwright's strict mode prevents clicking when multiple elements match
6. Test fails immediately with "strict mode violation" error

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message explicitly shows the selector and matched elements
- Git history proves when the selector was introduced
- The regex pattern clearly matches both button labels
- Issue is 100% reproducible on every test run

## Fix Approach (High-Level)

Update the selector to target specifically the "Save Draft" button by ID (most specific) or use a more precise selector:

**Option 1 (Recommended)**: Use button ID
```typescript
this.saveButton = page.locator('#action-save-draft');
```

**Option 2**: Use exact text match
```typescript
this.saveButton = page.getByRole('button', { name: 'Save Draft', exact: true });
```

**Option 3**: Use `.first()` to take first match
```typescript
this.saveButton = page.getByRole('button', { name: /Save Draft|Publish/i }).first();
```

Option 1 is preferred because:
- Most specific and least likely to break
- Uses stable element ID from Payload CMS
- Won't be affected by UI text changes

## Diagnosis Determination

**Root cause confirmed**: The `saveButton` selector regex `/Save Draft|Publish/i` matches multiple elements in Payload CMS UI, causing Playwright strict mode violations. This is a regression introduced by commit `597dabc34` which attempted to fix a selector timeout issue but created a new ambiguous selector problem.

The fix is straightforward: replace the ambiguous regex selector with a specific ID-based selector targeting `#action-save-draft`.

## Additional Context

- The original issue (#836) correctly identified that Payload CMS buttons don't have `type="submit"`, but the fix created a selector that's too broad
- Payload CMS 3.65.0 admin UI uses consistent button IDs: `action-save-draft` for draft saves and `action-save` for publish
- Sort column buttons also contain "Publish" in their aria-labels (e.g., "Sort by Published At Ascending")

---
*Generated by Claude Debug Assistant*
*Tools Used: /test --shard 7, git log, git show, grep, gh issue list, gh issue view*
