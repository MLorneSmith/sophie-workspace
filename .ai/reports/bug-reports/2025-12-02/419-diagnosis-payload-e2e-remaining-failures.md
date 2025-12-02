# Bug Diagnosis: Payload CMS E2E Tests - Remaining Failures

## Summary

Two Payload CMS E2E tests continue to fail after the Lexical editor fix (issue #849). Both failures are caused by incorrect test locators that don't match Payload's actual UI structure.

## Affected Tests

1. **"should delete item with confirmation"** - `payload-collections.spec.ts:226`
2. **"should handle transaction rollback on error"** - `payload-database.spec.ts:148`

---

## Bug 1: Delete Item Test Failure

### Symptoms
- Test clicks `deleteButton` but it's not visible
- Test times out waiting for delete confirmation dialog

### Root Cause Analysis

The `deleteButton` locator in `PayloadCollectionsPage.ts:36` is:
```typescript
this.deleteButton = page.locator('button:has-text("Delete")');
```

However, in Payload CMS's edit view, the Delete button is **hidden inside a popup menu** (the "more actions" ellipsis button). The page structure shows:

```yaml
- button "Save Draft" [disabled] [ref=e102]
- button "Publish changes" [ref=e104]
- button [ref=e107] [cursor=pointer]  # <-- This is the ellipsis/more actions button
```

The Delete button (`id="action-delete"`) is inside a popup that appears when clicking button `[ref=e107]`.

### Evidence
From `error-context.md` snapshot - there is no visible Delete button on the edit page. The delete action is accessed through:
1. Click the "more actions" button (ellipsis next to Save)
2. Select "Delete" from the popup menu

### Fix Required
Update `deleteFirstItem()` method to:
1. Click the "more actions" popup trigger button first
2. Wait for the popup menu to appear
3. Click the Delete option in the popup
4. Handle the confirmation modal

---

## Bug 2: Transaction Rollback Test Failure

### Symptoms
- Test fills duplicate email, clicks Save
- Error messages ARE displayed on page
- Test locators fail to find the visible error messages
- Test reports `errorVisible = false`

### Root Cause Analysis

The test at `payload-database.spec.ts:174-186` uses these locators:
```typescript
const errorMessages = [
  page.locator('text="A user with the given email is already registered"'),
  page.locator('text="The following field is invalid: email"'),
  page.locator('[class*="error"]'),
];
```

The page snapshot shows the error messages ARE present but in specific elements:

1. **Inline field error** (line 90-91):
```yaml
- complementary "A user with the given email is already registered." [ref=e99]:
  - generic [ref=e100]: A user with the given email is already registered.
```

2. **Toast notification** (line 131):
```yaml
- generic [ref=e146]: "The following field is invalid: email"
```

The issue is that:
- The error text is inside a `complementary` ARIA role element
- Playwright's `text=` selector may not match text inside semantic role elements
- The exact text includes a period: `"A user with the given email is already registered."` (note trailing period)

### Evidence
From error context snapshot lines 90-91 and 131 - both error messages are visible but locators aren't matching them.

### Fix Required
Update error detection to use more reliable selectors:
```typescript
// Option 1: Use getByRole or getByText
page.getByText('A user with the given email is already registered')

// Option 2: Use role selector
page.locator('[role="complementary"]').filter({ hasText: 'already registered' })

// Option 3: Use toast container
page.locator('.Toastify, [role="status"]').filter({ hasText: 'invalid' })
```

---

## Recommended Fixes

### Fix 1: Delete Button Handler

```typescript
// In PayloadCollectionsPage.ts
async deleteFirstItem() {
  await this.selectFirstItem();

  // Click the "more actions" popup trigger (ellipsis button)
  const moreActionsButton = this.page.locator('button').filter({
    has: this.page.locator('[class*="ellipsis"], [class*="more"]')
  }).or(this.page.locator('#popup-button-collection-actions'));

  await moreActionsButton.click();

  // Wait for popup and click Delete
  await this.page.locator('#action-delete').click();

  // Handle confirmation modal
  await this.confirmDeleteButton.click();
  await this.expectToastMessage("successfully deleted");
}
```

### Fix 2: Error Detection

```typescript
// In payload-database.spec.ts
const errorVisible = await Promise.race([
  page.getByText(/already registered/i).isVisible(),
  page.getByText(/field is invalid/i).isVisible(),
  page.locator('[role="complementary"]').isVisible(),
]).catch(() => false);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts` | Update `deleteFirstItem()` to handle popup menu |
| `apps/e2e/tests/payload/payload-database.spec.ts` | Update error message locators in transaction rollback test |

## Priority

**Medium** - These are test infrastructure issues, not application bugs. The actual Payload CMS functionality works correctly.

## Related Issues

- Issue #849 (closed) - Fixed Lexical editor support and health check assertions
