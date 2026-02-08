# Implementation Report: Bug Fix #1912

## Summary

- Added `{ force: true }` to the dropdown trigger click in the rapid-toggle test
- Updated comments to document the Radix UI DismissableLayer issue
- Test now bypasses the `pointer-events: none` applied to `<html>` by Radix UI

## Files Changed

```
apps/e2e/tests/account/account-simple.spec.ts | 5 +++--
1 file changed, 3 insertions(+), 2 deletions(-)
```

## Commits

```
5266ef074 fix(e2e): use force:true to bypass Radix DismissableLayer pointer-events
```

## Validation Results

All validation commands passed successfully:

- `pnpm typecheck` - Passed (40/40 packages)
- `pnpm lint` - Passed (1689 files, no fixes needed)
- `pnpm format` - Passed (1689 files, no fixes needed)
- `pnpm --filter web-e2e test tests/account/account-simple.spec.ts` - 8 passed, 2 skipped (as expected in dev mode)

## Technical Details

### Root Cause

When a Radix UI DropdownMenu is open, the `DismissableLayer` component applies `pointer-events: none` to the `<html>` element to enforce its dismiss-on-outside-click behavior. This blocked Playwright's clicks on the dropdown trigger button when trying to close the dropdown.

### Solution

Added `{ force: true }` to the click that closes the dropdown (line 289). Playwright's `force` option bypasses pointer-events checks, allowing the click to succeed while still testing the dropdown toggle functionality.

### Code Change

```typescript
// BEFORE
await accountDropdownTrigger.click(); // Close

// AFTER
await accountDropdownTrigger.click({ force: true }); // Close - force bypasses DismissableLayer
```

## Follow-up Items

- None. This is a test-only fix with no application code changes.
- The fix will be validated in CI when the PR is merged.

---
*Implementation completed by Claude*
