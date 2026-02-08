# Bug Fix: Dev Integration Tests Fail - Missing E2E_SUPABASE_SERVICE_ROLE_KEY

**Related Diagnosis**: #1690 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `dev-integration-tests.yml` does not provide `E2E_SUPABASE_SERVICE_ROLE_KEY`, causing `setupTestUsers()` to fail with "Invalid API key" when using fallback local Supabase demo key against remote instance
- **Fix Approach**: Skip `setupTestUsers()` for CI with remote Supabase (matching pattern used for `cleanupBillingTestData()`)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-integration-tests.yml` workflow fails during global setup because `setupTestUsers()` requires the `E2E_SUPABASE_SERVICE_ROLE_KEY` environment variable to call the Supabase Admin API. When this key is not provided, the code falls back to a hardcoded local Supabase demo key which is invalid for the remote Supabase instance, resulting in "AuthApiError: Invalid API key" (401).

The `e2e-sharded.yml` workflow successfully calls `setupTestUsers()` because it runs a local Supabase instance and extracts the actual service role key. The `dev-integration-tests.yml` workflow tests against a deployed remote Supabase and cannot obtain this key without adding it as a GitHub Secret.

For full details, see diagnosis issue #1690.

### Solution Approaches Considered

#### Option 1: Skip setupTestUsers() for CI with Remote Supabase ⭐ RECOMMENDED

**Description**: Add a conditional check in `global-setup.ts` before calling `setupTestUsers()`, similar to the existing `cleanupBillingTestData()` check. Skip the function when running in CI with remote Supabase (`CI === "true"` and `E2E_LOCAL_SUPABASE !== "true"`). Test users should already exist in the remote Supabase from initial seeding.

**Pros**:
- Simple, surgical fix (3-5 lines of code in one file)
- No security implications (doesn't require managing additional secrets)
- Follows existing pattern in codebase (already done for billing cleanup at line 359-369)
- Test users are already pre-provisioned in deployed Supabase, no need to recreate
- Minimal risk of regression

**Cons**:
- Requires manual one-time setup of test users in deployed Supabase (already done)
- If test users are deleted from remote Supabase, tests will fail

**Risk Assessment**: Low - The pattern already exists in the same file, and test users are guaranteed to exist in deployed environments.

**Complexity**: simple

#### Option 2: Add E2E_SUPABASE_SERVICE_ROLE_KEY as GitHub Secret

**Description**: Add the production Supabase service role key as a GitHub Secret (`SUPABASE_SERVICE_ROLE_KEY`), then pass it to the workflow as `E2E_SUPABASE_SERVICE_ROLE_KEY`. This would enable automatic test user provisioning on every test run.

**Pros**:
- More robust - automatically provisions test users regardless of state
- Doesn't depend on manual pre-provisioning

**Cons**:
- Requires managing a sensitive secret (security risk if compromised)
- Not recommended per issue #577 - service role keys are highly privileged
- More complex (requires secret management, workflow changes)
- Unnecessary overhead - test users are already provisioned

**Why Not Chosen**: Security risk without clear benefit. Test users already exist in deployed environments, so there's no need to add automatic provisioning. This approach introduces complexity and security exposure unnecessarily.

#### Option 3: Use Supabase Admin Client with Anon Key Fallback

**Description**: Modify `test-users.ts` to detect when service role key is unavailable and skip user creation instead of using invalid fallback key.

**Pros**:
- Graceful failure instead of error

**Cons**:
- Still results in test users not being set up
- Doesn't match the "only one way" principle
- Adds unnecessary conditional logic to production code

**Why Not Chosen**: Option 1 is cleaner - handle the condition at the call site in `global-setup.ts` where the environment is known.

### Selected Solution: Skip setupTestUsers() for CI with Remote Supabase

**Justification**: This approach is the safest, simplest, and most maintainable:
- Follows the exact pattern already in the codebase (billing cleanup)
- Test users are guaranteed to exist in deployed environments
- Minimal code change (2-3 lines)
- Zero security implications
- No new dependencies or secrets required
- Failure mode is explicit (skip message logged)

**Technical Approach**:
- Add conditional check before `setupTestUsers()` call in `global-setup.ts:481-492`
- Pattern: `if (E2E_LOCAL_SUPABASE === "true" || CI !== "true") { await setupTestUsers(); }`
- Log skip message when condition is met
- Matches existing pattern for conditional billing cleanup (lines 359-369)

**Architecture Changes**: None - no architectural modifications, just conditional logic.

**Migration Strategy**: No migration needed. The change is backward compatible and doesn't affect existing behavior when `E2E_LOCAL_SUPABASE=true` or when running locally.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Add conditional check around `setupTestUsers()` call at lines 481-492

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Add Conditional Check to global-setup.ts

Replace unconditional `setupTestUsers()` call with conditional version that skips for CI with remote Supabase.

- Open `apps/e2e/global-setup.ts`
- Locate lines 481-492 (setupTestUsers call and error handling)
- Replace with conditional check:
  ```typescript
  // Create test users in Supabase before authentication
  // Skip for CI with remote Supabase (users are pre-provisioned)
  // See: Issue #1690 - Dev Integration Tests Service Role Key
  if (process.env.E2E_LOCAL_SUPABASE === "true" || process.env.CI !== "true") {
    try {
      await setupTestUsers();
    } catch (error) {
      console.error(`❌ Failed to setup test users: ${(error as Error).message}`);
      throw new Error(
        `Test user setup failed: ${(error as Error).message}. Cannot proceed with E2E tests.`,
      );
    }
  } else {
    // biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
    console.log(
      "⏭️  Skipping test user setup (CI with remote Supabase - users pre-provisioned)",
    );
  }
  ```
- This follows the exact pattern used for `cleanupBillingTestData()` (lines 359-369)

**Why this step first**: This is the core fix and only file that needs changes.

#### Step 2: Verify Type Safety and Linting

Ensure the change passes TypeScript and linting checks.

- Run `pnpm typecheck` to verify no type errors
- Run `pnpm lint` to check code quality
- Run `pnpm format` to format code consistently

#### Step 3: Manual Testing - Verify Local Workflow Still Works

Test that local E2E setup still functions correctly when test user creation is enabled.

- Set `E2E_LOCAL_SUPABASE=true` (simulating local Supabase)
- Run: `pnpm --filter web-e2e start-test-setup`
- Verify: Test users are created and setup completes successfully
- Verify: Log output shows "🔧 Setting up test users..." (not skip message)

#### Step 4: Manual Testing - Verify CI Workflow Will Skip Correctly

Verify the skip logic works for CI with remote Supabase.

- Set `E2E_LOCAL_SUPABASE=""` (unset)
- Set `CI=true`
- Run: `pnpm --filter web-e2e start-test-setup` (or simulate global setup)
- Verify: Log output shows "⏭️  Skipping test user setup (CI with remote Supabase...)"
- Verify: No error thrown

#### Step 5: Code Review Checklist

- Verify change matches existing pattern (cleanupBillingTestData)
- Verify console logging is consistent with codebase style
- Verify comments reference the issue number
- Verify no unnecessary changes included

## Testing Strategy

### Unit Tests

Test user setup is tested via E2E global setup, not unit tests. No unit tests needed for this fix.

### Integration Tests

The fix is validated through E2E test execution:

- ✅ Local Supabase workflow (`e2e-sharded.yml`): setupTestUsers() called, test users created
- ✅ CI with remote Supabase workflow (`dev-integration-tests.yml`): setupTestUsers() skipped, no error
- ✅ Regression: Existing tests continue to pass

### E2E Tests

E2E tests in both workflows should pass without the "Invalid API key" error.

### Manual Testing Checklist

Execute these manual tests to validate the fix:

- [ ] Locally with `E2E_LOCAL_SUPABASE=true`: Test users are created, no errors
- [ ] Locally with `CI=false`: Test users are created (local development mode)
- [ ] Simulate CI environment: `CI=true` and `E2E_LOCAL_SUPABASE=unset` → Skip message logged
- [ ] Verify log messages are clear and informative
- [ ] Run full E2E test suite locally to ensure setup completes
- [ ] Verify no new console warnings or errors introduced

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Test users not pre-provisioned in deployed Supabase**: If test users were deleted from the deployed environment, tests would fail with auth errors.
   - **Likelihood**: Very low (users are seeded on deployment)
   - **Impact**: Medium (tests would fail, but error message is clear)
   - **Mitigation**: Test users are created during deployment seed process. Document that deleting these users will cause test failures.

2. **Accidental removal of skip logic**: Code reviewer might not understand why skip is needed.
   - **Likelihood**: Low
   - **Impact**: Medium (would reintroduce the original bug)
   - **Mitigation**: Add clear code comment referencing issue #1690

3. **Environment variable not set correctly**: If `CI` or `E2E_LOCAL_SUPABASE` is not set as expected
   - **Likelihood**: Very low (these are well-established environment variables)
   - **Impact**: Low (would either skip or attempt setup - error would be clear)
   - **Mitigation**: Add console logging to show which branch was taken

**Rollback Plan**:

If this fix causes issues:
1. Revert the change: `git revert <commit-hash>`
2. The original error will return (tests fail with "Invalid API key")
3. This is safer than the current broken state

**Monitoring** (if needed):

- Monitor `dev-integration-tests.yml` workflow logs for the skip message
- Verify workflow completes successfully after fix is deployed
- Check for any new auth-related errors in test output

## Performance Impact

**Expected Impact**: Minimal (positive)

The fix eliminates a failed admin API call that was previously happening on every test run. This slightly improves test setup performance.

## Security Considerations

**Security Impact**: None

- No security vulnerabilities introduced
- No new secrets required
- Does not access privileged APIs
- Follows existing security patterns in codebase

## Validation Commands

### Before Fix (Bug Should Reproduce)

This reproduces the original error (can only be done in CI environment):

```bash
# In GitHub Actions with dev-integration-tests.yml
# The workflow will fail with:
# AuthApiError: Invalid API key
# at ensureTestUser (apps/e2e/tests/helpers/test-users.ts:99:35)
```

**Expected Result**: Workflow fails during global setup with "Invalid API key" error

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Manual verification - local with E2E_LOCAL_SUPABASE=true
# Test users should be created
E2E_LOCAL_SUPABASE=true pnpm --filter web-e2e start-test-setup

# Manual verification - simulate CI with remote Supabase
# Skip message should be logged
CI=true E2E_LOCAL_SUPABASE="" pnpm --filter web-e2e start-test-setup

# Full E2E test suite
pnpm test:e2e
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions. Test setup either creates users (local) or skips gracefully (CI with remote).

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run E2E tests specifically
pnpm test:e2e

# Run dev-integration-tests workflow
gh workflow run dev-integration-tests.yml --ref dev
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

OR

**No new dependencies required** - This fix uses only existing code patterns and environment variables.

## Database Changes

**No database changes required** - This fix only changes test setup logic, not data structure.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - The fix is fully backward compatible. Local workflows (with `E2E_LOCAL_SUPABASE=true`) continue to work exactly as before.

## Success Criteria

The fix is complete when:
- [ ] `apps/e2e/global-setup.ts` has conditional check for setupTestUsers()
- [ ] Conditional check follows pattern from lines 359-369 (billing cleanup)
- [ ] Code includes reference to issue #1690
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Manual testing confirms skip message appears when CI=true and E2E_LOCAL_SUPABASE unset
- [ ] Manual testing confirms test users created when E2E_LOCAL_SUPABASE=true
- [ ] `dev-integration-tests.yml` workflow completes without "Invalid API key" error
- [ ] Code review approved
- [ ] Zero regressions detected

## Notes

**Why this fix is ideal:**
- Matches existing codebase pattern (not inconsistent approaches)
- One-line conditional logic (minimal surface area for bugs)
- No secrets management required (security best practice)
- Test users are guaranteed to exist in deployed environments (via seed)
- Explicitly logs when skipped (debuggability)

**Related issues that guided this decision:**
- #1684: Fixed health check scoping using similar conditional pattern
- #1681: Similar scope fix for CI environments
- #577: Original bug report documenting this exact issue (Nov 2025)

**Implementation reference:**
The conditional pattern used here is well-established in this file. See `cleanupBillingTestData()` call at lines 359-369 for exact same pattern:
```typescript
if (process.env.E2E_LOCAL_SUPABASE === "true" || process.env.CI !== "true") {
  await cleanupBillingTestData();
} else {
  console.log("⏭️  Skipping billing cleanup...");
}
```

The fix simply applies this same pattern to `setupTestUsers()`.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1690*
