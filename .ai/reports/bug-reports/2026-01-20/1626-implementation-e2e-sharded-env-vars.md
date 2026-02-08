## ✅ Implementation Complete

### Summary
- Added `E2E_SUPABASE_ANON_KEY` and `E2E_SUPABASE_SERVICE_ROLE_KEY` exports to workflow
- Added `E2E_LOCAL_SUPABASE=true` flag to signal local Supabase setup in CI
- Updated `global-setup.ts` localhost validation to skip when `E2E_LOCAL_SUPABASE=true`

### Root Cause
The test code (`test-users.ts`, `auth.po.ts`) expected `E2E_SUPABASE_SERVICE_ROLE_KEY` but the workflow only exported `SUPABASE_SERVICE_ROLE_KEY`. When the `E2E_` prefixed variable was missing, the code fell back to a hardcoded HS256 key, but Supabase uses ES256 keys, causing "signing method HS256 is invalid" JWT errors.

Additionally, `global-setup.ts` line 414 threw an error when CI=true and URL contained localhost, blocking the sharded workflow's intentional local Supabase setup.

### Files Changed
```
.github/workflows/e2e-sharded.yml | 15 +++++++++++++++
apps/e2e/global-setup.ts          | 10 +++++++++-
2 files changed, 24 insertions(+), 1 deletion(-)
```

### Commits
```
2030b3dde fix(ci): add E2E_ prefixed env vars and local Supabase flag for sharded workflow
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - Passed
- `pnpm lint` - Passed (warnings in unrelated .ai/alpha/scripts files)
- `pnpm format` - Changed files formatted correctly

### Verification
To verify the fix, push to dev branch and monitor the E2E Sharded workflow:
```bash
git push origin dev
gh run watch -R slideheroes/2025slideheroes
```

Expected: All shards pass without JWT or localhost validation errors.

---
*Implementation completed by Claude*
