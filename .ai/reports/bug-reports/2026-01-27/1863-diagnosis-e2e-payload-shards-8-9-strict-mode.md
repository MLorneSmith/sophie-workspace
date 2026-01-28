# Bug Diagnosis: E2E Payload Shards 8 and 9 Fail - "Create New" Button Strict Mode Violations

**ID**: ISSUE-1863
**Created**: 2026-01-27T19:20:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E test shards 8 and 9 are failing consistently in the CI/CD pipeline due to Playwright strict mode violations. The `createNewButton` locator in `PayloadCollectionsPage.ts` resolves to 2 elements instead of 1, causing test failures. Additionally, the `expectCollectionAccessible()` method fails because none of its race conditions succeed within the timeout.

## Environment

- **Application Version**: dev branch (commit e7d8b3765)
- **Environment**: CI/CD (GitHub Actions)
- **Payload CMS Version**: 3.72.0
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - issue appears in current and previous runs

## Reproduction Steps

1. Push changes to the dev branch that trigger the E2E Sharded workflow
2. Wait for shards 8 and 9 to execute
3. Observe consistent failures across multiple test runs

## Expected Behavior

- The "Create New" button selector should resolve to exactly 1 element
- Collection pages should load successfully with either content, empty state, or create button visible

## Actual Behavior

**Shard 9 Errors** (3 failed tests):
- `payload-database.spec.ts:121:6` - UUID support for Supabase
- `payload-database.spec.ts:284:6` - handle large payload data correctly
- `payload-database.spec.ts:326:6` - maintain data integrity on concurrent updates

All fail with:
```
Error: locator.click: Error: strict mode violation: locator('a:has-text("Create New"), button:has-text("Create New")') resolved to 2 elements:
    1) <a type="button" title="Create new Post" aria-label="Create new Post" href="/admin/collections/posts/create" ...>
    2) <a type="button" href="/admin/collections/posts/create" ...>
```

**Shard 8 Errors** (11+ failed tests):
- Multiple `payload-collections.spec.ts:71:7` tests for various collections (Media, Downloads, Posts, Documentation, etc.)

All fail with:
```
Error: expect(received).toBeTruthy()
Received: false
   at payload/pages/PayloadCollectionsPage.ts:181
```

## Diagnostic Data

### Console Output
```
E2E Shard 9: Running 12 tests using 1 worker
E2E Shard 9: ····×F···×F·×F·
E2E Shard 9: 3 failed

E2E Shard 8: Running 22 tests using 1 worker
E2E Shard 8: ·×F×F×F×F×F×F×F×F×F×F×F··×F×F·°····
E2E Shard 8: 11 failed
```

### Root Cause Analysis Details

**Problem 1: Strict Mode Violation in createNewButton (Shard 9)**

The current selector in `PayloadCollectionsPage.ts:26-28`:
```typescript
this.createNewButton = page.locator(
    'a:has-text("Create New"), button:has-text("Create New")',
);
```

Payload CMS 3.72.0 renders TWO "Create New" links on collection pages:
1. A small pill-style button in the list header with `title="Create new Post"` and `aria-label="Create new Post"`
2. A primary button in the main content area with text "Create new Post"

Both match the `a:has-text("Create New")` selector because "Create new Post" contains the substring "Create New".

**Problem 2: expectCollectionAccessible() Timeout (Shard 8)**

The `expectCollectionAccessible()` method at line 170-181 uses `Promise.race()`:
```typescript
const hasContent = await Promise.race([
    this.listTable.isVisible({ timeout: 5000 }),
    this.noResultsMessage.isVisible({ timeout: 5000 }),
    this.createNewButton.isVisible({ timeout: 5000 }),
]);
```

When `createNewButton.isVisible()` is called with a selector that matches 2 elements, Playwright's strict mode throws an error instead of returning true/false. This causes the Promise to reject rather than resolve, and since all three promises in the race may have similar issues or timing problems, `hasContent` becomes `false`.

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts` (lines 26-28, 83-87, 170-181)
  - `apps/e2e/tests/payload/payload-database.spec.ts` (lines 121-149, 284-320, 326-370)
  - `apps/e2e/tests/payload/payload-collections.spec.ts` (lines 70-98)

- **Recent Changes**: Commit 31128475f fixed a similar issue for `saveButton` by using ID selector `#action-save-draft`

- **Suspected Functions**:
  - `PayloadCollectionsPage.createNewItem()` - calls `this.createNewButton.click()`
  - `PayloadCollectionsPage.expectCollectionAccessible()` - uses `this.createNewButton.isVisible()`

## Related Issues & Context

### Direct Predecessors
- #847 (CLOSED): "Bug Fix: Payload CMS E2E Save Button Selector Strict Mode Violations" - Same root cause pattern, fixed for saveButton
- #846 (CLOSED): "Bug Diagnosis: Payload CMS E2E Save Button Selector Causes Strict Mode Violations"

### Similar Symptoms
- #1814 (CLOSED): "Bug Fix: E2E Payload Shards Fail - Missing Payload CMS Migrations in CI"
- #1855 (CLOSED): "Bug Diagnosis: E2E Payload Shards (7, 8, 9) Timeout Due to Missing Seeded Admin User"

### Historical Context
This is the same pattern as issue #847 where a text-based selector matched multiple elements. The fix in that case was to use an ID selector (`#action-save-draft`). The same approach should work here.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `createNewButton` locator uses a text-matching selector that matches both "Create New" buttons rendered by Payload CMS 3.72.0, causing Playwright strict mode violations.

**Detailed Explanation**:
Payload CMS 3.72.0 renders collection list pages with two "Create New" action links:
1. A small pill-style button in the list controls area (class: `list-create-new-doc__create-new-button`)
2. A primary CTA button in the main content area

Both links contain text matching "Create New" (e.g., "Create new Post"), so the selector `a:has-text("Create New")` resolves to 2 elements. Playwright's strict mode (enabled by default) throws an error when a locator resolves to multiple elements during click or visibility operations.

**Supporting Evidence**:
- Error message explicitly states: `locator('a:has-text("Create New"), button:has-text("Create New")') resolved to 2 elements`
- Both elements are shown in stack trace with their specific classes and attributes
- Consistent failure across all tests that use `createNewItem()` or `expectCollectionAccessible()`
- Previous similar issue (#847) was fixed by using ID-based selector

### How This Causes the Observed Behavior

1. Test calls `collectionsPage.createNewItem()` (Shard 9) or `expectCollectionAccessible()` (Shard 8)
2. Playwright evaluates `createNewButton` locator
3. Locator matches 2 `<a>` elements on the page
4. Playwright throws strict mode violation error
5. For `createNewItem()`: test fails immediately with the error
6. For `expectCollectionAccessible()`: the Promise.race handles the error but returns false, causing the assertion to fail

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message explicitly shows the selector resolving to 2 elements
- Both matched elements are visible in the stack trace
- Same pattern was seen and fixed in issue #847 for a different button
- Consistent, reproducible failure across multiple workflow runs

## Fix Approach (High-Level)

Replace the text-based selector with a more specific selector that targets only one of the "Create New" buttons:

**Option 1** (Recommended): Use the primary CTA button with specific class
```typescript
this.createNewButton = page.locator('a.btn--style-primary:has-text("Create")').first();
```

**Option 2**: Use getByRole with more specific name matching
```typescript
this.createNewButton = page.getByRole('link', { name: /Create new/i }).first();
```

**Option 3**: Use the small pill button's specific class
```typescript
this.createNewButton = page.locator('.list-create-new-doc__create-new-button');
```

The fix also needs to update `expectCollectionAccessible()` to handle the visibility check correctly, either by using `.first()` or by catching errors from the strict mode violation.

## Diagnosis Determination

The root cause is definitively identified: the `createNewButton` selector matches 2 elements in Payload CMS 3.72.0's collection list UI. The fix requires updating the selector to be more specific, following the same pattern used in issue #847 for the save button.

## Additional Context

- Shards 8 and 9 specifically run Payload CMS tests (payload-collections.spec.ts and payload-database.spec.ts)
- Other shards (1-7, 10-12) pass successfully, confirming this is isolated to Payload-specific tests
- The issue is deterministic and not flaky - it fails consistently on every run

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow runs, issue search), Read tool (source files, logs), Grep (error patterns)*
