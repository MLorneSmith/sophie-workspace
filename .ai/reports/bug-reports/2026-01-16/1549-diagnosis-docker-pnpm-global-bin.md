# Bug Diagnosis: Docker CI Image Build Fails - pnpm Global Bin Directory Missing

**ID**: ISSUE-pending
**Created**: 2026-01-16T19:55:00Z
**Reporter**: system/CI
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The "Build CI Docker Image" workflow fails when building the CI Docker image because `pnpm add -g` cannot find the global bin directory. The Dockerfile uses `corepack` to install pnpm but doesn't run `pnpm setup` to create the required global directories before attempting to install global packages.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions)
- **Docker Base Image**: node:20-alpine
- **pnpm Version**: 9.12.0 (via corepack)
- **Last Working**: Unknown - likely never worked

## Reproduction Steps

1. Push code to `main` branch
2. Observe "Build CI Docker Image" workflow run
3. Wait for "Build Docker image for scanning" step
4. Observe failure at RUN pnpm add -g step

## Expected Behavior

Docker image should build successfully with global packages installed.

## Actual Behavior

Build fails with:
```
ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory

Run "pnpm setup" to create it automatically, or set the global-bin-dir setting, or the PNPM_HOME env variable. The global bin directory should be in the PATH.
```

## Diagnostic Data

### Console Output
```
#8 ERROR: process "/bin/sh -c pnpm add -g     turbo@latest     @biomejs/biome@latest     markdownlint-cli@latest     yaml-lint@latest" did not complete successfully: exit code: 1
------
 > [4/6] RUN pnpm add -g     turbo@latest     @biomejs/biome@latest     markdownlint-cli@latest     yaml-lint@latest:
0.442  ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory
0.442
0.442 Run "pnpm setup" to create it automatically, or set the global-bin-dir setting, or the PNPM_HOME env variable. The global bin directory should be in the PATH.
------
Dockerfile.ci:19
--------------------
  18 |     # Install global tools for CI
  19 | >>> RUN pnpm add -g \
  20 | >>>     turbo@latest \
  21 | >>>     @biomejs/biome@latest \
  22 | >>>     markdownlint-cli@latest \
  23 | >>>     yaml-lint@latest
  24 |
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c pnpm add -g     turbo@latest     @biomejs/biome@latest     markdownlint-cli@latest     yaml-lint@latest" did not complete successfully: exit code: 1
```

### Problematic Dockerfile

`.github/docker/Dockerfile.ci`:
```dockerfile
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git curl bash libc6-compat python3 make g++ \
    && rm -rf /var/cache/apk/*

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Install global tools for CI
RUN pnpm add -g \          # <-- FAILS HERE
    turbo@latest \
    @biomejs/biome@latest \
    markdownlint-cli@latest \
    yaml-lint@latest
```

The issue is that `corepack enable` activates pnpm but doesn't set up the global directories. The `pnpm add -g` command requires `PNPM_HOME` to be set and the global bin directory to exist.

## Error Stack Traces
```
ERR_PNPM_NO_GLOBAL_BIN_DIR  Unable to find the global bin directory
```

This is a pnpm configuration error, not a runtime exception.

## Related Code
- **Affected Files**:
  - `.github/docker/Dockerfile.ci` (lines 15-23)
- **Recent Changes**:
  - `c00dc88c6` feat(ci): implement comprehensive CI/CD improvements (phases 1-4) - Initial creation
- **Suspected Functions**: N/A - Dockerfile configuration issue

## Related Issues & Context

### Related Infrastructure Issues
- #1311 (CLOSED): "Bug Diagnosis: Payload E2E Tests Fail Due to Container OOM Kill" - Different Docker issue
- #920 (CLOSED): "Bug Fix: Dev Integration Tests Fail with host.docker.internal DNS Error" - Related Docker networking

### Historical Context
This Dockerfile was created as part of the CI/CD improvements initiative. It appears the global package installation was not tested in the build pipeline.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Dockerfile uses `corepack enable` to install pnpm but doesn't configure the global bin directory (`PNPM_HOME`) before running `pnpm add -g`.

**Detailed Explanation**:
When pnpm is installed via corepack, it doesn't automatically create the global installation directories. The `pnpm add -g` command requires:
1. `PNPM_HOME` environment variable to be set
2. The global bin directory to exist
3. The directory to be in `PATH`

The Dockerfile only runs `corepack enable && corepack prepare pnpm@9.12.0 --activate`, which makes pnpm available but doesn't configure global installation paths.

**Supporting Evidence**:
- Error message explicitly states "Unable to find the global bin directory"
- pnpm documentation requires `pnpm setup` or manual `PNPM_HOME` configuration
- The Dockerfile has no `ENV PNPM_HOME` or `RUN pnpm setup` commands

### How This Causes the Observed Behavior

1. Dockerfile starts with `node:20-alpine` base image
2. `corepack enable` activates corepack (built into Node.js)
3. `corepack prepare pnpm@9.12.0 --activate` installs pnpm
4. `pnpm add -g turbo@latest ...` is executed
5. pnpm looks for global bin directory (checks `PNPM_HOME`, default locations)
6. No global directory exists, `PNPM_HOME` not set
7. pnpm exits with `ERR_PNPM_NO_GLOBAL_BIN_DIR`
8. Docker build fails

### Confidence Level

**Confidence**: High

**Reasoning**: The error message is explicit about the cause, and pnpm documentation confirms that `pnpm setup` or `PNPM_HOME` configuration is required for global installations.

## Fix Approach (High-Level)

Add `PNPM_HOME` environment variable and run `pnpm setup` before global install:

```dockerfile
# Install pnpm globally
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN pnpm setup

# Install global tools for CI
RUN pnpm add -g \
    turbo@latest \
    @biomejs/biome@latest \
    markdownlint-cli@latest \
    yaml-lint@latest
```

Alternative approach using npm for global tools:
```dockerfile
RUN npm install -g turbo @biomejs/biome markdownlint-cli yaml-lint
```

## Diagnosis Determination

Root cause is definitively identified: The Dockerfile doesn't configure pnpm's global installation directory before attempting to install global packages. This is a Docker/pnpm configuration issue that requires adding `PNPM_HOME` environment variable and optionally running `pnpm setup`.

## Additional Context

This is a non-essential workflow that builds a cached CI Docker image. The main CI pipeline doesn't depend on this image - it installs tools directly. Fixing this would improve CI caching and build times but isn't blocking development.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, Read, Docker/pnpm documentation analysis*
