# Perplexity Research: Turbopack Panic - inner_of_upper_lost_followers Error

**Date**: 2025-12-05
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Investigated Turbopack panic error "inner_of_upper_lost_followers is not able to remove followers" occurring in Next.js 16.0.7 at turbo-tasks-backend/src/backend/operation/aggregation_update.rs:1579 during compilation.

## Findings

### What This Error Means

This panic indicates an **internal Turbopack bug** rather than an issue with application code. According to search results:

- Turbopack maintains internal "follower" relationships between tasks in its dependency graph
- The error suggests Turbopack's incremental dependency aggregation got into an inconsistent state
- When trying to update/remove those relationships, it panicked
- This is not something application code directly controls

### Root Cause

The error occurs in Turbopack's internal task aggregation system when:
- The dependency graph tracking gets into an inconsistent state
- A task marked as completed attempts to be scheduled for recomputation
- The system tries to remove followers but fails due to state mismatch

## Immediate Workarounds

### 1. Disable Turbopack (Most Reliable)

Remove the --turbo/--turbopack flag and use Webpack mode. If the app works with Webpack, this confirms it's a Turbopack-only bug.

### 2. Clear Caches and Reinstall

Delete build artifacts (.next, node_modules) and reinstall dependencies.

Monorepo-specific considerations:
- Ensure only one lockfile at the intended root
- Avoid extra lockfiles in nested app folders
- Multiple lockfiles can confuse Turbopack's project detection

### 3. Try Different Next.js Versions

Try latest canary (many Turbopack panics are fixed in canary releases) or downgrade temporarily to last working version.

## Code Triggers to Check

Even though this is a Turbopack bug, certain code patterns can trigger it more easily:

### Dynamic Imports

- Comment out or simplify next/dynamic imports
- Check for complex cross-layer imports
- Look for circular imports

Example from GitHub issue 77036:
- Files used in both UI and route handlers triggered this panic
- Specifically occurred when route handlers had next/dynamic in their import chain

### Monorepo Setup

From GitHub issue 68974:
- Removing next from root package.json in monorepo fixed the issue
- Resolving "cyclic workspace dependencies" warnings helped

## Related GitHub Issues

### Similar Panics (Fixed)

1. **Issue 77922** - "mark_finished() race condition"
   - Fixed in April 2025
   - Involved task completion and recomputation scheduling
   - Similar root cause in task management

2. **Issue 77036** - "next/dynamic panic in route handlers"
   - Occurred when next/dynamic in import chain of route handlers
   - Fixed in PR 82911 (September 2025)

3. **Issue 76028** - "Next.js package not found" with Turbopack
   - Related to monorepo lockfile issues

### Common Patterns from Issues

Windows-specific issues (Issue 63924):
- PostCSS config problems on Windows only
- Solution: Rename postcss.config.js to postcss.config.cjs

Monorepo issues:
- Multiple lockfiles confuse Turbopack
- Cyclic workspace dependencies cause panics
- Need consistent project root configuration

## Sources & Citations

1. [Next.js Turbopack API Reference](https://nextjs.org/docs/app/api-reference/turbopack)
2. [Turbopack Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
3. [GitHub Issue 77036 - Dynamic import panic](https://github.com/vercel/next.js/issues/77036)
4. [GitHub PR 77922 - Task completion race condition fix](https://github.com/vercel/next.js/issues/77922)
5. [GitHub Issue 76028 - Next.js package not found error](https://github.com/vercel/next.js/issues/76028)
6. [GitHub Issue 63924 - PostCSS Windows crash](https://github.com/vercel/next.js/issues/63924)
7. [GitHub Issue 68974 - Monorepo cyclic dependencies](https://github.com/vercel/next.js/issues/68974)

## Key Takeaways

1. **Not Your Code's Fault**: This is an internal Turbopack bug in dependency graph management
2. **Quick Fix**: Use --webpack flag to bypass Turbopack until fix is available
3. **Cache Clearing**: Delete .next and node_modules, reinstall dependencies
4. **Version Strategy**: Try latest canary or downgrade to last working version
5. **Monorepo Watch-outs**: Single lockfile, no cyclic dependencies, consistent project root
6. **Dynamic Imports**: Simplify/remove next/dynamic to isolate trigger
7. **Report It**: File GitHub issue with panic log for team to fix
8. **No Direct Fix**: Can't be fixed in application code, needs Turbopack core fix

## Recommendation

**Immediate action:**
1. Switch to Webpack mode with --webpack flag
2. Clear caches and reinstall dependencies
3. Test with latest Next.js canary

**If issue persists:**
1. Collect panic log file (.../next-panic-*.log)
2. Create minimal reproduction
3. File GitHub issue at https://github.com/vercel/next.js/issues/new
4. Monitor Next.js releases for fix
