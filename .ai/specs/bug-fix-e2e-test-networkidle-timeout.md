# Bug Fix: E2E Tests Failing - networkidle Timeout in CI

**Related Diagnosis**: #643
**Severity**: critical
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Tests use `waitUntil: "networkidle"` which times out in deployed environments due to persistent analytics/tracking scripts
- **Fix Approach**: Replace `waitUntil: "networkidle"` with `waitUntil: "domcontentloaded"` and add explicit element waits for specific UI components
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The dev-integration-tests workflow is failing with 100% failure rate. Tests timeout waiting for `waitUntil: "networkidle"` condition, which is never satisfied because production deployments have long-running network connections (analytics, websockets, or third-party scripts) that maintain persistent connections. This prevents the page from ever reaching a "network idle" state.

The error pattern shows navigation timeouts specifically on the `waitUntil: "networkidle"` step:
```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://...vercel.app/home/settings", waiting until "networkidle"
```

For full details, see diagnosis issue #643.

### Solution Approaches Considered

#### Option 1: Replace networkidle with domcontentloaded + explicit waits ⭐ RECOMMENDED

**Description**:
Change navigation strategy from `waitUntil: "networkidle"` (waits for all network activity to stop) to `waitUntil: "domcontentloaded"` (waits for DOM to be fully rendered), then explicitly wait for specific UI elements using `waitForSelector` or `waitForLoadState('domcontentloaded')`. This approach:

1. Immediately returns after DOM is loaded (fast - typically <2s)
2. Explicitly waits for needed UI elements before interacting
3. Tolerates long-running background scripts (analytics, tracking)
4. Provides clear test intent through explicit element waits

**Pros**:
- Reliable in both local and deployed environments
- Fast execution (avoids waiting for background scripts)
- Explicit waits make test intent clear
- Requires minimal code changes (just change `waitUntil` parameter)
- Matches Playwright best practices for deployed environments
- Zero risk of regressions

**Cons**:
- Slightly more verbose (need to add element waits)
- Requires identifying key elements to wait for per test

**Risk Assessment**: Low - This is the standard Playwright pattern for deployed environments with analytics

**Complexity**: Simple - Straightforward parameter change with consistent element wait patterns

#### Option 2: Configure analytics loading asynchronously

**Description**: Modify Next.js configuration or middleware to delay analytics script loading until after page interactive, preventing them from blocking "networkidle"

**Pros**:
- Solves root cause at the source
- Enables use of `networkidle` if desired

**Cons**:
- Requires modifying application code (beyond test scope)
- May impact analytics accuracy if delayed loading causes dropped events
- More complex implementation
- Risk of affecting production performance/metrics

**Why Not Chosen**: This is beyond the scope of test infrastructure fixes and introduces unnecessary complexity. The test infrastructure pattern (domcontentloaded + explicit waits) is battle-tested and solves the immediate problem.

#### Option 3: Increase test timeout dramatically

**Description**: Increase test timeout to 5-10 minutes to allow networkidle to eventually complete

**Pros**:
- No code changes needed

**Cons**:
- Tests become extremely slow (unacceptable for CI/CD)
- Doesn't solve the underlying issue
- Analytics might never allow networkidle state anyway
- Poor developer experience with long waits

**Why Not Chosen**: This is a band-aid that worsens the testing experience. Tests should complete quickly.

### Selected Solution: Replace networkidle with domcontentloaded + explicit waits

**Justification**:
This approach is the industry standard for E2E testing in deployed environments. Playwright's documentation explicitly recommends this pattern for applications with analytics, tracking, or persistent connections. It's fast, reliable, requires minimal code changes, and has zero risk of regression. The test infrastructure context confirms this is the recommended pattern for the SlideHeroes setup.

**Technical Approach**:
1. Replace all `page.goto(url, { waitUntil: "networkidle" })` with `page.goto(url, { waitUntil: "domcontentloaded" })`
2. After navigation, add explicit waits for key UI elements:
   - For form pages: `await page.waitForSelector('form', { timeout: 10000 })`
   - For pages with data: `await expect(page.getByText(/expected content/)).toBeVisible()`
   - For loaded state: `await page.waitForLoadState('domcontentloaded')`
3. This pattern maintains test reliability while allowing background scripts to run freely

**Architecture Changes**: None - this is purely a test infrastructure fix

**Migration Strategy**: Not needed - no data migration required

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/e2e/tests/account/account-simple.spec.ts` - 8 instances of `waitUntil: "networkidle"`
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Multiple instances
- `apps/e2e/tests/team-accounts/*.spec.ts` - Multiple test files
- `apps/e2e/tests/billing/*.spec.ts` - Multiple test files
- Any other test files using `waitUntil: "networkidle"` pattern

### New Files

No new files needed - this is a refactor of existing tests.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Search and identify all networkidle usage

This step identifies the scope of changes needed.

- Search for all `waitUntil: "networkidle"` patterns across test files
- Catalog affected test files and specific line numbers
- Identify test purpose for each affected test

**Why this step first**: Ensures we understand the full scope before making changes

#### Step 2: Update account-simple.spec.ts

This is a high-value target with 8+ instances and is part of the failing test suite.

- Replace all `page.goto(url, { waitUntil: "networkidle" })` with `page.goto(url, { waitUntil: "domcontentloaded" })`
- Verify tests already have explicit waits for elements (most already do)
- Remove any redundant waits for networkidle
- Test locally to confirm tests pass

#### Step 3: Update auth-simple.spec.ts

This test file is in the failing suite list.

- Replace all `waitUntil: "networkidle"` with `waitUntil: "domcontentloaded"`
- Add explicit waits if tests don't have them
- Ensure auth flow tests wait for actual auth state indicators

#### Step 4: Update team-accounts and billing test files

Update remaining failing tests.

- Update all team-accounts/*.spec.ts files
- Update all billing/*.spec.ts files
- Ensure each navigation is followed by explicit element waits

#### Step 5: Run comprehensive test validation

Verify all changes work correctly.

- Run tests locally against localhost
- Run tests against dev environment
- Verify no new failures introduced
- Check execution time (should be faster)

## Testing Strategy

### Unit Tests

No unit tests affected - this is E2E test infrastructure.

### Integration Tests

Not applicable - these are E2E tests.

### E2E Tests

Update affected E2E tests with the new pattern:

**Modified tests**:
- `apps/e2e/tests/account/account-simple.spec.ts` - All tests
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - All tests
- `apps/e2e/tests/team-accounts/team-accounts.spec.ts` - All tests
- `apps/e2e/tests/team-billing/team-billing.spec.ts` - All tests
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - All tests

**Regression test**: Verify original bug scenarios (timeout errors) no longer occur

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run full E2E suite locally: `pnpm test:e2e`
- [ ] Run affected tests against localhost
- [ ] Run affected tests against dev environment (deployed)
- [ ] Verify no timeout errors in CI logs
- [ ] Check test execution time improvement
- [ ] Verify all assertions still pass
- [ ] Test with and without analytics enabled

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Tests might pass but miss loading issues**: If we wait for domcontentloaded but page is still loading assets, we might miss real issues
   - **Likelihood**: low
   - **Impact**: medium (missed bugs)
   - **Mitigation**: Tests already include explicit waits for specific elements. DOM being loaded guarantees structure exists; test assertions verify the actual content.

2. **Timing issues with async content loading**: Some content might load asynchronously after DOM ready
   - **Likelihood**: medium
   - **Impact**: low (individual test failures caught quickly)
   - **Mitigation**: Existing tests already use `waitForSelector` and `expect(...).toBeVisible()` which handle async content

3. **Different wait behavior in CI vs local**: CI might have different network characteristics
   - **Likelihood**: low
   - **Impact**: low (caught in CI testing phase)
   - **Mitigation**: This is actually what we're fixing - tests are currently failing in CI due to networkidle

**Rollback Plan**:

If tests start failing unexpectedly:
1. Revert to previous commit: `git revert <commit-hash>`
2. Analyze specific test failures to understand root cause
3. Add more specific element waits if needed
4. Retry with targeted fix

**Monitoring** (if needed):
- Monitor test execution time (should decrease, not increase)
- Monitor test pass rate (should reach 100%)
- Monitor for timeout errors in CI logs

## Performance Impact

**Expected Impact**: Positive (faster tests)

- Current: Tests wait 30-90 seconds for networkidle (times out)
- After fix: Tests wait ~2-5 seconds for domcontentloaded + explicit elements
- Expected improvement: 80-90% faster execution
- Total E2E suite execution time: Currently failing → Should complete in <15 minutes

## Security Considerations

**Security Impact**: None

No security implications - this is purely a test infrastructure change with no impact on application code.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the failing tests - they should timeout
cd apps/e2e
pnpm test account-simple.spec.ts 2>&1 | grep -i "timeout\|networkidle"
```

**Expected Result**: Tests timeout with error about `waiting until "networkidle"`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# E2E tests - run the previously failing tests
pnpm test:e2e apps/e2e/tests/account/account-simple.spec.ts
pnpm test:e2e apps/e2e/tests/authentication/auth-simple.spec.ts
pnpm test:e2e apps/e2e/tests/team-accounts/team-accounts.spec.ts
pnpm test:e2e apps/e2e/tests/billing/team-billing.spec.ts
pnpm test:e2e apps/e2e/tests/billing/user-billing.spec.ts

# Full E2E suite
pnpm test:e2e

# Build
pnpm build
```

**Expected Result**: All commands succeed, tests pass, no timeout errors, faster execution time.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# E2E specific regression check
cd apps/e2e && pnpm test --reporter=list | tail -20

# Verify no networkidle references remain (if any, they need updating)
grep -r "waitUntil.*networkidle" apps/e2e/tests/ || echo "✅ All networkidle references replaced"
```

## Dependencies

No new dependencies required - using existing Playwright APIs.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: None - test-only changes

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - tests continue to work as before, just faster

## Success Criteria

The fix is complete when:
- [ ] All instances of `waitUntil: "networkidle"` replaced with `waitUntil: "domcontentloaded"`
- [ ] Each navigation is followed by explicit element waits
- [ ] All previously failing tests now pass
- [ ] Tests run significantly faster (80%+ improvement)
- [ ] No timeout errors in CI logs
- [ ] Zero regressions in test results
- [ ] All validation commands pass
- [ ] Code review approved (if applicable)
- [ ] Tests pass in CI/CD pipeline

## Notes

This fix directly addresses the root cause identified in diagnosis #643. The `networkidle` strategy is fundamentally incompatible with modern web applications that use analytics, tracking, and persistent connections. Switching to `domcontentloaded` + explicit waits is the industry-standard solution recommended by Playwright and used by major testing frameworks.

The fix is minimal, low-risk, and immediately solvable. Tests already follow good practices (AAA pattern, explicit waits, clear assertions), so this is primarily a parameter adjustment rather than restructuring.

Related documentation confirms this is the correct approach:
- `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md` - Section on "CI/CD Failures" recommends this exact pattern
- Playwright official documentation: https://playwright.dev/docs/api/class-page#page-goto

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #643*
