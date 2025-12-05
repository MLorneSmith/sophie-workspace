# Bug Fix: Auth Storage State Test Configuration

**Related Diagnosis**: #925
**Severity**: high
**Bug Type**: test
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test runs with pre-authenticated storage state from `playwright.config.ts` which causes middleware redirect when navigating to `/auth/sign-in`
- **Fix Approach**: Clear storage state for auth-simple tests using `test.use({ storageState: undefined })`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `sign in page loads with correct elements` test in `auth-simple.spec.ts` fails because Playwright's global configuration sets `storageState: ".auth/test1@slideheroes.com.json"` for all tests. This authenticated state persists when the test navigates to `/auth/sign-in`. The Next.js middleware detects the valid session and redirects to `/home/settings`, so the sign-in form elements are never visible. The test times out waiting for `[data-testid="sign-in-email"]` which doesn't exist on the settings page.

For full details, see diagnosis issue #925.

### Solution Approaches Considered

#### Option 1: Clear Storage State for Auth Tests ⭐ RECOMMENDED

**Description**: Use `test.use({ storageState: undefined })` at the describe-block level in `auth-simple.spec.ts` to clear the pre-authenticated state specifically for authentication tests. This allows the tests to run unauthenticated and reach the actual sign-in page.

**Pros**:
- Minimal code change (1-2 lines)
- Directly addresses the root cause
- No impact on other tests
- Playwright's built-in feature specifically designed for this scenario
- Fast execution (no authentication overhead for auth tests)
- Clear intent in test code

**Cons**:
- None significant

**Risk Assessment**: low - This is a standard Playwright pattern with no side effects

**Complexity**: simple - One-line configuration at describe level

#### Option 2: Create Separate Auth Context with Custom Config

**Description**: Create a separate Playwright project in `playwright.config.ts` specifically for authentication tests with `storageState: undefined` built-in, and mark auth tests to use this project.

**Pros**:
- Centralized configuration
- Could be reused for other unauthenticated tests
- Cleaner separation of concerns

**Cons**:
- More complex setup required
- Requires modifying `playwright.config.ts`
- Adds configuration overhead for what is a one-time need
- Higher risk of breaking other configurations

**Why Not Chosen**: Option 1 is simpler, more direct, and less risky. The Playwright documentation explicitly recommends using `test.use()` at the describe level for per-test configuration overrides.

#### Option 3: Mock Authentication Flow

**Description**: Create a custom test utility that simulates authentication flow without relying on storage state.

**Pros**:
- Full control over auth state
- Could be useful for future tests

**Cons**:
- Much more complex implementation
- Risk of not matching real authentication flow
- Duplicates Playwright's built-in functionality
- Over-engineering for the problem

**Why Not Chosen**: Playwright's storage state mechanism is proven and reliable; using it (or clearing it) is the correct approach rather than reimplementing authentication.

### Selected Solution: Clear Storage State for Auth Tests

**Justification**: This is the simplest, most direct fix that leverages Playwright's intended design. The test suite structure expects authentication tests to run unauthenticated, and Playwright provides `test.use()` specifically for per-describe-block configuration overrides. This approach has zero risk, minimal code change, and directly addresses the root cause.

**Technical Approach**:
- Add `test.use({ storageState: undefined })` at the top of the "Authentication - Simple Tests" describe block
- This override applies only to tests within that describe block
- Tests maintain their Playwright context but start without pre-authenticated storage
- The middleware redirect no longer occurs because there's no valid session

**Architecture Changes**: None - No architectural modifications needed

**Migration Strategy**: Not applicable - This is a test-only change with no data or code migration

## Implementation Plan

### Affected Files

- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Add storage state clear directive in describe block

### New Files

None required

### Step-by-Step Tasks

#### Step 1: Understand Current Test Structure

Verify the current structure of auth-simple.spec.ts and confirm the failing test:

- [ ] Read `apps/e2e/tests/authentication/auth-simple.spec.ts`
- [ ] Identify the describe block: "Authentication - Simple Tests @auth @integration"
- [ ] Locate the failing test: "sign in page loads with correct elements"
- [ ] Understand the current implementation

**Why this step first**: We need to understand the exact test structure before making changes to ensure we place the configuration override in the correct location and don't break test organization.

#### Step 2: Apply Storage State Clear

Add the storage state clear directive:

- [ ] Add `test.use({ storageState: undefined })` immediately after the describe block declaration
- [ ] Ensure the override applies to all tests in the describe block
- [ ] Verify proper indentation and formatting

**Example code location:**
```typescript
test.describe("Authentication - Simple Tests @auth @integration", () => {
  test.use({ storageState: undefined }); // ← Add this line

  test("sign in page loads with correct elements", async ({ page }) => {
    // Test implementation
  });
});
```

#### Step 3: Verify the Fix

Verify that the change allows the test to pass:

- [ ] Run the specific failing test: `pnpm --filter web-e2e test auth-simple.spec.ts`
- [ ] Verify test passes (should now reach the sign-in page)
- [ ] Check that test correctly validates sign-in page elements
- [ ] Confirm no new errors or warnings

#### Step 4: Run Full E2E Test Suite

Ensure no regressions in other tests:

- [ ] Run full E2E test suite: `pnpm --filter web-e2e test`
- [ ] Verify all authentication tests pass
- [ ] Verify all other tests still pass
- [ ] Confirm no unexpected test failures

#### Step 5: Run Code Quality Checks

Validate code standards:

- [ ] Run `pnpm typecheck` (should pass without changes)
- [ ] Run `pnpm lint` (should pass without changes)
- [ ] Run `pnpm format` (should pass without changes)

#### Step 6: Validation

Final validation before considering complete:

- [ ] Original bug is fixed (test passes)
- [ ] No regressions in other tests
- [ ] Code quality checks pass
- [ ] Ready for commit

## Testing Strategy

### Unit Tests

Not applicable - this is a test configuration change, not production code.

### Integration Tests

Not applicable - configuration change only.

### E2E Tests

**Critical test to validate fix:**
- ✅ `auth-simple.spec.ts` - "sign in page loads with correct elements"
  - Should now pass (was timing out before)
  - Should find `[data-testid="sign-in-email"]` element
  - Should find `[data-testid="sign-in-password"]` element
  - Should find sign-in form elements

**Regression tests:**
- ✅ All tests in `authentication/` directory should still pass
- ✅ All tests in `account/` directory (should remain authenticated via storage state)
- ✅ All tests in `team-accounts/` directory (should remain authenticated via storage state)
- ✅ Full E2E suite (no regressions)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm --filter web-e2e test auth-simple.spec.ts` - test should pass
- [ ] Run `pnpm --filter web-e2e test -- --project=chromium` - full suite in chromium
- [ ] Verify no other authentication tests broke
- [ ] Verify authenticated tests in other directories still work
- [ ] Check test output for any warnings or issues

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unintended Impact on Other Tests**: Configuration at describe level only affects tests within that block
   - **Likelihood**: low
   - **Impact**: low (only auth-simple tests affected)
   - **Mitigation**: Run full E2E test suite to verify no regressions

2. **Test Misses Actual Auth Behavior**: By running unauthenticated, could miss edge cases
   - **Likelihood**: low (sign-in page must work unauthenticated in production)
   - **Impact**: low
   - **Mitigation**: Existing test structure validates sign-in page loads correctly; this is the intended behavior

**Rollback Plan**:

If this fix causes unexpected issues:
1. Remove the `test.use({ storageState: undefined })` line from auth-simple.spec.ts
2. Restore to previous state (no configuration override)
3. The tests will revert to pre-authenticated behavior (original failing state)

**Monitoring**: None required - this is a test configuration change with no production impact

## Performance Impact

**Expected Impact**: none

No performance impact - this is a test configuration change only. If anything, tests may run slightly faster as they don't inherit pre-authenticated state overhead.

## Security Considerations

**Security Impact**: none

This is purely a test configuration change with no impact on production code or security policies.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Without fix, this test times out waiting for sign-in page elements
pnpm --filter web-e2e test auth-simple.spec.ts
```

**Expected Result**: Test times out (or fails) trying to find `[data-testid="sign-in-email"]` on settings page

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# E2E test - auth-simple (should now pass)
pnpm --filter web-e2e test auth-simple.spec.ts

# E2E test - full suite (verify no regressions)
pnpm --filter web-e2e test

# Build check
pnpm build
```

**Expected Result**: All commands succeed, auth-simple test now passes, no regressions in other tests.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm --filter web-e2e test

# Run specific test directory to verify auth tests
pnpm --filter web-e2e test authentication/

# Run account tests (should remain authenticated)
pnpm --filter web-e2e test account/

# Run team-account tests (should remain authenticated)
pnpm --filter web-e2e test team-accounts/
```

## Dependencies

### New Dependencies

**No new dependencies required** - This uses Playwright's built-in `test.use()` functionality

## Database Changes

**No database changes required** - This is a test configuration change only

## Deployment Considerations

**Deployment Risk**: none

This change only affects E2E tests and has zero impact on deployment or production code.

**Feature flags needed**: no

**Backwards compatibility**: maintained (test-only change)

## Success Criteria

The fix is complete when:
- [ ] `auth-simple.spec.ts` tests pass
- [ ] Specifically, "sign in page loads with correct elements" test passes
- [ ] Full E2E test suite passes (no regressions)
- [ ] Code quality checks pass (typecheck, lint, format)
- [ ] No new errors or warnings introduced
- [ ] Test output shows correct behavior (sign-in page elements found)

## Notes

**Implementation Details:**
- This fix uses Playwright's standard pattern for per-describe-block configuration
- The `test.use()` call at describe level is scoped to that describe block only
- Other tests retain their configured `storageState` from the project config
- No changes to `playwright.config.ts` needed - overrides are per-test configuration

**Why This Problem Occurred:**
- Playwright's global `storageState` configuration is intended for authenticated tests
- The `auth-simple` tests need to run unauthenticated to validate sign-in page
- The per-describe configuration override mechanism solves this elegantly

**Playwright Documentation:**
- `test.use()` - Per-test fixtures override: https://playwright.dev/docs/test-fixtures#overriding-fixtures
- Storage state: https://playwright.dev/docs/auth#reuse-authentication-state

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #925*
