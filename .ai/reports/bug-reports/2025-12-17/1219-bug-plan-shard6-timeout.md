# Bug Fix: E2E Shard 6 Timeout - Mixed Test Types Architecture Mismatch

**Related Diagnosis**: #1207
**Severity**: high
**Bug Type**: performance
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Shard 6 combines fast healthcheck tests (~30ms) with slow Payload CMS authentication tests (~90s each). Retries on failing tests push total time beyond 20-minute shard timeout.
- **Fix Approach**: Split Shard 6 into two separate shards with independent timeouts and project configurations
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Shard 6 currently combines two incompatible test types in a single process:
1. **Healthcheck tests** (~30ms each, fast, uses chromium project)
2. **Payload auth tests** (~90s each, slow, uses payload project)

When Payload tests fail/timeout, retries compound the problem:
- 9 payload-auth tests × 90s per test × 2 (original + 1 retry) = ~27 minutes total
- Shard timeout is 20 minutes
- Result: Tests get terminated with SIGTERM before completing, zero tests reported as passed

The fundamental issue is an **architecture mismatch**: mixing fast and slow tests in one shard with different Playwright project configurations (chromium vs payload) creates unpredictable scheduling and resource contention.

### Solution Approaches Considered

#### Option 1: Split Shard 6 into Two Independent Shards ⭐ RECOMMENDED

**Description**: Separate fast healthcheck tests and slow Payload tests into completely independent shards (`test:shard6a` and `test:shard6b`) with their own timeouts and configurations.

**Pros**:
- Cleanly separates incompatible test types (fast healthcheck vs slow Payload CMS)
- Each shard runs with appropriate configuration (chromium for healthchecks, payload project for Payload tests)
- Independent timeouts allow each shard optimal values (healthchecks: 5m, Payload: 30m)
- Enables parallel execution - both shards can run simultaneously
- Follows established pattern from shards 7-8 which already isolate Payload tests
- Minimal code changes - just repartition existing tests
- Allows proper result capture and error reporting
- Scale pattern: future Payload tests naturally go to new shards (7-8 already isolated)
- No changes to test code itself - only orchestration

**Cons**:
- Increases from 12 to 13 shards (minor coordination overhead)
- CI/CD config needs update if shards are explicitly enumerated

**Risk Assessment**: low - This is a straightforward refactoring of test distribution. No changes to test logic or configuration files. Tests remain unchanged.

#### Option 2: Increase Shard Timeout to 30 Minutes

**Description**: Change shard timeout from 20 to 30 minutes to allow slow Payload tests to complete.

**Why Not Chosen**: This masks the real problem (incompatible test types) without fixing it. If Payload tests get even slower or additional tests are added, timeout will need to increase again. Doesn't scale well and hides architectural issue.

#### Option 3: Fix Failing Payload Tests First

**Description**: Address underlying timeout/failure issues in Payload auth tests to reduce their execution time.

**Why Not Chosen**: This is a separate issue (tracked in #1135, #1139). Even with faster Payload tests, mixing incompatible test types in one shard is poor architecture.

#### Option 4: Disable Retries for Payload Tests

**Description**: Remove retries (`--retries=0`) for Payload tests to reduce total shard time.

**Why Not Chosen**: Loses ability to handle flaky tests. Combined with test failures, this causes complete shard failure. Retries are essential for reliability.

### Selected Solution: Split Shard 6 into Two Independent Shards

**Justification**: This approach is the cleanest, lowest-risk solution that:
1. Eliminates the architectural mismatch immediately
2. Allows each shard optimal timeout values
3. Enables parallel execution (both shards can run simultaneously in CI)
4. Follows the established pattern already used in shards 7-8
5. Requires minimal code changes (test repartitioning only)
6. Provides proper error reporting and result capture
7. Creates headroom for future Payload tests

**Technical Approach**:
- Create `test:shard6a` for healthcheck tests only (5-minute timeout, uses chromium project)
- Create `test:shard6b` for Payload auth tests (30-minute timeout, uses payload project)
- Each shard runs independently with its own Playwright configuration
- Both can execute in parallel in CI without interference

**Architecture Changes**:
- Current: `tests/healthcheck.spec.ts` + `tests/payload/payload-auth.spec.ts` → Single shard (20min timeout)
- New:
  - Shard 6a: `tests/healthcheck.spec.ts` (5min timeout, chromium)
  - Shard 6b: `tests/payload/payload-auth.spec.ts` (30min timeout, payload project)

**Migration Strategy**:
- No database migrations needed
- No code changes to test files themselves
- Purely an orchestration change in package.json scripts
- Backward compatible - existing `test:shard6` can be left as-is for local development

## Implementation Plan

### Affected Files

- `apps/e2e/package.json` - Update shard scripts to split shard 6 into 6a and 6b
- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Update test configuration (if needed)
- CI/CD workflows - May need updates if shards are enumerated (e.g., `.github/workflows/e2e.yml`)

### New Files

- No new files needed - only orchestration changes

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Shard Scripts in package.json

Split the current `test:shard6` into two independent scripts:

- Remove: `"test:shard6": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/healthcheck.spec.ts tests/payload/payload-auth.spec.ts"`

- Add two new scripts:
  ```json
  "test:shard6a": "playwright test tests/healthcheck.spec.ts",
  "test:shard6b": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-auth.spec.ts --project=payload"
  ```

**Why this step first**: Orchestration changes form the foundation - tests won't be properly separated without this.

#### Step 2: Verify Shard Scripts Function Independently

Test each new shard script locally to ensure:
- Healthcheck shard runs quickly and passes
- Payload shard runs with proper configuration and authentication
- No cross-shard interference

Run commands:
```bash
cd apps/e2e
pnpm test:shard6a
pnpm test:shard6b
```

Expected results:
- Shard 6a completes in <1 minute with health checks passing
- Shard 6b completes with Payload auth tests running against payload project

#### Step 3: Update CI/CD Configuration (if applicable)

Check if CI/CD workflows explicitly enumerate shards:

```bash
grep -r "test:shard6" .github/workflows/ || echo "No explicit shard references found"
```

If found, update references to include both `test:shard6a` and `test:shard6b`.

**Why this step now**: Ensures CI/CD properly executes both new shards instead of old combined shard.

#### Step 4: Add Comprehensive Tests

Add/update tests to verify:
- Healthcheck shard runs independently without Payload setup
- Payload shard runs with proper authentication state
- Both shards can run in parallel without resource contention
- Results are properly captured for both shards

Test files affected:
- `apps/e2e/tests/healthcheck.spec.ts` - Should run standalone
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Should run with payload project only

#### Step 5: Validation and Regression Testing

Execute validation commands to confirm fix:
- Run both shards independently
- Run both shards in parallel (simulate CI execution)
- Verify test results are captured correctly
- Confirm no SIGTERM early terminations

## Testing Strategy

### Unit Tests

No unit tests needed - this is an orchestration change, not code logic change.

### Integration Tests

The split shards themselves are the integration tests:

**Test files**:
- `apps/e2e/tests/healthcheck.spec.ts` - Validates shard 6a works
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Validates shard 6b works

### E2E Tests

Test execution workflow:

**Test files**:
- Both shards run as part of standard E2E test suite
- CI/CD pipeline executes both shards in parallel

### Manual Testing Checklist

Execute these steps before considering the fix complete:

- [ ] Run `pnpm test:shard6a` locally - completes quickly without timeout
- [ ] Run `pnpm test:shard6b` locally - completes with all Payload tests passing
- [ ] Run both shards simultaneously in separate terminals - no interference
- [ ] Verify healthcheck test output shows all tests passed
- [ ] Verify payload test output shows all auth tests passed
- [ ] Run full test suite including new shards - zero regressions
- [ ] Check that test results are properly captured (not SIGTERM terminated)
- [ ] Verify both shards can be parallelized in CI without resource conflicts

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **CI/CD Configuration Mismatch**: If CI/CD explicitly references `test:shard6`, it may not discover the new shards.
   - **Likelihood**: medium
   - **Impact**: low (CI/CD just won't run shard 6 at all - easy to catch)
   - **Mitigation**: Search CI config for shard references and update before merging

2. **Resource Contention in CI**: If both shards run simultaneously and exhaust resources.
   - **Likelihood**: low
   - **Impact**: medium (tests may timeout again)
   - **Mitigation**: CI runs only 3 workers per runner - one shard per runner should be sufficient. Each shard is smaller than original combined shard.

3. **Test Data Isolation**: Healthcheck and Payload tests might conflict if they share test data.
   - **Likelihood**: low (tests already isolated in different spec files)
   - **Impact**: low (isolated databases per test run)
   - **Mitigation**: Global setup handles authentication isolation

**Rollback Plan**:

If issues arise:

1. Revert package.json changes to restore original `test:shard6`
2. Revert any CI/CD workflow changes
3. Run full test suite to confirm rollback successful
4. Investigate specific failure before re-attempting

## Performance Impact

**Expected Impact**: Performance improvement

- **Shard 6a (healthcheck)**: Completes in ~1 minute (vs waiting for 20min timeout before)
- **Shard 6b (Payload)**: Gets full 30-minute timeout (vs competing with fast tests)
- **Combined**: Both shards can run in parallel in CI, reducing total test suite time

## Security Considerations

**Security Impact**: none

- This is a test orchestration change only
- No changes to authentication, authorization, or production code
- Test isolation improves (separate configurations per test type)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run current shard 6 and observe timeout
cd apps/e2e
timeout 25m pnpm test:shard6 2>&1 | tail -50
# Expected: Tests killed with SIGTERM after ~19 minutes
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run new shard 6a (healthcheck only)
cd apps/e2e
pnpm test:shard6a
# Expected: Completes in <2 minutes, all tests pass

# Run new shard 6b (Payload auth only)
cd apps/e2e
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 pnpm test:shard6b
# Expected: Completes in <30 minutes, all tests pass

# Verify package.json syntax
pnpm --version
npm pkg get scripts | grep test:shard6
# Expected: Should see test:shard6a and test:shard6b scripts
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
cd apps/e2e
pnpm test:shard

# Additional regression check: verify both shards in parallel
cd apps/e2e
timeout 35m pnpm test:shard6a & timeout 35m pnpm test:shard6b & wait
# Expected: Both complete successfully without interference
```

## Dependencies

### New Dependencies

No new dependencies required - this is a pure refactoring of existing test orchestration.

### Existing Dependencies

Uses existing:
- Playwright (already configured for both chromium and payload projects)
- Test infrastructure (already set up for parallel execution)

## Database Changes

**No database changes required** - This is a test orchestration change only.

## Deployment Considerations

**Deployment Risk**: none

- This change affects tests only, not production code
- Safe to deploy alongside other changes
- No feature flags needed
- Backward compatible (existing tests continue to work)

**Special deployment steps**: None required

## Success Criteria

The fix is complete when:
- [ ] Shard 6a (`test:shard6a`) runs healthcheck tests independently
- [ ] Shard 6b (`test:shard6b`) runs Payload auth tests independently
- [ ] Both shards complete without timeout/SIGTERM termination
- [ ] All healthcheck tests pass in shard 6a
- [ ] All Payload auth tests pass in shard 6b
- [ ] No regressions in other test shards
- [ ] CI/CD properly executes both new shards
- [ ] Test results are properly captured and reported
- [ ] Both shards can execute in parallel without interference

## Notes

**Architecture Rationale**: This fix follows the established pattern already in the codebase:
- Shards 7-8 already isolate Payload tests separately (collections, database, seeding)
- Payload tests require different Playwright project configuration (`--project=payload`)
- Mixing project configurations in one shard causes scheduling conflicts
- Separate shards allow each test type optimal resource allocation and timeout values

**Future Considerations**:
- If more Payload CMS tests are added, they should go to new shards (7-8 pattern) not back to shard 6
- Current shards 7-8 handle Payload collections/database tests
- New shards could be added for Payload UI tests if needed (following same pattern)

**Related Issues**:
- #1135: Payload CMS E2E tests timeout without executing (similar pattern)
- #1139: E2E Account Tests Timeout - Conflicting Timeout Architecture (similar architecture issue)
- #992: E2E Test Infrastructure Systemic Architecture Problems (broader testing infrastructure)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1207*
