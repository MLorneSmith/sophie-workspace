# E2E Test Fix Plan

## Current Issues

1. **Authentication Flow Issues**
   - Sign-up redirects to `/onboarding` but fails to redirect to `/home`
   - Alert message: "Failed to redirect to /home. Current URL: <http://localhost:3000/onboarding>"
   - This blocks dependent tests that require authentication

2. **Timeout Issues**
   - Tests timing out at 120 seconds
   - Initial server compilation takes ~4 seconds
   - Some tests may need more time for complex operations

3. **Configuration Issues**
   - Max failures was set to 1, now increased to 50 (local) and 10 (CI)
   - Parallel execution limited to 1 worker locally

## Prioritized Fixes

### Priority 1: Fix Onboarding Redirect (Blocking Multiple Tests)

- **Issue**: After sign-up, users get stuck on `/onboarding` instead of redirecting to `/home`
- **Impact**: Blocks all authentication-dependent tests
- **Action**:
  1. Check onboarding completion logic in `/apps/web/app/onboarding/page.tsx`
  2. Verify redirect logic after onboarding completion
  3. Consider adding a test helper to bypass onboarding for test users

### Priority 2: Increase Test Timeouts

- **Issue**: Tests timing out with current 120s limit
- **Impact**: False failures due to timing
- **Action**:
  1. Increase test timeout from 120s to 180s
  2. Add specific timeouts for authentication flows
  3. Consider adding wait conditions for server readiness

### Priority 3: Optimize Test Execution

- **Issue**: Slow test execution and resource contention
- **Impact**: Developer productivity
- **Action**:
  1. Add test data cleanup between tests
  2. Implement test user pool to avoid conflicts
  3. Consider running tests in smaller batches

### Priority 4: Improve Error Reporting

- **Issue**: Hard to debug failures with limited information
- **Impact**: Debugging efficiency
- **Action**:
  1. Add more detailed error messages
  2. Capture screenshots on failure
  3. Add console log capture for failed tests

## Implementation Steps

1. **Immediate** (Today):
   - [x] Increase max failures limit
   - [ ] Fix onboarding redirect issue
   - [ ] Increase test timeouts

2. **Short-term** (This Week):
   - [ ] Add test helpers for authentication
   - [ ] Implement better error reporting
   - [ ] Add retry logic for flaky tests

3. **Long-term** (Next Sprint):
   - [ ] Optimize test data management
   - [ ] Implement parallel test execution
   - [ ] Add performance monitoring for tests

## Success Metrics

- All authentication tests passing consistently
- Test execution time under 10 minutes for full suite
- Zero timeout failures in normal conditions
- Clear error messages for actual failures
