# Bug Fix: Unit Tests Unnecessarily Validate Docker Containers

**Related Diagnosis**: #889 (REQUIRED)
**Severity**: medium
**Bug Type**: performance
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `unitOnly` flag is not propagated to `cleanupPorts()` and `cleanup()` methods, causing unconditional Docker container validation even for unit-only test runs
- **Fix Approach**: Pass and check `unitOnly` flag in cleanup methods to skip Docker validation when unit tests only
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Unit tests run much slower than necessary because the test infrastructure checks Docker container health during cleanup, despite the `unitOnly` flag indicating that Docker resources aren't required. The timeout from HTTP health checks adds 10+ seconds to every unit test run when Docker containers aren't available.

For full details, see diagnosis issue #889.

### Solution Approaches Considered

#### Option 1: Pass `unitOnly` Flag Through Cleanup Methods ⭐ RECOMMENDED

**Description**: Propagate the existing `unitOnly` flag through the cleanup call chain. Both `cleanupPorts()` and `cleanup()` methods accept `unitOnly` as a parameter and skip Docker container validation when `unitOnly=true`.

**Pros**:
- Minimal code change (add 2-3 parameter passes)
- Follows existing pattern already used in `runHealthChecks()` and `runConditionalSetup()`
- Respects the established flag for unit-only operations
- No new dependencies or complexity

**Cons**:
- Requires changes in two files

**Risk Assessment**: low - Parameter passing is straightforward, no logic changes

**Complexity**: simple - Add parameter to method signatures and add single if-check

#### Option 2: Store `unitOnly` as Instance Variable in TestController

**Description**: Store the `unitOnly` flag as an instance variable in TestController so cleanup methods can access it without parameter passing.

**Pros**:
- Doesn't require changing method signatures
- Can be used by any method that needs to know about unit-only mode

**Cons**:
- Less explicit than parameter passing
- Requires tracking state across method calls
- More verbose initialization

**Why Not Chosen**: While functional, explicit parameter passing is clearer and follows the existing pattern in `runHealthChecks()` and `runConditionalSetup()`.

#### Option 3: Quick Docker Check Instead of HTTP Validation

**Description**: Replace HTTP health check with a quick `docker ps | grep` check that doesn't time out

**Pros**:
- Still provides Docker detection
- No timeout issues

**Cons**:
- Requires Docker CLI to be available
- Still unnecessary for unit-only tests
- Doesn't address the root issue of checking Docker for unit tests

**Why Not Chosen**: The real issue is that Docker validation shouldn't run at all for unit tests, not just that it should be faster.

### Selected Solution: Pass `unitOnly` Flag Through Cleanup Methods

**Justification**: This approach directly addresses the root cause by skipping Docker validation for unit tests, following the established pattern already used in `runHealthChecks()`. It's minimal, clear, and low-risk.

**Technical Approach**:
1. Add `unitOnly` parameter to `InfrastructureManager.cleanupPorts()` method
2. Add check: `if (unitOnly) return` at start of Docker validation section
3. Add `unitOnly` parameter to `TestController.cleanup()` method
4. Pass `this.options.unitOnly` when calling `cleanupPorts()`
5. Add check in `cleanup()` before Docker validation

**Architecture Changes**:
- No architectural changes needed
- Only method signatures and parameter passing are modified
- Existing Docker validation logic remains unchanged for non-unit tests

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - Add `unitOnly` parameter to `cleanupPorts()` method
- `.ai/ai_scripts/testing/infrastructure/test-controller.cjs` - Pass `unitOnly` flag and add checks in `cleanup()` method

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add `unitOnly` Parameter to `InfrastructureManager.cleanupPorts()`

<describe what this step accomplishes>

The `cleanupPorts()` method needs to accept and check the `unitOnly` flag before attempting Docker container validation.

- Modify method signature: `async cleanupPorts(unitOnly = false)`
- Add early return after Docker check: `if (unitOnly) return`
- This prevents any Docker validation when unit tests are running

**Why this step first**: This is the core fix location where Docker validation happens.

#### Step 2: Update `TestController.cleanup()` to Pass and Check `unitOnly` Flag

The cleanup method in TestController needs to both check `unitOnly` directly and pass it to `cleanupPorts()`.

- Modify method signature if needed to accept `unitOnly` parameter
- Add check before Docker validation: `if (!this.options.unitOnly)`
- Pass `this.options.unitOnly` when calling `this.infrastructureManager.cleanupPorts()`

**Why this step second**: Ensures the flag is checked at both cleanup entry points (controller and manager).

#### Step 3: Add Unit Tests for `unitOnly` Flag Propagation

Verify the fix works correctly by testing the flag behavior.

- Add test: When `unitOnly=true`, Docker validation should be skipped
- Add test: When `unitOnly=false`, Docker validation should proceed normally
- Verify cleanup completes quickly (< 1 second) when `unitOnly=true`

#### Step 4: Run Integration Tests

Verify the fix doesn't break existing cleanup functionality for E2E and full test runs.

- Run `/test --unit` and verify fast completion (no 10+ second timeout)
- Run `/test --e2e` and verify Docker validation still works
- Run full test suite and verify all tests pass

#### Step 5: Validation and Documentation

Ensure the fix is complete and documented.

- Verify the fix resolves the original issue
- Update any relevant comments in the code
- Test edge cases

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ When `unitOnly=true`, Docker container check is skipped
- ✅ When `unitOnly=false`, Docker container check proceeds
- ✅ Cleanup completes within expected time for unit tests (< 1 second)
- ✅ Cleanup time for E2E tests unaffected (Docker check still runs)
- ✅ Port cleanup still works correctly regardless of Docker status

**Test files**:
- `.ai/ai_scripts/testing/infrastructure/test-controller.test.cjs` - Test the flag propagation

### Integration Tests

Test the full cleanup flow with both unit and E2E mode.

**Test files**:
- Run existing `/test --unit` to verify performance improvement
- Run existing `/test --e2e` to verify Docker checks still work

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/test --unit` and verify it completes in < 5 seconds (previously 10+ seconds with timeout)
- [ ] Run `/test --e2e` with Docker running and verify it completes normally
- [ ] Run `/test --e2e` with Docker not running and verify appropriate error message
- [ ] Run full test suite `/test` and verify all tests pass
- [ ] Verify no Docker timeout errors appear when running unit tests
- [ ] Check that cleanup messages show correct Docker status in logs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Flag Not Propagated Correctly**: `unitOnly` flag not passed through call chain
   - **Likelihood**: low
   - **Impact**: medium (unit tests still slow but code is correct)
   - **Mitigation**: Double-check all parameter passing locations; add logging to verify flag state

2. **Docker Validation Still Runs**: Conditional check didn't work as expected
   - **Likelihood**: low
   - **Impact**: high (defeats purpose of fix)
   - **Mitigation**: Add explicit logging when Docker check is skipped; test thoroughly

3. **E2E Tests Broken**: Docker validation accidentally disabled for E2E tests too
   - **Likelihood**: low
   - **Impact**: medium (E2E tests may fail if Docker not available)
   - **Mitigation**: Clear parameter passing; explicit tests for both modes

**Rollback Plan**:

If this fix causes issues in production:
1. Revert changes to `infrastructure-manager.cjs` - restore original `cleanupPorts()` signature
2. Revert changes to `test-controller.cjs` - restore original `cleanup()` method
3. Run `/test --unit` to verify rollback works
4. If Docker timeouts return, clear Docker containers: `docker-compose -f docker-compose.test.yml down`

## Performance Impact

**Expected Impact**: minimal (positive)

Unit tests should complete 10+ seconds faster by skipping unnecessary Docker validation. The `unitOnly` flag already exists and is properly used in `runHealthChecks()` and `runConditionalSetup()`, so this is just extending that pattern to cleanup operations.

**Performance Testing**:
- Time `/test --unit` before and after fix
- Verify no regression in `/test --e2e` performance
- Check that cleanup operation itself doesn't take longer

## Security Considerations

**Security Impact**: none

This is a performance fix that only affects when Docker validation runs. No authentication, authorization, or security policies are changed. The Docker validation itself remains the same when it does run.

## Validation Commands

### Before Fix (Slow Unit Tests)

```bash
# Unit tests with Docker validation timeout
time /test --unit
# Expected: 10+ seconds due to Docker check timeout
```

**Expected Result**: Slow completion with Docker validation timeout errors visible

### After Fix (Fast Unit Tests)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests only (should be fast now)
time /test --unit
# Expected: < 5 seconds, no Docker validation

# E2E tests (Docker validation still works)
time /test --e2e
# Expected: Normal speed, Docker validation runs

# Full test suite
pnpm test

# Verify no Docker timeouts in unit tests
grep -r "timeout" .ai/ai_scripts/testing/infrastructure/test-controller.cjs || echo "No timeout issues found"
```

**Expected Result**: All commands succeed, unit tests complete quickly, Docker validation only runs for E2E tests, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specifically verify unit test speed
time /test --unit

# Verify E2E tests still work with Docker
time /test --e2e

# Check that cleanup completes without Docker
docker-compose -f docker-compose.test.yml down
time /test --unit
docker-compose -f docker-compose.test.yml up -d
```

## Dependencies

**No new dependencies required**

This fix only uses existing parameters and conditional logic. The `unitOnly` flag is already part of the infrastructure.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is a performance fix to test infrastructure, not production code

**Feature flags needed**: no

**Backwards compatibility**: maintained - Parameter defaults to `false` for existing callers

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] `/test --unit` completes in < 5 seconds (was 10+ seconds)
- [ ] No Docker timeout errors appear in unit test logs
- [ ] `/test --e2e` still validates Docker containers correctly
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

The `unitOnly` flag is already established in the codebase and properly used in:
- `runHealthChecks(unitOnly = false)` at line 61
- `runConditionalSetup(healthResults, unitOnly = false)` at line 101

This fix extends that same pattern to the cleanup methods that currently ignore it.

The root cause is simple: the cleanup methods call `checkDockerContainer()` unconditionally, which performs HTTP health checks that timeout when Docker isn't available. By checking `unitOnly` before these calls, we avoid the timeout entirely for unit tests.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #889*
