# Bug Fix: E2E Password Update Test Database Mutation Without Restoration

**Related Diagnosis**: #715
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test changes password without restoration, breaking subsequent test runs
- **Fix Approach**: Add test lifecycle hook to restore original password after test execution
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test `user can update their password` in `apps/e2e/tests/account/account.spec.ts:44-58` generates a random password and updates the test user's password via the API, but never restores it. When tests run a second time, `global-setup.ts` attempts to authenticate with the original seed password (`aiesec1992`) but the database now contains the random password from the previous test run, causing "Invalid login credentials" error.

**Test Idempotency Requirement**: E2E tests must be idempotent - they should leave the database in a clean state so subsequent runs succeed without manual intervention.

For full details, see diagnosis issue #715.

### Solution Approaches Considered

#### Option 1: Add `test.afterEach` Hook to Restore Original Password ⭐ RECOMMENDED

**Description**: Before the test updates the password, save the original password hash. After the test completes (whether it passes or fails), restore the original hash directly in the database via SQL query.

**Pros**:
- Minimal code change (5-10 lines)
- Preserves existing test behavior (still tests password update functionality)
- Handles both success and failure cases automatically
- No changes to global setup or test infrastructure
- Low risk (isolated to single test file)

**Cons**:
- Requires direct database manipulation in test cleanup
- Adds database access to test file

**Risk Assessment**: Low - Direct database restoration is safe and isolated to test cleanup

**Complexity**: simple - Straightforward hook implementation

#### Option 2: Skip the Test (It Tests Supabase, Not App Code)

**Description**: The password update test validates Supabase's password change functionality, not application business logic. Skip it entirely since Supabase is thoroughly tested upstream.

**Pros**:
- Removes problematic test entirely
- No risk of database mutation
- Simplifies test suite

**Cons**:
- Loses verification that password update flow works end-to-end
- Removes integration test coverage
- Doesn't verify app's password update UI works correctly

**Why Not Chosen**: We should validate the complete user journey, not just app code. The password update UI needs E2E verification.

#### Option 3: Use Dedicated Test User for Destructive Tests

**Description**: Create a separate test user (`password-test@slideheroes.com`) specifically for tests that mutate authentication state. This user is destroyed after tests run or reset before each shard.

**Pros**:
- Isolates mutations to non-critical test user
- Cleaner test organization
- Allows multiple destructive tests without conflicts

**Cons**:
- Requires changes to global setup to create/manage separate user
- More complex test infrastructure
- Harder to debug if separate user has issues

**Why Not Chosen**: Adds unnecessary complexity. The simpler `afterEach` hook solves the problem with minimal code changes.

### Selected Solution: Add `test.afterEach` Hook to Restore Original Password

**Justification**: This approach is surgical and minimal - it directly addresses the root cause (password not being restored) without changing test infrastructure or losing test coverage. The fix is isolated, low-risk, and preserves the value of E2E validation.

**Technical Approach**:
1. In the test describe block, store the original password from environment variables
2. Add a `test.afterEach` hook that runs after each test in this describe block
3. The hook executes a SQL UPDATE statement to restore the original password hash
4. The hook runs unconditionally (both after success and failure)

**Architecture Changes**: None - purely additive test cleanup logic

**Migration Strategy**: Not applicable - fix is backward compatible

## Implementation Plan

### Affected Files

- `apps/e2e/tests/account/account.spec.ts` - Add restoration hook and obtain original password hash
- `apps/e2e/tests/utils/database-utilities.ts` (new) - Create helper to get/set password hash (reusable)

### New Files

- `apps/e2e/tests/utils/database-utilities.ts` - Utility functions for password hash restoration
- `apps/e2e/tests/account/account.po.ts` update - Add method to restore password (optional, depends on PO pattern)

### Step-by-Step Tasks

#### Step 1: Create Database Utility Helper

This establishes the foundation for safe password restoration and makes it reusable for other tests.

- Create `apps/e2e/tests/utils/database-utilities.ts`
- Export function `getPasswordHashFromDatabase(email: string)` - Query Supabase for current password hash
- Export function `updatePasswordHashInDatabase(email: string, hash: string)` - Directly update password hash in auth.users table
- Use environment variables for database connection (same credentials as global setup)

**Why this step first**: Centralizes database access logic and makes it safe to use in multiple tests

#### Step 2: Capture Original Password Hash Before Test

This ensures we can restore to the exact state.

- In `account.spec.ts`, before password update test runs, get the original password hash
- Store in `test.beforeEach` or as a describe-block-scoped variable
- Use `getPasswordHashFromDatabase('test1@slideheroes.com')` helper

#### Step 3: Add `test.afterEach` Hook to Restore Password

This is the core fix that restores database state.

- Add `test.afterEach(async ({ page }) => { ... })` hook in the describe block
- Hook should run after every test (both password update test and other tests)
- Query database for original password hash
- If password was changed (hash differs), restore original hash via `updatePasswordHashInDatabase()`
- Handle connection errors gracefully (log warning, don't fail test)

**Why unconditional hook**: Ensures restoration even if test fails partway through

#### Step 4: Add Unit Tests for Database Utility Functions

Ensure password restoration works correctly in isolation.

- Create `apps/e2e/tests/utils/__tests__/database-utilities.spec.ts`
- Test `getPasswordHashFromDatabase()` - connects and retrieves hash
- Test `updatePasswordHashInDatabase()` - updates hash and can retrieve updated value
- Test with test user email

#### Step 5: Validation & Verification

Run the full test suite to confirm the fix works.

- Run `/test 3` once (password update test changes password)
- Immediately run `/test 3` again (should pass - password was restored)
- Run full test suite `/test` to ensure no regressions
- Verify no other tests fail due to database utility changes

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `getPasswordHashFromDatabase()` - Returns current hash for valid email
- ✅ `getPasswordHashFromDatabase()` - Returns null for non-existent email
- ✅ `updatePasswordHashInDatabase()` - Updates hash successfully
- ✅ `updatePasswordHashInDatabase()` - Restores hash to original value
- ✅ Edge case: Concurrent hash updates (hash doesn't match expected value)
- ✅ Edge case: Database connection failure during restoration

**Test files**:
- `apps/e2e/tests/utils/__tests__/database-utilities.spec.ts` - Database utility functions

### E2E Tests

Verify the password update test maintains database idempotency:

**Test files**:
- `apps/e2e/tests/account/account.spec.ts` - Existing password update test now restores state

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start fresh Supabase: `pnpm supabase:web:reset`
- [ ] Run shard 3 once: `/test 3` - All tests pass including password update
- [ ] Immediately run shard 3 again: `/test 3` - All tests pass (password was restored)
- [ ] Run full test suite: `/test` - All shards pass with no regressions
- [ ] Verify test execution time is acceptable (no significant slowdown from restoration hook)
- [ ] Check test output confirms password restoration occurred
- [ ] Run twice more to verify consistency: `/test 3` twice more

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Database Connection Issues During Restoration**: Test cleanup may fail if Supabase is unavailable
   - **Likelihood**: low
   - **Impact**: medium (test state corrupted, need manual reset)
   - **Mitigation**: Wrap restoration in try-catch, log warnings, don't fail test itself. Provide clear guidance if manual reset needed.

2. **Password Hash Format Mismatch**: Different Supabase versions may use different hash algorithms
   - **Likelihood**: low
   - **Impact**: medium (restoration restores incompatible hash)
   - **Mitigation**: Store and restore exact hash bytes, not recreate hash. Use Supabase's internal functions if available.

3. **Concurrent Test Execution Race Condition**: If multiple workers run password test simultaneously, hash restoration could race
   - **Likelihood**: low (tests are sequenced in describe block)
   - **Impact**: medium (both tests restore different hash values)
   - **Mitigation**: Playwright already sequences tests within a describe block. If needed, add database row lock during restoration.

4. **Other Tests Depend on Changed Password**: Another test might expect password to be changed
   - **Likelihood**: low (only one password update test)
   - **Impact**: low (would show in test failures immediately)
   - **Mitigation**: Run full test suite, verify no new failures

**Rollback Plan**:

If this fix causes issues:
1. Remove `test.afterEach` hook from `account.spec.ts`
2. Remove database utility functions
3. Restore from git: `git checkout apps/e2e/tests/account/account.spec.ts apps/e2e/tests/utils/database-utilities.ts`
4. Run `pnpm supabase:web:reset` to clean database
5. Tests will revert to previous behavior (database mutation, manual reset required)

**Monitoring** (if needed):
- Monitor test execution time - hook should add <100ms per test
- Watch for "Database connection failed" warnings in test output
- Check test success rate on subsequent runs (should remain >95%)

## Performance Impact

**Expected Impact**: minimal

Adding a database query in `test.afterEach` hook will add approximately 50-100ms per test. Since this hook runs after every test in the account describe block (3 tests total), total overhead is ~150-300ms, which is acceptable for test suites that typically run 30+ seconds.

**Performance Testing**:
- Compare test execution time before/after fix
- Verify <5% increase in total test time
- Hook should add <100ms per test execution

## Security Considerations

**Security Impact**: none

- Fix uses same database access patterns as global setup (already authenticated)
- Password restoration is read-only + update-only (no deletion)
- Only accessible within test suite (not in production code)
- No credentials exposed in test output

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start fresh database
pnpm supabase:web:reset

# Run tests once - password test changes password, subsequent run fails
/test 3

# Run tests again - should fail with "Invalid login credentials"
/test 3
```

**Expected Result**: First run passes, second run fails with "Invalid login credentials" in global-setup

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E shard 3 tests twice in a row
pnpm supabase:web:reset
/test 3
/test 3

# Run full test suite to ensure no regressions
/test

# Manual verification
pnpm --filter web-e2e test:shard-3
pnpm --filter web-e2e test:shard-3  # Again - should pass
```

**Expected Result**: All tests pass both runs, no regressions detected, password update test succeeds in both runs

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run only E2E tests
pnpm --filter web-e2e test

# Run shard 3 multiple times
for i in 1 2 3; do echo "Run $i"; /test 3; done
```

## Dependencies

### New Dependencies (if any)

No new external dependencies required - uses existing Supabase client and Playwright APIs.

**No new dependencies required**

## Database Changes

**Migration needed**: no

No schema or data migration needed. Fix uses existing auth.users table and password hash fields.

## Deployment Considerations

**Deployment Risk**: low

This fix is test-only (E2E tests directory) and doesn't affect production code or database schema.

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: fully maintained

No changes to app code, only test infrastructure improvements.

## Success Criteria

The fix is complete when:
- [ ] `test.afterEach` hook added to `account.spec.ts`
- [ ] Database utility functions created in separate file
- [ ] Password update test passes first run
- [ ] Password update test passes second run (password was restored)
- [ ] Full test suite passes with zero regressions
- [ ] Unit tests for database utilities pass
- [ ] Manual testing checklist complete
- [ ] Test execution time acceptable (<5% increase)
- [ ] No "Invalid login credentials" errors on subsequent runs
- [ ] Code passes `pnpm typecheck` and `pnpm lint`

## Notes

### Decision Rationale

This fix represents the minimal, surgical approach to solving the root cause. Rather than skip the test (losing coverage) or restructure test infrastructure (adding complexity), we simply restore the database state after the test completes. This is a standard pattern in E2E testing frameworks and aligns with Playwright's cleanup patterns.

### Reusability

The database utility functions created here can be reused for other tests that need to restore database state, making this a foundation for future test isolation improvements.

### Testing Philosophy

This fix embodies the project's testing philosophy: when tests fail, fix the code (test code in this case), not the problem. The password update test is valuable because it validates the complete user journey. Rather than discard this validation, we ensure it doesn't break subsequent runs by restoring state.

### Related Issues Pattern

This is the third occurrence of this issue pattern (#565, #662, #715). The fix addresses the root cause (state mutation) directly, preventing this from recurring.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #715*
