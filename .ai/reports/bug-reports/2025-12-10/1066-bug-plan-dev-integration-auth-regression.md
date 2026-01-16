# Bug Fix: Dev Integration Tests Auth Session Regression After #1063 Fix

**Related Diagnosis**: #1066
**Severity**: high
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Cookie name mismatch between E2E setup (using `E2E_SUPABASE_URL`) and deployed Vercel middleware (using `NEXT_PUBLIC_SUPABASE_URL`)
- **Fix Approach**: Ensure both E2E setup and deployed app use identical Supabase URL for cookie derivation; enable `DEBUG_E2E_AUTH` in CI
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests.yml workflow fails with 2 test failures after the #1063 fix was deployed. While the fix correctly improved cookie domain handling for Vercel preview URLs, it inadvertently exposed a deeper issue: the E2E test setup and deployed middleware are deriving Supabase session cookie names from different URLs, causing a mismatch.

Specifically:
- Global setup creates cookies with names derived from `E2E_SUPABASE_URL` (e.g., `sb-xyz-auth-token`)
- Deployed middleware looks for cookies named based on `NEXT_PUBLIC_SUPABASE_URL` (e.g., `sb-abc-auth-token`)
- Middleware can't find the session cookies and redirects users to sign-in

Full diagnosis available in #1066.

### Solution Approaches Considered

#### Option 1: Unify Supabase URLs in CI Environment ⭐ RECOMMENDED

**Description**: Configure the CI workflow to ensure `E2E_SUPABASE_URL` equals `NEXT_PUBLIC_SUPABASE_URL`. This guarantees both the E2E setup and deployed application derive cookie names from the same Supabase URL.

**Pros**:
- Simplest long-term fix with zero code changes
- Single source of truth - both E2E and deployment use identical URLs
- Resolves the root cause directly at the configuration level
- No risk of future regressions from code changes in cookie handling
- Fixes similar issues that may arise with other environment variables

**Cons**:
- Requires careful review of CI workflow environment variables
- May expose existing misconfigurations in the workflow
- Needs validation to ensure the unified URL is correct

**Risk Assessment**: low - Configuration-only change with clear verification steps

**Complexity**: simple - Update workflow file

#### Option 2: Explicit Cookie Name Override in Global Setup

**Description**: Add an explicit `E2E_COOKIE_NAME_OVERRIDE` environment variable that global-setup.ts can use instead of deriving the cookie name from the Supabase URL. This bypasses URL-based derivation entirely.

**Pros**:
- Flexible - allows different cookie names without changing environment
- Works even if Supabase URLs differ
- Explicit over implicit

**Cons**:
- Adds another environment variable to manage
- Increases complexity without addressing the root cause
- Leaves the underlying misconfiguration in place
- Could mask future configuration issues

**Why Not Chosen**: Option 1 is simpler and addresses the root cause directly. We should align the URLs rather than work around the mismatch.

#### Option 3: Add Fallback Cookie Name Detection in Middleware

**Description**: Modify the middleware to check for multiple possible cookie names based on both `NEXT_PUBLIC_SUPABASE_URL` and environment-specific overrides.

**Pros**:
- Most resilient - works regardless of URL configuration
- Defensive programming approach

**Cons**:
- Complex to implement correctly
- Difficult to debug cookie issues with multiple names
- Hides the underlying configuration problem
- Increases middleware complexity and potential security surface

**Why Not Chosen**: This is a defensive band-aid. We should fix the configuration rather than make the middleware more complex.

### Selected Solution: Unify Supabase URLs in CI Environment

**Justification**: This approach directly addresses the root cause without adding code complexity. By ensuring `E2E_SUPABASE_URL` equals `NEXT_PUBLIC_SUPABASE_URL` in the CI workflow, we guarantee consistent cookie naming across all environments. This is the cleanest, most maintainable solution and prevents similar issues in the future.

**Technical Approach**:

1. **Identify the correct Supabase URL** - Determine the production/canonical Supabase URL that should be used for all deployments
2. **Verify environment variables** - Inspect the `.github/workflows/dev-integration-tests.yml` to see what's currently configured
3. **Align the URLs** - Ensure `E2E_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` are identical
4. **Enable detailed logging** - Add `DEBUG_E2E_AUTH: true` to capture cookie behavior for verification
5. **Test the fix** - Run E2E tests to confirm sessions are recognized by middleware

**Architecture Changes** (if any):

None. This is a configuration-only fix with no code changes.

**Migration Strategy**:

Not applicable - configuration change only.

## Implementation Plan

### Affected Files

- `.github/workflows/dev-integration-tests.yml` - CI workflow environment configuration
- `apps/e2e/global-setup.ts` - May need minor logging enhancement (optional)
- `apps/web/proxy.ts` - Review middleware cookie handling (read-only to verify)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Inspect Current Workflow Configuration

Review the CI workflow to understand how environment variables are currently configured.

- Read `.github/workflows/dev-integration-tests.yml`
- Identify where `E2E_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` are set
- Determine if they should be equal or are intentionally different
- Check if other test workflows have similar configuration

**Why this step first**: We need to understand the current state before making changes.

#### Step 2: Verify the Correct Supabase URL

Determine which Supabase URL should be the canonical source.

- Check `apps/web/.env.example` and `apps/web/.env` for the configured Supabase URL
- Verify this matches the production deployment configuration
- Confirm this is the URL the deployed Vercel preview app uses
- Document the correct URL

**Why**: We need to know which URL is correct before unifying them.

#### Step 3: Update CI Workflow Environment Configuration

Ensure both `E2E_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` are set to the same value.

- Modify `.github/workflows/dev-integration-tests.yml`
- Add or update `E2E_SUPABASE_URL` to match `NEXT_PUBLIC_SUPABASE_URL`
- Add `DEBUG_E2E_AUTH: true` to enable detailed session logging
- Ensure the workflow passes these variables to both the E2E setup and the deployment

**Why**: This fixes the root cause at the configuration level.

#### Step 4: Verify Middleware Cookie Handling (Read-Only)

Inspect the middleware to confirm it will correctly recognize cookies when URLs match.

- Review `apps/web/proxy.ts` middleware setup
- Confirm cookie name derivation matches the E2E setup logic
- Verify there are no other mismatches in cookie handling

**Why**: Ensure we understand how the middleware derives cookie names before testing.

#### Step 5: Run E2E Tests and Validate

Execute the E2E test suite to confirm the fix works.

- Run team-accounts tests locally: `pnpm --filter e2e test tests/team-accounts/`
- Check that tests no longer timeout waiting for authenticated state
- Verify middleware recognizes the injected session cookies
- Confirm no regressions in other E2E tests
- Review `DEBUG_E2E_AUTH` logs for cookie matching details

**Why**: Validation is critical before considering the fix complete.

#### Step 6: Monitor Deployed Tests

Watch the next successful deployment to confirm the fix works in the actual CI environment.

- Trigger a new dev branch deployment
- Monitor the dev-integration-tests workflow run
- Confirm both team-accounts tests pass
- Review workflow logs for any warnings or issues

**Why**: The fix must work in CI with actual Vercel deployments.

## Testing Strategy

### Unit Tests

Cookie naming logic tests (verify URL → cookie name derivation):

- ✅ `E2E_SUPABASE_URL=http://127.0.0.1:54521` should produce `sb-127-auth-token`
- ✅ `E2E_SUPABASE_URL=https://abcd1234.supabase.co` should produce `sb-abcd1234-auth-token`
- ✅ Cookie name matches what middleware expects for the same URL

**Test files**: Verify in `apps/e2e/global-setup.ts` lines 356-365 match middleware logic

### Integration Tests

Session persistence with unified URLs:

- ✅ Global setup authenticates via Supabase API
- ✅ Session cookies are created with correct name
- ✅ Storage state is saved with correct cookies
- ✅ Middleware can read the saved cookies
- ✅ Session is recognized by deployed application

**Test files**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` lines 97-120 (the failing tests)
- Any other tests in `tests/team-accounts/` that depend on authentication

### E2E Tests

Team accounts workflow with authenticated state:

- ✅ Global setup creates authenticated state via API
- ✅ Test can navigate to `/home` without redirect to sign-in
- ✅ Team selector is visible (no 20s timeout)
- ✅ Can create a team without authentication failures
- ✅ Can list team accounts
- ✅ Regression test: Vercel preview deployments work
- ✅ Regression test: Localhost development still works
- ✅ Regression test: Custom domains work

### Manual Testing Checklist

Before marking the fix as complete:

- [ ] Review `.github/workflows/dev-integration-tests.yml` changes
- [ ] Verify `E2E_SUPABASE_URL === NEXT_PUBLIC_SUPABASE_URL`
- [ ] Confirm `DEBUG_E2E_AUTH: true` is enabled
- [ ] Run local E2E tests: `pnpm --filter e2e test tests/team-accounts/`
- [ ] All team-accounts tests pass without timeout
- [ ] No "session not recognized" errors in logs
- [ ] Commit and push to dev branch
- [ ] Monitor dev-integration-tests workflow run
- [ ] Confirm 21 tests pass (up from 19 in the broken run)
- [ ] No regressions in other workflow runs
- [ ] Review middleware logs if available

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Environment Variable Mismatch If URLs Are Intentionally Different**: If `E2E_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` were intentionally different for some reason, unifying them could break something else.
   - **Likelihood**: low - No documentation suggests they should differ
   - **Impact**: medium - Could affect other parts of the deployment pipeline
   - **Mitigation**: Review the workflow history and commit messages to understand why they might differ. Check for comments or documentation about separate Supabase instances.

2. **Incomplete URL Unification**: If the workflow has multiple places where these variables are set or used, missing one could leave a partial fix.
   - **Likelihood**: medium - Complex workflow files often have multiple references
   - **Impact**: medium - Some environments might still have the mismatch
   - **Mitigation**: Thoroughly search the entire workflow file for all references to both URLs. Check for matrix builds or conditional logic.

3. **Vercel Deployment Caching**: Vercel might cache the old environment variables, so the fix might not take effect immediately.
   - **Likelihood**: low - Vercel typically picks up new environment vars on redeploy
   - **Impact**: low - Wait for next deployment to see effect
   - **Mitigation**: Trigger a manual redeploy if needed. Monitor the workflow logs.

4. **Hidden Configuration in Vercel Dashboard**: The environment variables might be set in Vercel's dashboard rather than in the workflow file, requiring updates in two places.
   - **Likelihood**: medium - Common in multi-environment deployments
   - **Impact**: medium - Fix in workflow file won't help if Vercel overrides it
   - **Mitigation**: Check Vercel project settings. Verify which source of truth is authoritative (workflow vs dashboard).

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the workflow file changes: `git revert <commit-hash>`
2. Check Vercel project for override environment variables
3. Review commit f2d7bab0e (the #1063 fix) to understand cookie domain changes
4. If needed, disable the getCookieDomainConfig enhancement temporarily
5. Re-run the workflow with original configuration
6. Investigate why the URLs were different in the first place
7. Escalate to team lead if the mismatch was intentional

**Monitoring** (if needed):

- Monitor dev-integration-tests workflow for next 3 deployments
- Watch for cookie-related auth errors in Vercel deployment logs
- Check browser console in deployed app for auth warnings
- Track E2E test failure rates in the workflow dashboard

## Performance Impact

**Expected Impact**: none

The fix is purely a configuration alignment with no code changes. There should be no performance implications.

**Performance Testing**:

- Confirm E2E tests run at the same speed as before
- Verify middleware response times are unchanged
- Check Vercel deployment times are not affected

## Security Considerations

**Security Impact**: none

This is a bug fix with no security implications. We're aligning configuration, not changing authentication logic or security boundaries.

- No changes to password handling
- No changes to token validation
- No changes to RLS policies
- Cookies still use secure, HTTP-only flags

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current E2E_SUPABASE_URL (should be different from NEXT_PUBLIC_SUPABASE_URL)
grep -E "E2E_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL" .github/workflows/dev-integration-tests.yml

# Run team-accounts tests against broken state
pnpm --filter e2e test tests/team-accounts/team-accounts.spec.ts

# Expected Result: Tests timeout waiting for [data-testid="team-selector"]
# Error: page.waitForSelector: Timeout 20000ms exceeded
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run team-accounts E2E tests
pnpm --filter e2e test tests/team-accounts/

# Run full E2E suite
pnpm test:e2e

# Verify workflow configuration
grep -E "E2E_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL" .github/workflows/dev-integration-tests.yml

# Confirm DEBUG_E2E_AUTH is enabled
grep "DEBUG_E2E_AUTH" .github/workflows/dev-integration-tests.yml
```

**Expected Result**: All commands succeed, both team-accounts tests pass without timeouts, 21 tests pass (up from 19), no "session not recognized" errors.

### Regression Prevention

```bash
# Run full E2E test suite
pnpm test:e2e

# Run with different base URLs to verify multi-environment support
PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm --filter e2e test

# Smoke test against deployed preview
pnpm --filter e2e test tests/smoke/

# Additional regression checks
pnpm typecheck
pnpm lint
```

## Dependencies

### New Dependencies (if any)

None. This is a configuration-only fix.

**No new dependencies required**

## Database Changes

**Migration needed**: no

No database changes required. This is purely a configuration alignment fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:

1. Update `.github/workflows/dev-integration-tests.yml` with unified `E2E_SUPABASE_URL`
2. Add `DEBUG_E2E_AUTH: true` to workflow environment
3. Merge to dev branch
4. Trigger "Deploy to Dev" workflow manually
5. Monitor the automatically triggered "Dev Integration Tests" workflow
6. Confirm tests pass (21/21 instead of 19/21)

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes, purely a configuration fix

## Success Criteria

The fix is complete when:

- [ ] Workflow file updated with unified Supabase URLs
- [ ] `DEBUG_E2E_AUTH: true` enabled in CI
- [ ] Local E2E tests pass: `pnpm --filter e2e test tests/team-accounts/`
- [ ] Team-accounts tests no longer timeout
- [ ] Session recognized by middleware (no redirect to `/auth/sign-in`)
- [ ] Full E2E suite passes with no regressions
- [ ] Dev integration tests workflow shows 21/21 tests passing
- [ ] Code review approved
- [ ] Middleware logs confirm correct cookie names are matched

## Notes

### Key Insights from Diagnosis

- The #1063 fix improved cookie domain handling for Vercel preview URLs but left the cookie name derivation issue unresolved
- This is a recurring issue pattern (6+ similar issues closed historically)
- The root cause is the complex interaction between Supabase SSR cookie naming and deployment-specific URLs
- Cookie NAME is the issue, not cookie DOMAIN (the #1063 fix addressed domain correctly)

### Why This Regression Wasn't Caught Earlier

The #1063 fix was subtle - it changed cookie domain handling without addressing cookie name consistency. The tests passed in the developer's local environment because they likely use the same Supabase URL for both E2E and deployment. The failure only appeared in CI where different environments might have different URL configurations.

### Future Prevention

After this fix is deployed:

1. Document the requirement that `E2E_SUPABASE_URL === NEXT_PUBLIC_SUPABASE_URL` in CI
2. Add a validation check in the global-setup.ts to warn if URLs differ
3. Consider adding a pre-flight validation in the workflow to catch this mismatch early
4. Review other workflows for similar URL mismatches (e.g., staging, production)

### Related Documentation

- **Auth Overview**: See `.ai/ai_docs/context-docs/infrastructure/auth-overview.md`
- **E2E Testing Guide**: See `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md` (sections on Cookie Naming)
- **Auth Troubleshooting**: See `.ai/ai_docs/context-docs/infrastructure/auth-troubleshooting.md`

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1066*
*Last Updated: 2025-12-10*
