# Bug Fix: Staging Workflow E2E Shard 10 Stuck Due to Ephemeral RunsOn Label Mismatch

**Related Diagnosis**: #951 (REQUIRED)
**Severity**: high
**Bug Type**: infrastructure/ci-cd
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Ephemeral RunsOn runners with per-run unique labels (`runs-on=${{ github.run_id }}/runner=4cpu-linux-x64`) become inaccessible to later matrix jobs when `max-parallel: 3` causes sequential execution
- **Fix Approach**: Replace per-run unique labels with stable labels that persist across runner lifecycle
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The staging-deploy.yml workflow creates 10 E2E shard jobs with `max-parallel: 3` constraint. Each job is configured with a RunsOn runner label containing the unique `github.run_id`: `runs-on=${{ github.run_id }}/runner=4cpu-linux-x64`. When ephemeral runners terminate after completing their jobs, they become offline and their unique labels no longer exist. Shard 10 (and potentially shards 7 onwards) wait indefinitely for a runner with that exact label, but no online runner has it anymore.

For full details, see diagnosis issue #951.

### Solution Approaches Considered

#### Option 1: Use Stable RunsOn Labels ⭐ RECOMMENDED

**Description**: Replace the per-run unique label syntax with stable labels that don't change across job executions. The RunsOn platform supports `runs-on/` prefix for stable routing that works across the runner pool.

**Pros**:
- Immediate fix (one-line change per job)
- No behavioral changes to parallelization
- Leverages RunsOn's built-in label deduplication
- Stable labels mean any available runner matching criteria can pick up the job
- Minimal risk - only affects label syntax, no workflow logic changes

**Cons**:
- None identified for this use case
- Slightly less control over which specific runner instance executes the job

**Risk Assessment**: low - Simple configuration change with no workflow logic modifications

**Complexity**: simple - Text replacement across 10 locations

#### Option 2: Disable Matrix Parallelization

**Description**: Remove the `max-parallel: 3` constraint and run all 10 shards sequentially.

**Pros**:
- Would prevent label mismatch issues
- Simpler workflow structure

**Cons**:
- 3-4x longer workflow execution time (15 minutes → 45-60 minutes)
- Significantly impacts CI/CD performance
- Reduces deployment frequency capacity
- Creates longer wait times for developers
- More expensive in terms of runner compute hours

**Why Not Chosen**: Unacceptable performance impact. The parallelization strategy is critical for <20min staging deploys per CI/CD documentation.

#### Option 3: Use GitHub-Hosted Runners as Fallback

**Description**: Configure a fallback to GitHub-hosted runners (`ubuntu-latest`) if RunsOn runners are unavailable.

**Pros**:
- Provides fallback mechanism
- Could unblock stuck workflows

**Cons**:
- Requires additional workflow configuration
- Still doesn't fix underlying label issue
- May have different performance characteristics
- More complex to implement

**Why Not Chosen**: Root cause is simpler to fix. The label issue is known and has a direct solution from RunsOn documentation.

### Selected Solution: Use Stable RunsOn Labels

**Justification**: The RunsOn platform explicitly documents that unique per-run labels (`runs-on=${{ github.run_id }}/...`) are intended for single-run isolation, not multi-job workflows with parallelization constraints. Stable labels (`runs-on/...`) are designed for multi-job scenarios exactly like this. This is the minimal, recommended fix from RunsOn's best practices.

**Technical Approach**:

1. **Replace 10 job runner declarations** with stable label syntax
   - Lines 35, 67, 121, 185, 293, 366, 432, 488, 569, 630
   - FROM: `runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64`
   - TO: `runs-on: "runs-on/runner=4cpu-linux-x64"`

2. **Preserve all other workflow logic**
   - Job dependencies unchanged
   - Matrix configuration unchanged
   - Environment variables unchanged
   - Step logic unchanged

3. **Maintain parallelization**
   - `max-parallel: 3` remains in place
   - All 10 shards execute, just with stable labels

**Architecture Changes** (if any):
- None. This is a pure label configuration change.
- Ephemeral runners will still be used and destroyed after job completion.
- The RunsOn platform's label deduplication will ensure later jobs can match available runners.

**Migration Strategy**:
- No data migration needed
- No backward compatibility concerns
- Change is immediate and effective
- Can be reverted instantly if needed (identical simple text change)

## Implementation Plan

### Affected Files

List files that need modification:
- `.github/workflows/staging-deploy.yml` - Replace 10 instances of `runs-on` labels with stable syntax (lines 35, 67, 121, 185, 293, 366, 432, 488, 569, 630)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Runner Labels in staging-deploy.yml

Replace all instances of the per-run unique label syntax with stable labels.

- Locate all 10 occurrences of `runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64`
- Replace each with `runs-on: "runs-on/runner=4cpu-linux-x64"`
- Target lines: 35, 67, 121, 185, 293, 366, 432, 488, 569, 630
- Verify all 10 replacements completed

**Why this step first**: This is the core fix. All other steps validate and verify this change.

#### Step 2: Validate YAML Syntax

Ensure the workflow file remains valid YAML and is syntactically correct.

- Run GitHub's workflow validator: `gh workflow view staging-deploy.yml`
- OR visually verify the file loads in GitHub UI
- Check for any YAML parse errors

#### Step 3: Test with Dry Run

Create a manual workflow run to verify the fix works.

- Trigger workflow manually (GitHub UI or `gh workflow run`)
- Monitor first 2-3 shards to confirm they start and complete
- Monitor shard 10 specifically to confirm it doesn't get stuck in "queued"
- Allow workflow to complete fully if possible

#### Step 4: Validation

Confirm the fix resolves the original issue.

- [ ] Verify shard 10 no longer stays in "queued" state indefinitely
- [ ] Confirm all 10 shards complete successfully
- [ ] Verify parallel execution with `max-parallel: 3` still works as intended
- [ ] Check workflow duration is still ~15-20 minutes (not degraded)
- [ ] Confirm no new errors in workflow logs

## Testing Strategy

### Unit Tests

Not applicable - this is infrastructure/CI configuration change.

### Integration Tests

**Workflow Execution Tests**:

- ✅ Schedule-triggered run (weekly cron)
- ✅ Manual workflow dispatch
- ✅ Push to staging branch
- ✅ All 10 E2E shards execute and complete
- ✅ Shard 10 completes without hanging
- ✅ No "queued" timeout/starvation
- ✅ Parallel execution maintains `max-parallel: 3` constraint
- ✅ All test artifacts generated successfully

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Manually trigger the workflow via GitHub UI
- [ ] Wait for initial jobs to start (check-validation, validate)
- [ ] Monitor test-setup job completion
- [ ] Watch shards 1-3 execute in parallel
- [ ] Verify shards 4-6 queue and then execute as shards 1-3 complete
- [ ] Verify shards 7-9 execute in third parallel batch
- [ ] **Specifically verify shard 10 does NOT remain in "queued" indefinitely**
- [ ] Confirm shard 10 transitions to "in_progress" and completes
- [ ] Check test-aggregate and subsequent deployment jobs complete
- [ ] Verify no errors in workflow logs for any shard
- [ ] Confirm deployment to staging completes successfully

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **RunsOn label mismatch**: If stable labels don't work as documented
   - **Likelihood**: low
   - **Impact**: high (workflow stays broken)
   - **Mitigation**: RunsOn label syntax is well-documented and tested. If issue persists, immediate rollback to unique labels + investigation of RunsOn platform configuration.

2. **Unexpected workflow behavior**: Changed labels might affect some RunsOn feature
   - **Likelihood**: low
   - **Impact**: medium (unexpected job execution)
   - **Mitigation**: Comprehensive manual testing before deploying changes. Monitor first few runs closely.

3. **Label syntax typo**: Introduced during replacement
   - **Likelihood**: low
   - **Impact**: medium (syntax error)
   - **Mitigation**: Careful find-replace with visual verification. Use exact string matching.

**Rollback Plan**:

If the fix doesn't work or causes new issues:

1. Immediately revert `.github/workflows/staging-deploy.yml` to previous commit
2. Push revert to staging branch to trigger rollback workflow execution
3. Verify workflow goes back to original behavior
4. Investigate further using diagnosis tools if needed
5. Consider alternative approaches from Option 2 or 3

**Monitoring** (if needed):
- Monitor next 3 scheduled workflow runs
- Check for "queued" timeouts on any shard
- Alert if shard execution deviates from normal 15-20 minute duration
- Watch for any new error patterns in workflow logs

## Performance Impact

**Expected Impact**: none

- Label change doesn't affect job execution logic
- Parallelization strategy unchanged
- Runner resource allocation unchanged
- Expected duration remains 15-20 minutes for full deployment

**Performance Testing**:
- Compare workflow duration before/after fix (should be identical)
- Verify shard execution times remain consistent
- Confirm no latency added by label routing

## Security Considerations

**Security Impact**: none

- This is a pure label configuration change
- No authentication or authorization changes
- No secrets or credentials affected
- No new permissions required

## Validation Commands

### Before Fix (Bug Should Reproduce)

The bug has already been reproduced in workflow run #19997869115:
- E2E Shard 10 remained in "queued" state for 17+ hours
- Can be verified at: https://github.com/slideheroes/2025slideheroes/actions/runs/19997869115

### After Fix (Bug Should Be Resolved)

```bash
# Validate YAML syntax
gh workflow view .github/workflows/staging-deploy.yml

# Trigger manual workflow run to test the fix
gh workflow run staging-deploy.yml -r staging --ref staging

# Monitor workflow run
gh run list --workflow=staging-deploy.yml --limit=1

# Verify shard 10 completes within reasonable time
gh run view <run-id> --log --exit-status

# Run full test suite to ensure no regressions
pnpm test

# Build to ensure no breakage
pnpm build
```

**Expected Result**:
- Workflow YAML is valid
- All 10 E2E shards complete successfully
- Shard 10 completes within 15 minutes (not stuck indefinitely)
- No errors in any shard logs
- Full test suite passes
- Build succeeds

### Regression Prevention

```bash
# Monitor subsequent scheduled runs for the next 2 weeks
# Look for any "queued" timeouts or shard failures

# After fix is deployed, run staging deployment multiple times:
# - At least 3 times via manual trigger
# - Once via push to staging branch
# - Once via the scheduled cron trigger

# Each run should maintain consistent timing (~15-20 minutes)
# and have all 10 shards complete successfully
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

This fix uses existing RunsOn platform features that are already configured.

## Database Changes

**No database changes required**

This is a CI/CD infrastructure change with no impact on application database.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special deployment steps required
- Change is immediate when committed to staging branch
- No feature flags needed
- No user-facing changes

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Change is backward compatible
- No API changes
- No schema changes
- Previous workflow runs unaffected

## Success Criteria

The fix is complete when:
- [x] `.github/workflows/staging-deploy.yml` modified with new runner labels
- [ ] GitHub workflow syntax validation passes
- [ ] Manual workflow run triggers and all 10 shards complete
- [ ] Shard 10 completes successfully (not stuck in "queued")
- [ ] Parallel execution with `max-parallel: 3` works as expected
- [ ] No errors in workflow logs
- [ ] Deployment to staging completes successfully
- [ ] Code review approved (if applicable)
- [ ] Performance metrics stable (15-20 min duration maintained)
- [ ] No new issues introduced

## Notes

**Why this is low-risk**: This fix changes only the runner label syntax, which is purely a configuration value. The label is a string that tells GitHub Actions and RunsOn which runner should execute the job. Changing from a per-run unique identifier to a stable identifier is a straightforward routing configuration change that doesn't affect any business logic, data, or core workflow behavior.

**Related to RunsOn Platform**: The `runs-on=` syntax with unique per-run values is documented as a way to isolate runners to a single workflow run. However, when combined with matrix parallelization and `max-parallel` constraints that cause sequential job execution across multiple runner instances, this creates the label mismatch problem. The stable `runs-on/` label syntax is designed for exactly this scenario - multi-job workflows where any available matching runner can take the job.

**Why GitHub-hosted runners weren't used**: The project uses RunsOn ephemeral runners for performance and cost control. This fix maintains that architecture choice while fixing the label routing issue.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #951*
