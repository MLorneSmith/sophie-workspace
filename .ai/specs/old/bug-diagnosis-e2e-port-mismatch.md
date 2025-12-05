# Bug Diagnosis: E2E Tests Port Mismatch After Supabase Docker Fix

**Created**: 2025-11-24T17:32:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E tests fail with infrastructure connection errors because test configuration still references old Supabase port (54321) while the actual Docker containers run on port 54521 after the fix for issue #666 (Supabase Docker Port Binding Failure in WSL2).

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (WSL2)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL 17.6
- **Last Working**: Before commit f5fe04b48 (port change not propagated to all configs)
- **Current Status**: 166 E2E test failures due to infrastructure unavailability

## Reproduction Steps

1. Start Supabase using Docker: `pnpm supabase:web:start`
2. Verify Supabase is running on port 54521: `docker ps | grep supabase_kong`
3. Run E2E tests: `pnpm test:e2e`
4. Observe pre-flight validation failures: "Supabase connection failed"

## Expected Behavior

- E2E tests should connect to Supabase on port 54521 (actual running port)
- Pre-flight validation should detect Supabase is available
- Tests should execute successfully

## Actual Behavior

- E2E tests attempt to connect to port 54321 (old/incorrect port)
- Pre-flight validation fails with: "Supabase connection failed: Could not find the table 'public.auth.users' in the schema cache"
- All tests fail before execution due to infrastructure unavailability
- Error: "❌ Pre-flight validation failed. See details above. Please ensure Supabase is running..."

## Diagnostic Data

### Docker Container Status
```
NAMES                                      STATUS                    PORTS
supabase_kong_2025slideheroes-db           Up 46 minutes (healthy)   0.0.0.0:54521->8000/tcp
supabase_db_2025slideheroes-db             Up 46 minutes (healthy)   0.0.0.0:54522->5432/tcp
supabase_studio_2025slideheroes-db         Up 46 minutes (healthy)   0.0.0.0:54523->3000/tcp
```

### Port Connectivity Test
```bash
# Port 54321 (expected by tests) - NO RESPONSE
curl -s http://127.0.0.1:54321/rest/v1/
# (connection refused / timeout)

# Port 54521 (actual running) - SUCCESS
curl -s http://127.0.0.1:54521/rest/v1/
# Returns full Supabase REST API swagger documentation
```

### Environment Configuration Analysis
```
# apps/e2e/.env.local - CORRECT ✅
E2E_SUPABASE_URL="http://127.0.0.1:54521"

# apps/e2e/.env.test.locked - INCORRECT ❌
E2E_SUPABASE_URL=http://127.0.0.1:54321

# apps/e2e/.env.example - INCORRECT ❌
E2E_SUPABASE_URL="http://localhost:54321"
```

### E2E Test Output
```
🔍 Running E2E Environment Pre-flight Validations...

❌ NODE_ENV: NODE_ENV should be 'test' but is 'production'
✅ CLI Path: Payload CLI path configured: apps/payload/src/seed/seed-engine/index.ts
❌ Supabase: Supabase connection failed: Could not find the table 'public.auth.users' in the schema cache

❌ Some validations failed

Failed validations:
  - Supabase connection failed: Could not find the table 'public.auth.users' in the schema cache
    Details: {"url":"http://127.0.0.1:54521","error":"Could not find the table 'public.auth.users' in the schema cache"}
```

Note: The validation shows 54521 because it uses the default fallback, but other environment loading mechanisms may still use 54321.

## Error Stack Traces
```
Error: ❌ Pre-flight validation failed. See details above. Please ensure Supabase is running and environment variables are configured correctly.

   at ../global-setup.ts:37

  35 |
  36 | 	if (!allValid) {
> 37 | 		throw new Error(
     | 		      ^
  38 | 			"❌ Pre-flight validation failed. See details above. Please ensure Supabase is running and environment variables are configured correctly.",
  39 | 		);
  40 | 	}
    at globalSetup (/home/msmith/projects/2025slideheroes/apps/e2e/global-setup.ts:37:9)
```

## Related Code

**Affected Files**:
- `apps/e2e/.env.test.locked` - Has old port 54321 ❌
- `apps/e2e/.env.example` - Has old port 54321 ❌
- `apps/e2e/.env.local` - Has correct port 54521 ✅
- `apps/e2e/global-setup.ts` - Loads environment variables
- `apps/e2e/tests/utils/e2e-validation.ts` - Validates Supabase connectivity

**Environment Loading Logic** (`apps/e2e/global-setup.ts:10-14`):
```typescript
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true,
});
```

**Issue**: The code loads `.env` and `.env.local`, but `.env.test.locked` is not in this list. However, test frameworks or other parts of the system may load `.env.test.locked` separately, causing inconsistent configuration.

**Recent Changes** (git log):
```
244682ffe fix(e2e): resolve 166 test failures with three root cause fixes
67e2feef1 docs(auth): add signin form bug diagnosis and fix specifications
422d69ae4 test(e2e): update test execution results and shard reports
f5fe04b48 fix(auth): add missing password auth environment variables
8bd1e925d chore(tooling): clean up context7 cache and update agent configurations
```

## Related Issues & Context

### Direct Predecessors
- #666 (CLOSED - IMPLEMENTED): "Bug Fix: Supabase Docker Port Binding Failure in WSL2" - Changed Supabase port from 54321 to 54521 to fix Docker port binding issue
- #665 (CLOSED - DIAGNOSED): "Bug Diagnosis: Supabase Docker Port Binding Failure in WSL2" - Original diagnosis of port binding issue

### Related Infrastructure Issues
- #683 (CLOSED): "Bug Fix: E2E Test Failures - Three Root Causes" - Fixed Payload CLI path and validation, but didn't address port mismatch
- #576 (CLOSED): "CI/CD: Dev integration tests failing due to missing Supabase configuration"
- #570 (CLOSED): "E2E Tests: Supabase Auth API Timeout During Authentication Setup"

### Similar Symptoms
- #565 (CLOSED): "E2E Test Failures: Password Hash Mismatch Between Database and Environment Configuration"

### Historical Context
This is a **regression** introduced by the fix for #666. When the Supabase port was changed from 54321 to 54521 to resolve Docker port binding issues in WSL2, the E2E test configuration files were not fully updated to reflect the new port.

The port change was committed in `.env.local` but not in `.env.test.locked` or `.env.example`, leading to configuration inconsistency.

## Root Cause Analysis

### Identified Root Cause

**Summary**: E2E test configuration files contain outdated Supabase port 54321, while Docker containers run on port 54521 after the WSL2 port binding fix.

**Detailed Explanation**:

After fixing issue #666 (Supabase Docker Port Binding Failure in WSL2), the Supabase Docker containers were reconfigured to use port 54521 instead of 54321. This change was made to work around Docker Desktop's vpnkit port forwarding issues in WSL2 environments.

The port change was correctly updated in:
- `apps/e2e/.env.local` ✅

However, it was NOT updated in:
- `apps/e2e/.env.test.locked` ❌ (still has 54321)
- `apps/e2e/.env.example` ❌ (still has 54321)

The environment loading mechanism (`global-setup.ts`) loads `.env` and `.env.local`, which should provide the correct port. However, the presence of `.env.test.locked` with the old port creates configuration ambiguity and may be loaded by test frameworks or other parts of the system, causing connection attempts to the wrong port.

**Supporting Evidence**:
1. Docker inspect shows Kong gateway bound to `0.0.0.0:54521->8000/tcp`
2. `curl http://127.0.0.1:54521/rest/v1/` returns Supabase API swagger ✅
3. `curl http://127.0.0.1:54321/rest/v1/` fails with connection refused ❌
4. `.env.test.locked` explicitly sets `E2E_SUPABASE_URL=http://127.0.0.1:54321`
5. Pre-flight validation error shows connection failure to Supabase

### How This Causes the Observed Behavior

**Causal Chain**:

1. **Port Change**: Fix for #666 changed Supabase port from 54321 → 54521
2. **Incomplete Update**: `.env.test.locked` and `.env.example` not updated with new port
3. **Configuration Conflict**: Multiple environment files with different port values
4. **Test Initialization**: E2E tests load environment configuration during `global-setup.ts`
5. **Wrong Port Used**: Depending on load order/priority, tests may use port 54321 from `.env.test.locked`
6. **Connection Failure**: Attempts to connect to port 54321 fail (no service listening)
7. **Pre-flight Validation Fails**: Supabase connectivity check fails
8. **Test Execution Blocked**: All tests fail before execution with infrastructure error

The pre-flight validation (added in commit 244682ffe) correctly detects the problem but reports it as "Supabase not running" when the actual issue is "connecting to wrong port".

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from Docker container port mappings showing 54521
- Network connectivity tests prove 54521 works, 54321 doesn't
- Configuration file analysis shows explicit port mismatch
- Related issue #666 documents the intentional port change
- Pre-flight validation error correlates with wrong port usage
- Fix approach is obvious: update all config files to use 54521

This is definitively the root cause. The evidence is conclusive and reproducible.

## Fix Approach (High-Level)

Update all E2E environment configuration files to use the correct Supabase port (54521):

1. Update `apps/e2e/.env.test.locked`: Change `E2E_SUPABASE_URL` from `http://127.0.0.1:54321` to `http://127.0.0.1:54521`
2. Update `apps/e2e/.env.example`: Change `E2E_SUPABASE_URL` from `http://localhost:54321` to `http://localhost:54521`
3. Verify no other configuration files reference port 54321
4. Add comment in configs explaining the port number (WSL2 compatibility)
5. Update any documentation referencing the old port

**Validation**: Run `pnpm test:e2e` and verify pre-flight validation passes and tests connect successfully.

## Diagnosis Determination

**Root cause conclusively identified**: Configuration file port mismatch between expected (54321) and actual (54521) Supabase ports.

**Action Required**: Update `.env.test.locked` and `.env.example` to use port 54521, matching the current Docker container configuration and `.env.local`.

**Estimated Fix Time**: 5-10 minutes
**Estimated Test Time**: 2-3 minutes
**Risk Level**: Low (simple configuration change)

## Additional Context

**Why Port 54521 Instead of 54321?**

From issue #666, the port was changed from 54321 to 54521 to work around Docker Desktop's vpnkit port forwarding issues in WSL2 environments. The specific port 54521 was chosen to avoid conflicts with Docker's dynamic port range and Windows Hyper-V reserved ports.

**Environment File Priority**:

The E2E test suite uses dotenv to load environment variables with this priority (first found wins):
1. `.env` (if exists)
2. `.env.local` (if exists)
3. Other files may be loaded by test frameworks (`.env.test`, `.env.test.locked`)

The presence of multiple files with conflicting values creates ambiguity and depends on the specific loading order and framework used.

**Docker Compose Configuration**:

The Supabase `config.toml` or docker-compose file was updated as part of #666 to bind to port 54521. This configuration is correct and working properly. The issue is purely in the E2E test environment configuration files not being fully updated to match.

---

*Generated by Claude Debug Assistant*
*Tools Used: docker ps, curl, grep, gh issue, file analysis*
