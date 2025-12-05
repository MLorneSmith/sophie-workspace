# Context7 Research: Next.js 16 Turbopack Panics

**Date**: 2025-12-05
**Agent**: context7-expert
**Libraries Researched**: vercel/next.js

## Query Summary

Researched Next.js 16 Turbopack stability issues, specifically the "aggregation_update" panic:
```
inner_of_upper_lost_followers is not able to remove followers TaskId
```

## Findings

### Official Documentation Review

Reviewed Next.js Turbopack documentation across three topic areas:
- **Turbopack issues** (2935 tokens)
- **Turbopack troubleshooting** (2979 tokens)  
- **Turbopack stability** (2927 tokens)

**Documentation Coverage**:
- Configuration options (resolveAlias, resolveExtensions, rules)
- Debug tooling (NEXT_TURBOPACK_TRACING, debugIds)
- Filesystem caching (turbopackFileSystemCacheForDev)
- Migration guides (Webpack to Turbopack)
- Performance optimization

**Notable Absence**:
- No mention of the "aggregation_update" panic
- No documentation of "inner_of_upper_lost_followers" error
- No specific stability warnings or known issues section

### What Was NOT Found

The official Next.js documentation **does not document**:
1. The aggregation_update panic error
2. The inner_of_upper_lost_followers TaskId removal issue
3. Known stability issues with Turbopack in Next.js 16
4. Specific workarounds for Turbopack panics beyond basic debugging

This suggests this is either:
- A low-level Turbopack/turbo-tasks bug not yet documented
- An edge case not commonly encountered
- A recent regression in Next.js 16

## Key Takeaways

### Documented Debugging Tools

1. Enable Tracing:
   NEXT_TURBOPACK_TRACING=1 next dev
   - Generates .next/dev/trace-turbopack file
   - Analyze with: npx next internal trace .next/dev/trace-turbopack
   - Opens trace viewer at https://trace.nextjs.org/

2. Enable Debug IDs in next.config.js:
   turbopack: { debugIds: true }

3. Filesystem Caching (may help with consistency):
   experimental: { turbopackFileSystemCacheForDev: true }

### Fallback to Webpack

Official workaround for Turbopack issues:
"scripts": { "dev": "next dev --webpack" }

## Recommended Next Steps

### 1. Search GitHub Issues
This error is likely reported in:
- https://github.com/vercel/next.js/issues
- https://github.com/vercel/turbo/issues (Turbopack repository)

Search queries:
- "aggregation_update panic"
- "inner_of_upper_lost_followers"
- "turbo-tasks-backend panic"
- "TaskId followers"

### 2. Immediate Workarounds

Option A: Use Webpack (most stable)
pnpm dev --webpack

Option B: Disable Filesystem Cache (if enabled)
experimental: { turbopackFileSystemCacheForDev: false }

Option C: Clean Build Cache
Delete .next directory and restart dev server

### 3. Generate Trace for Bug Report

If reporting to Vercel:
NEXT_TURBOPACK_TRACING=1 pnpm dev
Wait for panic to occur and submit trace file

### 4. Check Next.js Version

pnpm list next
Consider testing with latest canary version

## Error Pattern Analysis

Error Signature: inner_of_upper_lost_followers is not able to remove followers TaskId
Error Category: aggregation_update panic
Component: turbo-tasks-backend

Likely Cause: 
- Task dependency graph inconsistency
- Race condition in Turbopack's incremental compilation
- Filesystem cache corruption
- Module resolution cycle

Severity: High (causes dev server panic/crash)

## Sources

- Next.js via Context7 (vercel/next.js)
  - /docs/01-app/03-api-reference/08-turbopack.mdx
  - /docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.mdx
  - /docs/01-app/03-api-reference/05-config/01-next-config-js/turbopackFileSystemCache.mdx
  - /docs/01-app/02-guides/upgrading/version-16.mdx
  - /docs/01-app/02-guides/local-development.mdx

## Delegation Note

For comprehensive GitHub issue search and web research, delegate to:
- research-agent: Web search for GitHub issues and community discussions
- perplexity-agent: Real-time search for latest bug reports and fixes
