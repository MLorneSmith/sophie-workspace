# Bug Diagnosis: E2E Cookie sameSite Override Ignored - Auth Cookies Set as Lax Instead of None

**ID**: ISSUE-1527
**Created**: 2026-01-16T16:50:00Z
**Reporter**: CI workflow failure
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests CI workflow fails because the fix in commit 1eff86ef3 (Issue #1524) is ineffective. The fix correctly sets `cookieConfig.sameSite = "None"` for Vercel preview deployments, but this value is ignored because `@supabase/ssr` always provides `sameSite: 'lax'` on its cookies. The `normalizeSameSite()` function only uses the override as a default when no value is provided, not as a forced override.

## Environment

- **Application Version**: dev branch, commit 1eff86ef3
- **Environment**: CI (GitHub Actions)
- **Browser**: Chromium (Playwright)
- **Node Version**: v20.10.0
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never - fix was incomplete

## Reproduction Steps

1. Push to dev branch triggering CI workflow
2. CI runs `dev-integration-tests` workflow
3. Global setup creates authenticated cookies for test users
4. Cookies are set with `sameSite: Lax` instead of `sameSite: None`
5. Tests navigate to protected pages (e.g., `/home`)
6. Cookies aren't sent cross-site due to sameSite=Lax restriction
7. Middleware doesn't see session, redirects to `/auth/sign-in?next=/home`
8. Tests fail waiting for `[data-testid="team-selector"]` element

## Expected Behavior

For Vercel preview deployments, auth cookies should be set with `sameSite: None` to allow cross-site cookie transmission, enabling the deployed middleware to recognize the authenticated session.

## Actual Behavior

Auth cookies are set with `sameSite: Lax` regardless of the `cookieConfig.sameSite` value, causing them not to be transmitted cross-site. The middleware doesn't see the session and redirects to sign-in.

## Diagnostic Data

### Console Output
```
🍪 Cookie domain config: 2025slideheroes-5kj9nlt8q-slideheroes.vercel.app (isVercelPreview: true)
[DEBUG_E2E_AUTH:global-setup:cookie:vercel_preview_detected] {
  "hostname": "2025slideheroes-5kj9nlt8q-slideheroes.vercel.app",
  "baseURL": "https://2025slideheroes-5kj9nlt8q-slideheroes.vercel.app",
  "domain": "2025slideheroes-5kj9nlt8q-slideheroes.vercel.app",
  "sameSite": "None"   <-- Correctly set in config
}

[DEBUG_E2E_AUTH:global-setup:cookies:setting] {
  "sameSiteStrategy": "None",   <-- Config says None
  ...
}

   🍪 sb-ldebzombxtszzcgnylgq-auth-token:
      Domain: 2025slideheroes-5kj9nlt8q-slideheroes.vercel.app
      SameSite: Lax    <-- But actual cookie is Lax!
      Secure: true
      HttpOnly: false

⚠️  Cookie attribute verification warning for test user: Attribute issues: sb-ldebzombxtszzcgnylgq-auth-token: sameSite is Lax, expected None
```

### Network Analysis
```
Tests navigating to /home are redirected to /auth/sign-in?next=/home
pw:api   navigated to "https://2025slideheroes-5kj9nlt8q-slideheroes.vercel.app/auth/sign-in?next=/home"
waiting for locator('[data-testid="team-selector"]') to be visible
pw:api <= page.waitForSelector failed +20s
```

### Test Results
```
Running 27 tests using 1 worker

Error: page.waitForSelector: Timeout 20000ms exceeded.
      104 | 			).toBeVisible({ timeout: CI_TIMEOUTS.element });
      106 | 			timeout: CI_TIMEOUTS.element,

1) [chromium] › team-accounts.spec.ts:112 › Team Account › user can update their team name and slug
2) [chromium] › team-accounts.spec.ts:129 › Team Account › cannot create Team account using reserved names
(and all other team account tests)
```

## Error Stack Traces
```
Error: page.waitForSelector: Timeout 20000ms exceeded.
    at global-setup.ts:104 (toBeVisible assertion)
    waiting for locator('[data-testid="team-selector"]') to be visible
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 920-959)
- **Recent Changes**: Commit 1eff86ef3 attempted to fix this issue
- **Suspected Functions**: `normalizeSameSite()` and the cookie setting logic

## Related Issues & Context

### Direct Predecessors
- #1524 (CLOSED): "Bug Fix: Playwright Cookies Not Recognized in Vercel Preview Deployments" - The fix attempted to address this but was incomplete
- #1518 (CLOSED): "Bug Fix: Dev Integration Tests Fail - Cookies Not Recognized by Middleware" - Related URL validation fix

### Same Component
- #1494: Team accounts tests fail due to cookie domain mismatch
- #1096: Auth session lost in Vercel preview deployments
- #1485: Vercel Bypass Cookie Missing URL Property

### Historical Context
This is a continuation of a series of issues around Vercel preview cookie handling. The pattern shows increasingly complex cookie configuration requirements for cross-site scenarios.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `normalizeSameSite()` function uses `cookieConfig.sameSite` as a fallback default value, but `@supabase/ssr` always provides `sameSite: 'lax'`, so the override is never applied.

**Detailed Explanation**:

The fix in commit 1eff86ef3 correctly sets `cookieConfig.sameSite = "None"` for Vercel preview deployments in `getCookieDomainConfig()`. However, the fix fails because of how `normalizeSameSite()` is called:

```typescript
// Line 920-929 - the normalizeSameSite function
const normalizeSameSite = (
  value?: string,
  defaultValue: "Lax" | "Strict" | "None" = "Lax",
): "Lax" | "Strict" | "None" => {
  if (!value) return defaultValue;  // <-- Only uses default when value is empty/undefined
  const lower = value.toLowerCase();
  if (lower === "strict") return "Strict";
  if (lower === "none") return "None";
  return "Lax";
};

// Line 956-959 - where it's called
sameSite: normalizeSameSite(
  c.options.sameSite as string,  // <-- @supabase/ssr always provides "lax"
  cookieConfig.sameSite,          // <-- This is "None" but never used
),
```

The `@supabase/ssr` library **always** sets `sameSite: 'lax'` on cookies it creates. Since the value exists, `normalizeSameSite()` converts it to `"Lax"` instead of using the default value of `"None"` from `cookieConfig.sameSite`.

**Supporting Evidence**:
- Log line 68: `"sameSite": "None"` in config (correctly set)
- Log line 184: `SameSite: Lax` in actual cookie (override ignored)
- Log line 200: Warning explicitly states `sameSite is Lax, expected None`
- Code at `global-setup.ts:920-929`: `normalizeSameSite` only uses default when value is falsy

### How This Causes the Observed Behavior

1. `getCookieDomainConfig()` returns `sameSite: "None"` for Vercel preview
2. `@supabase/ssr` creates cookies with `sameSite: 'lax'`
3. `normalizeSameSite('lax', 'None')` returns `'Lax'` (not `'None'`)
4. Cookies are set with `sameSite: Lax`
5. Cross-site requests to Vercel preview don't include cookies (browser SameSite policy)
6. Middleware sees no session, redirects to `/auth/sign-in`
7. Tests fail waiting for authenticated page elements

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The logs explicitly show the discrepancy between config (`"None"`) and actual cookie (`Lax`)
2. The warning message confirms: `sameSite is Lax, expected None`
3. The code path is clear and deterministic
4. All failing tests follow the same pattern (redirect to sign-in)

## Fix Approach (High-Level)

The fix requires **forcing** the sameSite value from `cookieConfig` instead of using it as a fallback default. The `normalizeSameSite()` call should prioritize the config's `sameSite` value for Vercel preview deployments.

Option 1 (Simple): Override sameSite after normalization when `isVercelPreview` is true:
```typescript
sameSite: cookieConfig.isVercelPreview
  ? "None"  // Force None for Vercel preview
  : normalizeSameSite(c.options.sameSite as string, cookieConfig.sameSite),
```

Option 2 (More flexible): Pass an override flag to normalizeSameSite:
```typescript
const normalizeSameSite = (value?: string, override?: "Lax" | "Strict" | "None") => {
  if (override) return override;  // Force override when provided
  // ... existing logic
}
```

## Diagnosis Determination

The root cause is definitively identified: the `normalizeSameSite()` function treats `cookieConfig.sameSite` as a fallback default rather than a forced override. Since `@supabase/ssr` always provides `sameSite: 'lax'`, the intended `"None"` value for Vercel preview deployments is never applied.

The fix is straightforward: modify the cookie setting logic to force `sameSite: "None"` for Vercel preview deployments regardless of what `@supabase/ssr` returns.

## Additional Context

The team account tests are most visibly affected because they navigate to `/home/<account>` which requires authentication. However, all tests relying on pre-authenticated sessions will fail for the same reason.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, git log, git show, Read, Grep, Bash*
