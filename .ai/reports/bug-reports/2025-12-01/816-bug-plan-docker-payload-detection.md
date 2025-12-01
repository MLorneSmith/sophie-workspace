# Bug Fix: /test 7 fails to detect Payload running in Docker container

**Related Diagnosis**: #815 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `lsof -ti:3021` cannot detect Docker port forwarding on WSL2, causes early return that prevents HTTP health checks
- **Fix Approach**: Remove redundant `lsof` check and rely on HTTP health checks which work for both native and Docker scenarios
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `/test 7` command fails with `EADDRINUSE` when Payload CMS runs in a Docker container on WSL2. The test controller's `healthCheckPayloadServer()` function uses `lsof -ti:3021` to detect if Payload is running. On Docker-forwarded ports, `lsof` returns 'none' even though Payload is healthy and responding on port 3021. This causes the function to return "not_running" and attempt starting a second Payload instance, which fails because port 3021 is already bound.

For full details, see diagnosis issue #815.

### Solution Approaches Considered

#### Option 1: Remove the `lsof` check entirely ⭐ RECOMMENDED

**Description**: Delete lines 670-677 that perform the `lsof` check. Rely entirely on HTTP health checks which are executed in lines 680-707. The HTTP approach is superior because it:
1. Works with both native processes and Docker containers
2. Tests actual service responsiveness, not just port occupation
3. Includes fallback checks (health endpoint + admin login page)
4. Already has proper timeout and error handling

**Pros**:
- Minimal code change (remove 8 lines)
- Eliminates false negatives for Docker containers
- More reliable detection (HTTP validates service is ready, not just port bound)
- No new dependencies or complexity
- Works for all port detection scenarios (native, Docker, WSL2)

**Cons**:
- Slightly slower (no early return, always attempts HTTP checks)
- Performance impact negligible (5 second timeout vs 1 second for lsof)

**Risk Assessment**: low - This is a net positive. The only "risk" is performance, but the upside (fixing Docker detection) vastly outweighs milliseconds of latency.

**Complexity**: simple - Straightforward deletion of 8 lines

#### Option 2: Fix `lsof` to work with Docker ports

**Description**: Attempt to make `lsof` detect Docker port forwarding by using alternative commands like `netstat` or checking Docker port bindings directly.

**Pros**:
- Keeps the early return optimization (faster detection)
- Preserves the idea of a pre-check before HTTP

**Cons**:
- Complex to implement across Windows/WSL2/Linux/macOS
- May not work reliably on all systems
- Docker-specific code adds maintenance burden
- Still wouldn't be as reliable as HTTP checks
- Why Not Chosen: The HTTP approach is already implemented and works. Adding Docker-specific detection logic is overengineering when the existing solution is already superior.

#### Option 3: Use Docker API to detect container status

**Description**: Instead of `lsof`, query the Docker daemon to check if `slideheroes-payload-test` container exists and is running.

**Why Not Chosen**: Requires Docker SDK dependency, adds complexity, only works when Payload is in Docker (not when running natively). The HTTP approach is simpler and more universal.

### Selected Solution: Remove the `lsof` check

**Justification**: The `lsof` check is a premature optimization that fails for Docker containers. The HTTP health checks (already implemented) are:
- More reliable (tests actual service readiness)
- Universal (works for native and Docker)
- Already comprehensive (includes fallbacks)
- Already properly structured (timeouts, error handling)

This is a case where the existing code is already correct and better than the optimization. Removing the optimization fixes the bug with minimal risk.

**Technical Approach**:
- Remove lines 670-677 (the `lsof` check and early return)
- Keep all HTTP health check logic (lines 680-707) unchanged
- The function will now:
  1. Attempt health check on `/api/health` endpoint
  2. Fall back to `/admin/login` page if health fails
  3. Return appropriate status (healthy/starting/not_running)

**Architecture Changes**: None - This is purely code cleanup

**Migration Strategy**: Not needed - This is a bug fix with no API or state changes

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - Remove `lsof` check from `healthCheckPayloadServer()` function (lines 670-677)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Remove the `lsof` port detection check

Remove lines 670-677 from `healthCheckPayloadServer()` function:

```javascript
// DELETE these 8 lines:
// const { stdout: portCheck } = await execAsync(
//     `lsof -ti:${payloadPort} 2>/dev/null || echo 'none'`,
//     { timeout: 1000 },
// );
//
// if (portCheck.trim() === "none") {
//     return "not_running";
// }
```

**Why this step first**: The `lsof` check is the root cause of the bug. Removing it is the fundamental fix.

- Delete the `lsof` command and conditional check
- Keep the try-catch wrapper for the health checks
- Ensure proper indentation after deletion

#### Step 2: Verify function structure

After deletion, the function should:
1. Initialize `payloadPort` and `payloadUrl` variables
2. Have a try-catch wrapper
3. Directly attempt the `/api/health` fetch (no `lsof` check first)
4. Include the `/admin/login` fallback
5. Return "not_running" only if both checks fail

**Why this step**: Ensures the refactored code is structurally correct and maintains proper error handling.

#### Step 3: Update related comments (if any)

Review lines near the change:
- Line 715-717: `setupPayloadServer()` function comment mentions port 3021 is still accurate
- No comment updates needed if comments accurately describe the behavior

#### Step 4: Test the fix

Execute these validation commands:

```bash
# Ensure no syntax errors
node -c .ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs

# Run shard 7 tests with Docker containers
docker-compose -f docker-compose.test.yml up -d
sleep 5
/test 7

# Run shard 8 tests
/test 8

# Verify no regression - full test suite
/test
```

#### Step 5: Validation

Confirm the bug is fixed:

- [ ] Payload CMS is detected as running when in Docker container
- [ ] `/test 7` and `/test 8` shards complete without `EADDRINUSE` error
- [ ] No syntax errors in the JavaScript file
- [ ] All test shards pass without regressions

## Testing Strategy

### Unit Tests

The `healthCheckPayloadServer()` function is not directly unit testable as it uses `fetch` which makes real network calls. However, the fix can be validated through:

- ✅ Manual testing with Docker containers running
- ✅ Verify HTTP health check is called (no early return)
- ✅ Verify fallback to admin page works if health endpoint fails
- ✅ Regression test: Payload in Docker should be detected as running

### Integration Tests

No integration tests needed - this is infrastructure code that's validated through E2E test execution.

### E2E Tests (Automated Validation)

The fix is automatically validated by:
- `/test 7` - Payload CMS shard tests
- `/test 8` - Payload CMS Extended shard tests

These tests call the `healthCheckPayloadServer()` function and verify Payload is properly detected.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start Payload in Docker: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Verify Payload is running: `curl http://localhost:3021/api/health` returns 200
- [ ] Run test shard 7: `/test 7` should detect Payload and pass (not fail with EADDRINUSE)
- [ ] Run test shard 8: `/test 8` should detect Payload and pass
- [ ] Stop Docker containers: `docker-compose -f docker-compose.test.yml down`
- [ ] Start Payload natively (if applicable): `cd apps/payload && pnpm dev:test`
- [ ] Verify native Payload is detected: `/test 7` should work with native Payload
- [ ] Run full test suite: `/test` should pass all shards with no regressions

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Performance regression from removing early return**: The function will always attempt HTTP checks instead of having a fast `lsof` return
   - **Likelihood**: medium
   - **Impact**: low (latency measured in milliseconds)
   - **Mitigation**: Performance impact is negligible and acceptable for fixing the bug. HTTP timeout is already 5 seconds, `lsof` timeout was 1 second, but Payload startup takes much longer anyway.

2. **Payload detection fails if HTTP endpoints are down**: Removing `lsof` means we rely entirely on HTTP
   - **Likelihood**: low (HTTP endpoints are core to Payload functionality)
   - **Impact**: medium (test would fail)
   - **Mitigation**: The fallback to `/admin/login` provides redundancy. If both fail, Payload genuinely isn't running.

**Rollback Plan**:

If this fix causes issues:
1. Restore the deleted `lsof` check lines (lines 670-677)
2. Run full test suite to verify rollback works
3. Investigate why the fix caused issues (likely an edge case with HTTP checks)

**Monitoring** (if needed):

After deployment, monitor:
- Test execution times for shards 7 and 8 (expect stable or slightly faster)
- Payload health check success rate (should be 100% when Payload is running)
- EADDRINUSE errors in test logs (should drop to zero)

## Performance Impact

**Expected Impact**: minimal

Removing the early return means the function always attempts HTTP checks. However:
- Payload is designed to respond to HTTP quickly
- 5-second timeout is already present
- Performance is negligible compared to actual test execution time
- The fix eliminates test failures, which saves far more time than the small HTTP latency cost

## Security Considerations

**Security Impact**: none

- No security implications from this change
- HTTP health checks are already validated against localhost only
- No new network access or permissions required

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start Payload in Docker
docker-compose -f docker-compose.test.yml up -d

# Verify lsof cannot detect Docker port (bug symptom)
lsof -ti:3021 2>/dev/null || echo 'none'
# Expected: prints 'none' (even though Payload is running)

# Verify HTTP check works (why lsof is unnecessary)
curl -s http://localhost:3021/api/health
# Expected: {"status":"ok"} or similar

# Run test 7 - should fail with EADDRINUSE before fix
/test 7
# Expected: Error "EADDRINUSE: address already in use :::3021"
```

**Expected Result**: Test fails with EADDRINUSE because the controller thinks Payload isn't running and tries to start a second instance.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint (if applicable to .cjs files)
pnpm lint

# Syntax check for JavaScript
node -c .ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs

# Unit tests
pnpm test:unit infrastructure-manager

# E2E tests - Payload shards
/test 7
/test 8

# Build (if needed)
pnpm build

# Full test suite
/test
```

**Expected Result**: All commands succeed, shard 7 and 8 pass, no EADDRINUSE errors, bug is fixed.

### Regression Prevention

```bash
# Run full test suite multiple times to ensure stability
/test
/test
/test

# Verify Docker container still detected correctly
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml up -d
/test 7  # Should work even with fresh container

# Test with native Payload (if applicable)
pkill -f "payload dev"
cd apps/payload && pnpm dev:test &
sleep 10
/test 7  # Should work with native Payload
```

## Dependencies

**No new dependencies required** - This fix removes code rather than adding it.

## Database Changes

**No database changes required** - This is infrastructure/testing code only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Maintained - No breaking changes

## Success Criteria

The fix is complete when:
- [ ] Lines 670-677 removed from `healthCheckPayloadServer()` function
- [ ] Code syntax verified (no JavaScript errors)
- [ ] Payload detection works with Docker containers
- [ ] `/test 7` and `/test 8` shards execute successfully
- [ ] No EADDRINUSE errors in test logs
- [ ] Full test suite passes with zero regressions
- [ ] Manual testing checklist completed

## Notes

**Why this fix is correct**: The original developer added the `lsof` check as a performance optimization to avoid the HTTP timeout. This is a valid optimization for native processes. However, `lsof` cannot detect Docker port forwarding on WSL2, creating a false negative that causes the bug. The HTTP checks already in place are superior because they:

1. Test actual service readiness (not just port occupation)
2. Work across all environments (native, Docker, WSL2, etc.)
3. Include fallback checks for robustness
4. Are the source of truth for "is Payload running and healthy?"

The `lsof` check was made redundant by Docker becoming standard in the test infrastructure. Removing it is the pragmatic solution.

**Related issues**:
- #804, #805: Previous Payload detection issues with different root causes
- #693, #694: Historical Payload server detection problems

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #815*
