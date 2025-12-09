# Bug Diagnosis: Dev Integration Tests Fail Due to Environment Variable Mismatch in Health Check

**ID**: ISSUE-1017
**Created**: 2025-12-09T17:30:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The dev-integration-tests.yml workflow consistently fails because the `checkSupabaseHealth()` function in `server-health-check.ts` uses `NEXT_PUBLIC_SUPABASE_URL` (which falls back to `localhost:54321`), while the CI workflow only sets `E2E_SUPABASE_URL`. This causes the health check to attempt connecting to localhost, which is unreachable from the CI runner, failing all integration tests.

## Environment

- **Application Version**: dev branch (commit 3e4d4ab37)
- **Environment**: CI (GitHub Actions)
- **Node Version**: As configured in .nvmrc
- **Database**: Supabase (cloud instance)
- **Last Working**: Unknown - this appears to be a long-standing issue

## Reproduction Steps

1. Push a commit to the `dev` branch that triggers the "Deploy to Dev" workflow
2. Wait for the deployment to complete successfully
3. The "Dev Integration Tests" workflow is automatically triggered
4. Observe the "Integration Tests" job fails in the "Run integration test suite" step

## Expected Behavior

The health check should use the `E2E_SUPABASE_URL` environment variable (which contains the actual Supabase cloud URL) to verify Supabase connectivity before running tests.

## Actual Behavior

The health check uses `NEXT_PUBLIC_SUPABASE_URL` which is not set in the CI environment, causing it to fall back to `http://localhost:54321`. Since localhost is not reachable from the CI runner, the health check fails with "fetch failed".

## Diagnostic Data

### Console Output
```
📋 Server Health Check Results:
  ❌ Supabase: Supabase unreachable: fetch failed
  ❌ Next.js: Next.js returned status 401
  ⚠️ Payload: Payload unreachable: fetch failed

Error: ❌ Supabase health check failed: Supabase unreachable: fetch failed. Cannot proceed with auth setup.

   at ../global-setup.ts:217
```

### Network Analysis
The health check attempts to reach `http://localhost:54321/rest/v1/` which is unreachable from GitHub Actions runners.

### Environment Variables Analysis

**What the workflow sets:**
- `E2E_SUPABASE_URL`: Set to `${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}`
- `E2E_SUPABASE_ANON_KEY`: Set to `${{ env.SUPABASE_KEY || secrets.E2E_SUPABASE_ANON_KEY }}`

**What server-health-check.ts expects:**
```typescript
// Line 23-24 of server-health-check.ts
const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
```

**Inconsistency:** The health check uses `NEXT_PUBLIC_SUPABASE_URL`, but the workflow only provides `E2E_SUPABASE_URL`.

## Error Stack Traces
```
Error: ❌ Supabase health check failed: Supabase unreachable: fetch failed. Cannot proceed with auth setup.
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:217:9)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/utils/server-health-check.ts` (line 23-24) - Uses wrong environment variable
  - `.github/workflows/dev-integration-tests.yml` (lines 464-465) - Sets E2E_SUPABASE_URL but not NEXT_PUBLIC_SUPABASE_URL
  - `apps/e2e/global-setup.ts` (line 217) - Throws error when health check fails
- **Recent Changes**: The health check was added as "PHASE 1 FIX" for Issue #992
- **Suspected Functions**: `checkSupabaseHealth()` in server-health-check.ts

## Related Issues & Context

### Direct Predecessors
- #992 (CLOSED): "E2E Test Infrastructure Systemic Architecture Problems" - The health check was added as part of this fix but introduced the environment variable mismatch

### Similar Symptoms
- #319 (CLOSED): "[CI/CD] Dev Integration Tests Failing - Email Verification Fetch Error in Team Accounts Tests" - Similar category of CI test failures

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `checkSupabaseHealth()` function uses `NEXT_PUBLIC_SUPABASE_URL` instead of `E2E_SUPABASE_URL`, causing it to fall back to localhost in CI environments.

**Detailed Explanation**:
The server health check was added in Issue #992 to provide early warning when services are unhealthy. However, the implementation uses `NEXT_PUBLIC_SUPABASE_URL` (the standard Next.js client-side environment variable), while the E2E test infrastructure consistently uses `E2E_SUPABASE_URL` for test-specific Supabase configuration.

The workflow correctly sets `E2E_SUPABASE_URL` to the production Supabase instance URL, but `server-health-check.ts` looks for `NEXT_PUBLIC_SUPABASE_URL` which is never set in the CI environment. When the environment variable is missing, the code falls back to `http://localhost:54321` - a localhost address that is unreachable from the GitHub Actions runner.

**Supporting Evidence**:
- Log output: "❌ Supabase: Supabase unreachable: fetch failed"
- Code reference: `apps/e2e/tests/utils/server-health-check.ts:24` - `process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"`
- Workflow reference: `.github/workflows/dev-integration-tests.yml:464` - Only `E2E_SUPABASE_URL` is set
- All other E2E test files use `E2E_SUPABASE_URL`:
  - `apps/e2e/global-setup.ts:293`
  - `apps/e2e/tests/utils/e2e-validation.ts:26`
  - `apps/e2e/tests/authentication/auth.po.ts:466`
  - `apps/e2e/scripts/*.js`

### How This Causes the Observed Behavior

1. GitHub Actions runner starts the "Integration Tests" job
2. Environment variables are set, including `E2E_SUPABASE_URL` pointing to Supabase cloud
3. Playwright test runner starts and calls `global-setup.ts`
4. `global-setup.ts` calls `checkSupabaseHealth()` from `server-health-check.ts`
5. `checkSupabaseHealth()` reads `NEXT_PUBLIC_SUPABASE_URL` which is undefined
6. Falls back to `http://localhost:54321`
7. `fetch()` fails because localhost is not reachable from CI runner
8. Health check returns `healthy: false` with message "Supabase unreachable: fetch failed"
9. `global-setup.ts` throws error at line 217, aborting all tests

### Confidence Level

**Confidence**: High

**Reasoning**: The root cause is directly visible in the code and logs. The environment variable mismatch is clear - all other E2E code uses `E2E_SUPABASE_URL` while only `server-health-check.ts` uses `NEXT_PUBLIC_SUPABASE_URL`. The error message "fetch failed" combined with the fallback to localhost conclusively explains the failure.

## Fix Approach (High-Level)

Update `apps/e2e/tests/utils/server-health-check.ts` line 23-24 to use `E2E_SUPABASE_URL` instead of `NEXT_PUBLIC_SUPABASE_URL`, consistent with all other E2E test files:

```typescript
// Before
const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";

// After
const supabaseUrl =
    process.env.E2E_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
```

This maintains backward compatibility while prioritizing the E2E-specific environment variable.

## Diagnosis Determination

Root cause confirmed: Environment variable mismatch in `server-health-check.ts`. The file uses `NEXT_PUBLIC_SUPABASE_URL` while the CI workflow provides `E2E_SUPABASE_URL`. Fix requires updating the health check to prioritize `E2E_SUPABASE_URL`.

## Additional Context

- The workflow has been failing consistently (5+ consecutive failures visible in recent history)
- The "wait-for-deployment" job succeeds, confirming the Vercel deployment is healthy
- The "API Contract Tests" job also succeeds, further confirming the deployment is working
- Only the "Integration Tests" job fails, specifically during the Playwright global setup phase

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (run view, issue list), Read, Grep, Bash*
