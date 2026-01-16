# Bug Fix: E2E Password Update Test Fails - Supabase URL Mismatch

**Related Diagnosis**: #1142
**Severity**: High
**Bug Type**: Integration
**Risk Level**: Medium
**Complexity**: Moderate

## Quick Reference

- **Root Cause**: JWT issuer URL mismatch between global-setup (127.0.0.1) and Docker container environment (host.docker.internal)
- **Fix Approach**: Normalize authentication to use host.docker.internal throughout the test setup pipeline
- **Estimated Effort**: Medium
- **Breaking Changes**: No

## Solution Design

### Problem Recap

The E2E test "user can update their password" in shard 3 (Personal Accounts) consistently times out waiting for a PUT request to `auth/v1/user` that never occurs. The root cause is a **Supabase URL mismatch**:

- **Global setup** authenticates against `http://127.0.0.1:54521` and creates JWT tokens with `iss: http://127.0.0.1:54521/auth/v1`
- **Docker containers** receive `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521`
- When the browser Supabase client tries to retrieve the session, JWT validation fails due to issuer URL mismatch
- `getSession()` returns null → SDK doesn't make auth requests → test times out waiting for PUT request

**Evidence from diagnosis**:
```javascript
// Session exists in localStorage with wrong issuer
{
  "sessionData": null,  // getSession() returns null despite data existing
  "userError": "Auth session missing!",
  "factorsResult": { "error": { "name": "AuthSessionMissingError" } }
}

// JWT issuer vs client URL
JWT iss: http://127.0.0.1:54521/auth/v1
Client:  http://host.docker.internal:54521
```

For full details, see diagnosis issue #1142.

### Solution Approaches Considered

#### Option 1: Update global-setup to use host.docker.internal ⭐ RECOMMENDED

**Description**: Modify `apps/e2e/global-setup.ts` to authenticate using `host.docker.internal:54521` instead of `127.0.0.1:54521`. This ensures the JWT tokens created during setup have the correct issuer URL that matches what the browser client expects.

**Pros**:
- ✅ Minimal code change (single URL in global-setup)
- ✅ Aligns with Docker architecture (host.docker.internal is the DNS name for the host from within containers)
- ✅ No environment variable changes needed in docker-compose.test.yml
- ✅ Maintains isolation between dev (127.0.0.1) and test (host.docker.internal)
- ✅ Low risk - only affects test setup, not development flow
- ✅ Consistent with Docker networking best practices

**Cons**:
- Global setup runs on the host system, but uses DNS name intended for containers
- Requires testing that 127.0.0.1 isn't the required issuer for some edge case

**Risk Assessment**: Low - This is a standard Docker networking pattern. The Supabase API at 54521 accepts connections from both 127.0.0.1 and host.docker.internal.

**Complexity**: Simple - Single parameter change in Supabase client initialization.

#### Option 2: Change docker-compose.test.yml to use 127.0.0.1

**Description**: Modify `docker-compose.test.yml` to set `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521` for the test containers instead of using host.docker.internal.

**Pros**:
- Browser client uses same URL as global setup
- Simpler to reason about (same URL everywhere)

**Cons**:
- ❌ May break Docker container networking (127.0.0.1 refers to the container itself, not the host)
- ❌ Breaks the standard Docker networking pattern where containers use host.docker.internal to reach the host
- ❌ Risk of hostname resolution issues within containers
- ❌ Goes against Docker best practices
- Likely won't work anyway - containers can't use 127.0.0.1 to reach host services

**Why Not Chosen**: Docker containers cannot reliably use 127.0.0.1 to reach host services. Each container has its own loopback interface. The standard pattern (host.docker.internal) exists specifically to solve this problem.

#### Option 3: Implement JWT issuer rewriting in session storage

**Description**: Modify the session storage or Supabase client to rewrite the JWT issuer URL during session retrieval to normalize both URLs as equivalent.

**Pros**:
- Theoretically addresses the root issue
- Could handle mixed environments

**Cons**:
- ❌ Complex to implement correctly without breaking security
- ❌ Requires modifying Supabase client internals (not recommended)
- ❌ Masks the underlying architectural issue
- ❌ Supabase SDK likely validates issuer for security reasons; bypassing this could be risky
- ❌ Not a sustainable solution

**Why Not Chosen**: This would require significant changes to Supabase's JWT validation logic, which is a security-critical component. The simpler approach (normalizing the URLs) is safer and more maintainable.

### Selected Solution: Update global-setup to use host.docker.internal

**Justification**:

This approach is best because:
1. **Minimal change**: Single URL parameter in one file
2. **Aligned with architecture**: The docker-compose.test.yml already uses host.docker.internal, which is the correct DNS name for containers to reach the host
3. **Standard Docker practice**: Using host.docker.internal for container-to-host communication is the recommended pattern
4. **Low risk**: Only affects test setup, doesn't change development workflow or database
5. **Clean solution**: Addresses the root cause (URL mismatch) directly without workarounds

**Technical Approach**:

1. In `apps/e2e/global-setup.ts`, create the Supabase client using `http://host.docker.internal:54521` instead of `http://127.0.0.1:54521`
2. This ensures JWT tokens are created with `iss: http://host.docker.internal:54521/auth/v1`
3. When the browser client (also using host.docker.internal) validates the JWT, the issuer URL matches
4. Session validation succeeds, auth requests proceed normally, test completes

**Architecture Changes**: None required - this is an alignment fix, not an architectural change.

**Migration Strategy**: No migration needed - this only affects test execution, not production code or database.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Update Supabase URL from 127.0.0.1 to host.docker.internal
- `apps/e2e/tests/account/account.spec.ts` - The failing test (verification only, no changes needed)
- `docker-compose.test.yml` - Documentation/verification that browser clients use host.docker.internal

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update global-setup.ts to use host.docker.internal

This is the core fix that aligns the authentication URL with what the Docker containers expect.

**Changes**:
1. Open `apps/e2e/global-setup.ts`
2. Find the Supabase client initialization
3. Replace `http://127.0.0.1:54521` with `http://host.docker.internal:54521`
4. Verify that the admin client also uses the same URL
5. Add a comment explaining why host.docker.internal is used (for Docker container compatibility)

**Why this step first**: The global setup creates the authentication session that all tests depend on. Fixing this is the foundation for all subsequent test runs.

**Expected outcome**: Supabase client in global-setup connects to the same URL (host.docker.internal) that test containers use.

#### Step 2: Verify DNS resolution in test environment

Ensure that host.docker.internal resolves correctly within test containers.

**Changes**:
1. Add a diagnostic test that verifies host.docker.internal resolves to the host IP
2. Test that the Supabase API at host.docker.internal:54521 is reachable
3. Add a logged message showing the resolved IP (for debugging if issues arise)

**Why this step**: Validates that the Docker networking configuration supports host.docker.internal resolution. Provides diagnostic information if the fix doesn't work.

**Expected outcome**: host.docker.internal resolves and is reachable from test containers.

#### Step 3: Run failing test to verify fix

Execute the specific failing test to confirm the fix resolves the issue.

**Changes**:
1. Run the password update test in shard 3: `pnpm --filter e2e test:shard3`
2. Or run specific test: `pnpm --filter e2e test -- --grep "user can update their password"`
3. Monitor for successful auth and PUT request completion instead of timeout

**Why this step**: Directly validates that the fix resolves the original issue. Tests the exact scenario described in the diagnosis.

**Expected outcome**: Test passes within normal timeout (not timing out), password update request completes successfully.

#### Step 4: Run full E2E test suite to check for regressions

Ensure the change doesn't break other tests.

**Changes**:
1. Run all E2E tests: `pnpm test:e2e`
2. Run specific shards: `pnpm --filter e2e test:shard1`, `test:shard2`, `test:shard3`, etc.
3. Monitor for any unexpected failures or timeouts

**Why this step**: Validates that normalizing the URL doesn't introduce regressions elsewhere. The change is minimal, but comprehensive testing ensures all auth flows work correctly.

**Expected outcome**: All E2E tests pass, no new timeouts or auth-related failures.

#### Step 5: Code quality and validation

Ensure code quality standards are met.

**Changes**:
1. Run `pnpm typecheck` to verify TypeScript types are correct
2. Run `pnpm lint:fix` to fix any formatting issues
3. Run `pnpm format:fix` to ensure code formatting is consistent
4. Verify the change follows project conventions

**Why this step**: Maintains code quality standards and prevents introducing new issues. Standard part of the development workflow.

**Expected outcome**: No type errors, lint warnings, or formatting issues.

## Testing Strategy

### Unit Tests

Unit testing isn't applicable here since this is a configuration fix, not a code logic change. The Supabase client is created with a different parameter, but the logic remains the same.

### Integration Tests

The real validation occurs at the integration level where the global setup interacts with Supabase and the test framework.

**Test scenarios**:
- ✅ Global setup successfully authenticates using host.docker.internal URL
- ✅ JWT tokens created have correct issuer URL (host.docker.internal)
- ✅ Browser client can validate session using same issuer URL
- ✅ Auth requests (PUT to auth/v1/user) complete successfully
- ✅ Password update flow completes without timeout

### E2E Tests

The E2E tests themselves are the primary validation mechanism.

**Test files**:
- `apps/e2e/tests/account/account.spec.ts` - "user can update their password" test
- All other shard tests to check for regressions

**Regression test**: The original failing test is the regression test - it should pass after the fix.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run global-setup independently to verify it authenticates successfully with host.docker.internal
- [ ] Verify the session created contains JWT with correct issuer URL
- [ ] Run the failing test "user can update their password" in isolation - should pass
- [ ] Run shard 3 tests completely - should all pass without timeouts
- [ ] Run all E2E tests across all shards - zero timeouts
- [ ] Verify dev environment still works (pnpm dev) - confirm 127.0.0.1 authentication still works for dev
- [ ] Check browser console in test container for no auth-related errors
- [ ] Verify test infrastructure auto-detection correctly identifies test containers

## Risk Assessment

**Overall Risk Level**: Medium (Low-to-Medium, actually)

**Potential Risks**:

1. **host.docker.internal not available in all environments**
   - **Likelihood**: Low
   - **Impact**: High (tests would fail to authenticate)
   - **Mitigation**:
     - This is a standard Docker feature available on Docker Desktop, Docker for Windows, Docker for Mac, and most Linux distributions (via Docker 20.10+)
     - If using older Docker, can be addressed by updating Docker or using alternative networking
     - Test infrastructure will immediately fail if DNS resolution fails

2. **Firewall/network policies blocking host.docker.internal**
   - **Likelihood**: Low
   - **Impact**: High (same as above)
   - **Mitigation**:
     - Run diagnostic test first to verify connectivity
     - Check Docker daemon configuration if issues arise
     - Network policies would affect existing docker-compose.test.yml too, so this is already a known working configuration

3. **127.0.0.1 used elsewhere for authentication validation**
   - **Likelihood**: Low
   - **Impact**: Medium (specific auth flows might fail)
   - **Mitigation**:
     - Comprehensive E2E testing will catch any issues
     - The issuer URL is only checked during JWT validation, which is tested thoroughly
     - If issues arise, fallback to Option 2 (add configuration option to choose URL)

4. **Inconsistency between dev and test authentication**
   - **Likelihood**: Very Low
   - **Impact**: Low
   - **Mitigation**:
     - Dev environment uses 127.0.0.1 (correct for host system running Next.js directly)
     - Test environment uses host.docker.internal (correct for containers)
     - Each is correctly configured for its environment
     - The Supabase API accepts both URLs; only JWT issuer validation requires matching

**Rollback Plan**:

If this fix causes unexpected issues in production testing:

1. **Immediate rollback**: Change host.docker.internal back to 127.0.0.1 in global-setup.ts
2. **Root cause analysis**: If 127.0.0.1 was necessary for some reason, determine why
3. **Alternative approach**: Implement a configuration option to allow both URLs
4. **Long-term solution**: Implement Option 3 (JWT issuer rewriting) if simple URL alignment doesn't work

**Monitoring** (if needed):

- Monitor E2E test pass rates before and after deployment
- Watch for authentication timeouts in test execution
- Check test logs for JWT validation errors
- If timeout failures recur, verify host.docker.internal connectivity in Docker environment

## Performance Impact

**Expected Impact**: None - This is a configuration change with no code logic changes. Performance should be identical.

**Performance Testing**:

- No performance testing needed - the change doesn't affect computational complexity or data handling
- E2E test execution time should remain the same (may even improve if tests now complete instead of timing out)

## Security Considerations

**Security Impact**: None - This is purely a Docker networking configuration change.

- ✅ No exposure of sensitive data
- ✅ JWT validation remains unchanged
- ✅ RLS policies unaffected
- ✅ Database access control unaffected
- ✅ No new network exposure

**Security Note**: This change aligns authentication with Docker best practices. Using host.docker.internal for container-to-host communication is more secure than trying to circumvent Docker's network isolation.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing test - it should timeout
cd /home/msmith/projects/2025slideheroes
docker-compose -f docker-compose.test.yml up -d
pnpm --filter e2e test:shard3 -- --grep "user can update their password"
```

**Expected Result**: Test times out waiting for PUT request to auth/v1/user that never occurs.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (general smoke test)
pnpm test:unit

# E2E test - specific failing test
pnpm --filter e2e test:shard3 -- --grep "user can update their password"

# E2E test - all shards
pnpm --filter e2e test:shard1
pnpm --filter e2e test:shard2
pnpm --filter e2e test:shard3

# Full test suite
pnpm test:e2e
```

**Expected Result**: All commands succeed, test completes within timeout (2-3 minutes), password update succeeds.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run just E2E tests multiple times to ensure consistency
pnpm test:e2e
pnpm test:e2e  # Run twice to catch flakiness

# Verify dev still works (uses 127.0.0.1, not affected)
pnpm dev  # Should start without errors
# Try to login in browser - should work as before
```

## Dependencies

### New Dependencies

No new dependencies required.

### Existing Utilities Used

- `getSupabaseServerClient()` from `@kit/supabase/server-client` (already in use)
- Supabase client constructor options (standard Supabase JS SDK)

## Database Changes

**Migration needed**: No

**Rationale**: This is a test infrastructure change. No database schema or data changes required. The database remains unchanged; only the authentication URL in the test setup changes.

## Deployment Considerations

**Deployment Risk**: Low

**Environment Impact**:
- ✅ Local development: No change (still uses 127.0.0.1 when running `pnpm dev`)
- ✅ Test environment: Updated to use host.docker.internal (within test containers via docker-compose)
- ✅ CI/CD: May need to verify host.docker.internal availability in GitHub Actions runners
- ✅ Production: No impact (this is test infrastructure only)

**Special deployment steps**: None required for production. May need to verify CI/CD environment supports host.docker.internal.

**Feature flags needed**: No

**Backwards compatibility**: Maintained - This change only affects test setup, not the application code.

## Success Criteria

The fix is complete when:
- [ ] global-setup.ts uses host.docker.internal instead of 127.0.0.1
- [ ] TypeScript compilation succeeds (pnpm typecheck passes)
- [ ] Linting passes (pnpm lint passes)
- [ ] Formatting is correct (pnpm format passes)
- [ ] The failing test "user can update their password" passes
- [ ] Shard 3 E2E tests all pass without timeouts
- [ ] All E2E tests pass (all shards) without regressions
- [ ] Dev environment still works (pnpm dev with 127.0.0.1)
- [ ] No new auth-related failures in test logs
- [ ] Zero timeout errors related to auth/v1/user requests

## Notes

### Key Insights from Diagnosis

The diagnosis issue #1142 provides excellent detail showing:
- JWT tokens created with 127.0.0.1:54521 issuer
- Browser client configured with host.docker.internal:54521
- Mismatch prevents session validation
- Global-setup auth works, but JWT becomes invalid in browser client

This clearly indicates the fix location: global-setup needs to match the browser client's URL.

### Why This Works

```
BEFORE FIX:
┌─────────────────────────────────────────┐
│ Global Setup (127.0.0.1:54521)         │
│ Creates JWT: iss=127.0.0.1:54521/auth  │
└─────────────────────────────────────────┘
            ↓ Session stored in localStorage
┌─────────────────────────────────────────┐
│ Browser Client (host.docker.internal)  │
│ Validates JWT: iss≠host.docker.internal│
│ Validation FAILS → getSession() = null  │
│ NO AUTH REQUESTS → TIMEOUT             │
└─────────────────────────────────────────┘

AFTER FIX:
┌─────────────────────────────────────────┐
│ Global Setup (host.docker.internal)    │
│ Creates JWT: iss=host.docker.internal  │
└─────────────────────────────────────────┘
            ↓ Session stored in localStorage
┌─────────────────────────────────────────┐
│ Browser Client (host.docker.internal)  │
│ Validates JWT: iss=host.docker.internal│
│ Validation PASSES → getSession() works │
│ AUTH REQUESTS SUCCEED → TEST PASSES    │
└─────────────────────────────────────────┘
```

### Related Previous Fixes

- #1139, #1140: Previous timeout fixes addressed symptoms (timeouts), not root cause (URL mismatch)
- #1133, #1134: Route interception fixes addressed network reachability, confirmed containers can reach Supabase

This fix completes the picture by aligning the authentication configuration across all layers.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1142*
