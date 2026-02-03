# Bug Diagnosis: Integration Tests Auth Session Lost in Vercel Preview Deployments

**ID**: ISSUE-1092
**GitHub**: https://github.com/slideheroes/2025slideheroes/issues/1092
**Created**: 2025-12-11T15:30:00Z
**Reporter**: CI workflow failure
**Severity**: high
**Status**: validated
**Type**: regression

## Summary

Integration tests on Vercel preview deployments fail because authenticated sessions are not recognized by the server-side middleware. The E2E global-setup successfully authenticates users and sets cookies, but when tests navigate to protected routes (`/home`, `/home/settings`, etc.), the Next.js middleware redirects to `/auth/sign-in`. This is a persistent/recurring issue that affects the `dev-integration-tests.yml` workflow.

## Environment

- **Application Version**: dev branch (commit be432152c)
- **Environment**: CI (GitHub Actions) against Vercel Preview
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: Supabase (production)
- **Last Working**: Never fully stable - intermittent passes due to workflow skipping

## Reproduction Steps

1. Push to dev branch triggering `dev-integration-tests.yml` workflow
2. Workflow runs integration tests against Vercel preview deployment
3. Global setup authenticates users via Supabase API (succeeds)
4. Cookies are set in browser context with correct domain
5. Tests navigate to protected routes like `/home`
6. Server-side middleware doesn't recognize session
7. Tests are redirected to `/auth/sign-in?next=/home`
8. Cloudflare Turnstile blocks automated sign-in attempts
9. Tests timeout waiting for authenticated UI elements

## Expected Behavior

- Tests should navigate to protected routes without redirect
- Server should recognize the authenticated session from cookies
- Protected pages should render with authenticated user context

## Actual Behavior

- Authentication cookies are set correctly in browser context
- Navigation to protected routes triggers server-side redirect to sign-in
- Sign-in page triggers Cloudflare Turnstile CAPTCHA
- Tests timeout waiting for `[data-testid="team-selector"]` or other authenticated elements

## Diagnostic Data

### Console Output
```
✅ API authentication successful for test user
✅ Session injected into cookies and localStorage for test user
🍪 Cookie domain config: 2025slideheroes-am04vybr2-slideheroes.vercel.app (isVercelPreview: true)
[DEBUG_E2E_AUTH:global-setup:cookies:verified] {
  "cookieCount": 3,
  "cookieName": "sb-ldebzombxtszzcgnylgq-auth-token"
}
⚠️ Cookie attribute verification warning: _vercel_jwt: sameSite is None, expected Lax
```

### Navigation Flow
```
pw:api navigating to "/home"
pw:api navigated to "/auth/sign-in?next=/home"   <-- REDIRECT
pw:api navigated to "https://challenges.cloudflare.com/..."   <-- TURNSTILE
```

### Cookie Configuration
```json
{
  "name": "sb-ldebzombxtszzcgnylgq-auth-token",
  "valueLength": 2971,
  "domain": "2025slideheroes-am04vybr2-slideheroes.vercel.app",
  "path": "/",
  "secure": true,
  "sameSite": "Lax"
}
```

### Workflow History
```
20137819571 - FAILURE (current run)
20137108319 - SUCCESS (but skipped - not a real pass)
20136159024 - FAILURE
20111835119 - FAILURE
20110447103 - FAILURE
```

## Error Stack Traces
```
TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('[data-testid="team-selector"]') to be visible

   at waitForHydration (apps/e2e/tests/utils/wait-for-hydration.ts:82:13)
   at navigateAndWaitForHydration (apps/e2e/tests/utils/wait-for-hydration.ts:196:2)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts` - Cookie setup logic
  - `packages/supabase/src/clients/middleware-client.ts` - Server-side auth
  - `apps/web/middleware.ts` (or Makerkit middleware) - Auth redirect logic
- **Recent Changes**: Commit `6fef3eec8` added cookie verification helpers
- **Suspected Functions**: `getCookieDomainConfig()`, middleware cookie parsing

## Related Issues & Context

### Direct Predecessors
- #1083 (CLOSED): "Bug Fix: Integration Tests Auth Session Not Recognized in Vercel Preview" - Same problem, implementation attempted but not fully resolved
- #1082 (CLOSED): Diagnosis for #1083
- #1075 (CLOSED): "Auth Session Lost During Parallel Test Execution"
- #1063 (CLOSED): "Dev Integration Tests Fail - Authentication Session Not Persisted to Server"
- #1062 (CLOSED): Diagnosis for #1063

### Related Infrastructure Issues
- #878 (CLOSED): "Playwright authentication cookie mismatch with Supabase URLs"
- #876 (CLOSED): "Playwright authentication fails due to Supabase cookie name mismatch"

### Historical Context
This is a recurring issue that has been "fixed" multiple times but keeps returning. The pattern suggests the root cause has not been fully addressed. Previous fixes focused on:
- Cookie domain configuration
- Cookie attribute normalization (sameSite, httpOnly, secure)
- Cookie verification helpers
- Cookie name matching with Supabase URL

## Root Cause Analysis

### Identified Root Cause

**Summary**: Server-side Supabase middleware doesn't receive or recognize cookies set by Playwright, likely due to cookie-request transmission issues in Vercel's edge runtime.

**Detailed Explanation**:
The issue is in the cookie transmission chain between Playwright browser context and the Vercel edge middleware:

1. **Playwright sets cookies correctly** - Verified by `browserContext.cookies()` showing correct cookies
2. **Browser sends cookies in requests** - Not yet verified (need HAR recording)
3. **Vercel edge middleware receives cookies** - Suspected failure point
4. **Supabase SSR client parses cookies** - Depends on step 3

The most likely cause is one of:
- **Cookie domain scoping issue**: Vercel preview URLs use full hostname (`2025slideheroes-am04vybr2-slideheroes.vercel.app`), but edge middleware may handle cookies differently
- **SameSite cookie restriction**: Despite setting `sameSite: "Lax"`, cross-origin requests during server-side rendering may not include cookies
- **Vercel protection bypass interference**: The `_vercel_jwt` cookie shows `sameSite: None` warning, suggesting Vercel's protection layer may interfere with cookie handling

**Supporting Evidence**:
- Cookie verification passes in global setup but fails during test execution
- Logs show immediate redirect to `/auth/sign-in` on first protected route access
- Warning about `_vercel_jwt: sameSite is None, expected Lax`
- Same issue persists across multiple "fix" attempts

### How This Causes the Observed Behavior

1. Global setup authenticates and sets cookies with correct attributes
2. Cookie verification passes (cookies exist in browser context)
3. Test navigates to `/home` - browser sends request with cookies
4. Vercel edge receives request but either:
   - Doesn't receive cookies due to domain/sameSite issues, OR
   - Passes request to Next.js middleware without cookies
5. Next.js middleware calls `createMiddlewareClient()` which reads cookies
6. No valid session found in cookies → redirect to sign-in
7. Sign-in page triggers Cloudflare Turnstile → test timeout

### Confidence Level

**Confidence**: Medium

**Reasoning**: The diagnosis identifies the symptom chain clearly (cookies set → redirect occurs), but the exact failure point between browser and edge middleware is uncertain. Additional diagnostics needed:
1. HAR recording to verify cookies sent in HTTP requests
2. Vercel function logs to verify what cookies edge middleware receives
3. Debug logging in Supabase middleware client

## Validated Research Findings (2025-12-11)

Research conducted using Vercel documentation (Context7) and community solutions (Perplexity) validated the following:

### 1. Explicit Cookie Domain - CONFIRMED LIKELY CAUSE

Both research sources emphasized: **"Do NOT set explicit domain attribute"**

Our code at `global-setup.ts:690` explicitly sets domain:
```typescript
return {
  name: c.name,
  value: c.value,
  domain,  // ← THIS IS LIKELY THE PROBLEM
  ...
};
```

**Recommendation from research:**
> "Browser defaults to current host when domain is omitted"
> "No need to track/configure multiple domains"

However, Playwright's `addCookies` API requires a domain parameter - need to test if empty string or omission works.

### 2. Supabase Redirect URLs Configuration

Need to verify in Supabase Dashboard that "Additional Redirect URLs" includes:
```
https://*.vercel.app/*/*
```

This wildcard pattern is required for preview deployments.

### 3. Cookie Transmission vs. Storage

Research confirms cookies ARE stored correctly (verified in global-setup logs), but may NOT be transmitted in HTTP requests due to:
- SameSite restrictions during SSR
- Domain mismatch between explicit domain and request host
- Vercel Edge middleware cookie handling

### 4. `_vercel_jwt` Warning - NOT the Cause

Research confirms `_vercel_jwt` operates independently and doesn't interfere with application cookies.

### 5. HAR Recording Required

To definitively identify where cookies are lost, enable:
```
RECORD_HAR_LOGS=true
```

### Research Reports

- `.ai/reports/research-reports/2025-12-11/context7-vercel-edge-middleware-cookies-preview.md`
- `.ai/reports/research-reports/2025-12-11/vercel-preview-cookie-issues.md`

## Fix Approach (High-Level)

Based on validated research, prioritized fixes:

### Priority 1: Cookie Domain Configuration
1. **Test omitting explicit domain** in `global-setup.ts:690` - Research strongly suggests NOT setting domain
2. **Verify Playwright behavior** - Check if `addCookies` works without explicit domain or with empty string

### Priority 2: Environment Configuration
3. **Verify Supabase wildcard URLs** - Ensure `https://*.vercel.app/*/*` is in Additional Redirect URLs
4. **Check Vercel env vars** - Ensure `NEXT_PUBLIC_SITE_URL` is NOT set for preview environment

### Priority 3: Diagnostics
5. **Enable HAR recording** - Add `RECORD_HAR_LOGS=true` to CI to capture HTTP traffic
6. **Add server-side cookie logging** - Log received cookies in Next.js middleware

### Priority 4: Alternative Approaches
7. **Try `sameSite: 'none'`** with `secure: true` for preview deployments
8. **Consider auth header approach** - Use Authorization header instead of cookies for CI

## Diagnosis Determination

The authentication flow breaks between setting cookies in Playwright browser context and the server-side middleware reading them. Despite multiple previous fixes focusing on cookie attributes and verification, the core issue of cookies not being transmitted/received by the server persists.

The diagnosis recommends:
1. First, add comprehensive HTTP traffic logging (HAR) to identify exactly where cookies are lost
2. Then, based on findings, implement the appropriate fix

This is not a simple fix - it requires understanding the full cookie transmission path in Vercel's edge + Next.js middleware architecture.

## Additional Context

- Integration tests work locally against Docker setup
- Issue is specific to Vercel preview deployments
- Cloudflare Turnstile on sign-in page is a secondary blocker (would need separate handling if auth cookies can't be fixed)
- The test infrastructure has extensive cookie setup code suggesting this is a long-standing challenge

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs, issue search), Read (global-setup.ts, middleware-client.ts), Grep, Bash*
