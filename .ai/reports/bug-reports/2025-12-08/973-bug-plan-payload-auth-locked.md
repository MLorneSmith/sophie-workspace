# Bug Fix: Unlock Payload Admin User and Prevent Test Lockouts

**Related Diagnosis**: #972
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Payload admin user locked due to accumulated failed login attempts triggering brute-force protection
- **Fix Approach**: Add beforeAll hook to unlock user + configure test-specific unlock utility
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Payload admin user (`michael@slideheroes.com`) is locked out due to exceeding Payload's failed login attempt limit. This causes all authentication E2E tests to fail because the user cannot log in even with correct credentials.

For full details, see diagnosis issue #972.

### Solution Approaches Considered

#### Option 1: Add Test Setup Hook to Unlock User ⭐ RECOMMENDED

**Description**: Create a utility function that unlocks the Payload admin user by clearing the `lockUntil` and `loginAttempts` fields in the database. Add a `beforeAll` hook in the auth test suite to call this utility before tests run.

**Pros**:
- Simple, surgical fix - minimal code changes
- Works with existing test infrastructure
- No changes to Payload configuration or production behavior
- Easy to understand and maintain
- Runs automatically before auth tests
- Fast execution (<100ms)

**Cons**:
- Requires database access in tests (already available)
- Adds small overhead to test setup

**Risk Assessment**: low - Only touches test setup, doesn't affect production code or Payload configuration

**Complexity**: simple - Single utility function + one beforeAll hook

#### Option 2: Disable Lockout in Test Environment

**Description**: Configure the Payload Users collection to disable account lockout (`maxLoginAttempts: 0` or very high number) when `NODE_ENV=test`.

**Pros**:
- Prevents lockout issues entirely in tests
- No test setup hooks needed

**Cons**:
- Changes Payload collection configuration (affects production if not carefully scoped)
- Reduces test realism - doesn't test actual auth behavior
- Payload may not support per-environment auth config cleanly
- More complex configuration changes

**Why Not Chosen**: Higher risk of affecting production, reduces test fidelity, more invasive changes

#### Option 3: Create Dedicated Test User That Resets

**Description**: Create a separate test-specific Payload user that gets deleted and recreated between test runs.

**Pros**:
- Complete isolation from production user
- Fresh state every run

**Cons**:
- Requires creating/deleting users in setup/teardown
- More complex test infrastructure
- Slower (user creation + deletion adds time)
- Test credentials would differ from production user

**Why Not Chosen**: Unnecessary complexity, slower tests, doesn't fix the real issue (existing user locked)

### Selected Solution: Add Test Setup Hook to Unlock User

**Justification**: This is the simplest, lowest-risk solution that directly addresses the root cause without affecting production code or Payload configuration. It maintains test realism while ensuring tests can run reliably.

**Technical Approach**:
1. Create `unlockPayloadUser()` utility function that executes a direct SQL UPDATE
2. Add `beforeAll` hook in `payload-auth.spec.ts` to call this utility
3. Utility clears `lockUntil` and resets `loginAttempts` to 0 for the test user
4. Function is idempotent - safe to run multiple times

**Architecture Changes**: None - this is purely test infrastructure

**Migration Strategy**: Not applicable - no data migration needed

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/helpers/database-utilities.ts` - Add `unlockPayloadUser()` utility function
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Add `beforeAll` hook to unlock user

### New Files

None - all changes to existing files

### Step-by-Step Tasks

#### Step 1: Create unlockPayloadUser utility function

Add utility to existing database helpers file

- Import necessary dependencies (`getDatabaseAdapter` or direct SQL client)
- Create `unlockPayloadUser(email: string)` function
- Execute SQL: `UPDATE payload_users SET "lockUntil" = NULL, "loginAttempts" = 0 WHERE email = $1`
- Add error handling and logging
- Export function for use in tests

**Why this step first**: Foundation for the fix - need the utility before using it in tests

#### Step 2: Add beforeAll hook to auth tests

Update the auth test file to unlock user before tests run

- Import `unlockPayloadUser` utility
- Add `test.beforeAll` hook in the describe block
- Call `unlockPayloadUser(TEST_USERS.admin.email)`
- Add try/catch for error handling

#### Step 3: Verify fix works

Manual testing to confirm the fix resolves the issue

- Run `payload-auth.spec.ts` tests
- Verify all 3 auth tests pass
- Confirm no regressions in other Payload tests

#### Step 4: Add documentation

Document the solution for future reference

- Add inline comments explaining why unlock is needed
- Update test file header comment if needed
- Document the utility function purpose

## Testing Strategy

### Unit Tests

No unit tests needed - this is test infrastructure code

### Integration Tests

The auth tests themselves serve as integration tests:
- ✅ User can log in after unlock
- ✅ Session persists after page refresh
- ✅ Pre-seeded admin user works correctly

**Test files**:
- `apps/e2e/tests/payload/payload-auth.spec.ts` - Tests the fix implicitly

### E2E Tests

The existing E2E tests validate the fix:
- `should handle pre-seeded admin user correctly`
- `should login with existing user`
- `should maintain session across page refreshes`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Manually lock the user (run tests multiple times with wrong password)
- [ ] Run `payload-auth.spec.ts` - should pass with the fix
- [ ] Verify unlock happens in beforeAll (check logs/console)
- [ ] Run full Payload test suite to ensure no regressions
- [ ] Check that unlock doesn't affect other tests

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Database connection failure during unlock**:
   - **Likelihood**: low
   - **Impact**: medium (tests would fail to run)
   - **Mitigation**: Add try/catch with clear error message, tests will skip if unlock fails

2. **SQL injection** (if email not parameterized):
   - **Likelihood**: very low (test user email is hardcoded)
   - **Impact**: high
   - **Mitigation**: Use parameterized queries, never string interpolation

3. **Unlocking wrong user**:
   - **Likelihood**: very low (email is explicit)
   - **Impact**: low
   - **Mitigation**: Use exact email match with WHERE clause

**Rollback Plan**:

If this fix causes issues:
1. Remove the `beforeAll` hook from `payload-auth.spec.ts`
2. Remove or comment out the `unlockPayloadUser()` utility
3. Tests will fail again but no production impact

**Monitoring**: Not applicable - test-only changes

## Performance Impact

**Expected Impact**: minimal

- Unlock operation adds ~50-100ms to test setup
- SQL UPDATE is fast (single row, indexed email column)
- Negligible impact on overall test suite runtime

**Performance Testing**:
- Time auth test suite before/after fix
- Should be <100ms difference

## Security Considerations

**Security Impact**: none

- Changes only affect test environment
- No production code changes
- No changes to authentication logic
- Utility only accessible in test context

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Auth tests should fail with locked user error
NODE_ENV=test PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 \
  pnpm --filter web-e2e exec playwright test tests/payload/payload-auth.spec.ts --reporter=line
```

**Expected Result**: 3 tests fail with "user is locked" error or timeout at login page

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Auth tests should pass
NODE_ENV=test PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 \
  pnpm --filter web-e2e exec playwright test tests/payload/payload-auth.spec.ts --reporter=line

# Full Payload test suite
NODE_ENV=test pnpm --filter web-e2e test:group:payload
```

**Expected Result**: All commands succeed, all auth tests pass, zero regressions.

### Regression Prevention

```bash
# Run full E2E suite to ensure no regressions
NODE_ENV=test pnpm --filter web-e2e test

# Specifically verify other Payload tests still work
NODE_ENV=test pnpm --filter web-e2e exec playwright test tests/payload/
```

## Dependencies

**No new dependencies required**

All necessary database utilities already exist or can be created using existing patterns.

## Database Changes

**Migration needed**: no

**Direct SQL operations in tests**: yes (utility function executes UPDATE)

```sql
-- Operation executed by utility (idempotent, safe to run multiple times)
UPDATE payload_users
SET "lockUntil" = NULL, "loginAttempts" = 0
WHERE email = 'michael@slideheroes.com';
```

**No schema changes required**

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: none (test-only changes)

**Feature flags needed**: no

**Backwards compatibility**: maintained (no production changes)

## Success Criteria

The fix is complete when:
- [ ] `unlockPayloadUser()` utility function created
- [ ] `beforeAll` hook added to auth tests
- [ ] All 3 auth tests pass consistently
- [ ] Full Payload test suite passes
- [ ] Zero regressions detected
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

### Implementation Details

The unlock utility should follow this pattern:

```typescript
export async function unlockPayloadUser(email: string): Promise<void> {
  try {
    // Get database client (use existing pattern from database-utilities.ts)
    const result = await db.query(
      'UPDATE payload_users SET "lockUntil" = NULL, "loginAttempts" = 0 WHERE email = $1',
      [email]
    );
    console.log(`[unlockPayloadUser] Unlocked user: ${email}`);
  } catch (error) {
    console.warn(`[unlockPayloadUser] Failed to unlock user ${email}:`, error);
    // Don't throw - allow tests to proceed (they'll fail with more specific errors)
  }
}
```

### Alternative: Global Setup

Could also add this to `global-setup.ts` to unlock before ALL Payload tests, but beforeAll in auth tests is more targeted and clear about intent.

### Future Enhancement

If this becomes a recurring issue across multiple test suites, consider:
- Adding a global `--unlock-users` flag to test runner
- Creating a pre-test database cleanup script
- Configuring Payload with higher limits in test environment

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #972*
