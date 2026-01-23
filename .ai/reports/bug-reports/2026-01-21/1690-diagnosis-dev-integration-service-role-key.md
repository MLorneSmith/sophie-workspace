# Bug Diagnosis: Dev Integration Tests Fail - Missing E2E_SUPABASE_SERVICE_ROLE_KEY

**ID**: ISSUE-pending
**Created**: 2026-01-21T15:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `dev-integration-tests.yml` workflow fails during global setup because `setupTestUsers()` requires the `E2E_SUPABASE_SERVICE_ROLE_KEY` environment variable to create/update test users via the Supabase Admin API. This key is not configured in the workflow, causing authentication errors ("Invalid API key") when attempting to use the admin API against the remote Supabase instance.

## Environment

- **Application Version**: dev branch (commit b661a31a9)
- **Environment**: CI (GitHub Actions)
- **Node Version**: v20.10.0
- **Database**: Remote Supabase (production-like)
- **Last Working**: Unknown - this appears to be a long-standing issue that was masked by other errors

## Reproduction Steps

1. Push code to `dev` branch
2. `Deploy to Dev` workflow completes successfully
3. `Dev Integration Tests` workflow triggers
4. Global setup runs and calls `setupTestUsers()`
5. `setupTestUsers()` uses the fallback demo service role key (line 5-7 of test-users.ts)
6. Supabase Admin API rejects the invalid key with "AuthApiError: Invalid API key"

## Expected Behavior

Test users should be created/updated in the remote Supabase instance before tests run, or the test user setup should be skipped when no service role key is available (similar to how billing cleanup is skipped).

## Actual Behavior

Tests fail during global setup with:
```
Failed to create user ***: AuthApiError: Invalid API key
    at handleError (@supabase/auth-js/src/lib/fetch.ts:102:9)
    ...
    at ensureTestUser (apps/e2e/tests/helpers/test-users.ts:99:35)
    at setupTestUsers (apps/e2e/tests/helpers/test-users.ts:124:2)
    at globalSetup (apps/e2e/global-setup.ts:485:3)
```

## Diagnostic Data

### Console Output
```
🔧 Setting up test users...
Failed to create user ***: AuthApiError: Invalid API key
    at handleError (.../@supabase/auth-js/src/lib/fetch.ts:102:9)
    at ensureTestUser (/apps/e2e/tests/helpers/test-users.ts:99:35)
    at async Promise.all (index 0)
    at setupTestUsers (/apps/e2e/tests/helpers/test-users.ts:124:2)
    at globalSetup (/apps/e2e/global-setup.ts:485:3)
{
  __isAuthError: true,
  status: 401,
  code: undefined
}
```

### Environment Analysis
```
# What e2e-sharded.yml provides (works):
E2E_SUPABASE_URL: extracted from local Supabase
E2E_SUPABASE_ANON_KEY: extracted from local Supabase
E2E_SUPABASE_SERVICE_ROLE_KEY: extracted from local Supabase  <-- KEY DIFFERENCE

# What dev-integration-tests.yml provides (fails):
E2E_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
E2E_SUPABASE_SERVICE_ROLE_KEY: NOT PROVIDED  <-- MISSING
```

### Code Analysis

**File**: `apps/e2e/tests/helpers/test-users.ts:5-7`
```typescript
const supabaseServiceKey =
  process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Local demo key fallback
```

The code falls back to a hardcoded local Supabase demo key when `E2E_SUPABASE_SERVICE_ROLE_KEY` is not set. This demo key is invalid for the remote Supabase instance.

**File**: `apps/e2e/global-setup.ts:481-492`
```typescript
// Create test users in Supabase before authentication
try {
  await setupTestUsers();  // <-- Always called, no environment check
} catch (error) {
  throw new Error(`Test user setup failed: ${(error as Error).message}...`);
}
```

Unlike `cleanupBillingTestData()` (line 359-369), `setupTestUsers()` is NOT conditionally skipped for CI with remote Supabase.

## Error Stack Traces
```
AuthApiError: Invalid API key
    at handleError (/node_modules/@supabase/auth-js/src/lib/fetch.ts:102:9)
    at _handleRequest (/node_modules/@supabase/auth-js/src/lib/fetch.ts:195:5)
    at _request (/node_modules/@supabase/auth-js/src/lib/fetch.ts:157:16)
    at GoTrueAdminApi.createUser (/node_modules/@supabase/auth-js/src/GoTrueAdminApi.ts:194:14)
    at ensureTestUser (/apps/e2e/tests/helpers/test-users.ts:99:35)
    at async Promise.all (index 0)
    at setupTestUsers (/apps/e2e/tests/helpers/test-users.ts:124:2)
    at globalSetup (/apps/e2e/global-setup.ts:485:3)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts:481-492` - Unconditionally calls `setupTestUsers()`
  - `apps/e2e/tests/helpers/test-users.ts:5-7` - Uses invalid fallback key
  - `.github/workflows/dev-integration-tests.yml` - Missing `E2E_SUPABASE_SERVICE_ROLE_KEY`
- **Recent Changes**: Issue #1684 fixed health check scoping but didn't address test user setup
- **Suspected Functions**: `setupTestUsers()`, `ensureTestUser()`

## Related Issues & Context

### Direct Predecessors
- #577 (CLOSED): "CI/CD: Integration tests fail due to missing test user provisioning in dev environment" - Same root cause, documented solution but not fully implemented
- #1684 (CLOSED): "Bug Fix: Dev Integration Tests Health Check Scope" - Fixed health checks but exposed this underlying issue

### Same Component
- #1603 (CLOSED): "E2E Sharded Tests Fail Due to Missing Test Users" - Similar issue for e2e-sharded
- #1689 (CLOSED): "E2E Shards Fail - Super-Admin User Not Created" - Related test user creation issue

### Historical Context
This is a recurring issue pattern. Issue #577 from November 2025 documented the exact same problem and proposed two solutions:
1. Quick fix: Manually provision test users and store passwords in GitHub Secrets
2. Automated fix: Add `E2E_SUPABASE_SERVICE_ROLE_KEY` secret and provisioning step

The automated fix was partially implemented but the `E2E_SUPABASE_SERVICE_ROLE_KEY` secret was never added to the workflow.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `dev-integration-tests.yml` workflow does not provide the `E2E_SUPABASE_SERVICE_ROLE_KEY` environment variable, causing `setupTestUsers()` to use an invalid fallback key that is rejected by the remote Supabase Admin API.

**Detailed Explanation**:
The `setupTestUsers()` function (called from `global-setup.ts:485`) uses the Supabase Admin API to create/update test users. This requires the service role key for authentication. The code has a fallback to a hardcoded local Supabase demo key, but this key is only valid for local development. When running in CI against a remote Supabase instance, this fallback key is invalid, resulting in "AuthApiError: Invalid API key".

The `e2e-sharded.yml` workflow extracts the service role key from a local Supabase instance and sets `E2E_SUPABASE_SERVICE_ROLE_KEY`. The `dev-integration-tests.yml` workflow tests against remote Supabase but doesn't provide this key.

**Supporting Evidence**:
- Stack trace shows error at `ensureTestUser()` → `createUser()` → Admin API call
- Error code 401 indicates authentication failure
- Workflow logs show `E2E_SUPABASE_SERVICE_ROLE_KEY` is not in the environment
- `e2e-sharded.yml` sets this key (lines 135, 354) and works correctly

### How This Causes the Observed Behavior

1. Workflow runs with `E2E_SUPABASE_URL` pointing to remote Supabase
2. `E2E_SUPABASE_SERVICE_ROLE_KEY` is not set in the environment
3. `test-users.ts:5-7` uses fallback: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` (local demo key)
4. `ensureTestUser()` creates a Supabase client with this invalid key
5. Admin API call to `createUser()` fails with 401 "Invalid API key"
6. `global-setup.ts:489-491` throws error, stopping all tests

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message "Invalid API key" directly indicates authentication failure
- The code path from `setupTestUsers()` → `ensureTestUser()` → Admin API is clear
- Comparing `e2e-sharded.yml` (works) vs `dev-integration-tests.yml` (fails) shows the exact missing variable
- Issue #577 documented this same problem with the same root cause

## Fix Approach (High-Level)

Two options:

**Option A (Recommended)**: Skip `setupTestUsers()` for CI with remote Supabase
- Add conditional check similar to `cleanupBillingTestData()` at line 359-369
- Test users must be pre-provisioned in the remote Supabase (one-time manual setup)
- No secrets management changes required

**Option B**: Add service role key to workflow
- Add `SUPABASE_SERVICE_ROLE_KEY` as a GitHub Secret (security-sensitive)
- Update workflow to pass `E2E_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}`
- Enables automatic test user provisioning

Option A is safer and simpler - the test users already exist in the remote Supabase from the seed data, they just don't need to be re-created on every test run.

## Diagnosis Determination

The root cause is confirmed: `dev-integration-tests.yml` does not provide `E2E_SUPABASE_SERVICE_ROLE_KEY`, causing `setupTestUsers()` to fail with "Invalid API key" when it tries to use the Supabase Admin API with an invalid fallback key.

The fix is straightforward: either skip `setupTestUsers()` for CI with remote Supabase (like billing cleanup is skipped), or add the service role key to the workflow. The former is recommended as it's simpler and doesn't require managing additional secrets.

## Additional Context

- Issue #1684 fixed health check scoping for CI with remote Supabase
- The same pattern (conditional skip for CI with remote Supabase) should be applied to `setupTestUsers()`
- Test users should already exist in the remote Supabase from initial seeding

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow runs, issue search), file reads (global-setup.ts, test-users.ts, workflow files), grep (environment variable search)*
