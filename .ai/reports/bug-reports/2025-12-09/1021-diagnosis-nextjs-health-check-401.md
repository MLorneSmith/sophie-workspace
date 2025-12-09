# Bug Diagnosis: Next.js Health Check Returns 401 in CI Due to Missing Vercel Bypass Header

**ID**: ISSUE-pending (will update after GitHub issue creation)
**Created**: 2025-12-09T18:00:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The dev-integration-tests.yml workflow fails because the `checkNextJsHealth()` function in `server-health-check.ts` does not include the `x-vercel-protection-bypass` header when checking the deployed Next.js application. This causes the health check to receive a 401 Unauthorized response from Vercel's deployment protection, failing all integration tests even though the deployment is healthy.

## Environment

- **Application Version**: dev branch (commit 4c889c1e2)
- **Environment**: CI (GitHub Actions)
- **Affected Workflow**: dev-integration-tests.yml
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown (ongoing issue)

## Reproduction Steps

1. Push a commit to the dev branch that triggers the Deploy to Dev workflow
2. Wait for the deployment to complete successfully
3. The Dev Integration Tests workflow is automatically triggered
4. The `wait-for-deployment` job passes (it uses the bypass header correctly)
5. The `integration-tests` job starts and runs the Playwright global setup
6. Global setup calls `checkNextJsHealth()` which does NOT include bypass header
7. Health check receives 401 from Vercel protection
8. Tests fail with: "Next.js health check failed: Next.js returned status 401"

## Expected Behavior

The `checkNextJsHealth()` function should include the `VERCEL_AUTOMATION_BYPASS_SECRET` header when running in CI, allowing it to pass through Vercel's deployment protection and verify the Next.js application is healthy.

## Actual Behavior

The health check sends a bare HTTP request without the bypass header:

```typescript
const response = await fetch(baseUrl, {
  method: "HEAD",
  signal: controller.signal,
  redirect: "manual",
});
```

This results in a 401 response from Vercel's deployment protection, causing the test suite to fail.

## Diagnostic Data

### Console Output

```
Server Health Check Results:
  ✅ Supabase: Supabase healthy (26ms)
  ❌ Next.js: Next.js returned status 401
  ⚠️ Payload: Payload unreachable: fetch failed

Error: ❌ Next.js health check failed: Next.js returned status 401. Cannot proceed with tests.
   at ../global-setup.ts:223
```

### Network Analysis

The health check URL is correctly set to the Vercel deployment:
- `PLAYWRIGHT_BASE_URL: https://2025slideheroes-4del94yam-slideheroes.vercel.app`

But the bypass header is NOT included in the fetch request.

### Environment Variables Available

The CI environment has `VERCEL_AUTOMATION_BYPASS_SECRET` set (masked in logs), but the health check function does not read or use it.

## Error Stack Traces

```
Error: ❌ Next.js health check failed: Next.js returned status 401. Cannot proceed with tests.
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:223:9)
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/utils/server-health-check.ts` (lines 78-126)
  - `apps/e2e/global-setup.ts` (lines 203-226)

- **Recent Changes**:
  - `ebf78fcc5` fix(e2e): prioritize E2E_SUPABASE_URL in health check (fixed Supabase, not Next.js)
  - `cab4ed598` fix(e2e): improve test runner stability and server health checks

- **Suspected Functions**:
  - `checkNextJsHealth()` - Missing `x-vercel-protection-bypass` header
  - `checkPayloadHealth()` - Same issue (missing bypass header)

## Related Issues & Context

### Direct Predecessors

- #1017 (CLOSED): "Bug Diagnosis: Dev Integration Tests Fail Due to Environment Variable Mismatch in Health Check" - Similar issue but for Supabase URL
- #1018 (CLOSED): "Bug Fix: Environment Variable Mismatch in Health Check" - Fixed Supabase, same pattern needed for Next.js

### Same Component

- #992 (CLOSED): "Bug Fix: E2E Test Infrastructure Systemic Architecture Problems" - Health checks were added as part of this fix
- #590 (CLOSED): "CI/CD: Dev Integration Tests Failing - Authentication State & Deployment Readiness Issues"

### Historical Context

The health check utility was recently added in #992 to provide early failure detection. The `checkSupabaseHealth()` function was subsequently fixed in #1017/#1018 to use the correct environment variable. However, the `checkNextJsHealth()` and `checkPayloadHealth()` functions were not updated to include the Vercel bypass header, which is required for accessing protected deployments in CI.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `checkNextJsHealth()` function does not include the `x-vercel-protection-bypass` header, causing Vercel's deployment protection to return 401.

**Detailed Explanation**:
The dev deployment (`dev.slideheroes.com` and its direct Vercel URLs) is protected by Vercel Deployment Protection. To access the deployment programmatically in CI, requests must include the `x-vercel-protection-bypass` header with the `VERCEL_AUTOMATION_BYPASS_SECRET` value.

The workflow's `wait-for-deployment` job correctly includes this header (lines 139-142 in dev-integration-tests.yml):
```bash
RESPONSE=$(curl -s --max-time 30 \
  -H "x-vercel-protection-bypass: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}" \
  "$HEALTH_URL" 2>/dev/null) || RESPONSE=""
```

However, when Playwright's global setup runs, it calls `checkNextJsHealth()` which makes a bare fetch request without any headers:
```typescript
const response = await fetch(baseUrl, {
  method: "HEAD",
  signal: controller.signal,
  redirect: "manual", // Don't follow redirects
});
```

**Supporting Evidence**:
- Log shows Supabase check passes (Supabase is not behind Vercel protection)
- Log shows Next.js returns 401 (protected deployment without bypass)
- `VERCEL_AUTOMATION_BYPASS_SECRET` is set in environment but not used by health check
- Similar issue was fixed for Supabase in #1017/#1018 (different root cause, same pattern)

### How This Causes the Observed Behavior

1. Deploy to Dev workflow completes successfully
2. Dev Integration Tests workflow triggers
3. `wait-for-deployment` job passes (uses bypass header correctly)
4. `integration-tests` job starts
5. Playwright global setup runs `checkNextJsHealth()`
6. Health check sends request WITHOUT bypass header
7. Vercel returns 401 Unauthorized
8. Health check reports `healthy: false`
9. Global setup throws error and aborts all tests

### Confidence Level

**Confidence**: High

**Reasoning**:
- The 401 status code is specifically returned by Vercel's deployment protection
- The `wait-for-deployment` job passes using the same URL with the bypass header
- The Supabase health check passes (not behind Vercel protection)
- The code clearly shows `checkNextJsHealth()` does not include any headers
- This is a deterministic bug - will fail 100% of the time in CI

## Fix Approach (High-Level)

Update `checkNextJsHealth()` to include the `x-vercel-protection-bypass` header when `VERCEL_AUTOMATION_BYPASS_SECRET` is available:

```typescript
const headers: HeadersInit = {};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

const response = await fetch(baseUrl, {
  method: "HEAD",
  signal: controller.signal,
  redirect: "manual",
  headers,
});
```

The same fix should be applied to `checkPayloadHealth()` for consistency, using `VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD` if available.

## Diagnosis Determination

**Root cause confirmed**: The `checkNextJsHealth()` function in `server-health-check.ts` does not include the Vercel deployment protection bypass header, causing 401 responses in CI environments.

**Fix is straightforward**: Add conditional header inclusion when the bypass secret is available in the environment. This matches the pattern already used successfully in the workflow's `wait-for-deployment` job and in Playwright's browser context configuration.

## Additional Context

This bug affects every dev-integration-tests.yml run since the health checks were added in #992. The fix is low-risk (adding an optional header) and maintains backward compatibility (local development doesn't require bypass headers).

The same issue likely affects the Payload health check, which also shows "fetch failed" - though this could be a DNS issue with the Payload URL. The Payload fix should use `VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD` if available.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh issue list, Read, Grep, Bash*
