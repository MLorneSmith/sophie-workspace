# Context7 Research: Supabase Session Management

**Date**: 2026-01-16
**Agent**: context7-expert
**Libraries Researched**: supabase/auth, supabase/ssr, supabase/supabase

## Query Summary

Research into Supabase session management to understand:
1. Whether Supabase allows multiple concurrent sessions for the same user
2. Whether signing in invalidates existing sessions/tokens
3. How @supabase/ssr handles session tokens

## Findings

### 1. Multiple Concurrent Sessions - YES, Supabase Supports Them

**Key Finding**: Supabase Auth explicitly supports multiple concurrent sessions for the same user. This is evidenced by the logout API which provides three distinct scopes:

```bash
# Logout from current session only (default)
curl -X POST 'https://your-project.supabase.co/auth/v1/logout' \
  -H 'Authorization: Bearer ACCESS_TOKEN'

# Logout from ALL sessions (global scope)
curl -X POST 'https://your-project.supabase.co/auth/v1/logout?scope=global' \
  -H 'Authorization: Bearer ACCESS_TOKEN'

# Logout from all OTHER sessions (keep current)
curl -X POST 'https://your-project.supabase.co/auth/v1/logout?scope=others' \
  -H 'Authorization: Bearer ACCESS_TOKEN'
```

The existence of `scope=global` and `scope=others` proves that:
- Multiple sessions CAN exist simultaneously
- Sessions are tracked independently 
- Users can be logged in from multiple devices/browsers concurrently

### 2. Sign-In Does NOT Invalidate Existing Sessions

**Key Finding**: When a user signs in, Supabase creates a NEW session with new tokens. It does NOT invalidate or revoke existing sessions.

Evidence from the token endpoint documentation:
- `POST /auth/v1/token?grant_type=password` creates a new access_token and refresh_token
- Each sign-in generates a unique `session_id` in the JWT payload
- The response includes `"session_id": "session-uuid"` - each login gets its own session

**Implication**: If the same user signs in from:
- Browser A at 10:00 AM -> Creates Session 1
- Browser B at 11:00 AM -> Creates Session 2
- Both Session 1 and Session 2 remain valid and can be used independently

### 3. @supabase/ssr Token Handling

The `@supabase/ssr` package handles sessions via cookies with these key mechanisms:

**Cookie-Based Storage**:
```typescript
const supabase = createServerClient(
  'https://your-project.supabase.co',
  'your-anon-key',
  {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      }
    }
  }
)
```

**Token Refresh in Middleware**:
```typescript
// This refreshes a user's auth token automatically
await supabase.auth.getUser()
```

**Cookie Chunking for Large Tokens**:
- Uses `createChunks()` and `combineChunks()` utilities
- Default chunk size: 3180 bytes (MAX_CHUNK_SIZE)
- Handles large JWTs that exceed cookie size limits

**Key Behavior**:
- Each browser/client stores its OWN session tokens in cookies
- Token refresh happens per-session, not globally
- Refreshing tokens on one client does NOT affect other clients
- `supabase.auth.getSession()` is async to handle race conditions across tabs

### 4. Token Refresh Behavior

**Token Rotation**:
- When enabled, each refresh generates a new refresh_token
- Old refresh tokens become invalid after use
- This is a security feature, not session invalidation

**Per-Session Refresh**:
```typescript
// v2 API - async to prevent race conditions across tabs
const { data } = await supabase.auth.getSession()
```

The supabase-js v2 update specifically addressed "race conditions for token refreshing across multiple tabs" - confirming that multiple sessions (even in tabs) are supported.

## Key Takeaways

1. **Multiple Sessions Are Supported**: Supabase allows users to be logged in from multiple devices/browsers simultaneously. Each sign-in creates an independent session.

2. **Sign-In Does NOT Invalidate Other Sessions**: Logging in creates a new session without affecting existing ones. To invalidate other sessions, you must explicitly call `signOut({ scope: 'global' })` or `signOut({ scope: 'others' })`.

3. **Sessions Are Token-Pair Based**: Each session is represented by an access_token + refresh_token pair. These are independent across clients.

4. **SSR Handles Per-Client Storage**: `@supabase/ssr` stores session tokens in cookies per-client. Each browser maintains its own session independently.

5. **To Force Single Session**: If you want to invalidate other sessions when a user logs in, you must explicitly implement this:
   ```typescript
   // After successful sign-in, invalidate other sessions
   await supabase.auth.signOut({ scope: 'others' })
   ```

## Code Examples

### Check Active Sessions (Admin API)
There is no direct "list sessions" API, but you can:
- Use the `scope` parameter on logout to manage sessions
- Track sessions manually in your own database

### Force Single-Session Login
```typescript
async function signInSingleSession(email: string, password: string) {
  // Sign in first
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  // Then invalidate all other sessions
  await supabase.auth.signOut({ scope: 'others' })
  
  return data
}
```

### Sign Out From All Devices
```typescript
// Global logout - invalidates ALL sessions including current
await supabase.auth.signOut({ scope: 'global' })
```

## Sources

- supabase/auth via Context7 - Session and logout endpoint documentation
- supabase/ssr via Context7 - Cookie handling and session management
- supabase/supabase via Context7 - General session and sign-out documentation
