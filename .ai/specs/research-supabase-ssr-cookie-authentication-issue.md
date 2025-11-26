# Research: Supabase SSR Cookie Authentication Issues

**Date**: 2025-11-26
**Focus**: @supabase/ssr cookie recognition in Next.js middleware for E2E testing

## Executive Summary

Found multiple documented issues and solutions for `supabase.auth.getClaims()` returning null in Next.js middleware when cookies are present. The root cause is typically:

1. **Improper cookie format** - Cookies must be in exact format @supabase/ssr expects
2. **Missing middleware configuration** - Need proper createServerClient setup with get/set cookie handlers  
3. **Timing issues** - Middleware not properly refreshing tokens before getClaims
4. **Package conflicts** - Using deprecated auth-helpers alongside @supabase/ssr

## Key Findings

### 1. Official Supabase Middleware Pattern (CRITICAL)

**Source**: Supabase SSR Documentation

The correct middleware implementation requires implementing BOTH getAll and setAll in cookies config, calling getUser() or getClaims() to trigger token refresh, and setting cookies on BOTH request and response.

**Key Requirements**:
- Must implement BOTH getAll and setAll in cookies config
- Must call getUser() or getClaims() to trigger token refresh  
- Must set cookies on BOTH request and response

### 2. Cookie Format Issue

**Source**: GitHub Issue supabase-js/1396

Problem: Setting cookies manually via Playwright doesn't work because browser localStorage works but cookies don't get set, middleware can't find the auth cookie even though it's present, and SSR fails to recognize session.

**Root Cause**: Cookies must be set through Supabase client, not manually, because:
1. Supabase uses specific cookie encoding format
2. Multiple cookies involved (auth-token, refresh-token, code-verifier)  
3. Cookie attributes (domain, path, httpOnly, secure) must match exactly

### 3. Playwright E2E Testing Pattern (SOLUTION)

**Source**: Michael Hoffmann's Blog

**Recommended Approach**: Use REST API login + localStorage instead of cookies

This works because Supabase client reads from localStorage by default, REST API provides properly formatted session object, storageState saves BOTH cookies AND localStorage, and subsequent tests load this authenticated state.

### 4. Alternative: Cookie-Based Authentication  

**Source**: Stack Overflow 78825669

For SSR-only apps that require cookies, perform UI login which triggers proper cookie setting, ensures all cookie attributes are set correctly, and requires no manual cookie manipulation.

### 5. Common Mistakes

**Sources**: Multiple GitHub issues and Stack Overflow

1. **Using deprecated auth-helpers** alongside @supabase/ssr - NEVER use both together
2. **Not calling getUser() in middleware** - getClaims() or getUser() MUST be called to refresh tokens
3. **Missing setAll in cookie configuration** - Must implement both getAll AND setAll, setAll must set on BOTH request and response
4. **Manually setting cookie format** - base64-json format may look correct but lacks proper encoding

### 6. Next.js 15 Specific Issues

**Source**: GitHub Issue supabase/30030

Next.js 15 made cookies() async, breaking compatibility. Must await cookies() before passing to createServerClient, affects all middleware and server components.

### 7. Middleware Cookie Propagation Bug

**Source**: Next.js Issue 49442

Known Next.js bug: Cookies set in middleware may not be available in Server Components on first render. Workaround: Force redirect after setting cookies.

## Recommendations for E2E Testing

### Option 1: REST API + localStorage (RECOMMENDED)

**Pros**:
- Fastest execution (no UI interaction)
- Most reliable (no flaky UI tests)  
- Works with both client and SSR
- Proper session format guaranteed

**Cons**:
- Doesn't test actual login UI
- Requires REST API endpoint knowledge

**Use When**: Testing authenticated features (not auth itself), speed and reliability are priorities, CI/CD pipeline execution

### Option 2: UI-Based Login

**Pros**:
- Tests actual user flow
- Guarantees proper cookie setting
- No REST API knowledge needed

**Cons**:
- Slower execution
- Can be flaky (UI changes, loading times)
- Requires login page to be stable

**Use When**: Testing auth flow itself, need full E2E coverage, UI stability is high

### Option 3: Hybrid Approach (BEST)

Use REST API for global setup (speed), UI login for auth flow tests, and reuse saved state for other tests.

## Solutions for Current Bug

### Solution 1: Switch to localStorage (LOW EFFORT, HIGH IMPACT)

Instead of setting cookies manually, set session in localStorage. This works because Supabase client reads from localStorage by default, proper session format guaranteed, and works for both client and SSR (client hydrates from localStorage).

### Solution 2: Use UI Login in Setup (MEDIUM EFFORT, HIGH IMPACT)

Create auth.setup.ts that performs actual UI login. This works because Supabase client sets cookies properly, all cookie attributes correct, and storageState captures everything.

### Solution 3: Fix Middleware Configuration (HIGH EFFORT, HIGH IMPACT)  

Ensure middleware properly implements cookie handlers with getAll and setAll, setting on BOTH request and response, and calling getUser() to trigger refresh. This fixes token refresh in middleware, proper cookie propagation, and session recognition.

### Solution 4: Debug Cookie Format (LOW PRIORITY)

If manual cookie setting is required, capture cookies from working login, compare format with manually set cookies, and ensure all attributes match exactly (name, domain, path, httpOnly, secure, sameSite).

## Related Issues and Resources

### GitHub Issues
- supabase-js/1396 - Cookie not setting in Next.js 14
- supabase/24194 - getUser() returns null in middleware  
- ssr/36 - Cookies not setting properly
- next.js/49442 - Middleware cookies missing

### Stack Overflow
- 78825669 - Persist session in Playwright
- 78074830 - Invalid claim missing sub

### Documentation
- Supabase SSR Guide - Creating client for SSR
- Playwright Auth Docs - Authentication patterns
- Next.js Middleware - Middleware documentation

### Blog Posts  
- Michael Hoffmann - REST API Login with Playwright
- bekapod - Magic Login Testing with CI

## Next Steps

1. **Immediate**: Implement Solution 1 (localStorage approach) - Lowest effort, highest impact
2. **Short-term**: Add Solution 2 (UI login setup) - Better E2E coverage
3. **Medium-term**: Audit middleware configuration (Solution 3) - Ensure proper SSR support
4. **Long-term**: Document patterns in project README - Help future developers

## Conclusion

The core issue is that **@supabase/ssr expects cookies to be set through its client**, not manually. Manual cookie setting bypasses proper encoding, attribute setting, and related cookie management.

**Best practice for E2E testing**: Use REST API login + localStorage, then let Supabase client handle cookie management naturally.

**For SSR apps**: Use UI-based login in setup script to ensure proper cookie setting, then reuse authenticated state across tests.

## URLs Referenced

1. https://supabase.com/docs/guides/auth/server-side/creating-a-client?environment=middleware
2. https://github.com/supabase/supabase-js/issues/1396
3. https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test
4. https://stackoverflow.com/questions/78825669/how-to-persist-session-in-playwright-using-supabase
5. https://bekapod.dev/articles/supabase-magic-login-testing-with-playwright
6. https://github.com/supabase/supabase/issues/24194
7. https://github.com/supabase/ssr/issues/36
8. https://github.com/supabase/supabase/issues/30030
9. https://github.com/vercel/next.js/issues/49442
10. https://www.answeroverflow.com/m/1434905348145287300
11. https://supabase.com/docs/guides/auth/server-side/nextjs
12. https://playwright.dev/docs/auth
