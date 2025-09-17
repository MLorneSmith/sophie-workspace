---
# Identity
id: "auth-configuration"
title: "Authentication Configuration Guide"
version: "1.0.0"
category: "reference"

# Discovery
description: "Environment variables and configuration for authentication setup"
tags: ["configuration", "environment", "setup", "authentication"]

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

# Authentication Configuration

## Environment Variables

### Required Variables

```env
# Supabase Core (Required)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Service role key (server-only)

# Site Configuration (Required)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Must match actual domain
```

### Optional Authentication Settings

```env
# Email Confirmation
NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_CONFIRMATION=false  # Require email verification

# Password Policy
NEXT_PUBLIC_AUTH_PASSWORD_MIN_LENGTH=8  # Minimum password length

# Multi-Factor Authentication
NEXT_PUBLIC_AUTH_ENABLE_MFA=true  # Enable MFA features in UI

# Session Configuration
NEXT_PUBLIC_AUTH_SESSION_LIFETIME=3600  # Session duration in seconds
```

### CAPTCHA Configuration (Optional)

```env
# Cloudflare Turnstile or Google reCAPTCHA
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your-site-key
CAPTCHA_SECRET_KEY=your-secret-key
NEXT_PUBLIC_CAPTCHA_PROVIDER=turnstile  # or 'recaptcha'

# Additional Security (Production)
ENABLE_STRICT_CSP=true  # Content Security Policy
NEXT_PUBLIC_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX=true
NEXT_PUBLIC_AUTH_IDENTITY_LINKING=false  # Link OAuth accounts
```

## Supabase Dashboard Configuration

### Authentication Providers

Enable providers in Supabase Dashboard > Authentication > Providers:

1. **Email Provider**
   - Enable Email Provider
   - Configure email templates
   - Set confirmation expiry

2. **OAuth Providers**
   ```
   Google:
   - Client ID: from Google Cloud Console
   - Client Secret: from Google Cloud Console
   - Redirect URL: https://[project-ref].supabase.co/auth/v1/callback

   GitHub:
   - Client ID: from GitHub OAuth Apps
   - Client Secret: from GitHub OAuth Apps
   - Redirect URL: https://[project-ref].supabase.co/auth/v1/callback
   ```

### URL Configuration

Supabase Dashboard > Authentication > URL Configuration:

```
Site URL: https://yourdomain.com
Redirect URLs:
- https://yourdomain.com/**
- http://localhost:3000/** (for development)
```

### Email Templates

Customize in Dashboard > Authentication > Email Templates:

- Confirmation Email
- Password Reset
- Magic Link
- Change Email

## Local Development Setup

### `.env.local` File

```env
# Development Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
SUPABASE_SERVICE_ROLE_KEY=local-service-key

# Local site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Disable features for local dev
NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_CONFIRMATION=false
NEXT_PUBLIC_CAPTCHA_SITE_KEY=test-key
```

### Supabase Local Setup

```bash
# Start Supabase locally
npx supabase start

# Get local credentials
npx supabase status

# Reset local database
npx supabase db reset
```

## Security Best Practices

### Environment Variable Security

```typescript
// Never expose service role key to client
// ❌ Wrong
const client = createClient(url, serviceRoleKey);

// ✅ Correct - use anon key for client
const client = createClient(url, anonKey);

// ✅ Correct - service role only on server
const adminClient = createClient(url, serviceRoleKey, {
  auth: { persistSession: false }
});
```

### Cookie Configuration

```typescript
// Production cookie settings
const cookieOptions = {
  name: 'sb-auth-token',
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.yourdomain.com',
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax' as const,                       // CSRF protection
  httpOnly: true,                                 // XSS protection (no JS access)
  maxAge: 60 * 60 * 24 * 7,                      // 7 days for refresh token
  path: '/',                                       // Available across entire site
};

// Session cookie configuration (shorter lived)
const sessionCookieOptions = {
  ...cookieOptions,
  name: 'sb-access-token',
  maxAge: 60 * 15,  // 15 minutes for access token
};
```

## Validation Rules

```typescript
// Password validation
const passwordRules = {
  minLength: parseInt(process.env.NEXT_PUBLIC_AUTH_PASSWORD_MIN_LENGTH || '8'),
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

// Email validation
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

## Testing Configuration

```env
# E2E Test Environment
E2E_SUPABASE_URL=http://localhost:54322
E2E_SUPABASE_ANON_KEY=test-anon-key
E2E_TEST_USER_EMAIL=test@example.com
E2E_TEST_USER_PASSWORD=TestPass123!
```

## Monitoring & Logging

```typescript
// Enable auth event logging
if (process.env.NODE_ENV === 'development') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Auth Event]', event, session?.user?.id);
  });
}
```