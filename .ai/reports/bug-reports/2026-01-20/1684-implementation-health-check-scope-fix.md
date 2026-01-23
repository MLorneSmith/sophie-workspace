## ✅ Implementation Complete

### Summary
- Replaced two-branch health check logic with three-branch pattern:
  1. `E2E_LOCAL_SUPABASE=true`: Full enhanced health checks with exponential backoff
  2. `CI=true` without local Supabase: PostgREST API check only (no PostgreSQL)
  3. Local development: Both PostgreSQL and PostgREST checks
- Added environment guard around `cleanupBillingTestData()` to skip when no local PostgreSQL
- Updated comments to reference both #1681 and #1684

### Files Changed
```
apps/e2e/global-setup.ts | 64 ++++++++++++++++++++++++++++++++++++++----------
1 file changed, 51 insertions(+), 13 deletions(-)
```

### Commits
```
a80de6960 fix(e2e): add CI+remote Supabase branch to health check logic
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - 39 packages, all passed
- `pnpm lint` - No errors
- `pnpm exec biome check apps/e2e/global-setup.ts` - No issues

### Technical Details

The fix adds proper environment detection to distinguish between:
1. **e2e-sharded.yml** (`E2E_LOCAL_SUPABASE=true`): Runs local Supabase → full health checks
2. **dev-integration-tests.yml** (`CI=true` only): Uses remote Supabase → PostgREST only
3. **Local development**: Has local PostgreSQL → full checks

This prevents the "PostgreSQL unreachable" error that occurred when `dev-integration-tests.yml` tried to connect to `localhost:54522` which doesn't exist in that workflow.

### Follow-up Items
- Verify by running `dev-integration-tests.yml` workflow manually via GitHub UI
- Confirm `e2e-sharded.yml` continues to work (local Supabase path unchanged)

---
*Implementation completed by Claude*
