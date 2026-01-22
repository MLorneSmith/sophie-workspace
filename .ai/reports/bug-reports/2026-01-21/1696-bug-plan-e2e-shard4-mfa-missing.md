# Bug Fix: E2E Shard 4 Timeout - Missing MFA Factors for Super Admin

**Related Diagnosis**: #1693
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `setupTestUsers()` function creates super admin auth users but does NOT create MFA factors in `auth.mfa_factors` table, causing `is_aal2()` to return false and breaking admin access
- **Fix Approach**: Add MFA factor creation for super admin test user during test setup using the same TOTP secret and verified status as seed.sql
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shard 4 (Admin & Invitations tests) times out after 15 minutes because the super admin tests repeatedly fail. The `setupTestUsers()` function creates auth users with correct `app_metadata.role = 'super-admin'`, but WITHOUT creating MFA factors in `auth.mfa_factors`. Without MFA factors, `is_aal2()` returns false, `is_super_admin()` returns false, and the user gets redirected to a 404 page. The tests retry indefinitely until timeout.

For full context, see diagnosis issue #1693.

### Solution Approaches Considered

#### Option 1: Add MFA Factor Creation in setupTestUsers() ⭐ RECOMMENDED

**Description**: After creating the super admin auth user via the Supabase Admin API, create an MFA factor entry with status 'verified' using the admin client. This sets the AAL2 level immediately so `is_aal2()` returns true and `is_super_admin()` passes.

**Pros**:
- Minimal code change (5-10 lines in test-users.ts)
- Exactly matches the seed.sql pattern (same TOTP secret)
- No impact on production code
- No database schema changes needed
- Surgical fix addressing only the root cause
- No risk of breaking other tests

**Cons**:
- Requires knowledge of MFA factor creation via Supabase Admin API
- MFA secret must be hardcoded (acceptable for test data)

**Risk Assessment**: low - Only test data is modified, using established patterns

**Complexity**: simple - Straightforward MFA factor insert

#### Option 2: Modify seed.sql to include MFA factors

**Description**: Add MFA factor data to seed.sql so it's included when seeding.

**Why Not Chosen**: The workflow uses `--no-seed` to skip seeding, so this wouldn't solve the problem. Also, seed.sql is for production reference data, not CI test data.

#### Option 3: Create a separate test user setup file

**Description**: Extract user setup into a dedicated test setup module with full MFA handling.

**Why Not Chosen**: Over-engineering for a single-user setup. Current approach is sufficient. Keep complexity minimal.

### Selected Solution: Add MFA Factor Creation in setupTestUsers()

**Justification**: This is the most direct fix to the root cause. The diagnosis clearly identified that MFA factors are missing - adding them completes the setup exactly as intended by the security model. No schema changes, no production impact, minimal code change, follows existing patterns in seed.sql.

**Technical Approach**:
- After creating the super admin auth user in `setupTestUsers()`, use `supabase.auth.admin.createFactor()` to create an MFA factor
- Use the same TOTP secret as seed.sql (`NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE`)
- Set factor status to 'verified' so AAL2 is immediately available
- Set friendly name to identify it in tests (e.g., 'iPhone' like seed.sql)
- This matches the seed.sql pattern exactly, using same secret and status

**Architecture Changes**: None - this is purely test data setup enhancement

**Migration Strategy**: Not applicable - test data only, no migration needed

## Implementation Plan

### Affected Files

List of files that need modification:

- `apps/e2e/tests/helpers/test-users.ts` - Add MFA factor creation after super admin user creation
- No other files need changes (this is isolated to test setup)

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Add MFA factor creation logic in setupTestUsers()

Add code to create an MFA factor for the super admin user after the auth user is created.

- Locate the super admin user creation in `setupTestUsers()` (after `supabase.auth.admin.createUser()` call)
- Add `supabase.auth.admin.createFactor()` call with:
  - `type: 'totp'`
  - `factorName: 'iPhone'` (to match seed.sql)
  - `secret: 'NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE'` (same as seed.sql)
  - `issuer: 'SlideHeroes'`
- Mark factor as verified by calling appropriate endpoint or setting status directly

**Why this step first**: Foundation for all admin tests - without this, admin access won't work

#### Step 2: Verify MFA factor creation succeeds

- Add error handling for factor creation failures
- Log the factor ID for debugging if needed
- Ensure test continues even if factor creation has issues (graceful fallback)

#### Step 3: Test the fix locally

- Run E2E tests locally on Shard 4 to verify super admin access works
- Verify no 404 errors on admin routes
- Verify admin tests complete within normal timeout (not hitting 15-minute limit)

**Why this step**: Confirms the fix resolves the root cause before CI

#### Step 4: Verify in CI

- Push changes to dev branch
- Trigger e2e-sharded workflow manually or via PR
- Monitor Shard 4 completion (should finish within 5-10 minutes, not timeout at 15)
- Verify Invitations tests also complete (they depend on same setup)

#### Step 5: Validation

- All tests pass without timeout
- Admin routes accessible (no more 404 redirects)
- Invitations tests work
- No regressions in other shards

## Testing Strategy

### Unit Tests

No new unit tests needed - this is test data setup, not production code.

### Integration Tests

The fix is validated through existing E2E tests:
- Admin page navigation should succeed (not redirect to 404)
- Super admin role verification via RPC should return true
- Invitations functionality should work

### E2E Tests

The existing Shard 4 tests will validate:
- ✅ Admin tests no longer timeout
- ✅ Super admin user has AAL2 level (via is_aal2())
- ✅ is_super_admin() returns true (AAL2 + role check)
- ✅ Admin routes accessible without 404
- ✅ Invitations tests complete successfully

**Test files**:
- `apps/e2e/tests/global-setup.ts` - Verifies MFA setup works (already tests this)
- `apps/e2e/tests/admin/**` - Existing admin tests (should pass now)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start E2E test server: `pnpm --filter web dev:test`
- [ ] Run global setup: `pnpm --filter e2e test global-setup.ts`
- [ ] Verify super admin user is created with MFA factor
- [ ] Run Shard 4 tests locally: `pnpm --filter e2e test --shard=4/4`
- [ ] Tests should complete without timeout (within 10 minutes)
- [ ] Admin page loads without 404 redirect
- [ ] Invitations tests pass
- [ ] Trigger e2e-sharded workflow in CI to verify full pipeline works

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **MFA secret mismatch**: If the TOTP secret doesn't match what the global-setup verification expects
   - **Likelihood**: low (same secret used in seed.sql)
   - **Impact**: medium (tests would still fail)
   - **Mitigation**: Use exact same secret from seed.sql (NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE), verify in global-setup.ts

2. **MFA factor API changed in Supabase**: If the Admin API for creating factors has different signature
   - **Likelihood**: low (well-documented API)
   - **Impact**: high (tests would fail)
   - **Mitigation**: Check Supabase Admin API docs before implementation, test locally first

3. **Permission denied creating MFA factors**: If test user doesn't have permission to create factors
   - **Likelihood**: low (using admin client)
   - **Impact**: high (factor creation would fail)
   - **Mitigation**: Use admin client (which project already does), add error logging

**Rollback Plan**:

If this causes issues:
1. Revert the MFA factor creation code in `setupTestUsers()`
2. Tests will fail again (back to original state)
3. No data loss or production impact
4. Simple git revert

**Monitoring** (not needed):
- Test data only, no monitoring required

## Performance Impact

**Expected Impact**: none to minimal

- MFA factor creation is a single database insert during test setup
- Negligible impact on test execution time (~10-50ms)
- Fixes the timeout issue (15 minutes → ~5-10 minutes)
- Net performance improvement due to eliminated retries

## Security Considerations

**Security Impact**: none

- This is test data only, not production code
- TOTP secret is for testing purposes (not real user MFA)
- No security vulnerabilities introduced
- Follows existing security patterns in seed.sql

## Validation Commands

### Before Fix (Bug Should Reproduce - ONLY if reverting for testing)

```bash
# This would reproduce the bug, but we won't run it since we're fixing forward
# Just documenting what would fail without the fix:
# - Admin tests would timeout after 15 minutes
# - 404 errors on /admin routes
# - is_super_admin() RPC would return false
```

**Expected Result**: Shard 4 times out after 15 minutes with 404 errors on admin routes

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run Shard 4 tests locally
pnpm --filter web dev:test &  # Start test server
sleep 10
pnpm --filter e2e test --shard=4/4

# Should complete in ~5-10 minutes, no timeouts
```

**Expected Result**:
- All commands succeed
- Shard 4 tests complete within normal time (not hitting 15-minute timeout)
- No 404 errors on admin routes
- Admin tests pass
- Invitations tests pass
- Zero regressions

### Regression Prevention

```bash
# Run full E2E shard suite to ensure no regressions
pnpm --filter web dev:test &
sleep 10
pnpm --filter e2e test  # Runs all shards

# All shards should pass
```

## Dependencies

### New Dependencies

**No new dependencies required** - Using existing Supabase Admin API client already in project

### Existing Dependencies Used

- `@supabase/supabase-js` - Admin client already imported for user creation
- Same TOTP secret from seed.sql

## Database Changes

**No database changes required** - Using existing `auth.mfa_factors` table created by Supabase

- Table structure: `id`, `user_id`, `factor_type`, `status`, `created_at`
- Will insert one row per test run (temporary test data)

## Deployment Considerations

**Deployment Risk**: none (test data only)

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (test-only change)

## Success Criteria

The fix is complete when:
- [ ] MFA factor creation code added to `setupTestUsers()`
- [ ] Code properly formats and passes linting
- [ ] TypeScript compilation succeeds
- [ ] Shard 4 tests run locally without timeout
- [ ] Admin routes accessible (no 404 redirects)
- [ ] E2E shard test suite passes in CI
- [ ] No regressions in other test shards
- [ ] Global setup successfully creates MFA factors

## Notes

This is a straightforward fix addressing a clear root cause. The diagnosis identified exactly what's missing - MFA factors that are needed for `is_aal2()` to return true, which gates admin access. By adding the same factor creation pattern used in seed.sql to the `setupTestUsers()` function, we ensure test users have proper AAL2 authentication level.

The fix is minimal, low-risk, and follows existing patterns in the codebase. No architectural changes needed.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1693*
