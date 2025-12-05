# Bug Diagnosis: E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware

**ID**: ISSUE-713
**Created**: 2025-11-26T17:15:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: bug

## Summary

E2E tests in Shard 3 (Personal Accounts) are failing because the pre-authenticated browser session is not being recognized by the Next.js middleware. Tests navigate to `/home/settings` but are redirected to `/auth/sign-in` because the middleware's `supabase.auth.getClaims()` returns no claims, treating the user as unauthenticated.

## Environment

- **Application Version**: dev branch, commit 32cd44dcf
- **Environment**: development (local)
- **Browser**: Chromium (Playwright)
- **Node Version**: As configured in project
- **Database**: PostgreSQL (Supabase local, port 54521)
- **Last Working**: Unknown - tests may have been flaky for multiple runs

## Reproduction Steps

1. Run E2E shard 3 with `/test 3` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 3`
2. Observe that global setup successfully creates authenticated browser states
3. Tests begin execution with 3 parallel workers
4. Tests for account settings navigate to `/home/settings`
5. Middleware intercepts request, calls `getClaims()`, finds no claims
6. Middleware redirects to `/auth/sign-in`
7. Tests fail because they see sign-in page instead of settings page

## Expected Behavior

- Tests should load `/home/settings` page with the user's account settings form
- The pre-authenticated session from Playwright's storage state should be recognized
- The profile name input, password form, and other account settings should be visible

## Actual Behavior

- Tests are redirected to `/auth/sign-in` page
- Screenshot shows "Sign in to your account" heading with email/password form
- Tests fail with `toBeVisible` timeout waiting for account settings elements
- Error: `expect(locator).toBeVisible() failed` for `[data-test="account-display-name"]`

## Diagnostic Data

### Console Output
```
Running 13 tests using 3 workers
°·×°°°°°°°·F°°°°°°°°××TT

1 passed, 3 failed, 2 skipped (4.1m)

Failed tests:
- user profile form is visible
- user can update their profile name
- user can update their password
```

### Network Analysis
```
Global Setup Log:
✅ API authentication successful for test user
✅ Session injected into cookies and localStorage for test user
✅ test user auth state saved successfully

Test Execution:
- Navigation to /home/settings completes
- Middleware intercepts and redirects to /auth/sign-in
- No API calls to /rest/v1/accounts observed (blocked before page renders)
```

### Error Context from Playwright
```yaml
Page snapshot at failure:
- heading "Sign in to your account" [level=1]
- paragraph: Welcome back! Please enter your details
- textbox "Email" [placeholder: your@email.com]
- textbox "Password" [placeholder: "************"]
- button "Sign in with Email"
```

### Authentication State Analysis
```
Cookie stored: sb-127-auth-token
Domain: localhost
Path: /
Secure: false
Expires: session (-1)

Origin: http://localhost:3001
localStorage key: sb-127-auth-token

JWT Token:
- User: test1@slideheroes.com
- Issued: 2025-11-26T17:01:31.000Z
- Expires: 2025-11-26T18:01:31.000Z
- TTL: 60 minutes (valid during test execution)
```

## Error Stack Traces
```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-test="account-display-name"], input[name*="name"], input[placeholder*="name"]').first()
Expected: visible
Timeout: 10000ms

at apps/e2e/tests/account/account-simple.spec.ts:46:25
```

## Related Code

- **Affected Files**:
  - `apps/web/proxy.ts:179-191` - Middleware `/home/*?` handler that redirects unauthenticated users
  - `packages/supabase/src/clients/middleware-client.ts` - Creates Supabase client for middleware
  - `apps/e2e/global-setup.ts` - Creates authenticated browser states
  - `apps/e2e/tests/account/account.spec.ts` - Failing test file
  - `apps/e2e/tests/account/account-simple.spec.ts` - Failing test file
  - `apps/e2e/.auth/test1@slideheroes.com.json` - Authentication state file

- **Recent Changes**: No recent changes to account tests or auth handling

- **Suspected Functions**:
  - `proxy.ts:getUser()` - Calls `supabase.auth.getClaims()` to validate session
  - `proxy.ts:handler for /home/*?` (lines 179-215) - Returns redirect when `!data?.claims`
  - `createMiddlewareClient()` - Cookie reading might not properly handle chunked cookies

## Related Issues & Context

### Direct Predecessors
- #697 (CLOSED): "E2E test failures due to Supabase port/key mismatch" - Similar authentication infrastructure issue
- #688 (CLOSED): "E2E Test Regression - 88 Tests Failing After Supabase Port Update" - Auth configuration changes

### Related Infrastructure Issues
- #698 (CLOSED): "E2E test infrastructure should dynamically detect Supabase configuration" - Infrastructure fix

### Similar Symptoms
- Tests show sign-in page instead of expected authenticated page
- Session validation fails despite valid JWT tokens in storage state

### Historical Context
Multiple E2E authentication issues have been fixed recently related to Supabase port changes (54321 -> 54521). This could be a regression or edge case not covered by previous fixes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Next.js middleware cannot read the authenticated session from Playwright's injected cookies, causing `supabase.auth.getClaims()` to return null and triggering a redirect to the sign-in page.

**Detailed Explanation**:

The authentication flow works as follows:
1. Global setup authenticates via Supabase API and creates session
2. Session is stored in `sb-127-auth-token` cookie (chunked if large)
3. Playwright loads this cookie into browser context via storage state
4. Browser navigates to `/home/settings`
5. Next.js middleware intercepts the request
6. Middleware calls `createMiddlewareClient(request, response)`
7. Client uses `request.cookies.getAll()` to retrieve cookies
8. Client calls `auth.getClaims()` to validate session
9. **FAILURE POINT**: `getClaims()` returns `{ data: { claims: null } }`
10. Middleware redirects to `/auth/sign-in`

The likely cause is one of:

1. **Cookie Domain Mismatch**: Cookies are stored with domain `localhost` but the request may come from `localhost:3001`. Playwright should handle this, but there could be an edge case.

2. **Cookie Chunking Issue**: Large JWT sessions are chunked into multiple cookies (`sb-127-auth-token.0`, `.1`, etc.). The middleware client may not properly reconstruct chunked sessions.

3. **Parallel Worker Interference**: 3 workers running simultaneously might be competing for the same auth state file, causing race conditions where one worker's session overwrites another's.

4. **Session Refresh Race**: Supabase SSR may attempt to refresh the session on first request, and if this fails silently, the session appears invalid.

**Supporting Evidence**:
- Screenshot confirms sign-in page is displayed
- Error context YAML shows sign-in form elements
- JWT token is valid (not expired) at time of test
- Global setup logs confirm successful session injection
- First test in serial suite passes on retry (race condition indicator)

### How This Causes the Observed Behavior

1. Test navigates to `/home/settings`
2. Middleware intercepts before page renders
3. `getUser()` returns `{ data: { claims: null } }` (session not recognized)
4. Condition `!data?.claims` is true on line 187 of proxy.ts
5. Middleware returns `NextResponse.redirect()` to `/auth/sign-in?next=/home/settings`
6. Browser follows redirect, displays sign-in page
7. Test waits for `[data-test="account-display-name"]` which doesn't exist on sign-in page
8. Test times out after 10 seconds and fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Screenshot definitively shows sign-in page, not settings page
- Error context YAML confirms page structure matches sign-in page
- Middleware logic is clear: no claims = redirect to sign-in
- Similar issues documented in #697 and #688 (infrastructure/auth related)
- First test passes accidentally because its selector (`form, h1, h2`) matches both sign-in AND settings pages

## Fix Approach (High-Level)

The fix should address the cookie/session recognition issue in one of these ways:

1. **Debug Middleware Cookie Reading**: Add logging to `proxy.ts` to see what cookies are actually received by the middleware during E2E tests

2. **Verify Cookie Format**: Ensure global-setup.ts creates cookies in the exact format expected by `@supabase/ssr`'s `createServerClient`

3. **Check Cookie Domain Handling**: Verify Playwright correctly applies cookies to all requests regardless of port

4. **Add Session Refresh Handling**: Ensure the middleware properly handles session refresh when access token is valid but session needs to be reconstructed from refresh token

5. **Isolate Worker Sessions**: Consider using separate auth state files per worker to prevent race conditions

## Diagnosis Determination

The root cause is **session recognition failure in the Next.js middleware**. The authenticated session is correctly created and stored in Playwright's storage state, but when the middleware attempts to validate it via `supabase.auth.getClaims()`, it fails to find valid claims.

This is likely due to either:
- Cookie format/chunking incompatibility between global-setup and middleware client
- Race condition with parallel workers sharing the same auth state
- Supabase SSR session reconstruction failure

The fix requires debugging the exact point where session validation fails to determine which of these causes applies.

## Additional Context

### Test Configuration Details
- Shard 3 runs: `tests/account/account.spec.ts` and `tests/account/account-simple.spec.ts`
- `account-simple.spec.ts` uses `mode: "serial"` with 30s timeout
- Both use `AuthPageObject.setupSession(AUTH_STATES.TEST_USER)`
- AUTH_STATES.TEST_USER points to `.auth/test1@slideheroes.com.json`

### Why First Test Passes
The first test (`settings page loads successfully`) passes because its assertions are too generic:
```typescript
const pageLoaded = await page.waitForSelector(
  'form, [data-test*="account"], h1, h2', // Matches BOTH sign-in and settings pages!
  { timeout: 10000 }
);
```
The sign-in page has a form and h1, so the test passes incorrectly.

### Recommended Next Steps
1. Add middleware logging to capture cookie state during E2E
2. Compare cookie format from global-setup with what middleware receives
3. Test with a single worker to rule out race conditions
4. Check if issue reproduces with freshly generated auth states

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Grep, Glob, TodoWrite*
