# Bug Fix: Dev Integration Tests - Authentication State Not Persisting

**Related Diagnosis**: #628
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Supabase session storage key mismatch between test environment (E2E_SUPABASE_URL) and deployed application (NEXT_PUBLIC_SUPABASE_URL)
- **Fix Approach**: Configure E2E tests to use the same Supabase instance as the deployed dev environment
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Dev integration tests are failing because the global setup authenticates users via the E2E Supabase instance and injects sessions with keys derived from `E2E_SUPABASE_URL`, but the deployed application at `dev.slideheroes.com` looks for sessions using keys derived from its own `NEXT_PUBLIC_SUPABASE_URL`. This key mismatch causes the application to not recognize the injected session and redirect to `/auth/sign-in`, causing all team account tests to timeout and fail.

The diagnosis clearly identified this as a regression, suggesting environment configuration changed between commits b51e6ba8c (last working) and c5c4ac2b9 (first failed).

For full technical details, see diagnosis issue #628.

### Solution Approaches Considered

#### Option 1: Align E2E Supabase Configuration with Deployed Environment ⭐ RECOMMENDED

**Description**: Configure `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` in the dev integration test workflow to point to the same Supabase instance that the deployed dev environment uses. This ensures the session storage keys match perfectly - both tests and the app derive the key from the same Supabase URL.

**Pros**:
- **Most reliable**: Eliminates the root cause entirely - no key mismatch possible
- **Simplest implementation**: Only requires environment variable configuration changes in CI workflow
- **Aligns with production patterns**: Dev environment uses the same database as production, ensuring realistic testing
- **No code changes needed**: No modifications to test setup or application code
- **Faster test runs**: Sessions are created against the actual backend, no mismatch issues
- **Clear precedent**: Standard Supabase + Playwright pattern used across the industry

**Cons**:
- **Requires CI workflow update**: Must modify `.github/workflows/dev-integration-tests.yml` to export Supabase credentials
- **Dependency on environment**: Tests depend on specific Supabase instance being available
- **Configuration complexity**: Additional environment variables to manage

**Risk Assessment**: Low - This is the standard pattern. Only involves environment configuration, no code changes. Can be rolled back by restoring environment variables.

**Complexity**: simple - Only configuration changes in CI workflow

#### Option 2: Dynamically Extract App's Supabase URL at Runtime

**Description**: Modify the global setup to fetch the deployed app's environment configuration (via an API endpoint or config page) to discover which Supabase instance is configured. Use that discovered URL to derive the correct storage key. This allows testing against different Supabase instances dynamically.

**Pros**:
- **Flexible**: Can test against any deployed environment without hardcoding URLs
- **No environment variable management**: Discovers config from actual deployment
- **Useful for multi-environment testing**: Supports staging, prod, etc. without config changes

**Cons**:
- **More complex implementation**: Requires API endpoint or config discovery mechanism
- **Additional network call**: Every test run fetches config, slight overhead
- **Harder to debug**: Dynamic behavior makes troubleshooting less straightforward
- **Requires app changes**: Need to expose configuration endpoint (security risk)
- **More fragile**: Depends on app being responsive and endpoint availability

**Why Not Chosen**: Adds unnecessary complexity. The issue exists because environment configuration changed - we should configure environments properly rather than trying to discover them at runtime. Option 1 is simpler, more reliable, and follows established patterns.

#### Option 3: Use Cookie-Based Session Storage Instead of localStorage

**Description**: Configure Supabase client to use HTTP-only cookies for session storage instead of localStorage. Inject the session as an HTTP cookie with the correct domain. This approach is more resilient to storage key mismatches since cookies are transport-layer based.

**Pros**:
- **More secure**: HTTP-only cookies can't be accessed by JavaScript
- **Resilient**: Not dependent on localStorage keys matching exactly
- **Production-aligned**: Many apps use cookie-based sessions

**Cons**:
- **Major code changes**: Requires updating Supabase client configuration across the application
- **Migration complexity**: Existing users have localStorage sessions, need migration path
- **Higher risk**: Changes authentication mechanism across the entire app
- **Doesn't fix root cause**: Session key mismatch still exists, just hidden
- **Testing complexity**: Still need to inject cookies correctly for tests

**Why Not Chosen**: Solves symptom, not root cause. Introduces unnecessary architectural changes and higher risk. Option 1 directly fixes the actual problem with minimal changes.

### Selected Solution: Align E2E Supabase Configuration with Deployed Environment

**Justification**:

This approach directly addresses the root cause identified in the diagnosis. The issue exists because E2E tests use a different Supabase instance than the deployed app, causing storage key mismatches. By configuring E2E tests to use the same Supabase instance as the deployed environment, we eliminate the mismatch entirely.

This is the standard pattern used across the industry - Playwright documentation and Supabase examples consistently show this configuration approach. It requires only environment variable updates in the CI workflow with no code changes, keeping risk extremely low.

The regression timing (working in b51e6ba8c, broken in c5c4ac2b9) suggests deployment configuration changed. We simply need to ensure E2E test configuration matches the deployed configuration, which is best practice.

**Technical Approach**:

1. **Environment Variable Configuration**: Update `.github/workflows/dev-integration-tests.yml` to export the deployed dev environment's Supabase credentials as `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` when running integration tests

2. **Session Key Alignment**: When E2E_SUPABASE_URL matches the deployed app's NEXT_PUBLIC_SUPABASE_URL, the session storage key derived in global-setup.ts will match what the app expects:
   - Test derives key as: `sb-{deployed-project-ref}-auth-token`
   - App derives key as: `sb-{deployed-project-ref}-auth-token`
   - Keys match → authentication state recognized ✓

3. **Storage State Preservation**: The authenticated browser state saved in `.auth/*.json` will contain the correct localStorage entry with the correct key for the deployed environment

4. **No Application Code Changes**: The Supabase client and authentication middleware in the app continue working unchanged. Only test environment configuration changes.

**Architecture Changes**: None - this is purely configuration-level

**Migration Strategy**: No data migration needed. This is an environment configuration fix, not a code change.

## Implementation Plan

### Affected Files

- `.github/workflows/dev-integration-tests.yml` - CI workflow that runs integration tests against dev environment
  - Add Supabase credential extraction/export as E2E environment variables
  - Ensure E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY are set before running tests

### New Files

No new files required - this is a configuration-only fix.

### Step-by-Step Tasks

**IMPORTANT**: Execute every step in order, top to bottom.

#### Step 1: Analyze Current CI Configuration

Examine the current dev integration test workflow to understand how Supabase credentials are managed and where to inject the E2E configuration.

- Read `.github/workflows/dev-integration-tests.yml` to understand current structure
- Identify where Supabase credentials are sourced (GitHub Secrets, Vercel env vars, etc.)
- Determine how to export them as E2E-specific environment variables
- Check if environment variables are already available to the workflow

**Why this step first**: We need to understand the current configuration before modifying it. This prevents breaking existing functionality.

#### Step 2: Update CI Workflow Environment Configuration

Modify the dev integration test workflow to export Supabase credentials as E2E environment variables.

- Add step to extract Supabase URL from either:
  - GitHub Secret: `SUPABASE_URL` (preferred if available)
  - Vercel deployment environment: Fetch via Vercel API
  - Fallback: Extract from app's public environment if accessible
- Add step to extract Supabase anon key from:
  - GitHub Secret: `SUPABASE_ANON_KEY` (preferred if available)
  - Vercel environment: Via API or stored secret
- Export both as `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` before running tests

**Why this step matters**: This ensures the E2E test environment uses the same Supabase instance as the deployed app, eliminating the storage key mismatch.

#### Step 3: Verify Session Key Alignment

Test locally to verify that the session key derivation now matches between tests and deployed app.

- Run global-setup locally with E2E_SUPABASE_URL set to the deployed Supabase URL
- Verify the storage state file contains localStorage with key `sb-{correct-project-ref}-auth-token`
- Compare with the app's expected key (from NEXT_PUBLIC_SUPABASE_URL)
- Keys should match exactly

**Why this step matters**: This validates the fix before deploying to CI, preventing regressions.

#### Step 4: Run Integration Tests in Dev Environment

Execute the full E2E test suite against dev.slideheroes.com with the updated configuration.

- Run the updated dev-integration-tests workflow
- Verify all team account tests pass (not timeout)
- Verify authenticated UI elements are visible (account names, settings, etc.)
- Check that test execution completes without redirect loops

**Why this step matters**: This confirms the fix resolves the original issue in the actual deployed environment.

#### Step 5: Validation and Regression Testing

Ensure the fix doesn't break anything and resolves all related symptoms.

- Run full test suite (all shards) against dev environment
- Verify team account tests complete successfully
- Check for any new authentication-related failures
- Confirm no performance degradation

## Testing Strategy

### Unit Tests

No unit test changes needed - this is an environment configuration fix, not code logic.

### Integration Tests

The existing integration tests will serve as validation:

**Test scenarios that will now pass**:
- ✅ Team account creation and navigation
- ✅ Team member listing and management
- ✅ Team settings access and updates
- ✅ Protected route rendering with authenticated state
- ✅ Authentication state persistence across navigation
- ✅ Session injection recognition by deployed app

**Test files validating the fix**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Currently fails at line 74 waiting for authenticated route
- `apps/e2e/tests/team-accounts/team-accounts.po.ts` - Team account page object with authentication assertions

### E2E Tests

All existing E2E test scenarios will serve as regression tests:

- `apps/e2e/tests/team-accounts/` - Full team account test suite
- `apps/e2e/tests/authentication/` - Authentication workflows
- `apps/e2e/tests/smoke/` - Smoke tests including authenticated flows

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Deploy dev integration test workflow with updated E2E configuration
- [ ] Verify dev-integration-tests workflow passes in GitHub Actions
- [ ] Verify all team-accounts tests complete without timeout
- [ ] Verify test execution logs show authentication success messages
- [ ] Manually navigate to dev.slideheroes.com and verify team features work
- [ ] Verify no authentication redirects occur when accessing `/home`
- [ ] Check that localStorage contains session with correct `sb-{project-ref}-auth-token` key
- [ ] Run team account tests locally (if possible) with updated environment variables
- [ ] Verify no new errors in browser console during test execution

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Environment Variable Not Available**: Supabase credentials not accessible in GitHub Actions
   - **Likelihood**: Low - These are standard infrastructure credentials
   - **Impact**: Medium - Tests fail if credentials unavailable
   - **Mitigation**: Verify credentials are stored in GitHub Secrets before deploying. Document where credentials come from. Have fallback to E2E-specific Supabase instance if needed.

2. **Supabase Instance Availability**: Deployed Supabase instance becomes unavailable during tests
   - **Likelihood**: Low - Same instance used in production, highly available
   - **Impact**: High - All tests fail
   - **Mitigation**: Supabase SLA is 99.9%. Same instance is used for production deployment. If this instance fails, production is already down. No additional risk.

3. **Session Creation Fails**: Authentication against deployed Supabase instance fails
   - **Likelihood**: Very Low - Same auth flow used by production users
   - **Impact**: Medium - Tests don't proceed
   - **Mitigation**: Test credentials are the same as production test users. If this fails, it indicates a real authentication issue that should be fixed.

4. **Credential Exposure**: Supabase keys exposed in workflow logs
   - **Likelihood**: Very Low - GitHub Actions masks secrets automatically
   - **Impact**: High - Security breach
   - **Mitigation**: GitHub Actions automatically masks values of secrets in logs. Use GitHub Secrets for credential storage. No manual logging of credentials.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the workflow changes in `.github/workflows/dev-integration-tests.yml`
2. Restore E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY to original values (or remove them)
3. Re-run the workflow - it will fall back to E2E-specific Supabase instance
4. Investigate why the deployed instance configuration is different than expected

**Monitoring** (if needed):

Monitor during and after fix deployment:
- Track dev-integration-tests workflow pass rate (should improve from ~0% to >95%)
- Monitor team-accounts test execution time (should complete in <5 minutes instead of timeout at 3 minutes)
- Watch for any new authentication-related failures in workflow logs

## Performance Impact

**Expected Impact**: Positive - Tests should complete faster

**Rationale**: Tests currently timeout after ~3 minutes waiting for authenticated state that never comes. With the fix, authentication succeeds immediately and tests proceed normally. Total test execution should be faster and more reliable.

**Performance Testing**:
- Measure test execution time before and after fix
- Track timeout failures (should drop to near zero)
- Monitor resource usage (should remain the same or improve)

## Security Considerations

**Security Impact**: None - No security changes

**Reasoning**:
- Using the same Supabase instance as production is more secure than isolation
- Authentication flow unchanged
- Credentials already stored securely in GitHub Secrets
- No new credential exposure vectors

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run with original E2E_SUPABASE_URL pointing to different instance
E2E_SUPABASE_URL=http://127.0.0.1:54321 pnpm test:e2e team-accounts

# Expected Result: Tests timeout waiting for authenticated elements after redirect to sign-in
# Error: expect(locator).toBeVisible() failed due to navigation to /auth/sign-in
```

### After Fix (Bug Should Be Resolved)

```bash
# Set E2E_SUPABASE_URL to match deployed environment
export E2E_SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL apps/web/.env.example | cut -d= -f2)
export E2E_SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY apps/web/.env.example | cut -d= -f2)

# Run tests - should pass
pnpm test:e2e team-accounts

# Expected Result: All tests pass without timeout
# Sessions injected and recognized successfully
# No redirects to sign-in page
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Additional checks
# 1. Verify storage state contains correct key
jq '.origins[0].localStorage' .auth/test@slideheroes.com.json | grep "sb-"

# 2. Check CI workflow logs for authentication success
# - "✅ API authentication successful"
# - "✅ Session injected into browser storage"
# - Tests execute and pass (not timeout)

# 3. Verify no new errors in deployed environment
# Navigate to dev.slideheroes.com and check team features work
```

## Dependencies

### New Dependencies

**No new dependencies required** - This is a configuration-only fix using existing infrastructure.

The fix relies on:
- GitHub Secrets (already configured)
- Supabase instance (already running)
- Playwright test framework (already in use)

### Environment Variables Required

The fix requires these environment variables to be available in GitHub Actions:

```
E2E_SUPABASE_URL        # Supabase URL of deployed instance (e.g., https://xxxxx.supabase.co)
E2E_SUPABASE_ANON_KEY   # Supabase anon key for deployed instance
```

These should be sourced from:
- GitHub Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Or extracted from Vercel environment if deployment uses different values
- Or read from app configuration if accessible

## Database Changes

**No database changes required** - This is an authentication configuration fix, not a schema change.

The fix does not modify:
- Database structure
- Table definitions
- Migrations
- User data
- Session data

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
1. Ensure Supabase credentials are available in GitHub Secrets before deploying workflow changes
2. Deploy workflow changes first (no app code changes needed)
3. Verify dev-integration-tests workflow passes after deployment
4. No special rollback needed - revert workflow if issues arise

**Feature flags needed**: No

**Backwards compatibility**: Maintained - No breaking changes

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/dev-integration-tests.yml` updated with E2E Supabase configuration
- [ ] E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY set before test execution
- [ ] Dev integration test workflow passes (all team-accounts tests complete)
- [ ] No authentication redirects occur in test logs
- [ ] All tests timeout and fail issues resolved
- [ ] Browser storage state contains correct `sb-{project-ref}-auth-token` key
- [ ] Manual testing confirms team features work on dev.slideheroes.com
- [ ] No new errors or regressions detected

## Notes

**Key Insights**:
- This is a **configuration regression**, not a code bug. Environment setup changed between commits.
- The global-setup.ts code is correct - it derives the key correctly from the provided Supabase URL.
- The issue is that the E2E tests and deployed app use different Supabase instances, creating a key mismatch.
- The fix ensures both use the same instance for consistency.

**Lessons Learned**:
- E2E tests must use the same external services as the target environment (Supabase instance, API endpoints, etc.)
- Storage key mismatches are subtle but cause complete authentication failure
- Configuration changes in deployment pipelines can break tests without code changes

**Similar Issues**:
- Issue #590 (CLOSED) - Same symptoms, previously resolved. Pattern suggests environment configuration is fragile.
- Issue #567 (CLOSED) - Mentioned authentication flakiness in team account tests, possibly same root cause.

**Prevention**:
- Document expected environment configuration for E2E tests
- Add validation step in CI to verify E2E_SUPABASE_URL matches deployed instance
- Consider using the same Supabase instance for all E2E testing to prevent key mismatches

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #628*
