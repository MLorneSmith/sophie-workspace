## ✅ Implementation Complete

### Summary
- Created URL normalization utility (`apps/web/lib/auth/url-normalization.ts`) with functions for:
  - `normalizeUrl()` - Remove trailing slashes and normalize URL format
  - `urlsMatch()` - Compare two URLs after normalization
  - `getProjectRefFromUrl()` - Extract project reference from Supabase URL
  - `getCookieNameFromUrl()` - Generate expected cookie name from URL
  - `validateSupabaseUrls()` - Comprehensive validation with detailed mismatch info
- Enhanced healthcheck endpoint (`apps/web/app/healthcheck/route.ts`) with:
  - New `e2e_supabase_url` query parameter for validation
  - Returns 400 with detailed error info when URLs don't match
  - Returns full validation details when URLs match
- Added JWT issuer validation logging in middleware (`apps/web/proxy.ts`):
  - Logs JWT issuer vs expected Supabase URL when `DEBUG_E2E_AUTH=true`
  - Warns when issuer mismatch detected (likely cause of auth failures)
- Updated E2E global-setup (`apps/e2e/global-setup.ts`) to:
  - Call healthcheck with URL validation before creating cookies
  - Fail fast with clear error message if URLs don't match
  - Display detailed configuration info for debugging
- Added comprehensive unit tests (29 tests) for URL normalization utility

### Files Changed
```
apps/e2e/global-setup.ts                           | 127 ++++++++---
apps/web/app/healthcheck/route.ts                  |  73 +++++-
apps/web/lib/auth/url-normalization.test.ts        | 253 +++++++++++++++++++++
apps/web/lib/auth/url-normalization.ts             | 165 ++++++++++++++
apps/web/proxy.ts                                  |  42 +++-
```

### Commits
```
dc6b015b3 fix(e2e): add URL validation to prevent E2E auth failures
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 39 packages pass type checking
- Unit tests - All 29 URL normalization tests pass
- `pnpm lint:fix` - No linting issues
- `pnpm format:fix` - 4 files formatted

### Follow-up Items
- Run dev-integration-tests CI workflow to verify fix in CI environment
- Monitor for clear error messages if URL mismatches occur in future

---
*Implementation completed by Claude*
