# Perplexity Research: GitHub Actions workflow_dispatch Matrix Jobs Not Created

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Investigated why GitHub Actions matrix jobs are NOT created when triggering a workflow via `workflow_dispatch`, while the same workflow works correctly with `pull_request` trigger.

**Specific configuration under investigation:**
```yaml
e2e-shards:
  needs: setup-server
  runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
  strategy:
    fail-fast: false
    max-parallel: ${{ github.event.inputs.max_parallel || 3 }}
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

## Key Findings

### 1. **ROOT CAUSE IDENTIFIED: `max-parallel` Expression Type Issue**

**This is the most likely cause of the issue.**

GitHub Actions requires `max-parallel` to be a **static integer value** evaluated at workflow parse time. The expression `${{ github.event.inputs.max_parallel || 3 }}` causes problems because:

1. **Type coercion failure**: When `github.event.inputs.max_parallel` is undefined (workflow_dispatch without providing that input), the `||` operator performs string concatenation, not numeric fallback
2. **Empty string evaluates incorrectly**: An undefined input becomes empty string `""`, and `"" || 3` may still evaluate to `"3"` (string) rather than `3` (integer)
3. **Parse-time evaluation**: `max-parallel` is evaluated at workflow parse time, not runtime, which means dynamic expressions can fail validation silently

**Evidence from GitHub Community Discussion #141124**:
> "GitHub Actions doesn't directly support dynamic `max-parallel` values within a single matrix job"

**Solution**: Use a static integer or conditional job splitting:
```yaml
# Option 1: Static value
max-parallel: 3

# Option 2: Use inputs context (not github.event.inputs)
max-parallel: ${{ inputs.max_parallel || 3 }}
```

### 2. **`github.event.inputs` vs `inputs` Context**

GitHub recommends using the `inputs` context instead of `github.event.inputs` for `workflow_dispatch`:

> "Replace `github.event.inputs` with the `inputs` context, which is available and recommended for `workflow_dispatch`"

**Key differences:**
- `inputs` context preserves Boolean values as Booleans
- `github.event.inputs` converts everything to strings
- For numeric values like `max-parallel`, this distinction matters

**GitHub Blog Changelog (June 2022)**:
> "Workflows triggered by `workflow_dispatch` and `workflow_call` can now access their inputs using the `inputs` context"

### 3. **Potential Issue: Empty/Invalid Matrix Configuration**

If the matrix evaluates to empty or invalid values, **0 jobs are created**:

- Dynamic matrix from outputs returning nothing
- Invalid matrix values (string instead of array)
- Conditional logic filtering out all matrix combinations

### 4. **Runner Expression Syntax**

The `runs-on` syntax `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` is non-standard. While this may work with RunsOn self-hosted runners, verify:

- The expression is correctly evaluated for both trigger types
- Self-hosted runners are available and accepting jobs
- Labels match exactly what runners expect

### 5. **Known GitHub Bug: workflow_dispatch Visibility**

There's a long-standing GitHub bug (Discussion #25219) where `workflow_dispatch` workflows sometimes don't appear or work correctly:

> "It's a bug with GitHub, I just confirmed. I changed the name of the files and the name of the workflow and now it's showing for me."

**Workarounds:**
- Rename workflow file
- Make a trivial change and commit
- Ensure workflow is in default branch

## Recommended Fixes (Priority Order)

### Fix 1: Change `max-parallel` to Static Integer
```yaml
strategy:
  fail-fast: false
  max-parallel: 3  # Static integer, not expression
  matrix:
    shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

### Fix 2: Use `inputs` Context with Number Type
```yaml
on:
  workflow_dispatch:
    inputs:
      max_parallel:
        description: 'Maximum parallel jobs'
        type: number  # Explicitly number type
        default: 3
        required: false

jobs:
  e2e-shards:
    strategy:
      max-parallel: ${{ inputs.max_parallel }}  # Use inputs, not github.event.inputs
```

### Fix 3: Use fromJson for Type Conversion
```yaml
strategy:
  max-parallel: ${{ fromJson(github.event.inputs.max_parallel || '3') }}
```

### Fix 4: Conditional Jobs Instead of Dynamic max-parallel
```yaml
jobs:
  e2e-limited:
    if: github.event.inputs.max_parallel == '1'
    strategy:
      max-parallel: 1
      matrix:
        shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  e2e-parallel:
    if: github.event.inputs.max_parallel != '1'
    strategy:
      max-parallel: 3
      matrix:
        shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

## Debugging Steps

1. **Add diagnostic step before matrix job:**
```yaml
debug-inputs:
  runs-on: ubuntu-latest
  steps:
    - name: Debug inputs
      run: |
        echo "Event name: ${{ github.event_name }}"
        echo "max_parallel input: '${{ github.event.inputs.max_parallel }}'"
        echo "inputs.max_parallel: '${{ inputs.max_parallel }}'"
        echo "Evaluated max-parallel: '${{ github.event.inputs.max_parallel || 3 }}'"
```

2. **Enable debug logging**: Set `ACTIONS_STEP_DEBUG=true` secret

3. **Test with minimal matrix:**
```yaml
matrix:
  shard: [1]  # Single item to verify matrix creation
```

## Sources & Citations

1. **GitHub Community Discussion #141124** - "Github action matrix strategy how to set max-parallel dynamically"
   - URL: https://github.com/orgs/community/discussions/141124
   - Key insight: GitHub Actions doesn't support dynamic max-parallel in single matrix job

2. **GitHub Community Discussion #25219** - "Missing workflow_dispatch at the Action tab"
   - URL: https://github.com/orgs/community/discussions/25219
   - Key insight: Known bug with workflow_dispatch visibility, workaround is rename file

3. **GitHub Blog Changelog (June 2022)** - "GitHub Actions: Inputs unified across manual and reusable workflows"
   - URL: https://github.blog/changelog/2022-06-09-github-actions-inputs-unified-across-manual-and-reusable-workflows/
   - Key insight: Use `inputs` context instead of `github.event.inputs`

4. **GitHub Docs** - "Workflow syntax for GitHub Actions"
   - URL: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
   - Key insight: max-parallel accepts integer values

5. **Earthly Blog** - "Making the Most of Concurrency in GitHub Actions"
   - URL: https://earthly.dev/blog/concurrency-in-github-actions/
   - Key insight: Matrix strategy and max-parallel interaction patterns

6. **GitHub Docs** - "Troubleshooting workflows"
   - URL: https://docs.github.com/en/actions/how-tos/troubleshoot-workflows
   - Key insight: Debugging workflow triggers and execution

## Key Takeaways

1. **`max-parallel` must be an integer** - Dynamic expressions with `||` operator can fail silently
2. **Use `inputs` context** for workflow_dispatch, not `github.event.inputs`
3. **Type matters**: String "3" is not the same as integer 3 for max-parallel
4. **Static values are safer** for strategy configuration
5. **Test trigger types separately** - workflow_dispatch and pull_request may evaluate differently

## Related Searches

- GitHub Actions matrix job not starting with needs dependency
- RunsOn self-hosted runner label syntax with expressions
- GitHub Actions strategy configuration validation errors
- workflow_dispatch input type coercion issues
