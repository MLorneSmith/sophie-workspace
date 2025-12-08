# Bug Diagnosis: E2E Shard 10 Stuck in Queued State Due to RunsOn/GitHub Actions Race Condition

**ID**: ISSUE-959
**Created**: 2025-12-08T14:24:00Z
**Reporter**: user/msmith
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E Shard 10 in the staging-deploy.yml workflow (run ID: 20009743958) is stuck in "queued" status for 18+ hours despite the fix from issues #951/#952 being applied. This is a **different root cause** than the original issue - the stable RunsOn labels ARE working correctly, but Shard 10 entered an anomalous state where its `started_at` timestamp equals `created_at` yet no runner was ever assigned.

## Environment

- **Application Version**: 83e89c0e62fdc949b3f6c4849df5e28dd937811c
- **Environment**: CI/CD (GitHub Actions)
- **Workflow**: `.github/workflows/staging-deploy.yml`
- **Run ID**: 20009743958
- **Trigger**: push to staging branch
- **Node Version**: N/A (CI runner)
- **Last Working**: 2025-12-05 (before E2E sharding was added)

## Reproduction Steps

1. Push to `staging` branch to trigger `staging-deploy.yml`
2. Workflow creates 10 E2E shard jobs with `max-parallel: 3`
3. All 10 jobs created at the same timestamp (20:22:43Z)
4. Shards 1-3 start ~20 seconds later (first batch)
5. Shards 4-9 start and complete in subsequent batches
6. Shard 10 shows `started_at = created_at` but no runner ever picks it up
7. Shard 10 remains in "queued" state indefinitely

## Expected Behavior

Shard 10 should be picked up by a RunsOn runner after the third batch (Shards 7-9) completes, and execute its E2E tests.

## Actual Behavior

Shard 10 remains stuck in "queued" status for 18+ hours with:
- `status: queued`
- `conclusion: null`
- `runner_name: ""` (no runner assigned)
- `started_at: 2025-12-07T20:22:43Z` (equals `created_at` - anomalous)
- `labels: ["runs-on/runner=4cpu-linux-x64"]` (correct stable label)

## Diagnostic Data

### Job Timeline Analysis

```
Job                 | Created      | Started      | Completed    | Runner Assigned
--------------------|--------------|--------------|--------------|----------------
E2E Shard 1         | 20:22:43     | 20:23:03     | 20:27:42     | Yes
E2E Shard 2         | 20:22:43     | 20:23:02     | 20:27:34     | Yes
E2E Shard 3         | 20:22:43     | 20:23:02     | 20:26:55     | Yes
E2E Shard 4         | 20:22:43     | 20:27:05     | 20:30:52     | Yes
E2E Shard 5         | 20:22:43     | 20:27:35     | 20:31:29     | Yes
E2E Shard 6         | 20:22:43     | 20:27:43     | 20:30:46     | Yes
E2E Shard 7         | 20:22:43     | 20:30:48     | 20:34:39     | Yes
E2E Shard 8         | 20:22:43     | 20:30:53     | 20:34:39     | Yes
E2E Shard 9         | 20:22:43     | 20:31:30     | 20:35:21     | Yes
E2E Shard 10        | 20:22:43     | 20:22:43 ⚠️  | null         | NO
```

**Anomaly**: Shard 10's `started_at` equals `created_at` (20:22:43Z) - this indicates the job metadata was incorrectly initialized. Normal jobs show a ~20 second gap between creation and start.

### Runner Assignments

```
E2E Shard 1:  runs-on--i-0d7d7144971263874--smmJMReiBo
E2E Shard 2:  runs-on--i-008ac2be59d486021--RqPlFVSiZi
E2E Shard 3:  runs-on--i-0dca7a012f6b10ee0--PDtGVXegoF
E2E Shard 4:  runs-on--i-0fcb6a4fb7dc30ac9--waXmqVfmGP
E2E Shard 5:  runs-on--i-09cc23a1f4e088eda--cYaAnFrrjY
E2E Shard 6:  runs-on--i-051591ccd51db6f6b--OYgdeAfnUC
E2E Shard 7:  runs-on--i-0ef169b0abe96d497--WKgOUZlbXO
E2E Shard 8:  runs-on--i-0b9ffecbe0ebe3c2a--HfckeAdjVQ
E2E Shard 9:  runs-on--i-019c5c8cb0512793d--ngraOXeLys
E2E Shard 10: (none)
```

All 9 successful shards used different RunsOn ephemeral instances. Shard 10 has no runner.

### Workflow Configuration (Verified Fixed)

```yaml
# Line 185 in staging-deploy.yml
runs-on: "runs-on/runner=4cpu-linux-x64"  # Stable label, NOT per-run unique

strategy:
  fail-fast: false
  max-parallel: 3
  matrix:
    shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

The fix from #951/#952 IS applied - stable labels are being used.

### Previous Related Issues

- **#951** (CLOSED): Original diagnosis - ephemeral runner label mismatch with per-run unique labels
- **#952** (CLOSED): Bug fix - changed to stable RunsOn labels

## Root Cause Analysis

### Identified Root Cause

**Summary**: GitHub Actions/RunsOn race condition causes Shard 10 to enter an invalid job state where it appears "started" (`started_at` = `created_at`) but no runner actually picked it up, leaving it stuck in "queued" forever.

**Detailed Explanation**:

This is a **different issue** from #951/#952. The original issue was caused by per-run unique labels that became invalid when ephemeral runners terminated. That fix was successfully applied and 9 of 10 shards ran correctly with stable labels.

The new issue is a race condition in job scheduling:

1. All 10 shard jobs are created simultaneously at `20:22:43Z`
2. GitHub Actions uses `max-parallel: 3` to limit concurrent execution
3. The job queue scheduler assigns Shards 1-3 to the first batch
4. **Race condition**: Shard 10's metadata is initialized with `started_at = created_at` (incorrect)
5. This malformed state causes the RunsOn runner pool to never recognize Shard 10 as needing a runner
6. The job remains perpetually "queued" despite runners being available

**Possible triggers for race condition**:
- Matrix job creation timing with 10 concurrent job entries
- RunsOn API interaction during high-concurrency job creation
- GitHub Actions internal state machine edge case with `max-parallel` limiting

**Supporting Evidence**:
- `started_at = created_at` for Shard 10 only (all other shards have ~20s gap)
- No runner name assigned despite correct labels
- 9/10 shards executed successfully with the same configuration
- This occurred on the FIRST run after the #951/#952 fix was pushed

### How This Causes the Observed Behavior

1. Matrix strategy creates all 10 job entries simultaneously
2. GitHub Actions initializes job metadata for all 10 jobs
3. Race condition causes Shard 10's `started_at` to be set equal to `created_at`
4. RunsOn sees job as "already started" but no runner is assigned
5. Job never transitions to proper "pending" state for runner pickup
6. Workflow hangs indefinitely waiting for Shard 10

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- The evidence strongly supports a race condition (anomalous `started_at = created_at`)
- The fix from #951/#952 is verified to be in place
- 9/10 shards work correctly, ruling out configuration issues
- However, reproducing this specific race condition may be intermittent

## Fix Approach (High-Level)

Three potential approaches:

1. **Immediate**: Cancel the stuck workflow run (`gh run cancel 20009743958`) and re-trigger

2. **Workaround**: Add job ordering/delays to prevent race condition:
   ```yaml
   strategy:
     fail-fast: false
     max-parallel: 3
     matrix:
       shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   # Add continue-on-error with retry logic
   ```

3. **Investigation**: Contact RunsOn support to report the race condition with job metadata

4. **Alternative**: Split matrix into smaller batches or add explicit job dependencies to force sequential scheduling

## Diagnosis Determination

The root cause is a race condition between GitHub Actions' matrix job creation and RunsOn's runner assignment when creating 10 simultaneous jobs with `max-parallel: 3`. Shard 10 entered an invalid state where its metadata indicates "started" but no runner was assigned.

**This is NOT the same issue as #951/#952** - the stable labels fix is working correctly. This is a new, likely intermittent, race condition that may be difficult to reproduce consistently.

**Recommended Next Steps**:
1. Cancel the stuck workflow run
2. Monitor subsequent runs for recurrence
3. If recurrent, implement job batching or retry logic
4. Report to RunsOn if the issue persists

## Additional Context

- This workflow run was triggered by the fix for #951/#952 itself
- All 9 other shards failed their tests (separate issue - E2E test failures)
- The workflow uses RunsOn ephemeral runners for cost optimization
- RunsOn runner pool appears healthy (9/10 jobs got runners)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (run list, run view, api), grep, read, git log*
