# Bug Diagnosis: Check for Stale Deployment Job Fails with SyntaxError

**ID**: ISSUE-pending
**Created**: 2026-02-06T14:35:00Z
**Reporter**: system (discovered during #1954 investigation)
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The "Check for Stale Deployment" job in the `dev-promotion-readiness.yml` workflow always fails with `SyntaxError: Unexpected token ')'`. The JavaScript code in the `Check deployment age` step is truncated — missing the closing `}` brace for the `else` block. This was introduced in commit `31a6e8bb7` on 2026-02-02 when a trailing `}` was accidentally removed during an edit to add auto-approve functionality.

## Environment

- **Application Version**: dev branch (HEAD)
- **Environment**: GitHub Actions CI
- **Node Version**: GitHub Actions runner default (Node 20+)
- **Last Working**: Commit `af0ead3e0` (before `31a6e8bb7`)

## Reproduction Steps

1. Trigger the "Dev Promotion Readiness" workflow via `workflow_dispatch`
2. The "Check for Stale Deployment" job runs
3. The "Check deployment age" step fails with `SyntaxError: Unexpected token ')'`

## Expected Behavior

The "Check for Stale Deployment" job should complete successfully, checking if the dev deployment is more than 24 hours old and creating an issue if it is.

## Actual Behavior

The job fails immediately with a JavaScript syntax error because the `actions/github-script` code is truncated and missing its closing brace.

## Diagnostic Data

### Console Output

```
SyntaxError: Unexpected token ')'
    at new AsyncFunction (<anonymous>)
    at callAsyncFunction (/home/runner/work/_actions/actions/github-script/v8/dist/index.js:36187:16)
    at main (/home/runner/work/_actions/actions/github-script/v8/dist/index.js:36285:26)
```

### Git Bisect Evidence

```diff
# Commit 31a6e8bb7 "fix(ci): add auto-approve for staging promotion PRs"
# The following line was removed from the end of the file:

-            }
\ No newline at end of file
```

The original file ended with `}` and no trailing newline. When commit `31a6e8bb7` made edits elsewhere in the file, this closing brace was accidentally deleted.

## Error Stack Traces

```
SyntaxError: Unexpected token ')'
    at new AsyncFunction (<anonymous>)
    at callAsyncFunction (/home/runner/work/_actions/actions/github-script/v8/dist/index.js:36187:16)
```

## Related Code

- **Affected Files**:
  - `.github/workflows/dev-promotion-readiness.yml` (lines 438-439)
- **Recent Changes**: Commit `31a6e8bb7` on 2026-02-02 removed the closing brace
- **Suspected Functions**: `check-stale-deployment` job, `Check deployment age` step

## Related Issues & Context

### Direct Predecessors
- #1954 (CLOSED): "Bug Fix: APP_ID Secret Points to Wrong GitHub App" - Discovered this bug while verifying #1954 fix
- #1951 (CLOSED): "Bug Diagnosis: APP_ID Secret Points to Wrong GitHub App" - Original diagnosis that led to #1954

### Same Component
- Commit `31a6e8bb7`: "fix(ci): add auto-approve for staging promotion PRs" - The commit that introduced this bug

### Historical Context
This bug has existed since 2026-02-02 (commit `31a6e8bb7`). It has been masked by the fact that the "Check for Stale Deployment" job is independent from the "Assess Promotion Readiness" job, so the main PR creation/approval flow continued to work (or fail for other reasons) while this job silently failed.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The closing `}` brace on the last line of `dev-promotion-readiness.yml` was accidentally deleted in commit `31a6e8bb7`, leaving the JavaScript code in the `Check deployment age` step syntactically incomplete.

**Detailed Explanation**:
The file originally ended with:
```javascript
            } else {
              console.log(`Dev deployment is ${hoursOld.toFixed(1)} hours old (within 24h limit)`);
            }
```
Note: there was no trailing newline after the last `}` (indicated by `\ No newline at end of file` in git diffs).

When commit `31a6e8bb7` modified other parts of the file (adding auto-approve steps, updating actions versions from v4/v7 to v6/v8), the last line containing only `}` was deleted. This is a common git/editor pitfall when the file has no trailing newline — tools sometimes strip or lose the last line.

**Supporting Evidence**:
- `git diff af0ead3e0..31a6e8bb7 -- .github/workflows/dev-promotion-readiness.yml` shows `-            }\n\ No newline at end of file` at the bottom of the diff
- Every workflow run since 2026-02-02 shows this job failing with the same `SyntaxError`
- The original file (commit `83bd30d8b`) has the closing brace present

### How This Causes the Observed Behavior

1. GitHub Actions runs the `check-stale-deployment` job
2. The `Check deployment age` step passes the script to `actions/github-script@v8`
3. `actions/github-script` wraps the code in an `AsyncFunction` constructor
4. JavaScript parser encounters the `else` block that opens `{` but never closes
5. Parser hits the end of input, finds `)` from the `AsyncFunction` wrapper instead of `}`
6. Throws `SyntaxError: Unexpected token ')'`

### Confidence Level

**Confidence**: High

**Reasoning**: The git diff explicitly shows the deletion of the closing brace. The syntax error matches exactly — a missing `}` would cause the parser to encounter the wrapper's `)` unexpectedly. The original commit has the brace; the introducing commit removes it.

## Fix Approach (High-Level)

Add the missing closing `}` brace to line 440 of `.github/workflows/dev-promotion-readiness.yml`, and add a trailing newline to prevent this from recurring. The fix is a one-line addition:

```yaml
              console.log(`Dev deployment is ${hoursOld.toFixed(1)} hours old (within 24h limit)`);
            }
```

## Diagnosis Determination

Root cause is definitively identified: a missing closing brace at the end of the file, introduced by commit `31a6e8bb7` on 2026-02-02. The fix is trivial — add the `}` back and ensure a trailing newline.

## Additional Context

- This job failure does not affect the main promotion flow (PR creation + approval)
- The bug has existed for 4 days without being noticed because the two jobs are independent
- The `staging-promotion-readiness.yml` workflow does NOT have this issue (its scripts are properly closed)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs, issue search), git (bisect via show, diff, log), Read (file inspection)*
