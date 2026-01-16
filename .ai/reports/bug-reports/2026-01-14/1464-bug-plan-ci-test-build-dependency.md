# Bug Fix: CI Tests Missing Build Dependency

**Related Diagnosis**: #1462
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `test:coverage` task in turbo.json doesn't depend on `^build`, so packages with dist exports aren't built before tests run
- **Fix Approach**: Add `^build` dependency to `test:coverage` task in turbo.json
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

CI unit tests fail because the `@kit/shared` package's dist folder doesn't exist after fresh `pnpm install`. The package.json exports point to `./dist/*.js` files, but the `test:coverage` Turbo task doesn't build dependencies before running tests.

For full details, see diagnosis issue #1462.

### Solution Approaches Considered

#### Option 1: Add ^build dependency to test:coverage in turbo.json ⭐ RECOMMENDED

**Description**: Modify `turbo.json` to make the `test:coverage` task depend on `^build`, ensuring all packages with build steps (like `@kit/shared`) are built before tests run. This follows the same pattern already used by the `typecheck` task.

**Pros**:
- **Minimal change**: Single line modification in turbo.json
- **Leverages Turbo cache**: Builds are cached and only run when needed
- **Consistent with existing patterns**: `typecheck` already uses `dependsOn: ["^build"]`
- **Zero code changes**: No modifications to package.json exports or vitest configs
- **Fast in CI**: Turbo's remote cache means builds often hit cache
- **Works everywhere**: Fixes local development, CI, and any environment

**Cons**:
- Adds ~5-10 seconds to test execution when cache miss occurs
- Requires building packages even if only running tests

**Risk Assessment**: low - This is a well-established Turbo pattern already used successfully by typecheck

**Complexity**: simple - One-line change to existing configuration

#### Option 2: Add conditional exports to @kit/shared/package.json

**Description**: Modify `@kit/shared/package.json` exports to include source file fallbacks:
```json
"exports": {
  "./registry": {
    "types": "./src/registry/index.ts",
    "import": "./dist/registry/index.js",
    "default": "./src/registry/index.ts"
  }
}
```

**Pros**:
- No build required for tests
- Potentially faster test execution

**Cons**:
- **Inconsistent resolution**: Production uses dist, tests use src
- **Multiple package.json changes**: Need to update all 5 exports
- **Vitest config changes**: May need additional resolver configuration
- **Harder to debug**: Different code paths in different environments
- **Type resolution complexity**: May confuse TypeScript path resolution

**Why Not Chosen**: This introduces environment-dependent behavior that could mask production issues. The recommended approach is simpler and more reliable.

#### Option 3: Add explicit build step to CI workflow

**Description**: Modify `.github/workflows/pr-validation.yml` to run `pnpm build --filter=@kit/shared` before the test step.

**Pros**:
- Direct control over CI execution order
- Clear and explicit

**Cons**:
- **CI-specific fix**: Doesn't solve local development
- **Duplicates logic**: Turbo already manages build dependencies
- **More workflow changes**: Requires updating multiple workflows (pr-validation, dev-deploy, staging-deploy)
- **Cache fragmentation**: Builds and tests would have separate cache keys
- **Maintenance burden**: Every workflow that runs tests needs updating

**Why Not Chosen**: This fixes CI but not local development, and goes against Turbo's dependency management philosophy.

### Selected Solution: Add ^build dependency to test:coverage

**Justification**: This is the cleanest, most maintainable solution. It leverages Turbo's existing build dependency system, follows established patterns (typecheck already does this), and ensures consistency across all environments with minimal code changes.

**Technical Approach**:
- Modify `turbo.json` task configuration for `test:coverage`
- Change `dependsOn: ["^topo"]` to `dependsOn: ["^build"]`
- Turbo will automatically build all dependencies that have build tasks before running tests

**Architecture Changes**:
None - this aligns with existing architecture where `typecheck` already depends on `^build`.

**Migration Strategy**:
None needed - this is a transparent change to the build system.

## Implementation Plan

### Affected Files

- `turbo.json` - Update `test:coverage` task to depend on `^build` instead of `^topo`

### New Files

None required - this is a configuration-only change.

### Step-by-Step Tasks

#### Step 1: Update turbo.json task dependency

Modify the `test:coverage` task in `turbo.json`:

- Open `turbo.json`
- Find the `test:coverage` task (line ~207)
- Change `"dependsOn": ["^topo"]` to `"dependsOn": ["^build"]`
- Save the file

**Why this step first**: This is the complete fix - single file, single line change.

**Before:**
```json
"test:coverage": {
  "dependsOn": ["^topo"],
  "outputs": ["coverage/**"],
  "cache": true
}
```

**After:**
```json
"test:coverage": {
  "dependsOn": ["^build"],
  "outputs": ["coverage/**"],
  "cache": true
}
```

#### Step 2: Verify the fix locally

Test the fix in a clean environment:

- Delete `packages/shared/dist/` folder
- Run `pnpm test:coverage`
- Verify tests pass (dist folder should be built automatically)

#### Step 3: Verify Turbo correctly builds dependencies

- Run `pnpm turbo test:coverage --dry-run` to see execution plan
- Confirm `@kit/shared#build` appears in the dependency graph
- Confirm packages are built in correct order

#### Step 4: Test in CI

- Commit the change
- Push to a branch and create PR
- Verify CI tests pass without additional changes

#### Step 5: Validate all test commands

Ensure all test-related commands work correctly:

- Run `pnpm test` (unit tests without coverage)
- Run `pnpm test:coverage` (full coverage tests)
- Verify both build dependencies correctly

## Testing Strategy

### Unit Tests

No new unit tests required - this is a build system configuration change. However, we need to verify existing tests pass.

**Verification**:
- All existing unit tests should pass
- Tests in `@kit/team-accounts`, `@kit/policies`, `@kit/monitoring`, etc. should work

### Integration Tests

No integration tests required.

### E2E Tests

No E2E tests required.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (delete `packages/shared/dist/`, run tests - should fail before fix)
- [ ] Apply fix and verify bug is resolved (tests should pass)
- [ ] Test with clean install: `rm -rf node_modules .turbo && pnpm install && pnpm test:coverage`
- [ ] Verify Turbo builds dependencies: `pnpm turbo test:coverage --dry-run`
- [ ] Test that Turbo cache works: run `pnpm test:coverage` twice, second run should be instant
- [ ] Verify typecheck still works: `pnpm typecheck`
- [ ] Verify build still works: `pnpm build`
- [ ] Test affected packages: `pnpm --filter @kit/team-accounts test`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Increased test execution time**
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: Turbo cache ensures builds only run when needed. Remote cache in CI means most builds hit cache. Estimated impact: 0-10 seconds per test run (only on cache miss).

2. **Turbo cache invalidation**
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Turbo's cache invalidation is well-tested. Build inputs are properly configured in turbo.json. If issues arise, can temporarily disable cache with `--force`.

**Rollback Plan**:

If this fix causes issues:
1. Revert the single line change in `turbo.json` (change back to `"dependsOn": ["^topo"]`)
2. Commit and push
3. CI will revert to previous behavior (though tests will fail again)

**Monitoring**:
- Monitor CI test execution time for first few PRs
- Watch for any Turbo cache-related errors
- Verify test success rate remains at 100%

## Performance Impact

**Expected Impact**: minimal

**Analysis**:
- **First run (cold cache)**: +5-10 seconds to build `@kit/shared` and any other packages
- **Subsequent runs (warm cache)**: 0 seconds (Turbo hits cache)
- **CI with remote cache**: Usually 0 seconds (cache hit rate is high)

**Performance Testing**:
```bash
# Measure before fix (will fail, but shows baseline)
time pnpm test:coverage

# Measure after fix (with cold cache)
rm -rf .turbo packages/*/dist
time pnpm test:coverage

# Measure after fix (with warm cache - should be same as before or faster)
time pnpm test:coverage
```

## Security Considerations

**Security Impact**: none

No security implications - this is a build dependency configuration change.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Simulate fresh CI environment
rm -rf packages/shared/dist

# Run tests - should fail with ERR_MODULE_NOT_FOUND
pnpm test:coverage
```

**Expected Result**: Tests fail with "Cannot find package '@kit/shared/registry'"

### After Fix (Bug Should Be Resolved)

```bash
# Type check (already works - uses ^build)
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Unit tests with coverage (this is the fix)
pnpm test:coverage

# Build
pnpm build

# Verify Turbo execution plan
pnpm turbo test:coverage --dry-run

# Test specific package
pnpm --filter @kit/team-accounts test

# Clean test (simulate CI)
rm -rf .turbo packages/*/dist node_modules && pnpm install && pnpm test:coverage
```

**Expected Result**: All commands succeed, all tests pass, dist folders are built automatically.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Verify build dependency chain
pnpm turbo build test:coverage --dry-run

# Test all affected packages
pnpm --filter @kit/team-accounts test
pnpm --filter @kit/policies test
pnpm --filter @kit/monitoring test
pnpm --filter @kit/mailers test
pnpm --filter @kit/cms test

# Verify typecheck still works
pnpm typecheck

# Verify production build
pnpm build
```

## Dependencies

**No new dependencies required**

This is a configuration-only fix using existing Turbo functionality.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required - this is a build configuration change that takes effect immediately.

**Feature flags needed**: no

**Backwards compatibility**: maintained - this change is transparent to end users and developers

## Success Criteria

The fix is complete when:
- [ ] `turbo.json` updated with `^build` dependency
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (tests pass with clean dist folders)
- [ ] All CI checks pass on PR
- [ ] Manual testing checklist complete
- [ ] Turbo execution plan shows correct build dependencies
- [ ] Performance is acceptable (minimal time increase)
- [ ] Dependabot PRs can be merged

## Notes

**Why this fix is better than alternatives:**
1. **Consistency**: Aligns with how `typecheck` already works
2. **Simplicity**: One line change vs. multiple package.json modifications
3. **Reliability**: Works in all environments (local, CI, Docker)
4. **Maintainability**: Leverages Turbo's dependency management
5. **Performance**: Turbo cache ensures minimal performance impact

**Turbo dependency meanings:**
- `"dependsOn": ["^topo"]` - Run after topological dependencies (packages that depend on me)
- `"dependsOn": ["^build"]` - Run after all dependencies are built

The `typecheck` task already uses `^build` successfully, proving this pattern works for the monorepo.

**Reference**: See Turbo documentation on [task dependencies](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks#dependencies-between-tasks)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1462*
