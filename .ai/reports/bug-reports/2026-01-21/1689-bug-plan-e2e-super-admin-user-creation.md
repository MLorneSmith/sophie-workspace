# Bug Fix: E2E Shards Fail - Super-Admin User Not Created by setupTestUsers()

**Related Diagnosis**: #1685 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `setupTestUsers()` creates only 3 test users but `global-setup.ts` expects 4 authentication states, including a super-admin user that is never created
- **Fix Approach**: Add super-admin user to `TEST_USERS` constant and update `setupTestUsers()` to create it during global setup
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E test shards 2-8 fail during authentication in `global-setup.ts` with "Invalid login credentials" error for the super-admin user (`michael@slideheroes.com`). The root cause is that `setupTestUsers()` only creates 3 test users (`test1@slideheroes.com`, `test2@slideheroes.com`, `newuser@slideheroes.com`), but the global setup expects 4 authentication states including the super-admin user.

The mismatch means:
1. `setupTestUsers()` runs ✅ Creates 3 users
2. Global setup tries to authenticate as super-admin ❌ User doesn't exist
3. Auth state file creation fails → E2E tests fail with login credentials error

For full details, see diagnosis issue #1685.

### Solution Approaches Considered

#### Option 1: Add Super-Admin User to TEST_USERS ⭐ RECOMMENDED

**Description**: Add the missing super-admin user to the `TEST_USERS` constant in `apps/e2e/tests/helpers/test-users.ts` and update `setupTestUsers()` to create it with proper metadata and role assignments.

**Pros**:
- Minimal code change (add one user object)
- Matches the existing pattern (already structured for test users)
- Super-admin metadata/role already defined in diagnosis
- Consistent with how other test users are created
- No architectural changes needed

**Cons**:
- Requires knowing the super-admin email and password upfront
- Hardcoding credentials in test helpers (acceptable for local testing)

**Risk Assessment**: low - Only adding a new test user, no existing code modified

**Complexity**: simple - One-file change with straightforward code addition

#### Option 2: Skip Super-Admin Auth State During Test Setup

**Description**: Modify `global-setup.ts` to skip creating the super-admin auth state if the user doesn't exist, allowing tests to proceed without it.

**Pros**:
- Requires no changes to test user creation
- Tests could run without super-admin auth

**Cons**:
- Super-admin auth state may be needed for other test scenarios
- Masks the underlying issue (incomplete test user setup)
- Tests that need super-admin would fail anyway
- Doesn't fully resolve the root cause

**Why Not Chosen**: This approach is a workaround that doesn't address the root cause. The super-admin user should be available for testing.

#### Option 3: Dynamic User Creation from Supabase Admin API

**Description**: Use Supabase Admin API to dynamically create test users during setup based on config.

**Pros**:
- Flexible approach

**Cons**:
- Over-engineering for this scenario
- Adds unnecessary complexity
- Requires admin API authentication setup
- Slower than adding to constant

**Why Not Chosen**: Excessive complexity for a simple issue. Option 1 is more straightforward.

### Selected Solution: Add Super-Admin User to TEST_USERS

**Justification**: This is the simplest, most direct fix that follows the existing pattern for test user creation. The diagnosis already identified the exact user email (`michael@slideheroes.com`), password, and required metadata. Adding this user to `TEST_USERS` takes advantage of the existing `setupTestUsers()` infrastructure that's already working correctly for the other 3 users.

**Technical Approach**:
- Add `superAdmin` object to `TEST_USERS` constant with email, password, ID, and metadata
- Ensure `setupTestUsers()` iterates over all users in `TEST_USERS` to create them
- Verify the user has `app_metadata` with `role: "super-admin"` to match RLS policies
- Test that auth state file is created successfully for super-admin
- Verify E2E shards 2-8 pass with this user available

**Architecture Changes**: None - This follows the existing pattern

**Migration Strategy**: Not needed - This is new test data, no existing data to migrate

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/helpers/test-users.ts` - Add super-admin user to `TEST_USERS` constant and update `setupTestUsers()` to create it
- `apps/e2e/global-setup.ts` - No changes (already expects super-admin auth state, just needs the user to exist)

### New Files

No new files needed - All changes are additions to existing files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Super-Admin User to TEST_USERS Constant

Update `apps/e2e/tests/helpers/test-users.ts`:

- Add a new `superAdmin` user object to the `TEST_USERS` export with:
  - `email`: `"michael@slideheroes.com"`
  - `password`: `"aiesec1992"`
  - `id`: `"c5b930c9-0a76-412e-a836-4bc4849a3270"` (from diagnosis)
  - `metadata`: Object with `{ displayName: "Super Admin", role: "super-admin" }`
  - `appMetadata`: Object with `{ role: "super-admin" }` (required for `is_super_admin()` RLS function)

**Why this step first**: The user must be defined before `setupTestUsers()` can create it. This establishes the data structure needed.

#### Step 2: Verify setupTestUsers() Iterates Over All Users

Review `apps/e2e/tests/helpers/test-users.ts` to confirm that:

- `setupTestUsers()` function iterates over all entries in the `TEST_USERS` object
- The function creates each user with proper auth and metadata
- The newly added super-admin user will be created alongside existing test users

**Why this step**: Ensures the new user will actually be created during setup. If the loop only hardcodes specific users, we need to add the super-admin to that list.

#### Step 3: Add/Update Test to Verify Auth State Creation

Update or create test to verify:

- Super-admin user is created successfully in Supabase Auth
- Auth state file is written for super-admin: `michael@slideheroes.com.json`
- The auth state file can be used to sign in during global setup

**Why this step**: Validates that the fix works before running full E2E suite.

#### Step 4: Run Global Setup Manually to Verify

Execute the global setup sequence manually:

```bash
# Start test servers and database
pnpm test:setup

# Verify super-admin auth state file exists
ls -la apps/e2e/auth-states/michael@slideheroes.com.json

# Check auth states directory for all 4 users:
ls -la apps/e2e/auth-states/
# Expected: test1@slideheroes.com.json, test2@slideheroes.com.json, michael@slideheroes.com.json, payload-admin.json (or similar)
```

**Why this step**: Confirms the fix works in isolation before running the full test suite.

#### Step 5: Run E2E Shards 2-8 to Verify Fix

Execute the previously failing E2E test shards:

```bash
# Run E2E tests in shard mode (shards 2-8 were failing)
pnpm --filter web-e2e test:shard:2
pnpm --filter web-e2e test:shard:3
# ... run shards 3-8

# Or run all E2E tests
pnpm test:e2e
```

**Why this step**: Verifies that the E2E tests that were failing now pass with the super-admin user available.

#### Step 6: Add Regression Test

Add a test to prevent this issue from happening again:

- Create test file: `apps/e2e/tests/global-setup.spec.ts` (if it doesn't exist)
- Add test: "All required auth states are created during global setup"
- Test should verify that all expected users are created and auth states exist
- Test should verify the 4 expected auth state files exist after setup

**Why this step**: Prevents future regressions if someone removes users from `TEST_USERS` without updating global setup expectations.

#### Step 7: Code Quality & Validation

- Run `pnpm typecheck` to ensure no TypeScript errors
- Run `pnpm lint` to check for style issues
- Run `pnpm format` to ensure consistent formatting
- Run `pnpm test` to ensure no regressions

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `setupTestUsers()` creates all 4 users (including super-admin)
- ✅ Super-admin user has correct role metadata
- ✅ Super-admin user can authenticate with provided credentials
- ✅ Auth state file is created for super-admin

**Test files**:
- `apps/e2e/tests/helpers/test-users.spec.ts` - Test user creation

### Integration Tests

E2E global setup is itself an integration test:
- ✅ Test that `global-setup.ts` can authenticate all 4 users
- ✅ Test that all 4 auth state files are created
- ✅ Test that each auth state file contains valid session data

**Test files**:
- `apps/e2e/tests/global-setup.spec.ts` - Global setup integration test

### E2E Tests

✅ Run shards 2-8 that were previously failing to verify they now pass

**Test files**:
- All E2E test files in `apps/e2e/tests/` will benefit from this fix

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify `TEST_USERS` contains `superAdmin` object with correct email/password
- [ ] Verify `setupTestUsers()` function iterates over all users including super-admin
- [ ] Run global setup: `pnpm test:setup` completes without errors
- [ ] Verify auth state file exists: `ls -la apps/e2e/auth-states/michael@slideheroes.com.json`
- [ ] Verify all 4 auth state files exist: `ls -la apps/e2e/auth-states/`
- [ ] Run E2E shard 2: `pnpm --filter web-e2e test:shard:2` passes
- [ ] Run E2E shard 3: `pnpm --filter web-e2e test:shard:3` passes
- [ ] Run full E2E suite: `pnpm test:e2e` passes
- [ ] Verify no TypeScript errors: `pnpm typecheck` passes
- [ ] Verify no lint errors: `pnpm lint` passes

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Credential Storage**: Hardcoding super-admin credentials in test helpers
   - **Likelihood**: low (this is standard for test fixtures)
   - **Impact**: low (credentials are only for test/local environment)
   - **Mitigation**: Credentials are never exposed in production; test files are never deployed

2. **User Conflict**: Super-admin user already exists in Supabase
   - **Likelihood**: low (fresh database reset for each test run)
   - **Impact**: medium (test setup would fail)
   - **Mitigation**: Test database is reset before each run; verify no conflicts

3. **Role/Permission Issues**: Super-admin role not properly configured
   - **Likelihood**: low (metadata follows existing pattern)
   - **Impact**: medium (auth state created but user lacks required permissions)
   - **Mitigation**: Verify RLS policies recognize `role: "super-admin"` in app_metadata

**Rollback Plan**:

If this fix causes issues in E2E tests:
1. Remove the `superAdmin` entry from `TEST_USERS` in `test-users.ts`
2. Re-run `pnpm test:setup` to recreate clean auth states
3. Re-run E2E tests
4. Diagnose why super-admin user isn't working

**Monitoring** (if needed):
- Monitor E2E test shard completion rates (should improve from current failure state)
- Watch for authentication errors during global setup
- Alert on any "Invalid login credentials" errors for super-admin

## Performance Impact

**Expected Impact**: none

No performance implications. This is purely adding a missing test user that was already expected to exist.

## Security Considerations

**Security Impact**: none

Credentials are hardcoded only in test fixtures for local development. This follows standard testing practices and poses no security risk:
- Test files are not deployed to production
- Credentials are for a local Supabase instance only
- No secrets are exposed in version control

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start fresh test environment
pnpm test:setup

# Run E2E shard 2 (was failing)
pnpm --filter web-e2e test:shard:2
```

**Expected Result**: E2E tests fail with "Invalid login credentials" for super-admin user

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E shard 2 (was failing)
pnpm --filter web-e2e test:shard:2

# Run E2E shard 3
pnpm --filter web-e2e test:shard:3

# Run E2E shard 4-8
pnpm --filter web-e2e test:shard:4
pnpm --filter web-e2e test:shard:5
pnpm --filter web-e2e test:shard:6
pnpm --filter web-e2e test:shard:7
pnpm --filter web-e2e test:shard:8

# Or run full E2E suite
pnpm test:e2e

# Full test suite
pnpm test
```

**Expected Result**: All commands succeed, E2E shards 2-8 pass, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify E2E tests that depend on super-admin pass
pnpm test:e2e

# Verify no new TypeScript errors
pnpm typecheck
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - This change uses only existing code and patterns.

## Database Changes

**No database changes required** - This only adds a test user during E2E setup. The user is created via Supabase Auth, not through migrations.

## Deployment Considerations

**Deployment Risk**: none - This is E2E test code only, not deployed to production.

**Backwards compatibility**: maintained - This change is purely additive (new test user, no changes to existing code).

## Success Criteria

The fix is complete when:
- [ ] Super-admin user object added to `TEST_USERS` in `test-users.ts`
- [ ] `setupTestUsers()` function successfully creates all 4 users including super-admin
- [ ] Auth state file `michael@slideheroes.com.json` is created during global setup
- [ ] E2E test shards 2-8 pass successfully
- [ ] All E2E tests pass without regressions
- [ ] No TypeScript errors: `pnpm typecheck` passes
- [ ] No lint errors: `pnpm lint` passes
- [ ] Manual testing checklist complete

## Notes

This is a straightforward fix that follows the existing test user pattern. The super-admin user is already expected by `global-setup.ts` (line 718-742 shows the 4 expected auth states), so this change simply delivers what the code already expects.

The fix addresses the root cause identified in the diagnosis: incomplete test user setup in `setupTestUsers()`.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1685*
