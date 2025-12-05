# Bug Fix: User Billing E2E Test Fails - Stripe Webhook Container Not Started

**Related Diagnosis**: #895 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Test controller doesn't detect when billing shards (9, 10) are running and doesn't start docker-compose with `--profile billing` flag to activate the stripe-webhook container
- **Fix Approach**: Modify test controller to detect billing shards and conditionally start docker-compose with billing profile before tests execute
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E billing test (shard 9) fails because the `stripe-webhook` Docker container is not started when running billing tests. The test successfully completes the Stripe checkout flow but fails when verifying the subscription status because webhook events from Stripe are never forwarded to the local test environment.

The `stripe-webhook` service in `docker-compose.test.yml` is configured with `profiles: - billing`, meaning it only starts when `--profile billing` is passed to docker-compose. The test controller currently does not:
1. Detect when billing shards (9, 10) are being run
2. Start docker-compose with `--profile billing` before tests
3. Wait for the `stripe-webhook` container to be healthy before tests begin

For full details, see diagnosis issue #895.

### Solution Approaches Considered

#### Option 1: Pre-start Docker Compose with Billing Profile ⭐ RECOMMENDED

**Description**: Before running any billing shards, detect if billing shards are in the test filter and pre-start docker-compose with `--profile billing` flag. This ensures the stripe-webhook container is already healthy and forwarding events when tests execute.

**Pros**:
- Aligns with existing Docker container startup infrastructure
- Billing containers are started at the same time as web/payload containers
- Clean separation: container startup happens before test execution
- Leverages existing health check system
- No changes needed to test code itself

**Cons**:
- Requires detecting billing shards in advance (solvable with upfront filter check)
- Slightly more complex than just running docker-compose normally

**Risk Assessment**: low - Docker compose is already used for test containers

**Complexity**: moderate - Need to add logic to detect billing shards and conditional profile flag

#### Option 2: Start Stripe-Webhook on-Demand During Test

**Description**: During test execution, if a test fails due to missing webhook secret, catch the error and start the stripe-webhook container, then retry.

**Why Not Chosen**:
- Too late - test has already run and failed
- Adds complexity to error handling in tests
- Test would need to be retried which wastes time
- Fragile error detection

#### Option 3: Always Run With Billing Profile

**Description**: Modify docker-compose command to always include `--profile billing` regardless of which shards are running.

**Why Not Chosen**:
- Wastes resources on unnecessary stripe-webhook container for non-billing tests (shards 1-8, 11-12)
- Adds startup time for all test runs, not just billing tests
- Not needed for 10 out of 12 shards

### Selected Solution: Pre-start Docker Compose with Billing Profile

**Justification**: This approach is the cleanest and most efficient. It:
- Detects billing shards upfront before any tests execute
- Only enables billing profile when needed (shards 9, 10)
- Leverages existing Docker infrastructure and health checks
- Prevents resource waste on unnecessary containers
- Aligns with how docker-compose is already started for web/payload containers

**Technical Approach**:
1. In the test controller (`e2e-test-runner.cjs`), extract shard numbers before filtering
2. Check if any requested shard is 9 or 10 (billing shards)
3. If yes, add `--profile billing` flag to the docker-compose up command
4. Wait for stripe-webhook container to be healthy before proceeding with tests
5. Log which profile flags are being used for debugging

**Architecture Changes**:
- Modify `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` to detect billing shards
- Update docker-compose startup logic to conditionally include `--profile billing`
- No changes to docker-compose.test.yml needed (already has profile configured)
- No changes to test code needed

**Migration Strategy**: N/A - This is a fix for the test infrastructure, not application code

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Test controller that manages docker-compose startup
  - Need to add logic to detect billing shards (9, 10) in filter
  - Need to conditionally add `--profile billing` to docker-compose up command
  - Need to wait for stripe-webhook health before tests

### New Files

None - modifications only to existing test infrastructure

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Analyze Test Controller Billing Shard Detection

Understand how the test controller currently:
- Accepts shard filter arguments
- Determines which shards will execute
- Starts docker-compose containers
- Manages container health checks

This requires reading:
- Current docker-compose container startup logic
- How shardFilter is set and used
- Existing health check patterns

#### Step 2: Implement Billing Shard Detection Logic

Add a new method to E2ETestRunner class:

```typescript
isBillingTestsRequested() {
  // Check if billing shards (9, 10) are in the shard filter
  // Return true if any billing shard will execute
  // This needs to check:
  // 1. If no filter is set (runs all shards) → return true
  // 2. If filter exists, check if 9 or 10 are included → return true/false
}
```

This method is called BEFORE starting docker-compose to determine if billing profile should be enabled.

#### Step 3: Modify Docker Compose Startup Command

Update the docker-compose up command to conditionally include `--profile billing`:

```bash
# Before: docker-compose -f docker-compose.test.yml up -d
# After:  docker-compose -f docker-compose.test.yml up -d --profile billing

# Only add --profile billing if isBillingTestsRequested() returns true
```

Add to existing docker-compose startup (around line 200-250 where containers are started).

#### Step 4: Wait for Stripe-Webhook Container Health

Add health check logic for stripe-webhook container:

- Only if billing profile is enabled
- Check that `slideheroes-stripe-webhook` container is healthy
- Wait up to 60 seconds for it to become healthy
- Fail with clear error message if it never becomes healthy
- Log status for debugging

The stripe-webhook container has this health check already defined:
```yaml
healthcheck:
  test: ["CMD-SHELL", "test -f /stripe/webhook-secret && pgrep -f 'stripe listen' > /dev/null"]
  interval: 10s
  timeout: 5s
  retries: 6
  start_period: 60s
```

So the test controller just needs to wait for it to be healthy.

#### Step 5: Add Diagnostic Logging

Add logging to show:
- Which profile flags are being used (e.g., "🔧 Starting docker-compose with profiles: [billing]")
- When stripe-webhook container becomes healthy
- Container status before running billing tests

Example:
```
🔧 Billing tests requested (shards: 9, 10)
🔧 Starting docker-compose with profiles: billing
⏳ Waiting for stripe-webhook to become healthy...
✅ stripe-webhook container is healthy
🚀 Ready to start billing tests
```

#### Step 6: Add Unit Tests for Billing Detection

Create or update tests for the new billing shard detection logic:
- Test 1: No filter → should return true (billing tests will run)
- Test 2: Filter [1, 2, 3] → should return false (no billing tests)
- Test 3: Filter [9] → should return true (billing tests will run)
- Test 4: Filter [10, 11] → should return true (billing tests will run)
- Test 5: Filter [1, 9, 12] → should return true (contains billing shard)

#### Step 7: Verify E2E Billing Test

Run the billing test to verify it passes:

```bash
/test 9
```

Expected:
- Docker containers start with billing profile
- stripe-webhook becomes healthy
- Test completes successfully
- subscription status updates to "Active" within 45 seconds

#### Step 8: Verify Non-Billing Tests Still Work

Run non-billing shards to ensure we didn't break them:

```bash
/test 1    # Smoke tests (should NOT have billing profile)
/test 5    # Account tests (should NOT have billing profile)
```

Expected:
- Docker containers start without billing profile
- stripe-webhook container is NOT started (saves resources)
- Tests pass normally

#### Step 9: Run Full Test Suite

Run all shards to ensure complete test suite passes:

```bash
/test
```

Expected:
- All 12 shards pass
- Only shard 9 (and 10 if it exists) runs with billing profile
- Total execution time reasonable (billing adds minimal overhead)

#### Step 10: Validation and Documentation

- Add comment in code explaining why billing profile is conditionally enabled
- Update test infrastructure docs if needed
- Close diagnosis issue #895 with link to fix implementation

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `isBillingTestsRequested()` with no filter returns true
- ✅ `isBillingTestsRequested()` with [1,2,3] returns false
- ✅ `isBillingTestsRequested()` with [9] returns true
- ✅ `isBillingTestsRequested()` with [10] returns true
- ✅ Docker command builder includes `--profile billing` when needed
- ✅ Docker command builder excludes profile flag when not needed

**Test files**:
- Modify or create: `.ai/ai_scripts/testing/runners/test-controller.test.js`

### Integration Tests

- ✅ Run billing test shard (9) - should start with billing profile and pass
- ✅ Run non-billing test shard (1) - should start without billing profile and pass
- ✅ Run mixed shards (1, 9) - should detect billing is needed and use profile

**Test execution**:
- `pnpm run /test 9` - Should pass with stripe-webhook forwarding events
- `pnpm run /test 1` - Should pass without stripe-webhook overhead

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `docker-compose -f docker-compose.test.yml ps` - verify no stripe-webhook initially
- [ ] Run `/test 1` - verify stripe-webhook NOT started
- [ ] Verify with `docker ps | grep stripe` - should be empty/not found
- [ ] Run `/test 9` - verify stripe-webhook IS started
- [ ] Verify with `docker ps | grep stripe` - should show slideheroes-stripe-webhook running
- [ ] Verify stripe-webhook is healthy: `docker logs slideheroes-stripe-webhook`
- [ ] Wait for test to complete - should show "Active" badge after webhook processes event
- [ ] Check webhook secret was captured: `docker exec slideheroes-stripe-webhook test -f /stripe/webhook-secret && echo "exists" || echo "missing"`
- [ ] Run `/test` (all shards) - should pass entirely

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Billing Profile Not Activated on Demand**: If detection logic is wrong, billing profile won't start
   - **Likelihood**: low
   - **Impact**: high (billing tests fail)
   - **Mitigation**: Comprehensive unit tests for shard detection logic, clear logging output

2. **Stripe-Webhook Health Check Never Completes**: Container could fail to become healthy
   - **Likelihood**: low
   - **Impact**: medium (test suite hangs waiting for health)
   - **Mitigation**: Add 60-second timeout with clear error message, log container diagnostics

3. **Resources Exhausted on CI with Billing Profile**: Adding billing profile consumes more memory
   - **Likelihood**: low
   - **Impact**: low (CI has sufficient resources, stripe-webhook is lightweight)
   - **Mitigation**: Only enable profile for billing tests (not all tests), monitor CI resource usage

4. **Breaking Change to Docker Setup**: Modifying docker-compose behavior could affect developers
   - **Likelihood**: very low
   - **Impact**: medium
   - **Mitigation**: Changes are internal to test controller, docker-compose.test.yml unchanged, developers don't need to change workflow

**Rollback Plan**:

If this fix causes unexpected issues in production:
1. Comment out the `isBillingTestsRequested()` check
2. Always run docker-compose without billing profile (revert to current behavior)
3. Investigate why health check failed or detection logic was wrong
4. Deploy fixed version

**Monitoring** (if needed):
- Monitor CI billing test shard execution time (shouldn't increase >10%)
- Monitor stripe-webhook container health status in logs
- Alert if billing tests fail due to stripe-webhook not being healthy

## Performance Impact

**Expected Impact**: minimal

- Billing profile only activates for shards 9, 10 (not all tests)
- Stripe-webhook container is lightweight (<100MB memory)
- No impact on non-billing test shards
- Potential 2-5 second added startup time for billing tests (stripe-webhook initialization)

**Performance Testing**:
- Run `/test 9` and measure total execution time before and after fix
- Expected: time should be similar (stripe-webhook boots quickly)
- stripe-webhook health check typically completes within 10-20 seconds

## Security Considerations

**Security Impact**: none

- No changes to authentication or authorization
- Billing tests already require authenticated user context
- Webhook events still validated with signing secret
- No exposure of sensitive credentials

**Security Review Needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run billing test without fix - should fail or timeout
/test 9

# Verify stripe-webhook is NOT running
docker ps | grep stripe  # Should show nothing (or containers from previous run)

# Check docker-compose services
docker-compose -f docker-compose.test.yml config | grep -A 5 "stripe-webhook"  # Should show profile: billing defined
```

**Expected Result**: Billing test times out waiting for "Active" status badge (webhook events never arrive)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Run billing test
/test 9

# Verify stripe-webhook IS running (when billing shard runs)
docker ps | grep stripe  # Should show slideheroes-stripe-webhook running

# Verify webhook secret was captured
docker exec slideheroes-stripe-webhook ls -la /stripe/

# Verify subscription status updates to Active
# (test should pass within the 45-second timeout)
```

**Expected Result**: All commands succeed, billing test passes, subscription status updates to "Active" within 45 seconds

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
/test

# Specifically verify non-billing shards don't have overhead
/test 1  # Should run without stripe-webhook container

# Verify docker cleanup
docker ps  # Should show only running containers, no leftover stripe-webhook if running non-billing tests

# Additional regression checks
pnpm typecheck  # No type errors introduced
pnpm lint       # No lint issues introduced
```

## Dependencies

### New Dependencies

None - This uses existing Docker infrastructure and Node.js child_process module already in use.

### Existing Dependencies Used

- Node.js `child_process` module (already used for docker-compose commands)
- Docker compose (already required for test infrastructure)
- Health check detection via `docker inspect` (already used in codebase)

## Database Changes

**Migration needed**: no

**No database changes required** - This is purely test infrastructure fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - Changes are internal to test controller, no API or contract changes

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (billing test passes)
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] Billing test consistently passes
- [ ] Non-billing tests unaffected (no extra overhead)

## Notes

This is a follow-up fix for issue #885 which diagnosed the same root cause but was never implemented. The solution is straightforward: detect when billing tests will run, conditionally start the stripe-webhook container with the appropriate docker-compose profile, and wait for it to be healthy before tests begin.

The key insight is that the stripe-webhook container has already been properly configured in docker-compose.test.yml with:
- Profile: billing (so it only runs when explicitly requested)
- Shared volume for webhook secret
- Proper health check to detect when ready
- Correct forwarding URL to app-test container

We just need to wire it up to the test controller's startup sequence.

Related Issues:
- #885 - Original diagnosis of this issue (never fixed)
- #880 - Fixed Stripe credentials, revealed webhook issue

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #895*
