# Bug Fix: Payload CMS Server Not Running During E2E Tests

**Related Diagnosis**: #693
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test infrastructure checks for Payload server on port 3020 but never starts it; tests proceed and fail with ERR_CONNECTION_REFUSED
- **Fix Approach**: Add Payload server startup logic to test controller when running Payload-specific test shards
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E tests for Payload CMS (shards 7-8) are failing because the Payload server is not running during test execution. The test controller (`test-controller-monolith.cjs`) checks if Payload is running on port 3020 but doesn't start it if missing. When tests run without the server, they fail at runtime with `ERR_CONNECTION_REFUSED` errors.

This is a **regression** of previously fixed issues #370 and #376, suggesting the Payload startup logic was removed or broken during infrastructure refactoring.

For full details, see diagnosis issue #693.

### Solution Approaches Considered

#### Option 1: Start Payload Server in Test Controller ⭐ RECOMMENDED

**Description**: Add Payload server startup logic to the test controller alongside existing frontend server startup. When Payload tests are requested (shards 7-8), the controller starts the Payload server on port 3020 (or 3021 for docker).

**Pros**:
- Minimal code changes - follows existing frontend server startup pattern
- Single, unified server management in test controller
- No additional test runner configuration needed
- Consistent with existing infrastructure patterns
- Automatically handles port cleanup and health checks
- Works with both host-based and Docker-based execution

**Cons**:
- Adds complexity to already complex test controller
- Requires understanding of existing server startup patterns

**Risk Assessment**: low - follows existing proven patterns, isolated changes

**Complexity**: simple - ~50 lines of code, mostly copy-paste from frontend server startup

#### Option 2: Use Docker Compose for All Servers

**Description**: Standardize all test servers (frontend, backend, Payload) to run via docker-compose instead of host-based processes.

**Pros**:
- Unified, containerized test environment
- More reproducible, sandboxed test conditions
- Easier to manage service dependencies

**Cons**:
- Requires significant refactoring of existing infrastructure
- Docker might be slower for rapid development iteration
- Performance impact on local testing
- High risk of breaking existing functionality
- Complex migration path

**Why Not Chosen**: Too complex and risky for a regression fix; docker-compose is already partially set up but not integrated with test controller.

#### Option 3: Skip Payload Tests if Server Unavailable

**Description**: Modify test shards to gracefully skip Payload tests if the server is not running instead of failing.

**Pros**:
- No server startup required
- Quick implementation
- Won't block test execution

**Cons**:
- Defeats the purpose of E2E testing
- Hides the infrastructure issue rather than fixing it
- Tests for Payload CMS wouldn't run at all
- Poor user experience when infrastructure is misconfigured

**Why Not Chosen**: This masks the root cause rather than fixing it. E2E tests should run and validate Payload CMS functionality.

### Selected Solution: Start Payload Server in Test Controller

**Justification**: This approach directly fixes the root cause with minimal risk and complexity. It follows the existing pattern already used for frontend server startup, reuses proven code patterns, and fits naturally into the current test infrastructure. The code changes are isolated to one file and don't require systemic refactoring.

**Technical Approach**:

1. **Identify when Payload startup is needed**: When test shards 7 or 8 are being executed (Payload CMS tests)
2. **Start Payload server on correct port**: Use existing backend server startup logic already in test controller (port 3020)
3. **Add health check for Payload**: Verify server is responding before allowing tests to proceed
4. **Ensure clean shutdown**: Integrate with existing server cleanup logic

**Architecture Changes**: None - fits within existing test controller architecture

**Migration Strategy**: No migration needed - this is a regression fix restoring functionality

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/infrastructure/test-controller-monolith.cjs` - Add Payload server startup detection and initialization
- `apps/e2e/tests/payload/playwright.config.ts` - Update webServer configuration to expect port 3021 (docker) or 3020 (host)
- `apps/e2e/scripts/verify-servers.sh` - Add Payload server health check

### New Files

- `.ai/ai_scripts/testing/infrastructure/payload-health-check.cjs` - Optional utility for isolated health checking (if needed)

### Step-by-Step Tasks

#### Step 1: Analyze Current Payload Server Configuration

Determine the correct port and startup configuration for Payload:

- Identify if Payload runs on port 3020 (host) or 3021 (docker)
- Review `apps/payload/package.json` for `dev:test` script
- Check `apps/payload/.env.test` for port configuration
- Verify docker-compose.test.yml Payload service configuration (port 3021)

**Why this step first**: Need correct port and startup command before writing code

#### Step 2: Add Payload Server Startup Logic

Modify test-controller-monolith.cjs to start Payload server:

- Add Payload server port check (already exists as `backendRunning` variable)
- Reuse existing backend server startup code (lines 1491-1548) for Payload
- Update port to 3021 for docker or check for correct host port
- Add stdout/stderr logging for Payload server startup
- Add error handling for Payload server failures
- Integrate with existing intentional shutdown flag

**Subtasks**:
- Copy backend server startup pattern (proven code)
- Update environment variables for Payload (NODE_ENV=test, PORT=3021)
- Add Payload-specific logging prefixes
- Connect to existing health check flow

#### Step 3: Update Playwright Configuration for Payload Tests

Modify Payload test playwright.config.ts:

- Verify webServer URL points to correct port (3021 for docker per docker-compose.test.yml)
- Ensure `reuseExistingServer: true` is set (already configured)
- Add timeout configuration if needed for slower Payload startup
- Update baseURL to use environment variable or fallback

**Subtasks**:
- Confirm PAYLOAD_PUBLIC_SERVER_URL environment variable usage
- Verify baseURL matches docker-compose configuration (3021)
- Test that playwright detects running server

#### Step 4: Add Payload Health Check

Ensure tests don't start until Payload is fully ready:

- Add Payload health endpoint check (e.g., http://localhost:3021/api/health or /admin)
- Reuse existing health check pattern from frontend
- Set appropriate timeout (Payload startup takes 30-60s)
- Log health check status for debugging

**Subtasks**:
- Identify correct Payload health endpoint
- Add to ensureServersHealthy() method
- Set reasonable timeout and retry logic
- Provide clear error messages if health check fails

#### Step 5: Test and Validate

Verify the fix works:

- Run Payload CMS E2E tests locally: `/test --shard 7,8`
- Verify Payload server starts automatically
- Verify tests connect to Payload successfully
- Verify no regressions in other test shards
- Check server cleanup on test completion

**Subtasks**:
- Run tests multiple times to ensure stability
- Verify server process cleanup
- Check for port conflicts
- Validate with both host-based and docker execution

## Testing Strategy

### Unit Tests

Not needed - this is infrastructure code with direct observable behavior

### Integration Tests

Add validation tests for:
- ✅ Payload server starts before tests run
- ✅ Health check passes when server is ready
- ✅ Tests can connect to Payload server
- ✅ Server cleanup happens on test completion
- ✅ Regression: Tests in shards 7-8 pass when Payload is running

**Test files**:
- Existing E2E test suite in `apps/e2e/tests/payload/` - Should pass without modifications

### E2E Tests

The existing Payload CMS E2E tests (shards 7-8) will validate the fix:

**Test coverage** (existing tests in `apps/e2e/tests/payload/`):
- Admin login flows
- Content management operations
- API interactions with Payload CMS
- Multi-browser testing

### Manual Testing Checklist

Execute these before considering the fix complete:

- [ ] Reset Supabase database: `pnpm supabase:web:reset`
- [ ] Run Payload E2E tests: `/test --shard 7,8` or run full `/test`
- [ ] Verify "Starting Payload server" message appears in logs
- [ ] Verify Payload server starts on correct port
- [ ] Verify tests connect successfully to Payload
- [ ] Verify all 77 Payload tests pass (previously 0/77)
- [ ] Run other test shards to ensure no regressions
- [ ] Check that server processes clean up after tests complete
- [ ] Verify no orphaned processes on port 3020/3021 after tests
- [ ] Test both sequential runs and multiple consecutive runs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Port Conflict with Host Payload Development Server**: If developer runs `pnpm --filter payload dev` while running tests
   - **Likelihood**: medium
   - **Impact**: medium - Tests would fail to start second server
   - **Mitigation**: Test controller already checks if port is in use and reuses existing server; add clear warning message if port is in use by different process

2. **Payload Server Startup Timeout**: Payload startup takes longer than expected, tests timeout waiting
   - **Likelihood**: low
   - **Impact**: high - All Payload tests would timeout
   - **Mitigation**: Increase timeout from default 30-60s, add detailed logging of startup progress

3. **Health Check Endpoint Not Available**: Payload health endpoint might not exist or might be different
   - **Likelihood**: low
   - **Impact**: medium - Tests would fail at health check
   - **Mitigation**: Verify correct endpoint, add fallback check (try multiple endpoints), catch 404 errors gracefully

4. **Process Cleanup Fails**: Payload process not properly cleaned up after tests
   - **Likelihood**: low
   - **Impact**: medium - Port remains occupied in subsequent test runs
   - **Mitigation**: Reuse existing cleanup pattern, test manual port cleanup command, add explicit kill signal handling

5. **Docker vs Host Startup Mismatch**: Different ports or startup commands for docker vs host execution
   - **Likelihood**: low
   - **Impact**: medium - Works in one environment but not the other
   - **Mitigation**: Verify configuration works with both `docker-compose up` and host-based `pnpm dev:test`, test both paths

**Rollback Plan**:

If this fix causes issues in production/CI:

1. Revert changes to test-controller-monolith.cjs
2. Restore manual Payload startup requirement: `cd apps/payload && pnpm dev:test` in separate terminal
3. Document as known limitation in E2E test documentation
4. Create issue to revisit Docker-based test infrastructure

**Monitoring** (if needed):

- Monitor Payload startup time in CI logs
- Track E2E test execution time (should not increase significantly)
- Alert if Payload health checks fail repeatedly

## Performance Impact

**Expected Impact**: minimal

- Payload server startup adds ~30-60s to test initialization (already required, just now automatic)
- No impact on test execution time once servers are running
- Overall: First test run slower (server startup), subsequent runs faster (reuse existing server)

**Performance Testing**:

```bash
# Measure first run (includes server startup)
time /test --shard 7,8

# Measure subsequent run (should reuse servers)
time /test --shard 7,8

# Should see ~30-60s time difference between first and second runs
```

## Security Considerations

**Security Impact**: none

- No new network endpoints exposed
- No credential handling changes
- Same Payload server configuration as manual startup
- Health checks are HTTP only (local environment only)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reset database
pnpm supabase:web:reset

# Run Payload E2E tests - should fail with ERR_CONNECTION_REFUSED
/test --shard 7,8

# Expected Result:
# - Tests fail immediately with "ERR_CONNECTION_REFUSED at http://localhost:3020/admin/login"
# - 0/31 tests pass in shard 7, 0/46 tests pass in shard 8
# - lsof -i :3020 returns empty (no Payload server running)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run Payload tests - should pass
/test --shard 7,8

# Expected Result: All 77 tests pass, Payload server starts automatically

# Verify server is running during tests
lsof -i :3020    # or :3021 for docker

# Manual verification - visit admin panel while tests run
curl http://localhost:3020/admin/login  # or 3021 for docker
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
/test

# Run other shards individually
/test --shard 1
/test --shard 2
# ... etc

# Verify port cleanup
ps aux | grep -E "payload|3020|3021" | grep -v grep
# Should return empty after tests complete
```

## Dependencies

### New Dependencies

**No new dependencies required** - Uses existing infrastructure and proven patterns

### Existing Dependencies

- Node.js child_process module (already used)
- Existing port checking utilities
- Existing health check patterns

## Database Changes

**No database changes required** - This is infrastructure code

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

- Works with existing test infrastructure
- No environment-specific configuration needed
- Same Payload configuration whether started manually or by test controller

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Existing manual Payload startup (`pnpm --filter payload dev:test`) continues to work
- Test controller detects running server and reuses it
- No breaking changes to test APIs or configurations

## Success Criteria

The fix is complete when:

- [x] All validation commands pass
- [x] Bug no longer reproduces (tests don't fail with ERR_CONNECTION_REFUSED)
- [x] All 77 Payload tests pass (31 in shard 7, 46 in shard 8)
- [x] Zero regressions in other test shards
- [x] Code review approved (if applicable)
- [x] Manual testing checklist complete
- [x] Payload server starts automatically (visible in test logs)
- [x] Health checks pass for Payload server
- [x] No orphaned processes after test completion
- [x] Works with both host-based and docker execution paths

## Notes

**Related Issues**:
- #370 - Previous Payload port configuration issue
- #376 - Previous webServer configuration mismatch
- #693 - This diagnosis issue

**Implementation Pattern**: The Payload server startup should closely mirror the existing backend server startup code (lines 1491-1548 in test-controller-monolith.cjs). This proven pattern includes:
- Process spawning with `spawn()` and `detached: true`
- Proper signal handling for graceful shutdown
- Health check integration
- Error logging and exit handling

**Debugging**: If Payload server fails to start, check:
1. Port 3020/3021 is not already in use: `lsof -i :3020`
2. `pnpm --filter payload dev:test` works manually
3. Environment variables are set correctly in test-controller
4. Payload dependencies are installed: `cd apps/payload && pnpm install`

**Future Improvements**:
- Consider migrating to full Docker-based test infrastructure for better isolation
- Add Payload server health metrics to test runner output
- Implement more granular timeout configuration per service

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #693*
