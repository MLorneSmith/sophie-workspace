# Bug Fix: E2E Test Failures - Account Settings and Invitations

**Related Diagnosis**: #1116 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Three distinct issues: (1) Account dropdown not reflecting mutations due to stale cache, (2) Supabase auth endpoints unreachable from Docker test container, (3) RLS policies preventing updates/deletes on invitations or form handlers incomplete
- **Fix Approach**: Implement multi-layered fix addressing cache invalidation, API connectivity, and RLS policy verification
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E tests are failing across two shards with 6 critical test failures:

**Personal Accounts (Shard 3)**: 3 failures
- Account display name not updating in UI dropdown after successful API call
- Password update timeout after 120 seconds with no network response
- Both form submissions report success but UI doesn't reflect changes

**Invitations (Shard 4)**: 3 failures
- Delete invite timeout after 120 seconds
- Update invite timeout after 120 seconds
- Duplicate prevention fails (user can re-invite same member)

**Common pattern**: Forms succeed, API calls appear to complete, but responses never arrive or mutations aren't reflected in UI.

For full details, see diagnosis issue #1116.

### Solution Approaches Considered

#### Option 1: Fix React Query Cache Invalidation + Verify API Connectivity ⭐ RECOMMENDED

**Description**: Implement three coordinated fixes:

1. **Cache Invalidation**: After form mutations, explicitly invalidate React Query cache for affected queries
2. **API Connectivity**: Verify Supabase auth endpoints are reachable from Docker test containers (port 54521)
3. **RLS Policy Verification**: Ensure RLS policies allow UPDATE/DELETE operations needed by mutations

**Pros**:
- Addresses root causes of both account mutations and invitation operations
- Minimal code changes - mostly invalidation cache calls
- Leverages existing React Query infrastructure
- Fixes stale data display issue permanently
- Will prevent future similar issues

**Cons**:
- Requires coordination between three different layers (client cache, network, database)
- May require debugging Docker networking
- RLS policy debugging can be complex

**Risk Assessment**: medium - coordinated changes across multiple layers, but each layer is well-understood

**Complexity**: moderate - each piece is straightforward but requires integration

#### Option 2: Refetch After Mutation Only

**Description**: Add explicit refetch calls after each mutation succeeds without cache invalidation

**Pros**:
- Simpler immediate fix
- Only touches form handlers

**Cons**:
- Doesn't address root cause of cache staleness
- API connectivity issues still unresolved
- Password update timeout still unexplained
- Not a comprehensive solution

**Why Not Chosen**: Treats symptoms, not root cause. Doesn't fix API timeout issues which appear to be infrastructure-level problems.

#### Option 3: Rewrite Forms with Full Network Retry Logic

**Description**: Add exponential backoff and retry logic to all form submissions

**Pros**:
- Might hide transient network issues

**Cons**:
- Adds complexity to every form handler
- Doesn't address Docker connectivity issues
- Masking infrastructure problems rather than solving them
- Over-engineered for this scenario

**Why Not Chosen**: Band-aid solution that doesn't address real underlying issues.

### Selected Solution: Fix React Query Cache Invalidation + Verify API Connectivity

**Justification**: This approach addresses all three root causes systematically:
1. Cache invalidation fixes the "stale data" issue in account dropdown
2. API connectivity verification ensures forms can reach endpoints
3. RLS policy checks ensure mutations complete successfully

This is the most maintainable solution that will prevent regressions.

**Technical Approach**:

1. **React Query Cache Invalidation**:
   - After successful mutation, call `queryClient.invalidateQueries({ queryKey: ['account'] })`
   - After successful mutation, call `queryClient.invalidateQueries({ queryKey: ['invitations'] })`
   - Ensure mutations return data so optimistic updates can work

2. **API Connectivity**:
   - Verify Supabase Docker container is running on port 54521
   - Check test environment variables correctly point to Docker Supabase
   - Verify test server can reach Supabase endpoints from within container

3. **RLS Policy Verification**:
   - Check UPDATE policy on invitations table allows team members to update
   - Check DELETE policy on invitations table allows team members to delete
   - Verify RLS functions like `has_role_on_account()` work correctly

**Architecture Changes** (if any):
- No architecture changes - working within existing React Query + Server Actions pattern
- Adding cache invalidation calls is standard React Query usage

**Migration Strategy** (if needed):
- No data migration needed
- Tests will need updated to work with new cache behavior (already covered by E2E retries)

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/e2e/pages/account.po.ts` - Page object needs cache invalidation setup if using hooks
- `apps/web/src/home/[account]/_lib/server/account-server-actions.ts` - Add cache invalidation after mutations
- `apps/web/src/home/[account]/_components/update-account-details-form.tsx` - Verify mutation handling
- `apps/web/src/home/[account]/_components/update-password-form.tsx` - Fix API submission + cache invalidation
- `apps/web/src/home/[account]/_lib/server/invitations-server-actions.ts` - Add cache invalidation for delete/update
- `apps/web/src/home/[account]/members/_components/invitations-form.tsx` - Verify form submission
- `apps/web/supabase/migrations/*/invitations_rls.sql` - Verify RLS policies allow operations

### New Files

If new files are needed:
- No new files needed - working within existing patterns

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify Supabase Docker Connectivity

Ensure Docker test environment can reach Supabase:

- Start test environment: `pnpm build:test`
- Verify Supabase container is running: `docker ps | grep supabase`
- Test connectivity to Supabase from within test container
- Check `.env.test` has correct Supabase endpoint (should be `http://supabase:54521` when in Docker network)
- Verify test server can make HTTP requests to Supabase API

**Why this step first**: If API connectivity is broken, all subsequent fixes won't work. Need to establish baseline.

#### Step 2: Verify RLS Policies on Invitations Table

Check that RLS policies allow required operations:

- Review invitations UPDATE policy - should allow team members to update invites they own
- Review invitations DELETE policy - should allow team members to delete invites they own
- Verify `has_role_on_account()` function works correctly in test environment
- Check that policies don't have overly restrictive conditions
- Test policies manually in Supabase console if needed

**Why this step**: Mutations might be failing silently due to RLS denying operations

#### Step 3: Fix Account Update Mutations with Cache Invalidation

Update account update handlers to invalidate cache:

- Locate `updateAccountAction` or similar server action in `account-server-actions.ts`
- After successful update, add: `revalidatePath('/home/[account]')` for Next.js ISR
- In form component, after mutation succeeds, invalidate React Query: `queryClient.invalidateQueries({ queryKey: ['account'] })`
- Verify password update form does the same
- Test that UI immediately reflects changes

**Specific changes**:
```typescript
// In update-account-details-form.tsx (client component with form)
const handleSuccess = async () => {
  // Invalidate related queries
  await queryClient.invalidateQueries({
    queryKey: ['account'],
    refetchType: 'active'
  });
  // Show success toast
  toast.success('Account updated successfully');
};

// In server action
export const updateAccountAction = enhanceAction(
  async (data, user) => {
    const result = await updateAccount(data, user.id);
    revalidatePath('/home/[account]');
    return result;
  },
  { schema: UpdateAccountSchema }
);
```

#### Step 4: Fix Invitation Mutations with Cache Invalidation

Update invitation delete/update handlers:

- Locate `deleteInvitationAction`, `updateInvitationAction` server actions
- After successful operation, add: `revalidatePath('/home/[account]/members')`
- In form handlers, after mutation succeeds, invalidate React Query: `queryClient.invalidateQueries({ queryKey: ['invitations'] })`
- Test that list reflects changes immediately

**Specific changes**:
```typescript
// In form component
const handleDeleteSuccess = async () => {
  await queryClient.invalidateQueries({
    queryKey: ['invitations'],
    refetchType: 'active'
  });
  toast.success('Invitation deleted');
};

// In server action
export const deleteInvitationAction = enhanceAction(
  async (data, user) => {
    const result = await deleteInvitation(data.id, user.id);
    revalidatePath('/home/[account]/members');
    return result;
  },
  { schema: DeleteInvitationSchema }
);
```

#### Step 5: Add/Update Tests

Add/update unit and E2E tests for verification:

- Update `account-simple.spec.ts` test to wait for dropdown update after form submission
- Update `account.spec.ts` tests to wait for visibility of updated values
- Update `invitations.spec.ts` tests to verify list updates after delete/update
- Add regression test ensuring stale data issue doesn't return

**Test pattern**:
```typescript
// After form submission, wait for element with new value
await page.waitForSelector('text="John Doe"', { timeout: 5000 });
// Or with specific element if needed
await expect(page.locator('[data-testid="account-name"]')).toContainText('John Doe');
```

#### Step 6: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Account update action invalidates cache
- ✅ Password update action invalidates cache
- ✅ Invitation delete action invalidates cache
- ✅ Invitation update action invalidates cache
- ✅ RLS policies allow team member operations
- ✅ Cache invalidation with correct query keys

**Test files**:
- `apps/web/src/home/[account]/_lib/server/__tests__/account-server-actions.spec.ts` - Server action cache invalidation
- `apps/web/src/home/[account]/_lib/server/__tests__/invitations-server-actions.spec.ts` - Invitation mutations

### Integration Tests

Test form submissions end-to-end:

- Form submission → Server action → Cache invalidation → UI update
- Verify no stale data shown after mutations
- Test concurrent form submissions

**Test files**:
- `apps/web/src/home/[account]/_components/__tests__/update-account-details-form.spec.ts`
- `apps/web/src/home/[account]/members/_components/__tests__/invitations-form.spec.ts`

### E2E Tests

Update E2E tests with proper waits:

**Test files**:
- `apps/e2e/tests/account/account-simple.spec.ts:66` - Wait for dropdown value to update
- `apps/e2e/tests/account/account.spec.ts:43` - Wait for profile name update
- `apps/e2e/tests/account/account.spec.ts:64` - Wait for password update success
- `apps/e2e/tests/invitations/invitations.spec.ts:50` - Wait for delete to complete
- `apps/e2e/tests/invitations/invitations.spec.ts:72` - Wait for update to complete
- `apps/e2e/tests/invitations/invitations.spec.ts:98` - Verify duplicate prevention

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start test environment: `pnpm build:test`
- [ ] Update account name, verify dropdown updates immediately
- [ ] Update password, verify success message appears
- [ ] Delete invitation, verify list updates immediately
- [ ] Update invitation, verify changes show in list
- [ ] Try to re-invite same member, verify prevented
- [ ] Refresh page, verify changes persisted
- [ ] Check browser console for no cache-related errors
- [ ] Run full E2E test suite to verify no regressions
- [ ] Test in both dev and test environments

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Cache Invalidation Scope**: Invalidating cache too broadly could cause unnecessary refetches
   - **Likelihood**: medium
   - **Impact**: medium (performance degradation)
   - **Mitigation**: Use specific query keys `['account']` and `['invitations']` rather than broad invalidation

2. **Docker Network Configuration**: Test container might not reach Supabase properly
   - **Likelihood**: low (already working for other tests)
   - **Impact**: high (tests won't run)
   - **Mitigation**: Verify docker-compose.test.yml networking setup, check container logs

3. **RLS Policy Regressions**: Changes to RLS might break other operations
   - **Likelihood**: low (only verifying existing policies)
   - **Impact**: high (data access broken)
   - **Mitigation**: Run full test suite, review policy changes carefully, test in staging first

**Rollback Plan**:

If this fix causes issues in production:
1. Revert cache invalidation changes (git revert specific commits)
2. Restore original form handlers
3. Verify old E2E tests still pass (might have false positives with stale data)
4. Investigate root cause if regression persists

**Monitoring** (if needed):
- Monitor E2E test pass rates after deployment
- Watch for form submission errors in logs
- Alert on RLS policy violations

## Performance Impact

**Expected Impact**: minimal

The cache invalidation strategy uses `refetchType: 'active'` which only refetches if queries are currently in use, avoiding unnecessary network requests. This is more efficient than force-refreshing stale data multiple times.

**Performance Testing**:
- Measure time from form submission to UI update before/after fix
- Verify no extra network requests due to invalidation
- Check React Query cache hit rates remain healthy

## Security Considerations

**Security Impact**: low

The fixes maintain existing security model:
- RLS policies are only verified, not weakened
- Cache invalidation follows React Query best practices
- No new data exposure or authorization changes

**Security considerations**:
- All operations still go through RLS policies
- Server actions still use enhanceAction wrapper with auth checks
- No secrets exposed in cache invalidation

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run failing E2E tests
pnpm --filter web-e2e test account-simple
# Expected: Test fails with "Expected 'John Doe', Received 'test1'" after 34 retries

pnpm --filter web-e2e test account.spec.ts -g "update password"
# Expected: Test fails with timeout after 120 seconds

pnpm --filter web-e2e test invitations.spec.ts
# Expected: Multiple tests timeout
```

**Expected Result**: Tests fail with stale data and timeouts as described in diagnosis

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for affected modules
pnpm test:unit --watch account-server-actions.spec.ts
pnpm test:unit --watch invitations-server-actions.spec.ts

# E2E tests - individual shards
pnpm --filter web-e2e test account-simple.spec.ts
pnpm --filter web-e2e test account.spec.ts
pnpm --filter web-e2e test invitations.spec.ts

# Build
pnpm build

# Full E2E test suite
pnpm test:e2e
```

**Expected Result**: All commands succeed, all tests pass, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks - verify other account/invitation operations still work
pnpm --filter web-e2e test account-*.spec.ts
pnpm --filter web-e2e test member-*.spec.ts
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - using existing React Query and server action patterns

### Existing Dependencies Used

- `@tanstack/react-query` - Cache invalidation
- `@kit/next/actions` - enhanceAction for server actions
- `@kit/supabase/server-client` - Supabase client
- `revalidatePath` - Next.js ISR from `next/navigation`

## Database Changes

**No database changes required** - only verifying existing RLS policies

**What to check**:
- View invitations UPDATE policy: Check that `has_role_on_account()` allows the operation
- View invitations DELETE policy: Check that `has_role_on_account()` allows the operation
- Verify test data has correct account relationships for RLS to pass

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No database migrations needed
- No feature flags needed
- Code changes are isolated to form handlers and server actions
- Safe to deploy during business hours

**Backwards compatibility**: fully maintained - only adding cache invalidation, not changing APIs

## Success Criteria

The fix is complete when:
- [ ] All E2E test failures from diagnosis #1116 are resolved
- [ ] Account dropdown updates immediately after name change
- [ ] Password update completes without timeout
- [ ] Invitations can be deleted and updated without timeout
- [ ] All three E2E test shards pass (Personal Accounts, Admin & Invitations, and others)
- [ ] Zero regressions detected in other E2E tests
- [ ] Code review approved
- [ ] All validation commands pass
- [ ] Manual testing checklist complete
- [ ] Performance acceptable (no slowdowns from cache invalidation)
- [ ] Docker test environment verified working

## Notes

**Key implementation details**:
- Use `refetchType: 'active'` in React Query invalidation to avoid unnecessary refetches
- Always use `revalidatePath` in server actions for Next.js ISR cache busting
- Ensure test environment `.env.test` points to Docker Supabase on `http://supabase:54521`
- The account dropdown issue likely stems from stale React Query cache, not a UI bug
- Password timeout suggests form isn't submitting to server action properly - check for JavaScript errors

**Related documentation**:
- React Query cache invalidation: `.ai/ai_docs/context-docs/development/react-query-patterns.md`
- Server actions pattern: `.ai/ai_docs/context-docs/development/server-actions.md`
- E2E testing setup: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`

**Similar issues**:
- #776 - Related account dropdown issues
- #1034 - Form submission timeout
- #1036 - Cache invalidation problems

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1116*
