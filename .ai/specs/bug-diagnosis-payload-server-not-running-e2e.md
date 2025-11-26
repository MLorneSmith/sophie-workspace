# Bug Diagnosis: E2E Payload CMS Tests Failing - Server Not Running

**ID**: ISSUE-693
**Created**: 2025-11-25T19:10:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: infrastructure

## Summary

All Payload CMS E2E tests (77 tests across shards 7 and 8) are failing with `ERR_CONNECTION_REFUSED` errors because the Payload server is not running during E2E test execution. The test controller checks for Payload on port 3020 but doesn't start it, and no manual server startup was performed before running tests. This is a regression of previously fixed issues #370 and #376.

## Environment

- **Application Version**: fae2efd14 (dev branch)
- **Environment**: development (local test execution)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL via Supabase (port 54522)
- **Last Working**: Unknown (issue may have been dormant)

## Reproduction Steps

1. Reset Supabase database: `pnpm supabase:web:reset`
2. Run comprehensive test suite: `/test` command
3. Observe Payload CMS tests (shards 7-8) failing with connection refused
4. Verify no Payload process running: `lsof -i :3020` returns empty

## Expected Behavior

The test infrastructure should either:
1. Start the Payload server automatically before running Payload-specific tests, OR
2. Skip Payload tests if the server is not available, OR
3. Clearly indicate in pre-flight checks that Payload server is required

## Actual Behavior

- All 77 Payload CMS tests fail with `ERR_CONNECTION_REFUSED at http://localhost:3020/admin/login`
- Test controller infrastructure check passes without validating Payload availability
- Tests run and fail rather than being skipped or blocked

## Diagnostic Data

### Console Output
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3020/admin/login
  - navigating to "http://localhost:3020/admin/login", waiting until "load"

Error: apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:3020
  - GET http://localhost:3020/api/health
```

### Port Analysis
```bash
$ lsof -i :3020
# (empty - no process)

$ lsof -i :3021
# (empty - no process)

$ ps aux | grep -E "payload|next.*3020" | grep -v grep
# No Payload processes found
```

### Test Results
```json
{
  "name": "Payload CMS",
  "passed": 0,
  "failed": 31,
  "skipped": 0,
  "timedOut": false,
  "duration": "22s"
}
{
  "name": "Payload CMS Extended",
  "passed": 0,
  "failed": 46,
  "skipped": 6,
  "timedOut": false,
  "duration": "28s"
}
```

## Error Stack Traces
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3020/admin/login
    at PayloadLoginPage.navigateToLogin (apps/e2e/tests/payload/pages/PayloadLoginPage.ts:35:3)
    at apps/e2e/tests/payload/payload-auth.spec.ts:14:17
```

## Related Code

### Affected Files
- `.ai/ai_scripts/testing/infrastructure/test-controller-monolith.cjs` (line 59-62, 1378, 1421)
- `apps/e2e/tests/payload/playwright.config.ts` (line 15-16)
- `apps/e2e/tests/payload/pages/PayloadBasePage.ts` (line 19-20)
- `apps/e2e/scripts/verify-servers.sh` (line 69)
- `apps/payload/package.json` (dev vs dev:test commands)

### Port Configuration Inconsistency
| Location | Expected Port | Actual Default |
|----------|---------------|----------------|
| `test-controller-monolith.cjs` | 3020 | N/A (hardcoded) |
| `verify-servers.sh` | 3020 | N/A (hardcoded) |
| `apps/payload/package.json` `dev` | 3020 | N/A |
| `apps/payload/package.json` `dev:test` | 3021 | N/A |
| `playwright.config.ts` (payload) | 3021 | PAYLOAD_PUBLIC_SERVER_URL |
| `PayloadBasePage.ts` | 3021 | PAYLOAD_PUBLIC_SERVER_URL |
| `.env.development` | 3020 | PAYLOAD_PUBLIC_SERVER_URL |
| `.env.test` | 3021 | PAYLOAD_PUBLIC_SERVER_URL |

### Recent Changes
No recent commits directly affecting Payload test infrastructure. Issue appears to be a latent configuration problem.

### Suspected Functions
- `InfrastructureChecker.checkAll()` - doesn't validate Payload server availability
- `TestController.startTestServers()` - checks port 3020 but doesn't start Payload

## Related Issues & Context

### Direct Predecessors (Same Problem)
- **#370** (CLOSED): "E2E Tests: Payload CMS port mismatch causing shard 7 failures" - Identical port mismatch issue
- **#376** (CLOSED): "E2E Payload Tests Failing (Shard 7) - WebServer Configuration Mismatch" - Same root cause

### Historical Context
This appears to be a **regression** of previously fixed issues. The port configuration drift between 3020 (development) and 3021 (test) was identified and supposedly addressed, but the fix was incomplete:
1. Port configurations were updated in some places but not all
2. Test infrastructure still expects manual Payload server startup
3. No automation to start Payload server during test execution

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test infrastructure does not start the Payload CMS server before running Payload-specific E2E tests, and no manual server startup was performed.

**Detailed Explanation**:
The test execution fails because of a missing dependency - the Payload CMS server must be running for Payload E2E tests to execute. The test controller (`test-controller-monolith.cjs`) has infrastructure checks that validate Supabase and the web frontend, but:

1. **No automatic Payload startup**: The test controller checks if Payload is running on port 3020 (line 1421) but doesn't start it if missing
2. **Silent failure**: When Payload is not running, tests proceed anyway and fail at runtime
3. **Port confusion**: Historical issues caused inconsistent port configuration (3020 vs 3021) across different files

**Code Reference**:
```javascript
// test-controller-monolith.cjs:1421
const backendRunning = await this.isServerRunning(3020);
// If false, nothing happens - tests proceed and fail
```

**Supporting Evidence**:
- `lsof -i :3020` returns empty (no Payload process)
- All 77 Payload tests fail with `ERR_CONNECTION_REFUSED`
- Test output shows attempts to connect to `http://localhost:3020/admin/login`

### How This Causes the Observed Behavior

1. User runs `/test` command
2. Test controller runs infrastructure checks (Supabase, web server)
3. Payload server is NOT checked as a hard requirement
4. E2E tests start executing
5. Shards 7 and 8 attempt to run Payload tests
6. Tests try to navigate to `http://localhost:3020/admin/login`
7. No server is listening on port 3020
8. TCP connection refused, tests fail immediately

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct verification that no Payload process is running
- Error messages explicitly state "ERR_CONNECTION_REFUSED"
- Port 3020 confirmed empty via `lsof`
- Test controller code shows no Payload startup logic
- Historical issues #370 and #376 document the same problem

## Fix Approach (High-Level)

Two complementary fixes are needed:

1. **Immediate**: Add Payload server startup to test infrastructure
   - Modify `test-controller-monolith.cjs` to start Payload server if E2E tests include Payload shards
   - Use `pnpm --filter payload dev:test` to start on port 3021
   - Wait for health check at `/api/health` before proceeding

2. **Port Standardization**: Unify port configuration
   - Standardize on port 3021 for test mode across all configurations
   - Update `verify-servers.sh` line 69: change 3020 to 3021
   - Update test controller CONFIG.ports.payload to 3021

## Diagnosis Determination

The root cause is definitively identified: **The Payload CMS server is not running, and the test infrastructure doesn't start it automatically.**

This is a regression of issues #370 and #376. The previous fixes addressed port configuration but didn't implement automatic server startup. The test infrastructure assumes the developer has manually started the Payload server, which is an undocumented prerequisite.

## Additional Context

### Immediate Workaround
Before running tests, manually start the Payload server:
```bash
cd apps/payload && pnpm dev:test
# Wait for "Ready on http://localhost:3021"
# Then run tests in another terminal
```

### Test Shard Impact
- **Shard 7**: 31 failures (payload-auth, payload-collections, payload-database)
- **Shard 8**: 46 failures (extended payload tests + seeding)
- **Total**: 77 test failures (100% of Payload tests)

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Grep, Read, gh CLI*
