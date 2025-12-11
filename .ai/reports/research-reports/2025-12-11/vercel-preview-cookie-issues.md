# Perplexity Research: Vercel Preview Deployment Cookie Issues

**Date**: 2025-12-11
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Investigated why authentication cookies set by browsers are not being received by Vercel preview deployment middleware in Next.js 15, particularly for Supabase SSR auth and Playwright E2E testing scenarios.

## Key Findings

### 1. Root Cause: Preview Domain Mismatch

Cookies are domain-specific. When using Vercel preview deployments, the domain changes from production to preview URLs. If cookies are configured with production domain, they won't be sent to preview URLs.

### 2. Supabase SSR Auth Solution

Use dynamic redirect URLs based on environment variables that Vercel automatically provides.

### 3. Cookie Configuration Requirements

- **Omit `domain` attribute**: Allows cookies to work on all preview URLs
- **Set `secure: true`**: Required for HTTPS (all Vercel previews use HTTPS)
- **Choose correct `sameSite`**: Use 'lax' for same-site, 'none' for OAuth redirects
- **Set `path: '/'`**: Ensures cookie is sent on all routes

### 4. Playwright Testing with Vercel

Use GitHub Actions deployment_status trigger to wait for deployment, then run tests with proper bypass headers.

### 5. Next.js Middleware Cookie Handling

Edge Runtime requires specific APIs. Must use NextResponse.cookies.set() and return the mutated response.

### 6. No JWT Cookie Interference

No evidence of _vercel_jwt causing issues with application cookies. They operate independently.

## Solutions Summary

**For Supabase Auth**:
1. Use dynamic redirect URLs with Vercel environment variables
2. Configure Supabase wildcards for vercel.app domains
3. Don't override site URL in preview environment
4. Omit domain attribute from cookie settings

**For Playwright Tests**:
1. Wait for deployment using deployment_status
2. Pass deployment URL via environment
3. Set X-Vercel-Protection-Bypass header
4. Use storageState for auth persistence

**For Middleware**:
1. Use Edge-compatible NextResponse APIs
2. Set cookies on response, not request
3. Return mutated NextResponse instance
4. Understand cookies appear on next request

## Code Examples

### Dynamic URL Function
```typescript
function getRootURL() {
  let url =
    process?.env?.NEXT_PUBLIC_ROOT_DOMAIN_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_BRANCH_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";
  url = url.includes("http") ? url : `https://${url}`;
  return url.endsWith("/") ? url : `${url}/`;
}
```

### Cookie Setting
```typescript
res.cookies.set('auth-token', value, {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  // NO domain attribute
});
```

### Middleware Pattern
```typescript
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.cookies.set('session', 'value', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  });
  return res;
}
```

## Key Takeaways

1. Cookie domains are critical for preview environments
2. Use environment-aware URLs from Vercel
3. Configure wildcards in auth provider dashboards
4. Edge Runtime requires specific cookie APIs
5. Cookies set in middleware appear on next request
6. Protection bypass essential for automated testing
7. Use Playwright storageState for faster tests

## Implementation Checklist

- ✅ Protection bypass header in Playwright tests
- ✅ Dynamic redirect URLs in Supabase client
- ⚠️ Verify no site URL override in preview environment
- ⚠️ Confirm middleware uses Edge-compatible APIs
- ⚠️ Check Supabase redirect URL patterns include wildcards
- 🔍 Investigate why cookies still not received

## Related Resources

- Supabase Discussion #2760: Vercel preview auth handling
- Supabase Issue #4808: Wildcard redirect URL support
- Next.js Issue #49442: Middleware cookies missing on render
- Playwright Issue #15392: Cookie setting issues
- Vercel Docs: Protection Bypass for Automation
- Supabase Docs: Redirect URLs and Wildcards

## Next Steps

1. Verify Vercel environment variable configuration
2. Check Supabase redirect URL wildcard patterns
3. Review middleware cookie handling implementation
4. Add diagnostics to cookie flow in preview environment
