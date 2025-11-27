# Bug Fix: E2E Shard 4 Tests Timeout During Fresh Authentication

**Related Diagnosis**: #737 (REQUIRED)
**Severity**: critical
**Bug Type**: e2e
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Tests explicitly clear authentication storage state and attempt fresh login flows, triggering Supabase auth API timeouts instead of using pre-authenticated browser states
- **Fix Approach**: Replace fresh login attempts with pre-authenticated browser storage states in affected test describe blocks
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shard 4 tests that clear pre-authenticated storage state and attempt fresh login flows are timing out waiting for Supabase auth API responses after 15 seconds. The `Team Account Management` describe block in `admin.spec.ts` and the full invitation flow test in `invitations.spec.ts` both explicitly clear all authentication state with `test.use({ storageState: { cookies: [], origins: [] } })`, then attempt to re-authenticate by calling `auth.loginAsUser()`. This triggers fresh login attempts that fail to complete, while tests using pre-authenticated sessions work correctly (4/10 pass rate in Shard 4).

For full details, see diagnosis issue #737.

### Solution Approaches Considered

#### Option 1: Use Pre-Authenticated Browser States ⭐ RECOMMENDED

**Description**: Replace cleared storage state with pre-authenticated browser storage states (OWNER_USER or TEST_USER from `.auth/` files) in the affected test describe blocks. Pre-authenticate in global setup, then reuse those states in subsequent tests.

**Pros**:
- Eliminates fresh login timeouts completely
- Tests already use this pattern successfully (40% pass rate)
- Pre-authenticated states are generated once in global setup, making tests faster
- Minimal code changes - one line per describe block
- Matches existing project patterns and conventions
- No API network calls needed during test execution
- Fully reliable across CI and local environments

**Cons**:
- Doesn't test the fresh login flow itself
- Tests don't cover end-to-end authentication from scratch
- May miss auth-specific issues that occur during fresh login

**Risk Assessment**: Low - This is the standard pattern used throughout the project for authenticated tests. Well-tested and proven reliable.

**Complexity**: Simple - One-line changes to storage state configuration.

#### Option 2: Fix the Fresh Login Flow Implementation

**Description**: Investigate and fix the underlying auth timeout in the `loginAsUser()` method to handle fresh login flows more reliably. Add retries, improve timeouts, or fix async handling in the signIn flow.

**Pros**:
- Allows testing of full fresh login flows
- Discovers and fixes actual auth integration issues
- More thorough coverage of authentication

**Cons**:
- Complex troubleshooting required (Supabase client, React Query hydration, network timing)
- Would require extensive debugging to identify the root cause
- High risk of regression or breaking other auth flows
- Auth timeout may be environmental (local Supabase latency, CI network conditions)
- Estimated effort is large (6-8+ hours)
- Doesn't match existing project test patterns

**Why Not Chosen**: The diagnosis and project patterns show that pre-authenticated states are the standard approach for E2E testing in this codebase. Tests using pre-authenticated states pass reliably. Fresh login flows have environmental sensitivities (Supabase response times vary by environment). The fix approach directly addresses the Shard 4 timeout issue without the complexity and risk of trying to fix underlying auth flows.

#### Option 3: Add Retries and Timeout Adjustments to Fresh Login

**Description**: Implement automatic retries with exponential backoff and increase timeout values in the `loginAsUser()` method when fresh authentication is attempted.

**Pros**:
- Attempts to preserve fresh login testing
- May help with flaky Supabase API responses
- Lower risk than full rewrite of auth flow

**Cons**:
- Masks root cause rather than solving it
- Adds complexity to the auth helper
- Still may not resolve timeouts in constrained CI environments
- Doesn't align with project conventions
- Tests would remain slow and unpredictable

**Why Not Chosen**: This approach treats the symptom, not the cause. The diagnosis clearly shows that pre-authenticated states work reliably, so the best solution is to use them. Retries would only slow down test execution without solving the fundamental issue.

### Selected Solution: Use Pre-Authenticated Browser States

**Justification**: This approach is the optimal solution because:

1. **Directly Addresses Root Cause**: The diagnosis identifies that tests using pre-authenticated states (40% pass rate) work correctly, while fresh login attempts timeout. Using pre-authenticated states eliminates the timeout issue entirely.

2. **Aligns with Project Conventions**: The codebase already uses pre-authenticated states successfully for all other authenticated tests. This fix makes Shard 4 consistent with the rest of the test suite.

3. **Minimal Risk**: One-line changes to storage state configuration. No changes to authentication logic, API calls, or complex helper methods.

4. **Fast Execution**: Pre-authenticated states eliminate network calls during test execution, making tests faster and more reliable.

5. **Proven Pattern**: The project demonstrates this pattern works across both local and CI environments. 40% of Shard 4 tests already pass using this approach.

6. **Small Effort**: Estimated 30 minutes to 1 hour for implementation and validation.

**Technical Approach**:
- Replace `test.use({ storageState: { cookies: [], origins: [] } })` with `test.use({ storageState: AUTH_STATES.OWNER_USER })` in affected describe blocks
- Remove redundant authentication calls in beforeEach that are no longer needed
- Verify all affected tests pass with pre-authenticated state
- Run full Shard 4 test suite to confirm fix

**Architecture Changes**: None - this change uses existing auth state infrastructure already in place.

**Migration Strategy**: Not applicable - pre-authenticated states are already established during test setup.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/admin/admin.spec.ts:265-317` - Team Account Management describe block clears storage state and attempts fresh login for test2@slideheroes.com (OWNER_USER)
- `apps/e2e/tests/invitations/invitations.spec.ts:102-120` - Full Invitation Flow describe block clears storage state and attempts fresh login

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Admin Tests Storage State

Modify the Team Account Management describe block to use pre-authenticated OWNER_USER state instead of clearing storage.

- Replace `test.use({ storageState: { cookies: [], origins: [] } })` with `test.use({ storageState: AUTH_STATES.OWNER_USER })`
- This matches the test user email (test2@slideheroes.com) that was being used for fresh login
- Verify the import for AUTH_STATES is present at top of file
- Review beforeEach hook to ensure it still works with pre-authenticated state (should skip explicit login)

**Why this step first**: This is the primary failing describe block with 4 failing tests. Fixing it will restore 40% of Shard 4 pass rate.

#### Step 2: Update Invitations Tests Storage State

Modify the Full Invitation Flow describe block to use pre-authenticated state.

- Replace `test.use({ storageState: { cookies: [], origins: [] } })` with `test.use({ storageState: AUTH_STATES.OWNER_USER })`
- Ensure AUTH_STATES is imported
- Review and update the beforeEach hook if needed to work with pre-authenticated state

#### Step 3: Verify Test Logic with Pre-Authenticated State

Review both test files to ensure test logic is compatible with pre-authenticated users:

- Confirm OWNER_USER state provides necessary permissions for admin actions (account management, invitations)
- Verify user context and account associations are correct
- Ensure tests don't rely on testing fresh login/account creation flow specifically
- If tests need to test fresh login flows, create separate describe blocks using fresh login (optional optimization)

#### Step 4: Run Shard 4 Tests

Execute the affected tests locally to verify the fix:

```bash
pnpm --filter web-e2e test:shard4
```

**Expected outcome**: All tests in Shard 4 should pass (currently 4/10 passing, expect 10/10 after fix)

#### Step 5: Run Full E2E Test Suite

Verify no regressions in other test shards:

```bash
pnpm test:e2e
```

**Expected outcome**: All E2E tests pass; no new failures introduced

#### Step 6: Validate Code Quality

Ensure code meets project standards:

```bash
pnpm lint
pnpm typecheck
pnpm format
```

## Testing Strategy

### Unit Tests

No unit tests needed - this is a test infrastructure fix, not application code changes.

### Integration Tests

No integration tests needed - pre-authenticated states are already tested by the global setup and all other authenticated tests.

### E2E Tests

**Affected test files**:
- `apps/e2e/tests/admin/admin.spec.ts` - Team Account Management (4 tests)
- `apps/e2e/tests/invitations/invitations.spec.ts` - Full Invitation Flow (2 tests)

**Manual Testing Checklist**

Execute these manual tests before considering the fix complete:

- [ ] Run admin tests locally: `pnpm --filter web-e2e test:shard4` - All 4 Team Account Management tests pass
- [ ] Run invitations tests locally: `pnpm --filter web-e2e test:shard4` - Full Invitation Flow tests pass
- [ ] Run full Shard 4 suite: All 10 tests pass
- [ ] Run full E2E test suite: All test shards pass with no new failures
- [ ] Verify no authentication-related console errors in Playwright report
- [ ] Confirm test execution time is reasonable (no hangs or timeouts)
- [ ] Check CI pipeline: Shard 4 passes in GitHub Actions

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Test Logic Incompatibility with Pre-Authenticated State**: Tests may assume fresh user creation or specific account state
   - **Likelihood**: Low - Tests already work with pre-authenticated states in other test suites
   - **Impact**: Medium - Tests would fail and need adjustment
   - **Mitigation**: Review beforeEach logic to ensure it's compatible with pre-authenticated users. OWNER_USER provides admin/team owner permissions needed for both test suites.

2. **Account/Permission Misalignment**: OWNER_USER state may not have required permissions for specific admin actions
   - **Likelihood**: Low - OWNER_USER is created as team owner with full permissions
   - **Impact**: Medium - Specific tests would fail
   - **Mitigation**: Verify OWNER_USER permissions match requirements. If needed, use different auth state or adjust test expectations.

3. **Regression in Other Tests**: Changes to storage state handling could affect other tests
   - **Likelihood**: Very Low - Only modifying specific describe blocks, not core infrastructure
   - **Impact**: Medium - Other tests could fail
   - **Mitigation**: Run full E2E test suite to verify no regressions. Pre-authenticated states are already used throughout project.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the two storage state changes in admin.spec.ts and invitations.spec.ts
2. Run Shard 4 tests to confirm revert works
3. Investigate alternative approaches (retry logic, timeout adjustments)
4. Re-assess with team if fresh login testing is actually needed

**Monitoring** (if needed):

- Monitor Shard 4 pass rate in CI: should jump from 40% to 100%
- Watch for any authentication-related flakiness in Shard 4 after fix
- Track execution time: should be stable or slightly faster

## Performance Impact

**Expected Impact**: Minimal positive impact

Pre-authenticated states eliminate network calls to Supabase auth API during test execution, making tests:
- Faster (no 15-second timeout wait)
- More reliable (no network dependency)
- More consistent across environments (local and CI)

**Performance Testing**:
- Baseline: Current Shard 4 tests timeout after 15+ seconds per failed test
- After fix: Tests should execute normally with no timeouts
- Verification: Check Playwright HTML report for execution times

## Security Considerations

**Security Impact**: None

This fix does not introduce security implications:
- Pre-authenticated states are test fixtures only, never used in production
- No changes to authentication logic or credential handling
- All auth_states are generated during test setup from test environment only
- No real credentials or secrets exposed

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run Shard 4 tests - should show 4/10 passing with auth timeouts
pnpm --filter web-e2e test:shard4
```

**Expected Result**: 4 tests pass, 6 tests fail with Supabase auth API timeout errors after 15 seconds

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run Shard 4 tests - should all pass
pnpm --filter web-e2e test:shard4

# Run full E2E test suite to check for regressions
pnpm test:e2e
```

**Expected Result**: All commands succeed, all tests pass (10/10 in Shard 4), no auth timeouts, no regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks - run other auth-dependent tests
pnpm --filter web-e2e test:shard1
pnpm --filter web-e2e test:shard2
pnpm --filter web-e2e test:shard3
```

**Expected Result**: All test suites pass with no auth-related failures.

## Dependencies

### New Dependencies (if any)

No new dependencies required.

All necessary infrastructure (AUTH_STATES, pre-authenticated browser storage) already exists in the codebase.

## Database Changes

**Migration needed**: No

This fix does not involve database changes. It only modifies E2E test configuration to use existing pre-authenticated states.

## Deployment Considerations

**Deployment Risk**: None

This is a test infrastructure fix with no impact on application code or deployment:
- No production code changes
- No migrations required
- No environment configuration changes
- No infrastructure changes

**Feature flags needed**: No

**Backwards compatibility**: Maintained

This fix doesn't change any APIs, interfaces, or application behavior.

## Success Criteria

The fix is complete when:
- [ ] All 4 Team Account Management tests pass (admin.spec.ts)
- [ ] All Full Invitation Flow tests pass (invitations.spec.ts)
- [ ] Shard 4 overall pass rate is 100% (10/10 tests)
- [ ] No auth timeouts or 15-second waits
- [ ] Full E2E test suite passes with no regressions
- [ ] Code passes lint, format, and typecheck
- [ ] Playwright HTML report shows all tests executing successfully
- [ ] Manual testing checklist is complete

## Notes

**Implementation Notes**:
- The fix is straightforward: replace one line in each describe block
- AUTH_STATES is already imported in both test files
- OWNER_USER corresponds to test2@slideheroes.com, which is the email used for fresh login in the current tests
- Pre-authenticated states are generated in global setup before tests run

**Testing Notes**:
- Shard 4 currently has a 40% pass rate (4/10 tests). This fix should bring it to 100%.
- The diagnosis report shows clear evidence that pre-authenticated tests work correctly
- Both affected tests are in admin/team management, which require OWNER_USER permissions

**Decision Rationale**:
This is not about "fixing" Supabase authentication or the login flow. The diagnosis clearly shows that the project's standard pattern (pre-authenticated states) works reliably. The tests were incorrectly attempting fresh login flows, which is unnecessary for most admin/team management testing. Pre-authenticated states align with project conventions and test best practices.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #737*
