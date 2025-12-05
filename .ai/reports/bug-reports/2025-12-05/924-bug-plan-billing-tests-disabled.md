# Bug Fix: Dev Integration Tests - Billing Tests Running When Disabled

**Related Diagnosis**: #923
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `--grep @integration` command flag bypasses `testIgnore` file patterns; billing tests with `@integration` tag still run even when disabled
- **Fix Approach**: Add runtime `test.skip()` checks in billing test files to respect `ENABLE_BILLING_TESTS` environment variable
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests.yml workflow fails because billing tests execute despite `ENABLE_BILLING_TESTS=false`. The root cause is that Playwright's `--grep @integration` flag matches tests by tag, completely bypassing the `testIgnore` configuration which uses file patterns.

Three test failures result:
1. `auth-simple.spec.ts` - Timing issue (secondary)
2. `team-billing.spec.ts` - Runs despite billing disabled (primary)
3. `user-billing.spec.ts` - Runs despite billing disabled + strict mode violation (primary + secondary)

For full details, see diagnosis issue #923.

### Solution Approaches Considered

#### Option 1: Add `test.skip()` to Billing Tests ⭐ RECOMMENDED

**Description**: Add a runtime skip at the beginning of each billing test file that checks `ENABLE_BILLING_TESTS` environment variable and skips all tests in that file if false.

```typescript
// apps/e2e/tests/team-billing/team-billing.spec.ts
test.describe("Team Billing @billing @integration", () => {
  test.skip(process.env.ENABLE_BILLING_TESTS !== "true", "Billing tests disabled in CI");
  // ... tests
});
```

**Pros**:
- Works regardless of how tests are invoked (`--grep`, file patterns, etc.)
- No configuration changes needed
- Respects environment variable at runtime
- Clear intent in test files
- Prevents false positives in CI

**Cons**:
- Slight test startup overhead checking environment variable
- Must add skip to each test file that should be disabled

**Risk Assessment**: Low - This is a standard Playwright pattern, no side effects

**Complexity**: simple - One line per test describe block

#### Option 2: Remove `@integration` Tag from Billing Tests

**Description**: Remove the `@integration` tag from billing tests so they don't match `--grep @integration` pattern.

**Pros**:
- Doesn't require test startup overhead
- Clean configuration-based approach

**Cons**:
- Tests no longer tagged as integration tests
- Breaks the integration test categorization
- If test runner is changed later, no protection
- Doesn't respect `ENABLE_BILLING_TESTS` variable

**Why Not Chosen**: Less robust than runtime skipping. If someone forgets to update tag when changing the command later, tests will run again. Option 1 is more defensive.

#### Option 3: Fix `testIgnore` to Override `--grep`

**Description**: Configure Playwright so `testIgnore` patterns are applied even when using `--grep`.

**Pros**:
- Configuration-based solution
- No code changes needed

**Cons**:
- Playwright doesn't support this - `--grep` is command-line and always overrides config
- Not possible to implement
- Would require using grep more carefully

**Why Not Chosen**: Not technically feasible with Playwright's design

### Selected Solution: Option 1 - Add `test.skip()` to Billing Tests

**Justification**:

This approach is the most robust because:
1. **Works universally** - Skips tests regardless of how tests are invoked
2. **Respects environment variable** - Intent is clear in configuration
3. **Follows Playwright patterns** - This is the recommended way to conditionally skip tests
4. **Zero configuration changes** - No updates to `playwright.config.ts` needed
5. **Defensive** - Protects against future test runner changes
6. **Simple to implement** - One line per test file

**Technical Approach**:

1. In `apps/e2e/tests/team-billing/team-billing.spec.ts`, add a skip before the describe block
2. In `apps/e2e/tests/user-billing/user-billing.spec.ts`, add a skip before the describe block
3. The skip will evaluate `ENABLE_BILLING_TESTS` environment variable at test execution time
4. If `ENABLE_BILLING_TESTS !== "true"`, all tests in that file are marked as skipped
5. Skipped tests don't execute and don't cause failures

**Architecture Changes**: None - this is purely a test-level change

## Implementation Plan

### Affected Files

- `apps/e2e/tests/team-billing/team-billing.spec.ts` - Add skip check for billing tests
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - Add skip check for billing tests

### New Files

None needed

### Step-by-Step Tasks

#### Step 1: Add Skip to Team Billing Tests

<describe what this step accomplishes>

Add `test.skip()` check at the beginning of team billing tests to skip when billing is disabled.

**Changes**:
- Open `apps/e2e/tests/team-billing/team-billing.spec.ts`
- Add one line after the `test.describe()` opening: `test.skip(!process.env.ENABLE_BILLING_TESTS, "Billing tests disabled");`
- This ensures the test suite respects the `ENABLE_BILLING_TESTS` environment variable

**Why this step first**: Team billing tests fail in the current workflow, fixing this immediately reduces failures from 3 to 2

#### Step 2: Add Skip to User Billing Tests

Add `test.skip()` check to user billing tests.

**Changes**:
- Open `apps/e2e/tests/user-billing/user-billing.spec.ts`
- Add one line after the `test.describe()` opening: `test.skip(!process.env.ENABLE_BILLING_TESTS, "Billing tests disabled");`

#### Step 3: Fix Billing Page Object Strict Mode Violation (Optional but Recommended)

Fix the `.or()` locator in `billing.po.ts` that causes strict mode violation.

**Changes**:
- Open `apps/e2e/tests/utils/billing.po.ts` at line 87 in `waitForBillingPageReady()`
- Change `await expect(subscriptionIndicator.or(planSelectionIndicator)).toBeVisible()` to `await expect(subscriptionIndicator.or(planSelectionIndicator).first()).toBeVisible()`
- This ensures only the first matching element is tested, avoiding strict mode error

**Why optional**: This is a secondary issue that only manifests if billing tests DO run. Once Option 1 prevents them from running, this won't cause failures. However, fixing it makes the code more robust for the future.

#### Step 4: Run Validation Commands

Verify the fixes work correctly.

- Run typecheck to ensure no TypeScript errors
- Run the specific billing test files to verify they skip
- Run the full integration test suite to verify no other tests break

#### Step 5: Verify in Workflow

Test that the fix works in the GitHub Actions workflow environment.

- Trigger the dev-integration-tests.yml workflow manually
- Verify that billing tests are skipped (not failed)
- Verify that other tests still pass

## Testing Strategy

### Unit Tests

No new unit tests needed - this is a configuration/runtime change.

### Integration Tests

**Verify skip behavior**:
- Run `ENABLE_BILLING_TESTS=false pnpm --filter web-e2e test` and verify billing tests are skipped
- Run `ENABLE_BILLING_TESTS=true pnpm --filter web-e2e test` and verify billing tests run
- Run `pnpm --filter web-e2e test:integration` and verify billing tests are skipped (default is disabled)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run integration tests locally with `ENABLE_BILLING_TESTS=false` (default) - billing tests should be skipped
- [ ] Run integration tests locally with `ENABLE_BILLING_TESTS=true` - billing tests should run
- [ ] Run `pnpm --filter web-e2e test:integration` and verify output shows tests skipped
- [ ] Trigger dev-integration-tests.yml workflow and verify it passes
- [ ] Verify other integration tests (auth, team accounts) still pass
- [ ] Check GitHub Actions logs to confirm billing tests show as skipped, not failed

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Tests permanently disabled by accident**: Unlikely - environment variable is explicit and documented
   - **Likelihood**: low
   - **Impact**: medium (tests don't run, which is what we want)
   - **Mitigation**: The skip condition is clearly documented in code comments

2. **Someone doesn't understand why tests are skipped**: Possible if not documented
   - **Likelihood**: medium
   - **Impact**: low (just needs to check environment variable docs)
   - **Mitigation**: Add clear comment explaining the skip condition

3. **Billing tests genuinely need to run but skip anyway**: Won't happen - we control the env var
   - **Likelihood**: low
   - **Impact**: high
   - **Mitigation**: Environment variable `ENABLE_BILLING_TESTS` must be set to "true" to enable tests

**Rollback Plan**:

If this causes issues:
1. Remove the `test.skip()` lines from both billing test files
2. Tests will return to running in all contexts
3. Re-open issue #923 and try Option 2 or 3

**Monitoring** (if needed):

- Monitor dev-integration-tests.yml workflow success rate (should improve from current failures)
- Watch for any complaints about billing tests not running in expected contexts
- No special metrics needed - success is measured by workflow passing

## Performance Impact

**Expected Impact**: Negligible

- Skip evaluation is a single environment variable check at test startup
- <1ms performance impact per test file
- No runtime overhead during test execution

## Security Considerations

**Security Impact**: None

- This is purely a test configuration change
- No security implications
- Environment variable is already used elsewhere in the codebase

## Validation Commands

### Before Fix (Billing Tests Should Run Despite Being Disabled)

```bash
# Current behavior - tests run and fail
ENABLE_BILLING_TESTS=false pnpm --filter web-e2e test:integration --grep "billing"
```

**Expected Result**: Tests run and fail with timeout errors (this is the bug)

### After Fix (Billing Tests Should Be Skipped)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run integration tests - billing should be skipped by default
pnpm --filter web-e2e test:integration

# Run with billing disabled explicitly - should skip
ENABLE_BILLING_TESTS=false pnpm --filter web-e2e test:integration --grep "billing"

# Run with billing enabled - should run (and may timeout/fail as expected)
ENABLE_BILLING_TESTS=true pnpm --filter web-e2e test:integration --grep "billing"
```

**Expected Result**:
- Type check passes
- Lint passes
- Format passes
- With default or `ENABLE_BILLING_TESTS=false`: Billing tests skipped
- With `ENABLE_BILLING_TESTS=true`: Billing tests run (as expected)

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm --filter web-e2e test

# Run integration tests suite
pnpm --filter web-e2e test:integration

# Verify auth tests still pass
pnpm --filter web-e2e test:integration --grep "auth"

# Verify team account tests still pass
pnpm --filter web-e2e test:integration --grep "team"
```

## Dependencies

### New Dependencies

None required

## Database Changes

No database changes required

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - environment variable already exists in workflow

The change is backwards compatible because:
- Environment variable `ENABLE_BILLING_TESTS` already exists in the workflow
- New behavior matches the intent of the variable
- Tests still run when `ENABLE_BILLING_TESTS=true`

## Success Criteria

The fix is complete when:
- [ ] Both billing test files have `test.skip()` checks
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Billing tests skip when `ENABLE_BILLING_TESTS=false` or undefined
- [ ] Billing tests run when `ENABLE_BILLING_TESTS=true`
- [ ] Dev integration test workflow passes (11+ passing, billing tests skipped)
- [ ] No regression in other integration tests
- [ ] GitHub Actions logs show billing tests as skipped, not failed

## Notes

**Additional Context**:

This is a minimal, focused fix for the primary root cause. The secondary issues (auth page timing and locator ambiguity) can be addressed separately if needed, but disabling billing tests resolves the immediate workflow failures.

**Related Documentation**:
- Playwright skip documentation: https://playwright.dev/docs/api/class-test#test-skip
- `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md` - E2E testing patterns and configuration
- `.ai/ai_docs/context-docs/testing+quality/fundamentals.md` - Test fundamentals and patterns

**Why This Solution**:

According to the E2E testing documentation in the project, `test.skip()` is the recommended way to conditionally skip test suites in Playwright. This approach:
1. Works with any test invocation method (grep, file patterns, etc.)
2. Is immediately evaluated at test startup time
3. Provides clear feedback in test runner output (tests shown as skipped, not failed)
4. Follows established Playwright patterns used elsewhere in the codebase

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #923*
