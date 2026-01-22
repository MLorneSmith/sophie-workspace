# Bug Diagnosis: Deploy to Dev fails - Missing @posthog/nextjs-config dependency

**ID**: ISSUE-pending
**Created**: 2026-01-22T15:40:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The "Deploy to Dev" workflow fails because the `@posthog/nextjs-config` package is imported in `apps/web/next.config.mjs` but was never added as a dependency. The package import was added in commit `2e46c5d73` without corresponding `package.json` or `pnpm-lock.yaml` updates. Builds fail on Vercel where `pnpm install --frozen-lockfile` only installs declared dependencies, but may work locally if the package was previously manually installed.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (Vercel Preview deployments)
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Production deployments on main branch (which doesn't have this commit)

## Reproduction Steps

1. Push a commit to the `dev` branch
2. GitHub Actions `dev-deploy.yml` workflow triggers
3. Vercel deploy action runs `pnpm turbo run build --filter=web`
4. Build fails with "Cannot find package '@posthog/nextjs-config'"

## Expected Behavior

The build should succeed after installing all required dependencies.

## Actual Behavior

Build fails with error:
```
Error: Cannot find package '@posthog/nextjs-config' imported from /home/msmith/projects/2025slideheroes/apps/web/next.config.mjs
```

## Diagnostic Data

### Console Output
```
web:build: > web@0.1.0 build /home/msmith/projects/2025slideheroes/apps/web
web:build: > NODE_ENV=production next build
web:build:
web:build:  ⨯ Failed to load next.config.mjs, see more info here https://nextjs.org/docs/messages/next-config-error
web:build:
web:build: > Build error occurred
web:build: Error: Cannot find package '@posthog/nextjs-config' imported from /home/msmith/projects/2025slideheroes/apps/web/next.config.mjs
web:build:     at ignore-listed frames {
web:build:   code: 'ERR_MODULE_NOT_FOUND'
web:build: }
web:build:  ELIFECYCLE  Command failed with exit code 1.
```

### Network Analysis
N/A - Build-time issue, not runtime.

### Database Analysis
N/A - Database not involved.

### Performance Metrics
N/A - Build never completes.

### Screenshots
N/A

## Error Stack Traces
```
Error: Cannot find package '@posthog/nextjs-config' imported from /home/msmith/projects/2025slideheroes/apps/web/next.config.mjs
    at ignore-listed frames {
  code: 'ERR_MODULE_NOT_FOUND'
}
```

## Related Code
- **Affected Files**:
  - `apps/web/next.config.mjs` - Lines 2, 108-117 (imports and uses `withPostHogConfig`)
  - `apps/web/package.json` - Missing `@posthog/nextjs-config` dependency
  - `pnpm-lock.yaml` - Missing `@posthog/nextjs-config` entry
- **Recent Changes**:
  - Commit `2e46c5d73` (2026-01-21) added the import without the dependency
  - Commit `cb0b79bb9` (2026-01-21) added PostHog rewrites (but not `withPostHogConfig`)
- **Suspected Functions**: `withPostHogConfig` wrapper function in `next.config.mjs`

## Related Issues & Context

### Direct Predecessors
- #1718 (CLOSED): "Bug Fix: Deploy to Dev fails - PostHog env vars in wrong Vercel project" - Fixed PostHog env var placement but did not address missing dependency
- #1717 (CLOSED): "Bug Diagnosis: Deploy to Dev fails - PostHog env vars in wrong Vercel project" - Misdiagnosed root cause

### Related Infrastructure Issues
- #1716 (CLOSED): "Bug Diagnosis: Deploy to Dev workflow fails with GitHub 500 Internal Server Error" - Different issue (GitHub API error)

### Historical Context
The PostHog integration was added in two commits on 2026-01-21:
1. `cb0b79bb9` - Added PostHog reverse proxy rewrites, env vars, and analytics provider configuration
2. `2e46c5d73` - Added `withPostHogConfig` wrapper but **forgot to add the package dependency**

The commit `2e46c5d73` has a misleading message about "fix(ci): switch e2e-sharded to ubuntu-latest" but contains unrelated PostHog source map configuration changes that introduced this bug.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `@posthog/nextjs-config` package is imported in `next.config.mjs` but was never added to `apps/web/package.json` or the root `package.json` as a dependency.

**Detailed Explanation**:
In commit `2e46c5d73`, the following code was added to `apps/web/next.config.mjs`:

```javascript
// Line 2
import { withPostHogConfig } from "@posthog/nextjs-config";

// Lines 108-117
export default withPostHogConfig(configWithBundleAnalyzer, {
	personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
	envId: process.env.POSTHOG_ENV_ID,
	host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	sourcemaps: {
		enabled: POSTHOG_SOURCEMAPS_ENABLED,
		project: "slideheroes",
		deleteAfterUpload: true,
	},
});
```

However, the commit did not include any changes to:
- `apps/web/package.json`
- Root `package.json`
- `pnpm-lock.yaml`

The package may exist locally (possibly from a prior manual `pnpm add` that wasn't committed, or as a transitive dependency), but in Vercel's clean build environment with `pnpm install --frozen-lockfile`, only declared dependencies are installed.

**Supporting Evidence**:
1. `vercel build` command locally reproduces the exact error
2. `pnpm-lock.yaml` has no entry for `@posthog/nextjs-config`
3. Commit `2e46c5d73` changed `apps/web/next.config.mjs` but no `package.json` files
4. Production builds (from `main` branch) succeed because they don't have commit `2e46c5d73`

### How This Causes the Observed Behavior

1. Developer pushes to `dev` branch
2. GitHub Actions `dev-deploy.yml` workflow triggers
3. Vercel deploy action pulls the code and runs `pnpm install --frozen-lockfile`
4. Since `@posthog/nextjs-config` isn't in `pnpm-lock.yaml`, it's not installed
5. Build runs `pnpm turbo run build --filter=web`
6. Next.js tries to load `next.config.mjs`
7. ESM import of `@posthog/nextjs-config` fails with `ERR_MODULE_NOT_FOUND`
8. Build exits with code 1

### Confidence Level

**Confidence**: High

**Reasoning**:
- Reproduced the exact error locally using `vercel build`
- Confirmed the package is not in `pnpm-lock.yaml`
- Traced the import addition to a specific commit without corresponding dependency changes
- Production builds work because they don't have the problematic commit

## Fix Approach (High-Level)

Add `@posthog/nextjs-config` as a dependency in `apps/web/package.json`:

```bash
cd apps/web && pnpm add @posthog/nextjs-config
```

This will:
1. Add the package to `apps/web/package.json` dependencies
2. Update `pnpm-lock.yaml` with the new dependency
3. Allow the Vercel build to find and import the package

## Diagnosis Determination

**Root cause confirmed**: The `@posthog/nextjs-config` package was imported in code but never declared as a dependency, causing builds to fail in clean environments like Vercel's build system.

## Additional Context
- The commit message for `2e46c5d73` is misleading as it mentions E2E workflow changes but also contains PostHog configuration changes
- Issue #1718 was incorrectly diagnosed as an environment variable issue when the actual problem was the missing dependency
- This explains why Preview deployments fail but Production deployments succeed - the `dev` branch has the problematic commit while `main` does not

---
*Generated by Claude Debug Assistant*
*Tools Used: gh (GitHub CLI), vercel (Vercel CLI), git, grep, pnpm*
