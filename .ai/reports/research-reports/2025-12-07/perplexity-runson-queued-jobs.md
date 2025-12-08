# Perplexity Research: RunsOn GitHub Actions Runners - Queued Job Issues

**Date**: 2025-12-07
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched why a GitHub Actions job using RunsOn on-demand runners would get stuck in "queued" state for 17+ hours while other jobs in the same matrix complete successfully. The workflow uses:
- Matrix strategy with 10 shards
- `max-parallel: 3` concurrency limit
- Runner syntax: `runs-on=${{ github.run_id }}/runner=4cpu-linux-x64`
- Problem: Shards 1-9 completed (mixed success/failure), but Shard 10 stuck in "queued" with runner showing "offline"

## Key Findings

### 1. The `runs-on` Syntax Issue

**Critical Discovery**: The syntax `runs-on=${{ github.run_id }}/runner=4cpu-linux-x64` is **custom label syntax** for on-demand runner provisioning services, NOT standard GitHub Actions syntax.

**How it works:**
- Evaluates to something like: `123456789/runner=4cpu-linux-x64`
- This creates a **unique, run-specific label** that must be matched exactly by a runner
- GitHub looks for a runner whose labels satisfy this **exact** expression
- If no runner exists with that label, the job stays queued **forever**

**The core problem:**
- Once some matrix jobs complete, their ephemeral runners are **terminated and unregistered**
- The label (e.g., `123456789/runner=4cpu-linux-x64`) no longer matches any **online** runner
- Remaining queued jobs have **zero matching runners** and never start
- This is why you see runners showing as "Offline" after earlier jobs finish

### 2. Why Shard 10 Got Stuck While Others Completed

**Root Cause Pattern:**

1. **max-parallel: 3** limits simultaneous execution to 3 jobs
2. Shards 1-3 start immediately → runners provisioned → jobs complete → runners terminated
3. Shards 4-6 start → runners provisioned → jobs complete → runners terminated
4. Shards 7-9 start → runners provisioned → jobs complete → runners terminated
5. **Shard 10 tries to start** but:
   - No runner with label `${{ github.run_id }}/runner=4cpu-linux-x64` exists anymore
   - Previous runners with that label were ephemeral and already destroyed
   - RunsOn doesn't provision a new runner because capacity constraints or provisioning failure
   - Job remains in "queued" forever

**Additional Contributing Factors:**

- **Runner pool exhaustion**: With `max-parallel: 3`, if one runner fails/crashes, there may be no free capacity for remaining jobs
- **Ephemeral runner cleanup timing**: Runners unregister immediately after completing their job, before the next queued job can claim them
- **Label uniqueness**: The `github.run_id` makes each label **unique per run**, preventing runner reuse
- **Provisioning failures**: If RunsOn fails to provision a runner for any reason (AWS quota, Spot interruption, etc.), the job gets stuck

### 3. RunsOn Runner Lifecycle

**How RunsOn works (from research):**

```
GitHub Webhook → RunsOn Control Plane (AWS) → Launch EC2 Runner (Ephemeral) → Run Job → Terminate Runner
```

**Key characteristics:**
- **Ephemeral VMs**: Fresh VM for every job, automatically cleaned up after completion
- **Spot pricing with auto-fallback**: Uses Spot instances, falls back to on-demand
- **On-demand scaling**: No pre-provisioning, runners created as needed
- **10-minute setup**: CloudFormation-based deployment in your AWS account

**Why runners go "offline":**
- Ephemeral runners **shut down and unregister** immediately after completing their job
- This moves them from "Active" → "Offline" status in GitHub UI
- If RunsOn doesn't start a **new** runner instance with the same label for the next queued job, those jobs stay queued

### 4. Known Issues with RunsOn/On-Demand Runners

**From community reports and similar systems (ARC, etc.):**

1. **Label mismatch after job completion**
   - Ephemeral runners with per-run ID labels are deleted after use
   - No runner matches the label for subsequent jobs in the queue
   - Solution: Use stable labels instead of run-specific labels

2. **Runner pool capacity exhaustion**
   - With `max-parallel: N`, if one runner fails, capacity drops below N
   - Remaining jobs can't start because no slots available
   - RunsOn may not provision new runners if it thinks capacity is used

3. **Failed pod/instance cleanup issues**
   - Failed runner instances can occupy capacity "slots" without being cleaned up
   - Prevents new runners from being created
   - Common in ARC and similar auto-scaling systems

4. **Runner registration failures**
   - Runners may fail to register with GitHub due to network issues
   - Provisioning succeeds but runner never appears as "online"
   - Jobs remain queued waiting for matching runner

5. **GitHub Actions API issues**
   - Transient GitHub service problems can prevent job dispatch
   - Runners appear online but jobs aren't assigned to them
   - Often requires retry or GitHub support intervention

### 5. How to Fix Jobs Stuck in Queued State

**Immediate Solutions:**

1. **Cancel and re-run the workflow**
   - Simplest fix: Cancel the stuck run and start fresh
   - Generates new `github.run_id`, which may avoid provisioning issues
   
2. **Force cancel via API** (if UI cancel fails)
   ```bash
   gh api repos/{owner}/{repo}/actions/runs/{run_id}/cancel -X POST
   ```

3. **Push empty commit to trigger new run**
   ```bash
   git commit --allow-empty -m "trigger re-run"
   git push
   ```
   - Often causes GitHub to skip/orphan stuck jobs
   - Starts fresh run that bypasses stale concurrency locks

4. **Re-run failed jobs from UI**
   - Click "Re-run failed jobs" in Actions tab
   - Sometimes unblocks other queued runs in the process

**Permanent Solutions:**

1. **Change `runs-on` syntax to stable labels** (RECOMMENDED)
   
   **Before:**
   ```yaml
   runs-on: ${{ github.run_id }}/runner=4cpu-linux-x64
   ```
   
   **After:**
   ```yaml
   runs-on: [self-hosted, linux, x64, 4cpu]
   ```
   
   This allows **any** runner with matching labels to pick up the job, not just a unique per-run instance.

2. **Use RunsOn's recommended syntax**
   
   According to RunsOn docs, the correct syntax is:
   ```yaml
   runs-on: "runs-on/runner=2cpu-linux-x64"
   # OR for dynamic sizing:
   runs-on: "runs-on/runner=${{ matrix.cpu }}cpu-linux-x64"
   ```
   
   **Note**: This is different from `${{ github.run_id }}/runner=...` and is designed to work with RunsOn's provisioning system.

3. **Increase `max-parallel` or remove it**
   
   ```yaml
   strategy:
     matrix:
       shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     max-parallel: 10  # or remove to allow all to run concurrently
   ```
   
   This reduces the chance of runner pool exhaustion.

4. **Ensure sufficient RunsOn/AWS capacity**
   
   - Check AWS service quotas for EC2 instances
   - Verify RunsOn configuration allows enough concurrent runners
   - Monitor CloudWatch for provisioning failures

5. **Add retry logic for transient failures**
   
   ```yaml
   jobs:
     test:
       runs-on: "runs-on/runner=4cpu-linux-x64"
       timeout-minutes: 60  # Fail fast instead of queuing forever
       continue-on-error: true  # Don't block other jobs
   ```

### 6. Debugging Checklist

**When a job is stuck in "queued":**

1. **Check GitHub Status** → [status.github.com](https://status.github.com)
   - Verify no Actions incidents

2. **Check runner availability** → Settings → Actions → Runners
   - Look for **Online** runners with matching labels
   - Verify runners exist in correct scope (repo/org/enterprise)

3. **Check runner group permissions**
   - Ensure runner group is allowed for this repository
   - Org-level runners may have access restrictions

4. **Check RunsOn provisioning logs**
   - Review CloudWatch logs in AWS account
   - Look for EC2 instance creation failures
   - Check for Spot instance interruptions

5. **Check concurrency settings**
   - Look for `concurrency:` blocks that might be blocking
   - Verify no stale concurrency locks from previous runs

6. **Check org/repo limits**
   - Actions → Usage & limits
   - Verify not hitting concurrent job limits
   - Check minutes/storage quotas

7. **Review workflow YAML**
   - Confirm `runs-on` syntax matches RunsOn documentation
   - Verify matrix strategy and max-parallel settings
   - Check for typos in labels (e.g., `unbuntu-latest` instead of `ubuntu-latest`)

## Sources & Citations

- [GitHub Community Discussion #147604](https://github.com/orgs/community/discussions/147604) - Workflow stuck in queued state
- [GitHub Actions Runner Issue #3478](https://github.com/actions/runner/issues/3478) - Self-hosted runner not picking up queued jobs
- [GitHub Actions Runner Issue #2512](https://github.com/actions/runner/issues/2512) - Jobs queued even when runners available
- [GitHub Actions Runner Issue #1653](https://github.com/actions/runner/issues/1653) - Self-hosted runner offline for GitHub
- [GitHub Community Discussion #62365](https://github.com/orgs/community/discussions/62365) - Action stuck as queued
- [RunsOn Official Website](https://runs-on.com) - Product overview and features
- [RunsOn GitHub Repository](https://github.com/runs-on/runs-on) - Documentation and examples
- [AWS CodeBuild GitHub Actions Docs](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-github-action-runners-update-labels.html) - Example of run_id label syntax
- [GitHub Docs - Using self-hosted runners](https://docs.github.com/en/actions/how-tos/hosting-your-own-runners/managing-self-hosted-runners/using-labels-with-self-hosted-runners) - Label management

## Key Takeaways

1. **The `runs-on=${{ github.run_id }}/runner=...` syntax is problematic** because it creates unique per-run labels that can't be reused by ephemeral runners

2. **Ephemeral runners terminate immediately after job completion**, so jobs queued later can't match the same label

3. **Use stable labels** (`[self-hosted, linux, x64, 4cpu]`) or RunsOn's recommended syntax (`runs-on/runner=4cpu-linux-x64`) instead

4. **max-parallel can create capacity exhaustion** when combined with ephemeral runners and unique labels

5. **Immediate fix**: Cancel and re-run the workflow; **Permanent fix**: Change the `runs-on` syntax

6. **Monitor RunsOn provisioning in CloudWatch** to catch EC2/Spot failures early

7. **Set job timeouts** to fail fast instead of queuing forever

## Related Searches

- RunsOn CloudFormation stack configuration and scaling limits
- GitHub Actions concurrency group debugging
- Ephemeral runner best practices for matrix jobs
- AWS EC2 Spot instance interruption handling
- GitHub Actions runner label matching algorithm

## Implementation Recommendations

**For the current stuck workflow:**
1. Cancel the stuck run via GitHub UI or API
2. Re-run the workflow (will get new `github.run_id`)

**For permanent fix:**
1. Update workflow YAML to use stable runner labels:
   ```yaml
   runs-on: [self-hosted, linux, x64, 4cpu]
   ```
   OR use RunsOn's recommended syntax:
   ```yaml
   runs-on: "runs-on/runner=4cpu-linux-x64"
   ```

2. Consider removing or increasing `max-parallel`:
   ```yaml
   strategy:
     matrix:
       shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     # Remove max-parallel to allow all shards to run concurrently
   ```

3. Add job timeout to prevent infinite queuing:
   ```yaml
   jobs:
     e2e-test:
       timeout-minutes: 60
   ```

4. Monitor RunsOn provisioning in AWS CloudWatch for failures
