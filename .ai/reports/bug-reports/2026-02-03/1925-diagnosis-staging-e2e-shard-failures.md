# Bug Diagnosis: Staging E2E Shards 3-5+ Fail with Missing .next Production Build

**ID**: ISSUE-pending
**Created**: 2026-02-03T23:30:00Z
**Reporter**: msmith (via /diagnose)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Multiple E2E test shards (3, 4, 5, and potentially others) are failing during the staging deployment workflow with the error "Could not find a production build in the '.next' directory" even though the build artifacts cache is successfully restored. Shards 1 and 2 pass with identical cache restoration, indicating a race condition or timing-dependent issue.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/GitHub Actions (staging-deploy.yml)
- **Workflow Run**: 21651005995
- **Node Version**: 20.10.0
- **Next.js Version**: 16.1.5 (with Turbopack)
- **Runner**: runs-on (ubuntu-24.04)
- **Last Working**: Shards 1 and 2 in same workflow run

## Reproduction Steps

1. Push changes to staging branch (or merge dev→staging PR)
2. Staging deployment workflow triggers
3. Test Setup job builds application and caches to `staging-test-build-*`
4. E2E Shards 1-12 run in parallel
5. Shards 3, 4, 5 (and possibly others) fail with missing .next error

## Expected Behavior

All E2E shards should successfully restore the cached `.next` directory from the Test Setup job and start the Next.js production server via `next start`.

## Actual Behavior

Shards 3, 4, 5 fail with:
```
[WebServer] Error: Could not find a production build in the '.next' directory. Try building your app with 'next build' before starting the production server.
```

Despite logs showing the cache was successfully restored:
```
Cache hit for: staging-test-build-a74455b8cb88362802b10dac9dc1d211247b5248-21651005995
Cache Size: ~49 MB (51166497 B)
Cache restored successfully
```

## Diagnostic Data

### Cache Restoration Comparison

**Shard 1 (SUCCESS)**:
- Cache restored from key: `Linux-nextjs-961b16c1fec1434fe97eb63b119378e7d88a427c7ca2a7c7c9c8a2356e8161fd-97dba867416093bd0886f1df19dc18cfbfe60485bf5b5f550677721aba94b116`
- Cache restored from key: `staging-test-build-a74455b8cb88362802b10dac9dc1d211247b5248-21651005995`
- WebServer started: `✓ Ready in 477ms`

**Shard 3 (FAILURE)**:
- Cache restored from key: `Linux-nextjs-961b16c1fec1434fe97eb63b119378e7d88a427c7ca2a7c7c9c8a2356e8161fd-97dba867416093bd0886f1df19dc18cfbfe60485bf5b5f550677721aba94b116`
- Cache restored from key: `staging-test-build-a74455b8cb88362802b10dac9dc1d211247b5248-21651005995`
- WebServer failed: `Error: Could not find a production build`

### Timeline Analysis (Shard 3)

| Time | Event |
|------|-------|
| 23:05:18 | `.next/cache` restored (from setup-deps, ~63KB) |
| 23:05:21 | Full `apps/web/.next` restored (staging-test-build, 49MB) |
| 23:05:40 | Playwright browsers restored (429MB) |
| 23:06:32 | Supabase start begins |
| 23:09:43 | Supabase ready |
| 23:10:07 | Playwright test starts |
| 23:10:13 | WebServer fails - no production build |

### Cache Order Issue

The `setup-deps` composite action includes a "Cache Next.js build" step that restores:
```yaml
path: |
  ${{ github.workspace }}/.next/cache
  ${{ github.workspace }}/apps/web/.next/cache
```

This runs BEFORE the "Restore build artifacts" step which restores:
```yaml
path: |
  apps/web/.next
  apps/payload/dist
  packages/*/dist
  .turbo
```

### Tar Extraction Sequence (Shard 3)

1. `23:04:00` - pnpm cache (548 MB)
2. `23:04:21` - pnpm store (549 MB)
3. `23:05:18` - Next.js cache only (63KB) - `Linux-nextjs-*`
4. `23:05:21` - Full .next + build artifacts (49MB) - `staging-test-build-*`
5. `23:05:40` - Playwright browsers (429MB)

## Error Stack Traces

```
[WebServer] Error: Could not find a production build in the '.next' directory.
Try building your app with 'next build' before starting the production server.
https://nextjs.org/docs/messages/production-start-no-build-id
```

## Related Code

- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 257-340, test-shards job)
  - `.github/actions/setup-deps/action.yml` (lines 80-89, Cache Next.js build)
  - `apps/e2e/playwright.config.ts` (lines 208-220, webServer config)

- **Recent Changes**: PR #1922 merged (biome config updates) - unrelated to cache logic

- **Suspected Functions**:
  - Cache restoration order/timing
  - Potential tar extraction race condition
  - Possible filesystem corruption under concurrent operations

## Related Issues & Context

### Similar Symptoms
- Issue #1583, #1584: Previous issues with E2E webServer startup (addressed with `next start` vs `next dev`)

### Historical Context
- The staging deployment workflow uses sharded E2E tests for parallelization
- Cache sharing between Test Setup and shards has been stable
- This appears to be a new/intermittent failure pattern

## Root Cause Analysis

### Identified Root Cause

**Summary**: Race condition between multiple cache restoration steps causing incomplete or corrupted `.next` directory state on some shards.

**Detailed Explanation**:
The workflow has TWO cache restoration steps that both touch the `.next` directory:

1. **setup-deps action** (line 80-89 of action.yml): Restores `.next/cache` subdirectory only
2. **Restore build artifacts** (line 272-282 of staging-deploy.yml): Restores full `apps/web/.next`

When these run in quick succession:
- The first tar extraction creates `apps/web/.next/cache/`
- The second tar extraction should overwrite with full `.next` contents
- But there may be a race condition where:
  - The tar extraction of the full `.next` fails silently
  - OR the directory is in an inconsistent state
  - OR concurrent disk I/O causes corruption

**Supporting Evidence**:
1. Same cache keys used for successful (Shard 1-2) and failing (Shard 3-5) shards
2. Both shards report "Cache restored successfully"
3. Shards 1-2 start tests earlier (23:09:21) vs Shards 3-5 (23:10:07+)
4. The stagger delay (Shard 1=0s, Shard 3=20s) means different timing relative to cache operations

### How This Causes the Observed Behavior

1. Test Setup job builds and caches `apps/web/.next` (49MB)
2. E2E shards start with staggered delays
3. Each shard runs setup-deps which restores `.next/cache` (partial)
4. Each shard then restores full `apps/web/.next` (should overwrite)
5. For some shards, the full restoration doesn't properly overwrite/complete
6. When `next start` runs, it can't find BUILD_ID or other production files
7. Next.js reports "Could not find a production build"

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- The logs show cache restoration "succeeding" for all shards
- The timing difference between passing and failing shards suggests a race condition
- Without filesystem-level debugging, we can't confirm exactly what's in `.next` at failure time
- Could also be a GitHub Actions cache API issue under concurrent access

## Fix Approach (High-Level)

**Option 1 (Quick Fix)**: Remove the redundant `.next/cache` caching from `setup-deps/action.yml` since the full `.next` directory is cached by the "Restore build artifacts" step. This eliminates the cache restoration order issue.

**Option 2 (Better Fix)**: Add a verification step after cache restoration that checks for BUILD_ID existence before running tests:
```bash
if [ ! -f "apps/web/.next/BUILD_ID" ]; then
  echo "ERROR: .next build missing, rebuilding..."
  pnpm --filter web build:test
fi
```

**Option 3 (Safest)**: Combine both - remove redundant caching AND add verification.

## Diagnosis Determination

The root cause is a conflict between two cache restoration steps both touching the `.next` directory. The `setup-deps` action's "Cache Next.js build" step is redundant when the full production build is cached separately, and creates a race condition where the partial cache may interfere with the full cache restoration.

The fix should remove the `.next/cache` caching from `setup-deps/action.yml` or add explicit verification that the production build exists before starting tests.

## Additional Context

- Workflow run URL: https://github.com/slideheroes/2025slideheroes/actions/runs/21651005995
- Shards still running at time of diagnosis (6, 7, 8 in progress; 9-12 queued)
- Issue may affect any staging deployment until fixed

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, GitHub Actions logs API, file reads of workflow configurations*
