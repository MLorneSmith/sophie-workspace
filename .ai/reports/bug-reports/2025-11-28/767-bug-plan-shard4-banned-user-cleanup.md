# Bug Fix: E2E Test Shard 4 Leaves Test User Banned After Ban User Flow Test

**Related Diagnosis**: #766 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The "ban user flow" test bans `test1@slideheroes.com` without any cleanup mechanism to unban the user after test completion
- **Fix Approach**: Add a `test.afterEach()` hook to the "Personal Account Management" test suite that unbans the user using a new `unbanUser()` utility function
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `ban user flow` test in `apps/e2e/tests/admin/admin.spec.ts` at line 102 bans `test1@slideheroes.com` via the admin UI. This test has no cleanup mechanism, leaving the user in a banned state. On the next test run, the global setup fails to authenticate the banned user, causing all subsequent tests to fail.

For full details, see diagnosis issue #766.

### Solution Approaches Considered

#### Option 1: Add `test.afterEach()` hook with database utility ⭐ RECOMMENDED

**Description**: Create a new utility function `unbanUser(email: string)` in `database-utilities.ts` that directly updates the `banned_until` column to `null` in the `auth.users` table. Add a `test.afterEach()` hook in the "Personal Account Management" describe block that calls this utility after each test.

**Pros**:
- Follows established pattern from `account.spec.ts` which uses `test.afterEach()` with `restoreOriginalPassword()`
- Direct database access ensures cleanup happens regardless of UI state
- Minimal code changes, easy to understand and maintain
- Works for all tests in the describe block, not just "ban user flow"
- Consistent with existing test cleanup patterns in the codebase

**Cons**:
- Requires direct database access (similar to password restoration already in use)
- Adds one more network call per test (minimal performance impact)

**Risk Assessment**: low - Uses same pattern as existing password restoration code

**Complexity**: simple - Follows proven pattern

#### Option 2: Add cleanup to the "ban user flow" test only

**Description**: Add an `afterEach` hook only within the "ban user flow" test that runs the unban utility.

**Pros**:
- Cleanup is localized to the specific test

**Cons**:
- Less comprehensive - other tests in "Personal Account Management" suite could leave data dirty
- Doesn't follow the pattern established in `account.spec.ts` which cleans up after ALL tests in the suite
- Misses opportunity to ensure clean state for all admin operations

**Why Not Chosen**: The established pattern in `account.spec.ts` demonstrates that suite-level cleanup is preferred. The test suite shares test data (testUserEmail), so cleaning up once per test is the appropriate scope.

#### Option 3: Add cleanup to beforeEach hook instead

**Description**: Ensure user is unbanned before each test by checking and unbanming if needed in the `beforeEach` hook.

**Pros**:
- Defensive approach - ensures clean state before each test

**Cons**:
- Doesn't prevent the actual problem (tests leaving dirty state)
- Adds extra database calls at test start even when unnecessary
- Cleanup should happen at the end of a test, not at the beginning of the next test

**Why Not Chosen**: Cleanup at test end is more idiomatic in Playwright and follows established patterns.

### Selected Solution: Add `test.afterEach()` hook with database utility

**Justification**: This approach is the best choice because:
1. It follows the established pattern in `account.spec.ts` for test state restoration
2. It's simple, low-risk, and minimal code change
3. Direct database access ensures cleanup works regardless of UI state
4. The utility function is reusable for future ban/unban cleanup needs
5. It makes the test suite idempotent - multiple test runs don't accumulate dirty state

**Technical Approach**:
- Add a new function `unbanUser(email: string)` to `apps/e2e/tests/utils/database-utilities.ts`
- This function will update `banned_until = null` in the `auth.users` table for the given email
- Add a `test.afterEach()` hook in the "Personal Account Management" describe block
- The hook will call `unbanUser(testUserEmail)` after each test completes
- Include error handling similar to the password restoration cleanup (try/catch, log warning but don't fail)

**Architecture Changes**: None - this is a localized cleanup mechanism following existing patterns

**Migration Strategy**: Not needed - this is a pure addition with no breaking changes

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/utils/database-utilities.ts` - Add `unbanUser()` utility function that updates `banned_until` to `null`
- `apps/e2e/tests/admin/admin.spec.ts` - Add `test.afterEach()` hook and import the new utility

### New Files

No new files are needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add `unbanUser()` utility function to database-utilities.ts

<describe what this step accomplishes>

Add a new async function `unbanUser(email: string)` to `apps/e2e/tests/utils/database-utilities.ts` that:
- Uses the same database connection pattern as the existing `updatePasswordHashInDatabase()` function
- Executes an UPDATE query to set `banned_until = null` where `email = $1`
- Returns a boolean indicating success (whether the user was found and updated)

**Why this step first**: The utility function must exist before it can be imported and used in the test file. This is a dependency for Step 2.

Specific SQL:
```sql
UPDATE auth.users SET banned_until = NULL, updated_at = now() WHERE email = $1
```

- Export the new function so it can be imported in test files

#### Step 2: Add `test.afterEach()` hook to admin.spec.ts

<describe what this step accomplishes>

In the "Personal Account Management" describe block (line 59-236):
- Import the new `unbanUser` function from database-utilities
- Add a `test.afterEach()` hook after the `test.beforeEach()` hook (around line 75)
- The hook should call `unbanUser(testUserEmail)` with error handling

**Implementation details**:
```typescript
test.afterEach(async () => {
	try {
		const restored = await unbanUser(testUserEmail);
		if (restored) {
			console.log(
				"[admin.spec.ts] User unbanned after test: " + testUserEmail,
			);
		}
	} catch (error) {
		console.warn(
			"[admin.spec.ts] Failed to unban user:",
			error instanceof Error ? error.message : error,
		);
	}
});
```

This follows the same error-handling pattern as the password restoration in `account.spec.ts`.

**Why this step after Step 1**: The utility function must be imported and available before we can call it.

#### Step 3: Add/update tests for the unban utility

<describe what this step accomplishes>

Verify that the `unbanUser()` function works correctly:
- The existing "ban user flow" test (line 102-147) will implicitly test that banning works
- The existing "reactivate user flow" test (line 149-192) will test that reactivation works
- With the afterEach hook in place, subsequent test runs will verify that the cleanup works

No new tests are required - the cleanup is validated by the fact that shard 4 tests will pass on subsequent runs.

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test that shard 4 can be run multiple times without the banned user causing failures
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

No new unit tests needed. The `unbanUser()` function is straightforward database utility following the same pattern as `updatePasswordHashInDatabase()`.

### Integration Tests

No new integration tests needed - the cleanup is validated by the E2E test suite itself.

### E2E Tests

The existing E2E tests in `admin.spec.ts` will validate the fix:
- Run `/test 4` once, then again to verify the banned user doesn't block the second run
- The "ban user flow" test (line 102-147) verifies banning works
- The "reactivate user flow" test (line 149-192) verifies reactivation works
- With the afterEach hook, all tests in "Personal Account Management" will have clean user state

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/test 4` to execute shard 4 tests
- [ ] Verify all tests pass (especially "ban user flow" and "reactivate user flow")
- [ ] Immediately run `/test 4` again without resetting the database
- [ ] Verify tests pass on the second run (the banned user should be unbanned by the cleanup)
- [ ] Verify test output includes cleanup logs: "[admin.spec.ts] User unbanned after test"
- [ ] Check that no test failures occur due to user state pollution
- [ ] Run full E2E suite to verify no regressions in other test suites

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Database connection failure during cleanup**: If the database is unavailable during cleanup, the error is logged but the test still passes (doesn't fail the test). This is intentional - test cleanup failures shouldn't cause test failures.
   - **Likelihood**: low
   - **Impact**: medium (test leaves dirty state if cleanup fails)
   - **Mitigation**: Error logging makes it visible; the try/catch ensures test doesn't fail; subsequent test runs will attempt cleanup again

2. **User not found in database**: If the user is not in the database (edge case), the update returns 0 rows. The function returns false but doesn't error.
   - **Likelihood**: very low (users are created before tests run)
   - **Impact**: low (user wasn't in dirty state anyway)
   - **Mitigation**: Test setup creates the user; if it doesn't exist, the ban wouldn't have worked either

3. **Concurrent test runs interfering**: If tests run in parallel, both might unban the same user. This is safe - both queries succeed without issue.
   - **Likelihood**: low (tests are properly scoped)
   - **Impact**: low (updating same user to non-banned state is idempotent)
   - **Mitigation**: Database query is idempotent; no harmful side effects

**Rollback Plan**:

If this fix causes unexpected issues in E2E test runs:
1. Remove the `test.afterEach()` hook from `admin.spec.ts` (around line 76)
2. Remove the `unbanUser` import and function export from `database-utilities.ts`
3. The test suite will revert to original behavior (users left in banned state)
4. Run `/supabase:web:reset` to reset the database if needed

**Monitoring** (if needed):

After this fix is deployed:
- Monitor shard 4 test runs to verify they consistently pass on consecutive runs
- Check test logs for the cleanup message: "[admin.spec.ts] User unbanned after test"
- Watch for any "Failed to unban user" warnings in test output

## Performance Impact

**Expected Impact**: minimal

The fix adds one database UPDATE query per test in the "Personal Account Management" describe block. This is:
- One query after each of 3 tests (displays personal account details, ban user flow, reactivate user flow, delete user flow) = 3-4 extra queries
- Each query is fast (<50ms typically)
- Adds ~200ms total to test suite execution time (negligible)

**Performance Testing**:
- No additional performance testing needed; the overhead is minimal
- Verify test suite completion time doesn't degrade significantly

## Security Considerations

**Security Impact**: none

This fix:
- Uses direct database access (same as existing password restoration)
- Runs in test environment only (not in production)
- Only modifies test user state
- No new security concerns introduced

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run shard 4 tests once
pnpm --filter web-e2e test:shard4

# Run shard 4 tests again immediately (without resetting database)
pnpm --filter web-e2e test:shard4

# Second run should fail during global setup with authentication error for banned user
```

**Expected Result**: Second run fails because `test1@slideheroes.com` is banned from first run

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 4 tests
pnpm --filter web-e2e test:shard4

# Run shard 4 tests again immediately (without resetting database)
pnpm --filter web-e2e test:shard4

# Verify cleanup logs appear
pnpm --filter web-e2e test:shard4 2>&1 | grep "User unbanned after test"

# Run full E2E suite for regression testing
pnpm --filter web-e2e test

# Run tests multiple times to verify idempotency
pnpm --filter web-e2e test:shard4
pnpm --filter web-e2e test:shard4
pnpm --filter web-e2e test:shard4
```

**Expected Result**: All commands succeed, second shard 4 run passes without global setup authentication errors, cleanup logs appear, multiple consecutive runs all pass.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Check other E2E test suites still pass
pnpm --filter web-e2e test:shard1
pnpm --filter web-e2e test:shard2
pnpm --filter web-e2e test:shard3
pnpm --filter web-e2e test:shard5
```

## Dependencies

### New Dependencies (if any)

No new dependencies are required. The implementation uses:
- Existing `pg` package (already used by `updatePasswordHashInDatabase()`)
- Existing `getSupabaseConfig()` utility (already in use)
- Playwright's `test.afterEach()` (built-in)

**No new dependencies added**

## Database Changes

**Migration needed**: no

**Changes**: None to schema or migrations. The fix uses existing `auth.users` table and `banned_until` column. Only queries existing structure.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - this is a pure addition with no breaking changes

## Success Criteria

The fix is complete when:
- [ ] `unbanUser()` function is added to `database-utilities.ts` and exported
- [ ] `test.afterEach()` hook is added to admin.spec.ts
- [ ] All validation commands pass
- [ ] Shard 4 tests pass on first run
- [ ] Shard 4 tests pass on second consecutive run (without database reset)
- [ ] No regressions in other E2E test suites
- [ ] Cleanup logs appear in test output
- [ ] Code review approved (if applicable)
- [ ] Test user remains unbanned after test suite completes

## Notes

This fix addresses the root cause identified in diagnosis #766. The pattern follows the established cleanup mechanism in `account.spec.ts:26` for password restoration, adapted for user banning cleanup.

The key insight is that E2E tests must leave the database in a clean state for subsequent test runs. The "ban user flow" test is the only test in shard 4 that modifies the user's banned state, and now it will properly clean up after itself.

Related issues:
- Issue #766 - Diagnosis: E2E Test Shard 4 Leaves Test User Banned After Ban User Flow Test
- Issue #765 - Similar issue with serial test mode that also affects shard 4

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #766*
