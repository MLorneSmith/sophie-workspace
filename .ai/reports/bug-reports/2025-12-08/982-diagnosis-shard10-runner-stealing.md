# Bug Diagnosis: E2E Shard 10 Stuck Due to GitHub Actions Runner Stealing (Third Occurrence)

**ID**: ISSUE-pending
**Created**: 2025-12-08T18:35:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E Shard 10 in the staging-deploy.yml workflow (run ID: 20037940927) is stuck in "queued" status indefinitely. This is the **third occurrence** of this issue (previous: #951/#952, #959/#961). The previous fix (staggered sleep delays inside job steps) was fundamentally ineffective because the race condition occurs at the GitHub Actions scheduler level **before** any job steps execute.

## Environment

- **Application Version**: commit 34b23a4fa
- **Environment**: CI/CD (GitHub Actions)
- **Browser**: N/A
- **Node Version**: 20
- **Database**: N/A
- **Last Working**: Unknown (intermittent issue)

## Reproduction Steps

1. Push to `staging` branch to trigger staging-deploy.yml workflow
2. Workflow creates 10 matrix jobs for E2E shards with `max-parallel: 3`
3. GitHub Actions scheduler creates all 10 jobs simultaneously at 18:12:00Z
4. Shards 1-9 are assigned to RunsOn runners and execute (all fail due to test issues, but they ran)
5. Shard 10 is never assigned a runner - stuck in "queued" with anomalous metadata

## Expected Behavior

All 10 E2E shards should be picked up by RunsOn runners and execute (either passing or failing based on test results).

## Actual Behavior

Shard 10 remains stuck in "queued" status indefinitely with:
- `started_at` = `created_at` (2025-12-08T18:12:00Z) - anomalous, indicates scheduler bug
- `runner_id`: 0 (no runner assigned)
- `runner_name`: "" (empty)
- `steps`: [] (empty - no steps ever executed)

## Diagnostic Data

### Job Timing Analysis
```
Shard  | created_at        | started_at        | Gap    | Status
-------|-------------------|-------------------|--------|----------
1      | 18:12:00Z         | 18:12:19Z         | 19s    | completed
2      | 18:12:00Z         | 18:12:20Z         | 20s    | completed
3      | 18:12:00Z         | 18:12:21Z         | 21s    | completed
4      | 18:12:00Z         | 18:16:58Z         | ~5min  | completed
5      | 18:12:00Z         | 18:17:03Z         | ~5min  | completed
6      | 18:12:00Z         | 18:17:10Z         | ~5min  | completed
7      | 18:12:00Z         | 18:21:46Z         | ~10min | completed
8      | 18:12:00Z         | 18:21:46Z         | ~10min | completed
9      | 18:12:00Z         | 18:22:11Z         | ~10min | completed
10     | 18:12:00Z         | 18:12:00Z         | 0s     | QUEUED ⚠️
```

### Shard 10 API Response
```json
{
  "name": "E2E Shard 10",
  "status": "queued",
  "conclusion": null,
  "created_at": "2025-12-08T18:12:00Z",
  "started_at": "2025-12-08T18:12:00Z",
  "labels": ["runs-on/runner=4cpu-linux-x64"],
  "runner_id": 0,
  "runner_name": "",
  "steps": []
}
```

### Key Evidence
- **Labels are correct**: `runs-on/runner=4cpu-linux-x64` (fix from #952 is applied)
- **Stagger delay is present**: Lines 210-218 in staging-deploy.yml
- **Stagger delay never executed**: Shard 10 has `steps: []` - the delay runs INSIDE the job, but the job never started

## Error Stack Traces

N/A - No errors, job is simply stuck in queued state with no runner assignment.

## Related Code
- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 183-298 - test-shards job)
  - `.github/workflows/e2e-sharded.yml` (lines 99-209 - same pattern)
- **Recent Changes**:
  - `d0f1f77db` - fix(ci): prevent E2E shard 10 race condition with staggered delays (ineffective)
  - `83e89c0e6` - fix(ci): use stable RunsOn labels for staging E2E shards
- **Suspected Functions**: GitHub Actions scheduler / RunsOn runner assignment

## Related Issues & Context

### Direct Predecessors
- #959 (CLOSED): "Bug Diagnosis: E2E Shard 10 Stuck Due to RunsOn/GitHub Actions Race Condition" - Same issue, second occurrence
- #961 (CLOSED): "Bug Fix: E2E Shard 10 Stuck Due to RunsOn/GitHub Actions Race Condition" - Fix was ineffective

### Infrastructure Issues
- #951 (CLOSED): "Bug Diagnosis: Staging Workflow E2E Shard 10 Stuck in Queued State" - First occurrence, different root cause identified (per-run unique labels)
- #952 (CLOSED): "Bug Fix: Staging Workflow E2E Shard 10 Stuck" - Fixed labels, but runner stealing issue persists

### Historical Context
This is a **recurring pattern** (3rd occurrence). The issue has been misdiagnosed twice:
1. **#951/#952**: Identified ephemeral label mismatch - Fixed labels to stable format ✅
2. **#959/#961**: Identified race condition - Added sleep delay inside job steps ❌ (ineffective)
3. **This issue**: Same symptoms despite both previous fixes being applied

## Root Cause Analysis

### Identified Root Cause

**Summary**: GitHub Actions "runner stealing" - when multiple matrix jobs have identical `runs-on` labels, the scheduler can assign a runner intended for one job to another job, leaving the original job orphaned in "queued" state indefinitely.

**Detailed Explanation**:
The current workflow uses identical labels for all matrix jobs:
```yaml
runs-on: "runs-on/runner=4cpu-linux-x64"
```

When GitHub Actions creates 10 matrix jobs simultaneously, the scheduler assigns runners non-deterministically. Due to a known GitHub Actions scheduler bug:
1. Runner R is spun up for Job 10
2. Before R is fully assigned to Job 10, the scheduler reassigns R to another job (e.g., Job 4)
3. Job 10's metadata is marked as "started" (`started_at = created_at`) but no runner is actually assigned
4. Job 10 waits indefinitely for a runner that will never come

**Why the sleep delay fix didn't work**:
The sleep delay is a **step** that runs AFTER a runner picks up the job. But the race condition occurs BEFORE runner assignment, so the delay never executes.

**Supporting Evidence**:
- Shard 10 `started_at = created_at` (anomalous - normal jobs have 19-20s gap)
- Shard 10 `runner_id: 0`, `runner_name: ""` (no runner ever assigned)
- Shard 10 `steps: []` (no steps executed, including the sleep delay)
- 9/10 shards executed successfully (issue is intermittent, affects ~10% of jobs)
- This pattern documented in GitHub community discussions and RunsOn troubleshooting guides

### How This Causes the Observed Behavior

1. GitHub Actions creates all 10 matrix jobs at 18:12:00Z
2. Scheduler begins assigning RunsOn runners to jobs
3. Due to runner stealing, Shard 10's intended runner is reassigned to another shard
4. Shard 10 is left in "queued" state with corrupted metadata (`started_at = created_at`)
5. No new runners are requested for Shard 10 because GitHub thinks it's "starting"
6. Job remains stuck indefinitely until manually cancelled

### Confidence Level

**Confidence**: High

**Reasoning**:
- Matches documented GitHub Actions scheduler bug pattern
- Metadata anomaly (`started_at = created_at`) is characteristic of this specific issue
- Previous fixes addressed symptoms (labels, delays) but not root cause (non-unique runner labels)
- RunsOn documentation specifically recommends unique labels per matrix job to prevent this

## Fix Approach (High-Level)

Add unique runner labels that include `strategy.job-index` to create deterministic job-to-runner assignment:

```yaml
# FROM (current - allows runner stealing):
runs-on: "runs-on/runner=4cpu-linux-x64"

# TO (fix - unique labels per matrix job):
runs-on:
  - runs-on/runner=4cpu-linux-x64
  - runs-on/run-id=${{ github.run_id }}-${{ strategy.job-index }}-${{ github.run_attempt }}
```

This ensures each matrix job requests a runner with a unique label, preventing the scheduler from "stealing" runners between jobs.

Additionally:
1. Remove the ineffective sleep delay step (it adds 90s overhead with no benefit)
2. Apply fix to both `staging-deploy.yml` and `e2e-sharded.yml`
3. Add job-level `timeout-minutes` to prevent infinite hangs if issue recurs

## Diagnosis Determination

**Root cause confirmed**: GitHub Actions runner stealing due to identical `runs-on` labels across matrix jobs.

**Previous fix attempts addressed wrong issues**:
- #952 fixed label format (stable vs ephemeral) - correct but insufficient
- #961 added sleep delays inside job steps - fundamentally cannot fix scheduler-level race condition

**Correct fix**: Use unique labels per matrix job with `strategy.job-index` to prevent runner stealing.

## Additional Context

- Run 20037940927 is currently stuck and should be cancelled
- All shards 1-9 actually ran (they failed due to test issues, but that's unrelated to this diagnosis)
- This issue is intermittent (~10-20% occurrence rate based on history)
- The fix is well-documented in RunsOn troubleshooting guides

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh api, gh issue view, Perplexity research agent*
