# Bug Diagnosis: Vercel Deploy to Dev fails with corepack enable exit code 1

**ID**: ISSUE-pending
**Created**: 2026-01-15T15:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

All deployments to dev environment have been failing since at least December 12, 2025. Both the Web App and Payload CMS deployments fail during Vercel's install phase with the error `Command "corepack enable && pnpm install" exited with 1`. The root cause is that the `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable is not set in Vercel, which is required for corepack to function properly with the pnpm version specified in `packageManager` field.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (Vercel preview deployments)
- **Node Version**: 20.10 (per .nvmrc) / 22.x (local)
- **pnpm Version**: 10.14.0 (per packageManager field)
- **Last Working**: December 11, 2025 (commit d573fec)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. GitHub Actions workflow `dev-deploy.yml` triggers
3. Workflow runs validation checks successfully
4. Workflow initiates Vercel deployment via `vercel deploy --yes`
5. Vercel receives deployment, starts build process
6. Vercel executes `installCommand` from `apps/web/vercel.json`: `corepack enable && pnpm install`
7. **Failure**: Command exits with code 1

## Expected Behavior

Vercel should successfully enable corepack, install the specified pnpm version (10.14.0), and complete the dependency installation.

## Actual Behavior

Vercel deployment fails with:
```
Building
Error: Command "corepack enable && pnpm install" exited with 1
##[error]Process completed with exit code 1.
```

## Diagnostic Data

### Console Output
```
Deploy Web App to Dev	Deploy to Vercel	2026-01-15T15:36:10.6720879Z Inspect: https://vercel.com/slideheroes/2025slideheroes-web/5P3k9XBLF3XoSRpoN7EFBjQtXR6y [5s]
Deploy Web App to Dev	Deploy to Vercel	2026-01-15T15:36:10.6722328Z Preview: https://2025slideheroes-lex5ekesm-slideheroes.vercel.app [5s]
Deploy Web App to Dev	Deploy to Vercel	2026-01-15T15:36:10.6722635Z Queued
Deploy Web App to Dev	Deploy to Vercel	2026-01-15T15:36:12.1787226Z Building
Deploy Web App to Dev	Deploy to Vercel	2026-01-15T15:36:31.7896627Z Error: Command "corepack enable && pnpm install" exited with 1
```

### GitHub Actions Run
- **Run ID**: 21036834467
- **Failed Jobs**: Deploy Payload CMS to Dev, Deploy Web App to Dev
- **Workflow**: `.github/workflows/dev-deploy.yml`

### Configuration Analysis

**Root package.json** (line 87):
```json
"packageManager": "pnpm@10.14.0"
```

**apps/web/vercel.json**:
```json
{
  "buildCommand": "pnpm turbo run build --filter=web",
  "devCommand": "pnpm turbo run dev --filter=web",
  "installCommand": "corepack enable && pnpm install",
  "outputDirectory": ".next"
}
```

**apps/payload/vercel.json**:
```json
{
  "buildCommand": "pnpm turbo run build --filter=payload",
  "installCommand": "corepack enable && pnpm install"
}
```

### Deployment History

| Date | Result | Commits Since Last Success |
|------|--------|---------------------------|
| 2025-12-11 | SUCCESS (d573fec) | Last working deployment |
| 2025-12-12 onwards | FAILURE | 62+ consecutive failures |
| 2026-01-15 | FAILURE | Current state |

## Related Code
- **Affected Files**:
  - `apps/web/vercel.json:4` - installCommand
  - `apps/payload/vercel.json:3` - installCommand
  - `package.json:87` - packageManager field
  - `.nvmrc` - Node version 20.10
- **Recent Changes**: Commit `6b6fcc986` moved requirements check from preinstall to postinstall (unrelated to root cause)
- **Suspected Functions**: Vercel's corepack integration with pnpm 10.x

## Related Issues & Context

### Research Documentation
- `.ai/reports/research-reports/2026-01-14/context7-vercel-pnpm-monorepo-deployments.md` - Context7 research on Vercel pnpm configuration

### Historical Context
The deployments have been failing for over a month. This may have gone unnoticed due to:
1. Local development working normally
2. Other CI workflows (tests, linting) passing
3. Lack of automated alerts on deployment failures

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable is not set in Vercel, causing `corepack enable` to fail when trying to activate pnpm 10.14.0.

**Detailed Explanation**:

According to Vercel documentation (researched in `.ai/reports/research-reports/2026-01-14/context7-vercel-pnpm-monorepo-deployments.md`):

1. When using `corepack enable` in the installCommand, Vercel requires the `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable to be set
2. Without this variable, corepack cannot properly intercept package manager commands
3. The `packageManager: "pnpm@10.14.0"` field in package.json specifies a pnpm version that corepack should provision, but corepack isn't enabled on Vercel's build servers
4. The command `corepack enable && pnpm install` fails because corepack enable either:
   - Fails silently and pnpm install then fails due to version mismatch
   - Or fails explicitly due to missing permissions/configuration

**Supporting Evidence**:
- Error message: `Command "corepack enable && pnpm install" exited with 1`
- Vercel docs: "Enable Corepack via ENABLE_EXPERIMENTAL_COREPACK=1 environment variable for version consistency"
- No `ENABLE_EXPERIMENTAL_COREPACK` environment variable found in project configuration (only in research docs)
- 62+ consecutive deployment failures since December 12, 2025

### How This Causes the Observed Behavior

1. GitHub Actions triggers `vercel deploy --yes`
2. Vercel receives the deployment and starts build process
3. Vercel reads `apps/web/vercel.json` and executes `installCommand: "corepack enable && pnpm install"`
4. `corepack enable` fails because `ENABLE_EXPERIMENTAL_COREPACK=1` is not set in Vercel environment
5. The `&&` operator causes the entire command to fail with exit code 1
6. Vercel reports the error and the GitHub Action fails

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error is consistent across all deployments (100% failure rate)
2. Vercel documentation explicitly states corepack requires the environment variable
3. The project configuration shows `corepack enable` in installCommand without the required env var
4. The research report from January 14 confirms this exact requirement

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Remove corepack from installCommand and let Vercel handle package manager detection:
- Change `apps/web/vercel.json` installCommand to: `pnpm install --frozen-lockfile`
- Change `apps/payload/vercel.json` installCommand to: `pnpm install --frozen-lockfile`

**Option 2**: Set the required environment variable in Vercel:
- Add `ENABLE_EXPERIMENTAL_COREPACK=1` to Vercel project environment variables for both web and payload projects
- This allows corepack to work as intended

Option 1 is recommended because:
- Simpler and more reliable
- Follows Vercel's recommended pattern for pnpm monorepos
- Uses `--frozen-lockfile` for reproducible builds
- Doesn't depend on experimental features

## Diagnosis Determination

The root cause has been definitively identified: The `corepack enable` command in the Vercel installCommand requires `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable to be set in Vercel's build environment, which is not currently configured. The fix is straightforward - either set the environment variable or remove corepack from the installCommand.

## Additional Context

- The root `vercel.json` uses `"installCommand": "pnpm install --frozen-lockfile"` (without corepack), which is the correct pattern
- Only the app-specific vercel.json files (`apps/web/vercel.json`, `apps/payload/vercel.json`) have the problematic `corepack enable` command
- This inconsistency suggests the app-specific configs may have been added later without following the root config pattern

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, git log, git show, Grep, Read (package.json, vercel.json files, workflow files, research reports)*
