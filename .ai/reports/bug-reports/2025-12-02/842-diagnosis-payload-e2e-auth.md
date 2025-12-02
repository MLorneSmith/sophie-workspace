# Bug Diagnosis: Payload CMS E2E Tests Fail Due to Missing Payload Auth Cookies

**ID**: ISSUE-pending
**Created**: 2025-12-02T15:50:00Z
**Reporter**: system (discovered during issue #836 investigation)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Payload CMS E2E tests (shard 7) fail because the global setup saves only Supabase authentication cookies but Payload CMS uses its own separate authentication system with `payload-token` cookies. The saved storage state lacks the required Payload authentication, causing all tests to get stuck on the login page.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (local Docker)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (potentially never worked correctly)

## Reproduction Steps

1. Run `/test --shard 7` or the Payload E2E tests
2. Observe global setup output shows: `⚠️ Could not verify Payload admin access for payload-admin user`
3. Tests time out waiting for elements that would be visible on authenticated admin pages
4. Screenshots show tests are stuck on Payload login page

## Expected Behavior

- Global setup should authenticate with Payload CMS via its login API
- `payload-admin.json` storage state should contain `payload-token` cookie
- Tests should start on authenticated Payload admin dashboard

## Actual Behavior

- Global setup authenticates with **Supabase** (correct for main app)
- Attempts UI login on Payload but fails silently
- `payload-admin.json` contains only Supabase cookies (`sb-host-auth-token.*`)
- No `payload-token` cookie is saved
- Tests run against login page and time out

## Diagnostic Data

### Console Output
```
🔐 Authenticating payload-admin user via Supabase API...
✅ API authentication successful for payload-admin user
✅ Session injected into cookies and localStorage for payload-admin user
🔄 Navigating to Payload admin panel for payload-admin user...
⚠️  Could not verify Payload admin access for payload-admin user
✅ payload-admin user auth state saved successfully
```

### Storage State Analysis (`payload-admin.json`)
```json
{
  "cookies": [
    {"name": "sb-host-auth-token.0", "value": "base64-..."},  // Supabase cookie
    {"name": "sb-host-auth-token.1", "value": "..."},         // Supabase cookie
    {"name": "lang", "value": "en"}                           // Payload lang preference only
  ]
}
// MISSING: payload-token cookie
```

### Expected Cookie (from Payload login API)
```
set-cookie: payload-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...;
            Expires=Tue, 02 Dec 2025 17:50:31 GMT;
            Path=/;
            HttpOnly=true;
            SameSite=Lax
```

### Payload Login API Verification
```bash
# Payload CMS login works correctly via API
curl -X POST http://localhost:3021/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@slideheroes.com","password":"aiesec1992"}'

# Returns: {"message":"Authentication Passed","token":"eyJ...","user":{...}}
```

### Screenshots
- Test failures show Payload login page: `apps/e2e/test-results/payload-payload-collection-*.png`

## Error Stack Traces
No explicit errors - the global setup swallows the failure with `catch(() => {})`:
```typescript
// global-setup.ts:464
await page.waitForURL(/.*\/admin(?!\/login)/, { timeout: 15000 }).catch(() => {});
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 418-490) - Payload auth logic
  - `apps/e2e/tests/utils/credential-validator.ts` (line 169) - Uses same credentials for both
  - `apps/e2e/tests/payload/helpers/test-data.ts` - TEST_USERS definitions
  - `apps/payload/src/collections/Users.ts` - Payload's separate auth system
- **Recent Changes**: No recent changes to auth setup
- **Suspected Functions**: `globalSetup()` payload authentication block

## Related Issues & Context

### Direct Predecessors
- #836 (CLOSED): "Bug Fix: Payload CMS E2E Save Button Selector Mismatch" - While fixing selector, discovered auth is the real blocker

### Related Infrastructure Issues
- None directly related

### Similar Symptoms
- Tests timing out on Payload pages
- Tests stuck at login screens

### Historical Context
The authentication architecture has a fundamental mismatch:
1. **Main app (shards 1-6)**: Uses Supabase for authentication
2. **Payload CMS (shards 7-8)**: Uses Payload's own `users` collection with `auth: true`

The global setup correctly handles Supabase auth but only partially handles Payload auth - it attempts UI login but the attempt fails silently.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Global setup authenticates against Supabase but Payload CMS uses its own independent authentication system. The UI login fallback fails silently, leaving no `payload-token` cookie in the storage state.

**Detailed Explanation**:

1. **Authentication System Mismatch**:
   - Payload CMS has `auth: true` on its Users collection, creating a completely separate auth system
   - Payload stores users in its own `users` table with bcrypt passwords
   - Payload issues its own JWT tokens via `payload-token` cookie
   - Supabase authentication is irrelevant to Payload CMS

2. **Global Setup Flow**:
   ```typescript
   // Step 1: Authenticate via Supabase API (WRONG for Payload)
   const supabase = createClient(supabaseAuthUrl, supabaseAnonKey);
   await supabase.auth.signInWithPassword({ email, password });

   // Step 2: Navigate to Payload - Supabase cookies are useless here
   await page.goto(`${payloadUrl}/admin`);

   // Step 3: UI login attempt - but catches and ignores failures
   if (isOnLoginPage) {
     await page.locator('input[name="email"]').fill(credentials.email);
     // ... login form submission
     await page.waitForURL(/.*\/admin(?!\/login)/, { timeout: 15000 }).catch(() => {});
   }
   ```

3. **Why UI Login Fails**:
   - The `.catch(() => {})` swallows any errors
   - Form submission may fail silently (timeout, selector issues)
   - No verification that login actually succeeded
   - Storage state is saved regardless of auth state

**Supporting Evidence**:
- `payload-admin.json` contains only `sb-host-auth-token.*` (Supabase), no `payload-token`
- Payload login API works: `curl -X POST .../api/users/login` returns valid token
- Test screenshots show login page, proving authentication is not persisted
- Console shows: `⚠️ Could not verify Payload admin access for payload-admin user`

### How This Causes the Observed Behavior

1. Global setup creates `payload-admin.json` with Supabase cookies only
2. Playwright loads this storage state for Payload tests
3. Browser navigates to `http://localhost:3021/admin`
4. Payload checks for `payload-token` cookie - NOT FOUND
5. Payload redirects to `/admin/login`
6. Tests wait for admin elements that don't exist on login page
7. Tests time out after 90-120 seconds

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence: Storage state lacks `payload-token` cookie
- API verification: Payload login works correctly when called directly
- Screenshot evidence: Tests visually stuck on login page
- Code analysis: Clear path showing Supabase auth used instead of Payload auth

## Fix Approach (High-Level)

The global setup needs to authenticate with Payload CMS via its API instead of (or in addition to) UI login:

```typescript
// After Supabase auth, also authenticate with Payload via API
if (authState.navigateToPayload) {
  const payloadUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021";

  // Use Payload's login API directly
  const loginResponse = await fetch(`${payloadUrl}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  });

  const { token } = await loginResponse.json();

  // Add the payload-token cookie to the context
  await context.addCookies([{
    name: 'payload-token',
    value: token,
    domain: new URL(payloadUrl).hostname,
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 7200 // 2 hours
  }]);
}
```

This approach:
1. Uses Payload's API for reliable authentication
2. Directly adds the `payload-token` cookie
3. Doesn't depend on UI form submission working
4. Matches how Payload actually handles auth

## Diagnosis Determination

**Root cause confirmed**: The E2E global setup authenticates with Supabase but Payload CMS uses a completely separate authentication system. The `payload-admin.json` storage state is missing the required `payload-token` cookie because:

1. Supabase authentication is irrelevant to Payload CMS
2. The UI login fallback fails silently and saves anyway
3. No verification ensures Payload auth succeeded before saving

The fix requires using Payload's login API directly to obtain and save the `payload-token` cookie.

## Additional Context

### Why Shards 1-6 Don't Have This Problem
- Shards 1-6 use the `chromium` project with `testIgnore: [/.*payload.*/]`
- They never navigate to Payload CMS
- They only use Supabase authentication for the main web app
- The `payload` project is specifically for Payload tests and requires different auth

### Authentication Systems Comparison
| System | Cookie Name | Auth Method | User Store |
|--------|-------------|-------------|------------|
| Supabase (main app) | `sb-*-auth-token.*` | JWT via Supabase API | `auth.users` |
| Payload CMS | `payload-token` | JWT via Payload API | `users` collection |

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (global-setup.ts, credential-validator.ts, test-data.ts, payload.config.ts, Users.ts, payload-admin.json), Grep, Bash (curl for API verification), Glob*
