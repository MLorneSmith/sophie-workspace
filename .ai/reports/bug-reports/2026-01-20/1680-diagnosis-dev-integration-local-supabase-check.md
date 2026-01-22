# Bug Diagnosis: Dev Integration Tests Failing Due to Local Supabase Health Check

**ID**: ISSUE-1680
**Created**: 2026-01-20T19:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `dev-integration-tests.yml` workflow is failing because commit `8403ad4a8` introduced enhanced Supabase health checks that attempt to connect to a local PostgreSQL instance (`localhost:54522`). However, this workflow tests against a **deployed Vercel environment** (e.g., `https://dev.slideheroes.com`) - there is no local Supabase running. The health check was designed for the `e2e-sharded.yml` workflow which DOES run local Supabase, but was incorrectly applied to ALL CI environments.

## Environment

- **Application Version**: dev branch, commit `8403ad4a8`
- **Environment**: CI (GitHub Actions)
- **Node Version**: v20.10.0
- **Database**: PostgreSQL (remote Supabase, NOT local)
- **Last Working**: 2026-01-20T21:53:13Z (run ID `21188612525`)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. Wait for "Deploy to Dev" workflow to complete
3. "Dev Integration Tests" workflow triggers automatically
4. Observe failure in "Integration Tests" job during global setup

## Expected Behavior

The dev-integration-tests workflow should:
1. Skip local Supabase health checks (no local DB is running)
2. Use the remote Supabase URL configured via `E2E_SUPABASE_URL` secret
3. Authenticate users via the remote Supabase API
4. Run integration tests against the deployed Vercel app

## Actual Behavior

The workflow fails with:
```
❌ Supabase health check failed: PostgreSQL health check failed: PostgreSQL unreachable:
```

The code in `global-setup.ts:371-375` checks `process.env.CI === "true"` and calls `waitForSupabaseHealth()` which tries to connect to `localhost:54522` - a database that doesn't exist in this workflow.

## Diagnostic Data

### Console Output
```
🔄 Using enhanced Supabase health checks (CI mode)...

=== Supabase Health Check Started ===

[2026-01-20T23:58:52.809Z] [Main] Configuration: {"postgresHost":"localhost","postgresPort":54522,"supabaseUrl":"***","hasAnonKey":true}
[2026-01-20T23:58:52.809Z] [PostgreSQL] Starting health check... {"host":"localhost","port":54522}
[2026-01-20T23:58:52.810Z] [PostgreSQL] Health check failed:

❌ PostgreSQL health check failed

--- Docker Containers (Supabase) ---
NAMES     STATUS    PORTS

--- Supabase Status ---
Supabase CLI not available or not running

Error: ❌ Supabase health check failed: PostgreSQL health check failed: PostgreSQL unreachable: . Cannot proceed with auth setup.
```

### Comparison: Last Successful Run (21188612525 at 21:53:13Z)
```
🏥 Running server health checks...

📋 Server Health Check Results:
  ✅ Supabase: Supabase healthy (15ms)
  ✅ Next.js: Next.js healthy (918ms)
  ⚠️ Payload: Payload unreachable: fetch failed
```

The successful run used the OLD health check logic which only checked the remote Supabase URL, NOT local PostgreSQL.

## Error Stack Traces
```
at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:399:9)

  397 | 		const errorMessage =
  398 | 			error instanceof Error ? error.message : "Unknown error";
> 399 | 		throw new Error(
      | 		      ^
  400 | 			`❌ Supabase health check failed: ${errorMessage}. Cannot proceed with auth setup.`,
  401 | 		);
  402 | 	}
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 371-402)
  - `apps/e2e/tests/setup/supabase-health.ts`
- **Recent Changes**: Commit `8403ad4a8` on 2026-01-20T17:56:47
- **Suspected Functions**:
  - `globalSetup()` in `apps/e2e/global-setup.ts:371-402`
  - `waitForSupabaseHealth()` in `apps/e2e/tests/setup/supabase-health.ts`

## Related Issues & Context

### Direct Predecessors
- #1641: E2E Sharded Workflow Dual Failure Modes diagnosis
- #1642: Implementation of enhanced health checks for e2e-sharded workflow

### Historical Context
The enhanced health checks were correctly designed for the `e2e-sharded.yml` workflow which runs local Supabase. However, the condition `process.env.CI === "true"` is too broad - it applies to ALL CI environments including `dev-integration-tests.yml` which uses remote Supabase.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The condition `process.env.CI === "true"` in `global-setup.ts:372` incorrectly triggers local PostgreSQL health checks for the `dev-integration-tests` workflow, which doesn't run local Supabase.

**Detailed Explanation**:

In `apps/e2e/global-setup.ts:371-375`:
```typescript
if (process.env.CI === "true") {
    console.log("🔄 Using enhanced Supabase health checks (CI mode)...");
    await waitForSupabaseHealth();
}
```

The `waitForSupabaseHealth()` function in `apps/e2e/tests/setup/supabase-health.ts:39-47` uses hardcoded local defaults:
```typescript
const POSTGRES_HOST = process.env.E2E_POSTGRES_HOST || "localhost";
const POSTGRES_PORT = Number.parseInt(process.env.E2E_POSTGRES_PORT || "54522", 10);
```

The `dev-integration-tests.yml` workflow:
1. Does NOT set `E2E_POSTGRES_HOST` or `E2E_POSTGRES_PORT`
2. Does NOT run local Supabase containers
3. Tests against the remote deployed environment using `E2E_SUPABASE_URL`

**Supporting Evidence**:
- Error log shows: `"postgresHost":"localhost","postgresPort":54522`
- Docker containers output shows: `NAMES     STATUS    PORTS` (empty - no containers)
- Last successful run (before commit `8403ad4a8`) used the old health check path

### How This Causes the Observed Behavior

1. Workflow triggers after "Deploy to Dev" completes
2. `global-setup.ts` runs for Playwright test setup
3. Code checks `process.env.CI === "true"` (always true in GitHub Actions)
4. Calls `waitForSupabaseHealth()` which tries to connect to `localhost:54522`
5. No local PostgreSQL exists → connection refused
6. Health check fails → tests abort

### Confidence Level

**Confidence**: High

**Reasoning**:
- The exact timing of failure correlates with commit `8403ad4a8`
- Error message clearly shows attempt to connect to `localhost:54522`
- Docker container list is empty confirming no local Supabase
- Last successful run used different code path (before the commit)

## Fix Approach (High-Level)

The fix needs to distinguish between CI workflows that run local Supabase (e2e-sharded) vs those testing remote deployments (dev-integration-tests). Options:

1. **Use a dedicated environment variable** (Recommended): Add `E2E_LOCAL_SUPABASE=true` to e2e-sharded.yml and check for it instead of just `CI === "true"`

2. **Check for presence of E2E_POSTGRES_HOST**: Only run local health checks if `E2E_POSTGRES_HOST` is explicitly set

3. **Invert the logic**: Run local health checks only when NOT testing against a remote URL (when `PLAYWRIGHT_BASE_URL` includes localhost)

Option 1 is cleanest because it's explicit and doesn't rely on URL parsing heuristics.

## Diagnosis Determination

**Root cause confirmed**: The enhanced Supabase health check logic added in commit `8403ad4a8` incorrectly assumes all CI environments run local Supabase. The `dev-integration-tests` workflow tests against deployed Vercel environments with remote Supabase, but the code attempts to connect to `localhost:54522` which doesn't exist.

**Fix**: Modify the condition at `apps/e2e/global-setup.ts:372` to check for a more specific flag like `E2E_LOCAL_SUPABASE=true` rather than just `CI=true`.

## Additional Context

The e2e-sharded workflow already sets `E2E_LOCAL_SUPABASE: true` (added in issue #1626), so the fix just needs to use this existing variable instead of `CI === "true"`.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, git log, git show, git diff, Read*
