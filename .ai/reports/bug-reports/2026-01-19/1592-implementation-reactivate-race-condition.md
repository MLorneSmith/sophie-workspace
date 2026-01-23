## ✅ Implementation Complete

### Summary
- Added `Promise.all` with `waitForResponse` to the ban action in the "reactivate user flow" test
- This fixes the intermittent race condition where the test checked for the "Banned" badge before the server action completed
- The fix matches the existing pattern used in the "ban user flow" test (lines 165-172) and the reactivate portion (lines 238-245)

### Files Changed
```
apps/e2e/tests/admin/admin.spec.ts | 10 +++++++++-
1 file changed, 9 insertions(+), 1 deletion(-)
```

### Commits
```
58c1e9f60 fix(e2e): add waitForResponse to ban action in reactivate user flow test
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm --filter web-e2e typecheck` - Passed
- `pnpm lint --filter web-e2e` - Passed
- Single test run of "reactivate user flow" - Passed (12.5s)

### Technical Details
The fix wraps the "Ban User" button click with `Promise.all` and `waitForResponse`:

```typescript
await Promise.all([
  page.getByRole("button", { name: "Ban User" }).click(),
  page.waitForResponse(
    (response) =>
      response.url().includes("/admin/accounts") &&
      response.request().method() === "POST",
  ),
]);
```

This ensures the test waits for the server action to complete before asserting the "Banned" badge is visible.

---
*Implementation completed by Claude*
