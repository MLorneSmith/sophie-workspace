# Context7 Research: GitHub Actions Matrix Job Conditions and Dependencies

**Date**: 2026-01-21
**Agent**: context7-expert
**Libraries Researched**: websites/github_en_actions (GitHub Actions Official Documentation)

## Query Summary

Researched the following topics from GitHub Actions documentation:
1. Matrix job creation behavior with `needs` dependencies
2. How `if:` conditions on parent jobs affect dependent matrix jobs
3. Differences in job scheduling between `workflow_dispatch` and `pull_request` triggers
4. The `success()` function and how it evaluates in job conditions
5. Best practices for conditional job dependencies with matrix strategies

## Findings

### 1. Matrix Job Creation with `needs` Dependencies

Matrix strategies automatically create multiple job runs based on variable combinations:

```yaml
jobs:
  example_matrix:
    strategy:
      matrix:
        version: [10, 12, 14]
        os: [ubuntu-latest, windows-latest]
```

**Key behaviors**:
- Maximum of **256 jobs per workflow run**
- Jobs are created based on all combinations of matrix variables
- The order of variables determines job creation order
- GitHub maximizes parallel execution based on runner availability

When a matrix job depends on another job via `needs`:
```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    outputs:
      colors: ${{ steps.colors.outputs.colors }}
  
  produce-artifacts:
    runs-on: ubuntu-latest
    needs: define-matrix
    strategy:
      matrix:
        color: ${{ fromJSON(needs.define-matrix.outputs.colors) }}
```

**Critical**: The dependent job will **not start until the specified job finishes successfully**. A failure or skip in an upstream job will prevent downstream dependent jobs from running unless explicitly handled.

### 2. How `if:` Conditions on Parent Jobs Affect Dependent Jobs

**This is the key finding for the original question.**

From the documentation on sequential job dependencies:

> "A failure or skip in an upstream job will prevent downstream dependent jobs from running unless explicitly handled."

When a job has an `if:` condition that evaluates to `false`:
- The job is marked as **"skipped"**
- The job is reported as **"Success"** in the UI (despite being skipped)
- **Dependent jobs with `needs` will NOT run by default** because the `success()` check fails

The `needs.<job_id>.result` can be one of:
- `success`
- `failure`
- `cancelled`
- `skipped`

**Default behavior**: Jobs with `needs` only run if **all** dependent jobs have `result: "success"`. A skipped job does NOT have `result: "success"` - it has `result: "skipped"`.

### 3. The `success()` Function Behavior

```yaml
jobs:
  deploy:
    if: ${{ github.ref == 'refs/heads/main' && success() }}
    runs-on: ubuntu-latest
```

**Important details**:
- `success()` returns `true` **only if all preceding steps/jobs have completed successfully**
- This is the **default status check** applied when no other status function is specified
- A **skipped job is NOT considered successful** for `success()` evaluation

**This means**: If a parent job with an `if:` condition is skipped, the implicit `success()` check on dependent jobs will return `false`, preventing those jobs from running.

### 4. Making Dependent Jobs Run Despite Skipped Parents

To run a job regardless of parent job status, use `always()`:

```yaml
jobs:
  job1:
  job2:
    needs: job1
  job3:
    if: ${{ always() }}
    needs: [job1, job2]
```

> "job3 will execute after job1 and job2 complete, even if job1 or job2 failed **or were skipped**."

Alternative patterns using `needs.<job_id>.result`:

```yaml
jobs:
  matrix_job:
    needs: conditional_parent
    if: ${{ always() && needs.conditional_parent.result != 'failure' }}
    strategy:
      matrix:
        version: [1, 2, 3]
```

Or to run only if parent succeeded or was skipped:
```yaml
if: ${{ needs.parent.result == 'success' || needs.parent.result == 'skipped' }}
```

### 5. Differences Between `workflow_dispatch` and `pull_request` Triggers

**`pull_request` event**:
- Triggered by PR activity (open, synchronize, reopen by default)
- `GITHUB_SHA` is the last merge commit on the merge branch
- `GITHUB_REF` is `refs/pull/PULL_REQUEST_NUMBER/merge`
- Available contexts include `github.head_ref`, `github.base_ref`
- Does NOT run if PR has merge conflict

**`workflow_dispatch` event**:
- Triggered manually via GitHub UI, CLI, or API
- Allows defining custom inputs
- No automatic context like PR head/base refs

**Job scheduling differences**:
- Both trigger types evaluate job conditions the same way
- The difference in observed behavior is likely due to:
  1. Different values in `github` context (e.g., `github.event_name`)
  2. Different branch contexts affecting conditional evaluations
  3. Different default behaviors (PR runs by default on `opened`, `synchronize`, `reopened`)

### 6. Matrix Strategy Configuration Options

**Failure handling**:
```yaml
strategy:
  fail-fast: true  # Cancel all jobs if any fails (default: true)
  matrix:
    version: [6, 7, 8]

continue-on-error: ${{ matrix.experimental }}  # Allow specific jobs to fail
```

**Key properties**:
- `fail-fast: true` - Cancels all queued/in-progress jobs when any required job fails
- `continue-on-error: true` - Allows individual jobs to fail without affecting the workflow
- `max-parallel: N` - Limits concurrent matrix jobs

### 7. Best Practices for Conditional Job Dependencies with Matrix Strategies

**Pattern 1: Always run matrix regardless of parent status**
```yaml
jobs:
  setup:
    if: ${{ github.event_name == 'pull_request' }}
    runs-on: ubuntu-latest
    outputs:
      should_run: ${{ steps.check.outputs.result }}
  
  matrix_tests:
    needs: setup
    if: ${{ always() }}  # Run even if setup was skipped
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]
```

**Pattern 2: Check parent result explicitly**
```yaml
jobs:
  matrix_tests:
    needs: conditional_job
    if: ${{ always() && (needs.conditional_job.result == 'success' || needs.conditional_job.result == 'skipped') }}
    strategy:
      matrix:
        test: [unit, integration, e2e]
```

**Pattern 3: Dynamic matrix from parent output**
```yaml
jobs:
  define-matrix:
    outputs:
      matrix: ${{ steps.set.outputs.matrix }}
  
  run-tests:
    needs: define-matrix
    strategy:
      matrix: ${{ fromJSON(needs.define-matrix.outputs.matrix) }}
```

## Key Takeaways

1. **Skipped jobs cause dependent jobs to skip** - When a parent job has `if:` that evaluates to false, it's marked as "skipped", which causes dependent jobs with `needs` to also skip (because `success()` returns false for skipped jobs)

2. **Use `always()` to bypass skip propagation** - Add `if: ${{ always() }}` to dependent jobs that should run regardless of parent status

3. **Matrix jobs follow the same rules** - A matrix job with `needs` pointing to a skipped parent will have NONE of its matrix instances created

4. **Check `needs.<job>.result` for fine-grained control** - Use explicit result checks (`success`, `failure`, `cancelled`, `skipped`) for precise conditional logic

5. **No difference between triggers for job scheduling** - `workflow_dispatch` and `pull_request` follow the same dependency rules; behavior differences are due to different context values

6. **Jobs marked "skipped" appear as "Success" in UI** - This can be misleading; the job did NOT run successfully, it was skipped

## Code Examples

### Problem: Matrix jobs not created when parent is skipped
```yaml
# PROBLEMATIC - matrix jobs won't run if setup is skipped
jobs:
  setup:
    if: ${{ github.event_name == 'pull_request' }}
    runs-on: ubuntu-latest
    
  test-matrix:
    needs: setup
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Shard ${{ matrix.shard }}"
```

### Solution: Add `always()` condition
```yaml
# FIXED - matrix jobs run even if setup is skipped
jobs:
  setup:
    if: ${{ github.event_name == 'pull_request' }}
    runs-on: ubuntu-latest
    
  test-matrix:
    needs: setup
    if: ${{ always() }}  # <-- This is the fix
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Shard ${{ matrix.shard }}"
```

### Advanced: Run only if parent succeeded or was skipped (not failed)
```yaml
jobs:
  test-matrix:
    needs: setup
    if: ${{ always() && needs.setup.result != 'failure' && needs.setup.result != 'cancelled' }}
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
```

## Sources

- GitHub Actions Documentation via Context7 (websites/github_en_actions)
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs
- https://docs.github.com/en/actions/learn-github-actions/expressions
- https://docs.github.com/en/actions/reference/accessing-contextual-information-about-workflow-runs
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations
- https://docs.github.com/en/actions/reference/contexts-reference
