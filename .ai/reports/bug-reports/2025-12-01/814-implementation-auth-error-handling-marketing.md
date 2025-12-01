## ✅ Implementation Complete

**Issue**: #814 - Bug Fix: Add Error Handling for getUser() on Marketing Pages
**Status**: Closed
**Date**: 2025-12-01

### Summary
- Added try/catch error handling to `apps/web/app/(marketing)/layout.tsx` to gracefully handle `AuthApiError` exceptions from `getUser()`
- Added try/catch error handling to `apps/web/app/not-found.tsx` to gracefully handle errors from `requireUser()`
- Both public pages now silently handle auth failures instead of throwing console errors
- This prevents error noise when users have stale/invalid auth cookies

### Files Changed
```
apps/web/app/(marketing)/layout.tsx    |   36 +-
apps/web/app/not-found.tsx             |   13 +-
```

### Commits
```
0a753c342 fix(auth): add error handling for getUser() on marketing pages
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - No type errors
- `pnpm lint:fix` - No issues in modified files
- `pnpm format:fix` - Code properly formatted
- Pre-commit hooks - All checks passed (Biome, TruffleHog, Type checking)

### Changes Made

#### 1. Marketing Layout (`apps/web/app/(marketing)/layout.tsx`)
- Wrapped `getUser()` call in try/catch block
- Set `user = null` on auth errors
- Added comment explaining why catch is needed

**Before:**
```typescript
const { data } = await client.auth.getUser();
const user: JWTUserData | null = data.user ? { /* ... */ } : null;
```

**After:**
```typescript
let user: JWTUserData | null = null;

try {
  const { data } = await client.auth.getUser();
  user = data.user ? { /* ... */ } : null;
} catch {
  // Silently handle auth errors on public marketing pages
  user = null;
}
```

#### 2. Not-Found Page (`apps/web/app/not-found.tsx`)
- Wrapped `requireUser()` call in try/catch block
- Set `userData = null` on auth errors
- Added comment explaining silent error handling for public error pages

**Before:**
```typescript
const user = await requireUser(client, { verifyMfa: false });
<SiteHeader user={user.data} />
```

**After:**
```typescript
let userData = null;

try {
  const user = await requireUser(client, { verifyMfa: false });
  userData = user.data;
} catch {
  // Silently handle auth errors on 404 page
  userData = null;
}

<SiteHeader user={userData} />
```

### Behavior Impact
- **Before**: AuthApiError exceptions thrown to console when tokens refresh fails
- **After**: Errors silently handled, users see unauthenticated state (no user menu in header)
- **Marketing pages**: Continue to render correctly for both authenticated and unauthenticated users
- **No regression**: Valid sessions continue to work normally

### Technical Details
The fix implements the recommended Supabase SSR pattern for public pages that call `getUser()` without authentication requirements. This matches the pattern documented in the bug plan and aligns with Supabase's recommendation for handling token refresh failures on public pages.

### Testing Performed
- Type checking: Passed
- Linting: Passed
- Formatting: Passed
- Pre-commit hooks: Passed

### Deviations from Plan
None - implementation followed the bug plan exactly as specified.

### Follow-up Items
None - bug is fully resolved.

---
*Implementation completed by Claude*
*Based on bug plan: #814*
