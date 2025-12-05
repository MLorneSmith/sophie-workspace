# Bug Diagnosis: Dev Integration Tests Fail with host.docker.internal DNS Error

**ID**: ISSUE-pending
**Created**: 2025-12-04T20:45:00Z
**Reporter**: system (GitHub Actions workflow failure)
**Severity**: high
**Status**: new
**Type**: integration

## Summary

The dev-integration-tests.yml workflow fails during E2E global setup because `global-setup.ts` tries to resolve `host.docker.internal` when setting the Supabase session. This Docker-specific hostname doesn't exist in the GitHub Actions runner environment, causing a DNS lookup failure (`ENOTFOUND host.docker.internal`).

## Environment

- **Application Version**: dev branch, commit 6f49ed305
- **Environment**: CI (GitHub Actions)
- **Node Version**: 22.x
- **Last Working**: 2025-12-03T21:56:12Z (run 19910122456)

## Reproduction Steps

1. Push code to dev branch
2. Deploy to Dev workflow triggers and completes successfully
3. Dev Integration Tests workflow triggers automatically
4. Workflow reaches "Run integration test suite" step
5. Global setup fails when attempting to set Supabase session

## Expected Behavior

The E2E global setup should use the deployed Supabase instance URL (from `E2E_SUPABASE_URL`) for both authentication AND cookie naming when running against a remote Vercel deployment.

## Actual Behavior

The global setup uses:
- `E2E_SUPABASE_URL` for authentication (correct - uses production Supabase)
- `host.docker.internal:54521` for cookie naming (broken - Docker URL doesn't exist in CI)

This causes `@supabase/ssr` client to attempt DNS resolution of `host.docker.internal`, which fails in GitHub Actions.

## Diagnostic Data

### Console Output
```
🔧 Global Setup: Creating authenticated browser states via API...

🔍 Running E2E Environment Pre-flight Validations...

✅ NODE_ENV: NODE_ENV is correctly set to 'test'
✅ CLI Path: Payload CLI path configured: apps/payload/src/seed/seed-engine/index.ts
[supabase-config-loader] Failed to fetch config: spawnSync /bin/sh ENOENT. Using fallback values.
✅ Supabase: Supabase connection validated successfully

✅ All validations passed

🌐 Using BASE_URL: https://2025slideheroes-ffwgbumj9-slideheroes.vercel.app
🔗 Using Supabase Auth URL: ***
🍪 Using Supabase Cookie URL: http://host.docker.internal:54521 (for cookie naming)
```

### Error Stack Trace
```
TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11730:11)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at _handleRequest (/home/runner/_work/.../node_modules/@supabase/auth-js/src/lib/fetch.ts:184:14)
    at _request (/home/runner/_work/.../node_modules/@supabase/auth-js/src/lib/fetch.ts:157:16)
    at SupabaseAuthClient._getUser (/home/runner/_work/.../node_modules/@supabase/auth-js/src/GoTrueClient.ts:1717:16)
    at SupabaseAuthClient._setSession (/home/runner/_work/.../node_modules/@supabase/auth-js/src/GoTrueClient.ts:1875:33)
  cause: Error: getaddrinfo ENOTFOUND host.docker.internal
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:118:26) {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'host.docker.internal'
  }
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 188-194, 402, 424)
  - `.github/workflows/dev-integration-tests.yml` (lines 464-465)
- **Recent Changes**: None directly; this appears to be a configuration gap from initial setup
- **Suspected Functions**:
  - `globalSetup()` in `global-setup.ts`
  - `ssrClient.auth.setSession()` call at line 424

## Related Issues & Context

### Direct Predecessors
- #876 (CLOSED): "Bug Diagnosis: Playwright authentication fails due to Supabase cookie name mismatch" - Same root cause (cookie URL mismatch), but for local Docker vs dev server scenario
- #878 (CLOSED): "Bug Fix: Playwright authentication cookie mismatch with Supabase URLs" - Fixed local scenario but didn't address CI integration test scenario

### Historical Context
Issue #878 added a warning for port 3000 usage and standardized on Docker for local E2E tests. However, the CI integration test workflow runs against deployed Vercel environments, not local Docker - a scenario not covered by that fix.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `global-setup.ts` uses a separate `supabaseCookieUrl` variable that defaults to Docker's `host.docker.internal:54521` when `E2E_SERVER_SUPABASE_URL` is not set, causing SSR client to fail DNS lookup in GitHub Actions.

**Detailed Explanation**:

The global-setup.ts file has two separate Supabase URL configurations:

```typescript
// Line 188-189: For authentication (works correctly)
const supabaseAuthUrl =
    process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54521";

// Line 193-194: For cookie naming (BROKEN in CI)
const supabaseCookieUrl =
    process.env.E2E_SERVER_SUPABASE_URL || "http://host.docker.internal:54521";
```

The workflow sets `E2E_SUPABASE_URL` but NOT `E2E_SERVER_SUPABASE_URL`:

```yaml
# dev-integration-tests.yml lines 464-465
E2E_SUPABASE_URL: ${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ env.SUPABASE_KEY || secrets.E2E_SUPABASE_ANON_KEY }}
```

When `ssrClient.auth.setSession()` is called at line 424, it uses the `supabaseCookieUrl` to create the SSR client. The `@supabase/ssr` library internally makes API calls to this URL (for `_getUser`), which fails because `host.docker.internal` doesn't resolve in GitHub Actions.

**Supporting Evidence**:
- Log shows: `🍪 Using Supabase Cookie URL: http://host.docker.internal:54521`
- Error clearly states: `hostname: 'host.docker.internal'`
- Code at `global-setup.ts:193-194` shows the fallback to Docker URL
- Workflow at `dev-integration-tests.yml:464-465` doesn't set `E2E_SERVER_SUPABASE_URL`

### How This Causes the Observed Behavior

1. Workflow starts E2E tests against deployed Vercel app
2. Global setup initializes with correct `E2E_SUPABASE_URL` for auth
3. Global setup uses fallback `host.docker.internal:54521` for cookie URL (E2E_SERVER_SUPABASE_URL not set)
4. Auth via `supabaseAuthUrl` succeeds (connects to production Supabase)
5. `ssrClient` creation uses `supabaseCookieUrl` (Docker URL)
6. `ssrClient.auth.setSession()` internally calls `_getUser()` against Docker URL
7. DNS lookup fails → `ENOTFOUND host.docker.internal`
8. Test suite exits with code 1

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message explicitly states the failing hostname (`host.docker.internal`)
- The code clearly shows the fallback logic that causes this
- The workflow env vars clearly show `E2E_SERVER_SUPABASE_URL` is not set
- The fix is obvious and testable

## Fix Approach (High-Level)

Two options:

**Option A (Quick Fix - Workflow)**: Add `E2E_SERVER_SUPABASE_URL` to the workflow:
```yaml
E2E_SERVER_SUPABASE_URL: ${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}
```

**Option B (Better Fix - Code)**: Update `global-setup.ts` to use `E2E_SUPABASE_URL` as the fallback for cookie URL when running in CI (detected by `process.env.CI === 'true'`):
```typescript
const supabaseCookieUrl =
    process.env.E2E_SERVER_SUPABASE_URL ||
    (process.env.CI === 'true' ? supabaseAuthUrl : "http://host.docker.internal:54521");
```

Recommended: **Option B** - makes the code smarter about CI environments without requiring workflow changes.

## Diagnosis Determination

The root cause is definitively identified: Missing `E2E_SERVER_SUPABASE_URL` environment variable in CI workflow, combined with a Docker-specific fallback in `global-setup.ts` that doesn't account for CI environments running against remote deployments.

## Additional Context

- The workflow previously passed (2025-12-03T21:56:12Z) likely because the earlier runs didn't reach this code path or had different configuration
- This issue affects only the dev-integration-tests.yml workflow, not local E2E tests or PR validation tests
- The fix should maintain backward compatibility with local Docker testing

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, Grep, Read, gh issue list, gh issue view*
