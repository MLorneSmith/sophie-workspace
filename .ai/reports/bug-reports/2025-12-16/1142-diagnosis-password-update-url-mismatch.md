# Bug Diagnosis: E2E Password Update Test Fails - Supabase URL Mismatch

**ID**: ISSUE-1142
**Created**: 2025-12-16T16:35:00Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E test "user can update their password" in shard 3 (Personal Accounts) consistently times out waiting for a PUT request to `auth/v1/user` that never occurs. The root cause is a **Supabase URL mismatch** between the global-setup authentication (127.0.0.1) and the browser Supabase client (host.docker.internal), causing the browser client to fail to retrieve the session.

## Environment

- **Application Version**: dev branch
- **Environment**: development (E2E tests via Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (issue persists after recent timeout fixes)

## Reproduction Steps

1. Start Supabase: `pnpm supabase:web:start`
2. Start Docker test containers: `docker-compose -f docker-compose.test.yml up -d`
3. Run E2E shard 3: `/test 3` or `pnpm --filter e2e test:shard3`
4. Observe the "user can update their password" test timeout after 180s

## Expected Behavior

The password update test should:
1. Fill in the password fields
2. Click the submit button
3. Make a PUT request to `auth/v1/user`
4. Receive a 200 response
5. Pass successfully

## Actual Behavior

The test:
1. Fills in the password fields (confirmed via screenshot)
2. Clicks the submit button
3. **NO PUT request is ever made**
4. Test times out waiting for the response
5. Screenshot shows "Error loading factors list" in MFA section

## Diagnostic Data

### Console Output
```
No JavaScript errors in console
Auth requests captured: NONE (no requests to auth/v1 endpoints)
```

### Network Analysis
```
- Notifications request (rest/v1) was made and succeeded: 200
- Auth API requests (auth/v1/*) were NOT made at all
- Manual fetch from browser to host.docker.internal:54521 works (returns 401 without auth)
```

### Session Analysis
```javascript
{
  "sessionData": null,           // getSession() returns null
  "sessionError": null,
  "userError": "Auth session missing!",
  "factorsResult": {
    "error": { "name": "AuthSessionMissingError" }
  }
}
```

### Storage Analysis
```javascript
{
  "localStorage": {
    "sb-host-auth-token": {
      "access_token": "eyJ...",  // Token exists with iss: http://127.0.0.1:54521/auth/v1
      "token_type": "bearer",
      "expires_in": 3600,
      "refresh_token": "...",
      "user": {...}
    }
  },
  "cookies": {
    "sb-host-auth-token": "exists (httpOnly: true)"
  }
}
```

### JWT Issuer Mismatch
```
JWT token issuer (iss): http://127.0.0.1:54521/auth/v1
Browser Supabase URL:   http://host.docker.internal:54521
```

### Screenshots
- Screenshot shows password fields filled correctly
- MFA section shows "Error loading factors list" error alert
- Page renders successfully (server-side auth works)

## Error Stack Traces
```
Error: page.waitForResponse: Test timeout of 180000ms exceeded.

   98 | // Set up response listener BEFORE triggering the action
   99 | // Note: no explicit timeout - inherits from test.setTimeout()
> 100 | const responsePromise = page.waitForResponse((resp) => {
  101 |   return (
  102 |     resp.url().includes("auth/v1/user") &&
  103 |     resp.request().method() === "PUT"
    at /apps/e2e/tests/account/account.spec.ts:100:32
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts` - Creates session with 127.0.0.1 URL
  - `docker-compose.test.yml` - Sets NEXT_PUBLIC_SUPABASE_URL to host.docker.internal
  - `packages/supabase/src/clients/browser-client.ts` - Creates client from env URL
  - `packages/supabase/src/hooks/use-update-user-mutation.ts` - Password update mutation
  - `apps/e2e/tests/account/account.spec.ts` - The failing test
- **Recent Changes**:
  - `807e9493f` - fix(e2e): resolve timeout conflicts in account settings tests
  - `8c8df4052` - fix(e2e): add route interception for Docker hostname resolution
- **Suspected Functions**:
  - `getSupabaseBrowserClient()` - Creates client with mismatched URL
  - Supabase SSR `createBrowserClient()` - May reject session with wrong issuer

## Related Issues & Context

### Direct Predecessors
- #1139 (CLOSED): "Bug Diagnosis: E2E Account Tests Timeout - Conflicting Timeout Architecture" - Addressed timeout issues but not URL mismatch
- #1140 (CLOSED): "Bug Fix: E2E Account Tests Timeout" - Fixed timeouts but root cause remained

### Related Infrastructure Issues
- #1133 (CLOSED): "Bug Diagnosis: E2E Browser-Server URL Conflict" - Identified browser can't resolve host.docker.internal
- #1134 (CLOSED): "Bug Fix: E2E Browser-Server URL Conflict (Docker host.docker.internal)" - Added route interception but doesn't fix session mismatch

### Similar Symptoms
- #1116 (CLOSED): "Bug Diagnosis: E2E Test Failures - Account Settings and Invitations" - Same account tests failing
- #1117 (CLOSED): "Bug Fix: E2E Test Failures - Account Settings and Invitations" - Partial fix

### Historical Context
Multiple previous issues (#1133, #1134, #1139, #1140) have attempted to fix E2E account test failures. The route interception fix (#1134) addressed network reachability but not the session validation issue. This is a **deeper architectural problem** with how authentication sessions are created vs. used in the Docker E2E environment.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Supabase browser client fails to retrieve sessions because the JWT token issuer URL doesn't match the client's configured URL.

**Detailed Explanation**:

1. **Global Setup (global-setup.ts)** authenticates users against `http://127.0.0.1:54521`:
   - This is necessary because the setup runs on the host machine
   - JWT tokens are created with `iss: http://127.0.0.1:54521/auth/v1`
   - Session is stored in localStorage as `sb-host-auth-token` (derived from cookie URL)

2. **Docker Test Containers** set `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`:
   - This is necessary for containers to reach Supabase on the host
   - The browser Supabase client is created with this URL

3. **Browser Supabase Client** (`createBrowserClient`) looks for session with matching URL:
   - Expects session from `host.docker.internal:54521`
   - Finds session stored under `sb-host-auth-token` (correct key)
   - But the session's JWT issuer is `127.0.0.1:54521` (doesn't match)
   - Either rejects the session or fails to validate it
   - Returns `getSession() = null` and `AuthSessionMissingError`

4. **Cascade Effect**:
   - `useFetchAuthFactors()` calls `client.auth.mfa.listFactors()`
   - SDK sees no session → doesn't make network request → shows error
   - `useUpdateUser()` calls `client.auth.updateUser()`
   - SDK sees no session → doesn't make network request → test times out

**Supporting Evidence**:
- localStorage shows session with JWT iss: `http://127.0.0.1:54521/auth/v1`
- Browser client URL: `http://host.docker.internal:54521`
- `getSession()` returns null despite session existing in storage
- `listFactors()` throws `AuthSessionMissingError` without making network request
- Notifications (rest/v1) work because PostgREST uses API key auth, not session validation

### How This Causes the Observed Behavior

1. User navigates to /home/settings
2. Page renders (server-side uses cookies which work)
3. React hydrates and MFA component mounts
4. MFA component calls `useFetchAuthFactors()` which calls `client.auth.mfa.listFactors()`
5. Supabase SDK checks for valid session → finds mismatch → returns `AuthSessionMissingError`
6. MFA component shows "Error loading factors list"
7. Test fills password fields and clicks submit
8. Form calls `updateUserMutation.mutateAsync()` which calls `client.auth.updateUser()`
9. Supabase SDK checks for valid session → no session → doesn't make HTTP request
10. Test waits for PUT request that never comes → times out

### Confidence Level

**Confidence**: High

**Reasoning**:
- Session exists in localStorage with correct key but wrong JWT issuer
- `getSession()` explicitly returns null despite data being present
- `AuthSessionMissingError` thrown without network request
- No console errors or network failures (the request is never attempted)
- Same pattern explains both MFA error and password update failure

## Fix Approach (High-Level)

**Option A - Unified URL**:
Make global-setup authenticate using the same URL format that the browser client uses. Ensure JWT issuer matches client URL.

**Option B - URL Rewriting**:
Rewrite the stored session's JWT to use the browser-expected URL (complex, may break JWT signature validation).

**Option C - Separate Auth Flows**:
Use server-side authentication for the browser client instead of relying on client-side session retrieval (architectural change).

**Recommended**: Option A - Modify global-setup.ts to:
1. Authenticate against `host.docker.internal:54521` when running locally (requires hosts file entry or Docker network config)
2. OR: Modify Docker containers to use `127.0.0.1:54521` for NEXT_PUBLIC_SUPABASE_URL (may break server-side container→Supabase communication)
3. OR: Add post-processing in global-setup to rewrite JWT issuer claim (if Supabase allows unsigned validation)

## Diagnosis Determination

The root cause has been definitively identified through systematic debugging:
- Network requests are working (route interception successful)
- Session data exists in storage (localStorage populated correctly)
- Session cannot be retrieved by SDK (URL mismatch causes validation failure)
- This is an **architectural issue** with the dual-URL setup required for Docker + Host communication

The fix requires aligning the authentication URL used in global-setup with the URL the browser client expects, OR finding a way to make the Supabase SSR library accept sessions created with a different issuer URL.

## Additional Context

This issue is a consequence of the Docker test architecture where:
- Host machine (running Playwright) must access Supabase at 127.0.0.1:54521
- Docker containers must access Supabase at host.docker.internal:54521
- Both need to share the same authenticated session

Previous fixes addressed:
- Timeout configuration (#1139, #1140)
- Network reachability via route interception (#1133, #1134)

But they missed the fundamental session validation mismatch that prevents client-side auth operations.

---
*Generated by Claude Debug Assistant*
*Tools Used: Playwright tests, Network debugging, JWT analysis, localStorage inspection, Supabase SDK debugging*
