# Bug Diagnosis: E2E Tests Failing Due to Unseeded Database

**ID**: ISSUE-662
**Created**: 2025-11-20T16:17:46Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

All E2E test shards (9 of 10) are failing with "Invalid login credentials" errors during global setup authentication. The root cause is that the local Supabase database has never been seeded - it contains 0 users and 0 accounts. Additionally, the E2E environment configuration expects different test user emails than what exists in the seed file.

## Environment

- **Application Version**: dev branch (commit 9096f8f7d)
- **Environment**: development (local)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - database appears to have never been seeded

## Reproduction Steps

1. Start Supabase locally: `pnpm supabase:web:start`
2. Run E2E tests: `/test` or `pnpm test:e2e`
3. Observe global setup failures with "Invalid login credentials"

## Expected Behavior

E2E tests should authenticate successfully against seeded test users and execute all test shards.

## Actual Behavior

All shards fail during global setup with:
```
❌ Failed to authenticate test user: Invalid login credentials
AuthApiError: Invalid login credentials
```

## Diagnostic Data

### Console Output
```
[2025-11-20T16:11:33.966Z] INFO: 📊 Final status: ❌ FAILED

Shard failures:
- Shard 2: Authentication tests - Auth timeout + invalid credentials
- Shard 3: Account/Team tests - Invalid credentials
- Shard 4: Admin/Invitations tests - Invalid credentials
- Shard 5: Accessibility tests - Invalid credentials
- Shard 6: Healthcheck tests - Invalid credentials
- Shard 7: Payload tests - Invalid credentials
- Shard 8: Payload + Seeding tests - Invalid credentials
- Shard 9: User Billing tests - Invalid credentials
- Shard 10: Team Billing tests - Invalid credentials
```

### Database Analysis
```sql
-- User count check
SELECT COUNT(*) as total_users FROM auth.users;
-- Result: 0 rows

-- Accounts count check
SELECT COUNT(*) as accounts_count FROM public.accounts;
-- Result: 0 rows

-- Check for expected test users
SELECT email FROM auth.users WHERE email LIKE '%slideheroes.com';
-- Result: (0 rows)
```

### Infrastructure Status
```
Supabase containers: All healthy (12 containers running)
- supabase_db_2025slideheroes-db: Up 14 minutes (healthy)
- supabase_auth_2025slideheroes-db: Up 15 minutes (healthy)
- All other containers: healthy
```

## Error Stack Traces
```
AuthApiError: Invalid login credentials
    at globalSetup (apps/e2e/global-setup.ts:91-101)

Error occurs when calling:
const { data, error } = await supabase.auth.signInWithPassword({
  email: credentials.email,
  password: credentials.password,
});
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts:85-101` - Authentication attempt that fails
  - `apps/e2e/tests/utils/credential-validator.ts:159-174` - Credential loading
  - `apps/e2e/.env.example:27-36` - Expected credential configuration
  - `apps/web/supabase/seeds/01_main_seed.sql` - Test user definitions

- **Recent Changes**: None directly related - issue is environmental

- **Suspected Functions**:
  - `globalSetup()` in `apps/e2e/global-setup.ts`
  - `CredentialValidator.validateAndGet()` in credential-validator.ts

## Related Issues & Context

### Similar Symptoms
- #653: "E2E Integration Tests: 5 Remaining Failures After Auth Fix" - Related auth issues
- #565: "E2E Test Failures: Password Hash Mismatch" - Previous credential issues
- #577: "CI/CD: Integration tests fail due to missing test user provisioning" - Same root cause pattern

### Historical Context
This is a recurring pattern where E2E tests fail due to database seeding issues. Previous issues (#577, #565) indicate this has happened before when database state gets out of sync.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The local Supabase database contains no users because it was never seeded, and the E2E credential configuration expects different users than what the seed file creates.

**Detailed Explanation**:

1. **Database Empty**: The database has 0 users in `auth.users` and 0 accounts in `public.accounts`. The seed file (`apps/web/supabase/seeds/01_main_seed.sql`) was never executed.

2. **Credential Mismatch**: Even if seeded, there would be a mismatch:
   - E2E `.env.example` expects: `test1@slideheroes.com`, `owner@slideheroes.com`, `admin@slideheroes.com`
   - Seed file creates: `test1@slideheroes.com`, `test2@slideheroes.com`, `michael@slideheroes.com`

   The `owner@slideheroes.com` and `admin@slideheroes.com` users don't exist in the seed file.

3. **Auth State Files Stale**: The `.auth/*.json` files exist but contain outdated sessions that don't match any database users.

**Supporting Evidence**:
- Database query shows 0 users: `SELECT COUNT(*) FROM auth.users; -- 0`
- Seed file contains different emails than expected by E2E config
- Global setup logs show "Invalid login credentials" for all user types

### How This Causes the Observed Behavior

1. E2E test execution starts
2. Global setup runs and attempts to authenticate test users via Supabase API
3. `CredentialValidator.validateAndGet()` loads credentials from environment variables
4. `supabase.auth.signInWithPassword()` fails because no users exist in database
5. Global setup throws `AuthApiError: Invalid login credentials`
6. All test shards that depend on authenticated state fail

### Confidence Level

**Confidence**: High

**Reasoning**: Direct database queries confirm 0 users exist, and the error message explicitly states "Invalid login credentials". The seed file contents and environment configuration have been verified, confirming both the empty database and the credential mismatch.

## Fix Approach (High-Level)

1. **Seed the database**: Run `pnpm supabase:web:reset` to apply migrations and seed data
2. **Update E2E credentials**: Modify `apps/e2e/.env.example` and local `.env` to use the actual seeded users:
   - `E2E_TEST_USER_EMAIL="test1@slideheroes.com"`
   - `E2E_OWNER_EMAIL="test2@slideheroes.com"` (or create owner user in seed)
   - `E2E_ADMIN_EMAIL="michael@slideheroes.com"` (super-admin in seed)
3. **Re-run tests** to generate fresh auth state files

## Diagnosis Determination

The E2E test failures are caused by an unseeded database combined with a credential configuration mismatch. The immediate fix is to seed the database and align the E2E credentials with the actual test users in the seed file (`test1@`, `test2@`, `michael@slideheroes.com`).

## Additional Context

- The `.auth/` directory contains stale auth state files from a previous session
- Supabase containers are running and healthy - this is purely a data seeding issue
- Unit tests passed successfully (141s) - only E2E tests are affected

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (docker exec psql, grep), Read (global-setup.ts, credential-validator.ts, seed files), Glob (seed file discovery), gh issue list*
