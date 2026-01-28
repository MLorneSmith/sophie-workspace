# Bug Fix: Docker app-test tmpfs Mount Shadows Payload .next Directory

**Related Diagnosis**: #1866 (REQUIRED)
**Severity**: high
**Bug Type**: infrastructure
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Incomplete fix from #1805 - tmpfs mount for `/app/apps/payload/.next` in `app-test` service (line 20) was not removed
- **Fix Approach**: Remove line 20 from `docker-compose.test.yml` which mounts tmpfs for Payload's `.next` directory in the `app-test` service
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `app-test` Docker service has a tmpfs mount at `/app/apps/payload/.next` (line 20 of `docker-compose.test.yml`) which creates race conditions and module resolution failures in the `payload-test` container, causing HTTP 500 errors and failing E2E tests. This was supposed to be fixed in #1805 but the fix was incomplete.

For full details, see diagnosis issue #1866.

### Solution Approaches Considered

#### Option 1: Remove tmpfs Mount from app-test Service ⭐ RECOMMENDED

**Description**: Delete line 20 from `docker-compose.test.yml` which mounts tmpfs at `/app/apps/payload/.next` in the `app-test` service. The `app-test` service should only have tmpfs for its own `.next` directory (`/app/apps/web/.next`).

**Pros**:
- Surgical fix - single line deletion
- Matches the original intent of #1805 fix
- Zero risk of affecting other services
- Payload CMS uses normal filesystem (more stable)
- Minimal code change
- No configuration complexity

**Cons**:
- None - tmpfs was an optimization that caused problems

**Risk Assessment**: low - Removing the optimization simply uses slower disk I/O, which is acceptable for test environment

**Complexity**: simple - Single line deletion in YAML file

#### Option 2: Use Named Docker Volume Instead of tmpfs

**Description**: Replace the tmpfs mount with a Docker named volume for Payload's `.next` directory:
```yaml
volumes:
  - payload-next-cache:/app/apps/payload/.next
```

**Pros**:
- Maintains some performance optimization
- More stable than tmpfs for concurrent access
- Persistent across container restarts

**Cons**:
- More complex than Option 1
- Adds state management (volumes need cleanup)
- Not necessary for test environment
- Introduces additional infrastructure

**Why Not Chosen**: Adds unnecessary complexity. The test environment doesn't need aggressive performance optimization, and the tmpfs was causing more problems than it solved.

#### Option 3: Fix pnpm Module Hoisting for @payloadcms/ui

**Description**: Add `@payloadcms/ui` to the public-hoist-pattern in `.npmrc` to ensure it's properly linked:
```
public-hoist-pattern[]=@payloadcms/ui
```

**Why Not Chosen**: This addresses a secondary symptom, not the root cause. The primary issue is the tmpfs mount creating race conditions. Module resolution should work correctly once the tmpfs mount is removed, as the Payload container will have a stable `.next` directory.

### Selected Solution: Remove tmpfs Mount from app-test Service

**Justification**: This is the most direct and surgical fix. The tmpfs mount was identified as the root cause in #1804/#1805, and the fix should have removed all tmpfs mounts for Payload's `.next` directory. Since this is a test environment (not production), the slight performance trade-off of using disk I/O instead of tmpfs is acceptable and worth the stability gain.

**Technical Approach**:
- Edit `docker-compose.test.yml`
- Delete line 20: `  - /app/apps/payload/.next:uid=1000,gid=1000,mode=1777`
- Leave line 19 intact: `  - /app/apps/web/.next:uid=1000,gid=1000,mode=1777`
- Verify YAML syntax is still valid

**Architecture Changes**: None - this is a removal of a problematic optimization

**Migration Strategy**: Not applicable - Docker containers are ephemeral; simply restart them with the new configuration

## Implementation Plan

### Affected Files

- `docker-compose.test.yml` - Remove tmpfs mount for Payload `.next` directory (line 20)

### New Files

**No new files required** - this is a configuration fix

### Step-by-Step Tasks

#### Step 1: Remove Problematic tmpfs Mount

Remove line 20 from `docker-compose.test.yml` which mounts tmpfs at `/app/apps/payload/.next` in the `app-test` service.

**Before** (lines 18-20):
```yaml
tmpfs:
  - /app/apps/web/.next:uid=1000,gid=1000,mode=1777
  - /app/apps/payload/.next:uid=1000,gid=1000,mode=1777
```

**After** (lines 18-19):
```yaml
tmpfs:
  - /app/apps/web/.next:uid=1000,gid=1000,mode=1777
```

- Use Edit tool to remove line 20
- Verify indentation and YAML structure remain valid
- Save changes

**Why this step first**: This is the only code change needed. Once removed, subsequent steps verify it works.

#### Step 2: Validate Docker Compose Configuration

Validate the YAML syntax to ensure no formatting errors were introduced.

- Run: `docker-compose -f docker-compose.test.yml config`
- Verify no errors in output
- Confirm the `app-test` service shows only one tmpfs mount

**Why this step**: Catch any YAML syntax errors before attempting to restart containers

#### Step 3: Restart Docker Containers with New Configuration

Stop running containers and restart with the updated configuration.

- Run: `docker-compose -f docker-compose.test.yml down`
- Run: `docker-compose -f docker-compose.test.yml up -d`
- Wait for containers to show as healthy (may take 2-3 minutes)

**Why this step**: Apply the configuration change and verify containers start correctly

#### Step 4: Verify Payload Container Health

Wait for the Payload container to show healthy status and verify it responds correctly.

- Run: `docker compose ps --filter "name=slideheroes-payload-test"`
- Wait until status shows "(healthy)" (may take 2-3 minutes)
- Run: `curl -I http://localhost:3021/api/health` - should return HTTP 200
- Check logs: `docker logs slideheroes-payload-test --tail 50` - should show no ENOENT errors

**Why this step**: Verify the fix resolves the original bug

#### Step 5: Run E2E Test Suite

Execute E2E tests to verify no regressions and that Payload-targeting tests now pass.

- Run: `pnpm test:e2e` (full suite)
- Specifically verify E2E shards 7, 8, 9 complete without timeout
- Confirm all tests pass

**Why this step**: Regression testing to ensure the fix doesn't break anything

#### Step 6: Code Quality Validation

Run code quality checks to ensure the change passes all validation.

- Run: `pnpm format` (YAML formatting)
- Verify git diff shows only the intended change (line 20 removed)

**Why this step**: Standard code quality validation

## Testing Strategy

### Unit Tests

Not applicable - this is a Docker configuration change with no unit testable code

### Integration Tests

Not applicable - this is container infrastructure configuration

### E2E Tests

**Test files affected**:
- All tests in `apps/e2e/tests/payload/` - Payload CMS E2E tests
- E2E shards 7, 8, 9 which target the `slideheroes-payload-test` container

**Verification**:
- ✅ All Payload E2E tests complete without timeout
- ✅ Payload admin pages load successfully
- ✅ Payload API endpoints respond correctly
- ✅ No HTTP 500 errors in test runs
- ✅ Regression test: Original bug scenario (admin page access) should work

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Stop containers: `docker-compose -f docker-compose.test.yml down`
- [ ] Apply fix: Remove line 20 from `docker-compose.test.yml`
- [ ] Validate YAML: `docker-compose -f docker-compose.test.yml config`
- [ ] Start containers: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Wait for Payload container healthy status (2-3 minutes)
- [ ] Test health endpoint: `curl http://localhost:3021/api/health` → 200 OK
- [ ] Check logs: `docker logs slideheroes-payload-test` → no ENOENT errors
- [ ] Test admin login page: `curl -I http://localhost:3021/admin/login` → 200 OK
- [ ] Verify main app still works: `curl http://localhost:3001/api/health` → 200 OK
- [ ] Run E2E tests: `pnpm test:e2e` → all pass
- [ ] Clean up: `docker-compose -f docker-compose.test.yml down`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Payload CMS Build Performance Degradation**: Slower builds due to disk I/O instead of tmpfs
   - **Likelihood**: high
   - **Impact**: low (test environment only, ~5-10 seconds slower startup)
   - **Mitigation**: This is expected and acceptable. Test environment prioritizes stability over speed. Main `app-test` service keeps its tmpfs for performance.

2. **Container Restart Delays**: Longer startup time for Payload container
   - **Likelihood**: medium
   - **Impact**: low (adds ~5-10 seconds to startup)
   - **Mitigation**: Document expected behavior. This is acceptable for test environment.

3. **YAML Syntax Error**: Accidental formatting issue when removing line
   - **Likelihood**: low
   - **Impact**: high (containers won't start)
   - **Mitigation**: Use `docker-compose config` to validate before restarting containers

**Rollback Plan**:

If this fix causes unexpected issues:
1. Re-add line 20 to `docker-compose.test.yml`:
   ```yaml
   - /app/apps/payload/.next:uid=1000,gid=1000,mode=1777
   ```
2. Restart containers: `docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d`
3. Verify containers return to previous state
4. Investigate why the fix failed

**Monitoring**: Not needed - test containers are ephemeral and recreated per test run

## Performance Impact

**Expected Impact**: minimal/acceptable

- **Payload CMS**: Build time will increase by ~5-10 seconds on container startup due to disk I/O instead of memory-based tmpfs
- **Main App Service**: No impact - retains tmpfs mount for `/app/apps/web/.next`
- **Overall Test Suite**: Negligible impact - containers run in parallel, and the added startup time is a one-time cost

**Performance Testing**: Monitor container startup logs to confirm healthy status is reached within expected timeframe (~2-3 minutes total)

## Security Considerations

**Security Impact**: none

This is a configuration change that removes an optimization causing problems. No new access patterns or vulnerabilities introduced.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Current state with problematic tmpfs mount
docker-compose -f docker-compose.test.yml up -d
sleep 15  # Wait for startup

# Check Payload container health (should be unhealthy)
docker ps | grep slideheroes-payload-test

# Test admin page (should return 500)
curl -I http://localhost:3021/admin/login

# Check logs for errors (should show ENOENT and module resolution errors)
docker logs slideheroes-payload-test | grep -E "ENOENT|Cannot find module"
```

**Expected Result**: Container shows "(unhealthy)", admin page returns 500, logs show ENOENT errors

### After Fix (Bug Should Be Resolved)

```bash
# Stop containers
docker-compose -f docker-compose.test.yml down

# Apply fix (remove line 20 from docker-compose.test.yml)

# Validate YAML syntax
docker-compose -f docker-compose.test.yml config

# Restart containers
docker-compose -f docker-compose.test.yml up -d

# Wait for startup (longer without tmpfs optimization)
sleep 20

# Check Payload container health (should show healthy)
docker ps | grep slideheroes-payload-test

# Test health endpoint (should return 200)
curl -I http://localhost:3021/api/health

# Test admin page (should return 200)
curl -I http://localhost:3021/admin/login

# Check logs (should show no ENOENT errors)
docker logs slideheroes-payload-test --tail 50

# Format check
pnpm format

# Run E2E tests
pnpm test:e2e
```

**Expected Result**: All commands succeed, container shows "(healthy)", endpoints return 200, no errors in logs, E2E tests pass

### Regression Prevention

```bash
# Verify main app service still works
curl http://localhost:3001/api/health  # Should return 200

# Verify all containers running
docker-compose ps  # All should show "Up" or "healthy"

# Verify no other services affected
docker logs slideheroes-app-test --tail 20  # Should show no errors

# Run full E2E test suite
pnpm test:e2e  # All tests should pass
```

## Dependencies

### New Dependencies

**No new dependencies required** - this is a configuration-only change

## Database Changes

**No database changes required** - this is a Docker configuration fix

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this only affects local Docker test environment

**Feature flags needed**: no

**Backwards compatibility**: maintained - test environment only, no production impact

## Success Criteria

The fix is complete when:
- [ ] Line 20 removed from `docker-compose.test.yml`
- [ ] YAML validation passes
- [ ] Containers restart successfully
- [ ] Payload container shows "(healthy)" status
- [ ] `/api/health` endpoint returns HTTP 200
- [ ] `/admin/login` page loads without 500 error
- [ ] No ENOENT errors in container logs
- [ ] E2E tests pass (especially shards 7, 8, 9)
- [ ] No regressions in main app service
- [ ] Code formatting passes

## Notes

**Related to Issue #1801**: The previous fix for `unlockPayloadUser()` timing (commit `c32b8d3bb`) should remain unchanged. That fix addressed a separate database timing issue and is independent of this tmpfs configuration issue.

**Why tmpfs Was Added**: The tmpfs mounting was likely added to improve build performance by using in-memory filesystem instead of disk I/O. However, it introduced race conditions in the Next.js dev server's webpack cache operations that override its benefits.

**Test Environment Rationale**: Since this is a test environment (not production), stability is more important than build speed. The 5-10 second increase in startup time is acceptable for reliable test execution.

**Why the Original Fix Was Incomplete**: The #1805 fix focused on the `payload-test` service's tmpfs configuration (around lines 97-99 at the time). The `app-test` service's tmpfs configuration at the top of the file (lines 18-20) was not identified as also containing a mount for the Payload `.next` directory. This was an oversight in the diagnosis/fix process.

**Future Considerations**: If Payload CMS performance becomes a concern in the test environment, consider:
1. Using a pre-built Docker image with Payload already compiled
2. Using a separate named volume (more complex but more stable than tmpfs)
3. Optimizing webpack cache configuration in Next.js

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1866*
