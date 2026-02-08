# Bug Diagnosis: Staging Workflow E2E Shard 10 Stuck in Queued State

**ID**: ISSUE-pending
**Created**: 2025-12-07T20:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The staging-deploy.yml workflow triggered by schedule on 2025-12-07 has E2E Shard 10 stuck in "queued" status for 17+ hours while all other shards (1-9) completed. The root cause is the combination of ephemeral RunsOn runners with per-run unique labels (`runs-on=${{ github.run_id }}/runner=4cpu-linux-x64`) and `max-parallel: 3` matrix constraint, which causes runner label mismatch after earlier runners terminate.

## Environment

- **Application Version**: dev branch (commit from schedule trigger)
- **Environment**: CI/CD (GitHub Actions)
- **Browser**: N/A
- **Node Version**: 20.x
- **Database**: N/A
- **Last Working**: Previous scheduled runs also failed similarly (see run history)

## Reproduction Steps

1. Workflow triggers on schedule (cron: '0 2 * * 0') or push to staging
2. 10 E2E shard jobs are created with `max-parallel: 3`
3. First 3 shards start on ephemeral RunsOn runners
4. As shards complete, runners terminate and unregister (becoming "offline")
5. Next batch of shards start on new ephemeral runners
6. Process continues until Shard 10 - by this point, all previous runners are destroyed
7. Shard 10 waits for a runner matching label `runs-on=19997869115/runner=4cpu-linux-x64`
8. No runner with this exact label exists (they were ephemeral and terminated)
9. Job remains stuck in "queued" indefinitely

## Expected Behavior

All 10 E2E shards should complete execution, with Shard 10 being picked up by an available runner after earlier shards finish.

## Actual Behavior

E2E Shard 10 remains stuck in "queued" status for 17+ hours. The runner shows as "offline" status. The workflow run shows overall status as "queued" because one job hasn't started.

## Diagnostic Data

### Console Output
```
gh run view 19997869115 output:
* E2E Shard 10 (ID 57348489796) - status: queued

Runner status:
{"busy":false,"labels":["runs-on=19997869115/runner=4cpu-linux-x64"],"name":"runs-on--i-023d92a2ab32ac999--HuvSPiRojw","status":"offline"}
```

### Job Timeline Analysis
```json
Shard 10 created: 2025-12-07T02:52:01Z (first in queue)
Shards 1-3 started: 2025-12-07T02:52:20-21Z (max-parallel: 3)
Shards 1-3 completed: 2025-12-07T02:56:25-57Z
Shards 4-6 started: 2025-12-07T02:56:27-57:08Z
Shards 4-6 completed: 2025-12-07T03:00:17-57Z
Shards 7-9 started: 2025-12-07T03:00:18-58Z
Shards 7-9 completed: 2025-12-07T03:04:05-46Z
Shard 10: Still queued (17+ hours later)
```

### Network Analysis
```
N/A - This is a runner scheduling issue, not a network issue
```

### Database Analysis
```
N/A - This is a CI/CD issue, not a database issue
```

### Performance Metrics
```
N/A - Job never started
```

### Screenshots
- Workflow run: https://github.com/slideheroes/2025slideheroes/actions/runs/19997869115

## Error Stack Traces
```
No stack trace - job never started execution. The issue is at the GitHub Actions scheduler level.
```

## Related Code
- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 183-196: test-shards job configuration)
- **Recent Changes**:
  - 52b6fcdb2 fix(ci): add PLAYWRIGHT_BASE_URL to staging E2E test shards
  - a74b18a69 perf(ci): implement sharded E2E tests for staging deploy
  - 9759ea954 perf(ci): upgrade runners to 4cpu for 50% faster CI execution
- **Suspected Functions**:
  - `runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64` syntax
  - `max-parallel: 3` matrix configuration

## Related Issues & Context

### Direct Predecessors
- Previous scheduled workflow runs have similar patterns of partial failures

### Related Infrastructure Issues
- Runner syntax was previously fixed in commit 4a9f474e8 and a852aca4c

### Similar Symptoms
- Auto-rollback workflow disabled due to "reusable workflow causes startup_failure" (comment in staging-deploy.yml lines 645-656)

### Historical Context
- The `runs-on=${{ github.run_id }}/runner=...` syntax was introduced as a fix for previous runner issues
- This pattern creates unique per-run labels that conflict with ephemeral runner lifecycle

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `runs-on=${{ github.run_id }}/runner=4cpu-linux-x64` syntax creates unique per-workflow-run labels that become orphaned when ephemeral RunsOn runners terminate after completing their assigned jobs.

**Detailed Explanation**:

1. **RunsOn uses ephemeral runners**: Each job gets a fresh VM that terminates immediately after the job completes. This is by design for security and cost efficiency.

2. **Per-run unique labels**: The syntax `runs-on=${{ github.run_id }}/runner=4cpu-linux-x64` creates labels like `runs-on=19997869115/runner=4cpu-linux-x64` that are unique to each workflow run.

3. **Label mismatch after runner termination**: When Shards 1-3 complete, their runners terminate and unregister from GitHub. The label `runs-on=19997869115/runner=4cpu-linux-x64` is no longer associated with any active runner.

4. **New runners get new labels**: When new runners spin up for Shards 4-6, they might get assigned the same run_id label OR might not register in time before the GitHub scheduler gives up waiting.

5. **Race condition with Shard 10**: By the time Shard 10 needs a runner, all previous runners have terminated. A new runner would need to register with the exact label `runs-on=19997869115/runner=4cpu-linux-x64`, but ephemeral runners may not re-register with old run IDs.

6. **Infinite wait**: GitHub Actions scheduler keeps waiting for a runner with the matching label, which will never appear because all ephemeral runners for this run have been destroyed.

**Supporting Evidence**:
- Runner status shows `"status":"offline"` for the only registered runner with this run's label
- Shard 10 was created at `02:52:01Z` but Shards 1-3 started at `02:52:20-21Z` - indicating Shard 10 was queued first but skipped
- All 9 other shards used different runner instances (unique instance IDs in runner names)
- The pattern `runs-on--i-XXXXX--YYYYY` shows each shard got a unique ephemeral VM

### How This Causes the Observed Behavior

1. Workflow triggers at 02:45:46Z (schedule)
2. GitHub creates 10 E2E Shard jobs with `max-parallel: 3`
3. Jobs are queued in order (Shard 10 first at 02:52:01Z based on job creation time)
4. RunsOn provisions 3 ephemeral VMs for first 3 shards
5. After Shards 1-3 complete, their VMs terminate
6. New VMs spin up for Shards 4-6, then 7-9
7. When Shard 10's turn comes, no VM is available with the run-specific label
8. Shard 10 waits indefinitely for a runner that will never appear

### Confidence Level

**Confidence**: High

**Reasoning**:
- The runner status explicitly shows "offline" for the only registered runner with this run's label
- The timing data shows Shard 10 was created before other shards started but was never picked up
- All 9 completed shards used unique ephemeral runner instances
- This pattern is consistent with known behavior of ephemeral runners + per-run unique labels
- Research confirms this is a known issue with RunsOn ephemeral runner + unique label combinations

## Fix Approach (High-Level)

1. **Immediate**: Cancel the stuck workflow run and re-trigger to unblock CI

2. **Short-term**: Change the runner syntax from per-run unique labels to stable labels:
   ```yaml
   # FROM:
   runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64

   # TO (option A - RunsOn recommended syntax):
   runs-on: "runs-on/runner=4cpu-linux-x64"

   # OR (option B - stable self-hosted labels):
   runs-on: [self-hosted, linux, x64, 4cpu]
   ```

3. **Alternative**: Remove `max-parallel: 3` constraint to allow all shards to request runners simultaneously, reducing the timing dependency on runner registration

## Diagnosis Determination

The root cause has been conclusively identified: the combination of ephemeral RunsOn runners with per-run unique labels (`${{ github.run_id }}`) creates a runner registration/deregistration race condition when using `max-parallel` matrix constraints.

The fix is straightforward: use stable runner labels instead of per-run unique labels. This will allow new ephemeral runners to match queued jobs regardless of when they register.

## Additional Context

- The scheduled run triggered from the `dev` branch, not `staging` - this is also a configuration issue (schedule trigger doesn't filter by branch in the same way push does)
- Multiple previous workflow runs also show failures, suggesting this is a recurring pattern
- The workflow has a TODO comment about auto-rollback being disabled due to similar runner issues with reusable workflows

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git log, Read tool, Task tool (perplexity-expert research agent)*
