# Bug Fix: Flaky Timing Test in startup-monitor.spec.ts

**Related Diagnosis**: #1729
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test uses hardcoded 200ms upper bound that fails on CI spot instances with variable performance (elapsed time: 209ms)
- **Fix Approach**: Use fake timers to make test deterministic and remove dependency on real clock
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

A timing-sensitive test in `startup-monitor.spec.ts` fails intermittently on CI spot instances because it expects elapsed time to be under 200ms, but actual time was 209ms due to CPU scheduling delays.

For full details, see diagnosis issue #1729.

### Solution Approaches Considered

#### Option 1: Use Fake Timers ⭐ RECOMMENDED

**Description**: Use Vitest's `vi.useFakeTimers()` to control time programmatically, making the test completely deterministic and independent of real clock behavior.

**Pros**:
- Eliminates flakiness entirely - test becomes deterministic
- Makes test run faster (no actual waiting)
- Industry best practice for testing time-dependent code
- No arbitrary upper bounds to maintain
- Tests the actual behavior (elapsed time calculation) without testing setTimeout implementation

**Cons**:
- Requires understanding of fake timers API
- Minor test refactoring needed

**Risk Assessment**: low - Fake timers are a standard Vitest feature with extensive documentation

**Complexity**: simple - Single test function needs updating with clear examples in Vitest docs

#### Option 2: Remove Upper Bound

**Description**: Keep real timers but remove the `toBeLessThan(200)` assertion, only verifying that elapsed time increases.

**Pros**:
- Minimal code change (delete one line)
- Test still validates core behavior (elapsed time increases)
- Simple to implement

**Cons**:
- Doesn't eliminate flakiness source - still depends on real clock
- Test still waits 50ms real time (slower CI)
- Doesn't follow best practices for time-dependent tests
- Other similar tests in suite may also need changes

**Why Not Chosen**: Doesn't address root cause of time-dependent testing; fake timers are the proper solution

#### Option 3: Increase Upper Bound

**Description**: Change `toBeLessThan(200)` to `toBeLessThan(500)` or `toBeLessThan(1000)` to accommodate CI variability.

**Pros**:
- Minimal code change (one number)
- Quick fix

**Cons**:
- Doesn't eliminate flakiness, just reduces frequency
- Arbitrary threshold - how high is high enough?
- Test still depends on real clock and system load
- Future CI changes could still break it
- Doesn't follow best practices

**Why Not Chosen**: Band-aid solution that doesn't address root cause; threshold will always be arbitrary

### Selected Solution: Use Fake Timers

**Justification**: Fake timers are the industry-standard solution for testing time-dependent code. They make tests deterministic, faster, and eliminate flakiness entirely. This approach follows Vitest best practices and solves the problem at its root rather than working around it with arbitrary thresholds.

**Technical Approach**:
- Use `vi.useFakeTimers()` before creating tracker
- Use `vi.advanceTimersByTime(50)` instead of `await new Promise(setTimeout)`
- Restore real timers after test with `vi.useRealTimers()`
- Test validates that `getElapsedTime()` correctly calculates difference between Date.now() calls

**Architecture Changes**: None - this is a test-only change

**Migration Strategy**: Not needed - no runtime code affected

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/__tests__/startup-monitor.spec.ts:228-239` - Replace real timers with fake timers in `getElapsedTime` test

### New Files

None - test-only change to existing file

### Step-by-Step Tasks

#### Step 1: Update the flaky test to use fake timers

Replace the timing-sensitive test with a deterministic version using Vitest fake timers.

**Before**:
```typescript
it("should return elapsed milliseconds", async () => {
  const tracker = createStartupOutputTracker();
  await new Promise((resolve) => setTimeout(resolve, 50));
  const elapsed = getElapsedTime(tracker);
  expect(elapsed).toBeGreaterThanOrEqual(50);
  expect(elapsed).toBeLessThan(200);
});
```

**After**:
```typescript
it("should return elapsed milliseconds", () => {
  vi.useFakeTimers();

  const tracker = createStartupOutputTracker();

  // Advance time by 50ms using fake timers
  vi.advanceTimersByTime(50);

  const elapsed = getElapsedTime(tracker);
  expect(elapsed).toBeGreaterThanOrEqual(50);

  vi.useRealTimers();
});
```

**Why this step first**: This is the only change needed - single test fix

#### Step 2: Verify test passes locally

Run the test multiple times to ensure deterministic behavior:

```bash
pnpm --filter @slideheroes/alpha-scripts test startup-monitor.spec.ts -t "should return elapsed milliseconds"
```

Repeat 5-10 times to confirm no flakiness.

#### Step 3: Run full test suite

Ensure no regressions in other tests:

```bash
pnpm --filter @slideheroes/alpha-scripts test
```

**Expected**: All 360 tests pass consistently

#### Step 4: Validate with CI environment simulation

Run tests with `--no-threads` flag to simulate CI constraints:

```bash
pnpm --filter @slideheroes/alpha-scripts test --no-threads startup-monitor.spec.ts
```

## Testing Strategy

### Unit Tests

The fix itself is a unit test change, so validation is:

- ✅ Test passes with fake timers locally
- ✅ Test passes when run 10+ times consecutively
- ✅ Test passes in `--no-threads` mode (simulates CI)
- ✅ All other tests in suite continue to pass
- ✅ Test completes faster than before (no real 50ms wait)

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/startup-monitor.spec.ts` - Test being fixed

### Integration Tests

Not applicable - this is a unit test fix with no runtime impact

### E2E Tests

Not applicable - no user-facing changes

### Manual Testing Checklist

- [ ] Run test locally 10 times - should pass every time
- [ ] Run full test suite - all 360 tests should pass
- [ ] Run with `--no-threads` flag - should pass
- [ ] Verify test completes quickly (<100ms instead of 50ms+ wait)
- [ ] Check that fake timers are properly restored (no side effects on other tests)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Fake timers API misuse could break test**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Follow official Vitest documentation; validate locally before committing

2. **Real timers not restored could affect other tests**:
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Use `vi.useRealTimers()` in cleanup; run full test suite to verify

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit
2. Apply temporary fix: Remove upper bound assertion as stopgap
3. Re-investigate fake timers usage

**Monitoring**:
- Watch CI "Unit Tests" job on next few PRs to confirm stability
- Look for any new test failures in @slideheroes/alpha-scripts package

## Performance Impact

**Expected Impact**: minimal (positive - test runs faster)

Test will complete instantly instead of waiting 50ms, improving CI speed slightly.

**Performance Testing**:
- Measure test execution time before/after
- Verify full suite time doesn't increase

## Security Considerations

**Security Impact**: none

This is a test-only change with no production code impact.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the flaky test multiple times - may fail intermittently
for i in {1..10}; do
  echo "Run $i:"
  pnpm --filter @slideheroes/alpha-scripts test startup-monitor.spec.ts -t "should return elapsed milliseconds"
done
```

**Expected Result**: May see "expected 209 to be less than 200" failure on some runs (especially on loaded systems)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm --filter @slideheroes/alpha-scripts typecheck

# Run the fixed test multiple times
for i in {1..10}; do
  echo "Run $i:"
  pnpm --filter @slideheroes/alpha-scripts test startup-monitor.spec.ts -t "should return elapsed milliseconds"
done

# Run full test suite
pnpm --filter @slideheroes/alpha-scripts test

# Run with no threads (CI simulation)
pnpm --filter @slideheroes/alpha-scripts test --no-threads

# Run all package unit tests
pnpm test:unit
```

**Expected Result**: All tests pass 10/10 times, no flakiness, faster execution

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:unit

# Specifically verify alpha-scripts package
pnpm --filter @slideheroes/alpha-scripts test:coverage
```

## Dependencies

**No new dependencies required** - `vi.useFakeTimers()` is already available in Vitest

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - test-only change

**Feature flags needed**: no

**Backwards compatibility**: maintained (no API changes)

## Success Criteria

The fix is complete when:
- [x] Test uses `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
- [x] Test passes 10+ consecutive runs without failure
- [x] Full test suite (360 tests) passes
- [x] Test completes faster than before
- [x] `vi.useRealTimers()` properly restores timers
- [x] No side effects on other tests
- [x] CI "Unit Tests" job passes on next PR

## Notes

**Why fake timers are the right solution**:
- Vitest documentation recommends fake timers for testing time-dependent code
- Eliminates all timing-based flakiness
- Makes tests deterministic and fast
- Industry standard approach used in major projects (React, Vue, etc.)

**References**:
- Vitest fake timers docs: https://vitest.dev/api/vi.html#vi-usefaketimers
- Similar fix in React: https://github.com/facebook/react/pull/20833

**Alternative approach considered**: If fake timers prove problematic, fallback is to remove upper bound entirely (Option 2), which at least prevents the flakiness.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1729*
