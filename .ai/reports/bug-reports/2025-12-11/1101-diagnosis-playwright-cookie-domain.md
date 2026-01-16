# Bug Diagnosis: Playwright addCookies fails with missing domain/url for Vercel preview deployments

**ID**: ISSUE-pending
**Created**: 2025-12-11T16:15:00Z
**Reporter**: CI/CD System
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-integration-tests.yml workflow fails during global setup with the error `browserContext.addCookies: Cookie should have a url or a domain/path pair`. This regression was introduced in commit `83f5dd81` (fix(e2e): remove explicit cookie domain for Vercel preview deployments) which attempted to fix issue #1096 but inadvertently broke Playwright's cookie API requirements.

## Environment

- **Application Version**: dev branch
- **Environment**: CI/CD (GitHub Actions)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Playwright Version**: Latest
- **Last Working**: Commit before 83f5dd813 (Dec 10, 2025)

## Reproduction Steps

1. Push any changes to the `dev` branch
2. `Deploy to Dev` workflow completes successfully
3. `Dev Integration Tests` workflow is triggered
4. Global setup attempts to create authenticated browser states
5. When setting cookies for Vercel preview URL, `context.addCookies()` fails

## Expected Behavior

E2E global setup should successfully inject authentication cookies into the browser context for Vercel preview deployments.

## Actual Behavior

Global setup fails immediately with:
```
browserContext.addCookies: Cookie should have a url or a domain/path pair
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:600:19)
```

## Diagnostic Data

### Console Output
```
🔧 Global Setup: Creating authenticated browser states via API...
✅ API authentication successful for test user
browserContext.addCookies: Cookie should have a url or a domain/path pair
❌ Global Setup Failed for test user
Error: Global setup failed for test user: browserContext.addCookies: Cookie should have a url or a domain/path pair
```

### Network Analysis
N/A - failure occurs during cookie injection, not network requests

### Database Analysis
N/A - Supabase authentication succeeds before the cookie error

### Screenshots
N/A - failure occurs before browser tests run

## Error Stack Traces
```
browserContext.addCookies: Cookie should have a url or a domain/path pair
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:600:19)

  991 |
  992 | 			// Re-throw after providing diagnostics
> 993 | 			throw new Error(
      | 			      ^
  994 | 				`Global setup failed for ${authState.name}: ${error.message}`,
  995 | 			);
```

## Related Code
- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 705-744, 596-600)
- **Recent Changes**: Commit 83f5dd813 introduced this regression
- **Suspected Functions**:
  - `getCookieDomainConfig()` returns `undefined` domain for Vercel preview
  - Cookie mapping logic at line 738-743 does not provide `url` when `domain` is undefined

## Related Issues & Context

### Direct Predecessors
- #1096 (CLOSED): "Bug Fix: Integration Tests Auth Session Lost in Vercel Preview Deployments" - The fix for this issue introduced this regression

### Related Infrastructure Issues
- #1063 (CLOSED): "Dev Integration Tests Fail - Authentication Session Not Persisted to Server"
- #1078 (CLOSED): "Dev Integration Tests Auth Session Lost During Parallel Test Execution"

### Similar Symptoms
- #713 (CLOSED): "E2E Shard 3 Tests Fail - Authenticated Session Not Recognized by Middleware"

### Historical Context
This is a recurring authentication/cookie-related issue in E2E tests. Multiple fixes have been attempted for cookie domain handling, and this latest fix (#1096) created a new failure mode by omitting the required Playwright cookie properties.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Playwright's `addCookies()` API requires either a `url` property OR both `domain` AND `path` properties - but when `domain` is `undefined` (for Vercel preview deployments), neither condition is met.

**Detailed Explanation**:

In commit 83f5dd81, the `getCookieDomainConfig()` function was modified to return `domain: undefined` for Vercel preview deployments (*.vercel.app URLs). The intention was to let the browser use its default cookie domain handling, which was supposed to fix cookies not being transmitted to server-side middleware.

However, Playwright's `addCookies()` method has strict validation requirements (from the [Playwright source code](https://github.com/microsoft/playwright/pull/121/files)):
```javascript
assert(c.url || (c.domain && c.path), "Cookie should have a url or a domain/path pair")
```

The cookie mapping logic at lines 738-743 in `global-setup.ts`:
```typescript
// Only add domain if explicitly set (not for Vercel preview deployments)
if (domain) {
    return { ...cookieBase, domain };
}
return cookieBase;  // <-- BUG: cookieBase has path but no domain OR url
```

When `domain` is `undefined`, the returned cookie object has:
- `name` ✓
- `value` ✓
- `path` ✓ (set to "/")
- `domain` ✗ (not present)
- `url` ✗ (not present)

This violates Playwright's requirement for either `url` OR `domain + path`.

**Supporting Evidence**:
- Error message: `browserContext.addCookies: Cookie should have a url or a domain/path pair`
- Stack trace points to `global-setup.ts:600` where `context.addCookies()` is called
- The workflow logs show the base URL is a Vercel preview: `https://2025slideheroes-4ejolo4qd-slideheroes.vercel.app`
- `getCookieDomainConfig()` returns `domain: undefined` for *.vercel.app URLs (line 70)

### How This Causes the Observed Behavior

1. `Deploy to Dev` succeeds and triggers `Dev Integration Tests`
2. Global setup authenticates via Supabase API (success)
3. `getCookieDomainConfig()` is called with the Vercel preview URL
4. Function returns `{ domain: undefined, isVercelPreview: true, sameSite: "Lax" }`
5. Cookie mapping logic creates cookies WITHOUT domain AND WITHOUT url
6. `context.addCookies(cookiesToSet)` is called at line 767
7. Playwright validates cookies and throws because neither `url` nor `domain+path` is present
8. Global setup catches the error, logs diagnostics, and re-throws
9. Test suite fails without running any tests

### Confidence Level

**Confidence**: High

**Reasoning**: The error message is explicit (`Cookie should have a url or a domain/path pair`), the stack trace points directly to the `addCookies` call, and I can trace the exact code path that creates cookies without the required properties. The bug was introduced in a single commit (83f5dd81) with a clear before/after behavior change.

## Fix Approach (High-Level)

When `domain` is `undefined` for Vercel preview deployments, provide a `url` property instead of leaving both `url` and `domain` absent. The fix should:

1. Modify the cookie mapping logic (lines 738-743) to add a `url` property when `domain` is undefined
2. The `url` should be the `baseURL` (e.g., `https://2025slideheroes-4ejolo4qd-slideheroes.vercel.app`)
3. When using `url`, do NOT include `domain` or `path` (Playwright doesn't allow mixing them)

Example fix:
```typescript
if (domain) {
    return { ...cookieBase, domain };
} else {
    // For Vercel preview deployments, use url instead of domain/path
    // Playwright will derive domain from the URL automatically
    const { path, ...cookieWithoutPath } = cookieBase;
    return { ...cookieWithoutPath, url: baseURL };
}
```

## Diagnosis Determination

**Root cause confirmed**: The fix for issue #1096 removed the `domain` property for Vercel preview cookies but did not add the required `url` property as an alternative. Playwright's `addCookies()` API requires either `url` OR `domain+path`, and neither is present.

This is a straightforward regression that can be fixed by providing the `url` property when `domain` is undefined.

## Additional Context

This is part of an ongoing series of authentication cookie issues in E2E tests (#713, #1062, #1063, #1075, #1078, #1092, #1096). Each fix has addressed one aspect of cookie handling but sometimes introduced new issues. A more comprehensive review of the E2E cookie injection strategy may be warranted after this fix.

The Vercel preview deployment uses a unique URL pattern: `https://2025slideheroes-<hash>-slideheroes.vercel.app` which requires special cookie handling different from the custom domain `dev.slideheroes.com`.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run list, git log, git show, Read, Grep, WebSearch*
