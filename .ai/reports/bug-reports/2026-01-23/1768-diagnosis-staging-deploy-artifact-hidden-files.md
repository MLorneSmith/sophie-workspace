# Bug Diagnosis: Staging deploy fails - .next directory not uploaded due to upload-artifact@v6 hidden files exclusion

**ID**: ISSUE-pending
**Created**: 2026-01-23T17:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The Deploy to Staging workflow fails at the "Validate Build Artifacts" step with "Web build artifacts missing!" despite the build completing successfully. The root cause is that the recent Dependabot upgrade of `actions/upload-artifact` from v4 to v6 introduced a breaking change: hidden files/directories (starting with `.`) are now excluded by default. The `.next` build output directory is not being uploaded, causing validation to fail.

## Environment

- **Application Version**: 2.13.1
- **Environment**: staging (CI/CD)
- **Node Version**: 22.x
- **Last Working**: Before commit 95d6abdeb (Jan 22, 2026)

## Reproduction Steps

1. Push any change to the `staging` branch
2. Wait for "Deploy to Staging" workflow to trigger
3. Observe "Build Application / Build or Reuse Artifacts" job succeeds
4. Observe "Build Application / Validate Build Artifacts" job fails with "Web build artifacts missing!"

## Expected Behavior

The staging deployment should upload the `apps/web/.next` directory as part of build artifacts, and the validation step should find the directory and pass.

## Actual Behavior

- Build completes successfully (88 seconds)
- Only 288 files are uploaded (should be 3000+ including `.next`)
- Artifact download succeeds but `.next` directory is missing
- Validation fails with "Web build artifacts missing!"

## Diagnostic Data

### Console Output
```
2026-01-23T16:52:49.5572665Z With the provided path, there will be 288 files uploaded
...
2026-01-23T16:54:21.7510473Z 🔍 Validating build artifacts...
2026-01-23T16:54:21.7511933Z ❌ Web build artifacts missing!
2026-01-23T16:54:21.7520017Z ##[error]Process completed with exit code 1.
```

### Artifact Upload Configuration (Current - Broken)
```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v6
  with:
    name: build-artifacts-${{ inputs.environment }}-${{ inputs.commit_sha }}
    path: |
      apps/web/.next
      apps/web/public
      apps/payload/dist
      packages/*/dist
      build-manifest.json
    # include-hidden-files defaults to FALSE in v6!
```

### Evidence of Hidden Files Exclusion
From the job logs:
```
2026-01-23T16:52:49.3116033Z   if-no-files-found: warn
2026-01-23T16:52:49.3116405Z   overwrite: false
2026-01-23T16:52:49.3116721Z   include-hidden-files: false  # <-- ROOT CAUSE
```

### File Count Comparison
- **Expected**: ~3,445 files (local `.next` directory)
- **Actual**: 288 files uploaded (only non-hidden files)

## Error Stack Traces
No stack traces - this is a configuration issue causing the `.next` directory to be silently excluded.

## Related Code
- **Affected Files**:
  - `.github/workflows/artifact-sharing.yml:153-164` (Upload artifacts step)
  - `.github/workflows/reusable-build.yml:124-132` (Upload build artifacts step)
  - `.github/workflows/e2e-sharded.yml:189-196` (Build artifacts upload)
  - `.github/workflows/staging-deploy.yml:173-179` (If exists)
- **Breaking Change Commit**: `95d6abdeb` - "chore(deps): bump the github-actions group with 4 updates"
- **Affected Version**: `actions/upload-artifact@v4` → `v6`

## Related Issues & Context

### Direct Predecessors
- #1763 (CLOSED): "Bug Fix: Staging deploy fails with duplicate --cache-dir argument" - This issue was different; it fixed a Turbo CLI argument duplication. The staging deploy still fails for this new reason.
- #1762 (CLOSED): "Bug Diagnosis: Staging deploy duplicate --cache-dir" - Related diagnosis for the previous issue.

### Infrastructure Issues
- #1578 (MERGED): "chore(deps): bump the github-actions group with 4 updates" - **This is the PR that introduced the breaking change** by upgrading `upload-artifact` from v4 to v6.

### Similar Symptoms
None - this is a new regression introduced by Dependabot.

### Historical Context
This is a regression introduced by Dependabot's automatic dependency update on January 22, 2026. The update bumped `actions/upload-artifact` from v4 to v6, which changed the default behavior for hidden files from "include" to "exclude".

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `actions/upload-artifact@v6` action excludes hidden files/directories by default, and the `.next` build directory (which starts with a dot) is not being uploaded.

**Detailed Explanation**:
On September 2nd, 2024, GitHub introduced a breaking change in `actions/upload-artifact` where hidden files and folders are no longer included in uploads by default. This was done to reduce the risk of credentials accidentally being uploaded. However, this affects legitimate use cases like Next.js builds where the output directory is `.next`.

The Dependabot PR #1578 (merged January 22, 2026) upgraded the action from v4 to v6, which enforces this default. The workflow configuration does not include `include-hidden-files: true`, so the `.next` directory is silently excluded during upload.

**Supporting Evidence**:
1. Job logs show `include-hidden-files: false` in the upload step configuration
2. Only 288 files uploaded vs expected ~3,445 files
3. Build completes successfully, download succeeds, but `.next` directory is missing
4. GitHub documentation and issue tracker confirm this breaking change: [Issue #602](https://github.com/actions/upload-artifact/issues/602)

### How This Causes the Observed Behavior

1. Build job runs `pnpm build` successfully, creating `apps/web/.next/`
2. Upload step runs with `include-hidden-files: false` (default)
3. The glob pattern `apps/web/.next` is evaluated, but `.next` is a hidden directory
4. The `.next` directory and all its contents are excluded from the upload
5. Only non-hidden files (288 total) are uploaded
6. Validation job downloads the artifact
7. Validation checks for `apps/web/.next` directory - it doesn't exist
8. Validation fails with "Web build artifacts missing!"

### Confidence Level

**Confidence**: High

**Reasoning**:
- The job logs explicitly show `include-hidden-files: false`
- The file count (288 vs 3445) matches the expected behavior of excluding hidden files
- The GitHub documentation confirms this exact breaking change
- The timing aligns with the Dependabot upgrade PR

## Fix Approach (High-Level)

Add `include-hidden-files: true` to all `actions/upload-artifact@v6` steps that upload `.next` directories:

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v6
  with:
    name: build-artifacts-${{ inputs.environment }}-${{ inputs.commit_sha }}
    path: |
      apps/web/.next
      ...
    include-hidden-files: true  # <-- Add this
```

Files that need this fix:
- `.github/workflows/artifact-sharing.yml` (line 153)
- `.github/workflows/reusable-build.yml` (line 124)
- `.github/workflows/e2e-sharded.yml` (lines 189, 303)
- `.github/workflows/staging-deploy.yml` (if applicable)

## Diagnosis Determination

The root cause has been definitively identified: the Dependabot upgrade to `actions/upload-artifact@v6` introduced a breaking change where hidden files/directories are excluded by default. The `.next` build directory is affected because it starts with a dot. The fix is straightforward: add `include-hidden-files: true` to all affected upload steps.

## Additional Context

**Why this wasn't caught in PR validation**:
- PR validation may use different artifact paths or caching mechanisms
- The breaking change was introduced silently by Dependabot with no clear indication of the hidden files behavior change

**External References**:
- [GitHub Issue #602: Hidden Files Breaking Change](https://github.com/actions/upload-artifact/issues/602)
- [Elio Struyf Blog: Breaking changes in upload-artifact action](https://www.eliostruyf.com/breaking-github-upload-artifact-action/)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git log, Grep, Read, WebSearch*
