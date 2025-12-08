# Bug Fix: E2E Tests Fail Due to Server Crash and Auth API Timeout

**Related Diagnosis**: #989 (REQUIRED)
**Severity**: medium
**Bug Type**: flakiness/integration
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Two distinct issues: (1) React Query hydration race condition causing auth timeout, (2) Aggressive timeout detection mechanism destabilizing dev server
- **Fix Approach**: Increase retry intervals and timeout budget for CI environments, reduce aggressiveness of timeout killer, add server health monitoring
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Three E2E tests fail intermittently:
1. **Auth timeout**: `auth-simple.spec.ts:61` - `page.waitForResponse` exceeds 8000ms waiting for `auth/v1/token`
2. **Server crash**: `account-simple.spec.ts:33` and `account.spec.ts:64` - Next.js dev server (port 3001) returns `net::ERR_EMPTY_RESPONSE` and `net::ERR_CONNECTION_RESET`

The auth timeout indicates React Query hydration delays combined with insufficient per-attempt timeout. The server crash suggests resource exhaustion or aggressive process killing by the timeout detection mechanism.

### Solution Approaches Considered

#### Option 1: Increase timeout budget and refine retry intervals ⭐ RECOMMENDED

**Description**:
- Increase the CI `short` timeout from 12s to 14-15s to provide more per-attempt budget
- Expand CI auth retry intervals to include longer delays (35s+)
- Total per-attempt timeout remains reasonable but with better spread
- This gives the server more time to respond without cascading resource pressure

**Pros**:
- Minimal code changes (just timeout config values)
- Directly addresses the 8000ms timeout in waitForResponse
- Respects environment-aware configuration pattern already in use
- No risk of cascading failures from aggressive killing
- Can be quickly adjusted if needed

**Cons**:
- May mask underlying performance issues
- Slightly longer test execution time in CI
- Doesn't address potential server stability issues

**Risk Assessment**: low - Conservative timeout increase with proven retry pattern

**Complexity**: simple - Single config file change

#### Option 2: Reduce timeout killer aggressiveness + increase timeouts

**Description**:
- Reduce the frequency/intensity of the timeout killer process
- Decrease killing frequency from "every 8s" to "every 15s" in timeout detection
- Add server health check between test shards with optional server restart
- Combine with modest timeout increases

**Pros**:
- Addresses root cause of server destabilization
- Prevents cascading failures from aggressive killing
- More robust solution long-term
- Server health monitoring helps catch future issues

**Cons**:
- More complex implementation (multiple files)
- Risk of masking timeout issues if killer is too passive
- Requires coordination between timeout detection and health check systems
- More moving parts to debug if issues arise

**Risk Assessment**: medium - Adds new monitoring logic that could introduce bugs

**Complexity**: moderate - Multiple system changes

#### Option 3: Implement form readiness signal (next iteration)

**Description**:
- Add server-side endpoint that confirms React Query client is ready
- Check this endpoint before form submission
- Guarantee hydration is complete before attempting login

**Pros**:
- Eliminates root cause entirely
- No more retry loops needed
- Most robust long-term solution
- Provides visibility into hydration delays

**Cons**:
- Requires backend changes (new API endpoint)
- More complex implementation
- Needs careful timing to avoid race conditions
- Not needed for immediate fix

**Why Not Chosen**: This is a better long-term solution but requires more coordination. Starting with Option 1 addresses immediate issue while keeping Option 3 as future improvement.

### Selected Solution: Option 1 + reduced timeout killer aggressiveness

**Justification**:
The combined approach balances:
- **Simplicity**: Primarily config-driven changes to timeout values
- **Effectiveness**: Addresses both the auth timeout and server crash issues
- **Risk**: Low risk with proven patterns already in codebase
- **Speed**: Can implement and validate quickly

The increased timeout budget gives auth API more time to respond, while reducing timeout killer aggressiveness prevents cascading server destabilization.

**Technical Approach**:
1. Increase CI `short` timeout from 12000ms → 15000ms (25% increase)
2. Expand CI auth retry intervals to include longer delays (up to 35000ms)
3. Reduce timeout killer sensitivity in test config or timeout detection mechanism
4. Validate all timeouts work coherently with overall test timeout (30s per test)

**Architecture Changes** (if any):
No architectural changes. Works within existing timeout configuration framework.

**Migration Strategy** (if needed):
None needed. Configuration-only changes are backward compatible.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/utils/test-config.ts` - Increase CI `short` timeout from 12000 to 15000, expand auth retry intervals
- `apps/e2e/tests/authentication/auth.po.ts` - Verify timeout logic works with new values (no changes needed if values are reasonable)
- `.ai/ai_scripts/testing/infrastructure/safe-test-runner.sh` - Review and potentially reduce timeout killer aggressiveness

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update CI timeout configuration

Increase the `short` timeout for CI environments and expand the auth retry intervals to provide better timing distribution.

- Update `test-config.ts` line 66: Change CI `short` timeout from 12000ms → 15000ms
- Update `test-config.ts` lines 93-97: Expand CI auth retry intervals to include longer delays
- Justification: The current 12s timeout is insufficient for edge cases where React Query hydration is delayed. 15s provides ~50% more time while staying reasonable. Expanded intervals distribute retries better across the increased timeout budget.

**Why this step first**: This is the core fix and must be in place before testing.

#### Step 2: Review timeout killer mechanism

Examine the timeout killer in the test infrastructure and reduce its aggressiveness.

- Read `.ai/ai_scripts/testing/infrastructure/safe-test-runner.sh` to understand current timeout killing logic
- Identify where processes are killed and how frequently
- Reduce killing frequency (if "every 8s", change to "every 15s") or add health checks before killing
- Document the changes with comments explaining the rationale

**Justification**: The "aggressively killing test" messages in logs suggest the timeout killer is too aggressive, destabilizing the dev server. Reducing frequency prevents cascading failures.

#### Step 3: Add regression tests for timeout handling

Add/update tests to validate timeout behavior under various conditions.

- Create or update `apps/e2e/tests/authentication/auth-timeout.spec.ts` to test auth with various network delays
- Add tests for:
  - Normal network response (should pass in <8s)
  - Slow network response (should eventually pass with retries)
  - Server instability (should handle ERR_EMPTY_RESPONSE gracefully)
- These tests validate that the increased timeout doesn't mask real issues

**Justification**: Regression tests ensure the fix works and future changes don't reintroduce the bug.

#### Step 4: Run local validation

Verify the fix works before committing.

```bash
# Build and start local Supabase
pnpm supabase:web:start

# Run authentication tests locally
pnpm --filter web-e2e test:shard --shard=1/12 auth-simple

# Run personal account tests
pnpm --filter web-e2e test:shard --shard=1/12 account-simple
pnpm --filter web-e2e test:shard --shard=1/12 account

# If all pass, run full shard 1
pnpm --filter web-e2e test:shard --shard=1/12
```

**Justification**: Local validation catches issues before pushing to CI.

#### Step 5: Run comprehensive E2E test suite

Execute the full test suite with the new timeout configuration.

```bash
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh
```

Verify:
- Auth tests pass consistently
- Account tests don't show ERR_EMPTY_RESPONSE
- Server remains stable throughout run
- Total execution time is acceptable
- No timeout killer warnings in logs

**Justification**: Full suite validation ensures no regressions and new timeouts work at scale.

#### Step 6: Code quality and validation

Ensure code meets project standards before committing.

```bash
pnpm typecheck    # Must pass without errors
pnpm lint:fix     # Auto-fix linting issues
pnpm format:fix   # Format code
```

**Justification**: Maintains code quality standards.

## Testing Strategy

### Unit Tests

No unit tests needed (configuration-only changes).

### Integration Tests

Existing E2E tests serve as integration validation.

### E2E Tests

**Primary validation tests**:
- ✅ `auth-simple.spec.ts:61` - "user can sign in with valid credentials" (original failing test)
- ✅ `account-simple.spec.ts:33` - "user profile form is visible" (server crash test)
- ✅ `account.spec.ts:64` - "user can update their password" (server crash test)
- ✅ Full authentication shard (tests 1-3)
- ✅ Full personal accounts shard (tests 1-4)

**Regression tests**:
- ✅ All admin & invitations tests (shard with lower resource needs)
- ✅ All payload CMS tests (run after auth, validates server recovered)
- ✅ All smoking/acceptance tests (full flow validation)

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Validates auth fixes
- `apps/e2e/tests/account/account-simple.spec.ts` - Validates account access
- `apps/e2e/tests/account/account.spec.ts` - Validates account functionality

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original auth timeout locally (should fail before fix)
- [ ] Apply config changes and verify auth test passes
- [ ] Test with slow network (use Chrome DevTools throttling to 4G)
- [ ] Verify account tests don't see ERR_EMPTY_RESPONSE
- [ ] Check server logs for aggressive timeout killer messages
- [ ] Run full E2E suite multiple times for consistency
- [ ] Verify test execution time doesn't increase by >10%
- [ ] Check that timeout killer is still catching legitimate hangs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Timeouts still insufficient**: Increased timeout may not be enough for all edge cases
   - **Likelihood**: low (15s provides significant headroom)
   - **Impact**: medium (tests continue to fail)
   - **Mitigation**: Monitor CI results, be ready to increase further if needed

2. **Masking real performance issues**: Longer timeouts hide slow auth responses
   - **Likelihood**: medium (potential issue)
   - **Impact**: low (doesn't affect test passing)
   - **Mitigation**: Add performance regression tests to track auth response times

3. **Timeout killer stops catching real hangs**: Reducing aggressiveness may miss broken tests
   - **Likelihood**: low (still catches major issues)
   - **Impact**: medium (allows broken tests to pass)
   - **Mitigation**: Keep killer active, just less aggressive; monitor CI for suspicious test passes

**Rollback Plan**:

If this fix causes issues in CI:
1. Revert `test-config.ts` to original timeout values (12000ms CI short, original intervals)
2. Revert any changes to `.ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
3. Re-run CI to verify rollback works
4. Create new diagnosis issue with updated findings

**Monitoring** (if needed):
- Monitor CI pass rate for auth and account tests over next 5-10 runs
- Track test execution time to ensure timeouts aren't adding 30+ seconds
- Watch for "aggressively killing test" messages in logs
- Check server stability metrics (no ERR_EMPTY_RESPONSE errors)

## Performance Impact

**Expected Impact**: minimal

The increase in timeout budget (3000ms per attempt) will add at most 3 seconds to a test's worst-case execution time IF that test times out on all retries. In normal conditions (where tests pass quickly), there's zero performance impact.

**Performance Testing**:
- Compare execution time of shard 1 (auth+accounts) before/after fix
- Expected: <2% increase in execution time if tests pass quickly
- Acceptable: <5% increase as timeout is rarely hit

## Security Considerations

**Security Impact**: none

These are configuration changes to test timeouts. No security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Current state: Auth timeout occurs
# This command would fail with "Timeout 8000ms exceeded"
pnpm --filter web-e2e test:shard --shard=1/12 auth-simple
```

**Expected Result**: Test times out waiting for auth API response after ~30 seconds total.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Run auth tests (should pass)
pnpm --filter web-e2e test:shard --shard=1/12 auth-simple

# Run account tests (should pass)
pnpm --filter web-e2e test:shard --shard=1/12 account-simple
pnpm --filter web-e2e test:shard --shard=1/12 account

# Run full shard 1 (should pass)
pnpm --filter web-e2e test:shard --shard=1/12

# Run full suite (should complete without ERR_EMPTY_RESPONSE)
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh
```

**Expected Result**: All commands succeed, auth timeout is resolved, server remains stable, zero ERR_EMPTY_RESPONSE errors.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Check that only expected tests changed in execution time
# (auth tests should be ~3s slower max, others unchanged)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses existing test configuration framework already in place.

## Database Changes

**No database changes required**

This is purely a test infrastructure fix affecting timeout configuration, not application code or database.

## Deployment Considerations

**Deployment Risk**: none (local development only)

These changes only affect E2E test execution in CI/local environments. Zero impact on production.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained (config changes are backward compatible)

## Success Criteria

The fix is complete when:
- [ ] Auth test `auth-simple.spec.ts:61` passes consistently
- [ ] Account tests `account-simple.spec.ts:33` and `account.spec.ts:64` pass without ERR_EMPTY_RESPONSE
- [ ] Full E2E suite completes without server crashes
- [ ] No "aggressively killing test" messages in logs (or significantly reduced)
- [ ] Test execution time doesn't increase by >5%
- [ ] All validation commands pass
- [ ] Code quality checks pass (typecheck, lint, format)
- [ ] Manual testing checklist complete

## Notes

**Implementation Priority**: Start with Step 1 (timeout config), validate locally, then proceed to Step 2 (timeout killer).

**Monitoring After Fix**: Watch CI results over next 5-10 runs to ensure the fix is stable. If auth tests continue to flake, be ready to increase timeouts further or implement Option 3 (server-side readiness signal).

**Related Historical Issues**:
- #987 (CLOSED): "E2E Test Failures - Auth Timeout and Missing Error Element" - Previous timeout fix (increased to 8s)
- #988 (CLOSED): "Bug Fix: E2E Test Failures - Auth Timeout" - Implementation of #987 fix
- #911 (CLOSED): "E2E Test Runner Timeout Detection" - Earlier timeout killer issues
- #737 (CLOSED): "E2E Shard 4 Tests Timeout During Fresh Authentication" - Similar auth timeout pattern

This fix learns from these previous attempts by taking a more conservative approach: increasing timeout budget without relying on more aggressive retry mechanisms.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #989*
