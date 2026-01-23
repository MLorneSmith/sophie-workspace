# Bug Fix: Orchestrator UI Hangs Due to Phantom Completion State

**Related Diagnosis**: #1780
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Feature transitions to sandbox status `"ready"` before manifest update completes, creating "phantom completion" state where all tasks are done but status remains `"in_progress"`
- **Fix Approach**: Add phantom completion detection in work loop + extend deadlock detection to handle in_progress features with completed tasks
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator UI hangs indefinitely when a feature completes all its tasks (`tasks_completed === task_count`) but the manifest is not updated to `status: "completed"`. This "phantom completion" state blocks initiative completion and cascades to block 15+ dependent features.

The existing deadlock detection (#1777) only detects failed features, missing this in_progress case. Additionally, the stuck task detection checks `tasksRemaining > 0`, which is false when all tasks complete.

For full details, see diagnosis issue #1780.

### Solution Approaches Considered

#### Option 1: Add Phantom Completion Detection ⭐ RECOMMENDED

**Description**: Detect features where `tasks_completed >= task_count` but `status !== "completed"` and force the transition. This catches the exact state without changing the underlying cause.

**Pros**:
- Simple, surgical fix that directly addresses the symptom
- Catches the state regardless of how it occurred
- Provides good telemetry for understanding frequency
- Works immediately without waiting for upstream fixes
- Low risk - only affects features already done with work

**Cons**:
- Doesn't fix the root cause (race condition in feature.ts)
- May hide underlying issues in feature.ts if telemetry not monitored
- Only prevents UI hang, doesn't improve overall robustness

**Risk Assessment**: Low - This is a defensive fix that only triggers when features are already functionally complete.

**Complexity**: Simple - ~20 lines of code

#### Option 2: Fix Feature.ts Manifest Save Race Condition

**Description**: Ensure the manifest save in feature.ts never fails between task completion and status update. Add explicit error handling and retry logic.

**Pros**:
- Fixes the root cause, preventing phantom completion from ever occurring
- More robust system overall
- Reduces need for defensive checks in orchestrator

**Cons**:
- Requires careful changes to feature.ts execution flow
- Higher risk - affects critical feature execution path
- Harder to test all edge cases
- Would require understanding why manifest save is failing in first place

**Why Not Chosen**: While better long-term, we don't have evidence that feature.ts save is actually failing. The race condition might be in orchestrator state transitions, not feature.ts. Option 1 is safer for immediate fix.

#### Option 3: Two-Part Approach (Recommended + Root Cause Investigation)

**Description**: Implement Option 1 immediately to fix UI hang, then add comprehensive logging and telemetry to detect if/when phantom completion occurs. Use telemetry to guide investigation of root cause.

**Pros**:
- Fixes UI hang immediately (Option 1)
- Provides data to investigate root cause
- Safer than attempting blind fix in feature.ts
- Can stage root cause fix once cause is known

**Cons**:
- Requires monitoring and follow-up work
- Telemetry only helps if phantom completion re-occurs

**Why Not Chosen as Primary**: This IS the recommended approach, but presented as Option 1. We'll add comprehensive logging as part of Step 2.

### Selected Solution: Add Phantom Completion Detection with Deadlock Extension

**Justification**:

Option 1 provides immediate relief from the UI hang with minimal risk. The code clearly shows features can reach a state where tasks are done but status is wrong. Rather than attempting to fix feature.ts (which we don't fully understand), we add defensive detection in the orchestrator's work loop where state is visible and actionable.

This follows the principle of "defense in depth" - even if feature.ts is working correctly, having this safety check prevents UI hangs. The logging added will help identify if this is a frequent issue (indicating feature.ts bug) or rare (indicating environment-specific race condition).

**Technical Approach**:

1. **Phantom Completion Detection**: After the existing stuck task check (~line 1206 in orchestrator.ts), add check for `tasks_completed >= task_count && status === "in_progress"`

2. **Deadlock Extension**: Modify `detectAndHandleDeadlock()` to also check for in_progress features with all tasks completed that have no active sandbox

3. **Comprehensive Logging**: Log phantom completion with timestamp, feature ID, task counts, and sandbox state for telemetry

**Architecture Changes**:

- No architectural changes required
- Work loop already has similar patterns for stuck task detection and PTY fallback
- Deadlock detection function can be extended with minimal changes
- New code follows existing style and structure

**Migration Strategy**:

Not needed - this is a pure fix with no data or API changes.

## Implementation Plan

### Affected Files

- `apps/web/.ai/alpha/scripts/lib/orchestrator.ts` - Add phantom completion detection in work loop (~line 1206) + extend deadlock detection (function ~line 422)
- `apps/web/.ai/alpha/scripts/lib/work-queue.ts` - Add helper function to detect phantom-completed features (optional)

### New Files

No new files needed. All changes are in existing orchestrator logic.

### Step-by-Step Tasks

#### Step 1: Add Phantom Completion Detection in Work Loop

**Describe what this accomplishes**: Detects features where all tasks are completed but status is still "in_progress" and transitions them to "completed", allowing dependent features to proceed.

- Read orchestrator.ts:1177-1206 (stuck task detection section)
- Understand the existing patterns for feature state transitions
- Add new detection block after stuck task detection
- Include logging with feature ID, task count, sandbox state
- Update manifest and initiative status (copy pattern from existing code)

**Why this step first**: This is the core fix. Subsequent steps extend it.

#### Step 2: Add Phantom Completion Helper to Work Queue

**Describe what this accomplishes**: Centralizes the logic for detecting phantom-completed features so it can be reused in both the work loop and deadlock detection.

- Add function `getPhantomCompletedFeatures()` to work-queue.ts
- Takes manifest and instances as parameters
- Returns array of features where tasks are done but status is wrong
- Use clear, descriptive name so intent is obvious

#### Step 3: Extend Deadlock Detection

**Describe what this accomplishes**: Makes deadlock detection handle in_progress features with completed tasks, treating them like failed features that need recovery action.

- Read `detectAndHandleDeadlock()` function (~line 422-541)
- Understand how it checks for failed features and takes action
- Add check for phantom-completed features using helper from Step 2
- Treat phantom completions as a deadlock condition
- Log when phantom completion triggers deadlock recovery

**Why after Step 1 & 2**: Deadlock detection should use the same logic as the work loop detection, so we centralize it in Step 2 first.

#### Step 4: Add Comprehensive Logging and Telemetry

**Describe what this accomplishes**: Provides visibility into phantom completion frequency, helping identify if this is a systematic issue in feature.ts or rare race condition.

- Add telemetry counters for phantom completions detected
- Log detailed info: feature ID, task count, sandbox state, timestamp
- Log when deadlock detection recovers via phantom completion
- Include diagnostic data for troubleshooting

#### Step 5: Add Tests

**Describe what this accomplishes**: Ensures phantom completion detection works correctly and prevents regressions.

- Create unit test for phantom completion detection logic
- Test detection with various task counts and statuses
- Test that initiative status updates correctly
- Test that dependent features are unblocked
- Test deadlock detection recognizes phantom completions

#### Step 6: Validation

**Describe what this accomplishes**: Ensures the fix works end-to-end and doesn't break existing functionality.

- Run all validation commands
- Verify zero regressions in work loop
- Test with spec S1692 (the failing case) to confirm no hang
- Verify UI shows correct progress
- Check logs for telemetry data

## Testing Strategy

### Unit Tests

Add tests for phantom completion detection:

- ✅ Detect feature with `tasks_completed === task_count` and `status === "in_progress"`
- ✅ Detect feature with `tasks_completed > task_count` (shouldn't happen but handle gracefully)
- ✅ Don't detect features where `tasks_completed < task_count`
- ✅ Don't detect features with `status === "completed"`
- ✅ Update feature status to "completed"
- ✅ Update initiative status based on feature transitions
- ✅ Save manifest after state change
- ✅ Log phantom completion with all diagnostic data

Test deadlock detection extension:
- ✅ Recognize phantom-completed features as deadlock condition
- ✅ Attempt recovery (mark as completed, unblock dependents)
- ✅ Log deadlock recovery action

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator.spec.ts` - Work loop phantom completion detection
- `.ai/alpha/scripts/__tests__/work-queue.spec.ts` - Phantom completion helper function

### Integration Tests

Test the full flow:
- ✅ Create feature with 4 tasks
- ✅ Mark all tasks as completed
- ✅ Simulate manifest not updating to "completed" status
- ✅ Run orchestrator work loop
- ✅ Verify phantom completion is detected
- ✅ Verify dependent features become available
- ✅ Verify deadlock doesn't occur

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-integration.spec.ts`

### Manual Testing Checklist

Execute these tests before considering the fix complete:

- [ ] Reproduce original bug with spec S1692 (feature S1692.I1.F3 stuck)
- [ ] Apply fix and run orchestrator on S1692
- [ ] Verify S1692.I1.F3 transitions from `in_progress` to `completed`
- [ ] Verify S1692.I1 shows all 4/4 features completed
- [ ] Verify dependent features (S1692.I2.F1, etc.) can now be assigned
- [ ] Verify UI doesn't hang
- [ ] Check logs for phantom completion telemetry data
- [ ] Run orchestrator on different spec (no phantom completion case) - verify no false positives
- [ ] Verify manifest integrity throughout execution
- [ ] Check that initiative completion cascades correctly

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Unintended Status Transitions**: Phantom completion detection could incorrectly mark features as complete when they shouldn't be
   - **Likelihood**: Low - Check is explicit: `tasks_completed >= task_count && status === "in_progress"`
   - **Impact**: High - Could report incorrect completion
   - **Mitigation**: Comprehensive logging of all state transitions; log feature ID, task count, sandbox state; validate assumptions about tasks_completed accuracy

2. **Race Condition with Actual Execution**: Feature might still be running when phantom completion is detected
   - **Likelihood**: Low - Only triggers when `sandboxInstance.status !== "busy"`
   - **Impact**: Medium - Could incorrectly complete feature that's still working
   - **Mitigation**: Check sandbox status is not busy; add timing guard to ensure feature assignment is old

3. **Manifest Corruption**: Changing feature status without proper manifest save could leave system inconsistent
   - **Likelihood**: Low - Using existing `saveManifest()` function that's proven reliable
   - **Impact**: High - Could corrupt orchestrator state
   - **Mitigation**: Use same patterns as existing code; always save manifest immediately; verify manifest loads correctly after

4. **Deadlock Detection False Positive**: Extending deadlock detection to include phantom completions could trigger on non-deadlock situations
   - **Likelihood**: Medium - New condition could overlap with other blocking reasons
   - **Impact**: Low - Would retry already-complete features, which is harmless
   - **Mitigation**: Check that instance actually has no currentFeature before treating as deadlock

**Rollback Plan**:

If this fix causes issues:

1. Remove the phantom completion detection block from work loop (lines TBD)
2. Remove phantom completion check from deadlock detection (lines TBD)
3. Revert to previous behavior where phantom completions cause indefinite hangs
4. Investigate root cause more thoroughly before re-attempting fix

Note: This is a safe rollback - removing a safety check just restores old behavior.

**Monitoring** (if deployed):

- Monitor orchestrator logs for frequency of phantom completion detection
- Alert if phantom completion detected more than once per run (indicates systematic issue)
- Track ratio of phantom completions to total features (baseline should be near 0%)
- Log when deadlock detection recovers via phantom completion

## Performance Impact

**Expected Impact**: Minimal

The phantom completion check adds:
- One additional condition check per feature in work loop (negligible)
- One additional function call per feature if phantom completed (rare case)
- Manifest save operation (already happens multiple times per feature)

**Performance Testing**:

- Verify work loop iteration time unchanged for normal cases
- Verify phantom completion handling doesn't add measurable latency
- Confirm orchestrator progress rate unaffected

## Security Considerations

**Security Impact**: None

This is pure state management fix with no security implications:
- No new external communication
- No new data sources
- No authentication/authorization changes
- No input validation changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator on spec S1692
node .ai/alpha/scripts/spec-orchestrator.ts --spec S1692 --ui

# Expected: UI hangs at ~18 minutes with S1692.I1.F3 stuck at 4/4 tasks
# Expected: sbx-a-progress.json shows "idle" waiting for dependencies
# Expected: No recovery - UI stays hung until timeout
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if added)
pnpm test:unit .ai/alpha/scripts/__tests__/orchestrator.spec.ts

# Integration tests (if added)
pnpm test:integration .ai/alpha/scripts/__tests__/orchestrator-integration.spec.ts

# Manual verification
node .ai/alpha/scripts/spec-orchestrator.ts --spec S1692 --ui

# Expected: S1692.I1.F3 detected as phantom completed
# Expected: Feature status transitions to "completed"
# Expected: S1692.I1 shows 4/4 features completed
# Expected: Dependent features proceed to execution
# Expected: UI doesn't hang
# Expected: Logs show phantom completion telemetry
```

### Regression Prevention

```bash
# Run orchestrator on different specs to verify no false positives
node .ai/alpha/scripts/spec-orchestrator.ts --spec S1692 --skip-to-completion

# Verify no spurious phantom completion logs
grep "PHANTOM_COMPLETION" .ai/alpha/logs/*/sbx-*.log | wc -l
# Expected: Should be 0 if no bugs (or low count matching fixed issues)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - Uses existing manifest, logging, and state management functions.

### Existing Dependencies Used

- `saveManifest()` - Existing function for persisting state
- `createLogger()` - Existing conditional logging
- Manifest types from existing types.ts
- Initiative/feature state objects

## Database Changes

**No database changes required** - This is pure orchestrator state management, not database schema.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- None - This is a pure code fix with no database migrations or configuration changes
- Can be deployed as normal code update
- Safe to deploy to production (defensive safety check)

**Feature flags needed**: No

**Backwards compatibility**: Maintained - Fix only adds new detection, doesn't change existing interfaces

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] Bug no longer reproduces on spec S1692
- [ ] All tests pass (unit, integration, manual)
- [ ] Zero regressions detected in orchestrator behavior
- [ ] Phantom completion telemetry data is captured in logs
- [ ] Deadlock detection correctly handles phantom completions
- [ ] Code review approved (if applicable)
- [ ] Manifest integrity verified throughout execution
- [ ] UI displays correct progress without hanging
- [ ] Performance metrics unchanged

## Notes

### Key Design Decisions

1. **Defensive vs. Preventive**: Chose defensive detection (catch symptom) rather than preventive fix (fix root cause) because:
   - Root cause (why manifest save fails/delays) is unknown
   - Defensive fix has lower risk and is immediately effective
   - Telemetry from defensive fix will guide root cause investigation

2. **Deadlock Extension**: Extended deadlock detection rather than creating new independent check because:
   - Deadlock detection already handles similar "no progress possible" situations
   - Reuses existing recovery mechanisms
   - Philosophically consistent with deadlock recovery approach

3. **Phantom Completion Naming**: Used "phantom" because:
   - Clearly indicates features are "done but not marked done"
   - Distinguishes from stuck features (still working)
   - Matches the diagnosis terminology

### Telemetry Strategy

Phantom completion telemetry will answer:
- **Frequency**: How often does this occur per run?
- **Pattern**: Does it happen for specific feature types?
- **Reproducibility**: Can we trigger it intentionally to understand root cause?

If telemetry shows:
- Happens rarely (1-2 times per run) → Environment-specific race condition
- Happens frequently (5+ times per run) → Systematic issue in feature.ts needs fixing
- Happens for specific feature types → Feature type-specific issue

### Future Investigation

Once this fix is deployed and telemetry collected, the next step should be:

1. Analyze phantom completion logs for patterns
2. Check feature.ts manifest save error handling
3. Review PTY timeout recovery logic
4. Check for race conditions between PTY completion and manifest update
5. Consider adding retry logic to manifest saves

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1780*
