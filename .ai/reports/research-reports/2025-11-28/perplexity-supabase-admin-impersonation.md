# Perplexity Research: Supabase Admin User Impersonation

**Date**: 2025-11-28
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched the proper implementation of user impersonation in Supabase using the admin API, focusing on:
1. The correct way to use `generateLink` and `verifyOtp` together
2. Why `verifyOtp` might reject freshly generated `hashed_token`
3. Alternative approaches for admin impersonation

## Key Findings

### 1. Correct Implementation Pattern (PKCE Flow)

The modern Supabase authentication flow (v0.7.0+) uses PKCE (Proof Key for Code Exchange), which requires:

**Step 1: Generate Magic Link with Admin Client**
```typescript
const supabase = getSupabaseAdminClient(); // service_role key

const linkResponse = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email: "user@example.com",
});

const tokenHash = linkResponse.data.properties.hashed_token;
```

**Step 2: Create Login URL**
```typescript
const searchParams = new URLSearchParams({
  token_hash: tokenHash,
  next: "/dashboard"
});

const loginLink = `/auth/confirm?${searchParams}`;
// Redirect admin to this URL
```

**Step 3: Server-Side Route Handler for Token Verification**
```typescript
// app/auth/confirm/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token_hash = searchParams.get('token_hash')
  const next = searchParams.get('next') ?? '/'
  
  if (token_hash) {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash
    })
    
    if (!error) {
      return NextResponse.redirect(new URL(`/${next.slice(1)}`, req.url))
    }
  }
  
  return NextResponse.redirect(new URL('/auth/auth-code-error', req.url))
}
```

### 2. Why `verifyOtp` Might Fail Immediately

#### Common Causes:

**A. Token Type Mismatch**
- Generated with `type: "magiclink"` but verified with wrong type
- Solution: Ensure type matches in both calls

**B. Wrong Client Used**
- Using admin client for verification instead of regular client
- **CRITICAL**: Admin client generates the link, but regular client (with cookie support) must verify it

**C. Token Already Consumed**
- Only ONE OTP is valid at a time per user
- Subsequent `generateLink()` calls invalidate previous tokens
- After successful `verifyOtp()`, the token is consumed and cannot be reused

**D. Parameter Confusion**
```typescript
// ❌ WRONG: Using admin client to verify
const adminClient = createClient(url, serviceRoleKey)
await adminClient.auth.verifyOtp({ token_hash, type: "magiclink" })

// ✅ CORRECT: Using regular client with cookie support
const client = createRouteHandlerClient({ cookies })
await client.auth.verifyOtp({ token_hash, type: "magiclink" })
```

**E. Property Access Path**
```typescript
// The response structure:
const response = await supabase.auth.admin.generateLink({...})

// ✅ CORRECT property path:
const tokenHash = response.data.properties.hashed_token

// Also available (but don't use for PKCE):
// response.data.properties.action_link
// response.data.properties.email_otp
```

### 3. Token Naming Clarification

**`hashed_token`** - Property name in `generateLink()` response
**`token_hash`** - Parameter name in `verifyOtp()` method

These refer to the **same value** but with different naming conventions:
```typescript
// Extract from generateLink response
const { hashed_token } = linkResponse.data.properties;

// Pass to verifyOtp as token_hash parameter
await supabase.auth.verifyOtp({
  type: "magiclink",
  token_hash: hashed_token  // Same value, different parameter name
});
```

### 4. Alternative Approaches

**A. Service Role with User ID Filtering**
- Bypass RLS entirely using service role
- Manually filter by user_id in queries
- **Pros**: Simple, no session management
- **Cons**: Bypasses RLS, requires manual security checks

**B. Supabase Studio Impersonation**
- Built-in feature in Supabase Studio
- **Limitation**: Sets `session_user` to "postgres" instead of "authenticator"
- **Issue**: May not properly test RLS policies that depend on session context

**C. JWT Token Passing**
- Pass user's JWT from client to server functions
- **Limitation**: Token expires and can't be refreshed from multiple places
- **Use case**: Quick, short-lived operations only

## Sources & Citations

1. [Supabase JavaScript verifyOtp Reference](https://supabase.com/docs/reference/javascript/auth-verifyotp)
2. [Supabase Generate Link API](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
3. [Cat Jam: Implement user impersonation](https://catjam.fi/articles/supabase-admin-impersonation)
4. [GitHub Discussion #22073](https://github.com/orgs/supabase/discussions/22073) - Token verification issues
5. [GitHub Discussion #31244](https://github.com/orgs/supabase/discussions/31244) - Service role impersonation
6. [GitHub Issue #20452](https://github.com/supabase/supabase/issues/20452) - Studio impersonation limitations

## Key Takeaways

1. **Use PKCE flow** with `hashed_token` and server-side route handlers (modern pattern)
2. **Admin client generates**, regular client verifies - never mix the two
3. **Token type must match** between `generateLink()` and `verifyOtp()`
4. **Only one valid token** per user at any time - tokens are consumed on use
5. **Implement audit logging** for security and compliance

## Related Searches

- Supabase RLS policy testing strategies
- Next.js cookie management for authentication
- JWT-based impersonation tracking patterns
