# Bug Fix: Dev Integration Tests Fail - Cookies Not Recognized by Middleware

**Related Diagnosis**: #1514 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: JWT validation failure due to Supabase URL mismatch between E2E setup and deployed middleware
- **Fix Approach**: Ensure exact URL match between `E2E_SUPABASE_URL` environment variable and `NEXT_PUBLIC_SUPABASE_URL` used in middleware JWT validation
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests CI workflow fails because pre-authenticated cookies created in the E2E global-setup are not being recognized by the Vercel middleware in the deployed test environment. Tests navigate to `/home` but get redirected to `/auth/sign-in?next=/home`, indicating the middleware doesn't find a valid session despite:

1. Cookies being correctly created with explicit domain matching
2. Cookie names matching exactly
3. Project refs matching (confirmed by healthcheck)

The root cause is JWT validation failure—likely due to Supabase URL mismatch. The middleware validates the JWT `iss` claim, which includes the Supabase URL. If URLs don't match exactly (including trailing slashes), JWT validation fails silently and the session is rejected.

For full details, see diagnosis issue #1514.

### Solution Approaches Considered

#### Option 1: URL Standardization & Enhanced Verification ⭐ RECOMMENDED

**Description**: Standardize Supabase URLs across the stack and add enhanced verification to catch URL mismatches early.

**Technical approach**:
1. Create a shared URL normalization utility that removes trailing slashes and canonicalizes URLs
2. Update healthcheck endpoint to validate full URL match (not just project ref)
3. Add DEBUG_E2E_AUTH environment flag to enable verbose logging in middleware
4. Update E2E global-setup to use exact URL from environment and log it for debugging
5. Ensure both dev and test environments use identical URL format

**Pros**:
- Catches URL mismatches automatically during test startup
- Prevents silent JWT validation failures
- Improves debugging visibility with structured logs
- Simple implementation with minimal code changes
- Works with existing Supabase client configuration

**Cons**:
- Requires environment variable alignment across dev/test/deploy
- Need to ensure CI environment properly passes through URLs

**Risk Assessment**: low - only adding validation, not changing core auth flow

**Complexity**: moderate - requires coordination across healthcheck, global-setup, and middleware

#### Option 2: Manual JWT Inspection

**Description**: Add explicit JWT token inspection in E2E setup to verify the `iss` claim matches expected Supabase URL.

**Pros**:
- Provides immediate debugging information
- Can be added quickly to global-setup

**Cons**:
- Reactive debugging (doesn't prevent the issue)
- Doesn't improve middleware validation
- Won't help catch issues in production

**Why Not Chosen**: Option 1 is proactive and provides systematic detection.

#### Option 3: Cookie Domain Wildcard Approach

**Description**: Configure cookie domain as wildcard to match any subdomain.

**Pros**:
- Maximum compatibility across domains

**Cons**:
- Security risk (cookies exposed across subdomains)
- Doesn't address root cause (URL mismatch)
- Masking the underlying problem

**Why Not Chosen**: Introduces security risk and doesn't fix root cause.

### Selected Solution: URL Standardization & Enhanced Verification

**Justification**: This approach is systematic, catches the issue early, and improves observability. It addresses the root cause (URL mismatch) while providing better debugging information for future issues. The implementation is straightforward and low-risk.

**Technical Approach**:

1. **URL Normalization Utility** - Create a reusable function that normalizes Supabase URLs
   - Remove trailing slashes
   - Ensure consistent format
   - Compare URLs safely

2. **Enhanced Healthcheck** - Update the healthcheck endpoint to validate full URLs
   - Compare `E2E_SUPABASE_URL` with `NEXT_PUBLIC_SUPABASE_URL` (after normalization)
   - Report mismatch clearly instead of silently failing
   - Validate JWT `iss` claim matches expected URL

3. **Middleware Logging** - Add optional debug logging to middleware
   - Log JWT validation failures when `DEBUG_E2E_AUTH` is enabled
   - Include actual vs. expected URLs in log output
   - Help diagnose JWT validation failures without exposing sensitive data

4. **Global Setup Validation** - Update E2E global-setup to validate URLs before creating cookies
   - Log the Supabase URL being used
   - Call healthcheck endpoint to verify URL match
   - Fail fast with clear error message if URLs don't match

**Architecture Changes** (if any):
- Add new utility file: `apps/web/lib/auth/url-normalization.ts`
- No breaking changes to existing auth flow
- Purely additive changes for observability

**Migration Strategy** (if needed):
- N/A - No data migration needed

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/web/app/healthcheck/route.ts` - Add full URL validation and JWT verification
- `apps/web/proxy.ts` - Add optional DEBUG logging for JWT validation failures
- `apps/e2e/global-setup.ts` - Add URL validation and logging before cookie creation
- `apps/web/lib/auth/url-normalization.ts` - NEW: URL normalization utility

### New Files

If new files are needed:

- `apps/web/lib/auth/url-normalization.ts` - Shared URL normalization utility for consistent URL handling

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create URL Normalization Utility

<describe what this step accomplishes>

Create a reusable utility function for normalizing and comparing Supabase URLs consistently across the codebase.

- Create `apps/web/lib/auth/url-normalization.ts` with `normalizeUrl()` function
- Remove trailing slashes and trailing forward slash variations
- Ensure consistent protocol (https://)
- Add function to safely compare two URLs for equality
- Export both utility functions for use in healthcheck and middleware

**Why this step first**: Other changes depend on this utility for consistent URL handling.

#### Step 2: Enhance Healthcheck Endpoint

<describe what this step accomplishes>

Update the healthcheck endpoint to validate full Supabase URL match and provide detailed diagnostics.

- Import URL normalization utility
- Add validation that compares normalized `E2E_SUPABASE_URL` with `NEXT_PUBLIC_SUPABASE_URL`
- If URLs don't match, return 400 status with detailed error message
- Decode JWT token from session and validate `iss` claim includes expected URL
- Add structured logging with clear output showing:
  - E2E URL being used
  - NEXT_PUBLIC URL from middleware
  - Normalized versions for comparison
  - Any mismatches found

#### Step 3: Add Middleware Debug Logging

<describe what this step accomplishes>

Enable optional debug logging in the proxy middleware to help diagnose JWT validation failures.

- Check for `DEBUG_E2E_AUTH` environment variable
- When enabled and JWT validation fails:
  - Log that JWT validation failed (don't expose the token itself)
  - Log the expected Supabase URL from environment
  - Log any parsing errors
  - Use structured logging for consistency
- Ensure logs are only output in non-production environments
- This helps diagnose JWT validation failures without exposing sensitive data

#### Step 4: Update E2E Global Setup

<describe what this step accomplishes>

Add URL validation and logging to global-setup before creating pre-authenticated cookies.

- Extract Supabase URL from `E2E_SUPABASE_URL` environment variable
- Log the URL being used for cookie creation
- Call the healthcheck endpoint to verify URL configuration before proceeding
- If healthcheck fails, exit with clear error message showing the URL mismatch
- Add diagnostic information to help debug CI failures
- Ensure error message is printed to console for CI visibility

#### Step 5: Add Unit Tests

<describe the testing strategy>

Add tests to verify URL normalization and healthcheck validation work correctly.

- Create test file: `apps/web/lib/auth/__tests__/url-normalization.spec.ts`
  - Test that trailing slashes are removed
  - Test that URLs with different formats are normalized correctly
  - Test URL comparison for equality
- Create test file: `apps/web/app/healthcheck/__tests__/route.spec.ts`
  - Test healthcheck returns 200 when URLs match
  - Test healthcheck returns 400 when URLs don't match
  - Test error message includes both URLs for debugging
- Add E2E test to verify global-setup validates URLs

#### Step 6: Integration Testing

<describe the testing strategy>

Test the complete fix end-to-end in the CI environment.

- Run dev-integration-tests CI workflow
- Verify:
  - Global setup successfully creates pre-authenticated cookies
  - Tests navigate to `/home` without redirect to sign-in
  - Tests can access protected pages
  - No "unauthorized" errors in middleware logs
  - If URL mismatch occurs, clear error message is shown early (in global-setup)

#### Step 7: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ URL normalization removes trailing slashes correctly
- ✅ URL comparison works with various URL formats
- ✅ Healthcheck detects URL mismatches
- ✅ Healthcheck passes when URLs match exactly
- ✅ Error messages are clear and include both URLs

**Test files**:
- `apps/web/lib/auth/__tests__/url-normalization.spec.ts` - URL utility tests
- `apps/web/app/healthcheck/__tests__/route.spec.ts` - Healthcheck validation tests

### Integration Tests

Test the integration between E2E setup and middleware:

**Test files**:
- `apps/e2e/tests/auth-setup.spec.ts` - Verify global-setup validates URLs before proceeding

### E2E Tests

Test the complete workflow:

**Test files**:
- `apps/e2e/tests/auth-flow.spec.ts` - Verify authenticated session is recognized by middleware
- `apps/e2e/tests/protected-pages.spec.ts` - Verify redirect doesn't happen for authenticated users

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run dev environment with correct Supabase URL
- [ ] Run test environment with correct Supabase URL
- [ ] Verify healthcheck endpoint returns 200 when URLs match
- [ ] Manually set incorrect `E2E_SUPABASE_URL` and verify healthcheck returns 400
- [ ] Verify error message clearly shows both URLs and the mismatch
- [ ] Run E2E tests and verify global-setup completes successfully
- [ ] Verify tests navigate to `/home` without redirect to sign-in
- [ ] Check that no "unauthorized" errors appear in middleware logs
- [ ] Enable `DEBUG_E2E_AUTH` and verify debug logs appear when enabled
- [ ] Disable `DEBUG_E2E_AUTH` and verify debug logs don't appear (keep logs clean)
- [ ] Run full test suite and verify zero regressions

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Environment Variable Propagation**: CI might not pass `DEBUG_E2E_AUTH` or `E2E_SUPABASE_URL` correctly
   - **Likelihood**: low
   - **Impact**: medium (tests fail with error about missing env var)
   - **Mitigation**: Check CI workflow configuration before deploying. Add validation that required env vars exist.

2. **URL Normalization Edge Cases**: Unexpected URL formats might break normalization
   - **Likelihood**: low
   - **Impact**: low (only affects comparison logic, not auth itself)
   - **Mitigation**: Add comprehensive unit tests for various URL formats. Test with actual Supabase URLs from environments.

3. **Performance Impact**: Additional URL validation on every request might slow down healthcheck
   - **Likelihood**: low
   - **Impact**: low (healthcheck is only called once during test setup)
   - **Mitigation**: Keep validation logic simple and performant. Healthcheck is not in critical path.

**Rollback Plan**:

If this fix causes issues in production:
1. Remove debug logging by deleting DEBUG_E2E_AUTH check from middleware
2. Remove healthcheck validation by commenting out URL comparison logic
3. Remove E2E global-setup validation by commenting out healthcheck call
4. Redeploy without the changes
5. The core auth flow is untouched, so rollback is safe

**Monitoring** (if needed):
- Monitor CI logs for "URL mismatch" errors
- Watch for clear error messages from global-setup validation
- If URL mismatches appear, investigate CI environment configuration

## Performance Impact

**Expected Impact**: none

The changes are purely additive and don't affect the auth flow itself. URL normalization is simple string operations that have negligible performance impact.

**Performance Testing**:
- Healthcheck endpoint should respond in <100ms (same as before)
- Middleware JWT validation timing is unchanged

## Security Considerations

**Security Impact**: none - improvements only

The changes improve security by:
1. Catching URL mismatches early (prevents silent auth failures)
2. Adding optional debug logging that doesn't expose sensitive data
3. Validating URLs without changing core JWT validation logic

**Security Review**:
- Debug logging only outputs when explicitly enabled
- No JWT tokens or sensitive data logged
- No changes to JWT validation or RLS policies

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# In CI environment, run tests with mismatched URLs
export E2E_SUPABASE_URL="https://example.supabase.co/"
export NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co"
pnpm test:e2e

# Expected Result: Tests fail with redirect to sign-in
```

**Expected Result**: Tests redirect to `/auth/sign-in?next=/home` instead of loading protected page

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for auth utilities
pnpm test:unit -- url-normalization.spec.ts
pnpm test:unit -- healthcheck.spec.ts

# E2E tests with correct URLs
pnpm test:e2e

# Build
pnpm build

# Manual verification - check healthcheck
curl http://localhost:3001/healthcheck
# Expected: 200 OK with matching URLs

# Manual verification - run tests locally
pnpm test:e2e
# Expected: Tests pass, no redirect to sign-in
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run E2E tests with various environment configurations
# 1. Correct URLs (should pass)
# 2. Mismatched URLs (should fail gracefully with clear error)
# 3. Missing environment variables (should fail with clear error)

# Verify CI workflow
gh workflow view dev-integration-tests --repo MLorneSmith/2025slideheroes
# Should show green checkmarks for all jobs
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - using only standard Node.js and Next.js APIs

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Ensure `E2E_SUPABASE_URL` environment variable is set in CI
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is set correctly in web application
- Both should point to the same Supabase instance (after URL normalization)

**Feature flags needed**: no

**Backwards compatibility**: maintained - only adding validation, not changing auth flow

## Success Criteria

The fix is complete when:
- [ ] URL normalization utility created and tested
- [ ] Healthcheck endpoint validates full URL match
- [ ] Middleware has optional debug logging for JWT failures
- [ ] E2E global-setup validates URLs before proceeding
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] dev-integration-tests CI workflow passes
- [ ] Zero regressions detected
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

**Key Implementation Details**:
1. Use the URL normalization utility consistently in all places for comparing Supabase URLs
2. Keep debug logging optional (only enabled with `DEBUG_E2E_AUTH`) to avoid log spam
3. The healthcheck is called early in global-setup, so it catches URL mismatches immediately
4. Error messages should be clear and actionable for CI debugging

**Related Documentation**:
- Auth Overview: `.ai/ai_docs/context-docs/infrastructure/auth-overview.md`
- Auth Troubleshooting: `.ai/ai_docs/context-docs/infrastructure/auth-troubleshooting.md`
- E2E Testing: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1514*
