## ✅ Implementation Complete

### Summary
- Added runtime `test.skip()` checks to both billing test files (`team-billing.spec.ts` and `user-billing.spec.ts`) that evaluate `ENABLE_BILLING_TESTS` environment variable
- Fixed dotenv configuration in `playwright.config.ts` - removed `override: true` which was incorrectly allowing .env file values to override shell/CI environment variables
- Fixed strict mode violation in `billing.po.ts` by adding `.first()` to the `.or()` locator chain

### Root Cause Fix
The original issue was that `--grep @integration` bypassed Playwright's `testIgnore` file patterns. The runtime `test.skip()` approach ensures tests respect the configuration regardless of how they're invoked.

Additionally, there was a secondary issue where `dotenv({ override: true })` was causing .env.local values to override shell environment variables, preventing CI from controlling the flag.

### Files Changed
```
apps/e2e/playwright.config.ts                    | 9 +++++----
apps/e2e/tests/team-billing/team-billing.spec.ts | 5 +++++
apps/e2e/tests/user-billing/user-billing.spec.ts | 5 +++++
apps/e2e/tests/utils/billing.po.ts               | 5 ++++-
4 files changed, 19 insertions(+), 5 deletions(-)
```

### Validation Results
✅ All validation commands passed successfully:
- `ENABLE_BILLING_TESTS=false` → 2 billing tests skipped
- `ENABLE_BILLING_TESTS=true` → 2 billing tests run (pass)
- `pnpm lint --filter web-e2e` → No errors
- `pnpm typecheck --filter web-e2e` → No errors

### Commit
```
02cfe9154 fix(e2e): ensure billing tests respect ENABLE_BILLING_TESTS flag
```

---
*Implementation completed by Claude*
