# Bug Diagnosis: PR Validation Fails on Dependabot PRs Despite Fixes in Dev

**ID**: ISSUE-pending
**Created**: 2026-01-22T17:50:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: regression

## Summary

The PR Validation workflow continues to fail on Dependabot PRs even though fixes for issues #1740 (PAYLOAD_SECRET), #1743 (build-wrapper.sh syntax error), and #1744 (Aikido IaC scan 402 error) have been implemented and merged to the `dev` branch. The root cause is that Dependabot branches are created from `dev` at a specific point in time and do not automatically inherit subsequent changes to the workflow files in `dev`.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **GitHub Actions Runner**: runs-on spot instances
- **Last Working**: N/A (Dependabot PRs weren't working before fixes were merged)

## Reproduction Steps

1. Create a Dependabot branch before fixes are merged to `dev`
2. Push fixes to `dev` branch (commits `7254e6447`, `8b8e4d8d7`, `2bcdf69b3`)
3. Trigger PR Validation workflow on the Dependabot PR
4. Observe that the workflow still uses the old (unfixed) workflow files from when the branch was created

## Expected Behavior

PR Validation should pass using the fixed workflow configuration (with `fail-on-iac-scan: false` and `PAYLOAD_SECRET` environment variables).

## Actual Behavior

PR Validation fails with three errors:
1. **Aikido Security Scan**: HTTP 402 "You need be on a paid plan to use this feature" (caused by `fail-on-iac-scan: true`)
2. **Bundle Size Check**: `PAYLOAD_SECRET environment variable is required` during Payload CMS build
3. **Accessibility Tests**: Same `PAYLOAD_SECRET` error
4. **Build-wrapper.sh**: `syntax error in expression` (secondary failure after Payload build fails)

## Diagnostic Data

### Console Output

**Aikido Security Scan failure:**
```
fail-on-iac-scan: true    # <-- This is the problem, should be false
##[error]start scan failed: {"status_code":402,"reason_phrase":"You need be on a paid plan to use this feature. (fail-on-sast-scan)"}
```

**Bundle Size Check failure:**
```
Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/387.js:1:20913)
```

### Branch Comparison

| Setting | Dependabot Branch | Dev Branch (Fixed) |
|---------|-------------------|-------------------|
| `fail-on-iac-scan` | `true` | `false` |
| `PAYLOAD_SECRET` env var | **missing** | `test_payload_secret_for_e2e_testing` |
| build-wrapper.sh | **buggy** `|| echo "0"` | **fixed** `|| var=0` |

### Timeline Analysis

- **Fixes committed to dev**: 2026-01-22 12:36-12:41 EST (commits `8b8e4d8d7`, `7254e6447`, `2bcdf69b3`)
- **Dependabot branch SHA**: `d678b429d5de72f28c52ecd6336cb88c0b6d9839`
- **Failing workflow run**: 2026-01-22 17:06 UTC (run ID `21257518504`)
- The Dependabot branch was created **before** the fixes were merged, so it doesn't have them

## Error Stack Traces

```
payload#build: command (/home/runner/_work/2025slideheroes/2025slideheroes/apps/payload) /home/runner/setup-pnpm/node_modules/.bin/pnpm run build exited (1)

Error: PAYLOAD_SECRET environment variable is required
    at <unknown> (.next/server/chunks/387.js:1:20913)
```

## Related Code

- **Affected Files**:
  - `.github/workflows/pr-validation.yml` (Aikido config, env vars)
  - `.claude/statusline/build-wrapper.sh` (arithmetic syntax)
- **Recent Changes**: Commits `7254e6447`, `8b8e4d8d7`, `2bcdf69b3` (all on `dev`)
- **Suspected Functions**: Workflow configuration not being inherited by Dependabot branches

## Related Issues & Context

### Direct Predecessors

- #1740 (CLOSED): "Bug Fix: PR Validation Workflow Fails - Missing PAYLOAD_SECRET" - Fixed but not in Dependabot branch
- #1743 (CLOSED): "Bug Fix: build-wrapper.sh Syntax Error in Arithmetic Expression" - Fixed but not in Dependabot branch
- #1744 (CLOSED): "Bug Fix: Aikido Security Scan Fails with 402 - Paid Plan Required" - Fixed but not in Dependabot branch

### Related Infrastructure Issues

- #1737: Original diagnosis for PAYLOAD_SECRET issue
- #1738: Original diagnosis for build-wrapper.sh syntax error
- #1741: Original diagnosis for Aikido 402 error

### Historical Context

This is a workflow inheritance issue specific to Dependabot. Dependabot creates branches from the base branch at a point in time and does not rebase when the base branch is updated. The PR Validation workflow uses files from the PR's HEAD branch (the Dependabot branch), not from the base branch.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Dependabot branches contain stale workflow files because they don't automatically rebase when the target branch (`dev`) is updated with fixes.

**Detailed Explanation**:

GitHub Actions workflows are executed from the **HEAD branch of the PR** (the Dependabot branch), not from the base branch. When Dependabot created the `dependabot/npm_and_yarn/packages/e2b/e2b-template/tar-7.5.6` branch, it forked from `dev` at a commit that did NOT contain the fixes for issues #1740, #1743, and #1744.

Even though these fixes have been merged to `dev`, the Dependabot branch still has:
- `fail-on-iac-scan: true` (should be `false`)
- No `PAYLOAD_SECRET` environment variable in bundle-size and accessibility-test jobs
- The buggy `|| echo "0"` pattern in build-wrapper.sh

**Supporting Evidence**:
- Dependabot branch `fail-on-iac-scan`: `true`
- Dev branch `fail-on-iac-scan`: `false`
- Same discrepancy exists for all three fixes

### How This Causes the Observed Behavior

1. User creates PR from Dependabot branch targeting `dev`
2. PR Validation workflow triggers
3. GitHub checks out the Dependabot branch (which has old workflow files)
4. Aikido step runs with `fail-on-iac-scan: true` → 402 error
5. Bundle Size step runs without `PAYLOAD_SECRET` → build fails
6. Accessibility step runs without `PAYLOAD_SECRET` → build fails
7. PR Status Check fails because dependent jobs failed

### Confidence Level

**Confidence**: High

**Reasoning**: Direct comparison of workflow files between the Dependabot branch and `dev` branch confirms the exact configuration differences that cause each failure. The timeline shows the Dependabot branch was created before the fixes were merged.

## Fix Approach (High-Level)

There are three options:

1. **Rebase the Dependabot branch** onto the latest `dev` to pick up the fixes:
   ```bash
   gh pr checkout 1746  # or whatever the PR number is
   git rebase dev
   git push --force-with-lease
   ```

2. **Close and recreate the Dependabot PR** after the fix is merged - Dependabot will create a new branch from the current `dev` state.

3. **Configure Dependabot to auto-rebase** in `.github/dependabot.yml`:
   ```yaml
   rebase-strategy: auto
   ```

Option 1 is the immediate fix. Option 3 prevents this issue from recurring.

## Diagnosis Determination

The PR Validation workflow failures on Dependabot PRs are caused by **stale workflow files** in the Dependabot branch. The fixes from issues #1740, #1743, and #1744 are correctly implemented in `dev`, but Dependabot branches don't automatically inherit those changes.

The fix is to rebase the Dependabot branch onto `dev`, or close and let Dependabot recreate the PR.

## Additional Context

This is a common issue with Dependabot PRs when workflow files are modified. GitHub's PR validation uses the workflow from the HEAD branch, so any Dependabot branches created before workflow fixes will continue to fail until rebased.

Consider adding `rebase-strategy: auto` to `.github/dependabot.yml` to prevent this issue in the future.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (run view, issue view), git log, curl (GitHub API), Read*
