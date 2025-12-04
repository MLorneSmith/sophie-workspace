# Bug Fix: Three Flaky Payload E2E Tests in Shard 8

**Related Diagnosis**: #865 (REQUIRED)
**Severity**: low
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Race conditions between async operations and immediate assertions; hardcoded timeouts; missing retry logic for transient failures
- **Fix Approach**: Replace anti-patterns with Playwright's `expect().toPass()` pattern for reliable async operation handling
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Three Payload E2E tests in shard 8 exhibit intermittent flakiness - they fail on the first attempt but pass on retry. The failures stem from three distinct root causes:

1. **Test 1 (payload-auth.spec.ts:115)**: Authentication state check immediately after login doesn't wait for session propagation during parallel execution
2. **Test 2 (payload-database.spec.ts:151)**: Uses anti-pattern `page.waitForTimeout(1000)` instead of proper async waiting
3. **Test 3 (payload-database.spec.ts:369)**: Health endpoint check doesn't have retry logic for transient network issues

For full details, see diagnosis issue #865.

### Solution Approaches Considered

#### Option 1: Use Playwright `expect().toPass()` Pattern ⭐ RECOMMENDED

**Description**: Wrap unreliable async operations (authentication checks, API calls, error message rendering) in `expect().toPass()` blocks. This is Playwright's built-in pattern for flaky operations, which automatically retries the entire block with configurable intervals until it passes or times out.

**Pros**:
- Playwright's official recommendation for handling flaky operations
- Automatically retries with exponential backoff (default intervals: 100ms, 250ms, 500ms, 1s, 2s, 5s, 10s, 30s)
- Doesn't require custom retry logic or polling
- Scales perfectly with parallel execution
- No changes to test data or external systems
- Minimal code changes (wrap existing assertions)

**Cons**:
- Requires wrapping the operation in an async function
- Slightly longer code per operation

**Risk Assessment**: low - This is a Playwright-proven pattern used across hundreds of test suites

**Complexity**: simple - Straightforward code pattern wrapping

#### Option 2: Add Manual Retry Logic with Custom Polling

**Description**: Implement custom retry loops with `page.waitForFunction()` or similar polling mechanisms to retry operations on failure.

**Pros**:
- More control over retry behavior
- Can customize intervals per operation

**Cons**:
- Requires writing custom retry logic for each case
- More code to maintain
- No built-in exponential backoff
- Duplicates what Playwright already provides

**Why Not Chosen**: `expect().toPass()` is the standard pattern; reinventing the wheel introduces unnecessary complexity and maintenance burden.

#### Option 3: Increase Static Timeouts

**Description**: Simply increase `page.waitForTimeout()` values from 1000ms to 3000ms or more.

**Why Not Chosen**: This is the anti-pattern causing the flakiness. Static timeouts don't address the underlying race conditions; they just mask the problem and make tests slower.

### Selected Solution: Use Playwright `expect().toPass()` Pattern

**Justification**: Playwright's `expect().toPass()` is the official, proven pattern for handling flaky async operations. It's designed exactly for this use case - race conditions between operations and assertions during parallel execution. The pattern is already used successfully elsewhere in the codebase and requires minimal changes.

**Technical Approach**:

1. **Auth Race Condition (Test 1)**: Wrap `checkAuthenticationState()` call in `expect().toPass()` block to handle session propagation timing
2. **Hardcoded Timeout (Test 2)**: Replace `page.waitForTimeout(1000)` with proper async wait using `expect().toPass()` or `waitForFunction()`
3. **Missing Retry Logic (Test 3)**: Wrap health endpoint check in `expect().toPass()` block to handle transient network failures

**Architecture Changes**: None - this is a pattern change within individual tests, not an architectural modification.

**Migration Strategy**: Not needed - this fix is backward-compatible and doesn't affect other tests or systems.

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/payload-auth.spec.ts:115-129` - Fix auth race condition in "should login with existing user" test
- `apps/e2e/tests/payload/payload-database.spec.ts:151-180` - Fix hardcoded timeout and add proper async waiting
- `apps/e2e/tests/payload/payload-database.spec.ts:369-400` - Add retry logic for health endpoint check

### New Files

None - all fixes are within existing test files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix Authentication Race Condition in Test 1

Modify `payload-auth.spec.ts` line 115-129 to wrap `checkAuthenticationState()` with `expect().toPass()` pattern.

**Current Code**:
```typescript
const isLoggedIn = await loginPage.checkAuthenticationState();

if (!isLoggedIn) {
  await loginPage.createFirstUser(email, password, "Admin User");
}

await loginPage.expectLoginSuccess();
```

**Fixed Code**:
```typescript
// Use toPass() to handle session propagation timing during parallel execution
const isLoggedIn = await expect(async () => {
  const result = await loginPage.checkAuthenticationState();
  expect(result).toBeTruthy();
}).toPass({ timeout: 10000 });

// If initial check passed, we're done
// If it failed (shouldn't happen after toPass), create first user as fallback
// But toPass() ensures we're authenticated before continuing
await loginPage.expectLoginSuccess();
```

**Why this step first**: Auth state is foundational - all other operations depend on it. Fixing the race condition here prevents cascading failures in subsequent operations.

#### Step 2: Fix Hardcoded Timeout in Test 2

Modify `payload-database.spec.ts` line 151-180 to replace `page.waitForTimeout(1000)` with proper async waiting.

**Current Code** (around line 175):
```typescript
await page.waitForTimeout(1000); // Wait for error messages to render
```

**Fixed Code**:
```typescript
// Use toPass() to wait for error messages to render with proper async pattern
await expect(async () => {
  // Check if error message is visible
  const errorMessage = await page.locator('[role="alert"], .error-message').first();
  const isVisible = await errorMessage.isVisible().catch(() => false);
  expect(isVisible).toBeTruthy();
}).toPass({ timeout: 10000, intervals: [100, 250, 500, 1000, 2000] });
```

**Alternative simpler fix** (if error messages are already in DOM):
```typescript
// Wait for error to be visible
await expect(page.locator('[role="alert"], .error-message').first()).toBeVisible();
```

**Why this step second**: Replaces the anti-pattern hardcoded timeout with Playwright's async pattern.

#### Step 3: Add Retry Logic to Health Endpoint Check in Test 3

Modify `payload-database.spec.ts` line 369-400 to add retry logic for health endpoint check.

**Current Code** (around line 374-389):
```typescript
const configResponse = await page.request.get(
  `${loginPage.baseURL}/api/health`,
);

if (!configResponse.ok()) {
  const responseText = await configResponse.text();

  if (
    responseText.includes("DATABASE_URI") ||
    responseText.includes("PAYLOAD_SECRET")
  ) {
    console.error("Missing required environment variables for Payload");
    throw new Error(
      "Payload is not properly configured. Check DATABASE_URI and PAYLOAD_SECRET environment variables.",
    );
  }
}
```

**Fixed Code**:
```typescript
// Use toPass() to handle transient network failures
await expect(async () => {
  const configResponse = await page.request.get(
    `${loginPage.baseURL}/api/health`,
  );

  expect(configResponse.ok()).toBeTruthy();

  // Only check for specific errors if response indicates config issues
  if (!configResponse.ok()) {
    const responseText = await configResponse.text();

    if (
      responseText.includes("DATABASE_URI") ||
      responseText.includes("PAYLOAD_SECRET")
    ) {
      throw new Error(
        "Payload is not properly configured. Check DATABASE_URI and PAYLOAD_SECRET environment variables.",
      );
    }
  }
}).toPass({ timeout: 15000, intervals: [500, 1000, 2000, 5000] });
```

**Why this step third**: Adds retry logic for external API calls which may have transient failures.

#### Step 4: Run Type Check and Linting

Ensure all changes are TypeScript-safe and follow project conventions.

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

**Why this step last**: Validation should happen after all code changes are complete.

#### Step 5: Verify Fixes

Run the specific failing tests and the full test suite to ensure no regressions.

```bash
# Run just the affected tests
pnpm test:e2e tests/payload/payload-auth.spec.ts:115
pnpm test:e2e tests/payload/payload-database.spec.ts:151
pnpm test:e2e tests/payload/payload-database.spec.ts:369

# Run full shard 8
pnpm test:shard8

# Run full E2E suite to check for regressions
pnpm test:e2e
```

## Testing Strategy

### Unit Tests

No unit tests needed - these are E2E test fixes, not new functionality.

### Integration Tests

No integration tests needed - this is E2E pattern improvement.

### E2E Tests

**Test coverage**:
- ✅ Auth state race condition handling - Test will retry until session is propagated
- ✅ Error message rendering timing - Test will retry until error messages appear
- ✅ Health endpoint transient failures - Test will retry on network failures
- ✅ Regression test: All three tests should pass on first run (or after reasonable retries)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run shard 8 tests locally at least 3 times - should pass every time (or after reasonable retries)
- [ ] Run shard 8 tests in CI/parallel mode - verify no flakiness
- [ ] Verify test execution time hasn't increased significantly
- [ ] Check console output for no new warnings or errors
- [ ] Verify `expect().toPass()` intervals are working (should see retry attempts in verbose output)
- [ ] Run full E2E suite to ensure no regressions in other tests
- [ ] Verify timeout values are appropriate for your CI environment

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Retry Timeout Too Short**: If 10000ms timeout is insufficient for slow CI environments
   - **Likelihood**: low (10 seconds is generous)
   - **Impact**: low (would still retry, just with more attempts)
   - **Mitigation**: Monitor test execution times; increase timeout if needed (15000ms-20000ms for slower CI)

2. **Interval Configuration**: Custom retry intervals may not match your environment's timing
   - **Likelihood**: low (defaults are well-proven by Playwright)
   - **Impact**: low (just affects retry count, not pass/fail outcome)
   - **Mitigation**: Monitor first few runs; adjust intervals if needed

3. **Breaking Changes in Playwright**: Future versions might change `toPass()` behavior
   - **Likelihood**: very low (core pattern unlikely to change)
   - **Impact**: low (could fall back to previous pattern)
   - **Mitigation**: Check Playwright release notes; use version pinning if needed

4. **Masking Underlying Issues**: `toPass()` retries might hide real problems
   - **Likelihood**: very low (pattern is conservative; real failures still fail after timeout)
   - **Impact**: medium (could hide auth issues)
   - **Mitigation**: Monitor failure patterns; if same test fails consistently, investigate root cause

**Rollback Plan**:

If these fixes cause issues:
1. Revert changes to affected test files
2. Run tests with previous hardcoded timeouts
3. Investigate root cause of any new failures
4. File new bug report if pattern doesn't work in your environment

**Monitoring** (if needed):

- Monitor test execution times for first 5 runs to ensure no slowdown
- Watch for `expect().toPass()` timeout errors in CI logs
- Track pass rate: should be >99% (higher than before)

## Performance Impact

**Expected Impact**: minimal

The `expect().toPass()` pattern uses exponential backoff with reasonable intervals, so it should have minimal performance impact:
- **Fast path** (< 100ms): Returns immediately on first success (most common)
- **Slow path** (100ms-10s): Retries a few times with increasing delays
- **Timeout path** (> 10s): Fails after timeout (rare with proper intervals)

Tests that previously failed intermittently will now pass reliably with slight additional latency only when async operations take time.

## Security Considerations

**Security Impact**: none

No security implications - this is purely a test reliability improvement.

## Validation Commands

### Before Fix (Tests Should Flake)

```bash
# Run shard 8 multiple times - should see intermittent failures
for i in {1..5}; do
  echo "Run $i:"
  pnpm test:shard8 || true
done
```

**Expected Result**: At least one test failure in the sequence (demonstrating flakiness).

### After Fix (Tests Should Be Reliable)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run just the affected tests multiple times
for i in {1..3}; do
  echo "Run $i of affected tests:"
  pnpm test:e2e tests/payload/payload-auth.spec.ts:115
  pnpm test:e2e tests/payload/payload-database.spec.ts:151
  pnpm test:e2e tests/payload/payload-database.spec.ts:369
done

# Run full shard 8
pnpm test:shard8

# Run full E2E suite
pnpm test:e2e
```

**Expected Result**: All tests pass consistently across multiple runs, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Check for any new flakiness
pnpm test:e2e --repeat-each=2
```

## Dependencies

### New Dependencies

**No new dependencies required** - `expect().toPass()` is built into Playwright.

## Database Changes

**No database changes required** - These are test-only changes.

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: None - tests only, no code changes.

**Feature flags needed**: no

**Backwards compatibility**: maintained - No breaking changes to functionality.

## Success Criteria

The fix is complete when:
- [ ] All three affected tests pass consistently (pass 3+ times without flakes)
- [ ] `expect().toPass()` pattern is properly implemented for all three async operations
- [ ] All validation commands pass
- [ ] Zero regressions detected in full E2E suite
- [ ] Test execution time hasn't increased by >10%
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Key Implementation Details**:

1. **Timeout Values**: Using 10000ms (10 seconds) as safe default for most environments. CI environments may need 15000-20000ms.

2. **Retry Intervals**: The default intervals `[100, 250, 500, 1000, 2000, 5000, 10000, ...]` provide exponential backoff. Custom intervals can be provided via the options object.

3. **Error Messages**: The fixed tests will provide better diagnostics if they still fail after retries - Playwright shows all failed assertions in the retry attempts.

4. **Local vs CI**: Tests may behave slightly differently locally (usually faster) vs CI (slower). Use CI timeout values for production builds.

**Related Documentation**:

- [E2E Testing Fundamentals](../../ai_docs/context-docs/testing+quality/e2e-testing.md) - Playwright patterns and best practices
- [Playwright Expect Documentation](https://playwright.dev/docs/api/class-playrighttesexpect#expect-async) - Official `expect().toPass()` reference
- Diagnosis issue: #865 - Original bug report with detailed analysis

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #865*
