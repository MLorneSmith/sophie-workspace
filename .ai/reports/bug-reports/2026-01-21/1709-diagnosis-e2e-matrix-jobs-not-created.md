# Bug Diagnosis: E2E Sharded Workflow Matrix Jobs Not Created for workflow_dispatch

**ID**: ISSUE-1709
**Created**: 2026-01-21T18:30:00Z
**Reporter**: MLorneSmith
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When triggering the E2E sharded workflow via `workflow_dispatch`, GitHub Actions fails to create the 12 matrix jobs in the `e2e-shards` job. The same workflow correctly creates all matrix jobs when triggered via `pull_request`. This prevents manual E2E testing and blocks the ability to run tests on-demand.

## Environment

- **Application Version**: dev branch (5b29ae370)
- **Environment**: GitHub Actions CI
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never worked for workflow_dispatch (9 runs, 0 successes)

## Reproduction Steps

1. Navigate to GitHub Actions for the repository
2. Select "E2E Tests (Sharded)" workflow
3. Click "Run workflow" button
4. Select branch `dev`
5. Optionally select max_parallel value
6. Click "Run workflow"
7. Observe that only 2 jobs are created: "Setup Test Server" and "E2E Test Report"
8. Matrix jobs (E2E Shard 1-12) are never created

**CLI Reproduction**:
```bash
gh workflow run e2e-sharded.yml --ref dev -f max_parallel=3
# Wait for completion
gh api repos/MLorneSmith/2025slideheroes/actions/runs/<run_id>/jobs --jq '.total_count'
# Returns: 2 (should be 14)
```

## Expected Behavior

After `setup-server` job completes successfully:
- GitHub Actions should expand the matrix strategy
- 12 shard jobs should be created (E2E Shard 1-12)
- Total jobs: 14 (setup + 12 shards + report)

## Actual Behavior

After `setup-server` job completes successfully:
- Matrix is NOT expanded
- 0 shard jobs are created
- Workflow skips directly to `e2e-report` job
- Total jobs: 2 (setup + report)

## Diagnostic Data

### Workflow Run Comparison

| Attribute | workflow_dispatch | pull_request |
|-----------|------------------|--------------|
| Run ID | 21222590347 | 21219662809 |
| Jobs Created | 2 | 14 |
| Matrix Expanded | NO | YES |
| setup-server Status | success | success |
| Same Workflow File | YES | YES |

### Console Output
```
# workflow_dispatch run jobs:
{"jobs":[{"conclusion":"success","name":"Setup Test Server"},{"conclusion":"success","name":"E2E Test Report"}],"total_jobs":2}

# pull_request run jobs:
{"jobs":[{"name":"Setup Test Server"},{"name":"E2E Shard 1"},...12 more...,{"name":"E2E Test Report"}],"total_jobs":14}
```

### Historical Analysis
```
# All workflow_dispatch runs have failed (0 successes out of 9)
# All failures are due to matrix jobs not being created

Run ID         Conclusion  Date                  SHA
21189347158    failure     2026-01-20T22:19:36Z  9aa6849d
21215670489    failure     2026-01-21T15:37:47Z  2b598f0b
21216182026    failure     2026-01-21T15:52:32Z  2b598f0b
21216840385    failure     2026-01-21T16:11:42Z  a2ac346a
21217273867    failure     2026-01-21T16:24:31Z  9d33d9e7
21217644376    failure     2026-01-21T16:35:59Z  7f617d64
21218613223    failure     2026-01-21T17:07:01Z  12d612f7
21219442642    failure     2026-01-21T17:33:53Z  5b29ae37
21220209359    failure     2026-01-21T17:58:56Z  5b29ae37
21222590347    failure     2026-01-21T18:15:00Z  5b29ae37  (new test run)
```

## Error Stack Traces

No explicit errors. The matrix jobs are silently not created. The workflow completes with status "success" for the jobs that do run, but the intended matrix jobs simply don't exist.

## Related Code

- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (lines 208-268)

- **Recent Changes**:
  - 5b29ae370: Removed ALL job-level `if:` conditions
  - 12d612f71: Moved dependabot check to step-level
  - 8403ad4a8: Removed job-index from runs-on label

- **Suspected Functions**:
  - `e2e-shards` job matrix strategy (line 221-225)
  - `needs: setup-server` dependency (line 210)
  - `runs-on` label expression (line 219)

## Related Issues & Context

### Direct Predecessors
- #1698 (Open): "Bug Diagnosis: E2E Shard Matrix Jobs Not Created for workflow_dispatch Events" - Initial diagnosis attempt
- #1700 (Open): "Bug Plan: E2E Shard Matrix Jobs Not Created for workflow_dispatch Events" - Previous fix attempts documented

### Infrastructure Issues
- #1641: "E2E Sharded Workflow Dual Failure Modes" - RunsOn job-index issue
- #1642: "E2E Sharded Workflow Dual Failure Modes" - Related fix

### Historical Context
This issue has existed since the first workflow_dispatch attempt (2026-01-20). Multiple fix attempts have been made:
1. Removed job-level `if:` conditions - Did not fix
2. Changed `runs-on` label to remove job-index - Did not fix
3. Moved dependabot check to step-level - Did not fix
4. Removed ALL job-level conditions - Did not fix

## Root Cause Analysis

### Identified Root Cause

**Summary**: GitHub Actions is silently failing to expand the matrix strategy for the `e2e-shards` job when triggered via `workflow_dispatch`, likely due to an interaction between RunsOn self-hosted runner labels and GitHub's internal job scheduling.

**Detailed Explanation**:

The issue appears to be a GitHub Actions platform behavior (possibly a bug) where:

1. For `pull_request` triggers, GitHub correctly evaluates the `needs` dependency, waits for `setup-server` to complete, then expands the matrix and creates 12 jobs.

2. For `workflow_dispatch` triggers, GitHub evaluates the `needs` dependency, waits for `setup-server` to complete, but then **skips matrix expansion entirely** and proceeds directly to dependent jobs (`e2e-report`).

The key evidence:
- Same workflow file produces different behavior for different triggers
- No job-level `if:` condition on `e2e-shards` (ruled out conditional skip)
- `setup-server` completes successfully (ruled out dependency failure)
- `max-parallel` expression evaluates correctly (verified via research)
- `runs-on` expression is valid for RunsOn (verified via documentation)

**Possible causes** (in order of likelihood):

1. **RunsOn runner label interaction**: The `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` label may be evaluated differently for workflow_dispatch. When no runners match immediately, GitHub may skip the matrix instead of waiting.

2. **GitHub Actions internal bug**: There may be an undocumented bug where workflow_dispatch + needs + matrix + self-hosted runners interact incorrectly.

3. **Expression evaluation timing**: The `max-parallel: ${{ github.event.inputs.max_parallel || 3 }}` expression may affect matrix creation timing for workflow_dispatch but not pull_request.

**Supporting Evidence**:
- All 9 workflow_dispatch runs have 0 matrix jobs created
- All pull_request runs with non-dependabot actors have 12 matrix jobs created
- The workflow file is identical for both trigger types
- RunsOn documentation confirms the label syntax is valid

### How This Causes the Observed Behavior

1. User triggers workflow via workflow_dispatch or CLI
2. GitHub creates the workflow run and queues `setup-server`
3. `setup-server` runs and completes successfully
4. GitHub evaluates `e2e-shards` job:
   - Checks `needs: setup-server` → PASS
   - Checks job-level `if:` → NONE (pass by default)
   - **Should expand matrix** → FAILS SILENTLY for workflow_dispatch
5. GitHub skips to `e2e-report` which has `always()` in its `if:` condition
6. `e2e-report` runs and completes
7. Workflow reports "failure" because `e2e-shards` never ran

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- The exact mechanism is not fully determined (could be GitHub bug, RunsOn interaction, or undocumented behavior)
- However, the symptoms are consistent and reproducible
- The workaround path is clear (remove RunsOn dynamic labels OR use standard GitHub-hosted runners to test)

## Fix Approach (High-Level)

**Option 1: Test with static `runs-on` label** (diagnostic)
Change `runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` to a static label like `runs-on: ubuntu-latest` to determine if RunsOn is the cause.

**Option 2: Use `fromJSON` for matrix** (potential fix)
Generate the matrix dynamically from `setup-server` outputs:
```yaml
setup-server:
  outputs:
    matrix: ${{ steps.matrix.outputs.value }}
  steps:
    - id: matrix
      run: echo "value={\"shard\":[1,2,3,4,5,6,7,8,9,10,11,12]}" >> $GITHUB_OUTPUT

e2e-shards:
  strategy:
    matrix: ${{ fromJSON(needs.setup-server.outputs.matrix) }}
```

**Option 3: Remove `needs` dependency** (diagnostic)
Remove `needs: setup-server` to test if the dependency is causing the issue.

**Option 4: Contact GitHub Support** (escalation)
If other approaches fail, this should be reported as a potential platform bug.

## Diagnosis Determination

The root cause is an interaction between GitHub Actions' workflow_dispatch trigger, matrix job scheduling, and either:
- RunsOn self-hosted runner label expressions, OR
- An undocumented platform behavior/bug

The issue is reproducible and has persisted through multiple fix attempts targeting other suspected causes (job-level `if:`, job-index in runs-on, etc.).

The recommended next step is to test with a static `runs-on: ubuntu-latest` to isolate whether RunsOn's dynamic labels are the cause.

## Additional Context

- This blocks all manual E2E testing via workflow_dispatch
- PR-triggered E2E tests continue to work correctly
- The issue has existed since the first workflow_dispatch attempt
- Multiple fix attempts documented in #1700 have not resolved the issue

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git, perplexity-expert, context7-expert, exa-expert*
