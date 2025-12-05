# Bug Diagnosis: E2E Shard 3 Test Mutates Password Without Restoration

**ID**: ISSUE-TBD (will be assigned after GitHub issue creation)
**Created**: 2025-11-26T21:30:00Z
**Reporter**: Claude Code (automated diagnosis)
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E Shard 3 (Personal Accounts) tests fail with "Invalid login credentials" because a previous test run executed `account.spec.ts::user can update their password` which changed the test user's password to a random value without restoring it. Subsequent test runs fail authentication in global-setup because the database password no longer matches the expected seed password (`aiesec1992`).

## Environment

- **Application Version**: SlideHeroes (dev branch)
- **Environment**: Local development
- **Node Version**: 22.x
- **Database**: PostgreSQL 15.8 (Supabase local, port 54522)
- **Branch**: dev
- **Last Commit**: `055617fd7 fix(e2e): align cookie URL with Docker server for auth session recognition`
- **Last Working**: Before 2025-11-26T20:28:55Z (when password was changed)

## Reproduction Steps

1. Start Supabase: `pnpm supabase:web:start`
2. Start dev server: `pnpm dev`
3. Run E2E Shard 3: `/test 3`
4. If tests pass (including password update test), run `/test 3` again
5. Second run fails with "Invalid login credentials"

## Expected Behavior

- E2E tests should be **idempotent** and leave the database in a clean state
- Password update test should restore the original password after testing
- Subsequent test runs should succeed without database reset

## Actual Behavior

- `account.spec.ts::user can update their password` (line 44-58) sets password to `Math.random() * 100000`
- Password is **not restored** after test
- Subsequent runs fail authentication in `global-setup.ts:146`
- Error: `AuthApiError: Invalid login credentials`

## Diagnostic Data

### Console Output
```
🔐 Authenticating test user via Supabase API...
❌ Failed to authenticate test user: Invalid login credentials

AuthApiError: Invalid login credentials

   at ../global-setup.ts:146
```

### Database Analysis
```sql
-- Expected hash (from seed):
$2a$10$HnRa4VckSRWnYpgTXkrd4.x.IGVeYdqJ8V3nlwECk8cnDvIWBBjl6

-- Actual hash (in database):
$2a$10$kZWmhEdoCqBwPz/.OMg4oOpQxNSLhAJ.GMY86dIMeu/QSkUut3dty

-- Password was updated at:
2025-11-26 20:28:59.437481+00
```

### API Test
```bash
curl -X POST 'http://127.0.0.1:54521/auth/v1/token?grant_type=password' \
  -H 'apikey: <anon_key>' \
  -d '{"email":"test1@slideheroes.com","password":"aiesec1992"}'
# Response: {"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}
```

## Error Stack Traces
```
AuthApiError: Invalid login credentials

   at ../global-setup.ts:146

  144 |
  145 |     // Sign in via API
> 146 |     const { data, error } = await supabase.auth.signInWithPassword({
      |                             ^
  147 |       email: credentials.email,
  148 |       password: credentials.password,
  149 |     });
    at handleError (/home/msmith/projects/2025slideheroes/node_modules/.pnpm/@supabase+auth-js@2.82.0/node_modules/@supabase/auth-js/src/lib/fetch.ts:102:9)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/account/account.spec.ts:44-58` (password update test)
  - `apps/e2e/global-setup.ts:146` (authentication failure)
  - `apps/web/supabase/seeds/01_main_seed.sql:103-105` (seed password definition)
- **Recent Changes**: Issue #714 fixed cookie naming but introduced this test
- **Suspected Functions**: `test("user can update their password")` in account.spec.ts

## Related Issues & Context

### Direct Predecessors
- #565 (CLOSED): "E2E Test Failures: Password Hash Mismatch Between Database and Environment Configuration" - Same root cause pattern, database/env credential mismatch
- #662 (CLOSED): "E2E Tests Failing Due to Unseeded Database and Credential Mismatch" - Similar issue with credentials

### Same Component
- #714 (CLOSED): "E2E Shard 3 Authentication Issues" - The fix for this issue enabled the password test to run successfully, which then broke subsequent runs

### Historical Context
This is a **recurring issue pattern** where E2E tests that modify authentication state break subsequent test runs. The same class of problem has occurred 3+ times previously.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The E2E test `user can update their password` in `account.spec.ts` permanently changes the test user's password to a random value without restoration, causing subsequent test runs to fail authentication.

**Detailed Explanation**:
1. `account.spec.ts` line 45 generates random password: `const password = (Math.random() * 100000).toString();`
2. Line 47 updates the password via `account.updatePassword(password)`
3. The test completes successfully but **never restores the original password**
4. Database now has a different password hash than what's in the seed file
5. Next test run: `global-setup.ts` tries to authenticate with seed password `aiesec1992`
6. Authentication fails because database has random password from previous run

**Supporting Evidence**:
- Database password hash differs from seed file hash
- Password `updated_at` timestamp (20:28:59) correlates with last successful test run
- Direct API auth test with seed password fails

### How This Causes the Observed Behavior

```
Test Run 1:
  global-setup authenticates with "aiesec1992" → SUCCESS
  password test runs, changes password to "87234.5678" → SUCCESS
  tests complete → database now has "87234.5678"

Test Run 2:
  global-setup tries to authenticate with "aiesec1992" → FAIL
  Error: "Invalid login credentials"
```

### Confidence Level

**Confidence**: High

**Reasoning**:
- Database evidence shows password was changed at exact time of last test run
- Hash in database differs from seed file
- Direct API authentication with seed password fails
- Test code clearly shows password change without restoration

## Fix Approach (High-Level)

Two complementary fixes needed:

1. **Immediate fix**: Add `test.afterEach` or `test.afterAll` hook to restore the original password after the password update test. Save the original password before changing it, restore after.

2. **Long-term fix**: Consider one of:
   - Skip the password update test (it's testing Supabase functionality, not app code)
   - Use a dedicated test user for destructive tests (not the shared `test1@slideheroes.com`)
   - Reset database between test shards via `/supabase-reset` command

## Diagnosis Determination

**Root cause confirmed**: The `user can update their password` test in `apps/e2e/tests/account/account.spec.ts` changes the test user's password without restoring it, breaking subsequent test runs.

**Immediate workaround**: Run `pnpm supabase:web:reset` to restore the database to seeded state.

## Additional Context

This issue was unmasked by the fix in issue #714, which resolved cookie authentication issues. With authentication working, the password update test now executes successfully - but its side effect (permanently changed password) breaks subsequent runs.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (psql, curl, gh), Read, Grep, test execution logs*
