# Bug Diagnosis: E2E Sharded Workflow JWT Secret Mismatch

**ID**: ISSUE-pending
**Created**: 2026-01-20T15:40:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The e2e-sharded workflow fails on shards that require authentication (shards 2-11) because the workflow uses hardcoded HS256-based JWT keys while fresh Supabase instances generate ES256-based keys. This causes `AuthApiError: invalid JWT: signing method HS256 is invalid` when the globalSetup tries to create test users.

## Environment

- **Application Version**: dev branch (commit 5f7539780)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20.10.0
- **Supabase CLI**: latest
- **Last Working**: Tests work locally but fail in CI

## Reproduction Steps

1. Push code to dev branch triggering e2e-sharded workflow
2. Each shard runs `supabase start` which generates new ES256-based JWT keys
3. Tests attempt to use hardcoded HS256-based service role key from workflow env vars
4. Supabase Auth API rejects the JWT with "signing method HS256 is invalid"
5. Test user creation fails, causing authentication tests to fail

## Expected Behavior

Test users should be created successfully in globalSetup, allowing authentication tests to pass.

## Actual Behavior

- globalSetup runs correctly (fix from #1609 is working)
- Test user creation fails with: `AuthApiError: invalid JWT: unable to parse or verify signature, token signature is invalid: signing method HS256 is invalid`
- Authentication tests fail with 400 errors (invalid credentials) because users don't exist

## Diagnostic Data

### Console Output
```
E2E Shard 6	Run E2E tests for shard 6	2026-01-20T15:08:28.9306924Z Failed to create user test1@slideheroes.com: AuthApiError: invalid JWT: unable to parse or verify signature, token signature is invalid: signing method HS256 is invalid
    at handleError (.../node_modules/@supabase/auth-js/src/lib/fetch.ts:102:9)
    at _handleRequest (.../node_modules/@supabase/auth-js/src/lib/fetch.ts:195:5)
    at GoTrueAdminApi.createUser (.../node_modules/@supabase/auth-js/src/GoTrueAdminApi.ts:194:14)
    at ensureTestUser (.../apps/e2e/tests/helpers/test-users.ts:76:35)
    at globalSetup (.../apps/e2e/global-setup.ts:399:3)
```

### Key Algorithm Mismatch Evidence

**Hardcoded keys in workflow (HS256):**
```json
{"alg":"HS256","typ":"JWT"}
```

**Fresh Supabase instance keys (ES256):**
```json
{"alg":"ES256","kid":"b81269f1-21d8-4f2e-b719-c2240a840d90","typ":"JWT"}
```

### Environment Variables Set in Workflow
```yaml
# .github/workflows/e2e-sharded.yml (lines 127-129)
SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  # HS256
NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  # HS256
SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  # HS256
```

### Supabase Status Output in CI
```
│ 🔑 Authentication Keys                                       │
├─────────────┬────────────────────────────────────────────────┤
│ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
│ Secret      │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz      │
```
These are ES256-based keys that don't match the hardcoded HS256 keys.

## Error Stack Traces
```
AuthApiError: invalid JWT: unable to parse or verify signature, token signature is invalid: signing method HS256 is invalid
  __isAuthError: true,
  status: 403,
  code: 'bad_jwt'
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (lines 127-129) - hardcoded JWT keys
  - `apps/e2e/tests/helpers/test-users.ts` (lines 5-7) - fallback to hardcoded key
  - `apps/e2e/global-setup.ts` (line 399) - calls setupTestUsers()
- **Recent Changes**: #1609 added globalSetup to playwright.auth.config.ts (correct fix)
- **Suspected Functions**: `ensureTestUser()` in test-users.ts

## Related Issues & Context

### Direct Predecessors
- #1609 (CLOSED): "Bug Fix: E2E Auth Config Missing globalSetup" - Added globalSetup (correct), but JWT mismatch not addressed
- #1608 (CLOSED): "Bug Diagnosis: E2E Sharded Missing globalSetup" - Original diagnosis

### Similar Symptoms
- #935 (CLOSED): "Supabase Status Output Parsing Failure in CI" - Related to Supabase key handling
- #360 (CLOSED): "E2E Test Suite Status: Authentication Failures Across Multiple Shards"
- #1500 (CLOSED): "Sandbox Supabase Database Not Created - Invalid Credentials" - Similar credential mismatch

### Historical Context
E2E authentication issues have occurred multiple times due to environment variable mismatches between hardcoded values and dynamically generated Supabase credentials. This is a recurring pattern.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The e2e-sharded workflow uses hardcoded HS256-based JWT keys, but each shard's fresh Supabase instance generates ES256-based keys, causing a signing algorithm mismatch.

**Detailed Explanation**:
1. The workflow (`e2e-sharded.yml`) sets hardcoded JWT keys using the "supabase-demo" HS256 format (lines 127-129)
2. Each shard runs `supabase start` which generates a fresh Supabase instance with its own ES256-based JWT secrets
3. The `test-users.ts` file uses `SUPABASE_SERVICE_ROLE_KEY` env var (HS256) to authenticate admin API calls
4. Supabase Auth rejects the HS256 JWT because the instance expects ES256 signatures
5. Test user creation fails, causing all authentication-dependent tests to fail

**Supporting Evidence**:
- Error message: `signing method HS256 is invalid` - explicitly states algorithm mismatch
- JWT header comparison shows HS256 (hardcoded) vs ES256 (fresh instance)
- Shard 1 (smoke tests without globalSetup) passes; Shards 2+ (with globalSetup) fail

### How This Causes the Observed Behavior

1. Workflow sets `SUPABASE_SERVICE_ROLE_KEY` to HS256-based demo key
2. Shard starts Supabase, generating ES256 keys (ignoring env var)
3. globalSetup runs and calls `setupTestUsers()`
4. `test-users.ts` creates Supabase client with HS256 service role key
5. Supabase Auth API validates JWT signature using ES256 secret
6. Signature validation fails → `bad_jwt` error
7. Test users not created → login tests get 400 "invalid credentials"

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message explicitly states "signing method HS256 is invalid"
- JWT header comparison confirms algorithm mismatch
- Shard 1 passes (no globalSetup/auth needed), Shard 2+ fails (auth needed)
- Same tests pass locally where Supabase keys are consistent

## Fix Approach (High-Level)

**Option A (Recommended)**: After `supabase start`, extract the actual keys using `supabase status -o env` and export them as environment variables:
```bash
# After supabase start
eval $(supabase status -o env | grep -E "ANON_KEY|SERVICE_ROLE_KEY")
export SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
```

**Option B**: Configure Supabase to use fixed JWT secrets via `.env.local` or config.toml (if supported).

## Diagnosis Determination

Root cause is definitively identified: JWT signing algorithm mismatch between hardcoded HS256 keys in workflow and ES256 keys generated by fresh Supabase instances. The fix requires dynamically extracting keys after `supabase start` instead of using hardcoded values.

## Additional Context
- This is separate from #1609 which correctly added globalSetup
- The globalSetup is now running (verified in logs), but failing due to JWT mismatch
- Local tests work because the local Supabase instance uses consistent keys

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs), Grep, Read, Bash (JWT decoding)*
