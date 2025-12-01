## ✅ Implementation Complete

### Summary
- Removed redundant `getUser()` call from marketing layout (`apps/web/app/(marketing)/layout.tsx`)
- Eliminated race condition where middleware's `getSession()` and layout's `getUser()` competed for same refresh token
- Marketing layout now sets `user: null` directly - SiteHeader already handles null user gracefully
- Added code comment referencing #827 for future maintainability

### Files Changed
```
apps/web/app/(marketing)/layout.tsx | 29 ++++-------------------------
1 file changed, 4 insertions(+), 25 deletions(-)
```

### Commits
```
05227c353 fix(auth): resolve refresh token race condition on marketing pages
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - Passed (37/37 packages)
- `pnpm lint:fix` - Passed (no errors)
- `pnpm format:fix` - Passed
- `pnpm test:unit` - Passed (434/434 tests)
- E2E tests skipped per user request

### Technical Details
- **Root Cause**: Middleware (`proxy.ts:75`) called `getSession()` consuming refresh token, then layout's concurrent `getUser()` attempted to use the same already-consumed token
- **Solution**: Remove redundant auth call from marketing layout since middleware already validates authentication
- **Risk Level**: Low - marketing pages work correctly without user context (public pages)
- **Performance**: Slight improvement (fewer auth API calls per request)

### Follow-up Items
- None required - fix is complete and self-contained
- Consider client-side `useUser()` hook if user context needed on marketing pages in future

---
*Implementation completed by Claude*
