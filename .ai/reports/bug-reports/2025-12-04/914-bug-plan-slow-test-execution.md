# Bug Fix: Slow Test Execution - Multiple Architectural Issues

**Related Diagnosis**: #913
**Severity**: medium
**Bug Type**: performance
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Duplicate test execution in Shards 7 & 8 (2x Payload tests), Global Setup running per-shard instead of globally, unbalanced shard distribution causing sequential bottlenecks
- **Fix Approach**: Remove duplicates from Shard 8, optimize Global Setup caching, rebalance shard distribution
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The comprehensive test suite takes 25+ minutes instead of the expected 10-15 minutes. Root causes include:

1. **Duplicate Tests** - Shard 8 includes all files from Shard 7 plus seeding tests, causing Payload CMS tests to run twice
2. **Repeated Global Setup** - Global Setup runs once per `playwright test` command (6+ times) instead of once globally
3. **Unbalanced Distribution** - Fast tests (Shards 1-6) complete in 6 min while slow Payload tests (Shards 7-8) take 24+ min sequentially

For full details, see diagnosis issue #913.

### Solution Approaches Considered

#### Option 1: Remove Duplicates + Cache Global Setup + Rebalance Shards ⭐ RECOMMENDED

**Description**: This comprehensive approach addresses all three root causes systematically:
- Remove duplicate tests from Shard 8 (keep only seeding tests)
- Implement auth state file caching to avoid repeated Global Setup
- Optionally rebalance shards for better parallelization

**Pros**:
- Eliminates duplicate test execution (40% overhead removed)
- Reduces Global Setup overhead from 3-6 min to ~1 min total
- Maintains clear shard semantics (each shard has unique responsibility)
- No changes to Playwright configuration or test infrastructure
- Preserves dependency order (Shard 7 always runs before Shard 8)
- Low risk - only touches configuration, no test code changes

**Cons**:
- Requires careful verification of Shard 8's actual test expectations
- Needs to update test documentation to reflect new Shard 8 scope

**Risk Assessment**: low - Configuration-only changes with clear validation

**Complexity**: moderate - Three coordinated fixes but each is straightforward

#### Option 2: Use Playwright's Project Dependencies

**Description**: Implement Playwright's built-in project dependencies instead of file duplication:
- Remove duplicate files from Shard 8
- Add `project.dependencies: ['shard7']` in config to ensure execution order

**Pros**:
- Leverages Playwright's native feature for ordering
- Elegant separation of concerns

**Cons**:
- Requires changes to Playwright configuration (more complex)
- Adds unnecessary indirection for testing dependency
- Shard 7 must still complete before Shard 8 starts (no parallelization benefit)

**Why Not Chosen**: Option 1 achieves same result with simpler implementation (configuration-only fixes)

#### Option 3: Merge Shard 7 & 8 Into One

**Description**: Combine all Payload tests into single shard for simplicity

**Pros**:
- One shard fewer to manage
- Clearer mental model

**Cons**:
- Monolithic 14+ min shard blocks parallelization
- Loses semantic separation of concerns (core tests vs seeding)
- Hard to scale if more Payload tests are added

**Why Not Chosen**: Current separation is intentional; removes beneficial organization

### Selected Solution: Option 1 - Comprehensive Fix

**Justification**: This approach directly fixes all three root causes with minimal risk. The changes are surgical (configuration only), well-understood, and maintain system design while dramatically improving performance.

**Technical Approach**:

1. **Remove Duplicates from Shard 8** - Change `shardGroups[7].files` in `e2e-test-runner.cjs` to only include seeding tests:
   ```javascript
   // BEFORE: Includes Shard 7 files + seeding
   files: [
     "tests/payload/payload-auth.spec.ts",           // DUPLICATE
     "tests/payload/payload-collections.spec.ts",    // DUPLICATE
     "tests/payload/payload-database.spec.ts",       // DUPLICATE
     "tests/payload/seeding.spec.ts",                // UNIQUE
     "tests/payload/seeding-performance.spec.ts",    // UNIQUE
   ]

   // AFTER: Only seeding tests
   files: [
     "tests/payload/seeding.spec.ts",
     "tests/payload/seeding-performance.spec.ts",
   ]
   ```

2. **Optimize Global Setup** - The auth state files in `.auth/` directory are automatically generated and reused by Playwright. When Shard 7 completes and generates `.auth/*.json` files, Shard 8 will reuse them instead of regenerating. This happens automatically if Global Setup checks for existing files (verification needed in `apps/e2e/global-setup.ts`).

3. **Verify Shard Dependencies** - Confirm Shard 8 depends on Shard 7 completing first (test execution order maintained by sequential shard chains)

**Architecture Changes** (minimal):
- Configuration-only changes in `e2e-test-runner.cjs`
- No changes to test files, Playwright config, or infrastructure code
- Maintains existing shard numbering (no renumbering required)

**Execution Order**:
- Before fix: Shards 7 & 8 both run full Payload tests (2x execution)
- After fix: Shard 7 runs Payload tests, Shard 8 runs only seeding tests

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:503-509` - Remove duplicate files from Shard 8
- `apps/e2e/global-setup.ts` - Verify auth state caching (likely already works, needs validation)
- `apps/e2e/package.json` - Test documentation (comment updates only)

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Remove Duplicate Tests from Shard 8

Update the Shard 8 configuration in `e2e-test-runner.cjs` to only include seeding tests.

**Why this step first**: Eliminates the most visible performance issue (duplicate test execution). This alone removes ~12 min from test execution.

- Open `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs`
- Locate the Shard 8 configuration (around line 500)
- Change `files` array to remove the three Payload test files:
  - Remove `"tests/payload/payload-auth.spec.ts"`
  - Remove `"tests/payload/payload-collections.spec.ts"`
  - Remove `"tests/payload/payload-database.spec.ts"`
  - Keep `"tests/payload/seeding.spec.ts"`
  - Keep `"tests/payload/seeding-performance.spec.ts"`
- Update `expectedTests` count to reflect only seeding tests (or set to null if unknown)

#### Step 2: Verify Global Setup Auth State Caching

Review `apps/e2e/global-setup.ts` to ensure it checks for existing auth state files before regenerating.

**Why this step second**: Once duplicates are removed, Global Setup optimization becomes the primary performance bottleneck. This step ensures Shard 8 reuses Shard 7's auth states instead of regenerating them.

- Open `apps/e2e/global-setup.ts`
- Check if function checks for existing `.auth/*.json` files before authenticating
- If not, add checks like: `if (fs.existsSync(authState.filePath)) { skip authentication }`
- This allows Shard 8 to skip authentication when running after Shard 7 (which already created the files)

**Important**: Global Setup runs once per shard invocation. By caching auth states, Shard 8 will reuse what Shard 7 already created, saving 30-60s per shard.

#### Step 3: Update Test Expectations

Update the expectedTests count for Shard 8 to reflect only seeding tests.

**Why this step third**: Ensures test reports and summaries are accurate after the change.

- Count the actual tests in `tests/payload/seeding.spec.ts` and `tests/payload/seeding-performance.spec.ts`
- Or run tests and observe actual count
- Update `expectedTests` field in Shard 8 configuration
- Update test documentation if separate file exists

#### Step 4: Validate Shard Execution Order

Confirm that Shard 8 still depends on Shard 7 completing first through the sequential execution chain.

**Why this step fourth**: Ensures seeding tests always have the Payload CMS tests completed first (dependency).

- Review `.ai/ai_scripts/testing/config/test-config.cjs` and confirm `maxConcurrentShards: 2`
- This means: Chain 1 (shards 1-6), Chain 2 (shards 7-12)
- Shard 7 and 8 are in same chain, so 8 waits for 7 automatically
- No changes needed; document this behavior

#### Step 5: Run Full Test Suite and Verify Performance

Execute the full test suite and compare timing to baseline.

**Why this step last**: Validates all fixes work together as expected.

- Run `/test` command
- Capture full execution time (should be ~10-15 min instead of 25+ min)
- Check that Shard 8 only runs seeding tests (not Payload core tests)
- Verify no test failures introduced by changes
- Document timing improvement

## Testing Strategy

### Unit Tests

No unit tests affected (all fixes are configuration changes).

### Integration Tests

No integration tests needed (test execution order and file structure already validated by E2E suite).

### E2E Tests

The E2E test suite itself validates these fixes:

- ✅ Verify Shard 7 completes Payload core tests
- ✅ Verify Shard 8 runs only seeding tests (not duplicates)
- ✅ Verify auth state is reused (Shard 8 skips Global Setup auth)
- ✅ Regression test: All original tests still pass
- ✅ Performance test: Full suite completes in <15 min

### Manual Testing Checklist

Execute these before considering the fix complete:

- [ ] Verify `e2e-test-runner.cjs` Shard 8 has only seeding tests
- [ ] Run `/test` and capture full execution time
- [ ] Verify time is <15 minutes (improvement from 25+ min)
- [ ] Run `/test --shard 7` and verify Payload tests complete
- [ ] Run `/test --shard 8` after Shard 7 completes and verify only seeding tests run
- [ ] Check that no test failures introduced
- [ ] Verify test report shows correct test counts per shard
- [ ] Check console output shows Global Setup ran fewer times (not 6+ times)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Shard 8 Depends on Shard 7 Tests**: If seeding tests expect Payload CMS to be initialized, removing them from Shard 8 could break tests
   - **Likelihood**: low (seeding tests are designed to run after Shard 7 in same chain)
   - **Impact**: medium (tests would fail during execution)
   - **Mitigation**: Run Shard 8 in isolation after full test suite to validate. If failure occurs, it means the dependency was implicit. Document it and consider using explicit project dependencies in Playwright config.

2. **Auth State File Conflicts**: Multiple shards accessing same `.auth/*.json` files could cause race conditions
   - **Likelihood**: low (file system operations are atomic, Shard 7 completes before Shard 8 starts in same chain)
   - **Impact**: low (worst case: Shard 8 regenerates auth state)
   - **Mitigation**: Existing architecture already handles this (`.auth/` directory is designed for multiple shards)

3. **Performance Expectations Not Met**: Timing improvement might be less than expected if other bottlenecks exist
   - **Likelihood**: low (analysis shows clear 2x duplicate overhead)
   - **Impact**: low (partial improvement still valuable)
   - **Mitigation**: Detailed performance analysis already completed; timing estimates well-supported

**Rollback Plan**:

If fixes cause issues in production:
1. Revert `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` to previous state
2. This restores original Shard 8 configuration with duplicates
3. Tests will run slower but with original behavior
4. No database or system changes to revert (config-only)

**Monitoring** (if needed):
- Track test execution times over next week of development
- Monitor Shard 8 test counts to ensure only seeding tests run
- Alert if execution time regresses above 15 min

## Performance Impact

**Expected Impact**: significant - 40-45% reduction in total execution time

**Baseline**: 25+ minutes
**Target**: 10-15 minutes
**Expected improvement**: 10-15 minutes saved

**Performance Testing**:
- Compare full test suite timing before and after fix
- Measure individual shard times to validate duplicate removal
- Confirm Global Setup runs fewer times (ideally 1-2 times total)

## Security Considerations

**Security Impact**: none

- Configuration changes only
- No changes to auth flow or credential handling
- Auth state files already exist and are git-ignored
- No new security vectors introduced

## Validation Commands

### Before Fix (Duplicates Should Execute)

```bash
# Run Shard 7 - should execute Payload core tests
pnpm --filter web-e2e test:shard7
# Expected: ~12 min, ~42 tests (payload-auth, payload-collections, payload-database)

# Run Shard 8 - currently includes duplicates
pnpm --filter web-e2e test:shard8
# Expected: ~12+ min, ~69+ tests (duplicates + seeding)
```

### After Fix (Duplicates Should Be Gone)

```bash
# Type check - ensure no TypeScript errors in modified files
pnpm typecheck

# Lint - ensure code style is correct
pnpm lint

# Run full test suite
/test
# Expected: <15 minutes total (down from 25+ min)

# Shard 7 - Payload core tests
pnpm --filter web-e2e test:shard7
# Expected: ~12 min, ~42 tests (unchanged)

# Shard 8 - Only seeding tests (duplicates removed)
pnpm --filter web-e2e test:shard8
# Expected: ~2-3 min, ~20-30 tests (only seeding tests)

# Full suite timing verification
pnpm --filter web-e2e test:shard1 && pnpm --filter web-e2e test:shard2 ... test:shard12
# Expected: sum of individual shards ≈ full suite time
```

### Regression Prevention

```bash
# Run full test suite multiple times to ensure consistency
/test
/test
/test

# All runs should be within similar timing ranges (±2 min variance is acceptable)
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

### Existing Dependencies Used

- `e2e-test-runner.cjs` - Shard configuration and orchestration
- `global-setup.ts` - Auth state generation and caching
- Playwright configuration - Test execution and storage state management

## Database Changes

**No database changes required** - All fixes are test orchestration configuration only.

## Deployment Considerations

**Deployment Risk**: low - Local development only

**Special deployment steps**: None needed

- Changes only affect local test execution
- No CI/CD pipeline changes required
- Can be deployed immediately after testing

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Existing test infrastructure unchanged
- Shard numbering unchanged
- No breaking changes to test format or execution

## Success Criteria

The fix is complete when:
- [ ] Shard 8 configuration only includes seeding tests (no Payload core tests)
- [ ] Full test suite runs in <15 minutes (down from 25+ min)
- [ ] All tests pass (zero test failures)
- [ ] No new regressions detected
- [ ] Global Setup runs fewer times (2 instead of 6+)
- [ ] Performance metrics show expected improvement

## Notes

**Design Decision**: This fix maintains the current shard semantics where Shard 7 handles Payload CMS core functionality and Shard 8 handles seeding/performance tests. This separation is intentional and useful - it allows developers to run just core tests or just seeding tests independently if needed.

**Future Optimization**: Once this fix is validated, consider further improvements:
1. Move slower Payload tests to separate chains for even better parallelization
2. Implement parallel test execution within shards (Playwright supports this)
3. Add more granular caching to avoid auth regeneration entirely

**Related Documentation**:
- E2E Testing Guide: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`
- Performance Testing: `.ai/ai_docs/context-docs/testing+quality/performance-testing.md`
- Original Diagnosis: #913

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #913*
