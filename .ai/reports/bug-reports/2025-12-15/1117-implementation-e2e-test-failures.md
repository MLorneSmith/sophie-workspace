## Implementation Complete

### Summary
- Fixed account update mutation that was failing due to `.select().single()` causing RLS issues
- Implemented optimistic cache updates using `setQueryData` for immediate UI feedback
- Changed cache invalidation to use `refetchType: "all"` to ensure inactive queries also get updated
- Updated E2E test to accept 204 (No Content) response from Supabase updates (expected behavior without `.select()`)

### Root Cause Analysis
The account name update mutation was using `.select().single()` after the update, which:
1. Returns 200 with data when successful
2. Can fail if RLS policies don't allow SELECT after UPDATE
3. Throws an error when no rows are returned

The fix removes `.select().single()` and instead uses optimistic cache updates with `setQueryData` to immediately update the UI with the new data.

### Files Changed
```
apps/e2e/tests/account/account.spec.ts             |  3 +-
packages/features/accounts/src/hooks/use-update-account.ts | 36 +++++++++++++---------
2 files changed, 24 insertions(+), 15 deletions(-)
```

### Commits
```
61e7cafd9 fix(auth): fix account update mutation cache invalidation
```

### Validation Results
- All validation commands passed successfully:
- `pnpm typecheck` - PASSED
- `pnpm lint` - PASSED (15 pre-existing warnings)
- `pnpm format:fix` - PASSED
- E2E test "user can update their profile name" - PASSED

### Known Issues (Not Fixed in This PR)
The following tests still fail but are unrelated to this fix:
1. **Password update test** - Times out waiting for `/auth/v1/user` response (Supabase Auth API issue)
2. **Invitation tests** - Role selector dropdown not opening (UI component issue)

These require separate investigation and fixes.

### Technical Details

**Before (problematic):**
```typescript
const response = await client
  .from("accounts")
  .update(data)
  .match({ id: accountId })
  .select("id, name, picture_url, public_data")
  .single();
```

**After (fixed):**
```typescript
const response = await client
  .from("accounts")
  .update(data)
  .match({ id: accountId });

// Optimistic cache update
queryClient.setQueryData(["account:data", accountId], (oldData) => ({
  ...oldData,
  ...data,
}));

// Also invalidate to ensure consistency
await queryClient.invalidateQueries({
  queryKey: ["account:data", accountId],
  refetchType: "all",
});
```

---
*Implementation completed by Claude*
