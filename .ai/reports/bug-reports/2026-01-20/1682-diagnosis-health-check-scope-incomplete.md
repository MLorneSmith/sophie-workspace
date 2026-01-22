# Bug Diagnosis: Dev Integration Tests Still Failing - Health Check Scope Fix Incomplete

**ID**: ISSUE-pending
**Created**: 2026-01-20T00:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests workflow continues to fail after implementing issue #1681. The fix was incomplete - it correctly scoped the enhanced health checks (`waitForSupabaseHealth()`) to local Supabase workflows, but the `else` branch still runs direct PostgreSQL health checks that attempt to connect to `localhost:54522`, which doesn't exist in remote Supabase environments.

## Environment

- **Application Version**: HEAD (546a9cab4)
- **Environment**: CI (GitHub Actions)
- **Workflow**: dev-integration-tests.yml
- **Node Version**: v20.10.0
- **Last Working**: Before commit 8403ad4a8 (ci: integrate RunsOn fixes and enhanced health checks)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. Wait for "Deploy to Dev" workflow to complete
3. Observe "Dev Integration Tests" workflow runs
4. Global setup fails with "PostgreSQL unreachable" error

## Expected Behavior

The dev-integration-tests workflow should skip ALL local PostgreSQL health checks since it uses remote Supabase (via `E2E_SUPABASE_URL` secret pointing to production/dev Supabase instance).

## Actual Behavior

The global-setup.ts enters the `else` branch (because `E2E_LOCAL_SUPABASE` is not set) and attempts to run `checkPostgresHealth()` which connects to `localhost:54522`. This fails because there is no local PostgreSQL - the workflow uses remote Supabase.

## Diagnostic Data

### Console Output

```
🔧 Global Setup: Creating authenticated browser states via API...

🔍 Running E2E Environment Pre-flight Validations...

📋 Environment Diagnostics:
   NODE_ENV: test
   CI: true
   PLAYWRIGHT_BASE_URL: https://2025slideheroes-mk7ng2zh5-slideheroes.vercel.app
   E2E_SUPABASE_URL: ***
   Platform: linux
   Node version: v20.10.0

✅ NODE_ENV: NODE_ENV is correctly set to 'test'
✅ CLI Path: Payload CLI path configured: apps/payload/src/seed/seed-engine/index.ts
[supabase-config-loader] Failed to fetch config: spawnSync /bin/bash ENOENT. Using fallback values.
✅ Supabase: Supabase connection validated successfully

✅ All validations passed

🧹 Cleaning up billing test data...
⚠️  Failed to cleanup billing test data: connect ECONNREFUSED 127.0.0.1:54522

🏥 Running server health checks...

[2026-01-21T00:33:09.200Z] [PostgreSQL] Starting health check... {"host":"localhost","port":54522}
[2026-01-21T00:33:09.200Z] [PostgREST] Starting health check... {"url":"***/rest/v1/"}
[2026-01-21T00:33:09.202Z] [PostgreSQL] Health check failed:
[2026-01-21T00:33:09.267Z] [PostgREST] Health check passed in 67ms {"status":200}

Error: ❌ Supabase health check failed: PostgreSQL health check failed: PostgreSQL unreachable: . Cannot proceed with auth setup.
```

### Key Observations

1. `E2E_LOCAL_SUPABASE` is NOT set in the workflow environment
2. Pre-flight validations pass (Supabase connection via API works)
3. PostgREST health check PASSES (remote Supabase is accessible)
4. PostgreSQL direct connection FAILS (no local PostgreSQL at localhost:54522)
5. Billing cleanup also fails for the same reason (tries localhost:54522)

## Error Stack Traces

```
Error: ❌ Supabase health check failed: PostgreSQL health check failed: PostgreSQL unreachable: . Cannot proceed with auth setup.

   at ../global-setup.ts:402

  400 | 		const errorMessage =
  401 | 			error instanceof Error ? error.message : "Unknown error";
> 402 | 		throw new Error(
      | 		      ^
  403 | 			`❌ Supabase health check failed: ${errorMessage}. Cannot proceed with auth setup.`,
  404 | 		);
  405 | 	}
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 371-405)
  - `apps/e2e/tests/setup/supabase-health.ts` (checkPostgresHealth function)
- **Recent Changes**:
  - `546a9cab4` - fix(e2e): scope health checks to local Supabase workflows only (INCOMPLETE FIX)
  - `8403ad4a8` - ci: integrate RunsOn fixes and enhanced health checks (INTRODUCED REGRESSION)
- **Suspected Functions**:
  - `globalSetup()` in global-setup.ts lines 371-405
  - `checkPostgresHealth()` in supabase-health.ts

## Related Issues & Context

### Direct Predecessors
- #1681 (CLOSED): "Bug Fix: Dev Integration Tests Failing Due to Incorrect Health Check Environment Scope" - The fix attempted to address this but was incomplete
- #1680: Original diagnosis for this regression

### Same Component
- #1641, #1642: Original health check implementation with exponential backoff
- #1626: Added E2E_LOCAL_SUPABASE flag for exactly this purpose

### Historical Context
The health checks were introduced in #1641/#1642 to handle Supabase startup delays in CI. Issue #1681 correctly identified that the `CI === "true"` condition was too broad, but the fix only addressed the `waitForSupabaseHealth()` call, not the fallback `else` branch.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The fix in issue #1681 was incomplete - the `else` branch at line 379 still runs direct PostgreSQL health checks for non-local-Supabase environments, including remote Supabase workflows.

**Detailed Explanation**:

The code at `global-setup.ts:371-405` has this structure:

```typescript
if (process.env.E2E_LOCAL_SUPABASE === "true") {
    // Local Supabase: run full health checks including direct PostgreSQL
    await waitForSupabaseHealth();
} else {
    // THIS ELSE BRANCH IS THE BUG
    // Comment says "local development" but executes for ALL non-local-Supabase environments
    // Including dev-integration-tests.yml which uses REMOTE Supabase
    const [postgresResult, postgrestResult] = await Promise.all([
        checkPostgresHealth(5000),   // <-- FAILS: tries localhost:54522
        checkPostgRESTHealth(5000),
    ]);

    if (!postgresResult.healthy) {
        throw new Error(`PostgreSQL health check failed: ${postgresResult.message}`);
    }
    // ...
}
```

The `else` branch assumes "not local Supabase" means "local development with Supabase running locally". But it's actually triggered for:
1. Local development (Supabase on localhost - works)
2. **dev-integration-tests.yml** (remote Supabase - FAILS)

The `dev-integration-tests.yml` workflow:
- Sets `E2E_SUPABASE_URL` to remote Supabase (from secrets)
- Does NOT set `E2E_LOCAL_SUPABASE`
- Has NO local PostgreSQL running
- Uses Vercel deployments that connect to remote Supabase

**Supporting Evidence**:
- Log shows: `[PostgreSQL] Starting health check... {"host":"localhost","port":54522}`
- Log shows: `[PostgREST] Health check passed` (remote Supabase API works)
- Failure: `PostgreSQL unreachable` (no local PostgreSQL exists)
- Environment: `CI: true`, `E2E_LOCAL_SUPABASE` not set

### How This Causes the Observed Behavior

1. dev-integration-tests.yml triggers after dev deployment
2. Workflow sets `CI=true` but NOT `E2E_LOCAL_SUPABASE`
3. global-setup.ts enters the `else` branch at line 379
4. `checkPostgresHealth()` tries to connect to `localhost:54522`
5. Connection fails (no local PostgreSQL)
6. Error thrown: "PostgreSQL health check failed: PostgreSQL unreachable"
7. Workflow fails at global setup stage

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The log output clearly shows PostgreSQL check running on localhost:54522
2. The PostgREST check (which uses remote URL from E2E_SUPABASE_URL) passes
3. The code path is deterministic based on E2E_LOCAL_SUPABASE environment variable
4. The workflow does not set E2E_LOCAL_SUPABASE (confirmed by reading workflow file)

## Fix Approach (High-Level)

The `else` branch needs to distinguish between:
1. **Local development** (Supabase running locally) - run direct PostgreSQL checks
2. **Remote Supabase workflows** (dev-integration-tests.yml) - skip direct PostgreSQL checks, only use API-based checks

Options:
1. **Skip direct PostgreSQL checks entirely in CI with remote Supabase**: If `CI === "true"` AND `E2E_LOCAL_SUPABASE !== "true"`, only run PostgREST API health check (which already passes)
2. **Add explicit remote Supabase detection**: Check if E2E_SUPABASE_URL points to a remote host (not localhost/127.0.0.1)

Recommended approach: Option 1 - In CI environments without local Supabase, rely solely on PostgREST API health check since direct PostgreSQL access is not available.

Additionally, the `cleanupBillingTestData()` function at line 249 has the same issue - it tries to connect to `localhost:54522` unconditionally and should be wrapped in a similar check.

## Diagnosis Determination

The root cause is definitively identified: The fix in issue #1681 was incomplete. The `else` branch in the health check logic still attempts direct PostgreSQL connections even for remote Supabase environments. The fix needs to be extended to skip direct PostgreSQL health checks when running in CI without local Supabase.

## Additional Context

The cleanupBillingTestData() function also fails for the same reason but with a less severe impact (it catches and logs the error rather than failing). However, it should also be fixed to avoid unnecessary connection attempts.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh issue view, gh run list, gh run view --log-failed, Read (global-setup.ts, supabase-health.ts, dev-integration-tests.yml)*
