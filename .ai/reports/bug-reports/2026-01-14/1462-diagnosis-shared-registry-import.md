# Bug Diagnosis: CI Unit Tests Fail - Cannot find package '@kit/shared/registry'

**ID**: ISSUE-pending
**Created**: 2026-01-14T16:30:00Z
**Reporter**: system (CI failure)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

CI unit tests fail with `ERR_MODULE_NOT_FOUND` for `@kit/shared/registry` because the `@kit/shared` package's `dist` folder doesn't exist after fresh `pnpm install`. The package.json exports point to compiled `dist/*.js` files, but CI runs tests without building packages first. Tests pass locally because developers have previously built the packages.

## Environment

- **Application Version**: dev branch (commit c22bc7dcb)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20.x
- **pnpm Version**: 10.14.0
- **Last Working**: Unknown - may have been masked by Turbo cache

## Reproduction Steps

1. Fresh clone of repository (or delete `packages/shared/dist/`)
2. Run `pnpm install`
3. Run `pnpm test:coverage` (or `pnpm --filter @kit/team-accounts test`)
4. Observe failure in `packages/features/team-accounts/src/server/policies/policies.test.ts`

**Local reproduction:**
```bash
# Simulate CI environment
mv packages/shared/dist packages/shared/dist.bak
pnpm --filter @kit/team-accounts test
# Test fails with: Cannot find package '@kit/shared/registry'
mv packages/shared/dist.bak packages/shared/dist
```

## Expected Behavior

Unit tests should pass in CI after `pnpm install` without requiring a separate build step.

## Actual Behavior

Tests fail with:
```
Error: Cannot find package '@kit/shared/registry' imported from
'/home/runner/_work/2025slideheroes/2025slideheroes/packages/policies/src/registry.ts'
```

## Diagnostic Data

### Console Output
```
FAIL team-accounts src/server/policies/policies.test.ts
Error: Cannot find package '@kit/shared/registry' imported from
'/home/runner/_work/2025slideheroes/2025slideheroes/packages/policies/src/registry.ts'
 ❯ ../../policies/src/registry.ts:1:1
    1| import { createRegistry } from "@kit/shared/registry";
      | ^
    2|
    3| import type { FeaturePolicyDefinition } from "./declarative";
 ❯ ../../policies/src/index.ts:29:1

Test Files  1 failed | 7 passed (8)
     Tests  120 passed (120)

Serialized Error: { code: 'ERR_MODULE_NOT_FOUND' }
```

### Module Resolution Analysis

**packages/shared/package.json exports:**
```json
"exports": {
  "./logger": "./dist/logger/index.js",
  "./utils": "./dist/utils.js",
  "./hooks": "./dist/hooks/index.jsx",
  "./events": "./dist/events/index.jsx",
  "./registry": "./dist/registry/index.js"  // Points to dist - requires build
}
```

**tsconfig.json paths:**
```json
"paths": {
  "@kit/*": ["packages/*/src"]  // Points to src - no build required
}
```

**Import chain:**
1. `@kit/team-accounts` test imports `@kit/policies`
2. `@kit/policies/src/registry.ts` imports `@kit/shared/registry`
3. Node ESM resolution reads `@kit/shared/package.json` exports
4. Looks for `./dist/registry/index.js` - file doesn't exist in CI
5. Fails with `ERR_MODULE_NOT_FOUND`

### Affected Packages

8 packages import `@kit/shared/registry`:
- `packages/monitoring/api/src/instrumentation.ts`
- `packages/monitoring/api/src/services/get-server-monitoring-service.ts`
- `packages/monitoring/api/src/components/provider.tsx`
- `packages/mailers/core/src/registry.ts`
- `packages/cms/core/src/create-cms-client.ts`
- `packages/policies/src/registry.ts`
- `packages/billing/gateway/src/server/services/billing-gateway/billing-gateway-registry.ts`
- `packages/billing/gateway/src/server/services/billing-event-handler/billing-event-handler-factory.service.ts`

## Error Stack Traces
```
Error: Cannot find package '@kit/shared/registry' imported from
'/home/runner/_work/2025slideheroes/2025slideheroes/packages/policies/src/registry.ts'
 ❯ ../../policies/src/registry.ts:1:1
 ❯ ../../policies/src/index.ts:29:1

Serialized Error: { code: 'ERR_MODULE_NOT_FOUND' }
```

## Related Code
- **Affected Files**:
  - `packages/shared/package.json` (exports configuration)
  - `packages/shared/src/registry/index.ts` (source file)
  - `packages/policies/src/registry.ts` (first consumer that fails)
  - `.github/workflows/pr-validation.yml` (CI workflow)
  - `.github/actions/setup-deps/action.yml` (dependency setup)
- **Recent Changes**: No recent changes to `@kit/shared` - issue likely existed but was masked by Turbo cache
- **Suspected Functions**: Package.json exports configuration and CI workflow test execution

## Related Issues & Context

### Historical Context
This issue was likely masked by Turbo remote caching - cached test results from environments where packages were built would pass, but fresh CI runs fail.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `@kit/shared` package.json exports point to compiled `dist/*.js` files, but CI runs unit tests without building packages first, causing Node.js ESM resolution to fail.

**Detailed Explanation**:
The monorepo uses two different module resolution strategies that conflict:

1. **TypeScript/Vitest resolution** (via `vite-tsconfig-paths`): Uses tsconfig.json paths (`@kit/*` → `packages/*/src`) to resolve source files directly. This works without building.

2. **Node.js ESM resolution**: When importing a package like `@kit/shared/registry`, Node reads the package.json `exports` field which points to `./dist/registry/index.js`. This requires the package to be built.

The conflict occurs because:
- Vitest uses `tsconfigPaths()` to resolve imports to source
- But some imports go through Node's native ESM loader (transitive dependencies)
- The `@kit/policies` package imports `@kit/shared/registry` using the package specifier
- Node's ESM loader reads `@kit/shared/package.json` exports → `./dist/registry/index.js`
- In CI with fresh install, `dist/` doesn't exist → `ERR_MODULE_NOT_FOUND`

**Supporting Evidence**:
- Local reproduction: Renaming `packages/shared/dist` causes identical failure
- CI logs show exact error: `Cannot find package '@kit/shared/registry'`
- Source file exists: `packages/shared/src/registry/index.ts`
- Dist file exists locally: `packages/shared/dist/registry/index.js`
- Package.json exports: `"./registry": "./dist/registry/index.js"`

### How This Causes the Observed Behavior

1. GitHub Actions runs `pnpm install` (no build)
2. PR Validation workflow runs `pnpm test:coverage`
3. Turbo runs tests across packages
4. `@kit/team-accounts` tests import `@kit/policies`
5. `@kit/policies` imports `@kit/shared/registry`
6. Node.js ESM loader reads `@kit/shared/package.json`
7. Export `./registry` maps to `./dist/registry/index.js`
8. File doesn't exist → `ERR_MODULE_NOT_FOUND`

### Confidence Level

**Confidence**: High

**Reasoning**:
- Reproduced locally by removing dist folder
- Error message explicitly states the missing package path
- Package.json exports confirm dist-based resolution
- Tests pass when dist folder exists

## Fix Approach (High-Level)

Three possible fixes (choose one):

1. **Add build step to CI before tests** (Quick fix)
   - Modify `.github/workflows/pr-validation.yml` to run `pnpm build` or `pnpm turbo build --filter=@kit/shared` before `pnpm test:coverage`
   - Pro: Simple, works immediately
   - Con: Adds CI time

2. **Add conditional exports for source files** (Recommended)
   - Update `@kit/shared/package.json` to include source exports for development:
   ```json
   "exports": {
     "./registry": {
       "types": "./src/registry/index.ts",
       "import": "./dist/registry/index.js",
       "default": "./src/registry/index.ts"
     }
   }
   ```
   - Pro: Works without build in development
   - Con: More complex exports, may need tooling adjustments

3. **Configure vitest to resolve all @kit imports to source** (Alternative)
   - Update vitest configs to alias `@kit/shared/registry` → source path
   - Pro: No build needed for tests
   - Con: Requires updating multiple vitest configs

## Diagnosis Determination

The root cause is definitively identified: CI runs tests without building packages, but package.json exports require built dist files. This is a build order/configuration issue, not a code bug.

## Additional Context

- All 6 open Dependabot PRs are affected by this issue
- The issue blocks all PR merges until fixed
- Tests pass locally because developers have built packages previously
- Turbo cache may have masked this issue in the past

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Glob, Bash (test execution, dist folder manipulation)*
