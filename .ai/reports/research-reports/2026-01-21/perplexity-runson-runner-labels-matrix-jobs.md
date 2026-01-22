# Perplexity Research: RunsOn Self-Hosted Runner Labels and Matrix Job Compatibility

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (Multiple queries)

## Query Summary

Investigated the RunsOn (runs-on.com) self-hosted runner platform's label syntax and compatibility with GitHub Actions matrix jobs, specifically focusing on:
1. Validity of the `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` syntax
2. Expression evaluation timing and matrix job creation
3. Known incompatibilities with workflow_dispatch triggers

## Findings

### 1. RunsOn Label Syntax - VALID

**The syntax `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` is the official recommended syntax for RunsOn.**

From the RunsOn GitHub repository and documentation:

```yaml
# Before (GitHub-hosted):
runs-on: ubuntu-latest

# After (RunsOn):
runs-on: "runs-on=${{ github.run_id }}/runner=2cpu-linux-x64"
```

**Key points about RunsOn label syntax:**
- Uses a single string label (not array format)
- Combines multiple parameters with `/` delimiter
- `runs-on=${{ github.run_id }}` provides workflow isolation
- `runner=2cpu-linux-x64` specifies the runner type
- Other parameters available: `cpu=`, `ram=`, `family=`, `image=`, `spot=`, `private=`

### 2. The `github.run_id` Expression - PURPOSE AND TIMING

**Purpose:** The `github.run_id` is included to prevent "runner stealing" - a scenario where runners started for one job get claimed by another job with matching labels.

**Expression Evaluation:**
- GitHub Actions evaluates `${{ }}` expressions in `runs-on` **before** job scheduling
- The `github.run_id` is available immediately when the workflow starts
- It is the same for ALL jobs in a workflow run (including matrix jobs)
- **This is NOT a problem** - the expression evaluates to a unique ID for the workflow run

### 3. Matrix Job Compatibility - SPECIFIC CONSIDERATION

**Important:** For matrix jobs, `github.run_id` alone is **NOT unique per matrix job**. RunsOn documentation specifically addresses this:

> "If you are using matrix jobs, note that the `github.run_id` is not unique for each matrix job. It is only unique for each workflow run."

**Recommended pattern for matrix jobs:**

```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3]
    runs-on: "runs-on=${{ github.run_id }}-${{ strategy.job-index }}/runner=2cpu-linux-x64"
```

Or with run attempt for reruns:

```yaml
runs-on: "runs-on=${{ github.run_id }}-${{ strategy.job-index }}-${{ github.run_attempt }}/runner=2cpu-linux-x64"
```

### 4. Job-Level `if` Conditions and Matrix Jobs - POTENTIAL ISSUE

**Critical finding from GitHub documentation:**

> "The `jobs.<job_id>.if` condition is evaluated **before** `jobs.<job_id>.strategy.matrix` is applied."

This means:
- If you have a job-level `if:` condition, it is evaluated BEFORE matrix expansion
- The `matrix` context is NOT available in `jobs.<job_id>.if` (only in steps)
- **This could cause issues if you're trying to conditionally run matrix jobs**

**However, this does NOT affect the `runs-on` expression evaluation** - the `runs-on` is evaluated AFTER the matrix is applied, so `matrix.*` variables work correctly in `runs-on`.

### 5. workflow_dispatch Compatibility - NO KNOWN INCOMPATIBILITIES

From the research:
- The `${{ github.run_id }}` expression works correctly with `workflow_dispatch` triggers
- The run_id is assigned when the workflow is triggered, regardless of trigger type
- Matrix jobs expand correctly for workflow_dispatch

**One caveat found:** When using bracket array syntax `[ ]` with expressions in `runs-on`, users report YAML syntax errors. The solution is to use dash-list syntax or quoted strings:

```yaml
# This may cause YAML errors:
runs-on: [ self-hosted, ${{ matrix.os }} ]

# These work correctly:
runs-on: "runs-on=${{ github.run_id }}/runner=2cpu-linux-x64"  # Single string (RunsOn style)

runs-on:
  - self-hosted
  - ${{ matrix.os }}  # Dash-list syntax

runs-on: [ self-hosted, "${{ matrix.os }}" ]  # Quoted expression
```

### 6. RunsOn-Specific Best Practices

**Single label syntax (recommended):**
```yaml
runs-on: "runs-on=${{ github.run_id }}/runner=2cpu-linux-x64"
```

**Array syntax (supported but NOT recommended by RunsOn):**
The array syntax can cause "runner stealing" where other jobs claim your runner.

**Custom runner configurations:**
Define reusable configurations in `.github/runs-on.yml` to avoid inline repetition.

## Summary Answers to Original Questions

### Q1: Is this syntax valid for RunsOn self-hosted runners?
**YES** - `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` is the official RunsOn syntax.

### Q2: Could the `${{ github.run_id }}` expression cause issues with matrix job creation?
**PARTIALLY** - The expression itself works fine, but `github.run_id` is the same for all matrix jobs. For matrix jobs, you should append `${{ strategy.job-index }}` to ensure unique labels per matrix element.

### Q3: Is there any known incompatibility between RunsOn labels and matrix jobs triggered by workflow_dispatch?
**NO** - No specific incompatibility found. The syntax works correctly with workflow_dispatch. Any issues are likely due to other factors (YAML syntax with arrays+expressions, or runner stealing without unique matrix identifiers).

### Q4: Could the runner label expression be evaluated at a time when it affects matrix job scheduling?
**NO** - The `runs-on` expression is evaluated AFTER matrix expansion, so it correctly receives matrix context values. The job-level `if:` condition is evaluated before matrix expansion, but this doesn't affect `runs-on`.

## Recommendations

1. **For matrix jobs with RunsOn**, use the extended format:
   ```yaml
   runs-on: "runs-on=${{ github.run_id }}-${{ strategy.job-index }}/runner=2cpu-linux-x64"
   ```

2. **Always quote the runs-on string** to avoid YAML parsing issues with expressions.

3. **Move job-level conditions to step-level** if you need to reference matrix values in conditions.

4. **Check for runner stealing** if matrix jobs are experiencing unexpected queue times - ensure unique identifiers per matrix element.

## Sources & Citations

- https://github.com/runs-on/runs-on (Official RunsOn repository)
- https://runs-on.com/configuration/job-labels/ (Job labels documentation)
- https://runs-on.com/guides/troubleshoot/ (Troubleshooting guide - runner stealing section)
- https://runs-on.com/github-actions/the-matrix-strategy/ (Matrix strategy guide)
- https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/using-conditions-to-control-job-execution (GitHub docs - if condition timing)
- https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/use-in-a-workflow (Self-hosted runner usage)
- https://github.com/orgs/community/discussions/50172 (Community discussion on multiple labels with matrix)

## Key Takeaways

- RunsOn syntax is valid and well-documented
- Matrix jobs need `strategy.job-index` appended for unique runner labels
- No workflow_dispatch incompatibility exists
- Expression evaluation timing is correct for `runs-on` (after matrix expansion)
- Consider step-level conditions instead of job-level if matrix context is needed

## Related Searches

- RunsOn runner pools for reduced startup times
- GitHub Actions ephemeral runners vs persistent runners
- RunsOn custom images and AMI configuration
