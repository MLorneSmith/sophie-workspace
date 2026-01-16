# Perplexity Research: Supabase SSR Cookie Authentication with Playwright E2E Tests

**Date**: 2026-01-15
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Investigated why Playwright E2E tests that inject authentication cookies via `context.addCookies()` fail to authenticate with @supabase/ssr middleware, while fresh UI logins work correctly.

## Core Findings

### 1. How @supabase/ssr Validates JWT Tokens

**Key insight**: @supabase/ssr does NOT perform additional validation beyond reading the cookie value. The validation happens at different levels:

| Method | Validation Level | Network Request |
|--------|-----------------|-----------------|
| `getSession()` | **No validation** - just reads cookie | No |
| `getClaims()` | JWT signature verification (local with asymmetric keys, or server with symmetric) | Sometimes |
| `getUser()` | Full server-side validation | Always |

**Critical Security Note**: `getSession()` blindly trusts the cookie content. An attacker can craft a malicious cookie with forged user data:
```json
{
  "access_token": "fake",
  "refresh_token": "fake",
  "expires_at": "3000000000",
  "user": { "id": "<victim-user-id>" }
}
```
This will pass `getSession()` checks because it only verifies:
1. Cookie exists and is parseable JSON
2. `expires_at` is in the future

**Recommended**: Always use `getUser()` or `getClaims()` (with JWT verification) on the server for security.

### 2. Cookie Origin vs Server-Set Cookies

**There is NO difference in how @supabase/ssr handles programmatically injected cookies vs server-set cookies**:

- Both are just HTTP cookies with the same name/value format
- @supabase/ssr reads cookies via the `getAll()` / `get()` functions you provide
- No origin checking or special validation is performed
- The library doesn't distinguish how the cookie was set

**Why your injected cookies might not work**:
1. **Cookie name mismatch**: Must be exactly `sb-{project-ref}-auth-token` (or chunked versions `.0`, `.1`)
2. **Cookie domain mismatch**: Must match the domain the server expects
3. **Cookie path mismatch**: Should be `/` to be sent on all routes
4. **Missing chunks**: Large tokens get chunked; you need ALL chunks
5. **Token expiration**: If `expires_at` in the token is past, `getSession()` returns null

### 3. Cookie Chunking Mechanism

@supabase/ssr automatically chunks large auth cookies (>3180 characters) to comply with RFC cookie size limits (~4096 bytes):

| Cookie Name | Purpose |
|-------------|---------|
| `sb-{ref}-auth-token` | Full session if small enough |
| `sb-{ref}-auth-token.0` | First chunk of large session |
| `sb-{ref}-auth-token.1` | Second chunk of large session |
| `sb-{ref}-auth-token-code-verifier` | PKCE code verifier |

**When injecting cookies programmatically, you MUST**:
- Include ALL chunks if the token was chunked
- Use the exact same cookie names as the server
- The library reassembles chunks automatically when reading

**Cookie Attributes NOT Required for Functionality**:
- `HttpOnly`: NOT set by default in @supabase/ssr
- `Secure`: Only required for HTTPS
- `SameSite`: Recommended `Lax` but not required for functionality

### 4. Proper Playwright + Supabase SSR Authentication Approach

**Recommended: Use `storageState` after a real login**

The most reliable approach is to perform a REAL login (via UI or API) and save the full browser state:

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Option 1: Login via UI
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for auth to complete
  await page.waitForURL('/dashboard');
  
  // Save full browser state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});

// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'e2e',
      use: { storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

**Alternative: Login via Supabase REST API**

```typescript
// auth.setup.ts
import { createClient } from '@supabase/supabase-js';

setup('authenticate via API', async ({ page, context }) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password',
  });
  
  // Inject the session into localStorage (for client-side)
  await context.addInitScript((sessionData) => {
    localStorage.setItem(
      `sb-${PROJECT_REF}-auth-token`,
      JSON.stringify(sessionData)
    );
  }, session);
  
  // Navigate to trigger middleware to read the session
  await page.goto('/');
  
  // Save state after middleware processes
  await page.context().storageState({ path: authFile });
});
```

**Why localStorage approach works better than direct cookie injection**:

1. @supabase/ssr `createBrowserClient` reads from localStorage by default
2. The middleware then syncs localStorage to cookies via `Set-Cookie`
3. This ensures proper cookie formatting and chunking

### 5. Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Cookies not recognized | Wrong cookie name | Use exact format: `sb-{project-ref}-auth-token` |
| Session appears valid but user is null | Using `getSession()` not `getUser()` | Call `getUser()` to verify with auth server |
| Large tokens fail | Missing cookie chunks | Inject ALL chunks (.0, .1, etc.) |
| Works locally, fails in CI | Domain/path mismatch | Set cookie domain to match test environment |
| Session immediately expires | `expires_at` in past or wrong format | Ensure timestamp is Unix seconds in future |
| Cross-origin issues | SameSite cookie restriction | Set `SameSite=None; Secure` for cross-origin |

### 6. Version-Specific Notes

**@supabase/ssr 0.5.x**:
- Cookie chunking is automatic
- HttpOnly is NOT set by default (intentional)
- PKCE flow is default for all auth methods
- `getSession()` does NO validation - use `getClaims()` or `getUser()`

**Known Bugs**:
- v0.5.0 introduced cookie deletion issues (fixed in 0.5.2+)
- Mixing `@supabase/ssr` with older `@supabase/auth-helpers-*` causes issues

## Key Takeaways

1. **@supabase/ssr does NOT validate cookie origin** - it just reads the value
2. **`getSession()` is NOT secure** - it trusts cookie content without verification
3. **Use `storageState` from a real login** rather than manual cookie injection
4. **Cookie names must exactly match** the `sb-{project-ref}-auth-token` format
5. **Large tokens are chunked** - you need ALL chunks for authentication to work
6. **The recommended flow**: Perform real login via UI/API -> save `storageState` -> reuse in tests

## Sources & Citations

1. Supabase Docs - Creating a Client for SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client
2. Supabase Docs - Advanced SSR Guide: https://supabase.com/docs/guides/auth/server-side/advanced-guide
3. Supabase Docs - getClaims Reference: https://supabase.com/docs/reference/javascript/auth-getclaims
4. GitHub Discussion - SSR Attack Vector: https://github.com/orgs/supabase/discussions/23224
5. GitHub Issue - Cookie Chunking: https://github.com/supabase/supabase-js/issues/963
6. GitHub Issue - Cookies Not Setting: https://github.com/supabase/ssr/issues/36
7. Playwright Docs - Authentication: https://playwright.dev/docs/auth
8. Blog - Login at Supabase via REST API in Playwright: https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test
9. Blog - Testing Supabase Magic Login with Playwright: https://www.bekapod.dev/articles/supabase-magic-login-testing-with-playwright/
10. GitHub - Supawright E2E Test Harness: https://github.com/isaacharrisholt/supawright
11. GitHub Discussion - HttpOnly Cookies: https://github.com/orgs/supabase/discussions/12303
12. GitHub Discussion - JWT Header Support: https://github.com/orgs/supabase/discussions/34292

## Related Searches

- Supabase Auth Hooks for custom access token
- Playwright session storage persistence
- Next.js middleware cookie handling with Supabase
- Supabase JWT signing keys for faster validation
