# Bug Fix: Playwright addCookies fails with missing domain/url for Vercel preview deployments

**Related Diagnosis**: #1101
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Playwright's `addCookies()` API requires either `url` property OR both `domain` AND `path` properties. When `domain` is `undefined` for Vercel preview deployments, neither condition is met, causing the API to reject the cookie.
- **Fix Approach**: When `domain` is `undefined`, provide a `url` property instead, using the baseURL.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests.yml workflow fails during global setup with the error:
```
browserContext.addCookies: Cookie should have a url or a domain/path pair
    at globalSetup (/home/runner/_work/.../apps/e2e/global-setup.ts:767:19)
```

This regression was introduced in commit `83f5dd813` which modified `getCookieDomainConfig()` to return `domain: undefined` for Vercel preview deployments (*.vercel.app). While this fix resolved issue #1096 (auth session loss), it inadvertently violated Playwright's internal cookie validation:

```javascript
// Playwright's internal validation (simplified)
assert(
  c.url || (c.domain && c.path),
  "Cookie should have a url or a domain/path pair"
);
```

The code at lines 738-743 returns a cookie object with `path` but no `domain` OR `url` for Vercel preview deployments, triggering this assertion error.

For full context, see diagnosis issue #1101.

### Solution Approaches Considered

#### Option 1: Provide `url` property instead of `domain/path` ⭐ RECOMMENDED

**Description**: When `domain` is `undefined`, include a `url` property in the cookie object using the baseURL. This satisfies Playwright's validation while maintaining the Vercel preview compatibility fix from #1096.

**Pros**:
- Minimal change - only affects the cookie object construction
- Satisfies Playwright's API requirements (`url` is a valid cookie identifier)
- Preserves the Vercel preview fix (#1096) that uses domain-less cookies
- Browser automatically uses correct domain when `url` is set
- No impact on localhost or custom domain deployments

**Cons**:
- Slightly different cookie handling (using `url` vs `domain/path`)
- Requires understanding of Playwright's cookie validation

**Risk Assessment**: low - Playwright explicitly supports the `url` property as a valid alternative to `domain/path`

**Complexity**: simple - single conditional check with url assignment

#### Option 2: Always set explicit domain for all deployments

**Description**: Remove the special handling for Vercel preview deployments and always set an explicit domain.

**Why Not Chosen**: This would re-introduce issue #1096 (auth session loss in Vercel preview deployments). The diagnosis specifically notes that domain-less cookies are required for Vercel preview compatibility.

#### Option 3: Use `localhost` as fallback domain for Vercel preview

**Description**: For Vercel preview deployments, set domain to a special value instead of undefined.

**Why Not Chosen**: This would still violate Playwright's requirement. The API either needs a valid domain+path pair that matches the cookie or a valid url. A fake domain would be invalid.

### Selected Solution: Provide `url` property for Vercel preview deployments

**Justification**: This approach is the minimal change that fixes the Playwright validation error while preserving the Vercel preview fix. When `url` is provided, Playwright validates that the cookie's domain is compatible with the URL and allows the cookie to be set. The browser then automatically handles cookie storage and transmission correctly based on the URL.

**Technical Approach**:
1. In the cookie mapping logic (lines 738-743), when `domain` is `undefined`, include `url: baseURL` in the cookie object
2. Extract the baseURL from the context or pass it to the cookie construction function
3. Ensure the URL is properly formatted (should already be valid from playwright.config.ts)

**Architecture Changes**: None - this is a localized fix in the cookie construction logic

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` (lines 705-744, 596-600) - Cookie construction and addCookies call

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Extract baseURL parameter for cookie construction

The baseURL is already available in the setupPageWithAuthState function context. We need to ensure it's accessible in the cookie construction scope.

- Review the current scope of `domain` variable (line 700)
- Verify `baseURL` variable is accessible at the cookie construction point
- Add comments documenting the URL availability

**Why this step first**: We need baseURL to be available before constructing the cookie object with the `url` property.

#### Step 2: Modify cookie object construction to include `url` when domain is undefined

Update the conditional logic at lines 738-743:

**Current code**:
```typescript
// Only add domain if explicitly set (not for Vercel preview deployments)
// When domain is undefined, browser uses current host automatically
if (domain) {
  return { ...cookieBase, domain };
}
return cookieBase;
```

**Updated code**:
```typescript
// For Vercel preview deployments, use url property instead of domain/path
// to satisfy Playwright's cookie API validation requirements
if (domain) {
  return { ...cookieBase, domain };
}
// When domain is undefined (Vercel preview), use url property instead
// This satisfies Playwright's requirement: cookie must have url OR (domain AND path)
return { ...cookieBase, url: baseURL };
```

**Why this approach**: Playwright accepts either `url` OR `domain+path` pair. Using `url` is semantically correct for Vercel preview deployments and tells Playwright exactly which URL the cookie is associated with.

#### Step 3: Add tests for Vercel preview cookie handling

Since the fix affects Vercel preview deployments specifically, add a test or validation that confirms:
- Cookies are correctly constructed with `url` property for Vercel preview deployments
- Cookies are correctly constructed with `domain` property for localhost/custom domains
- The global setup completes successfully without the `addCookies` error

**Test approach**: These validations can be added to global-setup.ts debug logging or as a simple assertion in the test that runs against Vercel preview deployments.

#### Step 4: Validation and testing

- Run E2E tests locally against localhost (should use domain property)
- Run E2E tests against a Vercel preview URL (should use url property)
- Verify that the dev-integration-tests.yml workflow passes in CI

## Testing Strategy

### Unit Tests

No isolated unit tests needed - this fix is in the integration logic and requires full context (browser context, cookies, URLs).

### Integration Tests

The fix is validated by the existing global setup process:
- ✅ Global setup completes without `addCookies` error for Vercel preview deployments
- ✅ Global setup correctly sets cookies with `url` property for preview URLs
- ✅ Global setup correctly sets cookies with `domain` property for localhost
- ✅ Global setup correctly sets cookies with `domain` property for custom domains

### E2E Tests

The fix is validated by any E2E test running against a Vercel preview deployment:
- ✅ Tests authenticate successfully using the injected cookies
- ✅ Tests maintain authentication state throughout test execution
- ✅ No `browserContext.addCookies` errors in test output

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run global setup locally against http://localhost:3001 (should succeed with `domain` property)
- [ ] Run global setup locally against http://127.0.0.1:3001 (should succeed with `domain` property)
- [ ] Verify E2E tests pass when run with default localhost base URL
- [ ] Deploy to Vercel preview and run E2E tests against preview URL
- [ ] Verify dev-integration-tests.yml workflow passes in CI (this will happen automatically when PR is merged)
- [ ] Verify no new errors in test output or browser console

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Cookie transmission issues in edge cases**: Using `url` instead of `domain/path` might affect how cookies are transmitted in unexpected scenarios
   - **Likelihood**: low - Playwright's API fully supports `url` property
   - **Impact**: low - Would only affect test auth, not production
   - **Mitigation**: E2E tests must pass against Vercel preview; any issue would be caught immediately

2. **Playwright version compatibility**: Older Playwright versions might not support `url` property correctly
   - **Likelihood**: low - `url` is a standard cookie property across versions
   - **Impact**: low - SlideHeroes uses recent Playwright versions
   - **Mitigation**: Check playwright.config.ts for current version; document if version constraint needed

3. **Vercel preview cookie handling regression**: The change might inadvertently break cookies in some Vercel preview scenarios
   - **Likelihood**: very low - We're adding a property Playwright expects
   - **Impact**: medium - Would break E2E tests
   - **Mitigation**: Extensive E2E test coverage against preview deployments

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the change: `git revert <commit-hash>`
2. Verify E2E tests run locally against localhost
3. Re-open #1101 with additional context about the new issue
4. Plan alternative solution (e.g., setting dummy domain for preview, changing cookie structure)

**Monitoring** (if needed):

Monitor the dev-integration-tests.yml workflow:
- Verify global setup completes without errors
- Verify all E2E tests pass against Vercel preview deployments
- Watch for any new cookie-related errors in test output

## Performance Impact

**Expected Impact**: none

This is a pure fix with no performance implications. The cookie construction logic is identical in complexity; we're just adding a different property to the cookie object.

## Security Considerations

**Security Impact**: none - neutral to positive

Adding the `url` property makes the cookie-URL association explicit to Playwright, which is arguably more secure than relying on browser defaults. This has no negative security implications.

**Security review needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

To verify the bug exists, run E2E tests against a Vercel preview deployment:

```bash
# Deploy to Vercel preview
vercel deploy --target production

# Run E2E tests against the preview URL
PLAYWRIGHT_BASE_URL=https://2025slideheroes-XXXXX.vercel.app pnpm --filter e2e test

# Expected: Error - "browserContext.addCookies: Cookie should have a url or a domain/path pair"
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run E2E tests locally (should use domain property)
pnpm --filter e2e test

# Run E2E tests against Vercel preview (should use url property)
PLAYWRIGHT_BASE_URL=https://2025slideheroes-XXXXX.vercel.app pnpm --filter e2e test

# Run full test suite
pnpm test

# Build
pnpm build
```

**Expected Result**:
- All commands succeed
- No `addCookies` errors
- E2E tests pass against both localhost and Vercel preview deployments

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
pnpm --filter e2e test

# Verify global setup completes successfully
pnpm --filter e2e test tests/smoke/smoke.spec.ts

# Deploy to Vercel and verify workflow passes
vercel deploy --prod
```

## Dependencies

**No new dependencies required** - this fix only uses the Playwright API that's already in use.

## Database Changes

**No database changes required** - this is a client-side E2E testing fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is an E2E testing fix that doesn't affect production code or infrastructure.

**Feature flags needed**: no

**Backwards compatibility**: maintained - the fix only affects Vercel preview deployments; localhost and custom domains remain unchanged.

## Success Criteria

The fix is complete when:
- [ ] Code change made to apps/e2e/global-setup.ts (lines 738-743)
- [ ] All validation commands pass
- [ ] E2E tests pass against localhost (domain property used)
- [ ] E2E tests pass against Vercel preview (url property used)
- [ ] No `addCookies` errors in test output
- [ ] dev-integration-tests.yml workflow passes in CI
- [ ] Code review approved
- [ ] Manual testing checklist complete

## Notes

This is a minimal, surgical fix that directly addresses the root cause identified in the diagnosis. The change is low-risk because:
1. It only affects Vercel preview deployments (specific condition)
2. It uses an explicitly supported Playwright API property
3. It preserves the fix for issue #1096
4. Extensive E2E test coverage validates the fix
5. The change has zero impact on production code

**Related Issues**:
- #1096 - Previous fix that introduced this regression (domain-less cookies for Vercel preview)
- #1063, #1078, #713 - Earlier cookie/auth issues that provide context

**References**:
- Playwright documentation: Cookie API requirements
- Diagnosis: #1101 - Detailed root cause analysis

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1101*
