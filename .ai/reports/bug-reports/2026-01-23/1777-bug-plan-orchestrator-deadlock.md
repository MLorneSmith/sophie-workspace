# Bug Fix: Orchestrator Deadlock Due to Failed Features Blocking Initiative Dependencies

**Related Diagnosis**: #1776
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Work loop exit condition doesn't detect deadlock when failed features block all remaining features via initiative dependencies
- **Fix Approach**: Implement explicit deadlock detection + automatic initiative failure when blocked features prevent completion
- **Estimated Effort**: medium (4-6 hours)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The orchestrator enters an infinite loop when:
1. A feature fails that's required for an initiative to complete
2. Other features depend on that initiative being "completed"
3. The work loop's exit condition can't distinguish between "retryable" features and "permanently blocked" features

Result: All sandboxes become idle, waiting indefinitely for dependencies that can never be satisfied.

For full details, see diagnosis issue #1776.

### Solution Approaches Considered

#### Option 1: Deadlock Detection with Fallback Retry ⭐ RECOMMENDED

**Description**:
1. Add explicit deadlock detection in the work loop
2. When detected: identify the blocking failed features
3. Auto-retry failed features with exponential backoff (max 3 attempts)
4. If max retries exceeded: mark the blocking initiative as "failed"
5. Exit work loop with clear error message

**Pros**:
- Handles both transient failures (PTY timeouts) and permanent failures
- Provides visibility into why orchestration stopped
- Allows partial completion (some initiatives work even if one fails)
- Graceful degradation with clear feedback
- Preserves existing progress

**Cons**:
- More complex logic (deadlock detection + retry state tracking)
- Requires state machine changes to track retry counts
- May retry a failed feature multiple times before giving up

**Risk Assessment**: Medium - Adds retry logic which must be carefully bounded to prevent infinite loops

**Complexity**: Moderate - Requires ~150-200 lines of new code + 100 lines of test code

#### Option 2: Simpler Exit Condition Fix

**Description**:
Change the work loop exit condition to:
- Exit if NO retryable features exist AND all blocked features are permanently blocked
- "Permanently blocked" = blocked by failed feature in critical path

**Pros**:
- Minimal code changes (~50 lines)
- Simpler to understand and maintain
- Lower risk of introducing new bugs

**Cons**:
- Doesn't fix the underlying issue (failed features still block everything)
- Still results in orchestration failure, just exits faster
- Doesn't attempt recovery
- User gets "deadlock detected, exiting" with no fix attempt

**Why Not Chosen**: Doesn't actually resolve the root problem; just exits faster. Option 1 attempts to recover.

#### Option 3: Force Initiative Completion on Partial Feature Success

**Description**:
Allow initiatives to complete with < N features if enough features complete (e.g., 75% threshold).

**Pros**:
- Allows work to continue on dependent initiatives

**Cons**:
- May hide real failures
- Silently skips incomplete features (confusing)
- Breaks dependency contract ("complete initiative" means all features done)
- Hard to distinguish between "acceptable partial" and "critical failure"

**Why Not Chosen**: Too permissive; violates the dependency model.

### Selected Solution: Deadlock Detection with Fallback Retry

**Justification**:
Best balance of robustness and complexity. Handles transient failures (like PTY timeouts that can be retried) while gracefully handling permanent failures. Provides users with clear feedback about why orchestration stopped.

**Technical Approach**:

1. **Track failed feature retry count** - Add `retry_count: number` field to FeatureEntry in spec-manifest.json
2. **Detect deadlock condition** - In work loop, check:
   - All sandboxes are idle
   - No features can be assigned (getNextAvailableFeature returns null)
   - Failed features exist that are blocking assignable features
3. **Auto-retry strategy**:
   - For each failed feature blocking the queue: increment retry_count
   - If retry_count < 3: reset feature to "pending" (allow reassignment)
   - If retry_count >= 3: mark its initiative as "failed"
   - Clear the feature's error message for fresh attempt
4. **Enhanced error messaging**:
   - Log which features were retried and why
   - On final exit: clearly state "Orchestration incomplete: Initiative S1692.I1 failed due to feature S1692.I1.F4"

**Architecture Changes**:
- Add `retry_count?: number` field to FeatureEntry type
- Add `getBlockingFailedFeatures(manifest)` function to work-queue.ts
- Add `detectAndHandleDeadlock(instances, manifest, uiEnabled)` function to orchestrator.ts
- Modify work loop to call deadlock handler every cycle

**Migration Strategy**: Not needed - backward compatible. Old manifests without retry_count field will be initialized to 0.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` (lines 876-900: work loop exit logic)
  - Add deadlock detection before the work loop's continue/break decision
  - Add deadlock handler that implements retry strategy
  - Modify exit conditions to recognize permanent deadlock

- `.ai/alpha/scripts/lib/work-queue.ts`
  - Add `getBlockingFailedFeatures(manifest)` function
  - Add `shouldRetryFailedFeature(feature, retryLimit)` function
  - Add `resetFailedFeatureForRetry(feature)` function

- `.ai/alpha/scripts/types/index.ts`
  - Add `retry_count?: number` to FeatureEntry interface
  - Add `max_retries?: number` to SandboxMetadata (configuration)

- `.ai/alpha/scripts/lib/progress-file.ts` (optional)
  - Update progress file to track which feature is being retried

### New Files

- `.ai/alpha/scripts/lib/__tests__/orchestrator-deadlock-detection.spec.ts`
  - Tests for deadlock detection scenarios
  - Tests for retry logic and max retry handling
  - Tests for initiative failure propagation
  - Regression test: ensure normal flows still work

### Step-by-Step Tasks

#### Step 1: Update Type Definitions

Add retry tracking and configuration to types:

- Add `retry_count?: number` field to `FeatureEntry` in types
- Add `max_retries?: number` (default: 3) to `SandboxMetadata` in types
- Add `InitiativeFailureReason` enum for tracking why initiatives fail

**Why this step first**: Type definitions are the contract for the rest of the code; need these in place before implementing logic

#### Step 2: Implement Work-Queue Helper Functions

Create utility functions in `work-queue.ts`:

- `getBlockingFailedFeatures(manifest): FeatureEntry[]`
  - Returns array of failed features that are blocking assignable features
  - A feature "blocks" assignable features if other unblocked features depend on its initiative

- `shouldRetryFailedFeature(feature, maxRetries): boolean`
  - Returns true if feature has been retried fewer than maxRetries times

- `resetFailedFeatureForRetry(feature): void`
  - Set status back to "pending"
  - Clear error message
  - Keep retry_count (increment will happen in orchestrator)
  - Clear assigned_sandbox and assigned_at

#### Step 3: Implement Deadlock Detection

Create `detectAndHandleDeadlock(instances, manifest, uiEnabled): boolean` in `orchestrator.ts`:

Returns `true` if deadlock was handled (orchestration should exit), `false` to continue.

Logic:
```
1. Check if all sandboxes are idle (status != "busy")
2. Check if no features can be assigned (getNextAvailableFeature returns null)
3. Check if failed features exist
4. If all true: we have potential deadlock

5. Get blocking failed features: features that cause assignable features to be unassigned
6. For each blocking failed feature:
   - If retry_count < max_retries:
     * Log "Retrying failed feature..."
     * Reset to pending
     * Increment retry_count
   - Else:
     * Log "Max retries exceeded for feature..."
     * Mark feature as permanently failed
     * Mark its initiative as "failed"
     * Propagate initiative failure to dependents

7. If ANY features were retried: return false (continue work loop)
8. Else: return true (exit with "orchestration incomplete")
```

**Why this step**: Core deadlock handling logic; foundation for rest of fix

#### Step 4: Integrate Deadlock Detection into Work Loop

Modify `runWorkLoop()` in `orchestrator.ts` (around line 876-900):

Current logic:
```typescript
if (activeWork.size === 0) {
  const retryableFeatures = manifest.feature_queue.filter(...);
  if (retryableFeatures.length === 0) break;  // PROBLEM: can't tell if permanently blocked
  continue;
}
```

New logic:
```typescript
if (activeWork.size === 0) {
  // NEW: Check for deadlock condition
  const shouldExit = detectAndHandleDeadlock(instances, manifest, uiEnabled);
  if (shouldExit) {
    log("\n❌ Orchestration incomplete: deadlock detected with no recovery possible");
    break;  // Exit the work loop
  }

  // Normal retry logic
  const retryableFeatures = manifest.feature_queue.filter(...);
  if (retryableFeatures.length === 0) break;
  continue;
}
```

Add this check at regular intervals (every HEALTH_CHECK_INTERVAL_MS or when no work is assigned).

#### Step 5: Add Progress Reporting

Update logging/progress files to show when features are being retried:

- Write message: "🔄 Retrying feature #1692.I1.F4 (attempt 2/3) due to deadlock detection"
- Update progress file phase to "retrying"
- Emit event: `feature_retry` for UI dashboard visibility

#### Step 6: Add Comprehensive Tests

Create `.ai/alpha/scripts/lib/__tests__/orchestrator-deadlock-detection.spec.ts`:

**Unit Tests**:
- ✅ `getBlockingFailedFeatures()` identifies features blocking others
- ✅ `shouldRetryFailedFeature()` respects max retry limit
- ✅ `detectAndHandleDeadlock()` detects idle + blocked scenario
- ✅ Deadlock handler retries failed features up to max attempts
- ✅ Deadlock handler marks initiative as failed after max retries
- ✅ Deadlock handler propagates initiative failure to dependents

**Scenario Tests**:
- ✅ Scenario: Failed feature with < max retries → retry and continue
- ✅ Scenario: Failed feature with >= max retries → mark initiative failed and exit
- ✅ Scenario: Multiple failed features → retry all, then exit if all exceeded
- ✅ Scenario: Normal feature completion → no deadlock detected (regression)

**Regression Tests**:
- ✅ Work loop exits correctly when all features completed (no deadlock)
- ✅ Work loop exits correctly when no work available (dependency blocked, not deadlock)
- ✅ Failed features outside critical path don't trigger deadlock exit

#### Step 7: Manual Testing and Validation

Execute manual tests in real orchestration scenario:

- [ ] Run orchestrator on S1692 until F4 fails (same scenario as diagnosis)
- [ ] Verify deadlock is detected ~60 seconds after all sandboxes go idle
- [ ] Verify log shows "Retrying failed feature..."
- [ ] Verify feature F4 is retried
- [ ] If F4 fails again, verify max retry handling
- [ ] Verify orchestration exits with clear message
- [ ] Verify progress file shows retry count
- [ ] Verify UI shows retry attempts

#### Step 8: Documentation Updates

- Update `.ai/alpha/docs/alpha-implementation-system.md`:
  - Add section on deadlock detection in "Error Handling"
  - Document max_retries configuration option
  - Add troubleshooting for "deadlock detected" exit

- Add inline code comments:
  - Explain deadlock detection logic in `detectAndHandleDeadlock()`
  - Explain why retry_count is used (distinguish permanent from transient failures)

## Testing Strategy

### Unit Tests

Add/update unit tests in `orchestrator-deadlock-detection.spec.ts`:

- ✅ `getBlockingFailedFeatures()` returns failed features blocking assignable features
- ✅ `getBlockingFailedFeatures()` ignores failed features not blocking anything
- ✅ `shouldRetryFailedFeature()` returns true when retry_count < max_retries
- ✅ `shouldRetryFailedFeature()` returns false when retry_count >= max_retries
- ✅ `resetFailedFeatureForRetry()` clears error and resets to pending
- ✅ `resetFailedFeatureForRetry()` preserves retry_count
- ✅ Deadlock detection identifies all-sandboxes-idle scenario
- ✅ Deadlock detection identifies no-assignable-features scenario
- ✅ Deadlock detection returns true (exit) when should exit
- ✅ Deadlock detection returns false (retry) when features were retried
- ✅ Edge case: No failed features → no deadlock
- ✅ Edge case: Failed features but some non-blocked work available → no deadlock
- ✅ Edge case: Multiple failed features in dependency chain → all retried

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-deadlock-detection.spec.ts` (new, ~200 lines)

### Integration Tests

Simulate deadlock scenarios:

- ✅ Feature fails → deadlock detection → retried → succeeds (happy path)
- ✅ Feature fails → max retries exceeded → initiative marked failed → dependent features blocked (error path)
- ✅ Multiple features fail in different initiatives → correct failure propagation

### Manual Testing Checklist

Execute these manual tests on actual orchestration run:

- [ ] Reproduce the original S1692 deadlock scenario
- [ ] Verify deadlock is detected within 60 seconds of all sandboxes going idle
- [ ] Check logs for "🔄 Retrying failed feature..." message
- [ ] Verify retry_count increments in manifest
- [ ] If feature recovers: verify orchestration continues
- [ ] If feature exhausts retries: verify orchestration exits with "deadlock detected"
- [ ] Verify UI shows retry progress (if event streaming enabled)
- [ ] Test on a different spec to ensure no regressions
- [ ] Verify normal orchestration (no failures) still works

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Risk: Infinite loop if deadlock detection itself has bugs**
   - **Likelihood**: Medium
   - **Impact**: High (orchestrator hangs indefinitely)
   - **Mitigation**:
     - Add circuit breaker: max 5 deadlock detection cycles per feature
     - Add timeout: if deadlock handler takes >30 seconds, timeout and exit
     - Comprehensive unit tests before merging

2. **Risk: Accidentally retrying features that shouldn't be retried**
   - **Likelihood**: Low
   - **Impact**: Medium (retries transient-looking failures that are permanent)
   - **Mitigation**:
     - Retry only failed features that are blocking other features
     - Max retries = 3 (reasonable limit)
     - Log every retry attempt with justification

3. **Risk: Initiative failure cascading incorrectly**
   - **Likelihood**: Low
   - **Impact**: Medium (marks wrong initiative as failed)
   - **Mitigation**:
     - Clear logic in `resetFailedFeatureForRetry()` about what "failed initiative" means
     - Unit tests for dependency propagation
     - Integration tests for multi-level dependency chains

4. **Risk: Manifest corruption if save fails during retry tracking**
   - **Likelihood**: Low
   - **Impact**: High (orchestration state lost)
   - **Mitigation**:
     - Save manifest immediately after updating retry_count
     - Already have try-catch in manifest save operations
     - Existing rollback/resume logic should handle this

**Rollback Plan**:

If this fix causes issues:
1. Revert commits: `git revert [commit-hash]`
2. Remove retry_count field from manifest (backward compatible)
3. Restart orchestrator: auto-resumes from checkpoint
4. If manifest corrupted: manually set all `retry_count` to 0, reset failed features to pending

**Monitoring** (optional):

- Track retry success rate: how many retries actually recover
- Alert if orchestrator exits with "deadlock detected" more than 2x per week
- Log deadlock detection frequency to identify patterns

## Performance Impact

**Expected Impact**: Minimal to None

- Deadlock detection runs every HEALTH_CHECK_INTERVAL_MS (~5 seconds)
- Detection logic: simple O(n) scan of feature queue → <1ms
- No extra network calls or database queries
- Only affects idle scenarios (no work being done anyway)

**Performance Testing**:
- Measure deadlock detection latency: should be <5ms
- Verify no additional memory leaks (retry_count is single integer)
- Confirm no impact on feature completion latency (when features are completing normally)

## Security Considerations

**Security Impact**: None

This fix involves:
- Local orchestrator state management
- No new network calls or API exposure
- No user-facing changes
- No credential handling

No security review needed.

## Validation Commands

### Before Fix (Deadlock Should Occur)

```bash
# Ensure S1692 spec is decomposed with all initiatives and features
# Kill any running orchestrators
pkill -f spec-orchestrator

# Run orchestrator on S1692 (will hang at deadlock)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692

# Wait 10+ minutes - should see:
# - All 3 sandboxes in idle state
# - Features completed: 2/19
# - All remaining features blocked
# - UI appears frozen/hung
```

**Expected Result**: Orchestrator hangs indefinitely as described in diagnosis #1776

### After Fix (Deadlock Should Be Detected and Handled)

```bash
# Clean manifest to start fresh
rm .ai/alpha/specs/S1692-Spec-user-dashboard/spec-manifest.json

# Run orchestrator on S1692 (should now handle deadlock gracefully)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692

# Expected behavior:
# 1. Features 1-3 complete normally
# 2. Feature 4 fails with PTY timeout
# 3. Within 60 seconds: "🔄 Deadlock detected, retrying blocked features..."
# 4. Feature 4 is retried (attempt 2/3)
# 5. If still fails after max retries: "❌ Orchestration incomplete: Initiative I1 failed"
# 6. Orchestrator exits cleanly with error message (no hang)

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run new deadlock detection tests
pnpm test:unit -- orchestrator-deadlock-detection

# Run existing orchestrator tests (regression check)
pnpm test:unit -- orchestrator

# Build to ensure no compilation errors
pnpm build
```

**Expected Result**:
- Typecheck passes
- Lint passes
- New tests pass (deadlock scenarios)
- Existing tests pass (no regressions)
- Build succeeds
- Orchestrator handles deadlock gracefully

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Additional regression checks
pnpm --filter web typecheck
pnpm lint:fix && pnpm format:fix

# If tests pass and no build errors: ready to merge
```

## Dependencies

**No new dependencies required**

- Uses existing TypeScript types and utilities
- Uses existing logging and event emission
- Uses existing manifest save/load functions
- No new npm packages needed

## Database Changes

**No database changes required**

The retry_count field is stored in the manifest JSON file (not database):
- `spec-manifest.json` is version-controlled locally
- On restart, orchestrator reloads manifest with retry counts preserved
- No migrations or schema changes needed

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Maintained
- Old manifests without retry_count field will work fine
- `retry_count` is optional (`?: number`)
- Missing field defaults to 0 (first attempt)

**Deployment process**:
1. Merge PR to dev branch
2. Test on dev/staging
3. Deploy to production
4. No special configuration needed

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Deadlock is detected within 60 seconds of occurring
- [ ] Failed features are retried automatically
- [ ] Max retries limit is respected
- [ ] Initiative failure is clearly reported
- [ ] All unit tests pass (new + existing)
- [ ] No regressions in normal orchestration flows
- [ ] Code review approved
- [ ] Manual testing checklist complete
- [ ] Performance acceptable (<5ms per deadlock detection)

## Notes

### Why Exponential Backoff Not Used

This fix uses simple counter-based retries (1, 2, 3) rather than exponential backoff because:
- PTY timeout failures are often transient (temporary network hiccup)
- Waiting between retries would only extend total orchestration time
- Max 3 retries = ~5 minutes total (reasonable limit)
- If fails 3x in a row, it's probably permanent

### Why Initiative Failure Cascade

When a feature critical to initiative completion exhausts retries:
- Mark the initiative as "failed" (not "completed")
- This cascades to dependent features in other initiatives
- Prevents them from being assigned (dependencies unmet)
- Clear failure path vs indefinite hang

### How This Differs from #1767

- #1767 fixes PTY timeout detection ("progress file unavailable")
- #1776 (this fix) handles what happens when that PTY timeout causes deadlock
- These are complementary: #1767 prevents some timeouts, #1776 gracefully handles remaining ones

### Future Improvements

Potential enhancements (out of scope for this fix):
1. Exponential backoff with jitter for retries
2. Smart retry selection (retry high-priority features first)
3. Partial initiative completion thresholds
4. User intervention hooks ("pause and retry manually")
5. Machine learning for predicting retry success

---
*Generated by Bug Fix Planning*
*Based on diagnosis: #1776*
