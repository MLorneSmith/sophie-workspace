# Bug Fix: E2E Sharded Tests Fail Due to Missing Test Users

**Related Diagnosis**: #1602
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2E workflow runs `supabase db reset --no-seed` which skips seeding test users, but tests expect `test1@slideheroes.com` to exist
- **Fix Approach**: Call `setupTestUsers()` from test-users.ts in the global-setup.ts before tests run
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The e2e-sharded GitHub Actions workflow runs `supabase db reset --no-seed` to apply database migrations without seeding. However, E2E tests expect test users (`test1@slideheroes.com`, etc.) to exist. Since no users are created during the reset, login attempts fail and all authentication-dependent tests fail at the `/auth/sign-in` page.

For full details, see diagnosis issue #1602.

### Solution Approaches Considered

#### Option 1: Call setupTestUsers() in global-setup.ts ⭐ RECOMMENDED

**Description**: The `setupTestUsers()` function already exists in `apps/e2e/tests/helpers/test-users.ts`. This function uses the Supabase admin API to create test users with the correct password hashes. We can call this function in `global-setup.ts` (which runs before all tests) to ensure test users exist.

**Pros**:
- Minimal code change (2-3 lines)
- Uses existing, well-tested `setupTestUsers()` function
- Ensures consistency between test user definitions and created users
- Admin API handles password hashing correctly
- Works with current `--no-seed` workflow (no need to change it)

**Cons**:
- Adds a small startup time (< 1 second for user creation)
- Requires Supabase admin client configuration

**Risk Assessment**: low - Uses existing code path, no schema changes

**Complexity**: simple - One function call in existing setup file

#### Option 2: Remove --no-seed and update seed.sql

**Description**: Change the workflow to use `supabase db reset` (without `--no-seed`) and add test users to the seed.sql file with `@slideheroes.com` email addresses.

**Pros**:
- Seeds users consistently with every reset
- No code changes needed in test setup

**Cons**:
- Requires maintaining bcrypt password hashes in seed.sql (security risk)
- Slower database reset (runs all seed files)
- Harder to maintain test user credentials in code
- Risk of exposing hashes in version control

**Why Not Chosen**: This approach requires storing password hashes in SQL which is a security smell. The setupTestUsers() approach is cleaner and more maintainable.

#### Option 3: Run setupTestUsers in E2E tests workflow as separate step

**Description**: Add a GitHub Actions step that runs a script to call setupTestUsers() after database reset but before tests start.

**Pros**:
- Separates test setup from global-setup.ts
- Explicit workflow step visibility

**Cons**:
- More complex than Option 1
- Duplicates logic already in global-setup flow
- Adds another workflow step and maintenance burden

**Why Not Chosen**: Option 1 is simpler and keeps all setup logic in one place.

### Selected Solution: Call setupTestUsers() in global-setup.ts

**Justification**: This is the simplest, most maintainable solution. The `setupTestUsers()` function already exists and is proven to work. By calling it in `global-setup.ts`, we ensure test users are created before any tests run, without changing the workflow or how the database is seeded.

**Technical Approach**:
1. Open `apps/e2e/global-setup.ts`
2. Import `setupTestUsers` from `tests/helpers/test-users.ts`
3. Call `setupTestUsers()` after Supabase starts but before tests begin
4. The existing global-setup.ts already waits for the web server to be ready - we'll add the call before returning

**Architecture Changes** (if any):
- None - we're just using existing functions
- No database schema changes
- No API changes

**Migration Strategy** (if needed):
- No data migration needed - this only affects test setup
- Existing test users (if any) will be idempotent-updated by setupTestUsers()

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/global-setup.ts` - Add call to `setupTestUsers()` after web server is ready
- `apps/e2e/tests/helpers/test-users.ts` - Export `setupTestUsers()` function (verify it's already exported)

### New Files

- None required

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify setupTestUsers() is exported and callable

<describe what this step accomplishes>

- Read `apps/e2e/tests/helpers/test-users.ts` to understand the function signature
- Verify `setupTestUsers()` is exported
- Understand what it requires (Supabase client, admin API key)
- Check if it's idempotent (safe to call multiple times)

**Why this step first**: We need to understand the function before calling it

#### Step 2: Review global-setup.ts structure

<describe what this step accomplishes>

- Read `apps/e2e/global-setup.ts` to understand the current setup flow
- Identify where the web server readiness check happens
- Find the best place to add `setupTestUsers()` call

**Why this step**: We need to know where and how to add the function call

#### Step 3: Add setupTestUsers() call to global-setup.ts

<describe what this step accomplishes>

- Import `setupTestUsers` from the test-users helper
- Call `setupTestUsers()` after web server is ready (within the globalSetup function)
- Ensure it's called before any tests run but after Supabase and web server are up
- Handle any errors from the setup function gracefully

**Specific implementation**:
- Add import: `import { setupTestUsers } from './tests/helpers/test-users';`
- Call after server readiness check: `await setupTestUsers();`
- Add basic error handling if setupTestUsers fails

#### Step 4: Verify test-users.ts uses correct Supabase client

<describe what this step accomplishes>

- Check that setupTestUsers() creates admin Supabase client internally
- Verify it doesn't require the web server to be running (only Supabase)
- Confirm it handles the correct test user emails (`test1@slideheroes.com`, etc.)

**Why this step**: Ensure the function has all dependencies it needs

#### Step 5: Add/update tests to verify setup

<describe what this step accomplishes>

- Add a simple test that verifies test users exist after setup
- Or update existing smoke test to confirm authentication works
- This test would run early to catch setup issues

**Test scenario**:
- Call login with test credentials
- Verify we successfully authenticate
- Verify we're redirected to home or onboarding

#### Step 6: Validation

- Run E2E tests locally with new setup
- Verify test users are created
- Verify authentication tests pass
- Run full E2E suite to check for regressions

## Testing Strategy

### Unit Tests

No unit tests needed - we're calling existing tested functions.

### Integration Tests

None specifically required - the E2E tests themselves will validate that test users are created.

### E2E Tests

The existing E2E tests already validate this since they depend on test users existing. If tests pass, the fix is working.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run E2E tests locally: `pnpm --filter web-e2e test:debug`
- [ ] Verify test users are created in Supabase (check auth.users table)
- [ ] Verify login with `test1@slideheroes.com` succeeds
- [ ] Verify smoke tests pass (Shard 1)
- [ ] Verify authentication tests pass (Shard 2+)
- [ ] Run full E2E suite: `pnpm test:e2e`
- [ ] Check for new errors in console
- [ ] Verify no regressions in other tests

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **setupTestUsers() might fail silently**: If setupTestUsers() fails, tests might still run without test users
   - **Likelihood**: low - function should throw errors on failure
   - **Impact**: medium - tests would fail same as before
   - **Mitigation**: Add explicit error handling and logging

2. **Password hashes change**: If test user password hashes are updated, setupTestUsers() might create different users
   - **Likelihood**: very low - passwords are constants in test-users.ts
   - **Impact**: low - tests would still fail with same error
   - **Mitigation**: None needed - passwords are version controlled

3. **Performance regression**: Creating users on every test run might slow things down
   - **Likelihood**: low - user creation is fast (< 1 second)
   - **Impact**: low - acceptable overhead
   - **Mitigation**: Monitor test run times

**Rollback Plan**:

If this fix causes issues:
1. Remove the `setupTestUsers()` call from global-setup.ts
2. Revert to the previous behavior (tests will fail again, but that's expected)
3. Investigate why setupTestUsers() failed

**Monitoring** (if needed):
- Monitor E2E test run times to ensure no significant slowdown
- Check for errors in test setup logs

## Performance Impact

**Expected Impact**: minimal

The setupTestUsers() function creates ~3 test users via API calls, which should take < 1 second total. This is negligible compared to overall test execution time (minutes).

## Security Considerations

**Security Impact**: none

- Test users are only created in local Supabase instance
- Credentials are hard-coded in test files (expected for testing)
- No sensitive data exposed
- No changes to authentication system

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run E2E tests without the fix
pnpm --filter web-e2e test:debug

# Expected Result: Tests fail at login step
# Error: Expected URL to match /home|onboarding/ but got /auth/sign-in
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E tests
pnpm test:e2e

# Or run specific shards locally
pnpm --filter web-e2e test:debug

# Build to ensure no errors
pnpm build
```

**Expected Result**:
- All E2E tests pass
- No authentication errors
- Bug no longer reproduces

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
pnpm --filter web-e2e test:debug
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses existing code and functions already in the codebase.

## Database Changes

**Migration needed**: no

**No database schema changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

This fix only affects local E2E test setup. No production changes.

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] setupTestUsers() is called in global-setup.ts
- [ ] Test users are created before E2E tests run
- [ ] `pnpm test:e2e` passes without authentication errors
- [ ] E2E shard 2+ (authentication-dependent) tests pass
- [ ] No new regressions in test suite
- [ ] Code formatting and linting pass

## Notes

The diagnosis identified that `setupTestUsers()` already exists in the codebase but was never called. This is a simple oversight - we just need to wire it up in the test setup flow.

The `--no-seed` flag in the workflow is intentional (to speed up database resets). We should not change it since setupTestUsers() provides a more targeted solution.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1602*
