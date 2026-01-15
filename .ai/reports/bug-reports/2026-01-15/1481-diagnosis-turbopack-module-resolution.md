# Bug Diagnosis: Turbopack Module Resolution Fails for pnpm Nested Dependencies

**ID**: ISSUE-pending
**Created**: 2026-01-15T16:15:00Z
**Reporter**: system (discovered after corepack fix)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

After fixing the corepack deployment issue (#1479), Vercel deployments now fail during the **build phase** with Turbopack unable to resolve nested pnpm dependencies. Specifically, `@sentry/node-core` (38 errors) and `@react-email/tailwind` (1 error) cannot be found, despite being properly installed. The build succeeds locally with Webpack but fails on Vercel with Turbopack.

## Environment

- **Application Version**: 2.13.1
- **Environment**: Vercel Preview (dev branch)
- **Node Version**: 22.x (Vercel default)
- **Next.js Version**: 16.0.7
- **pnpm Version**: 10.14.0
- **Turbopack**: Enabled on Vercel
- **Last Working**: December 11, 2025 (commit d573fec)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. GitHub Actions triggers the `dev-deploy.yml` workflow
3. Vercel CLI starts deployment
4. Install phase succeeds: `pnpm install --frozen-lockfile` ✅
5. Build phase fails: `pnpm turbo run build --filter=web` ❌
6. Turbopack reports 39 module resolution errors

## Expected Behavior

Vercel should build the web app successfully, resolving all dependencies including nested packages like `@sentry/node-core` and `@react-email/tailwind`.

## Actual Behavior

Turbopack fails with 39 errors:
- 38x `Module not found: Can't resolve '@sentry/node-core'`
- 1x `Module not found: Can't resolve '@react-email/tailwind'`

## Diagnostic Data

### Console Output
```
2026-01-15T16:05:28.591Z  web:build: Error: Turbopack build failed with 39 errors:
2026-01-15T16:05:28.591Z  web:build: Module not found: Can't resolve '@react-email/tailwind'
2026-01-15T16:05:28.592Z  web:build: ./node_modules/.pnpm/@react-email+components@1.0.1.../dist/index.mjs:37:1
2026-01-15T16:05:28.593Z  web:build: Module not found: Can't resolve '@sentry/node-core'
2026-01-15T16:05:28.593Z  web:build: ./node_modules/.pnpm/@sentry+node@10.27.0/node_modules/@sentry/node/build/cjs/index.js:45:18
```

### Local vs Vercel Build Comparison

| Environment | Bundler | Result |
|-------------|---------|--------|
| Local (`pnpm build`) | Webpack | ✅ Success |
| Vercel | Turbopack | ❌ 39 errors |

### pnpm Hoisting Analysis

```bash
# Root node_modules (hoisted packages)
$ ls node_modules/@sentry
No @sentry in hoisted node_modules

$ ls node_modules/@react-email
No @react-email in hoisted node_modules

# Packages exist in .pnpm store
$ ls node_modules/.pnpm/@sentry+node-core*
node_modules/.pnpm/@sentry+node-core@10.27.0_...
node_modules/.pnpm/@sentry+node-core@9.47.1_...

$ ls node_modules/.pnpm/@react-email+tailwind*
node_modules/.pnpm/@react-email+tailwind@2.0.1_...
```

### Current .npmrc Configuration

```
legacy-peer-deps=true
public-hoist-pattern[]=import-in-the-middle
public-hoist-pattern[]=require-in-the-middle
```

## Error Stack Traces

```
./node_modules/.pnpm/@react-email+components@1.0.1_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/@react-email/components/dist/index.mjs:37:1
Module not found: Can't resolve '@react-email/tailwind'

./node_modules/.pnpm/@sentry+node@10.27.0/node_modules/@sentry/node/build/cjs/index.js:45:18
Module not found: Can't resolve '@sentry/node-core'
```

## Related Code

- **Affected Files**:
  - `.npmrc` - pnpm hoisting configuration
  - `packages/monitoring/sentry/package.json` - depends on `@sentry/nextjs@^10.27.0`
  - `packages/email-templates/package.json` - depends on `@react-email/components@1.0.1`
  - `apps/web/next.config.mjs` - Turbopack configuration

- **Recent Changes**:
  - December 4, 2025: Next.js updated to 16.0.7 (commit 6f49ed30)
  - December 11, 2025: Last successful deploy (commit d573fec)

- **Dependency Chain**:
  - `@sentry/nextjs` → `@sentry/node` → `@sentry/node-core`
  - `@react-email/components` → `@react-email/tailwind`

## Related Issues & Context

### Direct Predecessors
- #1479 (CLOSED): "Bug Fix: Vercel Deploy to Dev fails with corepack enable exit code 1" - The corepack fix unmasked this issue

### Related Infrastructure Issues
- #933 (CLOSED): "Bug Diagnosis: Turbopack panic during homepage compilation" - Previous Turbopack issue
- #934 (CLOSED): "Bug Fix: Turbopack panic during homepage compilation" - Disabled turbopackFileSystemCacheForDev

### Historical Context

This is the second Turbopack-related issue in 6 weeks. The previous issue (#933) was a Turbopack panic that required disabling `turbopackFileSystemCacheForDev`. This new issue is about module resolution in pnpm monorepos.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Turbopack on Vercel cannot resolve pnpm's nested symlinked dependencies that aren't hoisted to root `node_modules`.

**Detailed Explanation**:
1. pnpm stores all packages in `.pnpm` store and creates symlinks
2. Packages like `@sentry/node-core` and `@react-email/tailwind` are **not hoisted** to root `node_modules`
3. They only exist in the nested `.pnpm` store (e.g., `node_modules/.pnpm/@sentry+node-core@10.27.0_...`)
4. Webpack (used locally) follows pnpm symlinks correctly
5. Turbopack (used on Vercel production) fails to resolve these nested symlinked packages
6. The `.npmrc` only hoists `import-in-the-middle` and `require-in-the-middle` - the Sentry and react-email packages are not included

**Supporting Evidence**:
- Local build with Webpack: SUCCESS
- Vercel build with Turbopack: FAILURE
- The packages exist in `.pnpm` store but aren't hoisted
- Error points directly to symlinked paths: `./node_modules/.pnpm/@sentry+node@10.27.0/...`

### How This Causes the Observed Behavior

1. Vercel triggers build: `pnpm turbo run build --filter=web`
2. Next.js invokes Turbopack for production bundling
3. Turbopack encounters import of `@sentry/node-core` from `@sentry/node`
4. Turbopack looks in `node_modules/@sentry/node-core` - NOT FOUND (not hoisted)
5. Turbopack does NOT follow pnpm's symlink structure in `.pnpm` store
6. Same issue occurs for `@react-email/tailwind` imported by `@react-email/components`
7. Build fails with 39 module resolution errors

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear evidence: local Webpack build succeeds, Vercel Turbopack build fails
- Root cause is consistent with known Turbopack/pnpm compatibility issues
- The packages exist in `.pnpm` store but fail to resolve only in Turbopack
- Adding packages to `public-hoist-pattern` is the standard fix for this pattern

## Fix Approach (High-Level)

Add the missing packages to `public-hoist-pattern` in `.npmrc` to force pnpm to hoist them to root `node_modules`, making them resolvable by Turbopack:

```
public-hoist-pattern[]=@sentry/node-core
public-hoist-pattern[]=@react-email/tailwind
```

Alternative approaches:
1. Add packages as explicit dependencies in `apps/web/package.json`
2. Configure Turbopack's `resolveAlias` in `next.config.mjs` to map these packages
3. Disable Turbopack for production builds (not recommended - loses performance benefits)

## Diagnosis Determination

The root cause is confirmed: Turbopack's module resolution algorithm doesn't follow pnpm's symlink structure for nested dependencies that aren't hoisted. The fix is to add the missing packages to `.npmrc`'s `public-hoist-pattern` configuration.

## Additional Context

- This issue was masked for 34 days by the corepack failure (#1478/#1479)
- The corepack fix allowed the install phase to pass, revealing this build phase error
- This is a known limitation of Turbopack with pnpm monorepos
- Vercel uses Turbopack by default for Next.js 15+ production builds

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git log, pnpm commands, grep, npm view*
