# Bug Diagnosis: Vercel Bypass Cookie Missing URL Property for Preview Deployments

**ID**: ISSUE-pending
**Created**: 2026-01-15T16:55:00Z
**Reporter**: CI/CD system
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The E2E global setup fails for Vercel preview deployments with `browserContext.addCookies: Cookie should have a url or a domain/path pair` when setting the `_vercel_jwt` bypass cookie. This is a partial regression of issue #1102 - the fix addressed Supabase cookies but missed the Vercel bypass cookie code path.

## Environment

- **Application Version**: dev branch (commit 42164c7ed)
- **Environment**: CI (GitHub Actions)
- **Node Version**: 22.16.0
- **Last Working**: Unclear - may have been broken since #1102 fix was implemented
- **Affected Workflow**: dev-integration-tests.yml (run #21039120938)

## Reproduction Steps

1. Push code to dev branch to trigger deployment
2. Wait for Deploy to Dev workflow to complete
3. Dev Integration Tests workflow triggers automatically
4. Integration Tests job runs `pnpm --filter web-e2e test:integration`
5. Global setup fails at line 672 when setting Vercel bypass cookie

## Expected Behavior

E2E global setup should complete successfully, setting all required cookies including the Vercel bypass cookie.

## Actual Behavior

Global setup fails with:
```
browserContext.addCookies: Cookie should have a url or a domain/path pair
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:672:19)
```

## Diagnostic Data

### Console Output
```
❌ Global Setup Failed for test user

Error Details:
  Message: browserContext.addCookies: Cookie should have a url or a domain/path pair
  Stack: browserContext.addCookies: Cookie should have a url or a domain/path pair
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:672:19)
```

### Network Analysis
N/A - failure occurs before network requests

### Database Analysis
N/A - failure occurs before database access

### Performance Metrics
N/A - failure occurs during setup

## Error Stack Traces
```
browserContext.addCookies: Cookie should have a url or a domain/path pair
    at globalSetup (/home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:672:19)
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts` (lines 650-672)
- **Recent Changes**:
  - `9cdafcdc8` - fix(e2e): add url property to cookies for Vercel preview deployments (fixed Supabase cookies only)
  - `83f5dd813` - fix(e2e): remove explicit cookie domain for Vercel preview deployments
- **Suspected Functions**:
  - `globalSetup()` - Vercel bypass cookie construction at lines 650-672

## Related Issues & Context

### Direct Predecessors
- #1101 (CLOSED): "Bug Diagnosis: Playwright addCookies fails with missing domain/url for Vercel preview deployments" - Same root cause, same error message
- #1102 (CLOSED): "Bug Fix: Playwright addCookies fails with missing domain/url for Vercel preview deployments" - Fix was applied but incomplete

### Related Infrastructure Issues
- #1096 (CLOSED): "Bug Fix: Integration Tests Auth Session Lost in Vercel Preview Deployments" - Introduced the domain-less cookie pattern
- #1109 (CLOSED): "Bug Fix: E2E Local Test Regression After Vercel Preview Cookie Fixes" - Follow-up fix for local tests

### Same Component
- #1092, #1063, #1067, #713 - All related to E2E cookie/auth session issues

### Historical Context
This is a **partial regression** of #1102. The fix for #1102 correctly added the `url` property to Supabase cookies (lines 818-827), but the **Vercel bypass cookie code at lines 650-672 was not updated**.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Vercel bypass cookie (`_vercel_jwt`) is missing the `url` property for Vercel preview deployments, violating Playwright's `addCookies()` API requirements.

**Detailed Explanation**:
Playwright's `addCookies()` API requires cookies to have either:
1. A `url` property, OR
2. Both `domain` AND `path` properties

At lines 650-672 in `global-setup.ts`:
- The `vercelCookie` object is constructed with `name`, `value`, `path`, `httpOnly`, `secure`, `sameSite`
- For Vercel preview deployments (`isVercelPreview === true`), no `domain` is added (intentionally, per #1096 fix)
- However, no `url` property is added either
- When `context.addCookies([vercelCookie])` is called at line 672, Playwright rejects it

The fix for #1102 (commit `9cdafcdc8`) addressed this for Supabase cookies at lines 818-827:
```typescript
if (cookieConfig.isVercelPreview) {
    return { ...cookieBase, url: baseURL };
}
```

But the Vercel bypass cookie code at lines 650-672 was **never updated** with the same fix.

**Supporting Evidence**:
- Stack trace points to line 672: `await context.addCookies([vercelCookie])`
- Code at lines 667-670 intentionally skips domain for Vercel preview
- Code does NOT add `url` property as alternative
- Same error as #1101/#1102, same root cause
- Fix commit `9cdafcdc8` only modified lines 735-747 (Supabase cookies), not lines 650-672 (Vercel bypass cookie)

### How This Causes the Observed Behavior

1. Dev deployment triggers integration tests workflow
2. Tests run against Vercel preview URL (e.g., `https://slideheroes-xxx.vercel.app`)
3. `getCookieDomainConfig()` returns `isVercelPreview: true`, `domain: undefined`
4. Vercel bypass cookie is constructed without domain (intentional for #1096 fix)
5. `context.addCookies([vercelCookie])` is called with cookie having `path` but no `domain` or `url`
6. Playwright validation fails: "Cookie should have a url or a domain/path pair"
7. Global setup throws, integration tests abort

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message is explicit about the validation failure
- Code clearly shows no `url` property is added for Vercel preview
- Same exact issue was fixed for Supabase cookies in #1102 but this code path was missed
- The fix pattern is already proven (lines 818-827)

## Fix Approach (High-Level)

Add `url: baseURL` to the `vercelCookie` object when `isVercelPreview` is true. The pattern is identical to the fix already applied for Supabase cookies at lines 826-827.

Specifically:
```typescript
// Line 672 - Before
await context.addCookies([vercelCookie]);

// After - add url property for Vercel preview
if (isVercelPreview) {
    await context.addCookies([{ ...vercelCookie, url: baseURL }]);
} else {
    await context.addCookies([vercelCookie]);
}
```

## Diagnosis Determination

The root cause is confirmed: the Vercel bypass cookie code path at lines 650-672 was not updated when #1102 was fixed. The fix is straightforward - apply the same `url: baseURL` pattern that was used for Supabase cookies.

## Additional Context

This is the third iteration of the same class of bug:
1. #1096 introduced domain-less cookies for Vercel preview
2. #1101/#1102 identified and fixed the Playwright validation issue for Supabase cookies
3. This diagnosis identifies the same issue exists for the Vercel bypass cookie

The development team should consider:
- Adding a test case that validates all cookie code paths for Vercel preview compatibility
- Refactoring to consolidate cookie construction logic to prevent similar partial fixes

---
*Generated by Claude Debug Assistant*
*Tools Used: gh issue search, git log, grep, file read*
