# Bug Diagnosis: Invalid Refresh Token: Refresh Token Not Found

**ID**: ISSUE-826
**Created**: 2025-12-01T19:38:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Users encountering `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` when visiting the marketing home page (`/`) while having an existing auth session with an expired or near-expiry access token. This is caused by a race condition between middleware and server components both attempting to refresh the session token simultaneously.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Browser**: All browsers
- **Node Version**: 22.16.0
- **Next.js Version**: 16.0.6 (Turbopack)
- **@supabase/ssr**: Latest
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - architectural issue

## Reproduction Steps

1. Sign in to the application
2. Wait for the access token to expire or near expiry (~1 hour)
3. Navigate to the marketing home page (`/`)
4. Observe console error: `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`

## Expected Behavior

The session should be refreshed transparently without errors, with the user remaining authenticated.

## Actual Behavior

The user sees a console error `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` and may be logged out or experience auth-related issues.

## Diagnostic Data

### Console Output
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

### Network Analysis

Not applicable - error occurs during internal Supabase auth token refresh.

### Database Analysis

Not applicable - error originates from Supabase Auth server.

### Performance Metrics

Not applicable.

### Screenshots

N/A - console error only.

## Error Stack Traces

The error originates from Supabase Auth server when a consumed refresh token is reused.

## Related Code

### Affected Files

- `apps/web/proxy.ts:66-93` - Middleware `getUser()` function
- `apps/web/app/(marketing)/layout.tsx:14` - Marketing layout auth call
- `apps/web/app/(marketing)/_components/site-header-server.tsx:25` - Site header auth call
- `packages/supabase/src/clients/middleware-client.ts` - Middleware client configuration

### Recent Changes

N/A - architectural issue present in codebase design.

### Suspected Functions

**Primary Issue Location**: Multiple independent auth calls competing for token refresh:

1. **`apps/web/proxy.ts:66-93`** - Middleware `getUser()`:
```typescript
const getUser = async (request: NextRequest, response: NextResponse) => {
  const supabase = createMiddlewareClient(request, response);
  // First call getSession() to trigger session restoration from cookies
  await supabase.auth.getSession();  // <-- Can consume refresh token
  const result = await supabase.auth.getClaims();
  return result;
};
```

2. **`apps/web/app/(marketing)/layout.tsx:14`** - Marketing layout:
```typescript
async function SiteLayout(props: React.PropsWithChildren) {
  const client = getSupabaseServerClient();
  try {
    const { data } = await client.auth.getUser();  // <-- Uses same (now consumed) refresh token
    // ...
  }
}
```

## Related Issues & Context

### Similar Symptoms

- GitHub Issue #18981 (supabase/supabase) - Race condition with multiple layouts using serverClient
- GitHub Issue #68 (supabase/ssr) - Refresh Token Not Found after 24 hours

### Historical Context

This is a known architectural limitation of `@supabase/ssr` when multiple independent server-side clients attempt to refresh tokens simultaneously. The Broadcast Channel API coordination only works within browser contexts, not across separate server process instances (middleware, server components, API routes).

## Root Cause Analysis

### Identified Root Cause

**Summary**: Race condition between middleware and server components both calling Supabase auth methods simultaneously, causing the refresh token to be consumed by one request while another tries to use the same (now invalid) token.

**Detailed Explanation**:

When a user with an expired/near-expiry access token visits the marketing home page:

1. **Middleware executes first** (`proxy.ts`):
   - Calls `supabase.auth.getSession()` at line 75
   - This triggers an internal token refresh if access token is expired
   - Refresh token is **consumed** (single-use by design)
   - New tokens are generated but stored in the response cookies

2. **Server Component executes concurrently** (`(marketing)/layout.tsx`):
   - Calls `client.auth.getUser()` at line 14
   - This also triggers a token refresh attempt
   - Uses the **same original refresh token** from the incoming request cookies
   - Since middleware already consumed this token, Supabase Auth server returns "Refresh Token Not Found"

3. **Why coordination fails**:
   - Middleware runs in Edge Runtime (separate process)
   - Server Components run in Node Runtime (separate process)
   - The `@supabase/ssr` internal locks (Broadcast Channel API) only work within browser tabs
   - **No coordination mechanism exists between server-side processes**

**Supporting Evidence**:

1. **Code evidence - Multiple auth calls on same page**:
   - `apps/web/proxy.ts:75` - `await supabase.auth.getSession();`
   - `apps/web/app/(marketing)/layout.tsx:14` - `await client.auth.getUser();`

2. **Research documentation**:
   - `.ai/reports/research-reports/2025-12-01/perplexity-supabase-refresh-token-errors.md`
   - Confirms this is a known pattern causing the exact error message

3. **Supabase Auth design**:
   - Refresh tokens are single-use for security
   - Once exchanged, the token is permanently deleted from the database
   - Any subsequent attempt to use it returns "not found"

### How This Causes the Observed Behavior

```
Request: GET /
   |
   +---> Middleware (proxy.ts)
   |       |
   |       +---> getSession() --> Token refresh triggered
   |       |                      Refresh token CONSUMED
   |       |                      New tokens in response cookies
   |       |
   |       +---> getClaims() --> Uses new tokens (OK)
   |
   +---> Server Component (layout.tsx) [runs concurrently]
           |
           +---> getUser() --> Tries to use ORIGINAL refresh token
                               Token already consumed by middleware
                               ERROR: "Refresh Token Not Found"
```

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The code clearly shows multiple independent auth calls on the same request path
2. The error message exactly matches the documented race condition behavior
3. External research confirms this is a known `@supabase/ssr` architectural limitation
4. The timing (near token expiry) matches when refresh would be triggered

## Fix Approach (High-Level)

Two possible approaches:

**Option A (Recommended): Remove redundant auth calls from server components on public pages**

The marketing layout shouldn't independently call `getUser()` since:
- The middleware already handles auth state
- Public pages should not require authenticated data fetch
- If user info is needed for the header, it should be passed from middleware via cookies or headers

**Option B: Centralize auth to middleware only**

- Have middleware set auth state in request headers or a cookie
- Server components read the pre-validated auth state instead of calling Supabase auth directly
- Eliminates race conditions by having a single refresh point

## Diagnosis Determination

The root cause has been conclusively identified as a **race condition between middleware and server components** both calling Supabase auth methods on the same request. This is an architectural issue with `@supabase/ssr` when used with multiple independent server-side clients.

The fix requires restructuring auth handling to use a single refresh point (middleware) rather than redundant auth calls in server components.

## Additional Context

### Related Files for Fix

- `apps/web/proxy.ts` - Middleware auth handling
- `apps/web/app/(marketing)/layout.tsx` - Remove `getUser()` call
- `apps/web/app/(marketing)/_components/site-header-server.tsx` - Remove `getSession()` call
- Any other server components calling `getUser()`/`getSession()` on public pages

### Key Documentation

- Supabase SSR Auth Guide: https://supabase.com/docs/guides/auth/server-side/nextjs
- GitHub Issue #18981: Race condition with multiple layouts
- GitHub Issue #68: Token expiration handling

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Task (perplexity-expert), frontend-debugging skill*
