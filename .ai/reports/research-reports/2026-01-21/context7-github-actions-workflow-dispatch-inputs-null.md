# Context7 Research: GitHub Actions workflow_dispatch Inputs and Null Expression Evaluation

**Date**: 2026-01-21
**Agent**: context7-expert
**Libraries Researched**: websites/github_en_actions, actions/toolkit

## Query Summary

Researched how GitHub Actions evaluates expressions when `github.event.inputs` is completely null vs when inputs are provided, specifically for programmatic workflow_dispatch triggers.

## Key Questions Addressed

1. Does `github.event.inputs.max_parallel` throw an error when `github.event.inputs` is null?
2. Does `github.event.inputs.max_parallel || 3` evaluate correctly?
3. Is there a difference between `github.event.inputs` and `inputs` context?
4. Can this cause matrix jobs to not be created?

## Findings

### 1. Two Distinct Input Contexts: `inputs` vs `github.event.inputs`

**Critical Discovery**: GitHub Actions provides TWO different ways to access workflow_dispatch inputs:

| Context | Type Safety | Default Handling | Recommended |
|---------|-------------|------------------|-------------|
| `inputs` | Type-aware (boolean, number, string) | Uses defined defaults | **Yes** |
| `github.event.inputs` | Always strings | Raw webhook payload | No |

From the documentation:
> "Note that inputs are available in both `inputs` and `github.event.inputs` contexts."

**Key Difference**: The `inputs` context is specifically designed for workflow inputs and provides:
- Proper type coercion based on `type:` definition
- Automatic default value application
- Available for both `workflow_dispatch` and `workflow_call`

The `github.event.inputs` context is:
- The raw webhook payload (always strings)
- May be `null` when triggered programmatically without inputs
- Does NOT automatically apply defaults

### 2. Expression Evaluation with Null Objects

GitHub Actions expressions use a forgiving evaluation model:

```yaml
# When github.event.inputs is null:
${{ github.event.inputs.max_parallel }}  # Returns empty string '', not an error
${{ github.event.inputs.max_parallel || 3 }}  # Returns 3 (falsy || fallback)
```

**How it works**:
- Property access on null/undefined objects returns empty string `''`
- Empty string is falsy in expression evaluation
- The `||` operator returns the first truthy value

From the expressions documentation:
```yaml
env:
  myNull: ${{ null }}  # Literal null is supported
  MY_ENV_VAR: ${{ github.ref == 'refs/heads/main' && 'value_for_main_branch' || 'value_for_other_branches' }}
```

### 3. Default Values and Type Coercion

**For `inputs` context (RECOMMENDED)**:
```yaml
on:
  workflow_dispatch:
    inputs:
      max_parallel:
        type: choice
        default: '3'
        options:
          - '1'
          - '3'
          - '6'

jobs:
  test:
    strategy:
      max-parallel: ${{ inputs.max_parallel }}  # Gets default '3' if not provided
```

**For `github.event.inputs` context (NOT RECOMMENDED)**:
```yaml
jobs:
  test:
    strategy:
      max-parallel: ${{ github.event.inputs.max_parallel || 3 }}  # Manual fallback required
```

### 4. Programmatic Triggers and Matrix Jobs

**Potential Issue Identified**: When workflow_dispatch is triggered via API without inputs:

```bash
# API call without inputs
POST /repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches
{
  "ref": "main"
  # No "inputs" field
}
```

In this scenario:
- `github.event.inputs` may be `null` (not an empty object)
- `github.event.inputs.max_parallel` returns `''` (empty string)
- `${{ github.event.inputs.max_parallel || 3 }}` returns `3` (fallback works)
- **BUT**: The `inputs` context will use the defined default value automatically

**Matrix Job Creation**:
- Matrix jobs should still be created as long as the expression evaluates to a valid value
- Empty string or null in `max-parallel` could cause issues
- Using `|| 3` fallback ensures a valid numeric value

### 5. Recommended Pattern

**Use the `inputs` context, not `github.event.inputs`**:

```yaml
on:
  workflow_dispatch:
    inputs:
      max_parallel:
        description: 'Maximum parallel jobs'
        type: choice
        default: '3'
        options:
          - '1'
          - '3'
          - '6'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      max-parallel: ${{ fromJSON(inputs.max_parallel) }}  # Use inputs, convert to number
```

**Why `fromJSON()`?**
- Choice inputs are always strings
- `max-parallel` expects a number
- `fromJSON('3')` converts string `'3'` to number `3`

### 6. Defensive Pattern for Both Contexts

If you must support both UI triggers and programmatic API calls:

```yaml
strategy:
  max-parallel: ${{ fromJSON(inputs.max_parallel || github.event.inputs.max_parallel || '3') }}
```

This pattern:
1. First tries `inputs.max_parallel` (type-safe, with defaults)
2. Falls back to `github.event.inputs.max_parallel` (raw payload)
3. Falls back to literal `'3'`
4. Converts final string to number with `fromJSON()`

## Code Examples

### Example 1: Safe workflow_dispatch with matrix

```yaml
name: E2E Tests
on:
  workflow_dispatch:
    inputs:
      max_parallel:
        description: 'Max parallel test runners'
        type: choice
        default: '3'
        options:
          - '1'
          - '3'
          - '6'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      max-parallel: ${{ fromJSON(inputs.max_parallel) }}
      matrix:
        shard: [1, 2, 3, 4, 5, 6]
    steps:
      - name: Run tests
        run: echo "Running shard ${{ matrix.shard }}"
```

### Example 2: Conditional job based on input

```yaml
on:
  workflow_dispatch:
    inputs:
      perform_deploy:
        type: boolean
        default: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ inputs.perform_deploy }}  # Uses inputs context (type-safe)
    steps:
      - run: echo "Deploying..."
```

### Example 3: Debugging inputs

```yaml
jobs:
  debug:
    runs-on: ubuntu-latest
    steps:
      - name: Debug inputs
        run: |
          echo "inputs context: ${{ toJSON(inputs) }}"
          echo "github.event.inputs: ${{ toJSON(github.event.inputs) }}"
```

## Key Takeaways

1. **Use `inputs` context** - It provides type safety and automatic defaults
2. **`github.event.inputs` is raw** - Always strings, may be null when triggered programmatically
3. **Expression evaluation is forgiving** - Property access on null returns empty string, not error
4. **`||` fallback works** - Empty string is falsy, so `${{ value || default }}` works as expected
5. **Use `fromJSON()` for numbers** - Convert string inputs to numbers for `max-parallel`
6. **Matrix jobs won't fail** - As long as the expression evaluates to a valid value

## Answer to Original Questions

| Question | Answer |
|----------|--------|
| Does `github.event.inputs.max_parallel` throw error when null? | **No** - Returns empty string `''` |
| Does `github.event.inputs.max_parallel \|\| 3` evaluate correctly? | **Yes** - Returns `3` when inputs is null |
| Difference between `github.event.inputs` and `inputs`? | **Yes** - `inputs` is type-aware with defaults, `github.event.inputs` is raw strings |
| Can this cause matrix jobs to not be created? | **Unlikely** - As long as fallback provides valid value |

## Recommendation for the Project

For the SlideHeroes e2e-shards workflow, use:

```yaml
strategy:
  max-parallel: ${{ fromJSON(inputs.max_parallel || '3') }}
```

This ensures:
- Uses the `inputs` context (gets default from workflow definition)
- Has a string fallback for edge cases
- Converts to number for `max-parallel`

## Sources

- GitHub Actions Contexts via Context7 (websites/github_en_actions)
- GitHub Actions Expressions via Context7 (websites/github_en_actions)
- GitHub Actions Toolkit via Context7 (actions/toolkit)
