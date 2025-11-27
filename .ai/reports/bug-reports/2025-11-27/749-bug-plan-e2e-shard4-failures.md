# Bug Fix: E2E Shard 4 Test Failures - Selector Mismatch and Ban User Error

**Related Diagnosis**: #747 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: (1) Selector mismatch in team-accounts page object (`account-selector-trigger` vs `team-selector`), (2) Ban user server action failing due to Supabase auth client issue
- **Fix Approach**: Update selector in page object to match actual component; investigate and fix ban user action error handling
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

After fixing the E2E Shard 4 auth timeout issue (#739), 6 tests continue to fail:

1. **5 tests failing due to selector mismatch**: Tests expect `data-testid="account-selector-trigger"` but the component uses `data-testid="team-selector"` in `account-selector.tsx:96`
2. **1 test failing due to ban user error**: The `banUserAction` server action throws "There was an error banning the user" error, likely due to invalid Supabase service role configuration in test environment

For full details, see diagnosis issue #747.

### Solution Approaches Considered

#### Option 1: Fix Selector + Investigate Ban User Error ⭐ RECOMMENDED

**Description**: Fix the selector mismatch immediately (simple string replacement), then investigate and resolve the ban user action error by checking server logs, verifying configuration, and improving error handling.

**Pros**:
- Solves all 6 test failures in one coherent fix
- Selector fix is trivial and unambiguous
- Investigation-based approach finds root cause of ban user error
- Minimal code changes, low risk of regressions

**Cons**:
- Ban user error requires investigation (may take time)
- Might need to check Supabase logs

**Risk Assessment**: low - Selector is a simple string change. Ban user investigation is non-destructive.

**Complexity**: simple - Selector is one-line fix. Ban user requires investigation and minimal code changes.

#### Option 2: Quick Selector Fix Only + Skip Ban User

**Description**: Fix only the selector mismatch, leave ban user error for separate investigation later.

**Pros**:
- Very quick (30 seconds)
- Reduces failing tests from 6 to 1

**Cons**:
- Leaves one test still failing
- Incomplete solution
- Requires follow-up work later

**Why Not Chosen**: Incomplete solution; should fix all issues in one plan.

### Selected Solution: Fix Selector + Investigate Ban User Error

**Justification**: This approach solves all 6 failing tests in one coordinated fix. The selector fix is trivial and unambiguous. The ban user investigation is necessary to fully resolve the issue. This gives us complete test coverage in shard 4.

**Technical Approach**:
- Update `apps/e2e/tests/_lib/page-objects/team-accounts.po.ts:84` to use `team-selector` instead of `account-selector-trigger`
- Investigate ban user action by checking server logs, Supabase configuration, and error handling
- Add better error logging to the ban user action to surface the actual Supabase error
- Verify the fix by running all affected tests

**Architecture Changes** (if any):
- None. This is a selector correction and error investigation.

**Migration Strategy** (if needed):
- None needed. Simple test fix.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/_lib/page-objects/team-accounts.po.ts:84` - Fix selector from `account-selector-trigger` to `team-selector`
- `apps/web/app/_lib/server/accounts/_lib/actions/ban-user.action.ts` - Investigate and improve error handling/logging

### New Files

None needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix Selector Mismatch

Fix the team account selector in the page object.

- Replace `[data-testid="account-selector-trigger"]` with `[data-testid="team-selector"]` in `team-accounts.po.ts:84`
- Verify this matches the actual component in `account-selector.tsx:96`
- Run affected tests to confirm they pass

**Why this step first**: This is the clearest fix and will resolve 5 of the 6 test failures immediately.

#### Step 2: Investigate Ban User Action Error

Understand why the ban user action is failing.

- Check the actual Supabase error from server logs (run test and capture error message)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is properly configured in test environment
- Check if `adminClient.auth.admin.updateUserById()` is working correctly
- Look for similar patterns in codebase for reference

**Why this step**: Understanding the root cause will inform the best fix approach.

#### Step 3: Implement Ban User Fix

Fix the ban user action error.

- Improve error logging to surface the actual Supabase error instead of generic message
- If service role key issue: verify test environment configuration
- If API issue: add retry logic or fallback handling
- Test that the fix resolves the error

#### Step 4: Validation

Verify all fixes work correctly.

- Run `NODE_ENV=test pnpm --filter web-e2e test:shard4` to execute all shard 4 tests
- Verify all 6 previously failing tests now pass
- Check for any new test failures or regressions

#### Step 5: Commit and Report

Document the changes.

- Commit changes with appropriate message
- Update test status tracking

## Testing Strategy

### Unit Tests

No new unit tests needed - this is fixing existing E2E tests.

### Integration Tests

No integration tests needed for this fix.

### E2E Tests

Verify all affected tests pass:
- ✅ `admin.spec.ts:318` - delete team account flow
- ✅ `admin.spec.ts:102` - ban user flow
- ✅ `invitations.spec.ts:26` - users can delete invites
- ✅ `invitations.spec.ts:48` - users can update invites
- ✅ `invitations.spec.ts:74` - user cannot invite member again
- ✅ `invitations.spec.ts:104` - Full Invitation Flow

**Test files**:
- `apps/e2e/tests/admin.spec.ts` - Admin flow tests
- `apps/e2e/tests/invitations.spec.ts` - Invitation flow tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `NODE_ENV=test pnpm --filter web-e2e test:shard4` in full
- [ ] All 6 previously failing tests should now pass
- [ ] No new test failures appear
- [ ] Verify the team selector is correctly triggered in the UI flows being tested

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Selector change affects other tests**: The selector change could impact other tests that depend on the page object
   - **Likelihood**: low - Selector is specific to this page object, unlikely to be used elsewhere
   - **Impact**: medium - Would cause tests to fail
   - **Mitigation**: Run full E2E test suite to verify no regressions

2. **Ban user fix introduces new error**: Changing the ban user action error handling could mask other issues
   - **Likelihood**: low - Changes are targeted and non-invasive
   - **Impact**: medium - Could introduce subtle bugs
   - **Mitigation**: Test the ban user flow thoroughly, verify actual error is surfaced correctly

**Rollback Plan**:

If this fix causes issues:
1. Revert commit with `git revert <commit-hash>`
2. Re-run tests to verify original state is restored
3. Investigate the issue in more detail

**Monitoring** (if needed):
- Monitor test results in CI to ensure consistent passes
- Watch for any new failures in shard 4 after fix is deployed

## Performance Impact

**Expected Impact**: none

These are test fixes with no performance implications.

## Security Considerations

**Security Impact**: none - These changes are test-only fixes with no production code changes.

## Validation Commands

### Before Fix (Tests Should Fail)

```bash
NODE_ENV=test pnpm --filter web-e2e test:shard4
```

**Expected Result**: 6 tests fail (5 selector timeouts, 1 ban user error)

### After Fix (Tests Should Pass)

```bash
# Run affected E2E tests
NODE_ENV=test pnpm --filter web-e2e test:shard4

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

**Expected Result**: All shard 4 tests pass, zero regressions.

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
NODE_ENV=test pnpm --filter web-e2e test
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: None - test-only changes

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Selector is updated in team-accounts.po.ts
- [ ] Ban user action error is investigated and understood
- [ ] Ban user action error is fixed
- [ ] All 6 previously failing tests now pass
- [ ] No new test failures detected
- [ ] All validation commands pass
- [ ] Zero regressions in other E2E tests

## Notes

The diagnosis issue #747 identified these root causes clearly:
- Selector mismatch appears to be from a component rename without updating the page object
- Ban user error needs investigation but is likely configuration-related

These are straightforward fixes that should resolve all remaining shard 4 failures.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #747*
