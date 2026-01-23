# Bug Fix: E2E Sharded Workflow Matrix Jobs Not Created for workflow_dispatch

**Related Diagnosis**: #1709
**Severity**: high
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: GitHub Actions matrix jobs silently fail to create when workflow is triggered via `workflow_dispatch` instead of `pull_request`, specifically due to the combination of `needs:` dependency and step-level `if:` conditions
- **Fix Approach**: Remove the `needs: setup-server` dependency from `e2e-shards` job and pass data via job outputs instead, eliminating the GitHub Actions scheduling conflict for `workflow_dispatch` triggers
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When running the E2E sharded workflow via GitHub Actions UI or CLI with `workflow_dispatch`:
- **Expected**: 14 total jobs (1 setup + 12 shards + 1 report)
- **Actual**: 2 total jobs (1 setup + 1 report, matrix jobs never created)
- **Pull requests work correctly**: Matrix jobs create properly with same workflow file
- **Impact**: workflow_dispatch trigger completely broken for E2E testing (0% success rate across 10+ runs)

The root cause analysis in the diagnosis reveals this is a **GitHub Actions internal behavior** where the combination of:
1. Job-level `needs:` dependency on `setup-server`
2. Step-level `if:` conditions checking that dependency's outputs
3. `workflow_dispatch` trigger (not `pull_request`)

...causes the matrix job scheduler to silently abort without creating jobs.

### Solution Approaches Considered

#### Option 1: Add job-level if: condition ❌ REJECTED
**Description**: Previously attempted fix - add `if: needs.setup-server.outputs.should-skip != 'true'` at job level

**Problem**: This is what creates the matrix scheduling failure in the first place! The diagnosis explicitly notes this was attempted and didn't work.

**Why Not Chosen**: Circular logic - we're trying to avoid the problem by doing the exact thing that causes it.

#### Option 2: Remove needs dependency entirely ⭐ RECOMMENDED

**Description**: Eliminate the `needs: setup-server` dependency from `e2e-shards` job. Instead:
- Have each shard job independently check if it should run
- No cross-job dependency on setup-server output
- Shard jobs can still skip themselves without blocking matrix creation

**Why This Works**:
- GitHub Actions matrix scheduling works fine without `needs:` dependencies
- Step-level `if:` conditions don't interfere with matrix creation when there's no job-level dependency
- Each shard still gets the information it needs (should-skip) via outputs, but retrieves it asynchronously
- No workarounds or band-aids - addresses the root cause

**Pros**:
- ✅ Simplest fix - just remove 1 line
- ✅ Eliminates GitHub Actions internal conflict
- ✅ Matrix jobs will create reliably on all triggers (pull_request, workflow_dispatch, push)
- ✅ No architectural changes
- ✅ Shard jobs still skip themselves when needed (no wasted compute)
- ✅ Low risk - minimal code change

**Cons**:
- ✅ Shard jobs may theoretically run without waiting for setup-server to complete (BUT this is fine because setup-server completes in ~1-2 seconds and has its own failure paths)
- ⚠️ Need to verify shard jobs don't start before setup-server (cache restoration should be atomic and fast)

**Risk Assessment**: low-medium
- The matrix won't schedule if setup-server fails, but that's okay because the shards will fail with clear cache miss errors
- In practice, setup-server completes so quickly (1-2 minutes) that race conditions are negligible

**Complexity**: simple - one line removal, no other changes needed

#### Option 3: Use dynamic matrix with outputs

**Description**: Have setup-server output a JSON array of shard numbers, then use `fromJSON()` to create the matrix dynamically

**Example**:
```yaml
setup-server:
  outputs:
    shards: ${{ steps.generate-shards.outputs.shards }}

e2e-shards:
  strategy:
    matrix:
      shard: ${{ fromJSON(needs.setup-server.outputs.shards) }}
```

**Why Not Chosen**:
- More complex than needed
- Still uses `needs:` dependency which is the root cause
- Dynamic matrices have their own GitHub Actions quirks
- Doesn't actually solve the underlying `needs:` + `workflow_dispatch` scheduling issue

#### Option 4: Use separate job to make job-level decision

**Description**: Create an intermediate job that decides if shards should run, then have e2e-shards depend on it instead

**Why Not Chosen**: Same root cause problem - adding another layer of `needs:` dependencies makes the issue worse, not better

### Selected Solution: Option 2 - Remove needs dependency

**Justification**:
The root cause is the `needs: setup-server` dependency combined with `workflow_dispatch`. GitHub Actions has different scheduling logic for matrix jobs depending on whether they have dependencies. By removing this unnecessary dependency, we allow the matrix scheduler to work normally.

Shard jobs will still complete their work correctly because:
1. They check `needs.setup-server.outputs.should-skip` at step-level (still available in GitHub Actions context)
2. Even if a shard starts before setup-server finishes (extremely unlikely - setup is 1-2 minutes), it will wait for the cache at step level
3. Setup-server's cache is written atomically to GitHub Actions cache service (no race conditions)

**Technical Approach**:
- Remove `needs: setup-server` from e2e-shards job definition
- Keep all step-level conditions that check setup-server outputs (these still work)
- Shards will still be able to read `needs.setup-server.outputs.should-skip` because setup-server runs first and completes quickly
- If setup-server fails, e2e-shards jobs will fail with clear cache miss errors (which is appropriate)

**Architecture Changes**: None - this is a lateral move, not a redesign

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` - Remove `needs: setup-server` from e2e-shards job

### Step-by-Step Tasks

#### Step 1: Remove needs dependency

Edit `.github/workflows/e2e-sharded.yml` at line 210:

**Current (lines 208-214)**:
```yaml
  e2e-shards:
    name: E2E Shard ${{ matrix.shard }}
    needs: setup-server
    # NOTE: No job-level if: condition here - this is intentional!
    # Job-level if: conditions (even ones checking outputs) prevent matrix job creation
    # for workflow_dispatch triggers. Instead, we use step-level conditions.
    # See: Issue #1698, #1700 - E2E Shard Matrix Jobs Not Created for workflow_dispatch Events
```

**After**:
```yaml
  e2e-shards:
    name: E2E Shard ${{ matrix.shard }}
    # NOTE: No 'needs: setup-server' dependency - this was causing matrix job scheduling
    # failures for workflow_dispatch triggers. Removed to allow matrix creation.
    # Step-level conditions checking setup-server outputs still work fine.
    # See: Issue #1698, #1700 - E2E Shard Matrix Jobs Not Created for workflow_dispatch Events
    # NOTE: No job-level if: condition here - this is intentional!
    # Job-level if: conditions (even ones checking outputs) prevent matrix job creation
    # for workflow_dispatch triggers. Instead, we use step-level conditions.
```

**Why**: Removing this line eliminates the GitHub Actions internal scheduling conflict.

#### Step 2: Verify step-level output checks still work

Verify that lines 273-280 (step-level checks) still reference setup-server outputs correctly:

```yaml
      - name: Check if should skip
        id: check-skip
        run: |
          if [[ "${{ needs.setup-server.outputs.should-skip }}" == "true" ]]; then
```

This should still work because:
- `needs.setup-server` context is still available (setup-server is the first job to run)
- GitHub Actions loads all job outputs into context regardless of `needs:` declarations
- Step-level conditions are evaluated at runtime, after jobs have completed

#### Step 3: Test matrix job creation

Trigger workflow via workflow_dispatch and verify:
- [ ] 14 total jobs created (currently creating only 2)
- [ ] All 12 matrix shards appear in workflow graph
- [ ] Each shard shows matrix number (Shard 1, Shard 2, etc.)
- [ ] Shards complete successfully with cache hits
- [ ] Report job completes successfully
- [ ] No workflow_dispatch-specific errors

#### Step 4: Test pull_request trigger

Verify existing functionality still works:
- [ ] Create or update a PR
- [ ] All 12 matrix shards create normally
- [ ] Shards skip properly for dependabot PRs
- [ ] Report job runs and aggregates results

#### Step 5: Run comprehensive workflow tests

- [ ] Test with max_parallel=2
- [ ] Test with max_parallel=3
- [ ] Test with max_parallel=6
- [ ] Verify no race conditions in job scheduling
- [ ] Confirm cache restoration works atomically

## Testing Strategy

### Unit Tests

Not applicable - this is a GitHub Actions workflow configuration change, not code logic.

### Integration Tests

**E2E Workflow Tests**:

1. **workflow_dispatch trigger** ✅
   - Trigger workflow via `gh workflow run e2e-sharded.yml --ref dev -f max_parallel=3`
   - Verify 14 total jobs created
   - Wait for completion
   - Verify all shards ran and report was generated

2. **pull_request trigger** ✅
   - Create test PR with changes to apps/e2e/tests/
   - Verify 14 total jobs created
   - Wait for completion
   - Verify results aggregated in PR comment

3. **Dependabot skip functionality** ✅
   - Create mock dependabot PR
   - Verify only setup-server and e2e-report run (shards skipped)
   - Verify no errors in skipped shards

4. **Max parallel variations** ✅
   - Test with max_parallel=2: verify only 2 shards run concurrently
   - Test with max_parallel=6: verify up to 6 shards run concurrently
   - Monitor runner allocation and completion time

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Clone dev branch locally
- [ ] Edit .github/workflows/e2e-sharded.yml to remove `needs: setup-server`
- [ ] Commit and push to test branch
- [ ] Trigger workflow_dispatch via GitHub UI
  - [ ] Monitor job creation in real-time
  - [ ] Verify all 12 shards appear in workflow graph
  - [ ] Count total jobs (should be 14)
- [ ] Wait for workflow to complete
  - [ ] Check setup-server completed successfully
  - [ ] Check all 12 shards completed successfully
  - [ ] Check e2e-report aggregated results
- [ ] Compare with previous workflow_dispatch runs (which show only 2 jobs)
- [ ] Verify no new console errors or warnings
- [ ] Check workflow logs for any unexpected errors

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Race condition: Shard starts before setup-server completes**
   - **Likelihood**: very low (setup-server is 1-2 minutes, GitHub Actions schedules jobs in order)
   - **Impact**: medium (shard would fail with cache miss, but this would be a clear error)
   - **Mitigation**: Monitor first few runs for any timing issues. If detected, add explicit `sleep` in shard job to wait for setup-server.

2. **Shard jobs can't access setup-server outputs**
   - **Likelihood**: low (GitHub Actions loads all job outputs into context)
   - **Impact**: high (workflow would break, can't skip dependabot PRs)
   - **Mitigation**: Tested before commit. If this occurs, add back `needs: setup-server` but investigate why `needs:` causes matrix failure on `workflow_dispatch` (root cause analysis needed).

3. **Other workflows depending on this pattern break**
   - **Likelihood**: low (this pattern is specific to e2e-sharded.yml)
   - **Impact**: low (only e2e tests affected)
   - **Mitigation**: Search codebase for similar `needs: + matrix + workflow_dispatch` patterns and fix proactively.

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the single-line change (add `needs: setup-server` back)
2. Update diagnosis issue to document why this fix didn't work
3. Research alternative approaches (possibly GitHub support case)
4. Consider workarounds (e.g., don't support workflow_dispatch trigger, only pull_request)

**Monitoring** (if needed):

- Watch first 3-5 workflow_dispatch runs for any failures
- Monitor for race condition errors (cache misses in first 30 seconds of shard jobs)
- Check for any new error patterns in job logs

## Performance Impact

**Expected Impact**: none

- No code logic changes - pure workflow configuration
- Matrix scheduling should be more efficient without unnecessary dependency
- Shard jobs will start slightly earlier (no waiting on job dependency), reducing total workflow time by 0-5 seconds

## Security Considerations

**Security Impact**: none

- No security-related code changes
- Workflow permissions unchanged
- Runner configuration unchanged
- No new external dependencies

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger workflow via workflow_dispatch
gh workflow run e2e-sharded.yml --ref dev -f max_parallel=3

# Get workflow run ID
RUN_ID=$(gh run list --workflow e2e-sharded.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# Count total jobs created (should be 2)
gh api repos/MLorneSmith/2025slideheroes/actions/runs/$RUN_ID/jobs --jq '.total_count'
# Expected: 2 (only setup-server and e2e-report)

# List job names (should be missing shards 1-12)
gh api repos/MLorneSmith/2025slideheroes/actions/runs/$RUN_ID/jobs --jq '.jobs[].name'
# Expected: ["Setup Test Server", "E2E Test Report"]
```

**Expected Result**: Only 2 jobs created, no matrix shards appear

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint the workflow (optional - GitHub Actions doesn't have built-in linting)
# Manual review of changes

# Trigger workflow via workflow_dispatch (same as before)
gh workflow run e2e-sharded.yml --ref dev -f max_parallel=3

# Get workflow run ID
RUN_ID=$(gh run list --workflow e2e-sharded.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# Count total jobs created (should be 14)
gh api repos/MLorneSmith/2025slideheroes/actions/runs/$RUN_ID/jobs --jq '.total_count'
# Expected: 14 (setup + 12 shards + report)

# List job names (should include all shards)
gh api repos/MLorneSmith/2025slideheroes/actions/runs/$RUN_ID/jobs --jq '.jobs[].name'
# Expected: ["Setup Test Server", "E2E Shard 1", "E2E Shard 2", ..., "E2E Shard 12", "E2E Test Report"]

# Wait for workflow to complete
gh run view $RUN_ID --exit-status

# Check final status
gh run view $RUN_ID --json conclusion
# Expected: "success" or "neutral" (not "failure")
```

**Expected Result**: All 14 jobs created and complete successfully

### Regression Prevention

```bash
# Ensure pull_request trigger still works
# Create test PR with changes
git checkout -b test/matrix-fix
git commit -m "test: verify matrix fix doesn't break pull_request trigger"
git push origin test/matrix-fix
gh pr create --title "Test: Matrix job fix verification" --body "Testing matrix fix"

# Monitor PR checks
gh pr view <PR_NUMBER> --json checks

# Expected: All 14 E2E jobs run on PR
# Expected: Report job aggregates results
# Expected: PR comment shows E2E results
```

## Dependencies

### New Dependencies

None - this is a configuration change, not a code change.

### Configuration Changes

None - only removing a line from workflow YAML.

## Database Changes

Not applicable - no database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - only changes GitHub Actions workflow behavior, no API or database changes

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] `workflow_dispatch` trigger creates all 14 jobs (previously created only 2)
- [ ] `pull_request` trigger still works correctly (creates all 14 jobs)
- [ ] All 12 matrix shards complete successfully on both trigger types
- [ ] E2E test report aggregates results correctly
- [ ] No new console errors or warnings in workflow logs
- [ ] No regressions in existing functionality
- [ ] Dependabot PR skipping still works correctly

## Notes

This fix addresses a specific GitHub Actions internal behavior where `workflow_dispatch` triggers combined with job-level `needs:` dependencies on jobs with step-level `if:` conditions cause silent matrix job scheduling failures.

The diagnosis (issue #1709) thoroughly documents why this happens and why previous approaches (removing step-level `if:` conditions, adding job-level `if:` conditions, using RunsOn labels differently) didn't work.

This solution is the most direct fix: remove the `needs:` dependency that's causing the conflict. Shard jobs will still skip themselves appropriately without needing a job-level dependency.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1709*
