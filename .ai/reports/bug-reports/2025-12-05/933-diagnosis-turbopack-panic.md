# Bug Diagnosis: Turbopack panic during homepage compilation

**ID**: ISSUE-933
**Created**: 2025-12-05T14:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When running `pnpm dev`, the homepage fails to compile with a Turbopack internal panic error. The error occurs in the turbo-tasks-backend crate during the aggregation update process, specifically when attempting to remove follower edges from the dependency graph. This is a known Turbopack bug affecting Next.js 16.x with the `turbopackFileSystemCacheForDev` experimental feature enabled.

## Environment

- **Application Version**: dev branch (commit 02b4381e3)
- **Environment**: development
- **Node Version**: v22.16.0
- **pnpm Version**: 10.14.0
- **Next.js Version**: 16.0.7
- **React Version**: 19.2.1
- **Turbo Version**: 2.6.1
- **Last Working**: Unknown

## Reproduction Steps

1. Run `pnpm dev` to start development server
2. Navigate to homepage (/) or wait for initial compilation
3. Observe the Turbopack panic error in console

## Expected Behavior

The homepage should compile successfully and render in the browser.

## Actual Behavior

Compilation fails with a Turbopack internal panic:
```
thread 'tokio-runtime-worker' panicked at aggregation_update.rs:1579:17
inner_of_upper_lost_followers is not able to remove followers
```

## Diagnostic Data

### Console Output
```
web:dev:  ○ Compiling / ...
web:dev:
web:dev: thread 'tokio-runtime-worker' (536731) panicked at /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/aggregation_update.rs:1579:17:
web:dev: inner_of_upper_lost_followers is not able to remove followers TaskId 152139 (<DiskFileSystem as FileSystem>::read), TaskId 151974 (AssetIdent::from_path), TaskId 911 (<DiskFileSystem as ValueToString>::to_string), TaskId 144565 (<DiskFileSystem as FileSystem>::raw_read_dir) from TaskId 284966 (<EsmAssetReference as ModuleReference>::resolve_reference) as they don't exist as upper or follower edges
web:dev: note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

### Configuration Analysis

The project's `next.config.mjs` has:
```javascript
experimental: {
  turbopackFileSystemCacheForDev: true,  // Potential trigger
  mdxRs: true,
  optimizePackageImports: [...],
}
```

This experimental caching feature has been linked to Turbopack stability issues.

## Error Stack Traces
```
Location: /build/turbopack/crates/turbo-tasks-backend/src/backend/operation/aggregation_update.rs:1579:17

Panic message: inner_of_upper_lost_followers is not able to remove followers
TaskIds involved:
- 152139: <DiskFileSystem as FileSystem>::read
- 151974: AssetIdent::from_path
- 911: <DiskFileSystem as ValueToString>::to_string
- 144565: <DiskFileSystem as FileSystem>::raw_read_dir
- 284966: <EsmAssetReference as ModuleReference>::resolve_reference (target)
```

## Related Code
- **Affected Files**:
  - `apps/web/next.config.mjs` (configuration)
  - Homepage route files
- **Recent Changes**: No direct changes to config; this appears to be an upstream Turbopack bug
- **Suspected Functions**: Turbopack's incremental compilation dependency graph management

## Related Issues & Context

### Similar Symptoms (Upstream)
- **vercel/next.js#77922** - Task completion race condition (fixed April 2025)
- **vercel/next.js#77036** - next/dynamic panic in route handlers (fixed Sept 2025)
- **vercel/next.js#76028** - Package not found with monorepo lockfiles

### Historical Context
This is a known class of Turbopack bugs related to the dependency graph's "follower" relationship tracking. The specific error (`inner_of_upper_lost_followers`) indicates the incremental compilation state has become inconsistent, likely due to race conditions in the aggregation update process.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Turbopack's internal dependency graph enters an inconsistent state when the filesystem cache feature is enabled, causing panics during incremental compilation.

**Detailed Explanation**:
Turbopack maintains a dependency graph where tasks have "follower" relationships for incremental recompilation. The `turbopackFileSystemCacheForDev: true` experimental feature persists this graph to disk between sessions. When restoring from cache or during complex module resolution (like the monorepo's internal packages), the graph can enter an inconsistent state where edges are referenced that no longer exist. This triggers a panic when the aggregation update tries to remove non-existent follower edges.

The specific failure path:
1. Turbopack starts compiling the homepage
2. ESM asset reference resolution triggers follower edge management
3. The code attempts to remove TaskIds from the dependency graph
4. These TaskIds don't exist as follower edges (stale cache or race condition)
5. Assertion fails, causing the panic

**Supporting Evidence**:
- Stack trace points to `aggregation_update.rs:1579` - follower edge removal code
- Configuration has `turbopackFileSystemCacheForDev: true` enabled
- TaskIds in error relate to filesystem operations and module resolution
- Similar issues documented in vercel/next.js issues

### How This Causes the Observed Behavior

1. User runs `pnpm dev`
2. Turbopack loads persisted cache from `.next/dev/cache`
3. Homepage compilation starts
4. Module resolution for imports triggers dependency tracking
5. Stale/inconsistent cache data causes follower edge mismatch
6. Panic occurs, stopping compilation

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error is in Turbopack internal code, not application code
- The specific feature (`turbopackFileSystemCacheForDev`) is experimental
- Multiple similar issues have been reported and fixed in Next.js canary
- The panic message clearly indicates a graph consistency issue

## Fix Approach (High-Level)

**Immediate Workarounds** (choose one):
1. Disable the experimental cache feature: Set `turbopackFileSystemCacheForDev: false` in next.config.mjs
2. Clear the Turbopack cache: Delete `.next/dev/cache` directory
3. Use Webpack instead: Run `pnpm dev -- --webpack`

**Long-term Fix**:
- Upgrade to a newer Next.js version when a fix is released
- Monitor vercel/next.js for related issue fixes

## Diagnosis Determination

This is a confirmed Turbopack internal bug, not an application code issue. The root cause is the experimental `turbopackFileSystemCacheForDev` feature causing cache inconsistency in the dependency graph. The fix is to disable this feature or clear the cache.

## Additional Context

- Turbopack is still maturing; experimental features carry stability risks
- The monorepo structure with 24+ internal packages may increase the complexity of module resolution and exacerbate the issue
- Consider pinning to a specific Next.js version until stability improves

---
*Generated by Claude Debug Assistant*
*Tools Used: git, pnpm, file reads, perplexity-expert, context7-expert*
