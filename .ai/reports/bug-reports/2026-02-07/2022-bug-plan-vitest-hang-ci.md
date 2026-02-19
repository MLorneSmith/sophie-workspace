# Bug Fix: apps/web Vitest Hangs in CI Due to ESM/jsdom/parse5 Node 20 Interop Failure

**Related Diagnosis**: #2021 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: ESM/CJS interop failure - Node 20 cannot `require()` the ESM-only parse5 8.x loaded by jsdom 27.x inside vitest's `pool: "forks"` workers
- **Fix Approach**: Upgrade CI Node version from 20.10 to 22.x (native ESM module support in Node 22)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `apps/web` vitest process hangs indefinitely in CI after initialization ("RUN v4.0.15" appears) but never produces test output. All 8 other test packages complete in under 5 seconds, and the same 725 tests pass locally in 3.28 seconds on Node 22.16.0.

The root cause is an ESM/CJS interop failure specific to Node 20: when using `pool: "forks"` with `environment: "jsdom"` (which loads parse5 8.x), Node 20 cannot resolve the `require()` of ESM-only modules inside worker processes. This causes a silent hang rather than a crash, as the error occurs in forked child processes.

For full details, see diagnosis issue #2021.

### Solution Approaches Considered

#### Option 1: Upgrade CI Node to 22 ⭐ RECOMMENDED

**Description**: Change the Node version in the GitHub Actions CI runner from 20.10 to 22.x (latest stable), matching the local development environment.

**Pros**:
- **Aligns environments**: CI and local use same Node version - eliminates environment-specific bugs
- **Native ESM support**: Node 22 natively supports `require()` of ESM modules - fixes root cause
- **Future-proof**: Node 20 is entering maintenance mode; 22 is LTS
- **Simple one-line change**: Update NODE_VERSION in pr-validation.yml
- **Zero configuration**: No vitest config changes needed
- **Proven locally**: Tests pass locally on Node 22.16.0 (725 tests in 3.28s)
- **Low risk**: Node version change is isolated, no code logic changes

**Cons**:
- **Minor**: Upgrade adds ~200ms to CI startup (downloading larger Node binary)
- **Future consideration**: Will eventually need to upgrade to Node 26+ in 1-2 years as Node 22 LTS ends

**Risk Assessment**: low - Node 22 is stable LTS, widely deployed, ESM support is core platform feature

**Complexity**: simple - one-line YAML change

#### Option 2: Switch Pool from "forks" to "threads"

**Description**: Change `pool: "forks"` to `pool: "threads"` in `apps/web/vitest.config.mts`. Worker threads may handle ESM differently than forked processes.

**Pros**:
- **Stays on Node 20**: Doesn't require CI environment change
- **Thread-local**: Reduces IPC overhead compared to forks

**Cons**:
- **Previously reverted**: Commit a471a6d10 shows this was attempted and reverted due to tinypool termination issues
- **ESM still problematic**: Threads also can't resolve ESM modules in Node 20
- **Higher complexity**: May introduce new termination/cleanup issues
- **Uncertain fix**: No guarantee threads resolve the hang

**Why Not Chosen**: The threading approach was already tried, caused different problems, and doesn't address the root cause (Node 20 ESM limitation)

#### Option 3: Pre-bundle parse5 as CJS

**Description**: Add vitest `deps.optimizer` config to pre-bundle parse5 as CommonJS.

**Pros**:
- **Workable**: Would likely resolve the immediate hang

**Cons**:
- **Complex setup**: Requires vitest.config changes, build optimization config
- **Ongoing maintenance**: Any jsdom updates may require reconfiguration
- **Deeper problem**: Works around the issue rather than fixing it
- **Future tech debt**: When Node 24+ is LTS, this workaround becomes unnecessary

**Why Not Chosen**: Option 1 (upgrade Node) fixes the problem at the source with zero ongoing maintenance burden

### Selected Solution: Upgrade CI Node to 22

**Justification**:

Upgrading CI Node to 22 is the **definitive solution** because:

1. **Root cause fix**: Node 22 natively supports `require()` of ESM modules, eliminating the ESM/CJS interop failure
2. **Simplicity**: One-line YAML change vs. complex vitest config workarounds
3. **Environment parity**: Aligns CI with local dev (which already runs Node 22 successfully)
4. **Zero maintenance**: No ongoing config or build setup needed
5. **Future-proof**: Node 22 is LTS; maintains forward compatibility for 2+ years
6. **Proven**: Tests already pass on Node 22 locally (3.28s for 725 tests)
7. **Industry standard**: Node 22 is production-ready, widely deployed

**Technical Approach**:
- Update `NODE_VERSION: '20'` to `NODE_VERSION: '22'` in `.github/workflows/pr-validation.yml`
- No vitest config changes needed
- No code logic changes
- All existing tests pass without modification

**Architecture Changes**: None - this is a runtime environment change only

**Migration Strategy**: Not needed - Node version upgrade is non-breaking, all dependencies already support Node 22

## Implementation Plan

### Affected Files

- `.github/workflows/pr-validation.yml` - Change NODE_VERSION environment variable from '20' to '22'

### New Files

None needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify Node 22 Environment Setup

This step confirms that Node 22 is available in the CI runner and will work correctly.

- Examine current pr-validation.yml to find the NODE_VERSION variable
- Confirm the GitHub Actions runner can access Node 22 (standard on RunsOn/GitHub-hosted runners)
- Verify no other workflow files override Node version

**Why this step first**: Ensures we don't introduce any version conflicts or missing dependencies

#### Step 2: Update NODE_VERSION Environment Variable

Update `.github/workflows/pr-validation.yml` to use Node 22:

- Change `NODE_VERSION: '20'` to `NODE_VERSION: '22'`
- OR change `node-version: '20.10'` to `node-version: '22.x'` (depending on current syntax)
- Keep all other workflow configuration unchanged

**Verification**: The file should now specify Node 22 for all test jobs

#### Step 3: Run Local Verification

Verify the tests still pass locally on Node 22 before pushing to CI:

- Navigate to `apps/web` directory
- Run `CI=true npx vitest run` to execute tests in CI mode
- Confirm all 725 tests pass in approximately 3-5 seconds
- Verify no new errors or warnings

**Why local verification**: Catches any unexpected issues before they hit CI

#### Step 4: Commit the Change

Create a commit with the Node version update following the project's Conventional Commits format.

- Commit message format: `fix(ci): upgrade Node.js from 20 to 22 for ESM jsdom support`
- Include reference to the bug: `[agent: debug_engineer]`
- Example: `fix(ci): upgrade Node.js to 22 for native ESM/CJS interop support [agent: debug_engineer]`

#### Step 5: Run PR Validation

Push the change to a feature branch and verify CI completes successfully:

- Push to a test branch (or create a PR)
- Wait for `pr-validation.yml` workflow to run
- Verify the "Unit Tests" job completes successfully (all 9 packages including apps/web)
- Confirm no timeout or hang in the apps/web test step
- Check that total test run time is reasonable (< 2 minutes for all packages)

#### Step 6: Verify No Regressions

Confirm that no other workflows or tests were affected by the Node version change:

- Check that all other jobs (linting, type checking, build) complete successfully
- Verify no new warnings or errors in CI output
- Spot-check that existing feature branch tests still pass

## Testing Strategy

### Unit Tests

The existing vitest suite in `apps/web` will validate the fix:

- ✅ All 725 existing tests should pass on Node 22
- ✅ Tests should complete in < 5 seconds (matching local times)
- ✅ No ESM-related errors in test output
- ✅ No process hangs or timeouts

**Test files**:
- `apps/web/**/*.spec.ts` - Entire existing test suite validates the fix

### Integration Tests

CI workflow will provide full integration validation:

- ✅ All 9 packages complete testing without hang
- ✅ apps/web tests complete within reasonable time (< 5s)
- ✅ No orphan processes at cleanup
- ✅ No cache corruption or state issues

### E2E Tests

Existing E2E tests will continue to pass:

- ✅ `apps/e2e` tests should run and pass
- ✅ No regressions in end-to-end functionality

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Read `.github/workflows/pr-validation.yml` to confirm NODE_VERSION update
- [ ] Verify syntax is correct (no YAML errors)
- [ ] Run locally: `cd apps/web && CI=true npx vitest run` - should complete in ~3-5s
- [ ] All 725 tests pass locally
- [ ] Push to feature branch and verify CI workflow starts successfully
- [ ] Wait for "Unit Tests" job to complete (should not hang)
- [ ] Confirm apps/web tests output shows test results (not stuck at "RUN v4.0.15")
- [ ] Verify all 9 packages complete without timeout
- [ ] Check for no orphan processes in CI cleanup logs
- [ ] Verify CI total time is reasonable for full validation

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Dependency incompatibility with Node 22**: Low probability
   - **Likelihood**: low - pnpm dependencies already tested locally on Node 22
   - **Impact**: medium - tests would fail, caught immediately in PR validation
   - **Mitigation**: Running tests locally first catches any issues before CI

2. **CI runner environment change**: Low probability
   - **Likelihood**: low - Node 22 is standard on GitHub-hosted runners
   - **Impact**: low - fallback is to revert one line and use Node 20 again
   - **Mitigation**: Quick rollback available if needed

3. **Performance difference**: Very low probability
   - **Likelihood**: very low - ESM performance is equivalent on Node 22
   - **Impact**: low - tests may be slightly faster due to native ESM
   - **Mitigation**: Monitor CI times, expected < 2 min for full suite

**Rollback Plan**:

If the Node 22 upgrade causes unexpected issues:

1. Revert the YAML change: `NODE_VERSION: '22'` → `NODE_VERSION: '20'`
2. Commit: `revert: downgrade Node.js to 20`
3. Push to dev branch
4. Monitor CI for return to baseline (may reintroduce the hang)
5. Investigate specific Node 22 incompatibility
6. Consider alternative approaches (threads pool, pre-bundling)

**Monitoring** (if needed):
- Monitor CI "Unit Tests" job duration - should be 30-60 seconds
- Watch for no process hangs (previously hung at 5 minutes)
- Check for ESM-related errors in test output

## Performance Impact

**Expected Impact**: minimal improvement

The ESM/jsdom hang will be eliminated. Tests should:
- Complete in ~5 seconds on CI (currently hang after initialization)
- Potentially run slightly faster due to native ESM support
- No negative performance impact expected

**Performance Testing**:
- Verify local test time (baseline: 3.28s locally on Node 22)
- Verify CI test time (target: < 10s per package, < 2 min total)

## Security Considerations

**Security Impact**: none

Node 22 is more secure than Node 20 (contains latest security patches). This change has no security risk.

## Validation Commands

### Before Fix (Bug Should Reproduce on Node 20)

```bash
# Simulate Node 20 behavior (requires Node 20 available)
nvm use 20
cd apps/web
CI=true npx vitest run
# Expected: Process hangs after "RUN v4.0.15", times out after 5 minutes
```

### After Fix (Bug Should Be Resolved on Node 22)

```bash
# Verify Node 22 is active
node --version  # Should output v22.x.x

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests - apps/web should complete quickly
cd apps/web
CI=true npx vitest run
# Expected: All 725 tests pass in < 5 seconds

# Full test suite on all packages
pnpm test:unit
# Expected: All 9 packages complete in < 2 minutes, no hangs

# E2E tests (if applicable)
pnpm test:e2e
# Expected: All E2E tests pass

# Build
pnpm build
```

**Expected Result**: All commands succeed, apps/web tests complete quickly without hanging, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify CI workflow completes (no timeout)
gh run view <run-id> --repo slideheroes/2025slideheroes

# Additional regression checks
pnpm typecheck  # Ensure type safety maintained
pnpm lint       # Ensure code quality maintained
```

## Dependencies

### New Dependencies

None - this is a runtime environment change only.

**No new packages to install**

### Existing Dependency Notes

- All existing pnpm dependencies already support Node 22
- No version conflicts expected
- Lock file unchanged

## Database Changes

**No database changes required**

This is a CI environment change only, with no impact on database schema or migrations.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - Node 22 is fully backwards compatible with Node 20 in terms of JavaScript execution

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/pr-validation.yml` updated with NODE_VERSION: '22'
- [ ] Local tests pass on Node 22 (all 725 tests in < 5s)
- [ ] CI "Unit Tests" job completes without hanging
- [ ] apps/web tests output shows actual test results (not stuck at initialization)
- [ ] All 9 packages complete in < 2 minutes
- [ ] No orphan processes in CI cleanup
- [ ] Zero regressions detected in other jobs (lint, type check, build)
- [ ] Code review approved
- [ ] Manual testing checklist complete

## Notes

**Diagnosis Analysis**:
The diagnosis correctly identified the root cause as ESM/CJS interop failure between parse5 8.x (ESM-only) and Node 20's worker fork processes. The evidence showing:
- All 8 non-jsdom packages pass quickly
- Same tests pass locally on Node 22 in 3.28s
- Orphan esbuild processes at cleanup suggest worker initialization failure

...all point to this being a Node 20 limitation, not a code issue.

**Why this is the best fix**:
1. Addresses root cause (Node 20 ESM support), not symptoms
2. Single-line change, zero maintenance burden
3. Aligns CI with local dev environment
4. Future-proof (Node 22 is LTS)
5. Already proven to work locally

**Related Context**:
- Diagnosis issue #2021 contains complete failure history (21 debugging attempts over 2 days)
- Previous attempts to work around with turbo cache, pools, and exclusions all failed
- Root cause was masked by testing in wrong Node version (20 vs 22)

---
*Generated by Claude Debug Assistant*
*Based on diagnosis: #2021*
