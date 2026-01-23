# Perplexity Research: GitHub Actions workflow_dispatch Matrix Jobs Not Created

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (Multiple Queries)

## Query Summary

Researched a specific GitHub Actions issue where:
- A workflow with both `workflow_dispatch` and `pull_request` triggers
- Matrix job with 12 shards: `matrix: shard: [1,2,3,4,5,6,7,8,9,10,11,12]`
- Matrix job has `needs: setup-server` dependency
- No job-level `if:` condition on the matrix job
- Uses RunsOn runners: `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64`
- **Observed**: `pull_request` triggers create 14 jobs, but `workflow_dispatch` creates only 2 jobs

## Key Findings

### 1. Most Likely Root Cause: Empty/Dynamic Matrix Generation

**When a matrix job depends on another job's output via `fromJSON`, and that output evaluates to an empty array `[]`, the matrix job is completely skipped - zero jobs are created.** This is expected GitHub Actions behavior.

This could explain the issue if:
- The `setup-server` job generates the matrix values (shard list) dynamically
- For `workflow_dispatch`, the output might be resolving to an empty array
- For `pull_request`, the output correctly contains `[1,2,3,4,5,6,7,8,9,10,11,12]`

**Check**: Is the matrix shard list hardcoded or generated dynamically from a previous job?

### 2. Alternative Cause: Implicit `if: succeeded()` on `needs` Dependencies

When a job has `needs: setup-server` **without** an explicit `if:` condition, GitHub Actions applies an implicit `if: succeeded()` requirement. This means:
- If `setup-server` fails or is **skipped** for `workflow_dispatch`, all dependent matrix jobs are automatically skipped
- The matrix is never expanded because the dependency condition is not met
- Only the non-matrix jobs (setup + report) would run

**Check**: Review the `setup-server` job logs for `workflow_dispatch` runs to see if it completes successfully.

### 3. Not a Known GitHub Bug with `workflow_dispatch` + Matrix

Research found **no documented GitHub Actions bug** where matrix jobs specifically fail to create for `workflow_dispatch` triggers while working for other triggers. The matrix strategy mechanism itself works identically across trigger types.

The documented `workflow_dispatch` issues relate to:
- Workflow not appearing in Actions UI (requires workflow on default branch)
- Inputs not being available/parsed correctly
- Workflow file syntax errors preventing parsing on specific branches

### 4. RunsOn-Specific Considerations

No specific issues found with RunsOn and `workflow_dispatch` triggers. However:
- The dynamic `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` expression is **evaluated at runtime**
- If the expression evaluates differently or fails for `workflow_dispatch`, it could prevent runner assignment
- `github.run_id` should be available for both trigger types

**Check**: Verify `github.run_id` is being populated correctly for `workflow_dispatch` runs.

### 5. Matrix with Zero Combinations = Zero Jobs

Critical insight: **GitHub Actions treats an empty matrix as having no iterations to execute.** 

```yaml
strategy:
  matrix:
    shard: ${{ fromJSON(needs.setup-server.outputs.shards) }}
```

If `needs.setup-server.outputs.shards` evaluates to:
- `[]` (empty array) → **0 jobs created** (matrix job completely skipped)
- `[1,2,3...]` (valid array) → **N jobs created** (one per element)

This is the most likely explanation for seeing "only 2 jobs" (setup + report) vs "14 jobs" (setup + 12 shards + report).

## Diagnostic Steps

### Step 1: Check if Matrix is Dynamic
```yaml
# Look for patterns like:
strategy:
  matrix:
    shard: ${{ fromJSON(needs.*.outputs.something) }}
```

### Step 2: Verify setup-server Output for Both Triggers
Add debug output to the setup-server job:
```yaml
- name: Debug matrix output
  run: |
    echo "Shards: ${{ steps.*.outputs.shards }}"
    echo "Event: ${{ github.event_name }}"
```

### Step 3: Check for Conditional Logic Based on Event Type
Look for hidden conditionals:
```yaml
# In setup-server or matrix generation:
if: github.event_name == 'pull_request'  # This would skip for workflow_dispatch!
```

### Step 4: Test with Hardcoded Matrix
Temporarily replace dynamic matrix with static values:
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]  # Hardcoded
```

If this works for `workflow_dispatch`, the issue is in dynamic matrix generation.

## Sources & Citations

1. GitHub Community Discussion #25219 - workflow_dispatch trigger issues
   - https://github.com/orgs/community/discussions/25219

2. GitHub Community Discussion #42335 - Matrix jobs with needs dependencies
   - https://github.com/orgs/community/discussions/42335

3. GitHub Actions Runner Issue #952 - Skipping matrix jobs with if conditions
   - https://github.com/actions/runner/issues/952

4. RunsOn Matrix Strategy Documentation
   - https://runs-on.com/github-actions/the-matrix-strategy/

5. GitHub Actions Official Documentation - Matrix Strategy
   - https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix

6. Dynamic Matrix Generation with fromJSON
   - https://devopsdirective.com/posts/2025/08/advanced-github-actions-matrix/
   - https://www.peterbe.com/plog/programmatically-control-the-matrix-in-a-github-action-workflow

## Key Takeaways

1. **Most Probable Cause**: The matrix shard array is being generated dynamically and evaluates to empty `[]` for `workflow_dispatch` triggers, causing GitHub to create zero matrix jobs.

2. **Not a GitHub Bug**: This is expected behavior - empty matrices produce zero jobs.

3. **Debug Strategy**: 
   - Check if matrix is hardcoded or dynamic
   - Verify `setup-server` job outputs for both trigger types
   - Look for event-specific conditionals in matrix generation logic
   - Test with hardcoded matrix values to isolate the issue

4. **RunsOn Not the Cause**: No evidence that RunsOn or dynamic `runs-on` expressions with `github.run_id` behave differently for `workflow_dispatch`.

## Related Searches

- GitHub Actions dynamic matrix fromJSON empty array behavior
- GitHub Actions needs dependency skipped job cascade
- GitHub Actions workflow_dispatch inputs affecting matrix generation
- RunsOn ephemeral runners job pickup issues
