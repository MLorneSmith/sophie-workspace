# Bug Fix: Alpha Orchestrator UI Shows Stale Progress After Session Recovery

**Related Diagnosis**: #1495
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Progress polling skips stale heartbeat data but fails to update UI progress file, leaving it in permanent stale state
- **Fix Approach**: Write recovery status when skipping stale data, and add final writeUIProgress() call on feature completion
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When a Claude Code session terminates mid-feature and the orchestrator restarts the feature, the UI progress file is never updated with the new session's progress. The progress polling detects stale heartbeat data from the previous session and skips the `writeUIProgress()` call entirely using a `continue` statement, leaving the UI displaying outdated status (stale heartbeat, incomplete task count) even when the feature completes successfully.

For full details, see diagnosis issue #1495.

### Solution Approaches Considered

#### Option 1: Write Recovery Status When Skipping Stale Data ⭐ RECOMMENDED

**Description**: When the progress polling detects stale heartbeat data (from a previous session), write a "recovering" or reset status to the UI progress file instead of silently skipping with `continue`. Additionally, add a final `writeUIProgress()` call in `feature.ts` after successful completion to ensure the UI reflects the final state.

**Pros**:
- Minimal code changes (add 2-3 lines in progress.ts, add 4-5 lines in feature.ts)
- Immediately communicates session recovery to UI
- Ensures final status is always written on completion
- Clear intent: UI gets updated on both recovery and completion
- Low risk of side effects

**Cons**:
- Requires understanding the `writeUIProgress()` API
- Two files need modification

**Risk Assessment**: low - Changes are isolated to error paths and completion handlers

**Complexity**: simple - Just add status writes in existing flow

#### Option 2: Conditional Check Before Continue

**Description**: Only skip with `continue` if we're certain the data is truly stale, otherwise write a neutral status first.

**Why Not Chosen**: Same end result as Option 1 but adds more conditional logic. Option 1 is cleaner.

#### Option 3: Disable Stale Data Skipping Entirely

**Description**: Remove the stale data check and always process progress data.

**Why Not Chosen**: Would lose protection against old data contaminating new sessions. The stale check is correct; it just needs to update the UI.

### Selected Solution: Write Recovery Status When Skipping Stale Data

**Justification**: This approach directly fixes the root cause with minimal changes. The skip logic is correct—we don't want to process stale data—but we need to communicate the session recovery to the UI. Adding `writeUIProgress()` when skipping stale data gives the UI accurate information about the recovery state.

**Technical Approach**:

1. **In progress.ts** (lines 332-338): When skipping stale progress data, write a reset/recovering status to the UI progress file before the `continue` statement
2. **In feature.ts**: After feature completion and manifest update, add a final `writeUIProgress()` call to ensure UI reflects completed state
3. Both changes ensure UI gets updated at critical transition points (session recovery and feature completion)

**Architecture Changes**: None - this fits within the existing progress polling and completion flow.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/progress.ts` - Update progress polling to write recovery status when skipping stale data
- `.ai/alpha/scripts/lib/feature.ts` - Add final writeUIProgress() call after feature completion

### New Files

No new files required.

### Step-by-Step Tasks

#### Step 1: Update progress polling to write recovery status

<describe what this step accomplishes>

- Read `.ai/alpha/scripts/lib/progress.ts` to understand the context around lines 332-338
- Understand what `writeUIProgress()` expects as parameters
- Modify the stale heartbeat check to call `writeUIProgress()` before `continue`
- Write a "recovering" or reset status that clears task state and updates heartbeat

**Why this step first**: This fixes the session recovery detection - if a session recovers, the UI should show recovery status immediately rather than stale data.

#### Step 2: Add final writeUIProgress() call on feature completion

<describe what this step accomplishes>

- Read `.ai/alpha/scripts/lib/feature.ts` to find the feature completion logic
- Locate where the manifest is updated after successful completion
- Add `writeUIProgress()` call after the manifest update
- Ensure it writes a "completed" status with final task counts

**Why this step second**: Ensures that when features complete, the final status is always written to the UI, preventing stale states after completion.

#### Step 3: Add tests for session recovery scenario

<describe the testing strategy>

- Create or update test for progress polling when stale data is encountered
- Verify `writeUIProgress()` is called on session recovery
- Verify feature completion always writes final status to UI

**Test files**:
- `.ai/alpha/scripts/__tests__/progress.test.ts` - Test stale data recovery
- `.ai/alpha/scripts/__tests__/feature.test.ts` - Test completion writeUIProgress call

#### Step 4: Validation

- Run all validation commands (see Validation Commands section)
- Manually test session recovery scenario
- Verify no regressions in normal progress polling

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Progress polling with stale heartbeat data - should write recovery status
- ✅ Progress polling with current heartbeat data - should process normally
- ✅ Feature completion - should write final status to UI
- ✅ Edge case: Missing UI progress file - should handle gracefully

**Test files**:
- `.ai/alpha/scripts/__tests__/progress.test.ts` - Progress polling tests
- `.ai/alpha/scripts/__tests__/feature.test.ts` - Feature completion tests

### Integration Tests

<if needed, describe integration test scenarios>

Test the complete session recovery flow:
- Start a feature
- Simulate session termination
- Restart the feature (progress polling detects stale data)
- Verify UI shows recovery status
- Feature completes
- Verify UI shows completed status

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start Alpha Orchestrator with a spec
- [ ] Let a feature begin implementation
- [ ] Manually terminate the session (kill Claude Code)
- [ ] Observe that orchestrator restarts the feature
- [ ] Check UI dashboard - should show recovery status (not stale)
- [ ] Let feature complete
- [ ] Verify UI shows completed status with correct task counts
- [ ] Check manifest and UI progress file - both should be synchronized

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect recovery status format**: If the recovery status object format doesn't match what the UI expects
   - **Likelihood**: low
   - **Impact**: medium (UI might display wrong status)
   - **Mitigation**: Test with actual UI, check existing `writeUIProgress()` calls for format precedent

2. **Missing parameter in writeUIProgress() call**: If we don't pass all required parameters
   - **Likelihood**: low
   - **Impact**: low (would be caught by TypeScript)
   - **Mitigation**: Use TypeScript strict mode, check function signature

3. **Race condition on completion**: If feature completes while progress polling is running
   - **Likelihood**: low
   - **Impact**: low (both would write completion status)
   - **Mitigation**: Both completion and polling write same final state, idempotent operation

**Rollback Plan**:

If this fix causes issues in production:
1. Revert changes to `.ai/alpha/scripts/lib/progress.ts`
2. Revert changes to `.ai/alpha/scripts/lib/feature.ts`
3. Re-run orchestrator - will return to previous behavior

**Monitoring** (if needed):
- Monitor orchestrator logs for session recovery events
- Watch for new error messages from `writeUIProgress()` calls
- Verify UI progress files are being updated correctly

## Performance Impact

**Expected Impact**: none

This adds two `writeUIProgress()` calls (on session recovery and feature completion), both in non-critical paths that already perform I/O operations.

## Security Considerations

**Security Impact**: none

This fix updates existing progress tracking - no new security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Manual test:
# 1. Start orchestrator: tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id>
# 2. Let feature start, then manually terminate session
# 3. Feature restarts
# 4. Check UI progress file:
cat .ai/alpha/progress/sbx-a-progress.json

# Expected: stale heartbeat from previous session, not updated
```

**Expected Result**: UI progress file shows stale heartbeat and incomplete task status even though feature is running.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Manual test (same as above):
# 1. Start orchestrator: tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id>
# 2. Let feature start, then manually terminate session
# 3. Feature restarts
# 4. Check UI progress file:
cat .ai/alpha/progress/sbx-a-progress.json

# Expected: updated heartbeat from new session, recovery status
# 5. Wait for feature completion
# 6. Check UI progress file again:
cat .ai/alpha/progress/sbx-a-progress.json

# Expected: completed status with correct task counts
```

**Expected Result**: All commands succeed, bug is resolved, UI shows recovery and completion status accurately.

### Regression Prevention

```bash
# Run tests to ensure no regressions
pnpm test .ai/alpha/scripts/__tests__/progress.test.ts
pnpm test .ai/alpha/scripts/__tests__/feature.test.ts

# Run full orchestrator test if available
pnpm test orchestrator
```

## Dependencies

### New Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special deployment steps needed
- Changes are to orchestrator scripts only

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] Progress polling writes recovery status when skipping stale data
- [ ] Feature completion writes final status to UI progress file
- [ ] All validation commands pass
- [ ] Manual session recovery test succeeds (UI shows recovery then completion)
- [ ] No regressions in normal progress polling
- [ ] Code review approved (if applicable)

## Notes

**Files to examine**:
- `.ai/alpha/scripts/lib/progress.ts` - Session recovery detection and writeUIProgress() API
- `.ai/alpha/scripts/lib/feature.ts` - Feature completion logic
- Look for existing `writeUIProgress()` calls to understand the expected status object format

**Similar fixes**:
- Issue #1490 had similar stale progress display issues with a different root cause
- Review that fix to understand the writeUIProgress() patterns used in this codebase

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1495*
