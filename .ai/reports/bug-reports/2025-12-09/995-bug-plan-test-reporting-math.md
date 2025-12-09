# Bug Fix: Test Controller Reporting Shows Inconsistent Math

**Related Diagnosis**: #994
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Three distinct bugs misinterpreting Playwright test stats and ignoring skipped test counts in aggregation
- **Fix Approach**: Use actual test counts from Playwright suites, properly calculate passed tests accounting for skipped tests, and validate math consistency
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The test-controller reporting system displays mathematically impossible test counts. For example, shard 3 reports "11/12 passed, 2 skipped, 0 failed" but the math doesn't work: 11 + 2 + 0 = 13, not 12. The `/tmp/test-summary.json` shows `total: 12, passed: 12` while the shard report shows `passed: 11, skipped: 2`.

This happens because of three distinct bugs:

1. **Bug 1**: `parseJsonResults()` misinterprets Playwright's `stats.expected` field - it doesn't mean "total tests," it means "tests that ran as expected"
2. **Bug 2**: `updateExecutionSummary()` calculates `passed = total - failed`, ignoring skipped tests
3. **Bug 3**: Skipped tests are never aggregated across shards in the summary loop

### Solution Approaches Considered

#### Option 1: Fix the Three Bugs Comprehensively ⭐ RECOMMENDED

**Description**:
1. Fix `parseJsonResults()` to use actual test count from suites instead of `stats.expected`
2. Fix `updateExecutionSummary()` to calculate `passed = total - failed - skipped`
3. Add validation to ensure `total == passed + failed + skipped` before writing results

**Pros**:
- Produces mathematically correct results
- Prevents future inconsistencies with validation
- Addresses all three root causes
- Minimal code changes (3 equations fixed + 1 validation line)
- No side effects on other functionality

**Cons**:
- Requires understanding Playwright JSON format in depth
- Need to verify suite counting is accurate

**Risk Assessment**: low - Changes are surgical and focused
**Complexity**: simple - Just fixing math equations

#### Option 2: Quick Patch (Calculate From Suites Only)

**Description**:
Only fix `parseJsonResults()` to count tests from suites directly, skip the other fixes.

**Pros**:
- Faster to implement
- Minimal changes

**Cons**:
- Ignores Bug 2 and Bug 3, leaving inconsistencies in execution summary
- Only fixes one layer of the problem
- More bugs may surface later

**Why Not Chosen**: Leaves the system in an inconsistent state. The aggregation bugs would still cause math errors at the summary level.

#### Option 3: Rewrite Entire Reporting System

**Description**:
Completely redesign how test results are tracked and aggregated.

**Cons**:
- Introduces risk of breaking working functionality
- Over-engineering for what is a simple math bug
- High complexity and testing effort
- Not justified by the bug scope

**Why Not Chosen**: The bugs are simple math mistakes, not architectural problems. A complete rewrite would be overkill and risky.

### Selected Solution: Fix the Three Bugs Comprehensively

**Justification**: The three bugs work together to cause the math inconsistency. Fixing all three produces reliable, mathematically correct results with minimal code changes. The fixes are surgical and low-risk.

**Technical Approach**:

1. **Fix parseJsonResults()** (line 1523):
   - Use actual test count from Playwright suites or stats
   - Calculate: `passed = expected - unexpected - skipped` (correct Playwright formula)
   - Set: `total = passed + failed + skipped` (ensure math is valid)

2. **Fix updateExecutionSummary()** (line 2079):
   - Change: `const shardPassed = (shard.tests || 0) - (shard.failures || 0);`
   - To: Account for skipped tests properly
   - Update the summary loop to include skipped counts

3. **Add Validation**:
   - Before writing any results, validate: `total == passed + failed + skipped`
   - Log a warning if validation fails with actual values for debugging

**Architecture Changes** (if any): None - These are internal calculation fixes, no API or contract changes.

**Migration Strategy**: Not needed - This is a pure bug fix with no data migration required.

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` (lines 1515-1560, 2000-2108)
  - Bug 1: Fix `parseJsonResults()` method to use actual test count and correct calculation
  - Bug 2: Fix `updateExecutionSummary()` method to include skipped tests in calculation
  - Add validation helper to ensure math consistency

### New Files

- No new files needed

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Understand Current Playwright JSON Format

Analyze the actual Playwright JSON reporter output to understand the stats structure and test suite organization.

- Read Playwright test run JSON files to verify the stats format
- Confirm that `stats.expected`, `stats.unexpected`, `stats.skipped`, `stats.flaky` are the correct fields
- Verify that counting tests from suites array is feasible

**Why this step first**: Must understand the data format before fixing the parser.

#### Step 2: Fix parseJsonResults() Method

Update the method to use correct test counting and calculation logic.

- Use actual test count from suites (sum of all test counts in suites array)
- Calculate: `passed = expected - unexpected - skipped` (Playwright formula)
- Calculate: `total = passed + failed + skipped` (self-consistent math)
- Keep all existing logic for extracting failed test details
- Test the fix with sample JSON files

**Changes**:
```javascript
// OLD: const results.total = stats.expected || 0;
// NEW: results.total = actual count from suites or stats.expected

// OLD: results.passed = (stats.expected || 0) - (stats.unexpected || 0) - (stats.skipped || 0);
// This is already correct IF stats.expected means "total expected"
// But we need to verify against actual suite counts

// ADD: Validation that total == passed + failed + skipped
```

#### Step 3: Fix updateExecutionSummary() Aggregation Loop

Update the loop that aggregates shard results to properly include skipped tests.

- Add `skipped` field to newShardEntry (line 2032-2041)
- Update the aggregation loop (line 2072-2091) to sum skipped counts
- Ensure the calculation accounts for skipped: `passed = total - failed - skipped`

**Changes**:
```javascript
// OLD: const shardPassed = (shard.tests || 0) - (shard.failures || 0);
// NEW: const shardPassed = (shard.tests || 0) - (shard.failures || 0) - (shard.skipped || 0);

// Also add: summary.overallResults.skipped += shard.skipped || 0;
```

#### Step 4: Add Validation Helper Function

Create a helper function to validate test math consistency before writing.

- Function signature: `validateTestMath(results)` → `boolean`
- Checks: `results.total === results.passed + results.failed + results.skipped`
- Logs warning with actual values if validation fails
- Returns boolean for optional error handling

**Implementation**:
```javascript
validateTestMath(results) {
  const calculated = results.passed + results.failed + results.skipped;
  if (results.total !== calculated) {
    logWarn(`Math inconsistency: total=${results.total}, but passed(${results.passed}) + failed(${results.failed}) + skipped(${results.skipped}) = ${calculated}`);
    return false;
  }
  return true;
}
```

#### Step 5: Add Validation to Results Writing

Call the validation function before writing both parseJsonResults() and updateExecutionSummary() output.

- In `parseJsonResults()`: Validate before returning results (line 1552)
- In `updateExecutionSummary()`: Validate before writing summary file (line 2094)
- Log results: "✅ Test math validated" or warning message

#### Step 6: Add Unit Tests for Math Consistency

Create tests to verify the fixes work correctly.

- Test `parseJsonResults()` with sample Playwright JSON outputs
- Test `updateExecutionSummary()` with multiple shards
- Test edge cases: zero tests, all skipped, all failed, etc.
- Verify validation catches inconsistencies

#### Step 7: Validation Commands

After implementing:
- Run a shard to generate actual test results
- Verify the math in `/tmp/test-summary.json` is now consistent
- Check that passed + failed + skipped = total
- Run multiple shards and verify aggregation is correct

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `parseJsonResults()` correctly parses Playwright JSON
- ✅ `parseJsonResults()` calculates passed = expected - unexpected - skipped
- ✅ `updateExecutionSummary()` includes skipped in aggregation
- ✅ `validateTestMath()` catches inconsistencies
- ✅ Edge case: all tests skipped
- ✅ Edge case: no tests in shard
- ✅ Edge case: only failed tests
- ✅ Regression test: Original bug should not reoccur

**Test files**:
- `.ai/ai_scripts/testing/runners/e2e-test-runner.test.cjs` - Tests for parseJsonResults and validateTestMath
- `.ai/ai_scripts/testing/infrastructure/test-controller.test.cjs` - Tests for updateExecutionSummary

### Integration Tests

Test with actual Playwright test runs:
- Run a small test suite (e.g., shard 1)
- Verify `/tmp/test-summary.json` has consistent math
- Run multiple shards sequentially
- Verify `execution-summary.json` has consistent math

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/test 3` to execute shard 3
- [ ] Check output shows consistent math: "X/Y passed, Z skipped"
- [ ] Verify `/tmp/test-summary.json` has `total = passed + failed + skipped`
- [ ] Check `execution-summary.json` - same validation
- [ ] Run `/test` to run all shards
- [ ] Verify final summary shows consistent math across all shards
- [ ] Check no "Math inconsistency" warnings in logs

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Bug 2 was intentional**: Risk that the old logic was intentional for some reason
   - **Likelihood**: low - The old logic doesn't make sense mathematically
   - **Impact**: low - Would just revert the change
   - **Mitigation**: Review test results before/after to confirm improvement

2. **Validation is too strict**: Risk that test results won't match after validation is added
   - **Likelihood**: low - We're fixing the bug, validation should now pass
   - **Impact**: low - Can adjust validation thresholds if needed
   - **Mitigation**: Add warning logs instead of errors initially

3. **Playwright format changes**: Risk that our assumptions about Playwright JSON are wrong
   - **Likelihood**: very low - We're not changing Playwright assumptions, just fixing calculations
   - **Impact**: low - Would be caught immediately by tests
   - **Mitigation**: Add sample JSON files to test suite for verification

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the three changes to math calculations
2. Comment out the validation function calls
3. Verify system works again
4. File a separate issue to investigate deeper

**Monitoring** (if needed):
- Monitor test summary output for any "Math inconsistency" warnings
- Check that all test runs produce valid math for 1 week
- Alert if any inconsistency warnings appear

## Performance Impact

**Expected Impact**: none

No performance changes - these are pure calculation fixes with zero additional complexity.

## Security Considerations

**Security Impact**: none - These are internal reporting calculations with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run a shard that shows the bug
pnpm --filter e2e test:shard3

# Check the output - should show math inconsistency
# e.g., "11/12 passed, 2 skipped" but 11 + 2 ≠ 12

# Check summary files
cat /tmp/test-summary.json | jq '.e2e.total, .e2e.passed, .e2e.skipped'
# Should show inconsistent numbers
```

**Expected Result**: Test counts don't add up (total ≠ passed + failed + skipped)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run tests
pnpm test:unit

# Run a shard to verify fix
pnpm --filter e2e test:shard3

# Check the output - should show consistent math
# Math should now be: total = passed + failed + skipped

# Check summary files
cat /tmp/test-summary.json | jq '.e2e | {total, passed, failed, skipped}'
# Should show: passed + failed + skipped = total

# Verify validation
# Check for "Math inconsistency" warnings in output (should be none)
```

**Expected Result**: All commands succeed, test counts are mathematically consistent, zero inconsistency warnings.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run multiple shards in sequence
pnpm --filter e2e test:shard1
pnpm --filter e2e test:shard2
pnpm --filter e2e test:shard3

# Verify all shards show consistent math
for i in {1..3}; do
  echo "Shard $i:"
  tail -n 5 reports/testing/2025-12-*/shard-$i-*.json 2>/dev/null | jq '.results | {total, passed, failed, skipped}'
done
```

## Dependencies

### New Dependencies

No new dependencies required - Using existing JavaScript/Node.js features only

## Database Changes

**No database changes required** - This is a pure reporting calculation fix

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Maintained - Output format unchanged, only values corrected

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces in manual testing
- [ ] All tests pass (unit and integration)
- [ ] Zero regressions in other test functionality
- [ ] Test math validation passes for multiple shard runs
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

The root cause analysis was thorough and identified exactly which fields are involved. The fixes are straightforward - just correcting the math in three places. The validation helper prevents future inconsistencies by catching the bug early if regressions are introduced.

Key insight: Playwright's `stats.expected` means "tests that ran as expected" not "total expected tests". The actual total must be calculated from the suite structure or by summing all test results.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #994*
