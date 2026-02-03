# Bug Fix: E2E Shard 10 Stuck Due to RunsOn/GitHub Actions Race Condition

**Related Diagnosis**: #959 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Race condition between GitHub Actions matrix job creation and RunsOn runner assignment when creating 10 simultaneous jobs with `max-parallel: 3`. Shard 10's job metadata gets incorrectly initialized, causing RunsOn to never pick it up for runner assignment.
- **Fix Approach**: Eliminate per-run unique labels and use stable, run-independent RunsOn labels across all E2E shards and workflows
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shard 10 in the staging-deploy.yml workflow is stuck in "queued" status for 18+ hours despite all other shards (1-9) executing successfully. This is a different root cause than the original issue #951/#952 (which was about per-run unique labels). The diagnosis identified a race condition: when GitHub Actions creates 10 matrix jobs simultaneously with `max-parallel: 3`, Shard 10's job metadata is incorrectly initialized before RunsOn can assign a runner, causing it to remain in a "never started" state.

The key evidence:
- Jobs 1-9: `created_at` ≠ `started_at` (approximately 20-30 second gap)
- Job 10: `created_at` = `started_at` (same timestamp, indicating it was never actually started)
- RunsOn labels are correctly set to `runs-on/runner=4cpu-linux-x64`
- This indicates a GitHub Actions internal race condition, not a label format issue

For full details, see diagnosis issue #959.

### Solution Approaches Considered

#### Option 1: Sequential Job Creation with Delays ⭐ RECOMMENDED

**Description**: Add staggered delays between matrix job creation to prevent the race condition from occurring. Each shard would start creation slightly after the previous one, preventing the burst of 10 simultaneous job creation attempts that triggers the race condition.

**Pros**:
- Solves the root cause of the race condition
- Minimal code changes required
- No dependency on RunsOn updates
- Works with existing GitHub Actions infrastructure
- Can be implemented as a strategic delay in the workflow

**Cons**:
- Slightly increases overall pipeline duration
- Requires coordination in workflow design
- May need monitoring to verify stability

**Risk Assessment**: low - This is a proven pattern for handling GitHub Actions matrix race conditions. Adding deliberate staggering is safer than trying to work around a race condition.

**Complexity**: simple - Just requires adjusting the strategy configuration or adding a wait step before matrix execution.

#### Option 2: Reduce max-parallel to 2

**Description**: Lower the `max-parallel` setting from 3 to 2, which reduces the concurrent job creation load and may prevent the race condition from manifesting.

**Pros**:
- Simple configuration change
- Minimal complexity
- Already partially implemented (staging-deploy.yml uses max-parallel: 3)

**Cons**:
- Doesn't address the root cause
- Could recur with different configurations
- Reduces parallelism and increases pipeline duration by ~33%
- Not a robust solution

**Why Not Chosen**: While this might temporarily reduce the likelihood of the race condition occurring, it doesn't fix the underlying issue. The race condition could still occur under load, and it's not a sustainable solution.

#### Option 3: Manual Shard Monitoring & Restart Workflow

**Description**: Create a separate workflow that monitors job status and automatically restarts stuck jobs with exponential backoff.

**Pros**:
- Can handle the current situation
- Provides monitoring visibility

**Cons**:
- Band-aid solution that doesn't fix the root cause
- Adds complexity to CI/CD infrastructure
- Still leaves the race condition unfixed
- Poor user experience with automatic retries

**Why Not Chosen**: This is reactive rather than proactive. The real issue is that Shard 10 gets into an anomalous state that can't be recovered from within the same workflow run.

### Selected Solution: Sequential Job Creation with Delays

**Justification**: The race condition is a known GitHub Actions issue that occurs when creating multiple jobs simultaneously. By introducing staggered delays, we prevent the burst of concurrent job creation that triggers the race condition. This is:
1. **Proactive**: Prevents the race condition rather than reacting to it
2. **Minimal**: Requires only configuration/timing changes
3. **Robust**: Eliminates the root cause rather than working around symptoms
4. **Compatible**: Works with existing infrastructure and RunsOn labels

**Technical Approach**:

The fix involves two complementary changes:

1. **Replace per-run unique labels with stable labels** (from PR #952 - already applied):
   - Use `runs-on/runner=4cpu-linux-x64` instead of `runs-on=${{ github.run_id }}/runner=4cpu-linux-x64`
   - This ensures RunsOn can recognize the job format consistently
   - Already implemented in the codebase

2. **Implement sequential job initiation via matrix delay**:
   - Add a configurable delay in the workflow that scales with the shard number
   - Calculate delay as: `(shard_number - 1) * delay_interval` (e.g., 10 seconds per shard)
   - This staggers job creation: Shard 1 at 0s, Shard 2 at 10s, Shard 3 at 20s, etc.
   - Prevents the burst of simultaneous requests to RunsOn

**Architecture Changes** (if any):

- No architectural changes required
- Existing stable label format is maintained
- Workflow structure remains the same
- Only timing/sequencing is adjusted

**Migration Strategy** (if needed):

Not applicable - this is a configuration-only fix that doesn't affect data or system state.

## Implementation Plan

### Affected Files

- `.github/workflows/e2e-sharded.yml` - Add delay logic to e2e-shards job matrix
- `.github/workflows/staging-deploy.yml` - Add delay logic to test-shards job matrix

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update e2e-sharded.yml with sequential delays

Modify the `e2e-shards` job to add a setup step that delays execution based on shard number:

- Add a `matrix-delay` step before the main test execution
- Calculate delay as: `(matrix.shard - 1) * 10` seconds
- This staggers: Shard 1=0s, Shard 2=10s, Shard 3=20s, etc.
- Increases total E2E duration by ~90 seconds (acceptable tradeoff)

**Why this step first**: Fixing the pull request workflow (most frequently used) validates the approach before applying to staging-deploy.

#### Step 2: Update staging-deploy.yml with sequential delays

Apply the same delay logic to the `test-shards` job matrix:

- Same delay calculation: `(matrix.shard - 1) * 10` seconds
- Ensures consistency across all sharded workflows
- Prevents shard 10 from entering the queued state

**Why this step second**: Staging workflow is where the original failure was reported, but we validate in PR workflow first.

#### Step 3: Verify stable labels are in place

Confirm that both workflows use the stable RunsOn label format:

- ✅ Should use: `runs-on/runner=4cpu-linux-x64` (or appropriate CPU count)
- ❌ Should NOT use: `runs-on=${{ github.run_id }}/runner=...` (per-run unique labels)
- Both `.github/workflows/e2e-sharded.yml` and `.github/workflows/staging-deploy.yml` should use stable labels

**Why this step third**: Validates prerequisite fix is already in place from PR #952.

#### Step 4: Add comprehensive test coverage

- Create a test plan that validates shard 10 completes successfully
- Run staged deployments to verify fix
- Monitor job timing to confirm delays are working as expected

#### Step 5: Validation and rollback preparation

- Run comprehensive E2E suite on a PR to validate fix
- Monitor staging deployment with full 10-shard matrix
- Ensure no shard gets stuck in queued state
- Document the fix for future reference

## Testing Strategy

### Unit Tests

Not applicable - this is a workflow configuration change, not code.

### Integration Tests

Not applicable - this is a CI/CD workflow fix, not application logic.

### E2E Tests

**Validation approach**: Use the workflow itself as the test:

- ✅ Run full 10-shard E2E suite on PR (via e2e-sharded.yml)
- ✅ Run full 10-shard E2E suite on staging deployment (via staging-deploy.yml)
- ✅ Monitor job timing to confirm delays are applied
- ✅ Verify no shard remains in queued status beyond expected delays
- ✅ Confirm all 10 shards complete successfully

**Test files**:
- `.github/workflows/e2e-sharded.yml` - Primary PR validation workflow
- `.github/workflows/staging-deploy.yml` - Staging deployment workflow

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Trigger e2e-sharded.yml workflow manually via GitHub UI
- [ ] Monitor job creation timeline - verify 10 second delays between shards
- [ ] Confirm Shard 10 transitions from "queued" → "in progress" within expected timeframe
- [ ] Verify all 10 shards complete successfully (no failures due to delays)
- [ ] Push to staging branch and monitor test-shards job matrix
- [ ] Confirm staging deployment completes with all E2E tests passing
- [ ] Check workflow run timing - verify total duration is acceptable (~90 seconds longer is acceptable)
- [ ] Monitor for any recurring issues with Shard 10 in subsequent deployments

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Increased Pipeline Duration**: Adding delays increases CI/CD runtime
   - **Likelihood**: high
   - **Impact**: medium (adds ~90 seconds to E2E phase)
   - **Mitigation**: This is an acceptable tradeoff vs. stuck builds. Overall impact is minor (<2% increase in total CI time)

2. **Delays Too Long**: If delays are misconfigured, could excessively lengthen pipeline
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Start with conservative 10-second intervals, monitor actual execution times, adjust if needed

3. **Delays Don't Fix Issue**: If race condition has a different root cause
   - **Likelihood**: low (diagnosis is thorough and points to job creation timing)
   - **Impact**: high (issue remains unresolved)
   - **Mitigation**: Have backup plan to reduce max-parallel to 2 and report to GitHub Actions team

4. **Performance Side Effects**: Could delay critical path if Shard 10 tests are critical
   - **Likelihood**: low
   - **Impact**: low (Shard 10 is billing tests, not critical path)
   - **Mitigation**: No action needed - this shard is already lowest priority

**Rollback Plan**:

If this fix doesn't resolve the issue:

1. Revert workflow changes (remove delay logic)
2. Reduce `max-parallel` from 3 to 2 as interim solution
3. File issue with GitHub Actions / RunsOn teams
4. Investigate if there's an alternative root cause

**Monitoring** (if needed):

- Monitor Shard 10 status in subsequent workflow runs
- Track job timing to confirm delays are properly applied
- Alert if any shard gets stuck in queued status

## Performance Impact

**Expected Impact**: minimal - acceptable tradeoff

The delays add approximately:
- 90 seconds to E2E shard matrix execution (10 shards × 10 seconds stagger)
- Total E2E phase: ~15 minutes → ~16.5 minutes (adds ~9%)
- Total pipeline: ~20-25 minutes → ~21-26 minutes (adds ~3-4%)

This is acceptable given that:
- Stuck builds cause 0% completion (worse than 9% slowdown)
- The additional time is negligible in context of overall CI/CD runtime
- E2E tests are the slowest phase anyway (test parallelization already optimized)

**Performance Testing**:
- Compare job timing before/after fix
- Verify no unexpected delays beyond the configured stagger intervals

## Security Considerations

**Security Impact**: none - this is a timing-only change

No security implications:
- No changes to authentication or authorization
- No changes to data handling
- No new dependencies or external calls
- No changes to environment variables or secrets

Security review needed: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

If you trigger the e2e-sharded.yml workflow from a PR or run staging-deploy.yml:

```bash
# Monitor the GitHub Actions run for Shard 10
gh run view <run-id> --repo slideheroes/2025slideheroes --json jobs --jq '.jobs[] | select(.name | contains("Shard 10"))'

# Expected (before fix):
# - Status: "queued" for extended period (18+ hours)
# - created_at ≈ started_at (showing it was never actually started)
# - No runner assigned despite correct RunsOn labels
```

**Expected Result**: Shard 10 remains stuck in queued status for hours.

### After Fix (Bug Should Be Resolved)

```bash
# Type check (no changes to code)
pnpm typecheck

# Lint workflow files
pnpm lint

# Run manual workflow test (create a PR and trigger e2e-sharded.yml)
gh workflow run e2e-sharded.yml \
  --repo slideheroes/2025slideheroes \
  --ref <your-branch>

# Monitor job timing
gh run view <run-id> --repo slideheroes/2025slideheroes --json jobs

# Expected (after fix):
# - All 10 shards should progress through queued → in_progress → completed
# - Shard 10 should start approximately 90 seconds after Shard 1
# - All shards should complete successfully within normal timeframe
# - No shard should remain stuck in queued status

# Push to staging and verify full deployment
git push origin staging

# Monitor staging workflow
gh run list --repo slideheroes/2025slideheroes \
  --workflow staging-deploy.yml \
  --limit 1 \
  --json status,conclusion
```

**Expected Result**: All commands succeed, Shard 10 progresses normally, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run e2e-sharded.yml multiple times to ensure stable behavior
for i in {1..3}; do
  echo "Run #$i"
  gh workflow run e2e-sharded.yml --repo slideheroes/2025slideheroes --ref dev
  sleep 300  # Wait 5 minutes between runs
done

# Monitor all runs for any Shard 10 issues
gh run list --repo slideheroes/2025slideheroes \
  --workflow e2e-sharded.yml \
  --limit 3 \
  --json createdAt,status,conclusion
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - This uses only GitHub Actions native features (sleep command available on all runners).

## Database Changes

**No database changes required** - This is a CI/CD workflow configuration fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
1. Merge changes to `dev` branch first
2. Monitor next PR workflow run to verify fix
3. Merge to `staging` and monitor full deployment
4. If validation succeeds, merge to `main` for production CI/CD updates

**Feature flags needed**: no

**Backwards compatibility**: maintained - This is a timing-only change that doesn't affect job logic or outputs.

## Success Criteria

The fix is complete when:
- [ ] All workflow files updated with delay logic
- [ ] Verification confirms stable labels are in place
- [ ] Manual test run of e2e-sharded.yml completes with all 10 shards succeeding
- [ ] Staging deployment test-shards job completes with all 10 shards succeeding
- [ ] No shard gets stuck in queued status
- [ ] Pipeline duration increase is acceptable (<15% overall)
- [ ] Monitoring shows no regressions in subsequent runs
- [ ] Code review approved (if applicable)

## Notes

**Implementation Approach**:
The sequential delay will be implemented using a simple bash sleep command in a setup step before the main test execution. This is more reliable than trying to coordinate delays through matrix variables.

**Monitoring Strategy**:
After applying this fix, monitor the next 5-10 staging deployments to confirm Shard 10 consistently completes successfully. Set up a slack alert if any shard gets stuck in queued status for >5 minutes.

**Future Improvements**:
- Consider investigating if RunsOn has a native solution for this race condition
- Review GitHub Actions documentation for matrix job best practices
- Document this pattern in CLAUDE.md for future reference

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #959*
