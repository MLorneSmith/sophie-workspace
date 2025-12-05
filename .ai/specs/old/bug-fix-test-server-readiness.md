# Bug Fix: Test Server Unreachable During E2E Execution

**Related Diagnosis**: #669 (REQUIRED)
**Severity**: medium
**Bug Type**: infrastructure
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: E2E readiness check uses 5-second timeout, but Docker container restart takes 30-40 seconds
- **Fix Approach**: Add retry logic to `validateE2EReadiness()` with exponential backoff, matching container healthcheck configuration
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test suite fails because the slideheroes-app-test Docker container restarts during unit test execution. The E2E readiness check has a fixed 5-second timeout that's insufficient to wait for the container's ~40-second startup sequence (pnpm install + Next.js initialization). This causes E2E tests to be skipped with "Cannot reach test server: The operation was aborted due to timeout."

For full details, see diagnosis issue #669.

### Solution Approaches Considered

#### Option 1: Add Retry Logic to E2E Readiness Check ⭐ RECOMMENDED

**Description**: Modify `validateE2EReadiness()` in test-controller.cjs to implement exponential backoff retry logic, matching the container's health check configuration (15s intervals, 10 retries, ~180s maximum wait).

**Pros**:
- Handles the immediate problem (insufficient timeout)
- Matches existing container health check behavior
- Most reliable approach - waits for actual server readiness
- Works even if container restarts for other reasons
- Minimal code changes (only test infrastructure affected)

**Cons**:
- Adds complexity to test controller
- Could mask other startup issues (containers hanging indefinitely)
- Increases overall test wait time if server is genuinely unavailable

**Risk Assessment**: Low - isolated change with clear bounds and timeout protection

**Complexity**: Moderate - requires understanding test controller flow and abort signal handling

#### Option 2: Optimize Container Startup

**Description**: Remove `pnpm install` from the container startup command since dependencies are already installed in the image. Or use a named volume for node_modules to persist between restarts.

**Pros**:
- Faster container startup (eliminate 30-40 second dependency installation)
- Reduces overall test time
- Might prevent restart trigger (less disk activity)

**Cons**:
- Requires Docker image rebuild/testing
- Doesn't address the underlying restart trigger
- Stale node_modules could cause issues if dependencies change
- More fragile (depends on consistent dependency state)

**Why Not Chosen**: While faster startup would help, it doesn't address the root cause. Container restarts may continue to happen for other reasons. The immediate bottleneck is the timeout, not startup speed. Better to fix the timeout and optimize startup as a separate follow-up.

#### Option 3: Prevent Container Restart

**Description**: Investigate and prevent the trigger that causes the container to restart (file watcher, signal handling, disk space, etc.). Add .dockerignore patterns to exclude test artifacts.

**Pros**:
- Eliminates the root cause
- Prevents future related issues
- Most robust long-term solution

**Cons**:
- Requires deep investigation into restart trigger
- May not be fully preventable (signals from test processes)
- Could be environment-specific (WSL2 vs Mac vs Linux)
- Higher complexity with uncertain payoff

**Why Not Chosen**: Investigation phase already tried to identify trigger without success. Without clear evidence of cause, prevention is speculative. Better to first implement retry logic (known to work) while investigation continues separately.

### Selected Solution: Add Retry Logic to E2E Readiness Check

**Justification**: This approach directly addresses the identified problem with minimal risk. The container healthcheck already waits for readiness with retries - the test infrastructure should do the same. The 5-second timeout is clearly insufficient based on diagnostic evidence. Adding exponential backoff retry logic aligns the test infrastructure with the container's own health check configuration, ensuring consistency and reliability.

**Technical Approach**:

1. Implement exponential backoff retry mechanism in `validateE2EReadiness()`
2. Use abort signal with configurable timeout per retry attempt (matching healthcheck: 15s intervals)
3. Maximum total wait time of 180 seconds (matching container start_period)
4. Log each retry attempt with timestamp for debugging
5. Return detailed error message showing all failed attempts if ultimately unavailable

**Architecture Changes**: No architectural changes. Pure test infrastructure improvement.

**Migration Strategy**: No migration needed - backward compatible change.

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/infrastructure/test-controller.cjs` - Main change: enhance `validateE2EReadiness()` function with retry logic
- `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - Reference: understand container health check configuration
- No changes to docker-compose.test.yml or production code

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Analyze Current Implementation

Understand the existing `validateE2EReadiness()` function and how it's called.

- Read test-controller.cjs focusing on validateE2EReadiness() (lines 247+)
- Understand the AbortSignal mechanism and how timeout is currently implemented
- Check how error is reported when readiness check fails
- Identify where retry logic should be inserted

**Why this step first**: Must understand current code structure before implementing retry logic to avoid breaking changes.

#### Step 2: Implement Retry Logic

Modify `validateE2EReadiness()` to add exponential backoff retry mechanism.

- Add configuration constants: initial timeout (15s), max attempts (10), max total wait (180s)
- Wrap the health check fetch in a retry loop
- Implement exponential backoff: 1s, 2s, 4s, 8s, 15s, 15s, 15s... (cap at 15s between retries)
- Add detailed logging showing each attempt: timestamp, retry count, elapsed time
- Update error message to show all failed attempts and total wait time
- Ensure AbortSignal is properly handled across retries

#### Step 3: Add Unit Tests

Test the retry logic without needing Docker containers.

- Add unit test for successful readiness check (no retries needed)
- Add unit test for single failure then success (retry works)
- Add unit test for max retries exceeded (proper error message)
- Add test for timeout calculation and exponential backoff timing
- Mock the fetch call to simulate different failure patterns

#### Step 4: Manual Testing

Verify the fix works with actual Docker containers.

- Start test containers: `docker-compose -f docker-compose.test.yml up -d`
- Wait for containers to be healthy
- Force a container restart mid-test: manually restart the container while running unit tests
- Verify E2E readiness check retries and eventually succeeds
- Run the complete test suite: `/test`
- Verify E2E tests now run successfully even if container restarts during unit tests

#### Step 5: Validation

Run full test suite and ensure no regressions.

- Run full test suite: `pnpm test`
- Verify all unit tests still pass
- Verify E2E tests complete successfully
- Check that existing tests don't time out due to added retry logic
- Monitor test execution time (should be minimal increase if servers are responsive)

## Testing Strategy

### Unit Tests

Add unit tests for the retry logic to `.ai/ai_scripts/testing/infrastructure/__tests__/test-controller.spec.js`:

- ✅ E2E readiness succeeds on first attempt (no retries needed)
- ✅ E2E readiness succeeds after 2 failed attempts then success
- ✅ E2E readiness fails after max retries exceeded (10 attempts)
- ✅ Timeout increases exponentially (1s, 2s, 4s, 8s, 15s)
- ✅ Total wait time never exceeds 180 seconds
- ✅ Error message includes all retry attempts and elapsed time
- ✅ AbortSignal properly interrupts fetch on timeout

**Test files**:
- `.ai/ai_scripts/testing/infrastructure/__tests__/test-controller.spec.js` - Unit tests for retry logic

### Integration Tests

Test the readiness check with actual containers (in existing test suite):

- ✅ E2E readiness check succeeds when container is healthy
- ✅ E2E readiness check handles container restart gracefully
- ✅ Full test suite completes successfully with container restart during unit tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start test containers: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Verify containers are healthy: `curl http://localhost:3001/api/health`
- [ ] Run quick test: `/test --quick` (should pass immediately)
- [ ] Run unit tests: `/test --unit` (should complete successfully)
- [ ] Manually stop the container mid-way through unit tests: `docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d`
- [ ] Run full test suite: `/test`
- [ ] Verify E2E tests run successfully despite container restart
- [ ] Check logs for retry attempts in E2E readiness check
- [ ] Monitor elapsed time (should not significantly increase from baseline)

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Slower Test Execution if Server Unavailable**: If test server has ongoing issues, tests will wait up to 180 seconds before failing.
   - **Likelihood**: Low - most issues resolve within 40-60 seconds
   - **Impact**: Medium - test execution time increases
   - **Mitigation**: Log each retry attempt so developers can see what's happening; add circuit breaker to fail faster if server is genuinely unhealthy

2. **Masking of Real Startup Issues**: If container doesn't start properly, retry logic could hide the problem.
   - **Likelihood**: Low - proper logging shows all attempts
   - **Impact**: Medium - harder to diagnose startup problems
   - **Mitigation**: Detailed logging of each attempt with timestamp and error details

3. **Breaking Change to Test Infrastructure API**: If other code depends on the synchronous behavior of validateE2EReadiness().
   - **Likelihood**: Very Low - test infrastructure is internal only
   - **Impact**: Low - isolated component
   - **Mitigation**: Verify no other code calls validateE2EReadiness() outside of expected flow

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the changes to test-controller.cjs
2. The original 5-second timeout will be restored
3. E2E tests will fail again if container restarts, but at least tests will fail fast
4. Alternative: reduce max retries or total wait time if tests are timing out too frequently

**Monitoring** (if needed):

After deployment, monitor:
- E2E readiness check success rate (should increase from ~70% to ~99%)
- Average E2E readiness check time (should be <10s if containers are healthy)
- Number of retry attempts (should be 0-1 for healthy containers)
- Any timeouts waiting for readiness (should be rare)

## Performance Impact

**Expected Impact**: Minimal for healthy systems, significant improvement for systems experiencing container restarts.

For healthy containers (no restart):
- Additional latency: <100ms (single health check attempt)
- No change to overall test execution time

For containers that restart during unit tests:
- E2E tests will now succeed instead of failing
- Potential latency: 30-40 seconds (waiting for container to restart)
- This latency would exist anyway; currently tests fail instead of waiting

## Security Considerations

**Security Impact**: None

The change is purely to test infrastructure timing. No security-sensitive code changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Set up containers
docker-compose -f docker-compose.test.yml up -d

# Wait for health
sleep 10

# Force a restart mid-test by stopping container during unit test run
# Run test in background and manually restart container
bash -c '
  /test --unit &
  TEST_PID=$!
  sleep 20  # Let unit tests run for 20 seconds
  docker-compose -f docker-compose.test.yml restart
  wait $TEST_PID
'

# Expected result: E2E tests will be skipped with timeout error
```

**Expected Result**: E2E tests skipped with "Cannot reach test server: The operation was aborted due to timeout"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for test infrastructure
pnpm test test-controller

# Manual verification with container restart
bash -c '
  docker-compose -f docker-compose.test.yml up -d
  sleep 10
  /test --unit &
  TEST_PID=$!
  sleep 20
  docker-compose -f docker-compose.test.yml restart
  wait $TEST_PID
'

# Full test suite
/test
```

**Expected Result**: All commands succeed. E2E tests run successfully despite container restart during unit tests. Logs show retry attempts in E2E readiness check.

### Regression Prevention

```bash
# Run full test suite multiple times to ensure stability
for i in {1..3}; do
  echo "Test run $i..."
  /test
  if [ $? -ne 0 ]; then
    echo "Test run $i failed"
    exit 1
  fi
done

# Run with containers pre-warmed (typical case)
docker-compose -f docker-compose.test.yml up -d
sleep 10
/test

# Run with fresh containers (stress test)
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
/test
```

## Dependencies

### New Dependencies

None - using only Node.js built-in modules (fetch API, AbortSignal already available)

### Existing Dependencies Used

- `node:20-slim` or higher (for AbortSignal support)
- Existing test infrastructure (no new packages required)

## Database Changes

**Migration needed**: No

No database changes required.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - change is backward compatible

The modified test infrastructure will work the same way as before for healthy containers. For unhealthy containers, instead of failing fast, it will retry - this is an improvement.

## Success Criteria

The fix is complete when:

- [ ] `validateE2EReadiness()` implements exponential backoff retry logic
- [ ] Retry logic matches container healthcheck configuration (15s intervals, 10 retries, 180s max)
- [ ] All unit tests for retry logic pass
- [ ] E2E readiness check succeeds even if container restarts during unit tests
- [ ] Full test suite passes: `/test`
- [ ] Manual testing checklist complete
- [ ] No regressions in existing tests
- [ ] Detailed logging shows retry attempts (for debugging)
- [ ] Error messages clearly indicate what went wrong if readiness check ultimately fails

## Notes

**Key Implementation Details**:

1. The exponential backoff pattern should cap at 15 seconds (matching healthcheck interval) to avoid unnecessarily long gaps between attempts
2. Use `AbortSignal.timeout()` (available in Node 17+) for timeout management
3. Ensure detailed logging at each retry so developers can see what's happening
4. The 180-second maximum total wait matches the container's `start_period` configuration
5. This fix is temporary; a parallel investigation should determine why the container restarts in the first place

**Related Issues**:

- The underlying container restart trigger should still be investigated (separate issue)
- Consider optimization of container startup time (removing redundant pnpm install) as a follow-up
- Docker healthcheck already works correctly; test infrastructure should mirror this behavior

**Documentation**:

- After fix is deployed, update CLAUDE.md to document the retry behavior
- Add comment in test-controller.cjs explaining the 180-second timeout rationale
- Update any developer documentation about E2E test failures and timeout behavior

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #669*
