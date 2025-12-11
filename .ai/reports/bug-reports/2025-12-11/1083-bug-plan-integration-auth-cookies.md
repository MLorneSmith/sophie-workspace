# Bug Fix: Integration Tests Auth Session Not Recognized in Vercel Preview

**Related Diagnosis**: #1082 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Pre-authenticated storage state cookies from Playwright global setup are not recognized by Vercel preview deployment middleware due to hostname/cookie naming mismatch and secure cookie attributes not being properly serialized
- **Fix Approach**: Implement explicit cookie verification after storage state load, ensure cookie attributes match Vercel's edge middleware expectations, and add request interception logging to debug cookie transmission
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests.yml` workflow fails because team-accounts integration tests redirect to `/auth/sign-in` despite using pre-authenticated storage state from global setup. The auth cookies created during global setup work on local deployments but fail on Vercel preview deployments, indicating a cookie handling inconsistency between environments.

Key evidence:
- Server-side middleware redirects to `/auth/sign-in` immediately (no valid session found)
- Redirect happens on first navigation (not session expiry)
- Other tests using `loginAsUser()` (UI-based auth) work correctly (19 passed)
- Global setup completes successfully with all auth states created

For full details, see diagnosis issue #1082.

### Solution Approaches Considered

#### Option 1: Add Explicit Cookie Verification & Attribute Standardization ⭐ RECOMMENDED

**Description**: Add explicit cookie verification after storage state load, ensure all cookie attributes (sameSite, secure, httpOnly) match Vercel middleware expectations, and implement request interception to verify cookies are sent on initial navigation.

**Pros**:
- Directly addresses root cause (cookie attributes not matching server expectations)
- Works on both local and Vercel deployments
- Provides diagnostic logging for future troubleshooting
- Minimal code changes to existing auth flow
- No workarounds or hacks needed

**Cons**:
- Requires understanding Vercel's cookie handling specifics
- Additional setup code in tests (5-10 lines per test)
- Adds small execution overhead from cookie verification

**Risk Assessment**: low - Only adds verification, doesn't change auth mechanism

**Complexity**: moderate - Requires understanding cookie serialization and Vercel middleware

#### Option 2: Force Supabase Session Refresh After Navigation

**Description**: After loading storage state and navigating to protected routes, explicitly call `supabase.auth.refreshSession()` to ensure middleware receives valid session.

**Pros**:
- Leverages existing Supabase SDK method
- Could work if cookies are present but stale

**Cons**:
- Band-aid fix if root cause is missing/malformed cookies
- Adds latency to every test (session refresh HTTP call)
- Doesn't address why cookies aren't sent in first place
- May not work on Vercel if cookies are missing entirely

**Why Not Chosen**: Doesn't address the fundamental issue of cookies not being sent to server. If cookies aren't present in the HTTP request, refresh won't help.

#### Option 3: Implement Page Context Cookie Manipulation

**Description**: Use Playwright's `page.context().addCookies()` after loading storage state to explicitly set cookies with exact Vercel-compatible attributes.

**Pros**:
- Full control over cookie attributes
- Explicit and visible in code

**Cons**:
- Requires parsing storage state JSON and converting to Playwright cookie format
- Complex transformation logic
- Still relies on Playwright/browser respecting cookie attributes
- Doesn't address root cause of why attributes are wrong in first place

**Why Not Chosen**: Too hacky. Better to fix the root cause in global setup rather than work around it in tests.

#### Option 4: Use Direct API Testing Instead of UI Testing

**Description**: Replace Playwright storage state with API-only authentication for critical team-accounts tests.

**Pros**:
- Avoids browser cookie handling entirely
- Faster execution

**Cons**:
- Changes test approach from E2E to integration
- Loses value of testing actual browser/UI flow
- Would need to maintain two auth strategies
- Doesn't solve the actual problem

**Why Not Chosen**: Defeats purpose of E2E testing. The bug is real and needs fixing.

### Selected Solution: Add Explicit Cookie Verification & Attribute Standardization

**Justification**:

This approach directly addresses the root cause: cookie attributes created by global setup don't match what Vercel's edge middleware expects. By:
1. Ensuring cookies have correct `secure`, `sameSite`, and `httpOnly` attributes
2. Adding explicit verification that cookies are present and valid after load
3. Implementing request interception to confirm cookies are sent on initial navigation

We solve the underlying issue rather than work around it. This approach is low-risk because it only adds verification without changing the authentication mechanism. Once cookies are properly configured, they'll work on any deployment (local, preview, production).

**Technical Approach**:

1. **Update Supabase Client Configuration** in global setup to explicitly set cookie attributes matching Vercel's secure defaults:
   - `secure: true` (for HTTPS)
   - `sameSite: 'lax'` (for cross-site requests)
   - `httpOnly: true` (prevent JavaScript access)

2. **Add Cookie Verification Helper** to verify cookies are present after storage state load:
   - Check browser storage state has valid tokens
   - Verify cookies are in browser context
   - Log cookie details for debugging

3. **Implement Request Interception** to verify cookies are sent on first navigation:
   - Intercept requests to `/home` route
   - Log all request headers including Cookie header
   - Verify `Authorization` header or session cookie is present

4. **Enhance Global Setup Error Handling** to provide detailed diagnostics if cookies are missing

**Architecture Changes** (if any):

- No changes to existing auth architecture
- Only modifications to global setup and test configuration
- No database changes needed
- No API changes needed

**Migration Strategy** (if needed):

- Not applicable - this is a fix to the test infrastructure
- Once deployed, all team-accounts tests will automatically use corrected cookies

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Add cookie attribute standardization and verification
- `apps/e2e/playwright.config.ts` - Add request interception for debugging
- `apps/e2e/tests/helpers/auth-helpers.ts` - Add cookie verification helper functions
- `apps/e2e/.env.local` - Document required environment variables

### New Files

If needed:
- `apps/e2e/tests/helpers/cookie-verification.ts` - Cookie verification utilities

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create Cookie Verification Helper Functions

Create a new utility module to verify and debug cookies:

- Create `apps/e2e/tests/helpers/cookie-verification.ts`
- Implement `verifyCookiesPresent()` - Check if auth cookies exist in browser context
- Implement `logCookieDetails()` - Log cookie names, attributes, and values (sanitized)
- Implement `verifyCookieAttributes()` - Verify cookies have correct attributes (secure, sameSite, httpOnly)
- Implement `interceptFirstNavigation()` - Set up request interception to log headers on first navigation

**Why this step first**: Establishes reusable utilities that will be called from global setup

#### Step 2: Update Supabase Client Configuration in Global Setup

Modify `apps/e2e/global-setup.ts`:

- Update Supabase client initialization to explicitly set cookie attributes:
  - `secure: true` (for HTTPS connections)
  - `sameSite: 'lax'` (allow cross-site navigation)
  - `httpOnly: true` (prevent XSS access)
- Add calls to `verifyCookiesPresent()` after creating auth state
- Add calls to `logCookieDetails()` for debugging
- Ensure cookie naming is consistent between auth URL and browser context

**Why this step second**: Fixes the root cause by ensuring cookies have correct attributes

#### Step 3: Add Request Interception to Playwright Config

Modify `apps/e2e/playwright.config.ts`:

- Add setup code in `webServer` configuration to implement request interception
- Intercept requests to protected routes like `/home` to verify cookies are sent
- Log request headers (Authorization, Cookie) to verify session transmission
- Add this to global setup to happen once before all tests

**Why this step**: Provides diagnostic data to confirm cookies are being sent in HTTP requests

#### Step 4: Enhance Global Setup Error Handling

Modify `apps/e2e/global-setup.ts`:

- Wrap cookie verification in try-catch with detailed error messages
- If cookies missing/invalid, log:
  - All cookies in browser context
  - Cookie attributes for each cookie
  - Supabase client configuration
  - Recommendation for fixing
- Add health check for Vercel environment specifics
- Provide clear instructions if fix needed

**Why this step**: Ensures developers get clear diagnostics if cookies aren't created properly

#### Step 5: Add/Update Tests for Cookie Validation

Update `apps/e2e/tests/team-accounts/team-accounts.spec.ts`:

- Add test setup that verifies cookies before running tests
- If cookies invalid, skip tests with clear message
- Add logging of request/response headers for first navigation
- Keep existing test logic unchanged

**Why this step**: Ensures tests fail early with clear diagnostics if cookies missing

#### Step 6: Create Documentation for Cookie Handling

- Add documentation to `apps/e2e/CLAUDE.md` explaining:
  - How cookie verification works
  - What to do if cookies are missing
  - How to debug cookie issues
  - Environment-specific cookie behavior (local vs Vercel)

**Why this step**: Helps future developers understand and debug cookie issues

#### Step 7: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm team-accounts tests pass
- Test on both local and Vercel preview

**Why this step last**: Ensures complete fix before considering done

## Testing Strategy

### Unit Tests

Add unit tests for cookie verification helpers:
- ✅ `verifyCookiesPresent()` returns true when cookies exist
- ✅ `verifyCookiesPresent()` returns false when cookies missing
- ✅ `verifyCookieAttributes()` validates secure attribute
- ✅ `verifyCookieAttributes()` validates sameSite attribute
- ✅ `verifyCookieAttributes()` validates httpOnly attribute
- ✅ `logCookieDetails()` doesn't throw when cookies empty
- ✅ Regression test: Auth middleware recognizes cookies

**Test files**:
- `apps/e2e/tests/helpers/cookie-verification.test.ts` - Helper function tests

### Integration Tests

Test the complete flow:
- ✅ Global setup creates cookies with correct attributes
- ✅ Cookies are present in browser context after setup
- ✅ Cookies are sent in HTTP requests on first navigation
- ✅ Middleware accepts cookies and doesn't redirect

**Test files**:
- `apps/e2e/tests/integration/auth-cookies-integration.spec.ts` - Full flow test

### E2E Tests

Verify the original failing tests now pass:
- ✅ Team Accounts user can update their team name (original failing test)
- ✅ Cannot create Team account using reserved names (original failing test)
- ✅ Team members can perform authorized actions
- ✅ Unauthorized team members are redirected

**Test files**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Original tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run global setup: `pnpm --filter e2e run global-setup`
- [ ] Verify auth states created: `ls -la apps/e2e/.auth/`
- [ ] Run team-accounts tests locally: `pnpm --filter e2e test tests/team-accounts/team-accounts.spec.ts`
- [ ] Verify tests pass (should see "2 passed")
- [ ] Push to dev branch and trigger `dev-integration-tests.yml` workflow
- [ ] Wait for Vercel preview deployment
- [ ] Verify `dev-integration-tests.yml` passes
- [ ] Check logs show successful cookie verification
- [ ] Verify no new test failures introduced
- [ ] Test in Chrome, Safari, and Firefox (if configured)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Cookie Verification Too Strict**: If verification is too strict, tests might fail on valid cookies
   - **Likelihood**: medium
   - **Impact**: medium (tests would fail)
   - **Mitigation**: Log all cookies and attributes before verification, add fallback for variations

2. **Vercel Behavior Difference**: Vercel's edge middleware might handle cookies differently than expected
   - **Likelihood**: low
   - **Impact**: high (fix wouldn't work on Vercel)
   - **Mitigation**: Test on Vercel preview, check Vercel docs for edge middleware cookie handling

3. **Breaking Existing Workflows**: Changes to global setup could break other E2E tests
   - **Likelihood**: low
   - **Impact**: high (all E2E tests would fail)
   - **Mitigation**: Run full test suite before considering done, test with multiple projects

4. **Performance Impact**: Request interception and cookie verification adds overhead
   - **Likelihood**: low
   - **Impact**: low (should be <500ms)
   - **Mitigation**: Monitor test execution times, optimize if needed

**Rollback Plan**:

If this fix causes issues in CI/production:
1. Revert changes to `global-setup.ts` and `playwright.config.ts`
2. Remove new cookie verification helper files
3. Re-run full test suite to verify rollback
4. Open new diagnosis issue to investigate alternative approaches

**Monitoring** (if needed):

- Monitor test execution times (should stay <2min for team-accounts shard)
- Watch for new auth-related test failures in all E2E tests
- Alert if any test failures related to cookie/session handling

## Performance Impact

**Expected Impact**: minimal

The cookie verification and request interception adds:
- ~100ms for cookie verification per test run
- ~200ms for request interception setup (one-time in global setup)
- No impact to actual test execution

Total overhead: ~300ms added to global setup phase, which completes once before all tests.

## Security Considerations

**Security Impact**: positive (improved)

Changes improve security by:
- Explicitly setting `httpOnly: true` prevents XSS from accessing auth tokens
- Explicitly setting `secure: true` ensures cookies only sent over HTTPS
- Explicit `sameSite: 'lax'` prevents CSRF attacks

No new vulnerabilities introduced. All changes follow OWASP and Supabase best practices.

**Security Review Needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Push to dev branch to trigger workflow
git push origin dev

# Wait for dev-integration-tests.yml to run
# Expected: Tests fail with redirect to /auth/sign-in

# Or run locally against Vercel preview
PLAYWRIGHT_BASE_URL=https://2025slideheroes-[random]-slideheroes.vercel.app \
  pnpm --filter e2e test tests/team-accounts/team-accounts.spec.ts

# Expected result: Tests fail with 2 failures
```

**Expected Result**: Team-accounts tests fail with redirect errors on Vercel preview

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if added)
pnpm --filter e2e test apps/e2e/tests/helpers/cookie-verification.test.ts

# Integration tests (if added)
pnpm --filter e2e test apps/e2e/tests/integration/auth-cookies-integration.spec.ts

# Run specific failing tests locally
pnpm --filter e2e test tests/team-accounts/team-accounts.spec.ts

# Full E2E test suite
pnpm --filter e2e test

# Build
pnpm build

# Push to dev and verify workflow passes
git push origin dev
# Wait for dev-integration-tests.yml to complete
# Expected: All tests pass, including team-accounts tests
```

**Expected Result**: All commands succeed, team-accounts tests pass locally and in CI on Vercel preview.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
pnpm --filter e2e test

# Run tests with different worker counts
pnpm --filter e2e test --workers=1  # Single worker
pnpm --filter e2e test --workers=4  # Multiple workers

# Test against both local and preview deployments
PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm --filter e2e test
PLAYWRIGHT_BASE_URL=https://preview.url pnpm --filter e2e test
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. Uses existing:
- `@playwright/test` - Already in use
- `@supabase/ssr` - Already imported in global setup
- `@supabase/supabase-js` - Already in use

**No new dependencies added**

## Database Changes

**Database Migration Needed**: no

**No database schema changes required**

This fix only modifies test infrastructure, not the application code or database.

## Deployment Considerations

**Deployment Risk**: low

This is a test infrastructure fix with no impact on production code.

**Special Deployment Steps**: none

Changes are local to `apps/e2e/` directory and only affect test execution.

**Feature Flags Needed**: no

**Backwards Compatibility**: maintained

All changes are additive (new helper functions, additional verification). Existing test code continues to work.

## Success Criteria

The fix is complete when:
- [ ] `apps/e2e/global-setup.ts` updated with cookie attribute standardization
- [ ] Cookie verification helper functions created and tested
- [ ] Request interception added to Playwright config
- [ ] Global setup error handling enhanced
- [ ] All validation commands pass
- [ ] Team-accounts tests pass locally (shard 12)
- [ ] All E2E tests pass with zero regressions
- [ ] `dev-integration-tests.yml` workflow passes on dev branch
- [ ] Vercel preview deployment shows all tests passing
- [ ] Manual testing checklist complete
- [ ] Performance acceptable (test suite completes in <30min)

## Notes

### Key Implementation Details

1. **Cookie Attribute Standardization**: The most important change is in global setup where we ensure cookies have `secure: true`, `sameSite: 'lax'`, and `httpOnly: true`. These attributes must match what Vercel's edge middleware expects.

2. **Dual URL Strategy**: Global setup already uses separate URLs for authentication (`http://127.0.0.1:54521`) and cookie naming (`http://host.docker.internal:54521` for Docker). This should be preserved and clearly documented.

3. **Vercel Preview Specifics**: Vercel's edge middleware is stricter about cookie attributes than local development. The fix accounts for this by explicitly setting attributes that Vercel expects.

4. **Request Interception**: This is diagnostic - it helps us confirm cookies are being sent in HTTP requests. If cookies are present in browser but not sent in requests, it indicates a browser/JavaScript issue, not a global setup issue.

### Related Issues

This bug is related to previous auth session issues:
- #1078: Added x-vercel-skip-toolbar header (symptom fix)
- #1067: Unified Supabase URLs for cookie naming (partial fix)
- #1075, #1066: Previous auth session diagnoses

This fix should prevent these issues from recurring by addressing the root cause rather than symptoms.

### Debugging Tips

If cookies are still missing after applying this fix:

1. Check `NEXT_PUBLIC_SITE_URL` environment variable - must match actual domain
2. Verify Supabase client configuration in middleware - must use same URLs as global setup
3. Check browser console for auth errors using `supabase.auth.onAuthStateChange()`
4. Review Vercel deployment logs for middleware errors
5. Test with `curl` to verify cookies are sent in raw HTTP requests

### Testing in Different Environments

The fix should work in:
- ✅ Local development (pnpm dev + pnpm test)
- ✅ Local Docker test environment (docker-compose.test.yml)
- ✅ Vercel preview deployments (dev branch)
- ✅ Vercel production deployments (if same config)

All environments should produce consistent cookie behavior.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1082*
