# Bug Fix: Vercel Bypass Cookie Missing URL Property for Preview Deployments

**Related Diagnosis**: #1484
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The Vercel bypass cookie (`_vercel_jwt`) at lines 650-672 in `global-setup.ts` is missing the `url` property for Vercel preview deployments, violating Playwright's `addCookies()` API requirements
- **Fix Approach**: Add `url: baseURL` to the `vercelCookie` object when `isVercelPreview` is true, using the proven pattern from #1102
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E global setup fails for Vercel preview deployments with `browserContext.addCookies: Cookie should have a url or a domain/path pair` when setting the `_vercel_jwt` bypass cookie. The fix for #1102 addressed Supabase cookies but missed the Vercel bypass cookie code path at lines 650-672.

For full details, see diagnosis issue #1484.

### Solution Approaches Considered

#### Option 1: Add url property when isVercelPreview is true ⭐ RECOMMENDED

**Description**: Conditionally add `url: baseURL` to the `vercelCookie` object when `isVercelPreview` is true, before calling `context.addCookies()`. This mirrors the proven fix from #1102 that was applied to Supabase cookies at lines 826-827.

**Pros**:
- Minimal, surgical change - only affects the specific code path that's broken
- Uses proven pattern from #1102 that's already working for Supabase cookies
- Zero risk to non-Vercel-preview deployments (localhost, custom domains)
- Satisfies Playwright's API requirement: cookie must have `url` OR `domain+path`
- Browser automatically uses correct domain when `url` is set
- No impact on existing Vercel preview fix for auth cookies (#1096)

**Cons**:
- Requires conditional logic (though very simple)
- Slightly different approach than the spread syntax used elsewhere

**Risk Assessment**: low - This is the exact same pattern that was successfully applied to Supabase cookies. The fix has been proven in production for weeks.

**Complexity**: simple - Single conditional check, 2-3 lines of code

#### Option 2: Restructure cookie construction to use spread syntax consistently

**Description**: Refactor the cookie construction to use the same spread syntax pattern that Supabase cookies use (lines 818-827), where the base cookie is constructed and then conditionally enhanced with domain or url.

**Pros**:
- More consistent with the Supabase cookie code style
- Slightly more maintainable long-term

**Cons**:
- Larger refactor, more lines changed
- Introduces more risk for a simple fix
- Not necessary to solve the immediate problem

**Why Not Chosen**: While this would be slightly cleaner, it's over-engineering for a simple bug fix. The minimal approach (Option 1) is safer and faster.

#### Option 3: Always set domain to localhost for Vercel preview

**Description**: For Vercel preview deployments, set domain to a default value like "localhost" instead of leaving it undefined.

**Why Not Chosen**: This would violate the fix for #1096 which specifically requires domain-less cookies for Vercel preview deployments. Setting an explicit domain would re-introduce the auth session loss bug.

### Selected Solution: Add url property when isVercelPreview is true

**Justification**: This is the minimal, proven fix that mirrors the solution already successfully deployed for Supabase cookies. It's surgical, low-risk, and addresses the root cause directly without over-engineering or risking regressions.

**Technical Approach**:
1. After constructing the `vercelCookie` object (lines 650-670)
2. Before calling `context.addCookies([vercelCookie])` (line 672)
3. Add conditional logic to enhance the cookie with `url: baseURL` when `isVercelPreview` is true
4. Use the proven pattern: `context.addCookies([{ ...vercelCookie, url: baseURL }])`

**Architecture Changes**: None - This is a localized fix in the cookie handling code with no architectural implications.

**Migration Strategy**: Not needed - This is a bug fix with no data or configuration migration requirements.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` (line 672) - Add conditional url property to Vercel bypass cookie

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Update Vercel bypass cookie to include url property for preview deployments

**What this accomplishes**: Satisfies Playwright's `addCookies()` API requirement by providing either `url` OR `domain+path` for all deployment types.

- Locate line 672 where `context.addCookies([vercelCookie])` is called
- Replace with conditional logic:
  ```typescript
  // For Vercel preview deployments, use url property instead of domain
  // to satisfy Playwright's cookie API validation requirements
  // Playwright requires: cookie must have url OR (domain AND path)
  if (isVercelPreview) {
      await context.addCookies([{ ...vercelCookie, url: baseURL }]);
  } else {
      await context.addCookies([vercelCookie]);
  }
  ```
- Ensure `isVercelPreview` and `baseURL` are in scope (already defined at lines 645 and 621)
- Add comment referencing this fix and #1102 for future maintainers

**Why this step first**: This is the only code change needed - it's the complete fix.

#### Step 2: Verify the fix locally

**What this accomplishes**: Ensures the fix works for both localhost and Vercel preview scenarios before pushing to CI.

- Test with `BASE_URL=http://localhost:3000` (should use domain)
- Test with `BASE_URL=https://test-preview.vercel.app` (should use url)
- Verify no errors in global setup
- Check that cookies are set correctly in both scenarios

#### Step 3: Add validation commands

**What this accomplishes**: Ensures the fix passes all quality checks and doesn't introduce regressions.

- Run `pnpm typecheck` to verify TypeScript correctness
- Run `pnpm lint` to verify code style
- Run `pnpm format` to verify formatting
- Run E2E tests locally if possible (may require full setup)

#### Step 4: Update inline documentation

**What this accomplishes**: Documents the fix for future maintainers and references related issues.

- Add comment above the conditional explaining the fix
- Reference issues #1484, #1102, #1101, #1096 in the comment
- Explain why both code paths are needed (domain vs url)

#### Step 5: Validation in CI

**What this accomplishes**: Confirms the fix works in the actual CI environment.

- Push to dev branch
- Wait for Deploy to Dev workflow to complete
- Monitor Dev Integration Tests workflow
- Verify global setup succeeds
- Verify integration tests pass

## Testing Strategy

### Unit Tests

No unit tests needed - this is E2E test infrastructure code that's tested by running E2E tests themselves.

### Integration Tests

The integration tests themselves serve as the test for this fix:
- ✅ Global setup should complete without errors
- ✅ Vercel bypass cookie should be set correctly
- ✅ Integration tests should run successfully against Vercel preview deployments

### E2E Tests

The E2E global setup is the primary validation:
- ✅ Local tests (localhost): Should use domain property
- ✅ Vercel preview tests: Should use url property
- ✅ No Playwright validation errors
- ✅ Cookies transmitted correctly to server

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Review the code change for correctness
- [ ] Verify `isVercelPreview` and `baseURL` are in scope at line 672
- [ ] Run `pnpm typecheck` locally
- [ ] Run `pnpm lint` locally
- [ ] Run `pnpm format` locally
- [ ] Push to dev branch and monitor CI
- [ ] Verify Deploy to Dev workflow succeeds
- [ ] Verify Dev Integration Tests workflow completes without cookie errors
- [ ] Check workflow logs for "Cookie should have a url or a domain/path pair" error (should not appear)
- [ ] Verify integration tests pass

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect conditional logic**: Using wrong variable or condition
   - **Likelihood**: low (variables are already defined and used correctly elsewhere)
   - **Impact**: low (would fail fast in CI)
   - **Mitigation**: Code review, verify variables are in scope, test locally

2. **Cookie transmission issues**: Cookie might not be transmitted correctly with url property
   - **Likelihood**: low (proven pattern from #1102, working for weeks)
   - **Impact**: medium (integration tests would fail)
   - **Mitigation**: Monitor CI carefully, ready to revert if needed

3. **Scope issues**: Variables not accessible at line 672
   - **Likelihood**: very low (variables defined earlier in same function)
   - **Impact**: low (TypeScript would catch at compile time)
   - **Mitigation**: Run typecheck before committing

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit: `git revert <commit-hash>`
2. Push to dev: `git push origin dev`
3. CI will automatically redeploy previous version
4. Re-investigate the issue with additional logging

**Monitoring**:
- Monitor first 3 Dev Integration Tests workflow runs after deployment
- Watch for any new cookie-related errors in logs
- Verify integration test pass rate remains stable

## Performance Impact

**Expected Impact**: none

The fix adds a trivial conditional check and object spread operation, which has negligible performance impact. Cookie setting is not a performance-critical path.

## Security Considerations

**Security Impact**: none

This fix maintains the exact same security model:
- Vercel bypass cookie remains httpOnly and secure
- Cookie domain/url handling is unchanged from #1102 fix
- No new attack vectors introduced
- No sensitive data exposed

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Push code without fix to trigger CI
git push origin dev

# Monitor workflow
gh run list --repo MLorneSmith/2025slideheroes --branch dev --limit 1

# Check for error in logs
gh run view <run-id> --repo MLorneSmith/2025slideheroes --log-failed | grep "Cookie should have a url"
```

**Expected Result**: Integration tests fail with "browserContext.addCookies: Cookie should have a url or a domain/path pair" error

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Push fix to trigger CI
git add apps/e2e/global-setup.ts
git commit -m "fix(e2e): add url property to Vercel bypass cookie for preview deployments"
git push origin dev

# Monitor workflow
gh run list --repo MLorneSmith/2025slideheroes --branch dev --limit 1

# Verify success
gh run view <run-id> --repo MLorneSmith/2025slideheroes
```

**Expected Result**: All commands succeed, integration tests pass, no cookie errors in logs

### Regression Prevention

```bash
# Verify no related errors
gh run view <run-id> --repo MLorneSmith/2025slideheroes --log | grep -i "cookie\|addCookies\|domain" || echo "No cookie errors"

# Verify integration tests passed
gh run view <run-id> --repo MLorneSmith/2025slideheroes --json conclusion --jq '.conclusion'
```

## Dependencies

**No new dependencies required** - This is a pure code fix using existing APIs.

## Database Changes

**No database changes required** - This is an E2E test infrastructure fix with no database impact.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - Standard git push triggers CI/CD automatically

**Feature flags needed**: no

**Backwards compatibility**: Fully maintained - No breaking changes, only fixing broken code path

## Success Criteria

The fix is complete when:
- [ ] Code change implemented at line 672
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Changes committed with clear message
- [ ] Pushed to dev branch
- [ ] Deploy to Dev workflow succeeds
- [ ] Dev Integration Tests workflow succeeds without cookie errors
- [ ] Integration tests pass
- [ ] No regressions in other tests
- [ ] Issue #1484 closed

## Notes

**Pattern Proven**: This fix uses the exact pattern that was successfully applied to Supabase cookies in #1102 (commit `9cdafcdc8`). The pattern has been working in production for over a month without issues.

**Why Two Code Paths**:
- Localhost/custom domains: Use `domain` property (explicit domain control)
- Vercel preview: Use `url` property (browser determines domain from URL)

**Related Fixes**:
- #1102 - Original fix for Supabase cookies (same pattern)
- #1096 - Introduced domain-less cookies for Vercel preview
- #1109 - Follow-up fix ensuring localhost always uses domain

**Consolidation Opportunity**: In the future, consider consolidating all cookie construction logic into a shared helper function to prevent similar partial fixes. However, this is out of scope for this bug fix.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1484*
