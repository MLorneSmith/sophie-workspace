# Investigation Summary: E2E Workflow Matrix Jobs Not Created for workflow_dispatch

**Issue**: #1700 (Bug Plan), #1698 (Diagnosis)
**Date**: 2026-01-21
**Status**: Unresolved - Root cause still unknown

## Problem Statement

When triggering the E2E sharded workflow via `workflow_dispatch`, GitHub Actions fails to create the 12 matrix jobs in the `e2e-shards` job. Only 2 jobs are created:
1. Setup Test Server
2. E2E Test Report

When triggered via `pull_request`, all 14 jobs are created correctly (setup + 12 shards + report).

## Timeline of Fix Attempts

### Attempt 1: Add `if: success()` to e2e-shards
- **Hypothesis**: Explicit success condition would help GitHub schedule matrix jobs
- **Result**: Failed - matrix jobs still not created

### Attempt 2: `if: ${{ !failure() && !cancelled() }}`
- **Hypothesis**: Alternative condition syntax might work
- **Result**: Failed - matrix jobs still not created

### Attempt 3: `if: ${{ always() && needs.setup-server.result == 'success' }}`
- **Hypothesis**: Explicit check of parent job result
- **Result**: Failed - matrix jobs still not created

### Attempt 4: Move dependabot check to step-level, use output in e2e-shards `if:`
- **Hypothesis**: Job-level `if:` checking outputs might work differently
- **Result**: Failed - ANY job-level `if:` condition prevents matrix creation

### Attempt 5: Remove ALL job-level `if:` conditions from e2e-shards (Current State)
- **Hypothesis**: No `if:` condition at all should allow matrix creation
- **Result**: STILL FAILED - matrix jobs not created for workflow_dispatch

## Current Workflow Configuration

```yaml
# e2e-shards job (no job-level if: condition)
e2e-shards:
  name: E2E Shard ${{ matrix.shard }}
  needs: setup-server
  # NOTE: No job-level if: condition here - this is intentional!
  runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
  strategy:
    fail-fast: false
    max-parallel: ${{ github.event.inputs.max_parallel || 3 }}
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  steps:
    - name: Check if should skip
      # Step-level skip check instead of job-level
```

## Key Observations

### Comparison of Two Runs

| Attribute | workflow_dispatch Run | pull_request Run |
|-----------|----------------------|------------------|
| Run ID | 21219442642 | 21219662809 |
| Jobs Created | 2 | 14 |
| SHA | 5b29ae370 | 0f214092a |
| Branch | dev | dependabot/... |
| Actor | User | dependabot[bot] |
| Matrix Jobs | NOT created | Created |

### Contradictions Discovered

1. **Same workflow file version** (no job-level `if:` on e2e-shards) produces different results for different triggers
2. **Dependabot PR created all matrix jobs** even though our step-level logic should skip them
3. **workflow_dispatch creates NO matrix jobs** even with no job-level conditions

### Research Findings (Perplexity)

1. GitHub Actions documentation states: "The `jobs.<job_id>.if` condition is evaluated BEFORE `jobs.<job_id>.strategy.matrix` is applied"
2. Recommended fix was to move conditional logic to step-level (we did this)
3. No known GitHub bug that prevents matrix jobs for workflow_dispatch specifically
4. Matrix mechanism should be trigger-agnostic

## Hypotheses Still To Test

1. **RunsOn Label Issue**: The `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` label might behave differently for workflow_dispatch. However, this same label works for PR triggers.

2. **GitHub Actions Caching**: GitHub might be caching an older version of the workflow file for workflow_dispatch triggers.

3. **Timing Issue**: Matrix jobs might be created lazily after the parent job completes (needs more time to observe).

4. **GitHub Actions Bug**: There may be an undocumented bug specific to workflow_dispatch + matrix + needs dependencies.

5. **Branch/Ref Issue**: workflow_dispatch might read the workflow file from a different ref than expected.

## Files Modified

- `.github/workflows/e2e-sharded.yml` - Multiple iterations removing/adding `if:` conditions

## Next Steps to Try

1. **Wait longer** after setup-server completes to see if matrix jobs appear
2. **Remove the `needs:` dependency** entirely to see if that's the blocker
3. **Test with a minimal workflow** that only has workflow_dispatch + matrix to isolate the issue
4. **Check GitHub Actions status page** for any ongoing issues
5. **Contact GitHub Support** if the issue persists after eliminating all variables

## Current Run (In Progress)

- Run ID: 21220209359
- Status: Setup Test Server running
- Jobs at last check: 1 (only setup-server)
- Waiting to see if matrix jobs appear after setup completes

## Conclusion

Despite removing ALL job-level `if:` conditions from the `e2e-shards` job, matrix jobs are still not being created for `workflow_dispatch` triggers. The same workflow file correctly creates matrix jobs for `pull_request` triggers. This behavior contradicts both GitHub Actions documentation and our research findings.

The root cause remains unknown. This may be:
- A GitHub Actions platform bug
- An interaction with RunsOn self-hosted runners
- An undocumented behavior of workflow_dispatch + matrix + needs combinations
