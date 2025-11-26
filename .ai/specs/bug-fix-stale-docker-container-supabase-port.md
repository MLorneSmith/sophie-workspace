# Bug Fix: Stale Docker Container Using Old Supabase Port

**Related Diagnosis**: #710
**Severity**: high
**Bug Type**: configuration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Docker container `slideheroes-app-test` was started before port migration (54321 → 54521) and still uses stale environment variables
- **Fix Approach**: Restart or rebuild the container to pick up correct environment from docker-compose.test.yml
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E authentication tests fail with timeout because the `slideheroes-app-test` Docker container is running with `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321`, but Supabase was migrated to port `54521` in previous fixes (#707, #709). The container must be restarted to apply the corrected environment variables.

For full details, see diagnosis issue #710.

### Solution Approaches Considered

#### Option 1: Container Restart (Simple) ⭐ RECOMMENDED

**Description**: Stop and restart the container to pick up the new environment variables from docker-compose.test.yml

```bash
docker-compose -f docker-compose.test.yml restart slideheroes-app-test
# OR if restart doesn't work
docker-compose -f docker-compose.test.yml down slideheroes-app-test
docker-compose -f docker-compose.test.yml up -d slideheroes-app-test
```

**Pros**:
- Minimal intervention - no code changes
- Takes ~5 seconds to execute
- Immediately resolves the issue
- No side effects or regressions
- Restarts container without rebuilding image (faster)

**Cons**:
- Manual step required when container stales
- Doesn't prevent future stale containers
- Users must know to restart if similar config changes occur

**Risk Assessment**: low - Container restart is a standard Docker operation with no data loss

**Complexity**: simple - Single shell command

#### Option 2: Container Rebuild (Thorough)

**Description**: Force rebuild of the container to ensure image and running instance use latest docker-compose.test.yml

```bash
docker-compose -f docker-compose.test.yml up -d --build slideheroes-app-test
```

**Pros**:
- Completely fresh container from latest docker-compose.test.yml
- Ensures image and instance both up-to-date
- Guarantees no stale layers in image

**Cons**:
- Takes 30-60 seconds (rebuilds entire image)
- Unnecessary overhead for simple environment variable change
- More disruptive to development workflow

**Why Not Chosen**: Option 1 resolves the issue faster and sufficiently. A rebuild is only needed if the Dockerfile itself changed, which is not the case here.

#### Option 3: Add Health Check & Auto-Recovery (Future Enhancement)

**Description**: Implement automatic container restart in test controller when port mismatch detected

**Why Not Chosen**: Out of scope for this fix. This addresses the root cause in the test infrastructure, which should be a separate feature task after this immediate fix.

### Selected Solution: Container Restart (Simple)

**Justification**: This is a runtime state issue, not a code issue. The docker-compose.test.yml file already has the correct port (54521), but the running container was started before the fix. Restarting the container allows it to pick up the corrected environment with zero risk and minimal effort.

**Technical Approach**:
- Use `docker-compose restart` for fastest restart
- If that fails, use `down` then `up -d` sequence
- Verify environment with `docker exec` after restart
- Confirm test runs successfully

**Architecture Changes**: None - No architectural changes needed

**Migration Strategy**: Not applicable - This is a container lifecycle issue, not a data migration

## Implementation Plan

### Affected Files

No code files are affected. This is a container runtime fix.

- `docker-compose.test.yml` - Already has correct configuration (no changes needed)
- Test container `slideheroes-app-test` - Must be restarted (runtime operation, not file change)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Restart the Container

Clear the stale environment from the running container.

- Execute `docker-compose -f docker-compose.test.yml restart slideheroes-app-test`
- Wait for container to restart (typically 3-5 seconds)
- Verify container is running: `docker ps | grep slideheroes-app-test`

**Why this step first**: This immediately applies the correct environment variables

#### Step 2: Verify Container Environment

Confirm the container now has the correct port configuration.

- Execute: `docker exec slideheroes-app-test env | grep SUPABASE_URL`
- Verify output shows: `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`
- Document the output as evidence of fix

**Expected output**:
```
NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521
```

#### Step 3: Run E2E Tests

Verify the fix resolves the authentication timeout.

- Start Supabase if not running: `pnpm supabase:web:start`
- Run E2E shard 2: `/test 2`
- Wait for auth-simple.spec.ts "user can sign in with valid credentials" test
- Verify test passes (no more timeout)
- Document test results

**Expected result**: All authentication tests pass without timeout

#### Step 4: Run Full E2E Suite

Ensure no regressions in other tests.

- Run all E2E tests: `/test --e2e`
- Monitor for any failures
- Document pass/fail summary

**Expected result**: Zero failures or new regressions

#### Step 5: Validation & Cleanup

Confirm the fix is complete and stable.

- Run validation commands (see Validation Commands section)
- Document successful fix
- Note any edge cases encountered

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests to verify the fix:

- [x] Verify Supabase is running on port 54521: `npx supabase status`
- [x] Restart container: `docker-compose -f docker-compose.test.yml restart slideheroes-app-test`
- [x] Check container environment: `docker exec slideheroes-app-test env | grep SUPABASE_URL`
- [x] Confirm output shows port 54521 (not 54321)
- [x] Run shard 2 E2E tests: `/test 2`
- [x] Verify "user can sign in with valid credentials" test passes
- [x] Run full E2E suite: `/test --e2e`
- [x] Confirm zero regressions

### Unit Tests

Not applicable - This is a container runtime fix with no code changes.

### Integration Tests

Not applicable - This is a container runtime fix with no code changes.

### E2E Tests

**Test files**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Primary test for this fix
- `apps/e2e/tests/authentication/` - All auth tests should pass
- All E2E tests - Verify no regressions

**Test scenarios**:
- ✅ User can sign in with valid credentials (previously failing with timeout)
- ✅ User can sign up with new account (validates auth connection)
- ✅ User can sign out (validates auth session)
- ✅ All other E2E tests pass (no regressions)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Container not responding after restart**: Very unlikely - Docker restart is a standard operation
   - **Likelihood**: low
   - **Impact**: low - Can retry with `down/up` sequence
   - **Mitigation**: If restart fails, use `docker-compose down && docker-compose up -d`

2. **Image still has old configuration baked in**: Possible if image wasn't rebuilt after docker-compose.test.yml change
   - **Likelihood**: medium
   - **Impact**: medium - Tests would still fail
   - **Mitigation**: If restart alone doesn't work, rebuild with `docker-compose up -d --build`

3. **Port 54521 not available (Hyper-V reservation)**: Related to #668 but should be resolved
   - **Likelihood**: low
   - **Impact**: high - Tests would still fail
   - **Mitigation**: Check Supabase status; fall back to port range change if needed

**Rollback Plan**:

If restart causes issues (unlikely):
1. Check Supabase status: `npx supabase status`
2. If Supabase not running, start it: `pnpm supabase:web:start`
3. If issue persists, rebuild: `docker-compose -f docker-compose.test.yml up -d --build slideheroes-app-test`
4. If still failing, check Docker logs: `docker logs slideheroes-app-test`

**Monitoring**: No production monitoring needed - This is a local development/test container

## Performance Impact

**Expected Impact**: None - Container restart has no performance implications

The fix resolves a timeout issue, so actual performance improves (tests no longer hang).

## Security Considerations

**Security Impact**: None

This fix addresses a configuration issue with no security implications. The port change (54321 → 54521) was made to resolve port reservation issues, not for security.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check stale container environment
docker exec slideheroes-app-test env | grep SUPABASE_URL
# Expected (wrong): NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321

# Verify Supabase is on correct port
npx supabase status
# Expected: API URL: http://127.0.0.1:54521

# Try running E2E shard 2 (will timeout)
/test 2
# Expected: auth-simple.spec.ts fails with timeout
```

### After Fix (Bug Should Be Resolved)

```bash
# Restart container
docker-compose -f docker-compose.test.yml restart slideheroes-app-test

# Wait 3-5 seconds for restart

# Verify correct environment
docker exec slideheroes-app-test env | grep SUPABASE_URL
# Expected (correct): NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521

# Verify container is running
docker ps | grep slideheroes-app-test
# Expected: Container listed with status "Up"

# Run E2E shard 2
/test 2
# Expected: All tests pass, no timeout

# Run full E2E suite
/test --e2e
# Expected: All tests pass, zero regressions
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:unit
pnpm test:e2e

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

## Dependencies

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low - No code changes, only container restart

**Special deployment steps**: None - This is a local development/test fix

**Feature flags needed**: No

**Backwards compatibility**: N/A - Configuration change, not code change

## Success Criteria

The fix is complete when:
- [x] Container has correct environment: `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`
- [x] E2E shard 2 authentication tests pass
- [x] Specific test "user can sign in with valid credentials" passes
- [x] Full E2E suite passes with zero regressions
- [x] No new errors in container logs
- [x] Supabase connection verified (port 54521)

## Notes

### Why This Happened

This is a good example of Docker container lifecycle management:
1. Containers are immutable at runtime - env vars set at startup
2. Changes to docker-compose.yml don't affect already-running containers
3. Containers must be explicitly restarted/rebuilt to pick up config changes

### Prevention for Future

To prevent similar issues:
- Document that configuration changes require container restart
- Add health checks that verify port availability
- Consider implementing automatic restart detection in test infrastructure
- This is tracked as a future enhancement, not part of this fix

### Related Issues

- #707: Fixed docker-compose.test.yml (correct values)
- #709: Fixed test infrastructure scripts (correct values)
- #706, #668: Original diagnosis and root cause
- This fix: Container restart to apply changes

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #710*
