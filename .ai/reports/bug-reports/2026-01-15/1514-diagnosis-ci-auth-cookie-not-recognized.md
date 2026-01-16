# Bug Diagnosis: Dev Integration Tests Fail - Cookies Not Recognized by Middleware

**ID**: ISSUE-1514
**Created**: 2026-01-15T22:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests CI workflow fails because pre-authenticated cookies created in global-setup are not being recognized by the deployed Vercel middleware. Tests navigate to `/home` but get redirected to `/auth/sign-in?next=/home`, indicating the middleware doesn't find a valid session despite cookies being correctly set in the browser context.

## Environment

- **Application Version**: dev branch (commit dd4e085f3)
- **Environment**: CI (GitHub Actions) against Vercel Preview
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: PostgreSQL via Supabase (ldebzombxtszzcgnylgq)
- **Last Working**: Unknown (tests have been flaky)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. Wait for `dev-integration-tests.yml` workflow to trigger
3. Observe the "Integration Tests" job
4. Team-accounts tests fail with timeout waiting for `[data-testid="team-selector"]`
5. Logs show navigation to `/home` redirects to `/auth/sign-in?next=/home`

## Expected Behavior

- Global setup authenticates users and saves storage state with cookies
- Tests load storage state and navigate to protected routes
- Middleware recognizes cookies and allows access to `/home`

## Actual Behavior

- Global setup successfully creates cookies with correct domain and name
- Storage state files are saved with cookies verified present
- Tests load storage state and navigate to `/home`
- Middleware redirects to `/auth/sign-in?next=/home` (session not found)

## Diagnostic Data

### Cookie Creation (Global Setup - SUCCESS)
```
🍪 Expected cookie name: sb-ldebzombxtszzcgnylgq-auth-token
🍪 Cookie domain config: 2025slideheroes-oys3ljf90-slideheroes.vercel.app (isVercelPreview: true)
✅ Supabase project ref matches: ldebzombxtszzcgnylgq

[DEBUG_E2E_AUTH:global-setup:cookies:setting] {
  "user": "test user",
  "totalCookies": 1,
  "domainStrategy": "explicit: 2025slideheroes-oys3ljf90-slideheroes.vercel.app",
  "cookies": [{
    "name": "sb-ldebzombxtszzcgnylgq-auth-token",
    "valueLength": 2974,
    "domain": "2025slideheroes-oys3ljf90-slideheroes.vercel.app",
    "secure": true
  }]
}

[DEBUG_E2E_AUTH:global-setup:cookies:verified] {
  "cookieCount": 3,
  "cookieName": "sb-ldebzombxtszzcgnylgq-auth-token"
}

✅ Session injected into cookies and localStorage for test user
✅ test user auth state saved successfully
```

### Test Execution (FAILURE)
```
pw:api navigating to "https://2025slideheroes-oys3ljf90-slideheroes.vercel.app/home", waiting until "domcontentloaded"
pw:api "commit" event fired
pw:api navigated to "https://2025slideheroes-oys3ljf90-slideheroes.vercel.app/auth/sign-in?next=/home"
pw:api <= page.waitForSelector failed
Error: page.waitForSelector: Timeout 18000ms exceeded.
waiting for locator('[data-testid="team-selector"]') to be visible
```

### Network Analysis

No HAR files were captured (upload step may have failed). Key observation:
- Initial navigation to `/home` results in 3xx redirect to `/auth/sign-in`
- Indicates middleware is not finding a valid session

### Database Analysis

Not applicable - issue is in cookie/session handling, not database

### Performance Metrics

Not applicable - test fails before performance can be measured

### Screenshots

Not captured - test fails during navigation

## Error Stack Traces

```
Error: page.waitForSelector: Timeout 18000ms exceeded.
waiting for locator('[data-testid="team-selector"]') to be visible
=========================== logs ===========================
waiting for locator('[data-testid="team-selector"]') to be visible
============================================================
    at /home/runner/work/2025slideheroes/2025slideheroes/apps/e2e/tests/utils/wait-for-hydration.ts:95:19
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` - Cookie creation and storage state
  - `apps/web/proxy.ts` - Middleware that validates cookies
  - `packages/supabase/src/clients/middleware-client.ts` - Supabase client creation
  - `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Failing test

- **Recent Changes**:
  - `dd4e085f3` - Added diagnostic logging for CI auth (Phase 1)
  - `54ee273dc` - Set explicit cookie domain for Vercel previews
  - `43d2d5f77` - Preserve auth storage state across retries

- **Suspected Functions**:
  - `proxy.ts:getUser()` - Session validation in middleware
  - `middleware-client.ts:createMiddlewareClient()` - Supabase client that reads cookies

## Related Issues & Context

### Direct Predecessors
- #1507 (CLOSED): "Bug Fix: Dev Integration Tests Fail Due to Pre-Authenticated Cookie Rejection" - Phase 1 diagnostics added but not root cause fix
- #1502 (CLOSED): "Bug Diagnosis: Dev Integration Tests Fail Due to Pre-Authenticated Cookie Rejection" - Initial diagnosis

### Related Infrastructure Issues
- #1497 (CLOSED): "Bug Fix: Team Accounts Integration Tests Fail in CI Due to Auth Cookie Domain Mismatch" - Cookie domain fix applied
- #1494 (CLOSED): "Bug Diagnosis: Team Accounts Integration Tests Fail in CI Due to Auth Cookie Domain Mismatch" - Domain diagnosis

### Similar Symptoms
- #1493 (CLOSED): "Bug Fix: Team Accounts Integration Tests Fail on Retry Due to Auth Session Loss" - Different issue (retry-specific)
- #1096 (CLOSED): "E2E Auth Cookie Domain Fix" - Original domain issue (may be related)

### Historical Context
This is a recurring issue pattern. Multiple attempts have been made to fix CI auth:
1. Cookie domain fix (#1497) - Applied but didn't resolve
2. Diagnostic logging (#1507) - Added but only reveals cookies ARE created correctly
3. Storage state restoration (#1493) - Retry-specific fix

## Root Cause Analysis

### Identified Root Cause

**Summary**: Supabase middleware is not recognizing pre-authenticated JWT cookies despite correct cookie name, domain, and storage state. The JWT validation fails silently because server-side DEBUG_E2E_AUTH logs go to Vercel, not CI workflow logs.

**Detailed Explanation**:

Based on comprehensive investigation, the cookies are:
1. ✅ Created with correct name (`sb-ldebzombxtszzcgnylgq-auth-token`)
2. ✅ Created with explicit domain matching Vercel preview URL
3. ✅ Created with proper attributes (secure: true, sameSite: Lax)
4. ✅ Verified present in browser context (cookieCount: 3)
5. ✅ Saved to storage state file
6. ❌ NOT recognized by middleware when tests execute

The middleware at `proxy.ts:306-337` handles `/home/*` routes:
```typescript
const { data } = await getUser(req, res);
if (!data?.claims) {
    // Redirects to sign-in - THIS IS HAPPENING
}
```

The `getUser()` function creates a Supabase middleware client and calls `getSession()`. The session is not being recognized.

**Most Likely Cause** (requires server logs to confirm):

The JWT token's `iss` (issuer) claim may not match exactly between:
- **E2E Setup**: Uses `E2E_SUPABASE_URL` environment variable
- **Deployed Middleware**: Uses `NEXT_PUBLIC_SUPABASE_URL` environment variable

The healthcheck only compares project refs (first part of hostname), not full URLs. Any difference in:
- Protocol (http vs https)
- Trailing slashes
- Casing
- Port numbers

Would cause JWT validation to fail silently.

**Alternative Causes** (less likely but possible):
1. Playwright storage state not properly transmitting cookies from file to request headers
2. Cookie encoding format mismatch between global-setup @supabase/ssr and middleware @supabase/ssr
3. Session expiration during test execution (unlikely - expires in 1 hour)

**Supporting Evidence**:
- Cookies ARE created correctly (verified in CI logs)
- Cookie name matches what middleware expects
- Domain matches the Vercel preview URL
- But middleware returns no claims → redirects to sign-in

### How This Causes the Observed Behavior

1. Global setup authenticates against remote Supabase using `E2E_SUPABASE_URL`
2. JWT is issued with `iss` claim pointing to that URL
3. Cookies are created and saved to storage state
4. Tests load storage state and make request to Vercel preview
5. Middleware creates Supabase client using `NEXT_PUBLIC_SUPABASE_URL`
6. Supabase client validates JWT and checks `iss` claim
7. If URLs don't match exactly, JWT validation fails
8. `getSession()` returns null, `getClaims()` returns no claims
9. Middleware redirects to `/auth/sign-in`

### Confidence Level

**Confidence**: Medium

**Reasoning**:
- High confidence that cookies are created correctly (CI logs prove it)
- High confidence that middleware is rejecting the session (redirect proves it)
- Medium confidence on JWT issuer mismatch (cannot access server-side logs to confirm)
- The `base64-` prefix in cookie value preview is unusual but may not be the cause

## Fix Approach (High-Level)

1. **Immediate**: Add full URL comparison to healthcheck endpoint (not just project ref)
2. **Diagnostic**: Enable Vercel function logs and capture DEBUG_E2E_AUTH output from middleware
3. **Fix**: Ensure `E2E_SUPABASE_URL` exactly matches `NEXT_PUBLIC_SUPABASE_URL` in Vercel preview environment

Alternative approach if JWT is not the issue:
- Debug Playwright storage state cookie transmission
- Add request header logging to capture actual cookies sent to middleware

## Diagnosis Determination

The root cause is **likely JWT issuer validation failure** due to a subtle URL mismatch between E2E test configuration and deployed environment. The cookies themselves are correctly created and stored, but the session is not recognized by the middleware.

**Key Evidence**:
1. Cookies verified present with correct name and domain
2. Navigation to protected route immediately redirects to sign-in
3. Previous attempts to fix cookie domain did not resolve the issue
4. No server-side logs available to confirm exact failure point

**To Confirm**: Need to either:
1. Access Vercel function logs with DEBUG_E2E_AUTH=true output
2. Add more comprehensive URL comparison to global-setup
3. Decode JWT token and compare `iss` claim to NEXT_PUBLIC_SUPABASE_URL

## Additional Context

### Research Findings

From @supabase/ssr documentation (Context7):
- Library uses base64url encoding for cookies
- Middleware must return ALL cookies from `getAll()` for chunking to work
- `setAll()` must update BOTH request AND response cookies

From Perplexity research:
- Common issue: JWT issuer mismatch between environments
- Playwright tests need both cookies AND localStorage for Supabase auth
- Cross-origin issues can silently break cookie transmission

### Previous Fix Attempts

1. **Cookie Domain Fix** (commit 54ee273dc): Set explicit domain for Vercel previews → Did not resolve
2. **Diagnostic Logging** (commit dd4e085f3): Added DEBUG_E2E_AUTH logging → Confirms cookies created correctly
3. **Storage State Restoration** (commit 43d2d5f77): Restore cookies on retry → Different issue

---
*Generated by Claude Debug Assistant*
*Tools Used: GitHub CLI, Bash, Grep, Read, Context7-expert, Perplexity-expert*
