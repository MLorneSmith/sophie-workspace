# Bug Fix: Shard 12 filter not working - runs all shards instead

**Related Diagnosis**: #899 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Hardcoded shard range validation of `1-11` excludes shard 12, causing validation to fail silently and run all shards
- **Fix Approach**: Update two hardcoded range checks from `<= 11` to `<= 12` and error messages to match
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test suite contains 12 shards (1-12), but the test controller's argument parsing rejects shard 12 as invalid. When running `/test 12` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 12`, the validation fails silently, shard 12 is not added to the shard filter, and all 12 shards execute instead. This wastes ~10 minutes running unnecessary shards when the user expects only shard 12 (~30 seconds).

For full details, see diagnosis issue #899.

### Solution Approaches Considered

#### Option 1: Update hardcoded range checks ⭐ RECOMMENDED

**Description**: Change `<= 11` to `<= 12` in two locations within the `parseArguments()` method, and update corresponding error messages.

**Pros**:
- Single file change, minimal code impact
- Directly addresses root cause of the validation failure
- No architectural changes needed
- Risk is extremely low - just numeric constant changes
- Error messages stay accurate and helpful to users

**Cons**:
- Hardcoded range is somewhat fragile if shard count changes in future (though unlikely)

**Risk Assessment**: low - This is a simple numeric range fix with no side effects.

**Complexity**: simple - Two numeric values and two error message strings changed.

#### Option 2: Extract shard count to configuration

**Description**: Move the hardcoded shard count (12) to a configuration constant that can be updated in one place.

**Pros**:
- More maintainable if shard count changes in future
- Single source of truth for shard count
- Follows DRY principle

**Cons**:
- More invasive change (requires adding configuration constant)
- Adds unnecessary complexity for current needs
- E2E test infrastructure is stable, shard count unlikely to change

**Why Not Chosen**: Over-engineering for a simple fix. The shard count is stable infrastructure unlikely to change. A direct fix is faster and clearer.

#### Option 3: Add shard count validation elsewhere

**Description**: Instead of fixing the range check, validate shard count against actual shards defined in the test runner.

**Cons**:
- Significantly more complex (would need to read shard definitions from playwright config)
- Would slow down argument parsing
- Creates coupling between test controller and playwright configuration
- Solves the wrong problem - the bug is just a number

**Why Not Chosen**: Over-complicated. The issue is a simple numeric typo/oversight, not a design flaw.

### Selected Solution: Update hardcoded range checks

**Justification**: The root cause is two hardcoded range checks that reject shard 12. This is a straightforward fix: change `<= 11` to `<= 12` in two locations and update error messages. No architectural changes are needed. The fix is minimal, low-risk, and directly addresses the root cause.

**Technical Approach**:
- Line 191: Change `if (shardNum >= 1 && shardNum <= 11)` to `if (shardNum >= 1 && shardNum <= 12)`
- Line 196: Change error message from `"Valid range is 1-11."` to `"Valid range is 1-12."`
- Line 211: Change `if (num >= 1 && num <= 11)` to `if (num >= 1 && num <= 12)`
- Line 214: Change error message from `"Valid range is 1-11."` to `"Valid range is 1-12."`

**Architecture Changes**: None. This is a pure fix to existing validation logic.

**Migration Strategy**: Not needed - this fix has no state or data implications.

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/infrastructure/test-controller.cjs` - Update hardcoded shard validation ranges in two locations (lines 191, 211)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update numeric shard range validations

Update the hardcoded shard count from 11 to 12 in both numeric argument parsing and --shard flag parsing.

- On line 191, change `shardNum <= 11` to `shardNum <= 12`
- On line 211, change `num <= 11` to `num <= 12`

**Why this step first**: These are the actual validation logic changes that fix the bug. The error messages follow from this fix.

#### Step 2: Update error messages for consistency

Update error messages to match the new valid range.

- On line 196, change error message to say "Valid range is 1-12."
- On line 214, change error message to say "Valid range is 1-12."

**Why this step**: Ensures error messages accurately reflect the valid shard range, helping users understand constraints.

#### Step 3: Verify test controller structure (no changes needed)

- Confirm no other hardcoded shard range checks exist in test-controller.cjs
- Verify the E2E test runner actually has 12 shards configured
- Document that future developers should check if playwright config changes shard count

#### Step 4: Validation

- Run `/test 12` to verify shard 12 runs alone
- Verify shard 12 runs approximately 30 seconds (7-8 tests)
- Verify all other shards still work individually
- Run full test suite to ensure no regressions

## Testing Strategy

### Unit Tests

No unit tests needed - this is a validation fix in command-line argument parsing with no complex business logic.

### Integration Tests

No new integration tests needed - the fix is tested through E2E test execution.

### E2E Tests

**Manual Testing Checklist**:

Execute these manual tests before considering the fix complete:

- [ ] Run `/test 12` - should only run shard 12 (~30 seconds, 7-8 tests)
- [ ] Verify output shows "Mode: E2E Shard(s) 12" or similar indicating shard-specific mode
- [ ] Verify the test controller logs show shard filter is applied (not running all shards)
- [ ] Run `/test 1` - should work as before with shard 1 only
- [ ] Run `/test 11` - should work as before with shard 11 only
- [ ] Run `/test --shard 12` - should work with explicit shard flag format
- [ ] Run `/test --shard 1,2,3` - should work with multiple shards
- [ ] Run `/test --shard 11,12` - should work including shard 12
- [ ] Run `/test 13` - should fail with error message "Valid range is 1-12."
- [ ] Run `/test` with no args - should run all shards as before (full suite)
- [ ] Verify shard 12 tests are "Team Accounts" tests (per diagnosis)
- [ ] Verify no UI regressions in test output formatting
- [ ] Run full test suite `/test` - should complete successfully with all shards

### Regression Prevention

```bash
# Run full test suite to ensure all shards work
pnpm test:e2e

# Run individual shards to verify each works
/test 1
/test 2
/test 3
...
/test 12
```

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Off-by-one error in other locations**: If shard validation exists elsewhere in codebase
   - **Likelihood**: low
   - **Impact**: medium (could still not work correctly)
   - **Mitigation**: Grep the codebase for "11" or "shard" to find other validation logic

2. **Playwright configuration mismatch**: If playwright.config.ts doesn't actually define 12 shards
   - **Likelihood**: low (diagnosis already confirmed 12 shards exist)
   - **Impact**: high (shard 12 tests would fail or not exist)
   - **Mitigation**: Verify E2E test configuration actually has 12 shards

3. **Hardcoding vs configuration**: Future changes to shard count require code changes
   - **Likelihood**: low (shard count is stable)
   - **Impact**: low (simple fix if needed in future)
   - **Mitigation**: Document this in code comments if needed

**Rollback Plan**:

If this fix causes issues:
1. Revert the two numeric changes from `<= 12` back to `<= 11`
2. Revert the error messages back to "Valid range is 1-11."
3. Run full test suite to verify rollback works

**Monitoring**: None needed - this is a straightforward fix with immediate validation.

## Performance Impact

**Expected Impact**: none

No performance implications. This fix enables existing functionality that was incorrectly blocked.

## Security Considerations

**Security Impact**: none

This is a simple validation range fix with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Before fix, shard 12 should fail validation
/test 12
# Expected: Shows error "Invalid shard number: 12. Valid range is 1-11."
# Actual behavior: All 12 shards run (200+ tests, ~10 minutes)
```

**Expected Result**: Bug reproduced - all shards run instead of just shard 12.

### After Fix (Bug Should Be Resolved)

```bash
# After fix, shard 12 should work
/test 12
# Expected: Only shard 12 runs (~30 seconds, 7-8 tests)
# Shows: "Mode: E2E Shard(s) 12"

# Run all shards to ensure no regressions
/test

# Verify other shards still work
/test 1
/test 11

# Verify invalid shards are still rejected (now correctly saying 1-12)
/test 13
```

**Expected Result**: Shard 12 runs successfully, all validation works correctly, no regressions.

### Regression Prevention

```bash
# Full test suite to ensure nothing broke
pnpm test:e2e

# Individual shard verification
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 12
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 1
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 11
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This is a test infrastructure fix with no impact on production code or deployment.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - all existing shard numbers (1-11) continue to work as before.

## Success Criteria

The fix is complete when:
- [ ] Shard 12 validation passes and shard 12 runs successfully
- [ ] `/test 12` runs only shard 12 (~30 seconds, not ~10 minutes)
- [ ] Error message for invalid shards correctly says "Valid range is 1-12."
- [ ] All other shards (1-11) continue to work as before
- [ ] Full test suite `/test` runs all 12 shards successfully
- [ ] Zero regressions in test execution or output

## Notes

This bug appears to be a simple oversight - the shard count was increased from 11 to 12 at some point, but the validation logic wasn't updated. The fix is straightforward and low-risk since it only changes numeric constants and error messages.

The hardcoded range check approach is reasonable for stable infrastructure like the test suite. If the shard count becomes dynamic in the future, this could be revisited to extract it to configuration.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #899*
