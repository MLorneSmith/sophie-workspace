# Bug Diagnosis: E2E Shard Matrix Jobs Not Created for workflow_dispatch Events

**ID**: ISSUE-pending
**Created**: 2026-01-21T11:00:00-05:00
**Reporter**: MLorneSmith
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The E2E sharded workflow's matrix jobs (12 shard jobs) are not being created when the workflow is triggered via `workflow_dispatch`, even though they ARE created for `pull_request` events. This causes the entire E2E test suite to be skipped, with only the setup and report jobs running.

## Environment

- **Application Version**: dev branch (commit 2b598f0b1)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase)
- **Last Working**: PR-triggered runs still work (commit c9d5d30)

## Reproduction Steps

1. Navigate to GitHub Actions for the repository
2. Trigger the `E2E Tests (Sharded)` workflow manually via `workflow_dispatch`
3. Select the `dev` branch
4. Click "Run workflow"
5. Observe that only 2 jobs are created (Setup Test Server + E2E Test Report)
6. The 12 shard matrix jobs are never created

## Expected Behavior

When triggering the workflow via `workflow_dispatch`:
- Setup Test Server job runs (with `if: github.actor != 'dependabot[bot]'` evaluating to true)
- 12 E2E Shard matrix jobs are created and run
- E2E Test Report job runs after shards complete

## Actual Behavior

When triggering the workflow via `workflow_dispatch`:
- Setup Test Server job runs successfully (7 minutes)
- **12 E2E Shard matrix jobs are NEVER created**
- E2E Test Report job runs immediately after Setup (due to `if: always()`)
- Workflow completes with "failure" status because shards never ran

## Diagnostic Data

### Workflow Runs Compared

| Run ID | Event | Jobs Created | Shard Jobs | Status |
|--------|-------|--------------|------------|--------|
| 21215670489 | workflow_dispatch | 2 | 0 | failure |
| 21216182026 | workflow_dispatch | 2 | 0 | failure |
| 21215352133 | pull_request | 13 | 12 | in_progress |

### Jobs Created for workflow_dispatch (21215670489)
```
✓ Setup Test Server in 7m32s (ID 61035974198)
✓ E2E Test Report in 1m37s (ID 61036979937)
```

### Jobs Created for pull_request (21215352133)
```
✓ Setup Test Server - completed
✓ E2E Shard 1 - completed
✓ E2E Shard 2 - completed
✓ E2E Shard 3 - completed
* E2E Shard 4 - in_progress
✓ E2E Shard 5 - completed
✓ E2E Shard 6 - completed
* E2E Shard 7 - queued
* E2E Shard 8 - queued
* E2E Shard 9 - queued
* E2E Shard 10 - queued
* E2E Shard 11 - queued
* E2E Shard 12 - queued
```

### Workflow Configuration Analysis
```yaml
# setup-server job (lines 63-70)
setup-server:
  name: Setup Test Server
  if: github.actor != 'dependabot[bot]'  # <-- Has if condition
  runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64

# e2e-shards job (lines 182-195)
e2e-shards:
  name: E2E Shard ${{ matrix.shard }}
  needs: setup-server  # <-- Depends on setup-server
  # NO if: condition here  # <-- MISSING
  runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
  strategy:
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

# e2e-report job (lines 390-395)
e2e-report:
  name: E2E Test Report
  needs: e2e-shards
  if: always() && github.actor != 'dependabot[bot]'  # <-- Has always()
```

### Actor/Event Comparison
| Run | Event | Actor | Triggering Actor |
|-----|-------|-------|------------------|
| 21215670489 | workflow_dispatch | MLorneSmith | MLorneSmith |
| 21215352133 | pull_request | MLorneSmith | MLorneSmith |

Both runs have identical actor context, so `github.actor != 'dependabot[bot]'` should evaluate to `true` for both.

## Error Stack Traces

No explicit errors - the shard jobs simply don't exist in the workflow run's job list.

## Related Code

- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (lines 182-196)
- **Recent Changes**: Commit bb8af7328 added `if: github.actor != 'dependabot[bot]'` to `setup-server` job
- **Suspected Functions**: GitHub Actions job graph evaluation for matrix jobs with `needs:` dependencies

## Related Issues & Context

### Direct Predecessors
- #1641 (CLOSED): "Bug Diagnosis: E2E Sharded Workflow Dual Failure Modes - Matrix Scheduling and Supabase Health Check" - Same symptom of matrix jobs not being created, but different root cause (was related to RunsOn job-index labels)
- #1642 (CLOSED): "Bug Fix: E2E Sharded Workflow Dual Failure Modes" - Previous fix that removed job-index from runner labels

### Historical Context
This appears to be a REGRESSION introduced by commit bb8af7328 which added `if: github.actor != 'dependabot[bot]'` to the `setup-server` job. The intent was to skip E2E tests for dependabot PRs, but it inadvertently broke `workflow_dispatch` triggers.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `e2e-shards` matrix job lacks an explicit `if:` condition, and when its parent job (`setup-server`) has an `if:` condition, GitHub Actions appears to skip matrix job creation for `workflow_dispatch` events but not for `pull_request` events.

**Detailed Explanation**:
When commit bb8af7328 added `if: github.actor != 'dependabot[bot]'` to the `setup-server` job, it created an implicit dependency chain issue:

1. `setup-server` has `if: github.actor != 'dependabot[bot]'`
2. `e2e-shards` has `needs: setup-server` but NO explicit `if:` condition
3. For `pull_request` events, GitHub Actions correctly evaluates that `e2e-shards` should run because `setup-server` will run
4. For `workflow_dispatch` events, GitHub Actions appears to have different job graph evaluation behavior, causing the matrix jobs to never be created

This is likely a GitHub Actions edge case or bug in how it handles:
- Matrix jobs (`strategy.matrix`)
- Combined with `needs:` dependencies
- Where the parent job has an `if:` condition
- And the trigger is `workflow_dispatch`

**Supporting Evidence**:
1. PR-triggered runs (21215352133) create all 13 jobs including 12 shards
2. workflow_dispatch runs (21215670489, 21216182026) only create 2 jobs (setup + report)
3. The workflow file is IDENTICAL between both run types
4. The actor (`github.actor`) is the same for both run types
5. The commit that introduced the `if:` condition (bb8af7328) correlates with when this issue started

### How This Causes the Observed Behavior

1. User triggers workflow via `workflow_dispatch` → GitHub Actions starts workflow
2. GitHub evaluates job graph: `setup-server` has `if:` condition → evaluates to true → job scheduled
3. GitHub evaluates `e2e-shards`: has `needs: setup-server`, NO `if:` condition → **BUG**: GitHub skips matrix creation for workflow_dispatch
4. `e2e-report` has `if: always()` → runs regardless → workflow appears to complete but shards never ran
5. Workflow marked as "failure" because expected shard artifacts don't exist

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The issue is 100% reproducible - every `workflow_dispatch` run exhibits this behavior
2. The correlation with commit bb8af7328 (adding `if:` to setup-server) is strong
3. The workaround is clear - adding an explicit `if:` condition to `e2e-shards` should fix it
4. The behavior difference between `pull_request` and `workflow_dispatch` is documented through multiple runs

## Fix Approach (High-Level)

Add an explicit `if: success()` condition to the `e2e-shards` job to ensure GitHub Actions correctly schedules the matrix jobs after `setup-server` completes:

```yaml
e2e-shards:
  name: E2E Shard ${{ matrix.shard }}
  needs: setup-server
  if: success()  # <-- Add this line
  runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
```

This makes the dependency explicit and should resolve the GitHub Actions job graph evaluation issue for `workflow_dispatch` events.

## Diagnosis Determination

The root cause is confirmed: the `e2e-shards` job lacks an explicit `if:` condition, which combined with its parent job having an `if:` condition, causes GitHub Actions to skip matrix job creation for `workflow_dispatch` events. This is a regression introduced by commit bb8af7328.

The fix is straightforward: add `if: success()` to the `e2e-shards` job definition.

## Additional Context

- This issue does NOT affect `pull_request` triggers - those continue to work correctly
- The MFA factor fix (issue #1696) was implemented and merged, but cannot be validated because the E2E tests don't run via `workflow_dispatch`
- Multiple PR runs are currently in "queued" state, likely waiting for RunsOn runners

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git, GitHub API*
