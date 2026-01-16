# Perplexity Research: Supabase Concurrent Sessions and signInWithPassword Behavior

**Date**: 2026-01-16
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched how Supabase handles token refresh when the same user signs in from multiple locations, specifically:
1. Does signInWithPassword create a NEW session with NEW tokens?
2. Does this affect/invalidate the refresh_token of OTHER sessions?
3. What happens to existing sessions when signInWithPassword is called?

## Findings

### 1. signInWithPassword ALWAYS Creates a New Session

**Yes, `signInWithPassword` always creates a new row in `auth.sessions` table with fresh access and refresh tokens.**

Key behaviors:
- Each call to `signInWithPassword` generates a **new session entry** with new tokens
- Access tokens are short-lived (default 1 hour, configurable 5 minutes to 1 hour)
- Refresh tokens are long-lived and single-use (can only be exchanged once for a new token pair)
- The session is stored in `auth.sessions` table with a unique `session_id`

### 2. Other Sessions Are NOT Automatically Invalidated

**No, signing in again does NOT invalidate refresh tokens from other sessions.**

By default, Supabase allows:
- **Unlimited concurrent sessions** per user across multiple devices
- Each session operates **completely independently**
- Tokens from one device do not affect tokens on other devices
- Sessions remain valid until explicitly revoked

### 3. Sessions Remain Independent Unless Specific Actions Occur

A session terminates only when:
- User explicitly signs out (`signOut()`)
- User changes their password
- User performs a security-sensitive action
- Session times out due to inactivity (if configured)
- Session reaches maximum lifetime (if configured)
- "Single session per user" is enabled (Pro plan feature)

### Important Caveats

#### Default signOut Behavior Issue
There is a known issue/design consideration: **`signOut()` defaults to `scope: 'global'`** which revokes ALL sessions across all devices. To sign out only the current device, you must explicitly use:

```typescript
await supabase.auth.signOut({ scope: 'local' })
```

#### Refresh Token Rotation
- Refresh tokens can only be used **once**
- After use, the old token is revoked and a new one is issued
- There's a 10-second reuse interval to handle race conditions (multiple tabs)
- If a refresh token is reused outside this interval, the entire session is terminated

#### Single Session Per User (Pro Plan)
If you need to enforce single session:
- Enable "Single session per user" in Auth settings
- The most recently active session remains valid
- Other sessions are terminated when they next try to refresh

## Technical Details

### Session Storage
- Sessions are stored in `auth.sessions` table
- Each session has a unique `session_id` (UUID)
- Access tokens contain a `session_id` claim in the JWT

### Token Lifecycle
```
signInWithPassword → New session created in auth.sessions
                   → New access_token (JWT) generated
                   → New refresh_token generated
                   → Both tokens returned to client
```

### Multi-Device Flow
```
Device A: signInWithPassword → Session A created (tokens A)
Device B: signInWithPassword → Session B created (tokens B)
         (Session A remains valid)
         
Device A: signOut() [default global] → BOTH sessions revoked
Device A: signOut({ scope: 'local' }) → Only Session A revoked
```

## Sources & Citations

1. **Supabase User Sessions Documentation**
   - https://supabase.com/docs/guides/auth/sessions
   - Authoritative source on session management

2. **GitHub Issue #2036 - Multi-Session Authentication Bug**
   - https://github.com/supabase/auth/issues/2036
   - Documents issues with local vs global logout behavior

3. **GitHub Issue #201 - Refresh Token revocation spans sessions**
   - https://github.com/supabase/auth-js/issues/201
   - Historical context on multi-session token management

4. **GitHub Issue #213 - Concurrent token refreshes**
   - https://github.com/supabase/auth-js/issues/213
   - Details on refresh token reuse detection and race conditions

5. **Supabase refreshSession API Reference**
   - https://supabase.com/docs/reference/javascript/auth-refreshsession
   - Technical reference for session refresh

## Key Takeaways

1. **signInWithPassword always creates a NEW session** - it never returns an existing session
2. **Sessions are independent by default** - signing in elsewhere does not affect existing sessions
3. **Be careful with signOut()** - the default is `scope: 'global'` which logs out ALL devices
4. **Refresh tokens are single-use** - with a 10-second reuse grace period for race conditions
5. **Single-session enforcement is a Pro plan feature** - not the default behavior

## Related Searches

- How to implement session management dashboard in Supabase
- Supabase Admin API for revoking specific sessions
- Implementing "sign out all other devices" feature
- Best practices for Supabase session security in production

