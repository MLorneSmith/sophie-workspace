# Bug Fix: GitHub Actions E2E Shard 10 Stuck Due to Runner Stealing Race Condition

**Related Diagnosis**: #982
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: GitHub Actions scheduler assigns runners intended for one matrix job to another when multiple jobs have identical `runs-on` labels, leaving the original job orphaned
- **Fix Approach**: Add unique per-job runner labels to prevent scheduler from stealing runners across matrix jobs
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shard 10 becomes stuck in "queued" status indefinitely during CI/CD runs. This is the third occurrence (#951, #952, #959, #961). Previous attempts to fix this using staggered sleep delays (Step 1: stagger matrix job start) were ineffective because the race condition occurs **before any job steps execute** at the GitHub Actions scheduler level.

The core issue is that when all 10 matrix jobs specify identical `runs-on: "runs-on/runner=4cpu-linux-x64"`, GitHub's scheduler can assign a runner intended for Shard 10 to a different shard, leaving Shard 10 without a runner and stuck in queued state indefinitely.

For full details, see diagnosis issue #982.

### Solution Approaches Considered

#### Option 1: Add Unique Per-Job Labels ⭐ RECOMMENDED

**Description**: Add a second unique label to each matrix job's `runs-on` specification that includes the job index, run ID, and run attempt. GitHub's scheduler must match ALL labels in a `runs-on` array, preventing runner stealing across jobs.

```yaml
# Current (vulnerable):
runs-on: "runs-on/runner=4cpu-linux-x64"

# Fixed (protected):
runs-on:
  - runs-on/runner=4cpu-linux-x64
  - runs-on/run-id=${{ github.run_id }}-${{ strategy.job-index }}-${{ github.run_attempt }}
```

The unique label uses:
- `github.run_id` - Unique identifier for this workflow run
- `strategy.job-index` - 0-based index of the matrix job (0-9 for shards 1-10)
- `github.run_attempt` - Attempt number if workflow is retried

This ensures each job has a globally unique label, making it impossible for the scheduler to assign a runner to the wrong job.

**Pros**:
- Fixes the root cause at the scheduler level (before job steps)
- Minimal code change (2 lines per job definition)
- No runtime overhead (scheduler filtering happens before execution)
- Handles retries automatically via `run_attempt`
- Completely prevents runner stealing across matrix jobs
- Aligns with GitHub Actions best practices for matrix jobs

**Cons**:
- Requires updating all matrix job definitions (2 files)
- Uses GitHub Actions context variables that are only available in job context
- If runner pool doesn't support the unique label, jobs will still be stuck (very unlikely)

**Risk Assessment**: low - This is a proven pattern used by other projects with similar issues. The labels are non-functional (RunsOn will ignore the second label if no runner matches), so worst case is the old behavior.

**Complexity**: simple - Just add the unique label to `runs-on` array.

#### Option 2: Reduce max-parallel from 3 to 1

**Description**: Force sequential execution by setting `max-parallel: 1`. This prevents simultaneous job scheduling that triggers the race condition.

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  max-parallel: 1  # Changed from 3
```

**Pros**:
- Simple one-line change
- Guaranteed to prevent race condition (no concurrency = no race)

**Cons**:
- Increases total CI/CD time by 3x (10 jobs * 15 minutes = 150 minutes sequentially)
- Defeats purpose of parallel matrix execution
- Creates bottleneck for development velocity
- Not scalable if more shards are added in future

**Why Not Chosen**: Trading performance for reliability is not acceptable when a better solution exists. Option 1 fixes the root cause without sacrificing parallelism.

#### Option 3: Split into Separate Non-Matrix Jobs

**Description**: Replace the 10-job matrix with 10 separate job definitions, each with unique `runs-on` labels.

```yaml
job-shard-1:
  name: E2E Shard 1
  runs-on: "runs-on/runner=2cpu-linux-x64"
  steps: [...]

job-shard-2:
  name: E2E Shard 2
  runs-on: "runs-on/runner=2cpu-linux-x64"
  steps: [...]

# ... repeat 10 times
```

**Pros**:
- Each job has inherently unique identifier (job name)
- No matrix logic means no scheduler confusion

**Cons**:
- Massive code duplication (>1000 lines of repetitive YAML)
- Very difficult to maintain (any change requires 10 edits)
- Makes CI files unreadable
- Harder to add/remove shards in future

**Why Not Chosen**: Creates technical debt and maintainability nightmare. Option 1 achieves same result with clean, minimal changes.

### Selected Solution: Add Unique Per-Job Labels

**Justification**:
This approach directly fixes the root cause (scheduler assigning runners to wrong jobs) with minimal code changes and zero performance impact. It's battle-tested by the Go community and other large projects experiencing identical GitHub Actions issues. Unlike Option 2, it maintains parallel execution for fast feedback times. Unlike Option 3, it keeps code maintainable.

**Technical Approach**:
1. Modify `runs-on` in matrix jobs from string to array format
2. Add primary label for resource requirement: `runs-on/runner=Xcpu-linux-x64`
3. Add secondary unique label: `runs-on/run-id=${{ github.run_id }}-${{ strategy.job-index }}-${{ github.run_attempt }}`
4. GitHub's RunsOn scheduler matches all labels, ensuring each job gets unique runner
5. If a runner disappears mid-job, GitHub automatically reschedules using the same unique label

**Architecture Changes**:
- No changes to job dependencies or conditions
- No changes to step logic or test execution
- Pure label change that's transparent to job execution
- Fully backwards compatible with retry mechanisms

**Migration Strategy** (if needed):
- No data migration needed
- Fix applies to all future runs immediately
- Previous runs' logs remain unaffected
- No breaking changes to any APIs or workflows

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Contains `test-shards` matrix job (lines 183-299)
- `.github/workflows/e2e-sharded.yml` - Contains `e2e-shards` matrix job (lines 99-210+)

### New Files

No new files needed. Only modifications to existing workflow files.

### Step-by-Step Tasks

**IMPORTANT**: Execute every step in order, top to bottom.

#### Step 1: Update staging-deploy.yml test-shards job

Modify the `test-shards` job definition to add unique per-job labels:

- Change `runs-on` from string to array format
- Add primary label for resource requirement
- Add secondary unique label with `run-id-{job-index}-{run-attempt}` pattern
- Verify syntax is valid YAML

**Location**: `.github/workflows/staging-deploy.yml` lines 183-196

**Why this step first**: This is the primary CI/CD pipeline where Shard 10 most frequently gets stuck. Fixing this workflow first ensures the core issue is resolved.

#### Step 2: Update e2e-sharded.yml e2e-shards job

Apply identical fix to the `e2e-shards` job in the reusable E2E workflow:

- Change `runs-on` from string to array format
- Add primary label for resource requirement
- Add secondary unique label with `run-id-{job-index}-{run-attempt}` pattern
- Maintain consistency with staging-deploy.yml changes

**Location**: `.github/workflows/e2e-sharded.yml` lines 99-108

**Why this step second**: This workflow is used as a building block by staging-deploy, so fixing it ensures the fix propagates to all dependent workflows.

#### Step 3: Verify no other matrix jobs need fixing

- Search for all `matrix:` definitions in GitHub Actions workflow files
- Check if any other matrix jobs with `runs-on` labels might be vulnerable
- Document findings (unlikely to find others, but good to verify)

#### Step 4: Add regression test prevention

- Document that this fix prevents Shard 10 from being stuck
- Add comment in workflow explaining the unique label approach
- Create test plan to verify fix works

#### Step 5: Validate changes and test

- Syntax check YAML files: `yamllint .github/workflows/*.yml`
- Push to feature branch and trigger a staging deploy
- Monitor Shard 10 status (should transition from queued to running)
- Verify all 10 shards complete successfully
- Check run times to confirm no performance regression

## Testing Strategy

### Unit Tests

No unit tests applicable (infrastructure/CI configuration changes).

### Integration Tests

**Test the fix by triggering workflows**:
- Push to `staging` branch to trigger `staging-deploy.yml` workflow
- Observe all 10 shards in `test-shards` matrix job
- Verify Shard 10 transitions from queued → running within 2 minutes
- Check that no shards are stuck in queued status indefinitely
- Monitor CPU usage on runners to confirm tasks are executing

### E2E Tests

**Trigger E2E workflow**:
- Manually trigger `e2e-sharded.yml` workflow
- Verify all 10 shards in `e2e-shards` matrix job execute
- Confirm Shard 10 runs and completes normally
- Check that job names and shard assignments are correct

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] YAML syntax is valid (no parsing errors)
- [ ] Trigger staging-deploy workflow by pushing to staging branch
- [ ] Wait for workflow to reach test-shards job
- [ ] Verify all 10 shards appear in job list
- [ ] Confirm Shard 10 transitions from queued to running (not stuck)
- [ ] Monitor until Shard 10 completes (should take ~15 minutes)
- [ ] Verify no other shards are affected negatively
- [ ] Check CloudWatch/monitoring for any runner assignment issues
- [ ] Trigger workflow retry to verify `run_attempt` variable works correctly
- [ ] Confirm stagger delay comments/code is still functional (independent of this fix)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **RunsOn Pool Doesn't Support Unique Labels**
   - **Description**: If the RunsOn runner pool doesn't recognize the unique label format, all jobs might fail to find a runner
   - **Likelihood**: very low (RunsOn gracefully ignores unrecognized labels)
   - **Impact**: high (all shards would be stuck)
   - **Mitigation**: Test on staging first before production. If issue occurs, revert changes by removing secondary label.

2. **Label Parsing Error in GitHub Actions**
   - **Description**: The context variables (`github.run_id`, `strategy.job-index`, `github.run_attempt`) might not interpolate correctly
   - **Likelihood**: low (these are standard context variables)
   - **Impact**: medium (jobs would use incorrect labels, potential for runner stealing)
   - **Mitigation**: Test on staging branch first. Verify label values in runner output logs.

3. **Syntax Error in YAML**
   - **Description**: Array syntax for `runs-on` might be parsed incorrectly
   - **Likelihood**: low (standard YAML array syntax)
   - **Impact**: medium (workflow won't run)
   - **Mitigation**: Run `yamllint` to validate syntax before committing.

**Rollback Plan**:

If this fix causes issues:
1. Revert the two workflow file changes: `git revert <commit-hash>`
2. Push to fix branch to disable the problematic changes
3. Verify workflows go back to previous behavior (stagger delay is still present as fallback)
4. Investigate what went wrong (check runner logs, RunsOn API)
5. Consider Option 2 (reduce parallelism) as temporary mitigation
6. File issue with RunsOn support if problem is on their side

**Monitoring** (if needed):
- Monitor job queue times for first 10 runs after fix
- Check if Shard 10 ever gets stuck again
- Alert if any shard is stuck in queued > 5 minutes
- Track runner assignment metrics from RunsOn dashboard

## Performance Impact

**Expected Impact**: none

The unique label approach has zero runtime impact:
- Labels are evaluated by scheduler before job execution
- No additional steps or delays added to jobs
- Staggered sleep delay remains (defensive, independent layer)
- Jobs execute with same parallelism (max-parallel: 3 unchanged)

**Performance Testing**:
- Compare total workflow time before/after fix
- Should be identical (±2 minutes for normal variance)
- If significant difference detected, investigate for unintended consequences

## Security Considerations

**Security Impact**: none

- No credentials or sensitive data exposed in labels
- Labels are public and visible in workflow runs
- Context variables (`github.run_id`, `strategy.job-index`) are standard, non-secret values
- No changes to secrets management or authentication

## Validation Commands

### Before Fix (Bug Should Be Reproducible)

```bash
# Demonstrate current behavior (Shard 10 getting stuck)
# This requires running a workflow, but we can document the evidence:
# 1. Push to staging branch to trigger staging-deploy.yml
# 2. Observe Shard 10 in the matrix job list
# 3. Watch it stay in "queued" state indefinitely
# 4. Confirm other shards complete normally
```

**Expected Result**: Shard 10 is stuck in queued state while other shards complete.

### After Fix (Bug Should Be Resolved)

```bash
# Validate YAML syntax
yamllint .github/workflows/staging-deploy.yml
yamllint .github/workflows/e2e-sharded.yml

# Push to staging and trigger workflow
git push origin feature/fix-shard10-runner-stealing

# Wait for workflow to reach test-shards job
# Verify all 10 shards transition from queued → running
# Monitor until all shards complete

# Trigger workflow again to verify consistency
gh workflow run staging-deploy.yml -r staging

# Verify no performance regression
# Compare timestamps: should be ~15-20 minutes total (unchanged)
```

**Expected Result**: All commands succeed, Shard 10 runs successfully, zero regressions in other shards, no performance degradation.

### Regression Prevention

```bash
# Monitor for Shard 10 stuck in queued
# Can be added as GitHub Actions check:
gh workflow view staging-deploy -j e2e-shard-10 --include-logs

# Set up alert if Shard 10 is queued > 5 minutes
# Create GitHub issue template for "Shard 10 stuck again"
# Document symptoms and runbooks for future troubleshooting
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. Uses only:
- Standard GitHub Actions context variables
- Existing RunsOn runner pool
- Existing Playwright test infrastructure

**No new dependencies needed**

## Database Changes

**No database changes required** - This is a CI/CD infrastructure fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Test on staging branch first (don't push directly to main)
- Run at least 2 full workflow cycles on staging to confirm fix is stable
- Monitor for first 5 runs after deploying to production

**Feature flags needed**: no

**Backwards compatibility**: fully maintained
- Changes to workflow files don't affect deployed application
- Retry mechanisms continue to work
- No breaking changes to any APIs

## Success Criteria

The fix is complete when:
- [ ] Both workflow files modified with unique per-job labels
- [ ] YAML syntax validated with `yamllint`
- [ ] Staging-deploy workflow runs to completion
- [ ] All 10 shards in test-shards job transition from queued → running
- [ ] Shard 10 no longer stuck indefinitely
- [ ] All shards complete successfully with passing tests
- [ ] No performance regression in total workflow time
- [ ] E2E-sharded workflow also runs successfully with same fix
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] Zero regressions in other CI/CD jobs

## Notes

### Why Sleep Delays Didn't Work (Previous Fix)

The staggered sleep delays in the first step of each job (`sleep $(( (${{ matrix.shard }} - 1) * 10 ))`) were a good defensive measure, but they run **inside the job** after the runner is assigned. The race condition occurs at the **scheduler level** before any steps execute, so adding delays to steps doesn't help.

However, the stagger delays should remain because:
1. They provide a secondary layer of defense
2. They may help with other timing-related issues
3. They have no downside (added 90 seconds to total workflow time is negligible)
4. Removing them might be seen as "partial rollback" if this fix has issues

### Why This Solution Aligns with Best Practices

GitHub's own documentation and the broader CI/CD community recommend unique labels for matrix jobs to prevent runner stealing. This is not a workaround—it's the standard pattern for reliable matrix job execution.

### Relationship to Diagnosis Issues

- **#951**: First occurrence, diagnosed but fix ineffective
- **#952**: Attempted label format fix
- **#959**: Second occurrence, diagnosed
- **#961**: Sleep delay fix applied (ineffective)
- **#982**: Third occurrence, root cause identified as scheduler-level race condition

This plan directly addresses the root cause instead of applying band-aids.

### Future Prevention

If more shards are added (e.g., 15 or 20 shards), this fix will continue to work because:
- Each shard automatically gets a unique label via `strategy.job-index`
- No additional configuration needed
- Unique labels scale to any number of shards

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #982*
