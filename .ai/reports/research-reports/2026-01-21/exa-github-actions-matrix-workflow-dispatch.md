# Exa Research: GitHub Actions Matrix Jobs with workflow_dispatch

**Date**: 2026-01-21
**Agent**: exa-expert
**Search Types Used**: Neural, Keyword, Answer, Get Contents

## Query Summary

Researched GitHub Actions issues related to:
1. "workflow_dispatch matrix jobs not created"
2. "github.event.inputs matrix max-parallel"
3. "matrix jobs skipped workflow_dispatch"
4. "runs-on dynamic expression matrix"

Focus: Finding known bugs, workarounds, and documentation about how GitHub evaluates expressions in strategy.matrix context, particularly differences between workflow_dispatch vs pull_request triggers.

## Key Findings

### 1. Job-Level `if` Conditions Are Evaluated BEFORE Matrix Expansion

**Critical Discovery**: When a job-level `if` condition evaluates to `false`, the matrix jobs are never created at all. The condition is evaluated before the matrix is expanded.

**Source**: [GitHub Actions Answer with Citations](https://docs.github.com/en/actions/reference/evaluate-expressions-in-workflows-and-actions)

> "The evaluation order is such that the matrix is generated first, then the `if` conditions are checked, which can lead to the jobs not being created if the conditions depend on inputs that are only available at runtime."

**Implication**: For `workflow_dispatch` triggers where inputs may not be available during initial evaluation (e.g., when the trigger comes from API vs manual UI), the job-level `if` may evaluate to `false` and prevent all matrix jobs from being created.

### 2. Known Bug: Inconsistent Matrix `if` Conditional Behavior

**GitHub Issue**: [actions/runner#2675](https://github.com/actions/runner/issues/2675)
**Status**: Closed as "not planned"

**Bug Description**:
- When a job is skipped due to an `if` condition, the parent job shows as "Skipped"
- However, child matrix jobs are incorrectly marked as "Successful" 
- This can allow pull requests to merge even when required tests were skipped

**Workaround**: Users must duplicate job configurations for each matrix element instead of using a single matrix with a job-level `if` condition.

### 3. Matrix Context Not Available for Job-Level `if` Conditions

**GitHub Community Discussion**: [#27105](https://github.com/orgs/community/discussions/27105)

The `matrix` context is only available WITHIN the job that defines it, not in the job-level `if` condition evaluation. This means:

```yaml
# This DOES NOT work as expected
jobs:
  test:
    if: ${{ matrix.os == 'ubuntu-latest' }}  # matrix not available here!
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
```

The condition evaluates BEFORE the matrix expands, so `matrix.os` is undefined.

### 4. Conditional Jobs and Matrix: Required Status Checks Issue

**GitHub Community Discussion**: [#60792](https://github.com/orgs/community/discussions/60792)

**Problem**: There's no way to distinguish between:
- "Skipped due to `if` condition" (intentional skip, e.g., `ci skip` in commit)
- "Skipped due to needed job failing" (failure case)

This makes it impossible to set up required status checks that work correctly for all scenarios.

### 5. Expression Evaluation with `fromJSON()` and `workflow_dispatch`

**Stack Overflow**: [How to override the default matrix with workflow_dispatch inputs](https://stackoverflow.com/questions/75767992/github-actions-how-to-override-the-default-matrix-with-workflow-dispatch-inputs)

**Working Pattern**:
```yaml
strategy:
  matrix:
    py_version: ${{ fromJSON(format('["%s"]', github.event.inputs.py_version || '3.7')) }}
```

This pattern allows dynamic matrix values from `workflow_dispatch` inputs while providing defaults.

### 6. runs-on Expression with Matrix Works Correctly

**Documentation**: [GitHub Docs - Running variations of jobs](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/running-variations-of-jobs-in-a-workflow)

```yaml
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
```

This pattern is supported and works correctly for both `workflow_dispatch` and `pull_request` triggers.

## Documented Workarounds

### Workaround 1: Move Condition to Step Level

Instead of job-level `if`:
```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    steps:
      - name: Run tests
        if: ${{ github.event_name != 'workflow_dispatch' || github.event.inputs.run_tests == 'true' }}
        run: npm test
```

### Workaround 2: Use `always()` with Step-Level Conditions

```yaml
jobs:
  test:
    if: ${{ always() }}  # Job always runs
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    steps:
      - name: Conditional step
        if: ${{ some_condition }}
        run: echo "Conditionally executed"
```

### Workaround 3: Generate Matrix Dynamically in Prior Job

```yaml
jobs:
  setup:
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "matrix={\"os\":[\"ubuntu-latest\"]}" >> $GITHUB_OUTPUT
          else
            echo "matrix={\"os\":[\"ubuntu-latest\",\"windows-latest\"]}" >> $GITHUB_OUTPUT
          fi
  
  test:
    needs: setup
    strategy:
      matrix: ${{ fromJSON(needs.setup.outputs.matrix) }}
```

### Workaround 4: Remove Job-Level `if` for Matrix Jobs

**Best Practice**: For `workflow_dispatch` triggered matrix jobs, do NOT use job-level `if` conditions. Instead:

1. Let all matrix jobs be created
2. Use step-level conditions to control what executes
3. Or use a separate "gate" job that determines if downstream matrix jobs should run

## Differences: workflow_dispatch vs pull_request

| Aspect | workflow_dispatch | pull_request |
|--------|-------------------|--------------|
| Inputs available | Only if manually provided | Always available via event context |
| Evaluation timing | Inputs may be null/undefined | Event payload always populated |
| Matrix creation | Can fail if `if` depends on inputs | Usually works reliably |
| Best practice | Avoid job-level `if` with inputs | Job-level `if` works normally |

## Related GitHub Issues

| Issue | Status | Description |
|-------|--------|-------------|
| [actions/runner#2675](https://github.com/actions/runner/issues/2675) | Closed (not planned) | Inconsistent matrix `if` conditional behavior |
| [actions/runner#1173](https://github.com/actions/runner/issues/1173) | Open | If conditions with expression syntax evaluated as false |
| [actions/runner#819](https://github.com/actions/runner/issues/819) | Open | `if: matrix.os` conditions always skipped |
| [actions/runner#897](https://github.com/actions/runner/issues/897) | Open | Feature request: `if` condition on matrix elements |
| [actions/runner#491](https://github.com/actions/runner/issues/491) | Open | Job-level `if` doesn't evaluate correctly when `needs` job skipped |
| [community#60792](https://github.com/orgs/community/discussions/60792) | Answered | Conditional jobs and matrix break required status checks |

## Recommendations for SlideHeroes CI

Based on this research, for the e2e-shards workflow:

1. **Remove job-level `if` conditions** from matrix jobs entirely
2. **Move conditions to step level** to control what executes
3. **Use dynamic matrix generation** in a prior job if conditional matrix values are needed
4. **Test with `always()`** at the job level if jobs must always be created but steps should be conditional

## Sources

1. [GitHub Docs - Running variations of jobs](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/running-variations-of-jobs-in-a-workflow)
2. [GitHub Docs - Using conditions to control job execution](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/using-conditions-to-control-job-execution)
3. [GitHub Docs - Evaluate expressions](https://docs.github.com/en/actions/reference/evaluate-expressions-in-workflows-and-actions)
4. [GitHub Docs - Contexts reference](https://docs.github.com/en/actions/learn-github-actions/contexts)
5. [actions/runner#2675 - Inconsistent matrix if conditional](https://github.com/actions/runner/issues/2675)
6. [community#60792 - Conditional jobs and matrix](https://github.com/orgs/community/discussions/60792)
7. [community#27105 - Matrix platform if condition](https://github.com/orgs/community/discussions/27105)
8. [SO - How to override matrix with workflow_dispatch](https://stackoverflow.com/questions/75767992/github-actions-how-to-override-the-default-matrix-with-workflow-dispatch-inputs)
9. [SO - How to make matrix element conditional](https://stackoverflow.com/questions/65384420/how-do-i-make-a-github-action-matrix-element-conditional)
10. [SO - Programmatic workflow_dispatch not running](https://stackoverflow.com/questions/69203666/programatic-github-workflow-dispatch-does-not-run-the-workflow)
