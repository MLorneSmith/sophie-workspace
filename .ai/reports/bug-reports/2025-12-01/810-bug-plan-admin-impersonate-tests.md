# Bug Fix: Unit tests for impersonateUser fail due to outdated mocks and expectations

**Related Diagnosis**: #809 (REQUIRED)
**Severity**: low
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Tests were written for an older implementation using `fetch()` + Location header parsing. The service was refactored to use `verifyOtp()` with `hashed_token`, but test mocks and error message expectations weren't updated.
- **Fix Approach**: Update test mocks to return `hashed_token` from `generateLink`, add mock for `client.auth.verifyOtp()`, and update error message expectations to match the new implementation.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Three unit tests in `admin-auth-user.service.test.ts` fail because they expect the old implementation behavior:

1. **"should impersonate a user successfully"** - Test expects `fetch()` to follow a magic link and extract tokens from a Location header. New implementation uses `verifyOtp()` instead.
2. **"should throw error if location header not found"** - Old error about missing Location header no longer exists. New implementation throws a different error about missing `hashed_token`.
3. **"should throw error if tokens not found in URL"** - Old error about parsing URL hash no longer exists. New implementation uses `verifyOtp()` which has different error handling.

The root cause is that the service was refactored from:
- **Old**: `generateLink()` → `fetch(action_link)` → extract tokens from Location header
- **New**: `generateLink()` → extract `hashed_token` → `verifyOtp()` → return session tokens

### Solution Approaches Considered

#### Option 1: Update mocks and error expectations ⭐ RECOMMENDED

**Description**: Modify the test mocks to match the new implementation. Update `generateLink` mock to include `hashed_token` in properties, add a mock for `client.auth.verifyOtp()`, remove fetch-related test cases, and update error message assertions.

**Pros**:
- Minimal changes required
- Tests remain focused on the same functionality (impersonating users)
- Reflects the actual implementation being tested
- Easy to understand the changes

**Cons**:
- Requires updating multiple test cases

**Risk Assessment**: low - These are unit test changes only, no production code impact

**Complexity**: simple - Straightforward mock updates

#### Option 2: Rewrite entire test suite

**Description**: Keep the old test structure but completely rewrite it to match new implementation using TDD approach.

**Why Not Chosen**: Unnecessary complexity when targeted mock updates will work. Option 1 is more surgical and maintainable.

### Selected Solution: Update mocks and error expectations

**Justification**: The new implementation is superior (more reliable, better Supabase practice). Tests should validate the current behavior, not maintain compatibility with old approaches. By updating the mocks and expectations, we ensure tests accurately reflect the production code.

**Technical Approach**:
1. Modify the `createMockAuthAdmin` helper to return `hashed_token` in `generateLink` response
2. Add `verifyOtp` to the mock `client.auth` object and configure its return value
3. Remove the `fetch` mocking for the three affected tests
4. Update error message assertions to match new error messages
5. Simplify tests by removing Location header extraction logic

**Architecture Changes**: None - tests are being updated to match existing production code

**Migration Strategy**: Not applicable - this is a test-only change

## Implementation Plan

### Affected Files

- `packages/features/admin/src/lib/server/services/admin-auth-user.service.test.ts` (lines 240-347)
  - Update test mocks to provide `hashed_token` instead of `action_link`
  - Add mock for `client.auth.verifyOtp()` to return session data
  - Update three test cases for the `impersonateUser` method
  - Remove fetch-related test setup from those tests

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add verifyOtp to mock client auth

Update the `createMockAuth` helper to include a `verifyOtp` method that returns a valid session:

- Add `verifyOtp` method to mock auth object
- Configure it to return `{ data: { session: { access_token, refresh_token } }, error: null }` by default
- Allow configuration via the `config` parameter for error testing

**Why this step first**: The mock infrastructure needs to support the new method before tests can use it.

#### Step 2: Update createMockAuthAdmin to return hashed_token

Modify the `createMockAuthAdmin` helper's `generateLink` response:

- Change `properties.action_link` to `properties.hashed_token`
- Keep the token value the same for consistency
- Ensure the mock returns both the data structure and allows configuration for error testing

**Why this step next**: The test needs to be able to mock the exact structure that the implementation expects.

#### Step 3: Update the successful impersonation test

Modify the first test case: "should impersonate a user successfully"

- Remove the `fetch` mocking code (lines 254-260)
- Update `generateLink` mock to return `hashed_token` instead of `action_link`
- Add a mock for `client.auth.verifyOtp()` to return valid session tokens
- Verify the test calls `verifyOtp` with the correct parameters
- Verify the test still asserts the returned access and refresh tokens

**Specific changes**:
- Remove: `vi.mocked(global.fetch).mockResolvedValue(...)`
- Update mock config: Change `action_link` to `hashed_token`
- Add assertion: Expect `client.auth.verifyOtp` to be called with `{ token_hash: hashedToken, type: 'magiclink' }`

#### Step 4: Remove or update the Location header error test

The test: "should throw error if location header not found" (lines 317-330)

This test no longer makes sense because the new implementation doesn't fetch the action_link or parse Location headers. Two options:

**Option A (Recommended)**: Replace with a test for missing `hashed_token`
- Modify `generateLink` mock to return data without `hashed_token`
- Test should expect error: "Error generating magic link: hashed_token not found in response"

**Option B**: Remove the test entirely
- This scenario (missing hashed_token) is already tested implicitly

Choose Option A to maintain test coverage for the hashed_token validation.

#### Step 5: Remove or update the URL hash parsing error test

The test: "should throw error if tokens not found in URL" (lines 332-347)

This test is testing old implementation details (URL hash parsing). The new implementation uses `verifyOtp()` which doesn't parse URLs. Options:

**Option A (Recommended)**: Replace with a test for verifyOtp failure
- Mock `client.auth.verifyOtp()` to return an error
- Test should expect error: "Failed to verify magic link: [verifyError message]"

**Option B**: Remove the test entirely
- Error handling for `verifyOtp` failures is still tested

Choose Option A to maintain test coverage for the new error path.

#### Step 6: Remove fetch mocking from all impersonateUser tests

Review all three impersonateUser tests:

- Remove `vi.mocked(global.fetch).mockResolvedValue(...)` calls
- Remove any `global.fetch` setup from individual tests
- The global `fetch` mock at the top of the file can remain (used by other tests)

#### Step 7: Validate type safety

Ensure all mock types are correct:

- Verify `verifyOtp` mock matches Supabase's actual signature
- Verify `hashed_token` is correctly typed as a string
- Verify session object structure matches Supabase Session type

#### Step 8: Run tests and verify

Execute the impersonateUser tests:

```bash
pnpm --filter @kit/admin test -- admin-auth-user.service.test.ts
```

All three previously failing tests should now pass:
- ✅ "should impersonate a user successfully"
- ✅ "should throw error if location header not found" (or replaced test)
- ✅ "should throw error if tokens not found in URL" (or replaced test)

## Testing Strategy

### Unit Tests

The three failing tests need updates:

- ✅ Test: `impersonateUser` successfully returns access and refresh tokens
- ✅ Test: `impersonateUser` handles missing hashed_token error
- ✅ Test: `impersonateUser` handles verifyOtp failure error
- ✅ Existing edge case: User has no email
- ✅ Existing edge case: getUserById fails
- ✅ Existing edge case: generateLink fails
- ✅ Existing edge case: Attempting to impersonate current user

### Integration Tests

No integration tests needed - this is a unit test fix for an already-tested service.

### Manual Testing Checklist

- [ ] Run `pnpm --filter @kit/admin test` - all tests pass
- [ ] Verify no new TypeScript errors: `pnpm typecheck`
- [ ] Verify no linting issues: `pnpm lint`
- [ ] Verify test file is well-formatted: `pnpm format`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incomplete mock setup**: If the verifyOtp mock doesn't properly match Supabase's actual API
   - **Likelihood**: low
   - **Impact**: low (caught immediately by type checking and test failures)
   - **Mitigation**: Verify against Supabase SDK types, run tests frequently

2. **Missed test cases**: If there are other tests depending on the old implementation
   - **Likelihood**: low
   - **Impact**: low (only affects this one test file)
   - **Mitigation**: Search codebase for other references to `admin-auth-user.service`, review all admin tests

**Rollback Plan**:

If issues arise, simply revert the test file:
1. `git checkout HEAD -- packages/features/admin/src/lib/server/services/admin-auth-user.service.test.ts`

**Monitoring**: None needed - this is a test-only change with no production impact.

## Performance Impact

**Expected Impact**: none

Test performance should remain unchanged or improve slightly (verifyOtp mocking is simpler than fetch mocking).

## Security Considerations

**Security Impact**: none

This is a test-only change with no security implications.

## Validation Commands

### Before Fix (Tests Should Fail)

```bash
pnpm --filter @kit/admin test -- admin-auth-user.service.test.ts --reporter=verbose
```

**Expected Result**: 3 test failures in the impersonateUser test suite

### After Fix (Tests Should Pass)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for admin package
pnpm --filter @kit/admin test

# Full test suite (to ensure no regressions)
pnpm test
```

**Expected Result**: All tests pass, including the three previously failing tests

### Regression Prevention

```bash
# Run all admin tests
pnpm --filter @kit/admin test

# Verify auth-related tests still pass
pnpm --filter @kit/auth test

# Run full test suite
pnpm test
```

## Dependencies

No new dependencies required.

## Database Changes

No database changes required - this is a test-only change.

## Deployment Considerations

**Deployment Risk**: none

This is a test-only change. No deployment considerations needed.

## Success Criteria

The fix is complete when:
- [ ] All three previously failing tests now pass
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm --filter @kit/admin test` passes (100% pass rate)
- [ ] No regressions in other test suites
- [ ] All mocks properly type-check against Supabase SDK types

## Notes

The refactoring from fetch + Location header parsing to verifyOtp + hashed_token (commit b372354e1) was the right decision:
- **More reliable**: Uses Supabase's recommended OTP verification flow
- **Better practice**: Aligns with Supabase SDK patterns
- **Simpler code**: Eliminates manual redirect/URL parsing logic

The tests should reflect this improved implementation. This fix ensures test quality matches code quality.

### Key Implementation Details

The new `impersonateUser` implementation (lines 66-126 in the service):

1. Fetches user via `adminClient.auth.admin.getUserById()`
2. Generates magic link via `adminClient.auth.admin.generateLink()` - returns `hashed_token` in properties
3. Verifies the OTP using the regular `client.auth.verifyOtp()` (not admin client)
4. Returns the session's access and refresh tokens

This is more robust than the old approach of following HTTP redirects and parsing URL hashes.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #809*
