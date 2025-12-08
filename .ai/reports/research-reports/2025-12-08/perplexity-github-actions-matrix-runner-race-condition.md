# Perplexity Research: GitHub Actions Matrix Job Queuing Race Conditions with Ephemeral Runners

**Date**: 2025-12-08
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (Hybrid)

## Query Summary

Researched the issue of GitHub Actions matrix jobs getting stuck in "queued" status indefinitely when using RunsOn ephemeral runners with `max-parallel: 3`. The specific pattern involves 10 matrix jobs created simultaneously, where one job (often the last) gets stuck with anomalous metadata (`started_at = created_at`) and never gets assigned a runner.

## Key Findings

### 1. Known GitHub Actions Matrix + Ephemeral Runner Issues

This is a **documented pattern** with multiple reported instances:

#### Runner/Controller Bugs with Self-Hosted and Ephemeral Runners
- Multiple reports of self-hosted runners where "only some jobs get picked, randomly" in multi-job workflows, leaving others stuck in queued even though the runner is idle
- Similar behavior occurs after runner auto-updates with no workflow changes, suggesting scheduler or backend regressions
- For ephemeral runners managed by controllers (Actions Runner Controller / RunsOn-style setups), there are cases where the runner pod completes jobs but GitHub never properly reconciles job state

#### Matrix + max-parallel Interaction Bug
- When using `strategy.matrix` with many children and `max-parallel`, GitHub schedules up to N matrix jobs at once and holds the rest queued
- **Critical issue**: If any running matrix child becomes logically stuck in "running" or "canceling" from GitHub's perspective (due to cleanup bugs, orphan-process handling, or dead agent), remaining matrix jobs never advance past queued because the scheduler thinks the parallelism limit is full
- Concrete report: Large matrix run (105 jobs) had 63 finish, then became stuck in "Canceling" and blocked all new runs; GitHub support had to clear it server-side

#### Jobs That "Finish" on Runner but Never Complete Server-Side
- Several reports of workflows where all steps run and deployment succeeds, but GitHub still shows job as queued or stuck at "Cleaning up orphan processes"
- Cancel operations do not work in this state
- In matrix scenarios, that one zombie job continues to consume a parallel slot, preventing remaining queued matrix jobs from ever being scheduled

#### Runner Stealing with Matrix Jobs
- **Critical for RunsOn users**: When two workflow jobs A and B with the same `runs-on` labels are queued simultaneously, the runner started for job A may actually start processing job B (since labels match), while job A waits for runner B
- **Important**: `github.run_id` is **not unique for each matrix job** - it's only unique per workflow run
- GitHub does not expose JOB_ID variable, making deterministic job-to-runner assignment difficult

### 2. RunsOn-Specific Issues

From RunsOn official troubleshooting documentation:

#### All Jobs Queued Indefinitely
- RunsOn runners consistently start in ~30s for x64/arm64
- If seeing abnormal queuing times, check:
  - **Webhooks not getting delivered**: GitHub webhook must reach RunsOn AppRunner service
  - **Runner stealing**: Most common cause with matrix jobs

#### Runner Stealing Prevention (Best Practice)
RunsOn recommends ensuring each workflow job gets a unique label by assigning the current workflow run ID as an additional label:

```yaml
runs-on: [runs-on/runner=4cpu-linux-x64, runs-on/run-id=${{ github.run_id }}]
```

**For matrix jobs specifically**, append the strategy job index + run attempt number:

```yaml
runs-on: [
  runs-on/runner=4cpu-linux-x64,
  runs-on/run-id=${{ github.run_id }}-${{ strategy.job-index }}-${{ github.run_attempt }}
]
```

This creates deterministic job-to-runner assignment and prevents runner stealing between matrix jobs.

### 3. Workflow-Level Workarounds

#### Option 1: Use Concurrency Groups (Cross-Run Locking)
For race conditions between different workflow runs:

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false  # or true depending on needs
```

Or for shared environment:

```yaml
concurrency:
  group: env-production
  cancel-in-progress: false
```

This ensures only one run in the group is active at a time, regardless of matrix size.

#### Option 2: Adjust max-parallel
- Reduce `max-parallel` to lower pressure on runner infrastructure
- For strict serialization within matrix: `max-parallel: 1`
- GitHub does NOT provide native "stagger start" for matrix jobs

#### Option 3: Separate Shared Operations from Matrix
Put any **shared mutable operation** (DB migrations, env setup) into a **separate, non-matrix job** that runs once and is a dependency:

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    steps:
      - name: Run migrations
        run: ./migrate.sh

  tests:
    needs: prepare  # Runs after prepare completes
    strategy:
      max-parallel: 3
      matrix:
        shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

This gives deterministic ordering without race conditions.

#### Option 4: Configure Job Timeouts
Prevents permanently stuck jobs from blocking forever:

```yaml
jobs:
  tests:
    timeout-minutes: 30
```

Much more robust than arbitrary sleeps.

### 4. What `needs:` Dependencies CANNOT Do

Important limitation: `needs:` can only ensure **all copies** of job A (including its matrix) finish before job B starts. It **CANNOT**:
- Order individual matrix copies within the same job
- Prevent intra-matrix race conditions by itself
- Fix cases where system-level limits cause some matrix entries to sit queued

For true per-matrix-job ordering, you need lock/serialization patterns or `concurrency:` controls.

### 5. The Metadata Anomaly Pattern

The specific pattern you described (`started_at = created_at`, no runner assigned) is a **known GitHub Actions scheduler bug** where:
- Job is created and queued
- Scheduler thinks it assigned a runner (sets `started_at`)
- Runner never actually picks up the job
- Job sits in queued state forever with incorrect metadata

This is often related to:
- Ephemeral runner deregistration race conditions
- Runner stealing (different job stole "your" runner)
- Backend scheduler state inconsistency

## Recommended Solutions

### Immediate Fixes

1. **Add Unique Runner Labels** (Highest Priority)
   ```yaml
   runs-on: [
     runs-on/runner=4cpu-linux-x64,
     runs-on/run-id=${{ github.run_id }}-${{ strategy.job-index }}-${{ github.run_attempt }}
   ]
   ```

2. **Move Sleep Delays to BEFORE Job Steps**
   The fix you attempted (sleep inside job steps) doesn't help because the job never starts. Instead, consider staggering job submission at the workflow level (though this is not natively supported).

3. **Add Job-Level Timeout**
   ```yaml
   jobs:
     e2e-tests:
       timeout-minutes: 30
   ```

4. **Reduce max-parallel Temporarily**
   Test with `max-parallel: 2` or even `1` to see if the issue persists. This helps isolate whether it's a parallelism bug vs. a general runner assignment bug.

### Long-Term Solutions

1. **Use Concurrency Groups for Env Protection**
   If your E2E tests share a test environment, serialize access:
   ```yaml
   concurrency:
     group: e2e-env-${{ github.ref }}
     cancel-in-progress: false
   ```

2. **Split Shared Setup into Separate Job**
   If there's any shared setup (database seeding, test data creation), move it to a `needs:` dependency job.

3. **Monitor RunsOn Logs**
   Use RunsOn CLI to debug:
   ```bash
   runs-on logs <job-url>
   ```

4. **Report to GitHub Support**
   The metadata anomaly (`started_at = created_at`) is a scheduler bug that may require GitHub intervention.

## Related Searches Conducted

- "RunsOn GitHub Actions matrix race condition ephemeral runner stuck queued"
- "GitHub Actions matrix job stuck queued never starts"
- "What are known issues with GitHub Actions matrix jobs getting stuck in queued status when using ephemeral runners like RunsOn?"
- "GitHub Actions job started_at equals created_at no runner assigned"
- "What are effective workarounds for GitHub Actions matrix job race conditions at the workflow level?"
- "What are the best practices for using max-parallel with GitHub Actions matrix jobs to avoid race conditions or stuck jobs?"

## Sources & Citations

### GitHub Community Discussions
- [Github action stuck as queued, not able to pick the runner #62365](https://github.com/orgs/community/discussions/62365)
- [(Confirmed Incident) GitHub Actions workflows stuck in queued state #143045](https://github.com/orgs/community/discussions/143045)
- [Race Conditions With Deregistering Self Hosted Runner #52867](https://github.com/orgs/community/discussions/52867)
- [Cannot cancel matrix job using reusable workflow #125017](https://github.com/orgs/community/discussions/125017)
- [Job concurrency group ignored for build matrix #26774](https://github.com/orgs/community/discussions/26774)

### RunsOn Documentation
- [Troubleshooting - RunsOn](https://runs-on.com/guides/troubleshoot/)
- [The matrix strategy in GitHub Actions - RunsOn](https://runs-on.com/github-actions/the-matrix-strategy/)

### GitHub Official Documentation
- [Using jobs in a workflow - GitHub Docs](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/using-jobs-in-a-workflow)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Actions Cheat Sheet](https://github.github.io/actions-cheat-sheet/actions-cheat-sheet.pdf)

### Technical Articles
- [How to leverage GitHub Actions matrix strategy - Depot.dev](https://depot.dev/blog/github-actions-matrix-strategy)

## Key Takeaways

1. **This is a known issue** with GitHub Actions matrix jobs + ephemeral runners + max-parallel
2. **Runner stealing** is the most common cause for RunsOn users
3. **The fix is at the workflow level**, not inside job steps:
   - Add unique runner labels per matrix job
   - Use `runs-on/run-id=${{ github.run_id }}-${{ strategy.job-index }}`
4. **The metadata anomaly** (`started_at = created_at`) indicates a GitHub scheduler bug
5. **`needs:` dependencies cannot fix intra-matrix race conditions** - only whole-job dependencies
6. **Sleep delays inside jobs don't help** because the job never starts in the first place

## Next Steps

1. Implement unique runner labels per matrix job (highest priority)
2. Add job-level timeouts
3. Test with reduced `max-parallel` to isolate issue
4. Consider adding concurrency groups if sharing test environments
5. Monitor RunsOn logs for runner stealing evidence
6. Report metadata anomaly to GitHub support if issue persists
