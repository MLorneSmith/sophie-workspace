# Bug Diagnosis: Staging Deploy Workflow Timeout on Force Push

**ID**: ISSUE-pending
**Created**: 2025-12-05T21:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: performance

## Summary

The staging-deploy.yml workflow ran for 39 minutes before being cancelled when force-pushing changes to the staging branch. The Full Test Suite job ran for ~26 minutes because the validation skip logic doesn't recognize force pushes as validated commits. This is actually **working as designed** - force pushes bypass the PR merge detection since they don't have "Merge pull request" in the commit message.

The actual issue is that the E2E test suite takes too long on the 4-CPU runner, and there's no option to skip validation for force pushes that contain already-validated commits.

## Environment

- **Application Version**: 2.13.1
- **Environment**: GitHub Actions CI (staging-deploy.yml)
- **Runner**: RunsOn m7a.xlarge (4 CPU, 16GB RAM)
- **Node Version**: 20
- **Workflow**: `.github/workflows/staging-deploy.yml`
- **Last Working**: N/A (first occurrence of long-running force push scenario)

## Reproduction Steps

1. Make multiple commits to `dev` branch (10+ commits)
2. Force push dev to staging: `git push origin dev:staging --force`
3. Observe the staging-deploy workflow runs full test suite
4. Test suite takes 26+ minutes until timeout/cancellation

## Expected Behavior

Force pushes containing commits that were already validated on `dev` branch should either:
1. Skip the test suite entirely (same as PR merges)
2. Complete much faster (< 10 minutes) with optimized runners

## Actual Behavior

- Workflow ran for 39 minutes total before cancellation
- Full Test Suite job ran for 26 minutes (20:33:57 to 20:59:58)
- Validation check correctly identified: "This is a direct push, validation needed"
- All tests ran sequentially on single 4-CPU runner

## Diagnostic Data

### Workflow Run Details

```
Run ID: 19975098325
Duration: 33m57s (cancelled)
Conclusion: cancelled

Jobs:
- Check if validation needed: 6s (success)
- Pre-deployment Validation: 1m41s (success)
- Full Test Suite: 26m+ (cancelled)
  - Started: 20:29:45
  - Cancelled: 21:00:00
  - E2E tests ran from 20:33:57 until cancellation
- Build Application: skipped
- Deploy jobs: skipped
```

### Validation Check Output

```
This is a direct push, validation needed
```

The check-validation logic correctly detected this was NOT a PR merge:
- Commit message: `perf(ci): optimize staging deploy workflow for PR merges`
- Does NOT match: `^Merge pull request`
- Does NOT match: `Merge.*dev`

### Runner Configuration

```
Instance Type: m7a.xlarge
CPU: 4 cores
RAM: 15620.09 MiB
Instance Lifecycle: spot
```

### Test Suite Performance

The test command `pnpm test` runs:
- 40 packages through Turbo
- Unit tests for all packages
- E2E tests (not sharded, unlike PRs which use e2e-sharded.yml)

## Error Stack Traces

No errors - the workflow was cancelled by user/concurrency policy.

## Related Code

- **Affected Files**:
  - `.github/workflows/staging-deploy.yml:43-62` - Check validation logic
  - `.github/workflows/staging-deploy.yml:118-215` - Full Test Suite job
  - `.github/workflows/staging-deploy.yml:35,67,121` - Runner configuration

- **Recent Changes**:
  - Issue #937 added PR merge skip optimization (working correctly)
  - Commit `94f5a78b0` triggered this workflow

- **Suspected Functions**:
  - `check-validation` job logic doesn't handle force pushes
  - Single runner executes all tests sequentially

## Related Issues & Context

### Direct Predecessors
- #937 (CLOSED): "Chore: Optimize Staging Deploy Workflow Performance" - Added PR merge skip logic that's working, but doesn't cover force push scenario
- #936 (CLOSED): "Bug Fix: Supabase Status Output Parsing Failure in CI" - Fixed parsing, unrelated

### Similar Symptoms
- #640 (CLOSED): "Performance Diagnosis: Dev Integration Tests Workflow Exceeds 15 Minutes" - Similar performance issue on dev branch
- #641 (CLOSED): "Bug Fix: Dev Integration Tests Workflow Performance (15-20min → 8-10min)" - Addressed performance on dev

### Same Component
- #627 (CLOSED): "Feature: Migrate CI/CD Workflows to runs-on Self-Hosted Runner" - Initial runs-on setup

### Historical Context
The project has an ongoing effort to optimize CI/CD performance. The e2e-sharded.yml workflow uses sharding for PRs (10 shards, max 3 parallel) but staging-deploy runs all tests on a single runner.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Force pushes to staging bypass the PR merge detection and trigger full test validation on a single 4-CPU runner, which takes 26+ minutes.

**Detailed Explanation**:

The check-validation logic in staging-deploy.yml (lines 43-62) only skips validation for:
1. Commits with message starting with "Merge pull request"
2. Commits with message body containing "Merge.*dev"

Force pushes create commits that don't match either pattern. When you run `git push origin dev:staging --force`, the resulting commit keeps its original message (e.g., `perf(ci): optimize staging deploy workflow...`), which doesn't trigger the skip conditions.

The test suite then runs on a single 4-CPU runner, executing all E2E tests sequentially. Unlike the e2e-sharded.yml workflow which parallelizes tests across 10 shards, staging-deploy runs everything in one job.

**Supporting Evidence**:
- Workflow log: "This is a direct push, validation needed"
- Commit message: `perf(ci): optimize staging deploy workflow for PR merges`
- Job duration: 26+ minutes for test-full
- Runner: 4cpu-linux-x64 (single runner, no parallelism)

### How This Causes the Observed Behavior

1. User force-pushes dev to staging
2. Workflow triggers on push to staging branch
3. check-validation job runs, checks commit message
4. Message doesn't match PR merge patterns → should-validate=true
5. Full Test Suite job runs (26+ minutes on 4-CPU runner)
6. User gets impatient, cancels workflow after 39 minutes

### Confidence Level

**Confidence**: High

**Reasoning**:
- Workflow logs clearly show "This is a direct push, validation needed"
- The commit message structure is verifiable
- The skip logic patterns are explicit in the workflow YAML
- The 4-CPU runner configuration is visible in logs

## Fix Approach (High-Level)

Multiple options to address this issue:

### Option A: Upgrade Runner CPU (Quick Win)
Upgrade staging-deploy test-full job from `4cpu-linux-x64` to `8cpu-linux-x64` or `16cpu-linux-x64`. This would:
- Speed up parallel test execution within Playwright
- Better utilize Turbo's parallel task execution
- Estimated improvement: 30-50% faster

### Option B: Add Force Push Skip Logic
Detect force pushes by checking if the pushed commit exists in another validated branch:
```bash
# Check if this commit was already validated on dev
if git branch -r --contains "$COMMIT" | grep -q "origin/dev"; then
  echo "Commit already validated on dev branch"
  echo "should-validate=false" >> $GITHUB_OUTPUT
fi
```

### Option C: Implement Sharded E2E Tests for Staging
Use matrix strategy like e2e-sharded.yml:
- Split tests across 10 shards
- Run with max-parallel=3-5
- Estimated improvement: 60-70% faster

### Recommended Approach
Combine Option A (immediate) + Option B (validation logic):
1. Upgrade to 8cpu runners for immediate improvement
2. Add force push detection to skip already-validated commits

## Diagnosis Determination

The workflow is working as designed - it correctly detects that force pushes are not PR merges and runs validation. However, the design doesn't account for the common scenario of force-pushing validated commits from dev to staging.

The 26+ minute test duration is caused by:
1. Running all tests on a single 4-CPU runner (not sharded)
2. No mechanism to skip validation for force pushes

## Additional Context

### Current Runner Configuration

| Job | Runner | CPUs | Appropriate? |
|-----|--------|------|--------------|
| check-validation | 4cpu-linux-x64 | 4 | Overkill (2cpu would suffice) |
| validate | 4cpu-linux-x64 | 4 | Appropriate |
| test-full | 4cpu-linux-x64 | 4 | **Undersized** for E2E tests |
| build | artifact-sharing (4cpu) | 4 | Appropriate |
| deploy-* | 4cpu-linux-x64 | 4 | Overkill (2cpu would suffice) |

### RunsOn Pricing Reference

| CPUs | Cost (spot) | Monthly (100 runs) |
|------|-------------|-------------------|
| 4cpu | $0.006/min | ~$20/month |
| 8cpu | $0.012/min | ~$40/month |
| 16cpu | $0.024/min | ~$80/month |

Upgrading test-full to 8cpu would add ~$20/month but potentially halve test duration.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git log, workflow analysis, RunsOn documentation research*
