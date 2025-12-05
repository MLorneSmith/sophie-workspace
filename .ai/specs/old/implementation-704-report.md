## ✅ Implementation Complete

### Summary
- Replaced `signIn()` with `loginAsUser()` in three auth-simple.spec.ts tests to fix race condition
- Tests affected: "user can sign in with valid credentials", "sign out clears session", "session persists across page navigation"
- `loginAsUser()` properly awaits Supabase auth API response before waiting for navigation

### Root Cause
The `signIn()` method submits the form but does NOT wait for the Supabase auth API response. Tests immediately waited for navigation that depends on that response, causing a 30-second timeout.

### Solution
Replaced `signIn()` calls with `loginAsUser()` which:
1. Sets up a listener for the auth API response (`auth/v1/token`)
2. Submits the form
3. Waits for the API response to complete
4. Then waits for navigation

### Files Changed
```
apps/e2e/tests/authentication/auth-simple.spec.ts | 47 ++++------------------
 1 file changed, 7 insertions(+), 40 deletions(-)
```

### Commits
```
177754cb3 fix(e2e): replace signIn() with loginAsUser() to prevent auth timeout race condition
```

### Validation Results
✅ TypeScript typecheck passed
✅ Biome lint passed

**Note**: Full E2E test validation could not complete due to environment configuration issue (Supabase port mismatch: app configured for 54321, Supabase running on 54521). This is an infrastructure issue, not related to the code fix.

---
*Implementation completed by Claude*
