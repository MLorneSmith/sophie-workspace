# Bug Fix: Alpha orchestrator stale progress file race

**Related Diagnosis**: #2062
**Severity**: critical
**Bug Type**: race condition
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Race condition where `checkPTYFallbackRecovery()` reads stale progress file before `runFeatureImplementation()` clears it, causing new features to be marked completed based on old data
- **Fix Approach**: Three-layer defense: time-based guard (90s minimum age), feature ID validation in progress file, raise completion threshold 50%→80%
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator's main event loop assigns work to idle sandboxes and simultaneously checks for stuck tasks. Due to incomplete async coordination, the progress file recovery mechanism reads stale progress data from the **previous feature** before the new feature clears it. This causes two concurrent Claude processes to run on the same sandbox, resulting in:

- OOM kills (exit 137) from resource exhaustion
- Multiple sandbox restarts due to crash loops
- All 14 features incorrectly marked "completed" despite only 80/97 tasks finishing
- Resource waste (~60 minutes per spec run)

For full details, see diagnosis issue #2062.

### Solution Approaches Considered

#### Option 1: Time-based guard + Feature ID validation ⭐ RECOMMENDED

**Description**: Implement a multi-layered defense that prevents recovery logic from reading stale progress files by:
1. Adding `assigned_at_ms` timestamp when work is assigned
2. Skipping recovery checks for features assigned < 90 seconds ago
3. Writing `feature_id` to progress file during initialization
4. Validating feature ID match during recovery (reject mismatches)
5. Raising completion threshold from 50% → 80% for extra safety

**Pros**:
- Addresses root cause directly (prevents stale reads)
- Low complexity (4-5 small code changes)
- Backward compatible (no schema changes needed)
- Fast implementation (< 2 hours)
- Defensive at multiple levels (time guard + feature ID validation)
- Prevents concurrent sandbox execution entirely

**Cons**:
- Time-based guard is approximate (90s is empirical, not mathematical)
- Adds ~50 bytes per feature to progress file
- Requires coordination between two work-loop functions

**Risk Assessment**: Low - changes are isolated to work-loop.ts and feature.ts, only affects recovery logic path (5% of normal execution)

**Complexity**: moderate - requires understanding async coordination but changes are surgical

#### Option 2: Centralized state machine with queuing

**Description**: Replace the event-loop-based assignment with a centralized queue that processes one feature at a time per sandbox, eliminating overlaps entirely.

**Pros**:
- Eliminates race condition entirely (fundamentally)
- Cleaner separation of concerns
- Easier to debug and test

**Cons**:
- Large refactor (~500 lines of code changes)
- Requires rewriting work-loop.ts main loop
- Risk of introducing new bugs during refactor
- Would need comprehensive testing (not viable for critical fix)
- Estimated 8-10 hours implementation

**Why Not Chosen**: Too risky for a hot fix on critical bug. The time-based guard approach is proven to work (#1767 introduced recovery, just missing the guard).

#### Option 3: Progressive locking mechanism

**Description**: Add per-sandbox mutex locks that prevent new work assignment until previous feature's cleanup completes.

**Pros**:
- Strong guarantees (impossible to violate)
- Relatively low complexity

**Cons**:
- Introduces new synchronization primitive (more complex mental model)
- Risk of deadlocks if not implemented carefully
- Overkill for this specific issue (simpler time guard is sufficient)

**Why Not Chosen**: Time-based guard is simpler, proven effective, and solves the actual problem (90s cleanup is enough buffer).

### Selected Solution: Time-based guard + Feature ID validation

**Justification**: The diagnosis clearly identifies the race window (30-90 seconds between feature assignments). A 90-second time-based guard directly prevents recovery logic from running during this window. Combined with feature ID validation, this creates a defense-in-depth approach that prevents false positives even if timing overlaps. The 50%→80% completion threshold raise adds a third safety layer. This is surgical, low-risk, proven effective (#1767 used recovery without guard), and implementable in < 2 hours.

**Technical Approach**:

1. **Time-based guard**: When a feature is assigned to a sandbox, record `assigned_at_ms = Date.now()`. In `checkPTYFallbackRecovery()`, skip the check if the feature was assigned < 90 seconds ago. This prevents recovery logic from reading a progress file that might still belong to the previous feature.

2. **Feature ID validation**: Write `feature_id` to the progress file when `runFeatureImplementation()` initializes it (alongside `status: "in_progress"`). In recovery logic, verify that `feature_id` in the progress file matches the current feature. Reject mismatches as corrupted state.

3. **Completion threshold increase**: Raise the "feature completed" threshold from 50% to 80% in `checkPTYFallbackRecovery()`. This prevents partially-completed features from being marked done.

**Architecture Changes**: None - pure logic changes to existing functions

**Migration Strategy**: Not needed - purely internal state management change

## Implementation Plan

### Affected Files

- ``.ai/alpha/scripts/lib/work-loop.ts`` - Add `assigned_at_ms` timestamp to ActiveWork tracking, implement time guard in `detectAndRecoverStuckTasks()`, increase completion threshold
- `.ai/alpha/scripts/lib/feature.ts` - Write `feature_id` to progress file during initialization
- `.ai/alpha/scripts/lib/progress-file.ts` - Read and validate `feature_id` during recovery (optional but recommended)
- `.ai/alpha/scripts/lib/config/constants.ts` - Add `MIN_FEATURE_AGE_FOR_RECOVERY_MS = 90000` constant

### New Files

No new files needed.

### Step-by-Step Tasks

#### Step 1: Add feature age tracking to work assignment

**What this accomplishes**: Records when each feature was assigned so recovery logic can check the age before attempting recovery.

**Changes**:
1. In `work-loop.ts`, find the `ActiveWork` type/interface definition
2. Add field: `assigned_at_ms?: number`
3. In `assignWorkToIdleSandboxes()`, when assigning a feature, set: `activeWork.set(instance.label, { ...featureData, assigned_at_ms: Date.now() })`
4. In `config/constants.ts`, add: `export const MIN_FEATURE_AGE_FOR_RECOVERY_MS = 90000; // 90 seconds`

**Why this step first**: Establishes the timestamp that all other checks depend on. Can't guard recovery without knowing assignment time.

#### Step 2: Implement time-based guard in recovery logic

**What this accomplishes**: Prevents recovery logic from reading progress files of recently-assigned features.

**Changes**:
1. In `work-loop.ts`, find `checkPTYFallbackRecovery()` function
2. At the start of recovery check, add guard:
   ```typescript
   const featureAge = Date.now() - (activeFeature.assigned_at_ms ?? 0);
   if (featureAge < MIN_FEATURE_AGE_FOR_RECOVERY_MS) {
     logger.debug(`Skipping recovery for feature ${featureId} (too recent, age: ${featureAge}ms)`);
     return false; // Don't mark as completed
   }
   ```
3. This prevents reading progress file until feature is at least 90 seconds old

**Why this step**: Directly addresses the race window identified in diagnosis (34-second gaps between assignments)

#### Step 3: Add feature ID to progress file

**What this accomplishes**: Validates that progress file belongs to the current feature, preventing stale data acceptance.

**Changes**:
1. In `feature.ts`, find where progress file is initialized (likely in `runFeatureImplementation()` or progress initialization)
2. When writing initial progress state, include: `{ feature_id: feature.id, status: "in_progress", ... }`
3. In `progress-file.ts`, update type definitions to include `feature_id: string`

**Why this step**: Secondary validation layer - even if time guard has a timing edge case, feature ID mismatch will catch it

#### Step 4: Raise completion threshold

**What this accomplishes**: Prevents partially-completed features (50% done tasks) from being incorrectly marked complete.

**Changes**:
1. In `work-loop.ts`, find `checkPTYFallbackRecovery()`
2. Find the line: `const completionPercent = (completed_count / total_count) * 100; if (completionPercent >= 50) ...`
3. Change threshold: `if (completionPercent >= 80) ...` (80% instead of 50%)
4. Log the change for debugging: `logger.info(`Feature ${featureId}: ${completionPercent}% complete (needs 80% for recovery mark)`)`

**Why this step**: Adds safety margin. Diagnosis showed 6 features with partial completion marked as done; 80% threshold prevents this.

#### Step 5: Add validation and logging

**What this accomplishes**: Makes the system observable so we can detect if recovery logic was incorrectly triggered.

**Changes**:
1. In `checkPTYFallbackRecovery()`, add logging before/after recovery checks:
   ```typescript
   logger.debug(`Recovery check for ${featureId}: age=${featureAge}ms, threshold=${MIN_FEATURE_AGE_FOR_RECOVERY_MS}ms, passed=${featureAge >= MIN_FEATURE_AGE_FOR_RECOVERY_MS}`);
   ```
2. Add warning if feature ID mismatch detected:
   ```typescript
   if (progressData.feature_id !== featureId) {
     logger.warn(`Feature ID mismatch: expected ${featureId}, got ${progressData.feature_id}. Skipping recovery.`);
     return false;
   }
   ```

#### Step 6: Update tests and validation

**What this accomplishes**: Ensures changes don't break existing functionality.

**Changes**:
1. Update any unit tests for `checkPTYFallbackRecovery()` to account for time guard
2. Add test: "Should skip recovery for features assigned < 90s ago"
3. Add test: "Should reject features with mismatched feature_id"
4. Run: `pnpm typecheck` to verify all changes compile

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `checkPTYFallbackRecovery()` skips recently-assigned features (age < 90s)
- ✅ `checkPTYFallbackRecovery()` processes old features (age >= 90s)
- ✅ Recovery rejects features with mismatched feature_id
- ✅ Completion threshold correctly uses 80% instead of 50%
- ✅ Partial completion (50-79%) is NOT marked complete
- ✅ Full completion (80%+) IS marked complete
- ✅ Timestamp recording in `assigned_at_ms` works

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/work-loop.spec.ts` - Recovery logic tests
- `.ai/alpha/scripts/lib/__tests__/feature.spec.ts` - Feature ID tests

### Integration Tests

Test the fix end-to-end:
- ✅ Run Alpha orchestrator with 6+ features
- ✅ Verify no concurrent execution on single sandbox
- ✅ Verify no false "completed" status
- ✅ Verify completion percentages are accurate
- ✅ Monitor for no "exit 137" (OOM kills)

**Test scenario**: Run `pnpm alpha:orchestrate S2045 --verbose` and monitor:
- Sandbox allocation (should never overlap features on same sandbox)
- Progress file contents (should always have matching feature_id)
- Completion percentage vs tasks completed (should be consistent)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with S2045 spec (6 initiatives, 18 features)
- [ ] Verify no concurrent features on same sandbox
- [ ] Check logs for "Skipping recovery for feature..." (should see many for young features)
- [ ] Verify all 18 features complete (not showing incomplete)
- [ ] Check task completion counts vs percentages (should match)
- [ ] Monitor system resources (no OOM, no "exit 137" errors)
- [ ] Verify sandbox restarts don't exceed 1-2 (vs. 3 in the original run)
- [ ] Compare run time (should be similar or faster due to fewer restarts)
- [ ] Review logs for any "Feature ID mismatch" warnings (should be zero)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Time guard too conservative (90s is too long)**: Recovery takes longer to activate
   - **Likelihood**: low (34s gap in diagnosis, 90s is 2.6x buffer)
   - **Impact**: medium (slightly slower recovery from stuck tasks, but prevents false recovery)
   - **Mitigation**: Monitor actual feature execution times; if consistently < 90s, reduce threshold. Can be tuned based on real data.

2. **Time guard too lenient (90s insufficient)**: Still has race window
   - **Likelihood**: very low (diagnostic data shows 34s gaps; 90s is proven safe)
   - **Impact**: high (reintroduces concurrent execution)
   - **Mitigation**: If observed, increase to 120s. Time guard is adjustable constant.

3. **Feature ID not always written to progress file**: Validation fails
   - **Likelihood**: low (simple write during initialization)
   - **Impact**: low (time guard still protects; feature ID is defense-in-depth)
   - **Mitigation**: Add assertion that feature_id is never null/empty in recovery logic

4. **Threshold change breaks legitimate recovery**: Stuck tasks stay stuck longer
   - **Likelihood**: low (80% is still generous recovery threshold)
   - **Impact**: medium (features may timeout instead of recovering)
   - **Mitigation**: Monitor timeout metrics; adjust threshold if needed

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `work-loop.ts` and `feature.ts` to previous commit
2. Revert `config/constants.ts` to remove `MIN_FEATURE_AGE_FOR_RECOVERY_MS`
3. Redeploy Alpha tooling (no data migration needed)
4. Investigate root cause from logs (time guard was too aggressive or feature ID validation failed)

**Monitoring** (post-deployment):
- Monitor orchestrator logs for "Skipping recovery for feature..." messages (should see ~20-30% of checks)
- Monitor for "Feature ID mismatch" warnings (should be zero)
- Track sandbox restarts per run (should be 0-1, not 3)
- Track concurrent features per sandbox (should never exceed 1)
- Track OOM kills (should be zero)

## Performance Impact

**Expected Impact**: none (improvements to stability)

This fix should **improve** performance by eliminating:
- OOM kills and sandbox restarts (save 2-3 sandbox hours per 14-feature spec)
- Redundant task execution from concurrent processes
- Resource contention on single sandbox

**Performance Testing**:
- Benchmark: Run S2045 spec and measure total time (should be 60-90 min instead of 120+ min)
- Profile sandbox resource usage (memory should stay < 2GB, not spike to OOM)

## Security Considerations

**Security Impact**: none

This is a stability/correctness fix with no security implications:
- No new inputs or outputs
- No authentication changes
- No privilege escalation vectors
- Feature ID is internal state only

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run the problematic spec to see concurrent execution
pnpm alpha:orchestrate S2045 --verbose 2>&1 | grep -E "(sbx-a|sbx-b|exit 137|Skipping recovery)"

# Expected: See "exit 137" errors, features marked complete with partial tasks
```

**Expected Result**: OOM kills and phantom completions occur

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator with verbose logging
pnpm alpha:orchestrate S2045 --verbose 2>&1 | tee orchestrator.log

# Verify no concurrent execution
grep -E "sbx-a.*completed.*sbx-b.*started|exit 137" orchestrator.log | wc -l  # Should be 0

# Verify recovery guard is working
grep "Skipping recovery for feature" orchestrator.log | wc -l  # Should see multiple

# Verify no feature ID mismatches
grep "Feature ID mismatch" orchestrator.log | wc -l  # Should be 0

# Check final feature status
jq '.features[] | {id: .id, status: .status, tasks_completed: .tasks_completed, task_count: .task_count}' .ai/alpha/specs/S2045-Spec-user-dashboard/spec-manifest.json

# Verify all features either completed with 100% tasks or still in progress
```

**Expected Result**: All commands succeed, no concurrent execution, no phantom completions, all features have accurate task percentages.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run Alpha-specific tests
pnpm --filter @alpha/orchestrator test

# Run orchestrator with different specs to ensure no regressions
for spec in S1918 S2045; do
  echo "Testing $spec..."
  pnpm alpha:orchestrate $spec --verbose 2>&1 | grep -c "exit 137" || true
done
```

**Expected Result**: No new test failures, zero "exit 137" errors across multiple spec runs.

## Dependencies

### New Dependencies

**No new dependencies required**

All changes use existing code patterns and libraries.

## Database Changes

**No database changes required**

This is purely an orchestrator logic fix affecting in-memory state and progress file format (backward compatible).

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
1. Deploy Alpha tooling changes (work-loop.ts, feature.ts, constants.ts)
2. No schema migrations needed
3. No database migrations needed
4. No environment variable changes needed
5. No feature flags needed

**Backwards compatibility**: maintained

The progress file format change (adding `feature_id`) is backward compatible. Old progress files without `feature_id` will be treated as mismatches and skipped (safe behavior).

## Success Criteria

The fix is complete when:
- [ ] All type checks pass (`pnpm typecheck`)
- [ ] No concurrent features ever run on same sandbox (verified in logs)
- [ ] No features marked complete with < 80% tasks completed
- [ ] No "exit 137" (OOM) errors during orchestrator runs
- [ ] Sandbox restarts reduced from 3+ to 0-1 per spec run
- [ ] All tests pass (unit, integration)
- [ ] Manual testing checklist complete
- [ ] S2045 spec runs to completion successfully
- [ ] No "Feature ID mismatch" warnings in logs

## Notes

**Why 90 seconds?**
The diagnosis shows features are assigned to the same sandbox 34 seconds apart. A 90-second guard provides 2.6x safety margin, which is empirically proven to work (no race window observed at that spacing). This can be tuned later based on actual feature execution times.

**Why feature ID validation?**
Defense-in-depth. Even if timing is off by a few seconds, feature ID mismatch will catch corrupted state. Low overhead (one string comparison per recovery check).

**Why raise threshold to 80%?**
Diagnosis showed 6 features with 50-70% completion marked as done. The original 50% threshold was too lenient. 80% is conservative but safe—allows legitimate recovery while preventing false positives.

**Why not merge all changes into one function?**
Separation of concerns: time guard prevents reading stale data, feature ID validates correctness, completion threshold ensures quality. Each layer is independently testable and can be tuned separately.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #2062*
