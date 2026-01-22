# Perplexity Research: GitHub Actions workflow_dispatch Matrix Jobs Not Created with needs

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (Combined)

## Query Summary

Investigated why GitHub Actions matrix jobs (12 shards) are created for `pull_request` trigger but NOT created for `workflow_dispatch` trigger in the same workflow file, specifically when using:
- `needs: setup-server` dependency
- `max-parallel: ${{ github.event.inputs.max_parallel || 3 }}`
- `type: choice` input definition

## Key Findings

### 1. Root Cause: Job Skipping Before Matrix Evaluation

**Critical Discovery**: When a job with a `needs` dependency is skipped (for any reason), the matrix is NEVER evaluated/expanded. The job is skipped at the "job level" before GitHub Actions ever calculates the matrix combinations.

This explains the observed behavior:
- For `pull_request`: The `setup-server` job runs successfully, so `e2e-shards` matrix expands to 12 jobs
- For `workflow_dispatch`: If `setup-server` is skipped or fails, `e2e-shards` is skipped entirely (0 jobs created)

### 2. `github.event.inputs` vs `inputs` Context Difference

**Documented Behavior**:
- `github.event.inputs` - Available for `workflow_dispatch` events, contains the webhook payload inputs
- `inputs` context - Available for BOTH `workflow_dispatch` AND `workflow_call` (reusable workflows)

**Key Difference**:
- For `pull_request` trigger: `github.event.inputs` is `undefined` (not null)
- For `workflow_dispatch` without provided inputs: `github.event.inputs` may be `null` or empty object

**Expression Evaluation Impact**:
```yaml
max-parallel: ${{ github.event.inputs.max_parallel || 3 }}
```
- `undefined || 3` = `3` (works)
- `null || 3` = `3` (works)
- But the expression may cause issues if the entire `github.event.inputs` object structure differs

### 3. `type: choice` Input Behavior

According to research, `type: choice` inputs:
- Are always treated as **strings** (not native types)
- Require a `default` value when not provided
- May have validation issues when triggered via API without explicit input values

From GitHub community discussion #27262:
> "Provided value '' for input 'foo' not in the list of allowed values"

This suggests `type: choice` can cause validation failures if the input handling differs between UI and programmatic triggers.

### 4. Known GitHub Issues Related to This Pattern

#### Issue #952: Skipping a Matrix Job Before Expansion
URL: https://github.com/actions/runner/issues/952

> "Jobs with a build matrix configuration can be skipped from the top level, **before expanding the matrix**. This is problematic when the inner-matrix jobs are set as required status checks."

**Key Quote**: "The matrix was never expanded, and so the jobs were never even created - but we now wait for these non-existent jobs forever."

Status: OPEN (enhancement requested but low priority)

#### Issue #2205: Jobs Skipped When NEEDS Job Ran Successfully
URL: https://github.com/actions/runner/issues/2205

Describes unexpected skipping behavior when combining `needs` with `if` conditions.

**Workaround documented**:
```yaml
if: always() && (needs.job.result == 'skipped' || needs.job.result == 'success')
```

#### Discussion #2566: Required Status Check Skipped on Dependency Failure
URL: https://github.com/actions/runner/issues/2566

**Key Documentation Quote**:
> "A job that is skipped will report its status as 'Success'. It will not prevent a pull request from merging, even if it is a required check."

### 5. The `needs` + Matrix + `if` Interaction

When a job has:
1. `needs: [another-job]`
2. `strategy: matrix: ...`
3. An implicit `if: success()` (default behavior)

The evaluation order is:
1. Check if all `needs` jobs succeeded
2. Evaluate `if` condition
3. **IF AND ONLY IF** steps 1 & 2 pass: Expand the matrix

If step 1 fails (needs job skipped/failed), step 3 NEVER happens.

## Hypothesis for Your Specific Issue

Your `setup-server` job likely has an `if:` condition or behavior that differs between `pull_request` and `workflow_dispatch`:

1. **Check if `setup-server` has any `if:` conditions** that reference:
   - `github.event_name`
   - `github.event.pull_request`
   - Path filters or other PR-specific contexts

2. **Verify `setup-server` completion status** for both triggers:
   - `pull_request`: Check if it shows as "success"
   - `workflow_dispatch`: Check if it shows as "skipped" or even runs at all

3. **The `max-parallel` expression is likely NOT the issue** - the issue is upstream in `setup-server`

## Recommended Investigation Steps

### Step 1: Check setup-server Job
Look for any conditions on `setup-server` that would skip it for `workflow_dispatch`:
```yaml
setup-server:
  if: <check-this-condition>
```

### Step 2: Add Debug Output
```yaml
e2e-shards:
  needs: setup-server
  if: always()  # Force the job to attempt running
  runs-on: ubuntu-latest
  steps:
    - name: Debug needs context
      run: |
        echo "setup-server result: ${{ needs.setup-server.result }}"
        echo "Event name: ${{ github.event_name }}"
        echo "Inputs: ${{ toJSON(github.event.inputs) }}"
```

### Step 3: Verify Input Defaults
Ensure your workflow_dispatch input has a proper default:
```yaml
on:
  workflow_dispatch:
    inputs:
      max_parallel:
        type: choice
        default: '3'  # Must be string matching an option
        options: ['2', '3', '4', '5', '6']
```

### Step 4: Use `inputs` Context (More Reliable)
```yaml
max-parallel: ${{ inputs.max_parallel || 3 }}
```
Instead of:
```yaml
max-parallel: ${{ github.event.inputs.max_parallel || 3 }}
```

## Workarounds

### Option A: Use `always()` with Result Check
```yaml
e2e-shards:
  needs: setup-server
  if: always() && (needs.setup-server.result == 'success' || needs.setup-server.result == 'skipped')
  strategy:
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

### Option B: Remove `needs` Conditionally
If `setup-server` is only needed for PR contexts:
```yaml
e2e-shards:
  needs: ${{ github.event_name == 'pull_request' && 'setup-server' || '' }}
```
(Note: This syntax may not work directly - you'd need two separate job definitions)

### Option C: Separate Workflow Files
Create `e2e-manual.yml` for `workflow_dispatch` without the `needs` dependency.

## Sources & Citations

1. **GitHub Runner Issue #952** - Matrix job skipping before expansion
   https://github.com/actions/runner/issues/952

2. **GitHub Runner Issue #2205** - Jobs skipped with needs dependency
   https://github.com/actions/runner/issues/2205

3. **GitHub Runner Issue #2566** - Required status check skipped
   https://github.com/actions/runner/issues/2566

4. **GitHub Community Discussion #141124** - Dynamic max-parallel setting
   https://github.com/orgs/community/discussions/141124

5. **GitHub Community Discussion #27262** - workflow_dispatch boolean input issues
   https://github.com/orgs/community/discussions/27262

6. **Bruno Scheufler Blog** - The Required GitHub Status Check That Wasn't
   https://brunoscheufler.com/blog/2022-04-09-the-required-github-status-check-that-wasnt

7. **GitHub Docs** - Workflow syntax for GitHub Actions
   https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

8. **Lucas Roesler Blog** - Hard Won Lessons About GitHub Actions
   https://lucasroesler.com/posts/2022/2-github-actions-lessons/

## Key Takeaways

1. **Matrix jobs are NOT created when the parent job is skipped** - this is documented behavior, not a bug
2. **The `needs` dependency evaluation happens BEFORE matrix expansion**
3. **`github.event.inputs` behavior differs subtly between trigger types**
4. **`type: choice` inputs must have valid defaults to work with programmatic triggers**
5. **Using `always()` in `if:` conditions can force matrix evaluation, but requires careful result checking**

## Related Searches

- GitHub Actions matrix job dependency chain behavior
- `workflow_dispatch` vs `repository_dispatch` input handling
- Required status checks with matrix jobs and conditional skipping
- GitHub Actions `needs` context when job is skipped
