# Perplexity Research: GitHub Actions Matrix Jobs Not Created with Conditional Parent Job

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched why GitHub Actions matrix jobs are NOT being created for `workflow_dispatch` triggers but ARE created for `pull_request` triggers when the parent job has an `if:` condition.

**Workflow Structure**:
1. `setup-server` job has `if: github.actor != 'dependabot[bot]'`
2. `e2e-shards` matrix job has `needs: setup-server` and `if: success()`
3. For `pull_request` triggers: All 12 matrix jobs are created
4. For `workflow_dispatch` triggers: Matrix jobs are NEVER created

## Root Cause Analysis

### The Core Problem

**GitHub Actions evaluates `jobs.<job_id>.if` conditions BEFORE `jobs.<job_id>.strategy.matrix` is applied.**

When a job with `needs:` has a parent job that was conditionally evaluated (even if it succeeded), GitHub Actions has specific behavior:

1. **For `pull_request` triggers**: The trigger provides sufficient context (branch/PR data) for early matrix resolution and `needs` evaluation
2. **For `workflow_dispatch` triggers**: This manual trigger lacks automatic context like PR events, and the parent job's `if:` condition causes downstream jobs to inherit a "skip evaluation" status

### Why `if: success()` Doesn't Work

The `success()` function only checks if *previous jobs succeeded* - it doesn't override the default behavior where:

> "A job that is skipped will report its status as 'Success'. It will not prevent a pull request from merging, even if it is a required check."
> - GitHub Docs

More importantly:

> "If a run contains a series of jobs that need each other, a **failure or skip applies to all jobs in the dependency chain** from the point of failure or skip onwards."
> - GitHub Docs (jobs.<job_id>.needs)

The issue is that when the parent job has an `if:` condition, GitHub's evaluation logic for `workflow_dispatch` treats the dependency chain differently than for `pull_request`.

## Solutions (In Order of Preference)

### Solution 1: Use `!failure() && !cancelled()` (RECOMMENDED)

Replace `if: success()` with the negated condition pattern:

```yaml
e2e-shards:
  name: E2E Shard ${{ matrix.shard }}
  needs: setup-server
  if: ${{ !failure() && !cancelled() }}
  # ... rest of job
```

**Why this works**: This pattern explicitly checks that no failure or cancellation occurred, and handles the "skipped" state correctly because `skipped != failure && skipped != cancelled`.

### Solution 2: Use `always()` with Result Check

```yaml
e2e-shards:
  name: E2E Shard ${{ matrix.shard }}
  needs: setup-server
  if: ${{ always() && needs.setup-server.result == 'success' }}
  # ... rest of job
```

**Why this works**: The `always()` function removes the implicit `success() && (<cond>)` that GitHub Actions applies by default. Then we explicitly check the parent job succeeded.

### Solution 3: Explicit Result Check with OR for Skipped

If the parent job can be legitimately skipped but you still want the matrix to run:

```yaml
e2e-shards:
  name: E2E Shard ${{ matrix.shard }}
  needs: setup-server
  if: ${{ needs.setup-server.result == 'success' || needs.setup-server.result == 'skipped' }}
  # ... rest of job
```

### Solution 4: Remove Parent Job Condition (Workaround)

Move the dependabot check to the matrix job instead of the parent:

```yaml
setup-server:
  name: Setup Test Server
  # Remove the if: condition here
  runs-on: ...

e2e-shards:
  name: E2E Shard ${{ matrix.shard }}
  needs: setup-server
  if: ${{ github.actor != 'dependabot[bot]' }}
  # This condition is now on the matrix job itself
```

**Trade-off**: This will run the setup-server job for dependabot PRs (wasting resources) but ensures the matrix is always properly evaluated.

## Key Takeaways

1. **The implicit `success()` behavior is problematic** - When a parent job has an `if:` condition, all downstream jobs inherit evaluation semantics that differ between trigger types.

2. **`!failure() && !cancelled()` is safer than `success()`** - This pattern handles the "skipped" state correctly and is the most commonly recommended workaround.

3. **`always()` is powerful but dangerous alone** - Using `always()` without additional conditions will run jobs even when the workflow is cancelled, which is usually undesirable.

4. **This is a known pain point** - Multiple GitHub community discussions and issues confirm this behavior is confusing and poorly documented.

## Sources & Citations

1. GitHub Docs - Using conditions to control job execution
   - https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/using-conditions-to-control-job-execution

2. GitHub Community Discussion #60792 - Conditional Jobs and matrix make it impossible to require
   - https://github.com/orgs/community/discussions/60792

3. GitHub Community Discussion #9141 - Skipping a matrix job hangs the Pull Request
   - https://github.com/orgs/community/discussions/9141

4. GitHub Actions Runner Issue #952 - Matrix job skipping behavior
   - https://github.com/actions/runner/issues/952

5. GitHub Actions Runner Issue #2205 - Jobs skipped when NEEDS job ran successfully
   - https://github.com/actions/runner/issues/2205

6. GitHub Docs - Running variations of jobs in a workflow
   - https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/running-variations-of-jobs-in-a-workflow

## Related Searches

- "GitHub Actions matrix dynamic output from needs"
- "GitHub Actions conditional reusable workflow matrix"
- "GitHub Actions workflow_dispatch vs pull_request evaluation differences"

## Specific Fix for e2e-sharded.yml

Change line 188 from:

```yaml
if: success()
```

To:

```yaml
if: ${{ !failure() && !cancelled() }}
```

Or alternatively:

```yaml
if: ${{ always() && needs.setup-server.result == 'success' }}
```

Both patterns should resolve the issue of matrix jobs not being created for `workflow_dispatch` triggers.
