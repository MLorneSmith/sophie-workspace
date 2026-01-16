# Perplexity Research: Playwright Cookie/Auth Issues with Vercel Preview Deployments

**Date**: 2026-01-16
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Investigated why Playwright E2E tests pass locally but fail in CI when running against Vercel preview deployments, specifically focusing on:
1. Playwright `addCookies()` API - `url` property vs explicit `domain` + `path`
2. StorageState cookies not being recognized by deployed environments
3. Authentication/cookie issues specific to Vercel preview deployments
4. Best practices for setting cookies for deployed environments
5. Known incompatibilities between Playwright cookie handling and Next.js middleware

## Key Findings

### 1. URL Property vs Domain + Path Properties

**Finding**: Using explicit `domain` and `path` properties is more reliable than using the `url` property for external/deployed domains.

**Details**:
- Playwright addCookies API requires **either** a `url` OR **both** `domain` and `path`
- Using `url` alone can fail for external domains due to parsing issues or domain matching restrictions
- For cross-origin scenarios, explicit `domain` and `path` values ensure proper cookie matching

**Recommended Format**:

    await context.addCookies([{
      name: 'session_id',
      value: 'abc123',
      domain: 'preview-url.vercel.app',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      expires: Math.floor(Date.now() / 1000) + 3600
    }]);

### 2. StorageState Domain Mismatch Issue

**Finding**: Cookies saved on localhost during globalSetup have domain values that don't match deployed domains.

**Root Cause**: When storageState is recorded against localhost:3000, cookies are saved with domain ".localhost" which browsers reject when the test runs against deployed domains like preview-url.vercel.app.

**Solutions**:
1. **Record storageState on the target deployed domain** (generate auth state specifically for preview URLs)
2. **Login per-test with dynamic hosts** - Extend test fixture to login fresh each time
3. **Use API-based authentication** - Generate auth tokens via REST API rather than browser-based login

### 3. Vercel Preview Deployment Protection

**Finding**: Vercel preview deployments often have "Deployment Protection" enabled which blocks Playwright tests.

**Solutions**:
1. Use Protection Bypass headers:
   - `x-vercel-protection-bypass: <secret>`
   - `x-vercel-set-bypass-cookie: true`
2. Generate bypass secret in Vercel Dashboard > Project Settings > Deployment Protection
3. Disable Vercel Authentication for preview deployments

### 4. Next.js Middleware Cookie Compatibility Issues

**Finding**: There are documented compatibility issues between Playwright cookies and Next.js middleware.

**Root Cause**: Playwright operates at the browser level while Next.js cookies() function and middleware execute on the server.

**Issues**:
- Cookies set via addCookies don't automatically propagate to Next.js server-side code
- Server components cannot access Playwright-set cookies through the cookies() function
- Protected route logic may still redirect even after Playwright sets cookies

### 5. Best Practices for Deployed Environment Cookie Management

1. Set cookies BEFORE navigation
2. Use proper attributes: secure=true, sameSite='Lax', httpOnly=true
3. Record storageState against the actual deployment URL, not localhost
4. Use environment-based configuration
5. For Supabase auth: set both cookies AND localStorage

## Sources & Citations

### GitHub Issues
- microsoft/playwright#15481 - storageState empty cookies in headless mode
- microsoft/playwright#2795 - Cookies for other domain not present after addCookies
- vercel/vercel#10871 - E2E test against Vercel Preview stuck on Login Page

### Official Documentation
- https://playwright.dev/docs/api/class-browsercontext#browser-context-add-cookies
- https://playwright.dev/docs/auth

### Community Resources
- https://cushionapp.com/journal/how-to-use-playwright-with-github-actions-for-e2e-testing-of-vercel-preview
- https://www.browserstack.com/guide/playwright-cookies

## Key Takeaways

1. **Use explicit domain + path instead of url** when setting cookies for deployed environments
2. **Domain mismatch is the primary cause** - cookies recorded on localhost won't work on deployed domains
3. **Vercel Deployment Protection** requires either bypass headers or disabling authentication
4. **Next.js middleware operates server-side** - browser-set cookies may not synchronize automatically
5. **Generate auth state against the target deployment URL**, not localhost

## Recommended Fix

1. Change cookie setting from `url` to explicit `domain` + `path`
2. Add Vercel bypass headers if Deployment Protection is enabled
3. Consider API-based authentication for Supabase session
