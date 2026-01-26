# Bug Fix: Payload CMS Docker Container Returns 500 Errors Due to tmpfs Mount

**Related Diagnosis**: #1804 (REQUIRED)
**Severity**: high
**Bug Type**: infrastructure
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `tmpfs` mount for `/app/apps/payload/.next` in docker-compose.test.yml (line 99) creates race conditions that break Next.js file operations
- **Fix Approach**: Remove problematic tmpfs mount from Payload CMS service while keeping it on main app service
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Payload CMS test container (`slideheroes-payload-test`) returns HTTP 500 errors for all page requests when accessing `/admin/login`, while simple API routes like `/api/health` intermittently work. The root cause is the tmpfs mount for the `.next` directory interferes with Next.js dev server's file operations, particularly webpack cache operations that fail with `ENOENT` errors during concurrent writes.

For full details, see diagnosis issue #1804.

### Solution Approaches Considered

#### Option 1: Remove tmpfs Mount for Payload Only ⭐ RECOMMENDED

**Description**: Remove the tmpfs mount lines (97-99) from the `payload-test` service only, while keeping tmpfs on the `app-test` service for performance.

**Pros**:
- Surgical fix - only removes the problematic mount
- Maintains performance optimization for main app service
- Minimal code change (2 lines deleted)
- Zero risk of affecting other services
- Payload CMS is slower but stable on normal filesystem
- Quick to implement and verify

**Cons**:
- Payload CMS startup will be slower (acceptable - test environment only)
- Builds will take a bit longer for Payload container

**Risk Assessment**: low - tmpfs is only an optimization; removing it just uses slower disk I/O

**Complexity**: simple - straightforward YAML edit

#### Option 2: Replace tmpfs with Anonymous Volume

**Description**: Replace tmpfs mount with a Docker named volume for the Payload `.next` directory.

```yaml
volumes:
  - payload-next-cache:/app/apps/payload/.next
```

**Pros**:
- Maintains persistence across container restarts
- More stable than tmpfs for this use case
- Potential performance improvement

**Cons**:
- More complex than Option 1
- Volume cleanup required manually
- Adds state to test environment (not ideal for clean tests)

**Why Not Chosen**: Option 1 is simpler, faster to implement, and sufficient for test environment

### Selected Solution: Remove tmpfs Mount for Payload Only

**Justification**: This is the most pragmatic fix. The tmpfs mount was intended for performance optimization, but it's causing race conditions in the Payload CMS dev server. Removing it restores stability while accepting slightly slower builds in the test environment. The main app service keeps its tmpfs for continued performance. This is a test environment, not production, so the performance trade-off is acceptable.

**Technical Approach**:
- Delete lines 97-99 from docker-compose.test.yml (tmpfs section for payload-test service)
- Keep tmpfs mount on app-test service (lines 19-21)
- No other changes needed

**Architecture Changes**: None - this is a removal of an optimization that was causing problems

**Migration Strategy**: Not applicable - test containers are ephemeral

## Implementation Plan

### Affected Files

- `docker-compose.test.yml` - Remove tmpfs mount from payload-test service (lines 97-99)

### New Files

None - this is purely a configuration fix

### Step-by-Step Tasks

#### Step 1: Remove Problematic tmpfs Mount

<describe what this step accomplishes>

- Edit docker-compose.test.yml
- Remove lines 97-99 from the payload-test service (tmpfs configuration)
- Verify indentation and YAML structure remain valid
- Save changes

**Why this step first**: This is the only change needed. Once removed, the next steps verify it works.

#### Step 2: Test Container Cleanup and Restart

<describe what this step accomplishes>

- Stop running test containers to ensure clean state
- Remove old container images if needed
- Restart containers with new configuration

- Bash commands:
  ```bash
  docker-compose -f docker-compose.test.yml down
  docker-compose -f docker-compose.test.yml up -d
  ```

#### Step 3: Verify Payload Container Health

<describe what this step accomplishes>

- Wait for container to show as healthy
- Check container logs for errors
- Verify `/api/health` endpoint responds
- Test admin login page access

- Manual verification:
  ```bash
  # Wait for healthy status
  docker compose ps --filter "name=slideheroes-payload-test"

  # Check logs
  docker logs slideheroes-payload-test -f

  # Test health endpoint
  curl http://localhost:3021/api/health

  # Test admin page (should return HTML, not 500)
  curl -I http://localhost:3021/admin/login
  ```

#### Step 4: Run Full E2E Test Suite

<describe what this step accomplishes>

- Execute all E2E tests to verify no regressions
- Specifically test shards 7, 8, 9 which target Payload
- Confirm tests complete without timeouts

- Command:
  ```bash
  pnpm test:e2e
  ```

#### Step 5: Code Quality Validation

- Run formatting check
- Run linting (if YAML linting available)
- Verify docker-compose file syntax

- Commands:
  ```bash
  pnpm format
  docker-compose -f docker-compose.test.yml config  # Validates syntax
  ```

## Testing Strategy

### Unit Tests

Not applicable - this is a configuration change with no unit testable code

### Integration Tests

Not applicable - this is container configuration

### E2E Tests

Test files affected:
- `apps/e2e/tests/payload/` - All Payload-related E2E tests
- Specifically: E2E shards 7, 8, 9 which use slideheroes-payload-test container

**Verification**:
- ✅ All E2E tests complete without timeout
- ✅ Payload admin login page loads successfully
- ✅ API endpoints respond correctly
- ✅ No 500 errors in test runs
- ✅ Regression test: Original bug scenario should work (admin page loads)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start containers: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Wait for Payload container to show "healthy" status
- [ ] Verify container is running: `docker ps | grep slideheroes-payload-test`
- [ ] Check `/api/health` endpoint: `curl http://localhost:3021/api/health` (should return 200)
- [ ] Test admin login page: `curl -I http://localhost:3021/admin/login` (should return 200, not 500)
- [ ] Check container logs: `docker logs slideheroes-payload-test` (should show no fatal errors)
- [ ] Run E2E tests: `pnpm test:e2e` (all should pass without timeout)
- [ ] Verify no regressions in main app container (port 3001)
- [ ] Clean up: `docker-compose -f docker-compose.test.yml down`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Payload CMS Build Performance**: <description>
   - **Likelihood**: high
   - **Impact**: low (test environment only)
   - **Mitigation**: This is expected and acceptable. Payload CMS will build slower but will be stable. Not applicable to main app service which keeps tmpfs.

2. **Container Restart Delays**: <description>
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: Add documentation noting that Payload container may take longer to start. This is expected behavior.

**Rollback Plan**:

If unforeseen issues arise:
1. Re-add the tmpfs mount lines back to docker-compose.test.yml
2. Restart containers: `docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d`
3. Verify containers restart to healthy state

**Monitoring** (not needed):

Test containers are ephemeral and recreated per test run, so no ongoing monitoring required.

## Performance Impact

**Expected Impact**: minimal/acceptable

- **Payload CMS**: Build time will increase due to disk I/O instead of memory-based tmpfs. Expected additional ~5-10 seconds on container startup. This is acceptable for test environment.
- **Main App Service**: No impact - maintains tmpfs mount (lines 19-21)
- **Overall Test Suite**: Negligible impact to overall test runtime since containers run in parallel

## Security Considerations

No security implications. This is a configuration change that removes an optimization causing problems, not an addition of new access patterns.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Current state with problematic tmpfs mount
docker-compose -f docker-compose.test.yml up -d
sleep 10  # Wait for startup

# Check Payload container health
docker ps | grep slideheroes-payload-test  # Should show "healthy" quickly, but requests fail

# Test admin page (should return 500)
curl http://localhost:3021/admin/login  # 500 error

# Check logs for tmpfs race conditions
docker logs slideheroes-payload-test | grep -i "ENOENT"  # Should show webpack cache errors
```

**Expected Result**: Admin page returns 500, logs show ENOENT errors in webpack cache operations

### After Fix (Bug Should Be Resolved)

```bash
# Apply fix: remove tmpfs mount from docker-compose.test.yml
# Then restart containers
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml up -d
sleep 15  # Wait longer for container startup without tmpfs optimization

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# E2E tests (critical - these were timing out before)
pnpm test:e2e

# Manual verification
curl -I http://localhost:3021/admin/login  # Should return 200
curl http://localhost:3021/api/health      # Should return {"status":"ready"}
```

**Expected Result**: All commands succeed, admin page returns 200, no 500 errors, E2E tests complete without timeout

### Regression Prevention

```bash
# Ensure main app service still works properly
curl http://localhost:3001/api/health      # Should return {"status":"ready"}

# Verify no other services affected
docker-compose ps  # All containers should show "Up" or "healthy"

# Quick infrastructure check
/test --quick
```

## Dependencies

### New Dependencies

None - this is configuration removal, not code addition

**No new dependencies required**

## Database Changes

No database changes required

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - containers are local-only test infrastructure

**Feature flags needed**: no

**Backwards compatibility**: maintained - test environment only

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Admin login page no longer returns 500 errors
- [ ] Payload E2E tests complete without timeout
- [ ] All E2E tests pass (shards 7, 8, 9)
- [ ] No regressions in main app service
- [ ] Code quality checks pass (lint, format, typecheck)

## Notes

**Related Issue #1801**: The previous fix for unlockPayloadUser() timing (commit c32b8d3bb) should remain unchanged. That fix addressed a separate database timing issue and is independent of this tmpfs configuration issue.

**Why tmpfs was Added**: tmpfs mounting was likely added to improve Payload CMS build performance by using in-memory filesystem instead of disk I/O. However, it introduced race conditions in the Next.js dev server's webpack cache operations that override its benefits.

**Test Environment Rationale**: Since this is a test environment (not production), stability is more important than build speed. The 5-10 second increase in startup time is acceptable for reliable test execution.

**Future Optimization**: If Payload CMS performance becomes a concern in tests, consider:
1. Using a separate build cache volume (more complex)
2. Pre-building Payload in a separate container and copying artifacts
3. Using a faster storage backend if available

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1804*
