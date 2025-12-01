# Context7 Research: Supabase SSR Authentication for Public Pages

**Date**: 2025-11-28
**Agent**: context7-expert
**Libraries Researched**: supabase/ssr, supabase/supabase, supabase/supabase-js

## Query Summary

Researched Supabase server-side authentication patterns for Next.js App Router, focusing on:
1. How getClaims(), getSession(), and getUser() differ
2. Token refresh behavior and error handling
3. Best practices for public pages with optional authentication
4. Cookie handling with @supabase/ssr package

## Findings

### 1. @supabase/ssr Package Behavior

#### Cookie Management

The @supabase/ssr package requires explicit cookie handling through getAll() and setAll() methods.

**Key Insight**: setAll() is:
- **Optional** in Server Components (will log warning if mutations occur)
- **Required** in Middleware (for session refresh)
- **Required** in Route Handlers (for auth operations)

#### Cookie Encoding

Cookies are Base64-URL encoded by default for RFC compliance (cookieEncoding: 'base64url').

### 2. Authentication Methods Comparison

#### getSession() vs getUser() vs getClaims()

**Documentation does NOT explicitly cover getClaims()** - this method was not found in the Supabase SSR or supabase-js documentation retrieved.

**getSession()** - Returns session from local storage/cookies (fast, but can be stale)

**getUser()** - Validates token with Supabase server (slower, but always accurate)

**Critical Difference**:
- getSession() reads from client-side storage
- getUser() validates with server
- **Recommendation**: Use getUser() in Server Components for security

### 3. Middleware Pattern for Token Refresh

The middleware automatically refreshes expired sessions.

**Critical Notes**:
1. **DO NOT** run code between createServerClient and getUser()
2. getUser() automatically refreshes expired tokens
3. **MUST** return the supabaseResponse object as-is to preserve cookies
4. **MUST** set cookies on both request AND response objects

### 4. Server Component Pattern (Read-Only)

For Server Components, implement read-only cookie handling - setAll() can be empty or omit mutations.

### 5. Handling Expired/Invalid Refresh Tokens

**Documentation does NOT explicitly cover error handling for invalid refresh tokens**, but based on patterns:

**Graceful Handling**:
- getUser() returns { data: { user: null }, error: null } if token invalid
- No error thrown - just null user
- Check for user existence, not error presence

### 6. Authentication State Change Events

For client-side auth state tracking, use onAuthStateChange:
- Events: 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'

### 7. Cookie Chunking for Large Sessions

Sessions are automatically chunked if they exceed cookie size limits (default: 3180 bytes per chunk).

## Key Takeaways

### Best Practices for Public Pages with Optional Auth

1. **Use Middleware for Token Refresh**:
   - Call getUser() in middleware to trigger automatic refresh
   - Set cookies on both request and response
   - Return the response object with cookies intact

2. **Server Components are Read-Only**:
   - Don't implement setAll() mutations in Server Components
   - Middleware handles all session mutations
   - Server Components just read current auth state

3. **Graceful Null Handling**:
   - getUser() returns null user when not authenticated
   - No exceptions thrown for missing/invalid tokens

4. **Security**: Use getUser() over getSession()
   - getSession() can be manipulated client-side
   - getUser() validates with server

5. **Avoid Code Between Client Creation and getUser()**
   - Can cause random logout issues

6. **Cookie Encoding**:
   - Use default base64url encoding

## Sources

- **@supabase/ssr** via Context7 (supabase/ssr)
- **Supabase Docs** via Context7 (supabase/supabase)
- **@supabase/supabase-js** via Context7 (supabase/supabase-js)

## Gaps in Documentation

1. **getClaims() method** - Not found in retrieved documentation
2. **Explicit error handling** for invalid/expired refresh tokens
3. **Error types** returned by getUser() when tokens are invalid
4. **Retry logic** when token refresh fails
5. **Session persistence** across browser restarts

## Recommendations for Further Research

1. Check Supabase Discord/GitHub issues for getClaims() usage
2. Test behavior when refresh token is manually invalidated
3. Review @supabase/auth-js source code for error types
4. Test middleware behavior with expired sessions on public pages
