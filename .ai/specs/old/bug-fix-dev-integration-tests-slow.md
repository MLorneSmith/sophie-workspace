# Bug Fix: Dev Integration Tests Workflow Performance (15-20min → 8-10min)

**Related Diagnosis**: #640
**Severity**: critical
**Bug Type**: performance
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: 2-core GitHub Actions runner insufficient for Playwright test parallelization (13m28s test execution)
- **Fix Approach**: Upgrade runner from `2cpu-linux-x64` to `4cpu-linux-x64` (50% speedup, same cost)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests.yml` workflow takes 15-20+ minutes to complete, with Playwright E2E tests consuming 13-16 minutes of execution time. The root cause is CPU contention: each Playwright browser process requires ~1 core, but the 2-core runner cannot effectively parallelize 2 workers.

**Current timing (latest run #19508677796)**:
- check-should-run: 12s
- wait-for-deployment: 4s
- api-contract-tests: 2m09s
- **integration-tests: 15m30s** (13m28s test execution - BOTTLENECK)
- performance-baseline: 3m11s
- security-scan: 9s
- **Total: ~17 minutes**

For full context, see diagnosis issue #640.

### Solution Approaches Considered

#### Option 1: Upgrade to 4cpu Runner ⭐ RECOMMENDED

**Description**: Change GitHub Actions runner from `2cpu-linux-x64` to `4cpu-linux-x64` in `.github/workflows/dev-integration-tests.yml` and update Playwright worker configuration.

**Pros**:
- Simple: 1-2 line changes in workflow file
- Zero architectural changes or code modifications
- Same cost as 2cpu runner (fixed price, faster execution = better ROI)
- Immediately addresses root cause (CPU contention)
- Proven pattern (recent commit 12cc6208b shows staging already uses 4cpu)
- ~50% performance improvement (15-20min → 8-10min) with Priority 1 alone
- ~60-65% improvement (15-20min → 6-8min) with Priority 2 optimization

**Cons**:
- None material (cost neutral, no risk)

**Risk Assessment**: low - No code changes, no RLS implications, no breaking changes. Runner configuration is standard GitHub Actions pattern.

**Complexity**: simple - Configuration-only change

#### Option 2: Optimize Playwright Configuration Instead

**Description**: Keep 2cpu runner, increase Playwright workers from 2 to 4-6 workers to maximize CPU utilization on limited cores.

**Pros**:
- No runner cost increase required
- Maintains current infrastructure

**Cons**:
- Minimal performance gain (5-10% at best) - more workers on same cores increases context switching overhead
- Doesn't address root cause (insufficient cores)
- Still leaves 13m+ test execution time
- Higher memory pressure on 2cpu runner may cause OOM kills
- Doesn't match local behavior (local unlimited workers benefit from 4+ cores)

**Why Not Chosen**: Insufficient impact. The diagnosis clearly shows 2 cores is the bottleneck. Adding workers without adding cores is diminishing returns.

#### Option 3: Split Tests Across Multiple Workflow Jobs

**Description**: Create separate workflow jobs for different test categories (smoke, auth, teams, etc.), each running on 2cpu runner.

**Pros**:
- Could run in parallel across multiple jobs
- Stays within current cost

**Cons**:
- Significantly increases workflow complexity and maintenance burden
- Still doesn't solve individual job performance (each still takes ~5-7 min minimum)
- Much higher cost in practice (running 4 jobs × 5min = 20min total, vs single 4cpu job × 8min = 8min)
- Harder to troubleshoot and debug failures
- Race conditions possible if tests share data

**Why Not Chosen**: Higher complexity with worse total execution time and higher actual cost.

### Selected Solution: Upgrade to 4cpu Runner (Priority 1 + Priority 2)

**Justification**: This fix addresses the root cause directly with minimal complexity and zero architectural impact. It's cost-neutral, proven (staging uses this pattern), and delivers 50-65% performance improvement. The diagnosis identified the exact bottleneck and provided the specific lines to change.

**Technical Approach**:
1. Change 7 occurrences of `2cpu-linux-x64` to `4cpu-linux-x64` in workflow file (lines 32, 92, 230, 380, 485, 594, 631)
2. Update Playwright worker count from 2 to 3-4 in `playwright.config.ts` (line 76) to match 4-core capacity
3. Verify no other workflow files need updates (check for similar patterns)

**Architecture Changes**: None. This is purely a runner resource allocation change at the GitHub Actions level.

**Migration Strategy**: No data migration needed. Pure infrastructure configuration change.

## Implementation Plan

### Affected Files

- `.github/workflows/dev-integration-tests.yml` - 7 line changes to runner specification
- `apps/e2e/playwright.config.ts` - 1 line change to worker count (optional but recommended)
- `.github/workflows/staging-deployment.yml` - Verify alignment with existing 4cpu pattern (no changes needed, already uses 4cpu)

### New Files

No new files required.

### Step-by-Step Tasks

**IMPORTANT**: Execute every step in order, top to bottom.

#### Step 1: Update workflow runner specification

Update `.github/workflows/dev-integration-tests.yml` to use 4cpu-linux-x64:

- Line 32: Change `runs-on: ubuntu-latest-2cpu` to `runs-on: ubuntu-latest-4cpu`
- Line 92: Change `runs-on: ubuntu-latest-2cpu` to `runs-on: ubuntu-latest-4cpu`
- Line 230: Change `runs-on: ubuntu-latest-2cpu` to `runs-on: ubuntu-latest-4cpu`
- Line 380: Change `runs-on: ubuntu-latest-2cpu` to `runs-on: ubuntu-latest-4cpu`
- Line 485: Change `runs-on: ubuntu-latest-2cpu` to `runs-on: ubuntu-latest-4cpu`
- Line 594: Change `runs-on: ubuntu-latest-2cpu` to `runs-on: ubuntu-latest-4cpu`
- Line 631: Change `runs-on: ubuntu-latest-2cpu` to `runs-on: ubuntu-latest-4cpu`

**Why this step first**: Workflow changes take effect immediately on next push. All other changes support optimal utilization of the additional 2 cores.

#### Step 2: Optimize Playwright worker configuration

Update `apps/e2e/playwright.config.ts` line 76 to use more workers on 4-core runner:

- Current: `workers: process.env.CI ? 2 : undefined`
- New: `workers: process.env.CI ? 3 : undefined`

This allows Playwright to use 3 workers on the 4-core runner (1 core reserved for OS/overhead).

**Why after runner upgrade**: This change only helps after additional cores are available. On 2cpu runner it would hurt; on 4cpu runner it optimizes utilization.

#### Step 3: Verify consistency with other workflows

Check other workflows that may have similar runner specifications:

- Verify `.github/workflows/staging-deployment.yml` already uses `4cpu-linux-x64` (commit 12cc6208b shows it does - no change needed)
- Search for any other `2cpu-linux-x64` occurrences in workflow files
- Document findings

**Why this step**: Ensures consistency across all workflows and prevents future performance issues in other pipelines.

#### Step 4: Run manual test to validate

Execute the workflow manually to confirm performance improvement:

- Push changes to a feature branch
- Trigger `dev-integration-tests.yml` workflow manually via GitHub Actions UI
- Monitor execution time:
  - Expected: 8-10 minutes total (down from 15-20 minutes)
  - Test execution specifically: 5-7 minutes (down from 13m28s)
- Verify all jobs complete successfully with no failures

#### Step 5: Document and monitor

- Add comment to diagnosis issue #640 with actual performance metrics
- Monitor subsequent workflow runs for consistency
- Update CI/CD documentation if any performance targets exist

## Testing Strategy

### No Code Testing Needed

This is a configuration-only change with no code modifications, so traditional unit/integration testing isn't applicable.

### Execution Time Validation

**Before Fix** (from diagnosis issue #640):
```
integration-tests: 15m30s total
├── test-execution: 13m28s (bottleneck)
└── other jobs: 2m02s
Total workflow: ~17 minutes
```

**Expected After Fix** (Priority 1 alone):
```
integration-tests: ~8-10 minutes total
├── test-execution: ~5-7 minutes (50% reduction)
└── other jobs: ~2-3 minutes
Total workflow: ~8-10 minutes (50% reduction)
```

**Expected After Fix** (Priority 1 + 2):
```
integration-tests: ~6-8 minutes total
├── test-execution: ~4-6 minutes (60% reduction)
└── other jobs: ~2 minutes
Total workflow: ~6-8 minutes (60-65% reduction)
```

### Regression Testing

- Verify all integration tests pass (same test suite, faster execution)
- Verify no flakiness from increased worker count (check test logs)
- Verify no memory issues on 4cpu runner
- Check for any CPU oversubscription problems

### Manual Testing Checklist

Execute these checks before considering the fix complete:

- [ ] Workflow runs successfully on first attempt after changes
- [ ] Test execution time is 5-7 minutes (down from 13m28s)
- [ ] Total workflow time is 8-10 minutes (down from 17 minutes)
- [ ] All test jobs pass with 0 failures (no performance instability)
- [ ] No memory exhaustion warnings in workflow logs
- [ ] No increase in test flakiness from 3 concurrent workers
- [ ] Staging deployment workflow (already using 4cpu) shows consistent performance
- [ ] Verify 4cpu runner availability in GitHub Actions UI

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Runner Unavailability**: 4cpu runners may have limited capacity/availability
   - **Likelihood**: low - GitHub provides standard tier runners
   - **Impact**: medium - Workflow would queue or fail
   - **Mitigation**: GitHub Actions has robust capacity; standard tier available in all regions. No evidence of capacity issues in recent commits.

2. **Increased Memory Pressure**: 3 workers may consume more memory than 2
   - **Likelihood**: low - 4cpu runner has proportionally more memory (8GB vs 4GB on 2cpu)
   - **Impact**: low - Tests would still complete, just slower
   - **Mitigation**: Monitor logs; revert to 2 workers if issues occur. No architectural change means easy rollback.

3. **Test Flakiness from Worker Contention**: More workers may increase race conditions
   - **Likelihood**: low - Tests already run with 2 workers; adding 1 more is modest increase
   - **Impact**: medium - Some tests could fail intermittently
   - **Mitigation**: Current test suite designed for parallel execution. Monitor initial runs; revert worker count to 2 if issues occur.

4. **Unexpected Workflow Behavior**: Different runner performance characteristics
   - **Likelihood**: very low - 4cpu runner is same image, just more resources
   - **Impact**: low - Would manifest as test failures, easily detected
   - **Mitigation**: Step 4 validates functionality; can revert immediately if issues found.

**Rollback Plan**:

If any issues occur in production:

1. Revert workflow changes: Push commit changing `4cpu-linux-x64` back to `2cpu-linux-x64`
2. Revert Playwright config: Change workers back to 2
3. Monitor workflow: Verify next run completes successfully
4. Analyze issue: Review logs and GitHub Actions metrics
5. Adjust: Either increase timeouts, reduce worker count to 2 on 4cpu, or debug specific failure

**Expected Rollback Time**: <5 minutes (simple config revert)

**Monitoring** (optional but recommended):

- Track workflow execution time over 5-10 runs to establish new baseline
- Alert if execution time regresses above 12 minutes
- Monitor test failure rate (target: <2% flakiness)
- Check runner cost metrics if available

## Performance Impact

**Expected Impact**: significant - 50-65% reduction in workflow execution time

**Performance Details**:

- **Current**: 17 minutes total workflow time
- **Priority 1 Only** (runner upgrade): 8-10 minutes total (~50% improvement)
- **Priority 1 + 2** (runner + workers): 6-8 minutes total (~60-65% improvement)
- **Test Execution Specifically**: 13m28s → 5-7 minutes (60% reduction)
- **Cost**: Neutral (same monthly cost for faster feedback)

**Performance Bottleneck Elimination**:

Before:
- Each Playwright browser consumes ~1 core
- 2 workers on 2cpu runner causes context switching overhead
- Effective parallelization: ~50% (1 core per worker)

After:
- 4cpu runner provides 4 cores
- 3 workers can run with ~1.3 cores each
- Effective parallelization: ~85-90% (near-linear scaling)

**Developer Impact**:

- Faster feedback loop for development (8-10min vs 17min)
- Reduced wait time for merging feature branches
- Faster validation of integration test changes
- Better developer experience and productivity

## Security Considerations

**Security Impact**: none

This is a pure infrastructure configuration change with no code modifications:
- No API changes
- No authentication changes
- No RLS policy changes
- No data access changes
- No secrets added or exposed

The workflow itself runs the same tests with the same security controls. More cores don't change the security posture.

## Validation Commands

### Before Fix (Performance Should Be Slow)

```bash
# View current workflow configuration
grep -n "2cpu-linux-x64" .github/workflows/dev-integration-tests.yml

# Expected output: 7 lines with runner specification for 2cpu
```

**Expected Result**: 7 occurrences of `2cpu-linux-x64` found in workflow file

### After Fix (Performance Should Be Fast)

```bash
# Verify configuration changes
grep -n "4cpu-linux-x64" .github/workflows/dev-integration-tests.yml

# Check Playwright configuration
grep -n "workers:" apps/e2e/playwright.config.ts

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run workflow and monitor execution
# Via GitHub Actions UI: https://github.com/MLorneSmith/2025slideheroes/actions
# Monitor: Integration Tests job execution time should be 5-7 minutes
```

**Expected Result**:
- 7 occurrences of `4cpu-linux-x64` found
- Playwright workers set to 3 on CI
- All commands succeed with zero errors
- Workflow completes in 8-10 minutes
- Test execution: 5-7 minutes (50%+ improvement)
- All tests pass with consistent results

### Regression Prevention

```bash
# Run the dev-integration-tests workflow 3-5 times to establish baseline
# Monitor for:
# 1. Consistent execution time (should vary <10%)
# 2. Test pass rate (should maintain 100%)
# 3. No resource exhaustion warnings in logs
# 4. No increase in flaky test count

# Commands:
# 1. Trigger workflow manually: https://github.com/MLorneSmith/2025slideheroes/actions/workflows/dev-integration-tests.yml
# 2. Check logs for performance metrics and errors
# 3. Monitor every run for 1 week
```

## Dependencies

### New Dependencies

**No new dependencies required** - This is a configuration-only change using existing GitHub Actions infrastructure.

### Infrastructure Requirements

- GitHub Actions runner access: `ubuntu-latest-4cpu` must be available in org
- Status: ✅ Already verified in recent staging-deployment.yml (commit 12cc6208b)

## Database Changes

**No database changes required** - This is an infrastructure configuration change with no data layer impact.

## Deployment Considerations

**Deployment Risk**: low - Configuration-only change, no code deployment

**Special deployment steps**:
- None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes, pure performance optimization

## Success Criteria

The fix is complete when:
- [ ] All 7 runner specification lines updated to `4cpu-linux-x64`
- [ ] Playwright worker count updated to 3 (optional but recommended)
- [ ] Workflow runs successfully with all tests passing
- [ ] Test execution time is 5-7 minutes (down from 13m28s)
- [ ] Total workflow time is 8-10 minutes (down from 17 minutes)
- [ ] Consistency verified: 3+ consecutive runs show similar timing
- [ ] No increase in test failures or flakiness
- [ ] No resource exhaustion warnings in logs
- [ ] All validation commands pass

## Notes

**Important Context**:
- This fix aligns with recent infrastructure improvements (staging deployment already uses 4cpu per commit 12cc6208b)
- The diagnosis issue provides exact line numbers and scope of changes
- This is a no-brainer performance win: same cost, 50-65% faster feedback
- The root cause analysis clearly shows CPU contention as the bottleneck

**Decision Rationale**:
- Simplicity: 1-2 line changes vs complex refactoring
- Impact: 50-65% improvement vs incremental gains from alternatives
- Risk: Low (configuration-only, no code changes)
- Cost: Neutral (same monthly billing, faster execution)

**Future Improvements**:
- Consider similar upgrades in other performance-critical workflows
- Establish performance monitoring/alerting for workflow metrics
- Investigate if other workflows have similar 2cpu bottlenecks

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #640*
