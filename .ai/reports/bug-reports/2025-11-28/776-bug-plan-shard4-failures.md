# Bug Fix: E2E Shard 4 Multiple Test Failures (7 of 12 Tests)

**Related Diagnosis**: #775
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Three distinct issues - impersonation API fragility, page load timing, test user state corruption
- **Fix Approach**: Use Supabase Admin API response directly, add `waitUntil` to page loads, implement robust test user reset
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E Shard 4 contains 7 failing tests across two spec files:

**admin.spec.ts failures** (3 tests):
1. `delete user flow` (line 225) - Navigation timeout
2. `can sign in as user (Impersonate)` (line 290) - Server error + timeout
3. `delete team account flow` (line 366) - Element not visible

**invitations.spec.ts failures** (4 tests):
1. `users can delete invites` (line 26) - Test timeout (120s)
2. `users can update invites` (line 48) - Test timeout (120s)
3. `cannot invite member again` (line 74) - Test timeout (120s)
4. `full invitation flow` (line 104) - Test timeout (120s)

All root causes are documented in diagnosis issue #775.

### Solution Approaches Considered

#### Option 1: Fix All Three Root Causes Holistically ⭐ RECOMMENDED

**Description**: Address all three issues with targeted fixes:
1. Refactor `impersonateUser()` to use Supabase Admin API directly instead of fragile HTTP redirect parsing
2. Add `waitUntil: "networkidle"` to team selector interactions to ensure page fully loads
3. Implement robust test user reset in `beforeAll` hook with explicit state validation

**Pros**:
- Fixes all 7 failing tests in one coordinated implementation
- Eliminates root causes rather than masking symptoms
- Improves overall test reliability for future runs
- Clear separation of concerns for each fix
- Minimal impact on existing code

**Cons**:
- Requires changes across multiple files (3 main areas)
- Needs careful sequencing to avoid interdependencies
- Moderate complexity in service refactoring

**Risk Assessment**: medium
- Impersonation API change is well-contained (service class only)
- Page load timing fix is safe (just adds explicit wait)
- Test state reset uses existing database utilities

**Complexity**: moderate
- Service refactoring: ~20 lines changed
- UI interaction fix: ~5 lines changed
- Test setup/cleanup: ~15 lines changed

#### Option 2: Add Retry Logic Only

**Description**: Wrap failing operations in `expect(...).toPass()` with custom retry intervals

**Pros**:
- Minimal code changes
- Fast implementation

**Cons**:
- Masks underlying problems instead of fixing them
- Tests still flaky, just less visible
- Increases test execution time significantly
- Technical debt accumulates

**Why Not Chosen**: Does not address root causes; test reliability would still be poor.

#### Option 3: Increase Timeouts Across the Board

**Description**: Increase navigation, expect, and test timeouts globally

**Pros**:
- Very simple change
- Quick implementation

**Cons**:
- Masks timing issues instead of fixing them
- Slows down entire test suite
- Hides performance regressions
- Tests still unreliable on slower CI runners

**Why Not Chosen**: Does not address root causes; trades test reliability for slower execution.

### Selected Solution: Fix All Three Root Causes Holistically

**Justification**: This approach addresses the actual problems rather than masking them. Each fix is surgical and targeted:

1. **Impersonation API**: The current implementation is inherently fragile - parsing HTTP redirects is error-prone. Supabase Admin API has a direct way to get tokens that's more reliable.
2. **Page Load Timing**: Tests are clicking elements before page fully loads. Explicit `waitUntil` fixes the race condition.
3. **Test User State**: Previous test runs leave the test user in an invalid state (banned/deleted). Explicit reset in `beforeAll` ensures clean state.

**Technical Approach**:
- Use `adminClient.auth.admin.createSession()` or extract tokens from magic link response directly before fetching
- Add `page.waitForLoadState('networkidle')` before team selector interactions
- Call `unbanUser()` in test `beforeAll` hook, not just `afterEach`
- Verify user is active before tests proceed

**Architecture Changes** (if any):
- No breaking changes to public API
- Internal service refactoring only
- Test utilities unchanged (reuse existing `unbanUser()`)

**Migration Strategy** (if needed):
- No data migration required
- No breaking changes for other tests
- Backward compatible with existing test structure

## Implementation Plan

### Affected Files

1. `packages/features/admin/src/lib/server/services/admin-auth-user.service.ts` - Refactor `impersonateUser()` method
2. `apps/e2e/tests/team-accounts/team-accounts.po.ts` - Add `waitUntil` to page load
3. `apps/e2e/tests/admin/admin.spec.ts` - Add `beforeAll` user state reset
4. `apps/e2e/tests/invitations/invitations.spec.ts` - Add `beforeAll` user state reset

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Refactor Impersonation API Service

**Why this step first**: This is the foundational fix that enables the admin.spec.ts tests to proceed. The impersonation service failure is blocking the "can sign in as user" test.

- Modify `admin-auth-user.service.ts:impersonateUser()` method
- Use Supabase Admin API response directly instead of parsing HTTP Location header
- Keep error handling the same, but make it more robust
- Specific changes:
  - Use `adminClient.auth.admin.generateLink()` response which includes token data
  - Parse tokens from the response data structure instead of fetching and parsing headers
  - Add null-safety checks for token extraction
  - Test the new implementation

**Why this approach**: The Supabase Admin API `generateLink()` returns a response with `properties` containing the tokens. We can extract them directly without the fragile HTTP fetch + redirect parsing.

#### Step 2: Add Page Load Synchronization to Team Selector

**Why this step second**: This fixes the invitation tests that are timing out. Page load timing is independent of the impersonation fix, so it can be done in parallel conceptually, but we sequence it second for clarity.

- Modify `team-accounts.po.ts:openAccountsSelector()` method
- Add `page.waitForLoadState('networkidle')` before clicking team selector
- Ensure popover visibility check includes proper wait
- Specific changes:
  - Add `await this.page.waitForLoadState('networkidle');` at start of method
  - Keep existing visibility assertion
  - Test with invitation tests

**Why this approach**: `waitForLoadState('networkidle')` ensures all network requests complete and DOM stabilizes. This prevents race conditions where elements aren't interactive yet.

#### Step 3: Add Test User State Reset in beforeAll Hook

**Why this step third**: Ensures test user is in a valid state before any tests run. This prevents accumulated state corruption from previous test runs.

- Modify `admin.spec.ts` to add `beforeAll` hook that resets test user state
- Modify `invitations.spec.ts` to add `beforeAll` hook that resets test user state
- Use existing `unbanUser()` utility to reactivate test user if banned
- Verify user status after unban
- Specific changes:
  - Add `beforeAll` hook that calls `unbanUser(testUserEmail)`
  - Add validation that user is active after unban
  - Keep existing `afterEach` cleanup logic

**Why this approach**: Test user `test1@slideheroes.com` accumulates state from previous runs. If banned in a previous test, it remains banned. The `beforeAll` hook ensures clean state at test start, not just at end.

#### Step 4: Add Null Safety and Error Handling

- Review all three areas for edge cases
- Ensure errors are logged properly
- Add specific error messages for debugging
- Verify no silent failures

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all affected test cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

- Verify `impersonateUser()` correctly extracts tokens from Admin API response
- Test null/undefined handling in token extraction
- Verify error scenarios are handled

**Test files**:
- `packages/features/admin/src/lib/server/services/admin-auth-user.service.test.ts`

### Integration Tests

- Verify `openAccountsSelector()` waits for page load before interacting
- Test that page is interactive after wait
- Verify selector visibility is stable

**Test files**:
- E2E tests themselves serve as integration tests

### E2E Tests

Run all affected tests to confirm fixes:

**Test files**:
- `apps/e2e/tests/admin/admin.spec.ts` - All 3 failing tests
- `apps/e2e/tests/invitations/invitations.spec.ts` - All 4 failing tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run shard 4 tests: `pnpm test:e2e --shard=4/4` (all 12 tests should pass)
- [ ] Verify impersonation works in admin panel manually
- [ ] Create a team and verify selector opens reliably
- [ ] Run tests multiple times to ensure no flakiness (min 3 runs)
- [ ] Verify browser console has no new errors during team selector operations
- [ ] Check that test user remains active after test suite completes
- [ ] Verify all 7 previously-failing tests now pass consistently

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Impersonation API Change May Have Unintended Side Effects**: The token extraction approach changes slightly
   - **Likelihood**: low
   - **Impact**: medium (admin impersonation would fail)
   - **Mitigation**: Thoroughly test with admin-auth-user.service.test.ts; verify with manual admin testing

2. **Page Load Wait Could Be Too Aggressive**: `waitUntil: "networkidle"` might cause unnecessary delays
   - **Likelihood**: low
   - **Impact**: low (slightly slower tests, but more reliable)
   - **Mitigation**: Monitor test execution time; only applies to team selector, not all tests

3. **Test User State Issues Could Return**: If unban logic fails silently
   - **Likelihood**: low
   - **Impact**: medium (tests fail again)
   - **Mitigation**: Add explicit validation after unban; log unban results

**Rollback Plan**:

If this fix causes issues in CI:
1. Revert `admin-auth-user.service.ts` to use original magic link parsing
2. Revert `team-accounts.po.ts` back to original timing
3. Remove `beforeAll` hooks from spec files
4. Re-diagnose the root causes with more detailed logging

**Monitoring** (if needed):
- Monitor shard 4 test pass rate for 5 consecutive runs
- Watch for any new test timeouts in other shards
- Alert if impersonation API starts failing

## Performance Impact

**Expected Impact**: minimal

- `waitUntil: "networkidle"` adds ~500ms per team selector open, but this is acceptable
- Impersonation API change slightly improves performance (no extra HTTP fetch)
- Test user reset in `beforeAll` adds ~100ms once per test describe block

**Performance Testing**:
- Measure test execution time before and after
- Verify total shard 4 execution time doesn't increase significantly
- Expected: ~5s slower per test suite due to `waitUntil`, but more reliable

## Security Considerations

**Security Impact**: none

- Impersonation service change does not expose tokens differently
- Admin API response data is same as parsed magic link
- Test utilities use existing auth mechanisms

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Run shard 4 tests to reproduce failures
pnpm test:e2e --shard=4/4

# Expected: 7 failures (admin.spec.ts: 3, invitations.spec.ts: 4)
```

**Expected Result**: Tests fail with timeouts and API errors as documented in diagnosis #775

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Unit tests (admin service)
pnpm test:unit packages/features/admin/src/lib/server/services/admin-auth-user.service.test.ts

# E2E shard 4 tests
pnpm test:e2e --shard=4/4

# E2E full suite (verify no regressions)
pnpm test:e2e

# Build
pnpm build
```

**Expected Result**: All commands succeed, all 12 shard 4 tests pass, no regressions in other shards

### Regression Prevention

```bash
# Run full test suite multiple times to check for flakiness
for i in {1..3}; do
  echo "Run $i..."
  pnpm test:e2e --shard=4/4
done

# Verify no new flakiness introduced elsewhere
pnpm test:e2e
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. All fixes use existing Supabase Admin API and Playwright capabilities.

**Dependencies added**: None

## Database Changes

**Migration needed**: no

No database schema or migration changes required. This fix operates at the application level using existing Supabase Admin APIs and database utilities.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained

No breaking changes. The fix is internal to service implementation and test utilities.

## Success Criteria

The fix is complete when:
- [ ] All 7 previously-failing tests in shard 4 now pass consistently
- [ ] All 12 tests in shard 4 pass (no new failures introduced)
- [ ] All validation commands pass
- [ ] No regressions in other test shards
- [ ] Test execution time for shard 4 is stable
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

### Key Implementation Details

**Impersonation Service Change**: The Supabase Admin API `generateLink()` returns:
```json
{
  "properties": {
    "action_link": "https://...",
    "email_otp": "...",
    "hashed_token": "..."
  }
}
```

We need to fetch the action link to get the full URL with tokens in the hash fragment, then parse that. The current code does this but the HTTP fetch is fragile. We should add better error handling and timeouts.

**Team Selector Timing**: The popover visibility depends on React rendering and layout calculation. Using `waitUntil: "networkidle"` ensures Suspense boundaries resolve and all initial data loads complete before trying to interact with the selector.

**Test User State**: The test user `test1@slideheroes.com` is seeded by the database. If it gets banned or deleted, it's not recreated automatically. We must explicitly unban/reactivate it in `beforeAll` hooks.

### Related Issues

- #768, #770 (CLOSED): Previous auth timeout fixes
- #764 (CLOSED): Serial mode state corruption diagnosis
- #756, #757 (CLOSED): Invitation email configuration

### References

- Supabase Admin API: `generateLink()`, `createSession()`
- Playwright: `waitForLoadState()`, `.toPass()` assertion
- Test utilities: `unbanUser()` from `database-utilities.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #775*
