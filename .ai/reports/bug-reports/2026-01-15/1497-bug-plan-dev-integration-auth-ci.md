# Bug Fix: Team Accounts Integration Tests Fail in CI Due to Auth Cookie Domain Mismatch

**Issue**: #1497
**Related Diagnosis**: #1494
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Auth cookies created during global-setup use `domain: undefined` for Vercel preview URLs, causing cookies to not be sent with requests in CI
- **Fix Approach**: Explicitly set cookie domain to the preview URL hostname for consistent browser behavior
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Team-accounts integration tests pass locally but fail in CI against Vercel preview deployments. Tests navigate to `/home` but get redirected to `/auth/sign-in?next=/home`, indicating auth cookies are not being sent with requests. The root cause is that cookies created with `domain: undefined` (browser default) are not reliably associated with Vercel preview URLs by Playwright's cookie API.

For full details, see diagnosis issue #1494.

### Solution Approaches Considered

#### Option 1: Explicitly Set Cookie Domain for Vercel Preview URLs ⭐ RECOMMENDED

**Description**: Modify `getCookieDomainConfig()` to return the explicit hostname for Vercel preview URLs instead of `undefined`. This ensures cookies are properly associated with the preview domain when Playwright injects them.

**Change**:
```typescript
// Current (line 62-72):
if (hostname.endsWith(".vercel.app")) {
  return {
    domain: undefined, // Browser uses current host automatically
    isVercelPreview: true,
    sameSite: "Lax",
  };
}

// Proposed fix:
if (hostname.endsWith(".vercel.app")) {
  return {
    domain: hostname, // Explicit domain for Playwright cookie API
    isVercelPreview: true,
    sameSite: "Lax",
  };
}
```

**Pros**:
- Minimal code change (1 line)
- Consistent with localhost behavior (explicit domain works locally)
- Makes cookie domain configuration explicit and predictable
- Aligns with Playwright's cookie API expectations

**Cons**:
- Reverts part of Issue #1096 fix
- May reintroduce middleware cookie reception issues from #1096

**Risk Assessment**: medium
- This reverts a deliberate fix from #1096 that addressed "cookies not being transmitted to server-side middleware"
- However, current tests show the opposite problem - cookies aren't being sent AT ALL
- The key difference: #1096 may have been about SERVER-SIDE cookie reading, current issue is about CLIENT-SIDE cookie transmission

**Complexity**: simple - single line change, clear behavior

**Mitigation Strategy**:
1. Test thoroughly in CI before merging
2. Monitor for signs of #1096 regression (middleware not reading cookies)
3. If middleware issues reappear, investigate alternative approaches (Option 2 or 3)

#### Option 2: Use Different Cookie Strategies for Setup vs Runtime

**Description**: Set explicit domain during cookie injection (global-setup), but configure middleware to read cookies with domain wildcards or flexible matching.

**Pros**:
- Could satisfy both setup (Playwright) and runtime (middleware) requirements
- More sophisticated solution that addresses both #1096 and #1494

**Cons**:
- Much more complex - requires middleware changes
- Higher risk of breaking existing auth flows
- Harder to test and debug
- Requires understanding Supabase SSR cookie reading internals

**Why Not Chosen**: Overcomplicated for the problem. Issue #1494 shows cookies aren't even reaching the browser in the first place, so middleware changes won't help.

#### Option 3: Investigate Playwright Cookie API `url` vs `domain` Behavior

**Description**: Debug why the current `url` property approach (lines 842-856) isn't working and fix the cookie injection logic.

**Pros**:
- Might reveal a subtle bug in the current cookie injection code
- Could work with `domain: undefined` as intended

**Cons**:
- Time-consuming investigation with uncertain outcome
- The diagnosis already shows that explicit domain works (locally)
- Playwright documentation recommends using `domain + path` for cookie injection

**Why Not Chosen**: The evidence clearly shows explicit domain works (local tests pass). The `url` approach is a workaround that isn't functioning correctly.

### Selected Solution: Option 1 - Explicitly Set Cookie Domain

**Justification**: The simplest fix that aligns with proven working behavior (local tests). The trade-off is potential regression of #1096, but we have strong evidence this approach works:

1. **Local tests pass** with explicit `domain: localhost`
2. **CI tests fail** with `domain: undefined`
3. Playwright's cookie API prefers explicit `domain + path` over `url` property

**Technical Approach**:
- Change line 69 in `getCookieDomainConfig()` from `domain: undefined` to `domain: hostname`
- This makes Vercel preview behavior consistent with localhost and custom domains
- Playwright will reliably inject cookies with proper domain association
- Browser will send cookies with requests to the same domain

**Architecture Changes**: None - this is a configuration change only

**Migration Strategy**: Not applicable - no data or state to migrate

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Modify `getCookieDomainConfig()` to return explicit hostname for Vercel previews

### New Files

None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update cookie domain configuration for Vercel previews

Modify the `getCookieDomainConfig()` function in `apps/e2e/global-setup.ts`:

- Change line 69 from `domain: undefined` to `domain: hostname`
- Update the function comment (lines 38-45) to reflect the new behavior
- Update debug log message (line 63-67) to show the actual hostname instead of "(browser default)"

**Why this step first**: This is the core fix - all other steps validate this change

#### Step 2: Run tests locally to verify no regressions

Verify the change doesn't break local tests:

```bash
pnpm --filter web-e2e test team-accounts.spec.ts
```

**Expected**: All tests pass (2 passed, 4 skipped)

#### Step 3: Run full E2E test suite locally

Ensure no other tests regressed:

```bash
pnpm --filter web-e2e test
```

**Expected**: All tests pass with no new failures

#### Step 4: Validate with type checking and linting

Run code quality checks:

```bash
pnpm typecheck
pnpm lint
pnpm format
```

**Expected**: All checks pass

#### Step 5: Commit and push to trigger CI

Create a commit and push to `dev` branch to test in CI:

```bash
git add apps/e2e/global-setup.ts
git commit -m "fix(e2e): set explicit cookie domain for Vercel preview URLs

Fixes cookies not being sent with requests in CI environment.
Previously used domain: undefined (browser default) which caused
Playwright's cookie API to not properly associate cookies with the
preview URL hostname.

This change makes Vercel preview behavior consistent with localhost
and custom domains, where explicit domain works correctly.

Addresses Issue #1494

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push origin dev
```

#### Step 6: Monitor CI workflow execution

Watch the CI workflow run and verify:

- Global setup completes successfully
- Team-accounts tests pass (currently fail)
- No regressions in other test suites
- Cookie debug logs show explicit domain instead of "(browser default)"

#### Step 7: Verify no regression of Issue #1096

If tests pass, check for signs of middleware cookie issues:

- Tests that navigate to protected pages should not redirect to sign-in
- Auth session should persist across page navigations
- No "unauthorized" or "session expired" errors in test logs

If #1096 symptoms appear, proceed to rollback plan (see Risk Assessment section)

## Testing Strategy

### Unit Tests

No unit tests required - this is a configuration change in test setup code.

### Integration Tests

The integration tests themselves are the validation:

- Team-accounts tests that currently fail should pass
- All other integration tests should continue to pass
- No new auth-related failures should appear

**Test files**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Primary validation (currently fails)
- `apps/e2e/tests/account/account-simple.spec.ts` - Regression check (currently passes)
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Regression check

### E2E Tests

All E2E tests serve as validation for this fix.

**Success Criteria**:
- Team-accounts tests pass in CI: 2 passed (currently: 2 failed)
- Overall test pass rate: 21/21 passed (currently: 19/21 passed)
- No increase in test failures or timeouts

### Manual Testing Checklist

Execute these manual tests in CI (via GitHub Actions):

- [ ] Push to `dev` branch to trigger `dev-integration-tests.yml`
- [ ] Verify global setup logs show explicit domain: `🍪 Cookie domain config: 2025slideheroes-***.vercel.app`
- [ ] Verify team-accounts tests pass: `2 passed` in test summary
- [ ] Verify no new test failures appear in workflow logs
- [ ] Check for auth redirects in test traces (should navigate to `/home`, NOT `/auth/sign-in`)
- [ ] Verify total test count: `21 passed` (currently shows `19 passed`)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Regression of Issue #1096**: Middleware may not read cookies properly with explicit domain
   - **Likelihood**: low-medium (the original issue was specific to cookie transmission, not reading)
   - **Impact**: high (would break all auth-dependent tests)
   - **Mitigation**:
     - Monitor test results carefully after deployment
     - Check for middleware-specific errors like "session not found" or redirect loops
     - If regression occurs, implement Option 2 (differential cookie strategy)
     - Document findings to inform future cookie configuration decisions

2. **Different behavior in other Vercel deployments**: Production or staging may behave differently
   - **Likelihood**: low (test environments use same Vercel infrastructure)
   - **Impact**: medium (would require production hotfix)
   - **Mitigation**:
     - Test in preview deployment first (dev branch)
     - Monitor production deployment for auth issues
     - Have rollback commit ready

3. **Browser-specific cookie behavior**: Different browsers may interpret explicit domain differently
   - **Likelihood**: low (Playwright uses Chromium consistently)
   - **Impact**: low (only affects E2E tests, not production)
   - **Mitigation**:
     - All E2E tests use Chromium (consistent behavior)
     - If browser differences appear, add browser-specific cookie logic

**Rollback Plan**:

If this fix causes issues in CI or production:

1. **Immediate rollback**:
   ```bash
   git revert <commit-hash>
   git push origin dev
   ```

2. **Investigation**:
   - Enable `DEBUG_E2E_AUTH=true` in CI workflow
   - Capture HAR files to analyze cookie transmission
   - Check Supabase middleware logs for cookie reading issues

3. **Alternative approach**:
   - Implement Option 2: differential cookie strategy
   - Update middleware to handle both domain configurations
   - Add cookie domain detection logic

**Monitoring** (post-deployment):
- Monitor `dev-integration-tests.yml` workflow for next 5 runs
- Watch for new auth-related test failures
- Check cookie debug logs in workflow output
- Alert on test pass rate drop below 95%

## Performance Impact

**Expected Impact**: none

No performance implications - this only affects cookie configuration during test setup, not runtime application behavior.

## Security Considerations

**Security Impact**: low

This change only affects E2E test environment, not production authentication.

**Security review needed**: no

**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Push to dev branch and check CI workflow
git push origin dev

# Wait for workflow to complete, then check logs
gh run list --repo slideheroes/2025slideheroes --workflow="dev-integration-tests.yml" --limit 1

# View failed test logs
gh run view <run-id> --repo slideheroes/2025slideheroes --log-failed | grep "team-accounts"
```

**Expected Result**: Team-accounts tests fail with "Error: page.waitForSelector: Timeout 20000ms exceeded"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Local E2E tests
pnpm --filter web-e2e test team-accounts.spec.ts

# Full E2E suite (local)
pnpm --filter web-e2e test

# Push to dev and verify CI
git push origin dev
gh run watch --repo slideheroes/2025slideheroes

# After CI completes, check results
gh run view --repo slideheroes/2025slideheroes --log | grep -E "(passed|failed)"
```

**Expected Result**:
- Local tests: `2 passed, 4 skipped`
- CI tests: `21 passed` (increase from 19)
- No timeout errors for team-accounts tests
- Cookie logs show: `🍪 Cookie domain config: 2025slideheroes-***.vercel.app`

### Regression Prevention

```bash
# Verify no other tests broke
pnpm --filter web-e2e test

# Check for auth-related errors in logs
gh run view --repo slideheroes/2025slideheroes --log | grep -E "(auth|redirect|sign-in)"

# Verify cookie configuration in logs
gh run view --repo slideheroes/2025slideheroes --log | grep "Cookie domain config"
```

**Expected Result**: No new failures, all auth flows work correctly, cookies use explicit domain

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This change only affects E2E test setup in CI, not production code.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained (only affects test environment)

## Success Criteria

The fix is complete when:
- [ ] Local validation commands pass (typecheck, lint, format)
- [ ] Local team-accounts tests pass: `2 passed, 4 skipped`
- [ ] Full local E2E suite passes with no regressions
- [ ] CI `dev-integration-tests.yml` workflow passes with 21/21 tests
- [ ] Team-accounts tests no longer timeout in CI
- [ ] Cookie logs show explicit domain for Vercel preview URLs
- [ ] No regression of Issue #1096 (no middleware cookie reading issues)
- [ ] Code review approved (if applicable)

## Notes

### Historical Context

This fix deliberately reverts part of Issue #1096's solution. The original issue (#1096) reported that explicit domain prevented cookies from being transmitted to server-side middleware. The fix was to remove explicit domain for Vercel previews.

However, the current diagnosis (#1494) shows the opposite problem - WITHOUT explicit domain, cookies aren't being sent with client requests at all. The tests never reach the middleware because they're redirected to sign-in at the first navigation.

**Key Difference**:
- **Issue #1096**: Cookies reached the client but middleware couldn't read them
- **Issue #1494**: Cookies don't reach the client in the first place

This suggests the root causes are different:
- #1096: Middleware cookie parsing issue
- #1494: Playwright cookie injection issue

The fix for #1494 (explicit domain) should not conflict with #1096's middleware reading because the cookies will now properly reach the browser first.

### Why Local Tests Work

Local tests use explicit `domain: localhost`, which is why they pass. This confirms that explicit domain works correctly with Playwright's cookie API. The failure only occurs when using `domain: undefined` with the `url` property fallback.

### Playwright Cookie API Behavior

Playwright's `addCookies()` API has two modes:
1. **domain + path**: Explicitly sets cookie for a specific domain
2. **url only**: Browser derives domain from URL (requires omitting path)

Mode 2 (current approach for Vercel previews) is less reliable because:
- The browser must infer the correct domain from the URL
- Playwright's internal logic may not handle dynamic Vercel URLs correctly
- The `url` property was added as a workaround, not the primary API

Mode 1 (proposed fix) is the recommended approach per Playwright docs.

### Related Issues for Reference

- **#1494** (current): Cookie domain mismatch in CI
- **#1492, #1493**: Auth session loss on retry (different issue, already fixed)
- **#1096**: Middleware cookie reception (may be related, monitor for regression)
- **#1051**: CI flakiness due to Vercel cold starts (general reliability)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1494*
