# Context7 Research: Vercel Cookies, Preview Deployments, and E2E Testing

**Date**: 2026-01-16
**Agent**: context7-expert
**Libraries Researched**: websites/vercel, vercel/edge-runtime, microsoft/playwright, vercel/next.js

## Query Summary

Research into how cookies work with Vercel preview deployments, edge middleware cookie handling, deployment protection bypass for E2E testing, and best practices for setting cookies on dynamic Vercel preview URLs (e.g., project-hash-team.vercel.app).

## Findings

### 1. Vercel Deployment Protection Bypass for Automation

**Key Discovery**: Vercel provides a specific mechanism for bypassing deployment protection in automated testing scenarios.

#### Required Headers

The playwright.config.ts should include extraHTTPHeaders with:
- x-vercel-protection-bypass: Set to VERCEL_AUTOMATION_BYPASS_SECRET environment variable
- x-vercel-set-bypass-cookie: Set to true or samesitenone for iframe access

#### How It Works

1. **x-vercel-protection-bypass**: Header containing the generated secret that bypasses deployment protection
2. **x-vercel-set-bypass-cookie**: 
   - Set to true for SameSite=Lax (standard browser testing)
   - Set to samesitenone for SameSite=None (iframe/cross-site access)
3. **Environment Variable**: VERCEL_AUTOMATION_BYPASS_SECRET is automatically added to deployments when configured

#### Important Notes
- The secret is set when a deployment is built
- Regenerating the secret invalidates previous deployments
- Redeploy your application after updating the secret to use the new value
- Query parameter alternative: ?x-vercel-protection-bypass=your-generated-secret

### 2. Cookie Domain Handling on Preview Deployments

**Critical Finding for Dynamic Hostnames**:

When setting cookies via Playwright context.addCookies(), you have two options:
- Option 1: Use url property (domain derived automatically)
- Option 2: Use explicit domain + path (prefix domain with . for subdomains)

**Key Insight**: When using url property, Playwright derives the domain from the URL. However, for Vercel preview deployments with dynamic subdomains, you may need:

1. **Exact domain matching**: The cookie domain must match or be a parent of the request domain
2. **Subdomain handling**: Prefix domain with . for subdomain matching (e.g., .vercel.app)
3. **SameSite considerations**: For cross-origin scenarios, use sameSite: None with secure: true

### 3. Edge Middleware Cookie Handling

From vercel/edge-runtime documentation:

Reading cookies in middleware uses RequestCookies from @edge-runtime/cookies:
- cookies.get(cookie-name)?.value returns undefined or string
- cookies.has(cookie-name) returns boolean

Setting cookies uses ResponseCookies with options like maxAge, path, domain, secure, httpOnly, sameSite.

### 4. Next.js Middleware Cookie Access

From Next.js documentation:

- request.cookies.get(name) returns { name, value, Path }
- request.cookies.getAll() returns array of all cookies
- request.cookies.has(name) returns boolean
- response.cookies.set(name, value) or set({ name, value, path })

### 5. Playwright Cookie Configuration for Authentication

Best Practices from Playwright Documentation:

Full cookie specification includes:
- name, value (required)
- domain (prefix with . for subdomains)
- path (usually /)
- expires (Unix timestamp in seconds)
- httpOnly, secure, sameSite

Using storageState for auth reuse:
- await page.context().storageState({ path: authFile })
- browser.newContext({ storageState: path/to/auth.json })

## Root Cause Analysis: E2E Auth Failures on Vercel Preview

Based on the research, the likely causes of auth cookies not being recognized by middleware:

### Potential Issues

1. **Missing Deployment Protection Bypass**
   - If Vercel Deployment Protection is enabled, requests without the bypass header/cookie will be blocked

2. **Cookie Domain Mismatch**
   - Using url property sets domain to exact hostname
   - Preview URLs like project-hash-team.vercel.app are unique per deployment
   - Middleware may not see cookies if domain does not match exactly

3. **SameSite Cookie Restrictions**
   - Default SameSite=Lax may not work for all testing scenarios
   - Cross-origin requests require SameSite=None

4. **Missing Secure Flag**
   - Vercel preview deployments use HTTPS
   - Cookies must have secure: true for HTTPS-only transmission

### Recommended Solutions

#### Solution 1: Configure Playwright with Vercel Bypass Headers
Add extraHTTPHeaders to playwright.config.ts with x-vercel-protection-bypass and x-vercel-set-bypass-cookie headers.

#### Solution 2: Explicit Cookie Domain Configuration
When adding cookies, use explicit domain derived from the base URL instead of url property.

#### Solution 3: Combined Approach (Recommended)
1. Navigate and perform login
2. Wait for auth to complete
3. Get cookies and ensure proper configuration (domain, secure, sameSite)
4. Clear and re-add with proper settings
5. Save state

## Key Takeaways

- **Vercel Deployment Protection**: Use x-vercel-protection-bypass header with VERCEL_AUTOMATION_BYPASS_SECRET for E2E testing
- **Bypass Cookie**: Set x-vercel-set-bypass-cookie: samesitenone for cross-site compatibility in testing
- **Cookie Domain**: For dynamic preview URLs, derive domain from the actual deployment URL, not hardcoded values
- **SameSite**: Use SameSite=None with secure=true for maximum cross-site cookie compatibility
- **Explicit Configuration**: Prefer explicit domain + path over url property for predictable behavior
- **Edge Middleware**: Uses @edge-runtime/cookies package with RequestCookies and ResponseCookies classes

## Sources

- websites/vercel via Context7 - Deployment Protection Bypass, Preview Deployments
- vercel/edge-runtime via Context7 - Cookie handling in Edge middleware
- microsoft/playwright via Context7 - Cookie authentication patterns
- vercel/next.js via Context7 - Middleware cookie access patterns
