# Bug Fix: Dev Integration Tests Auth Session Lost During Parallel Test Execution

**Related Diagnosis**: #1075 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Time-based session invalidation during extended serial test execution. Session tokens expire ~23 seconds into tests when running with CI_WORKERS=1 (serial mode).
- **Fix Approach**: Disable Vercel Live iframe (known to interfere with cookies), add token refresh handling between tests, and revert to parallel execution with proper worker isolation.
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Dev-integration-tests workflow fails after ~20 seconds of test execution. Tests initially authenticate successfully and navigate to protected pages, but auth session is lost mid-test causing redirects to `/auth/sign-in`. The issue appears to be related to either:

1. Vercel Live iframe interference with cookie handling
2. Session token expiration during extended serial test execution
3. Missing explicit session refresh between parallel test executions

For full details, see diagnosis issue #1075.

### Solution Approaches Considered

#### Option 1: Disable Vercel Live Toolbar ⭐ RECOMMENDED

**Description**: Add `x-vercel-skip-toolbar: 1` header to playwright.config.ts extraHTTPHeaders to disable the Vercel Live feedback iframe that loads on every page navigation. This iframe is from a different origin (vercel.live) and may interfere with cookie handling in cross-origin scenarios.

**Pros**:
- Simplest fix (one-line change)
- Low risk - no behavioral changes, just disables a development feature
- Addresses a known variable identified in diagnosis
- Can be done immediately without investigation
- Cross-origin iframe issues are documented Playwright gotchas

**Cons**:
- Might be treating a symptom, not the root cause
- If this doesn't fix it, we need additional investigation
- Requires testing to confirm it solves the issue

**Risk Assessment**: low - disabling a development toolbar won't affect real authentication

**Complexity**: simple - one HTTP header

#### Option 2: Revert CI_WORKERS to 3 and Test Parallel Execution

**Description**: Change `CI_WORKERS` back from 1 to 3 in playwright.config.ts. Diagnosis notes that tests passed with 3 workers (parallel) but fail with 1 worker (serial). The longer test duration with serial execution appears to trigger session invalidation. Parallel execution completes faster, reducing time for tokens to expire.

**Pros**:
- Diagnosis already shows this configuration worked (run 20105824526 ✅)
- Addresses the root cause (time-based session expiration)
- Potentially faster test execution with parallelism
- Confirms the issue is duration/time-based, not parallelism-based

**Cons**:
- Reverts a fix that was meant to address parallel authentication race conditions
- May reintroduce the original parallel worker auth issues if not addressed properly
- Requires ensuring worker isolation is properly configured
- More complex testing to confirm no regressions

**Risk Assessment**: medium - need to ensure proper worker isolation to prevent race conditions

**Complexity**: moderate - requires configuration change and thorough testing

#### Option 3: Add Explicit Session Refresh Between Tests

**Description**: Implement an `afterEach` or periodic session refresh hook in the test setup that explicitly calls `supabase.auth.refreshSession()` to prevent token expiration during long-running test suites.

**Pros**:
- Keeps serial execution (no parallelism issues)
- Explicitly manages session lifetime
- Can be tuned to refresh at optimal intervals

**Cons**:
- Requires changes to test infrastructure
- Adds complexity to test setup
- Doesn't address the Vercel Live iframe issue
- May mask underlying issues with session management

**Risk Assessment**: medium - changes test execution behavior

**Complexity**: moderate - requires test infrastructure changes

### Selected Solution: Option 1 + Option 2 (Combined Approach)

**Justification**:

The diagnosis provides two independent observations that point to different issues:

1. **Vercel Live iframe** - A known variable that should be eliminated first. This is a low-risk, one-line change that addresses a documented cross-origin iframe gotcha.

2. **Parallel vs Serial execution** - The evidence is clear: tests passed with 3 workers but fail with 1 worker. The issue appears to be time-based (tokens expire after ~23 seconds), and serial execution takes longer, exposing the problem. However, the original change to serial execution was meant to fix parallel authentication race conditions.

**Combined approach**:
1. Disable the Vercel Live iframe first (low-risk quick fix)
2. Investigate and address the parallel worker auth issue properly
3. Revert to 3 workers if parallel execution works, or keep 1 worker if it doesn't

This two-phase approach:
- Solves the immediate problem (disable toolbar)
- Confirms if parallelism was the real issue
- Provides data for better decisions

**Technical Approach**:
- Add `x-vercel-skip-toolbar: 1` header to disable the iframe
- Review the parallel worker authentication issue (Issue #1062, #1063)
- Either revert to parallel workers OR add token refresh handling
- Thoroughly test both serial and parallel execution

## Implementation Plan

### Affected Files

- `apps/e2e/playwright.config.ts` - Add Vercel toolbar disable header
- `apps/e2e/global-setup.ts` - May need token refresh handling (depends on Phase 2 findings)
- `apps/e2e/tests/` - May need test updates (depends on Phase 2 findings)

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Disable Vercel Live Iframe

<describe what this step accomplishes>

Disable the Vercel Live feedback iframe which loads on every page navigation and may interfere with cookie handling in cross-origin contexts.

- Locate the `extraHTTPHeaders` section in `apps/e2e/playwright.config.ts`
- Add `"x-vercel-skip-toolbar": "1"` header to the object
- Verify the change doesn't affect other Vercel bypass headers
- Commit with clear message

**Why this step first**: It's a low-risk, one-line change that addresses a known issue. If it fixes the problem, we're done. If not, we have more data for Step 2.

#### Step 2: Test Current Configuration

Run dev-integration-tests workflow with the toolbar disabled to see if it resolves the issue.

- Push a test commit with the toolbar fix
- Monitor the GitHub Actions run
- Check test results after ~30-40 seconds
- If tests pass: issue is resolved, proceed to validation
- If tests still fail: proceed to Step 3

#### Step 3: Investigate Parallel Worker Authentication (Conditional)

<describe what this step accomplishes>

Only proceed if tests still fail after disabling the toolbar. Review the original parallel worker authentication issues and determine if we can safely revert to parallel execution.

- Review Issues #1062 and #1063 to understand the original race condition
- Analyze the global-setup.ts authentication flow
- Identify potential race condition sources (simultaneous token refresh, cookie conflicts)
- Design proper worker isolation if needed
- Consider adding explicit session refresh between tests if needed

#### Step 4: Add Token Refresh Handling (If Needed)

<describe what this step accomplishes>

If parallel execution cannot be safely restored, add explicit session refresh to prevent token expiration during long-running serial test execution.

- Add a session refresh function to the test setup
- Call it periodically or after each test (depending on configuration)
- Verify that token refresh doesn't cause auth state issues
- Test with serial execution to confirm it prevents session loss

#### Step 5: Add/Update Tests

<describe the testing strategy>

- Add regression test that runs for >30 seconds to verify session doesn't expire
- Add test that validates Vercel toolbar is not loaded (check for absence of vercel.live requests)
- Update existing tests to ensure they still pass with new configuration
- Run full E2E test suite in CI to verify no regressions

#### Step 6: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions in existing tests
- Confirm tests complete successfully with new configuration
- Check that session remains valid throughout long-running test suites

## Testing Strategy

### Unit Tests

No unit tests needed for this fix (infrastructure-level change).

### Integration Tests

Integration tests are the primary validation mechanism:

- ✅ Full E2E test suite with toolbar disabled
- ✅ Long-running test (>30 seconds) to verify session doesn't expire
- ✅ Parallel execution test (if reverting to 3 workers)
- ✅ Cross-origin iframe test to verify toolbar is disabled
- ✅ Regression test for existing auth flows

**Test files**:
- `apps/e2e/tests/` - Run full suite with new configuration

### E2E Tests

The E2E test suite itself is the primary test for this fix:

- Run the dev-integration-tests workflow
- Verify all tests complete without session loss
- Verify no timeout errors after 20+ seconds
- Verify tests can navigate to protected pages throughout execution

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Disable Vercel toolbar header is present in playwright.config.ts
- [ ] Run `pnpm test:e2e` locally and verify tests complete successfully
- [ ] Monitor tests for ~30-40 seconds and confirm no auth redirects
- [ ] Check browser dev tools (Network tab) and verify no vercel.live requests load
- [ ] Verify test output shows successful navigation to protected pages
- [ ] Run tests multiple times to ensure consistency
- [ ] If reverting to parallel workers: verify tests pass with 3 workers and no race conditions
- [ ] Verify no regressions in existing E2E tests

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Disabling toolbar affects development workflow**: If someone relies on the Vercel Live toolbar for feedback, they'll lose that feature in E2E tests. However, this is a test-only change and doesn't affect production or development.
   - **Likelihood**: low (tests are CI-only)
   - **Impact**: low (development feature, not critical)
   - **Mitigation**: Document that toolbar is disabled in E2E tests for stability

2. **Cookie issues persist after disabling toolbar**: If the Vercel Live iframe isn't the root cause, this won't fix the issue and we'll need to investigate further.
   - **Likelihood**: medium (it's one variable among several)
   - **Impact**: medium (tests will still fail, need more investigation)
   - **Mitigation**: Have Step 3-4 investigation ready if needed

3. **Reverting to parallel workers reintroduces race conditions**: If we revert to 3 workers without properly addressing the original race condition, tests may become flaky.
   - **Likelihood**: low (original fix was for parallel auth race, not test execution)
   - **Impact**: high (flaky tests are worse than slow serial tests)
   - **Mitigation**: Thoroughly test parallel execution before committing; have serial execution as fallback

**Rollback Plan**:

If this fix causes issues:

1. Remove `"x-vercel-skip-toolbar": "1"` header from `apps/e2e/playwright.config.ts`
2. Revert any worker count changes (keep `CI_WORKERS = 1`)
3. Revert any session refresh additions
4. Verify tests return to previous (failing) state to confirm rollback worked
5. Create a new issue with additional diagnostic data

**Monitoring** (if needed):

- Monitor E2E test run times to confirm no significant slowdown
- Monitor for new auth-related failures in CI
- Track test success rate over next 5 runs

## Performance Impact

**Expected Impact**: minimal to positive

- **Disabling toolbar**: Negligible impact (removes one HTTP request per page load)
- **Reverting to parallel (if done)**: 3-4x faster test execution due to parallelism
- **Serial execution**: Slower but more reliable (current state)

## Security Considerations

**Security Impact**: none

- Disabling Vercel Live toolbar has no security implications
- The toolbar is a development feature, not security-related
- Session refresh handling (if implemented) would improve security by ensuring fresh tokens

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Current state with CI_WORKERS=1 should fail after ~20 seconds
cd apps/e2e
PLAYWRIGHT_BASE_URL="http://localhost:3001" pnpm playwright test --project=chromium
# Expected: Tests fail with "team-selector element not found" after navigation redirects to /auth/sign-in
```

**Expected Result**: Tests fail after ~20-30 seconds when auth session is lost.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# E2E tests
cd apps/e2e
PLAYWRIGHT_BASE_URL="http://localhost:3001" pnpm playwright test

# Full test suite
pnpm test:e2e
```

**Expected Result**: All E2E tests pass, tests complete without auth session loss, session remains valid throughout execution.

### Regression Prevention

```bash
# Run full test suite multiple times to ensure consistency
for i in {1..3}; do
  echo "Run $i..."
  pnpm test:e2e
  if [ $? -ne 0 ]; then
    echo "Regression detected on run $i"
    exit 1
  fi
done

# Run with verbose output to see auth state changes
DEBUG_E2E_AUTH=true pnpm test:e2e
```

## Dependencies

### New Dependencies

No new dependencies required.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

- E2E test configuration change only
- No impact on production code
- No impact on deployed application
- Safe to deploy independently

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained (configuration-only change)

## Success Criteria

The fix is complete when:

- [ ] `x-vercel-skip-toolbar: 1` header is added to playwright.config.ts
- [ ] E2E tests run successfully for >30 seconds without session loss
- [ ] Tests can navigate to protected pages throughout execution
- [ ] No vercel.live iframe requests appear in test logs
- [ ] All existing E2E tests pass (zero regressions)
- [ ] If parallel execution tested: tests pass with 3 workers
- [ ] GitHub Actions dev-integration-tests workflow completes successfully

## Notes

### Issue Context

This bug is a follow-up to previous auth session issues (#1062, #1063, #1066, #1067) that were fixed by updating cookie domain configuration. The diagnosis notes that a fix in commit f2d7bab0e changed CI_WORKERS from 3 to 1 to "prevent parallel worker authentication race conditions," but this may have been addressing the wrong problem.

### Investigation Findings

The diagnosis provided valuable insights:

1. **Worker count evidence**: Tests pass with 3 workers (parallel) but fail with 1 worker (serial)
2. **Time-based failure**: Tests fail at ~23 seconds, which matches token expiration timeline
3. **Vercel iframe variable**: The Vercel Live iframe loads on every page and could interfere with cookies
4. **Hypothesis validity**: The iframe is a cross-origin request (vercel.live domain) which is a known gotcha in Playwright

### Recommended Reading

- Issue #1062: Cookie domain fixes
- Issue #1063: Cookie domain fixes
- Issue #1066: Previous auth regression
- Issue #1067: Previous auth regression
- Playwright docs on cross-origin iframes and cookie handling

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1075*
