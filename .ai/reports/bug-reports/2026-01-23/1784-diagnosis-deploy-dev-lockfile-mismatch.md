# Bug Diagnosis: Deploy to Dev fails with pnpm lockfile mismatch

**ID**: ISSUE-1784
**Created**: 2026-01-23T19:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The "Deploy to Dev" GitHub workflow is failing due to a pnpm lockfile mismatch introduced by commit e4f098260 ("fix(security): resolve high severity dependency vulnerabilities"). The security fix updated `packages/e2b/e2b-template/package.json` to use `e2b: ^2.10.4` but the pnpm-lock.yaml was not properly regenerated, leaving the lockfile with `e2b: ^2.8.2`.

## Environment

- **Application Version**: 2.23.11
- **Environment**: CI/CD (GitHub Actions + Vercel)
- **Node Version**: 20.10.0 (CI)
- **pnpm Version**: 10.14.0
- **Last Working**: Commit 4b96f59cf (2026-01-23T18:21:41Z)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. The "Deploy to Dev" workflow triggers
3. Vercel builds the project with `pnpm install --frozen-lockfile`
4. Build fails with lockfile mismatch error

## Expected Behavior

The deployment should succeed and the web app + Payload CMS should be deployed to Vercel preview environment.

## Actual Behavior

Both "Deploy Web App to Dev" and "Deploy Payload CMS to Dev" jobs fail with:
```
Error: Command "pnpm install --frozen-lockfile" exited with 1
```

## Diagnostic Data

### Console Output
```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/packages/e2b/e2b-template/package.json

Note that in CI environments this setting is true by default. If you still need to run install in such cases, use "pnpm install --no-frozen-lockfile"

  Failure reason:
  specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies are mismatched:
  - e2b (lockfile: ^2.8.2, manifest: ^2.10.4)
```

### Network Analysis
N/A - This is a dependency resolution issue, not a network issue.

### Database Analysis
N/A - This is a CI/CD build issue.

### Performance Metrics
N/A

### Screenshots
N/A

## Error Stack Traces
```
ERR_PNPM_OUTDATED_LOCKFILE
```

## Related Code

- **Affected Files**:
  - `packages/e2b/e2b-template/package.json` (specifies `e2b: ^2.10.4`)
  - `pnpm-lock.yaml` (has `e2b: ^2.8.2` for e2b-template)

- **Recent Changes**:
  - Commit e4f098260: "fix(security): resolve high severity dependency vulnerabilities"
  - This commit updated `packages/e2b/e2b-template/package.json` but lockfile was not regenerated correctly

- **Suspected Functions**: N/A - this is a lockfile synchronization issue

## Related Issues & Context

### Direct Predecessors
- #1478 (CLOSED): "Bug Diagnosis: Vercel Deploy to Dev fails with corepack enable exit code 1" - Different root cause (corepack)
- #1721 (CLOSED): "Bug Diagnosis: Deploy to Dev fails - Missing @posthog/nextjs-config dependency" - Different root cause (missing dep)

### Related Infrastructure Issues
- #1479 (CLOSED): "Bug Fix: Vercel Deploy to Dev fails with corepack enable exit code 1" - Similar area but different issue

### Similar Symptoms
- All Deploy to Dev failures share the same symptom (workflow failure) but different root causes

### Same Component
- #1723 (CLOSED): "Bug Fix: Missing @posthog/nextjs-config dependency" - Also affected package.json/lockfile sync

### Historical Context
The Deploy to Dev workflow has had multiple issues in the past related to dependency management:
- Corepack issues (#1478, #1479)
- Missing dependencies (#1721, #1723, #1734)

This appears to be a new instance of incomplete lockfile regeneration after dependency updates.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Commit e4f098260 updated `packages/e2b/e2b-template/package.json` to specify `e2b: ^2.10.4` but failed to regenerate `pnpm-lock.yaml` correctly - the lockfile still contains `e2b: specifier: ^2.8.2` for that workspace.

**Detailed Explanation**:
The security vulnerability fix commit (e4f098260) made three dependency changes:
1. Updated root `package.json`: `@e2b/code-interpreter` from `^2.3.1` to `^2.3.3`
2. Updated `packages/e2b/e2b-template/package.json`: `e2b` from `^2.8.2` to `^2.10.4`
3. Modified `pnpm-lock.yaml` but incompletely

The lockfile modification only updated some sections but left the `packages/e2b/e2b-template` specifier pointing to the old version:
```yaml
packages/e2b/e2b-template:
  dependencies:
    e2b:
      specifier: ^2.8.2  # Should be ^2.10.4
      version: 2.8.2
```

When Vercel runs `pnpm install --frozen-lockfile`, pnpm compares the specifiers in `package.json` files against those in `pnpm-lock.yaml` and correctly identifies the mismatch.

**Supporting Evidence**:
- Error message: `e2b (lockfile: ^2.8.2, manifest: ^2.10.4)`
- Lockfile inspection shows `specifier: ^2.8.2` for e2b-template
- Package.json shows `"e2b": "^2.10.4"`
- Local reproduction confirms the issue when using committed lockfile

### How This Causes the Observed Behavior

1. Developer commits e4f098260 with updated package.json but stale lockfile
2. CI triggers "Deploy to Dev" workflow
3. Vercel's build process runs `pnpm install --frozen-lockfile`
4. pnpm detects specifier mismatch between package.json and lockfile
5. pnpm exits with error code 1 (ERR_PNPM_OUTDATED_LOCKFILE)
6. Vercel marks build as failed
7. GitHub Actions marks job as failed
8. Workflow fails for both Web App and Payload CMS deployments

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message explicitly states the mismatch: `e2b (lockfile: ^2.8.2, manifest: ^2.10.4)`
- Lockfile inspection confirms the stale specifier
- Local reproduction confirms the issue
- The fix is straightforward: regenerate the lockfile

## Fix Approach (High-Level)

Regenerate `pnpm-lock.yaml` by running `pnpm install` (without `--frozen-lockfile`) locally, which will update the lockfile to match all `package.json` specifiers. Then commit and push the updated lockfile.

Alternative: If the security update was intentional for `@e2b/code-interpreter` but the `e2b-template` update was accidental, revert the `packages/e2b/e2b-template/package.json` change and regenerate the lockfile.

## Diagnosis Determination

The root cause has been definitively identified: commit e4f098260 introduced a mismatch between `packages/e2b/e2b-template/package.json` (specifies `e2b: ^2.10.4`) and `pnpm-lock.yaml` (contains `e2b: specifier: ^2.8.2` for that workspace).

The fix requires regenerating the lockfile to synchronize it with all package.json files in the monorepo.

## Additional Context

- The GitHub Actions pre-deployment validation step uses `--no-frozen-lockfile` as a fallback, which is why it passes
- Vercel's build process uses `--frozen-lockfile` without fallback, causing the failure
- This is a common issue in monorepos when updating nested workspace dependencies

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow runs, issue search), git (log, show, diff), pnpm (install), grep, Read*
