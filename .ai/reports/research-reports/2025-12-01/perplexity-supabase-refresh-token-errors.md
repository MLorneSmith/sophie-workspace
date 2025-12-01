# Perplexity Research: Supabase AuthApiError "Invalid Refresh Token" Error

**Date**: 2025-12-01
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Comprehensive research on the Supabase AuthApiError "Invalid Refresh Token: Refresh Token Not Found" error, including:
- Root causes and triggers of this specific error
- How it relates to @supabase/ssr and server-side rendering
- Cookie handling and session management lifecycle
- Race conditions between server and client components
- Resolution strategies

## Key Findings

### 1. Root Causes of the Error

**Race Condition Between Server and Client (Primary Cause)**

The most common cause is a **race condition between middleware and API routes/server components** attempting to refresh the token simultaneously. The flow breaks down as follows:

1. Middleware calls `supabase.auth.getUser()` to refresh the token
2. API route/server component calls `supabase.auth.getUser()` at nearly the same moment
3. Both attempt to refresh using the same refresh token
4. The first request wins and refreshes the token
5. The second request still tries to use the original refresh token, which has been **consumed** and is now invalid
6. Result: "Invalid Refresh Token: Refresh Token Not Found" error

This is particularly acute with `@supabase/ssr` implementations where both server-side middleware and client-side authentication occur simultaneously.

**Token Already Used Error Variant**

When using `@supabase/ssr` with multiple layouts, the error manifests as `AuthApiError: Invalid Refresh Token: Already Used`. This happens because:
- One client instance refreshes the token first
- Another instance attempts to use the consumed token
- Since refresh tokens can only be exchanged once by design, the second request fails

**Stale Cookies From Browser to Server**

The refresh token sent from the browser to the server may become stale. This occurs when:
- The browser updates the session with `onAuthStateChange()` callbacks
- These updates are not propagated to the server via cookie updates
- Server attempts to use old refresh token
- "Refresh Token Not Found" error occurs

**Token Expiration After Extended Periods**

After 24+ hours (or when actual token expiration occurs):
- Refresh tokens naturally expire per server configuration
- Stale cookies on the client haven't been updated
- Any attempt to refresh fails with "not found" error

### 2. The @supabase/ssr Refresh Token Flow

The `@supabase/ssr` library manages authentication with internal locking mechanisms:

1. Client calls `getUser()` or `getSession()`
2. Internally, a check determines if access token has expired
3. If expired/expiring, `_callRefreshToken()` is called with the refresh token
4. Refresh token is exchanged for new session (access + refresh tokens)
5. New session is saved to storage (cookies)
6. All subscribers notified via `onAuthStateChange()` callbacks

**Critical Limitation**: The lock mechanism only works within a **single client instance** or across **browser tabs/windows of the same browser** using the Broadcast Channel API.

However, **multiple independent client instances** (middleware client + API route client + server component client) do NOT share this lock. They don't coordinate with each other, leading to race conditions.

### 3. Cookie Handling and Session Management

#### Storage Architecture

In SSR scenarios, tokens are stored in **cookies** that are:
- Securely shared between client and server
- Passed back and forth with each request
- Updated when session is refreshed

**Important Note**: Supabase intentionally does NOT make cookies HTTP-only by default. Both access and refresh tokens are designed to be accessible to JavaScript on the client side so the browser client can maintain sessions.

#### The Cookie Update Problem

When middleware refreshes a session, the cookies must be **explicitly updated** in both directions:

1. **Request cookies**: `request.cookies.set()` - Updates the cookies within the same middleware request
2. **Response cookies**: `response.cookies.set()` - Updates the cookies sent back to the browser

**Critical Issue**: If `response.cookies.set()` is not called:
- Browser keeps old/stale tokens
- Next request to server has outdated refresh token
- Server tries to use consumed token
- "Refresh Token Not Found" error occurs

### 4. Race Condition Deep Dive

**Setup**: Next.js app with:
- Middleware that calls `supabase.auth.getUser()` for all routes
- Global navigation that calls `/api/auth/user` API route
- Server components that fetch user data

**Timeline**:
1. Page loads → Middleware and API route start simultaneously
2. Both have the same refresh token from cookies
3. Middleware calls `getUser()` first (slightly ahead)
4. Middleware refreshes token, gets new session
5. API route still executing with original refresh token
6. API route calls `getUser()`, tries to refresh same old token
7. Token has been consumed by middleware
8. Error: "Invalid Refresh Token: Refresh Token Not Found" or "Already Used"

**Why Locks Don't Prevent This**:
- Browser-based clients use Broadcast Channel API for coordination
- Middleware client = separate process instance (Edge Runtime)
- API route client = separate process instance (Node Runtime)
- Server component client = separate process instance
- **These process instances don't share the broadcast channel**
- No coordination mechanism exists between them
- Both independently attempt to refresh

### 5. When Refresh Tokens Are "Not Found"

**Scenario 1: Already Consumed By Another Client**

Most common in SSR:
- Token consumed by middleware refresh
- Another client instance tries to use same token
- Token no longer exists in database (consumed in prior exchange)
- Error: "Refresh Token Not Found"

**Scenario 2: Natural Token Expiration**

- Refresh tokens have configurable expiration (often 24+ hours)
- After expiration, token genuinely doesn't exist
- Any refresh attempt fails with "not found"

**Scenario 3: Stale Cookie Data**

- Browser has old refresh token in cookies
- Server-side token was refreshed and updated in database
- Browser sends old token with request
- Server finds no matching token
- Error: "Refresh Token Not Found"

**Scenario 4: Cookie Cleanup/Deletion**

- Security policies or explicit signOut deletes refresh token
- Browser still has cookie with deleted token value
- Next auth attempt uses deleted token
- Error: "Refresh Token Not Found"

### 6. Recent Issues and Known Problems

**GitHub Issue #18981 - @supabase/ssr Race Conditions**

Issue reported Nov 2023, confirmed by maintainers as a real problem:
- Multiple layouts using serverClient triggers race condition
- Different requests compete to refresh token first
- Winner gets valid tokens, loser gets "Invalid Refresh Token" error
- **Status**: Acknowledged but architectural limitation of SSR pattern with multiple independent clients

**GitHub Issue #68 - Refresh Token Not Found After 24 Hours**

- User waited 24 hours (token expiration window)
- Loaded page that hit middleware
- Got "Invalid Refresh Token: Refresh Token Not Found" error
- **Root Cause**: Token genuinely expired after 24 hours
- **Not truly a bug**, but error handling could be better

### 7. Resolution Strategies

**Strategy 1: Remove Redundant Auth Checks**

Best practice for most applications:

Instead of having auth in BOTH middleware and API routes:
- Only in API route: Single refresh point prevents race conditions
- Middleware only handles i18n/routing, not auth
- Browser has access to updated refresh token in cookies

**Strategy 2: Implement Explicit Cookie Update Pattern**

If middleware is necessary (for RSC data fetching):
- Use `setAll()` to update both request and response cookies in single pass
- Prevents double-loop issue
- Syncs browser with updated tokens

**Strategy 3: Graceful Error Handling**

When "Invalid Refresh Token" is received:
- Check if valid session exists in cookies
- If no session, redirect to login
- If valid session found, retry operation with fresh tokens

**Strategy 4: Disable autoRefreshToken in Server Clients**

Server-side clients should NOT have auto-refresh timers:
- Timers are browser-only pattern
- Server-side refresh happens on-demand via `getUser()` calls
- Auto-refresh on server causes additional race conditions

**Strategy 5: Defer to Browser When Possible**

For server-side errors:
- Browser client has better access to up-to-date refresh tokens than server
- Defer rendering to browser where fresh cookies are available

### 8. Technical Details About Token Lifecycle

**Access Token (JWT)**
- Format: JWT (JSON Web Token)
- Lifetime: Short-lived (default 1 hour)
- Expiration: Checked locally before refresh
- Refresh Trigger: Automatically refreshed when expired/expiring

**Refresh Token**
- Format: Randomly generated string (not JWT)
- Lifetime: Long-lived (default 7 days to 1+ year)
- Validation: Only validated server-side
- Consumption: Single-use - consumed when exchanged for new session
- Revocation: Can be explicitly revoked, or expires naturally

**Session Object**
- Contents: `{ access_token, refresh_token, user, expires_at, expires_in }`
- Updates: Both tokens updated when refresh happens
- Persistence: Must be persisted to cookies after refresh
- Validation: `getUser()` validates access token with server

## Summary of Key Takeaways

1. **Root Cause**: Race conditions between multiple client instances (middleware, API routes, server components) competing to refresh the same token simultaneously

2. **Why It Happens**: Independent process instances don't share the browser's Broadcast Channel API coordination mechanism

3. **Token Consumption**: Refresh tokens are single-use; once consumed by one client, other clients get "not found" errors

4. **Cookie Sync Required**: Refreshed tokens must be explicitly written back to cookies via `response.cookies.set()` or `setAll()`

5. **Best Prevention**: Use single refresh point (API route) instead of redundant auth checks in middleware

6. **Error Recovery**: Defer to browser where possible; implement retry logic with fresh session checks

7. **Server Config**: Disable `autoRefreshToken` on server clients; use on-demand refresh via `getUser()`

8. **Token Lifecycle**: Access tokens expire hourly, refresh tokens can last 7 days+ but are single-use and must be synchronized across clients

## Key Sources

- GitHub Issue #18981 - supabase/supabase (Race condition confirmed by maintainers)
- GitHub Issue #68 - supabase/ssr (Token expiration and middleware patterns)
- Supabase Advanced Guide (Server-side rendering auth and FAQ)
- Supabase Next.js Auth Guide (Middleware implementation)
- GitHub Discussion #22362 (Token refresh mechanics)

## Related Investigations

- Cookie size limits and multi-chunk handling
- Broadcast Channel API limitations in Edge Runtime vs Node.js Runtime
- PKCE flow implementation details
- goTrue server refresh token consumption logic
- Supabase Edge Functions and auth client race conditions
