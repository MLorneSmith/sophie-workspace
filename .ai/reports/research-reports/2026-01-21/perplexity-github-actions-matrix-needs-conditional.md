# Perplexity Research: GitHub Actions Matrix Jobs Not Created with Conditional Parent Job

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (multiple queries)

## Query Summary

Investigated why GitHub Actions matrix jobs are not created for `workflow_dispatch` triggers when the parent job has an `if:` condition, even though the same workflow creates all matrix jobs for `pull_request` triggers.

## Root Cause Analysis

### The Core Issue: `if:` Evaluated BEFORE Matrix Expansion

The GitHub Actions documentation explicitly states:

> **"The `jobs.<job_id>.if` condition is evaluated BEFORE `jobs.<job_id>.strategy.matrix` is applied."**

Source: [GitHub Docs - Using conditions to control job execution](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/using-conditions-to-control-job-execution)

This means:
1. When a job with `if:` condition AND a matrix strategy is evaluated
2. The `if:` condition is checked FIRST
3. If the condition passes, the matrix is THEN expanded into individual jobs
4. If the condition causes the job to be **skipped**, the matrix is **never expanded** - the jobs literally don't exist

### Why It Works for `pull_request` but Not `workflow_dispatch`

The critical difference is in **how the `needs` dependency chain interacts with skipped jobs**:

1. **For `pull_request`**: When `setup-server` runs normally (actor is not dependabot), the job succeeds, and all downstream matrix jobs are created and run.

2. **For `workflow_dispatch`**: There may be a subtle evaluation difference in how the dependency chain propagates "skipped" status. When any job in the dependency chain is evaluated as having an `if:` condition, GitHub Actions applies **implicit `success()` && your-condition** behavior.

### The "Skipped Propagation" Bug/Feature

Multiple GitHub issues document this behavior:

**From [actions/runner#491](https://github.com/actions/runner/issues/491)**:
> "A default status check of `success()` is applied unless you include one of these functions [always(), failure(), cancelled()]."

This means your matrix job's implicit condition is:
```yaml
if: success() && (implicit-needs-check)
```

When any job in the `needs` chain was skipped (even transitively), the implicit `success()` check fails, causing ALL dependent jobs to be skipped - **including never expanding the matrix**.

**From [actions/runner#2205](https://github.com/actions/runner/issues/2205)**:
> "One or more jobs are skipped in a workflow when run after successfully running a job matching following conditions:
> - Job has NEEDS dependency on one or more preceding jobs
> - Job has if condition specifying behavior when NEEDS jobs are skipped"

### The Specific Behavior You're Seeing

1. **`setup-server` job** has `if: github.actor != 'dependabot[bot]'`
2. For `workflow_dispatch`, the actor is your username (not dependabot)
3. **However**, the `if:` condition on the parent job changes how GitHub evaluates the downstream chain
4. The matrix job `e2e-shards` with `needs: setup-server` is NOT evaluating `success()` against `setup-server.result == 'success'` correctly
5. Instead, the matrix is **never expanded** because the conditional evaluation chain breaks

## Documented GitHub Issues

### Directly Related Issues

1. **[actions/runner#952](https://github.com/actions/runner/issues/952)** - "Skipping a matrix job hangs the Pull Request when inner-matrix jobs are required status checks"
   - Status: **Open** (labeled as enhancement)
   - Describes exactly this behavior: "Jobs with a build matrix configuration can be skipped from the top level, before expanding the matrix"

2. **[actions/runner#2205](https://github.com/actions/runner/issues/2205)** - "Jobs skipped when NEEDS job ran successfully"
   - Documents the propagation of skipped status through dependency chains
   - Multiple users confirm this behavior

3. **[actions/runner#491](https://github.com/actions/runner/issues/491)** - "Job-level 'if' condition not evaluated correctly if job in 'needs' property is skipped"
   - Long-standing issue from 2020
   - Documents the implicit `success()` behavior

4. **[community#26945](https://github.com/orgs/community/discussions/26945)** - "Jobs being skipped while using both needs and if"
   - Community discussion with workarounds

5. **[community#45058](https://github.com/orgs/community/discussions/45058)** - "success() returns false if dependent jobs are skipped"
   - GitHub Support acknowledged this is on the backlog to fix

## Proven Solutions

### Solution 1: Remove `if:` from Parent Job (Recommended)

Move the conditional logic to steps within the job rather than at the job level:

```yaml
setup-server:
  runs-on: ubuntu-latest
  # NO if: condition here
  steps:
    - name: Skip for Dependabot
      if: github.actor == 'dependabot[bot]'
      run: echo "Skipping for dependabot"
    
    - name: Actual Setup
      if: github.actor != 'dependabot[bot]'
      run: |
        # Your setup logic
```

**Why this works**: The job always "runs" (even if steps are skipped), so downstream jobs see `result: 'success'` and their matrices expand normally.

### Solution 2: Use `!failure() && !cancelled()` Instead of `success()`

On the matrix job:
```yaml
e2e-shards:
  needs: setup-server
  if: ${{ !failure() && !cancelled() }}
  strategy:
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

**Why this works**: Unlike `success()` which fails for skipped dependencies, `!failure() && !cancelled()` treats skipped as acceptable.

### Solution 3: Use `always()` with Explicit Result Check

```yaml
e2e-shards:
  needs: setup-server
  if: always() && needs.setup-server.result == 'success'
  strategy:
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

**Why this works**: `always()` removes the implicit `success()` check, allowing you to explicitly check only what you care about.

### Solution 4: Make Parent Job Always Pass with Outputs

```yaml
setup-server:
  runs-on: ubuntu-latest
  outputs:
    should-run: ${{ steps.check.outputs.should-run }}
  steps:
    - id: check
      run: |
        if [[ "${{ github.actor }}" == "dependabot[bot]" ]]; then
          echo "should-run=false" >> $GITHUB_OUTPUT
        else
          echo "should-run=true" >> $GITHUB_OUTPUT
        fi
    # Rest of setup (conditional on output)

e2e-shards:
  needs: setup-server
  if: needs.setup-server.outputs.should-run == 'true'
  strategy:
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

**Why this works**: The parent job always completes successfully, and the downstream decision is based on outputs rather than job-level conditionals.

## Why `workflow_dispatch` vs `pull_request` Behaves Differently

The most likely explanation based on the research:

1. **Trigger context evaluation**: Different triggers may evaluate the `github` context slightly differently during workflow planning
2. **Job graph construction**: GitHub Actions builds the job dependency graph differently based on trigger type
3. **Lazy vs eager matrix expansion**: For `pull_request`, the matrix might be eagerly expanded; for `workflow_dispatch`, it might be lazily evaluated after dependency resolution

**Note**: This is likely a bug or undocumented behavior difference, not intentional design.

## Key Takeaways

1. **`if:` at job level is evaluated BEFORE matrix expansion** - This is documented and by design
2. **Skipped jobs propagate through `needs` chain** - Any job depending on a skipped job will also be skipped (unless using `always()`)
3. **The implicit `success()` is the culprit** - GitHub automatically prepends `success() &&` to your conditions unless you use a status function
4. **Matrix jobs are never created, not skipped** - When the parent condition fails, the matrix doesn't expand at all
5. **This is a known limitation** - Multiple open issues track this behavior, but no fix timeline

## Sources & Citations

1. [GitHub Docs - Using conditions to control job execution](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/using-conditions-to-control-job-execution)
2. [actions/runner#952 - Matrix job skipping](https://github.com/actions/runner/issues/952)
3. [actions/runner#2205 - Jobs skipped when NEEDS job ran successfully](https://github.com/actions/runner/issues/2205)
4. [actions/runner#491 - Job-level if condition not evaluated correctly](https://github.com/actions/runner/issues/491)
5. [community#26945 - Jobs being skipped while using both needs and if](https://github.com/orgs/community/discussions/26945)
6. [community#45058 - success() returns false if dependent jobs are skipped](https://github.com/orgs/community/discussions/45058)
7. [community#60792 - Conditional Jobs and matrix make it impossible to require](https://github.com/orgs/community/discussions/60792)

## Related Searches

- [GitHub Actions matrix evaluation timing](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [GitHub Actions needs context with status functions](https://docs.github.com/en/actions/learn-github-actions/expressions#job-status-check-functions)
- Dynamic matrix generation workarounds for conditional scenarios
