---
id: "auth-security"
title: "Authentication: Security Model"
version: "3.0.0"
category: "implementation"

description: "Comprehensive security model for SlideHeroes authentication using Next.js, Supabase, and defense-in-depth strategies"
tags: ["security", "authentication", "supabase", "rls", "csrf", "xss", "mfa", "rate-limiting", "audit-logging"]

dependencies: ["auth-integration", "database-security", "server-actions-pattern"]
cross_references:
  - id: "auth-integration"
    type: "related"
    description: "Authentication integration patterns"
  - id: "database-rls"
    type: "prerequisite"
    description: "Row-level security implementation"
  - id: "middleware-security"
    type: "pattern"
    description: "Middleware security patterns"

created: "2025-09-13"
last_updated: "2025-09-13"
author: "create-context"
---

# Authentication: Security Model

## Overview

SlideHeroes implements defense-in-depth security with Next.js App Router, Supabase Auth, and multiple protection layers against OWASP Top 10 vulnerabilities.

## Security Architecture

```
Network Layer    → HTTPS/TLS, CSP (Nosecone), Security Headers
     ↓
Middleware Layer → CSRF (@edge-csrf/nextjs), Rate Limiting, Route Protection
     ↓
Auth Layer       → Server-side validation, JWT in HTTP-only cookies, MFA (TOTP)
     ↓
Database Layer   → Row-Level Security, Security Invoker Functions, Audit Logging
```

## Threat Model

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Credential Compromise** | Account takeover | MFA, password complexity, breach detection |
| **Session Hijacking** | Unauthorized access | HTTP-only cookies, secure flag, session rotation |
| **XSS Attacks** | Script injection | CSP, input sanitization, React auto-escaping |
| **CSRF Attacks** | Forged requests | CSRF tokens, SameSite cookies |
| **SQL Injection** | Database compromise | RLS, parameterized queries, Supabase client |
| **Brute Force** | Account compromise | Rate limiting, account lockout |
| **Token Theft** | Session compromise | Short-lived tokens (15min), refresh rotation |

## Security Controls

### 1. CSRF Protection

- **Library**: `@edge-csrf/nextjs`
- **Implementation**: `/apps/web/middleware.ts:withCsrfMiddleware()`
- **Config**: Ignores server actions (built-in protection), validates all other POST requests
- **Cookie**: Secure, HttpOnly, SameSite=lax

### 2. Content Security Policy

- **Library**: `@nosecone/next`
- **Implementation**: `/apps/web/lib/create-csp-response.ts`
- **Key Directives**:
  - `default-src 'self'`
  - `connect-src` includes Supabase URLs
  - Nonce-based inline scripts
  - HSTS with preload
- **Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy

### 3. Input Validation & Sanitization

- **Library**: Zod for schemas, DOMPurify for HTML
- **Pattern**: All server actions use `enhanceAction` wrapper
- **Implementation**: `/packages/next/src/actions/index.ts`
- **Validation**: Email (RFC 5322), names (alphanumeric), length limits
- **Sanitization**: HTML content, SQL parameters, file uploads

### 4. Row-Level Security (RLS)

- **Location**: `/apps/web/supabase/schemas/*.sql`
- **Pattern**: Enable RLS on all tables
- **Key Functions**:
  - `has_role_on_account()` - Check user permissions
  - `is_account_owner()` - Verify ownership
- **Security**: Functions use `security definer` with `set search_path = ''`
- **Policies**: SELECT/INSERT/UPDATE/DELETE with user context checks

### 5. Multi-Factor Authentication

- **Type**: TOTP (Time-based One-Time Password)
- **Implementation**: `/packages/supabase/src/check-requires-mfa.ts`
- **AAL Levels**: aal1 (password only), aal2 (password + MFA)
- **Flow**: Check factors → Verify AAL → Redirect if needed
- **Components**: `/packages/features/auth/src/components/multi-factor-*`

### 6. Session Management

- **Validation**: Server-side only via `getClaims()`
- **Implementation**: `/packages/supabase/src/require-user.ts`
- **Token Lifetime**: Access (15min), Refresh (7 days)
- **Storage**: HTTP-only cookies with secure flags
- **Rotation**: Automatic refresh token rotation on use

### 7. Rate Limiting

- **Library**: `@upstash/ratelimit` with Redis
- **Limits**:
  - Login: 5 attempts/minute
  - Register: 3 attempts/hour
  - Password reset: 3 attempts/hour
  - API: 100 requests/minute
- **Pattern**: Sliding window, IP-based identification
- **Progressive Lockout**: 5 failures = 15min, 10 failures = 1hr

### 8. Audit Logging

- **Library**: `@kit/shared/logger`
- **Events**: auth_attempt, auth_success, auth_failure, mfa_challenge, suspicious_activity
- **Context**: User ID, IP, User Agent, Timestamp
- **Implementation**: Security event logger with structured logging
- **Alerting**: Critical events trigger notifications

## Attack Prevention

### XSS Prevention

- React auto-escaping
- CSP blocks inline scripts
- DOMPurify for user HTML
- Zod validation on inputs

### SQL Injection Prevention

- Supabase parameterized queries
- RLS enforces access control
- No raw SQL from client
- Input validation pre-database

### CSRF Prevention

- CSRF tokens via middleware
- SameSite=lax cookies
- Server actions protected
- State changes require auth

### Session Security

- HTTP-only cookies (no JS access)
- Secure flag (HTTPS only)
- Short-lived tokens
- Refresh rotation on use

## Security Checklist

### Development

- [ ] Enable RLS on new tables
- [ ] Use `enhanceAction` for server actions
- [ ] Validate with Zod schemas
- [ ] Never expose API keys in client
- [ ] Use `getClaims()` for auth checks

### Deployment

- [ ] Enable strict CSP in production
- [ ] Configure Supabase Auth providers
- [ ] Set up rate limiting (Upstash)
- [ ] Enable audit logging
- [ ] Configure all security headers
- [ ] Set secure cookie flags

### Monitoring

- [ ] Track failed auth attempts
- [ ] Monitor rate limit violations
- [ ] Review security logs
- [ ] Check for suspicious patterns
- [ ] Update dependencies regularly

## Key Files

- **Middleware**: `/apps/web/middleware.ts`
- **CSP Config**: `/apps/web/lib/create-csp-response.ts`
- **Server Actions**: `/packages/next/src/actions/index.ts`
- **Auth Validation**: `/packages/supabase/src/require-user.ts`
- **RLS Policies**: `/apps/web/supabase/schemas/*.sql`
- **MFA**: `/packages/features/auth/src/mfa.ts`

## Troubleshooting

### Invalid CSRF token

- **Fix**: Check CSRF middleware config and cookie settings

### CSP violations

- **Fix**: Add trusted sources to CSP config or use nonces

### Users bypassing RLS

- **Fix**: Never expose service role key, enable RLS on all tables

### MFA redirect loop

- **Fix**: Ensure AAL level updates after MFA verification

## See Also

- [auth-implementation.md](./auth-implementation.md): Authentication implementation
- [database-patterns.md](../development/database-patterns.md): Database security patterns
