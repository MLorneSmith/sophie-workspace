## Implementation Complete

### Summary
- Replaced `requireUser()` with `client.auth.getUser()` in marketing layout
- Added graceful null handling for unauthenticated visitors
- Mapped Supabase User object to JWTUserData format for compatibility with SiteHeader
- Removed unused `requireUser` import

### Files Changed
```
 apps/web/app/(marketing)/layout.tsx | 19 ++++++++++++++++---
 1 file changed, 16 insertions(+), 3 deletions(-)
```

### Commits
```
f1da54496 fix(web): replace requireUser with graceful getUser on marketing pages
```

### Validation Results
All validation commands passed successfully:
- `pnpm typecheck` - Passed (40/40 tasks)
- `pnpm lint` - Passed (4 pre-existing warnings unrelated to this change)
- `pnpm format` - Passed
- `pnpm --filter web build` - Passed (compiled successfully)

### Technical Details

**Root Cause**: Marketing layout called `requireUser()` which triggers token refresh for ALL visitors, including unauthenticated users with stale cookies. This caused 8+ repeated `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` console errors.

**Solution**: Replaced with `client.auth.getUser()` which gracefully returns `{ data: { user: null }, error: null }` for unauthenticated visitors without attempting token refresh.

**Code Change**:
```typescript
// Before
const user = await requireUser(client, { verifyMfa: false });

// After
const { data } = await client.auth.getUser();
const user: JWTUserData | null = data.user
  ? {
      id: data.user.id,
      email: data.user.email ?? "",
      phone: data.user.phone ?? "",
      app_metadata: data.user.app_metadata,
      user_metadata: data.user.user_metadata,
      aal: "aal1" as const,
      is_anonymous: data.user.is_anonymous ?? false,
    }
  : null;
```

### Follow-up Items
- None required. Fix is complete and self-contained.

---
*Implementation completed by Claude*
*Related: GitHub Issue #797, Diagnosis #780*
