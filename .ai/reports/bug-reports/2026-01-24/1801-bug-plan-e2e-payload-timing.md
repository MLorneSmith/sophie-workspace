# Bug Fix: E2E Payload Shards - Timing Issue with unlockPayloadUser()

**Related Diagnosis**: #1800 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `test.beforeAll()` executes before Playwright's `webServer` starts Payload CMS, causing `payload.users` table to not exist when `unlockPayloadUser()` runs
- **Fix Approach**: Wrap `unlockPayloadUser()` query in try-catch to gracefully handle missing table
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E test shards 7, 8, and 9 fail with `relation "payload.users" does not exist` because:

1. `payload-auth.spec.ts:23` calls `unlockPayloadUser()` in `test.beforeAll()`
2. Playwright's `test.beforeAll()` hook runs BEFORE the `webServer` configuration starts the Payload CMS server
3. The Payload CMS server creates the `payload.users` table during initialization
4. Since `beforeAll()` runs first, the table doesn't exist when the query executes

The sequence is:
- Test execution starts → `test.beforeAll()` runs immediately
- `test.beforeAll()` calls `unlockPayloadUser()`
- `unlockPayloadUser()` tries to query `payload.users` table → **fails** (table doesn't exist yet)
- Separately, Playwright's `webServer` configuration eventually starts Payload CMS
- Payload initializes and creates `payload.users` table (too late)

This explains why shards 1-6 and 10-12 pass (they likely don't call database utilities in `beforeAll()`) while shards 7-9 fail.

For full context, see diagnosis issue #1800.

### Solution Approaches Considered

#### Option 1: Gracefully Handle Missing Table ⭐ RECOMMENDED

**Description**: Wrap the database query in try-catch. If the table doesn't exist, return `false` and log a message. This is safe because if the table doesn't exist, there's no locked user to unlock anyway.

**Pros**:
- Minimal code change (5-10 lines in one function)
- No architectural changes needed
- Defensive programming - handles edge case gracefully
- Query will succeed once Payload initializes (eventual consistency)
- Doesn't mask real errors (will still catch other database issues)

**Cons**:
- Silent failure if table never gets created (unlikely in test scenario)
- Doesn't fix the root timing issue (still accessing table before it exists)

**Risk Assessment**: low - we're only adding error handling, not changing logic

**Complexity**: simple - basic try-catch block

#### Option 2: Wait for Payload Server to Start

**Description**: Add a wait/retry mechanism in `unlockPayloadUser()` to poll until the `payload.users` table exists before executing the query.

**Pros**:
- Actually waits for the server to be ready
- More robust for timing issues
- Ensures table exists before query

**Cons**:
- More complex (retry logic, polling, timeout)
- Could hide timing issues in test setup
- Adds latency to every test execution
- Requires parameterizing retry behavior

**Why Not Chosen**: Overkill for this scenario. The try-catch approach is simpler and safer. We shouldn't mask the timing issue in the test setup - if it becomes a real problem, it would indicate a deeper test architecture issue.

#### Option 3: Move unlockPayloadUser() to test.beforeEach()

**Description**: Move the `unlockPayloadUser()` call from `test.beforeAll()` to `test.beforeEach()` so it runs after the server has started.

**Pros**:
- Guaranteed timing (beforeEach runs after server startup)

**Cons**:
- Runs unlock on every test (inefficient)
- Changes test semantics
- Defeats the purpose of beforeAll (run once for all tests)
- Could mask authentication state issues

**Why Not Chosen**: Not necessary and inefficient. The try-catch approach is better.

### Selected Solution: Gracefully Handle Missing Table

**Justification**: This approach is the safest and simplest. The timing issue won't cause test failures because:

1. When `unlockPayloadUser()` runs and the table doesn't exist, it catches the error and returns `false`
2. The test continues (no hard failure)
3. By the time the test actually needs to access Payload (`beforeEach` or test body), the server has started and the table exists
4. We're not masking real database errors - only the "table doesn't exist" error

This is defensive programming at the boundary where we don't have control over server startup timing.

**Technical Approach**:
- Catch `PostgreSQL` error for "relation does not exist"
- Log a message for observability
- Return `false` to indicate no user was unlocked
- Let other errors propagate (they indicate real problems)

**Architecture Changes**: None required - this is contained to one utility function

**Migration Strategy**: Not applicable - no data migration needed

## Implementation Plan

### Affected Files

- `apps/e2e/tests/utils/database-utilities.ts:329-356` - Add error handling for missing `payload.users` table

### New Files

None - this is a fix within existing code

### Step-by-Step Tasks

#### Step 1: Add Error Handling to unlockPayloadUser()

Update the `unlockPayloadUser()` function to catch the "relation does not exist" error:

- Wrap the `client.query()` call in try-catch
- Catch specifically for PostgreSQL error code `42P01` (undefined_table)
- Return `false` if table doesn't exist
- Log message for observability: `[database-utilities] Payload users table not ready yet (server may still be initializing)`
- Re-throw other errors to preserve error detection
- Keep existing success logging behavior

**Why this step**: This is the core fix that handles the timing issue gracefully.

#### Step 2: Verify Test Behavior

After the change, verify that:
- `unlockPayloadUser()` returns `false` when table doesn't exist (during server startup)
- `unlockPayloadUser()` returns `true` when table exists and user is found (during actual tests)
- Other database errors still propagate (validation that we're not over-catching)
- Tests don't fail when function returns `false`

**Why this step**: Ensures the fix works correctly without masking real errors.

#### Step 3: Run E2E Tests Locally

Execute the Payload auth tests to verify shards 7-9 now pass:

```bash
pnpm --filter web-e2e test:shard7 -- --project=payload
pnpm --filter web-e2e test:shard8 -- --project=payload
pnpm --filter web-e2e test:shard9 -- --project=payload
```

**Why this step**: Validates the fix works in the actual test environment.

#### Step 4: Run Full E2E Suite

Execute the complete E2E test suite to ensure no regressions:

```bash
pnpm --filter web-e2e test
```

**Why this step**: Ensures no other tests are affected by the change.

#### Step 5: Verify Types and Code Quality

Run linting and type checking:

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

**Why this step**: Maintains code quality standards.

## Testing Strategy

### Unit Tests

Not applicable for this change - the function is tested through E2E tests.

### Integration Tests

Not applicable - the function is database integration itself.

### E2E Tests

**Test shards to verify**:
- ✅ Shard 7 (Payload tests) - should pass 9 tests without timeout
- ✅ Shard 8 (Payload tests) - should pass without timeout
- ✅ Shard 9 (Payload tests) - should pass without timeout
- ✅ Shards 1-6, 10-12 - should continue passing (no regressions)

**Regression tests**:
- Shard 7: `Payload CMS - Authentication & First User Creation` test suite should complete
- All other Payload tests should pass

### Manual Testing Checklist

Execute these tests to verify the fix:

- [ ] Run shard 7 tests locally - all should pass
- [ ] Run shard 8 tests locally - all should pass
- [ ] Run shard 9 tests locally - all should pass
- [ ] Verify no console errors during test execution
- [ ] Verify no new timeouts introduced
- [ ] Check that Payload admin page loads correctly in tests
- [ ] Verify database access works correctly during tests
- [ ] Test with fresh Payload server startup (simulate CI conditions)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Over-catching Errors**: If we catch too broadly, we might hide real database errors
   - **Likelihood**: low
   - **Impact**: medium (real errors not detected)
   - **Mitigation**: Catch only PostgreSQL error code `42P01` (undefined_table), let others propagate

2. **Silent Failures**: If the table never gets created, the unlock will silently fail without indication
   - **Likelihood**: very low (test infrastructure will always create table)
   - **Impact**: low (tests won't break, just won't unlock user)
   - **Mitigation**: Log message when table doesn't exist for observability

3. **Performance Impact**: No negative impact expected; adding error handling doesn't slow down the happy path

**Rollback Plan**:

If this causes issues in production:

1. Revert the change in `database-utilities.ts`
2. Investigate why the table isn't being created during server initialization
3. Consider moving `unlockPayloadUser()` call to `beforeEach()` instead
4. Consider adjusting Playwright's `webServer` timing configuration

**Monitoring** (if needed):

- Monitor test logs for the message: `[database-utilities] Payload users table not ready yet`
- If this message appears frequently in CI, it indicates the server is taking too long to initialize
- Track E2E shard 7/8/9 pass/fail rates to confirm fix effectiveness

## Performance Impact

**Expected Impact**: none

No performance regression expected. We're only adding a try-catch block which has negligible overhead. The happy path (table exists) remains unchanged.

## Security Considerations

**Security Impact**: none

This change doesn't affect security:
- No new database access patterns
- No credential exposure
- No privilege escalation
- Error handling is defensive

## Validation Commands

### Before Fix (Bug Should Reproduce)

Run this locally to see the bug (if you can):

```bash
# Start fresh Payload server
pnpm --filter payload dev:test

# In another terminal, run shard 7 tests
pnpm --filter web-e2e test:shard7 -- --project=payload
```

**Expected Result**: Test fails with `relation "payload.users" does not exist` error within first 10 seconds of test execution.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 7 tests
pnpm --filter web-e2e test:shard7 -- --project=payload

# Run shard 8 tests
pnpm --filter web-e2e test:shard8 -- --project=payload

# Run shard 9 tests
pnpm --filter web-e2e test:shard9 -- --project=payload

# Run full E2E suite to check for regressions
pnpm --filter web-e2e test
```

**Expected Result**: All commands succeed, shards 7/8/9 pass without timeouts, zero regressions.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run full E2E test suite
pnpm --filter web-e2e test

# Check that other database utilities still work
pnpm --filter web-e2e test -- --grep "database|cleanup|team"
```

## Dependencies

### New Dependencies

**None** - this fix only uses existing Node.js and PostgreSQL libraries already imported in the file.

## Database Changes

**No database changes required**

The `payload.users` table is already created by Payload CMS during initialization. This fix just handles the race condition where the code tries to access it before it exists.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a single-file change with no infrastructure impact

**Feature flags needed**: no

**Backwards compatibility**: Fully maintained - the function signature doesn't change, only internal error handling

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] Shard 7 tests pass (9 tests, no timeout)
- [ ] Shard 8 tests pass (no timeout)
- [ ] Shard 9 tests pass (no timeout)
- [ ] All E2E tests pass (zero regressions)
- [ ] Code review approved (if applicable)
- [ ] Type checking passes
- [ ] Linting passes
- [ ] No console errors or warnings
- [ ] Database cleanup still works correctly
- [ ] Other database utilities still work correctly

## Notes

**Key Insight**: This bug is a test infrastructure timing issue, not a logic error. The fix is defensive error handling to make the code robust to timing variations in test startup. Once Payload's server starts, everything works correctly.

**Related Context**:
- Diagnosis: #1800
- Previous related issues: #1796 (symptoms correct), #1797 (partial fix), #1791/#1792 (SSL issues, different problem)
- Playwright config timing: `webServer.timeout: 120 * 1000` gives 2 minutes for server startup
- The fix allows tests to tolerate server startup delays without failing

**Testing Philosophy**: This change makes tests more robust to timing issues rather than trying to control timing. This is the Unix philosophy - fail gracefully and let the higher-level orchestrator (Playwright) manage timing.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1800*
