# Bug Diagnosis: E2E Shard 4 Failures - Super Admin MFA Not Verified in Global Setup

**ID**: ISSUE-729
**Created**: 2025-11-27T15:20:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E shard 4 (Admin & Invitations) has 6 of 8 tests failing. The admin tests fail because the global setup authenticates the super admin user with `signInWithPassword()` only, which gives AAL1 (Authentication Assurance Level 1). However, the `is_super_admin()` database function requires AAL2 (MFA verified). Without MFA verification in global setup, the super admin's session doesn't pass the `is_super_admin()` check, causing `/admin` to redirect to 404.

The invitation tests fail due to separate issues: blank page rendering and email body not found errors, indicating team creation and email delivery problems in the test environment.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Local Development (Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: Latest LTS
- **Database**: PostgreSQL 15 (via Supabase)
- **Last Working**: Unknown - admin tests may never have worked with current global setup

## Reproduction Steps

1. Run E2E shard 4:
   ```bash
   bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 4
   ```
2. Observe that 6 of 8 tests fail
3. Check the screenshot for "Admin Dashboard displays all stat cards" - shows 404 page
4. Note that tests using `AUTH_STATES.SUPER_ADMIN` storage state can't access `/admin`

## Expected Behavior

1. Global setup should authenticate super admin with MFA (AAL2)
2. Super admin storage state should have AAL2 level
3. Admin tests should access `/admin` successfully
4. All 8 tests in shard 4 should pass

## Actual Behavior

1. Global setup authenticates super admin with password only (AAL1)
2. Super admin storage state has AAL1 level
3. `is_super_admin()` returns false (requires `is_aal2()`)
4. Admin pages redirect to 404
5. 6 of 8 tests fail

## Diagnostic Data

### Console Output
```
[2025-11-27T15:00:54.736Z] INFO: 📊 Output mode: file
[2025-11-27T15:09:27.832Z] INFO: ✅ Shard 1 completed: 2/8 passed
[2025-11-27T15:09:27.887Z] INFO:    Total Tests: 8
[2025-11-27T15:09:27.887Z] INFO:    ❌ Shard 1 (undefined): 2/8 passed
[2025-11-27T15:09:30.972Z] INFO:    ❌ Admin & Invitations            2 passed, 6 failed, 0 skipped
```

### Test-Specific Errors

**Admin Dashboard test:**
```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: 'Users' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found
```

Screenshot shows: **404 "Ouch! Sorry, this page does not exist"** - proving the super admin session is not being recognized.

**Team Account Management test:**
```
Error: locator.click: Test timeout of 120000ms exceeded.
```

**Invitations tests:**
```
Error: Test timeout of 120000ms exceeded
```

**Full Invitation Flow test:**
```
Error: Email body was not found
```

### Database Analysis

The `is_super_admin()` function (lines 35-50 of `schemas/13-mfa.sql`):

```sql
create or replace function public.is_super_admin() returns boolean
    set search_path = '' as
$$
declare
    is_super_admin boolean;
begin
    -- CRITICAL: Requires MFA (AAL2) first
    if not public.is_aal2() then
        return false;  -- ← This fails because global setup doesn't do MFA
    end if;

    select (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' into is_super_admin;

    return coalesce(is_super_admin, false);
end
$$ language plpgsql;
```

The `is_aal2()` function checks `auth.jwt() ->> 'aal' = 'aal2'`. Without MFA verification, the JWT has `aal1`.

### Screenshots

- `apps/e2e/test-results/admin-admin-Admin-Admin-Dashboard-displays-all-stat-cards-chromium/test-failed-1.png` - Shows 404 page
- Invitation test screenshots show blank pages or sign-in forms

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` - Missing MFA verification for super admin (line 146: `signInWithPassword` only)
  - `apps/web/supabase/schemas/13-mfa.sql` - `is_super_admin()` requires AAL2
  - `packages/features/admin/src/components/admin-guard.tsx` - Calls `isSuperAdmin()` which returns false
  - `packages/features/admin/src/lib/server/utils/is-super-admin.ts` - Calls RPC `is_super_admin`

- **Recent Changes**:
  - `c529c025d` fixed redundant login attempts but didn't address MFA
  - Issue #720 was a different bug (redundant logins on pre-authenticated sessions)

- **Suspected Functions**:
  - `global-setup.ts:globalSetup()` - needs to verify MFA for super admin
  - MFA key is available: `AuthPageObject.MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE"`

## Related Issues & Context

### Direct Predecessors
- #719 (CLOSED): "E2E Shard 4 Tests Fail Due to Redundant Login Attempts" - Different root cause (fixed)
- #720 (CLOSED): "Bug Fix: Redundant Login Attempts" - Fix applied but didn't address MFA issue
- #572 (CLOSED): "E2E Auth Timeout Failures: Incomplete Global Setup Implementation" - Related infrastructure

### Similar Symptoms
- #543 (CLOSED): "E2E Tests Failing: Authentication Redirecting to Verification Page" - MFA-related
- #547 (CLOSED): "MFA Redirect Loop" - MFA-related

### Historical Context
The global setup was implemented to avoid UI-based authentication race conditions (issue #571, #572). However, the implementation only handles password authentication, not MFA verification. This works for regular users but breaks super admin access.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Global setup authenticates super admin with password only (AAL1), but `is_super_admin()` requires MFA verification (AAL2).

**Detailed Explanation**:
The global setup at `apps/e2e/global-setup.ts` line 146 uses `supabase.auth.signInWithPassword()` for all users including the super admin. This gives an AAL1 session. However, the database function `public.is_super_admin()` (line 42-44 of `schemas/13-mfa.sql`) checks `public.is_aal2()` first and returns false if MFA isn't verified.

When admin tests use `AUTH_STATES.SUPER_ADMIN` storage state, the session has AAL1. The `AdminGuard` component calls `isSuperAdmin()`, which calls the `is_super_admin` RPC, which returns false, triggering `notFound()`.

**Supporting Evidence**:
- Screenshot of admin test failure shows 404 page (not admin dashboard)
- Database function explicitly checks `is_aal2()` before checking super-admin role
- Global setup code has no MFA verification (`grep -i mfa global-setup.ts` returns empty)
- `AuthPageObject.loginAsSuperAdmin()` does handle MFA (lines 324-449) but isn't used in global setup

### How This Causes the Observed Behavior

1. Global setup runs, authenticates super admin with password → AAL1 session
2. Storage state saved to `.auth/michael@slideheroes.com.json` with AAL1 JWT
3. Test loads storage state via `AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN)`
4. Test navigates to `/admin`
5. `AdminGuard` calls `isSuperAdmin(client)`
6. `isSuperAdmin()` calls `client.rpc("is_super_admin")`
7. `is_super_admin()` SQL function checks `is_aal2()` → returns FALSE
8. `isSuperAdmin()` returns `false`
9. `AdminGuard` calls `notFound()` → 404 page
10. Test fails waiting for admin dashboard elements

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Screenshot definitively shows 404, not an error or timeout
2. Database schema explicitly requires AAL2 for super admin
3. Global setup code clearly lacks MFA handling
4. The `AuthPageObject.loginAsSuperAdmin()` method does handle MFA correctly but isn't used in global setup
5. Tests that don't require super admin (owner, test user) work correctly

## Fix Approach (High-Level)

The global setup needs to complete MFA verification for the super admin user after password authentication. The fix should:

1. After `signInWithPassword()` for the super admin, call `supabase.auth.mfa.challenge()` to get a factor
2. Generate TOTP code using the MFA key (`NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE`)
3. Call `supabase.auth.mfa.verify()` with the TOTP code
4. Save the resulting AAL2 session to storage state

Reference implementation exists in `AuthPageObject.submitMFAVerification()` and `loginAsSuperAdmin()`.

## Diagnosis Determination

The root cause is definitively identified: global setup does not verify MFA for the super admin user, resulting in an AAL1 session that fails the `is_super_admin()` check which requires AAL2.

The invitation tests have a secondary issue: email delivery is failing ("Email body was not found"), which is a separate infrastructure problem related to the test email server configuration (see related issues #722, #723, #727).

## Additional Context

### Passing Tests (2/8)
1. "will return a 404 for non-admin users" - Uses OWNER_USER (expected 404)
2. "will redirect to 404 for admin users without MFA" - Uses TEST_USER (expected 404)

These tests pass because they correctly expect 404 for non-admin or non-MFA users.

### MFA Key Available
The MFA key is already defined in the codebase:
```typescript
// apps/e2e/tests/authentication/auth.po.ts:8
const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";
```

This key can be used to generate TOTP codes for MFA verification in global setup.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Grep, Screenshot analysis*
