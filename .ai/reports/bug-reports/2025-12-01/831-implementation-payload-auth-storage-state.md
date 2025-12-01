## ✅ Implementation Complete

### Summary
- Added Payload admin authentication to `global-setup.ts` with Supabase auth integration
- Created dedicated "payload" project in `playwright.config.ts` with pre-authenticated storage state
- Removed UI-based login from `payload-collections.spec.ts` and `payload-database.spec.ts` tests
- Added `payload-admin` role to `credential-validator.ts`
- Kept UI-based login in `payload-auth.spec.ts` (intentionally tests login flow itself)
- Configured empty storage state for auth tests to test fresh login scenarios

### Files Changed
```
apps/e2e/global-setup.ts                           | 85 +++++++++++++++++++++-
apps/e2e/playwright.config.ts                      | 18 ++++-
apps/e2e/tests/payload/payload-auth.spec.ts        | 14 +++-
apps/e2e/tests/payload/payload-collections.spec.ts | 50 +++----------
apps/e2e/tests/payload/payload-database.spec.ts    | 41 ++++-------
apps/e2e/tests/utils/credential-validator.ts       | 12 ++-
6 files changed, 148 insertions(+), 72 deletions(-)
```

### Key Changes Made
1. **global-setup.ts**: Added payload-admin user to auth states with `navigateToPayload: true` flag
2. **playwright.config.ts**: Created separate "payload" project using `.auth/payload-admin.json` storage state
3. **Test files**: Removed UI-based `beforeEach` login hooks, tests now assume pre-authenticated state
4. **payload-auth.spec.ts**: Uses `test.use({ storageState: { cookies: [], origins: [] } })` to reset auth for testing login flow

### Validation Results
✅ TypeScript type checking passed
✅ Biome linting/formatting passed
✅ Pre-commit hooks passed (TruffleHog, Biome, type-check)
✅ Commit created successfully

### Expected Behavior After Fix
- **Before**: Tests timeout after ~90 seconds waiting for admin UI elements on login page
- **After**: Tests use pre-authenticated storage state, no login needed, should complete in <30 seconds

### Testing Strategy
The implementation follows the proven pattern used by main app tests:
- Global setup authenticates via Supabase API
- Navigates to Payload admin panel to ensure cookies are properly set
- Saves storage state to `.auth/payload-admin.json`
- Tests automatically use this state via playwright.config.ts project configuration

### Follow-up Items
- Run `pnpm --filter web-e2e test:shard7` to verify fix resolves timeout issue
- Monitor test execution time (should drop from ~90+ seconds to <30 seconds)

---
*Implementation completed by Claude Code*
