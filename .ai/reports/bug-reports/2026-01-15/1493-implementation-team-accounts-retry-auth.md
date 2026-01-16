## ✅ Implementation Complete

### Summary
- Added `restoreAuthStorageState()` helper function to `base-test.ts` that restores auth cookies when Playwright retries tests
- Updated `team-accounts.spec.ts` beforeEach hook to call `restoreAuthStorageState()` before navigation
- Cookies are reapplied to the browser context, ensuring authentication persists across test retries

### Root Cause
When Playwright retries a test, it creates a fresh browser context that doesn't automatically inherit the pre-authenticated storage state from global setup. The `test.use({ storageState: ... })` configuration only applies once at the start, not on retry.

### Solution
The `restoreAuthStorageState()` helper reads the current storage state from the context (which still has the cookies loaded from global setup) and explicitly re-adds them to ensure they're active. This is idempotent and safe to call on every test run.

### Files Changed
```
apps/e2e/tests/utils/base-test.ts       | +33 lines (added restoreAuthStorageState helper)
apps/e2e/tests/team-accounts/team-accounts.spec.ts | +10 lines (import and call helper)
```

### Commits
```
43d2d5f77 fix(e2e): preserve auth storage state across test retries
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 39 packages pass
- `pnpm lint:fix` - No issues
- `pnpm format:fix` - No issues  
- `pnpm --filter web-e2e test team-accounts.spec.ts` - 2 passed, 4 skipped (as expected)

### Follow-up Items
- None. The fix is minimal and focused on the specific issue.

---
*Implementation completed by Claude*
