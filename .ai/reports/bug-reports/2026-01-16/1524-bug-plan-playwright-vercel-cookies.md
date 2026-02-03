# Bug Fix: Playwright Cookies Not Recognized in Vercel Preview Deployments

**Related Diagnosis**: #1523 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Playwright cookies created with `url` property instead of explicit `domain` + `path` for Vercel preview deployments
- **Fix Approach**: Change global-setup.ts to use `domain` property instead of `url` for Vercel preview deployments
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

In CI, dev integration tests fail with authentication redirects to `/auth/sign-in` despite:
- Global setup completing successfully
- Cookies being created with correct names
- Tests passing locally
- URL validation from #1518 being properly implemented

The root cause is that Playwright's `url` property for cookies is unreliable for Vercel preview deployments with dynamic hostnames. Using explicit `domain` and `path` properties, along with `SameSite=None` for cross-site compatibility, fixes the issue.

For full details, see diagnosis issue #1523.

### Solution Approaches Considered

#### Option 1: Use explicit `domain` and `path` instead of `url` property ⭐ RECOMMENDED

**Description**: Modify the Vercel preview cookie creation in `global-setup.ts` to extract the domain from the URL and use explicit `domain`, `path`, and `SameSite=None` properties instead of relying on the `url` property.

**Pros**:
- Follows Playwright best practices for deployed environments
- Vercel documentation explicitly recommends this approach
- Solves the known incompatibility between Playwright `url` property and dynamic Vercel hostnames
- Minimal code change (7-10 lines)
- No impact on local/Docker tests which already use `domain` property
- `SameSite=None` required for cross-site compatibility in preview deployments

**Cons**:
- Requires understanding of cookie domain/path mechanics
- Need to ensure `secure: true` is set (required for `SameSite=None`)

**Risk Assessment**: low - Simple cookie property change with clear Playwright precedent

**Complexity**: simple - Extract domain from URL, update 3-4 cookie properties

#### Option 2: Set Vercel bypass headers differently

**Description**: Modify how bypass headers are set or retry cookie authentication if initial attempt fails.

**Why Not Chosen**: The bypass headers (`x-vercel-protection-bypass`, `x-vercel-set-bypass-cookie`) are already correct. The issue is with cookie transmission, not header configuration.

#### Option 3: Use Playwright storage state instead of manual addCookies

**Description**: Save and restore Playwright storage state instead of manually managing cookies.

**Why Not Chosen**: This would require refactoring the entire auth setup pattern. The root cause is specifically the `url` property approach, which is a simpler fix.

### Selected Solution: Use explicit `domain` and `path` for Vercel preview cookies

**Justification**: The Playwright documentation and research findings independently confirm that the `url` property is unreliable for deployed environments, particularly with dynamic Vercel hostnames. Using explicit `domain` and `path` properties is the documented best practice and addresses the root cause directly.

**Technical Approach**:
- Extract hostname from baseURL using `new URL(baseURL).hostname`
- Set `domain` property to extracted hostname
- Set `path: '/'` for root-level cookie access
- Set `secure: true` (required for HTTPS Vercel deployments)
- Set `sameSite: 'None'` (required for cross-site cookie compatibility)
- Keep all other cookie properties unchanged

**Architecture Changes** (if any):
- None - this is a localized fix to global-setup.ts cookie creation logic
- No impact on existing local/Docker test behavior

**Migration Strategy** (if needed):
- None - This is a code fix with no data migration requirements
- Cookie changes take effect immediately in next CI run

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/global-setup.ts` - Change cookie creation for Vercel preview deployments (lines 979-990)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Read and understand the current cookie implementation

<describe what this step accomplishes>

Understand how cookies are currently created in `global-setup.ts` for different deployment types (local, Docker, Vercel preview).

- Read lines 979-990 of `apps/e2e/global-setup.ts`
- Understand the cookieConfig conditions
- Note the current `url` property approach for Vercel preview
- Identify the baseURL variable and how it's used

**Why this step first**: Need to understand the current code structure to make a surgical fix

#### Step 2: Implement the cookie property change

Modify the Vercel preview cookie creation to use explicit domain and path properties.

- In the `cookieConfig.isVercelPreview` block (lines 983-990)
- Extract hostname: `const domain = new URL(baseURL).hostname;`
- Change from `url: baseURL` to `domain: domain`
- Add `path: '/'` property
- Ensure `secure: true` is set
- Ensure `sameSite: 'None'` is set
- Keep `httpOnly`, `expires` unchanged

#### Step 3: Verify local and Docker tests are unaffected

Ensure the fix doesn't break existing test behavior for non-Vercel deployments.

- Review the `if (!cookieConfig.isVercelPreview)` block
- Confirm local/Docker cookie creation remains unchanged
- Note that local/Docker already use `domain` property (no regression)

#### Step 4: Add regression test

Create a simple test to verify cookie behavior for different deployment types.

- Add test in `apps/e2e/tests/auth/` for cookie verification
- Test that Vercel preview cookies use `domain` instead of `url`
- Test that local/Docker cookies are unchanged
- Verify cookie name matches expected format

#### Step 5: Run validation commands

Execute all validation to confirm fix works in CI.

- Run typecheck to ensure no syntax errors
- Run lint to check code quality
- Build test server to ensure no runtime issues
- Run the failing E2E tests to verify fix resolves the issue

## Testing Strategy

### Unit Tests

Not applicable - this is a test infrastructure fix, not application code.

### Integration Tests

Test the global setup and cookie configuration:
- ✅ Vercel preview cookies use `domain` property
- ✅ Vercel preview cookies have correct domain extracted from URL
- ✅ Vercel preview cookies have `sameSite: 'None'`
- ✅ Vercel preview cookies have `secure: true`
- ✅ Local/Docker cookies are unchanged
- ✅ Cookie name matches expected format

**Test files**:
- `apps/e2e/tests/auth/cookie-verification.spec.ts` - Verify cookie properties

### E2E Tests

The existing E2E tests that were failing should now pass:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts:112` - user can update their team name
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts:129` - cannot create Team account using reserved names

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run tests locally with `pnpm test:e2e` - should pass
- [ ] Check CI run in GitHub Actions for dev-integration-tests.yml
- [ ] Verify cookies are set with correct properties in browser devtools
- [ ] Check middleware logs to confirm cookies are recognized
- [ ] Verify no authentication errors on redirect to `/home`
- [ ] Confirm team-accounts tests pass without timeout

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Cookie domain mismatch**: If domain extraction fails or hostname includes port
   - **Likelihood**: low (URL parsing is standard)
   - **Impact**: low (fallback to existing behavior if needed)
   - **Mitigation**: Add validation that domain is extracted correctly before setting cookies

2. **SameSite=None incompatibility**: Older browsers may not support this value
   - **Likelihood**: low (test environment controlled)
   - **Impact**: low (only affects CI environment)
   - **Mitigation**: Not needed - CI uses modern Chrome

3. **HTTPS requirement**: SameSite=None requires secure flag
   - **Likelihood**: none (Vercel always HTTPS)
   - **Impact**: none (already set to true)
   - **Mitigation**: Ensure secure: true is always set

**Rollback Plan**:

If this fix causes issues:
1. Revert the changes to `apps/e2e/global-setup.ts` lines 979-990
2. Return to using `url` property for Vercel preview cookies
3. Re-run tests to confirm reversion worked
4. Open new issue for alternative approach

**Monitoring** (if needed):
- Monitor CI integration test runs for next 5-10 runs
- Watch for any cookie-related auth failures
- Check test timing to ensure no performance regression

## Performance Impact

**Expected Impact**: minimal

No performance impact expected - this is a cookie configuration change with no algorithmic changes.

## Security Considerations

**Security Impact**: low

The change maintains the same security posture:
- `httpOnly: true` prevents JavaScript access (unchanged)
- `secure: true` requires HTTPS transmission (unchanged)
- `sameSite: 'None'` is required for cross-site cookie use (NEW - improves security for cross-site scenarios)

Security review needed: no - This improves security by explicitly setting `sameSite: 'None'` instead of relying on browser defaults.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing E2E tests
pnpm test:e2e tests/team-accounts/team-accounts.spec.ts
```

**Expected Result**: Tests fail with timeout waiting for `team-selector` element or redirect to `/auth/sign-in` on protected route navigation.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit

# E2E tests - the ones that were failing
pnpm test:e2e tests/team-accounts/team-accounts.spec.ts

# Full E2E suite
pnpm test:e2e

# Build
pnpm build
```

**Expected Result**: All commands succeed, failing tests now pass, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify CI workflow passes
gh run view -R slideheroes/2025slideheroes <run-id> --log
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

**No new dependencies required**

## Database Changes

**Migration needed**: no

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - This only affects test infrastructure, not production code

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces in CI
- [ ] Team accounts tests pass without timeout
- [ ] All existing tests pass (zero regressions)
- [ ] Cookie verification test added and passing
- [ ] Code review approved (if applicable)

## Notes

This is a targeted fix for a known Playwright incompatibility with Vercel preview deployments. The research findings from the diagnosis issue (#1523) identified this specific pattern as the solution. The fix is minimal, low-risk, and aligns with Playwright best practices for deployed environments.

Research sources from diagnosis:
- Playwright GitHub issue microsoft/playwright#15481 - Storage state domain mismatch issues
- Vercel documentation - Cookie domain handling in preview deployments
- Community reports - Playwright cookie failures with dynamic Vercel hostnames

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1523*
