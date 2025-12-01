# Bug Diagnosis: Console AuthApiError 'Refresh Token Not Found' on Homepage (Recurrence)

**ID**: ISSUE-813
**Created**: 2025-12-01T15:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: error

## Summary

After the fix in issue #797 was implemented, the `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` error is still occurring on the homepage. The previous fix replaced `requireUser()` with `client.auth.getUser()` in the marketing layout, but this does not fully resolve the issue because `getUser()` can also throw errors when stale refresh tokens are present in cookies.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Next.js Version**: 16.0.6 (Turbopack)
- **Node Version**: v22.16.0
- **@supabase/ssr**: 0.8.0
- **@supabase/supabase-js**: 2.86.0
- **Last Working**: Issue was thought to be fixed in #797, but error persists

## Reproduction Steps

1. Start Supabase locally: `pnpm supabase:web:start`
2. Have stale/invalid auth cookies in browser from a previous session
3. Run `pnpm dev` to start development server
4. Navigate to `http://localhost:3000/` (homepage)
5. Observe console output showing `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`

## Expected Behavior

Public marketing pages should gracefully handle missing/invalid sessions without throwing errors or logging errors to the console.

## Actual Behavior

`AuthApiError: Invalid Refresh Token: Refresh Token Not Found` errors appear in the console when users with stale cookies visit the homepage.

## Diagnostic Data

### Console Output
```
web:dev: Error [AuthApiError]: Invalid Refresh Token: Refresh Token Not Found
web:dev:     at ignore-listed frames {
web:dev:   __isAuthError: true,
web:dev:   status: 400,
web:dev:   code: 'refresh_token_not_found'
web:dev: }
```

### Network Analysis
The error occurs during server-side rendering when Supabase attempts to refresh an invalid token stored in cookies.

### Database Analysis
N/A - This is an authentication/session issue, not a database query issue.

### Performance Metrics
The error adds unnecessary latency to page loads as the refresh token validation fails.

## Error Stack Traces
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
  status: 400
  code: 'refresh_token_not_found'
```

## Related Code

- **Affected Files**:
  - `apps/web/app/(marketing)/layout.tsx:10` - Calls `client.auth.getUser()` without try/catch

- **Recent Changes**: Issue #797 replaced `requireUser()` with `getUser()` but didn't add error handling

- **Suspected Functions**:
  - `client.auth.getUser()` - throws AuthApiError when refresh token is invalid
  - `getSupabaseServerClient()` - creates server client with read-only cookie handlers

## Related Issues & Context

### Direct Predecessors
- #780 (CLOSED): "Bug Diagnosis: Console AuthApiError 'Refresh Token Not Found' on Marketing Pages" - Original diagnosis
- #797 (CLOSED): "Bug Fix: Console AuthApiError 'Refresh Token Not Found' on Marketing Pages" - Incomplete fix

### Similar Symptoms
- #714 (CLOSED): "E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware"
- #713 (CLOSED): "Bug Diagnosis: E2E Shard 3 Tests Fail - Session Not Recognized"

### Historical Context
This is a **recurrence** of the issue diagnosed in #780. The fix implemented in #797 replaced `requireUser()` with `getUser()`, but this was insufficient because `getUser()` can also throw `AuthApiError` when refresh tokens are invalid.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `client.auth.getUser()` throws `AuthApiError` exceptions (not just returns errors) when refresh token validation fails, and the marketing layout lacks try/catch error handling.

**Detailed Explanation**:

The marketing layout at `apps/web/app/(marketing)/layout.tsx:10` calls:
```typescript
const { data } = await client.auth.getUser();
```

This call can **throw** an `AuthApiError` exception when:
1. A refresh token exists in cookies but is invalid/expired/revoked
2. The server-side Supabase client attempts to validate the token
3. Token refresh fails with HTTP 400 error
4. The Supabase client throws an exception rather than returning it in the `error` field

The critical issue is that `getUser()` behavior differs from expectations:
- **Expected**: Returns `{ data: { user: null }, error: authError }` for invalid sessions
- **Actual**: **Throws** `AuthApiError` exception when refresh token validation fails

This is a documented behavior in Supabase SSR - the `getUser()` method can throw exceptions in addition to returning errors, especially when token refresh operations fail.

**Supporting Evidence**:
1. Research from `@supabase/ssr` documentation and GitHub issues confirms `getUser()` can throw `AuthApiError`
2. The error `code: 'refresh_token_not_found'` indicates a token refresh attempt failed
3. Marketing pages don't go through middleware (middleware only handles `/admin/*`, `/auth/*`, `/home/*`, `/onboarding`)
4. The server client's cookie handler has a no-op `setAll()` that catches errors silently, but the thrown exception bypasses this

### How This Causes the Observed Behavior

1. User visits homepage with stale auth cookies from a previous session
2. Marketing layout's `SiteLayout` component starts rendering
3. `client.auth.getUser()` is called at line 10
4. Supabase client detects refresh token in cookies
5. Client attempts to validate/refresh the token
6. Refresh fails (token is invalid/expired)
7. Supabase **throws** `AuthApiError` instead of returning gracefully
8. Error propagates to console as uncaught exception
9. Page may still render (Next.js error recovery) but error pollutes console

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The original diagnosis #780 correctly identified `requireUser()` as problematic
2. Fix #797 replaced it with `getUser()` but missed that `getUser()` also throws
3. Research confirms this is documented Supabase SSR behavior
4. The error message exactly matches the documented `AuthApiError` thrown by token refresh failures

## Fix Approach (High-Level)

Wrap the `getUser()` call in a try/catch block to gracefully handle `AuthApiError` exceptions:

```typescript
async function SiteLayout(props: React.PropsWithChildren) {
  const client = getSupabaseServerClient();

  let user: JWTUserData | null = null;

  try {
    const { data } = await client.auth.getUser();
    if (data.user) {
      user = {
        id: data.user.id,
        email: data.user.email ?? "",
        // ... rest of mapping
      };
    }
  } catch {
    // Silently handle auth errors on public marketing pages
    // User will be treated as unauthenticated
    user = null;
  }

  return (
    <div className={"flex min-h-[100vh] flex-col"}>
      <SiteHeader user={user} />
      {props.children}
      <SiteFooter />
    </div>
  );
}
```

This approach:
1. Catches `AuthApiError` exceptions from failed token refresh
2. Treats the user as unauthenticated when auth fails
3. Prevents error logging to console
4. Maintains the same user experience (unauthenticated header state)

## Diagnosis Determination

The root cause is confirmed: `client.auth.getUser()` throws exceptions when refresh tokens are invalid, and the marketing layout lacks error handling for these exceptions. The fix from issue #797 was incomplete - it correctly replaced `requireUser()` but didn't account for `getUser()` also being able to throw errors.

## Additional Context

- This is a common issue in Supabase SSR applications
- The Supabase documentation recommends handling these exceptions explicitly
- Other files using `requireUser()` or `getUser()` without try/catch may have similar issues:
  - `apps/web/app/not-found.tsx:24` - Uses `requireUser()` without try/catch
  - Other protected routes may be affected but are less critical since they require authentication

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Task (context7-expert, perplexity-expert), Bash*
