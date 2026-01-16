# Bug Fix: Dev Integration Tests Fail Due to Pre-Authenticated Cookie Rejection

**Related Diagnosis**: #1502
**Severity**: high
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Supabase SSR middleware rejects or doesn't recognize Playwright-injected cookies, even when domain and attributes match exactly. Fresh login via UI works, but programmatically added cookies fail validation.
- **Fix Approach**: Add middleware debug logging to identify exact validation failure point, then either adjust cookie encoding/format or implement token refresh fallback
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests CI workflow consistently fails because Playwright-stored authentication cookies are not being recognized by the Supabase SSR middleware. This differs from fresh login via the UI, which works correctly. The issue manifests as:

- Cookies ARE being added to browser context (Playwright confirms `addCookies succeeded`)
- Server immediately redirects to sign-in (middleware doesn't see valid session)
- Domain matches between cookie and request URL
- Fresh login through UI works correctly

Key difference:
- **Fresh login**: Server sets cookies via `Set-Cookie` header with exact attributes
- **Playwright injection**: Cookies programmatically added to browser's cookie store

For full context, see diagnosis #1502.

### Solution Approaches Considered

#### Option 1: Add Middleware Debug Logging ⭐ RECOMMENDED

**Description**: Instrument the Supabase SSR middleware to log exactly which validation step is failing (token decoding, JWT validation, issuer claim, refresh attempt, etc.). This reveals the precise failure point and guides the fix.

**Pros**:
- Reveals exact validation failure point
- Low complexity - just logging
- Provides evidence-based fix path
- Can be added without changing middleware logic
- HAR file analysis becomes actionable with proper logging

**Cons**:
- Requires another CI run to collect logs
- Might miss subtle timing issues

**Risk Assessment**: low - logging-only changes
**Complexity**: simple

#### Option 2: Re-Authenticate in beforeEach ⭐ FALLBACK

**Description**: Remove pre-authenticated storage state approach entirely. Instead, re-authenticate fresh on each test's `beforeEach` hook using the UI login flow. This guarantees valid cookies from the server.

**Pros**:
- Guarantees working cookies (server-set)
- No middleware changes needed
- Proven working pattern from fresh login

**Cons**:
- Slower tests (login on each test adds overhead)
- More brittle (depends on UI login flow)
- Less efficient than storage state
- Hides the underlying cookie validation bug

**Risk Assessment**: low - just changes test setup
**Complexity**: simple
**Why Not Chosen Yet**: Doesn't address root cause; better as fallback if debug logging approach fails

#### Option 3: Adjust Cookie Encoding in Global Setup

**Description**: Compare HAR captures from fresh login vs storage state. Adjust cookie encoding, chunking, or format to match exactly what the server expects.

**Pros**:
- Fixes root cause directly
- Faster than re-authentication
- Keeps storage state pattern

**Cons**:
- Requires understanding exact cookie format differences
- May be fragile if server-side format changes
- Harder to diagnose without detailed logging

**Risk Assessment**: medium - requires exact knowledge of server expectations
**Complexity**: moderate

### Selected Solution: Staged Approach

**Phase 1 - Investigation** (Low Risk):
1. Add comprehensive middleware logging
2. Analyze HAR files from CI with new logging
3. Determine exact validation failure point

**Phase 2 - Fix** (Based on Phase 1):
- If issue is simple (e.g., missing encoding step): Apply targeted fix to global-setup.ts
- If issue is complex: Fall back to re-authentication approach as interim solution
- If issue is server-side (e.g., issuer mismatch): Create separate infrastructure issue

**Justification**: This approach is conservative yet evidence-based. We gather data before making changes, preventing wasted effort on incorrect fixes. The staged approach allows stopping at Phase 1 investigation if the issue is determined to be infrastructure/environment rather than code.

**Technical Approach**:
- Add `console.debug()` statements to middleware to log each validation step
- Configure GitHub Actions to capture and display logs from failed tests
- Use HAR file analysis to compare fresh login vs storage state cookies
- Document findings in comments within global-setup.ts for future debugging

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Where Playwright storage state cookies are created
- `apps/web/src/middleware.ts` - Supabase SSR middleware (add logging only)
- `.github/workflows/dev-integration-tests.yml` - CI workflow (enable artifact capture)

### New Files

None required for Phase 1 investigation.

### Step-by-Step Tasks

#### Step 1: Add Middleware Debug Logging

Modify the Supabase SSR middleware to log validation steps without breaking functionality.

- Add `console.debug()` statements for:
  - Cookies received by middleware
  - Raw cookie values
  - Token decoding process
  - JWT claim validation (iss, exp, aud)
  - Token refresh attempt (if triggered)
  - Final authentication result
- Use structured logging format for easy parsing
- Ensure logs appear in CI output without cluttering

**Why this step first**: Provides concrete evidence of failure point before making changes

#### Step 2: Enable CI Artifact Capture

Configure GitHub Actions to capture logs and HAR files for failed test runs.

- Add GitHub Actions step to save server logs
- Configure Playwright to generate HAR files (already enabled)
- Upload artifacts for inspection

**Why this step**: Makes logs accessible without re-running tests

#### Step 3: Analyze Investigation Results

After next CI run with logging enabled:

- Download logs and HAR files
- Compare fresh login cookies vs storage state cookies
- Document exact differences
- Determine if fix is code-based or infrastructure-based

#### Step 4: Implement Fix (Based on Investigation)

- **If issue found in cookie encoding**: Adjust global-setup.ts cookie creation logic
- **If issue found in middleware**: Fix validation logic in middleware.ts
- **If issue is infrastructure**: Document in GitHub issue for separate action

#### Step 5: Add Tests

Add E2E test to verify storage state authentication works correctly.

- Test pre-authenticated storage state cookies work
- Test fresh login still works
- Test cookie refresh flow
- Add regression test for this specific issue

#### Step 6: Validation

- Run full test suite locally
- Run dev-integration-tests CI workflow
- Verify zero regressions
- Confirm storage state tests pass

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Cookie creation in global-setup.ts
- ✅ Cookie format validation
- ✅ Storage state serialization/deserialization
- ✅ Regression test: Storage state auth flow

**Test files**:
- `apps/e2e/tests/setup/global-setup.spec.ts` - Cookie creation and validation

### E2E Tests

- ✅ Pre-authenticated storage state tests (team-accounts, account-simple)
- ✅ Verify team selector loads without redirect
- ✅ Verify protected route access with storage state

**Test files**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Already exists, should pass after fix
- `apps/e2e/tests/account/account-simple.spec.ts` - Already exists, should pass after fix

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run dev-integration-tests locally: `pnpm --filter e2e test:team-accounts`
- [ ] Verify storage state is properly saved
- [ ] Run fresh test run to confirm storage state is used
- [ ] Verify team-selector element loads (not redirect to sign-in)
- [ ] Test in CI environment by pushing to dev branch
- [ ] Verify CI workflow passes
- [ ] Check server logs for no new errors

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Logging adds performance overhead**:
   - **Likelihood**: medium
   - **Impact**: low (only affects tests)
   - **Mitigation**: Use debug-level logging (off in production)

2. **Fix could break fresh login flow**:
   - **Likelihood**: low
   - **Impact**: critical
   - **Mitigation**: Thoroughly test fresh login after changes

3. **Investigation reveals infrastructure issue**:
   - **Likelihood**: medium
   - **Impact**: medium (blocks fix in code)
   - **Mitigation**: Document and create separate infrastructure issue

4. **Cookie format differences between environments**:
   - **Likelihood**: medium
   - **Impact**: medium
   - **Mitigation**: Test in CI environment, not just locally

**Rollback Plan**:

If this fix causes regressions in CI/production:
1. Revert middleware logging changes
2. Revert global-setup.ts changes
3. Fall back to re-authentication approach (temporary)
4. Create new issue for deeper investigation
5. Close current issue with findings

**Monitoring** (if needed):
- Monitor dev-integration-tests CI workflow for pass rate
- Alert on any test timeouts or auth failures
- Track cookie-related errors in logs

## Performance Impact

**Expected Impact**: minimal

The debug logging will have negligible impact on test performance. The investigation phase may require an extra CI run.

**Performance Testing**:
- Verify no new test timeout issues
- Confirm test duration unchanged
- Check for any memory leaks from logging

## Security Considerations

**Security Impact**: none

The logging approach doesn't change authentication logic or expose sensitive data. We're only logging cookie presence and validation results, not cookie values themselves.

- **Logging**: Avoid logging full cookie values; only log presence/format
- **JWT Claims**: OK to log (not sensitive, used for validation)
- **Sensitive Data**: Never log auth tokens, refresh tokens, or passwords

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to project root
cd /home/msmith/projects/2025slideheroes

# Run failing tests locally
pnpm --filter e2e test:team-accounts

# Expected Result: Tests timeout waiting for team-selector element
# (redirects to /auth/sign-in instead of loading dashboard)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# E2E tests - team accounts
pnpm --filter e2e test:team-accounts

# E2E tests - account simple
pnpm --filter e2e test:account

# Build
pnpm build

# CI simulation - dev integration tests
pnpm --filter e2e test:dev-integration

# Manual verification
# 1. Verify storage state file is created
ls -la apps/e2e/.auth/authenticated.json

# 2. Run tests with existing storage state
pnpm --filter e2e test:team-accounts

# 3. Check for any new errors in logs
grep -i "error\|fail" logs/*.log
```

**Expected Result**: All tests pass, no auth-related timeouts, storage state properly reused across test runs.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run E2E tests specifically
pnpm --filter e2e test

# Verify CI passes by pushing to dev branch
git push origin dev
# Wait for dev-integration-tests workflow to complete
```

## Dependencies

### New Dependencies

**No new dependencies required**

The fix uses existing Playwright and Supabase tools only.

## Database Changes

**Database changes**: no

This fix doesn't require any database schema changes or migrations.

## Deployment Considerations

**Deployment Risk**: low

This fix is E2E testing only. It doesn't change application code or database.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

The changes are backward compatible. Existing storage state auth will continue to work (or will be fixed by this implementation).

## Success Criteria

The fix is complete when:
- [ ] Middleware debug logging is added and working
- [ ] Investigation logs reveal exact failure point
- [ ] Fix is implemented based on investigation findings
- [ ] Team-accounts tests pass in CI
- [ ] Account-simple tests pass in CI
- [ ] No new auth-related timeouts
- [ ] Fresh login flow still works (manual test)
- [ ] Storage state is properly saved and reused
- [ ] All type checks pass
- [ ] All linting passes
- [ ] Zero regressions detected

## Notes

### Investigation Hypothesis

Based on diagnosis findings and Context7 research, the most likely failure points are (in order):

1. **JWT Signature Validation**: Server-side JWT validation failing on Playwright-injected token
2. **Issuer Claim Mismatch**: JWT `iss` claim not matching server expectations
3. **Token Refresh Failure**: Middleware attempting automatic refresh with invalid refresh token
4. **Clock Skew**: Time difference between client and server affecting token expiry validation

### Related Diagnosis Comments

The diagnosis includes valuable Context7 research findings about Supabase SSR cookie handling:
- Cookie is ~3KB (no chunking issues)
- httpOnly is false (correct)
- SameSite is Lax (correct)
- Domain is explicitly set to Vercel preview hostname

These confirm the cookie format is likely correct. The failure is probably in server-side validation.

### Previous Fix Attempts

- Commit `54ee273dc`: Added explicit cookie domain for Vercel preview URLs - **Did not resolve issue**
- Commit `4ee273dc`: Similar fix in previous attempt - **Also did not resolve issue**

Both previous fixes targeted cookie domain configuration. This suggests the issue is deeper (JWT validation or token refresh) rather than cookie domain.

### For Implementer

When debugging:
1. Start by reviewing middleware.ts carefully
2. Add logging at each JWT validation step
3. Compare HAR files from:
   - Fresh login success (baseline)
   - Storage state failure (comparison)
4. Decode and inspect JWT claims programmatically
5. Don't assume Playwright's `addCookies` is working correctly - verify in browser

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1502*
