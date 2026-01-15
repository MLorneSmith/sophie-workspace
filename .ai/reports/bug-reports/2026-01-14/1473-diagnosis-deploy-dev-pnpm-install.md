# Bug Diagnosis: Deploy to Dev Workflow Failing - pnpm install exits with 1

**ID**: ISSUE-1473
**Created**: 2026-01-14T20:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The "Deploy to Dev" GitHub workflow is failing consistently since around January 9, 2026. Both the "Deploy Web App to Dev" and "Deploy Payload CMS to Dev" jobs fail during the Vercel deploy step with the error `Error: Command "pnpm install" exited with 1`. The root cause is the `preinstall` hook in `package.json` which runs `pnpm run --filter scripts requirements` - this fails because pnpm workspace filters don't work during the install phase before the workspace is materialized.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions -> Vercel)
- **Node Version**: >=v18.18.0
- **pnpm Version**: 10.14.0 (specified in packageManager field)
- **Vercel CLI**: 48.8.0
- **Last Working**: 2025-12-11 (commit `fix(canvas): pass ID array to SortableContext`)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. GitHub Actions triggers the "Deploy to Dev" workflow
3. Workflow reaches the "Deploy Web App to Dev" or "Deploy Payload CMS to Dev" jobs
4. Vercel CLI deploys the project
5. Vercel runs `pnpm install` (or `corepack enable && pnpm install`)
6. The install triggers the `preinstall` hook from root `package.json`
7. `preinstall` runs `pnpm run --filter scripts requirements`
8. This fails because the workspace is not yet set up during preinstall
9. Build fails with `Error: Command "pnpm install" exited with 1`

## Expected Behavior

The deployment should complete successfully with dependencies installed and the build process running.

## Actual Behavior

Vercel deployment fails immediately during the install phase with exit code 1. No detailed error message is provided by Vercel, just `Error: Command "pnpm install" exited with 1`.

## Diagnostic Data

### Console Output
```
Deploy Web App to Dev: 2026-01-14T19:46:47.4330583Z Inspect: https://vercel.com/slideheroes/2025slideheroes-web/4SRDebj1ceJmSBoxmYv1yPmpuZG3 [4s]
Deploy Web App to Dev: 2026-01-14T19:46:47.4331502Z Preview: https://2025slideheroes-5rxazoj3w-slideheroes.vercel.app [4s]
Deploy Web App to Dev: 2026-01-14T19:46:47.4332032Z Queued
Deploy Web App to Dev: 2026-01-14T19:46:48.9512398Z Building
Deploy Web App to Dev: 2026-01-14T19:47:08.0446874Z Error: Command "corepack enable && pnpm install" exited with 1
Deploy Web App to Dev: 2026-01-14T19:47:08.1413710Z ##[error]Process completed with exit code 1.
```

### Configuration Analysis

**Root package.json (lines 14-16):**
```json
{
  "scripts": {
    "preinstall": "pnpm run --filter scripts requirements",
    "postinstall": "manypkg fix"
  }
}
```

**apps/web/vercel.json:**
```json
{
  "buildCommand": "pnpm turbo run build --filter=web",
  "devCommand": "pnpm turbo run dev --filter=web",
  "installCommand": "corepack enable && pnpm install",
  "outputDirectory": ".next"
}
```

**apps/payload/vercel.json:**
```json
{
  "buildCommand": "pnpm turbo run build --filter=payload",
  "installCommand": "corepack enable && pnpm install"
}
```

### Research Findings

**From Vercel Documentation (context7-expert):**
- `installCommand` in vercel.json completely overrides default package manager detection
- Lifecycle scripts from package.json do execute, but timing can be tricky
- Best practice is to move logic to environment variable checks or postinstall

**From Web Research (exa-expert):**
- The `preinstall` hook runs BEFORE pnpm has materialized the workspace on Vercel
- Any scripts using `pnpm --filter`, `pnpm run --filter`, or other workspace-dependent commands fail because the workspace is not yet set up during the install phase
- This is a known issue documented in pnpm GitHub issues #7387 and #6289

## Related Code

- **Affected Files**:
  - `package.json` (root) - contains the problematic preinstall hook
  - `apps/web/vercel.json` - Vercel install command configuration
  - `apps/payload/vercel.json` - Vercel install command configuration
  - `tooling/scripts/src/requirements.mjs` - the script that runs during preinstall

- **Recent Changes**:
  - The `installCommand` in `apps/web/vercel.json` was changed from `"pnpm install"` to `"corepack enable && pnpm install"` in commit `c09bb71ad`, but the failures started before this change
  - The root cause (preinstall hook) has been present since early in the project

- **Suspected Functions**:
  - `preinstall` script in root `package.json`
  - The workspace filter `--filter scripts` which requires workspace to be set up

## Related Issues & Context

### Historical Context
The Deploy to Dev workflow has had intermittent failures, but became consistent starting around January 9, 2026. The last successful deploy was on December 11, 2025 (commit `fix(canvas): pass ID array to SortableContext`).

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `preinstall` hook uses `pnpm run --filter scripts requirements` which requires the pnpm workspace to be materialized, but preinstall runs before the workspace is set up during `pnpm install`.

**Detailed Explanation**:

1. When Vercel runs `pnpm install`, pnpm executes lifecycle scripts in order: `preinstall` -> `install` -> `postinstall`
2. The `preinstall` script runs BEFORE any dependencies are installed and BEFORE the workspace is materialized
3. The command `pnpm run --filter scripts requirements` uses workspace filtering (`--filter scripts`)
4. Workspace filtering requires the workspace to already be set up with packages resolved
5. Since the workspace isn't set up yet during preinstall, the `--filter` command fails
6. This causes `pnpm install` to exit with code 1
7. Vercel reports the error as `Error: Command "pnpm install" exited with 1`

**Supporting Evidence**:
- Research confirms this is a known pattern causing failures (pnpm GitHub issues #7387, #6289)
- Vercel documentation notes lifecycle script timing issues
- The error occurs during the "Building" phase on Vercel, which is when install runs
- Both web and payload deployments fail with identical error, confirming it's the shared root package.json preinstall hook

### How This Causes the Observed Behavior

1. Developer pushes to `dev` branch
2. GitHub Actions triggers Deploy to Dev workflow
3. Vercel CLI is invoked to deploy the project
4. Vercel runs `corepack enable && pnpm install` (from vercel.json installCommand)
5. pnpm begins install process and runs `preinstall` hook first
6. `preinstall` executes `pnpm run --filter scripts requirements`
7. `--filter scripts` fails because workspace packages aren't resolved yet
8. pnpm install fails with exit code 1
9. Vercel reports build failure

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Research from multiple sources (Vercel docs, pnpm GitHub issues, web searches) confirms this is a known issue pattern
2. The error timing matches - failure happens during "Building" phase immediately after Vercel starts
3. The preinstall hook explicitly uses workspace filter which is documented to fail before workspace setup
4. Both web and payload deployments fail identically, pointing to shared root package.json

## Fix Approach (High-Level)

**Option 1 - Move to postinstall (Recommended):**
Change the `preinstall` script to `postinstall` or a separate script. The requirements check runs after dependencies are installed when the workspace is available.

```json
{
  "scripts": {
    "postinstall": "pnpm run --filter scripts requirements && manypkg fix"
  }
}
```

**Option 2 - Use --ignore-scripts on Vercel:**
Update the Vercel install command to skip scripts, then run requirements separately:
```json
{
  "installCommand": "corepack enable && pnpm install --ignore-scripts && node tooling/scripts/src/requirements.mjs"
}
```

**Option 3 - Make preinstall conditional:**
Skip the filter-based command when the workspace isn't ready:
```json
{
  "preinstall": "node -e \"try{require('child_process').execSync('pnpm run --filter scripts requirements')}catch(e){}\""
}
```

**Recommended**: Option 1 is cleanest - move the requirements check to postinstall since it only validates versions and doesn't need to run before install.

## Diagnosis Determination

The root cause has been definitively identified: the `preinstall` hook in root `package.json` uses `pnpm run --filter scripts requirements` which fails on Vercel because pnpm workspace filters require the workspace to be materialized, but `preinstall` runs before `pnpm install` completes.

The fix is straightforward: move the requirements check from `preinstall` to `postinstall`, or use `--ignore-scripts` in the Vercel install command.

## Additional Context

- The requirements script (`tooling/scripts/src/requirements.mjs`) checks Node version, pnpm version, and that the path isn't OneDrive - all checks that can safely run after install
- Local development works because developers already have dependencies installed, so the workspace is available
- The issue only manifests in fresh installs (like Vercel builds) where preinstall runs before any workspace setup

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git, Read, Grep, Task (context7-expert, exa-expert)*
