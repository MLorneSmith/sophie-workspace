# Context7 Research: Supabase Auth Admin API - generateLink, verifyOtp, and Session Management

**Date**: 2025-11-28
**Agent**: context7-expert
**Libraries Researched**: supabase/auth, supabase/supabase, supabase/supabase-js

## Query Summary

Researched Supabase authentication admin APIs to understand:
1. auth.admin.generateLink() response properties and usage patterns
2. auth.verifyOtp() token types and magic link support
3. Admin impersonation patterns and session creation for other users
4. Relationship between hashed_token from generateLink and verifyOtp
5. Token expiration and single-use token behaviors

## Findings

### 1. auth.admin.generateLink() Response Properties

The generateLink method is an **admin-only** API that requires service_role key and should only be used server-side.

**Response Object:**
```typescript
{
  action_link: string      // Full URL with token
  email_otp: string        // 6-digit OTP code
  hashed_token: string     // Token value from action_link
  verification_type: string // Type: signup, magiclink, recovery, invite
  redirect_to: string      // Redirect URL after verification
}
```

**Supported Types:**
- signup - User registration confirmation
- magiclink - Passwordless authentication
- recovery - Password reset
- invite - User invitation

**Example Usage:**
```javascript
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: 'user@email.com',
  options: { 
    redirectTo: 'http://localhost:3000/welcome' 
  }
})
```

**Important Notes:**
- hashed_token is the same as the token query parameter in action_link
- email_otp is an alternative 6-digit code for email-based verification
- Both hashed_token and email_otp can be used with verifyOtp()

---

### 2. auth.verifyOtp() Token Types and Magic Link Support

The verifyOtp() method is a **client-side** API that validates OTP tokens and returns a session.

**Supported Token Types:**
```typescript
type OtpType = 
  | 'signup'      // Email signup confirmation
  | 'magiclink'   // Email magic link (passwordless login)
  | 'recovery'    // Password recovery
  | 'invite'      // User invitation
  | 'email'       // Generic email OTP
  | 'sms'         // SMS OTP (phone authentication)
```

**Magic Link Verification:**

```javascript
// Method 1: Using token_hash from email link (PKCE flow)
const { data, error } = await supabase.auth.verifyOtp({
  token_hash: 'hash-from-url',
  type: 'email'  // or 'magiclink'
})

// Method 2: Using email_otp from generateLink
const { data, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',  // 6-digit OTP
  type: 'email'
})
```

**Response on Success:**
```typescript
{
  data: {
    user: {
      id: "uuid",
      email: "user@example.com",
      created_at: "timestamp"
    },
    session: {
      access_token: "jwt-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      expires_at: 1678886400,
      token_type: "bearer",
      user: { /* same as above */ }
    }
  }
}
```

**Critical Implementation Details:**

1. **PKCE Flow (Recommended)**: Use token_hash parameter
   - Extract token_hash from URL query params
   - Call verifyOtp({ token_hash, type: 'email' })
   - More secure than direct magic link flow

2. **Email OTP Flow**: Use email + token parameters
   - Token is the 6-digit code from email_otp
   - Requires user to manually enter code
   - 60-second expiration for SMS OTP

3. **Token Expiration**: Tokens are single-use and expire after a short period

---

### 3. Admin Impersonation and Session Creation

**No Official Admin Impersonation API** - Supabase Auth does not provide a direct admin method to create a session for another user.

**Workaround Pattern (Not Recommended for Production):**

The only way to create a session for another user is to:

1. Use admin.createUser() with a known password
2. Sign in as that user with signInWithPassword()

```typescript
// Step 1: Create user with known password (admin API)
const { data: userData, error: createError } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'temporary-password-123',
  email_confirm: true,  // Skip email verification
  user_metadata: {
    full_name: 'John Doe'
  }
})

// Step 2: Sign in as that user (client API)
const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'temporary-password-123'
})
```

**Alternative: Generate Magic Link for User**

A safer approach for admin-initiated user login:

```typescript
// Generate magic link for user (admin API)
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: 'user@example.com',
  options: {
    redirectTo: 'http://localhost:3000/dashboard'
  }
})

// Send user the action_link or email_otp
// User clicks link or enters OTP
// User's browser calls verifyOtp() to create session
```

**Why No Direct Impersonation?**

Security by design - sessions should be tied to actual client requests, not server-generated tokens. This prevents:
- Session hijacking
- Unauthorized access via compromised admin keys
- Violation of audit trails

---

### 4. Relationship Between hashed_token and verifyOtp

**Key Understanding:**

```typescript
// Admin generates link
const { data } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: 'user@example.com'
})

// data.hashed_token === token in data.action_link
```

**Verification Flow:**

```typescript
// Client extracts token_hash from URL
const urlParams = new URLSearchParams(window.location.search)
const token_hash = urlParams.get('token')
const type = urlParams.get('type')

// Client verifies token
const { data: session, error } = await supabase.auth.verifyOtp({
  token_hash,
  type  // 'magiclink', 'signup', 'recovery', etc.
})
```

**Important Notes:**

1. hashed_token is NOT a hash - Despite the name, it's the actual token value
2. Single-use token - Once verified, the token is invalidated
3. Time-limited - Tokens expire (exact duration depends on server config)
4. Type must match - The type parameter must match the original generateLink type

---

### 5. Token Expiration and Single-Use Behavior

**Token Lifecycle:**

1. Generation: admin.generateLink() creates token with expiration
2. Distribution: Token sent to user via email or custom channel
3. Verification: User submits token via verifyOtp()
4. Invalidation: Token is immediately invalidated after successful verification
5. Expiration: Unused tokens expire after configured duration

**Expiration Times (Typical Defaults):**

- Email OTP: 60 seconds
- Magic Links: 1 hour (configurable)
- Recovery Links: 1 hour (configurable)
- Invite Links: 24 hours (configurable)

**Verification Behavior:**

```typescript
// First verification: SUCCESS
const { data: session1 } = await supabase.auth.verifyOtp({
  token_hash: 'abc123',
  type: 'magiclink'
})
// Returns valid session

// Second verification: FAILURE
const { data: session2, error } = await supabase.auth.verifyOtp({
  token_hash: 'abc123',  // Same token
  type: 'magiclink'
})
// error: "Token has already been used" or "Invalid token"
```

---

## Key Takeaways

1. **generateLink is Admin-Only**: Requires service_role key, never use in client code
2. **verifyOtp is Client-Side**: Regular anon key, safe for browser environments
3. **Two Verification Methods**: token_hash (PKCE) or email+token (OTP)
4. **No Direct Impersonation**: Must use workarounds (create user + sign in) or magic links
5. **Tokens are Single-Use**: Once verified, tokens cannot be reused
6. **hashed_token Misnomer**: Despite the name, it's the actual token value
7. **Type Matching Required**: type parameter must match original link type
8. **PKCE Flow Preferred**: More secure than direct token submission

---

## Code Examples

### Complete Admin-to-User Flow

```typescript
// SERVER-SIDE: Admin generates magic link
async function sendMagicLinkToUser(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: 'http://localhost:3000/auth/callback'
    }
  })

  if (error) throw error

  // Send custom email with action_link
  await sendCustomEmail(email, {
    link: data.action_link,
    otp: data.email_otp
  })
  
  return data
}

// CLIENT-SIDE: User verifies magic link
async function handleMagicLinkCallback() {
  // Extract token_hash from URL
  const urlParams = new URLSearchParams(window.location.search)
  const token_hash = urlParams.get('token')
  const type = urlParams.get('type')

  if (!token_hash || !type) {
    throw new Error('Missing token_hash or type')
  }

  // Verify token and create session
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as any
  })

  if (error) throw error

  console.log('User logged in:', data.user.email)
  return data.session
}

// ALTERNATIVE: Email OTP Flow
async function verifyEmailOtp(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,  // 6-digit code from email_otp
    type: 'email'
  })

  if (error) throw error
  return data.session
}
```

### Email Template for PKCE Flow

```html
<h2>Magic Link Login</h2>
<p>Click the link below to log in:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    Log In
  </a>
</p>
<p>Or enter this code: {{ .Token }}</p>
<p>This link expires in 1 hour.</p>
```

---

## Security Best Practices

1. Never expose service_role key - Only use in server-side code
2. Use PKCE flow - More secure than direct OTP submission
3. Validate redirect URLs - Configure allowed redirect URLs in Supabase dashboard
4. Implement rate limiting - Prevent brute-force OTP attacks
5. Use HTTPS - Always use secure connections for auth flows
6. Short token expiration - Keep token lifetimes minimal
7. Single-use enforcement - Tokens should only work once
8. Audit logging - Track all admin.generateLink() calls

---

## Common Pitfalls

1. Using admin client for verifyOtp: Use regular client instead
2. Reusing tokens: Tokens are single-use
3. Wrong type parameter: Type must match generateLink type
4. Missing token_hash extraction: Must parse from URL
5. Exposing service_role key: Never send to client
6. Assuming email is sent: generateLink doesn't send email unless SMTP configured
7. Not handling expiration: Check for expired token errors

---

## Sources

- supabase/auth via Context7 (https://github.com/supabase/auth)
- supabase/supabase via Context7 (https://github.com/supabase/supabase)
- supabase/supabase-js via Context7 (https://github.com/supabase/supabase-js)
