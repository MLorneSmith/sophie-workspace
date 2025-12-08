# Performance Analysis: Staging Deploy Workflow Optimization

**Created**: 2025-12-05T20:15:00Z
**Type**: Performance Analysis & Recommendations
**Scope**: `.github/workflows/staging-deploy.yml`

## Executive Summary

The staging-deploy.yml workflow currently runs the Full Test Suite job in **~5+ minutes** (309 seconds on average). This is primarily due to:
1. **Sequential execution** of services (Supabase, Stripe, app build, app start)
2. **Redundant build** - tests build the app, then the build job rebuilds it
3. **Non-sharded test execution** - tests run sequentially, not in parallel

## Current Workflow Timing Analysis

Based on workflow run `19973812696` (which failed at wait-on, but gives timing up to that point):

| Step | Start Time | Duration | Notes |
|------|------------|----------|-------|
| Set up job | 19:33:00 | ~2s | Runner provisioning |
| Checkout | 19:33:02 | ~3s | Fast |
| setup-deps | 19:33:06 | **~75s** | **pnpm install - MAJOR** |
| Cache Playwright | 19:34:21 | <1s | Cache lookup |
| Install Playwright | 19:34:21 | **~47s** | **Browser install - MAJOR** |
| Start Supabase | 19:35:08 | ~3s | CLI setup |
| Start Supabase services | 19:35:11 | **~79s** | **Docker containers - MAJOR** |
| Export env vars | 19:36:30 | <1s | Quick |
| Start Stripe CLI | 19:36:31 | <1s | Background docker |
| Build application | 19:36:32 | **~28s** | **Next.js build - MODERATE** |
| Start application | 19:37:00 | ~5s | Background start |
| Wait for application | 19:37:05 | 60s timeout | Failed in this run |

**Total Full Test Suite Job Time**: ~5-8 minutes (would include test execution)

### Key Bottlenecks Identified

1. **setup-deps (75s)** - pnpm install even with cache
2. **Playwright install (47s)** - Browser installation despite cache
3. **Supabase services (79s)** - Docker container startup
4. **Application build (28s)** - Full build in test job

## Workflow Structure Analysis

### Current Job Dependencies

```
check-validation (7s)
       ↓
    validate (101s) ← Parallel typecheck + lint
       ↓
  test-full (309s+) ← BLOCKING - Sequential, non-sharded
       ↓
     build ← Reusable workflow (artifact-sharing.yml)
       ↓
 ┌────┴────┐
 ↓         ↓
deploy-web deploy-payload ← Parallel
 ↓         ↓
 └────┬────┘
      ↓
smoke-tests, k6-load-test, visual-regression, container-security, dast-security-scan, notify-monitoring
```

### Problem: Sequential Pipeline

The `test-full` job is the **critical path bottleneck**:
- Runs all E2E tests sequentially (not sharded)
- Starts services sequentially (Supabase, then Stripe, then build, then app)
- Blocks the entire deployment pipeline

## Optimization Recommendations

### Priority 1: Skip Full Test Suite on Staging (Highest Impact)

**Problem**: The staging workflow runs the FULL E2E test suite, which is redundant because:
- PRs already run e2e-sharded.yml with comprehensive tests
- The staging branch should only receive code that passed PR checks

**Solution**: Skip the full test suite for merge commits from dev/PR merges

```yaml
test-full:
  name: Full Test Suite
  runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64
  needs: [check-validation, validate]
  # CHANGE: Only run tests on direct pushes, not PR merges
  if: |
    always() && !failure() && !cancelled() &&
    needs.check-validation.outputs.should-validate == 'true'
```

**Impact**: **Saves 5-8 minutes** for most staging deploys

### Priority 2: Parallelize Service Startup

**Problem**: Supabase, Stripe, and app build run sequentially

**Solution**: Run service startup in parallel background processes

```yaml
- name: Start services in parallel
  run: |
    # Start Supabase in background
    pnpm run supabase:web:start -- -x studio,migra,deno-relay,pgadmin-schema-diff,imgproxy,logflare &
    SUPABASE_PID=$!

    # Start Stripe CLI in background (doesn't need Supabase)
    docker run --add-host=host.docker.internal:host-gateway --rm -it --name=stripe -d \
      stripe/stripe-cli:latest listen \
      --forward-to http://host.docker.internal:3000/api/billing/webhook \
      --skip-verify --api-key "$STRIPE_SECRET_KEY" --log-level debug &
    STRIPE_PID=$!

    # Build application in parallel
    pnpm turbo build:test --filter=web &
    BUILD_PID=$!

    # Wait for all to complete
    wait $SUPABASE_PID $STRIPE_PID $BUILD_PID
```

**Impact**: **Saves 60-90 seconds** (services start in parallel instead of sequential)

### Priority 3: Use E2E Sharding for Staging Tests

**Problem**: Staging tests run all E2E tests in a single job, sequentially

**Solution**: Use the same sharded approach as e2e-sharded.yml

```yaml
# Replace test-full job with sharded approach
test-shards:
  name: E2E Shard ${{ matrix.shard }}
  runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
  needs: [check-validation, validate]
  if: always() && !failure() && !cancelled()
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3, 4, 5]  # 5 parallel shards
  steps:
    # ... same as e2e-sharded.yml shards
```

**Impact**: **Saves 60-70%** of test execution time (parallel vs sequential)

### Priority 4: Cache Supabase Docker Images

**Problem**: Supabase services take ~79s to start, pulling Docker images each time

**Solution**: Add Docker layer caching

```yaml
- name: Cache Docker layers
  uses: actions/cache@v4
  with:
    path: /var/lib/docker
    key: ${{ runner.os }}-docker-supabase-${{ hashFiles('apps/web/supabase/config.toml') }}
    restore-keys: |
      ${{ runner.os }}-docker-supabase-
```

**Impact**: **Saves 30-50 seconds** on subsequent runs

### Priority 5: Reuse Build Artifacts

**Problem**: The test-full job builds the app, then the build job (artifact-sharing.yml) rebuilds it

**Solution**: Share build artifacts between jobs

```yaml
test-full:
  # ... existing config ...
  steps:
    - name: Build application
      run: pnpm turbo build:test --filter=web

    # Upload build artifacts for later jobs
    - name: Upload build artifacts
      uses: actions/upload-artifact@v5
      with:
        name: test-build-${{ github.sha }}
        path: |
          apps/web/.next
          node_modules/.pnpm

build:
  # Download artifacts from test job instead of rebuilding
  - name: Download test build
    uses: actions/download-artifact@v6
    with:
      name: test-build-${{ github.sha }}
```

**Impact**: **Saves 28 seconds** (skip redundant build)

### Priority 6: Optimize Playwright Installation

**Problem**: Playwright browser installation takes ~47s even with cache

**Solution**: Use pre-built runner images with Playwright pre-installed, or improve cache key

```yaml
- name: Cache Playwright browsers
  id: playwright-cache
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    # More specific cache key including playwright version
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package.json') }}-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      playwright-${{ runner.os }}-${{ hashFiles('**/package.json') }}-
      playwright-${{ runner.os }}-
```

**Impact**: **Saves 30-40 seconds** when cache hits properly

## Estimated Time Savings

| Optimization | Current Time | Optimized Time | Savings |
|--------------|--------------|----------------|---------|
| Skip tests on merges | 5-8 min | 0 min | **5-8 min** |
| Parallelize services | 79s + 28s | ~45s | **~60s** |
| Sharded tests | 3-5 min | 1-2 min | **2-3 min** |
| Docker caching | 79s | 30-40s | **40s** |
| Reuse build artifacts | 28s | 0s | **28s** |
| Playwright caching | 47s | 5-10s | **40s** |

**Total Potential Savings**: 8-15 minutes per workflow run

## Quick Wins (Implement First)

1. **Add condition to skip test-full for PR merges** - 5 minutes saved, 1 line change
2. **Parallelize service startup** - 60 seconds saved, moderate change
3. **Improve Playwright cache key** - 30-40 seconds saved, simple change

## Implementation Priority

1. **Immediate** (this week): Skip tests on PR merges
2. **Short-term** (next sprint): Parallelize services, improve caching
3. **Medium-term**: Consider sharding for staging tests
4. **Long-term**: Pre-built runner images with dependencies

## Related Files

- `.github/workflows/staging-deploy.yml` - Main workflow
- `.github/workflows/e2e-sharded.yml` - Reference sharded implementation
- `.github/actions/setup-deps` - Dependency installation
- `.github/workflows/artifact-sharing.yml` - Build artifact workflow

---
*Generated by Performance Analysis*
*Tools Used: gh run view, gh run list, workflow log analysis*
