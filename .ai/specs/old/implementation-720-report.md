## ✅ Implementation Complete

### Summary
- Fixed auth timeout issues caused by redundant login attempts on pre-authenticated sessions
- Added `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)` to Impersonation test
- Added clean storage state (`{ cookies: [], origins: [] }`) to Team Account Management and Full Invitation Flow tests
- Removed redundant `loginAsSuperAdmin()` call from Impersonation test

### Root Cause
The playwright config (`playwright.config.ts:108`) sets a default storage state (`test1@slideheroes.com`), meaning ALL tests start with an authenticated session. Tests that called `loginAsUser()` or `loginAsSuperAdmin()` would navigate to `/auth/sign-in`, get immediately redirected to `/home` (already authenticated), and timeout waiting for `auth/v1/token` API responses that never arrive.

### Fix Applied
1. **Impersonation test**: Now uses `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)` instead of calling `loginAsSuperAdmin()` - leverages pre-authenticated session properly
2. **Team Account Management**: Added `test.use({ storageState: { cookies: [], origins: [] } })` to start with clean session (this test intentionally performs multi-user auth flows)
3. **Full Invitation Flow**: Added `test.use({ storageState: { cookies: [], origins: [] } })` to start with clean session (this test intentionally performs auth flow)

### Files Changed
```
apps/e2e/tests/admin/admin.spec.ts         | 12 ++++++------
apps/e2e/tests/invitations/invitations.spec.ts |  3 +++
```

### Verification
Auth fixes verified working:
- `[Super-Admin Auth] ✅ Successfully authenticated and reached destination`
- `[Phase 1] ✅ Auth API responded (324ms)` / `(352ms)`

### Remaining Issues (Out of Scope)
Some tests still fail due to separate infrastructure issues:
- **Email delivery**: Mailpit not receiving invitation emails (affects Full Invitation Flow)
- **Team creation UI**: Account selector timeout (affects Invitations tests)
- **Admin Dashboard**: Visibility check failures

These are not related to the auth timeout issue and should be addressed separately.

### Commits
```
c529c025d fix(e2e): resolve auth timeout from redundant login on pre-authenticated sessions
```

---
*Implementation completed by Claude*
