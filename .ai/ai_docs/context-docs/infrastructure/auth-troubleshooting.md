---
# Identity
id: "auth-troubleshooting"
title: "Authentication Troubleshooting Guide"
version: "1.0.0"
category: "reference"

# Discovery
description: "Common authentication issues, debugging approaches, and solutions"
tags: ["troubleshooting", "debugging", "errors", "authentication"]

# Relationships
dependencies: ["auth-overview"]
cross_references:
  - id: "auth-overview"
    type: "parent"
    description: "Main authentication overview"

# Maintenance
created: "2025-09-13"
last_updated: "2025-09-13"
author: "create-context"
---

# Authentication Troubleshooting Guide

## Common Issues

### Session Not Persisting

**Symptoms**: User logged out unexpectedly, session lost on refresh

**Possible Causes**:

- Cookie configuration mismatch
- Domain/subdomain issues
- Incorrect `NEXT_PUBLIC_SITE_URL`
- Browser blocking third-party cookies

**Solutions**:

```typescript
// 1. Check environment variables
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  // Must match actual domain

// 2. Verify cookie settings in middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// 3. Check Supabase client initialization
const supabase = createClient(url, key, {
  cookies: {
    domain: '.yourdomain.com',  // Include subdomain if needed
    sameSite: 'lax',
    secure: true  // For HTTPS
  }
});
```

### MFA Verification Loop

**Symptoms**: Stuck on MFA verification page, AAL level not updating

**Possible Causes**:

- Session not refreshing after MFA verification
- Incorrect redirect logic
- Missing MFA factor enrollment

**Solutions**:

```typescript
// 1. Force session refresh after MFA
const { error } = await supabase.auth.mfa.verify({
  factorId,
  challengeId,
  code
});

if (!error) {
  // Force session refresh
  await supabase.auth.refreshSession();
  router.refresh();  // Next.js router refresh
}

// 2. Check AAL level
const { data: { aal } } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
if (aal === 'aal2') {
  // MFA verified successfully
}
```

### Permission Denied Despite Valid Role

**Symptoms**: User has correct role but can't access resources

**Possible Causes**:

- RLS policies not checking membership correctly
- Stale user session/claims
- Missing team membership record

**Debug Steps**:

```typescript
// 1. Verify membership exists
const { data: membership } = await supabase
  .from('accounts_memberships')
  .select('*')
  .eq('user_id', user.id)
  .eq('account_id', accountId)
  .single();

console.log('Membership:', membership);

// 2. Check RLS policy (run as service role)
const { data, error } = await supabaseAdmin
  .from('protected_table')
  .select('*')
  .eq('account_id', accountId);

// 3. Verify JWT claims (use getClaims for server-side)
const { data, error } = await supabase.auth.getClaims();
console.log('JWT Claims:', data?.claims);
```

### OAuth Callback Errors

**Symptoms**: Social login fails with callback error

**Possible Causes**:

- Redirect URL mismatch in provider settings
- Missing or incorrect OAuth credentials
- Callback route not configured

**Solutions**:

```bash
# 1. Verify redirect URLs in Supabase Dashboard
https://yourdomain.com/auth/callback

# 2. Check OAuth provider settings
- Google Console: Authorized redirect URIs
- GitHub: Authorization callback URL
- Must match exactly (including trailing slashes)

# 3. Verify callback route exists
app/auth/callback/route.ts
```

### Server Action Authentication Failures

**Symptoms**: `enhanceAction` throws authentication errors

**Possible Causes**:

- Missing or expired JWT token
- Incorrect server client initialization
- Auth configuration in enhanceAction

**Debug Pattern**:

```typescript
// 1. Check if cookies are being sent
export const debugAction = enhanceAction(
  async (params, user) => {
    console.log('User:', user);  // Should have user data
    return { userId: user.id };
  },
  {
    auth: true  // Must be true for auth
  }
);

// 2. Verify server client
const client = getSupabaseServerClient();
const { data: { user } } = await client.auth.getUser();
console.log('Server user:', user);
```

## Debugging Tools

### Check Authentication State

```typescript
// Client-side debugging (browser components)
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User:', session?.user);
console.log('Access Token:', session?.access_token);
console.log('Expires at:', session?.expires_at);

// Server-side debugging (ALWAYS use getClaims or requireUser)
const { data, error } = await client.auth.getClaims();
console.log('Claims:', data?.claims);
console.log('AAL Level:', data?.claims?.aal); // aal1 or aal2 (MFA)

// Or use requireUser helper
const auth = await requireUser(client);
console.log('Auth result:', auth);
```

### Verify RLS Policies

```sql
-- Check which policies apply to user
SELECT * FROM pg_policies
WHERE tablename = 'your_table';

-- Test policy with specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid';
SELECT * FROM your_table;
```

### Monitor Auth Events

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);

  switch(event) {
    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
    case 'SIGNED_OUT':
    case 'MFA_CHALLENGE_VERIFIED':
      // Handle events
  }
});
```

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Auth session missing` | No valid session | Check cookies, requireUser |
| `Invalid refresh token` | Token expired/revoked | Sign in again |
| `User not found` | JWT valid but user deleted | Check user existence |
| `MFA verification required` | AAL1 when AAL2 needed | Complete MFA flow |
| `row level security violation` | RLS policy denies access | Check membership, policies |
| `JWT expired` | Access token expired | Refresh session |

### Authentication Assurance Levels (AAL)

- **aal1**: Single-factor authentication (password or OAuth)
- **aal2**: Multi-factor authentication verified
- Check with: `data?.claims?.aal` from `getClaims()`

## Quick Fixes

```typescript
// Force session refresh
await supabase.auth.refreshSession();

// Clear all auth data
await supabase.auth.signOut({ scope: 'global' });

// Check if user is authenticated
const isAuthenticated = !!(await supabase.auth.getUser()).data.user;

// Get fresh user data
const { data: { user } } = await supabase.auth.getUser();
```
