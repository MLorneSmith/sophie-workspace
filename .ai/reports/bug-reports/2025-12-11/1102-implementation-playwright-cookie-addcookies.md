# Implementation Report: Bug Fix #1102

## Summary

- Fixed Playwright `addCookies` validation error for Vercel preview deployments
- Added `url` property to cookies when `domain` is undefined
- Preserves the domain-less cookie behavior needed for Vercel preview compatibility (from #1096)

## Files Changed

| File | Changes |
|------|---------|
| `apps/e2e/global-setup.ts` | Added `url: baseURL` to cookies when domain is undefined |

## Implementation Details

### Problem

Playwright's `addCookies()` API requires either:
- A `url` property, OR
- Both `domain` AND `path` properties

The previous fix for #1096 correctly removed the explicit domain for Vercel preview deployments to fix auth session loss, but this violated Playwright's validation since neither condition was met.

### Solution

When `domain` is `undefined` (Vercel preview deployments), the cookie object now includes `url: baseURL` instead of just returning the cookie without domain. This satisfies Playwright's validation requirements while preserving the domain-less cookie behavior.

### Code Change

```typescript
// Before (lines 738-743)
if (domain) {
  return { ...cookieBase, domain };
}
return cookieBase;

// After
if (domain) {
  return { ...cookieBase, domain };
}
// When domain is undefined (Vercel preview), use url property instead
return { ...cookieBase, url: baseURL };
```

## Validation Results

- Typecheck: Passed
- Lint: Passed (warnings only, no errors)
- E2E Tests: Global setup completes successfully with cookies properly set
  - Localhost tests use `domain` property (verified)
  - Vercel preview will use `url` property

## Commits

```
9cdafcdc8 fix(e2e): add url property to cookies for Vercel preview deployments
```

## Related Issues

- Fixes #1102 - Playwright addCookies fails with missing domain/url for Vercel preview deployments
- Related to #1101 - Diagnosis of the issue
- Related to #1096 - Original fix that introduced the regression

---
*Implementation completed by Claude*
