# Context7 Research: Vercel Edge Middleware Cookie Handling & Preview Deployments

**Date**: 2025-12-11
**Agent**: context7-expert
**Libraries Researched**: vercel/next.js, vercel/vercel, websites/vercel, vercel/edge-runtime

## Query Summary

Researched Vercel's documentation on Edge Middleware cookie handling, focusing on:
1. How Edge Middleware receives and processes cookies
2. Cookie behavior in preview deployments (*.vercel.app URLs)
3. Vercel Protection Bypass mechanism (x-vercel-protection-bypass header and _vercel_jwt cookie)
4. SameSite cookie restrictions in Vercel Edge runtime
5. Known limitations with cookies in preview vs production deployments

## Findings

### 1. Edge Middleware Cookie Handling

**Basic Cookie API:**
Next.js Edge Middleware provides RequestCookies and ResponseCookies APIs for cookie manipulation.

**Key Methods:**
- request.cookies.get(name) - Get single cookie
- request.cookies.getAll() - Get all cookies
- request.cookies.has(name) - Check existence
- request.cookies.delete(name) - Delete cookie
- response.cookies.set(name, value, options) - Set cookie with options

### 2. Preview Deployment Cookie Behavior

**CRITICAL FINDING: VERCEL_URL Environment Variable Limitation**

From Vercel documentation:
> **VERCEL_URL** (string | undefined) - The domain of the generated deployment URL without protocol.
> **Note: cannot be used with Standard Deployment Protection.**

This is a critical limitation that directly impacts preview deployment cookie handling when Standard Deployment Protection is enabled.

**No Documented Cookie Stripping:**
The documentation does not mention any automatic cookie stripping or modification behavior by Vercel Edge Middleware. Cookies are passed through transparently unless explicitly modified in middleware code.

### 3. Vercel Protection Bypass Mechanism

**Protection Bypass Header:**
The x-vercel-protection-bypass header is used to bypass Vercel Deployment Protection:

```
x-vercel-protection-bypass: your-generated-secret (required)
x-vercel-set-bypass-cookie: true (optional)
x-vercel-set-bypass-cookie: samesitenone (optional for iframe/cross-origin)
```

**Key Details:**
- The secret is automatically available as VERCEL_AUTOMATION_BYPASS_SECRET environment variable
- Using x-vercel-set-bypass-cookie: true sets a cookie for subsequent requests (SameSite=Lax by default)
- Using x-vercel-set-bypass-cookie: samesitenone sets cookie with SameSite=None for cross-origin scenarios
- Can be passed as query parameter if headers are not possible

**Cookie Interaction:**
When x-vercel-set-bypass-cookie is set, Vercel creates a bypass cookie (likely _vercel_jwt) that persists for subsequent requests with different SameSite policies:
- true → SameSite=Lax (default, same-site only)
- samesitenone → SameSite=None (cross-origin, requires Secure flag)

### 4. SameSite Cookie Restrictions

**Recommended Cookie Configuration:**
Next.js authentication documentation recommends:
- httpOnly: true
- secure: true
- sameSite: 'lax' (recommended for most use cases)
- path: '/'

**SameSite Options:**
- sameSite: 'lax' - Default recommended, allows cookies on top-level navigation
- sameSite: 'strict' - Stricter, cookies only sent in first-party context
- sameSite: 'none' - Required for cross-origin/iframe scenarios, must set secure: true

### 5. Preview vs Production Cookie Differences

**Key Differences:**

1. **Domain Mismatch:**
   - Preview URLs: project-abc123.vercel.app
   - Production URLs: custom domains
   - Cookies set on preview domains won't work on production

2. **Standard Deployment Protection:**
   - When enabled, VERCEL_URL environment variable is not available
   - This can cause issues if code relies on VERCEL_URL to set cookie domains
   - Protection bypass mechanism adds its own cookie (_vercel_jwt)

3. **Cookie Domain Requirements:**
   - Preview deployments require cookies without explicit domain (defaults to current host)
   - Production can use explicit domain matching custom domain

4. **Protection Bypass Cookie Interaction:**
   - The _vercel_jwt bypass cookie uses SameSite=Lax by default
   - For E2E tests in iframes or cross-origin scenarios, must use x-vercel-set-bypass-cookie: samesitenone
   - This bypass cookie operates independently and should not interfere with application cookies

**No Cookie Stripping Documented:**
The documentation does not mention any cookie stripping, filtering, or modification by Vercel infrastructure. The main issues are:
- Domain mismatch between preview and production
- SameSite policy enforcement by browsers
- Protection bypass cookies operating alongside application cookies

### 6. Known Limitations

**Documented Limitations:**

1. **VERCEL_URL with Standard Deployment Protection:**
   - Cannot use VERCEL_URL environment variable when Standard Deployment Protection is enabled

2. **Cookie Domain Configuration:**
   - No way to set a cookie that works across both preview and production without conditional logic
   - Must detect environment and set domain accordingly (or omit domain entirely)

3. **Protection Bypass SameSite:**
   - Default bypass cookie uses SameSite=Lax
   - Must explicitly request samesitenone for cross-origin E2E tests

4. **Middleware Cookie Mutations:**
   - Mutations on RequestCookies are in-place but changes are not readable by the client
   - Only ResponseCookies modifications are sent to the client via Set-Cookie header

**No Documented Edge Middleware Cookie Stripping:**
The research found no evidence of Vercel Edge Middleware automatically stripping or modifying cookies beyond what is explicitly coded in the middleware function.

## Key Takeaways

1. **Cookie APIs Work Consistently:** Edge Middleware provides standard RequestCookies and ResponseCookies APIs that work the same in preview and production

2. **Domain is the Main Issue:** The primary difference between preview and production is the domain mismatch, which affects cookie scope and delivery

3. **Protection Bypass is Independent:** The x-vercel-protection-bypass mechanism adds its own cookie but operates independently of application cookies

4. **SameSite Matters:** For E2E tests, especially in cross-origin scenarios, must use x-vercel-set-bypass-cookie: samesitenone

5. **No Cookie Stripping:** Vercel does not strip or modify application cookies automatically—any issues are likely due to domain mismatch or SameSite policy enforcement by browsers

6. **VERCEL_URL Limitation:** Cannot use VERCEL_URL with Standard Deployment Protection enabled

## Configuration Recommendations

### For Preview Deployment Cookie Compatibility

1. **Do NOT set explicit cookie domain:**
   - Let browser default to current host
   - This allows cookies to work on both *.vercel.app and custom domains

2. **Use SameSite=Lax by default:**
   - Works for most authentication scenarios
   - Allows cookies on top-level navigation

3. **For E2E tests requiring cross-origin:**
   - Use x-vercel-set-bypass-cookie: samesitenone
   - Ensure all application cookies also use sameSite: 'none' and secure: true

4. **For Supabase Auth on Preview:**
   - Set cookieOptions.sameSite to 'lax' or 'none' based on use case
   - Ensure secure: true is always set
   - Do NOT set explicit domain in cookie options

## Sources

- **vercel/next.js** via Context7 (Middleware cookie handling, Authentication patterns)
- **vercel/vercel** via Context7 (Edge Middleware examples, Deployment protection)
- **websites/vercel** via Context7 (Protection bypass automation)
- **vercel/edge-runtime** via Context7 (@edge-runtime/cookies package)

## Related Issues

This research was conducted to investigate cookie handling issues in Vercel preview deployments, specifically:
- Why authentication cookies might not be received by Edge Middleware
- How the _vercel_jwt protection bypass cookie interacts with application cookies
- Whether SameSite restrictions affect preview deployments differently than production
- Domain mismatch between preview URLs and cookie domains
