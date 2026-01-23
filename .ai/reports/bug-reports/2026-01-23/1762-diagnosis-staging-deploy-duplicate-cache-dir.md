# Bug Diagnosis: Staging deploy fails with duplicate --cache-dir argument

**ID**: ISSUE-1762
**Created**: 2026-01-23T16:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Deploy to Staging workflow fails during the build step because the `--cache-dir=.turbo` argument is passed twice to the Turbo CLI, which rejects duplicate arguments. The `pnpm build` command in `package.json` already includes `--cache-dir=.turbo`, and the `artifact-sharing.yml` workflow passes it again, causing the error.

## Environment

- **Application Version**: 2.13.1
- **Environment**: GitHub Actions (staging deployment)
- **Node Version**: 20.x (GitHub Actions runner)
- **Last Working**: Unknown (this configuration has been in place since Nov 2025)

## Reproduction Steps

1. Push to the `staging` branch (or merge a PR to staging)
2. Wait for the Deploy to Staging workflow to run
3. Observe the "Build Application / Build or Reuse Artifacts" job fails

## Expected Behavior

The build should complete successfully and artifacts should be uploaded.

## Actual Behavior

The build fails immediately with the error:
```
ERROR  the argument '--cache-dir <CACHE_DIR>' cannot be used multiple times
```

## Diagnostic Data

### Console Output
```
2026-01-23T15:52:55.5296088Z > slideheroes@2.13.1 build /home/runner/_work/2025slideheroes/2025slideheroes
2026-01-23T15:52:55.5296881Z > ./.claude/statusline/build-wrapper.sh turbo build --cache-dir=.turbo --cache-dir=.turbo

2026-01-23T15:52:55.5743050Z  ERROR  the argument '--cache-dir <CACHE_DIR>' cannot be used multiple times

2026-01-23T15:52:55.5743734Z Usage: turbo [OPTIONS] [COMMAND]

2026-01-23T15:52:55.5744118Z For more information, try '--help'.

2026-01-23T15:52:55.6129460Z  ELIFECYCLE  Command failed with exit code 1.
```

### Network Analysis
N/A - This is a local build failure, not a network issue.

### Database Analysis
N/A - This is a build configuration issue.

### Performance Metrics
N/A - Build fails immediately before any actual work.

### Screenshots
N/A

## Error Stack Traces
```
ERROR  the argument '--cache-dir <CACHE_DIR>' cannot be used multiple times

Usage: turbo [OPTIONS] [COMMAND]

For more information, try '--help'.

ELIFECYCLE  Command failed with exit code 1.
```

## Related Code

- **Affected Files**:
  - `package.json` (line 17) - defines the build script with `--cache-dir=.turbo`
  - `.github/workflows/artifact-sharing.yml` (line 126) - passes `--cache-dir=.turbo` again

- **Recent Changes**:
  - Nov 17, 2025: `package.json` build script changed from `./.claude/statusline/build-wrapper.sh` to `./.claude/statusline/build-wrapper.sh turbo build --cache-dir=.turbo`
  - Aug 26, 2025: `artifact-sharing.yml` created with `pnpm build --cache-dir=.turbo`

- **Suspected Functions**: N/A - this is a command-line argument conflict

## Related Issues & Context

### Direct Predecessors
None found with similar error.

### Related Infrastructure Issues
None directly related.

### Similar Symptoms
Previous CI failures have involved build configuration issues but not this specific duplicate argument problem.

### Same Component
Build-related workflow issues have occurred before but with different root causes.

### Historical Context
This is a latent bug that has existed since November 2025 but may have only recently been triggered when the exact code path in artifact-sharing.yml was executed (when no cached artifacts were found).

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `--cache-dir=.turbo` argument is duplicated because it exists in both the `package.json` build script AND is passed again by the `artifact-sharing.yml` workflow, causing Turbo CLI to reject the command.

**Detailed Explanation**:

1. In `package.json` (line 17), the build script is defined as:
   ```json
   "build": "./.claude/statusline/build-wrapper.sh turbo build --cache-dir=.turbo"
   ```

2. In `.github/workflows/artifact-sharing.yml` (line 126), the build step runs:
   ```bash
   pnpm build --cache-dir=.turbo
   ```

3. When `pnpm build --cache-dir=.turbo` executes, pnpm expands it to:
   ```bash
   ./.claude/statusline/build-wrapper.sh turbo build --cache-dir=.turbo --cache-dir=.turbo
   ```

4. The build-wrapper.sh script (line 104) passes all arguments through to the command:
   ```bash
   "$@" 2>&1 | tee "$TEMP_OUTPUT"
   ```

5. Turbo CLI rejects duplicate `--cache-dir` arguments with the error message seen.

**Supporting Evidence**:
- Log line: `> ./.claude/statusline/build-wrapper.sh turbo build --cache-dir=.turbo --cache-dir=.turbo`
- Error: `ERROR  the argument '--cache-dir <CACHE_DIR>' cannot be used multiple times`
- Code reference: `package.json:17` and `.github/workflows/artifact-sharing.yml:126`

### How This Causes the Observed Behavior

1. The staging deploy workflow calls the artifact-sharing workflow
2. artifact-sharing.yml runs `pnpm build --cache-dir=.turbo`
3. pnpm expands this using the build script from package.json
4. The result is `--cache-dir=.turbo` appearing twice
5. Turbo CLI validation fails, returning exit code 1
6. The entire build job fails, blocking the deployment

### Confidence Level

**Confidence**: High

**Reasoning**: The log output explicitly shows the doubled argument (`--cache-dir=.turbo --cache-dir=.turbo`) and the error message is unambiguous about rejecting duplicate arguments. The code paths in both files confirm the duplication.

## Fix Approach (High-Level)

There are two options to fix this:

**Option A (Recommended)**: Remove `--cache-dir=.turbo` from the workflow file (`artifact-sharing.yml` line 126), since the package.json build script already includes it. Change:
```bash
pnpm build --cache-dir=.turbo
```
To:
```bash
pnpm build
```

**Option B**: Create a separate build script in package.json (like `build:raw`) that doesn't include `--cache-dir` and use that in the workflow. The project already has `build:raw` defined, so the workflow could use `pnpm build:raw --cache-dir=.turbo` instead.

Option A is simpler and maintains the principle that the package.json defines the canonical build command.

## Diagnosis Determination

The root cause has been conclusively identified: duplicate `--cache-dir=.turbo` arguments passed to Turbo CLI due to the flag being present in both the package.json build script and the artifact-sharing.yml workflow.

## Additional Context

This bug likely remained latent for months because:
1. Local builds using `pnpm build` work fine (no duplicate args)
2. PR validation workflows may use different build paths
3. The artifact-sharing workflow only builds fresh when no cached artifacts exist

The bug was exposed when a staging deployment ran without finding cached artifacts, triggering the full build path in artifact-sharing.yml.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, gh api, Read, Bash (git log)*
