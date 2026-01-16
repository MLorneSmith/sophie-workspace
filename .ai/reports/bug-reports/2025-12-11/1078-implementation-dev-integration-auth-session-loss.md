## ✅ Implementation Complete

### Summary
- Added `x-vercel-skip-toolbar: 1` header to disable Vercel Live toolbar in E2E tests
- Refactored `extraHTTPHeaders` to always include the toolbar disable header while conditionally including bypass headers
- Updated comments to document the change and reference Issue #1078

### Files Changed
```
apps/e2e/playwright.config.ts | 24 +++++++++++++---------
1 file changed, 14 insertions(+), 10 deletions(-)
```

### Commits
```
d8389e380 fix(e2e): disable Vercel Live toolbar to prevent auth session loss
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 37 packages passed
- `pnpm lint --filter=web-e2e` - No errors
- `pnpm biome format --write apps/e2e/playwright.config.ts` - No changes needed

### Technical Details
The fix adds the `x-vercel-skip-toolbar` header to all E2E test requests. This header tells Vercel to not inject its Live feedback toolbar iframe (from `vercel.live` domain) into pages during testing. The cross-origin iframe was interfering with cookie handling in Playwright, causing auth sessions to be invalidated after ~20 seconds of test execution.

### Next Steps
The CI workflow `dev-integration-tests` needs to run to verify the fix resolves the auth session loss issue. If tests still fail after this fix, the fallback options from the bug plan (reverting to parallel workers or adding token refresh) should be considered.

---
*Implementation completed by Claude*
