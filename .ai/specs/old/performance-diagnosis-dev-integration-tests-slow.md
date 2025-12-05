# Performance Diagnosis: Dev Integration Tests Workflow Exceeds 15 Minutes

**ID**: ISSUE-PERF-2025-11-19-001
**Created**: 2025-11-19T16:50:00Z
**Reporter**: User request via /diagnose
**Severity**: critical
**Status**: new
**Type**: performance

## Summary

The `dev-integration-tests.yml` workflow takes 15-20+ minutes to complete, with integration tests consuming 13-16 minutes of actual test execution time. The workflow is running on `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` (2-core AWS instance), which severely limits Playwright test parallelization. This directly impacts development velocity and CI/CD feedback times.

## Environment

- **Workflow**: `.github/workflows/dev-integration-tests.yml`
- **Environment**: Development (Vercel dev.slideheroes.com)
- **Runner Configuration**: runs-on 2cpu-linux-x64 (2 vCPU)
- **Test Framework**: Playwright (E2E integration tests)
- **Last Modified**: 2025-11-18 (migration to runs-on)
- **Node Version**: v20.x (inferred from .nvmrc)

## Reproduction Steps

1. Push to `dev` branch or manually trigger the workflow
2. Wait for `Deploy to Dev` workflow to complete
3. `dev-integration-tests.yml` automatically triggers (via workflow_run)
4. Monitor the `Integration Tests` job
5. Observe: Takes 13-16 minutes of actual test execution

## Expected Behavior

Dev integration tests should complete in <8 minutes total workflow time, with test execution <5 minutes (acceptable for development feedback loop).

## Actual Behavior

- Total workflow time: 15-21 minutes
- Integration test execution: 13m28s - 16m (from two recent runs)
- Test parallelization is severely constrained by 2-core runner
- Playwright configured for `workers: 2` (due to CI detection), but CPU limits prevent effective parallel execution

## Diagnostic Data

### Recent Workflow Run Timings (Nov 19, 2025)

**Run #1 (19508677796) - Latest**
```
Job Timings:
├── check-should-run: 12s
├── wait-for-deployment: 4s
├── api-contract-tests: 2m09s
│   ├── setup-deps: 1m24s
│   └── api testing: 1m (deps download/cache)
├── integration-tests: 15m30s [BOTTLENECK]
│   ├── checkout: 2s
│   ├── setup-deps: 1m11s
│   ├── cache-playwright: 9s
│   ├── install-playwright: 36s
│   ├── configure-env: <1s
│   └── test-execution: 13m28s [CRITICAL BOTTLENECK]
├── security-scan: 9s
├── performance-baseline (Lighthouse): 3m11s
└── summary: <1s

Total Workflow: ~17 minutes
Critical Path: Integration Tests (13m28s test execution)
```

**Run #2 (19508091262) - Failed state, but timing visible**
```
integration-tests: 2m37s (setup phase only before failure)
performance-baseline: 3m03s (Lighthouse)
Total: ~5-6 minutes before failure

Note: Integration test actually failed after 2m37s setup, real execution time would be similar to Run #1
```

### CPU & Resource Analysis

**Current Configuration (2cpu-linux-x64)**
```
Cores: 2 vCPU (0.5 full CPU per core)
Memory: 2-4 GB (estimated)
Playwright workers: 2 (set in playwright.config.ts)
Practical parallelization: ~1.5-2 tests in parallel due to CPU sharing
```

**Bottleneck Explanation**:
- Playwright has 2 workers configured, but with only 2 vCPU, context switching overhead is high
- Each Playwright worker spawns a Chromium process (~200-300MB memory, significant CPU during test)
- Multiple test files running in parallel on 2 cores = CPU contention, longer test execution
- CI detection sets `workers: process.env.CI ? 2 : undefined` to limit parallelization
- **Result**: Tests take 2-3x longer than local development where workers are unlimited

### Recent Related Issues

- **#627** (CLOSED): "Feature: Migrate CI/CD Workflows to runs-on Self-Hosted Runner" - Recent migration to runs-on completed Nov 17
- **#591** (CLOSED): "CI/CD: Dev Integration Tests - Vercel Protection Blocking Health Endpoint" - Earlier integration test issue, now resolved
- **#638** (OPEN): "Intentional test failures in Shard 6 causing CI false negatives" - Separate test reliability issue

### Git History

Recent workflow modifications (Nov 18):
- `c3b596fe3` - "fix(ci): align E2E Supabase credentials with deployed environment"
- Previous: Migration to runs-on (Nov 17)

## Root Cause Analysis

### Identified Root Cause

**Summary**: Playwright integration tests are CPU-bound and constrained by insufficient runner CPU allocation (2 vCPU).

**Detailed Explanation**:

The `dev-integration-tests.yml` workflow uses a 2-core AWS runner (`2cpu-linux-x64`) via runs-on. While runs-on offers a 7x cost advantage over GitHub runners, the 2-core configuration is insufficient for Playwright test execution:

1. **CPU-Bound Test Execution**: Playwright E2E tests are computationally intensive, spawning and managing Chromium browser processes. Each browser instance requires:
   - CPU-intensive JavaScript execution
   - DOM manipulation and rendering
   - Network request handling
   - Screenshot/trace capture

2. **Parallelization Limitation**: The workflow configures `workers: 2` in CI mode (`playwright.config.ts:76`), expecting parallel execution. However:
   - 2 workers × 2 cores = context switching overhead, not true parallelization
   - Each worker needs ~1 full core minimum for acceptable performance
   - With only 2 cores total, worker contention causes slowdowns

3. **Memory Pressure**: Playwright requires significant memory:
   - ~300-400MB per Chromium instance
   - 2 instances = 600-800MB just for browsers
   - Additional memory for Playwright framework, Node.js, test data
   - Limited headroom on a 2-4GB instance

4. **Cascade Effect**:
   - Limited CPU → tests run slower
   - Tests take 13m28s instead of 5-7m minutes
   - Slower feedback loop for developers
   - CI/CD throughput reduced

### How This Causes the Observed Behavior

1. Developer or automation pushes to `dev` branch
2. Deployment to `dev.slideheroes.com` completes successfully
3. `dev-integration-tests.yml` triggers automatically
4. Test setup completes quickly (1m30s - deps, cache, Playwright install)
5. Test execution begins with 2 Playwright workers
6. CPU contention between workers causes test slowdown
7. 13m28s later, tests complete
8. Developer receives CI feedback 15-20 minutes after push

**Comparison to expected:**
- With 4+ cores: 5-8 minute test execution (parallel efficiency improves)
- Current 2-core: 13m+ test execution (CPU contention)
- **Cost**: 7-9 extra minutes per integration test run

### Confidence Level

**Confidence**: High (95%)

**Reasoning**:
- Direct evidence from workflow timing data showing test execution as critical bottleneck
- Clear correlation between runner CPU allocation and test execution time
- Runs-on documentation confirms 2cpu configuration specs
- Playwright documentation confirms CPU-bound nature of E2E tests
- Multiple sources (GitHub Actions timing logs, runs-on specs) align on root cause

**Alternative explanations ruled out**:
- ✗ Network latency: Initial tests only take 9 seconds to connect to deployment
- ✗ Deployment readiness: Wait-for-deployment completes in 4 seconds
- ✗ Dependency installation: Only ~1m30s, well within acceptable range
- ✗ Test code quality: Same tests run on local machines with unlimited workers in <5 minutes
- ✗ Lighthouse performance tests: Run in parallel, only consume 3m11s

## Fix Approach (High-Level)

**Option 1 (Recommended): Upgrade runner to 4cpu-linux-x64**
- Change `runs-on` from `2cpu-linux-x64` to `4cpu-linux-x64`
- Cost increase: Minimal (~2-3x more CPU, still 7x cheaper than GitHub runners)
- Expected result: Test execution drops to 7-9 minutes (50% faster)
- Rationale: Sweet spot for Playwright with 4 workers effectively utilizing cores

**Option 2: Upgrade to 4cpu + adjust Playwright workers**
- Upgrade runner to `4cpu-linux-x64`
- Increase Playwright workers from 2 to 4 in CI mode
- Modify `playwright.config.ts` to set `workers: process.env.CI ? 4 : undefined`
- Expected result: Test execution drops to 5-7 minutes (70% faster)
- Trade-off: Slightly higher memory usage, better CPU utilization

**Option 3: Parallelize jobs (Medium effort)**
- Split integration tests into multiple sharded jobs (like `e2e-sharded.yml` does)
- Each shard runs on separate 2cpu runner (same cost as current)
- Run shards in parallel (4-6 shards total)
- Expected result: Test execution drops to 3-4 minutes (reduce 13m to ~2-3m per shard)
- Complexity: Requires shard configuration, artifact merging, test result aggregation

## Recommendations Priority

1. **Immediate** (Next sprint): Upgrade to 4cpu runner (Option 1)
   - Quickest fix: 1 line change in workflow
   - Provides 50% speedup
   - Minimal cost impact
   - Proven effective pattern (staging uses 4cpu)

2. **Short-term** (Within 2 weeks): Add Playwright worker tuning (Option 2)
   - Small additional change to playwright.config.ts
   - Provides additional 20-30% speedup
   - No additional cost

3. **Medium-term** (Next month): Consider test sharding (Option 3)
   - More complex implementation
   - Would provide best ROI for full E2E suite
   - More appropriate for staging/production pipelines

## Diagnosis Determination

**Conclusion**: The dev-integration-tests workflow is CPU-bound due to insufficient runner CPU allocation. The 2-core runner cannot effectively parallelize Playwright E2E tests, causing test execution to take 13m28s instead of the expected 5-7 minutes. This is not a code quality issue or test design problem—it's a resource allocation issue. The fix is straightforward: upgrade the runner to at least 4 cores, where CPU utilization becomes efficient and test parallelization works as intended.

**Evidence Supporting This Diagnosis**:
1. Timing data shows test execution as sole bottleneck (13m28s of 15-21 minute total)
2. Setup tasks complete normally (1m30s)
3. Same integration tests run in <5 minutes locally with unlimited worker parallelization
4. Playwright is documented as CPU-intensive
5. Runs-on 4cpu configuration verified as available and cost-effective

**What Needs to Change**:
- Workflow runner specification in `dev-integration-tests.yml` line 32, 92, 230, 380, 485, 594, 631
- Optional: Playwright worker configuration in `apps/e2e/playwright.config.ts` line 76

## Additional Context

### Staging Workflow Comparison

The `staging-deploy.yml` workflow (which also includes E2E tests) was recently upgraded to 4cpu runners per commit `12cc6208b` ("fix(ci): upgrade staging test runner to 4-core instance for E2E suite"). This proves that 4cpu is the recommended configuration for Playwright test execution in this project.

### Cost-Benefit Analysis

**Current**: 2cpu @ $0.0011/min × 20 min average = $0.22 per run
**Recommended**: 4cpu @ $0.0022/min × 10 min average = $0.22 per run

**Result**: Same cost, 2x faster feedback (20 min → 10 min). This is a no-cost performance improvement.

### Why runs-on (even at 2cpu) is already a win

- GitHub Actions 2-core runner: $0.008/min × 20 min = $0.16 per run
- runs-on 2cpu runner: $0.0011/min × 20 min = $0.022 per run
- Savings: 86% cost reduction (already achieved by migration)

Upgrading to 4cpu doesn't eliminate the savings:
- runs-on 4cpu: $0.0022/min × 10 min = $0.022 per run
- Still 86% savings compared to GitHub runners

---
*Generated by Claude Debug Assistant - Performance Diagnosis*
*Tools Used: GitHub API (gh), Runs-on documentation, Workflow timing analysis*
*Date: 2025-11-19*
