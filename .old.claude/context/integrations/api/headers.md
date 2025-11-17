---
# Identity
id: "api-headers"
title: "API Headers Documentation"
version: "2.0.0"
category: "api"

# Discovery
description: "Essential HTTP headers used in the SlideHeroes API, focusing on authentication, security, and server patterns"
tags: ["headers", "authentication", "security", "cors", "csrf", "supabase", "api"]

# Relationships
dependencies: []
cross_references:
  - id: "supabase-auth"
    type: "related"
    description: "Supabase authentication implementation"
  - id: "server-actions"
    type: "related"
    description: "Server actions using enhanceAction"
  - id: "middleware"
    type: "related"
    description: "Next.js middleware configuration"

# Maintenance
created: "2025-09-12"
last_updated: "2025-09-12"
author: "create-context"
---

# API Headers Documentation

## Overview

SlideHeroes uses Next.js with Supabase authentication, implementing cookie-based sessions for SSR and server components. This document covers the essential headers actively used in the application.

## Authentication Headers

### Supabase Cookie Authentication

**Format**: HTTP-only secure cookies managed by Supabase SSR

```http
sb-<project-ref>-auth-token: <jwt-token>
sb-<project-ref>-auth-token-refresh: <refresh-token>
sb-<project-ref>-auth-token-code-verifier: <verifier>
```

**Cookie Attributes**:

- `HttpOnly`: true (prevents XSS)
- `Secure`: true (production only)
- `SameSite`: Lax
- `Path`: /

### Edge Function Authentication

```http
Authorization: Bearer <access_token>
apikey: <anon_key>
```

## Security Headers

### CSRF Protection

**Cookie**: `csrfSecret`

- Validates all mutating requests
- Exempt: Next.js server actions (built-in protection)
- Library: `@edge-csrf/nextjs`

### Request Correlation

```http
X-Correlation-ID: <uuid-v4>
```

Set automatically by middleware for request tracing.

### Server Action Tracking

```http
X-Action-Path: /path/to/action
Next-Action: <action-id>
```

### Content Security Policy (Optional)

**Enable**: Set `ENABLE_STRICT_CSP=true`

- Uses `@nosecone/next` for CSP headers
- Includes nonce generation for inline scripts
- Allows Supabase origins for WebSocket/API

## Content Headers

### Standard Headers

```http
Content-Type: application/json
Accept: application/json
Accept-Encoding: gzip, deflate, br
```

## CORS Headers (Edge Functions)

### Supabase Edge Functions

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE
```

## Client Headers

### Supabase Client Info

```http
X-Client-Info: supabase-js/2.39.0
```

### Request Origin Tracking

```http
X-Forwarded-For: <client-ip>, <proxy-ips>
User-Agent: <browser-or-app-identifier>
```

## Cache Control

### Basic Patterns

```http
# Public data
Cache-Control: public, max-age=3600

# User-specific
Cache-Control: private, max-age=300

# Sensitive data
Cache-Control: no-cache, no-store, must-revalidate
```

## Implementation Patterns

### Server Action with enhanceAction

```typescript
export const createProjectAction = enhanceAction(
  async (data, user) => {
    // user automatically provided when auth: true
    const client = getSupabaseServerClient();
    // ... action logic
  },
  {
    schema: CreateProjectSchema,
    auth: true,     // Requires authentication
    captcha: false  // Optional captcha
  }
);
```

### Middleware Request ID

```typescript
// middleware.ts
function setRequestId(request: Request) {
  request.headers.set('x-correlation-id', crypto.randomUUID());
}
```

### Protected Route Pattern

```typescript
// Routes under /home/* require authentication
if (!data?.claims) {
  return NextResponse.redirect(
    new URL(`${pathsConfig.auth.signIn}?next=${next}`, origin)
  );
}
```

## Common Patterns

### Authentication Flow

1. Cookies stored via Supabase SSR
2. Middleware validates on each request
3. Server components access via `getSupabaseServerClient()`
4. Server actions use `enhanceAction` wrapper

### MFA Check

```typescript
const requiresMFA = await checkRequiresMultiFactorAuthentication(supabase);
if (requiresMFA) {
  return NextResponse.redirect(new URL(pathsConfig.auth.verifyMfa, origin));
}
```

### Onboarding Check

```typescript
const isOnboarded = userData?.user?.user_metadata?.onboarded === true;
if (!isOnboarded) {
  return NextResponse.redirect(new URL("/onboarding", origin));
}
```

## Quick Troubleshooting

- **Auth cookies not set**: Check HTTPS in production, cookie attributes
- **CSRF failures**: Ensure middleware configured, tokens refreshed
- **CORS errors**: Verify Edge Function headers, OPTIONS handling
- **CSP violations**: Add required origins or disable strict CSP
- **MFA loops**: Check `checkRequiresMultiFactorAuthentication` logic
- **Onboarding redirect**: Verify user_metadata.onboarded flag

## Key Decisions

- **Cookie-based auth**: Better SSR support, XSS protection
- **CSRF with edge-csrf**: Lightweight, edge-compatible
- **Correlation IDs**: Better distributed tracing semantics
- **CSP optional**: Performance vs security tradeoff

## See Also

- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge CSRF](https://github.com/amorey/edge-csrf)
