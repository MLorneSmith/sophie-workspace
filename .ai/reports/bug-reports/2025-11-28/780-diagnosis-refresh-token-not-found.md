# Bug Diagnosis: Console AuthApiError "Refresh Token Not Found" on Home Page

**ID**: ISSUE-pending
**Created**: 2025-11-28T23:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: error

## Summary

When running `pnpm run dev` and loading the home page (`/`), the console displays 8 repeated `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` errors. The page loads successfully (HTTP 200), but the errors pollute the console and indicate inefficient auth handling on public marketing pages.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Browser**: N/A (server-side error)
- **Node Version**: >=18.18.0
- **Database**: PostgreSQL (Supabase local)
- **Next.js Version**: 16.0.3 (Turbopack)
- **Last Working**: Unknown (may have always existed)

## Reproduction Steps

1. Start Supabase locally: `pnpm supabase:web:start`
2. Have stale/invalid auth cookies in browser (from previous session or manually set)
3. Run `pnpm dev` to start development server
4. Navigate to `http://localhost:3000/` (home page)
5. Observe console output showing 8 repeated `AuthApiError` messages

## Expected Behavior

Public marketing pages should:
1. Not attempt auth token refresh for unauthenticated/stale sessions
2. Gracefully handle missing/invalid sessions without throwing errors
3. Display user state conditionally (logged in vs. logged out) without errors

## Actual Behavior

- 8 identical `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` errors appear in console
- Multiple POST requests to `/auth/v1/token?grant_type=refresh_token` return 400 status
- Page eventually loads successfully (HTTP 200)
- Testimonials and other content load correctly after delays

## Diagnostic Data

### Console Output
```
web:dev: Error [AuthApiError]: Invalid Refresh Token: Refresh Token Not Found
web:dev:     at ignore-listed frames {
web:dev:   __isAuthError: true,
web:dev:   status: 400,
web:dev:   code: 'refresh_token_not_found'
web:dev: }
(repeated 8 times)
```

### Network Analysis
```
POST http://127.0.0.1:54521/auth/v1/token?grant_type=refresh_token 400 in 103ms (cache skip)
POST http://127.0.0.1:54521/auth/v1/token?grant_type=refresh_token 400 in 142ms (cache skip)
POST http://127.0.0.1:54521/auth/v1/token?grant_type=refresh_token 400 in 149ms (cache skip)
POST http://127.0.0.1:54521/auth/v1/token?grant_type=refresh_token 400 in 525ms (cache skip)
(4+ duplicate requests)
```

### Database Analysis
N/A - Issue is in auth cookie handling, not database queries.

### Performance Metrics
- Page load time increased due to failed auth requests: ~400-500ms added latency
- 8 redundant network requests to auth endpoint

## Error Stack Traces
```
Error [AuthApiError]: Invalid Refresh Token: Refresh Token Not Found
    at ignore-listed frames {
  __isAuthError: true,
  status: 400,
  code: 'refresh_token_not_found'
}
```

## Related Code
- **Affected Files**:
  - `apps/web/app/(marketing)/layout.tsx:10` - Calls `requireUser()` on every marketing page
  - `packages/supabase/src/require-user.ts:61` - Calls `client.auth.getClaims()` which triggers token refresh
  - `apps/web/proxy.ts` - Middleware that refreshes tokens, but NOT for marketing pages
- **Recent Changes**: None directly related
- **Suspected Functions**:
  - `requireUser()` in marketing layout
  - `client.auth.getClaims()` in require-user.ts

## Related Issues & Context

### Direct Predecessors
- #714 (CLOSED): "E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware" - Related auth middleware issues
- #713 (CLOSED): "Bug Diagnosis: E2E Shard 3 Tests Fail" - Similar auth session problems

### Related Infrastructure Issues
- #543 (CLOSED): "E2E Tests Failing: Authentication Redirecting to Verification Page"
- #135 (CLOSED): "E2E Tests Failing with OTP Expired and Session Persistence Issues"

### Historical Context
Multiple auth-related issues have been reported, but this specific public page token refresh error appears to be a distinct issue caused by architectural decisions in the marketing layout.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The marketing layout (`apps/web/app/(marketing)/layout.tsx`) unconditionally calls `requireUser()` which triggers auth token refresh attempts for ALL visitors, including unauthenticated users with stale cookies.

**Detailed Explanation**:

1. **Marketing Layout Always Calls Auth** (`apps/web/app/(marketing)/layout.tsx:10`):
   ```typescript
   const user = await requireUser(client, { verifyMfa: false });
   ```
   This runs on EVERY marketing page load, including `/` (home page).

2. **requireUser() Calls getClaims()** (`packages/supabase/src/require-user.ts:61`):
   ```typescript
   const { data, error } = await client.auth.getClaims();
   ```
   This internally attempts to validate/refresh the session.

3. **No Middleware Token Refresh for Marketing Pages** (`apps/web/proxy.ts`):
   The middleware only handles patterns for `/admin/*`, `/auth/*`, `/home/*`, and `/onboarding`.
   Marketing pages (`/`, `/pricing`, `/faq`, etc.) have NO pattern handler, so tokens are never refreshed before the page renders.

4. **Stale Cookies Cause Refresh Attempts**:
   When a user has old auth cookies (from a previous session), the server component tries to refresh them. Since the refresh token is invalid/expired, Supabase returns 400 errors.

5. **Multiple Parallel Requests**:
   Because React Server Components render in parallel, multiple components may trigger `getClaims()` simultaneously, causing 8 duplicate errors.

**Supporting Evidence**:
- Stack trace shows `refresh_token_not_found` error code
- Network logs show 4+ POST requests to `/auth/v1/token?grant_type=refresh_token` all returning 400
- Marketing layout explicitly calls `requireUser()` on line 10
- No URL pattern in `proxy.ts` handles marketing pages

### How This Causes the Observed Behavior

1. User visits `/` with stale auth cookies in browser
2. Middleware (`proxy.ts`) runs but has no handler for `/` - no token refresh
3. Marketing layout server component calls `requireUser()`
4. `requireUser()` calls `client.auth.getClaims()`
5. Supabase client reads stale cookies, attempts refresh
6. Refresh token is invalid -> 400 error thrown
7. Error is logged but caught (page continues loading)
8. Multiple parallel RSC renders cause 8 duplicate errors

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clear and traceable
- The error message (`refresh_token_not_found`) directly correlates to the refresh attempt
- The marketing layout is the only entry point that calls `requireUser()` for public pages
- The middleware configuration explicitly excludes marketing pages from token refresh

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Modify the marketing layout to use a graceful auth check instead of `requireUser()`:
- Replace `requireUser()` with `getUser()` that returns null for unauthenticated users without throwing
- Handle the null case gracefully in `SiteHeader`

**Option 2**: Add marketing pages to middleware token refresh:
- Add a pattern handler for marketing pages (`/*`) that refreshes tokens before page render
- This adds overhead but prevents errors

**Option 3**: Clear invalid cookies before auth check:
- Detect invalid refresh tokens and clear cookies before attempting validation
- More complex but prevents cascading errors

The recommended fix is Option 1: change the marketing layout to not call `requireUser()` which is designed for protected routes, and instead use a pattern that gracefully handles unauthenticated users.

## Diagnosis Determination

The root cause is confirmed: the marketing layout inappropriately uses `requireUser()` (designed for protected routes) on public pages, causing auth token refresh attempts for all visitors. When visitors have stale cookies, this triggers multiple `AuthApiError: Refresh Token Not Found` errors.

The fix requires changing the auth pattern in the marketing layout to gracefully handle unauthenticated/stale sessions without triggering token refresh errors.

## Additional Context

- The page still loads successfully (HTTP 200) because the errors are caught
- This is a UX/DX issue (console pollution, wasted network requests) not a functional blocker
- Similar patterns in other Makerkit-based projects may have the same issue
- The issue may have existed since the project's inception but went unnoticed

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, Bash (git, gh), Task (context7-expert)*
