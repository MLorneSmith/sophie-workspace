# Bug Fix: Alpha Sandbox Startup Retry Loop Implementation

**Related Diagnosis**: #1446 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Startup hang detection works, but the retry loop was never implemented. When a hang is detected, the Claude process is killed but execution falls through to the error handler immediately without retrying.
- **Fix Approach**: Wrap `sandbox.commands.run()` in a retry loop that waits exponential backoff delays and resets state between attempts.
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Implementation System's startup timeout detection correctly identifies when Claude Code CLI hangs (no output within 60 seconds), but the retry logic was designed but never actually implemented. When a hang is detected:

1. The startup check interval logs "Will retry startup"
2. `killClaudeProcess()` is called
3. Execution immediately falls through to the catch block (no retry loop!)
4. Feature is marked as "failed" without any retry attempts
5. Same sandboxes get assigned the same feature again, creating an infinite loop

For full details, see diagnosis issue #1446.

### Solution Approaches Considered

#### Option 1: Add Retry Loop Inside `runFeatureImplementation()` ⭐ RECOMMENDED

**Description**: Wrap the `sandbox.commands.run()` call with a loop that:
1. Attempts execution with startup timeout detection
2. On startup hang, waits exponential backoff delay (5s, 10s, 30s)
3. Resets the startup tracker and output buffers
4. Retries the Claude invocation
5. Only propagates failure after MAX_STARTUP_RETRIES exhausted

**Pros**:
- Minimal changes to existing code
- Keeps retry logic where startup monitoring lives
- Preserves all existing functionality
- Easy to test and debug
- Exponential backoff is proven to work for transient failures
- No architectural changes needed

**Cons**:
- Adds complexity to `runFeatureImplementation()` function
- Retry loop adds ~40 lines of code
- Need to carefully manage state between retries (trackers, flags, etc.)
- May not solve root cause if issue is auth-related rather than timing

**Risk Assessment**: Low - This is a standard retry pattern used in cloud systems. Worst case, if retries fail, feature is marked as failed (same as current behavior).

**Complexity**: Moderate - Need to understand interaction between startup monitoring interval and retry loop, reset state properly.

#### Option 2: Move Retry Logic to Orchestrator Level

**Description**: Instead of retrying within `runFeatureImplementation()`, let orchestrator retry failed features by resetting them to "pending" status.

**Pros**:
- Simpler `runFeatureImplementation()` function
- Leverages existing orchestrator work distribution

**Cons**:
- Relies on orchestrator to notice and retry failures
- Loses diagnostic context (which attempt failed, error details)
- Slower recovery (30-60 second cycle vs immediate retry)
- Doesn't solve the root cause of startup hangs
- More complex state management in orchestrator

**Why Not Chosen**: Option 1 provides immediate retry without waiting for orchestrator cycle. Option 1 is faster and provides better diagnostics.

#### Option 3: Use `timeout` Command Wrapper at Shell Level

**Description**: Modify E2B template's `run-claude` script to use `timeout 60s` wrapper that exits with code 124 on timeout.

**Pros**:
- Cleaner error signal at bash level
- No changes to feature.ts

**Cons**:
- Doesn't actually retry - still needs retry loop elsewhere
- Requires E2B template rebuild and redeploy
- Slower feedback loop for testing

**Why Not Chosen**: Already partially implemented in previous fix (#1445). Current issue is missing retry loop, not detection.

### Selected Solution: Add Retry Loop Inside `runFeatureImplementation()`

**Justification**: This approach:
1. **Directly fixes the bug** - Implements the retry loop that was planned but never coded
2. **Minimal scope** - Only changes affected function, no architectural changes
3. **Proven pattern** - Exponential backoff is standard in cloud computing
4. **Fast recovery** - Retries immediately instead of waiting for orchestrator
5. **Better diagnostics** - Can track attempt count and timing
6. **Backward compatible** - Doesn't change feature status handling or manifest format

**Technical Approach**:

1. **Create a retry loop wrapper** around `sandbox.commands.run()`:
   ```typescript
   for (let attempt = 0; attempt < MAX_STARTUP_RETRIES; attempt++) {
     // Reset startup tracking state
     startupTracker = createStartupOutputTracker();
     startupHangDetected = false;
     startupRecoveryInProgress = false;

     try {
       // Run Claude with timeout detection
       const result = await instance.sandbox.commands.run(...);
       // Success - break out of loop
       break;
     } catch (error) {
       if (startupHangDetected && attempt < MAX_STARTUP_RETRIES - 1) {
         // Startup hang - wait and retry
         const delay = STARTUP_RETRY_DELAYS_MS[attempt];
         await sleep(delay);
         continue;
       }
       throw error; // Other error or max retries exceeded
     }
   }
   ```

2. **Track which attempt succeeded** in `startupAttemptRecord`

3. **Increment `totalAttempts`** counter on each loop iteration

4. **Clear startup detection flags** at loop start so they can be set fresh on each attempt

5. **Update output handling** to accumulate across retries while showing which attempt

**Architecture Changes** (if any):

- No breaking changes
- Add retry loop logic to `runFeatureImplementation()`
- Update `startupAttemptRecord` tracking (already exists, just needs to be incremented)
- All other functions remain unchanged

**Migration Strategy** (if needed):

- No data migration needed
- Progress files format unchanged
- Existing features continue to work
- Retry is transparent to manifest and orchestrator

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/feature.ts:304-355` - `sandbox.commands.run()` call and error handling
  - Wrap call with retry loop
  - Reset startup tracking state on each attempt
  - Increment attempt counter
  - Manage exponential backoff delays
  - Clear startup hang flags at loop start

### New Files

None - All changes are in existing files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Understand Current State

Read the current implementation in `feature.ts` to understand:
- How `startupAttemptRecord` is initialized
- How `startupTracker` is created and used
- How the startup check interval detects hangs
- Where the `sandbox.commands.run()` call is made
- How errors are caught and handled

**Why this step first**: Must understand current flow before modifying it.

#### Step 2: Add Retry Loop Structure

Modify `.ai/alpha/scripts/lib/feature.ts` around line 304 to add retry loop:

```typescript
// Outer loop for retrying on startup hangs
let executionResult;
for (let attemptNumber = 1; attemptNumber <= MAX_STARTUP_RETRIES; attemptNumber++) {
  startupAttemptRecord.totalAttempts = attemptNumber;
  startupAttemptRecord.attemptTimestamps[attemptNumber - 1] = new Date().toISOString();

  // CRITICAL: Reset startup tracking state for this attempt
  startupTracker = createStartupOutputTracker();
  startupHangDetected = false;
  startupRecoveryInProgress = false;

  try {
    // Original sandbox.commands.run() call here
    executionResult = await instance.sandbox.commands.run(...);
    break; // Success - exit retry loop
  } catch (error) {
    // Handle retry or propagate error
    if (startupHangDetected && attemptNumber < MAX_STARTUP_RETRIES) {
      // Log retry attempt
      const retryDelay = STARTUP_RETRY_DELAYS_MS[attemptNumber - 1];
      log(`   │   ⏳ Retrying startup after ${retryDelay / 1000}s (attempt ${attemptNumber + 1}/${MAX_STARTUP_RETRIES})`);

      // Wait exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      continue; // Retry
    }

    // Max retries exceeded or different error - propagate
    throw error;
  }
}

// Use executionResult from successful attempt
const result = executionResult;
```

**Why this step here**: Establishes retry loop structure before adding details.

#### Step 3: Update Startup Attempt Tracking

Modify `startupAttemptRecord` initialization and update logic:

```typescript
// Initialize with array to track all attempts
const startupAttemptRecord: StartupAttemptRecord = {
  totalAttempts: 1,
  succeededOnAttempt: null,
  attemptTimestamps: [new Date().toISOString()],
  totalStartupTimeMs: 0,
};

// In retry loop, append timestamp for each new attempt
if (attemptNumber > 1) {
  startupAttemptRecord.attemptTimestamps.push(new Date().toISOString());
}

// After successful run, record which attempt succeeded
startupAttemptRecord.succeededOnAttempt = attemptNumber;
startupAttemptRecord.totalStartupTimeMs = elapsedMs;
```

**Why this step here**: Enables diagnostic tracking of retry attempts.

#### Step 4: Handle Startup Check Interval Cleanup

Ensure the startup check interval properly handles retries:

- Move `clearInterval(startupCheckInterval)` inside the check (only clear when we're done with startup phase)
- Create interval fresh for each retry attempt? OR reuse same interval?

Decision: **Reuse same interval** - Let it continue checking. If retry succeeds, interval will detect success and clear itself. If retry fails, error handler will clear interval.

**Why this step here**: Prevent interval from interfering with retries.

#### Step 5: Update Error Handling

Modify catch block at line 480 to handle startup hang retries:

```typescript
catch (error) {
  // ... existing cleanup code ...

  const wasStartupHang = startupHangDetected;
  const finalError = wasStartupHang && startupAttemptRecord.totalAttempts >= MAX_STARTUP_RETRIES
    ? `Startup hang detected after ${MAX_STARTUP_RETRIES} retries: ${errorMessage}`
    : wasStartupHang
      ? `Startup hang detected and retried: ${errorMessage}`
      : errorMessage;

  // Log more details for startup failures
  if (wasStartupHang) {
    log(`   │   📊 Startup attempts: ${startupAttemptRecord.totalAttempts}/${MAX_STARTUP_RETRIES}`);
    log(`   │   ⏱️  Attempt timestamps: ${startupAttemptRecord.attemptTimestamps.join(', ')}`);
  }

  // ... rest of error handling ...
}
```

**Why this step here**: Provides clear error messages showing retry details.

#### Step 6: Test Single Retry Scenario

Create a manual test to verify retry works:

1. Write a test that simulates a startup hang on first attempt, success on second
2. Verify retry delay is respected
3. Verify startupAttemptRecord shows attempt 2 succeeded
4. Verify logs show retry attempt

**Why this step here**: Validate retry logic works before deploying.

#### Step 7: Test Max Retries Exceeded

Create test for failure after all retries exhausted:

1. Simulate hang on all 3 attempts
2. Verify feature is marked failed after attempt 3
3. Verify error message indicates max retries exceeded
4. Verify no 4th attempt is made

**Why this step here**: Ensure we don't retry forever.

#### Step 8: Run Full Orchestrator Test

Execute the full spec orchestrator with the fix:

```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

Monitor:
- No 2-line logs anymore (retries should work or fail with proper error)
- Log files should show more output per feature
- Progress should be visible in progress files
- Features should complete successfully (not hang)

**Why this step here**: Validate fix works in production-like scenario.

#### Step 9: Validate No Regressions

Run through existing features that were completing successfully before:

1. Check that successful sandboxes still work (no unnecessary retries)
2. Verify startup timeout detection still works (hangs are still detected)
3. Verify stall detection interval doesn't conflict with retries
4. Check that UI progress updates work correctly

**Why this step here**: Ensure we didn't break existing functionality.

#### Step 10: Update Type Definitions (if needed)

Verify `StartupAttemptRecord` type supports the tracking:

```typescript
export interface StartupAttemptRecord {
  totalAttempts: number;
  succeededOnAttempt: number | null;
  attemptTimestamps: string[];
  totalStartupTimeMs: number;
}
```

If `attemptTimestamps` is currently a single value, update to array.

**Why this step here**: Ensure types match implementation.

#### Step 11: Add Comprehensive Logging

Ensure each retry is logged with clear messages:

```
│   🔄 Retrying startup (attempt 2/3) after 5s delay
│   ⏳ Waiting 5 seconds before retry...
│   [STARTUP_ATTEMPT_2] sbx-c: Retrying Claude CLI (attempt 2/3)
│   📊 Startup attempts so far: 2/3
```

**Why this step here**: Enable operators to understand retry behavior from logs.

#### Step 12: Validation and Smoke Test

Run all validation commands and manual tests before considering complete:

- Type checking passes
- Lint passes
- Unit tests pass (for startup-monitor.ts utility functions)
- Manual test of 3-feature spec
- Verify 0% failure rate (vs previous 64%)

**Why this step here**: Ensure quality before deployment.

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Retry loop structure (loop runs N times)
- ✅ Startup tracker reset on each retry
- ✅ Exponential backoff delay timing (5s, 10s, 30s)
- ✅ `startupAttemptRecord` increments correctly
- ✅ Success on first attempt (no retries)
- ✅ Success on second attempt (one retry)
- ✅ Failure after max retries (all attempts exhausted)
- ✅ Non-startup errors propagate immediately (no retry)
- ✅ Sleep/delay is actually called with correct duration
- ✅ Regression: normal successful startup unchanged

**Test files**:
- `.ai/alpha/scripts/__tests__/feature-retry-loop.spec.ts` (new) - Tests for retry loop
- `.ai/alpha/scripts/__tests__/startup-monitor.spec.ts` (update) - Existing utility tests

### Integration Tests

- ✅ Single sandbox with retry succeeds
- ✅ Multiple sandboxes with mix of first-attempt-success and retries
- ✅ Sandbox that fails all retries is properly marked failed
- ✅ Progress file updated correctly showing retry attempts
- ✅ Git operations succeed after delayed startup

**Test files**:
- `.ai/alpha/scripts/__tests__/integration/sandbox-retry.spec.ts` (new)

### E2E Tests

- ✅ Run 3-feature spec orchestrator
- ✅ Observe all sandboxes either succeed on first attempt or after retries
- ✅ Verify 0% failure rate (vs 64% before fix)
- ✅ Check logs for proper retry diagnostics
- ✅ Verify no infinite loop or excessive retries

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Read feature.ts and understand current retry loop structure
- [ ] Run single sandbox manually: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Observe startup process in logs - should see "Retrying startup" if needed
- [ ] Check log files in `.ai/alpha/logs/` - should have >100 bytes minimum
- [ ] Verify progress files show retry attempts in `startupAttemptRecord`
- [ ] Run with 13 features and observe multiple sandboxes working in parallel
- [ ] Verify no 2-line logs (which indicate successful hangs that don't retry)
- [ ] Test that a successful startup (no hang) doesn't trigger unnecessary retries
- [ ] Monitor CPU/memory - verify retries don't cause resource exhaustion
- [ ] Check git logs - verify commits are made after successful retries
- [ ] Run `pnpm typecheck` - no type errors
- [ ] Run `pnpm lint` - no lint errors
- [ ] Verify startup timing: logs should show attempt timings
- [ ] Confirm exponential backoff delays: 5s, 10s, 30s visible in logs
- [ ] Test edge case: if all 3 retries fail, feature should be marked failed
- [ ] Test edge case: if stall is detected during retry, should still recover

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Infinite retry loop**: If startup condition never improves, could retry forever.
   - **Likelihood**: Low - We have MAX_STARTUP_RETRIES hard limit
   - **Impact**: Medium - Would burn API quota
   - **Mitigation**: Hard limit of 3 retries. After MAX_STARTUP_RETRIES, fail immediately.

2. **State pollution between retries**: If startup tracker or other state isn't properly reset, retry might use stale data.
   - **Likelihood**: Medium - Complex state management
   - **Impact**: High - Could cause incorrect retry decisions
   - **Mitigation**: Explicitly reset all tracking state at loop start. Test thoroughly.

3. **Retry delays causing cascade failures**: If we retry too aggressively, could cause API rate limiting.
   - **Likelihood**: Low - Exponential backoff (5s, 10s, 30s) is conservative
   - **Impact**: Medium - Could trigger more hangs
   - **Mitigation**: Use tested exponential backoff pattern. Monitor API response times.

4. **Startup check interval interfering with retries**: Interval might detect hang while retry is in progress, causing conflicts.
   - **Likelihood**: Low - Interval checks every 10 seconds, retries are measured in seconds
   - **Impact**: Low - Worst case, process is killed during sleep (acceptable recovery)
   - **Mitigation**: Ensure flags are properly reset at loop start so interval works correctly.

5. **Performance degradation**: Adding retry loop adds ~40 lines and complexity.
   - **Likelihood**: Low - Loop only executes on hang path (not normal path)
   - **Impact**: Low - Negligible performance impact
   - **Mitigation**: Only affects startup path, not runtime. Normal case is unaffected.

**Rollback Plan**:

If this fix causes issues:

1. **Quick rollback** (5 minutes):
   - Comment out retry loop, revert to immediate failure
   - Restart orchestrator
   - Verify old behavior (64% failure) returns

2. **Diagnostic steps** (15 minutes):
   - Check logs for state corruption
   - Verify startup tracker reset is working
   - Check if startup detection flags are proper
   - Test single retry manually

3. **Soft rollback** (if partial failure):
   - Set `MAX_STARTUP_RETRIES = 1` (disable retries but keep code)
   - Test to see if retries themselves are causing issue
   - Gradually increase to 2, 3 to find breaking point

4. **Long-term solution**:
   - Switch to API key authentication (fixes root cause)
   - Implement adaptive timeout based on history
   - Add circuit breaker pattern

**Monitoring** (if needed):

- Monitor startup attempt distribution: Track how many features need 1, 2, 3 retries
- Monitor retry success rate: Track % that succeed on retry vs fail all attempts
- Monitor total execution time: Ensure retries don't significantly slow down spec orchestration
- Alert if >50% of features need retries (indicates API/network issue)
- Track timeout rate before/after: Should drop from 64% to <10%

## Performance Impact

**Expected Impact**: Minimal to Slight Increase in Time (offset by higher success rate)

**Analysis**:

- **Retry delays**: 5s + 10s + 30s = 45 seconds maximum added per failed feature
- **Successful startups**: No overhead (loop executes once, breaks immediately)
- **Retry case**: 45 second delay per feature that needs retries
- **Net result**: If 64% of features need retries, previous system saw them fail outright. New system retries and often succeeds, so net time is better despite delays.

**Before fix** (estimated):
- 13 features to implement
- ~8 fail immediately (64% of 13)
- Orchestrator detects failure, reassigns to another sandbox
- Those 8 get retried by another sandbox or marked failed
- Total execution time: ~20-30 minutes (with orchestrator cycles)
- Success rate: ~36%

**After fix** (projected):
- 13 features to implement
- ~1-2 fail immediately (improved from 8 due to retries)
- Retries happen within same sandbox (faster)
- Features complete on 1st, 2nd, or 3rd attempt
- Total execution time: ~15-20 minutes (faster due to fewer failures)
- Success rate: 95%+

**Trade-off is favorable**: Slight delay for retries is offset by much higher success rate and fewer orchestrator cycles.

**Performance Testing**:

- Baseline: Run spec without fix, measure total time and success rate
- After fix: Run same spec, compare metrics
- Target: 90%+ first-attempt-or-retry success rate, <20 minute execution time for 13-feature spec

## Security Considerations

**Security Impact**: None - Low Risk

**Analysis**:

- Retry logic operates entirely within sandbox boundaries
- No new credential exposure (retries use same auth as original attempt)
- Backoff delays are deterministic (no randomization that could be exploited)
- Error messages don't expose internal details
- Progress files contain no sensitive data
- All operations still respect RLS and auth checks

**Security checklist**:
- Credentials not logged on retry: ✅ (same as original attempt)
- Retry doesn't bypass auth: ✅ (retries use same auth flow)
- Error messages safe: ✅ (generic startup hang messages)
- No timing attacks: ✅ (fixed backoff delays)
- Progress files contain no secrets: ✅ (only status/timing)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Observe high failure rate (64% of sandboxes fail to start producing output)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Check logs - should see many 2-line files
ls -lh .ai/alpha/logs/ | grep sbx | wc -l
# Most files should be ~93 bytes (only 2 lines)
```

**Expected Result**: Multiple 2-line log files, no retries in logs, high failure rate.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Build (if needed)
pnpm build

# Manual verification - run spec again
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Monitor logs for proper output
# Files should be much larger (>500 bytes typically)
# Should see "Retrying startup" messages if retries occur
# All features should complete successfully

# Verify improved success rate
ls -lh .ai/alpha/logs/ | tail -20
# Most files should be >500 bytes
```

**Expected Result**: All commands pass, log files >500 bytes, no failures, startup success rate >90%.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specific tests for new retry logic
pnpm test -- feature-retry-loop.spec.ts
pnpm test -- startup-monitor.spec.ts

# Integration test with retry
pnpm test:integration sandbox-retry.spec.ts
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - All functionality uses existing Node.js built-ins:
- `setTimeout()` for delays
- `Promise` for async/await
- Existing `startupTracker` and `startupAttemptRecord` types

### Existing Dependencies Used

- `@e2b/code-interpreter` - Sandbox execution (no changes needed)
- Node.js `timers` module (already used)
- Existing startup-monitor.ts functions (already written)

## Database Changes

**No database changes required**

- No schema modifications
- No migrations needed
- Progress file format unchanged (compatible with existing code)
- No RLS policy changes
- Startup attempts are tracked in memory only during session

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- No database migrations needed
- No environment variable changes
- No breaking changes to existing code
- Can be deployed as regular code update
- No special warmup or validation steps

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained
- Existing sandboxes continue to work
- Old logs remain valid
- No API changes
- No manifest format changes

**Monitoring after deployment**:
- Watch startup success rate (target: 95%+)
- Monitor retry distribution (should see 1-2 retries for ~10% of features)
- Check for timeout-related errors
- Verify progress files update correctly
- Ensure no zombie processes from retries

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Startup success rate improves from 36% to 95%+
- [ ] Retries work correctly (exponential backoff verified)
- [ ] Startup hang detection still works properly
- [ ] Health check and stall detection don't interfere with retries
- [ ] All tests pass (unit, integration, manual)
- [ ] Zero regressions detected
- [ ] Log files show ">100 bytes per feature (vs 2-line hang previously)
- [ ] Startup attempts are logged with timestamps
- [ ] Code review approved
- [ ] Manual testing checklist complete

## Notes

**Key Insights from Diagnosis**:

- The 1-minute-apart log files prove timeout detection IS working
- The ~93 byte size (exactly 2 lines) indicates hangs at same point
- Configuration for retry is already defined but never used
- Startup monitor utilities are correct and working
- Only the retry loop wrapper is missing

**Why This Fix Works**:

1. **Addresses root cause** - Actually implements the planned retry loop
2. **Uses proven pattern** - Exponential backoff is industry standard
3. **Minimal scope** - Only changes affected function
4. **Backward compatible** - No breaking changes
5. **Quick deployment** - No infrastructure changes needed
6. **Measurable improvement** - Should see immediate success rate jump from 36% to 95%

**Implementation Notes**:

- The `startupAttemptRecord` variable already exists, just needs incremented on each loop iteration
- The `STARTUP_RETRY_DELAYS_MS` config already exists with correct values [5000, 10000, 30000]
- The `MAX_STARTUP_RETRIES` constant already exists set to 3
- Startup tracker reset is critical - must create fresh tracker on each attempt
- Ensure startup check interval can run independently for each retry attempt

**Future Improvements**:

After this fix is deployed and validated:
1. Switch to API key authentication (eliminates OAuth session limits)
2. Implement adaptive timeout based on sandbox performance history
3. Add metrics dashboard for startup success rate tracking
4. Consider circuit breaker pattern for cascading failures
5. Analyze which features hit retries for root cause analysis

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1446*
