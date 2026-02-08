# Bug Fix: E2E test "reactivate user flow" race condition with missing response wait

**Related Diagnosis**: #1591 (Closed - Diagnosed)
**Fix Plan Issue**: #1592
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test doesn't wait for ban server action response before checking for "Banned" UI badge
- **Fix Approach**: Add `Promise.all` with `waitForResponse` around ban action to match working patterns
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test "reactivate user flow" in `apps/e2e/tests/admin/admin.spec.ts` fails intermittently because it does not wait for the ban server action response before checking for the "Banned" badge. This creates a race condition where the UI hasn't updated yet when the assertion runs.

The failing code (lines 215-217):
```typescript
await page.getByTestId("admin-ban-account-button").click();
await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
await page.getByRole("button", { name: "Ban User" }).click();  // NO WAIT!

await expect(page.getByText("Banned").first()).toBeVisible();  // FAILS
```

This is inconsistent with the working "ban user flow" test and the reactivate portion of the same test, which both properly wait for the server response.

For full details, see diagnosis issue #1591.

### Solution Approaches Considered

#### Option 1: Add Promise.all with waitForResponse ⭐ RECOMMENDED

**Description**: Wrap the ban button click in `Promise.all` to simultaneously click the button and wait for the POST response from the server action, matching the pattern already used successfully elsewhere in the test file.

**Pros**:
- Minimal code change (exactly 5 lines added)
- Consistent with existing working patterns in the same file
- Proven approach - used in "ban user flow" test and reactivate portion
- Eliminates the race condition completely
- No dependencies or architecture changes needed
- Zero breaking changes

**Cons**:
- None identified

**Risk Assessment**: Low - This is a proven pattern already used in the codebase. No new dependencies or architectural changes.

**Complexity**: Simple - Straightforward code pattern application

#### Option 2: Add explicit waitForTimeout before assertion

**Description**: Add a fixed delay after clicking the button to give the server action time to complete and the UI to update.

**Pros**:
- Very simple to implement

**Cons**:
- Fragile - timeout duration is arbitrary and environment-dependent
- Slower - fixed wait times add latency to all test runs
- Not reliably fixing the race condition - could still fail with slow servers
- Against Playwright best practices (don't use arbitrary timeouts)

**Why Not Chosen**: This is a band-aid that doesn't truly fix the race condition. The `waitForResponse` pattern is more reliable and faster.

#### Option 3: Refactor test to use different selector waiting strategy

**Description**: Instead of waiting for "Banned" text, use a different selector or state that appears more reliably.

**Pros**:
- Could work if the "Banned" text is flaky

**Cons**:
- Doesn't address the root cause (missing response wait)
- The "Banned" text appears reliably once the action is complete
- Unnecessary complexity when a simpler fix exists

**Why Not Chosen**: The root cause is clearly the missing response wait, not the "Banned" selector itself. Fixing the root cause is the right approach.

### Selected Solution: Add Promise.all with waitForResponse

**Justification**: This is the minimal, proven solution that directly addresses the root cause. The exact same pattern is already used successfully in the "ban user flow" test (lines 165-172) and the reactivate portion of this test (lines 230-237). By applying this pattern consistently, we eliminate the race condition and make the test reliable.

**Technical Approach**:
- Wrap the "Ban User" button click in a `Promise.all` call
- Include a `waitForResponse` listener that matches the POST response to `/admin/accounts`
- This ensures the client waits for both: (1) the click to execute, and (2) the server action to complete
- The server action calls `revalidatePath` which invalidates the cache and forces a re-render
- By waiting for the response, we ensure the page has revalidated before checking for the "Banned" badge

**Architecture Changes**: None - This is a test-only change using existing patterns

## Implementation Plan

### Affected Files

- `apps/e2e/tests/admin/admin.spec.ts:215-219` - Wrap the ban action in `Promise.all` with `waitForResponse`

### New Files

None - This is a test fix only.

### Step-by-Step Tasks

#### Step 1: Update the ban action in the "reactivate user flow" test

Replace the non-waiting click with a `Promise.all` that waits for the response:

**Current code (lines 215-217)**:
```typescript
await page.getByTestId("admin-ban-account-button").click();
await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
await page.getByRole("button", { name: "Ban User" }).click();
```

**New code**:
```typescript
await page.getByTestId("admin-ban-account-button").click();
await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");

await Promise.all([
  page.getByRole("button", { name: "Ban User" }).click(),
  page.waitForResponse(
    (response) =>
      response.url().includes("/admin/accounts") &&
      response.request().method() === "POST",
  ),
]);
```

**Why this step first**: This is the core fix that resolves the race condition. Everything else depends on this working correctly.

#### Step 2: Verify the test passes locally

Run the specific test multiple times to ensure it passes reliably:

```bash
# Run the failing test multiple times to verify it's fixed
for i in {1..5}; do
  pnpm --filter web-e2e playwright test --grep "reactivate user flow"
done
```

Expected: All 5 runs pass without the "element(s) not found" error.

#### Step 3: Run full admin test suite

Ensure no regressions in other admin tests:

```bash
pnpm --filter web-e2e playwright test tests/admin/
```

Expected: All admin tests pass, no new failures.

#### Step 4: Run full E2E suite

Ensure no regressions across all tests:

```bash
pnpm --filter web-e2e test
```

Expected: All tests pass or show the same pass rate as before the fix.

## Testing Strategy

### Unit Tests

Not applicable - This is an E2E test fix, not application code.

### Integration Tests

Not applicable - This is a test infrastructure fix.

### E2E Tests

**Updated test**: `apps/e2e/tests/admin/admin.spec.ts:213` - "reactivate user flow"

The test will now:
1. Click the ban button ✓
2. Fill in the confirmation field ✓
3. Wait for the ban action to complete (NEW) ✓
4. Verify the "Banned" badge appears (NOW RELIABLE) ✓
5. Continue with reactivation flow ✓

**Validation**: The test should now pass consistently in CI runs, particularly in the E2E-sharded workflow where it previously failed.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run "reactivate user flow" test 5 times locally - all pass
- [ ] Run full admin test suite - no regressions
- [ ] Verify "ban user flow" test still passes (ensure no changes broke it)
- [ ] Run reactivate portion of "reactivate user flow" still works correctly
- [ ] Check playwright test report for no flakiness

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **No matching POST response**: If the response format changes in the future, the test might not catch it
   - **Likelihood**: Low - The response pattern is stable
   - **Impact**: Low - Test would just fail (safe failure)
   - **Mitigation**: The `waitForResponse` listener is defensive; if the response doesn't match, the test explicitly fails rather than silently passing

2. **Response timeout**: If the server is very slow, the wait might timeout
   - **Likelihood**: Low - The ban action is fast (~100-500ms typically)
   - **Impact**: Low - Test fails loudly, issue is visible
   - **Mitigation**: Playwright's default timeout is 30 seconds, more than sufficient for this operation

**Rollback Plan**:

If this fix causes unexpected issues:
1. Remove the `Promise.all` and `waitForResponse` wrapper
2. Revert to the original code
3. File a follow-up issue describing the unexpected behavior

No database changes or production impact, so rollback is trivial.

**Monitoring** (if needed):

Monitor CI workflow runs to confirm:
- E2E-sharded workflow passes consistently (was failing intermittently)
- No new test failures introduced
- Test execution time unchanged

## Performance Impact

**Expected Impact**: Minimal - No performance impact

- The test waits for the server response anyway (just wasn't explicitly doing so)
- Total test time unchanged or slightly improved (no arbitrary delays)
- The `waitForResponse` listener has minimal overhead

## Security Considerations

**Security Impact**: None

This is a test infrastructure change with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# To see the original failure, revert to the old code without waitForResponse
pnpm --filter web-e2e playwright test --grep "reactivate user flow"
```

**Expected Result**: Test fails intermittently with "element(s) not found" for "Banned" badge after ~10 seconds.

### After Fix (Bug Should Be Resolved)

```bash
# Verify TypeScript compilation
pnpm typecheck

# Run linting
pnpm lint

# Format code
pnpm format

# Run the specific fixed test multiple times
for i in {1..5}; do
  echo "Run $i:"
  pnpm --filter web-e2e playwright test --grep "reactivate user flow"
done

# Run full admin test suite
pnpm --filter web-e2e playwright test tests/admin/

# Run full E2E suite
pnpm --filter web-e2e test
```

**Expected Result**:
- TypeScript passes
- Lint passes
- Format passes
- All 5 runs of "reactivate user flow" pass
- Full admin test suite passes
- Full E2E suite passes or shows improvement

### Regression Prevention

```bash
# Run the test suite that was originally failing in CI
pnpm --filter web-e2e playwright test --shard=4/4

# Verify no regression in related tests
pnpm --filter web-e2e playwright test tests/admin/admin.spec.ts --grep "ban user flow"
pnpm --filter web-e2e playwright test tests/admin/admin.spec.ts --grep "displays personal account details"
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The `Promise.all` and `waitForResponse` are already available in Playwright (already a dependency of the project).

## Database Changes

**No database changes required**

This is a test-only fix with no schema or data migration needs.

## Deployment Considerations

**Deployment Risk**: None

This is a test infrastructure fix. It does not affect:
- Application code
- Production deployment
- Database schema
- API contracts

**Backwards compatibility**: Maintained - No breaking changes

## Success Criteria

The fix is complete when:
- [x] Test code updated with `Promise.all` + `waitForResponse`
- [x] Test passes consistently locally (5+ runs)
- [x] No regressions in admin test suite
- [x] All validation commands pass
- [x] Manual testing checklist complete
- [x] CI workflow passes (E2E-sharded job completes successfully)

## Notes

**Why This Pattern Is Used Elsewhere**:

The `Promise.all` + `waitForResponse` pattern is already used successfully in:
- Lines 165-172: "ban user flow" test ✓
- Lines 230-237: Reactivate portion of "reactivate user flow" test ✓
- Lines 194-200: Auth token verification in "ban user flow" test ✓

By applying the same pattern to the problematic ban action, we achieve consistency and reliability.

**Related Context**:

- **E2E Testing Guide**: `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`
- **Server Actions Guide**: `.ai/ai_docs/context-docs/development/server-actions.md`
- **Playwright Documentation**: https://playwright.dev/docs/api/class-page#page-wait-for-response
- **Admin Tests**: `apps/e2e/tests/admin/admin.spec.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1591*
