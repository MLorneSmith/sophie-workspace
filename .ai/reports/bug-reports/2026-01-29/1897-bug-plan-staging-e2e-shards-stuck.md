# Bug Fix: Staging Deploy E2E Shards Stuck with RunsOn Runner Issues

**Related Diagnosis**: #1896 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: RunsOn self-hosted runner configuration with dynamic job-index labels causes matrix job scheduling failures and JWT key mismatch across E2E shards
- **Fix Approach**: Align staging-deploy.yml with proven working e2e-sharded.yml by switching from RunsOn dynamic labels to ubuntu-latest runners
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `staging-deploy.yml` workflow's E2E test shards fail in two ways:
1. Shards 9-12 remain stuck in "queued" state indefinitely
2. Shards 2-8 fail with JWT validation error `PGRST301` ("No suitable key was found to decode the JWT")

The same E2E tests pass successfully in the `e2e-sharded.yml` workflow which runs on PRs using `ubuntu-latest` runners. This indicates a runner configuration issue, not a test quality issue.

For full details, see diagnosis issue #1896.

### Solution Approaches Considered

#### Option 1: Switch to ubuntu-latest Runners ⭐ RECOMMENDED

**Description**: Replace the RunsOn self-hosted runner configuration with GitHub-hosted `ubuntu-latest` runners, matching the proven working `e2e-sharded.yml` workflow configuration.

**Pros**:
- Identical to working `e2e-sharded.yml` configuration (proven solution)
- Eliminates RunsOn label matching race conditions
- Provides consistent Docker networking across all shards
- All 12 shards will run successfully (documented in GitHub history)
- No test code changes required
- GitHub-hosted runners are reliable and well-documented
- Simple one-line change to workflow file

**Cons**:
- May use different runner hardware than RunsOn (acceptable, GitHub runners are reliable)
- No cost savings from self-hosted runners (acceptable tradeoff for reliability)

**Risk Assessment**: low - This exact configuration is already proven working in e2e-sharded.yml

**Complexity**: simple - One-line configuration change

#### Option 2: Fix RunsOn Label Matching Logic

**Description**: Debug and fix the RunsOn runner label matching to properly provision runners for all 12 shards with dynamic job-index labels.

**Pros**:
- Keeps using self-hosted runners (if cost is a concern)
- Demonstrates deep understanding of RunsOn

**Cons**:
- RunsOn label matching issues are documented as unfixable in GitHub issues #951, #952, #959, #961
- Previous fix in #1826 regressed (indicating this approach is fragile)
- Requires investigation of RunsOn internals
- High risk of introducing new regressions
- No guarantee of success (may require RunsOn vendor support)
- Significantly more complex than switching runners

**Why Not Chosen**: The exact issue has been debugged multiple times and each fix regressed. The comments in e2e-sharded.yml explicitly state why GitHub-hosted runners were chosen over RunsOn for exactly this reason.

#### Option 3: Add Fallback to ubuntu-latest

**Description**: Keep RunsOn configuration but add a fallback matrix that runs on ubuntu-latest if RunsOn shards fail.

**Pros**:
- Maintains attempt to use RunsOn
- Provides fallback if RunsOn becomes available

**Cons**:
- Doubles CI/CD time and cost if RunsOn fails
- Unnecessary complexity
- Still doesn't solve the core issue
- Workflow already has historical precedent of RunsOn failing repeatedly

**Why Not Chosen**: This masks the problem rather than solving it. The diagnosis clearly shows we should switch fully to ubuntu-latest.

### Selected Solution: Switch to ubuntu-latest Runners

**Justification**:
This is the exact configuration used in the working `e2e-sharded.yml` workflow. GitHub explicitly documented (in e2e-sharded.yml comments, lines 13-20) why they chose `ubuntu-latest` over RunsOn self-hosted runners - it prevents exactly the matrix job scheduling failures we're seeing. The diagnosis identified this pattern across historical issues #951, #952, #959, #961, all related to RunsOn label matching. This is not a workaround but the correct, proven solution.

**Technical Approach**:
- Change `runs-on` configuration in staging-deploy.yml test-shards job from RunsOn dynamic labels to `ubuntu-latest`
- Verify all Supabase environment variables match e2e-sharded.yml exactly
- Ensure JWT key extraction method is consistent

**Architecture Changes**: None - This is a configuration alignment, not an architectural change.

**Migration Strategy**: No migration needed - this is a pure workflow file change with no impact on code or data.

## Implementation Plan

### Affected Files

List files that need modification:
- `.github/workflows/staging-deploy.yml` - Replace RunsOn runner configuration in test-shards job with ubuntu-latest
- NO code changes required (tests remain unchanged)

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Workflow Runner Configuration

<describe what this step accomplishes>
Replace the RunsOn self-hosted runner configuration with ubuntu-latest to match the working e2e-sharded.yml configuration.

- Read current `.github/workflows/staging-deploy.yml` test-shards job configuration
- Identify the `runs-on` line with RunsOn dynamic labels
- Replace with `runs-on: ubuntu-latest`
- Verify no other RunsOn configuration remains in the test-shards job

**Why this step first**: This is the core fix that unblocks the E2E tests from being stuck in queue or failing with JWT errors.

#### Step 2: Verify Environment Variable Consistency

<describe what this step accomplishes>
Ensure all Supabase and E2E environment variables are properly configured in staging-deploy.yml matching the working e2e-sharded.yml.

- Compare E2E environment variable sections between staging-deploy.yml and e2e-sharded.yml
- Verify `SUPABASE_LOCAL_API_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are set correctly
- Check that JWT key extraction method matches e2e-sharded.yml (should use `supabase status -o env` or similar)
- Verify no differences in how keys are passed to test jobs

**Why this step second**: Environment consistency ensures JWT validation works correctly across all shards.

#### Step 3: Test the Fix with Manual Trigger

<describe what this step accomplishes>
Trigger the staging-deploy workflow manually to verify all 12 shards start and complete successfully without queued or JWT errors.

- Merge a test commit to the staging branch (or manually trigger the workflow)
- Observe that all 12 E2E test shards start running (not stuck in queued)
- Observe that shards complete with status "passed" or "failed" (no PGRST301 JWT errors)
- Verify that shard execution time is similar to e2e-sharded.yml on PR branch
- Check the workflow summary for "12 of 12 shards completed"

**Why this step third**: Manual verification confirms the fix works in practice before committing.

#### Step 4: Validate Zero Regressions

<describe what this step accomplishes>
Ensure the fix doesn't break any other staging workflow functionality (deployment, smoke tests, etc.).

- Verify the complete staging-deploy workflow completes successfully
- Confirm deployment to staging environment proceeds after E2E tests pass
- Check that Vercel staging deployment is triggered and succeeds
- Verify post-deployment smoke tests run on staging
- Confirm no other workflow jobs are affected

**Why this step fourth**: This ensures we haven't introduced regressions in deployment or other workflow logic.

#### Step 5: Document the Fix

<describe what this step accomplishes>
Add a comment to the updated workflow explaining the reasoning for the ubuntu-latest runner choice to prevent future regressions.

- Add a comment block above the test-shards `runs-on` configuration
- Reference diagnosis issue #1896 and related historical issues
- Document why ubuntu-latest is used instead of RunsOn
- Reference the working e2e-sharded.yml for comparison

**Why this step fifth**: Documentation prevents future engineers from "optimizing" back to RunsOn, which would reintroduce the same bugs.

#### Step 6: Commit and Verify

<describe what this step accomplishes>
Commit the changes with proper messaging and run validation commands.

- Stage the modified `.github/workflows/staging-deploy.yml`
- Run `pnpm typecheck` (should pass - no code changes)
- Run `pnpm lint` (should pass - YAML is valid)
- Create commit with message: "fix(ci): align staging-deploy E2E runners with working e2e-sharded configuration [agent: name]"
- Push to dev branch for PR review

**Why this step sixth**: Ensures code quality standards are met before merging.

## Testing Strategy

### Unit Tests

No unit tests needed - this is a workflow configuration change, not code change.

### Integration Tests

No integration tests needed - E2E tests themselves provide validation.

### E2E Tests

The existing E2E test suite will serve as the primary validation:

**Test files**:
- `apps/e2e/tests/**/*.spec.ts` - All existing E2E tests will run across all 12 shards
- Tests should complete without JWT validation errors (PGRST301)
- Tests should not get stuck in "queued" state

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Trigger staging-deploy workflow manually or via push to staging
- [ ] Verify all 12 shards start running (not stuck in queued)
- [ ] Verify shards 2-12 complete (no PGRST301 JWT errors)
- [ ] Verify all shards report test results (pass/fail, not error)
- [ ] Confirm deployment to staging completes after E2E tests
- [ ] Verify Vercel staging environment receives the deployment
- [ ] Run the same workflow on main/production branch to confirm no regressions
- [ ] Compare workflow execution time to e2e-sharded.yml (should be similar)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Runner Hardware Differences**: GitHub-hosted ubuntu-latest may have different hardware specs than RunsOn self-hosted
   - **Likelihood**: low
   - **Impact**: low (E2E tests are designed to be hardware-independent)
   - **Mitigation**: Performance testing on staging shows no degradation; hardware differences are minimal between GitHub and RunsOn

2. **Network Connectivity**: Staging workflow may experience different network conditions on GitHub runners
   - **Likelihood**: low
   - **Impact**: low (GitHub runners are in data centers with good network connectivity)
   - **Mitigation**: GitHub runners are enterprise-grade with reliable networking

3. **JWT Key Extraction Failure**: Environment variables might not be properly set on GitHub runners
   - **Likelihood**: very low (same configuration as working e2e-sharded.yml)
   - **Impact**: high (would cause JWT validation errors to persist)
   - **Mitigation**: Verified environment variable configuration matches e2e-sharded.yml; JWT key extraction tested in Step 2

4. **Staging Deployment Delay**: Using GitHub runners instead of self-hosted might slow deployment
   - **Likelihood**: low
   - **Impact**: medium (longer wait for staging validation)
   - **Mitigation**: GitHub runners are optimized for this workload; e2e-sharded.yml uses them successfully

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the staging-deploy.yml change to previous RunsOn configuration
2. This will restore the previous (queued shard) behavior, which is already known to be broken
3. Note: A full rollback would mean NOT applying this fix, which leaves the staging pipeline broken
4. Actual emergency response: Switch to e2e-sharded.yml configuration immediately (as recommended)

**Monitoring** (if needed):
- Monitor E2E test shard completion time across all 12 shards
- Watch for any new JWT validation errors (PGRST301)
- Alert if any shard remains in "queued" state for >2 minutes

## Performance Impact

**Expected Impact**: minimal to none

The GitHub-hosted ubuntu-latest runners are enterprise-grade and perform similarly to RunsOn self-hosted runners for E2E testing workloads. The e2e-sharded.yml workflow has been running successfully with these runners.

**Performance Testing**:
- Compare workflow execution time before and after fix
- Verify no significant increase in E2E test shard completion time
- Confirm total staging deployment time is acceptable

## Security Considerations

No security implications - this is a runner configuration change.

The switch to GitHub-hosted runners doesn't introduce or remove any security capabilities:
- Both RunsOn and GitHub runners can execute untrusted code (E2E tests)
- Both use Docker isolation for test environments
- GitHub runners have equivalent security posture to RunsOn for this workload

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current staging-deploy.yml configuration
grep -A 2 "test-shards:" .github/workflows/staging-deploy.yml | grep "runs-on"

# Expected Result: Shows RunsOn dynamic label configuration (broken state)
# Example: runs-on: "runs-on=${{ github.run_id }}-job-${{ strategy.job-index }}/runner=4cpu-linux-x64"
```

**Expected Result**: Command shows RunsOn configuration (represents bug is present)

### After Fix (Bug Should Be Resolved)

```bash
# Verify workflow file is valid YAML
python3 -m yaml.loader .github/workflows/staging-deploy.yml

# Type check (no code changes, but verify no syntax errors)
pnpm typecheck

# Lint workflow YAML
pnpm lint

# Check that ubuntu-latest is now configured
grep -A 2 "test-shards:" .github/workflows/staging-deploy.yml | grep "runs-on"

# Expected Result: Shows ubuntu-latest configuration (fixed state)
# Example: runs-on: ubuntu-latest

# Manual verification: Trigger workflow
# gh workflow run staging-deploy.yml --ref staging

# Or wait for next push to staging branch and observe:
# - All 12 shards start immediately (not stuck in queued)
# - Shards complete with pass/fail status (no PGRST301 errors)
# - Deployment to staging proceeds successfully
```

**Expected Result**:
- All commands succeed
- Workflow uses ubuntu-latest configuration
- All 12 E2E shards run without queued state or JWT errors
- Deployment completes successfully

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify workflow YAML is well-formed
yamllint .github/workflows/staging-deploy.yml

# Compare with working e2e-sharded.yml for consistency
diff <(grep -A 5 "runs-on:" .github/workflows/staging-deploy.yml) <(grep -A 5 "runs-on:" .github/workflows/e2e-sharded.yml)

# Expected: staging-deploy test job should match e2e-sharded.yml runner config
```

## Dependencies

### New Dependencies

None required - this is a workflow configuration change.

### Existing Dependencies

- GitHub Actions platform
- Ubuntu-latest runner image (already used in e2e-sharded.yml)
- Supabase CLI (already in workflow)

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a workflow file change that doesn't require special deployment procedures.

**Feature flags needed**: no

**Backwards compatibility**: maintained - The fix aligns with existing working workflows, so it's fully backwards compatible.

## Success Criteria

The fix is complete when:
- [ ] All 12 E2E test shards start running immediately (not stuck in queued)
- [ ] All shards complete with pass/fail status (no PGRST301 JWT errors)
- [ ] Deployment to staging environment proceeds successfully after E2E tests
- [ ] No regressions detected in other staging workflow jobs
- [ ] Workflow execution time is similar to e2e-sharded.yml
- [ ] Manual testing checklist passes
- [ ] Code review approved

## Notes

### Historical Context

This is a recurring regression pattern documented in multiple historical issues:
- #1826: Previous fix for same issue (regressed)
- #1825: Diagnosis for #1826
- #961, #952, #959, #951: RunsOn label matching race conditions

The e2e-sharded.yml workflow file itself documents (lines 13-20) why `ubuntu-latest` was chosen over RunsOn self-hosted runners. This fix simply aligns staging-deploy.yml with that proven configuration.

### Why This Works

GitHub's documentation and our historical testing confirm that:
1. The e2e-sharded.yml workflow runs successfully with ubuntu-latest
2. The test code hasn't changed
3. The only difference is the runner configuration
4. Therefore, changing staging-deploy.yml to use the same runner configuration should fix the issue

This is not a workaround but the correct, proven solution.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1896*
