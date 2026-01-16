# Bug Diagnosis: Shell Scripts Lack Execute Permissions in Git

**ID**: ISSUE-pending
**Created**: 2026-01-16T19:55:00Z
**Reporter**: system/CI
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Two shell scripts (`fix-build-permissions.sh` and `.claude/statusline/build-wrapper.sh`) are committed to git with file mode `100644` (non-executable) instead of `100755` (executable). This causes CI/CD workflows to fail with "Permission denied" errors when trying to execute these scripts, blocking both E2E tests and production deployments.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: 20
- **Runner**: runs-on (AWS spot instances)
- **Last Working**: Unknown - may never have worked in CI

## Reproduction Steps

1. Push code to `dev`, `staging`, or `main` branch
2. Observe "E2E Tests (Sharded)" workflow run
3. Wait for "Build application" step
4. Observe failure with exit code 126

## Expected Behavior

Shell scripts should execute successfully in CI environment, allowing the build to complete.

## Actual Behavior

Build fails with:
```
sh: 1: ./.claude/statusline/build-wrapper.sh: Permission denied
ELIFECYCLE  Command failed with exit code 126.
```

## Diagnostic Data

### Console Output
```
> slideheroes@2.13.1 prebuild /home/runner/_work/2025slideheroes/2025slideheroes
> [ -f ./fix-build-permissions.sh ] && ./fix-build-permissions.sh || true

sh: 1: ./fix-build-permissions.sh: Permission denied

> slideheroes@2.13.1 build /home/runner/_work/2025slideheroes/2025slideheroes
> ./.claude/statusline/build-wrapper.sh turbo build --cache-dir=.turbo --cache-dir=.turbo

sh: 1: ./.claude/statusline/build-wrapper.sh: Permission denied
ELIFECYCLE  Command failed with exit code 126.
##[error]Process completed with exit code 126.
```

### Git File Modes
```bash
$ git ls-files -s .claude/statusline/build-wrapper.sh fix-build-permissions.sh
100644 18abeb06baa23f95f100745b54360c8727ee347a 0	.claude/statusline/build-wrapper.sh
100644 4d8979575c96d6871982e5ad3e47e19963f86a96 0	fix-build-permissions.sh
```

Both files show `100644` (non-executable) instead of `100755` (executable).

### Local File Permissions
```bash
$ ls -la fix-build-permissions.sh
-rwxr-xr-x 1 msmith msmith 1.2k Nov 17 2025 fix-build-permissions.sh

$ ls -la .claude/statusline/build-wrapper.sh
-rw-r--r-- 1 msmith msmith 4.2k Jan 16 14:26 .claude/statusline/build-wrapper.sh
```

Note: `fix-build-permissions.sh` has execute bit locally but not in git.
`.claude/statusline/build-wrapper.sh` lacks execute bit both locally and in git.

## Error Stack Traces
```
##[error]Process completed with exit code 126.
```
Exit code 126 indicates "Permission denied" or "Command is not executable".

## Related Code
- **Affected Files**:
  - `fix-build-permissions.sh` (line 1-36)
  - `.claude/statusline/build-wrapper.sh` (line 1-124)
  - `package.json` (build script references)
- **Recent Changes**:
  - `4b42977c6` fix(migration): complete Zod v4 migration
  - `f91c7b280` fix(tooling): add environment variable loading to build wrapper
- **Suspected Functions**: N/A - file permission issue, not code bug

## Related Issues & Context

### Direct Predecessors
- #448 (CLOSED): "[Bug] Recurring node modules permission errors (EACCES) - likely Docker-related" - Different permission issue but similar symptoms
- #604 (CLOSED): "Bug Diagnosis: Claude Code Statusline Not Appearing" - Related to statusline feature

### Same Component
- #611 (CLOSED): "Bug Fix: Claude Code Statusline Not Appearing" - Same statusline component

### Historical Context
The statusline feature was recently added and may not have been properly tested in CI environments. The `fix-build-permissions.sh` script exists specifically to fix permission issues but ironically lacks its own execute permission.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Shell scripts are committed with git file mode `100644` instead of `100755`, making them non-executable in CI.

**Detailed Explanation**:
Git tracks file permissions as part of the file mode. When a file is committed without the execute bit set in git (`100644`), it will be checked out as non-executable regardless of local filesystem permissions. The build process in `package.json` attempts to execute these scripts directly (e.g., `./fix-build-permissions.sh`), which requires the execute permission.

**Supporting Evidence**:
- `git ls-files -s` shows `100644` for both files
- Error message "Permission denied" with exit code 126 confirms execution failure
- Local `fix-build-permissions.sh` has `rwxr-xr-x` but git shows `100644`

### How This Causes the Observed Behavior

1. Developer commits scripts locally (may have execute bit locally)
2. Git stores file mode as `100644` (non-executable)
3. CI runner checks out code from git
4. Files are created with mode `644` (non-executable)
5. `pnpm build` runs `./fix-build-permissions.sh` in prebuild hook
6. Shell fails with "Permission denied" (exit 126)
7. Build continues but then tries `./build-wrapper.sh`
8. Second "Permission denied" causes build failure

### Confidence Level

**Confidence**: High

**Reasoning**: The git file modes are definitively `100644`, and exit code 126 specifically indicates a permission/execution error. This is a well-documented git behavior.

## Fix Approach (High-Level)

Run `git update-index --chmod=+x` on both files to set the executable bit in git:
```bash
git update-index --chmod=+x fix-build-permissions.sh
git update-index --chmod=+x .claude/statusline/build-wrapper.sh
git commit -m "fix(ci): add execute permissions to shell scripts"
```

## Diagnosis Determination

Root cause is definitively identified: Both shell scripts lack the executable bit in git's file mode tracking. This is a simple configuration issue that can be fixed with `git update-index --chmod=+x`.

## Additional Context

The `prebuild` script in `package.json` uses `|| true` to prevent the first script failure from stopping the build, but the actual `build` script that calls `build-wrapper.sh` does not have this fallback, causing the complete build failure.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run list, git ls-files, ls -la, Read*
