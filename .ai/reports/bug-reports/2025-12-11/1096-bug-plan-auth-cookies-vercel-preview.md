# Bug Fix: Integration Tests Auth Session Lost in Vercel Preview Deployments

**Related Diagnosis**: #1092 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Server-side Supabase middleware doesn't receive cookies set by Playwright due to explicit domain configuration and Vercel preview cookie handling limitations
- **Fix Approach**: Remove explicit domain attribute from cookie configuration, verify Supabase redirect URLs, and improve cookie debugging/tracing
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Integration tests on Vercel preview deployments fail because authenticated sessions set up by the Playwright global-setup are not recognized by the server-side Next.js middleware. The authentication succeeds (cookies are set), but when tests navigate to protected routes, the middleware redirects to the sign-in page. This indicates a cookie transmission issue between the browser (where cookies are stored) and the server-side middleware (which doesn't receive them in HTTP requests).

**Key Symptoms**:
1. Global setup authenticates successfully via Supabase API
2. Cookies are set in browser context with correct attributes
3. Navigation to protected routes triggers middleware redirect
4. Server middleware doesn't recognize the authenticated session
5. Cloudflare Turnstile blocks automated re-authentication attempts

For full details, see diagnosis issue #1092.

### Solution Approaches Considered

#### Option 1: Remove Explicit Domain Attribute ⭐ RECOMMENDED

**Description**: Modify the cookie configuration in `global-setup.ts` to omit the explicit domain attribute. When domain is not specified, browsers automatically default to the current host. This aligns with Vercel preview deployment cookie handling, which expects domain-less cookies.

**Pros**:
- Aligns with browser defaults and Vercel best practices (confirmed by research)
- Simpler configuration - fewer moving parts
- Compatible with both local development and Vercel preview deployments
- Playwright's `addCookies` accepts domain-less configuration
- Minimal code change (1-2 lines)

**Cons**:
- Requires testing to verify it works with Playwright cookie injection
- May need investigation if subdomain sharing is required

**Risk Assessment**: low - this aligns with platform best practices and recommended patterns

**Complexity**: simple - single configuration change

#### Option 2: Set SameSite=None with Secure=True

**Description**: Keep explicit domain but change `sameSite: 'lax'` to `sameSite: 'none'` with `secure: true`. This allows cookies to be sent with cross-site requests and in SSR contexts.

**Pros**:
- Explicitly addresses SameSite restrictions during SSR
- Keeps existing domain configuration
- Might work with Vercel's protection mechanisms

**Cons**:
- Less secure than Lax (SameSite=None reduces CSRF protection)
- Doesn't address root cause (domain mismatch)
- Requires `secure: true` which needs HTTPS
- Still may not solve the cookie transmission issue

**Why Not Chosen**: The research findings indicate explicit domain is the primary issue, not SameSite restrictions. This approach addresses symptoms rather than root cause.

#### Option 3: Use HAR Recording Only (No Fix)

**Description**: Enable HAR recording in CI to capture HTTP traffic and identify exactly where cookies are lost, then iterate based on findings.

**Pros**:
- Provides definitive evidence of what's happening
- Could reveal unexpected issues

**Cons**:
- Doesn't fix the problem immediately
- Requires another CI run after collecting data
- Delays resolution

**Why Not Chosen**: Combined with Option 1. HAR recording should be part of validation, not the primary fix.

### Selected Solution: Remove Explicit Domain Attribute + Enable HAR Recording

**Justification**:

The research from Context7 and Perplexity clearly indicates that explicit domain configuration is problematic in Vercel preview environments. Removing the domain attribute allows browsers to use their default behavior (current host), which is compatible with how Vercel preview deployments work. This is a low-risk, minimal-change fix that aligns with platform best practices.

Additionally, enabling HAR recording will provide visibility into the HTTP traffic, both to validate the fix and to serve as a debugging aid if issues persist.

**Technical Approach**:

1. **Cookie Configuration**: In `apps/e2e/global-setup.ts`, remove the explicit domain parameter from the cookie configuration
2. **HAR Recording**: Enable HAR logging in CI with `RECORD_HAR_LOGS=true` to capture HTTP traffic
3. **Supabase Configuration**: Verify redirect URLs include wildcard for preview deployments
4. **Debugging**: Add console logging to track cookie domain/attributes for visibility

**Architecture Changes**: None - purely configuration-based fix

**Migration Strategy**: No data migration needed; this is a configuration fix for test infrastructure

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Cookie configuration logic (remove explicit domain)
- `apps/e2e/playwright.config.ts` - Enable HAR recording configuration
- `.github/workflows/dev-integration-tests.yml` - Add HAR recording environment variable
- Supabase Dashboard - Verify redirect URLs configuration

### New Files

None required for this fix

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Investigate Current Cookie Configuration

Examine the current cookie setup to understand what's being set and how:

- Read `apps/e2e/global-setup.ts` and understand the cookie configuration
- Identify where explicit domain is being set
- Check what domain value is currently configured
- Document the current behavior

**Why this step first**: Need to understand current implementation before making changes

#### Step 2: Remove Explicit Domain Attribute

Modify the cookie configuration to remove the explicit domain:

- In `apps/e2e/global-setup.ts`, locate the cookie addition logic
- Remove or omit the `domain` parameter from the cookie attributes
- Keep all other attributes (name, value, path, sameSite, secure, etc.)
- Document the change with explanation

**Key Code Change**:
```typescript
// BEFORE
return {
  name: c.name,
  value: c.value,
  domain: domain,  // ← REMOVE THIS
  path: c.path || '/',
  sameSite: 'Lax',
  secure: true,
};

// AFTER
return {
  name: c.name,
  value: c.value,
  // domain removed - browser uses current host
  path: c.path || '/',
  sameSite: 'Lax',
  secure: true,
};
```

#### Step 3: Enable HAR Recording in Playwright Config

Configure Playwright to record HAR files for debugging:

- Open `apps/e2e/playwright.config.ts`
- Add HAR recording configuration to use options
- Set output directory for HAR files
- Make HAR recording conditional on environment variable

**Key Code Addition**:
```typescript
export default defineConfig({
  // ... existing config ...
  use: {
    // ... existing use options ...
    recordHar: {
      mode: 'minimal',
      omitContent: false,
    },
  },
  // OR (for conditional recording)
  webServer: [
    // ... existing webServer config ...
  ],
});
```

#### Step 4: Enable HAR Recording in CI Workflow

Add HAR recording to the CI workflow:

- Open `.github/workflows/dev-integration-tests.yml`
- Add `RECORD_HAR_LOGS: 'true'` environment variable
- Set up artifact upload for HAR files for debugging
- Add conditional step to upload HAR if tests fail

#### Step 5: Verify Supabase Redirect URLs

Ensure Supabase is configured to accept preview deployment URLs:

- Log into Supabase Dashboard
- Navigate to Authentication > Redirect URLs
- Verify the following patterns are included:
  - `https://*.vercel.app/*/*` (wildcard for all preview deployments)
  - `http://localhost:3000` (local development)
  - `http://localhost:3001` (local test server)
- Add missing patterns if needed

#### Step 6: Add Cookie Debugging Logging

Improve visibility into cookie handling:

- In `apps/e2e/global-setup.ts`, add console logging for cookie attributes
- Log the domain (or lack thereof) for each cookie
- Log SameSite and Secure attributes
- Log the verification of cookie storage
- This helps diagnose future issues

**Example Logging**:
```typescript
console.log(`🍪 Cookie: ${cookie.name}`);
console.log(`   Domain: ${domain || '(browser default)'}`);
console.log(`   SameSite: ${cookie.sameSite}`);
console.log(`   Secure: ${cookie.secure}`);
```

#### Step 7: Add/Update Tests for Cookie Handling

Create or update tests to verify cookie behavior:

- Add test for cookie presence after authentication
- Add test for cookie attributes (sameSite, secure, path)
- Add test for cookie transmission in requests
- Add regression test to ensure cookies persist across navigation

#### Step 8: Validation and Testing

Run tests to verify the fix:

- Run E2E tests locally first
- Run E2E tests against local Vercel simulation if possible
- Review HAR logs to verify cookies are being transmitted
- Verify tests pass without timeout/redirect loops
- Check browser console for any new errors

## Testing Strategy

### Unit Tests

None applicable - this is infrastructure configuration

### Integration Tests

Test cookie handling and authentication flow:

- ✅ Global setup authentication succeeds
- ✅ Cookies are stored with correct attributes
- ✅ Protected routes don't redirect when authenticated
- ✅ Middleware receives session in requests
- ✅ Edge case: Cookie domain-less configuration works on Vercel preview

**Test files**:
- `apps/e2e/global-setup.ts` - Already includes verification
- `apps/e2e/tests/auth.spec.ts` - Add auth persistence tests

### E2E Tests

Verify complete user authentication flows:

- ✅ User can authenticate via global setup
- ✅ User can navigate to protected routes without redirect
- ✅ User session persists across page navigations
- ✅ Tests complete without timeout waiting for sign-in

**Test files**:
- `apps/e2e/tests/auth.spec.ts` - Core auth flow
- `apps/e2e/tests/protected-routes.spec.ts` - Session persistence

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run E2E tests locally: `pnpm test:e2e`
- [ ] Tests should complete without redirect loops
- [ ] Check browser DevTools: Cookies should include auth cookies
- [ ] Verify HAR logs show cookies in request headers
- [ ] Test on Vercel preview deployment (if available)
- [ ] Verify no new errors in test console output
- [ ] Confirm test execution time is reasonable (no timeout retries)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Domain-less Cookies Don't Work**: In unlikely case that domain-less cookies don't work in Playwright
   - **Likelihood**: low (aligns with browser standards)
   - **Impact**: medium (tests would still fail)
   - **Mitigation**: Fall back to Option 2 (SameSite=None) or investigate cookie storage location in Playwright

2. **Subdomain Sharing Issues**: If tests need to access multiple subdomains
   - **Likelihood**: low (preview URLs are same host)
   - **Impact**: low (current implementation already has this limitation)
   - **Mitigation**: Add domain back with scoped value if needed

3. **Vercel Preview Specific Issue**: If the problem is unique to Vercel's edge runtime
   - **Likelihood**: low (research indicated this is a known limitation)
   - **Impact**: high (would require different approach)
   - **Mitigation**: HAR logs will reveal this; can then explore Vercel-specific solutions

**Rollback Plan**:

If this fix doesn't resolve the issue:

1. Revert cookie configuration changes to restore explicit domain
2. Review HAR logs to identify where cookies are being dropped
3. Escalate to Option 2 (SameSite=None approach)
4. Consider alternative authentication method for preview deployments (token-based?)
5. File issue with Vercel support if edge runtime has limitations

**Monitoring** (if needed):

- Monitor E2E test success rate in CI after deployment
- Track cookie-related test failures
- Alert if E2E tests fail on preview deployments

## Performance Impact

**Expected Impact**: none

This is a configuration change with no performance implications.

## Security Considerations

**Security Impact**: none - potentially improved

- Removing explicit domain doesn't reduce security (browser defaults are safe)
- SameSite=Lax already provides CSRF protection
- Cookies remain secure (HTTPS required in production)
- No changes to authentication flow or authorization

**Security Review**: Not needed - configuration change only

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run E2E tests on preview deployment
cd apps/e2e
pnpm test:e2e
```

**Expected Result**: Tests timeout waiting for authenticated routes, or redirect to sign-in

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Format
pnpm format

# E2E tests (should pass)
pnpm test:e2e

# Full test suite
pnpm test

# Build
pnpm build
```

**Expected Result**: All commands succeed, E2E tests complete without redirect loops, no timeout errors

### Regression Prevention

```bash
# Verify no other tests broke
pnpm test

# Check CI integration tests pass
cd .github/workflows
# Run dev-integration-tests.yml
```

## Dependencies

### New Dependencies

**No new dependencies required** - this fix uses existing Playwright configuration capabilities

## Database Changes

**No database changes required** - this is a test infrastructure fix

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained (no API changes)

## Success Criteria

The fix is complete when:

- [ ] `apps/e2e/global-setup.ts` updated to remove explicit domain
- [ ] `apps/e2e/playwright.config.ts` configured with HAR recording
- [ ] `.github/workflows/dev-integration-tests.yml` enables `RECORD_HAR_LOGS`
- [ ] Supabase Dashboard redirect URLs verified/updated
- [ ] Console logging added for cookie debugging
- [ ] E2E tests pass without redirect loops or timeouts
- [ ] HAR logs show cookies in HTTP request headers
- [ ] All validation commands pass
- [ ] Zero regressions in other test suites
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Key Insights from Research**:
- Explicit domain attribute conflicts with Vercel preview deployment cookie handling
- Browsers have sensible defaults for domain when not explicitly set
- SameSite=None warning on `_vercel_jwt` is expected behavior, not the cause
- HAR recording is essential for debugging cookie transmission issues

**Related Issues**:
- #1083 - Previous fix attempt (provided context)
- #1082, #1075, #1063, #1062 - Historical cookie issues (patterns identified)

**Documentation**:
- Auth troubleshooting: Session persistence section
- Playwright config: HAR recording options
- Vercel: Cookie handling in edge functions and serverless

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1092*
*Research integrated from context7-expert and perplexity-expert validation*
