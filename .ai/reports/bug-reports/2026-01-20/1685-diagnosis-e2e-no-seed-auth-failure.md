# Bug Diagnosis: E2E Shards Fail - Super-Admin User Not Created

**ID**: ISSUE-1685
**Created**: 2026-01-21T01:10:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E test shards (2-8) fail with "Invalid login credentials" for the super-admin user during global setup. The root cause is that `setupTestUsers()` only creates 3 hardcoded test users, but the super-admin user (`michael@slideheroes.com`) is NOT included. Since the workflow uses `supabase db reset --no-seed`, the seed.sql users aren't created either, leaving the super-admin user missing.

## Environment

- **Application Version**: commit 546a9cab4 (dev branch)
- **Environment**: CI (GitHub Actions with RunsOn)
- **Node Version**: 20
- **pnpm Version**: 10.14.0
- **Workflow Run**: 21192395891

## Reproduction Steps

1. Push to `dev` branch to trigger E2E sharded workflow
2. Wait for shards to start running (setup server completes successfully)
3. Observe authentication failures in shards 2-8 during global setup for super-admin user

## Expected Behavior

E2E tests should successfully authenticate all test users (test, owner, admin, payload-admin) and run test suites.

## Actual Behavior

Global setup succeeds for test and owner users but fails for super-admin user:
```
✅ Session injected into cookies and localStorage for owner user
❌ Failed to authenticate super-admin user: Invalid login credentials
```

## Diagnostic Data

### The Mismatch

| User Role | Auth File Path | Created By setupTestUsers() | GitHub Secret Env Var |
|-----------|---------------|----------------------------|----------------------|
| test | `test1@slideheroes.com.json` | ✅ Yes (`test1@slideheroes.com`) | `E2E_TEST_USER_EMAIL` |
| owner | `test2@slideheroes.com.json` | ✅ Yes (`test2@slideheroes.com`) | `E2E_OWNER_EMAIL` |
| **admin** | `michael@slideheroes.com.json` | ❌ **NO** | `E2E_ADMIN_EMAIL` |
| payload-admin | `payload-admin.json` | ❌ **NO** | `E2E_ADMIN_EMAIL` |

### setupTestUsers() Creates (test-users.ts:10-38)
```typescript
export const TEST_USERS = {
  user1: { email: "test1@slideheroes.com", ... },
  user2: { email: "test2@slideheroes.com", ... },
  newUser: { email: "newuser@slideheroes.com", ... },
};
```

### Auth States Expected (global-setup.ts:718-742)
```typescript
const authStates = [
  { name: "test user", role: "test", filePath: "test1@slideheroes.com.json" },
  { name: "owner user", role: "owner", filePath: "test2@slideheroes.com.json" },
  { name: "super-admin user", role: "admin", filePath: "michael@slideheroes.com.json" },  // NOT CREATED
  { name: "payload-admin user", role: "payload-admin", filePath: "payload-admin.json" },
];
```

### Console Output
```
🔧 Setting up test users...
✅ Created test user: test1@slideheroes.com
✅ Created test user: test2@slideheroes.com
✅ Created test user: newuser@slideheroes.com
✅ Test users ready

🔐 Authenticating test user via Supabase API...
✅ Session injected into cookies and localStorage for test user

🔐 Authenticating owner user via Supabase API...
✅ Session injected into cookies and localStorage for owner user

🔐 Authenticating super-admin user via Supabase API...
❌ Failed to authenticate super-admin user: Invalid login credentials
```

### Job Status (Run 21192395891)

| Job | Status | Notes |
|-----|--------|-------|
| Setup Test Server | ✅ success | tsx fix works |
| E2E Shard 1 | ✅ success | Smoke tests (no auth required) |
| E2E Shard 2-8 | ❌ failure | All fail on super-admin auth |

## Error Stack Traces
```
AuthApiError: Invalid login credentials
    at handleError (@supabase/auth-js/src/lib/fetch.ts:102:9)
    at SupabaseAuthClient.signInWithPassword (@supabase/auth-js/src/GoTrueClient.ts:676:15)
    at globalSetup (apps/e2e/global-setup.ts:721:28)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/helpers/test-users.ts` (lines 10-38) - Missing super-admin user
  - `apps/e2e/global-setup.ts` (lines 718-742) - Auth states definition
  - `.github/workflows/e2e-sharded.yml` (line 326) - `--no-seed` flag

## Related Issues & Context

### Direct Predecessors
- #1602, #1603 (CLOSED): "E2E tests fail due to missing test users" - Added `setupTestUsers()` but incomplete
- #1683 (OPEN): Previous diagnosis about stale commit - different issue
- #1657, #1659, #1676, #1679 (CLOSED): tsx migration chain (all fixed)

### Historical Context

The `setupTestUsers()` function was added to address Issue #1602/#1603 where test users were missing after `supabase db reset --no-seed`. However, it only added 3 users and missed the super-admin user which is required for admin tests.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `setupTestUsers()` function in `apps/e2e/tests/helpers/test-users.ts` only creates 3 test users, but the global setup expects 4 users including a super-admin user that is NOT created.

**Detailed Explanation**:

1. Workflow runs `supabase db reset --no-seed` - no seed.sql users created
2. Global setup calls `setupTestUsers()` which creates:
   - `test1@slideheroes.com` (user1)
   - `test2@slideheroes.com` (user2)
   - `newuser@slideheroes.com` (newUser)
3. Global setup then tries to authenticate 4 roles:
   - `test` → uses E2E_TEST_USER_EMAIL (works if matches test1@)
   - `owner` → uses E2E_OWNER_EMAIL (works if matches test2@)
   - `admin` → uses E2E_ADMIN_EMAIL (FAILS - no matching user created)
   - `payload-admin` → uses E2E_ADMIN_EMAIL (FAILS - same as admin)
4. Super-admin/admin user doesn't exist → "Invalid login credentials"

**Supporting Evidence**:
- Log shows owner succeeded, super-admin failed (matches the 3 users created)
- File path `michael@slideheroes.com.json` doesn't match any `setupTestUsers()` user
- The pattern is clear: only 3 users created, 4 expected

### How This Causes the Observed Behavior

1. `setupTestUsers()` creates `test1@`, `test2@`, `newuser@slideheroes.com`
2. Authentication for test and owner succeeds (their emails match created users)
3. Authentication for admin fails because `E2E_ADMIN_EMAIL` (or the expected super-admin) doesn't exist
4. Global setup throws, test shard fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear mismatch between `TEST_USERS` object (3 users) and `authStates` array (4 roles)
- Log confirms exactly which users succeed/fail
- Code clearly shows the missing user

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Add super-admin user to `setupTestUsers()`

Add to `apps/e2e/tests/helpers/test-users.ts`:
```typescript
export const TEST_USERS = {
  // ... existing users ...
  superAdmin: {
    email: "michael@slideheroes.com",  // Match the filePath in global-setup.ts
    password: "aiesec1992",  // Same test password
    id: "c5b930c9-0a76-412e-a836-4bc4849a3270",  // From seed.sql
    metadata: {
      onboarded: true,
      displayName: "Super Admin",
      role: "super-admin",  // Critical for admin functionality
    },
    appMetadata: {
      role: "super-admin",  // Required for is_super_admin() check
    },
  },
};
```

And update `setupTestUsers()` to include it and set app_metadata for super-admin role.

**Option 2**: Remove `--no-seed` and use seed.sql users

Change line 326 in e2e-sharded.yml:
```yaml
supabase db reset || true
```

Then ensure GitHub secrets match seed.sql users:
- `E2E_ADMIN_EMAIL` = `super-admin@makerkit.dev`
- `E2E_OWNER_EMAIL` = `owner@makerkit.dev`
- etc.

**Option 3**: Ensure GitHub secrets match `setupTestUsers()` users

Update GitHub secrets to use the emails that `setupTestUsers()` creates. But this doesn't solve the super-admin problem since it's not created.

**Recommendation**: Option 1 is the cleanest fix. It ensures all required users are programmatically created regardless of seed state.

## Diagnosis Determination

The E2E shards fail because `setupTestUsers()` only creates 3 test users but the auth flow requires 4 (including super-admin). The super-admin user is never created because:
1. It's not in `TEST_USERS` object
2. `--no-seed` prevents seed.sql from running

The fix is to add the super-admin user to `setupTestUsers()` in `apps/e2e/tests/helpers/test-users.ts`.

## Additional Context

The `setupTestUsers()` mechanism was a partial fix for Issue #1602/#1603 but was incomplete. It needs to create ALL users that the test suite requires, including super-admin with proper `app_metadata.role = "super-admin"` for the `is_super_admin()` database function to work.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git, Bash, Read, Grep*
