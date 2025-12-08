# Bug Fix: Implement Sharded E2E Tests for Staging Deploy

**Related Diagnosis**: #942 (REQUIRED)
**Severity**: medium
**Bug Type**: performance
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Staging deploy workflow runs E2E tests sequentially on a single 4-CPU runner, taking 26+ minutes
- **Fix Approach**: Implement sharded E2E tests using matrix strategy, similar to e2e-sharded.yml
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Force pushes to staging trigger full test validation on a single 4-CPU runner, executing all E2E tests sequentially for 26+ minutes. The existing e2e-sharded.yml workflow already implements parallelized testing (10 shards, max 3 parallel) but this pattern isn't used in staging-deploy.yml.

For full details, see diagnosis issue #942.

### Solution Approaches Considered

#### Option 1: Upgrade Runner CPU

**Description**: Upgrade staging-deploy test-full job from 4cpu to 8cpu or 16cpu runner.

**Pros**:
- Minimal code changes (single line)
- Immediate improvement
- No architectural changes

**Cons**:
- Only 30-50% improvement (not solving root cause)
- Increased cost (~$20-40/month extra)
- Still running tests sequentially

**Why Not Chosen**: Doesn't address the fundamental issue of sequential test execution. Limited improvement for increased cost.

#### Option 2: Add Force Push Skip Logic

**Description**: Detect if pushed commits were already validated on dev branch and skip tests.

**Pros**:
- Zero test execution time for force pushes
- No additional cost
- Simple logic addition

**Cons**:
- Bypasses validation entirely (risk if dev validation was incomplete)
- Git history queries can be unreliable
- Doesn't help when validation IS needed

**Why Not Chosen**: Skipping validation entirely introduces risk. Better to make validation fast rather than skip it.

#### Option 3: Implement Sharded E2E Tests for Staging ⭐ RECOMMENDED

**Description**: Replace the monolithic test-full job with sharded E2E tests using matrix strategy, similar to the proven e2e-sharded.yml workflow pattern.

**Pros**:
- 60-70% faster execution (26 min → 8-10 min)
- Uses proven pattern from e2e-sharded.yml
- Better resource utilization
- Scalable (can adjust shard count and parallelism)
- No additional per-minute cost (same total compute)

**Cons**:
- More complex workflow configuration
- Requires job coordination (setup → shards → aggregate)
- Slight increase in artifact storage

**Risk Assessment**: low - Reusing existing proven pattern from e2e-sharded.yml

**Complexity**: moderate - Requires restructuring the test-full job into multiple jobs

### Selected Solution: Sharded E2E Tests for Staging

**Justification**: This approach directly addresses the root cause (sequential test execution) by parallelizing tests across multiple shards. The pattern is already battle-tested in e2e-sharded.yml, reducing implementation risk. Expected improvement of 60-70% brings test time from 26+ minutes to ~8-10 minutes.

**Technical Approach**:
- Replace single `test-full` job with 3-job structure: `test-setup`, `test-shards` (matrix), `test-aggregate`
- Use 10-shard matrix strategy matching e2e-sharded.yml
- Set max-parallel to 3 for balanced resource usage
- Share build artifacts between setup and shard jobs via cache
- Aggregate results and report status

**Architecture Changes**:
- Transform monolithic test job into distributed shard jobs
- Add cache-based artifact sharing for build output
- Add result aggregation job for status reporting

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Replace test-full job with sharded test structure (lines 118-215)

### New Files

None required - all changes are modifications to existing workflow.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create test-setup job

Replace the test-full job header and initial setup with a dedicated setup job that:
- Starts Supabase
- Builds the application
- Caches build artifacts for shard jobs

**Why this step first**: Setup job must complete before shards can run.

- Remove the existing `test-full` job (lines 118-215)
- Add `test-setup` job with:
  - Checkout and setup-deps
  - Supabase CLI setup and start
  - Environment variable export
  - Build with Turbo cache
  - Cache build artifacts with unique key

#### Step 2: Create test-shards matrix job

Add a matrix job that runs E2E tests in parallel shards:

- Add `test-shards` job with:
  - `needs: [check-validation, validate, test-setup]`
  - Same conditional as original test-full
  - Matrix strategy: `shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
  - `max-parallel: 3`
  - `fail-fast: false`
  - Restore cached build artifacts
  - Install Playwright browsers
  - Start local Supabase
  - Run `pnpm --filter web-e2e test:shard${{ matrix.shard }}`
  - Upload shard results as artifacts

#### Step 3: Create test-aggregate job

Add a job to aggregate results from all shards:

- Add `test-aggregate` job with:
  - `needs: test-shards`
  - `if: always()`
  - Download all shard artifacts
  - Generate consolidated report to GITHUB_STEP_SUMMARY
  - Set overall pass/fail status

#### Step 4: Update downstream job dependencies

Update the `build` job to depend on the new test structure:

- Change `needs: [check-validation, validate, test-full]` to `needs: [check-validation, validate, test-aggregate]`
- Update conditional to check `test-aggregate.result` instead of `test-full.result`
- Update workflow summary references

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test with a force push to staging branch
- Confirm tests complete in ~8-10 minutes

## Testing Strategy

### Unit Tests

No unit tests required - this is a CI/CD workflow change.

### Integration Tests

No integration tests required - validation is done through actual workflow execution.

### E2E Tests

The fix itself IS the E2E test infrastructure. Validation via:
- Trigger staging-deploy workflow with force push
- Verify all 10 shards execute
- Verify parallel execution (max 3 concurrent)
- Verify results aggregation

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Push to staging branch and observe workflow execution
- [ ] Verify test-setup job completes successfully
- [ ] Verify 10 shards are created in test-shards job
- [ ] Verify max 3 shards run concurrently
- [ ] Verify each shard uploads its results
- [ ] Verify test-aggregate job collects all results
- [ ] Verify build job runs after successful test aggregation
- [ ] Verify deployment proceeds after build
- [ ] Measure total test time (target: < 12 minutes)
- [ ] Verify workflow summary shows shard results

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Cache invalidation issues**: Build cache might not restore correctly for shard jobs
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Use unique cache key with github.sha and github.run_id; add restore-keys fallback

2. **Shard job startup failures**: Individual shards might fail to start Supabase
   - **Likelihood**: low
   - **Impact**: low (fail-fast: false)
   - **Mitigation**: Supabase start is idempotent; uses same pattern as e2e-sharded.yml

3. **Artifact upload conflicts**: Multiple shards uploading artifacts simultaneously
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Use unique artifact names with shard number

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the staging-deploy.yml changes to restore single test-full job
2. Git: `git revert <commit-sha>`
3. Push to staging branch to trigger workflow with reverted config

**Monitoring**:
- Monitor workflow run times for first 5 staging deploys
- Watch for any shard failures or timeouts
- Compare test success rate before/after change

## Performance Impact

**Expected Impact**: significant improvement

- **Before**: ~26 minutes (sequential on 4-CPU)
- **After**: ~8-10 minutes (10 shards, 3 parallel)
- **Improvement**: 60-70% reduction in test time

**Performance Testing**:
- Measure end-to-end workflow time for 3 consecutive runs
- Verify individual shard times are ~2-3 minutes each
- Confirm total parallel execution time matches expectations

## Security Considerations

**Security Impact**: none

The changes don't affect:
- Secret handling (same patterns as before)
- Environment variables (same configuration)
- Deployment permissions (unchanged)
- Network access (unchanged)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Force push to staging and observe 26+ minute test time
git push origin dev:staging --force
# Then check workflow run in GitHub Actions
```

**Expected Result**: test-full job runs for 26+ minutes

### After Fix (Bug Should Be Resolved)

```bash
# Force push to staging
git push origin dev:staging --force

# Monitor workflow run in GitHub Actions:
# 1. test-setup job should complete in ~3-5 minutes
# 2. 10 test-shards jobs should appear
# 3. Max 3 shards should run concurrently
# 4. All shards should complete in ~8-10 minutes total
# 5. test-aggregate job should show consolidated results
# 6. build job should proceed after test-aggregate succeeds
```

**Expected Result**: Total test phase completes in ~8-10 minutes (60-70% faster).

### Regression Prevention

```bash
# Verify workflow syntax is valid
cd .github/workflows
yamllint staging-deploy.yml

# Verify no broken job dependencies (manual review)
# Check: test-setup → test-shards → test-aggregate → build
```

## Dependencies

**No new dependencies required**

The implementation uses existing GitHub Actions features and patterns already in use by e2e-sharded.yml.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Merge to staging branch will trigger the new sharded workflow
- First run will validate the implementation

**Feature flags needed**: no

**Backwards compatibility**: maintained - deployment flow unchanged, only test execution is optimized

## Success Criteria

The fix is complete when:
- [ ] staging-deploy.yml has test-setup, test-shards, and test-aggregate jobs
- [ ] Test shards run in parallel (max 3 concurrent)
- [ ] Total test phase completes in < 12 minutes
- [ ] Build and deploy jobs proceed after successful tests
- [ ] Workflow summary shows shard-level results
- [ ] No increase in test failures compared to baseline
- [ ] Force push to staging triggers sharded tests correctly

## Notes

### Reference: e2e-sharded.yml Structure

The existing e2e-sharded.yml provides the proven pattern:
- `setup-server` job: Builds app, starts Supabase, caches artifacts
- `e2e-shards` job: Matrix with 10 shards, max-parallel 3
- `e2e-report` job: Aggregates results, posts PR comment

Key differences for staging-deploy.yml:
- No PR comment needed (not PR-triggered)
- Conditional execution based on check-validation
- Integration with existing build/deploy pipeline

### RunsOn Runner Configuration

Current staging test jobs use `4cpu-linux-x64`. For sharded tests:
- `test-setup`: Use `4cpu-linux-x64` (builds need CPU)
- `test-shards`: Use `2cpu-linux-x64` (individual shards are smaller)
- `test-aggregate`: Use `2cpu-linux-x64` (lightweight aggregation)

This matches e2e-sharded.yml configuration and optimizes cost.

### Shard Distribution Reference

From e2e-sharded.yml, shards are organized as:
1. Smoke Tests
2. Authentication
3. Account & Team Accounts
4. Admin & Invitations
5. Accessibility
6. Healthcheck
7. Payload Auth, Collections, Database
8. Payload Seeding & Performance
9. User Billing
10. Team Billing

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #942*
