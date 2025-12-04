# Bug Fix: Team Accounts E2E tests fail with blank page - missing beforeEach setup

**Related Diagnosis**: #901 (REQUIRED)
**Severity**: high
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `beforeEach` hook in `team-accounts.spec.ts` only initializes the page object but doesn't navigate to `/home` or create a team, causing tests to attempt interactions on a blank page.
- **Fix Approach**: Add navigation to `/home` and team creation to the `beforeEach` hook, following the working pattern from `invitations.spec.ts`.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Team Accounts E2E tests (shard 12) fail with timeout errors because the `beforeEach` hook is missing critical setup steps. Tests attempt to navigate to team settings or interact with the team selector without first navigating to `/home` and creating a team. Even with pre-authenticated storage state, Playwright starts with a blank page that must be explicitly navigated.

For full details, see diagnosis issue #901.

### Solution Approaches Considered

#### Option 1: Add navigation and team creation to beforeEach ⭐ RECOMMENDED

**Description**: Update the `beforeEach` hook to include `page.goto("/home")` and `teamAccounts.createTeam()` calls, matching the working pattern established in `invitations.spec.ts`.

**Pros**:
- Simple, minimal change (3-4 lines of code)
- Follows established project pattern (proven in invitations.spec.ts)
- Ensures all tests have consistent, valid initial state
- Low risk - only adds necessary setup steps
- No breaking changes to test structure

**Cons**:
- Slightly longer setup time per test (creating a team takes ~1-2s)
- Team creation may be overkill for tests that don't need a team

**Risk Assessment**: low - This is just adding setup code following an established pattern.

**Complexity**: simple - straightforward boilerplate addition.

#### Option 2: Use setup() method from TeamAccountsPageObject

**Description**: Call `teamAccounts.setup()` in beforeEach, which handles both authentication and team creation.

**Pros**:
- Reuses existing utility method
- All setup in one call

**Cons**:
- `setup()` requires environment variables (E2E_TEST_USER_EMAIL, E2E_TEST_USER_PASSWORD)
- Creates redundant logins since tests already use pre-authenticated storage state
- More complex than needed

**Why Not Chosen**: The invitations.spec.ts pattern (our reference implementation) doesn't use `setup()` in beforeEach, and for good reason - we already have authenticated state via `AuthPageObject.setupSession()`. Adding setup() would duplicate authentication unnecessarily.

#### Option 3: Create a specialized helper method

**Description**: Extract the beforeEach setup into a reusable helper method.

**Pros**:
- Reusable across multiple test files

**Cons**:
- Over-engineering for a single use case
- Adds unnecessary complexity

**Why Not Chosen**: We only need this for the team-accounts.spec.ts file. The pattern is already established in invitations.spec.ts, so we can simply copy it.

### Selected Solution: Add navigation and team creation to beforeEach

**Justification**: This approach is the simplest, lowest-risk fix that directly mirrors the working pattern in `invitations.spec.ts`. The tests already have pre-authenticated state via `AuthPageObject.setupSession()`, so we only need to add navigation to `/home` and team creation - exactly what the diagnosis specifies and what invitations.spec.ts proves works.

**Technical Approach**:
- Add `await page.goto("/home")` to navigate to the home page
- Add `await teamAccounts.createTeam()` to create a test team with generated name
- Generate team name using the existing `teamAccounts.createTeamName()` method
- This provides a clean team state for each test to work with

**Architecture Changes**: None - this is purely adding setup steps to beforeEach.

**Migration Strategy**: Not needed - this is a bug fix that only affects test setup.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - Add navigation and team creation to the `beforeEach` hook at line 78-80

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update the beforeEach hook

Update the `beforeEach` hook in the "Team Accounts" test suite (lines 78-80) to include navigation and team creation.

- Navigate to `/home` page first (required because Playwright starts with blank page even with storageState)
- Create a team using `teamAccounts.createTeam()` with auto-generated name
- This ensures all tests start with a valid team context

**Why this step first**: This is the root cause of the bug - without this setup, tests run on a blank page and fail.

#### Step 2: Run the specific tests to verify the fix

Execute the previously failing tests to confirm they now pass:

- Run shard 12 to test both affected tests
- Verify `user can update their team name (and slug)` passes without timeout
- Verify `cannot create a Team account using reserved names` passes without element-not-found errors

#### Step 3: Run full test suite

Run the complete E2E test suite to ensure no regressions:

- All E2E tests should pass
- No other tests should be affected

#### Step 4: Validation

- Confirm shard 12 passes consistently
- Verify the test report shows both tests passing
- Check for any new errors in browser logs

## Testing Strategy

### Unit Tests

No unit tests needed - this is a test setup fix, not business logic.

### Integration Tests

No new integration tests needed.

### E2E Tests

The affected tests themselves are the validation:

**Test files**:
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts`

**Tests to verify**:
- ✅ `user can update their team name (and slug)` - Should pass without timeout
- ✅ `cannot create a Team account using reserved names` - Should pass without element-not-found errors

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/test 12` to execute shard 12 tests
- [ ] Verify both team-accounts tests pass (timeout resolved)
- [ ] Verify no new errors appear in test output
- [ ] Run full E2E suite to check for regressions
- [ ] Verify no other tests in shard 12 are broken

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Team creation takes longer per test**: <1-2s per test
   - **Likelihood**: medium (expected behavior)
   - **Impact**: low (minimal performance impact)
   - **Mitigation**: N/A - this is necessary for test validity

2. **Setup might fail if createTeam has issues**: If the `createTeam()` method itself has bugs, beforeEach setup will fail
   - **Likelihood**: low (method is proven in invitations.spec.ts)
   - **Impact**: medium (all tests in this suite would fail)
   - **Mitigation**: If setup fails, it will be immediately apparent; we're not hiding the failure

**Rollback Plan**:

If this fix causes unexpected issues:
1. Remove the navigation and team creation lines from beforeEach
2. Revert to the previous blank beforeEach (or commit to skip tests temporarily)
3. Investigate why createTeam() failed

**Monitoring** (if needed):
- Monitor test execution time to ensure setup doesn't make tests too slow
- Watch for any new failures in team-accounts tests after the fix

## Performance Impact

**Expected Impact**: minimal

Setup adds ~1-2 seconds per test (team creation overhead), which is acceptable and necessary for test validity. This is inline with how `invitations.spec.ts` operates.

**Performance Testing**:
- Verify test execution time after fix doesn't exceed ~30s for both tests
- This is normal for E2E tests with team setup

## Security Considerations

No security implications - this is purely test setup code.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Tests fail with timeout and element-not-found errors
pnpm test:shard12
# OR
/test 12
```

**Expected Result**:
- Shard 12 tests timeout or fail with element-not-found errors
- Playwright report shows blank pages in screenshots

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run specific failing tests
pnpm --filter web-e2e test:shard12
# OR
/test 12

# Run full E2E suite to check regressions
pnpm --filter web-e2e test:e2e
```

**Expected Result**: All commands succeed, both team-accounts tests pass, zero regressions.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Specific check on team-accounts and invitations tests
pnpm --filter web-e2e test:shard12
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - uses existing TeamAccountsPageObject and createTeam() method.

## Database Changes

**No database changes required** - test setup only uses existing team creation API.

## Deployment Considerations

**Deployment Risk**: none - this is a test-only change.

**Special deployment steps**: None - this doesn't affect production code.

**Feature flags needed**: no

**Backwards compatibility**: maintained - this is purely fixing broken tests.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Shard 12 tests no longer timeout or fail with element-not-found
- [ ] Both failing tests now pass
- [ ] Full E2E test suite passes (zero regressions)
- [ ] No new errors in browser console during tests
- [ ] Test execution time remains acceptable (<30s for both tests)

## Notes

This is a straightforward bug fix that applies the proven pattern from `invitations.spec.ts` to the broken `team-accounts.spec.ts` test. The root cause is well-understood from the diagnosis, and the fix is minimal and low-risk.

The `TeamAccountsPageObject.createTeam()` method already has the `toPass()` wrapper for reliability, so we don't need additional error handling in beforeEach.

Related documentation:
- **Diagnosis**: Issue #901
- **Reference pattern**: `apps/e2e/tests/invitations/invitations.spec.ts` (lines 33-48)
- **E2E testing guide**: `apps/e2e/CLAUDE.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #901*
