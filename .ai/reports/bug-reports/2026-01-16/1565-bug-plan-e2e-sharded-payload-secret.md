# Bug Fix: E2E Sharded Build Fails - Missing PAYLOAD_SECRET

**Related Diagnosis**: #1564
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The e2e-sharded.yml workflow's "Build application" step does not pass required environment variables (PAYLOAD_SECRET, DATABASE_URI, DATABASE_URL, PAYLOAD_PUBLIC_SERVER_URL) that Payload CMS needs at build time
- **Fix Approach**: Add test environment variables to the setup-server job's build step
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E Tests (Sharded) workflow fails on the "Build application" step because the Payload CMS build requires `PAYLOAD_SECRET` and related environment variables, which are not provided in the setup-server job.

For full details, see diagnosis issue #1564.

### Solution Approaches Considered

#### Option 1: Add Test Environment Variables to Build Step ⭐ RECOMMENDED

**Description**: Add the same test environment variables that are already defined in the e2e-shards job to the setup-server job's build step. Use test/dummy values since these builds are only for E2E testing.

**Pros**:
- Minimal change - only adds env vars to one step
- Uses existing test values already defined elsewhere in the workflow
- No security risk - using test/dummy values, not production secrets
- Consistent with how e2e-shards job is configured
- Zero impact on other workflows

**Cons**:
- Slight duplication of environment variable definitions (but necessary for build isolation)

**Risk Assessment**: low - Adding environment variables with test values has no side effects

**Complexity**: simple - Single change to one workflow file, no code changes

#### Option 2: Use Production Secrets from GitHub Secrets

**Description**: Use actual production secrets (PAYLOAD_SECRET, DATABASE_URI, etc.) from GitHub Secrets storage

**Pros**:
- Matches the approach in reusable-build.yml
- Uses "real" values

**Cons**:
- Unnecessary complexity - E2E tests don't need production secrets
- Security risk - exposes production secrets to test environment
- Requires secrets to be configured in GitHub
- Could cause issues if production DB is used accidentally

**Why Not Chosen**: E2E tests should use isolated test values, not production secrets. The test values are sufficient and safer.

#### Option 3: Create Shared Environment Configuration File

**Description**: Extract environment variables to a shared YAML file or composite action

**Pros**:
- DRY principle - single source of truth
- Easier to maintain long-term

**Cons**:
- Over-engineering for this simple fix
- Adds complexity to workflow structure
- Requires restructuring existing workflows
- Not how other workflows in the repo are organized

**Why Not Chosen**: Over-engineering. The duplication is minimal and isolated to this workflow.

### Selected Solution: Add Test Environment Variables to Build Step

**Justification**: This is the simplest, safest approach that aligns with existing patterns in the codebase. The e2e-shards job already defines these test values, so we're just adding them to the build step where they're needed. Using test values is appropriate for E2E testing and avoids unnecessary exposure of production secrets.

**Technical Approach**:
- Add `env:` block to the "Build application" step in setup-server job
- Include test values for: PAYLOAD_SECRET, DATABASE_URI, DATABASE_URL, PAYLOAD_PUBLIC_SERVER_URL
- Use the same values that are already defined in e2e-shards job for consistency
- No code changes needed - this is purely a workflow configuration fix

**Architecture Changes**: None - this is a configuration fix, not an architectural change

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` - Add environment variables to setup-server job's "Build application" step (lines 77-80)

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Environment Variables to Build Step

Add test environment variables to the "Build application" step in the setup-server job.

- Open `.github/workflows/e2e-sharded.yml`
- Locate the "Build application" step (line 77-80)
- Add `env:` block after the `run:` block
- Include the following test environment variables:
  - `PAYLOAD_SECRET: 'test_payload_secret_for_e2e_testing'`
  - `DATABASE_URI: 'postgresql://postgres:postgres@localhost:54522/postgres'`
  - `DATABASE_URL: 'postgresql://postgres:postgres@localhost:54522/postgres'`
  - `PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3020'`
  - `NODE_ENV: 'production'` (required for build mode)
- Match the values from e2e-shards job (lines 117-118, 130-131) for consistency

**Why this step first**: This is the only change needed to fix the bug.

#### Step 2: Validate the Fix

- Commit the change
- Trigger the e2e-sharded workflow manually or via push to dev
- Verify the setup-server job completes successfully
- Confirm payload build no longer fails with PAYLOAD_SECRET error

## Testing Strategy

### Unit Tests

No unit tests needed - this is a workflow configuration fix, not a code change.

### Integration Tests

No integration tests needed - the E2E workflow itself serves as the integration test.

### E2E Tests

The E2E Tests (Sharded) workflow will validate this fix:
- ✅ setup-server job should complete successfully
- ✅ Build application step should complete without PAYLOAD_SECRET error
- ✅ All E2E shards should run with built artifacts

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Apply fix to e2e-sharded.yml
- [ ] Commit and push to dev branch
- [ ] Manually trigger E2E Tests (Sharded) workflow via GitHub Actions UI
- [ ] Verify setup-server job "Build application" step completes successfully
- [ ] Check logs to confirm no "PAYLOAD_SECRET environment variable is required" error
- [ ] Verify payload:build completes successfully in Turbo output
- [ ] Confirm e2e-shards jobs can use the cached build artifacts
- [ ] Verify at least one E2E shard runs successfully end-to-end

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect environment variable values**: Test values might not match what Payload expects
   - **Likelihood**: low
   - **Impact**: low (build would still fail, easy to debug)
   - **Mitigation**: Use exact same values as e2e-shards job which are known to work

2. **Database connection attempt during build**: Payload might try to connect to database during build
   - **Likelihood**: low
   - **Impact**: low (build would fail, not affecting other systems)
   - **Mitigation**: DATABASE_URL points to local Supabase instance which is started before build

3. **Environment variable conflicts**: New env vars might conflict with existing settings
   - **Likelihood**: very low
   - **Impact**: low (would cause build to fail)
   - **Mitigation**: These variables are isolated to the build step only

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit that added the environment variables
2. Push the revert to dev branch
3. The workflow will return to previous (broken) state, but other workflows unaffected

**Monitoring**: 
- Watch first 3-5 E2E workflow runs after fix is deployed
- Check for any new errors in setup-server job logs
- Verify E2E test success rate doesn't decrease

## Performance Impact

**Expected Impact**: none to positive

The fix enables the build to complete successfully, which is required for E2E tests to run. Build time should remain the same or potentially improve since Payload build won't fail and retry.

**Performance Testing**:
- Monitor setup-server job duration before and after fix
- Expected duration: ~1-2 minutes for build (same as before)

## Security Considerations

**Security Impact**: none

Using test/dummy values for E2E testing is the correct security practice:
- No production secrets exposed
- Test values are hardcoded in workflow (already public in repo)
- Test database is local and ephemeral
- PAYLOAD_SECRET is a test value, not production secret

**Security checklist**:
- ✅ No production credentials used
- ✅ No credential exposure risk
- ✅ Test environment properly isolated
- ✅ No changes to production workflows

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger the workflow manually to see failure
gh workflow run "E2E Tests (Sharded)" --ref dev

# Wait for workflow to start, then check status
gh run list --workflow="E2E Tests (Sharded)" --limit 1

# View logs to see PAYLOAD_SECRET error
gh run view <run-id> --log-failed
```

**Expected Result**: setup-server job fails with "Error: PAYLOAD_SECRET environment variable is required"

### After Fix (Bug Should Be Resolved)

```bash
# Commit and push the fix
git add .github/workflows/e2e-sharded.yml
git commit -m "fix(ci): add payload build env vars to e2e-sharded workflow"
git push origin dev

# Wait for workflow to trigger, then check status
gh run list --workflow="E2E Tests (Sharded)" --limit 1 --json status,conclusion

# View logs to confirm success
gh run view <run-id> --log

# Verify setup-server job completed successfully
gh run view <run-id> --json jobs --jq '.jobs[] | select(.name == "Setup Test Server") | .conclusion'
```

**Expected Result**: setup-server job completes successfully, payload:build succeeds, E2E tests run with built artifacts.

### Regression Prevention

```bash
# Ensure other workflows still work
gh workflow run "PR Validation" --ref dev
gh workflow run "Dev Integration Tests" --ref dev

# Check that production workflows are unaffected
gh run list --workflow="Deploy to Production" --limit 3
```

## Dependencies

**No new dependencies required**

This is a workflow configuration change only.

## Database Changes

**No database changes required**

The fix uses the existing local Supabase instance that is already started by the workflow.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - workflow changes take effect on next run

**Feature flags needed**: no

**Backwards compatibility**: maintained - this fix enables a broken workflow, doesn't change behavior of working workflows

## Success Criteria

The fix is complete when:
- [ ] Environment variables added to setup-server job build step
- [ ] setup-server job "Build application" step completes successfully
- [ ] Payload build no longer fails with PAYLOAD_SECRET error
- [ ] E2E Tests (Sharded) workflow runs successfully end-to-end
- [ ] At least one complete workflow run validates the fix
- [ ] No regressions in other workflows

## Notes

**Key Insights**:
- The e2e-shards job already had the correct environment variables, but the setup-server job (which does the build) didn't
- Using test values is appropriate and secure for E2E testing
- This is a minimal, surgical fix with no architectural changes

**Testing Strategy**:
- The E2E workflow itself validates this fix
- Manual workflow trigger is the best way to verify
- First successful run will confirm the fix works

**Why Test Values Are Appropriate**:
- E2E tests use local Supabase instance, not production database
- Built artifacts are ephemeral and used only for testing
- Test values are sufficient for Payload to validate configuration and compile

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1564*
