# Bug Diagnosis: E2E Shard 4 Timeout - Missing MFA Factors for Super Admin

**ID**: ISSUE-pending
**Created**: 2026-01-21T15:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E Shard 4 (Admin & Invitations tests) is timing out after 15 minutes because the super admin tests fail repeatedly. The admin tests navigate to `/admin` which triggers `AdminGuard` to check `is_super_admin()`. This function requires both AAL2 (MFA verified) and `app_metadata.role = 'super-admin'`. While `setupTestUsers()` correctly sets the app_metadata role, it does NOT create MFA factors in the `auth.mfa_factors` table. Without MFA factors, `is_aal2()` returns false, `is_super_admin()` returns false, and the user gets redirected to a 404 page.

## Environment

- **Application Version**: dev branch (commit bb8af7328)
- **Environment**: CI (GitHub Actions)
- **Workflow**: e2e-sharded.yml (Run ID: 21213473683)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (potentially never worked with --no-seed)

## Reproduction Steps

1. Trigger the e2e-sharded workflow via PR or manual dispatch
2. Setup Test Server completes and runs `supabase db reset --no-seed`
3. E2E Shard 4 starts and runs global-setup.ts
4. `setupTestUsers()` creates auth users including super-admin
5. Global setup authenticates super-admin and verifies MFA (but can't find factors)
6. Admin tests navigate to `/admin`
7. `AdminGuard` checks `is_super_admin()` via RPC
8. `is_super_admin()` calls `is_aal2()` which returns false (no MFA factors)
9. User is redirected to 404 page
10. Test fails, retries, continues failing until 15-minute timeout

## Expected Behavior

Admin tests should be able to access `/admin` with a properly authenticated super-admin user who has MFA factors enrolled and verified.

## Actual Behavior

- Admin tests see 404 "Sorry, this page does not exist" error
- Invitations tests get "Internal Server Error" (500)
- Tests keep retrying until the 15-minute timeout is reached
- Shard 4 fails with "The action 'Run E2E tests for shard 4' has timed out after 15 minutes"

## Diagnostic Data

### Console Output
```
E2E Shard 4 failed tests:
- admin-admin-Admin-Admin-Dashboard-displays-all-stat-cards-chromium (+ retry)
- admin-admin-Admin-Personal-f0236-ys-personal-account-details-chromium (+ retry)
- invitations-invitations-Invitations-users-can-delete-invites-chromium (+ retry)
```

### Screenshot Analysis

**Admin Tests (404 Error)**:
The page shows the application's 404 error page with:
- "Ouch! :|"
- "Sorry, this page does not exist."
- "Apologies, the page you were looking for was not found"
- User is logged in (profile menu shows "M" avatar)

**Invitations Test (500 Error)**:
- Page shows "Internal Server Error"

### Database Analysis
```sql
-- The seed.sql creates MFA factors:
INSERT INTO "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at")
VALUES ('659e3b57-1128-4d26-8757-f714fd073fc4', 'c5b930c9-0a76-412e-a836-4bc4849a3270', 'iPhone', 'totp', 'verified', '2025-02-24 13:23:55.5805+00', '2025-02-24 13:24:32.591999+00', 'NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE', null, '2025-02-24 13:24:32.563314+00');

-- But with --no-seed, this is never executed
-- setupTestUsers() only creates auth.users entries, not mfa_factors
```

### is_super_admin() Function
```sql
-- From apps/web/supabase/schemas/13-mfa.sql
create or replace function public.is_super_admin() returns boolean
begin
    if not public.is_aal2() then
        return false;  -- FAILS HERE - no MFA factors enrolled
    end if;

    select (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' into is_super_admin;

    return coalesce(is_super_admin, false);
end
```

## Error Stack Traces
```
N/A - Tests fail due to assertion mismatch, not runtime errors
Expected: /admin page to load
Actual: 404 page displayed
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml:334` - runs `supabase db reset --no-seed`
  - `apps/e2e/tests/helpers/test-users.ts` - creates auth users but NOT MFA factors
  - `apps/e2e/global-setup.ts` - attempts MFA verification but fails (no factors)
  - `apps/e2e/tests/admin/admin.spec.ts` - admin tests that fail
  - `apps/e2e/tests/invitations/invitations.spec.ts` - invitations tests that fail
  - `packages/features/admin/src/components/admin-guard.tsx` - checks is_super_admin()
  - `packages/features/admin/src/lib/server/utils/is-super-admin.ts` - RPC wrapper
  - `apps/web/supabase/schemas/13-mfa.sql` - is_super_admin() function definition

- **Recent Changes**:
  - `7ce21d830` - Skip test user setup for CI with remote Supabase
  - `fb02cc9f0` - Add super-admin user to TEST_USERS for global setup
  - `9ec55a5fb` - Add test user setup to global-setup (this fixed auth users but not MFA)

- **Suspected Functions**:
  - `setupTestUsers()` in test-users.ts - needs to create MFA factors
  - `ensureTestUser()` in test-users.ts - needs MFA factor setup for admin user

## Related Issues & Context

### Direct Predecessors
- #1602 (CLOSED): "E2E Sharded Tests Fail Due to Missing Test Users (db reset --no-seed)" - Same root cause area, partial fix applied
- #729 (CLOSED): "E2E Shard 4 Admin Tests Fail - Global Setup Missing MFA Verification" - Very similar issue from November

### Related Infrastructure Issues
- #1691: Skip test user setup for CI with remote Supabase
- #1603: Fix for missing test users (added setupTestUsers())

### Similar Symptoms
- #730 (CLOSED): "Bug Fix: E2E Shard 4 Admin Tests - Global Setup Missing MFA Verification"
- #770 (CLOSED): "E2E Admin & Invitations Tests Fail with Authentication API Timeout"

### Same Component
- #776 (CLOSED): "E2E Shard 4 Multiple Test Failures (7 of 12 Tests)"
- #734 (CLOSED): "E2E Shard 4 Tests Fail - Incomplete Selector Migration"

### Historical Context
This is a **recurring issue** with E2E Shard 4 admin tests. Previous fixes (#729, #730) addressed MFA verification in global-setup, but the underlying issue of MFA factors not being created during `--no-seed` runs was never fully resolved. The `setupTestUsers()` function was added to create auth users but doesn't create the necessary MFA factor entries.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `setupTestUsers()` function creates auth users but does NOT create MFA factors in `auth.mfa_factors`, causing `is_super_admin()` to return false.

**Detailed Explanation**:
When `supabase db reset --no-seed` runs, the database is wiped and only migrations are applied. The `setupTestUsers()` function in global-setup creates test users via Supabase Admin API:

```typescript
// test-users.ts - ensureTestUser()
await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: user.metadata,
    ...(user.appMetadata && { app_metadata: user.appMetadata }),
});
```

This creates the auth user with correct `app_metadata.role = 'super-admin'`, BUT it doesn't create an entry in `auth.mfa_factors` table. The seed.sql file contains the MFA factor insert, but with `--no-seed`, this is never executed.

The `is_super_admin()` RPC function requires BOTH:
1. `is_aal2()` = true (JWT has AAL2 level from verified MFA)
2. `app_metadata.role = 'super-admin'`

Without MFA factors, even if global-setup attempts MFA verification, there are no factors to verify. The session remains AAL1, and `is_super_admin()` returns false.

**Supporting Evidence**:
- Screenshot shows authenticated user (avatar "M") but 404 page for /admin
- seed.sql contains MFA factor insert for super admin user ID
- test-users.ts does not include MFA factor setup
- global-setup.ts MFA verification finds no factors: `ℹ️ No TOTP factors found for super-admin user`

### How This Causes the Observed Behavior

1. `supabase db reset --no-seed` → Empty auth.mfa_factors table
2. `setupTestUsers()` creates auth users → super-admin has correct app_metadata
3. global-setup attempts MFA verification → No factors found, session stays AAL1
4. Test navigates to `/admin` → AdminGuard checks is_super_admin()
5. is_super_admin() calls is_aal2() → Returns false (JWT.aal !== 'aal2')
6. is_super_admin() returns false → AdminGuard calls notFound()
7. User sees 404 page → Test assertion fails
8. Test retries indefinitely → 15-minute timeout reached

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error screenshots clearly show the user IS authenticated (logged in with profile menu)
- The 404 is specifically from AdminGuard's notFound() call, not a missing route
- The is_super_admin() function explicitly requires is_aal2() which needs MFA factors
- The seed.sql contains the MFA factor but is skipped with --no-seed
- setupTestUsers() demonstrably does not create MFA factors

## Fix Approach (High-Level)

Add MFA factor enrollment for the super admin user in `setupTestUsers()`. This should:

1. Create a verified MFA factor in `auth.mfa_factors` table for the super admin user
2. Use the same TOTP secret (`NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE`) that's in seed.sql and global-setup
3. Set the factor status to 'verified' so the user can immediately get AAL2 on login

Example fix in test-users.ts:
```typescript
// After creating super admin user, also create MFA factor
if (user.appMetadata?.role === 'super-admin') {
    await supabase.rpc('create_test_mfa_factor', {
        p_user_id: user.id,
        p_secret: 'NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE'
    });
}
```

Or use a direct database insert via pg client.

## Diagnosis Determination

The root cause has been definitively identified: The `setupTestUsers()` function creates auth users but not MFA factors. For the super admin user, this means `is_super_admin()` always returns false because `is_aal2()` fails without enrolled MFA factors. The fix requires extending `setupTestUsers()` or adding a separate MFA setup step to create the necessary `auth.mfa_factors` entry.

## Additional Context

- The e2e-sharded workflow uses local Supabase (`E2E_LOCAL_SUPABASE=true`)
- The dev-integration-tests workflow uses remote Supabase with pre-provisioned users
- This issue only affects workflows using `supabase db reset --no-seed`
- The TOTP secret `NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE` is used consistently across seed.sql and global-setup.ts

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh api (artifacts), Read (screenshots, test results, source files), Grep, Glob*
