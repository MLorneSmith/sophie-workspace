# Implementation Report: Issue #1109 - E2E Local Test Regression

**Date**: 2025-12-11
**Issue**: [#1109](https://github.com/slideheroes/2025slideheroes/issues/1109)
**Type**: Bug Investigation
**Status**: Defensive changes applied, root cause requires further investigation

## Summary

After extensive investigation, determined that the suspected cookie configuration changes were NOT the root cause of E2E test failures. Applied defensive safeguards but the underlying session recognition issue remains unresolved.

## Investigation Findings

### Cookie Configuration Analysis

The commits suspected of causing the regression (9cdafcdc8, 83f5dd813) only affect **Vercel preview deployments**:

1. `getCookieDomainConfig("http://localhost:3001")` returns `domain: "localhost"`
2. Since `domain` is defined, the `url: baseURL` code path is NEVER taken for local tests
3. Local Docker tests were unaffected by these changes

### Test Failure Pattern

- **Passing**: Tests with fresh UI login (`loginAsUser()`)
- **Failing**: Tests with pre-authenticated storage state
- **Symptom**: Users redirected to marketing homepage (`/`) instead of `/home`
- **Evidence**: Page snapshot shows marketing page elements (Sign In/Sign Up buttons)

### Ruled Out Causes

- ❌ Cookie domain misconfiguration (logs show correct `domain: localhost`)
- ❌ Cookie name mismatch (`sb-host-auth-token` correctly set)
- ❌ Playwright cookie format error (storage state JSON is valid)
- ❌ Cookie configuration changes (code path not affected for local tests)

### Likely Root Causes

1. **Session validation timing**: Cookies may not be applied before middleware runs
2. **Token validation issue**: Middleware rejecting valid sessions
3. **Worker parallelism**: Multiple parallel workers causing interference
4. **Client-side auth race**: Supabase auth refresh triggering redirects

## Changes Made

**Commit**: `7ea11f82e`

```diff
- // For Vercel preview deployments, use url property instead of domain/path
+ // Cookie domain/url strategy based on environment:
+ // - Local/Docker: Use explicit domain (e.g., "localhost")
+ // - Vercel preview: Use url property (domain is undefined)
+ //
+ // Playwright's addCookies() API requires: url OR (domain AND path)
+ // See: Issue #1109 - E2E Local Test Regression After Vercel Preview Cookie Fixes
+ //
+ // IMPORTANT: We explicitly check isVercelPreview to ensure local tests
+ // NEVER accidentally get the url property
  if (domain) {
+   // Local development, Docker tests, or production with explicit domain
    return { ...cookieBase, domain };
  }
- // When domain is undefined (Vercel preview), use url property instead
- return { ...cookieBase, url: baseURL };
+ // Only use url property for Vercel preview deployments
+ if (cookieConfig.isVercelPreview) {
+   return { ...cookieBase, url: baseURL };
+ }
+ // Fallback: default to localhost for safety
+ debugLog("cookie:fallback_domain", {...});
+ return { ...cookieBase, domain: "localhost" };
```

## Files Changed

| File | Changes |
|------|---------|
| `apps/e2e/global-setup.ts` | Added defensive safeguards for cookie environment detection |

## Validation Results

- ✅ TypeScript compilation passes
- ✅ Lint checks pass
- ❌ E2E tests still fail (same failures as before)
- This confirms the cookie configuration was NOT the root cause

## Recommended Next Steps

1. **Investigate session validation** in `proxy.ts` - debug why `getUser()` returns no claims
2. **Add request-level logging** to capture cookies in proxy.ts
3. **Test with single worker** (`--workers=1`) to isolate parallelism issues
4. **Compare passing vs failing** test patterns (Accessibility tests pass)
5. **Consider fresh auth pattern** for critical tests

## Related Files

- Investigation: `.ai/reports/bug-reports/2025-12-11/1107-diagnosis-e2e-local-test-regression.md`
- Research: `.ai/reports/research-reports/2025-12-11/perplexity-nextjs-middleware-changes.md`
- GitHub: [Issue #1109](https://github.com/slideheroes/2025slideheroes/issues/1109)

---
*Implementation by Claude Code*
