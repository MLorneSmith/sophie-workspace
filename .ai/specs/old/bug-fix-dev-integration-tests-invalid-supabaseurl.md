# Bug Fix: dev-integration-tests.yml Pipeline Invalid supabaseUrl Error

**Related Diagnosis**: #635
**Severity**: critical
**Bug Type**: ci
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not configured in repository settings. The workflow references these secrets but they don't exist, causing fallback to empty `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` values.
- **Fix Approach**: Configure missing GitHub Actions secrets with production Supabase credentials
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests.yml` GitHub Actions workflow fails consistently with "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL" error. The recent commit c3b596fe3 changed the workflow to depend on GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` that don't exist in the repository. When these secrets are missing:

1. The workflow step skips exporting the expected environment variables
2. The fallback references to `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` result in empty strings
3. The Supabase client in global-setup.ts receives undefined/empty URL
4. Initialization fails with the "Invalid supabaseUrl" error
5. All E2E tests are blocked

For full details, see diagnosis issue #635.

### Solution Approaches Considered

#### Option 1: Configure GitHub Actions Secrets ⭐ RECOMMENDED

**Description**: Create missing GitHub Actions secrets in the repository settings with production Supabase credentials. Update the workflow to properly reference these secrets without fallback issues.

**Pros**:
- Aligns with the workflow's stated intention (commit c3b596fe3)
- Production-grade security model using GitHub's secret management
- Only one-time setup required (secrets persist)
- Enables environment-specific credentials for different deployment environments
- Follows CI/CD best practices for credential management
- Allows other workflows to reuse the same secrets
- No code changes needed to workflow or setup files

**Cons**:
- Requires GitHub repository administrator access to set secrets
- Secrets are not version-controlled (manual step outside code)

**Risk Assessment**: Low - Secrets are isolated in GitHub's secure storage and not exposed in logs

**Complexity**: Simple - One-time configuration in GitHub UI or CLI

#### Option 2: Simplify Workflow with Defensive Fallbacks

**Description**: Revert the workflow to use simpler environment variable handling with multiple fallback options. Update global-setup.ts to check for empty strings and provide clear error messages.

**Pros**:
- No external configuration needed
- Can be completed purely through code changes
- More defensive against missing environment variables
- Provides detailed logging for debugging

**Cons**:
- Doesn't solve the core issue of credential management
- Tests would still fail without proper Supabase URL configuration
- Masks the root cause rather than solving it
- Less secure than using GitHub Actions secrets management
- Requires maintaining fallback logic in code

**Why Not Chosen**: This approach treats the symptom, not the disease. The workflow was deliberately changed to use GitHub secrets for better security. We should implement the intended solution properly.

#### Option 3: Use Supabase Local Development Server

**Description**: Configure the workflow to start a local Supabase instance (localhost:54321) instead of relying on external credentials.

**Pros**:
- Self-contained, no external service dependencies
- Deterministic test environment
- Can be version-controlled

**Cons**:
- Requires Supabase CLI available in GitHub Actions runner
- Adds startup latency to workflow
- Integration tests against local instance vs production differs
- Complicates the test matrix (local vs deployed)
- Doesn't align with the dev deployment testing intent

**Why Not Chosen**: The workflow's intent is to test against the deployed dev environment, not a local one. This contradicts the purpose of integration testing after deployment.

### Selected Solution: Configure GitHub Actions Secrets

**Justification**: This is the intended solution from commit c3b596fe3. The workflow was deliberately redesigned to use GitHub Actions secrets for better security and environment-specific credentials. We should complete that implementation properly rather than work around it. The fix is simple (one-time setup) and low-risk while providing production-grade credential management.

**Technical Approach**:

1. **Identify required credentials**: Determine which Supabase instance should be used for dev integration tests (likely the production environment's Supabase credentials)
2. **Create GitHub Actions secrets**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the repository's GitHub Actions secrets
3. **Verify workflow exports**: Confirm the workflow properly exports these secrets as environment variables for the E2E tests
4. **Test integration tests workflow**: Trigger the workflow and verify E2E tests execute successfully

**Architecture Changes**: None - the workflow structure is correct; it just needs the secrets configured.

**Migration Strategy**: One-time configuration; no data migration needed.

## Implementation Plan

### Affected Files

- `.github/workflows/dev-integration-tests.yml` - Verify environment variable export (no changes expected)
- `apps/e2e/global-setup.ts` - Verify it properly reads `E2E_SUPABASE_URL` (no changes expected)
- GitHub Repository Settings (Secrets) - **ACTION REQUIRED**: Configure new secrets

### Step-by-Step Tasks

#### Step 1: Obtain Supabase Credentials

Identify and gather the correct Supabase credentials to use for dev integration tests.

- Determine which Supabase project should be used (likely production/deployed environment)
- Obtain `SUPABASE_URL` value
- Obtain `SUPABASE_ANON_KEY` value from the Supabase project

**Why this step first**: We need credentials before we can configure the secrets.

#### Step 2: Configure GitHub Actions Secrets

Add the missing secrets to the repository's GitHub Actions secrets configuration.

- Navigate to repository Settings → Secrets and variables → Actions
- Create secret `NEXT_PUBLIC_SUPABASE_URL` with the Supabase URL value
- Create secret `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the anon key value
- Verify secrets are saved (values are masked in GitHub UI)

#### Step 3: Verify Workflow References

Confirm the workflow properly uses the newly configured secrets.

- Review `.github/workflows/dev-integration-tests.yml` to verify it references these secrets correctly
- Check that the "Configure E2E Supabase environment" step exports them as environment variables
- Verify environment variables are passed to the E2E test execution step

#### Step 4: Validate Integration Tests Pass

Trigger the integration tests workflow and verify it completes successfully.

- Push a change to `dev` branch or manually trigger the workflow
- Monitor the workflow run for successful completion
- Verify E2E tests execute (not skipped due to missing environment)
- Confirm zero "Invalid supabaseUrl" errors

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Secrets are configured in GitHub repository settings
- [ ] Secrets are not visible in workflow logs (properly masked)
- [ ] `dev-integration-tests.yml` workflow completes without environment variable errors
- [ ] E2E global setup completes successfully (Supabase client initializes)
- [ ] At least one E2E test runs and completes
- [ ] All 5 recent failed workflow runs now pass when re-triggered
- [ ] No new errors introduced in other workflows

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Incorrect Credentials**: Wrong Supabase credentials could cause test failures
   - **Likelihood**: Low (easy to verify credentials work)
   - **Impact**: Medium (tests would fail, easy to fix with correct credentials)
   - **Mitigation**: Test credentials locally first; monitor workflow run output

2. **Secrets Leak**: GitHub Actions secrets could be accidentally exposed
   - **Likelihood**: Very Low (GitHub masks secrets in logs)
   - **Impact**: High (Supabase project compromised)
   - **Mitigation**: Never print secrets in logs; use GitHub's secret masking; review workflow carefully

3. **Workflow Change Breaking Tests**: Incorrect workflow syntax
   - **Likelihood**: Low (workflow already references these secrets)
   - **Impact**: Low (tests simply won't run)
   - **Mitigation**: Verify workflow syntax is correct before running

**Rollback Plan**:

If secrets need to be changed:
1. Navigate to Settings → Secrets and variables → Actions
2. Update the secret value with new credentials
3. Re-trigger the workflow

No code changes required for rollback.

**Monitoring** (if needed):
- Monitor first 3 integration test runs for any Supabase connection issues
- Watch for rate limiting errors from Supabase

## Performance Impact

**Expected Impact**: None - Secret configuration has no performance impact on tests

## Security Considerations

**Security Impact**: Positive - Using GitHub Actions secrets is more secure than hardcoding credentials

- Credentials are stored securely in GitHub's encrypted vault
- Secrets are never printed in workflow logs or artifacts
- Access can be controlled via repository permissions
- Credentials can be rotated at any time without code changes

**Security Review**: Not needed - GitHub Actions secrets is industry-standard practice

## Validation Commands

### After Fix (Integration Tests Should Run)

```bash
# Trigger the dev-integration-tests.yml workflow
# via: GitHub UI → Actions → dev-integration-tests → Run workflow

# OR via GitHub CLI (once available)
# gh workflow run dev-integration-tests.yml --ref dev

# Monitor the workflow run
gh run list --workflow dev-integration-tests.yml --limit 1 --repo slideheroes/2025slideheroes

# Check specific run output
gh run view <RUN_ID> --repo slideheroes/2025slideheroes
```

**Expected Result**: Workflow completes successfully with E2E tests executing and no "Invalid supabaseUrl" errors.

### Regression Prevention

```bash
# Verify the workflow definition hasn't been altered
cat .github/workflows/dev-integration-tests.yml | grep -A5 "Configure E2E"

# Check that global-setup.ts properly reads environment variables
grep "E2E_SUPABASE_URL\|E2E_SUPABASE_ANON_KEY" apps/e2e/global-setup.ts
```

## Dependencies

**No new dependencies required**

The workflow and E2E setup already have all required dependencies. This fix only adds GitHub Actions secrets configuration.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Very Low

**Special Deployment Steps**: None

The fix is a one-time configuration in GitHub repository settings. No deployment or code release needed.

**Feature Flags Needed**: No

**Backwards Compatibility**: Maintained - No breaking changes

## Success Criteria

The fix is complete when:

- [ ] GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured
- [ ] `dev-integration-tests.yml` workflow completes without errors
- [ ] E2E tests execute (at least one test runs)
- [ ] No "Invalid supabaseUrl" errors appear in logs
- [ ] Manual testing checklist is complete
- [ ] Previously failing workflow runs now pass

## Notes

**Key Files**:
- `.github/workflows/dev-integration-tests.yml` - Integration test workflow
- `apps/e2e/global-setup.ts` - E2E setup that validates Supabase URL (line 45, 88)
- GitHub repository Settings → Secrets and variables → Actions

**Related Context**:
- Commit c3b596fe3 introduced the change to use GitHub Actions secrets
- This fix completes the intended implementation from that commit
- The 5 recent workflow failures (2025-11-18, 2025-11-17) will be resolved by this fix

**Environment Variables Referenced**:
- `NEXT_PUBLIC_SUPABASE_URL` - GitHub Actions secret to create
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - GitHub Actions secret to create
- `E2E_SUPABASE_URL` - Workflow environment variable (should equal NEXT_PUBLIC_SUPABASE_URL)
- `E2E_SUPABASE_ANON_KEY` - Workflow environment variable (should equal NEXT_PUBLIC_SUPABASE_ANON_KEY)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #635*
