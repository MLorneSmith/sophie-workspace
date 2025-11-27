# CI/CD Pipeline Investigation Report

## Pipeline Information

- **Workflow**: dev-integration-tests.yml
- **Run ID**: 18044610810
- **Failed Job**: Integration Tests, Capture Performance Baseline
- **Failure Time**: 2025-09-26T17:17:42Z
- **Trigger**: workflow_run (Deploy to Dev completed)
- **Branch**: dev

## Root Cause Analysis

### 1. Integration Tests Failure

- **Category**: Build Error / Module Resolution
- **Severity**: Critical
- **Error Details**: `Cannot find module '@kit/shared/dist/logger/index.js'`
- **Triggering Commit**: 246e01e7 by msmith

#### Root Cause

The @kit/shared package was not being built during the CI pipeline, causing module resolution errors when Playwright tests tried to import from `@kit/shared/logger`.

The commit 246e01e7 attempted to fix this by:

1. Adding tsconfig.build.json for @kit/shared
2. Adding build script to package.json
3. Configuring turbo.json dependencies

However, the CI workflow doesn't run a build step before executing tests.

### 2. Performance Baseline Failure

- **Category**: Environment Setup
- **Severity**: High
- **Error Details**: `pnpm: not found` (exit code 127)

#### Root Cause

The `performance-baseline` job is missing the setup-deps action that installs pnpm and other dependencies. The Lighthouse CI action attempts to run pnpm but it's not available in the runner environment.

## Analysis

### Integration Tests Issue

The workflow checks out the dev branch and installs dependencies but doesn't build the packages before running tests. The @kit/shared package exports compiled JavaScript from the dist/ directory, which only exists after running the build command.

**Evidence:**

- Package.json exports: `"./logger": "./dist/logger/index.js"`
- Error in test files: Cannot find module at specified dist path
- Local build works: `pnpm --filter @kit/shared build` produces dist directory

### Performance Baseline Issue

The job only checks out code and immediately runs Lighthouse CI action without setting up the Node/pnpm environment.

**Evidence:**

- Job steps show checkout but no setup-deps
- Lighthouse CI action error: `/bin/sh: 1: pnpm: not found`
- Other jobs in workflow use setup-deps and work correctly

## Recommended Fix

### Phase 1: Immediate Fix for Integration Tests

Add a build step after dependency installation in the integration-tests job:

```yaml
- uses: ./.github/actions/setup-deps

- name: Build required packages
  run: |
    echo "📦 Building @kit/shared package..."
    pnpm --filter @kit/shared build
    echo "✅ Package built successfully"

- name: Cache Playwright browsers
  # ... rest of the job
```

### Phase 2: Fix Performance Baseline Job

Add setup-deps action before running Lighthouse:

```yaml
steps:
  - uses: actions/checkout@v4
    with:
      ref: dev  # Match other jobs

  - uses: ./.github/actions/setup-deps

  - name: Run Lighthouse performance test
    uses: treosh/lighthouse-ci-action@v11
    # ... rest of configuration
```

### Phase 3: Long-term Solution

1. Add a dedicated build job that runs after setup and before all test jobs
2. Cache the built artifacts for use by subsequent jobs
3. Update turbo.json to ensure proper build orchestration
4. Consider adding a `pnpm build` step in setup-deps for integration test workflows

## Prevention Measures

1. **Add Pre-flight Checks**: Verify dist directories exist before running tests
2. **Improve Error Messages**: Add explicit checks for module availability
3. **Standardize Job Templates**: Create reusable workflow that includes setup-deps
4. **Build Caching**: Implement artifact caching for built packages between jobs
5. **Local CI Testing**: Add script to simulate CI environment locally

## Impact Assessment

- **Blocked Deployments**: Integration tests prevent promotion to staging
- **Developer Productivity**: Failed CI blocks PR merges
- **False Negatives**: Tests fail due to infrastructure, not code issues

## Verification Steps

After implementing fixes:

1. Run `pnpm --filter @kit/shared build` in CI
2. Verify dist/logger/index.js exists
3. Ensure all jobs have pnpm available via setup-deps
4. Run manual workflow dispatch to verify fixes
5. Monitor next automated run from Deploy to Dev trigger

## Additional Findings

### Successful Pattern

Previous successful runs (16:51:40 UTC) show no changes to workflow file, indicating the issue was introduced by code changes requiring build step, not workflow changes.

### Circuit Breaker Observations

The setup-deps action has sophisticated circuit breaker pattern and fallback mechanisms, but these don't help when the action isn't called at all (performance-baseline job).

## Recommended Actions

1. **Immediate**: Apply fixes to dev-integration-tests.yml
2. **Today**: Test fixes with manual workflow dispatch
3. **This Week**: Implement build caching strategy
4. **Next Sprint**: Refactor CI workflows for better modularity

## Conclusion

Two distinct failures with clear root causes:

1. Missing build step for @kit/shared package (Integration Tests)
2. Missing setup-deps action (Performance Baseline)

Both are straightforward configuration fixes that will restore pipeline functionality.
