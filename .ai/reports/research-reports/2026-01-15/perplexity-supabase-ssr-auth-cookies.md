# Perplexity Research: Supabase SSR Cookie Authentication Issues

**Date**: 2026-01-15
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Comprehensive research on Supabase SSR cookie authentication issues including:
1. @supabase/ssr cookies not recognized by middleware
2. Playwright E2E tests failing with Supabase auth cookies
3. Cookie injection issues with Vercel preview deployments
4. "Session not found" with pre-authenticated storage states
5. Supabase SSR cookie encoding format compatibility

---

## 1. @supabase/ssr Cookies Not Recognized by Middleware

### Root Causes

#### Next.js 15 Async cookies() Breaking Change
- **Issue**: cookies() is now async in Next.js 15, breaking synchronous Supabase SSR middleware
- **GitHub Issue**: supabase/supabase#30021 (closed Oct 2024)
- **Related PR**: vercel/next.js#71631

**Solution**: Make createClient() async and await cookies()

#### Library Version Mismatches
- **Issue**: Mixing @supabase/ssr with @supabase/auth-helpers-nextjs causes cookie conflicts
- **Problematic Version**: @supabase/ssr@0.5.0 introduced auth issues
- **GitHub Issue**: supabase/ssr#36

**Solution**: Use @supabase/ssr@0.5.2+ consistently everywhere. Never mix client creation methods.

#### Middleware Cookie Propagation Failures
- **Issue**: Cookies set in middleware don't persist to responses or get deleted after redirects
- **Cause**: Not properly copying cookies to the response object

**Solution**: In middleware setAll(), update BOTH request.cookies AND supabaseResponse.cookies

#### Prefetch-Induced Cookie Deletion
- **Issue**: Next.js prefetches logout links, triggering cookie removal
- **Solution**: Disable prefetch on auth/logout links with prefetch={false}

---

## 2. Playwright E2E Tests Failing with Supabase Auth Cookies

### The Problem

Supabase SSR requires **dual storage**: cookies for server-side and localStorage for client-side. Standard Playwright storageState only handles cookies and localStorage, but Supabase-specific handling is needed.

### Solution: Setup Project with Supabase REST API Authentication

Use a setup project that:
1. Authenticates via Supabase REST API with signInWithPassword
2. Sets cookies for SSR (sb-access-token, sb-refresh-token)
3. Sets localStorage for client-side Supabase
4. Saves to storageState file

### Key Requirements for SSR Apps

| Property | Value | Reason |
|----------|-------|--------|
| httpOnly | false | Supabase client needs token access |
| secure | true (prod) / false (local) | HTTPS requirement |
| sameSite | Lax or None | Cross-site compatibility |
| domain | Match your app domain | Cookie must be sent |

### Reset Auth for Guest Tests

Use storageState: { cookies: [], origins: [] } to run unauthenticated tests.

---

## 3. Vercel Preview Deployment Cookie Issues

### Root Causes

1. **Mismatched Redirect URLs**: Preview URLs not in Supabase allowed list
2. **Dynamic URL Not Implemented**: Hardcoded redirects fail on previews
3. **SameSite Cookie Attributes**: Preview deployments enforce stricter policies

### Solutions

#### Configure Supabase Redirect URLs

Add to Supabase Auth > URL Configuration > Additional Redirect URLs:
- https://*.vercel.app/**/*
- http://localhost:3000/**/*

#### Dynamic redirectTo Implementation

Use a getRootURL() function that checks:
1. NEXT_PUBLIC_ROOT_DOMAIN_URL (production)
2. NEXT_PUBLIC_VERCEL_BRANCH_URL (branch previews)
3. NEXT_PUBLIC_VERCEL_URL (all previews)
4. Fallback to localhost

**CRITICAL**: Do NOT set NEXT_PUBLIC_SITE_URL for Preview environment in Vercel. Let NEXT_PUBLIC_VERCEL_URL take precedence automatically.

---

## 4. "Session Not Found" with Pre-Authenticated Storage States

### Root Causes

1. **Expired Sessions**: JWT expires (~1 hour), database session up to 2 weeks
2. **No Auto-Refresh**: Sessions not refreshed on focus/inactivity
3. **Client/Server Mismatch**: Using wrong client type for context

### Solutions

#### Always Use Server-Appropriate Clients
Use createServerComponentClient for server components/middleware.

#### Middleware Session Refresh
Call supabase.auth.getSession() in middleware to refresh sessions.

#### Client-Side Auth State Listener
Use onAuthStateChange to keep client state in sync.

### Important: Use getUser() Not getSession()

- SECURE: getUser() validates JWT with Supabase server
- INSECURE: getSession() can be spoofed in server contexts

---

## 5. Supabase SSR Cookie Encoding Format

### Cookie Structure

| Cookie Name | Content | Format |
|-------------|---------|--------|
| sb-PROJECT_REF-auth-token | Access token (JWT) | Base64-encoded JSON |
| sb-PROJECT_REF-auth-token-code-verifier | PKCE verifier | Base64-encoded string |

### Common Compatibility Issues

#### Cross-Origin Redirects Ignore Set-Cookie
**Problem**: Set-Cookie ignored when redirect origin differs from target (e.g., 127.0.0.1 vs localhost)
**Solution**: Ensure SITE_URL matches redirectTo origin exactly

#### URL Mismatch Between Client/Server
**Problem**: Different Supabase URLs cause mismatched cookie names
**Solution**: Use identical NEXT_PUBLIC_SUPABASE_URL everywhere

### Manual Cookie Handling for Redirects
When redirecting, manually copy cookies from request to cookie store before redirect.

---

## Summary: Common Issues and Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Next.js 15 cookies() async | Make createClient() async, await cookies() |
| Cookies not persisting | Ensure setAll() updates both request AND response |
| Version conflicts | Use only @supabase/ssr@0.5.2+, no auth-helpers mix |
| Prefetch deleting cookies | Add prefetch={false} to logout links |
| Playwright auth fails | Set both cookies AND localStorage |
| Preview deployments fail | Add https://*.vercel.app/**/* to redirects |
| Session not found | Call getSession() before getUser() |
| localhost vs 127.0.0.1 | Use consistent origin in SITE_URL and redirectTo |

---

## Sources and Citations

### GitHub Issues
- supabase/supabase#30021 - Next.js 15 async cookies()
- supabase/ssr#36 - Cookies not setting properly
- supabase/supabase#27505 - Middleware auth examples
- supabase/discussions/2760 - Vercel preview handling

### Official Documentation
- Supabase SSR Guide: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Advanced SSR Guide: https://supabase.com/docs/guides/auth/server-side/advanced-guide
- Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Playwright Authentication: https://playwright.dev/docs/auth

### Community Resources
- Login at Supabase via REST API in Playwright: https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test
- Testing Supabase Magic Login with Playwright: https://www.bekapod.dev/articles/supabase-magic-login-testing-with-playwright/
- Supawright - Playwright Test Harness: https://github.com/isaacharrisholt/supawright
- Vercel Community Discussions on Supabase Auth

---

## Key Takeaways

1. **Next.js 15 requires async cookie handling** - Update all Supabase client creation code
2. **Use consistent library versions** - Never mix @supabase/ssr with auth-helpers
3. **Playwright needs dual storage** - Both cookies (SSR) and localStorage (client)
4. **Vercel previews need wildcard URLs** - And dynamic redirectTo implementation
5. **Always use getUser() server-side** - getSession() is not secure for server validation
6. **Watch for origin mismatches** - 127.0.0.1 vs localhost will break Set-Cookie

---

## Related Searches

- Supabase PKCE flow implementation details
- Next.js 16 middleware cookie handling changes
- Playwright global setup best practices
- Supabase row-level security with SSR
