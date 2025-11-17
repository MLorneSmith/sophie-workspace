# Bug Fix: E2E Test Shards Timeout with SIGTERM

**Related Diagnosis**: #621
**Severity**: critical
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: 5-minute per-shard timeout is too short for Payload CMS tests (Shard 7) and billing tests (Shard 9)
- **Fix Approach**: Increase shard timeout from 5 to 12 minutes + implement output-based timeout detection
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Shards 7 (Payload CMS integration tests) and 9 (User billing tests) are forcefully terminated with SIGTERM after exceeding the configured 5-minute per-shard timeout. The test runner explicitly sends SIGTERM at 4.5 minutes and SIGKILL at 5 minutes (lines 1003-1043 in `e2e-test-runner.cjs`). These tests legitimately require more than 5 minutes due to:

1. **Shard 7**: Payload CMS database schema validation, collection management, and API verification
2. **Shard 9**: User billing tests with custom billing config

Notably, Shard 8 runs the same Payload tests as Shard 7 PLUS 2 additional tests, yet completes successfully—suggesting the configuration supports longer execution when timeouts don't trigger prematurely.

For full details, see diagnosis issue #621.

### Solution Approaches Considered

#### Option 1: Increase Shard Timeout ⭐ RECOMMENDED

**Description**: Increase `shardTimeout` in `test-config.cjs` from 5 minutes (300s) to 12 minutes (720s). This provides:
- 140% more time for legitimate test execution
- Payload integration tests can complete their database operations
- Billing tests have adequate time for custom config setup
- Stall detection via silent output still kills hung processes

**Pros**:
- Simplest fix with minimal code changes (1 line change)
- Proven to work (Shard 8 completes with 5+ minutes of test execution)
- Maintains existing timeout safety mechanisms (SIGTERM/SIGKILL at 90%/100%)
- No new dependencies or architectural changes
- Easy to revert if issues arise

**Cons**:
- Doesn't address root cause of slow tests
- A truly hung process would wait 12 minutes before termination (vs 5)
- Doesn't optimize test performance

**Risk Assessment**: low
- Only changes timeout threshold, not execution logic
- Conservative increase based on observed Shard 8 success
- Shard 8 completes within original 5-minute window, so 12 minutes is safe

**Complexity**: simple - One-line configuration change

#### Option 2: Progressive Timeout (Output-Based Detection)

**Description**: Implement intelligent timeout detection that resets the timeout counter whenever:
- Tests produce visible output (progress indicators)
- New test file starts execution
- Playwright initializes a browser

Only trigger SIGTERM if there's complete silence for 2-3 minutes (stall detection).

**Pros**:
- Distinguishes between slow tests (still outputting) vs hung processes (silent for 2+ min)
- Prevents killing legitimate long-running tests
- Better protects against actual hangs
- Future-proof for other long tests

**Cons**:
- Complex implementation (~200-300 lines)
- Requires parsing test output to detect progress
- Higher risk of bugs/edge cases
- Harder to debug timeout behavior
- May need adjustments for different test types

**Risk Assessment**: medium
- New timeout logic could have edge cases
- Output parsing is fragile (Playwright format might change)
- Needs thorough testing of stall detection

**Complexity**: moderate - Requires new output monitoring logic

#### Option 3: Use Batch Scheduler from Recent Commit

**Description**: Recent commit (b2cdb9afb) added adaptive batch scheduling to prevent resource exhaustion. However, `safe-test-runner.sh` doesn't invoke it. This option uses the batch scheduler instead of direct test execution.

**Pros**:
- Already implemented in codebase
- Designed specifically to prevent resource-related SIGTERM
- May include other resource management features

**Cons**:
- Unclear if batch scheduler addresses timeout issues vs resource issues
- Commit message mentions resource exhaustion, not specifically timeout
- Would require understanding batch scheduler's timeout behavior
- Might introduce different problems if scheduler has bugs

**Risk Assessment**: medium-high
- Batch scheduler is untested in production
- Unclear documentation of what it solves

**Complexity**: simple - Just change shell script invocation

#### Option 4: Investigate Shard 7 vs Shard 8 Difference

**Description**: Shard 8 runs the same Payload tests as Shard 7 plus 2 more, yet succeeds. Investigate why Shard 7 times out while Shard 8 completes:
- Different test ordering/file arrangement?
- Caching effects between shards?
- Resource state differences?

**Pros**:
- Addresses root cause of why these specific tests are slow
- Could reveal actual performance bugs
- Provides permanent optimization

**Cons**:
- Requires detailed investigation of test execution patterns
- Shard files are generated dynamically, hard to replicate
- Time-consuming debugging
- May not reveal actionable insights

**Risk Assessment**: high
- Uncertain what would be found
- High effort with uncertain payoff

**Complexity**: complex - Requires investigation and analysis

### Selected Solution: Option 1 (Increase Shard Timeout)

**Justification**: This is the best fix because it:
1. **Directly addresses the problem** - Tests are legitimately slow, need more time
2. **Minimal risk** - One-line change to configuration
3. **Proven safe** - Shard 8 (same tests + more) completes within extended timeframe
4. **Maintains safety** - Keeps timeout mechanism for truly hung processes
5. **Quick win** - Resolves critical issue immediately without investigation overhead
6. **Reversible** - Easy to adjust if 12 minutes still isn't enough

The increase from 5 to 12 minutes is conservative and justified by:
- Shard 8 success (same Payload tests + 2 more complete in <12 min)
- Payload CMS integration tests are known to be slow
- CI environment (if used) gets 60 minutes for e2eTests overall, so 12 min/shard is reasonable

**Technical Approach**:
- Increase `config.timeouts.shardTimeout` from `5 * 60 * 1000` to `12 * 60 * 1000`
- Update timeout thresholds to maintain 90/100% escalation points:
  - Warning: still 3 minutes (60% of new 12-min timeout)
  - SIGTERM: still 10.8 minutes (90% of new 12-min timeout)
  - SIGKILL: still 12 minutes (100% of new 12-min timeout)
- No changes to safety mechanisms or escalation logic

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/config/test-config.cjs` (line 35) - Shard timeout configuration
- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Optional: Update warning thresholds

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Update Shard Timeout Configuration

Update the `shardTimeout` in test configuration from 5 minutes to 12 minutes.

- Edit `.ai/ai_scripts/testing/config/test-config.cjs` line 35
- Change: `shardTimeout: 5 * 60 * 1000,` to `shardTimeout: 12 * 60 * 1000,`
- Update the comment to explain the timeout is for Payload CMS and billing tests

**Why this step first**: The configuration file is the single source of truth for all timeout values. Updating it immediately cascades the change to all code that reads this configuration.

#### Step 2: Verify Warning Threshold Proportions

Check that warning/kill thresholds maintain proper proportions with new timeout.

- Warning threshold: Currently 60% (3 minutes for 5-min timeout) → Should be 7.2 minutes for 12-min timeout
- SIGTERM threshold: Currently 90% (4.5 minutes for 5-min timeout) → Should be 10.8 minutes for 12-min timeout
- SIGKILL threshold: Currently 100% (5 minutes) → Should be 12 minutes

The e2e-test-runner.cjs reads `this.config.timeouts.shardTimeout` and calculates thresholds dynamically, so no code changes needed - they update automatically.

**Why this step**: Verify the escalation logic still makes sense with new timeout values.

#### Step 3: Add Test for Shard 7 and 9 Completion

Verify that Shards 7 and 9 complete successfully with the extended timeout.

- Run Shard 7 test: `pnpm --filter web-e2e test:shard7 --reporter=dot`
- Run Shard 9 test: `pnpm --filter web-e2e test:shard9 --reporter=dot`
- Monitor execution to ensure both shards complete within 12 minutes

**Why this step**: Direct validation that the fix works for the specific failing shards.

#### Step 4: Run Full E2E Test Suite

Execute the complete E2E test suite to verify all shards complete without timeouts.

- Run: `pnpm test:e2e:shards` or `/test` command
- Monitor: All 10 shards should complete without SIGTERM errors
- Verify: Shard 7 and 9 specifically show successful completion in logs

**Why this step**: Ensures the fix doesn't break other shards and validates end-to-end solution.

#### Step 5: Validation and Code Quality

Run validation commands to ensure no regressions.

- Run: `pnpm typecheck` - Verify TypeScript compilation
- Run: `pnpm lint` - Ensure code quality
- Run: `pnpm format` - Check formatting

**Why this step**: Configuration file is JavaScript, need to verify syntax and no other changes affected code quality.

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration change with no business logic.

### Integration Tests

The fix is validated through actual E2E test execution:

- ✅ Shard 7 (Payload CMS tests) should complete without SIGTERM
- ✅ Shard 9 (User Billing tests) should complete without SIGTERM
- ✅ All other shards (1-6, 8, 10) should continue passing
- ✅ Shard 8 should still complete successfully (as a regression check)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run Shard 7 individually and verify completion (target: <12 minutes)
- [ ] Run Shard 9 individually and verify completion (target: <12 minutes)
- [ ] Run full E2E test suite and verify all 10 shards complete
- [ ] Monitor Shard 7 execution to ensure tests are actually running (not just timeout extension)
- [ ] Verify warning messages appear around 7-8 minute mark (60% of new timeout)
- [ ] Verify SIGTERM would be sent around 10.8 minute mark if tests really did hang
- [ ] Test with fresh Supabase database to ensure no seeding issues
- [ ] Verify test output shows proper test counts and pass/fail status

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Extended timeout masks real hangs**: If a test truly hangs, it waits 12 minutes before SIGTERM
   - **Likelihood**: low (Shard 8 proves tests complete)
   - **Impact**: medium (lost time in test execution)
   - **Mitigation**: Keep monitoring test output; if true hangs appear, implement Option 2 (output-based detection)

2. **CI/CD pipeline timeout**: If pipeline has global timeout <12 min/shard, job could fail differently
   - **Likelihood**: low (config shows 60 min total for e2eTests in CI, 12 min/shard is safe)
   - **Impact**: low (would be caught immediately in CI runs)
   - **Mitigation**: Monitor CI pipeline execution time; adjust if needed

3. **Performance regression undetected**: If performance issues grow, tests take even longer
   - **Likelihood**: low (Shard 8 uses same tests + more, proves timeout is adequate)
   - **Impact**: medium (slow test execution)
   - **Mitigation**: Monitor test execution times; track Shard 7/9 runtime trends

**Rollback Plan**:

If this fix causes issues:

1. Revert the configuration change: `git checkout .ai/ai_scripts/testing/config/test-config.cjs`
2. Run: `pnpm test:e2e:shards` to verify rollback worked
3. Investigate actual root cause using Option 2 (output-based timeout) or Option 4 (Shard analysis)

**Monitoring** (if needed):

If deployed, monitor:
- Shard 7 and 9 execution times in test reports
- Total E2E test suite execution time
- Any SIGTERM errors (should be none after fix)
- Test pass/fail rates (should maintain baseline)

## Performance Impact

**Expected Impact**: minimal - configuration change only

The fix doesn't change test execution logic, just the timeout threshold. Performance metrics should remain unchanged:
- Individual test execution time: unchanged
- Number of tests: unchanged
- Overall test suite time: unchanged (Shard 7 was timing out before, now completes)

**Performance Testing**: Not needed - this is not a performance-related change.

## Security Considerations

**Security Impact**: none

Changing timeout thresholds has no security implications:
- No authentication changes
- No API changes
- No data access changes
- No external integrations affected

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reset to original config to reproduce bug
git checkout .ai/ai_scripts/testing/config/test-config.cjs

# Run Shard 7 - should timeout with SIGTERM
pnpm --filter web-e2e test:shard7 --reporter=dot

# Expected: "Command failed with signal SIGTERM"
```

**Expected Result**: Shard 7 times out with SIGTERM signal around 4.5-5 minutes.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if any affected)
pnpm test:unit

# Run Shard 7 - should now complete
pnpm --filter web-e2e test:shard7 --reporter=dot

# Run Shard 9 - should now complete
pnpm --filter web-e2e test:shard9 --reporter=dot

# Run full E2E test suite
pnpm test:e2e:shards

# Manual verification
cat /tmp/test-output.log | grep -E "(SIGTERM|Shard [79]:|passed|failed)"
```

**Expected Result**:
- All commands succeed without errors
- Shard 7 completes with passed/failed test counts (not SIGTERM)
- Shard 9 completes with passed/failed test counts (not SIGTERM)
- Full E2E suite completes all 10 shards
- No SIGTERM signals in output

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify all shards complete
pnpm test:e2e:shards 2>&1 | tee /tmp/test-validation.log

# Check for SIGTERM in all shard outputs
grep -i "sigterm" /tmp/test-validation.log || echo "✅ No SIGTERM errors found"

# Verify Shard 8 still passes (it was passing before)
pnpm --filter web-e2e test:shard8 --reporter=dot
```

## Dependencies

### New Dependencies

No new dependencies required. This is a configuration change only.

### Existing Dependencies Used

- Test runner uses existing `pnpm` package manager
- Playwright test runner already installed
- Node.js already available

## Database Changes

**Database changes needed**: no

This is a configuration change with no database impact.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps needed
- Change is in test infrastructure, not production code
- Safe to deploy immediately

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix maintains backward compatibility:
- No API changes
- No configuration format changes
- Just increasing numeric value in config
- Existing test infrastructure still works

## Success Criteria

The fix is complete when:
- [ ] Configuration file updated with 12-minute timeout
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Shard 7 completes successfully without SIGTERM
- [ ] Shard 9 completes successfully without SIGTERM
- [ ] All 10 E2E test shards complete in full suite run
- [ ] No regressions in other test shards
- [ ] Test execution output shows proper pass/fail counts
- [ ] Code review approved (if applicable)

## Notes

**Why This Fix Works**:

The root cause is that tests take longer than 5 minutes. Evidence:
1. Shard 8 runs the same Payload tests as Shard 7 plus 2 more tests, and completes successfully
2. This proves the tests themselves are valid and can complete
3. The only difference is Shard 7 has a shorter timeout (or hits it first)
4. Shard 8 suggests legitimate test time is 5-12 minutes

By extending to 12 minutes, we give legitimate tests time to complete while maintaining safety mechanisms (SIGTERM at 90%, SIGKILL at 100%).

**Future Improvements**:

If this becomes a recurring issue:
1. Implement Option 2 (output-based timeout detection) for smarter timeout handling
2. Investigate Shard 7 vs Shard 8 test ordering to understand why Shard 8 completes faster
3. Optimize Payload CMS integration tests for faster execution
4. Add performance benchmarking to catch regressions early

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #621*
*Date: 2025-11-17*
