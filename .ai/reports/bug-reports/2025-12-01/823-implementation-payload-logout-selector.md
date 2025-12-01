## ✅ Implementation Complete

### Summary
- Updated `PayloadBasePage.ts` logout() method to use direct URL navigation (`page.goto()`) instead of click-based interaction
- Removed unused `userMenu` and `logoutButton` locator properties
- Resolved 90-second timeout caused by Next.js dev overlay intercepting pointer events

### Root Cause
The original implementation tried to click on `.account` class selector and `button:has-text("Log Out")`, but:
1. The `.account` selector doesn't exist in Payload CMS v3 UI
2. Even with the correct `a[href="/admin/logout"]` selector, the Next.js dev overlay (`<nextjs-portal>`) was intercepting pointer events

### Solution
Used direct URL navigation (`page.goto()`) to `/admin/logout` instead of click-based interaction, which bypasses the overlay interception issue entirely.

### Files Changed
```
apps/e2e/tests/payload/pages/PayloadBasePage.ts | 8 ++------
 1 file changed, 2 insertions(+), 6 deletions(-)
```

### Commits
```
d80ec0a68 fix(e2e): resolve Payload logout test timeout by using direct navigation
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm playwright test tests/payload/payload-auth.spec.ts --grep "logout"` - ✅ 1 passed (19.4s)
- `pnpm playwright test tests/payload/payload-auth.spec.ts` - ✅ 8 passed, 1 skipped (21.6s)
- `pnpm format:fix` - ✅ Passed
- `pnpm lint:fix` - ✅ Passed  
- `pnpm typecheck` - ✅ 37 successful tasks

### Follow-up Items
- None required

---
*Implementation completed by Claude*
