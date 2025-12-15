# Diagnosis Report: Remaining E2E Test Failures

**Date:** 2025-12-15
**Related Issue:** Follow-up from #1117

## Executive Summary

After fixing the account name update mutation in issue #1117, two categories of E2E test failures remain:
1. **Password update test** - Timeout waiting for Supabase Auth API response
2. **Invitation tests** - Role selector dropdown shows empty (no role options)

This report provides root cause analysis and recommended fixes.

---

## Issue 1: Invitation Tests - Empty Role Selector

### Symptoms
- Invite Members dialog opens correctly
- Email input field works
- Role dropdown selector opens but contains NO options
- Test times out waiting for `[data-testid="role-option-member"]`

### Root Cause Analysis

**Primary Issue:** Browser-side Supabase client queries fail silently due to authentication/DNS issues.

The `RolesDataProvider` component queries the `roles` table:
```typescript
const { error, data } = await supabase
  .from("roles")
  .select("name")
  .gte("hierarchy_level", props.maxRoleHierarchy)
  .order("hierarchy_level", { ascending: true });
```

**Evidence:**
1. Database query works as `authenticated` role (returns owner, member, custom-role)
2. Database query returns EMPTY as `anon` role (no RLS policy for anon)
3. Browser client is running query without proper authentication

**Why authentication fails:**

The E2E test environment has a complex setup:
- Docker test server uses `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`
- E2E setup creates auth cookies named `sb-host-auth-token`
- Browser CANNOT resolve `host.docker.internal` (Docker-internal hostname)
- Browser makes unauthenticated requests → RLS returns empty results

**Technical Details:**

| Component | URL Used | Cookie Name Expected |
|-----------|----------|---------------------|
| E2E Global Setup | `host.docker.internal:54521` | `sb-host-auth-token` |
| Docker Server (server-side) | `host.docker.internal:54521` | `sb-host-auth-token` |
| Docker Server (client bundle) | `host.docker.internal:54521` | N/A (browser can't resolve) |
| Browser making API calls | Can't resolve hostname | N/A |

### Files Involved

- `packages/features/team-accounts/src/components/members/roles-data-provider.tsx` - Queries roles table
- `packages/features/team-accounts/src/components/members/invite-members-dialog-container.tsx` - Uses RolesDataProvider
- `packages/features/team-accounts/src/components/members/membership-role-selector.tsx` - Renders role options
- `apps/e2e/tests/invitations/invitations.po.ts` - E2E page object
- `apps/e2e/global-setup.ts` - Auth session creation
- `docker-compose.test.yml` - Docker test environment config

### Recommended Fixes

**Option A: Fix Docker Environment Variables (Recommended)**

Update `docker-compose.test.yml` to use browser-resolvable URL:
```yaml
environment:
  # Use IP address instead of Docker hostname for browser compatibility
  - NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521
```

Then update E2E global-setup.ts to use the same URL for cookie naming.

**Option B: Add Fallback RLS Policy**

Add RLS policy allowing `anon` role to read roles (roles are not sensitive):
```sql
create policy roles_read_anon on public.roles for select
  to anon using (true);
```

**Option C: Server-side Role Loading**

Move role fetching to server-side (RSC) and pass to client component via props.

### Test File Changes Made

Updated `apps/e2e/tests/invitations/invitations.po.ts` to use `toPass()` pattern for role selection, with better error handling and retry logic.

---

## Issue 2: Password Update Test Timeout

### Symptoms
- Test times out waiting for `/auth/v1/user` PUT response
- Response from Supabase Auth API never arrives
- Test at `apps/e2e/tests/account/account.spec.ts:72`

### Root Cause Analysis

**Primary Issue:** Same root cause as Issue 1 - browser cannot resolve `host.docker.internal` hostname.

**How the password update flow works:**

1. User fills password form and clicks submit
2. `UpdatePasswordForm` component calls `updateUserMutation.mutateAsync({ password, redirectTo })`
3. `useUpdateUser` hook calls `client.auth.updateUser(params)`
4. Supabase JS client makes PUT request to `${SUPABASE_URL}/auth/v1/user`
5. Browser tries to connect to `http://host.docker.internal:54521/auth/v1/user`
6. **DNS resolution fails** - browser cannot resolve `host.docker.internal`
7. Request hangs indefinitely → test timeout

**Evidence:**

```
Test File: apps/e2e/tests/account/account.spec.ts
Test: "user can update their password"
Line 77-80:
  const responsePromise = page.waitForResponse((resp) => {
    return (
      resp.url().includes("auth/v1/user") && resp.request().method() === "PUT"
    );
  });
```

The test waits for a response that will never come because:
- `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521` (set in docker-compose.test.yml)
- Browser Supabase client uses this URL directly
- Browser CANNOT resolve `host.docker.internal` (Docker-only hostname)

### Files Involved

- `apps/e2e/tests/account/account.spec.ts:72-93` - Password update test
- `apps/e2e/tests/account/account.po.ts:53-76` - `updatePassword()` method
- `packages/features/accounts/src/components/personal-account-settings/password/update-password-form.tsx` - Form component
- `packages/supabase/src/hooks/use-update-user-mutation.ts` - Calls `client.auth.updateUser()`
- `packages/supabase/src/get-supabase-client-keys.ts` - Returns `NEXT_PUBLIC_SUPABASE_URL`
- `docker-compose.test.yml:30` - Sets problematic URL

### Why This Wasn't Caught Earlier

The account **name** update works because it uses a different path:
- Name update: Server action → Server-side Supabase client (can resolve `host.docker.internal`)
- Password update: Client-side Supabase auth call → Browser (cannot resolve hostname)

---

## Unified Root Cause

**Both issues share the same root cause**: The Docker test environment uses `host.docker.internal` as the Supabase URL, which browsers cannot resolve.

| Issue | Browser Action | Why It Fails |
|-------|---------------|--------------|
| Invitation roles | Query `roles` table | DNS resolution fails, falls back to `anon` role |
| Password update | PUT `/auth/v1/user` | DNS resolution fails, request hangs |

## Recommended Fix

**Update docker-compose.test.yml** to use `127.0.0.1` instead of `host.docker.internal`:

```yaml
# Change from:
- NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521

# Change to:
- NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521
```

**Important**: Also update `apps/e2e/global-setup.ts` to match:
- Change `supabaseCookieUrl` default from `host.docker.internal` to `127.0.0.1`
- This ensures auth cookies are named consistently (`sb-127-auth-token`)

### Why This Works

1. `127.0.0.1` is resolvable by both:
   - Docker containers (via `host.docker.internal:host-gateway` mapping)
   - Browsers running on the host machine
2. Server-side code continues to work (Next.js server can reach `127.0.0.1:54521`)
3. Browser client-side code can now reach Supabase Auth API
4. Auth cookies will be named consistently (`sb-127-auth-token`)

### Alternative: Keep `host.docker.internal` but Add Separate Browser URL

If keeping `host.docker.internal` for server-side is important, add a new environment variable:
```yaml
- NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521  # Server-side
- NEXT_PUBLIC_SUPABASE_BROWSER_URL=http://127.0.0.1:54521      # Client-side
```

Then modify `get-supabase-client-keys.ts` to use `NEXT_PUBLIC_SUPABASE_BROWSER_URL` when available.

---

## Summary of Changes Made

1. **roles-data-provider.tsx** - No changes needed (code is correct)
2. **invitations.po.ts** - Added `toPass()` wrapper for role selection with retry logic
3. **This diagnosis report** - Updated with complete root cause analysis

## Files to Modify for Fix

1. `docker-compose.test.yml:30` - Change `NEXT_PUBLIC_SUPABASE_URL`
2. `docker-compose.test.yml:108` - Change `NEXT_PUBLIC_SUPABASE_URL` (payload-test service)
3. `apps/e2e/global-setup.ts:377-378` - Update `supabaseCookieUrl` default

## Next Steps

1. ✅ Create GitHub issue for E2E test failures
2. Implement the fix (update URLs)
3. Run full E2E test suite to verify
4. Consider if CI environment needs similar changes

---

*Diagnosis completed by Claude*
