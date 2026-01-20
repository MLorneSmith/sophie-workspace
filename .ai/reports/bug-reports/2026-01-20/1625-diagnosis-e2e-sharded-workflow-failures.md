# Bug Diagnosis: E2E Sharded Workflow Fails Despite #1609 and #1621 Fixes

**ID**: ISSUE-1625
**Created**: 2026-01-20T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E sharded workflow (`e2e-sharded.yml`) continues to fail on multiple shards despite implementing fixes from Issues #1609 (globalSetup missing) and #1621 (JWT key extraction). Two distinct root causes were identified: (1) environment variable naming mismatch causing JWT key fallback to HS256, and (2) a localhost validation check blocking CI execution.

## Environment

- **Application Version**: Latest on dev branch
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (local Supabase)
- **Last Working**: Tests work locally but fail in CI

## Reproduction Steps

1. Push changes to the `dev` branch or create a PR
2. E2E Sharded workflow triggers automatically
3. Setup Server job succeeds (builds app, extracts JWT keys)
4. Individual shard jobs fail with two errors:
   - `AuthApiError: invalid JWT: signing method HS256 is invalid`
   - `Error: CI environment detected but BASE_URL points to localhost!`

## Expected Behavior

All E2E shards should run successfully using the dynamically extracted ES256 JWT keys from the local Supabase instance.

## Actual Behavior

Shards fail immediately in `globalSetup` with:
1. JWT authentication errors when creating test users
2. Localhost validation error blocking test execution

## Diagnostic Data

### Console Output
```
Failed to create user test2@slideheroes.com: AuthApiError: invalid JWT: unable to parse or verify signature, token signature is invalid: signing method HS256 is invalid
    at handleError (/home/runner/_work/2025slideheroes/2025slideheroes/node_modules/.pnpm/@supabase+auth-js@2.86.2/node_modules/@supabase/auth-js/src/lib/fetch.ts:102:9)
...
Error: CI environment detected but BASE_URL points to localhost! Check PLAYWRIGHT_BASE_URL environment variable.
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:415:9)
```

### Workflow Run Analysis
- Run ID: 21176977637
- Job Status:
  - Setup Test Server: **success**
  - E2E Shard 1: **success** (smoke tests - no auth required)
  - E2E Shard 2-7: **failure** (auth required)
  - E2E Shard 8-12: **cancelled** (fail-fast not set, but timed out)

## Error Stack Traces
```
AuthApiError: invalid JWT: unable to parse or verify signature, token signature is invalid: signing method HS256 is invalid
    at handleError (node_modules/.pnpm/@supabase+auth-js@2.86.2/node_modules/@supabase/auth-js/src/lib/fetch.ts:102:9)

Error: CI environment detected but BASE_URL points to localhost! Check PLAYWRIGHT_BASE_URL environment variable.
    at globalSetup (apps/e2e/global-setup.ts:415:9)
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` - JWT key extraction step
  - `apps/e2e/tests/helpers/test-users.ts` - Test user creation
  - `apps/e2e/global-setup.ts` - Localhost validation check

- **Recent Changes**:
  - Issue #1609 fixed globalSetup configuration
  - Issue #1621 added JWT key extraction

- **Suspected Functions**:
  - `setupTestUsers()` in test-users.ts - uses wrong env variable name
  - Localhost validation check in global-setup.ts line 414-418

## Related Issues & Context

### Direct Predecessors
- #1609 (CLOSED): "Bug Fix: E2E Auth Config Missing globalSetup" - Added globalSetup to playwright.auth.config.ts
- #1621 (CLOSED): "Bug Fix: E2E Sharded Workflow JWT Secret Mismatch" - Added JWT key extraction from Supabase
- #1615: Diagnosis for JWT mismatch issue

### Same Component
- #1608: Original diagnosis of globalSetup issue
- #1603: globalSetup was missing from main Playwright config

### Historical Context
Issues #1609 and #1621 addressed the symptom (JWT mismatch) but the fix was incomplete. The environment variable exported by the workflow doesn't match the variable name expected by test-users.ts.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two independent issues cause the E2E sharded workflow to fail: (1) environment variable naming mismatch for JWT service role key, and (2) an overly restrictive localhost validation check.

**Detailed Explanation**:

**Issue 1: Environment Variable Naming Mismatch**

The workflow extracts JWT keys correctly and exports them to `$GITHUB_ENV`:
```yaml
# .github/workflows/e2e-sharded.yml lines 281-283
echo "SUPABASE_ANON_KEY=$ANON_KEY" >> $GITHUB_ENV
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY" >> $GITHUB_ENV
echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> $GITHUB_ENV
```

However, `test-users.ts` looks for a **different** environment variable name:
```typescript
// apps/e2e/tests/helpers/test-users.ts lines 5-7
const supabaseServiceKey =
    process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||  // Looks for E2E_ prefix!
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";   // Falls back to HS256 key
```

Since `E2E_SUPABASE_SERVICE_ROLE_KEY` is never set, the code falls back to the hardcoded HS256 key. But modern Supabase generates ES256 keys, causing the JWT validation to fail with "signing method HS256 is invalid".

**Issue 2: Localhost Validation Check**

The `global-setup.ts` has a validation that throws an error when running in CI with a localhost baseURL:
```typescript
// apps/e2e/global-setup.ts lines 414-418
if (baseURL?.includes("localhost") && process.env.CI === "true") {
    throw new Error(
        "CI environment detected but BASE_URL points to localhost! Check PLAYWRIGHT_BASE_URL environment variable.",
    );
}
```

This check was added in commit `c86cf00f6` (Issue #1518) to prevent running CI tests against localhost when testing **deployed environments**. However, the e2e-sharded workflow **intentionally** runs against localhost (it starts Supabase locally on each shard). This check blocks the legitimate use case.

**Supporting Evidence**:
1. Local Supabase generates ES256 keys: `supabase status -o env` shows `ANON_KEY="eyJhbGciOiJFUzI1NiIs..."`
2. Workflow exports `SUPABASE_SERVICE_ROLE_KEY` but test-users.ts expects `E2E_SUPABASE_SERVICE_ROLE_KEY`
3. CI logs show fallback to HS256: `signing method HS256 is invalid`
4. CI logs show localhost validation: `CI environment detected but BASE_URL points to localhost!`

### How This Causes the Observed Behavior

1. E2E shard starts, restores build artifacts
2. Supabase starts locally, generates ES256 JWT keys
3. Workflow extracts keys to `SUPABASE_SERVICE_ROLE_KEY`
4. Playwright runs globalSetup
5. `setupTestUsers()` is called
6. `test-users.ts` looks for `E2E_SUPABASE_SERVICE_ROLE_KEY` (not set!)
7. Falls back to hardcoded HS256 key
8. Supabase rejects HS256 key: "signing method HS256 is invalid"
9. Even if users were created, localhost validation throws error
10. Test fails before any actual tests run

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence of variable name mismatch (`E2E_` prefix vs no prefix)
- CI logs confirm both error messages occur
- Local tests pass because they use the fallback appropriately or have correct env vars
- The code paths are clear and traceable

## Fix Approach (High-Level)

**Fix 1: Add missing E2E_ prefixed environment variables to workflow**

Add these lines to the "Extract Supabase JWT keys" step in e2e-sharded.yml:
```yaml
echo "E2E_SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> $GITHUB_ENV
echo "E2E_SUPABASE_ANON_KEY=$ANON_KEY" >> $GITHUB_ENV
```

**Fix 2: Update localhost validation to allow sharded workflow**

Modify the check in global-setup.ts to skip when running local Supabase tests:
```typescript
// Skip localhost check when E2E_LOCAL_SUPABASE is set (for sharded workflow)
if (baseURL?.includes("localhost") && process.env.CI === "true" && !process.env.E2E_LOCAL_SUPABASE) {
    throw new Error(...);
}
```

Then add `E2E_LOCAL_SUPABASE: "true"` to the workflow env.

Alternatively, remove the check entirely since the webServer conditional already handles deployed vs local environments.

## Diagnosis Determination

The root causes have been definitively identified:

1. **JWT Key Mismatch**: Environment variable naming inconsistency between workflow (`SUPABASE_SERVICE_ROLE_KEY`) and test code (`E2E_SUPABASE_SERVICE_ROLE_KEY`)

2. **Localhost Validation**: Overly restrictive check in global-setup.ts that blocks legitimate localhost usage in the sharded workflow

Both issues are simple configuration/code mismatches that can be fixed with minimal changes.

## Additional Context

- Tests pass locally because they use `.env` files with correct variable names
- The fix from Issue #1621 was correct in extracting keys but incomplete in exporting all required variable names
- The localhost validation was designed for a different CI workflow pattern (testing deployed environments)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Grep, Read, Bash*
