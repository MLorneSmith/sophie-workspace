## ✅ Implementation Complete

### Summary
- Added `NEXT_PUBLIC_AUTH_PASSWORD: 'true'` environment variable to staging-deploy.yml test-setup job env block
- Added `NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'` environment variable to staging-deploy.yml test-setup job env block
- Added `NEXT_PUBLIC_AUTH_OTP: 'false'` environment variable to staging-deploy.yml test-setup job env block
- Added same three auth environment variables to e2e-sharded.yml setup-server job build step env block
- Validated both workflow files have correct YAML syntax
- All auth variables properly documented with issue references

### Files Changed
```
.github/workflows/e2e-sharded.yml    | 5 +++++
.github/workflows/staging-deploy.yml | 5 +++++
2 files changed, 10 insertions(+)
```

### Commits
```
63dbe8260 fix(ci): add missing NEXT_PUBLIC_AUTH_* environment variables to E2E test workflows
```

### Implementation Details

**Root Cause**: NEXT_PUBLIC_* environment variables are baked into the Next.js client bundle at build time. Missing auth configuration variables prevented password authentication from being enabled, causing sign-in/sign-up pages to render without email form fields.

**Solution**: Added the three environment variables to both workflow build steps:
- `NEXT_PUBLIC_AUTH_PASSWORD: 'true'` - Enables password authentication
- `NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'` - Disables magic link auth
- `NEXT_PUBLIC_AUTH_OTP: 'false'` - Disables OTP auth

This matches the test environment configuration (.env.test) and ensures E2E tests can locate password form fields.

### Validation Results
✅ YAML syntax valid in both files
✅ Pre-commit checks passed (TruffleHog, Biome, Commitlint)
✅ Environment variables properly documented with comments and issue references
✅ Changes are minimal and focused (10 lines added across 2 files)

### Expected Test Results
- E2E Shard 2 (Authentication Tests) should now find [data-testid="sign-in-email"] element
- All authentication-related tests should pass
- No new test failures should be introduced
- Form fields will render correctly in Playwright test runs

### Follow-up Items
None - this is a complete fix with no follow-up work needed.

---
*Implementation completed by Claude*
