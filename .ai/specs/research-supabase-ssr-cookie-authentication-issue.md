# Research Report: @supabase/ssr Cookie Authentication Not Recognized in Next.js Middleware

**Date**: 2025-11-26
**Issue**: E2E tests fail because manually-injected cookies are not recognized by @supabase/ssr middleware
**Status**: Root cause identified with solution recommendations

---

## Executive Summary

The issue occurs because **@supabase/ssr expects cookies to be in a different format than what we're manually creating**. The library uses a `base64-` prefix format for encoding session data, but there are critical differences in how cookies should be structured when manually injected vs. when created by the Supabase client itself.

**Key Finding**: The cookie format `base64-{base64url-encoded-json}` is correct, BUT @supabase/ssr v0.4.0+ has specific encoding/decoding requirements that our manual cookie injection may not be meeting. Additionally, there may be middleware-specific issues with cookie reading and session validation.

---

## Research Findings

### 1. Cookie Format Expectations (@supabase/ssr v0.4.0+)

**Official Format** (from GitHub Discussion #35553):
```
sb-<project-ref>-auth-token=base64-{base64url-encoded-session-json}
```

**Important Discovery**: There's a known issue where `@supabase/ssr` cookies are "always set in legacy base64 format" even with `cookieEncoding: 'none'` specified. This suggests the library has specific encoding behavior that may not match our manual encoding.

**Source**: https://github.com/orgs/supabase/discussions/35553

### 2. JWT vs Session Object Confusion

**Critical Distinction** (from Perplexity research):

- **OLD/INCORRECT Understanding**: Some documentation suggests cookies should contain just the JWT access token
- **CORRECT Understanding**: `@supabase/ssr` expects the FULL session object (containing `access_token`, `refresh_token`, `user`, etc.) to be base64-url encoded

**However**, one search result contradicted this:
> "There is no standard 'base64-' prefix in Supabase cookies. The cookie value is just the JWT string."

This contradiction suggests **version-specific behavior** or **different encoding modes** in @supabase/ssr.

### 3. Middleware Cookie Reading Issues

**Known Problem** (from GitHub Issue #36):
Cookies may not be properly read in Next.js middleware due to:

1. **Request/Response Cookie Mismatch**: Middleware sees `request.cookies`, but set operations on `response.cookies` may not be reflected immediately
2. **Cross-origin Domain Issues**: Cookies set on `127.0.0.1:3000` may not be sent to `localhost:3001` or vice versa
3. **Cookie Chunking Problems**: Large sessions are chunked into multiple cookies (`.0`, `.1`, etc.), and reconstruction may fail

**Critical Quote** (GitHub #36):
> "The first time I log on only `sb-***-auth-token-code-verifier` is set properly. The second time I log on `sb-***-auth-token` is set"

This indicates timing/asynchronous issues with cookie setting in the auth flow.

### 4. Manual Cookie Synchronization Required

**Solution Pattern** (from GitHub #36):
```typescript
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  // Manually updating all cookies from request to response
  const cookieStore = cookies()
  for (const cookie of req.cookies.getAll()) {
    cookieStore.set(cookie.name, cookie.value)
  }
  
  return NextResponse.redirect('<redirect-url>')
}
```

**Why This Matters**: Next.js middleware may not automatically sync cookies between request/response contexts, especially after redirects or rewrites.

### 5. Middleware Caching Issues

**Known Problem** (from Perplexity search):
> "Next.js middleware aggressively caches responses, which can cause cookies to appear missing or outdated in the middleware context until the page is manually refreshed"

**Solution**:
```typescript
return NextResponse.next({
  headers: { 'x-middleware-cache': 'no-cache' }
})
```

### 6. getClaims() vs getUser() Behavior

**Critical Security Note**:
- `getClaims()`: Only validates JWT signature and expiration locally (does NOT verify with auth server)
- `getUser()`: Makes an API call to verify the session is still valid server-side

**From documentation**:
> "The `getClaims()` method only checks local JWT validation (signature and expiration), but it doesn't verify with the auth server whether the session is still valid or if the user has logged out server-side."

**However**, our middleware currently uses `getClaims()` which should work if the JWT is properly encoded in the cookie.

### 7. Playwright Cookie Injection vs Real Browser Flow

**Key Insight**: When Playwright injects cookies via `context.addCookies()`, the cookies are present in the browser context, BUT:

1. **Middleware receives cookies from request.cookies.getAll()**
2. **Cookie domain/path matching** must be exact
3. **Cookie expiration** must be in the future (Unix timestamp in seconds)
4. **Cookie chunking** must match @supabase/ssr's chunking algorithm exactly

**From our global-setup.ts**:
```typescript
const CHUNK_SIZE = 3180; // Matches Supabase SSR chunking
```

This appears correct, but there may be edge cases.

---

## Potential Root Causes (Ranked by Likelihood)

### 1. Cookie Encoding Format Mismatch (HIGH)

**Evidence**:
- GitHub Discussion #35553 reports cookies "always set in legacy base64 format"
- Our manual encoding may not match the exact format @supabase/ssr expects
- The library may perform additional transformations beyond base64url encoding

**Verification Needed**:
- Log the exact cookie value created by Playwright
- Log the exact cookie value @supabase/ssr creates during normal login
- Compare byte-for-byte

### 2. Middleware Cookie Reading Bug (HIGH)

**Evidence**:
- Multiple GitHub issues report cookies not being read correctly in middleware
- Next.js middleware runs at the edge with different cookie handling
- Manual cookie synchronization often required

**Verification Needed**:
- Add logging in middleware to show EXACT cookies received from request
- Check if cookies are present in `request.cookies.getAll()`
- Verify cookie names match exactly (case-sensitive)

### 3. Session Reconstruction Failure (MEDIUM)

**Evidence**:
- `getClaims()` validates JWT signature using public keys
- If the session JSON structure is incorrect, signature validation fails
- The session must include specific fields (@supabase/ssr may require)

**Verification Needed**:
- Inspect session structure from real login vs. Playwright injection
- Check for missing or extra fields
- Verify access_token is a valid JWT

### 4. Cookie Domain/Path Mismatch (MEDIUM)

**Evidence**:
- Playwright sets cookies with `domain: new URL(baseURL).hostname`
- If baseURL is `http://localhost:3001`, domain is `localhost`
- But `127.0.0.1` cookies won't match `localhost` and vice versa

**Verification Needed**:
- Log request.headers.get('host') in middleware
- Compare to cookie domain setting
- Test with both `localhost` and `127.0.0.1`

### 5. Parallel Worker Race Condition (LOW-MEDIUM)

**Evidence**:
- Diagnosis report mentions 3 workers running in parallel
- All workers share the same `.auth/test1@slideheroes.com.json` file
- Potential race condition during session loading

**Verification Needed**:
- Run tests with `--workers=1` to eliminate race conditions
- Check if failure rate decreases with serial execution

---

## Recommended Solutions

### Solution 1: Use Supabase Client to Set Cookies (Preferred)

**Approach**: Instead of manually constructing cookies, use @supabase/ssr's built-in cookie setting mechanism.

```typescript
// In global-setup.ts
import { createServerClient } from '@supabase/ssr';

// Create a cookie store that Playwright can capture
const cookieStore = new Map<string, string>();

const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get(name: string) {
      return cookieStore.get(name);
    },
    set(name: string, value: string, options: CookieOptions) {
      cookieStore.set(name, value);
    },
    remove(name: string, options: CookieOptions) {
      cookieStore.delete(name);
    },
  },
});

// Sign in via API
const { data, error } = await supabase.auth.signInWithPassword({
  email: credentials.email,
  password: credentials.password,
});

// The cookies are now properly formatted in cookieStore
// Inject them into Playwright context
for (const [name, value] of cookieStore) {
  await context.addCookies([{
    name,
    value,
    domain,
    path: '/',
    // ... other options
  }]);
}
```

**Pros**:
- Guaranteed format compatibility
- Handles chunking automatically
- Matches production behavior exactly

**Cons**:
- More complex setup code
- May require additional dependencies in E2E package

### Solution 2: Debug and Fix Manual Encoding

**Approach**: Compare manual encoding with real @supabase/ssr encoding and match exactly.

**Steps**:
1. Enable `DEBUG_E2E_AUTH=true` in both global-setup and middleware
2. Log cookie values from both manual injection and real login
3. Identify byte-level differences
4. Adjust encoding to match

**Implementation**:
```typescript
// Add to global-setup.ts
debugLog("cookie:manual", {
  cookieValue: sessionStr,
  decodedPreview: JSON.parse(
    Buffer.from(sessionStr.replace('base64-', ''), 'base64url').toString('utf-8')
  ).access_token.substring(0, 50)
});

// Add to middleware (apps/web/proxy.ts)
debugLog("cookie:received", {
  cookies: request.cookies.getAll(),
  authTokenCookie: request.cookies.get('sb-127-auth-token'),
});
```

### Solution 3: Fix Middleware Cookie Reading

**Approach**: Ensure middleware properly reads and processes cookies.

**Implementation** (add to `/home/msmith/projects/2025slideheroes/apps/web/proxy.ts`):

```typescript
async function getUser(request: NextRequest, response: NextResponse) {
  // ADDED: Manual cookie sync (workaround for Next.js middleware cookie bug)
  const cookieStore = cookies();
  for (const cookie of request.cookies.getAll()) {
    cookieStore.set(cookie.name, cookie.value);
  }
  
  const supabase = createMiddlewareClient(request, response);
  
  // Rest of existing code...
}
```

**Source**: GitHub Issue #36

### Solution 4: Disable Middleware Caching

**Approach**: Prevent stale cookie issues due to middleware caching.

**Implementation** (add to middleware return):
```typescript
return NextResponse.next({
  request: {
    headers: request.headers,
  },
  headers: {
    'x-middleware-cache': 'no-cache',
  },
});
```

---

## Testing Strategy

### Phase 1: Diagnosis
1. Enable `DEBUG_E2E_AUTH=true`
2. Run single test with `--workers=1`
3. Collect logs from:
   - Global setup (cookie creation)
   - Middleware (cookie reception)
   - Browser DevTools (cookie presence)

### Phase 2: Verification
1. Compare cookie format from manual injection vs. real login
2. Verify cookie domain matches request host
3. Check cookie expiration is in the future
4. Confirm cookie chunks match expected pattern

### Phase 3: Implementation
1. Try Solution 1 (use Supabase client for cookie setting)
2. If that fails, try Solution 3 (manual cookie sync)
3. If that fails, try Solution 2 (debug encoding)

---

## References

1. **GitHub Discussion #35553**: SSR Session Cookie Always Set in Legacy base64 Format
   - https://github.com/orgs/supabase/discussions/35553
   
2. **GitHub Issue #36**: Cookies not setting properly supabase ssr
   - https://github.com/supabase/ssr/issues/36
   
3. **Supabase SSR Documentation**: Creating a client for SSR
   - https://supabase.com/docs/guides/auth/server-side/creating-a-client
   
4. **Supabase SSR Advanced Guide**: Details about SSR Auth flows
   - https://supabase.com/docs/guides/auth/server-side/advanced-guide
   
5. **Playwright Auth Testing Guide**: Testing Supabase Magic Login in CI
   - https://www.bekapod.dev/articles/supabase-magic-login-testing-with-playwright/

---

## Answers to Original Questions

### 1. Why would @supabase/ssr fail to recognize a correctly formatted cookie?

**Answer**: The cookie format `base64-{base64url-json}` is correct per the library's design, BUT:
- Next.js middleware cookie reading has known bugs requiring manual synchronization
- Cookie domain/path must match request exactly
- The library may apply additional transformations we're not replicating
- Middleware caching can cause stale cookie reads

### 2. Are there known issues with @supabase/ssr 0.7.0 and server-side session recognition?

**Answer**: No version-specific issues for 0.7.0, but there are **general SSR issues**:
- Cookies "always set in legacy base64 format" (Discussion #35553)
- Cookies not setting on first login attempt (Issue #36)
- Prefetching causing premature cookie deletion
- Mixing `@supabase/auth-helpers-nextjs` with `@supabase/ssr` causes conflicts

### 3. Is there a difference between how @supabase/ssr encodes vs how we should encode cookies for Playwright tests?

**Answer**: **YES** - This is likely the root cause:
- @supabase/ssr uses internal encoding logic that may not be fully documented
- Manual encoding may miss subtle transformations
- The library handles cookie chunking with specific algorithms
- **Recommended**: Use the Supabase client itself to create cookies, then extract and inject them

### 4. Are there any required cookie options (httpOnly, secure, sameSite) that affect @supabase/ssr parsing?

**Answer**: **No** - These options affect browser behavior, not parsing:
- `httpOnly`: Should be `false` for @supabase/ssr (browser needs to read)
- `secure`: Should match protocol (false for HTTP, true for HTTPS)
- `sameSite`: Recommended `Lax` for auth cookies
- These don't affect server-side parsing, only cookie transmission

### 5. Does @supabase/ssr require cookies to be set by the Supabase client itself (not manually)?

**Answer**: **Not technically required, but highly recommended**:
- Manual cookie setting can work IF format is exact
- Supabase client guarantees correct format
- Client handles chunking, encoding, and all edge cases
- Manual setting is error-prone and fragile

### 6. Are there any JWT validation steps that happen before getClaims() returns data?

**Answer**: **YES** - `getClaims()` performs:
1. Cookie reading from request
2. Base64-url decoding of session JSON
3. JWT signature validation using project's public keys
4. JWT expiration check
5. Claims extraction from validated JWT

**Failure at any step** returns `{ data: { claims: null }, error: null }`

---

## Next Steps

1. **Immediate**: Enable `DEBUG_E2E_AUTH=true` and collect diagnostic logs
2. **Short-term**: Implement Solution 1 (use Supabase client for cookie setting)
3. **Long-term**: Consider switching to UI-based auth for E2E tests (more robust, but slower)

